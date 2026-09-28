---
name: DevsProject
description: A friendly student notebook — cream grid paper, navy ink, one confident blue, and a cat mascot — that keeps academic resources and experiences one tap away.
colors:
  ink-navy: "#021238"
  ink-soft: "#3d4459"
  muted: "#5a6178"
  action-blue: "#0261fe"
  link-blue: "#0a4de8"
  blue-tint: "#ecf2fe"
  page-cream: "#fdf3e5"
  sand: "#f1eee4"
  surface-white: "#ffffff"
  line-warm: "#e2d9c7"
  pink: "#fd4f8d"
  red: "#e01f63"
  orange: "#fa6304"
  gold: "#e9b949"
  green: "#187a5b"
typography:
  display:
    fontFamily: "Figtree"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.05em"
  body:
    fontFamily: "Figtree"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Figtree"
    fontSize: "0.72rem"
    fontWeight: 700
    letterSpacing: "0.15em"
  hand:
    fontFamily: "Caveat"
    fontWeight: 700
rounded:
  sm: "8px"
  md: "11px"
  lg: "14px"
  xl: "16px"
  pill: "999px"
components:
  button-primary:
    backgroundColor: "{colors.action-blue}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.md}"
    height: "44px"
  button-outline:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink-navy}"
    borderColor: "{colors.line-warm}"
    rounded: "{rounded.md}"
    height: "44px"
  button-pop:
    backgroundColor: "{colors.action-blue}"
    textColor: "{colors.surface-white}"
    borderColor: "{colors.ink-navy}"
    shadow: "3px 3px 0 {colors.ink-navy}"
    rounded: "{rounded.md}"
  card:
    backgroundColor: "{colors.surface-white}"
    borderColor: "{colors.ink-navy}"
    borderWidth: "1.5px"
    rounded: "{rounded.lg}"
---

# Design System: DevsProject

## Overview

The redesign lives in the Claude Design canvas **«DevsProject · Home»** (https://claude.ai/artifact/VwRuyScjfH3AjjpF2SPYaU). Its sources — one `.dc.html` artboard per screen plus the Python generators — are committed in `design/canvas/` at the repository root. When this document and the canvas disagree, the canvas wins; update this document.

The feel is a student's notebook: cream grid paper, navy ink, a single confident blue for actions, pastel labels per resource type, and a blue cat mascot that shows up in heroes and empty states. It is friendly without being a game: academic terms stay real (see `CONTEXT.md`).

## Tokens

`src/styles/tokens.css` is the only place colors, radii, outlines, the page grid and font stacks are declared (`--dp-*`). Components never read `--dp-*` directly; they use the semantic roles in `src/app/globals.css`, exposed to Tailwind through `@theme inline`:

| Role (Tailwind) | Token | Use |
|---|---|---|
| `background` | `--dp-page` | Page (with the faint navy grid: 32px below `lg`, 44px from `lg`) |
| `foreground`, `border`, `input` | `--dp-ink` | Text, card and control outlines |
| `card`, `popover` | `--dp-surface` | Cards, menus, sheets, fields |
| `primary`, `ring` | `--dp-blue` | Primary actions, focus rings, current bottom-bar item |
| `link` | `--dp-link` | Links and the current desktop menu item |
| `secondary` | `--dp-blue-tint` | Selected/hover backgrounds |
| `muted` / `muted-foreground` | `--dp-sand` / `--dp-muted` | Quiet surfaces / secondary text |
| `line` | `--dp-line` | Hairlines, outline-button borders |
| `accent` | `--dp-gold` | Highlights |
| `destructive` | `--dp-red` | Errors and destructive actions |
| `success` | `--dp-green` | Success states |
| `shadow-pop` | `--dp-shadow-pop` | Only the emphasized action (Subir) and floating menus |

`pnpm verify:design-tokens` fails if a canonical value drifts, a role stops pointing at a `--dp-*` token, or any Pixel Notebook leftover (`--pn-*`, `--color-primary-<n>`, `font-pixel`, `font-serif`, Press Start 2P) appears in `src/`.

Light theme only: `:root` declares `color-scheme: light`, and there is no dark mode.

## Typography

- **Figtree** (variable, via `next/font/google`) for every piece of text. Headlines are weight 800 with tight tracking (`-0.03em` to `-0.05em`, tighter as size grows). Body is 400–500, labels 600–700.
- **Caveat** (`font-hand`) only for decorative handwritten notes, never for body text, labels or controls.
- Eyebrow labels are small uppercase Figtree 700 with `0.15em` tracking, preceded by a small blue square.

## Shapes and elevation

- Outlines are 1.5px navy on cards and emphasized controls; outline buttons and hairlines use the warm `line` color.
- Radii: 8px (chips, small), 11px (buttons, fields — the default `rounded-md`), 14–16px (cards, sheets), pill for avatars.
- No soft drop shadows. The only elevation is the hard `shadow-pop` offset.

## Controls

Source-owned shadcn components in `src/components/ui/shadcn`:

- **Button**: `primary` (solid blue), `outline` (white, warm border, navy on hover), `secondary`, `ghost`, `destructive`, and `pop` (blue, navy outline, offset shadow that collapses on press). All sizes keep a 44px minimum touch target.
- **Chip**: rounded pastel label, weight 800, no border.
- **Input / Field**: white, 1.5px navy outline, 11px radius.
- **Breadcrumb**: inline links in `link` blue; no bar.
- **State panels, disclosure, filter sheet, dropdown menu**: white surfaces, 1.5px outline, rounded.
- Every interactive control shows `focus-visible:ring-[3px] ring-ring`.

## Application shell

- **Header** (`SiteHeader`): logo (open notebook, wordmark, blue ✦) · menu **Inicio · Materias · Experiencias** · search (to `/buscar`) · `Iniciar sesión` or the avatar pill · `Subir material` · the UNJU/FI mark (xl and up). The current menu item is blue, bold and underlined.
- **Account menu** (`AccountMenu`): avatar pill (user image or a default cat from `public/avatars/`). On desktop a dropdown; below `lg` a bottom sheet. Entries: Mi perfil, Mis envíos, Moderación (moderators and admins), Cerrar sesión.
- **Bottom bar** (`BottomBar`, below `lg`): Inicio · Materias · **Subir** (raised pop button) · Experiencias, fixed with safe-area padding. There is no hamburger menu.
- **Footer** (`SiteFooter`): brand, one-line description, the primary destinations and Subir material.
- **Variants** by route group: `(site)` full shell; `(focus)` (upload, write a reseña or final) without the bottom bar; `(auth)` only the reduced `AccessHeader`; `(prototype)` (the Pixel Notebook validation prototype) only the `<main>` landmark. `app/not-found.tsx` renders the full shell itself.
- Destinations come from `src/components/layout/navigation.ts`. Add a destination there only when its page exists.

## Do's and don'ts

**Do**
- Start from the matching canvas artboard before building a screen.
- Use semantic roles (`bg-card`, `border-foreground`, `text-link`) instead of hex values.
- Keep one primary blue action per view; use `pop` only for the most emphasized action.
- Use the cat mascot for heroes and empty states, with empty `alt` when decorative.

**Don't**
- Don't reintroduce Pixel Notebook styling (ruled paper, serif display, monospaced labels, square corners, pixel font).
- Don't add dark-mode styles.
- Don't link a destination before its page exists (no "Próximamente").
- Don't use Caveat for anything a user needs to read to complete a task.
