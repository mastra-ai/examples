"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Status } from "./bird-checker";
import { Skeleton } from "@/components/ui/skeleton";
import { Bird, Check, MapPin } from "lucide-react";
import {
  ErrorClaudeResponse,
  ImageResponse,
  SuccessClaudeResponse
} from "@/lib/mastra/system-apis";

function getObjectFromString(text: string) {
  // First approach: using match()
  const regex =
    /(?<=bird:).*?(?=,|\n)|(?<=location:).*?(?=,|\n)|(?<=species:).*(?=\n|})/g;
  const matches = text.match(regex);

  if (!matches) {
    return {
      bird: "no",
      location: text,
      species: ""
    };
  }

  const [bird, location, species] = matches;
  console.log("Bird:", bird);
  console.log("Location:", location);
  console.log("Species:", species);

  return {
    bird: bird?.trim(),
    location: location?.trim(),
    species: species?.split("}")?.join("")?.trim()
  };
}

export const BirdCheckerResponse = ({
  status,
  query,
  metadataResponse
}: {
  status: Status;
  query: string;
  metadataResponse: ImageResponse<SuccessClaudeResponse, ErrorClaudeResponse> | null;
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
    const getMetadataFromResponse = async () => {
      if (!metadataResponse) return;

      setMetadataStatus("loading");

      if (!metadataResponse?.ok) {
        toast.error("Failed to fetch image metadata");
        setMetadataStatus("error");
        return;
      }
      console.log("res===", metadataResponse);
      setMetadataStatus("success");
      const object = getObjectFromString(metadataResponse?.data?.content?.[0]?.text);

      setMedata(object);
    };

    getMetadataFromResponse();
  }, [metadataResponse]);

  return (
    <div className="flex !mt-0 flex-col gap-4">
      {status === "loading" || metadataStatus === "loading" ? (
        <p className=" animate-pu">
          thinking{" "}
          <span className="animate-ellipsis">
            <span className="inline-block animate-bounce [animation-delay:-0.3s]">.</span>
            <span className="inline-block animate-bounce [animation-delay:-0.2s]">.</span>
            <span className="inline-block animate-bounce [animation-delay:-0.1s]">.</span>
          </span>
        </p>
      ) : (
        ""
      )}

      <div className="flex flex-col border">
        <div className="flex border-b flex-col p-2 gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Check className="h-4 w-4" />
            <span className="font-serif text-sm">Is it a bird?</span>
          </div>

          {status === "loading" ? (
            <Skeleton className="h-4 w-[200px]" />
          ) : (
            <>
              {metadataStatus === "loading" ? (
                <Skeleton className="h-4 w-[200px]" />
              ) : null}
              {metadata?.bird ? (
                <span className="py-1 px-5 font-serif font-medium bg-blue-100 w-fit  rounded">
                  {metadata.bird}
                </span>
              ) : null}
            </>
          )}
        </div>

        <div className="flex flex-col  border-b p-3 gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Bird className="h-4 w-4" />
            <span className="font-serif text-sm">Species</span>
          </div>

          {status === "loading" ? (
            <Skeleton className="h-4 w-[200px]" />
          ) : (
            <>
              {metadataStatus === "loading" ? (
                <Skeleton className="h-4 w-[200px]" />
              ) : null}
              {metadata?.species ? (
                <span className="p-3 font-serif font-medium bg-blue-100 w-fit  rounded">
                  {metadata.species}
                </span>
              ) : null}
            </>
          )}
        </div>

        <div className="flex flex-col  p-3 gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="font-serif text-sm">Location</span>
          </div>

          {status === "loading" ? (
            <Skeleton className="h-4 w-[200px]" />
          ) : (
            <>
              {metadataStatus === "loading" ? (
                <Skeleton className="h-4 w-[200px]" />
              ) : null}
              {metadata?.location ? (
                <span className="p-3 font-serif font-medium bg-blue-100 w-fit rounded">
                  {metadata.location}
                </span>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
};