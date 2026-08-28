---
name: DevsProject Pixel Notebook
description: A warm academic notebook interface with precise pixel-art accents and explicit trust hierarchy.
colors:
  action-cobalt: "#0069aa"
  action-cobalt-deep: "#00396d"
  canvas-cream: "#fff7eb"
  paper-peach: "#f9e6cf"
  ink-midnight: "#1a1932"
  muted-slate: "#657392"
  notebook-line: "#f6ca9f"
  structural-copper: "#bf6f4a"
  emphasis-orange: "#ff5000"
  annotation-gold: "#ffc825"
  materials-violet: "#7a09fa"
  success-green: "#33984b"
typography:
  display:
    fontFamily: '"Iowan Old Style", Charter, Georgia, serif'
    fontSize: "clamp(3rem, 7vw, 5.125rem)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-0.025em"
  body:
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.04em"
rounded:
  square: "0px"
components:
  button-primary:
    backgroundColor: "{colors.action-cobalt}"
    textColor: "{colors.canvas-cream}"
    rounded: "{rounded.square}"
    padding: "0 16px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.canvas-cream}"
    textColor: "{colors.action-cobalt-deep}"
    rounded: "{rounded.square}"
    padding: "0 16px"
    height: "44px"
  chip:
    backgroundColor: "{colors.canvas-cream}"
    textColor: "{colors.action-cobalt-deep}"
    rounded: "{rounded.square}"
    padding: "0 10px"
    height: "36px"
---

# Design System: DevsProject Pixel Notebook

## Overview

**Creative North Star: "The Pixel Notebook"**

The interface feels like a well-used FI-UNJU study notebook whose margin has opened into a precise pixel-art world. Warm ruled paper carries the work; editorial type makes academic decisions legible; cobalt controls keep actions unmistakable. RPG imagery supplies atmosphere and memory, never replacement terminology or game mechanics.

The system is expressive at page scale and restrained at control scale. Large route artwork and display headlines may create character, while lists, filters, trust disclosures, and actions remain square, compact, and operational. The initial production system is light-only.

**Key Characteristics:**

- Warm ruled-paper canvas with midnight text and copper structure.
- One dominant cobalt action per view.
- Editorial display hierarchy, plain system body copy, and compact mono labels.
- One-pixel borders, square corners, and crisp print-register depth.
- Pixel art is route identity; academic language remains literal.

## Colors

The palette is full but role-bound: cream and ink own the page, cobalt owns interaction, and route accents identify content families without redefining states.

### Primary

- **Action Cobalt:** Primary actions, links, focus, selected controls, and active navigation.
- **Deep Cobalt:** Hovered actions, strong informational text, and the `Reseñas`/`Finales` atmospheric family.

### Secondary

- **Emphasis Orange:** Editorial emphasis and error treatment where text/icon also communicates the state.
- **Annotation Gold:** Wavy annotations and small notebook highlights; never the primary action.
- **Materials Violet:** `Materiales` identity and artwork accents; never a generic status color.
- **Success Green:** Success confirmation only.

### Neutral

- **Canvas Cream:** Global background and light action text.
- **Paper Peach:** Selected chips and nearby tonal separation.
- **Ink Midnight:** Primary text, structural contrast, and pressed actions.
- **Muted Slate:** Secondary copy and metadata; keep contrast compliant at its actual size.
- **Notebook Line:** Ruled-paper lines and low-emphasis offset depth.
- **Structural Copper:** One-pixel borders, dividers, and print-like framing.

**The One Primary Rule.** Cobalt is the only generic primary action color. Route accents identify sections but never compete for action priority.

**The State Independence Rule.** Route accents cannot redefine success, warning, error, disabled, focus, or publication approval.

## Typography

- **Display Font:** Iowan Old Style with Charter, Georgia, and serif fallbacks
- **Body Font:** Native UI sans-serif stack
**Label/Mono Font:** Native UI monospace stack

**Character:** Editorial display type gives the notebook academic authority; the body stack keeps dense operational reading fast. Monospace is reserved for compact classification, provenance, and measurement—not as a costume for ordinary copy.

### Hierarchy

- **Display** (700, responsive up to 5.125rem, 0.95): One route-defining heading; italic accent is allowed when inherited from an approved prototype composition.
- **Headline** (700, responsive 2–3rem, about 1.02): Section titles and major detail headings.
- **Title** (700, about 1.375rem, 1.08): Resource, review, and final titles.
- **Body** (400, 1rem, 1.5): Instructions and narratives; keep long reading measures near 65–75 characters.
- **Label** (700, about 0.6875rem, 0.04em): Short metadata, status headings, and compact controls.

**The Literal Language Rule.** Typography may feel like a fantasy notebook, but labels say `Materia`, `Descargar`, `Reseñas`, and `Finales`—never loot, rarity, quests, or XP. Approved public materials do not carry a redundant `Revisado` label.

## Layout

The canonical wide container is capped at 1180px with 24px desktop gutters. Content groups use tight internal gaps and visibly larger separation between jobs. Search and the primary task lead the first viewport; decorative art may occupy substantial area only when the action and academic promise remain immediately reachable.

At 820px, multi-column structures collapse to one column and navigation becomes compact. Grouped suggestions stack before either column becomes cramped; at 520px, gutters reduce to 12px and composite search controls stack. Mobile order preserves academic context before file actions, with comments and secondary community content following the preview. Core views must survive 200% zoom without two-dimensional page scrolling.

**The Context Before Decoration Rule.** Artwork can dominate atmosphere, not reading order. A student must identify the materia, resource purpose, and next action without interpreting the scene.

## Elevation & Depth

Depth resembles misregistered print layers: short, crisp offsets paired with one-pixel borders. It is structural rather than ambient; soft floating dashboard shadows and glow are foreign to this world. Overlays may use backdrop treatment only when focus management requires a true interruption.

### Shadow Vocabulary

- **Control press:** `2px 2px 0` using ink or notebook line; active controls translate by the same distance and remove the shadow.
- **Grouped field:** `4px 4px 0` using notebook line to bind input and action as one task.
- **Surface register:** `3px 3px 0` using notebook line for bounded reference surfaces.

**The Printed Depth Rule.** Crisp offset depth belongs to interactive or explicitly bounded surfaces. Do not apply it to every section or use it as decorative card scaffolding.

## Shapes

Square corners and one-pixel borders define the system. Chips are compact rectangles, not pills. Artwork frames use the same geometry and may add pixel-corner ornament only when it comes from an approved asset or documented component. Native round avatars may remain circular where identity requires them; that exception does not spread to containers.

## Components

### Buttons

- **Shape:** Square with a one-pixel cobalt border and at least 44px height.
- **Primary:** Cobalt background, cream text, compact horizontal padding, and one crisp ink offset.
- **Hover / Focus:** Deep cobalt on hover; a 3px cobalt focus outline with 3px offset; pressed state translates 2px and removes depth.
- **Secondary:** Cream surface with deep-cobalt text and line-colored offset; hover may fill deep cobalt.
- **Disabled:** Preserve the label, remove pointer affordance, and reduce prominence without relying on opacity as the only status cue.

### Chips

- **Style:** 36px minimum height, square copper border, cream surface, deep-cobalt mono label.
- **State:** Selected uses paper peach plus cobalt border. Active filters remain visible and individually removable.

### Cards / Containers

- **Corner Style:** Square.
- **Background:** Canvas cream or paper peach when a selected/adjacent distinction is needed.
- **Shadow Strategy:** Surface-register depth only for a bounded item that benefits from physical separation.
- **Border:** One-pixel structural copper.
- **Internal Padding:** Compact enough for comparison; narrative cards may breathe more than result rows.

### Inputs / Fields

- **Style:** Transparent field inside a one-pixel bordered cream group; native font and at least 44px control height.
- **Focus:** Visible cobalt outline or an equivalent group-level focus-within treatment.
- **Error / Disabled:** Include plain-language text or iconography; error may tint the surface with emphasis orange but cannot rely on color alone.

### Navigation

Desktop navigation keeps the four primary destinations `Materias`, `Reseñas`, `Materiales`, and `Finales`, plus `Subir material` and account access. Active state uses text/icon treatment in addition to color. Mobile navigation exposes the same destinations through a keyboard-operable menu with managed focus.

### Breadcrumbs and material hierarchy

Material discovery follows stable `Materiales → Carrera → Año → Materia → Tipo de recurso` routes. Every nested level shows a linked semantic breadcrumb derived from the same route data as the page heading. Materia routes expose their own scoped search; unknown or intentionally bounded prototype levels use an honest empty state rather than fabricated records.

### Resource lists and preview dialog

Materia/category routes use compact, Drive-like file rows with type, academic context, stars, `Me sirvió`, and one clear preview action. Opening a file keeps the underlying list and URL state visible through `archivo=<materialId>` rather than navigating to a standalone detail page. The modal keeps file identity, close, and download reachable; desktop places preview beside comments, while mobile stacks them full-screen. Escape, outside click, focus containment/restoration, reload, and failed-preview fallback are required behavior.

### Hero Artwork

Only the active route's LCP image may be eager. Use generated AVIF/WebP candidates with explicit dimensions and `sizes`; source PNGs stay outside `public`. Decorative images use empty alternative text, while meaningful artwork receives a concise description.

## Do's and Don'ts

### Do:

- **Do** preserve the search-first path and one obvious primary action.
- **Do** show unknown academic metadata honestly as `No informado`.
- **Do** keep mandatory publication moderation distinct from public helpfulness, ratings, and recommendation stars; expose only approved files without adding a public moderation badge.
- **Do** use Lucide or authored SVG for functional icons with consistent stroke and sizing.
- **Do** record source, rights, modifications, generated variants, and consuming routes before shipping visual assets.
- **Do** provide loading, empty, error, retry, keyboard-focus, reduced-motion, and 200%-zoom behavior.

### Don't:

- **Don't** copy the fifth review reference's visual styling; only its useful content structure informed the product.
- **Don't** use PixelRepo packs or remote Glyphy content without individual provenance and the required attribution.
- **Don't** load inactive route art or use source PNGs as default production candidates.
- **Don't** turn every content group into an equal card or let decoration displace academic terminology.
- **Don't** introduce dark mode, professor ratings, gamification, perpetual decorative motion, gradient text, or glass styling in this change.
- **Don't** migrate untouched CSS Modules merely to make the implementation uniform.
