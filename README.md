# Kitchen Chaos 3D

Run a five-minute Burger Town shift in the M1 graybox preview. Switch between Max and Lina, cook three burgers, and try to serve ten orders before closing.

## Play locally

Use Node 24.22.3 from `.nvmrc`. Run `npm ci`, then `npm run dev`, and open the URL Vite prints. Use desktop Chromium with WebGL 2.

| Input | Action |
|---|---|
| WASD | Move and face a station |
| Shift | Dash |
| E | Pick up, place, assemble or serve at the highlighted station |
| Space | Hold to chop or wash. Press at the waste bin to discard food |
| Q | Switch chef |
| Tab | Expand tickets during service |
| Esc | Pause or resume |

Take a clean plate from the rack and place it at assembly. Add a bun and a patty cooked for 8–12 seconds. Cheese burgers add cheese. Garden burgers add chopped lettuce and tomato. Take the finished plate to the serving hatch. Used plates return to the sink.

## Verify the build

```sh
npm ci
npm run typecheck
npm run lint
npm test
export VITE_BASE_PATH=/kitchen-chaos-3d/
npm run build
npx playwright install chromium
npm run test:e2e -- --workers=1
```

Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to use an installed Chromium. The project base must match for build and browser verification. CI retains the test evidence and `dist/` artifact.

See [production progress](production/PROGRESS.md), the [QA report](reports/QA_REPORT.md), and the [Pages preparation checklist](docs/LIVE_PREVIEW.md#m1-pages-candidate).
