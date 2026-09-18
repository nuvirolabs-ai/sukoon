# SUKOON Motion System

Single source of truth for consumer interaction discipline. Implementation:
`components/motion/` + the motion section of `app/globals.css`. Zero animation
dependencies. Visual identity (warm cream, forest green, logo, IA) is unchanged;
this system governs *behavior*, not brand.

## Design contract

- **Content** is calm and stable. **Controls** are fluid. **Navigation** is
  spatial and alive. Data is summarised, never deleted for animation.
- Motion explains where you came from, where you are going, what changed.
  Never animate merely to decorate. No bounce, no confetti, no全屏 drama.
- All motion work is transform/opacity-only (60fps), capped stagger
  (first 6 items), rAF-throttled scroll observation, restrained blur
  (nav / sticky bars / sheet backdrop only — never content cards).

## Tokens (centralized in `:root`)

| Token | Value | Use |
|---|---|---|
| `--motion-fast` | 140ms | Press feedback, badge morphs, chevron nudges |
| `--motion-standard` | 220ms | Entrances, stagger cascade (40ms steps), exits |
| `--motion-slow` | 360ms | Sheet spring, progress reveals |
| `--motion-ease-out` | `cubic-bezier(0.22,0.61,0.36,1)` | Passive appearance |
| `--motion-ease-spring` | `cubic-bezier(0.32,0.72,0,1)` | Direct manipulation |

Every component consumes these variables — no hardcoded per-component durations.

## Primitives (`components/motion/`)

| Primitive | Role |
|---|---|
| `MotionPage` (`PageTransition`) | Fast fade+rise route entrance, keyed by route section; interruptible; no full-screen animation |
| `Pressable` / `.motion-pressable` | Instant tactile compression (`scale(.97)`), rows/btns/cards/icon-buttons |
| `MotionSheet` | Spring bottom sheet: grabber + drag-to-dismiss, dim/blur backdrop, safe areas, focus trap, Esc, backdrop-tap, focus restore |
| `AnimatedList` / `AnimatedItem` | Restrained enter stagger + scroll reveal; instant unmount |
| `AnimatedRemovalList` | `AnimatedList` + **opt-in** 220ms exit (`allowExit`, default off) |
| `AnimatedSegment` | Gliding selected capsule for filters/tabs (button + link modes) |
| `FloatingChrome` (`useScrollState`) | Scroll-aware chrome: nav compacts on scroll-down, expands on scroll-up, never hides |
| `MotionStatus` (`StatusTransition`) | Badge morph/crossfade on value change; `PipelineSteps` for honest staged progress (no fake %) |
| `Toast` (`ToastProvider`, `useToast`) | One compact status surface; generic messages only; auto-dismiss; cleared on logout |
| `Skeleton` + layout skeletons | Layout-matching placeholders (`Home/List/Vault/Construction/Purchase/Updates`); static under reduced motion |
| `CollapsingHeader` | Large title → compact sticky bar (crossfade + 8px slide, no hard swap) |
| `useReducedMotion`, `useRevealList` | `prefers-reduced-motion` store subscription; shared reveal observer |

## Private-data motion policy (binding)

**Authorization and scope boundaries always win over animation.** Private content
must disappear *immediately* — never held mounted to animate an exit — when:

- authorization changes / permission is lost;
- a share is revoked;
- the user signs out or the account switches;
- search scope changes (query, filters, account);
- a document becomes inaccessible;
- the account/property context switches;
- a Vault filter or scope change removes private rows;
- a private search result or private document is removed.

Concretely enforced:

1. `AnimatedRemovalList` defaults to **immediate unmount** (`allowExit = false`).
   `allowExit` may only be set for ordinary, **non-sensitive** cosmetic changes
   with a code comment justifying it. No current consumer list uses exits:
   Home attention, Vault documents, Search results and Updates groups all
   unmount instantly.
2. `StatusTransition`/`PipelineSteps`/journey steppers remount on key change —
   the old badge unmounts immediately; only the new value animates in.
3. `PageTransition` unmounts the previous route immediately on navigation.
4. Toasts carry **generic messages only** (no names, amounts, document titles);
   the provider unmounts with the authenticated shell on logout, which clears
   all transient status. Auto-dismiss (2.8s) bounds lifetime further.
5. Sheets unmount their content when closed; the 180ms close animation only
   runs for the already-visible session-owned content, never across a context
   change (context changes unmount the tree synchronously).

For ordinary non-sensitive state updates, safe layout transitions (capsule
glides, crossfades, steppers, toasts) remain allowed.

## Reduced motion

`prefers-reduced-motion: reduce` disables entrances, stagger, shimmer, sheet
spring and toast slide globally (durations collapse to 0.01ms; skeletons go
static). All state remains understandable from text/status alone; sheets, nav
and progress stay fully usable. Verified by emulated-media probe + screenshots.

## Performance rules

- Prefer transform/opacity; never animate layout properties per-frame.
- No stagger past 6 items; long lists (37 tasks, 76+ events) reveal on scroll.
- Blur only on nav bars, sticky headers, sheet backdrops — small surfaces.
- Animations never block clicks/navigation; idempotent mutations unchanged.
- Scroll probes on Home / Vault / Plan / Updates / Purchase must show no
  longtasks with the full demo dataset.
