import { Mastra, createLogger } from '@mastra/core';
import { createCryptoAgent } from './agents';
import * as tools from './tools';

export const createMastra = ({
  modelProvider,
  modelName,
}: {
  modelProvider: string;
  modelName: string;
}) =>
  new Mastra<any>({
    tools,
    agents: [createCryptoAgent(modelProvider, modelName)],
    integrations: [],
    logger: createLogger({
      type: 'CONSOLE',
      level: 'INFO',
    }),
  });
