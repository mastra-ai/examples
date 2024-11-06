"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

export const BirdChecker = () => {
  const [activeTag, setActiveTag] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const tags = [
    { id: "wildlife", label: "Wildlife", icon: "🦁" },
    { id: "feathers", label: "Feathers", icon: "🪶" },
    { id: "flying", label: "Flying", icon: "✈️" },
    { id: "birds", label: "Birds", icon: "🦜" },
  ];

  const handleTagClick = (tagId: string) => {
    setActiveTag(tagId);
    setIsLoading(true);
    // Simulate image regeneration
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div>
      <Card className="w-full relative mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl text-brown-600">
            Bird Checker
          </CardTitle>
          <p className="text-gray-600">
            Click a category below to generate a new image:
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image placeholder */}
          <div className="relative bg-gray-100 w-full aspect-video  flex items-center justify-center">
            <Image
              src={"/api/placeholder.png"}
              alt=""
              width={600}
              height={400}
              className={`w-full h-full transition-opacity duration-200 ${
                isLoading ? "opacity-50" : "opacity-100"
              }`}
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {/* Large, obvious buttons */}
          <div className="grid grid-cols-2 gap-4">
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => handleTagClick(tag.id)}
                disabled={isLoading}
                className={`
                relative p-4 rounded-lg text-lg font-medium
                transition-all duration-200
                ${
                  activeTag === tag.id
                    ? "bg-blue-500 text-white shadow-lg scale-95"
                    : "bg-white hover:bg-gray-50 text-gray-700 hover:shadow-md hover:scale-100"
                }
                border-2 border-gray-200
                disabled:opacity-50 disabled:cursor-not-allowed
                group flex items-center justify-center gap-2
                min-h-[80px]
              `}
              >
                <span className="text-2xl">{tag.icon}</span>
                <span>{tag.label}</span>
                <RefreshCw
                  className={`
                w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity
                absolute top-2 right-2
                ${activeTag === tag.id ? "text-white" : "text-gray-400"}
              `}
                />
              </button>
            ))}
          </div>

          {/* Question fields */}
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <span className="text-gray-600">Is it a bird?</span>
              <span>Yes/No</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <span className="text-gray-600">What species?</span>
              <span>Species name</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <span className="text-gray-600">Where taken?</span>
              <span className="text-sm text-gray-600">
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
