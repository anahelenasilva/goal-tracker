# PRD to Issues - Workout Tracker

Parent PRD: `docs/plans/workout_tracker/prd.md`

## Approved Vertical Slices

1. **Title**: Workout Module Spine + Replaceable Data Boundary  
   **Type**: HITL  
   **Blocked by**: None  
   **User stories covered**: FR38, FR39, FR41, FR42, FR43, FR44, Journey 3

2. **Title**: Session Lifecycle MVP (Start -> End -> History Outcome)  
   **Type**: AFK  
   **Blocked by**: #1  
   **User stories covered**: FR1, FR2, FR4, FR5, FR6, FR35, FR36, FR37, Journey 1

3. **Title**: In-Session Set Logging + Validation Recovery  
   **Type**: AFK  
   **Blocked by**: #2  
   **User stories covered**: FR3, FR7, FR8, FR9, FR10, FR11, FR12, FR40, Journey 2

4. **Title**: Exercise Library CRUD + Search in Logging Flow  
   **Type**: AFK  
   **Blocked by**: #1  
   **User stories covered**: FR13, FR14, FR15, FR16, FR17, FR40

5. **Title**: Training Plans End-to-End (List/Detail/Edit/Reorder/Delete)  
   **Type**: AFK  
   **Blocked by**: #1, #4  
   **User stories covered**: FR18, FR19, FR20, FR21, FR22, FR23, FR24, FR25, FR39

6. **Title**: History + Graph Insights Vertical Slice  
   **Type**: HITL  
   **Blocked by**: #2, #3  
   **User stories covered**: FR26, FR27, FR28, FR29, FR30, FR31, FR39

7. **Title**: Rest Timer Integrated with Workout Navigation  
   **Type**: HITL  
   **Blocked by**: #1  
   **User stories covered**: FR32, FR33, FR34, FR12, FR39

8. **Title**: Release Hardening (Parity, A11y baseline, Troubleshooting Readiness)  
   **Type**: HITL  
   **Blocked by**: #2, #3, #4, #5, #6, #7  
   **User stories covered**: FR45, FR46, FR47, FR48, Journey 3, Journey 4, MVP NFR baselines

## Suggested Issue Creation Order

1. #1 Workout Module Spine + Replaceable Data Boundary
2. #2 Session Lifecycle MVP (Start -> End -> History Outcome)
3. #3 In-Session Set Logging + Validation Recovery
4. #4 Exercise Library CRUD + Search in Logging Flow
5. #5 Training Plans End-to-End (List/Detail/Edit/Reorder/Delete)
6. #6 History + Graph Insights Vertical Slice
7. #7 Rest Timer Integrated with Workout Navigation
8. #8 Release Hardening (Parity, A11y baseline, Troubleshooting Readiness)

## Issue Body Template (per slice)

```md
## Parent PRD

#<prd-task-number>

## What to build

<Describe the end-to-end vertical behavior for this slice, referencing relevant PRD sections.>

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Blocked by

<None - can start immediately OR Blocked by #<issue-number>>

## User stories addressed

- <User story refs from PRD, e.g., FR1, FR2>
```
