import {
  ConnectorGroup,
  Credential,
  ConnectorConfiguration,
  PrivateExchangeConnector,
  Serializable,
} from 'skl-shared';
import { config } from './config';
import { ConnectorFactory } from './src';
import { Logger } from './src/utils';

const logger = Logger.getInstance('global');

const connectorGroup: ConnectorGroup = {
  name: 'btc',
};

const connectorConfig: ConnectorConfiguration = {
  quoteAsset: 'usdt',
  connectorType: 'CexIo',
};

const creds: Credential = {
  accessKey: config.AccessKey,
  privateKey: config.PrivateKey,
};

const connectorInstance: PrivateExchangeConnector =
  ConnectorFactory.getPrivateConnector(connectorGroup, connectorConfig, creds);

const onMessage = (m: Serializable[]) => {
  logger.info(m);
};

connectorInstance.connect(onMessage);
setTimeout(() => connectorInstance.stop(), 30 * 1000);
