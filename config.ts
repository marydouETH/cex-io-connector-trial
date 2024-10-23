import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  ConnectorType: 'CexIo',
  MaxCreateBatchSize: 10,
  MaxDeleteBatchSize: 50,
  RateLimit: 50,
  WaitTime: 2000,
  AccessKey: process.env.CexIoAccessKey || '',
  PrivateKey: process.env.CexIoPrivateKey || '',
};
