"use server";

import { config } from "@mastra/config";
import { Mastra } from "@mastra/core";
import { ImageResponse } from "./system-apis";

const framework = Mastra.init(config);

export const getImage = async ({ query }: { query: string }) => {
  const response = await framework.callApi({
    integrationName: "bird-checker",
    api: "get_random_image",
    payload: {
      data: {
        query
      },
      ctx: {
        connectionId: "SYSTEM"
      }
    }
  });

  return response as ImageResponse;
};

export const promptClaude = async ({ imageUrl }: { imageUrl: string }) => {
  const response = await framework.callApi({
    integrationName: "bird-checker",
    api: "message_agent",
    payload: {
      data: {
        agentId: "4e79a2bc-3bf1-45c0-ace7-4abcc540a851",
        message: `${imageUrl}, view this url and structure your response like this, {bird: yes/no, location: the location of the image, species: the Scientific name of the bird without any explanation}, only give the location and species if it is a bird`
      },
      ctx: {
        connectionId: "SYSTEM"
      }
    }
  });

  console.log("response===", JSON.stringify(response, null, 2));

  const { data } = response || {};

  return data as { message: string };
};
