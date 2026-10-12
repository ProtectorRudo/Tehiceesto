"""Generate original in-project GLB models with editable PBR materials (no third-party licensing)."""
from pathlib import Path
import trimesh
import numpy as np
from trimesh.visual.material import PBRMaterial
out=Path(__file__).parent/'public'/'models';out.mkdir(exist_ok=True)
scene=trimesh.Scene()
materials={
 'mahogany': PBRMaterial(name='Polished dark mahogany',baseColorFactor=[84,43,26,255],roughnessFactor=.37,metallicFactor=.02),
 'velvet':PBRMaterial(name='Aubergine velvet',baseColorFactor=[92,54,68,255],roughnessFactor=.96,metallicFactor=0),
 'brass':PBRMaterial(name='Aged brass',baseColorFactor=[173,133,72,255],metallicFactor=.86,roughnessFactor=.28),
 'cord':PBRMaterial(name='Dark upholstery cord',baseColorFactor=[31,22,26,255],metallicFactor=0,roughnessFactor=1),
}
def add(name,mesh,material):
 mesh.visual=trimesh.visual.TextureVisuals(material=materials[material]);scene.add_geometry(mesh,node_name=name,geom_name=name)
def box(name, size, pos, material):
 mesh=trimesh.creation.box(extents=size);mesh.apply_translation(pos);add(name,mesh,material)
def oval(name,scale,pos,material,sub=2):
 mesh=trimesh.creation.icosphere(subdivisions=sub,radius=1);mesh.apply_scale(scale);mesh.apply_translation(pos);add(name,mesh,material)
def tube(name,a,b,r,material,sections=12):
 a=np.asarray(a);b=np.asarray(b);v=b-a;mesh=trimesh.creation.cylinder(radius=r,height=np.linalg.norm(v),sections=sections)
 mesh.apply_transform(trimesh.geometry.align_vectors([0,0,1],v));mesh.apply_translation((a+b)/2);add(name,mesh,material)
# Four ornamental cabriole legs. Tapers and carved circular collars add silhouette detail.
for side in [-1,1]:
 for depth in [-1,1]:
  x=side*.49;z=depth*.39
  tube(f'leg-core-{side}-{depth}',(x,.17,z),(x,.73,z),.07,'mahogany')
  tube(f'leg-base-{side}-{depth}',(x,.12,z),(x,.29,z),.10,'mahogany')
  for h in [.2,.64]:
   collar=trimesh.creation.annulus(r_min=.05,r_max=.086,height=.022,sections=20);collar.apply_translation([x,h,z]);add(f'leg-carving-{side}-{depth}-{h}',collar,'brass')
# Carved rear frame & curved profile, velvet upholstery in PBR.
box('seat-frame',(1.28,.17,1.03),(0,.77,0),'mahogany')
oval('cushion',(0.62,.18,.49),(0,.93,.03),'velvet',3)
box('back-frame',(1.31,1.18,.18),(0,1.45,-.46),'mahogany')
oval('back-padded',(0.54,.58,.135),(0,1.45,-.365),'velvet',3)
for side in [-1,1]:
 x=side*.66
 tube(f'arm-pillar-{side}',(x,.84,.33),(x,1.34,.33),.075,'mahogany')
 oval(f'arm-top-{side}',(.12,.08,.55),(x,1.35,-.03),'mahogany',3)
 tube(f'backside-carve-{side}',(side*.58,1.04,-.43),(side*.58,1.97,-.45),.055,'brass')
 oval(f'wood-scroll-{side}',(.13,.16,.12),(x,1.37,.42),'mahogany',2)
 for y in [1.17,1.5,1.78]:
  oval(f'upholstery-nail-{side}-{y}',(.022,.022,.026),(side*.62,y,-.33),'brass')
for row in range(3):
 for col in range(3):
  # Decorative upholstery buttons visible from player's viewpoint.
  oval(f'tuft-button-{row}-{col}',(.023,.023,.013),(-.29+col*.29,1.17+row*.26,-.218),'brass',2)
for side in [-1,1]:
 # spiral arm engravings, genuine 3d geometry
 for j in range(8):
  a=j*np.pi/4
  oval(f'arm-inlay-{side}-{j}',(.024,.013,.023),(side*.665+np.sin(a)*.055,1.41,-.36+j*.10),'brass',1)
scene.export(out/'victorian-armchair.glb')
print('created GLB', (out/'victorian-armchair.glb').stat().st_size)
