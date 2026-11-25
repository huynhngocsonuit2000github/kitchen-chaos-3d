# Backlog

| ID | Player outcome | Priority | Milestone | Dependencies | Acceptance | Status |
|---|---|---|---|---|---|---|
| M0-01 | Bootstrap Vite/TS/Three.js and test scripts | P0 | M0 | none | npm ci/typecheck/lint/test/build and browser boot pass; record versions; no gameplay scope | done |
| M0-02 | Validate asset sourcing and hero target | P0 | M0 | M0-01 | Inspect included visual targets; prove tool/asset feasibility, record rights and missing assets | done |
| M0-03 | Adopt CI templates and validate content fixtures | P0 | M0 | M0-01 | Actual CI or local equivalent; schema example review; G0 evidence | done |
| M1-01 | Movement, grid collision, input and switching | P0 | M1 | G0 | WASD/E/Q work; no wall traversal; focus loss pauses | planned |
| M1-02 | Atomic item transfers and station state | P0 | M1 | M1-01 | No duplication on repeated input; chop/cook/wash timers deterministic | planned |
| M1-03 | Orders, recipes, serving and shift results | P0 | M1 | M1-02 | Complete three recipes; wrong/raw rejected; closing settles once; restart works | planned |
| M1-04 | Graybox playtest and G1 | P0 | M1 | M1-03 | Full shift evidence plus screenshot; pause/restart/lose tested | planned |
| M1-05 | Prepare authorized preview candidate | P1 | M1 | M1-04 | Dist artifact, build label, deployment checklist; publish only with authorization | planned |
| M2-01 | Hero chef and kitchen asset pack | P0 | M2 | G1 | Verified licensed GLBs, rig, scale, materials and gameplay screenshot | planned |
| M2-02 | Food models and state visuals | P0 | M2 | G1 | All three dishes and ingredient states visually distinct; no placeholders | planned |
| M2-03 | Animation, VFX, HUD and audio | P0 | M2 | M2-01,M2-02 | Interaction clips and cues verified; no occlusion/clipping/loop leaks | planned |
| M2-04 | Staff tasks and customer seating | P0 | M2 | M1-04 | Two switchable chefs; reservation cancellation; customers leave and return plates | planned |
| M2-05 | Management, upgrades, save and recovery | P0 | M2 | M1-04 | Invalid layout blocked; purchase atomic; 7 days replayable; corrupt save recovery | planned |
| M2-06 | Integrated playtest and performance | P0 | M2 | M2-03,M2-04,M2-05 | Full slice final art; device metrics; G2 approval before expansion | planned |
| M3-01 | Career tuning and agreed modes | P1 | M3 | G2 | Challenge/endless only if approved; isolated saves; schema validation and progression regression | planned |
| M4-01 | Next world proposal | P2 | M4 | G2 | Separate scope, asset budgets and new verb approved | planned |
| M5-01 | Release candidate and approved deployment | P0 | M5 | G3 | Cross-browser smoke, rights audit, rollback and G4 approval | planned |

M2-01 uses CHAR/KIT/ENV; M2-02 FOOD; M2-03 ANIM/UI/FX/AUD; see manifest. M0-01 through M0-03 have local verification evidence. G0 Producer review is next. M1-05 is preparation, not mandatory deployment; publication requires separate authorization. M2 starts after G1 and authorized scope. Add M3 schema validation and regression before content expansion; M4 world-specific task IDs must be approved. Every task links QA IDs via FEATURE_ACCEPTANCE.md. Block only affected tasks, continue independent work; no false done.
