## Token-efficient verification

- Do not stream verbose successful build, migration, reset, or test output into the conversation.

- Capture complete verification output in an ignored local artifact.

- Report only the command, exit status, duration, suite summary, warnings, and relevant failure excerpt.

- On failure, inspect the smallest useful log section first and expand only when needed.

- Preserve full logs locally when they are required as evidence.

- When a verification command is still running, inspect its artifact only after completion. Read the smallest useful failure excerpt; never load full passing artifacts unless exact evidence is required.

- Before loading long skill, browser, or tool documentation, read only the required instructions. If the tool requires its full documentation, keep it out of user-facing updates and summarize only the rules relevant to the task. Do not reload the same documentation in the same task.

## Using agents

- Use sub-agents only when the work clearly benefits from independent parallel tasks.

- Use no more than 2 agents in total, including the primary agent.

- Only use agents in the highest thinking modes in Sol (extra high, max and ultra).

- Sub-agents must not create additional sub-agents.

- Keep small or tightly connected tasks with the primary agent.

## Efficient tool batching

In Code Mode, within each bounded stage, run independent, functions.exec-available tool calls concurrently in one functions.exec call. Use await Promise.allSettled([...]) when partial results are useful, and inspect every result; use await Promise.all([...]) only when any failure should abort the batch. Keep dependencies, waits/resumes, approvals, conflicting or interdependent mutations, and adaptive investigations where each result may change the next step sequential. Do not split otherwise batchable inspections across outer tool calls.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Agent skills

### Issue tracker

Issues and specs are tracked in GitHub Issues using the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repository with root-level domain documentation. See `docs/agents/domain.md`.
