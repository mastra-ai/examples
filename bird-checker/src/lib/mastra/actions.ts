"use server";

import { config } from "@mastra/config";
import { Mastra } from "@mastra/core";
import {
  ErrorClaudeResponse,
  ImageResponse,
  SuccessClaudeResponse,
  type Image,
} from "./system-apis";

const framework = Mastra.init(config);

export const getImage = async ({ query }: { query: string }) => {
  console.log("get image ============", "got here");
  const response = await framework.callApi({
    integrationName: "bird-checker",
    api: "get_random_image",
    payload: {
      data: {
        query,
      },
      ctx: {
        connectionId: "SYSTEM",
      }, //in prod, how does this work?
    },
  });

  return response as ImageResponse<Image, string>;
};

export const promptClaude = async ({ imageUrl }: { imageUrl: string }) => {
  const response = await framework.callApi({
    integrationName: "bird-checker",
    api: "get_image_metadata_from_claude",
    payload: {
      data: {
        imageUrl,
      },
      ctx: {
        connectionId: "SYSTEM",
      },
    },
  });

  return response as ImageResponse<SuccessClaudeResponse, ErrorClaudeResponse>;
};
