"""Author Burger Town's layered food meshes and export the runtime GLBs."""
import math
import random
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.unit_settings.system = 'METRIC'
rng = random.Random(42)

def pigment(name, color, roughness=.48):
    mat = bpy.data.materials.new(name)
    rgb = [int(color[i:i+2], 16) / 255 for i in (0, 2, 4)]
    rgb = [v / 12.92 if v < .04045 else ((v + .055) / 1.055) ** 2.4 for v in rgb]
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*rgb, 1)
    shader.inputs['Roughness'].default_value = roughness
    mat.diffuse_color = (*rgb, 1)
    return mat

crust = pigment('Glazed sesame bun', 'e99a3b', .34)
crumb = pigment('Cut brioche', 'ffd17d')
sesame = pigment('Toasted sesame', 'fff0bd')
cheddar = pigment('Melted cheddar', 'ffbc38', .35)
rind = pigment('Tomato skin', 'd7362a', .31)
juice = pigment('Tomato flesh', 'fa604a', .35)
leaf = pigment('Curled lettuce', '68ab42')
rib = pigment('Lettuce rib', 'a2c755')
porcelain = pigment('Cream glaze', 'fff1db', .29)
stain = pigment('Sauce smudge', 'bf704b')
patty_colors = {
    'raw': ('d65e68', 'f7a088'),
    'cooking': ('ac534a', '6b312a'),
    'perfect': ('834324', '472415'),
    'overcooked': ('583122', '321d16'),
    'burnt': ('272224', '100e12'),
}

def finish(parent, name, mat, smooth=True):
    ob = bpy.context.object
    ob.name = name
    ob.parent = parent
    ob.data.materials.append(mat)
    for face in ob.data.polygons:
        face.use_smooth = smooth
    return ob

def oval(root, name, mat, xyz, axes):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=10, ring_count=6, location=xyz)
    ob = finish(root, name, mat)
    ob.scale = axes
    return ob

def profile(root, name, mat, rings, wave=0, count=40):
    vertices = []
    for radius, height in rings:
        for i in range(count):
            angle = i * math.tau / count
            r = radius * (1 + wave * math.sin(7 * angle) + wave * .5 * math.cos(11 * angle))
            vertices.append((r * math.cos(angle), r * math.sin(angle),
                             height + radius * wave * math.cos(6 * angle)))
    quads = [(r*count+i, r*count+(i+1)%count, (r+1)*count+(i+1)%count, (r+1)*count+i)
             for r in range(len(rings)-1) for i in range(count)]
    faces = [tuple(reversed(range(count))), *quads,
             tuple(range((len(rings)-1)*count, len(rings)*count))]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    ob = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(ob)
    ob.parent = root
    mesh.materials.append(mat)
    for polygon in mesh.polygons:
        polygon.use_smooth = len(polygon.vertices) == 4
    return ob

def model(key):
    root = bpy.data.objects.new(key, None)
    bpy.context.collection.objects.link(root)
    if key in ('plate', 'dirty'):
        profile(root, 'Turned ceramic plate', porcelain,
                [(.17,0),(.21,.007),(.27,.034),(.279,.052),(.271,.062),(.241,.060),(.199,.035),(.005,.032)])
        if key == 'dirty':
            for i in range(7):
                oval(root, 'Sauce', stain, (rng.uniform(-.15,.15),rng.uniform(-.09,.09),.036),
                     (.014+i*.006,.026,.006))
    elif key == 'bun_bottom':
        profile(root, 'Toasted lower bun', crust,
                [(.182,0),(.222,.012),(.231,.036),(.226,.057),(.207,.071)])
        profile(root, 'Toasted cut surface', crumb, [(.214,.059),(.216,.066),(.205,.074)])
    elif key == 'bun_top':
        profile(root, 'Brioche crown', crust,
                [(.207,0),(.239,.013),(.237,.048),(.217,.092),(.177,.124),(.109,.147),(.008,.155)])
        for i in range(19):
            angle = i * 2.399963
            radius = .196 * math.sqrt((i+.5)/19)
            height = .151 - 1.77 * radius**2
            seed = oval(root, 'Sesame', sesame, (radius*math.cos(angle),radius*math.sin(angle),height),
                        (.012,.005,.004))
            seed.rotation_euler.z = rng.uniform(-math.pi,math.pi)
    elif key in patty_colors:
        meat_color, sear_color = patty_colors[key]
        meat = pigment(key+' ground patty', meat_color)
        sear = pigment(key+' grill marks', sear_color)
        profile(root, 'Hand pressed patty', meat,
                [(.178,0),(.214,.010),(.223,.033),(.216,.064),(.182,.079)], .031)
        for i in range(19):
            angle = i * 2.399963
            r = .206 if i % 2 else .183
            oval(root, 'Charred edge' if key != 'raw' else 'Ground meat fleck', sear,
                 (r*math.cos(angle),r*math.sin(angle),.047+i%3*.009),(.015,.009,.006))
        for x in (-.115,0,.115):
            mark = oval(root, 'Pressed grill line', sear, (x,0,.079),(.011,.125,.008))
            mark.rotation_euler.z = -.25
    elif key == 'cheese':
        profile(root, 'Folded cheddar', cheddar, [(.268,0),(.26,.027),(.249,.036)], .045, 4).rotation_euler.z = .27
    elif key == 'tomato_raw':
        oval(root, 'Heirloom tomato', rind, (0,0,.144), (.176,.17,.15))
        for i in range(5):
            direction = i * math.tau / 5
            top = oval(root, 'Calyx', leaf, (.043*math.cos(direction),.043*math.sin(direction),.287),(.078,.018,.011))
            top.rotation_euler.z = direction
    elif key == 'tomato_prepped':
        for j, (x,y) in enumerate(((-.078,0),(.073,.022))):
            section = bpy.data.objects.new('Tomato slice', None)
            bpy.context.collection.objects.link(section)
            section.parent = root
            section.location = (x,y,j*.03)
            profile(section, 'Slice skin', rind, [(.128,0),(.139,.006),(.139,.034),(.129,.043)])
            profile(section, 'Cut flesh', juice, [(.12,.04),(.125,.043),(.002,.044)])
            for i in range(6):
                a = i * math.tau/6
                seed = oval(section,'Tomato seed',sesame,(.079*math.cos(a),.079*math.sin(a),.045),(.013,.005,.003))
                seed.rotation_euler.z = a
    elif key == 'lettuce_raw':
        for i, (r,h) in enumerate(((.142,.055),(.174,.105),(.148,.171),(.108,.216),(.057,.25))):
            profile(root,'Ruffled leaf',leaf if i%2 else rib,[(r*.64,h-.023),(r,h),(r*.94,h+.041),(r*.58,h+.023)],.14)
    elif key == 'lettuce_prepped':
        profile(root,'Shingled chopped lettuce', leaf,
                [(.16,0),(.228,.016),(.225,.044),(.156,.051),(.004,.038)], .14)
        for i in range(8):
            a = i * math.tau/8
            fragment = oval(root,'Chopped leaf edge',rib,(.165*math.cos(a),.165*math.sin(a),.035),(.065,.035,.018))
            fragment.rotation_euler.z = a
    return root

def descendants(root):
    yield root
    for ob in root.children:
        yield from descendants(ob)

output = ROOT / 'assets/runtime/food'
output.mkdir(parents=True,exist_ok=True)
for key in ('plate','dirty','bun_bottom','bun_top','cheese','tomato_raw','tomato_prepped',
            'lettuce_raw','lettuce_prepped',*patty_colors):
    root = model(key)
    bpy.ops.object.select_all(action='DESELECT')
    for ob in descendants(root):
        ob.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(output / (key+'.glb')),
                              use_selection=True, export_animations=False)
source = ROOT / 'assets/source/burger-town-food.blend'
source.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(source))
