"use server";

import { mastra } from "@/mastra";
import { getRandomImageTool } from "@/mastra/tools";
import { ImageResponse } from "./system-tools";

export type ImageQuery = "wildlife" | "feathers" | "flying" | "birds";

export const getImage = async ({ query }: { query: ImageQuery }) => {
  console.log("get image ============", "got here");

  const response = await getRandomImageTool.executor({
    data: { query },
    getIntegration: () => {
      return "" as never;
    }
  });

  return response;
};

export const promptClaude = async ({
  imageUrl
}: {
  imageUrl: string;
}): Promise<ImageResponse<{ text: string }, string>> => {
  try {
    const agentOne = mastra.getAgent("Bird checker");

    console.log("calling bird checker agent");

    const response = await agentOne.text({
      messages: [
        [
          {
            type: "image",
            image: imageUrl
          },
          {
            type: "text",
            text: "view this image and structure your response like this, {bird: yes/no, location: the location of the image, species: the Scientific name of the bird without any explanation}"
          }
        ]
      ] as unknown as string[]
    });

    const { text } = response;

    console.log("prompt claude response====", JSON.stringify(response, null, 2));

    return { ok: true, data: { text } };
  } catch (err) {
    console.error("Error prompting claude:", err);
    return { ok: false, error: "Could not fetch image metadata" };
  }
};
