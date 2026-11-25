# Progress — M0 Foundation

2026-11-25 · Foundation code commit `4f739fd` · branch `codex/m0-foundation`. Evidence and handoff are in the following documentation commit.

- **M0-01 done.** Locked Vite/strict TypeScript/Three.js foundation builds and boots. WebGL 2 check and a retryable content-load error are visible in the foundation screen. Both supported desktop test viewports exercised.
- **M0-02 done.** Reviewed the six concept references and verified their ledger hashes. Exported an original test cabinet, checked meter scale, socket and animation import through Three.js, and encoded a Vorbis sample. The 49 production runtime assets remain missing. G0 still needs Producer approval of the hero target and sourcing plan.
- **M0-03 done.** PR CI workflow uses pinned action revisions, the lockfile, a project-subpath build and Chromium smoke tests. Validated the workflow with actionlint and ran the local equivalent. Draft content validation covers shape, versions, ranges, duplicate IDs and references for fields in the supplied fixture.

Checks, exit codes, defects, screenshots and asset details are in [QA_REPORT.md](../reports/QA_REPORT.md). G0 is **BLOCKED pending Producer approval** of the GDD/blueprint defaults, acceptance plan, Max/Lina and Burger Town visual target, and original-first sourcing. G1–G4 are **NOT_RUN**. After G0 approval and M1 authorization, start M1-01 with movement, grid collision, input and chef switching.

# Progress — M1 Playable Prototype

2026-11-25 · Source `5d818427a52abe377f77cd54561952be327d4343` · preview `0.1.0-preview.1` · branch `codex/m1-playable-prototype`.

- **M1-01 done.** Max and Lina switch with Q, preserve their own items, move and dash against the blueprint collision grid. Browser blur pauses service and clears input.
- **M1-02 done.** Transfers, chopping, timed cooking, washing, assembly and food discard are implemented. Test coverage includes blocked transfers, patty boundaries, interruption and plate preservation.
- **M1-03 done.** All three recipes, seeded ticket deadlines, oldest matching service, sales/tips/costs and once-only settlement are covered. Day 3 opens with all recipes. Successful results advance the prototype day in memory.
- **M1-04 done.** A keyboard-driven Chromium run completed a 300-second shift at both required viewport sizes. It sold one of each burger for $44, checked invalid delivery, washing and pause, and reached the loss results and retry. The final camera and background were checked in gameplay captures.
- **M1-05 done.** Built and tested the Pages subpath. The manual Pages candidate and local static smoke evidence are ready for review.

Verification and known limits are in the [QA report](../reports/QA_REPORT.md). Screenshots, logs and source identity are in the [evidence index](../reports/evidence/5d81842/README.md).

G0 **PASS** by Producer approval. G1 **PASS** for the graybox prototype. G2–G4 **NOT_RUN**. The Producer owns the next milestone decision and separate Pages publication approval. Human balance/play testing and hardware performance measurements remain ahead.

## M2 Burger Town vertical slice candidate

On 2026-11-25 the Producer reported that all seven M1 live playtest checks passed and authorized M2. The M2 candidate starts from `ed40078`. Source revision `dca5fda` includes original Blender GLBs and source scenes, layered food states, shared chef and guest armatures, kitchen lighting and effects, service audio, and a planning UI. Quick shift preserves the M1 seed-42 Day 3 scenario. Career adds Day 1 practice, seven day configurations, seated customers, partner prep/wash, appliance placement, purchases, undo, and versioned saves.

M2-01 through M2-05 are in review. M2-06 remains open for visual acceptance, representative device testing, and an integrated human run. See [M2 QA](../reports/QA_REPORT.md#m2-burger-town-vertical-slice-candidate) for evidence and defects. G2 has not passed. Production publication and M3 remain pending Producer authorization.

### M2 refinement after PR #3 merge

The Producer explicitly kept G2 open. GitHub had already merged PR #3 by the time the refinement began. Renderer, diner detail, food and UI readability, and visual motion changes continue from the same head branch. The [refinement QA report](../reports/QA_REPORT.md#m2-g2-remediation) records matched software performance samples, current screenshots, and the remaining accelerated device and human review requirements.
