import { Suspense } from "react";
import { BirdChecker } from "./components/bird-checker";

const Page = () => {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <BirdChecker />
    </Suspense>
  );
};

export default Page;
