import {
  getImageMetadataFromClaude,
  getRandomImage,
} from "@/lib/mastra/system-apis";
import { Config, LogLevel } from "@mastra/core";
import { z } from "zod";

export const config: Config = {
  name: "bird-checker",
  integrations: [],
  db: {
    provider: "postgres",
    uri: process.env.DB_URL!,
  },

  runner: {
    provider: "inngest",
    uri: process.env.INNGEST_URL!,
    signingKey: process.env.INNGEST_SIGNING_KEY!,
    eventKey: process.env.INNGEST_EVENT_KEY!,
  },
  workflows: {
    blueprintDirPath: "/mastra/blueprints",
    systemEvents: {},
    systemApis: [
      {
        type: "get_random_image",
        label: "Get a random image from upstash",
        description:
          "Gets a random image from upstash based on the selected option",
        schema: z.object({
          query: z.enum(["wildlife", "feathers", "flying", "birds"]),
        }),
        executor: async ({ data }: { data: unknown }) => {
          return getRandomImage(data as { query: string });
        },
      },
      {
        type: "get_image_metadata_from_claude",
        label: "Get image metadata from claude",
        description: "Get image metadata from claude",
        schema: z.object({
          imageUrl: z.string(),
        }),
        executor: async ({ data }: { data: unknown }) => {
          return getImageMetadataFromClaude(data as { imageUrl: string });
        },
      },
    ],
  },
  logs: {
    provider: "FILE",
    level: LogLevel.DEBUG,
  },
  agents: {
    agentDirPath: "/mastra/agents",
    vectorProvider: [],
  },
  systemHostURL: process.env.APP_URL!,
  routeRegistrationPath: "/api/mastra",
};
