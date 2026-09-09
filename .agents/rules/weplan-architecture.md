# Weplan Architecture Guardrails

This workspace follows a fixed software architecture.

Before making any code change:

1. Read `/AGENTS.md`.
2. Read `/docs/architecture/AGENTS.md`.
3. Read `/docs/architecture/agent/CURRENT-TASK.md`.
4. Read `/docs/architecture/agent/PROJECT-STATE.md`.
5. Read only the task file referenced by `CURRENT-TASK.md`.
6. Read only that task's `Required Context`.

## Hard Rules

- Work only on the current task.
- Do not implement future tasks.
- Do not repeat completed tasks.
- Do not modify files outside the current task's `Allowed Paths`.
- Do not invent requirements, features, abstractions, APIs, database structures, dependencies, or architecture decisions.
- Architecture decisions are source of truth.
- Do not replace specified technologies because you prefer another solution.
- Do not perform repository-wide refactors or audits unless explicitly required by the current task.
- Do not read the entire architecture specification unless the current task explicitly requires it.
- Do not modify `CURRENT-TASK.md`.
- Do not automatically proceed to the next task.

If implementation requires:

- a file outside `Allowed Paths`,
- a new architecture decision,
- a conflicting requirement,
- a database/schema change not authorized by the task,
- a dependency not already allowed,

STOP and report `BLOCKER`.

Do not work around the blocker.

## Completion

Before declaring completion:

- satisfy every Acceptance Criterion;
- run every Required Validation;
- update `PROJECT-STATE.md`;
- update `HANDOFF.md`;
- report changed files and validation results;
- STOP.

Architecture > model preference.
Scope > initiative.
Current task > future improvements.
