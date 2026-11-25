# Quality gates v1.1
All NOT_RUN at handoff. Concept generation and package audit are not game evidence.
| Gate | Type | Required evidence | Stop condition |
|---|---|---|---|
| G0 | Human | GDD/blueprint/defaults, visual targets, tool feasibility, asset rights plan, initial acceptance/test plan and M0 checks | Producer approves scope and target before M1 |
| G1 | Evidence | Complete prototype shift, three recipes, invalid actions, pause, restart, loss, screenshot and actual build/test results; labeled graybox | No core blocker; M1 preview eligible only after publication authorization |
| G2 | Human | Final Burger Town art score >=3 each, verified ledger, full 7-day career, human fun test, UI/audio/animation, measured device budgets, no P0/P1 | Producer accepts before any expansion |
| G3 | Evidence | All approved scope traceable to regression tests, no P0/P1 or unapproved placeholders; migration/content checks | Release candidate only after pass |
| G4 | Human | Clean CI, approved deployed smoke, browser/device metrics or exceptions, credits, save/restart, rollback drill | Producer release approval |
Record status PASS/FAIL/BLOCKED/NOT_RUN, build/commit, criteria, actual evidence, exceptions and owner. A build alone is never gate pass. G1/G3 do not require extra pause when next scope explicitly authorized; G0/G2/G4 cannot be bypassed. No approval implied by prior chat for publication or cost. If deployment unavailable G4 remains blocked, not pass.
