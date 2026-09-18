import { Suspense } from "react";
import { ConstructionProjectScreen } from "@/components/ConstructionOS";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense>
      <ConstructionProjectScreen id={(await params).id} />
    </Suspense>
  );
}
