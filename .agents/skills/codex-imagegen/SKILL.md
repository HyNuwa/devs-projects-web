---
name: codex-imagegen
description: Generate or edit raster images by delegating to the Codex CLI's built-in image_gen (no API key). Use when a task needs a generated bitmap (website section references, mobile screen concepts, photos, illustrations, mockups, assets) or when image-to-code, imagegen-frontend-web or imagegen-frontend-mobile say to generate images.
---

# Codex image generation

Claude has no image model here; Codex does. This skill hands a **brief** to `codex exec`, Codex generates with its `$imagegen` skill (built-in `image_gen`, billed to the ChatGPT plan, no `OPENAI_API_KEY`), saves the finals into an output folder, and you read them back.

## 1. Pick the Codex skill

Codex already has these skills installed (`~/.codex/skills/.system/imagegen`, `~/.agents/skills/*`), so name one and let Codex follow it:

| `-Skill` | Use for |
| --- | --- |
| `imagegen` (default) | One-off images: photos, illustrations, product shots, textures, icons, transparent cutouts, edits of an existing image |
| `imagegen-frontend-web` | Website/landing design references: **one horizontal image per section** |
| `imagegen-frontend-mobile` | App screen concepts and flows inside a phone mockup |
| `image-to-code` | Web design references meant to be built next. Codex runs only the image phase; **you** implement afterwards |

## 2. Write the brief

Codex starts cold, so the brief carries everything it cannot see:

- Goal and where the image is used (hero, section 3 of 8, onboarding screen, OG image...).
- Product context: what it is, audience, tone. Pull brand colors, fonts and existing copy from the repo yourself and paste the values.
- The **deliverable list**: every section/screen/asset by name, so the count is explicit.
- Exact on-image text, in quotes.
- Constraints and avoid list.
- For each file passed with `-Images`, its role: `reference` (style/composition) or `edit target` (keep everything except X).

## 3. Run

```powershell
& ".agents\skills\codex-imagegen\run.ps1" -OutDir "<absolute folder>" -Skill imagegen-frontend-web -PromptFile "<brief.md>"
```

- `-Prompt "<text>"` works instead of `-PromptFile` for short briefs; write long briefs to a file in the scratchpad.
- `-Images a.png,b.png` attaches reference or edit-target images.
- `-Effort low|medium|high|xhigh` (default `medium`). Use `low` for quick drafts.
- `-OutDir`: the path the user named; otherwise the project's assets folder for assets that ship, or the scratchpad for throwaway design references.
- Expect about 2–3 minutes per image. For more than one image, run it with `run_in_background` and wait for the notification.

The script prints the exit code, duration, the saved image paths and the log folder. A path printed as `invalid=` is a file Codex wrote incompletely (a truncated PNG or JPEG); never use it.

Codex's sandbox often cannot read its own image store, so it can fail to save images it did generate. The script copies every image produced during the run into `<OutDir>\_generated\` and prints each one as `generated=`. Exit code 3 means no valid `image=` came back: pick from the `generated=` files (each regeneration Codex attempted is one of them) before re-running the brief. The full Codex JSONL log stays in that folder. Read it only on failure, starting from the tail. An `rmcp ... AuthRequired` line from the Tavily MCP on stderr is harmless.

## 4. Verify

Read every returned image. The step is done when every item on the deliverable list has its own image and each one matches the brief: subject, layout, palette, legible and correctly spelled text, invariants kept.

For a miss, run again with **one targeted change** in the brief and the previous image passed via `-Images` as `edit target`. Codex saves new versions (`-v2`) next to the old ones.

## 5. Hand off

- Report the final paths and which Codex skill was used.
- For `image-to-code`, continue with that skill's analysis and implementation phases, treating these images as the design source.
