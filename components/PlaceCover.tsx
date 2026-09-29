import Image from "next/image";
import Link from "next/link";
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

const PAPER = {
  deed: "/places/paper-deed.png",
  tax: "/places/paper-tax.png",
  insurance: "/places/paper-insurance.png",
  map: "/places/paper-map.png",
  letter: "/places/paper-letter.png",
  receipt: "/places/paper-receipt.png",
} as const;

export function paperImage(type?: string) {
  const value = (type || "").toLowerCase();
  if (value.includes("insurance")) return PAPER.insurance;
  if (value.includes("tax") || value === "ec") return PAPER.tax;
  if (value.includes("map") || value.includes("measurement") || value.includes("property info")) return PAPER.map;
  if (value.includes("receipt")) return PAPER.receipt;
  if (value.includes("registry") || value.includes("chain") || value.includes("link") || value.includes("loan") || value.includes("deed")) return PAPER.deed;
  return PAPER.letter;
}

type PaperRef = {
  id: string;
  type: string;
  name: string;
  displayName?: string | null;
  propertyId?: string | null;
  deletedAt?: string | null;
  archivedAt?: string | null;
};

export function otherPaper<T extends PaperRef>(docs: T[], propertyId: string, skipId?: string) {
  const rows = docs.filter((doc) => doc.propertyId === propertyId && doc.id !== skipId && !doc.deletedAt && !doc.archivedAt);
  return rows.find((doc) => /tax receipt/i.test(doc.type)) || rows[0];
}

export function Scene({ src, children, className = "" }: { src: string; children?: ReactNode; className?: string }) {
  return (
    <section className={`scene ${className}`.trim()}>
      <Image src={src} alt="" fill sizes="430px" style={{ objectFit: "cover" }} />
      {children ? <><div className="scene__shade" /><div className="scene__copy">{children}</div></> : null}
    </section>
  );
}

export function NextBar({ kicker, title, href, action }: { kicker: string; title: string; href: string; action: string }) {
  return (
    <Link href={href} className="next-bar">
      <span>{kicker}</span>
      <strong>{title}</strong>
      <em>{action} <span aria-hidden="true">→</span></em>
    </Link>
  );
}
