# QA report — M0 Foundation

Verification date 2026-11-25. Foundation build `0.0.1` at code commit `4f739fd`. Headless Chromium 156.0.8078.79 with SwiftShader on Debian 13 x86_64 (AMD EPYC 9V74), at 1280×720 and 1920×1080.

| ID | Scenario | Expected | M0 status |
|---|---|---|---|
| Q01 | Boot and missing asset | Menu loads or actionable retry; no crash | PASS |
| Q02 | Move/dash/switch/focus loss | Collision respected; active chef clear; pause | NOT_RUN |
| Q03 | Repeated pickup/place | No duplicate/lost item | NOT_RUN |
| Q04 | Three recipes and invalid dish | Valid dishes match; raw/burnt rejected | NOT_RUN |
| Q05 | Cook boundaries and pause | Correct states; timer frozen on pause | NOT_RUN |
| Q06 | Orders expire/shift closes | Miss recorded; settlement once | NOT_RUN |
| Q07 | Staff path blocked/manual takeover | Task cancels, reservation released | NOT_RUN |
| Q08 | Buy/rearrange/undo | Correct cash; unreachable layout rejected | NOT_RUN |
| Q09 | Seven days, reload, corrupt save | Progress retained; recover safely | NOT_RUN |
| Q10 | Audio unlock/mute/visibility | No autoplay error, loops stop | NOT_RUN |
| Q11 | Resize/keyboard/reduced motion | HUD readable and accessible | NOT_RUN |
| Q12 | Final art gameplay screenshot | No placeholders/clipping, readable food | NOT_RUN |
| Q13 | Device FPS/load/memory | Record measured budgets and exceptions | NOT_RUN |
| Q14 | CI/deployed smoke/rollback | Verified URL and commit only after approval | NOT_RUN |

Defect template: ID, severity P0–P3, build, environment, repro, expected/actual, evidence, owner, regression test. Human playtest required for fun.

## Additional regression coverage

Q19 **PASS** for schema versions, ranges, duplicates, recipe requirements and day references in the supplied fixture. Layout reachability and unlock prerequisites are **NOT_RUN** because the fixture has no layout or prerequisite graph. Q15–Q18 and Q20–Q22 are **NOT_RUN**. See [FEATURE_ACCEPTANCE.md](../production/FEATURE_ACCEPTANCE.md) for the scenarios.

## M0 command results

| Command | Exit | Result |
|---|---:|---|
| `npm ci` with workspace npm cache | 0 | Installed 142 packages from the lockfile |
| `npm run typecheck` | 0 | TypeScript 5.9.3 strict check |
| `npm run lint` | 0 | ESLint 10.15.0 |
| `npm test` | 0 | Vitest 5.1.2, 7 tests passed |
| `npm run build` at `/` and `/kitchen-chaos-3d/` | 0 each | Vite 8.3.8 built both paths. Three.js 0.187.0 renderer chunk 525.06 kB minified and 129.83 kB gzip |
| `actionlint .github/workflows/ci.yml` | 0 | actionlint 1.7.11 |
| `npx playwright install chromium` | 1 | The browser CDN returned HTTP 403 in this environment. Used system Chromium for local tests |
| `npm run test:e2e` with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` at each base | 0 each | Playwright 1.65.1, 6 passed at root and 6 at the project subpath |

Node 24.22.3 and npm 11.19.1 were used. Q01 confirmed clean boot, keyboard retry after an injected HTTP 404 for the content fixture, and actionable WebGL 2 recovery at both viewports. The clean boot asserts zero browser errors or failed requests. The foundation browser run covers keyboard retry and focus recovery. Full game UI accessibility (Q11), deployed smoke (Q14) and gameplay remain NOT_RUN.

The first typecheck caught a missing `this` annotation in the browser test shim. The first unit run exposed a fixture that triggered the duplicate-ingredient rule before the intended unknown-state check. The first browser run exposed a missing favicon request at both resolutions. All three were corrected and verified in the rerun. Vite still flags the Three.js chunk above its default 500 kB warning threshold. Representative loading and device performance remain Q13 work.

[Verification log](evidence/4f739fd/verification.log) · [Screenshot index](evidence/4f739fd/README.md)

## M0 art and rights feasibility

- Reviewed the combined board and all five crops. The warm wood, cream panels, rounded equipment and tall/short headwear work as reference targets. Use the 12×10 blueprint and the GDD for layout, equal chef abilities, recipe layers and the slice's equipment. All six PNGs decoded and matched the ledger SHA-256 hashes and byte counts. The concept redistribution review is pending.
- Blender 4.3.2 (`blender -b --python-exit-code 1 --python probe.py`, exit 0) exported an original beveled cabinet with a teal material, a named `food_socket`, and one second of translation animation. The scratch GLB was 15,572 bytes. glTF Validator 2.0.0-dev.3.10 found 0 errors and 0 warnings (two informational notices for an unused UV attribute and the socket node). glTF Transform 4.5.1 `inspect` reported 188 triangles and 1×0.9×1 m bounds with the base at y=0. A Three.js GLTFLoader and AnimationMixer check confirmed the bounds, socket name and clip playback. Blender's Draco library was unavailable. The uncompressed export succeeded.
- FFmpeg 7.1.5 encoded a 0.25-second original test tone to Vorbis (`ffmpeg -f lavfi -i sine=frequency=440:duration=0.25 -c:a libvorbis probe.ogg`, exit 0). `ffprobe` confirmed the codec and duration. GIMP 3.0.4 and Inkscape 1.4 reported their versions. The test outputs are scratch feasibility evidence. The asset audit confirmed all 49 runtime manifest entries still missing.
- For M2, start with Max's shared rig and carry socket, then a modular cabinet/stove and layered burgers. Validate exported GLB scale, skinning, named clips, materials and sockets at the gameplay camera before variants. Produce audio from original recordings or synthesis, and verify loops and clipping separately. Keep source files outside the bundle. Before incorporating any third-party asset, verify the exact file, source, creator, license, redistributability, attribution and checksum in the ledger. No third-party media were imported. Final character rig, art fit, audio quality and gameplay-camera review (Q12) remain NOT_RUN.

## M1 Burger Town graybox

Tested source `5d818427a52abe377f77cd54561952be327d4343`, preview `0.1.0-preview.1`, seed 42, Linux x86-64, Node 24.22.3, headless Chromium 156.0.8078.79 with SwiftShader. The build and browser tests use the project Pages base. See the [evidence index](evidence/5d81842/README.md) for captured scenes and command logs.

| QA ID | Status | Actual result |
|---|---|---|
| Q01 | PASS | Boot/start, live clock, clean network and console, missing-content keyboard retry, and actionable WebGL 2 failure. |
| Q02 | PASS | Simulation stops walk and dash at walls. Browser keyboard switches chefs and blur pauses the game. |
| Q03 | PASS | Repeated pickup and invalid placement charge once and preserve ownership. |
| Q04 | PASS | Browser serves Classic, Cheese and Garden for $44 total sales. Empty plate rejected in browser. Simulation checks raw, burnt and extra ingredients, oldest matching ticket and reduced overcook tip. |
| Q05 | PASS | Exact simulation boundaries through burn. Browser cook freezes on blur and reaches perfect after resuming. |
| Q06 | PASS | Browser shift closes at 0:00, records misses and a single loss settlement, then retries and confirms restart. Unit simulation reaches the target and validates next-day cash input. |
| Q11 | PASS (M1) | Desktop screenshots at both required sizes, keyboard start and retry, and modal focus. Final accessibility review remains scheduled. |
| Q14 | PASS (candidate), NOT_RUN (hosted) | Project-base build, local static HTTP/MIME and embedded build smoke, and workflow lint. Hosted smoke and rollback await publication. |
| Q15 | PASS | Interrupted cook-side workflow and chop progress in browser, interruption of chop and wash in simulation. |
| Q16 | PASS | Simulation confirms intentional waste increments and plate retention. |
| Q17 | PASS (M1) | Browser verifies ticket labels, clock, serving counts and results including $44 sales. Simulation checks tip and settlement math. |
| Q19 | PASS (M1) | Existing schema and reference tests plus a reachable approach for every M1 station. |
| Q07–Q10, Q12–Q13, Q18, Q21–Q22 | NOT_RUN (M1) | Staff, management, saves, audio, final art, hardware performance, seating and later modes are scheduled after this gate. |

### Defects found and addressed

- M1-QA-01 (P2) · At 1280×720 the initial orthographic fit clipped the board at the stage edges. Enlarged the view bounds and checked the gameplay composition in the final captures. Comparison in the evidence index.
- M1-QA-02 (P3) · The renderer's opaque clear color covered the CSS background. Enabled a transparent canvas and checked the background and cabinet contrast in the final gameplay captures.
- M1-QA-03 (test fixture) · The waste-bin unit fixture approached from the occupied rack tile. Corrected the approach to the reachable east tile and reran the test.
- M1-QA-04 (environment) · The initial `npm ci` attempted to write to the unavailable home npm cache. Using `--cache /workspace/.npm-cache` restored locked installation. A preview-port collision with an earlier test run was resolved by stopping the earlier run before final verification.

The automated real-input run intentionally serves three orders and exercises loss. A seeded unit scenario verifies the win/settlement rule. Human tuning, a full winning keyboard run, and performance on representative hardware are still pending.

The concurrent software-WebGL run passed seven browser cases and hit the 180-second timeout in the 1280×720 test after capturing results. Commit `c6a6ef3` runs the two Playwright projects serially. Browser verification uses the same `5d81842` application build. Vite emitted a size warning for the 556 kB minified Three.js/UI chunk, which was 141 kB gzip. The build completed successfully.

Local results across the final run and serial recovery were 13 passing unit checks and 8 passing browser cases. The serial 1280×720 shift passed in 1.2 minutes. Install, typecheck, lint, build, workflow lint and static Pages smoke returned exit 0. The closing receipt shows nine misses, $7 tips, $9 ingredient costs and $122 final cash.

## M2 Burger Town vertical slice candidate

Candidate `dca5fda`, 2026-11-25. Chromium 156.0.8078.79 ran on Linux x86-64 with ANGLE SwiftShader and three Intel Xeon Platinum 8573C virtual CPUs. All browser evidence refers to the build at `/kitchen-chaos-3d/`. The Producer confirmed all seven M1 live playtest checks passed before M2 started.

| QA ID | Status | Evidence |
|---|---|---|
| Q01 | PASS | Chromium boots with clean console and requests, retries a missing fixture, reports WebGL 2 recovery. |
| Q02–Q06, Q15–Q17 | PASS | Browser keyboard run covers Classic, Cheese and Garden, a rejected plate, cook timing, switching, washing, a loss receipt, retry and confirmed restart. Unit cases cover collision, atomic transfers, burnt/raw rejection and winning settlement. |
| Q07 | PASS (simulation) | Partner navigates to prep and relinquishes the task on manual takeover. Integrated browser task and timed cancellation walkthrough remain open. |
| Q08, Q18 | PASS | Real browser rejects the blocked placement, commits a $60 stove placement, undoes it and buys the two-plate upgrade. |
| Q09 | PASS (automated scenarios) | Each day opens with its configured menu and reaches winning settlement in simulation with supplied valid plates. Browser covers reload and recovery from a corrupt current save. An unassisted seven-day career and complete untimed practice walkthrough remain NOT_RUN. |
| Q10 | PASS (browser controls) | Room/music play only after a gesture, mute changes volume and pause stops loops. Human listening and cue-priority review remain NOT_RUN. |
| Q11 | PASS (browser scenarios) | Keyboard flows, 1280×720 and 1920×1080 captures, and low graphics canvas scale. Full accessibility review remains NOT_RUN. |
| Q12 | FAIL (art rubric) | Full runtime GLBs replace the graybox props, but the art comparison scores multiple dimensions below 3. [Screenshots and side-by-side observations](evidence/m2/README.md). |
| Q13 | BLOCKED (device) | See measured SwiftShader results below. Representative accelerated Chrome, Edge and Firefox budgets are NOT_RUN. |
| Q14 | NOT_RUN (M2 hosting) | No M2 deployment or deployed smoke. |
| Q20 | PASS (simulation) | Customer sits, eats for eight seconds, leaves, and returns one dirty plate. Guest palette variants share one silhouette. Arrival and departure still need animated travel between queue and seat. |
| Q19 | PASS | Existing pack rules and configured layout validation. |
| Q21–Q22 | NOT_RUN | Older-save migration and post-slice modes. |

### Candidate defects and readiness

- M2-QA-01 (P1, open, art) · The active kitchen remains sparser than the visual target and the dishes are hard to distinguish at distance. Compare the 720p stove and hatch shots. Improve background styling, recipe silhouettes and ticket icon specificity before a G2 review.
- M2-QA-02 (P1, open, animation) · Seated and eating states render, while guest arrival and departure currently switch positions directly. Author and validate the transitions, refine chef hand contact and foot placement, and add differentiated guest silhouettes. Recorded full motion review remains open.
- M2-QA-03 (P1, open, performance) · SwiftShader cannot meet interactive frame budgets. The candidate needs an accelerated hardware run before comparing to the 60 FPS standard and 30 FPS low targets.
- M2-QA-04 (P2, open, UI/audio) · HUD and planning icon sets and the dedicated cash/upgrade cue remain incomplete. The planning preview shows a cell and validates placement but still needs the full management presentation. Persistent audio settings and final mixed-audio review remain open.
- M2-QA-05 (fixed) · Blender gave repeated socket names numeric suffixes. Three.js sanitizes the separator. Runtime accepts both names and now loads both chefs and all socket heights.
- M2-QA-06 (fixed) · Reworked skin export so the rig GLBs have root skin meshes. The validator now reports zero errors and zero warnings for all runtime GLBs.
- M2-QA-07 (fixed) · The earlier software-rendered browser scenario timed out. Coalescing synchronous state updates before drawing restored two-viewport completion without changing simulation. Static restaurant props share material batches.

The ledger records checksums, paths and provenance for original GLB and audio files. `assets/source/` contains Blender scenes and WAV source. Runtime asset readiness stays in review. The concept images are reference assets outside the web bundle.

### Verification commands

| Command | Exit | Result |
|---|---:|---|
| `npm ci --cache /workspace/.npm-cache` | 0 | Locked dependencies installed |
| `npm run typecheck` | 0 | Strict TypeScript check |
| `npm run lint` | 0 | ESLint |
| `npm test` | 0 | 16 unit tests |
| `VITE_BASE_PATH=/kitchen-chaos-3d/ npm run build` | 0 | 3,712,236 uncompressed bytes in `dist/assets`; Vite large chunk warning |
| `npm run test:e2e -- --workers=1` with the project base and system Chromium | 0 | 12 browser tests across two viewports |
| `node tools/art/validate_glbs.mjs` with the pinned validator | 0 | 37 GLBs, zero errors and zero warnings |

[Verification log](evidence/m2/verification.log) · [GLB-by-GLB audit](evidence/m2/gltf-validation.jsonl)

### Software-rendered performance

Used the production subpath build and `tools/qa/browser-perf.mjs`. Each row is a fresh browser page. Startup is navigation to the visible Start shift button. The sample collects browser animation frame intervals for 2.2 seconds while holding W in the opening career shift. Draw calls and triangles are the last rendered frame, and heap is Chromium's approximate JavaScript heap. Texture GPU memory and actual HTTP transfer bytes were unmeasured.

| Viewport | Graphics | Startup | FPS | p95 frame | Frames | Draw calls | Triangles | JS heap |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| 1280×720 | Standard | 1.89 s | 4 | 349.9 ms | 8 | 115 | 59,108 | 29 MiB |
| 1280×720 | Low | 1.75 s | 3 | 383.3 ms | 8 | 115 | 59,108 | 29 MiB |
| 1920×1080 | Standard | 1.90 s | 2 | 616.6 ms | 5 | 115 | 59,108 | 16 MiB |
| 1920×1080 | Low | 2.32 s | 3 | 450.0 ms | 7 | 115 | 59,108 | 17 MiB |

These short software-only samples are below the 60 FPS standard and 30 FPS low targets and show no consistent low-quality improvement. They establish a repeatable baseline for this environment. Accelerated browser and peak-demand measurements are required to evaluate the device budgets. [Raw performance data](evidence/m2/performance.jsonl)

## M2 G2 remediation

Revision `699318c` continues the merged PR #3 head `e8569a0`. The refinement changes rendering and presentation. Shift rules, movement input, seating timing, career persistence and equipment placement retain their existing implementations.

- Static geometry uses baked vertex lighting and material colors. Major fixed props merge into a single draw. The framebuffer covers the projected board, stays centered, omits multisample antialiasing, and uses a smaller pixel ratio in low mode. Skinned actors use Lambert lighting. The existing contact-shadow texture remains shared.
- The Blender-authored diner window and awning add 168 triangles and 23,184 bytes to the runtime asset set. The asset is included in the existing static batch.
- The order rail shows three recipe silhouettes, ingredient icons with accessible names, and a patience bar. Counter badges identify actual contents, including incomplete plates and patty states. Chefs turn toward input, stop walking animations when holding food at rest, and retain their existing interaction clips. Guests visibly walk to and from seating or queue positions.
- Remaining visual limitations include the sparse reference-relative background, interchangeable guest silhouettes, close-contact motion and the complete UI/audio review. The reduced-motion path skips interpolated guest travel. The software renderer shows more visible edge aliasing without MSAA. Human career and visual acceptance remain open.

[Gameplay evidence and comparison](evidence/m2-refinement/README.md)

### Matched performance comparison

Same Chromium 156.0.8078.79, SwiftShader, production subpath, seed, camera and 2.2-second opening career movement sample. Values are one short run per mode. Draw calls reflect the final sampled frame.

| Viewport and mode | Baseline FPS | Final FPS | Baseline p95 | Final p95 |
|---|---:|---:|---:|---:|
| 1280×720 standard | 3 | 20 | 316.6 ms | 83.4 ms |
| 1280×720 low | 5 | 27 | 249.9 ms | 66.8 ms |
| 1920×1080 standard | 2 | 12 | 666.6 ms | 150.1 ms |
| 1920×1080 low | 2 | 22 | 466.5 ms | 83.3 ms |

Draw calls fell from 115 to 22. Final-frame triangles were 59,554 versus 59,108 before. Startup was 1.31–1.65 s versus 1.97–3.81 s before. The intermediate run reached 17–23 FPS at 59 draw calls, so the final batching improved call count without a consistent frame-rate gain over that intermediate pass. The opening sample does not establish peak-demand performance.

An accelerated Chromium probe with `--use-angle=gl` still reported SwANGLE/SwiftShader as its only device and WebGL unavailable in that forced backend. This sandbox exposes neither a DRM render device nor an NVIDIA device. G2 still requires representative hardware measurements, an acceptable final visual review and an integrated human career playtest. The final software run also misses both frame-rate targets.

[Baseline](evidence/m2-refinement/performance-before.jsonl) · [Intermediate](evidence/m2-refinement/performance-intermediate.jsonl) · [Final](evidence/m2-refinement/performance-after.jsonl)

Final checks returned exit 0 for TypeScript, ESLint, the production subpath build, 16 unit tests and 12 Chromium browser tests at both viewports. The full browser shift still exercises all three recipes and settlement. The new assertions cover the perfect-patty station badge and the three rendered ticket icons and patience bars. Asset validation found zero errors and zero warnings across 38 GLBs. [Browser log](evidence/m2-refinement/browser-verification.log)
