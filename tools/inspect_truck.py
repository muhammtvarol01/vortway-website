"""Inspect: mesh count, material slots, image textures, vertex/poly count, bbox."""
import bpy
import sys
from pathlib import Path

GLB = Path(r"C:\Users\muham\Desktop\Vortway Logo\website\assets\vortway-truck-texture.glb")

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(GLB))

print("=" * 60, flush=True)
meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
print(f"MESHES: {len(meshes)}", flush=True)
for m in meshes:
    v = len(m.data.vertices)
    p = len(m.data.polygons)
    print(f"  - {m.name}: {v:,} verts, {p:,} polys", flush=True)
    for i, slot in enumerate(m.material_slots):
        mat = slot.material
        if mat is None:
            print(f"    slot[{i}]: (empty)", flush=True)
            continue
        print(f"    slot[{i}]: {mat.name}", flush=True)
        if mat.use_nodes:
            bsdf = mat.node_tree.nodes.get("Principled BSDF")
            if bsdf:
                # show inputs that have linked image textures
                for inp_name in ("Base Color", "Metallic", "Roughness", "Normal", "Emission"):
                    inp = bsdf.inputs.get(inp_name)
                    if inp and inp.is_linked:
                        src = inp.links[0].from_node
                        if src.type == "TEX_IMAGE":
                            img = src.image
                            print(f"      {inp_name} ← TEX_IMAGE: {img.name} ({img.size[0]}x{img.size[1]})", flush=True)
                        else:
                            print(f"      {inp_name} ← {src.type}", flush=True)
                    elif inp:
                        v = inp.default_value
                        if hasattr(v, "__len__"):
                            v = [round(x, 3) for x in v]
                        else:
                            v = round(v, 3)
                        print(f"      {inp_name} = {v}", flush=True)
print(f"\nIMAGES embedded: {len(bpy.data.images)}", flush=True)
for img in bpy.data.images:
    print(f"  - {img.name}: {img.size[0]}x{img.size[1]} channels={img.channels} colorspace={img.colorspace_settings.name}", flush=True)
print("=" * 60, flush=True)
sys.exit(0)
