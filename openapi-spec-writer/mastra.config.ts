import { FirecrawlIntegration } from '@mastra/firecrawl';
import { Config } from '@mastra/core';
import { z } from 'zod';
import { mintlifySiteCrawler } from './mastra/tools';

const globalFirecrawlIntegration = new FirecrawlIntegration({
  config: {
    API_KEY: process.env.FIRECRAWL_API_KEY!,
  },
});

export const config: Config = {
  name: 'openapi-spec-writer',
  integrations: [
    globalFirecrawlIntegration
  ],
  db: {
    provider: 'postgres',
    uri: process.env.DB_URL!,
  },
  runner: {
    provider: 'inngest',
    uri: process.env.INNGEST_URL!,
    signingKey: process.env.INNGEST_SIGNING_KEY!,
    eventKey: process.env.INNGEST_EVENT_KEY!,
  },
  workflows: {
    blueprintDirPath: '/mastra/blueprints',
    systemEvents: {
      'WRITE_SPEC': {
        label: 'Write Spec',
        schema: z.object({
          url: z.string().describe('The URL of the website to crawl'),
        })
      }
    },
    systemApis: [
      mintlifySiteCrawler,
    ],
  },
  agents: {
    agentDirPath: '/mastra/agents',
    vectorProvider: [],
  },
  systemHostURL: process.env.APP_URL!,
  routeRegistrationPath: '/api/mastra',
};
