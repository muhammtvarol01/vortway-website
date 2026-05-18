"""
Blender headless pipeline: textured Meshy GLB → web-optimized showcase GLB.

CRITICAL: The source GLB already has fully baked PBR materials:
  - 4096² sRGB base color (paint, decals, panel lines)
  - 4096² non-color ORM (occlusion / roughness / metallic) packed
  - 2048² non-color normal map (surface micro-detail)
  - 2048² sRGB emissive/extra

We must NOT override any material — the previous override attempt
flattened all this detail to a black silhouette. We only:

  1. Import the textured GLB (preserves all 4 textures + the principled BSDF).
  2. Clean: merge by distance, recalc normals, dissolve degenerate.
     (Light repair so Decimate doesn't shred Meshy's non-manifold seams.)
  3. Decimate to ~80k tris. The textures carry visual detail; we don't
     need ultra-dense geometry to look photoreal.
  4. Gentle gloss boost: insert a Multiply(0.78) node between the
     Roughness texture and the Roughness input so paint reads slightly
     wetter for our studio HDRI. Base color, metallic, normals all
     untouched.
  5. Recenter on origin so Three.js Box3 / scale logic stays stable.
  6. Export to assets/vortway-truck-v3.glb with textures embedded.

Run:
  & "C:\\Program Files\\Blender Foundation\\Blender 5.1\\blender.exe" `
      --background --python "tools\\process_truck.py"
"""

from __future__ import annotations

import sys
import traceback
from pathlib import Path

import bpy
from mathutils import Vector

SRC = Path(r"C:\Users\muham\Desktop\Vortway Logo\website\assets\vortway-truck-texture.glb")
OUTPUT = Path(r"C:\Users\muham\Desktop\Vortway Logo\website\assets\vortway-truck-v3.glb")
TARGET_TRIS = 400000  # premium quality pass — 400k triangles + 4K textures
                       # preserved means SCANIA badge text is crisp, orange decals
                       # are razor-clean, and panel-line micro-detail survives
                       # closeup slat camera angles.


def log(msg):
    print(f"[VORTWAY] {msg}", flush=True)


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    log("scene cleared")


def import_glb(path):
    bpy.ops.import_scene.gltf(filepath=str(path))
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    if not meshes:
        raise RuntimeError("no meshes imported")
    obj = meshes[0]
    obj.name = "vortway_truck"
    obj.data.name = "vortway_truck"
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    log(f"imported: {len(obj.data.vertices):,} verts / {len(obj.data.polygons):,} polys, "
        f"{len(obj.material_slots)} material slots, {len(bpy.data.images)} textures")
    return obj


def clean_mesh(obj):
    """Repair non-manifold geometry so Decimate doesn't fragment trailer panels.

    NOTE: remove_doubles is intentionally OFF — it merges vertices across UV
    seams which is what blew up Meshy's orange decals and SCANIA grille text
    on previous runs. We only do safe, UV-agnostic cleanups."""
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.mesh.dissolve_degenerate(threshold=1e-5)
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.object.mode_set(mode="OBJECT")
    log(f"cleaned: {len(obj.data.vertices):,} verts / {len(obj.data.polygons):,} polys")


def decimate_to_budget(obj, target_tris):
    n = len(obj.data.polygons)
    log(f"poly budget: {n:,} polys, target {target_tris:,}")
    if n <= target_tris:
        return
    ratio = max(target_tris / n, 0.04)
    log(f"Decimate ratio={ratio:.4f} (UV-seam preserving)")
    bpy.context.view_layer.objects.active = obj
    mod = obj.modifiers.new(name="Decimate", type="DECIMATE")
    mod.ratio = ratio
    mod.use_collapse_triangulate = True
    # CRITICAL for textured meshes: preserve UV island boundaries so the
    # collapse pass can't merge faces across a UV seam. Without this, every
    # texture edge (orange decals, badge text, panel paint) gets smeared
    # into adjacent UV territory.
    mod.delimit = {"UV", "SEAM", "MATERIAL"}
    bpy.ops.object.modifier_apply(modifier="Decimate")
    log(f"post-decimate: {len(obj.data.polygons):,} polys")


def gentle_gloss_boost(obj, multiplier=0.78):
    """
    Insert a Multiply node between the Roughness texture (if any) and the
    Principled BSDF Roughness input. Result: same roughness pattern, just
    scaled down → paint reads slightly glossier without affecting albedo
    or normal detail.

    If no roughness texture exists, just scale the default value.
    """
    touched = 0
    for slot in obj.material_slots:
        mat = slot.material
        if mat is None or not mat.use_nodes:
            continue
        nt = mat.node_tree
        bsdf = nt.nodes.get("Principled BSDF")
        if bsdf is None:
            continue

        rough_in = bsdf.inputs.get("Roughness")
        if rough_in is None:
            continue

        if rough_in.is_linked:
            src_socket = rough_in.links[0].from_socket
            src_node = rough_in.links[0].from_node
            # Insert Math node Multiply between src and rough_in
            mul = nt.nodes.new("ShaderNodeMath")
            mul.operation = "MULTIPLY"
            mul.inputs[1].default_value = multiplier
            mul.location = (src_node.location.x + 200, src_node.location.y - 100)
            nt.links.remove(rough_in.links[0])
            nt.links.new(src_socket, mul.inputs[0])
            nt.links.new(mul.outputs[0], rough_in)
            touched += 1
        else:
            rough_in.default_value = max(0.05, rough_in.default_value * multiplier)
            touched += 1
    log(f"gloss boost applied to {touched} material(s) with Multiply({multiplier})")


def resize_textures(max_dim=2048):
    """4K textures are overkill at the screen size this truck renders. Halving
    them quarters the bytes while staying visually indistinguishable at the
    showcase camera distance."""
    resized = 0
    for img in bpy.data.images:
        if img.size[0] <= max_dim and img.size[1] <= max_dim:
            continue
        scale = max_dim / max(img.size)
        new_w = max(1, int(img.size[0] * scale))
        new_h = max(1, int(img.size[1] * scale))
        log(f"resize {img.name}: {img.size[0]}x{img.size[1]} → {new_w}x{new_h}")
        img.scale(new_w, new_h)
        resized += 1
    log(f"resized {resized} texture(s) to ≤ {max_dim}px")


def recenter(obj):
    """Recenter on world origin so Three.js Box3 / scale logic stays stable."""
    bb_world = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    mins = Vector((min(c.x for c in bb_world), min(c.y for c in bb_world), min(c.z for c in bb_world)))
    maxs = Vector((max(c.x for c in bb_world), max(c.y for c in bb_world), max(c.z for c in bb_world)))
    center = (mins + maxs) / 2.0
    obj.location = obj.location - center
    bpy.context.view_layer.update()
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
    log("recentered to origin")


def export(path):
    path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(path),
        export_format="GLB",
        use_selection=False,
        export_apply=True,
        export_yup=True,
        export_texcoords=True,
        export_normals=True,
        export_tangents=True,
        export_materials="EXPORT",
        # JPEG-q92 retains decal sharpness while keeping file size practical.
        export_image_format="JPEG",
        export_image_quality=92,
        export_draco_mesh_compression_enable=False,
    )
    size_mb = path.stat().st_size / (1024 * 1024)
    log(f"exported {path.name} — {size_mb:.2f} MB")


def main():
    try:
        clear_scene()
        obj = import_glb(SRC)
        clean_mesh(obj)
        decimate_to_budget(obj, TARGET_TRIS)
        gentle_gloss_boost(obj, multiplier=0.78)
        # 2K @ JPEG-q92 + 400k tris is the sweet spot: SCANIA badge stays
        # crisp at closeup, but the file lands at ~20 MB instead of 46 MB.
        resize_textures(max_dim=2048)
        recenter(obj)
        export(OUTPUT)
        log("done")
        return 0
    except Exception:
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
