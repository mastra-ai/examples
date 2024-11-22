import { Workflow } from "@mastra/core";
import { z } from "zod";
import { mastra } from "mastra";

export const openApiSpecGenWorkflow = new Workflow("openApiSpecGenWorkflow");

openApiSpecGenWorkflow.setTriggerSchema(
  z.object({
    url: z.string().describe("The URL of the website to crawl"),
    pathRegex: z.string().optional().describe("The regex to match the paths"),
  })
);

openApiSpecGenWorkflow.addStep("MINTLIFY_SITE_CRAWL", {
  action: async (data) => {
    const tool = mastra.getTool("siteCrawl");
    return tool.execute({
      limit: data.limit ?? 3,
      pathRegex: data.pathRegex ?? ".*",
      url: data.url,
    });
  },
  inputSchema: z.object({
    url: z.string().describe("The URL of the website to crawl"),
    pathRegex: z.string().optional().describe("The regex to match the paths"),
    limit: z.number().optional().describe("The number of pages to crawl"),
  }),
  payload: {
    limit: 3,
  },
  variables: {
    pathRegex: {
      path: "pathRegex",
      stepId: "trigger",
    },
    url: {
      path: "url",
      stepId: "trigger",
    },
  },
  transitions: {
    GENERATE_MERGED_SPEC: {},
  },
});

openApiSpecGenWorkflow.addStep("GENERATE_MERGED_SPEC", {
  action: async (data) => {
    const tool = mastra.getTool("generateSpec");
    return tool.execute({
      mastra_entity_type: data.entityType,
    });
  },
  payload: {},
  inputSchema: z.object({
    entityType: z.string().describe("The entity type to generate a spec for"),
  }),
  variables: {
    entityType: {
      path: "entityType",
      stepId: "MINTLIFY_SITE_CRAWL",
    },
  },
});

openApiSpecGenWorkflow.commit();

export const makePRToMastraWorkflow = new Workflow("makePRToMastra");

makePRToMastraWorkflow.setTriggerSchema(
  z.object({
    integration_name: z.string(),
    site_url: z.string().describe("The URL of the website to crawl"),
    owner: z.string().describe("Owner of the repo"),
    repo: z.string().describe("Name of the repo"),
  })
);

makePRToMastraWorkflow.addStep("ADD_TO_GIT", {
  action: async (data) => {
    const tool = mastra.getTool("addToGitHub");
    return tool.execute({
      integration_name: "GITHUB",
      owner: data.owner,
      repo: data.repo,
      site_url: data.site_url,
      yaml: data.yaml,
    });
  },
  payload: {
    owner: "mastra-ai",
    repo: "mastra",
  },
  inputSchema: z.object({
    yaml: z.string().describe("The Open API spec in YAML format"),
    integration_name: z.string().describe("The name of the integration to use"),
    site_url: z.string().describe("The URL of the website to crawl"),
    owner: z.string().describe("Owner of the repo"),
    repo: z.string().describe("Name of the repo"),
  }),
  variables: {
    yaml: {
      path: "yaml",
      stepId: "trigger",
    },
    integration_name: {
      path: "integration_name",
      stepId: "trigger",
    },
    site_url: {
      path: "site_url",
      stepId: "trigger",
    },
  },
});

makePRToMastraWorkflow.commit();
