"""Frame 0 v2. Original unbranded reefer interior.

Uses confirmed CC0 assets only. BlenderKit downloads are account-gated and are
not included. Does not overwrite the rejected Frame 0 files.
"""

import math
import os
import random

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Matrix, Vector

random.seed(21)

ASSETS = r"C:\Users\light\Tools\coldi-cinematic-assets"
PREVIEW = os.environ.get("COLDI_PREVIEW") == "1"
WIDTH = 2.46
HEIGHT = 2.50
DEPTH = 7.20

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = "METRIC"
scene.unit_settings.scale_length = 1.0


def link_obj(obj):
    scene.collection.objects.link(obj)
    return obj


def finish_box(name, dims, material, location, rotation=(0, 0, 0), parent=None):
    mesh = bpy.data.meshes.new(name)
    bm = __import__("bmesh").new()
    __import__("bmesh").ops.create_cube(bm, size=1.0)
    for vert in bm.verts:
        vert.co.x *= dims[0]
        vert.co.y *= dims[1]
        vert.co.z *= dims[2]
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    obj.data.materials.append(material)
    link_obj(obj)
    if parent is not None:
        obj.parent = parent
        obj.matrix_parent_inverse = Matrix.Identity(4)
    obj.location = location
    obj.rotation_euler = rotation
    return obj


def new_material(name):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    material.node_tree.nodes.clear()
    return material


def principled(material):
    node = material.node_tree.nodes.new("ShaderNodeBsdfPrincipled")
    output = material.node_tree.nodes.new("ShaderNodeOutputMaterial")
    material.node_tree.links.new(node.outputs["BSDF"], output.inputs["Surface"])
    return node


def load_image(path, colorspace):
    image = bpy.data.images.load(path)
    try:
        image.colorspace_settings.name = colorspace
    except TypeError:
        image.colorspace_settings.name = "Non-Color" if colorspace != "sRGB" else "sRGB"
    return image


def panel_material():
    material = new_material("InsulatedPanel")
    bsdf = principled(material)
    bsdf.inputs["Roughness"].default_value = 0.62
    bsdf.inputs["Specular IOR Level"].default_value = 0.28
    nodes = material.node_tree
    noise = nodes.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 22
    noise.inputs["Detail"].default_value = 4
    mix = nodes.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.inputs["Factor"].default_value = 0.18
    mix.inputs["A"].default_value = (0.74, 0.77, 0.79, 1)
    mix.inputs["B"].default_value = (0.62, 0.66, 0.69, 1)
    nodes.links.new(noise.outputs["Fac"], mix.inputs["Factor"])
    nodes.links.new(mix.outputs["Result"], bsdf.inputs["Base Color"])
    bump = nodes.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.05
    bump.inputs["Distance"].default_value = 0.003
    nodes.links.new(noise.outputs["Fac"], bump.inputs["Height"])
    nodes.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return material


def brushed_metal():
    material = new_material("BrushedAluminum")
    bsdf = principled(material)
    bsdf.inputs["Base Color"].default_value = (0.58, 0.60, 0.62, 1)
    bsdf.inputs["Metallic"].default_value = 1
    bsdf.inputs["Roughness"].default_value = 0.38
    bsdf.inputs["Anisotropic"].default_value = 0.65
    bsdf.inputs["Anisotropic Rotation"].default_value = 0.25
    return material


def metal_plate_material():
    material = new_material("MetalPlate")
    bsdf = principled(material)
    bsdf.inputs["Metallic"].default_value = 1
    bsdf.inputs["Anisotropic"].default_value = 0.35
    nodes = material.node_tree
    texcoord = nodes.nodes.new("ShaderNodeTexCoord")
    mapping = nodes.nodes.new("ShaderNodeMapping")
    mapping.inputs["Scale"].default_value = (2, 2, 2)
    nodes.links.new(texcoord.outputs["Object"], mapping.inputs["Vector"])

    def image_node(filename, colorspace):
        node = nodes.nodes.new("ShaderNodeTexImage")
        node.image = load_image(os.path.join(ASSETS, "metal_plate", filename), colorspace)
        node.projection = "BOX"
        node.projection_blend = 0.15
        nodes.links.new(mapping.outputs["Vector"], node.inputs["Vector"])
        return node

    diffuse = image_node("metal_plate_diff_2k.jpg", "sRGB")
    rough = image_node("metal_plate_rough_2k.jpg", "Non-Color")
    normal = image_node("metal_plate_nor_gl_2k.jpg", "Non-Color")
    nodes.links.new(diffuse.outputs["Color"], bsdf.inputs["Base Color"])
    separate = nodes.nodes.new("ShaderNodeSeparateColor")
    nodes.links.new(rough.outputs["Color"], separate.inputs["Color"])
    nodes.links.new(separate.outputs["Red"], bsdf.inputs["Roughness"])
    normal_map = nodes.nodes.new("ShaderNodeNormalMap")
    normal_map.inputs["Strength"].default_value = 0.55
    nodes.links.new(normal.outputs["Color"], normal_map.inputs["Color"])
    nodes.links.new(normal_map.outputs["Normal"], bsdf.inputs["Normal"])
    return material


def rubber_material():
    material = new_material("DoorSeal")
    bsdf = principled(material)
    bsdf.inputs["Base Color"].default_value = (0.012, 0.012, 0.013, 1)
    bsdf.inputs["Roughness"].default_value = 0.88
    bsdf.inputs["Metallic"].default_value = 0
    return material


def wood_material(name, dark, light):
    material = new_material(name)
    bsdf = principled(material)
    bsdf.inputs["Roughness"].default_value = 0.74
    nodes = material.node_tree
    wave = nodes.nodes.new("ShaderNodeTexWave")
    wave.inputs["Scale"].default_value = 9
    wave.inputs["Distortion"].default_value = 3
    wave.inputs["Detail Scale"].default_value = 4
    mix = nodes.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.inputs["A"].default_value = (*dark, 1)
    mix.inputs["B"].default_value = (*light, 1)
    nodes.links.new(wave.outputs["Fac"], mix.inputs["Factor"])
    nodes.links.new(mix.outputs["Result"], bsdf.inputs["Base Color"])
    bump = nodes.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.22
    nodes.links.new(wave.outputs["Fac"], bump.inputs["Height"])
    nodes.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return material


def asphalt_material():
    material = new_material("Asphalt")
    bsdf = principled(material)
    bsdf.inputs["Roughness"].default_value = 0.9
    nodes = material.node_tree
    noise = nodes.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 6
    noise.inputs["Detail"].default_value = 8
    mix = nodes.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.inputs["A"].default_value = (0.045, 0.047, 0.05, 1)
    mix.inputs["B"].default_value = (0.09, 0.09, 0.092, 1)
    nodes.links.new(noise.outputs["Fac"], mix.inputs["Factor"])
    nodes.links.new(mix.outputs["Result"], bsdf.inputs["Base Color"])
    bump = nodes.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.35
    bump.inputs["Distance"].default_value = 0.02
    nodes.links.new(noise.outputs["Fac"], bump.inputs["Height"])
    nodes.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return material


panel = panel_material()
aluminum = brushed_metal()
# Metal Plate is a green weathered diamond-plate scan. It reads as rust on a
# clean reefer, so the floor uses geometric ribs and brushed aluminum instead.
rubber = rubber_material()
wood = wood_material("PalletWood", (0.22, 0.12, 0.05), (0.42, 0.26, 0.12))
crate_wood = wood_material("CrateWood", (0.30, 0.18, 0.08), (0.55, 0.36, 0.16))
yard = asphalt_material()


def import_prototype(path, name):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    created = [obj for obj in bpy.data.objects if obj not in before]
    meshes = [obj for obj in created if obj.type == "MESH"]
    if not meshes:
        raise RuntimeError(f"No mesh in {path}")
    bpy.ops.object.select_all(action="DESELECT")
    for obj in meshes:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1:
        bpy.ops.object.join()
    obj = bpy.context.view_layer.objects.active
    for empty in created:
        if empty.type != "MESH" and empty.name in bpy.data.objects:
            bpy.data.objects.remove(empty, do_unlink=True)
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    corners = [Vector(corner) for corner in obj.bound_box]
    min_corner = Vector((min(c.x for c in corners), min(c.y for c in corners), min(c.z for c in corners)))
    max_corner = Vector((max(c.x for c in corners), max(c.y for c in corners), max(c.z for c in corners)))
    center = (min_corner + max_corner) / 2
    obj.location = (-center.x, -center.y, -min_corner.z)
    bpy.ops.object.transform_apply(location=True)
    corners = [Vector(corner) for corner in obj.bound_box]
    size = Vector((
        max(c.x for c in corners) - min(c.x for c in corners),
        max(c.y for c in corners) - min(c.y for c in corners),
        max(c.z for c in corners) - min(c.z for c in corners),
    ))
    obj.name = name
    obj.hide_render = True
    obj.hide_set(True)
    print("PROTOTYPE", name, tuple(round(v, 4) for v in size))
    return obj, size


def spawn(src, name, location, rotation=(0, 0, 0), scale=(1, 1, 1)):
    obj = src.copy()
    obj.data = src.data
    obj.name = name
    link_obj(obj)
    obj.location = location
    obj.rotation_euler = rotation
    obj.scale = scale
    obj.hide_render = False
    obj.hide_set(False)
    return obj


box_proto, box_size = import_prototype(
    os.path.join(ASSETS, "cardboard_box_01", "cardboard_box_01_2k.gltf"),
    "ProtoCarton",
)
apple_proto, apple_size = import_prototype(
    os.path.join(ASSETS, "food_apple_01", "food_apple_01_2k.gltf"),
    "ProtoApple",
)

# --- trailer shell ------------------------------------------------------------

finish_box("FloorPlate", (WIDTH, DEPTH, 0.03), aluminum, (0, -DEPTH / 2, -0.015))
rib_pitch = 0.042
rib_x = -WIDTH / 2 + 0.02
rib_index = 0
while rib_x < WIDTH / 2 - 0.02:
    finish_box(
        f"FloorRib{rib_index}",
        (0.012, DEPTH - 0.04, 0.024),
        aluminum,
        (rib_x, -DEPTH / 2, 0.012),
    )
    rib_x += rib_pitch
    rib_index += 1

finish_box("WallL", (0.07, DEPTH, HEIGHT), panel, (-WIDTH / 2 - 0.035, -DEPTH / 2, HEIGHT / 2))
finish_box("WallR", (0.07, DEPTH, HEIGHT), panel, (WIDTH / 2 + 0.035, -DEPTH / 2, HEIGHT / 2))
finish_box("Ceiling", (WIDTH + 0.14, DEPTH, 0.07), panel, (0, -DEPTH / 2, HEIGHT + 0.035))
finish_box("FrontWall", (WIDTH, 0.07, HEIGHT), panel, (0, -DEPTH - 0.035, HEIGHT / 2))
for index, y in enumerate((-0.4, -1.7, -3.0, -4.3, -5.6, -6.9)):
    finish_box(f"SeamL{index}", (0.012, 0.02, HEIGHT - 0.08), panel, (-WIDTH / 2 + 0.008, y, HEIGHT / 2))
    finish_box(f"SeamR{index}", (0.012, 0.02, HEIGHT - 0.08), panel, (WIDTH / 2 - 0.008, y, HEIGHT / 2))
finish_box("KickL", (0.01, DEPTH - 0.1, 0.18), aluminum, (-WIDTH / 2 + 0.012, -DEPTH / 2, 0.1))
finish_box("KickR", (0.01, DEPTH - 0.1, 0.18), aluminum, (WIDTH / 2 - 0.012, -DEPTH / 2, 0.1))

finish_box("Header", (WIDTH + 0.28, 0.12, 0.12), aluminum, (0, 0.02, HEIGHT + 0.02))
finish_box("Sill", (WIDTH + 0.18, 0.18, 0.07), aluminum, (0, 0.08, 0.035))
finish_box("PostL", (0.09, 0.14, HEIGHT + 0.08), aluminum, (-WIDTH / 2 - 0.06, 0.03, HEIGHT / 2))
finish_box("PostR", (0.09, 0.14, HEIGHT + 0.08), aluminum, (WIDTH / 2 + 0.06, 0.03, HEIGHT / 2))
finish_box("Bumper", (WIDTH + 0.3, 0.08, 0.1), aluminum, (0, 0.24, 0.32))
finish_box("ExteriorL", (0.05, DEPTH, HEIGHT + 0.22), panel, (-WIDTH / 2 - 0.13, -DEPTH / 2 + 0.15, HEIGHT / 2))
finish_box("ExteriorR", (0.05, DEPTH, HEIGHT + 0.22), panel, (WIDTH / 2 + 0.13, -DEPTH / 2 + 0.15, HEIGHT / 2))
finish_box("ExteriorRoof", (WIDTH + 0.32, DEPTH, 0.06), panel, (0, -DEPTH / 2 + 0.15, HEIGHT + 0.12))
finish_box("Yard", (24, 24, 0.04), yard, (0, 2.0, -0.05))

evap_y = -4.35
finish_box("Evaporator", (1.55, 0.7, 0.32), panel, (0, evap_y, HEIGHT - 0.24))
for index, z_off in enumerate((0.04, 0.0, -0.04)):
    finish_box(
        f"EvapSlot{index}",
        (1.15, 0.02, 0.018),
        rubber,
        (0, evap_y + 0.32, HEIGHT - 0.22 + z_off),
    )
finish_box("EvapReturn", (1.05, 0.04, 0.06), rubber, (0, evap_y + 0.3, HEIGHT - 0.48))


def add_door(name, hinge_x, open_angle, toward_center):
    hinge = bpy.data.objects.new(name + "Hinge", None)
    link_obj(hinge)
    hinge.location = (hinge_x, 0.04, 0)
    hinge.rotation_euler = (0, 0, open_angle)
    leaf_w = WIDTH / 2 - 0.045
    leaf_h = HEIGHT - 0.16
    leaf = finish_box(
        name,
        (leaf_w, 0.072, leaf_h),
        panel,
        (toward_center * leaf_w / 2, 0.05, HEIGHT / 2),
        parent=hinge,
    )
    finish_box(
        name + "SealTop",
        (leaf_w * 0.92, 0.018, 0.035),
        rubber,
        (toward_center * leaf_w / 2, 0.095, HEIGHT - 0.12),
        parent=hinge,
    )
    finish_box(
        name + "SealBottom",
        (leaf_w * 0.92, 0.018, 0.035),
        rubber,
        (toward_center * leaf_w / 2, 0.095, 0.16),
        parent=hinge,
    )
    finish_box(
        name + "LockBar",
        (0.025, 0.025, leaf_h * 0.78),
        aluminum,
        (toward_center * (leaf_w - 0.1), 0.1, HEIGHT / 2),
        parent=hinge,
    )
    for index, z in enumerate((0.42, HEIGHT / 2, HEIGHT - 0.42)):
        mesh = bpy.data.meshes.new(name + f"Pin{index}")
        bm = __import__("bmesh").new()
        __import__("bmesh").ops.create_cone(
            bm, cap_ends=True, segments=16, radius1=0.02, radius2=0.02, depth=0.16
        )
        bm.to_mesh(mesh)
        bm.free()
        pin = bpy.data.objects.new(name + f"Pin{index}", mesh)
        pin.data.materials.append(aluminum)
        link_obj(pin)
        pin.parent = hinge
        pin.matrix_parent_inverse = Matrix.Identity(4)
        pin.location = (0, 0, z)
    return hinge, leaf


door_l_hinge, door_l = add_door("DoorL", -WIDTH / 2 - 0.01, math.radians(64), 1)
door_r_hinge, door_r = add_door("DoorR", WIDTH / 2 + 0.01, math.radians(-64), -1)

# --- cargo --------------------------------------------------------------------

PALLET_L = 1.20
PALLET_W = 0.80
DECK_Z = 0.144


def build_pallet(name, center):
    x, y = center
    z0 = 0.02
    for sx in (-0.32, 0, 0.32):
        finish_box(
            f"{name}Stringer{sx}",
            (0.09, PALLET_L - 0.02, 0.095),
            wood,
            (x + sx, y, z0 + 0.047),
        )
    for index, sy in enumerate((-0.52, -0.26, 0, 0.26, 0.52)):
        finish_box(
            f"{name}Deck{index}",
            (PALLET_W - 0.02, 0.09, 0.02),
            wood,
            (x, y + sy, z0 + 0.105),
        )
    for sy in (-0.5, 0.5):
        finish_box(
            f"{name}Bottom{sy}",
            (PALLET_W - 0.04, 0.09, 0.02),
            wood,
            (x, y + sy, z0 + 0.01),
        )
    return z0 + DECK_Z


def build_crate(name, center, floor_z):
    x, y = center
    cw, cd, ch = 0.74, 1.08, 0.25
    post = 0.032
    for px in (-cw / 2 + post / 2, cw / 2 - post / 2):
        for py in (-cd / 2 + post / 2, cd / 2 - post / 2):
            finish_box(f"{name}Post{px:.2f}{py:.2f}", (post, post, ch), crate_wood, (x + px, y + py, floor_z + ch / 2))
    slat_h = 0.042
    for index, sz in enumerate((0.028, 0.095)):
        finish_box(
            f"{name}SideL{index}",
            (0.014, cd - 0.02, slat_h),
            crate_wood,
            (x - cw / 2, y, floor_z + sz),
        )
        finish_box(
            f"{name}SideR{index}",
            (0.014, cd - 0.02, slat_h),
            crate_wood,
            (x + cw / 2, y, floor_z + sz),
        )
        finish_box(
            f"{name}EndF{index}",
            (cw - 0.02, 0.014, slat_h),
            crate_wood,
            (x, y + cd / 2, floor_z + sz),
        )
        finish_box(
            f"{name}EndB{index}",
            (cw - 0.02, 0.014, slat_h),
            crate_wood,
            (x, y - cd / 2, floor_z + sz),
        )
    for index, sy in enumerate((-0.36, -0.12, 0.12, 0.36)):
        finish_box(
            f"{name}Bottom{index}",
            (cw - 0.08, 0.08, 0.014),
            crate_wood,
            (x, y + sy, floor_z + 0.012),
        )
    return cw, cd, ch


def fill_apples(name, center, floor_z, layers, inset=0.08):
    x, y = center
    span_x = 0.74 - inset * 2
    span_y = 1.08 - inset * 2
    spacing = max(apple_size.x, apple_size.y) * 0.98
    count = 0
    for layer in range(layers):
        row = 0
        px = -span_x / 2
        while px <= span_x / 2:
            py = -span_y / 2 + (spacing * 0.42 if row % 2 else 0)
            while py <= span_y / 2:
                spawn(
                    apple_proto,
                    f"{name}Apple{count}",
                    (
                        x + px + random.uniform(-0.003, 0.003),
                        y + py + random.uniform(-0.003, 0.003),
                        floor_z + layer * apple_size.z * 0.78,
                    ),
                    rotation=(
                        random.uniform(0, math.tau),
                        random.uniform(0, math.tau),
                        random.uniform(0, math.tau),
                    ),
                    scale=(random.uniform(0.94, 1.08),) * 3,
                )
                count += 1
                py += spacing
            px += spacing * 0.88
            row += 1
    return count


def stack_cartons(name, center, floor_z, layers, cols, rows, yaw):
    """Carton origin sits on its base. Every layer keeps the same footprint."""
    rotated = abs(math.sin(yaw)) > 0.5
    step_x = box_size.y if rotated else box_size.x
    step_y = box_size.x if rotated else box_size.y
    step_z = box_size.z
    gap = 0.012
    total_x = cols * step_x + (cols - 1) * gap
    total_y = rows * step_y + (rows - 1) * gap
    placed = 0
    for layer in range(layers):
        for col in range(cols):
            for row in range(rows):
                lx = -total_x / 2 + step_x / 2 + col * (step_x + gap)
                ly = -total_y / 2 + step_y / 2 + row * (step_y + gap)
                spawn(
                    box_proto,
                    f"{name}{placed}",
                    (
                        center[0] + lx + random.uniform(-0.003, 0.003),
                        center[1] + ly + random.uniform(-0.003, 0.003),
                        floor_z + layer * (step_z + 0.004),
                    ),
                    rotation=(0, 0, yaw + random.uniform(-0.012, 0.012)),
                    scale=(1, 1, 1),
                )
                placed += 1
    return placed


lane_x = 0.50
front_y = -1.72
back_y = -3.20

left_floor = build_pallet("PalletLF", (-lane_x, front_y))
crate_z = left_floor
apple_count = 0
for index in range(5):
    nudge = (0.006 if index % 2 else -0.004, 0.004 if index % 3 == 0 else -0.003)
    build_crate(f"Crate{index}", (-lane_x + nudge[0], front_y + nudge[1]), crate_z)
    if index == 4:
        apple_count += fill_apples(f"Top{index}", (-lane_x, front_y), crate_z + 0.168, 2, inset=0.05)
    crate_z += 0.252

right_floor = build_pallet("PalletRF", (lane_x, front_y))
cartons = stack_cartons("CartonRF", (lane_x, front_y), right_floor, 4, 2, 2, 0.0)
left_back = build_pallet("PalletLB", (-lane_x, back_y))
cartons += stack_cartons("CartonLB", (-lane_x, back_y), left_back, 4, 1, 3, math.radians(90))
right_back = build_pallet("PalletRB", (lane_x, back_y))
cartons += stack_cartons("CartonRB", (lane_x, back_y), right_back, 3, 2, 2, math.radians(180))
print("CARGO", "apples", apple_count, "cartons", cartons, "box", tuple(round(v, 3) for v in box_size))

# --- camera -------------------------------------------------------------------

bpy.ops.object.camera_add(location=(0, 4.2, 1.50))
camera = bpy.context.active_object
camera.name = "Frame0Camera"
camera.data.lens = 30
camera.data.sensor_width = 36
camera.data.clip_start = 0.05
camera.data.clip_end = 40
scene.camera = camera
look_target = Vector((0, -2.45, 1.12))


def aim_camera():
    direction = look_target - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def framing_errors():
    bpy.context.view_layer.update()
    points = []
    for door in (door_l, door_r):
        points.extend(door.matrix_world @ Vector(corner) for corner in door.bound_box)
    points.extend((
        Vector((0, 0.08, 0.05)),
        Vector((0, 1.35, 0.0)),
        Vector((0, -1.7, 1.15)),
        Vector((0, evap_y, HEIGHT - 0.22)),
    ))
    errors = []
    for point in points:
        projected = world_to_camera_view(scene, camera, point)
        if projected.z <= 0 or not (0.02 < projected.x < 0.98 and 0.02 < projected.y < 0.98):
            errors.append((tuple(round(v, 2) for v in point), tuple(round(v, 3) for v in projected)))
    return errors


aim_camera()
print("CAMERA", tuple(round(v, 3) for v in camera.location), "lens", camera.data.lens)
print("LOOK", tuple(round(v, 3) for v in look_target))
print("FRAME_ERRORS", len(framing_errors()))
for item in framing_errors()[:8]:
    print(" OUT", item)

# --- light --------------------------------------------------------------------

world = bpy.data.worlds.new("Kloofendal")
scene.world = world
world.use_nodes = True
nodes = world.node_tree
env = nodes.nodes.new("ShaderNodeTexEnvironment")
env.image = load_image(os.path.join(ASSETS, "hdri", "kloofendal_overcast_4k.hdr"), "Non-Color")
try:
    env.image.colorspace_settings.name = "Linear Rec.709"
except TypeError:
    pass
mapping = nodes.nodes.new("ShaderNodeMapping")
mapping.inputs["Rotation"].default_value = (0, 0, math.radians(200))
texcoord = nodes.nodes.new("ShaderNodeTexCoord")
nodes.links.new(texcoord.outputs["Generated"], mapping.inputs["Vector"])
nodes.links.new(mapping.outputs["Vector"], env.inputs["Vector"])
background = nodes.nodes["Background"]
nodes.links.new(env.outputs["Color"], background.inputs["Color"])
background.inputs["Strength"].default_value = 0.42

bpy.ops.object.light_add(type="AREA", location=(0, 5.4, 2.35))
key = bpy.context.active_object
key.name = "DoorDaylight"
key.data.energy = 180
key.data.color = (0.78, 0.86, 1.0)
key.data.shape = "RECTANGLE"
key.data.size = 3.4
key.data.size_y = 2.4
key.rotation_euler = (math.radians(-90), 0, 0)

scene.render.engine = "CYCLES"
scene.cycles.samples = 20 if PREVIEW else 80
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 6
scene.cycles.transmission_bounces = 4
scene.cycles.sample_clamp_indirect = 10
scene.render.resolution_x = 960 if PREVIEW else 1920
scene.render.resolution_y = 540 if PREVIEW else 1080
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.view_settings.exposure = 0.05

prefs = bpy.context.preferences.addons["cycles"].preferences
prefs.get_devices()
for device_type in ("OPTIX", "CUDA", "HIP", "ONEAPI", "METAL"):
    try:
        prefs.compute_device_type = device_type
        break
    except TypeError:
        continue
used = []
for device in prefs.devices:
    if device.type != "CPU":
        device.use = True
        used.append(device.name)
scene.cycles.device = "GPU" if used else "CPU"
print("CYCLES_DEVICE", scene.cycles.device, used or "cpu-only")

if PREVIEW:
    scene.render.filepath = os.path.join(ASSETS, "preview_frame0_v2.png")
else:
    scene.render.filepath = r"C:\Coldi\Asset\cinematic\frames\phase-1\frame_000_v2.png"
    blend_path = r"C:\Coldi\Asset\cinematic\blender\coldi-reefer-frame0-v2.blend"
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print("BLEND_SAVED", blend_path)

scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGB"
bpy.ops.render.render(write_still=True)
print("FRAME0_V2_DONE", scene.render.filepath)
