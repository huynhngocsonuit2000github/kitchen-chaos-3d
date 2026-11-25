"""Build the original Burger Town modular appliance set in Blender."""
import bpy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.unit_settings.system = 'METRIC'

def material(name, color, roughness=.44, metal=0):
    mat = bpy.data.materials.new(name)
    rgb = [int(color[i:i+2], 16) / 255 for i in (0, 2, 4)]
    rgb = [v / 12.92 if v < .04045 else ((v + .055) / 1.055) ** 2.4 for v in rgb]
    mat.diffuse_color = (*rgb, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = mat.diffuse_color
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metal
    return mat

teal = material('Glazed lagoon enamel', '358e89')
dark_teal = material('Inset lagoon enamel', '245957')
cream = material('Vanilla porcelain', 'fff0d5')
coral = material('Tomato enamel', 'c94638')
steel = material('Satin nickel', 'a7bdbe', .3, .45)
ink = material('Seasoned cast iron', '28343a')
wood = material('Honey maple', 'c88b52')
grain = material('Maple edge grain', 'ab693d')
gold = material('Brushed brass', 'ecaf51', .31, .4)
water = material('Sink basin blue', '527d86', .24, .35)
green = material('Herb leaf', '65a44b')
soil = material('Potting soil', '55413b')
wine = material('Diner upholstery', 'a8453d', .62)
plaster = material('Warm terracotta plaster', 'e8ad83', .72)
glass = material('Frosted robin-egg glass', 'a6d3ca', .32)

def finish(name, mat, root):
    ob = bpy.context.object
    ob.name = name
    ob.parent = root
    ob.data.materials.append(mat)
    return ob

def panel(root, name, mat, at, size, bevel=.025):
    bpy.ops.mesh.primitive_cube_add(size=1, location=at)
    ob = finish(name, mat, root)
    ob.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    edge = ob.modifiers.new('Rounded tooling edges', 'BEVEL')
    edge.width = bevel
    edge.segments = 3
    edge.harden_normals = True
    ob.modifiers.new('Panel normals', 'WEIGHTED_NORMAL')
    return ob

def lathe(root, name, mat, at, radius, depth):
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=radius, depth=depth, location=at)
    ob = finish(name, mat, root)
    edge = ob.modifiers.new('Rolled edge', 'BEVEL')
    edge.width = min(depth / 3, .016)
    edge.segments = 3
    for polygon in ob.data.polygons:
        polygon.use_smooth = True
    ob.modifiers.new('Surface normals', 'WEIGHTED_NORMAL')
    return ob

def pipe(root, name, mat, points, radius):
    curve = bpy.data.curves.new(name, 'CURVE')
    curve.dimensions = '3D'
    curve.bevel_depth = radius
    curve.resolution_u = 9
    spline = curve.splines.new('BEZIER')
    spline.bezier_points.add(len(points) - 1)
    for bp, point in zip(spline.bezier_points, points):
        bp.co = point
        bp.handle_left_type = bp.handle_right_type = 'AUTO'
    ob = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(ob)
    ob.parent = root
    curve.materials.append(mat)

def marker(root, name, height):
    ob = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(ob)
    ob.parent = root
    ob.location.z = height

def cabinet(root, body, top):
    for x in (-.33, .33):
        for y in (-.31, .31):
            lathe(root, 'Recessed leveling foot', ink, (x, y, .065), .072, .13)
    panel(root, 'Powder coated carcase', body, (0, 0, .46), (.9, .89, .74), .05)
    panel(root, 'Work surface', top, (0, 0, .855), (.98, .97, .13), .042)
    for x in (-.212, .212):
        panel(root, 'Inset cabinet door', body, (x, -.45, .45), (.398, .062, .59), .035)
        panel(root, 'Recessed face', dark_teal if body == teal else grain, (x, -.484, .43), (.315, .021, .436))
        panel(root, 'Brushed pull', steel, (x, -.514, .652), (.18, .057, .038), .013)

def make(tile):
    root = bpy.data.objects.new('Station_' + tile, None)
    bpy.context.collection.objects.link(root)
    if tile == 'Knife':
        panel(root, 'Full tang', steel, (0,-.10,.015), (.092,.264,.028), .018)
        panel(root, 'Handle grip', dark_teal, (0,.058,.014), (.073,.14,.051), .015)
        for y in (.03,.087):
            lathe(root, 'Handle rivet', steel, (0,y,.043), .013,.012)
        return root
    if tile == 'DinerWindow':
        panel(root, 'Cream outer frame', cream, (0,0,.46), (1.82,.22,.92), .044)
        panel(root, 'Burnished dark inset', dark_teal, (0,-.124,.46), (1.57,.053,.72), .032)
        for x in (-.38,.38):
            panel(root, 'Frosted window pane', glass, (x,-.161,.45), (.66,.036,.59), .015)
            panel(root, 'Window crossbar', wood, (x,-.185,.51), (.68,.037,.054), .008)
        panel(root, 'Maple ledge', wood, (0,-.13,.035), (1.92,.42,.095), .028)
        for i in range(7):
            stripe = panel(root, 'Striped canvas valance', coral if i % 2 == 0 else cream,
                           ((i-3)*.254,-.225,.925), (.251,.39,.065), .016)
            stripe.rotation_euler.x = .20
        return root
    if tile == 'Sign':
        panel(root, 'Enamel sign', wine, (0,0,.37), (1.65,.13,.70), .099)
        panel(root, 'Raised gold edge', gold, (0,-.078,.37), (1.54,.035,.60), .085)
        panel(root, 'Tomato inset', coral, (0,-.105,.37), (1.46,.026,.51), .079)
        for index, word in enumerate(('BURGER','TOWN')):
            data = bpy.data.curves.new('Sign lettering', 'FONT')
            data.body = word
            data.align_x = 'CENTER'
            data.size = .254
            data.extrude = .012
            data.materials.append(cream)
            text = bpy.data.objects.new(word, data)
            bpy.context.collection.objects.link(text)
            text.parent = root
            text.location = (0,-.124,.415-index*.244)
            text.rotation_euler.x = 1.5707963
        return root
    if tile == 'Tile':
        panel(root, 'Rounded ceramic floor tile', cream, (0,0,-.049), (.988,.988,.098), .012)
        return root
    if tile == 'Trim':
        panel(root, 'Glazed cutaway trim', cream, (0,0,.058), (.989,.988,.116), .031)
        return root
    if tile == 'Plinth':
        panel(root, 'Diorama foundation', dark_teal, (0,0,-.297), (12,10,.51), .082)
        return root
    if tile == 'Seat':
        for x in (-.23,.23):
            for y in (-.21,.21):
                panel(root, 'Seat legs', ink, (x,y,.19), (.065,.065,.38), .01)
        panel(root, 'Maple chair frame', grain, (0,0,.34), (.64,.53,.11), .038)
        panel(root, 'Upholstered cushion', wine, (0,0,.404), (.58,.49,.09), .042)
        for x in (-.24,.24):
            panel(root, 'Back support', grain, (x,.23,.56), (.072,.073,.56), .014)
        panel(root, 'Upholstered chair back', coral, (0,.24,.73), (.62,.115,.36), .053)
        for x in (-.15,0,.15):
            panel(root, 'Stitched back seam', wine, (x,.178,.73), (.018,.013,.29), .006)
        return root
    if tile == 'Wall':
        panel(root, 'Timber sill', grain, (0,0,.14), (.99,.54,.27), .04)
        panel(root, 'Glazed wainscot', dark_teal, (0,0,.42), (.993,.47,.46), .025)
        panel(root, 'Window sill', wood, (0,-.025,.665), (.99,.58,.075), .027)
        panel(root, 'Frosted glass', glass, (0,0,.827), (.876,.12,.29), .015)
        for x in (-.45, 0, .45):
            panel(root, 'Window casing', plaster, (x,0,.837), (.082,.20,.36), .012)
        panel(root, 'Window header', cream, (0,0,1.014), (1,.31,.087), .02)
        return root
    if tile == 'T':
        lathe(root, 'Cast iron pedestal foot', ink, (0, 0, .055), .29, .10)
        lathe(root, 'Pedestal column', dark_teal, (0, 0, .42), .082, .76)
        lathe(root, 'Maple tabletop', wood, (0, 0, .81), .455, .11)
        lathe(root, 'Ceramic saucer', cream, (0, 0, .875), .143, .024)
        lathe(root, 'Glazed herb pot', coral, (0, 0, .955), .088, .16)
        lathe(root, 'Potting soil', soil, (0, 0, 1.039), .072, .022)
        for i, direction in enumerate(((.11,.03),(-.08,.09),(.02,-.11),(-.09,-.07))):
            x, y = direction
            pipe(root, 'Herb sprig', green, [(0,0,1.04), (x*.6,y*.6,1.13), (x,y,1.18+i*.02)], .022)
        return root
    if tile == 'X':
        lathe(root, 'Waste can body', dark_teal, (0, 0, .395), .36, .75)
        lathe(root, 'Rubber plinth', ink, (0, 0, .055), .38, .085)
        lathe(root, 'Rolled lid', steel, (0, 0, .775), .38, .085)
        panel(root, 'Lid handle', ink, (0, 0, .845), (.24,.13,.075))
        panel(root, 'Foot pedal', steel, (0, -.35, .09), (.19,.18,.055))
        return root
    cabinet(root, coral if tile == 'S' else wood if tile == 'A' else teal,
            wood if tile in 'AKS' else cream)
    if tile == 'G':
        panel(root, 'Cast iron cooktop', ink, (0, 0, .935), (.84,.8,.07))
        panel(root, 'Splash back', steel, (0,.398,1.039), (.88,.06,.24))
        panel(root, 'Instrument fascia', steel, (0,-.48,.794), (.86,.07,.118))
        for x in (-.28,-.10,.10,.28):
            knob = lathe(root, 'Heat dial', ink, (x,-.529,.793), .041,.038)
            knob.rotation_euler.x = 1.5707963
            panel(root, 'Dial index', gold, (x,-.552,.814), (.013,.009,.023), .004)
        lathe(root, 'Pan', steel, (0,0,.984), .315,.075)
        lathe(root, 'Pan interior', ink, (0,0,1.026), .278,.022)
        panel(root, 'Pan grip', ink, (.33,.13,1.017), (.30,.085,.058)).rotation_euler.z = .37
    elif tile == 'W':
        panel(root, 'Recessed sink basin', water, (0,0,.927), (.71,.60,.028))
        for x in (-.37,.37):
            panel(root, 'Basin roll rim', steel, (x,0,.96), (.075,.72,.07))
        for y in (-.325,.325):
            panel(root, 'Basin roll rim', steel, (0,y,.96), (.72,.075,.07))
        lathe(root, 'Drain', ink, (.11,0,.95), .062,.014)
        pipe(root, 'Gooseneck faucet', steel, [(0,.36,.93),(0,.36,1.23),(0,.22,1.34),(0,.09,1.19)], .035)
        lathe(root, 'Tap control', steel, (.20,.36,1.01), .054,.15)
    elif tile == 'K':
        panel(root, 'Maple chopping board', grain, (0,0,.954), (.73,.66,.077))
        panel(root, 'Maple cutting surface', wood, (0,0,.993), (.665,.598,.021))
        lathe(root, 'Board grip insert', ink, (.265,.205,1.006), .043,.012)
    elif tile == 'R':
        for x in (-.36,.36):
            panel(root, 'Dish rack end', steel, (x,0,1.005), (.043,.69,.22))
        for i in range(4):
            lathe(root, 'Porcelain dish stack', cream, (0,0,.954+i*.036), .285,.032)
    elif tile == 'S':
        lathe(root, 'Bell foot', ink, (-.29,.26,.94), .133,.043)
        lathe(root, 'Brass service bell', gold, (-.29,.26,1.012), .108,.11)
        lathe(root, 'Bell button', steel, (-.29,.26,1.079), .031,.04)
        panel(root, 'Service pass mat', cream, (0,-.055,.931), (.57,.56,.025))
    elif tile in 'BPMCL':
        panel(root, 'Recessed food well', ink, (0,0,.938), (.765,.70,.038))
        for x in (-.395,.395):
            panel(root, 'Pan rim', steel, (x,0,.96), (.054,.765,.059))
        for y in (-.37,.37):
            panel(root, 'Pan rim', steel, (0,y,.96), (.765,.054,.059))
    marker(root, 'food_socket', 1.042 if tile == 'G' else 1.01 if tile == 'K' else .951)
    return root

def export(root, tile):
    bpy.ops.object.select_all(action='DESELECT')
    root.select_set(True)
    for ob in root.children:
        ob.select_set(True)
    output = ROOT / 'assets/runtime/kit' / (tile + '.glb')
    output.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=str(output), use_selection=True, export_animations=False,
                              export_cameras=False, export_lights=False)

for tile in (*'BPMCLGKSWARXT', 'Wall', 'Seat', 'Tile', 'Trim', 'Plinth', 'Knife', 'Sign', 'DinerWindow'):
    root = make(tile)
    export(root, tile)
source = ROOT / 'assets/source/burger-town-kitchen.blend'
source.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(source))
