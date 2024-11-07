"use client";

import { promptClaude } from "@/lib/mastra/actions";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Status } from "./bird-checker";
import { Skeleton } from "@/components/ui/skeleton";

function getObjectFromString(text: string) {
  // First approach: using match()
  const regex =
    /(?<=bird:).*?(?=,|\n)|(?<=location:).*?(?=,|\n)|(?<=species:).*(?=\n|})/g;
  const matches = text.match(regex);

  if (!matches) {
    return {
      bird: "no",
      location: text,
      species: "",
    };
  }

  const [bird, location, species] = matches;
  console.log("Bird:", bird);
  console.log("Location:", location);
  console.log("Species:", species);

  return {
    bird: bird?.trim(),
    location: location?.trim(),
    species: species?.split("}")?.join("")?.trim(),
  };
}

export const BirdCheckerResponse = ({
  imageUrl,
  status,
  query,
}: {
  imageUrl?: string;
  status: Status;
  query: string;
}) => {
  const [metadata, setMedata] = useState<{
    bird: string;
    location: string;
    species: string;
  } | null>(null);
  const [metadataStatus, setMetadataStatus] = useState<Status>("idle");

  useEffect(() => {
    setMedata(null);
    setMetadataStatus("loading");
  }, [query]);

  useEffect(() => {
    const getRandomImage = async () => {
      if (!imageUrl) return;

      setMetadataStatus("loading");
      const res = await promptClaude({ imageUrl });

      if (!res.ok) {
        toast.error("Failed to fetch image metadata");
        setMetadataStatus("error");
        return;
      }
      console.log("res===", res.data);
      setMetadataStatus("success");
      const object = getObjectFromString(res.data.content[0].text);

      setMedata(object);
      toast.success("Image metadata fetched successfully");
    };

    getRandomImage();
  }, [imageUrl]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col rounded border border-blue-100 p-3 gap-4">
        <span className="text-gray-600">Is it a bird?</span>
        {status === "loading" ? (
          <Skeleton className="h-4 w-[200px]" />
        ) : (
          <>
            {metadataStatus === "loading" ? (
              <Skeleton className="h-4 w-[200px]" />
            ) : null}
            {metadata?.bird ? (
              <span className="p-3 bg-blue-100 w-fit font-medium rounded-2xl">
                {metadata.bird}
              </span>
            ) : null}
          </>
        )}
      </div>

      <div className="flex flex-col rounded border border-blue-100 p-3 gap-4">
        <span className="text-gray-600">What species</span>
        {status === "loading" ? (
          <Skeleton className="h-4 w-[200px]" />
        ) : (
          <>
            {metadataStatus === "loading" ? (
              <Skeleton className="h-4 w-[200px]" />
            ) : null}
            {metadata?.species ? (
              <span className="p-3 bg-blue-100 w-fit font-medium rounded-2xl">
                {metadata.species}
              </span>
            ) : null}
          </>
        )}
      </div>

      <div className="flex flex-col rounded border border-blue-100 p-3 gap-4">
        <span className="text-gray-600">Where taken?</span>
        {status === "loading" ? (
          <Skeleton className="h-4 w-[200px]" />
        ) : (
          <>
            {metadataStatus === "loading" ? (
              <Skeleton className="h-4 w-[200px]" />
            ) : null}
            {metadata?.location ? (
              <span className="p-3 bg-blue-100 w-fit font-medium rounded-2xl">
                {metadata.location}
              </span>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};
