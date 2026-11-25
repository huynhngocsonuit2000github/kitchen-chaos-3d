# M2 refinement evidence

The baseline is the merged PR #3 head, `e8569a0`. The refinement remains on that PR's original branch. Both builds use the project subpath and the same seeded Chromium browser scenario. The browser benchmark uses the same 2.2-second opening movement sample at both viewport sizes and both quality settings.

The renderer batches untextured prop colors and fixed lighting into geometry. The diner window and striped awning share the fixed prop batch. Moving chefs and guests retain skinned animation and live Lambert lighting. Appliance labels show ingredient and state icons, and the ticket rail shows distinct recipe silhouettes, ingredients and remaining patience. The dining-room visual motion follows seating and departure without changing order or service timing.

[Original candidate shots and approved references](../m2/README.md) · [Updated QA and limitations](../../QA_REPORT.md#m2-g2-remediation)

## Opening career captures

[1280×720 standard](1280-career-opening.png) · [1920×1080 low](1920-career-low.png)

## Visual review

The stove badge and illustrated tickets reduce the need to infer states from the small models. The food layers still lose detail at the wide gameplay camera. The window adds a recognizable dining-room landmark and the layout remains readable while the cook/seat routes stay visible. The approved composition still has richer furnishings and material separation. The moving chefs retain their original proportions, silhouettes and skinning in the batched build. This internal review leaves final environmental, motion and food acceptance open.

| Scenario | 1280×720 | 1920×1080 |
|---|---|---|
| Ready stove | [PNG](1280x720/01-stove-ready.png) | [PNG](1920x1080/01-stove-ready.png) |
| Garden at hatch | [PNG](1280x720/02-garden-at-hatch.png) | [PNG](1920x1080/02-garden-at-hatch.png) |
| Three active tickets | [PNG](1280x720/03-busy-order-rail.png) | [PNG](1920x1080/03-busy-order-rail.png) |
| Shift receipt | [PNG](1280x720/04-closed-shift.png) | [PNG](1920x1080/04-closed-shift.png) |
| Blocked placement | [PNG](1280x720/05-planning-blocked.png) | [PNG](1920x1080/05-planning-blocked.png) |

[Previous ready stove at 720p](../m2/1280x720/01-stove-ready.png) · [Approved gameplay composition](../../../assets/concept/01_gameplay.png) · [GLB validation](gltf-validation.jsonl)
