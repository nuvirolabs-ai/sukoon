"use client";

import Link from "next/link";
import { ChevronDown, Search, UserRound } from "lucide-react";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { HOME_LIFE_SESSION_KEY, otherPlaces, primaryAskLines, resolveSelectedLifeId, shortLabel } from "@/lib/home-life-session";
import type { HomeCapture, HomeLife, HomeVisualSummary } from "@/lib/home-lives";
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
      upcoming: [],
      upcomingMoreCount: 0,
      upcomingMoreHref: null,
      recentChanges: [],
      visualSummary: null,
      place: { id: `house:${property.id}`, title: property.name, shortLabel: shortLabel(property.name), status: "", locality: location, dot: false },
      capture: [],
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
    }, 220);
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
  const calm = !ask && life.summary.headline === "Nothing needs you.";
  const shared = life.summary.headline === "Shared with you.";
  const askLines = ask ? primaryAskLines(ask, life.summary.headline) : null;
  const quiet = !ask && life.upcoming.length === 0 && life.recentChanges.length === 0;
  const places = otherPlaces(lives, life.id);

  return (
    <div className={`hv2${calm ? " is-calm" : ""}`} aria-busy="false">
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
          {quiet ? <h1 className="hv2-line">Everything is in order.</h1> : life.summary.headline ? <h1 className="hv2-line">{life.summary.headline}</h1> : null}
          {!quiet && life.summary.detail ? <p className="hv2-detail">{life.summary.detail}</p> : null}
          {!quiet && life.summary.progressPercent !== null ? (
            <span className="hv2-bar" aria-hidden="true"><span key={life.summary.progressPercent} style={{ width: `${life.summary.progressPercent}%` }} /></span>
          ) : null}
          {!quiet && life.summary.caption ? <p className="hv2-caption">{life.summary.caption}</p> : null}
          {!quiet && life.summary.situation ? <p className="hv2-situation">{life.summary.situation}</p> : null}
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
        {life.upcoming.length ? (
          <section className="hv2-week" aria-label="This week">
            <p className="hv2-kicker">This week</p>
            {life.upcoming.map((row) => (
              <Link key={row.subjectId} href={row.href}>
                <span>{row.title}</span>
                <small>{row.label}</small>
              </Link>
            ))}
            {life.upcomingMoreCount > 0 && life.upcomingMoreHref ? <Link href={life.upcomingMoreHref}>See week</Link> : null}
          </section>
        ) : null}
        {life.recentChanges.length ? (
          <section className="hv2-recent" aria-label="Recent changes">
            <p className="hv2-kicker">Recent changes</p>
            {life.recentChanges.map((row) => (
              <Link key={row.subjectId} href={row.href}>{row.title}</Link>
            ))}
          </section>
        ) : null}
        <VisualMoment summary={life.visualSummary} />
        {places.length ? (
          <section className="hv2-places" aria-label="Your places">
            <p className="hv2-kicker">Your places</p>
            <div className="hv2-places-row">
              {places.map((place) => (
                <button type="button" key={place.id} onClick={() => choose(place.id)}>
                  <strong>{place.shortLabel}</strong>
                  {place.status ? <small>{place.status}</small> : null}
                </button>
              ))}
            </div>
          </section>
        ) : null}
        <Capture actions={life.capture} />
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

function VisualMoment({ summary }: { summary: HomeVisualSummary | null }) {
  if (!summary) return null;
  if (summary.kind === "construction") {
    return (
      <section className="hv2-visual" aria-label="The build">
        {summary.photoHref ? <img src={summary.photoHref} alt={summary.photoAlt ?? ""} /> : null}
        <ol className="hv2-journey">
          {summary.journey.map((step) => <li key={step.label} className={`is-${step.state}`}>{step.label}</li>)}
        </ol>
        <p>{[summary.stageName, summary.milestoneName, summary.progressPercent !== null ? `${summary.progressPercent}%` : null].filter(Boolean).join(" · ")}</p>
      </section>
    );
  }
  if (summary.kind === "buying") {
    return (
      <section className="hv2-visual" aria-label="The purchase">
        {summary.you && summary.them ? <p>You {summary.you} · Them {summary.them}</p> : null}
        {summary.recorded && summary.toward ? <p>{summary.recorded} toward {summary.toward}</p> : null}
        {summary.openHandover !== null ? <p>{summary.openHandover} open</p> : null}
        {summary.phaseWord ? <p>{summary.phaseWord}</p> : null}
        {summary.nextVisit ? <p>{summary.nextVisitHref ? <Link href={summary.nextVisitHref}>Visit {summary.nextVisit}</Link> : `Visit ${summary.nextVisit}`}</p> : null}
      </section>
    );
  }
  if (summary.kind === "selling") {
    return (
      <section className="hv2-visual" aria-label="The sale">
        {summary.offers.map((offer) => <p key={offer.name}>{offer.name} {offer.amount}</p>)}
        {summary.privacy ? <p>{summary.privacy}</p> : null}
      </section>
    );
  }
  return (
    <section className="hv2-visual" aria-label="This house">
      {summary.photoHref ? <img src={summary.photoHref} alt="" /> : null}
      <p>{summary.name}</p>
      {summary.locality ? <p>{summary.locality}</p> : null}
      {summary.fact ? <p>{summary.fact}</p> : null}
    </section>
  );
}

function Capture({ actions }: { actions: HomeCapture[] }) {
  const [open, setOpen] = useState(false);
  if (!actions.length) return null;
  return (
    <div className="hv2-capture">
      <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>+ Record</button>
      {open ? (
        <div className="hv2-capture-menu" role="menu">
          {actions.map((action) => <Link key={action.label} href={action.href} role="menuitem" onClick={() => setOpen(false)}>{action.label}</Link>)}
        </div>
      ) : null}
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
