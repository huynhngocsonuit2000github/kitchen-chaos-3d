# Decisions v1.1
Approved by Producer: Cooking Arcade + Restaurant Management, Hybrid World, Premium Stylized 3D, retain design and upgrade pack to visual-first, milestone-batched production, long-term data-driven architecture and authorized live preview. v1.0 working defaults retained: title, single-player desktop, orthographic camera, three burger recipes, seven-day slice, prices/timings, 70/30 ratio, TypeScript/Vite/Three.js and static hosting. G0 validates details. v1.1 proposed defaults: Max/Lina names, 12x10 layout, movement/camera tuning, day recipe unlocks, seat/queue/eating timing, visual rubric, versioning and CI adoption. Concept board contains illustrative recipe/control/price mismatches; corrected by VISUAL_TARGETS.md, GDD authoritative. Six worlds and modes remain long-term aspiration, no online co-op/paid services without separate approval. No actual publication approval, verified runtime assets or code execution yet.

## M0 implementation decisions (2026-11-25)

- Pin Node 24.22.3 and lock the application dependencies. Use Three.js with WebGL 2 and Zod for structural validation of the draft fixture, followed by reference checks. Validate the fixture in unit tests and at browser boot. Layout and unlock prerequisite graphs enter validation when those records exist.
- Start the production asset plan with original Blender models, modular materials and original audio. Use uncompressed GLB for initial validation. Revisit compression after profiling representative assets. Keep system typography until an individual font license is verified.
- Carry the proposed Max/Lina, camera, palette and Burger Town defaults to G0. The GDD and blueprint govern mechanics and layout. The concept board's fries/fryer, roles, recipe layers, control labels and economy figures are illustrative.

## M1 scope and implementation

2026-11-25 · Producer granted G0 approval for the current gameplay defaults, visual targets, acceptance plan and original-first sourcing. M1 opens at the Day 3 recipe set and target so one shift exercises Classic, Cheese and Garden. It retains the 300-second shift, 18–25 second order cadence, 60-second patience, four plates, original blueprint and keyboard bindings. Ticket timing uses a seeded generator and recipe rotation starts at a seed-dependent offset. Replay keeps the seed. A settled retry is a fresh attempt at the same day with the settled cash, and a successful result opens the next day in memory. A confirmed restart before closing restores opening cash.

M1 uses original procedural meshes for the chefs, kitchen, utensils and all food states with in-game graybox labeling. Seating, staff assignments, career saves, premium rigs, audio and final visual review remain scheduled for M2. Pages preparation includes a project-subpath build and inert manual dispatch workflow. Publication requires separate Producer authorization.

## M2 candidate entry and preservation of M1

2026-11-25 · The Producer reported all seven live M1 checks passed and authorized M2. Retain the seed-42 three-recipe quick shift as the entry point for M1 regression play, with a separate Career button for progression and management. Keep both physical seats authoritative in career, so the three-ticket visual capture uses quick shift and the seating capture uses career. Desktop M2 includes local saves only. Use original Blender material geometry and original synthesized audio. Hold deployment and M3.
