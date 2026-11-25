# Burger Town runtime assets

The M2 kitchen, chefs, guest rig and food state meshes are original Blender work. The Ogg loops are original synthesis. No third-party media or concept PNGs are imported by Vite. The source scenes and original WAVs live in `assets/source/`. The runtime asset audit in `production/ASSET_LEDGER.csv` records file hashes and source ownership.

Run the authoring scripts from the repository root with Blender 4.3 and FFmpeg. Exports use meters, glTF Y-up, named attachment nodes and shared skeleton names.

```sh
blender -b --python-exit-code 1 --python tools/art/build_kitchen.py
blender -b --python-exit-code 1 --python tools/art/build_food.py
blender -b --python-exit-code 1 --python tools/art/build_chefs.py
python tools/art/build_audio.py
```

Install `gltf-validator@2.0.0-dev.3.10` in a temporary directory and run `tools/art/validate_glbs.mjs` with `NODE_PATH` pointing to that directory's `node_modules`. See the M2 QA evidence for runtime verification and current art limitations.
