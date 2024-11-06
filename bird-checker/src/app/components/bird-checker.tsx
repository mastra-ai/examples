"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bird, Camera, Feather, Plane, RefreshCw } from "lucide-react";
import Image from "next/image";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const apiKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;

const tags = [
  { id: "wildlife", label: "Wildlife", icon: <Camera /> },
  { id: "feathers", label: "Feathers", icon: <Feather /> },
  { id: "flying", label: "Flying", icon: <Plane /> },
  { id: "birds", label: "Birds", icon: <Bird /> },
];

type Image = {
  alt_description: string;
  urls: {
    regular: string;
    raw: string;
  };
  user: {
    first_name: string;
    links: {
      html: string;
    };
  };
};
type IsFetching = "idle" | "loading" | "success" | "error";
export const BirdChecker = () => {
  const [image, setImage] = useState<Image | null>(null);
  const [status, setStatus] = useState<IsFetching>("idle");
  const [query, setQuery] = useQueryState("query", {
    defaultValue: "wildlife",
  });

  useEffect(() => {
    const getRandomImage = async () => {
      setStatus("loading");
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${query}`,
        {
          method: "GET",
          headers: {
            Authorization: `Client-ID ${apiKey}`,
            "Accept-Version": "v1",
          },
          cache: "no-store",
        }
      );
      if (!res.ok) {
        setStatus("error");
        toast.error("Failed to fetch image");
        return;
      }

      const data = (await res.json()) as {
        results: Array<Image>;
      };
      const randomNo = Math.floor(Math.random() * data.results.length);
      setImage(data.results[randomNo]);

      setStatus("success");
    };
    getRandomImage();
  }, [query]);

  const handleTagClick = (tagId: string) => {
    setQuery(tagId);
  };

  return (
    <div>
      <Card className="w-full relative rounded-2xl mt-8 mx-auto max-w-4xl">
        <CardHeader>
          <CardTitle className="text-2xl text-brown-600">
            Bird Checker
          </CardTitle>
        </CardHeader>
        <CardContent className=" grid grid-cols-2 gap-12 space-y-6">
          {/* Image placeholder */}
          <div className="">
            <div className="relative grow-0 bg-gray-100 rounded-2xl  w-full aspect-square  flex items-center justify-center">
              {status === "loading" ? <span>Fetching Image</span> : null}
              {status === "loading" && (
                <div className="absolute top-2 right-4 flex items-center justify-center">
                  <div className="w-4 h-4 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
                </div>
              )}
              {status === "idle" ? null : status === "success" && image ? (
                <Image
                  src={`${image.urls.regular}`}
                  alt={image.alt_description}
                  width={600}
                  height={300}
                  className="w-full h-full rounded-2xl transition-opacity duration-200"
                />
              ) : null}
            </div>
            <span className="text-xs">
              Credit:{" "}
              <a
                href="unsplash.com"
                target="_blank"
                className="text-blue-600 underline"
              >
                Unsplah
              </a>
              , Photographer{" "}
              <a
                href={image?.user.links.html}
                className="text-blue-600 underline font-medium"
                target="_blank"
              >
                {image?.user.first_name}
              </a>
            </span>

            <div className="mt-4">
              <p className="text-gray-600">
                Click a category below to generate a new image:
              </p>
              <div className="grid mt-2 grid-cols-2 gap-4">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagClick(tag.id)}
                    disabled={status === "loading"}
                    className={`
                  relative p-4 rounded-lg font-medium
                  transition-all duration-200
                  ${
                    query === tag.id
                      ? "bg-blue-500 text-white shadow-lg scale-95"
                      : "bg-white scale-95 hover:bg-gray-50 text-gray-700 hover:shadow-md hover:scale-100"
                  }
                  border-2 border-gray-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                  group flex items-center justify-center gap-2
                  min-h-[34px]
                `}
                  >
                    <span>{tag.icon}</span>
                    <span>{tag.label}</span>
                    <RefreshCw
                      className={`
                  w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity
                  absolute top-2 right-2
                  ${query === tag.id ? "text-white" : "text-gray-400"}
                `}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Question fields */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col rounded border border-blue-100 p-3 gap-4">
              <span className="text-gray-600">Is it a bird?</span>
              <span className="p-3 bg-blue-100 w-fit font-medium rounded-2xl">
                Yes
              </span>
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
                This flamingo photo appears to be taken in a coastal lagoon or
                salt marsh during winter, given the brown dormant vegetation in
                the background. Given it&apos;s a Greater Flamingo, this could
                be in the Mediterranean region, parts of Africa, or South Asia
                where these birds are commonly found
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      <span className="fixed bottom-2 right-2 w-fit mx-auto py-1 bg-[#0057ff] duration-300 ease-out transition-all rounded-full px-2 border-[hsla(256,2%,99%,.08)] justify-center items-center font-medium border text-sm">
        <div className="animate-mask flex gap-2">
          <span className="uppercase inline-flex items-center h-4 rounded-full text-white px-1.5 leading-tight tracking-widest text-[9px] bg-[hsla(256,2%,99%,.15)] font-semibold">
            Source
          </span>
          <span className="text-xs text-white font-semibold">
            Developed with Mastra.ai
          </span>
        </div>
      </span>
    </div>
  );
};
