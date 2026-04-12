---
name: do-work
description: Executes a unit of work in the goal-tracker-v2 repo - plan, implement, validate via type check and tests, then commit. Use when asked to implement a feature, fix a bug, or complete any development task in this repository.
---

# Do Work

## Workflow

### 1. Plan
Before touching any code:
- Read relevant files to understand current state
- Identify all files that need to change
- State the approach explicitly: what you'll add, modify, or remove and why
- Flag any assumptions or risks

### 2. Implement
Execute the plan:
- Make changes in logical order (types/interfaces before consumers)
- Keep changes scoped — do not fix unrelated issues or add unrequested improvements

### 3. Feedback Loop
Run in the affected workspace(s) — `backend/` and/or `frontend/` — based on what changed:

```bash
# Type check
cd backend && pnpm typecheck
cd frontend && pnpm typecheck

# Tests
cd backend && pnpm test
cd frontend && pnpm test
```

- If either fails: read the error, fix the root cause, re-run — do not suppress or work around errors
- Repeat until both pass with no errors

### 4. Commit
Use the `/commit-commands:commit` skill to stage and commit only the files changed for this unit of work.

## Rules
- Run feedback loops in the correct directory (`backend/` or `frontend/` or both)
- Never skip the feedback loop — passing type check and tests is required before committing
- Do not amend existing commits; always create a new one
