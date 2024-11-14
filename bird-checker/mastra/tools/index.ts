import { getImageMetadataFromClaude, getRandomImage } from "@/lib/mastra/system-apis";
import { createTool } from "@mastra/core";
import { z } from "zod";

export const getRandomImageTool = createTool({
  label: "Get a random image from unsplash",
  description: "Gets a random image from unsplash based on the selected option",
  schema: z.object({
    query: z.enum(["wildlife", "feathers", "flying", "birds"])
  }),
  executor: async ({ data }: { data: unknown }) => {
    return getRandomImage(data as { query: string }) as unknown as Record<
      string,
      unknown
    >;
  }
});

export const getImageMetadataFromClaudeTool = createTool({
  label: "Get image metadata from claude",
  description: "Get image metadata from claude",
  schema: z.object({
    imageUrl: z.string()
  }),
  executor: async ({ data }: { data: unknown }) => {
    return getImageMetadataFromClaude(data as { imageUrl: string });
  }
});
