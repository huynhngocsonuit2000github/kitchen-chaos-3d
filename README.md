# Kitchen Chaos 3D — Production Pack v1.1
Original premium stylized 3D web cooking arcade + restaurant management. This repository contains the v1.1 design handoff and the M0 browser foundation. Start with AGENTS.md and CODEX_PROMPT.md; see HANDOFF.md. GDD is canonical mechanics; visual target board is in assets/concept. Runtime assets missing. M0 is ready for G0 review. M1 preview may be published after explicit approval. No paid services or online co-op by default.

## Run the M0 foundation

Use Node 24.22.3 (see `.nvmrc`) and npm. Run `npm ci`, then `npm run dev` and open the URL Vite prints. The foundation validates the Burger Town content fixture and checks that the browser can initialize Three.js with WebGL 2.

Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run build`. Install the test browser with `npx playwright install chromium` (add `--with-deps` on CI), then run `npm run test:e2e` against the built output. You can set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to use an installed Chromium. To verify the project subpath, run both the build and browser tests with `VITE_BASE_PATH=/kitchen-chaos-3d/`. Results are written to `playwright-report/` and `test-results/`.

See [production progress](production/PROGRESS.md) and the [QA report](reports/QA_REPORT.md) for M0 evidence and G0 review.
