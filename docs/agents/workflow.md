# Workflow

Claude Code and Codex share one workflow. Work state lives in the repo (OpenSpec changes, `CONTEXT.md`, ADRs), so either agent can pick up any phase from the files alone.

## Planning layer: OpenSpec

OpenSpec owns the proposal, design, specs, and task list of every planned change. Its `tasks.md` is the ticket list for that change, so planned work never becomes GitHub issues. Where a Matt Pocock skill overlaps with OpenSpec, use the OpenSpec one:

| Instead of      | Use                     |
| --------------- | ----------------------- |
| `/to-spec`      | `openspec-propose`      |
| `/to-tickets`   | the change's `tasks.md` |
| `/implement`    | `openspec-apply-change` |

## Change lifecycle

1. **`/grill-with-docs`**: sharpen the idea. Done when every open question has a decision and new domain terms are recorded in `CONTEXT.md`.
2. **`openspec-propose`**: in the same session as the grilling, with no `/clear` or `/compact` between them, so the proposal is built on the interview.
3. **`openspec-apply-change`**: one task at a time, test-first with `/tdd`. Check the task's box in `tasks.md` when its tests pass.
4. **`/code-review`**: run by the agent that did not implement the change.
5. **`openspec-archive-change`**: once every box in `tasks.md` is checked, so the change's delta specs land in `openspec/specs/`.

## Side paths

- Design question that needs a runnable answer (state model, UI) → `/prototype`, on a `prototype/<name>` branch.
- Hard bug, flake, or regression → `/diagnosing-bugs`.
- Incoming bug report or feature request on GitHub → `/triage`, then take it into the lifecycle at step 1.
- Codebase upkeep → `/improve-codebase-architecture`; a chosen opportunity enters the lifecycle at step 1.
- Huge, foggy effort that one grilling session cannot hold → `/wayfinder`; when the map clears, hand off to `openspec-propose`.

## Splitting work between agents

- Parallelise across changes: each agent owns one OpenSpec change on its own branch. `tasks.md` is a single file, so two agents applying the same change collide.
- Within one change, one agent implements and the other runs `/code-review`.
- Switching agent mid-phase → `/handoff`. At a phase boundary, the OpenSpec change itself is the handoff.
