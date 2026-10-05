# InBody body model

The dashboard includes a licensed human mesh at `public/models/inbody-human.glb`.
It is loaded locally by the existing Three.js viewer; no external embedded viewer is used.
If the asset is absent, invalid, or WebGL is unavailable, the dashboard retains its placeholder.

## Bundled asset and provenance

- Original author: Quaternius, **Superhero Male**, Universal Base Characters — Standard pack.
- Original pack: https://quaternius.com/packs/universalbasecharacters.html
- License: **CC0 1.0 Universal**, preserved in `inbody-human.LICENSE.txt`.
- Prepared GLB source: `programasweights/avatar`, `public/assets/character.glb`.
- Pinned source revision: `ddd5fc34a445bcded3cf9836607aaeebc19a5c78`.
- Source asset: https://github.com/programasweights/avatar/blob/ddd5fc34a445bcded3cf9836607aaeebc19a5c78/public/assets/character.glb
- Preparation/provenance: https://github.com/programasweights/avatar/blob/ddd5fc34a445bcded3cf9836607aaeebc19a5c78/ASSETS.md
- Size: 741,320 bytes (approximately 724 KiB); no external textures or compression decoders.
- SHA-256: `d6f3b64cab629f6ddca9ba063811aeffd3663a8a4e49ade47cd9505dc2bbd70f`.
- The prepared source preserves the original geometry and rig, uses one matte jade material,
  and omits texture payloads. This project copies that GLB unchanged and plays no body animation.

The mesh is a generic, stylized illustration. It does **not** represent a member's actual shape,
sex, height, muscle distribution, or fat distribution. All displayed measurements and progress
remain sourced from `GET /inbody/my-progress`; the GLB contains no InBody measurements.

## Replacing or editing the model

Import the bundled GLB into a 3D editor, edit the mesh/material/pose as needed, and export a
self-contained GLB to the same path. Use appropriately licensed assets and update the license
and provenance notes when replacing it. Restart/reload the dev page, or rebuild the frontend
for deployment. No API or viewer code changes are needed for a model with the orientation below.

Model requirements:

- Self-contained GLB with embedded textures and a reasonable polygon count; aim for <5 MB.
- Uncompressed geometry (no Draco/Meshopt decoder dependency).
- Upright along +Y, facing +Z for the front camera; center and scale are fitted automatically.
- Use an appropriately licensed asset and include attribution/license files here if required.

The viewer does not derive segmental composition, colors, or medical conclusions from InBody metrics.
