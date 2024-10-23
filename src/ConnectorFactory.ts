import {
  PublicExchangeConnector,
  PrivateExchangeConnector,
  ConnectorGroup,
  ConnectorConfiguration,
  Credential,
} from 'skl-shared';

import { CexIoPrivateConnector, CexIoPublicConnector } from './connectors';

export class ConnectorFactory {
  public static getPublicConnector(
    group: ConnectorGroup,
    config: ConnectorConfiguration,
    credential?: Credential
  ): PublicExchangeConnector {
    switch (config.connectorType) {
      case 'CexIo':
        return new CexIoPublicConnector(group, config, credential);
      default:
        throw new Error(`Unknown exchange: ${config.connectorType}`);
    }
  }

  public static getPrivateConnector(
    group: ConnectorGroup,
    config: ConnectorConfiguration,
    credential: Credential
  ): PrivateExchangeConnector {
    switch (config.connectorType) {
      case 'CexIo':
        return new CexIoPrivateConnector(group, config, credential);
      default:
        throw new Error(`Unknown exchange: ${config.connectorType}`);
    }
  }
}
