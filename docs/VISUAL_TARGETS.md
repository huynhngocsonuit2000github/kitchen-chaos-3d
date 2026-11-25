# Visual targets and screenshot review
Use assets/concept/00_visual_board.png as mood/style target; use 01_gameplay.png for composition, 02_characters.png for silhouettes, 03_kitchen.png for materials, 04_food.png for shapes, 05_ui.png for visual language. These are AI concept images, not captures from a build. GDD and level blueprint override the illustration: classic = bun + patty, cheese adds cheese, garden adds lettuce and tomato; no fries/fryer in slice. Illustrated control glyphs, prices, scores, star counts and ingredient icons are not specifications. Character names Max/Lina are working names; identical stats; Lina has shorter headwear. Layout depicted is inspirational, blueprint is authoritative. Keep cream/teal/tomato/wood palette in ART_DIRECTION.md; adapt board burgundy accents sparingly.

## Capture protocol
At 1280x720 and 1920x1080, use fixed seed 42, default camera yaw 45/elevation 55, same exposure and layout; save PNGs under reports/evidence/<commit>/ with device, browser, viewport, scene and seed in index. Capture boot/menu, busy shift at 90s (two chefs, three tickets, customers), cooking boundary, finished garden burger, planning build mode, results, low settings. Compare side-by-side against relevant crops. Capture gameplay, not a cinematic camera or static mock. Preserve before/after for art fixes.

| Dimension | Acceptance |
|---|---|
| Composition | Whole walkable kitchen and critical stations visible; no HUD occlusion; two chefs identifiable without color alone |
| Character | Rounded stylized proportions, stable feet, no hand/food detachment or obvious clipping in required clips |
| Food | All five ingredient types and four patty states distinguishable at gameplay scale; three recipes correct and visually distinct |
| Environment | Rounded detailed appliances, consistent grid scale, warm lighting, soft contact shadow, no missing textures/default cubes |
| UI | Readable ticket icon + text/shape status; visible focus; no overlap at min resolution |
| Motion/audio | Actual interaction video or human run confirms responsive motion, clear warnings and satisfying feedback |

Score each 0=missing, 1=placeholder, 2=major mismatch, 3=acceptable, 4=polished. G2 requires each >=3, no P0/P1, runtime asset ledger verified and Producer approval; score is proposed review rubric, not evidence. Concept board cannot establish performance or fun. Fix targeted failures and recapture.
