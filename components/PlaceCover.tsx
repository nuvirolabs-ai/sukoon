import Image from "next/image";
import type { ReactNode } from "react";

export function placeImage(input: { name?: string; type?: string }) {
  const name = (input.name || "").toLowerCase();
  const type = (input.type || "").toLowerCase();
  if (name.includes("vijay") || type === "villa") return "/places/place-house.png";
  if (name.includes("palm") || type === "flat") return "/places/place-flat.png";
  if (name.includes("corridor") || name.includes("plot") || type === "plot" || type === "agri") return "/places/place-plot.png";
  if (type === "commercial") return "/places/place-flat.png";
  return "/places/place-house.png";
}

export const SCENE = {
  build: "/places/place-build.png",
  papers: "/places/place-papers.png",
  dates: "/places/place-dates.png",
} as const;

export function Scene({ src, children, className = "" }: { src: string; children?: ReactNode; className?: string }) {
  return (
    <section className={`scene ${className}`.trim()}>
      <Image src={src} alt="" fill sizes="430px" style={{ objectFit: "cover" }} />
      {children ? <><div className="scene__shade" /><div className="scene__copy">{children}</div></> : null}
    </section>
  );
}
