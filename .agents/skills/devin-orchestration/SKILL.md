---
name: devin-orchestration
description: Claude Code orchestrates and Devin CLI does the work. Use before delegating any task (implementing OpenSpec tasks, fixes, research, test or build runs) and for the `/code-review` step of the change lifecycle.
---

# Devin orchestration

Claude Code is the **orchestrator**. Devin CLI is the **worker** for every delegated task, and Devin CLI on Claude Fable 5.2 is the **reviewer** in the change lifecycle of `docs/agents/workflow.md`.

## Roles

| Role | Who | Owns |
|---|---|---|
| Orchestrator | Claude Code (this session) | Questions to the user, decisions, briefs, verifying every result, `tasks.md` checkboxes, git (commit, push, PR), archive |
| Worker | `devin -p` on Devin's configured default model | Code, tests and docs of one brief; running the commands the brief names |
| Reviewer | `devin -p --model claude-fable-5-2-high` | The fresh-eyes `/code-review` of a change, read-only |

The orchestrator never hands a worker a decision that belongs to the user. A worker that hits one stops and reports it.

## Worker

1. Write the **brief** to a file in the session scratchpad (`brief-<slug>.md`). It names:
   - the change and task IDs, by reference: «Read `openspec/changes/<name>/{proposal,design,tasks}.md` and its `specs/`, then do tasks 2.1–2.3», never a paraphrase of them;
   - the allowed edit surface (paths or narrow globs), one per line;
   - the test-first rule: write or extend the test, see it fail, implement, see it pass;
   - the exact commands to run and where their logs go (`.audit-logs/<slug>-*.log`);
   - the hard limits: no git commands that change state, no database reset or seed, no push, no edits outside the surface;
   - the return format: per task, files changed, commands run with exit code and summary line, and anything blocked.
2. Run it from the repo root, in the background:

   ```bash
   devin -p --prompt-file "<scratchpad>/brief-<slug>.md" --permission-mode smart \
     > "<scratchpad>/worker-<slug>.out" 2>&1
   ```

   `smart` auto-runs commands a fast model judges safe; a rejected command makes the worker report `BLOCKED`, and the orchestrator runs it or narrows the brief. `accept-edits` cannot run tests in print mode, and `dangerous` needs the user's go-ahead for that run.
3. **Verify** before accepting:
   - `git status` and `git diff --stat` stay inside the surface;
   - read the diff of the behavior that matters;
   - re-run one of the reported commands yourself.

   Check the task's box in `tasks.md` only after that.

Two workers run in parallel only with disjoint edit surfaces, and only one of them may run backend e2e suites at a time: they share the `_e2e` database.

## Test and build runs

A suite run is a worker brief with only commands in it: «run these, write each to its log, report command, exit code, duration, summary line, and the smallest failing excerpt». Split the backend Vitest e2e suite into two batches of files; one run can exceed the 10-minute tool limit. Load `apps/backend/.env` into the shell first (`set -a; . ./.env; set +a`), or the e2e setup fails with «Define DATABASE_URL».

## Reviewer

Run the reviewer once every task of a change is checked and before `openspec-archive-change`.

1. Write the review brief:
   - read the change's proposal, design, `specs/**` and `CONTEXT.md`;
   - review `git diff <base>...HEAD` plus untracked files, where `<base>` is the branch point of the change;
   - report correctness bugs and spec deviations only: rules not implemented or implemented differently, anonymity leaks, data exposure, missing tests for a spec scenario, tautological tests, unbounded queries;
   - output a ranked list, each finding with `file:line`, the defect, a concrete failure scenario, the violated spec line, and `CONFIRMED` (traced in code) or `PLAUSIBLE`;
   - read-only: no edits, no state-changing git, no tests or database commands.
2. Hash the tree, run the reviewer, and hash again:

   ```bash
   { git diff; git ls-files --others --exclude-standard | xargs cat; } | md5sum
   devin -p --prompt-file "<scratchpad>/review-<change>.md" \
     --model claude-fable-5-2-high --permission-mode auto \
     > "<scratchpad>/review-<change>.out" 2>&1
   ```

   `auto` approves read-only tools only, so the reviewer can read files and run `git diff` but not edit. The two hashes must match.
3. **Triage** every finding against the code and the spec yourself. Drop the ones that do not hold, and say why in one line.
4. Send the confirmed findings to a worker as one fix brief, test-first, then re-run the change's checks.
5. Run the reviewer once more, scoped to the fixed findings only. Findings still open after that go to the user as one decision; new findings from the second pass are follow-ups, not another loop.
6. Record the review and its outcome at the end of the change's `tasks.md`.
