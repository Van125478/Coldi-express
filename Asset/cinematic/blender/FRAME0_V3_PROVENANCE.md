# Frame 0 v3 asset provenance

Draft still for visual review. v1 and v2 files are unchanged.

## Camera

Door plane is Y = 0. Interior extends in negative Y.

- Camera: `(0, 3.85 m, 1.28 m)`, 34 mm, full-frame 36 mm sensor
- Aim: `(0, -1.45 m, 0.82 m)`
- Both rear doors open 70° on hinge empties `DoorLHinge` and `DoorRHinge`

## Lighting and background

Kloofendal Overcast 4K still lights the scene. A light-path mix replaces the HDRI on camera rays, so the hillside is not in the picture. A dock floor, side walls, canopy, and rear wall sit around the trailer. A spot above the threshold aims into the load. No ceiling strips.

## Assets packed in the v3 blend

Same confirmed CC0 downloads as v2, stored at `C:\Users\light\Tools\coldi-cinematic-assets\`.

| Asset | Author | License | Use |
| --- | --- | --- | --- |
| Cardboard Box 01 | Rahul Chaudhary | CC0 | 83 cartons. Per-object tint and a 180° flip reduce identical faces. |
| Food Apple 01 | Oliver Harries | CC0 | 10 apples on the front-left stack only. |
| Kloofendal Overcast 4K | Greg Zaal | CC0 | Lighting only. Hidden from the camera. |

Metal Plate was not packed. It is weathered green diamond plate and reads as rust on this reefer.

No BlenderKit models are in the blend. Their download API still returns HTTP 403 without an account. Pallets under the cartons are the existing modeled decks, not a scanned pallet. No new crate mesh was added.

## Outputs

- `Asset/cinematic/frames/phase-1/frame_000_v3.png`
- `Asset/cinematic/blender/coldi-reefer-frame0-v3.blend`
- `Asset/cinematic/blender/build_frame0_v3.py`
