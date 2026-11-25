# Feature acceptance and regression matrix
All tests NOT_RUN until real execution. Unit (U), browser/integration (B), human/visual (H), deployment (D). Use seeded RNG, simulated clock, explicit fixtures, no sleeps for rule checks. Each bug adds regression test.
| Feature / backlog | Given / when / then | Tests |
|---|---|---|
| Foundation M0-01/03 | Clean checkout → install/build/test → boot or actionable retry; no secrets or broken paths | Q01 B, Q19 U |
| Visual feasibility M0-02 | Concept board and planned ledger → review → no claim runtime asset exists, exact creation path | Q12 H |
| Movement M1-01 | Chef at wall → move/dash → no penetration; Q switch preserves held item; focus loss clears keys | Q02 U/B |
| Transfers M1-02 | Occupied slot or repeated E → no duplicate/lost item, atomic owner invariant | Q03 U/B |
| Cooking M1-02 | Patty at 7.99/8/12/12.01/16/16.01s → raw/perfect/perfect/overcooked/overcooked/burnt; pause freezes | Q05 U/B |
| Recipes M1-03 | Clean plate exact ingredients → match oldest ticket once; raw/burnt/extra/wrong rejected; overcooked reduced tip | Q04 U/B |
| Shift M1-03/04 | Expiry/closing/restart → misses correct, settlement once, no extra revenue, next day reachable | Q06 U/B |
| Preview M1-05 | Approved commit → build candidate and optional dispatch → actual smoke and recorded URL only after authorization | Q14 D |
| Art M2-01/02 | Loaded actual GLBs → all required states distinguishable; sockets/scale/materials correct, verified rights | Q12 H/B |
| Animation/UI/audio M2-03 | Action interruption / pause / mute / resize → no logical side effects, visual and audio cue correct | Q10/Q11/Q15/Q17 B/H |
| Staff/customer M2-04 | Blocked path/switch/full tables → reservation released, queue bounded, dirty plate returns once | Q07/Q20 U/B |
| Management M2-05 | Insufficient cash/unreachable layout/cancel/undo → no partial purchase; valid commit atomic | Q08/Q18 U/B |
| Persistence M2-05/06 | Seven days, reload, corrupt/old save → preserve valid backup, no double settlement | Q09/Q21 U/B |
| Trash M1-02 | Deliberate discard → waste recorded, plate retained, no accidental deletion | Q16 U/B |
| Performance M2-06/M5 | Representative busy shift on recorded hardware → measured load/FPS/frame time; exceptions explicit | Q13 H/B |
| Content M3/M4 | Add valid pack / invalid reference / unlock cycle → valid pack loads; invalid rejected with precise errors | Q19 U/B |
| Modes M3 | Challenge fixed seed and goal, endless threshold, isolated mode save → no career currency leakage | Q22 U/B |
| Release M5 | Authorized deploy and rollback → version visible, URL smoke, save compatibility checked | Q14/Q21 D |
