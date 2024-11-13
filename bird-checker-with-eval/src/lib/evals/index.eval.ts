import { Eval } from "braintrust";
import { IMAGES } from "./data";
import { BirdObj } from "../utils";
import { getImageMetadataFromClaude } from "../mastra/system-apis";

export function getObjectFromString(text: string): BirdObj {
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

  return {
    bird: bird?.trim(),
    location: location?.trim(),
    species: species?.split("}")?.join("")?.trim()
  };
}

const containsScorer = ({
  output,
  expected
}: {
  output: BirdObj;
  expected: Omit<BirdObj, "location">;
}) => {
  const birdDataCorrect = output?.bird
    ?.toLocaleLowerCase()
    ?.includes(expected?.bird?.toLocaleLowerCase());
  const speciesDataCorrect = output?.species
    ?.toLocaleLowerCase()
    ?.includes(expected?.species?.toLocaleLowerCase());

  return {
    name: "containsScorer",
    score: birdDataCorrect && speciesDataCorrect ? 1 : 0
  };
};

Eval("Is a bird", {
  data: () => {
    return [
      {
        input: IMAGES.isBird.image,
        expected: IMAGES.isBird
      },
      {
        input: IMAGES.notBird.image,
        expected: IMAGES.notBird
      }
    ];
  },
  task: async (input) => {
    const claudeResponse = await getImageMetadataFromClaude({ imageUrl: input });
    if (!claudeResponse.ok) {
      return { bird: "", location: "", species: "" };
    }
    const object = getObjectFromString(claudeResponse.data.content[0].text);

    return object;
  },
  scores: [containsScorer]
});
