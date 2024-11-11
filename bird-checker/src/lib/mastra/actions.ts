"use server";

import { config } from "@mastra/config";
import { Mastra } from "@mastra/core";
import {
  ErrorClaudeResponse,
  ImageResponse,
  SuccessClaudeResponse,
  type Image
} from "./system-apis";

const framework = Mastra.init(config);

export const getImageWithMetada = async ({ query }: { query: string }) => {
  const response = await framework.triggerEvent({
    integrationName: "bird-checker",
    key: "QUERY_IMAGE",
    data: {
      query
    },
    user: {
      connectionId: "SYSTEM"
    }
  });

  const { workflowEvent } = response;

  const resp = await workflowEvent.subscribe();

  const ctx = resp?.output?.data?.[0]?.fullCtx;

  const imageResponse = ctx?.["ujcib5bjdic2ehdpeer4q8qo"] as ImageResponse<Image, string>;
  const metadataResponse = ctx?.["j6utaiqadvm35tui0r4hyrl0"] as ImageResponse<
    SuccessClaudeResponse,
    ErrorClaudeResponse
  >;

  console.log("imageResponse===", JSON.stringify(imageResponse, null, 2));
  console.log("metadataResponse===", JSON.stringify(metadataResponse, null, 2));

  return { imageResponse, metadataResponse };
};
