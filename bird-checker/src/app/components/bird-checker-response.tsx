"use client";

import { promptClaude } from "@/lib/mastra/actions";
import { useEffect, useState } from "react";

type Response = {
  bird: "yes" | "no";
  species: string;
  location: string;
};
type IsFetching = "idle" | "loading" | "success" | "error";
export const BirdCheckerResponse = ({ imageUrl }: { imageUrl: string }) => {
  const [response, setResponse] = useState<Response | null>(null);
  const [status, setStatus] = useState<IsFetching>("idle");

  useEffect(() => {
    const getRandomImage = async () => {
      setStatus("loading");

      console.log({ imageUrl });

      await promptClaude({ imageUrl });
      //handle the response and set to response to display

      setStatus("success");
    };
    getRandomImage();
  }, [imageUrl]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col rounded border border-blue-100 p-3 gap-4">
        <span className="text-gray-600">Is it a bird?</span>
        <span className="p-3 bg-blue-100 w-fit font-medium rounded-2xl">Yes</span>
      </div>
      <div className="flex flex-col p-3 rounded border border-blue-100 gap-4">
        <span className="text-gray-600">What species?</span>
        <span className="p-3 bg-blue-100 w-fit font-medium rounded-2xl">
          Wolf species
        </span>
      </div>
      <div className="flex flex-col p-3 rounded border border-blue-100 gap-4">
        <span className="text-gray-600">Where taken?</span>
        <span className="p-3 bg-blue-100 w-fit font-medium rounded-2xl">
          This flamingo photo appears to be taken in a coastal lagoon or salt marsh during
          winter, given the brown dormant vegetation in the background. Given it&apos;s a
          Greater Flamingo, this could be in the Mediterranean region, parts of Africa, or
          South Asia where these birds are commonly found
        </span>
      </div>
    </div>
  );
};
