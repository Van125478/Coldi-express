# Frame 0 v2 asset provenance

Draft still for visual review. The rejected Frame 0 files are unchanged.

## Camera

Door plane is Y = 0. Interior extends in negative Y.

- Camera: `(0, 4.2 m, 1.50 m)`, 30 mm, full-frame 36 mm sensor
- Aim: `(0, -2.45 m, 1.12 m)`
- Both rear doors open 64° on hinge empties `DoorLHinge` and `DoorRHinge`

A camera at 2.4 m with a natural lens framed only the opening, which is why the rejected still hid the doors. 4.2 m is the distance that keeps both door leaves, the threshold, and a strip of exterior ground in frame.

## Downloaded CC0 assets

Stored outside the repository at `C:\Users\light\Tools\coldi-cinematic-assets\`.
Poly Haven license: CC0. Public use is allowed.

| Asset | Author | URL | Files | Bytes |
| --- | --- | --- | --- | --- |
| Cardboard Box 01 | Rahul Chaudhary | https://polyhaven.com/a/cardboard_box_01 | 2K glTF, bin, diffuse, normal, ARM | 6,689,800 |
| Food Apple 01 | Oliver Harries | https://polyhaven.com/a/food_apple_01 | 2K glTF, bin, diffuse, normal, roughness | 1,199,655 |
| Kloofendal Overcast 4K HDR | Greg Zaal | https://polyhaven.com/a/kloofendal_overcast | `kloofendal_overcast_4k.hdr` | 25,195,459 |
| Metal Plate 2K | Rob Tuytel | https://polyhaven.com/a/metal_plate | diffuse, normal, roughness JPG | 8,233,416 |

Metal Plate is a weathered green diamond-plate scan. On the reefer sill it read as rust, so the rendered floor uses modeled ribs and a brushed aluminum shader. The texture files stay in the local asset folder and are not packed into the scene.

The v2 blend packs the carton, apple, and HDRI images. Those are CC0. No BlenderKit geometry is packed.

## BlenderKit assets not downloaded

The official download API returned HTTP 403 without a BlenderKit session. Each asset is free and not for sale. Nothing was purchased and no access control was bypassed.

| Asset | Author | URL | License | Listed size |
| --- | --- | --- | --- | --- |
| Pallet | John Carlo | https://www.blenderkit.com/asset-gallery-detail/11682e49-16b6-46f7-9105-4d69e798795c/ | CC0 | 22.0 MiB |
| Cardboard box | Matteo Pascale | https://www.blenderkit.com/asset-gallery-detail/6cb06514-c565-47b9-8a1b-e44efc194775/ | Royalty free | 12.0 MiB |
| Wooden crate | REAL SCANS | https://www.blenderkit.com/asset-gallery-detail/1dba9a1b-fe07-4033-a553-7652c715b46b/ | Royalty free | 57.0 MiB |

Pallets and fruit crates in the still are original modeled geometry. The royalty-free carton and crate were not imported.

## Outputs

- `Asset/cinematic/frames/phase-1/frame_000_v2.png`
- `Asset/cinematic/blender/coldi-reefer-frame0-v2.blend`
- `Asset/cinematic/blender/build_frame0_v2.py`

Rejected comparison, left untouched:

- `Asset/cinematic/frames/phase-1/frame_000.png`
- `Asset/cinematic/blender/coldi-reefer-frame0.blend`
- `Asset/cinematic/blender/build_frame0.py`
