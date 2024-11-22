import { Mastra } from "@mastra/core";
import { agentOne } from "./next-agents";
import { integrations } from "./next-integrations";
// import * as syncs from './next-syncs';
import * as tools from "./next-tools";
import { PostgresEngine } from "@mastra/engine";

export const mastra = new Mastra<typeof integrations, typeof tools>({
  integrations,
  agents: [agentOne],
  tools,
  engine: new PostgresEngine({
    url: process.env.DB_URL!,
  }),
  workflows: [],
});
