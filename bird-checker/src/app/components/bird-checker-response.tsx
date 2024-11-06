"use client";

import { promptClaude } from "@/lib/mastra/actions";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Status } from "./bird-checker";
import { Skeleton } from "@/components/ui/skeleton";

function getObjectFromString(text: string) {
  // First approach: using match()
  const regex =
    /(?<=bird: ).*?(?=,)|(?<=location: ).*?(?=,)|(?<=species: ).*(?=\n)/g;
  const matches = text.match(regex);

  if (!matches) {
    return {
      bird: "",
      location: "",
      species: "",
    };
  }

  const [bird, location, species] = matches;
  console.log("Bird:", bird);
  console.log("Location:", location);
  console.log("Species:", species);

  return {
    bird,
    location,
    species,
  };
}

export const BirdCheckerResponse = ({
  imageUrl,
  status,
}: {
  imageUrl?: string;
  status: Status;
}) => {
  const [metadata, setMedata] = useState<{
    bird: string;
    location: string;
    species: string;
  } | null>(null);

  useEffect(() => {
    const getRandomImage = async () => {
      if (!imageUrl) return;

      const res = await promptClaude({ imageUrl });

      if (!res.ok) {
        toast.error("Failed to fetch image metadata");
        return;
      }
      console.log("res===", res.data);
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
            <span className="p-3 bg-blue-100 w-fit font-medium rounded-2xl">
              {metadata ? (
                metadata.bird
              ) : (
                <Skeleton className="h-4 w-[200px]" />
              )}
            </span>
          </>
        )}
      </div>

      <div className="flex flex-col p-3 rounded border border-blue-100 gap-4">
        <span className="text-gray-600">What species?</span>
        <span className="p-3 bg-blue-100 w-fit font-medium rounded-2xl">
          {metadata ? metadata.species : <Skeleton className="h-4 w-[200px]" />}
        </span>
      </div>
      <div className="flex flex-col p-3 rounded border border-blue-100 gap-4">
        <span className="text-gray-600">Where taken?</span>
        <span className="p-3 bg-blue-100 w-fit font-medium rounded-2xl">
          {metadata ? (
            metadata.location
          ) : (
            <Skeleton className="h-4 w-[200px]" />
          )}
        </span>
      </div>
    </div>
  );
};
