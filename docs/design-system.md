# Design System — Notion / Linear / Jira-grade Polish

> Source: NotebookLM research notebook "Project Manager UX — Notion/Jira Gap Analysis"
> (40 sources on Linear, Notion, Jira, Asana visual systems). This is the locked
> design direction for the web app (`apps/web`). The iOS app should mirror these
> tokens where practical.

## 1. Typography

- **UI / body:** Inter Variable.
- **Display / large headings:** Inter (tight tracking) — we use Inter for both to
  keep the bundle lean.
- **Mono:** for code, IDs, technical metadata — system mono stack / Geist Mono.
- **Weights:** 400 (regular), 500 (medium), 600 (semibold). Avoid heavier.
- **Scale (UI app, not marketing):**
  | Token | Size / line-height | Use |
  |---|---|---|
  | `text-2xl` | 24 / 1.2 | Page title (one per screen) |
  | `text-lg` | 18 / 1.4 | Section heading |
  | `text-sm` | 14 / 1.45 | Primary UI, body |
  | `text-xs` | 12.5 / 1.5 | Secondary labels, metadata |
  | `text-[10px]` | 10 / 1.5 | Micro / status pills |
- **Letter-spacing:** slight negative tracking on headings (`-0.01em` … `-0.02em`).
- Never more than 3 type sizes on a single screen (framework rule).

## 2. Spacing & density

- 4px base scale (framework rule), 8px rhythm for layout: 4, 8, 12, 16, 20, 24, 32, 48.
- Card padding: 16–24px. Element gap 8px; section gap 16–24px.
- Mobile: vertical stack ≤640px → denser horizontal at ≥1280px.

## 3. Color & accent

- Neutral-first, **restrained accent**. Primary action = desaturated indigo
  `#5e6ad2` (Linear). One accent only.
- Light theme is default; full dark theme supported via `.dark` tokens.
- Semantic status:
  | Status | Color |
  |---|---|
  | Success / healthy / income | green |
  | Warning / at_risk / on_hold | amber |
  | Delayed | orange |
  | Danger / blocked / overdue / expense | red (reserve for truly critical) |
  | Info / active | indigo/blue |
- Never pure `#000` — use `--color-gray-900`.

## 4. Avatars & iconography

- **Icons:** Lucide, stroke width 2, 16px (inline) / 20px (nav). Interactive icon
  buttons get a ≥40px touch target.
- **Avatars:** image with deterministic gradient + initials fallback. Sizes 20/24/28/32.
  User avatar sits at the top/identity position. Stacked avatar groups with `+N` overflow.

## 5. Cards & hierarchy

- **Flat elevation** — define edges with 1px borders, not heavy shadows (Linear).
  At most a subtle `shadow-sm` on raised surfaces.
- Radii: inputs/controls 8–10px, cards 12–16px, badges/tags pill (9999px).
- Never nest cards >2 levels (framework rule).

## 6. Empty states

- Never blank: icon + one-line headline + subtext + exactly one primary CTA.
- Prefer showing a preview/sample of the completed state.

## 7. Motion

- Durations 150–300ms; menus/popovers sub-200ms. Consistent easing
  (`cubic-bezier(0.2, 0, 0, 1)` ease-out).
- Animate: accordions, sidebar collapse, popovers, skeletons, hover/press states.
- Respect `prefers-reduced-motion`.

## 8. Sidebar

- Fixed left nav, flat hierarchy (≤2–3 levels), aligned icon + label.
- Identity (workspace/user) anchored; collapsible.

## 9. Command palette (Cmd/Ctrl+K)

- Search-as-you-type with match highlighting.
- Actionable, not just navigation: create project, jump to entity, change status.
- Show recents when opened empty.
</content>
</invoke>
