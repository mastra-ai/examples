import { Mastra, createLogger } from '@mastra/core';
import { cryptoAgent } from './agents';
import * as tools from './tools';

export const mastra = new Mastra<any>({
  tools,
  syncs: {},
  agents: [cryptoAgent],
  integrations: [],
  logger: createLogger({
    type: 'CONSOLE',
    level: 'INFO',
  }),
});
