# AI Game Studio — Skills Playbook v1.0
Reusable reference for ChatGPT Project Game and Work. These are documented workflows, not installed executable plugins. Select the relevant sections by task. For any game, maintain a single source of truth and avoid duplicated inconsistent plans.

## S01 — Game design
**Trigger:** idea, GDD, gameplay changes. **Output:** GDD.md.
- Establish genre, player fantasy, audience, session duration, controls, camera, win/loss, core loop and progression. Describe a representative 60-second play session and why decisions are interesting.
- Specify verbs, rules, state transitions, feedback, tutorial, failure recovery, difficulty curve, accessibility and replayability. For every feature give a player-visible behavior, edge cases and observable acceptance criteria.
- Separate prototype, vertical slice, MVP and release. Avoid big worlds or multiplayer before the core loop works. Prefer original names, characters and art over copying protected game assets.
- Test fun via human playtest: comprehension without coaching, meaningful decisions, frustration and desire to replay; AI cannot certify fun alone.

## S02 — Art direction
**Trigger:** style exploration, graphics review. **Output:** ART_DIRECTION.md and concept references.
- Establish a visual target with palette, silhouettes, proportions, camera composition, environment modularity, lighting, materials, UI typography, motion and VFX. Specify what must not appear (mixed styles, default primitives, inconsistent scale, unreadable HUD).
- Produce reference boards or original concept imagery when requested; distinguish illustrative concepts from actual usable assets. Set a target screenshot for each representative scene, including normal gameplay and UI.
- Define art acceptance: readable at gameplay camera distance, consistent theme, adequate contrast, no clipping, missing textures or obvious placeholder geometry. Review actual rendered screenshots against the target; log discrepancies with before/after images. Do not claim an image was generated or inspected if not available.

## S03 — Asset production
**Trigger:** model/texture/animation requirements. **Output:** ASSET_MANIFEST.csv and asset files if available.
- Manifest fields: id, type, description, required milestone, source, license, format, path, scale, poly/texture budget, animation clips, status, validation. Status: planned/generated/imported/verified/missing.
- Prefer curated permissively licensed assets or original models; record attribution, license and redistribution permission. Do not scrape assets of unknown rights. Do not invent download links.
- Web 3D: GLB/glTF, meters, consistent forward/up convention, clean transforms, collision proxies, LOD where useful, compressed textures where supported. Validate imports, rigs, animation names, pivots, bounds, materials and actual file size. 2D: sprite atlases, transparent backgrounds, consistent pixels-per-unit.
- Use image tools for concept, textures or sprites where suitable; they do not create rigged 3D models. Use Blender/procedural geometry or licensed models with actual available tooling. If blocked, give an exact replacement task rather than silently substituting primitives. Keep source and optimized runtime assets separate.

## S04 — Audio design
**Trigger:** sound and music. **Output:** AUDIO_PLAN.md and manifest entries.
- List action cues, feedback, ambience, music states, UI cues and priorities. Provide original or licensed audio, compression and looping guidance; avoid copyrighted soundtracks.
- Implement master/music/SFX volume and mute, audio unlock after user interaction, pause/resume behavior, concurrency limit and graceful failure. Test cues, clipping, timing, volume balance and browser autoplay restrictions.

## S05 — Technical design
**Trigger:** architecture or feasibility. **Output:** TECH_DESIGN.md.
- Choose engine based on requirements; default TypeScript + Vite with Three.js or Babylon.js for 3D, Phaser for 2D, optional physics engine. Explain choices and dependencies. Use fixed timestep for physics as appropriate, render interpolation, delta time safeguards, input abstraction, explicit gameplay state machines and data-driven content.
- Separate simulation, rendering, UI, input, audio, asset loading, persistence and tests. Define state ownership, entity lifecycle, collision layers, scene loading, save schema/versioning and error recovery. Multiplayer requires authoritative state, latency strategy, reconnect and separate infrastructure approval.
- Target browsers and device tiers; propose frame time, draw calls, triangles, texture memory, initial download and total transfer budget. Measure rather than promise. Avoid unnecessary backend and paid services. Document environment/setup commands and versions.

## S06 — Production planning
**Trigger:** approved concept or scope change. **Output:** PRODUCTION_PLAN.md, BACKLOG.md, PROGRESS.md.
- Milestones: M0 design and setup; M1 playable prototype; M2 polished vertical slice; M3 core systems; M4 content; M5 optional multiplayer; M6 polish/performance; M7 release. Collapse or split as needed. Each milestone must result in a runnable increment or a clearly justified design deliverable.
- Backlog fields: ID, player outcome, priority, milestone, dependencies, acceptance tests, required assets, status. Use ready/in_progress/blocked/review/done; only done after evidence. Prioritize critical path, batch independent work, minimize unnecessary sequential stages.
- Record decisions, current commit, completed IDs, evidence, failures, remaining work and next task in PROGRESS.md. Define scope cuts, budget and stop conditions. No invented completion percentages or time promises. Review after vertical slice before multiplying levels/assets.

## S07 — Game development
**Trigger:** implementation, bug fix, refactor. **Output:** source changes, tests, progress and PR summary.
- Read AGENTS.md, game docs and existing code; inspect working tree; run baseline checks. Select a coherent backlog slice. Preserve existing behavior and avoid unrelated rewrites. Implement real gameplay interactions and game states rather than static mock UI.
- Work in small testable increments; integrate assets early; use meaningful animation, sound and feedback. Ensure keyboard/mouse and any explicitly supported touch/gamepad controls, resize, pause, restart and save behavior. Use strict typing, bounded resources, deterministic test hooks and seeded randomness when relevant.
- Run actual lint/typecheck/unit/build/browser tests as configured. Capture commands, exit results and screenshots. If dependencies or browser tooling unavailable, mark blocked and give reproducible commands. Never fabricate logs or claim passing checks from code inspection alone.
- Limit repair attempts to three per repeated failure unless new evidence warrants another attempt; document root cause and unblock path. Commit or PR only with authorized access; keep secrets outside repository and browser bundle.

## S08 — Game QA and playtest
**Trigger:** prototype, milestone, feedback, regression. **Output:** QA_REPORT.md and issue list.
- Test boot/loading, controls, core loop, victory/defeat, restart, pause, menus, persistence, asset loading, sound and edge cases. Add game-specific scenarios, not only generic DOM tests. Use unit tests for simulation, integration for systems, browser tests for flows. Playwright screenshots and console/network logs where available.
- Play through representative levels from start to finish; test bad inputs, repeated actions, resource exhaustion, losing focus, resize and supported browsers. Inspect screenshots at gameplay resolution, verify animation and feedback via real runs where possible.
- Measure loading, FPS/frame time and memory on stated hardware/browser; note whether headless or representative. No extrapolating headless performance to all devices.
- Defect template: ID, severity (P0 blocker/P1 major/P2 minor/P3 polish), build/commit, environment, steps, expected/actual, evidence, proposed owner, regression test. Record PASS/FAIL/NOT_RUN/BLOCKED for every required test. Preserve human playtest as final fun/visual approval.

## S09 — Quality gates
**Trigger:** milestone completion or release. **Output:** gate decision with evidence.
- G0: GDD, scope, technical feasibility, art target, asset rights and acceptance criteria approved or assumptions explicitly accepted.
- G1: prototype core loop playable end-to-end, no core blockers; temporary assets allowed only if labeled.
- G2: one polished representative level, final-quality art direction, UI/audio/animation/feedback, core gameplay verified, actual screenshot and playtest. Human approval before scaling content unless explicitly waived.
- G3: required features and content covered by traceable tests, no unapproved placeholders, no P0/P1 open; test evidence exists.
- G4: clean build, deployed smoke test, browser compatibility and measured performance within agreed budgets or approved exceptions, licenses/credits, save/restart and rollback path. Release requires human approval.
- Gate result: PASS / FAIL / BLOCKED / NOT_RUN; include commit, criteria, evidence and exceptions. Never convert untested into PASS. A successful build is not proof of visual quality or fun. Failed gates produce concrete issues and bounded remediation.

## S10 — Codex handoff and data contract
**Trigger:** producer approves production or requests handoff. **Output:** repo-ready ZIP and short task prompt.
- ChatGPT Project stores reusable studio knowledge and discussions. Per-game GitHub repo is canonical for game design, assets, backlog, code, tests and progress after handoff. Do not rely on Codex knowing chat history or Project files.
- Package root: AGENTS.md, README.md, docs/GDD.md, docs/ART_DIRECTION.md, docs/TECH_DESIGN.md, docs/AUDIO_PLAN.md, production/PRODUCTION_PLAN.md, production/BACKLOG.md, production/PROGRESS.md, production/QUALITY_GATES.md, production/DECISIONS.md, production/ASSET_MANIFEST.csv, studio/AI_GAME_STUDIO_SKILLS.md, assets/concept/, assets/runtime/, reports/QA_REPORT.md. Include only real files; describe missing assets in manifest. Add code/config only if requested and verified. Use relative paths, no secrets or machine-specific paths.
- AGENTS.md must explicitly point to the studio playbook and game docs. Include task selection, required checks, quality gates, progress update and stop conditions. Skill reference is ordinary Markdown unless packaged into a supported native skill format.
- Handoff manifest: game name, approved scope/version, file list, missing items, prerequisites, first task ID, required tests, next action. Confirm whether GitHub write is authorized; if not, deliver ZIP for user to extract/upload. Do not claim transfer occurred without evidence.
- Codex prompt: "Read AGENTS.md and referenced docs. Inspect current repository and PROGRESS.md. Implement the next ready milestone slice. Run checks, report evidence and blockers, update progress, and prepare a PR. Stop at approval gates or if blocked." User manually starts Codex Cloud unless separate orchestration is configured.
- Feedback loop: for design changes update canonical docs and decision log first; for defects create issue with evidence and acceptance criteria. Codex reads current branch and fixes; user reviews/merges PR; CI deploys if configured. Avoid divergent edits across Work and Codex.

## S11 — Build, CI/CD and deployment
**Trigger:** initial setup, preview or release. **Output:** reproducible build instructions and CI config when requested.
- Static web default: dependency lockfile, Node version, npm ci, typecheck/lint/test/build, browser smoke test, dist artifact. Adapt commands to actual repo scripts; configure Playwright browsers if needed. Validate base URL for subpath hosting, asset URLs, MIME, compression and browser caching.
- GitHub Actions: PR checks, protected main where available, deploy only verified commits; configure GitHub Pages or approved free host and permissions. No claim of live deployment until actual URL and successful smoke test. Preview and stable branches if supported. Keep rollback instructions and release tag.
- GitHub Pages availability depends on plan/repo visibility; public games may expose source on free public repos. Confirm privacy and rights before public deploy. Do not put API keys in frontend or commit tokens. Backend/multiplayer needs separate hosting; static hosting alone is insufficient.
- Verify deployed game loads, assets work, console clean, representative gameplay works. Record commit/version, URL, test result, known limitations. Respect host limits and no extra spending without approval.

## Shared templates
### Acceptance criterion
Given [initial state], when [player action], then [observable result], with [timing/budget if relevant]. Test: [manual/automated scenario].
### Progress record
Commit / milestone / task IDs / completed changes / evidence (commands, screenshots, report) / known defects / blockers / next ready task / required approvals.
### Feedback record
Version and URL / category / steps / expected / actual / screenshot or video / severity / acceptance test / status.
### Handoff readiness checklist
GDD and scope consistent; art target and manifest present; asset licenses known or missing flagged; tasks ordered with acceptance tests; AGENTS references files that actually exist; first task clear; runtime environment requirements stated; archive verified; no secrets; handoff status and manual steps explicit.

## Game-specific v1.1 policy
For Kitchen Chaos 3D follow AGENTS.md and production/QUALITY_GATES.md: authorized milestone-sized batches may include multiple related tasks, continue through evidence-only gates within approved scope, and stop at G0/G2/G4 human gates, critical blockers or resource limits. No change to asset rights, evidence or deployment authorization requirements.
