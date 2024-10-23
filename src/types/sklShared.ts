/**
 * Definitions which expecting to be in the skl-shared library
 */

export type ConnectorGroup = {
  name: string; // Exchange pair base asset
};

export interface ConnectorConfiguration {
  connectorType: string; // Exchange connector type
  quoteAsset: string; // Exchange pair quote asset
}
export interface Credential {
  key: string;
  secret: string;
}

export type Serializable =
  | Trade
  | TopOfBook
  | Ticker
  | OrderStatusUpdate
  | BalanceResponse;

export type SklEvent =
  | 'Trade'
  | 'TopOfBook'
  | 'Ticker'
  | 'Version'
  | 'Unsubscribe'
  | 'OrderStatusUpdate'
  | 'AllBalances';

export type SklSupportedConnectors = 'MEXC' | 'Coinbase' | 'CexIo';

export interface BasicSklNotificationProps {
  event: SklEvent;
  connectorType: SklSupportedConnectors;
  symbol: string;
  timestamp: number;
}
export type Side = 'Buy' | 'Sell';

export interface Trade extends BasicSklNotificationProps {
  price: number;
  size: number;
  side: Side;
}

export interface Ticker extends BasicSklNotificationProps {
  lastPrice: number;
}

export interface TopOfBook extends BasicSklNotificationProps {
  askPrice: number;
  askSize: number;
  bidPrice: number;
  bidSize: number;
}

export interface CurrentActiveOrder extends BasicSklNotificationProps {
  orderId: string;
  sklOrderId: string;
  state: string;
  side: Side;
  price: number;
  size: number;
  notional: number;
  filled_price: number;
  filled_size: number;
  timestamp: number;
}

export interface BalanceRequest {
  lastPrice: number;
  // ...
}

export interface BalanceResponse {
  event: SklEvent;
  symbol: string;
  baseBalance: number;
  quoteBalance: number;
  inventory: number;
  timestamp: Date;
}

export interface BatchOrdersRequest {}

export interface CancelOrdersRequest {}

export interface OpenOrdersRequest {}

export class PrivateExchangeConnector {}

export class PublicExchangeConnector {}

export type OrderState = {};

export type OrderStatusUpdate = {};
