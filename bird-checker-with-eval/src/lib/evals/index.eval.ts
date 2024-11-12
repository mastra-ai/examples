import { Eval } from "braintrust";
import { IMAGES } from "./data";
import { BirdObj, getObjectFromString } from "../utils";
import { promptClaude } from "../mastra/actions";

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
        expected: IMAGES.notBird
      },
      {
        input: IMAGES.notBird.image,
        expected: IMAGES.isBird
      }
    ];
  },
  task: async (input) => {
    const claudeResponse = await promptClaude({ imageUrl: input });
    if (!claudeResponse.ok) {
      return { bird: "", location: "", species: "" };
    }
    const object = getObjectFromString(claudeResponse.data.content[0].text);

    return object;
  },
  scores: [containsScorer]
});
