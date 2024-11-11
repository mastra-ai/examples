"use server";

import { mastra } from "../../mastra";

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
  const { workflowEvent } = await mastra.triggerEvent({
    key: "WRITE_SPEC",
    data: {
      integration_name: "BrowserBase",
      url,
      pathRegex: crawlOptions.pathRegex,
    },
    integrationName: mastra.config.name,
    user: {
      connectionId: "SYSTEM",
    },
  });

  const eventResponse = await workflowEvent.subscribe();

  const ctx = eventResponse.output?.data?.[0]?.fullCtx;

  const run = Object.values(ctx ?? {})?.find(
    (run: any) => (run?.workflowStepOrder || 0) === 1
  );

  const openApiSpec = (run as any)?.mergedSpec;

  if (!openApiSpec) {
    return { message: "failed", data: "No Open API Spec generated" };
  }

  console.log({
    run,
  });

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
  const { workflowEvent } = await mastra.triggerEvent({
    key: "PR_TO_MASTRA",
    data: {
      integrationName,
      url: crawledUrl,
      yaml,
    },
    integrationName: mastra.config.name,
    user: {
      connectionId: "SYSTEM",
    },
  });

  const eventResponse = await workflowEvent.subscribe();

  const ctx = eventResponse.output?.data?.[0]?.fullCtx;

  const run: any = Object.values(ctx ?? {})?.find(
    (run: any) => run?.workflowStepOrder! === 0
  );

  const pr_url = run?.pr_url;

  if (!pr_url) {
    return { message: "failed", data: "We could not make a PR" };
  }

  return { message: "successful", data: pr_url };
}
