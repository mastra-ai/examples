import { Integration, Mastra, createLogger } from "@mastra/core";

import { getImageMetadataFromClaudeTool, getRandomImageTool } from "./tools";

export const mastra = new Mastra<Integration[]>({
  tools: {
    getImageMetadataFromClaudeTool,
    getRandomImageTool
  },
  syncs: {},
  agents: [],
  integrations: [],
  logger: createLogger({
    type: "CONSOLE",
    level: "INFO"
  })
});
