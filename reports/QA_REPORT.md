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
