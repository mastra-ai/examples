import { delay, IntegrationApiExcutorParams, PropertyType, splitMarkdownIntoChunks } from '@mastra/core';
import { z } from 'zod';

async function siteCrawl({ data, ctx }: IntegrationApiExcutorParams) {
  console.log('INCOMING', data);
  const { mastra } = await import('../');
  const firecrawlIntegration = mastra.getIntegration('FIRECRAWL');
  const connectionId = ctx.connectionId;

  const client = await firecrawlIntegration.getApiClient({ connectionId });

  console.log('Starting crawl', data.url);

  const res = await client.crawlUrls({
    body: {
      url: data.url,
      limit: 3,
      includePaths: ['/reference/api/*'],
      scrapeOptions: {
        formats: ['markdown'],
        includeTags: ['main'],
        excludeTags: [
          'img',
          'footer',
          'nav',
          'header',
          '#navbar',
          '.table-of-contents-content',
        ],
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

  const recordsToPersist = crawl?.data?.data?.flatMap(({ markdown, metadata }) => {
    const chunks = splitMarkdownIntoChunks(markdown!)
    return chunks.map((c, i) => {
      return {
        externalId: `${metadata?.sourceURL}_chunk_${i}`,
        data: { markdown: c},
        entityType: "CRAWL"
      }
    })
  })

  await mastra.dataLayer?.syncData({
    name: 'FIRECRAWL',
    connectionId,
    data: recordsToPersist,
    properties: [
      {
        name: 'markdown',
        displayName: 'Markdown',
        type: PropertyType.LONG_TEXT,
        visible: true,
        order: 1,
        modifiable: true
      }
    ],
    type: "CRAWL"
  })

  return { success: true, crawlData: crawl.data?.data, entityType: "CRAWL" };
}

async function generateSpec({ data, ctx }: IntegrationApiExcutorParams) {
  const { mastra } = await import('../');
  let agent;
  const integration = await mastra.dataLayer.getConnection({name: "FIRECRAWL", connectionId: ctx.connectionId})

  if (!integration) {
    throw new Error('Integration not found');
  }

  const crawledData = await mastra.dataLayer.getRecords({
    entityType: data.entityType,
    k_id: integration?.id
  });

  console.log({ crawledData, entityType: data.entityType, integrationId: integration?.id });

  try {
    agent = await mastra.getAgent({
      connectionId: 'SYSTEM',
      agentId: '073a0c0d-e924-42ca-a437-78d350876e08',
    });
  } catch (e) {
    console.error(e);
    return { success: false };
  }

  const openapiResponses = [];
  let mergedSpecAnswer = "";

  for (const d of crawledData) {
    if (typeof agent === 'function') {
      const data = await agent({
        prompt: `I wrote another page of docs, turn this into an Open API spec: ${d.data.markdown}`,
      });
      if (Array.isArray(data.toolCalls)) {
        const answer = data.toolCalls?.find(
          ({ toolName }) => toolName === 'answer'
        );
        openapiResponses.push(answer);
      }
    }
  }

  console.log({ openapiResponses, agent, typeof: typeof agent });

  if (typeof agent === 'function') {
    const mergedSpec = await agent?.({
      prompt: `I have generated the following Open API specs: ${openapiResponses
        .map((r: any) => r?.args?.yaml)
        .join('\n\n')} - merge them into a single spec.`,
    });

    if (Array.isArray(mergedSpec.toolCalls)) {
      const answer = mergedSpec.toolCalls?.find(
        ({ toolName }) => toolName === 'answer'
      );
      mergedSpecAnswer = answer?.args?.yaml;
    }
  }
  console.log(
    'MERGED SPEC ==================',
    JSON.stringify(mergedSpecAnswer, null, 2)
  );

  return { success: true, mergedSpec: mergedSpecAnswer };
}

export const generateMergedSpec = {
  label: 'Generate Merged Spec',
  description: 'Generate a merged spec from a website',
  type: 'GENERATE_MERGED_SPEC',
  executor: generateSpec,
  schema: z.object({
    entityType: z.string().describe('The entity type to generate a spec for'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    mergedSpec: z.array(z.any()).describe('The merged spec'),
  }),
};

export const mintlifySiteCrawler = {
  label: 'Mintlify Docs Crawler',
  description: 'Crawl a website and extract the markdown content',
  type: 'MINTLIFY_SITE_CRAWL',
  executor: siteCrawl,
  schema: z.object({
    url: z.string().describe('The URL of the website to crawl'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    crawlData: z.array(z.any()).describe('The data from the crawl'),
    entityType: z.string().describe('The entity type that was crawled'),
  }),
};
