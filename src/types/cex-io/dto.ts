import { CexSubAccountStatus, DateString, NumberString } from './types';

export interface CexAccountStatusResponse {
  ok?: 'ok';
  error?: string;
  statusCode?: number;
  data: {
    convertedCurrency: string;
    balancesPerAccounts: CexSubAccountStatus;
    tradingFeeBalancesPerAccounts?: {
      [accountId: string]: {
        [currency: string]: {
          balance: NumberString;
          expirationDate?: DateString;
        };
      };
    };
  };
}

export interface CexWalletBalanceResponse {
  ok?: 'ok';
  error?: string;
  statusCode?: number;
  data: {
    [currency: string]: {
      balance: NumberString;
    };
  };
}

export interface CexCancelOrdersResponse {
  ok?: 'ok';
  clientOrderIds: string[];
}
