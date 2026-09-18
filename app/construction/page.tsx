import { Suspense } from "react";
import { ConstructionHome } from "@/components/ConstructionOS";
export default function Page() {
  return (
    <Suspense>
      <ConstructionHome />
    </Suspense>
  );
}
