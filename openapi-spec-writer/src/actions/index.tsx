"use server";

import {
  makePRToMastraWorkflow,
  openApiSpecGenWorkflow,
} from "mastra/next-workflows";

export async function generateOpenApiSpec({
  url,
  crawlOptions,
}: {
  url: string;
  crawlOptions: {
    pathRegex: string;
  };
}): Promise<
  | {
      message: "failed";
      data: string;
    }
  | {
      message: "successful";
      data: unknown;
    }
> {
  const res = await openApiSpecGenWorkflow.executeWorkflow({
    url,
    pathRegex: crawlOptions.pathRegex,
  });

  console.log({
    data: res.results["GENERATE_MERGED_SPEC"],
  });

  const openApiSpec = (res.results["GENERATE_MERGED_SPEC"] as any)?.mergedSpec;

  return { message: "successful", data: openApiSpec };
}

export async function makeMastraPR({
  crawledUrl,
  yaml,
  integrationName,
}: {
  yaml: string;
  crawledUrl: string;
  integrationName: string;
}) {
  const res = await makePRToMastraWorkflow.executeWorkflow({
    integration_name: integrationName,
    site_url: crawledUrl,
    yaml,
    owner: "mastra",
    repo: "mastra",
  });

  const prUrl = (res.results["ADD_TO_GIT"] as any)?.pr_url;

  const pr_url = prUrl;

  return { message: "successful", data: pr_url };
}
