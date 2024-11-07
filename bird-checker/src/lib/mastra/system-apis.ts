export type Image = {
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
export interface SuccessClaudeResponse {
  content: Content[];
  id: string;
  model: string;
  role: string;
  stop_reason: string;
  stop_sequence: unknown;
  type: string;
  usage: Usage;
}

export interface Content {
  text: string;
  type: string;
}

export interface Usage {
  input_tokens: number;
  output_tokens: number;
}

export interface ErrorClaudeResponse {
  type: string;
  error: {
    type: string;
    message: string;
  };
}

export type ImageResponse<T, K> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: K;
    };

// Executor functions
export const getRandomImage = async ({
  query,
}: {
  query: string;
}): Promise<ImageResponse<Image, string>> => {
  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${query}`,
    {
      method: "GET",
      headers: {
        Authorization: `Client-ID ${process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY}`,
        "Accept-Version": "v1",
      },
      cache: "no-store",
    },
  );
  if (!res.ok) {
    return {
      ok: false,
      error: "Failed to fetch image",
    };
  }

  const data = (await res.json()) as {
    results: Array<Image>;
  };
  const randomNo = Math.floor(Math.random() * data.results.length);

  return {
    ok: true,
    data: data.results[randomNo] as Image,
  };
};

export const getImageMetadataFromClaude = async ({
  imageUrl,
}: {
  imageUrl: string;
}): Promise<ImageResponse<SuccessClaudeResponse, ErrorClaudeResponse>> => {
  const resBase64 = await getImageAsBase64String(imageUrl);

  if (!resBase64.ok) {
    return {
      ok: false,
      error: {
        type: "error",
        error: {
          type: "error",
          message: "Failed to fetch image",
        },
      },
    };
  }
  const data = resBase64.data;

  console.log("got base64image string")

  const message = {
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data,
            },
          },
          {
            type: "text",
            text: "view this image and structure your response like this, {bird: yes/no, location: the location of the image, species: the Scientific name of the bird without any explanation}",
          },
        ],
      },
    ],
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
  };

  console.log("message===", JSON.stringify(message, null, 2))

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": `${process.env.ANTHROPIC_API_KEY}`,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        ...message,
      }),
    });

    console.log("res in api executor===", JSON.stringify(res, null, 2));

    if (!res.ok) {
      return {
        ok: false,
        error: {
          type: "error",
          error: {
            type: "error",
            message: "Failed to fetch image metadata",
          },
        },
      };
    }

    const data = await res.json();

    return {
      ok: true,
      data: data as SuccessClaudeResponse,
    };
  } catch (err) {
    console.log("Error in api executor===", err)
    return {
      ok: false,
      error: err as ErrorClaudeResponse,
    };
  }
};

async function getImageAsBase64String(
  imageUrl: string,
): Promise<ImageResponse<string, string>> {
  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      return {
        ok: false,
        error: "could not fetch image",
      };
    }
    const arrayBufer = await response.arrayBuffer();
    const base64String = Buffer.from(arrayBufer).toString("base64");
    return {
      ok: true,
      data: base64String as string,
    };
  } catch (error) {
    console.error("Error fetching image:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not fetch image",
    };
  }
}
