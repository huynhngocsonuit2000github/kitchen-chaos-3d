"""Model and animate the original Burger Town chefs on a shared articulated rig."""
import math
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.unit_settings.system = 'METRIC'
bpy.context.scene.render.fps = 30

def pigment(name, hexcode):
    mat = bpy.data.materials.new(name)
    rgb = [int(hexcode[i:i+2], 16) / 255 for i in (0, 2, 4)]
    rgb = [v / 12.92 if v < .04045 else ((v + .055) / 1.055) ** 2.4 for v in rgb]
    mat.diffuse_color = (*rgb, 1)
    mat.use_nodes = True
    mat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value = (*rgb,1)
    return mat

ivory = pigment('Vanilla cotton', 'fff0d5')
trim = pigment('Warm stitched trim', 'e1b69b')
slate = pigment('Charcoal twill', '34343e')
eye = pigment('Cocoa eyes', '322125')
hair = pigment('Chestnut hair', '633930')
gold = pigment('Metal apron pin', 'fac264')
white = pigment('Warm eye white', 'fff8ec')
blush = pigment('Warm cheeks', 'da7968')

def oval(rig, bone, name, mat, xyz, axes, tilt=0):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=14, ring_count=8, location=xyz)
    ob = bpy.context.object
    ob.name = name
    ob.scale = axes
    ob.rotation_euler.y = tilt
    ob.data.materials.append(mat)
    for face in ob.data.polygons:
        face.use_smooth = True
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    matrix = ob.matrix_world.copy()
    ob.parent = rig
    ob.matrix_world = matrix
    weights = ob.vertex_groups.new(name=bone)
    weights.add([v.index for v in ob.data.vertices], 1, 'REPLACE')
    skin = ob.modifiers.new('Shared chef skin', 'ARMATURE')
    skin.object = rig
    return ob

def point(rig, bone, name, xyz):
    ob = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(ob)
    ob.parent = rig
    ob.parent_type = 'BONE'
    ob.parent_bone = bone
    bpy.context.view_layer.update()
    matrix = ob.matrix_world.copy()
    matrix.translation = Vector(xyz)
    ob.matrix_world = matrix

def make(name, lina):
    customer = name == 'Guest'
    skin = pigment(name+' complexion', 'b97856' if lina else 'f5b287')
    cloth = pigment(name+' apron', '7889ba' if customer else '257e78' if lina else 'c84539')
    rig_data = bpy.data.armatures.new(name+' skeleton')
    rig = bpy.data.objects.new(name, rig_data)
    bpy.context.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    bones = rig_data.edit_bones

    def bone(label, head, tail, parent=None):
        b = bones.new(label)
        b.head, b.tail = head, tail
        if parent:
            b.parent = bones[parent]
    bone('root',(0,0,0),(0,0,.12))
    bone('body',(0,0,.32),(0,0,.68),'root')
    bone('head',(0,0,.73),(0,0,1.12),'body')
    bone('carry',(0,-.41,.50),(0,-.41,.60),'body')
    for suffix, side in (('l',-1),('r',1)):
        bone('arm_'+suffix,(side*.20,0,.63),(side*.30,0,.42),'body')
        bone('leg_'+suffix,(side*.117,0,.34),(side*.118,0,.096),'root')
    bpy.ops.object.mode_set(mode='OBJECT')

    def piece(bone, label, mat, xyz, axes, tilt=0):
        return oval(rig, bone, label, mat, xyz, axes, tilt)

    piece('body','Double-breasted chef jacket',cloth if customer else ivory,(0,0,.531),(.265,.168,.229))
    if not customer:
        piece('body','Rounded apron skirt',cloth,(0,-.064,.417),(.236,.154,.186))
        piece('body','Apron bib',cloth,(0,-.142,.554),(.164,.051,.147))
        piece('body','Apron pocket',trim,(.038,-.219,.389),(.097,.014,.054))
        for side in (-1,1):
            piece('body','Brass fastener', gold,(side*.112,-.184,.631),(.024,.014,.021))
    piece('head','Soft cheek silhouette',skin,(0,-.012,.921),(.288,.222,.269))
    piece('head','Hair cap',hair,(0,.067,1.016),(.291,.219,.188))
    for side in (-1,1):
        x = side
        piece('head','Ear',skin,(x*.27,-.026,.901),(.059,.056,.073))
        piece('head','Eye white',white,(x*.100,-.221,.942),(.06,.023,.072))
        piece('head','Eye iris',eye,(x*.095,-.24,.943),(.035,.012,.050))
        piece('head','Eye glint',white,(x*.095-.01,-.25,.963),(.011,.005,.014))
        piece('head','Rosy cheek',blush,(x*.168,-.19,.866),(.050,.013,.022))
        piece('head','Brow',hair,(x*.102,-.211,1.022),(.060,.018,.021),x*.12)
    piece('head','Button nose',skin,(0,-.236,.898),(.042,.047,.037))
    piece('head','Smile',eye,(0,-.220,.834),(.069,.019,.029))
    piece('head','Smile highlight',white,(0,-.235,.845),(.042,.008,.011))
    for i, x in enumerate((-.168,-.074,.033,.119)):
        piece('head','Swept fringe',hair,(x,-.174,1.089+i*.010),(.094,.070,.073),-.52)
    if customer:
        piece('head','Rounded swept hair',hair,(.11,.037,1.115),(.172,.152,.107))
    elif lina:
        piece('head','Twisted bun',hair,(0,.232,1.145),(.160,.135,.148))
        piece('head','Teal cap band',cloth,(0,.004,1.146),(.28,.225,.048))
        piece('head','Teal bow',cloth,(.161,-.119,1.20),(.09,.043,.031),-.42)
        piece('head','Short cotton crown',ivory,(0,.024,1.193),(.254,.203,.075))
    else:
        piece('head','Toque base',ivory,(0,.002,1.163),(.279,.21,.065))
        for x,y,z in ((-.157,-.04,1.243),(-.041,-.09,1.274),(.109,-.072,1.264),(.145,.057,1.249),(0,.095,1.27)):
            piece('head','Toque pleat',ivory,(x,y,z),(.136,.131,.112))
    for suffix, side in (('l',-1),('r',1)):
        arm = 'arm_'+suffix
        leg = 'leg_'+suffix
        piece(arm,'Puffed sleeve',ivory,(side*.245,0,.574),(.097,.093,.131),-side*.39)
        piece(arm,'Folded cuff',trim,(side*.282,-.002,.502),(.072,.072,.058))
        piece(arm,'Mitten hand',skin,(side*.294,-.070,.436),(.072,.085,.083))
        piece(leg,'Short trousers',slate,(side*.117,.01,.237),(.090,.103,.147))
        piece(leg,'Shoe sole',trim,(side*.119,-.045,.041),(.102,.150,.036))
        piece(leg,'Rounded leather shoe',slate,(side*.119,-.048,.078),(.094,.146,.065))
    point(rig,'carry','carry_plate',(0,-.252,.53))
    point(rig,'head','headwear',(0,0,1.18))
    point(rig,'arm_l','hand_l',(-.294,-.07,.436))
    point(rig,'arm_r','hand_r',(.294,-.07,.436))
    return rig

CLIPS = {'idle':(2,0), 'walk':(.8,.45), 'run':(.55,.68), 'carry_walk':(.8,.37),
         'carry_run':(.55,.51), 'pickup':(.32,0), 'place':(.32,0), 'chop':(.5,0),
         'fry_interact':(.35,0), 'wash':(.6,0), 'serve':(.45,0), 'success':(.65,0),'panic':(.7,0)}

def animate(rig):
    rig.animation_data_create()
    clips = {**CLIPS, 'seat': (1.4, 0), 'eat': (1.2, 0), 'leave': (.8, .45)} if rig.name == 'Guest' else CLIPS
    for key, (seconds,stride) in clips.items():
        action = bpy.data.actions.new(key)
        rig.animation_data.action = action
        for n in range(9):
            phase = n * math.tau/8
            frame = 1+n*seconds*30/8
            swing = math.sin(phase)
            gesture = math.sin(phase/2)
            carrying = key.startswith('carry')
            for bone in rig.pose.bones:
                bone.rotation_mode = 'XYZ'
                bone.rotation_euler = (0,0,0)
                if bone.name.startswith('leg'):
                    bone.rotation_euler.x = -1.23 if key in ('seat','eat') else stride * swing * (-1 if bone.name.endswith('l') else 1)
                elif bone.name.startswith('arm'):
                    side = -1 if bone.name.endswith('l') else 1
                    flex = -.86 if carrying else stride * swing * side
                    if key in ('pickup','place','serve','fry_interact'):
                        flex = -gesture * 1.28
                    if key in ('chop','wash'):
                        flex = -.91 - .34*swing*side
                    if key == 'eat':
                        flex = -.66 - (gesture * 1.21 if side == 1 else .13)
                    if key == 'seat':
                        flex = -.21
                    if key in ('success','panic'):
                        flex = -gesture * 1.95
                    bone.rotation_euler.x = flex
                elif bone.name == 'head':
                    bone.rotation_euler.y = swing*.038
                bone.keyframe_insert(data_path='rotation_euler',frame=frame)
        track = rig.animation_data.nla_tracks.new()
        track.name = key
        track.strips.new(key,1,action)
        rig.animation_data.action = None

output = ROOT / 'assets/runtime/characters'
output.mkdir(parents=True,exist_ok=True)
for name in ('Max','Lina','Guest'):
    rig = make(name, name == 'Lina')
    by_material = {}
    for ob in rig.children:
        if ob.type == 'MESH':
            by_material.setdefault(ob.data.materials[0].name, []).append(ob)
    for meshes in by_material.values():
        if len(meshes) == 1:
            continue
        bpy.ops.object.select_all(action='DESELECT')
        for ob in meshes:
            ob.select_set(True)
        bpy.context.view_layer.objects.active = meshes[0]
        bpy.ops.object.join()
    animate(rig)
    bpy.ops.object.select_all(action='DESELECT')
    rig.select_set(True)
    for ob in list(rig.children):
        if ob.type == 'MESH':
            location = ob.matrix_world.copy()
            ob.parent = None
            ob.matrix_world = location
        ob.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(output / (name.lower()+'.glb')),use_selection=True,
                              export_animation_mode='NLA_TRACKS')
source = ROOT / 'assets/source/burger-town-chefs.blend'
source.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(source))
