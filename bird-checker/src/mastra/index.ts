import { Integration, Mastra, createLogger } from "@mastra/core";

import { getRandomImageTool } from "./tools";
import { agentOne } from "./agents";

export const mastra = new Mastra<Integration[]>({
  tools: {
    getRandomImageTool
  },
  syncs: {},
  agents: [agentOne],
  integrations: [],
  logger: createLogger({
    type: "CONSOLE",
    level: "INFO"
  })
});
