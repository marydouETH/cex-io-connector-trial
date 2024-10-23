export type NumberString = string; // string format of float
export type DateString = string; // string format of date

export type CexSubAccountStatus = {
  [accountId: string]: {
    [currency: string]: {
      balance: NumberString;
      balanceOnHold: NumberString;
      balanceInConvertedCurrency?: NumberString;
    };
  };
};
