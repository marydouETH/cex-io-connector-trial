import { ConnectorConfiguration, ConnectorGroup, Side } from 'skl-shared';

export const getCexIoSymbol = (
  symbolGroup: ConnectorGroup,
  connectorConfig: ConnectorConfiguration
): string => {
  return `${symbolGroup.name}-${connectorConfig.quoteAsset}`;
};

//////

// export const getCexIoOrderType = (
//   sklType: SklOrderType,
//   side: Side
// ): CexIoOrderType => {
//   return CexIoOrderTypeMap[sklType][side];
// };

// export const getDefaultQueryParams = (accessKey: string) => {
//   return {
//     AccessKeyId: accessKey,
//     SignatureMethod: SignatureMethod.Ed25519,
//     SignatureVersion: SIGNATURE_VERSION,
//     Timestamp: getDateTime(),
//   };
// };

// export function getDateTime() {
//   const date = new Date().toISOString();
//   const [fullDate, fullTime] = date.split('T');
//   const time = fullTime.split('.')[0].replace(/:/g, '%3A');
//   return `${fullDate}T${time}`;
// }
// const rt = { ls: 2 };

// export function toAsciiOrderedQueryString(params: Record<string, any>): string {
//   const sortedKeys = Object.keys(params).sort();

//   const queryString = sortedKeys
//     .map((key) => `${key}=${encodeURIComponent(params[key])}`)
//     .join('&');

//   return `${queryString}&`;
// }

// function toCamelCase(key: string): string {
//   return key.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
// }

// export function transformKeysToCamelCase(
//   obj: Record<string, any> | Array<any>
// ): Record<string, any> | Array<any> {
//   if (Array.isArray(obj)) {
//     return obj.map((item) => transformKeysToCamelCase(item));
//   } else if (obj !== null && typeof obj === 'object') {
//     return Object.keys(obj).reduce((result, key) => {
//       const newKey = toCamelCase(key);
//       (result as any)[newKey] = transformKeysToCamelCase(obj[key]);
//       return result;
//     }, {});
//   }
//   return obj;
// }

// function toKebabCase(key: string): string {
//   return key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
// }

// export function transformKeysToKebabCase(
//   obj: Record<string, any> | Array<any>
// ): Record<string, any> | Array<any> {
//   if (Array.isArray(obj)) {
//     return obj.map((item) => transformKeysToKebabCase(item));
//   } else if (obj !== null && typeof obj === 'object') {
//     return Object.keys(obj).reduce((result, key) => {
//       const newKey = toKebabCase(key);
//       result[newKey] = transformKeysToKebabCase(obj[key]);
//       return result;
//     }, {} as Record<string, any>);
//   }
//   return obj;
// }

// export function mapOrderToStatusUpdate(
//   order: OpenOrder,
//   side: Side
// ): OrderStatusUpdate {
//   return {
//     symbol: order.symbol,
//     connectorType: 'CexIo',
//     event: 'OrderStatusUpdate',
//     state: order.state,
//     orderId: order.id,
//     sklOrderId: order.clientOrderId,
//     side: side,
//     price: parseFloat(order.price),
//     size: parseFloat(order.amount),
//     notional: parseFloat(order.price) * parseFloat(order.amount),
//     filled_price: parseFloat(order.price),
//     filled_size: parseFloat(order.filledAmount),
//     timestamp: Date.now(),
//   };
// }

// export function splitIntoBatches<T>(items: T[], batchSize: number): T[][] {
//   const result: T[][] = [];
//   for (let i = 0; i < items.length; i += batchSize) {
//     result.push(items.slice(i, i + batchSize));
//   }
//   return result;
// }

// export const CexIoOrderTypeMap: Record<
//   SklOrderType,
//   Record<Side, CexIoOrderType>
// > = {
//   [SklOrderType.MARKET]: {
//     [Side.BUY]: CexIoOrderType.BUY_MARKET,
//     [Side.SELL]: CexIoOrderType.SELL_MARKET,
//   },
//   [SklOrderType.LIMIT]: {
//     [Side.BUY]: CexIoOrderType.BUY_LIMIT,
//     [Side.SELL]: CexIoOrderType.SELL_LIMIT,
//   },
//   [SklOrderType.LIMIT_MAKER]: {
//     [Side.BUY]: CexIoOrderType.BUY_LIMIT_MAKER,
//     [Side.SELL]: CexIoOrderType.SELL_LIMIT_MAKER,
//   },
//   [SklOrderType.IMMEDIATE_OR_CANCEL]: {
//     [Side.BUY]: CexIoOrderType.BUY_IOC,
//     [Side.SELL]: CexIoOrderType.SELL_IOC,
//   },
// };
