import axios, { AxiosStatic } from 'axios';
import { BinaryToTextEncoding, createHmac } from 'crypto';
import {
  BalanceRequest,
  BalanceResponse,
  BatchOrdersRequest,
  CancelOrdersRequest,
  ConnectorConfiguration,
  ConnectorGroup,
  Credential,
  OpenOrdersRequest,
  OrderState,
  OrderStatusUpdate,
  PrivateExchangeConnector,
  PublicExchangeConnector,
  Serializable,
  SklEvent,
  Side,
} from 'skl-shared';
import { v4 as uuidv4 } from 'uuid';
import WebSocket from 'ws';

import { getCexIoSymbol, getSklSymbol, Logger } from '../../utils';
import { WebsocketFeedError } from '../../errors';

const logger = Logger.getInstance('cex-spot-private-connector');

export class CexIoPrivateConnector implements PrivateExchangeConnector {
  // Exchange connector Id
  public connectorId: string;

  // Exchange symbols
  private exchangeSymbol: string;
  private sklSymbol: string;

  // CEX.IO Private Endpoint URL
  public privateWSEndpoint = 'wss://trade.cex.io/api/spot/ws';
  public privateRestEndpoint = 'https://trade.cex.io/api/spot/rest/';

  // WS
  public privateWsFeed?: WebSocket;
  private pingInterval: any;
  private wsAuthenciated: boolean;

  // REST
  private axios: AxiosStatic;

  // CEX.IO trading
  private oidAppendix?: number;
  private mainSubAccountId = 'mainSubAccount';

  // Initialize
  constructor(
    private group: ConnectorGroup,
    private config: ConnectorConfiguration,
    private credential: Credential
  ) {
    this.connectorId = uuidv4();
    this.exchangeSymbol = this.getExchangeSymbol(group, config);
    this.sklSymbol = this.getSklSymbol(group, config);

    this.axios = axios;
    this.wsAuthenciated = false;
  }

  // Derived from super
  private getExchangeSymbol(
    group: ConnectorGroup,
    config: ConnectorConfiguration
  ): string {
    return getCexIoSymbol(group, config);
  }

  // Derived from super
  private getSklSymbol(
    group: ConnectorGroup,
    config: ConnectorConfiguration
  ): string {
    return getSklSymbol(group, config);
  }

  public async connect(
    onMessage: (messages: Serializable[]) => void,
    socket?: WebSocket
  ): Promise<void> {
    logger.info(
      `Attempting to connect to ${this.config.exchange} private websocket feed`
    );

    const self = this;

    try {
      return new Promise((resolve, reject) => {
        self.privateWsFeed = socket || new WebSocket(self.privateWSEndpoint);

        self.privateWsFeed.on('open', () => {
          logger.info('WebSocket connection opened');
          self.startPingInterval();
          self.initializeMainSubAccount();

          self.authenticateWebsocket();

          resolve();
        });

        self.privateWsFeed.on('message', (data: string) => {
          self.handleMessage(data, onMessage);
        });

        self.privateWsFeed.on('error', (error: Error) => {
          logger.error('WebSocket error:', error);
        });

        self.privateWsFeed.on('close', () => {
          logger.info('WebSocket connection closed');
        });
      });
    } catch (err) {
      logger.error(`Error connecting to HTX: ${err}`);
    }
  }

  private authenticateWebsocket(): void {
    if (!this.privateWsFeed) {
      throw new WebsocketFeedError();
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = this.generateSignature(timestamp);
    const authMessage = {
      e: 'auth',
      auth: {
        key: this.credential.key,
        signature,
        timestamp,
      },
    };
    this.privateWsFeed.send(JSON.stringify(authMessage));
  }

  // Register subscription to private channels
  private subscribeToChannels(channelName: string): void {
    if (!this.privateWsFeed) {
      throw new WebsocketFeedError();
    }

    // Subscribe private channels
    if (!this.oidAppendix) this.oidAppendix = Date.now();

    const message = {
      e: channelName,
      oid: `${this.oidAppendix}_${channelName}`,
      data: {
        pair: this.exchangeSymbol,
      },
    };

    this.privateWsFeed.send(JSON.stringify(message));
  }

  private unSubscribeToChannels(channelName: string): void {
    if (!this.privateWsFeed) {
      throw new WebsocketFeedError();
    }

    // Ignore if oid appendix is null
    if (!this.oidAppendix) return;

    // Unsubscribe from channels
    const message = {
      e: channelName,
      oid: `${this.oidAppendix}_${channelName}`,
      data: {
        pair: this.exchangeSymbol,
      },
    };

    this.privateWsFeed.send(JSON.stringify(message));
  }

  // Start interval to send ping periodically
  private startPingInterval(): void {
    const self = this;

    // Ping interval every 5s to keep connection alive
    self.pingInterval = setInterval(() => {
      logger.info('Pinging Cex');

      try {
        if (!self.privateWsFeed) {
          throw new WebsocketFeedError();
        }

        // Send "ping" msg
        self.privateWsFeed.send(
          JSON.stringify({
            e: 'ping',
          })
        );

        // TODO: consider to establish resubscribing private channels
      } catch (err: any) {
        logger.info(`Error sending ping: ${err.toString()}`);
      }
    }, 1000 * 5);
  }

  // Clean up ping interval
  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private handleMessage(
    data: string,
    onMessage: (messages: Serializable[]) => void
  ): void {
    const message = JSON.parse(data);
    logger.info('Received message:', message);

    // Connected
    if (message.e === 'connected') {
      logger.info('WebSocket Connected');
      return;
    }

    // Authenticated
    if (message.e === 'auth') {
      if (message.ok === 'ok') {
        logger.info('WebSocket Authenticated');
        this.wsAuthenciated = true;

        // Establish subscribings
        this.subscribeToChannels('trade_subscribe');
        this.subscribeToChannels('order_book_subscribe');
      } else {
        logger.info('WebSocket Authentication Failed');
        this.wsAuthenciated = false;
      }
      return;
    }

    // Handle Action Types
    const eventType = this.getEventType(message);

    if (eventType === 'OrderStatusUpdate') {
      const orderStatusUpdate = this.createOrderStatusUpdate(
        eventType,
        message,
        this.group
      );
      onMessage([orderStatusUpdate]);
    } else {
      // Handle other events or log unrecognized messages
    }
  }

  private handleClosed(
    code: number,
    reason: string,
    onMessage: (m: Serializable[]) => void
  ): void {
    if (code === 1000) {
      logger.info(`WebSocket closed normally`);
      return;
    }
    logger.error(`WebSocket closed with code ${code} and reason ${reason}`);
    setTimeout(() => {
      this.connect(onMessage);
    }, 5000);
  }

  public async stop(): Promise<void> {
    if (!this.privateWsFeed) {
      throw new WebsocketFeedError();
    }

    this.unSubscribeToChannels('trade_unsubscribe');
    this.unSubscribeToChannels('order_book_unsubscribe');

    // TODO: Move this to cancel all orders
    // Cancel all open orders
    const oid = Date.now();
    const message = {
      e: 'do_cancel_all_orders',
      oid: oid + 'do_cancel_all_orders',
      data: {},
    };
    this.privateWsFeed.send(JSON.stringify(message));

    // Stop ping interval
    this.stopPingInterval();
  }

  private getEventType(message: any): SklEvent | null {
    const event = message;

    if (event !== undefined && event.e !== undefined) {
      if (message.e == 'get_my_orders' && message.data.status === 'FILLED') {
        return 'OrderStatusUpdate';
      }
    }

    return null;
  }

  private createSklEvent(
    event: SklEvent,
    message: any,
    group: ConnectorGroup
  ): Serializable[] {
    if (event === 'OrderStatusUpdate') {
      return [this.createOrderStatusUpdate(event, message, group)];
    } else {
      return [];
    }
  }

  private createOrderStatusUpdate(
    action: SklEvent,
    order: CexIoOrderProgress,
    group: ConnectorGroup
  ): OrderStatusUpdate {
    const state: OrderState = CexIoWSOrderUpdateStateMap[order.d.s];

    const side: Side = CexIoSideMap[order.d.S];

    return {
      symbol: this.sklSymbol,
      connectorType: 'CexIo',
      event: action,
      state,
      orderId: order.d.i,
      sklOrderId: order.d.c,
      side,
      price: parseFloat(order.d.p),
      size: order.d.v,
      notional: parseFloat(order.d.p) * parseFloat(order.d.v),
      filled_price: parseFloat(order.d.ap),
      filled_size: parseFloat(order.d.a),
      timestamp: parseInt(order.t),
    };
  }

  /**
   *  create main sub account if not initialized yet
   */
  private async initializeMainSubAccount(): Promise<boolean> {
    const self = this;

    const action = 'do_create_account';

    const res = await self.postRequest(action, {
      accountId: self.mainSubAccountId,
      currency: self.group.name,
    });

    return !!res?.ok;
  }

  /**
   *
   * @param accountId sub account id string
   * @returns sub account status or undefined if not exist
   */
  public async getSubAccountStatus(
    accountId?: string
  ): Promise<CexSubAccountStatus | undefined> {
    const self = this;
    if (!accountId) accountId = self.mainSubAccountId;

    const action = 'get_my_account_status_v3';

    const subAccountsData = await self.postRequest(action, {
      accountIds: [accountId],
    });

    if (!subAccountsData) return undefined;

    for (let [accId, data] of Object.entries(
      (subAccountsData as CexAccountStatusResponse).data.balancesPerAccounts
    )) {
      if (accId === accountId) return data;
    }

    return undefined;
  }

  public async getCurrentActiveOrders(
    request: OpenOrdersRequest
  ): Promise<OrderStatusUpdate[]> {
    const action = 'get_my_orders';

    const orders = await this.postRequest('/openOrders', {
      symbol: this.exchangeSymbol,
    });

    logger.info(
      `RPC Response: OpenOrdersResponse -> ${JSON.stringify(orders)}`
    );

    if (orders !== undefined) {
      return orders.map((o) => {
        return <OrderStatusUpdate>{
          event: 'OrderStatusUpdate',
          connectorType: 'Mexc',
          symbol: this.sklSymbol,
          orderId: o.orderId,
          sklOrderId: o.clientOrderId,
          state: MexcOpenOrdersStateMap[o.status],
          side: MexcStringSideMap[o.side],
          price: parseFloat(o.price),
          size: parseFloat(o.origQty),
          notional: parseFloat(o.price) * parseFloat(o.origQty),
          filled_price: parseFloat(o.price),
          filled_size: parseFloat(o.executedQty),
          timestamp: o.time,
        };
      });
    }

    return [];
  }

  public async getBalancePercentage(
    request: BalanceRequest
  ): Promise<BalanceResponse> {
    const self = this;
    const params = {};
    const action = 'get_my_wallet_balance';
    const walletBalancesRes: CexWalletBalanceResponse = await self.postRequest(
      action,
      params
    );

    // Find quote and base balances
    const base = walletBalancesRes[self.group.name]?.balance ?? '0';
    const quote = walletBalancesRes[self.config.quoteAsset]?.balance ?? '0';

    const baseValue = parseFloat(base) * request.lastPrice;
    const usdtValue = parseFloat(quote);

    const whole = baseValue + usdtValue;
    const pairPercentage = !whole ? 0 : (baseValue / whole) * 100;

    return {
      event: 'BalanceResponse',
      symbol: self.sklSymbol,
      baseBalance: baseValue,
      quoteBalance: usdtValue,
      inventory: pairPercentage,
      timestamp: Date.now(),
    };
  }

  public async placeOrders(request: BatchOrdersRequest): Promise<any> {
    const self = this;

    const action = 'do_my_new_order';

    // USDC edge case: uses USDC instead of USD (for websocket)
    const quoteSymbol =
      self.config.quoteAsset === 'USD' ? 'USDC' : self.config.quoteAsset;
    const fixedPair = `${self.group.name}-${quoteSymbol}`;

    const orders = request.orders.map((o) => {
      const side = invertedSideMap[o.side];
      const amountDecimal = Math.pow(10, self.amountPrecision);
      const priceDecimal = Math.pow(10, self.pricePrecision);
      const amount = Math.floor(o.size * amountDecimal) / amountDecimal;
      const price = Math.floor(o.price * priceDecimal) / priceDecimal;
      const timestamp = Date.now(); // Current timestamp in milliseconds
      const randomNumber = Math.floor(Math.random() * 1000000); // Random 6-digit number
      const orderId = `skl:${timestamp}_${randomNumber}`;
      const data: CexPlaceOrderRequest = {
        client_order_id: orderId,
        product_id: fixedPair,
        side,
        order_configuration: {
          limit_limit_gtc: {
            post_only: true,
            base_size: amount.toString(),
            limit_price: price.toString(),
          },
        },
      };
      return data;
    });
    const responses: Promise<CexPlaceOrderResponse>[] = orders.map(
      async (order) => {
        const res: Promise<CexPlaceOrderResponse> = this.postRequest(
          '/orders',
          order
        );
        return res;
      }
    );
    return Promise.all(responses);
  }

  public async deleteAllOrders(request: CancelOrdersRequest): Promise<void> {
    const self = this;
    const payload: OpenOrdersRequest = {
      symbol: self.sklSymbol,
      event: 'OpenOrdersRequest',
      timestamp: Date.now(),
      connectorType: 'Coinbase',
    };

    const orders = await self.getCurrentActiveOrders(payload);
    const orderIds = orders.map((order) => order.orderId);
    const data = {
      order_ids: orderIds,
    };
    await self.postRequest('/orders/batch_cancel', data);
  }

  public async deleteOrder(request: CancelOrdersRequest): Promise<void> {
    const self = this;
    const payload: OpenOrdersRequest = {
      symbol: self.sklSymbol,
      event: 'OpenOrdersRequest',
      timestamp: Date.now(),
      connectorType: 'Coinbase',
    };

    const orders = await self.getCurrentActiveOrders(payload);
    const orderIds = orders.map((order) => order.orderId);
    const data = {
      order_ids: orderIds,
    };
    await self.postRequest('/orders/batch_cancel', data);
  }

  public postRequest = async (
    action: string,
    paramsData: any
  ): Promise<any | null> => {
    const self = this;
    const timestamp = Math.floor(Date.now() / 1000);
    const url = self.privateRestEndpoint + action;

    const signature = self.generateSignature(
      timestamp,
      action,
      paramsData,
      'base64'
    );

    const headers = {
      'X-AGGR-KEY': self.credential.key,
      'X-AGGR-TIMESTAMP': timestamp,
      'X-AGGR-SIGNATURE': signature,
      'Content-Type': 'application/json',
    };

    try {
      return (await self.axios.post(url, paramsData, { headers })).data;
    } catch (e) {
      logger.error(`POST Error: ${e}`);
      return null;
    }
  };

  private generateSignature(
    timestamp: number,
    action?: string,
    params?: any,
    encoding: BinaryToTextEncoding = 'hex'
  ): string {
    const payload =
      action ?? '' + timestamp + this.credential.key + params
        ? JSON.stringify(params)
        : '';
    let hmac = createHmac('sha256', this.credential.secret);
    hmac.update(payload);
    const signature = hmac.digest(encoding);
    return signature;
  }
}
