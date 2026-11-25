# M1 gameplay evidence

Source `5d818427a52abe377f77cd54561952be327d4343`, preview `0.1.0-preview.1`, seed 42. Linux x86-64, Chromium 156 with software WebGL. Gameplay captures use the production build at `/kitchen-chaos-3d/` with browser keyboard inputs and a deterministic animation-frame clock.

| Scene | 1280×720 | 1920×1080 |
|---|---|---|
| Start dialog | [PNG](1280x720/00-start.png) | [PNG](1920x1080/00-start.png) |
| Perfect patty at 8 seconds | [PNG](1280x720/01-stove-ready.png) | [PNG](1920x1080/01-stove-ready.png) |
| Assembled Garden burger at hatch | [PNG](1280x720/02-garden-at-hatch.png) | [PNG](1920x1080/02-garden-at-hatch.png) |
| Three pending tickets at 130 seconds | [PNG](1280x720/03-busy-order-rail.png) | [PNG](1920x1080/03-busy-order-rail.png) |
| Closing results | [PNG](1280x720/04-closed-shift.png) | [PNG](1920x1080/04-closed-shift.png) |

[Earlier camera and opaque background](before-camera-fit.png) compared with the final stove capture. The kitchen, chefs and food are labeled graybox assets. Seated customers, planning and low-graphics modes belong to later milestones.

[Install, static checks, build and browser log](verification.log) · [Static server subpath and MIME verification](pages-smoke.log)
