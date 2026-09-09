Execute the current Weplan architecture task.

Before implementation:

1. Read `/AGENTS.md`.
2. Read `/docs/architecture/AGENTS.md`.
3. Read `/docs/architecture/agent/CURRENT-TASK.md`.
4. Read `/docs/architecture/agent/PROJECT-STATE.md`.
5. Read `/docs/architecture/agent/HANDOFF.md`.
6. Open only the task referenced by `CURRENT-TASK.md`.
7. Load only its `Required Context`.

Before modifying files, state:

- Current Task ID
- Goal
- Allowed Paths
- Files you expect to modify
- Acceptance Criteria
- Required Validation

If any planned file is outside Allowed Paths, STOP with `BLOCKER`.

Then implement only the current task.

Do not:

- expand scope;
- implement future tasks;
- change architecture;
- refactor unrelated code;
- change `CURRENT-TASK.md`.

After implementation:

1. Run required validation.
2. Confirm acceptance criteria one by one.
3. Update `PROJECT-STATE.md`.
4. Update `HANDOFF.md`.
5. Report:
   - files changed;
   - tests run;
   - results;
   - blockers/known issues.

6. STOP.
