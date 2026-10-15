"""Original Frame 0 reefer interior. Style reference only; no branded marks."""

import math
import random

import bpy
from mathutils import Vector

random.seed(15)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = "METRIC"
scene.unit_settings.scale_length = 1.0

# --- materials ----------------------------------------------------------------

def new_material(name):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    material.node_tree.nodes.clear()
    return material


def principled(material):
    node = material.node_tree.nodes.new("ShaderNodeBsdfPrincipled")
    out = material.node_tree.nodes.new("ShaderNodeOutputMaterial")
    material.node_tree.links.new(node.outputs["BSDF"], out.inputs["Surface"])
    return node


def link(material, a, b):
    material.node_tree.links.new(a, b)


panel = new_material("InsulatedPanel")
p = principled(panel)
p.inputs["Base Color"].default_value = (0.72, 0.75, 0.77, 1)
p.inputs["Roughness"].default_value = 0.48
p.inputs["Specular IOR Level"].default_value = 0.35
noise = panel.node_tree.nodes.new("ShaderNodeTexNoise")
noise.inputs["Scale"].default_value = 18
noise.inputs["Detail"].default_value = 6
bump = panel.node_tree.nodes.new("ShaderNodeBump")
bump.inputs["Strength"].default_value = 0.08
bump.inputs["Distance"].default_value = 0.004
link(panel, noise.outputs["Fac"], bump.inputs["Height"])
link(panel, bump.outputs["Normal"], p.inputs["Normal"])

aluminum = new_material("Aluminum")
a = principled(aluminum)
a.inputs["Base Color"].default_value = (0.62, 0.64, 0.66, 1)
a.inputs["Metallic"].default_value = 1
a.inputs["Roughness"].default_value = 0.32
a.inputs["Anisotropic"].default_value = 0.45
a.inputs["Anisotropic Rotation"].default_value = 0.25

hardware = new_material("Hardware")
h = principled(hardware)
h.inputs["Base Color"].default_value = (0.55, 0.56, 0.58, 1)
h.inputs["Metallic"].default_value = 1
h.inputs["Roughness"].default_value = 0.38

rubber = new_material("Rubber")
r = principled(rubber)
r.inputs["Base Color"].default_value = (0.015, 0.016, 0.017, 1)
r.inputs["Roughness"].default_value = 0.86
r.inputs["Metallic"].default_value = 0

wood = new_material("Wood")
w = principled(wood)
w.inputs["Base Color"].default_value = (0.28, 0.15, 0.07, 1)
w.inputs["Roughness"].default_value = 0.72
grain = wood.node_tree.nodes.new("ShaderNodeTexWave")
grain.inputs["Scale"].default_value = 12
grain.inputs["Distortion"].default_value = 2
mix = wood.node_tree.nodes.new("ShaderNodeMix")
mix.data_type = "RGBA"
mix.inputs["A"].default_value = (0.22, 0.11, 0.05, 1)
mix.inputs["B"].default_value = (0.45, 0.28, 0.14, 1)
link(wood, grain.outputs["Fac"], mix.inputs["Factor"])
link(wood, mix.outputs["Result"], w.inputs["Base Color"])
wb = wood.node_tree.nodes.new("ShaderNodeBump")
wb.inputs["Strength"].default_value = 0.25
link(wood, grain.outputs["Fac"], wb.inputs["Height"])
link(wood, wb.outputs["Normal"], w.inputs["Normal"])

cardboard = new_material("Cardboard")
c = principled(cardboard)
c.inputs["Roughness"].default_value = 0.78
c.inputs["Specular IOR Level"].default_value = 0.22
info = cardboard.node_tree.nodes.new("ShaderNodeObjectInfo")
ramp = cardboard.node_tree.nodes.new("ShaderNodeValToRGB")
ramp.color_ramp.elements[0].color = (0.62, 0.48, 0.32, 1)
ramp.color_ramp.elements[1].color = (0.78, 0.64, 0.45, 1)
fiber = cardboard.node_tree.nodes.new("ShaderNodeTexNoise")
fiber.inputs["Scale"].default_value = 45
fiber.inputs["Detail"].default_value = 8
cmix = cardboard.node_tree.nodes.new("ShaderNodeMix")
cmix.data_type = "RGBA"
cmix.inputs["Factor"].default_value = 0.35
link(cardboard, info.outputs["Random"], ramp.inputs["Fac"])
link(cardboard, ramp.outputs["Color"], cmix.inputs["A"])
link(cardboard, fiber.outputs["Color"], cmix.inputs["B"])
link(cardboard, cmix.outputs["Result"], c.inputs["Base Color"])
cb = cardboard.node_tree.nodes.new("ShaderNodeBump")
cb.inputs["Strength"].default_value = 0.18
link(cardboard, fiber.outputs["Fac"], cb.inputs["Height"])
link(cardboard, cb.outputs["Normal"], c.inputs["Normal"])

fruit = new_material("Citrus")
f = principled(fruit)
f.inputs["Base Color"].default_value = (0.85, 0.32, 0.05, 1)
f.inputs["Roughness"].default_value = 0.38
f.inputs["Subsurface Weight"].default_value = 0.12
f.inputs["Subsurface Radius"].default_value = (0.4, 0.12, 0.04)
fn = fruit.node_tree.nodes.new("ShaderNodeTexNoise")
fn.inputs["Scale"].default_value = 30
fb = fruit.node_tree.nodes.new("ShaderNodeBump")
fb.inputs["Strength"].default_value = 0.15
link(fruit, fn.outputs["Fac"], fb.inputs["Height"])
link(fruit, fb.outputs["Normal"], f.inputs["Normal"])

wrap = new_material("Wrap")
wrap.surface_render_method = "BLENDED"
wp = principled(wrap)
wp.inputs["Base Color"].default_value = (0.9, 0.92, 0.93, 1)
wp.inputs["Roughness"].default_value = 0.18
wp.inputs["Transmission Weight"].default_value = 1
wp.inputs["IOR"].default_value = 1.46
wp.inputs["Alpha"].default_value = 0.25

concrete = new_material("Yard")
yc = principled(concrete)
yc.inputs["Base Color"].default_value = (0.16, 0.17, 0.18, 1)
yc.inputs["Roughness"].default_value = 0.62

# --- helpers ------------------------------------------------------------------

def cube(name, location, size, material, rotation=(0, 0, 0), bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location, rotation=rotation)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    if bevel > 0:
        modifier = obj.modifiers.new("Bevel", "BEVEL")
        modifier.width = bevel
        modifier.segments = 1
    obj.data.materials.append(material)
    return obj


def cylinder(name, location, radius, depth, material, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(
        radius=radius, depth=depth, location=location, rotation=rotation, vertices=16
    )
    obj = bpy.context.active_object
    obj.name = name
    obj.data.materials.append(material)
    return obj


# Interior envelope. Door plane is Y=0. Cargo sits in negative Y. Camera is in positive Y.
WIDTH = 2.46
HEIGHT = 2.52
DEPTH = 7.4

cube("FloorPlate", (0, -DEPTH / 2, -0.02), (WIDTH, DEPTH, 0.04), aluminum)
for index, x in enumerate([i * 0.045 - WIDTH / 2 + 0.02 for i in range(int(WIDTH / 0.045))]):
    cube(f"Rib{index}", (x, -DEPTH / 2, 0.012), (0.012, DEPTH, 0.02), aluminum)

for side, x in (("L", -WIDTH / 2), ("R", WIDTH / 2)):
    cube(f"Wall{side}", (x, -DEPTH / 2, HEIGHT / 2), (0.04, DEPTH, HEIGHT), panel)
    direction = 1 if side == "L" else -1
    for index, y in enumerate([i * 0.22 for i in range(int(DEPTH / 0.22))]):
        cube(
            f"WallRib{side}{index}",
            (x + direction * 0.028, -0.1 - y, HEIGHT / 2),
            (0.012, 0.04, HEIGHT),
            panel,
        )

cube("Ceiling", (0, -DEPTH / 2, HEIGHT), (WIDTH, DEPTH, 0.05), panel)
cube("FrontWall", (0, -DEPTH, HEIGHT / 2), (WIDTH, 0.05, HEIGHT), panel)

# Evaporator on the front wall, high, facing the doors.
evap_y = -DEPTH + 0.28
cube("Evaporator", (0, evap_y, HEIGHT - 0.42), (1.55, 0.42, 0.48), hardware, bevel=0.008)
for index, x in enumerate((-0.42, 0, 0.42)):
    cylinder(
        f"Fan{index}",
        (x, evap_y + 0.22, HEIGHT - 0.46),
        0.13,
        0.04,
        rubber,
        rotation=(math.radians(90), 0, 0),
    )
cube("ReturnGrille", (0, evap_y + 0.22, HEIGHT - 0.78), (1.15, 0.02, 0.08), rubber)

# Rear frame. This is the door surround only, not the rest of the truck.
cube("Header", (0, 0.02, HEIGHT - 0.04), (WIDTH + 0.16, 0.1, 0.1), hardware)
cube("Sill", (0, 0.04, 0.04), (WIDTH + 0.12, 0.12, 0.08), hardware)
cube("PostL", (-WIDTH / 2 - 0.02, 0.02, HEIGHT / 2), (0.08, 0.1, HEIGHT), hardware)
cube("PostR", (WIDTH / 2 + 0.02, 0.02, HEIGHT / 2), (0.08, 0.1, HEIGHT), hardware)

def door(name, hinge_x, swing):
    leaf_width = WIDTH / 2 - 0.02
    leaf = cube(
        name,
        (hinge_x + math.copysign(leaf_width / 2, -hinge_x) * 0, 0.06, HEIGHT / 2),
        (leaf_width, 0.075, HEIGHT - 0.12),
        panel,
        bevel=0.006,
    )
    # Rebuild around the hinge so the swing is a real rotation.
    bpy.context.view_layer.objects.active = leaf
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
    saved = bpy.context.scene.cursor.location.copy()
    bpy.context.scene.cursor.location = (hinge_x, 0.02, HEIGHT / 2)
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
    bpy.context.scene.cursor.location = saved
    leaf.rotation_euler[2] = swing
    for height in (0.28, HEIGHT / 2, HEIGHT - 0.28):
        cylinder(f"{name}Hinge{height:.2f}", (hinge_x, 0.02, height), 0.018, 0.11, hardware)
    seal = cube(f"{name}Seal", leaf.location, (leaf_width - 0.08, 0.02, HEIGHT - 0.22), rubber)
    seal.rotation_euler[2] = swing
    seal.parent = leaf
    seal.location = (0, 0.04 if hinge_x < 0 else 0.04, 0)
    return leaf


# Cursor origin trick is fragile with parenting. Build doors with an explicit matrix instead.
for obj in list(bpy.data.objects):
    if obj.name.startswith("Door"):
        bpy.data.objects.remove(obj, do_unlink=True)

def add_door(name, hinge_x, open_angle):
    leaf_width = WIDTH / 2 - 0.04
    leaf_height = HEIGHT - 0.16
    toward_center = -1 if hinge_x > 0 else 1
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0))
    leaf = bpy.context.active_object
    leaf.name = name
    leaf.scale = (leaf_width, 0.08, leaf_height)
    bpy.ops.object.transform_apply(scale=True)
    leaf.location = (toward_center * leaf_width / 2, 0.05, 0)
    bpy.ops.object.transform_apply(location=True)
    bpy.context.scene.cursor.location = (0, 0, 0)
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
    leaf.location = (hinge_x, 0.03, HEIGHT / 2)
    leaf.rotation_euler = (0, 0, open_angle)
    leaf.data.materials.append(panel)
    bevel = leaf.modifiers.new("Bevel", "BEVEL")
    bevel.width = 0.006
    bevel.segments = 1
    for index, z in enumerate((0.35, 0.0, -0.85)):
        pin = cylinder(f"{name}Pin{index}", (0, 0, 0), 0.02, 0.14, hardware)
        pin.parent = leaf
        pin.location = (0, 0, z)
    bar = cube(f"{name}Bar", (0, 0, 0), (0.02, 0.02, leaf_height * 0.86), hardware)
    bar.parent = leaf
    bar.location = (toward_center * (leaf_width - 0.12), 0.05, 0)
    gasket = cube(f"{name}Gasket", (0, 0, 0), (leaf_width * 0.92, 0.018, leaf_height * 0.94), rubber)
    gasket.parent = leaf
    gasket.location = (toward_center * leaf_width / 2, 0.045, 0)
    return leaf


add_door("DoorL", -WIDTH / 2, math.radians(108))
add_door("DoorR", WIDTH / 2, math.radians(-108))

# Pallets and cargo. First load sits far enough inside for the doors to close later.
def pallet(name, x, y):
    deck = cube(name, (x, y, 0.07), (0.8, 1.2, 0.022), wood)
    for sx in (-0.32, 0, 0.32):
        cube(f"{name}Stringer{sx}", (x + sx, y, 0.035), (0.09, 1.16, 0.07), wood)
    for sy in (-0.5, 0, 0.5):
        cube(f"{name}Board{sy}", (x, y + sy, 0.085), (0.8, 0.09, 0.018), wood)
    return deck


def carton_stack(name, x, y, layers, cols, rows):
    box_w, box_d, box_h = 0.36, 0.36, 0.23
    for layer in range(layers):
        for col in range(cols):
            for row in range(rows):
                jitter = random.uniform(-0.004, 0.004)
                cx = x + (col - (cols - 1) / 2) * (box_w + 0.012) + jitter
                cy = y + (row - (rows - 1) / 2) * (box_d + 0.012)
                cz = 0.11 + box_h / 2 + layer * (box_h + 0.004)
                cube(
                    f"{name}{layer}{col}{row}",
                    (cx, cy, cz),
                    (box_w, box_d, box_h),
                    cardboard,
                    rotation=(0, 0, random.uniform(-0.02, 0.02)),
                    bevel=0.003,
                )


def crate_stack(name, x, y, layers):
    crate_w, crate_d, crate_h = 0.72, 1.05, 0.32
    for layer in range(layers):
        cz = 0.12 + crate_h / 2 + layer * (crate_h + 0.01)
        cube(f"{name}Base{layer}", (x, y, cz - crate_h * 0.42), (crate_w, crate_d, 0.02), wood)
        for sx in (-crate_w / 2 + 0.015, crate_w / 2 - 0.015):
            cube(f"{name}Side{layer}{sx}", (x + sx, y, cz), (0.018, crate_d, crate_h), wood)
        for sy in (-crate_d / 2 + 0.015, crate_d / 2 - 0.015):
            cube(f"{name}End{layer}{sy}", (x, y + sy, cz), (crate_w, 0.018, crate_h), wood)
        if layer == layers - 1:
            for i in range(5):
                for j in range(8):
                    fx = x - 0.24 + i * 0.12
                    fy = y - 0.42 + j * 0.12
                    bpy.ops.mesh.primitive_uv_sphere_add(
                        radius=0.048, location=(fx, fy, cz + crate_h * 0.28), segments=12, ring_count=8
                    )
                    orange = bpy.context.active_object
                    orange.name = f"{name}Fruit{i}{j}"
                    orange.scale = (
                        random.uniform(0.85, 1.05),
                        random.uniform(0.85, 1.05),
                        random.uniform(0.8, 1.0),
                    )
                    orange.data.materials.append(fruit)


pallet("PalletLF", -0.58, -1.85)
crate_stack("CrateL", -0.58, -1.85, 4)
pallet("PalletRF", 0.58, -1.85)
carton_stack("CartonR", 0.58, -1.85, 7, 2, 3)
cube("WrapR", (0.58, -1.85, 0.95), (0.78, 1.16, 1.55), wrap)

pallet("PalletLB", -0.58, -3.35)
carton_stack("CartonLB", -0.58, -3.35, 6, 2, 3)
pallet("PalletRB", 0.58, -3.35)
carton_stack("CartonRB", 0.58, -3.35, 6, 2, 3)
pallet("PalletLC", 0, -4.85)
carton_stack("CartonC", 0, -4.85, 5, 2, 3)

# Yard only as a ground plane outside the opening.
cube("Yard", (0, 3.2, -0.04), (8, 8, 0.04), concrete)

# --- camera and lights --------------------------------------------------------

bpy.ops.object.camera_add(location=(0, 2.2, 1.55), rotation=(math.radians(82), 0, 0))
camera = bpy.context.active_object
camera.name = "Frame0Camera"
camera.data.lens = 35
camera.data.sensor_width = 36
camera.data.dof.use_dof = False
scene.camera = camera
direction = Vector((0, -3.4, 1.45)) - camera.location
camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()

bpy.ops.object.light_add(type="SUN", location=(0, 6, 6))
sun = bpy.context.active_object
sun.data.energy = 3.2
sun.data.color = (0.86, 0.91, 1.0)
sun.data.angle = math.radians(6)
sun.rotation_euler = (math.radians(58), 0, math.radians(180))

bpy.ops.object.light_add(type="AREA", location=(0, 2.8, 2.15))
day = bpy.context.active_object
day.data.energy = 250
day.data.color = (0.82, 0.88, 1.0)
day.data.shape = "RECTANGLE"
day.data.size = 3.2
day.data.size_y = 2.2
day.rotation_euler = (math.radians(90), 0, 0)

for index, x in enumerate((-0.45, 0.45)):
    bpy.ops.object.light_add(type="AREA", location=(x, -3.2, HEIGHT - 0.08))
    lamp = bpy.context.active_object
    lamp.data.energy = 40
    lamp.data.color = (0.72, 0.82, 1.0)
    lamp.data.shape = "RECTANGLE"
    lamp.data.size = 0.18
    lamp.data.size_y = 3.4
    lamp.rotation_euler = (math.radians(180), 0, 0)

world = bpy.data.worlds.new("ColdSky")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = (0.45, 0.55, 0.66, 1)
bg.inputs["Strength"].default_value = 0.55

scene.render.engine = "CYCLES"
scene.cycles.samples = 96
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 6
scene.cycles.transmission_bounces = 6
scene.render.resolution_x = 1600
scene.render.resolution_y = 900
scene.render.resolution_percentage = 100
scene.render.film_transparent = False
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.view_settings.exposure = 0.15

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

out_dir = r"C:\Coldi\Asset\cinematic\frames\phase-1"
scene.render.filepath = out_dir + r"\frame_000.png"
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGB"

blend_path = r"C:\Coldi\Asset\cinematic\blender\coldi-reefer-frame0.blend"
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
bpy.ops.render.render(write_still=True)
print("FRAME0_DONE", scene.render.filepath)
