// import yaml from 'js-yaml';
// import { fs, vol } from 'memfs';
import {
  delay,
  IntegrationApiExcutorParams,
  PropertyType,
  splitMarkdownIntoChunks,
} from '@mastra/core';
import { GithubIntegration } from '@mastra/github';
import { randomUUID } from 'crypto';
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

  const recordsToPersist = crawl?.data?.data?.flatMap(
    ({ markdown, metadata }) => {
      const chunks = splitMarkdownIntoChunks(markdown!);
      return chunks.map((c, i) => {
        return {
          externalId: `${metadata?.sourceURL}_chunk_${i}`,
          data: { markdown: c },
          entityType: 'CRAWL',
        };
      });
    }
  );

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
        modifiable: true,
      },
    ],
    type: 'CRAWL',
  });

  return { success: true, crawlData: crawl.data?.data, entityType: 'CRAWL' };
}

async function generateSpec({ data, ctx }: IntegrationApiExcutorParams) {
  const { mastra } = await import('../');
  let agent;
  const integration = await mastra.dataLayer.getConnection({
    name: 'FIRECRAWL',
    connectionId: ctx.connectionId,
  });

  if (!integration) {
    throw new Error('Integration not found');
  }

  const crawledData = await mastra.dataLayer.getRecords({
    entityType: data.entityType,
    k_id: integration?.id,
  });

  console.log({
    crawledData,
    entityType: data.entityType,
    integrationId: integration?.id,
  });

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
  let mergedSpecAnswer = '';

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

async function addToGitHub({ data, ctx }: IntegrationApiExcutorParams) {
  const { mastra } = await import('../');

  const githubIntegration = mastra.getIntegration(
    'GITHUB'
  ) as GithubIntegration;

  const apiClient = await githubIntegration.getApiClient({
    connectionId: ctx.connectionId,
  });

  const content = data.yaml;

  console.log('Writing to Github for', data.integration_name);
  let agent;

  try {
    agent = await mastra.getAgent({
      connectionId: 'SYSTEM',
      agentId: '073a0c0d-e924-42ca-a437-78d350876e08',
    });
  } catch (e) {
    console.error(e);
    return { success: false };
  }

  if (typeof agent === 'function') {
    const d = await agent({
      prompt: `Can you take this text blob and format it into proper YAML? ${content}`,
    });

    if (Array.isArray(d.toolCalls)) {
      const answer = d.toolCalls?.find(({ toolName }) => toolName === 'answer');

      const base64Content = Buffer.from(answer?.args?.yaml).toString('base64');

      const reposPathMap = {
        [`packages/${data.integration_name}/openapi.yaml`]: base64Content,
        [`packages/${data.integration_name}/README.md`]: Buffer.from(
          `# ${data.integration_name}\n\nThis repo contains the Open API spec for the ${data.integration_name} integration`
        ).toString('base64'),
      };

      const mainRef = await apiClient.gitGetRef({
        path: {
          ref: 'heads/main',
          owner: data.owner,
          repo: data.repo,
        },
      });

      console.log({ data, mainRef });

      const mainSha = mainRef.data?.object?.sha;

      console.log('Main SHA', mainSha);

      const branchName = `open-api-spec-${randomUUID()}`;

      console.log('Branch name', branchName);

      if (mainSha) {
        await apiClient.gitCreateRef({
          body: {
            ref: `refs/heads/${branchName}`,
            sha: mainSha,
          },
          path: {
            owner: data.owner,
            repo: data.repo,
          },
        });

        for (const [path, content] of Object.entries(reposPathMap)) {
          console.log({ path, content });
          await apiClient.reposCreateOrUpdateFileContents({
            body: {
              message: `Add open api spec from ${data.site_url}`,
              content,
              branch: branchName,
            },
            path: {
              owner: data.owner,
              repo: data.repo,
              path,
            },
          });
        }

        // console.log({ d, d2 });

        await apiClient.pullsCreate({
          body: {
            title: `Add open api spec from ${data.site_url} for ${data.integration_name}`,
            head: branchName,
            base: 'main',
          },
          path: {
            owner: data.owner,
            repo: data.repo,
          },
        });
      }
    }

    return { success: true };
  }

  return { success: false };
}

export const addToGit = {
  label: 'Add to Git',
  description: 'Commit the spec to GitHub',
  type: 'ADD_TO_GIT',
  executor: addToGitHub,
  schema: z.object({
    yaml: z.string().describe('The Open API spec in YAML format'),
    integration_name: z.string().describe('The name of the integration to use'),
    site_url: z.string().describe('The URL of the website to crawl'),
    owner: z.string().describe('Owner of the repo'),
    repo: z.string().describe('Name of the repo'),
  }),
};

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
