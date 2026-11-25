# QA report — baseline
Build/commit/device/browser: none. Every test below NOT_RUN; no screenshots or runtime evidence.
| ID | Scenario | Expected |
|---|---|---|
| Q01 | Boot and missing asset | Menu loads or actionable retry; no crash |
| Q02 | Move/dash/switch/focus loss | Collision respected; active chef clear; pause |
| Q03 | Repeated pickup/place | No duplicate/lost item |
| Q04 | Three recipes and invalid dish | Valid dishes match; raw/burnt rejected |
| Q05 | Cook boundaries and pause | Correct states; timer frozen on pause |
| Q06 | Orders expire/shift closes | Miss recorded; settlement once |
| Q07 | Staff path blocked/manual takeover | Task cancels, reservation released |
| Q08 | Buy/rearrange/undo | Correct cash; unreachable layout rejected |
| Q09 | Seven days, reload, corrupt save | Progress retained; recover safely |
| Q10 | Audio unlock/mute/visibility | No autoplay error, loops stop |
| Q11 | Resize/keyboard/reduced motion | HUD readable and accessible |
| Q12 | Final art gameplay screenshot | No placeholders/clipping, readable food |
| Q13 | Device FPS/load/memory | Record measured budgets and exceptions |
| Q14 | CI/deployed smoke/rollback | Verified URL and commit only after approval |
Defect template: ID, severity P0–P3, build, environment, repro, expected/actual, evidence, owner, regression test. Human playtest required for fun.

## v1.1 additions — NOT_RUN
Q15 interruption and hold progress; Q16 waste/plate preservation; Q17 HUD values equal state; Q18 invalid purchase/cancel/undo; Q19 content schema/ref/reachability/unlock validation; Q20 seating, queue and dirty plate lifecycle; Q21 save migration and rollback compatibility; Q22 challenge/endless isolated state. See production/FEATURE_ACCEPTANCE.md for expected behavior. Visual rubric in docs/VISUAL_TARGETS.md. For each run record test ID, commit, command, status, expected/actual, device/browser, screenshot/log path. No automated result recorded yet.
