import { delay, IntegrationApiExcutorParams } from '@mastra/core';
import { z } from "zod";

async function siteCrawl({ data, ctx }: IntegrationApiExcutorParams) {
    console.log('INCOMING', data);
    const { mastra } = await import('../')
    const firecrawlIntegration = mastra.getIntegration('FIRECRAWL');

    let agent

    try {
        agent = await mastra.getAgent({ connectionId: 'SYSTEM', agentId: '073a0c0d-e924-42ca-a437-78d350876e08' })
    } catch (e) {
        console.error(e)
        return
    }

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
                excludeTags: ['img', 'footer', 'nav', 'header', '#navbar', '.table-of-contents-content'],
                onlyMainContent: true,
            },
        },
    });

    if (res.error) {
        console.error(JSON.stringify(res.error, null, 2));
        return { success: false };
    }

    const crawlId = res.data?.id;

    console.log(crawlId)

    let crawl = await client.getCrawlStatus({
        path: {
            id: crawlId!,
        },
    });

    console.log(crawl)

    while (crawl.data?.status === 'scraping') {
        await delay(5000);

        crawl = await client.getCrawlStatus({
            path: {
                id: crawlId!,
            },
        });

        console.log(crawl.data?.status);
    }

    const openapiResponses = []

    for (const d of crawl.data?.data) {
        if (typeof agent === 'function') {
            const data = await agent({ prompt: `I wrote another page of docs, turn this into an Open API spec: ${d.markdown}` })
            console.log(data)
            openapiResponses.push(data)
        }
    }

    console.log(openapiResponses)



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


export const mintlifySiteCrawler = {
    label: 'Mintlify Docs Crawler',
    description: 'Crawl a website and extract the markdown content',
    type: 'MINTLIFY_SITE_CRAWL',
    executor: siteCrawl,
    schema: z.object({
        url: z.string().describe('The URL of the website to crawl'),
    }),
}