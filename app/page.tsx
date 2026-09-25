"use client";

import Link from "next/link";
import { ChevronDown, Search, UserRound } from "lucide-react";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { HOME_LIFE_SESSION_KEY, primaryAskLines, resolveSelectedLifeId, shortLabel } from "@/lib/home-life-session";
import type { HomeLife } from "@/lib/home-lives";
import { useReducedMotion } from "@/components/motion/useReducedMotion";

type HomeProperty = { id: string; name: string; city?: string | null; area?: string | null };
type HomePayload = {
  mode?: string;
  lives?: HomeLife[] | null;
  defaultLifeId?: string | null;
  properties?: HomeProperty[];
};

const sessionListeners = new Set<() => void>();

function subscribeSession(listener: () => void) {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

function readSession() {
  return window.sessionStorage.getItem(HOME_LIFE_SESSION_KEY);
}

function writeSession(id: string) {
  window.sessionStorage.setItem(HOME_LIFE_SESSION_KEY, id);
  sessionListeners.forEach((listener) => listener());
}

function fallbackLives(properties: HomeProperty[]): HomeLife[] {
  return properties.map((property) => {
    const location = [property.area, property.city].filter(Boolean).join(", ") || null;
    return {
      id: `house:${property.id}`,
      kind: "house",
      propertyId: property.id,
      projectId: null,
      candidateId: null,
      saleId: null,
      title: property.name,
      location,
      shortLabel: shortLabel(property.name),
      status: "",
      dot: false,
      destinationHref: `/property/${property.id}`,
      summary: { phaseWord: null, headline: property.name, detail: property.city ?? null, caption: null, progressPercent: null, situation: null },
      asks: [],
      moreCount: 0,
      moreHref: `/property/${property.id}`,
      latestChange: null,
    };
  });
}

export default function HomePage() {
  const reduced = useReducedMotion();
  const sessionId = useSyncExternalStore(subscribeSession, readSession, () => null);
  const [home, setHome] = useState<HomePayload | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [heldId, setHeldId] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [retry, setRetry] = useState(0);
  const switcherRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const controller = new AbortController();
    const load = () => {
      fetch("/api/home", { cache: "no-store", signal: controller.signal }).then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error?.message || "Home unavailable");
        setHome(body.data);
        setError("");
      }).catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setError(reason instanceof Error ? reason.message : "Home unavailable");
      });
    };
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      controller.abort();
      window.removeEventListener("focus", onFocus);
    };
  }, [retry]);

  const lives = home?.lives === null || home?.lives === undefined
    ? (home ? fallbackLives(home.properties ?? []) : [])
    : home.lives;
  const selectedId = resolveSelectedLifeId(lives.map((life) => life.id), sessionId, home?.defaultLifeId ?? null);
  const shownId = heldId && lives.some((life) => life.id === heldId) ? heldId : selectedId;
  const life = lives.find((item) => item.id === shownId) ?? null;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointer = (event: MouseEvent) => {
      if (!switcherRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  function choose(id: string) {
    setOpen(false);
    if (reduced || id === shownId) {
      setHeldId(id);
      writeSession(id);
      return;
    }
    setHeldId(shownId);
    setLeaving(true);
    writeSession(id);
    window.setTimeout(() => {
      setHeldId(id);
      setLeaving(false);
    }, 180);
  }

  if (error && !home) {
    return (
      <div className="hv2 hv2-state">
        <p>Home isn’t available right now.</p>
        <button type="button" className="hv2-button" onClick={() => { setError(""); setRetry((value) => value + 1); }}>Try again</button>
        <HomeNav middle={{ href: "/property/new", label: "Home" }} />
      </div>
    );
  }
  if (!home) return <HomeSkeleton />;
  if (!life) {
    if (home.mode === "shared") {
      return (
        <div className="hv2 hv2-state">
          <p className="hv2-line">Shared with you.</p>
          <HomeNav middle={{ href: "/property/new", label: "Home" }} />
        </div>
      );
    }
    return (
      <div className="hv2 hv2-state">
        <p className="hv2-line">Add a house to begin.</p>
        <Link href="/property/new" className="hv2-button">Add a house</Link>
        <HomeNav middle={{ href: "/property/new", label: "Home" }} />
      </div>
    );
  }

  const ask = life.asks[0] ?? null;
  const secondaries = life.asks.slice(1);
  const calm = !ask && life.summary.headline === "Nothing needs you.";
  const shared = life.summary.headline === "Shared with you.";
  const showSecondaries = secondaries.length > 0 || life.moreCount > 0;
  const askLines = ask ? primaryAskLines(ask, life.summary.headline) : null;

  return (
    <div className={`hv2${showSecondaries ? "" : " is-single"}${calm ? " is-calm" : ""}`} aria-busy="false">
      <header className="hv2-header">
        <div className="hv2-switcher" ref={switcherRef}>
          <button type="button" className="hv2-switcher-trigger" aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen((value) => !value)}>
            <span>{life.title}</span>
            <ChevronDown size={18} aria-hidden="true" />
          </button>
          {open ? (
            <div className="hv2-switcher-layer" role="presentation">
              <button type="button" className="hv2-scrim" aria-label="Close" onClick={() => setOpen(false)} />
              <div className="hv2-switcher-panel" role="dialog" aria-labelledby={titleId}>
                <span className="hv2-grabber" aria-hidden="true" />
                <p id={titleId} className="hv2-sr">Places</p>
                <LifeGroup label="Houses" lives={lives.filter((item) => item.kind === "house")} selectedId={life.id} onSelect={choose} />
                <LifeGroup label="Buying" lives={lives.filter((item) => item.kind === "buying")} selectedId={life.id} onSelect={choose} />
                <LifeGroup label="Selling" lives={lives.filter((item) => item.kind === "selling")} selectedId={life.id} onSelect={choose} />
                <Link href="/property/new" className="hv2-switcher-row hv2-add" onClick={() => setOpen(false)}>Add a house</Link>
              </div>
            </div>
          ) : null}
        </div>
        <div className="hv2-header-actions">
          <Link href="/search" aria-label="Search" className="hv2-icon"><Search size={21} /></Link>
          <Link href="/profile" aria-label="Profile" className="hv2-icon"><UserRound size={21} /></Link>
        </div>
      </header>
      <div className={`hv2-layout${leaving ? " is-leaving" : ""}`} key={life.id}>
        <section className="hv2-summary" aria-label="This place">
          {life.summary.phaseWord ? <p className="hv2-phase">{life.summary.phaseWord}</p> : null}
          {life.summary.headline ? <h1 className="hv2-line">{life.summary.headline}</h1> : null}
          {life.summary.detail ? <p className="hv2-detail">{life.summary.detail}</p> : null}
          {life.summary.progressPercent !== null ? (
            <span className="hv2-bar" aria-hidden="true"><span style={{ width: `${life.summary.progressPercent}%` }} /></span>
          ) : null}
          {life.summary.caption ? <p className="hv2-caption">{life.summary.caption}</p> : null}
          {life.summary.situation ? <p className="hv2-situation">{life.summary.situation}</p> : null}
        </section>
        {ask ? (
          <article className={`hv2-ask${ask.tier <= 1 ? " is-urgent" : ""}`}>
            <p className="hv2-eyebrow">{ask.eyebrow}</p>
            {askLines?.title ? <h2>{askLines.title}</h2> : null}
            {askLines?.reason ? <p>{askLines.reason}</p> : null}
            {askLines?.meta ? <p className="hv2-ask-meta">{askLines.meta}</p> : null}
            <Link href={ask.href} className="hv2-button">{ask.actionLabel}</Link>
          </article>
        ) : null}
        {shared ? <Link href={life.destinationHref} className="hv2-button hv2-open">Open</Link> : null}
        {life.latestChange ? (
          <Link href={life.latestChange.href} className="hv2-change">{life.latestChange.sentence}</Link>
        ) : <span className="hv2-change is-empty" />}
        {showSecondaries ? (
          <aside className="hv2-also" aria-label="Also">
            <p className="hv2-also-label">Also</p>
            {secondaries.map((row) => (
              <Link key={row.subjectId} href={row.href} className="hv2-secondary">
                <span>{row.title}</span>
                {row.meta ? <small>{row.meta}</small> : null}
                <span aria-hidden="true">→</span>
              </Link>
            ))}
            {life.moreCount > 0 ? <Link href={life.moreHref} className="hv2-more">{life.moreCount} more</Link> : null}
          </aside>
        ) : null}
      </div>
      <HomeNav middle={{ href: life.destinationHref, label: life.shortLabel }} />
    </div>
  );
}

function LifeGroup({ label, lives, selectedId, onSelect }: { label: string; lives: HomeLife[]; selectedId: string; onSelect: (id: string) => void }) {
  if (!lives.length) return null;
  return (
    <div className="hv2-group">
      <p>{label}</p>
      {lives.map((life) => (
        <button type="button" key={life.id} className={`hv2-switcher-row${life.id === selectedId ? " is-selected" : ""}`} onClick={() => onSelect(life.id)} aria-current={life.id === selectedId ? "true" : undefined}>
          <span>
            <strong>{life.title}</strong>
            {life.status ? <small>{life.status}</small> : null}
          </span>
          {life.dot ? <i className="hv2-dot" aria-hidden="true" /> : null}
        </button>
      ))}
    </div>
  );
}

function HomeNav({ middle }: { middle: { href: string; label: string } }) {
  return (
    <nav className="home-nav" aria-label="Home">
      <Link href="/" aria-current="page">Home</Link>
      <Link href={middle.href}>{middle.label}</Link>
      <Link href="/updates">Activity</Link>
    </nav>
  );
}

function HomeSkeleton() {
  return (
    <div className="hv2 hv2-skeleton" aria-busy="true" aria-label="Loading home">
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}
