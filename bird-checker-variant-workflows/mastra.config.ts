import { getImageMetadataFromClaude, getRandomImage } from "@/lib/mastra/system-apis";
import { Config, LogLevel } from "@mastra/core";
import { z } from "zod";

export const config: Config = {
  name: "bird-checker-variant-workflows",
  integrations: [],
  db: {
    provider: "postgres",
    uri: process.env.DB_URL!
  },
  runner: {
    provider: "inngest",
    uri: process.env.INNGEST_URL!,
    signingKey: process.env.INNGEST_SIGNING_KEY!,
    eventKey: process.env.INNGEST_EVENT_KEY!
  },
  workflows: {
    blueprintDirPath: "/mastra/blueprints",
    systemEvents: {
      QUERY_IMAGE: {
        schema: z.object({
          query: z.enum(["wildlife", "feathers", "flying", "birds"])
        }),
        label: "Get image from unsplash",
        description: "Get image from unsplash that matches the query"
      }
    },
    systemApis: [
      {
        type: "get_random_image",
        label: "Get a random image from unsplash",
        description: "Gets a random image from unsplash based on the selected option",
        schema: z.object({
          query: z.enum(["wildlife", "feathers", "flying", "birds"])
        }),
        outputSchema: z.object({
          data: z.object({
            alt_description: z.string(),
            urls: z.object({
              regular: z.string(),
              raw: z.string()
            }),
            user: z.object({
              first_name: z.string(),
              links: z.object({
                html: z.string()
              })
            })
          })
        }),
        executor: async ({ data }: { data: unknown }) => {
          return getRandomImage(data as { query: string });
        }
      },
      {
        type: "get_image_metadata_from_claude",
        label: "Get image metadata from claude",
        description: "Get image metadata from claude",
        schema: z.object({
          imageUrl: z.string()
        }),
        outputSchema: z.object({
          data: z.object({
            content: z.array(
              z.object({
                text: z.string(),
                type: z.string()
              })
            )
          })
        }),
        executor: async ({ data }: { data: unknown }) => {
          return getImageMetadataFromClaude(data as { imageUrl: string });
        }
      }
    ]
  },
  logs: {
    provider: "FILE",
    level: LogLevel.DEBUG
  },
  agents: {
    agentDirPath: "/mastra/agents",
    vectorProvider: []
  },
  systemHostURL: process.env.APP_URL!,
  routeRegistrationPath: "/api/mastra"
};
