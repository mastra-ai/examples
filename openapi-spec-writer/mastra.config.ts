import { FirecrawlIntegration } from '@mastra/firecrawl';
import { Config, delay, IntegrationApiExcutorParams } from '@mastra/core';
import { z } from 'zod';

const globalFirecrawlIntegration = new FirecrawlIntegration({
  config: {
    API_KEY: process.env.FIRECRAWL_API_KEY!,
  },
});

async function siteCrawl({ data, ctx }: IntegrationApiExcutorParams) {
  console.log('INCOMING', data);

  const firecrawlIntegration = globalFirecrawlIntegration;

  const connectionId = ctx.connectionId;

  const client = await firecrawlIntegration.getApiClient({ connectionId });

  const res = await client.crawlUrls({
    body: {
      url: data.url,
      scrapeOptions: {
        formats: ['markdown'],
        includeTags: ['main'],
        excludeTags: ['img', 'footer', 'nav', 'header'],
        onlyMainContent: true,
      },
    },
  });

  if (res.error) {
    console.error(JSON.stringify(res.error, null, 2));
    return { success: false };
  }

  const crawlId = res.data?.id;

  let crawl = await client.getCrawlStatus({
    path: {
      id: crawlId!,
    },
  });

  while (crawl.data?.status === 'scraping') {
    await delay(5000);

    crawl = await client.getCrawlStatus({
      path: {
        id: crawlId!,
      },
    });

    console.log(crawl.data?.status);
  }

  console.log('CRAWL DATA =============', crawl.data?.data);

  // const recordsToPersist = crawl?.data?.data?.flatMap(({ markdown, metadata }) => {
  //   const chunks = splitMarkdownIntoChunks(markdown!)
  //   return chunks.map((c, i) => {
  //     return {
  //       externalId: `${metadata?.sourceURL}_chunk_${i}`,
  //       data: { markdown: c},
  //       entityType: data.entityType
  //     }
  //   })
  // })

  // await this.dataLayer?.syncData({
  //   name: this.name,
  //   connectionId,
  //   data: recordsToPersist,
  //   properties: [
  //     {
  //       name: 'markdown',
  //       displayName: 'Markdown',
  //       type: PropertyType.LONG_TEXT,
  //       visible: true,
  //       order: 1,
  //       modifiable: true
  //     }
  //   ],
  //   type: data.entityType,
  // })

  return { success: true, crawlData: crawl.data?.data };
}

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
    systemEvents: {},
    systemApis: [
      {
        label: 'SiteCrawl',
        description: 'Crawl a website and extract the markdown content',
        type: 'SITECRAWL',
        executor: siteCrawl,
        schema: z.object({
          url: z.string().describe('The URL of the website to crawl'),
        }),
      },
    ],
  },
  agents: {
    agentDirPath: '/mastra/agents',
    vectorProvider: [],
  },
  systemHostURL: process.env.APP_URL!,
  routeRegistrationPath: '/api/mastra',
};
