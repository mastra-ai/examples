import { Mastra } from "@mastra/core";
import { agentOne } from "./agents";
import { integrations } from "./integrations";
// import * as syncs from './next-syncs';
import * as tools from "./tools";
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
