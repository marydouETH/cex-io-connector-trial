import { ConnectorConfiguration, ConnectorGroup } from 'skl-shared';

// trying to create getSklSymbol function from skl-library
export function getSklSymbol(
  group: ConnectorGroup,
  config: ConnectorConfiguration
): string {
  return `${config.connectorType}-${group.name}-${config.quoteAsset}`;
}
