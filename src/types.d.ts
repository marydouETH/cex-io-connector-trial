/**
 * Assuming the skl-shared library has these types and classes
 */

export type ConnectorGroup = {
  name: string; // Exchange pair base asset
};

export interface ConnectorConfiguration {
  connectorType: string; // Exchange connector type
  exchange: string; // Exchange name. e.g. Mexc, CexIo
  quoteAsset: string; // Exchange pair quote asset
}
export interface Credential {
  key: string;
  secret: string;
}

export type Serializable = string | number | object;

export type SklEvent =
  | 'Trade'
  | 'TopOfBook'
  | 'Ticker'
  | 'Version'
  | 'Unsubscribe'
  | 'OrderStatusUpdate'
  | 'AllBalances';
export type SklSupportedConnectors = 'MEXC' | 'Coinbase' | 'Deribit';

export interface BasicSklNotificationProps {
  event: SklEvent;
  connectorType: SklSupportedConnectors;
  symbol: string;
  timestamp: number;
}
export type SklSide = 'Buy' | 'Sell';

export interface SklTrade extends BasicSklNotificationProps {
  price: number;
  size: number;
  side: SklSide;
}

export interface SklTicker extends BasicSklNotificationProps {
  lastPrice: number;
}

export interface SklTopOfBook extends BasicSklNotificationProps {
  askPrice: number;
  askSize: number;
  bidPrice: number;
  bidSize: number;
}

export interface SklCurrentActiveOrder extends BasicSklNotificationProps {
  orderId: string;
  sklOrderId: string;
  state: string;
  side: string;
  price: number;
  size: number;
  notional: number;
  filled_price: number;
  filled_size: number;
  timestamp: number;
}
