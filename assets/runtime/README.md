# Runtime assets
No verified runtime assets supplied in v1.1. Planned paths in manifest are not existing files. Graybox assets allowed only M1 with explicit labeling. Final assets must pass ledger and visual gate. Keep concept and source out of deployed build. Source work can be kept in assets/source/; use Git LFS only if approved and needed.

## M1 original graybox

The playable prototype generates its chef, kitchen and food geometry in [graybox.ts](../../src/rendering/graybox.ts). The original authored source uses Three.js geometric primitives with procedural material colors, props and carry poses. It uses no third-party game art, images, models, textures, fonts or audio files. The runtime code is bundled by Vite. The M1 asset ledger links the source and gameplay evidence. Concept imagery stays outside the shipped build.
