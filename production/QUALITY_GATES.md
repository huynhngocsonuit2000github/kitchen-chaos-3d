# Quality gates v1.1
G0 and G1 are PASS. G2–G4 are NOT_RUN.
| Gate | Type | Required evidence | Stop condition |
|---|---|---|---|
| G0 | Human | GDD/blueprint/defaults, visual targets, tool feasibility, asset rights plan, initial acceptance/test plan and M0 checks | Producer approves scope and target before M1 |
| G1 | Evidence | Complete prototype shift, three recipes, invalid actions, pause, restart, loss, screenshot and actual build/test results; labeled graybox | No core blocker; M1 preview eligible only after publication authorization |
| G2 | Human | Final Burger Town art score >=3 each, verified ledger, full 7-day career, human fun test, UI/audio/animation, measured device budgets, no P0/P1 | Producer accepts before any expansion |
| G3 | Evidence | All approved scope traceable to regression tests, no P0/P1 or unapproved placeholders; migration/content checks | Release candidate only after pass |
| G4 | Human | Clean CI, approved deployed smoke, browser/device metrics or exceptions, credits, save/restart, rollback drill | Producer release approval |
Record status PASS/FAIL/BLOCKED/NOT_RUN, build/commit, criteria, actual evidence, exceptions and owner. A build alone is never gate pass. G1/G3 do not require extra pause when next scope explicitly authorized; G0/G2/G4 cannot be bypassed. No approval implied by prior chat for publication or cost. If deployment unavailable G4 remains blocked, not pass.

## G0 review — 2026-11-25

Foundation commit `4f739fd`. Local build, browser smoke, fixture validation and asset feasibility evidence are in [QA_REPORT.md](../reports/QA_REPORT.md). The Producer owns approval of the working GDD/blueprint defaults, Max/Lina and Burger Town visual targets, original-first asset sourcing, and the acceptance plan. M1 begins after G0 approval and authorization.

## G0 decision — PASS

2026-11-25 · Producer approved the current gameplay defaults, visual targets, acceptance plan and original-first sourcing strategy. The M0 evidence remains linked above.

## G1 decision — PASS

2026-11-25 · Verified source `5d818427a52abe377f77cd54561952be327d4343`. A full seeded shift runs through delivery of all three burger recipes, invalid delivery recovery, loss, pause, restart and settlement. The production build passed local checks, and screenshots show the labeled original graybox assets. [Run logs and captures](../reports/evidence/5d81842/README.md) · [QA status and limitations](../reports/QA_REPORT.md).

Producer owns the M2 scope decision and any Pages publication approval. The G1 decision covers the local prototype. Customer seating, premium art and human playtesting are tracked at G2.
