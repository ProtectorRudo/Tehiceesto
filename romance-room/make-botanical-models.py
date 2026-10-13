"""Original, low-poly but detailed curved botanical assets; no third-party art or licenses.
Build: python make-botanical-models.py
"""
from pathlib import Path
import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals
from math import sin,cos,pi

OUT=Path(__file__).parent/'public'/'models';OUT.mkdir(parents=True,exist_ok=True)
rng=np.random.default_rng(2906)

def mat(r,g,b,rough=.82,metal=0):return PBRMaterial(baseColorFactor=[r,g,b,255],roughnessFactor=rough,metallicFactor=metal,doubleSided=True)
CERAMIC=mat(225,212,191,.7); SOIL=mat(72,66,51,.97); STEM=mat(66,110,74,.88); LEAF=mat(53,117,76,.78); LIGHTLEAF=mat(104,150,96,.85); ROSE=mat(238,168,180,.76); BLUSH=mat(252,207,201,.78); CREAM=mat(245,217,167,.8); BUD=mat(220,157,111,.76)

class SceneBuilder:
  def __init__(self):self.scene=trimesh.Scene();self.counter=0;self.batches={}
  def add(self,vertices,faces,material):
    mesh=trimesh.Trimesh(vertices=np.asarray(vertices,dtype=float),faces=np.asarray(faces,dtype=int),process=False)
    self.batches.setdefault(id(material),(material,[]))[1].append(mesh);self.counter+=1
  def between(self,a,b,r,material,sections=6):
    a=np.array(a,float);b=np.array(b,float)
    if np.linalg.norm(b-a)<.01:return
    mesh=trimesh.creation.cylinder(radius=r,segment=np.array([a,b]),sections=sections)
    self.batches.setdefault(id(material),(material,[]))[1].append(mesh);self.counter+=1
  def rings(self,rs,ys,material,n=20):
    verts=[];faces=[]
    for r,y in zip(rs,ys):
      for i in range(n):
        t=2*pi*i/n;verts.append((r*cos(t),y,r*sin(t)))
    for j in range(len(rs)-1):
      for i in range(n):
        k=j*n+i;k1=j*n+(i+1)%n;l=(j+1)*n+i;l1=(j+1)*n+(i+1)%n
        faces.extend(((k,k1,l1),(k,l1,l)))
    self.add(verts,faces,material)
  def leaf(self,center,direction,length,width,material):
    # Oval tapered leaf surface, delicately curved along the center vein
    start=np.array(center,float);d=np.array(direction,float);d/=np.linalg.norm(d)
    across=np.cross(d,[0,1,0]);across/=np.linalg.norm(across)+1e-6
    normal=np.cross(across,d);normal/=np.linalg.norm(normal)+1e-6
    verts=[];faces=[];N=6
    for j in range(N+1):
      t=j/N
      p=start+d*(length*t)+normal*(.045*sin(t*pi))
      span=width*(sin(pi*t)**.8)
      for k in [-1,0,1]:
        verts.append(p+across*span*k+normal*(.07*span*(1-abs(k))))
    for j in range(N):
      a=j*3;b=(j+1)*3
      for k in range(2):
        faces.extend(((a+k,b+k,a+k+1),(a+k+1,b+k,b+k+1),(a+k+1,b+k,a+k),(b+k+1,b+k,a+k+1)))
    self.add(verts,faces,material)
  def petal(self,center,angle,height,radius,width,material,curl):
    # Recurved rose petal (front + back) with folding, not a sphere or flat billboard.
    verts=[];faces=[];N=5;M=7
    cx,cy,cz=center
    for j in range(N+1):
      t=j/N
      r=radius*(.40+.72*t)+curl*t*t
      h=height*(.08+.88*t)-.032*t*t
      for k in range(M):
        u=(k/(M-1)*2-1)
        theta=angle+u*width*(.48+.60*t)
        rr=r*(1-.11*u*u)
        yy=cy+h+.035*sin(pi*t)*cos(pi*u)
        verts.append((cx+rr*cos(theta),yy,cz+rr*sin(theta)))
    for j in range(N):
      for k in range(M-1):
        a=j*M+k;b=a+M
        faces.extend(((a,b,a+1),(a+1,b,b+1),(a+1,b,a),(b+1,b,a+1)))
    self.add(verts,faces,material)
  def rose(self,at,size,material):
    x,y,z=at
    self.between([x,y-.15*size,z],[x,y,z],.027*size,STEM)
    # Three curved whorls of petals, each offset; sculptural silhouette.
    for ring,n,rr in [(0,5,.25),(1,8,.43),(2,10,.58)]:
      for i in range(n):
        a=(i/n)*2*pi+ring*.19
        self.petal((x,y+ring*.026*size,z),a,.28*size+ring*.05*size,rr*size,(pi/n)*.87,material,.035*size*(ring+1))
    self.between((x,y+.20*size,z),(x,y+.35*size,z),.017*size, BUD)
  def export(self,path):
    path=OUT/path
    for material,items in self.batches.values():
      merged=trimesh.util.concatenate(items);merged.visual=TextureVisuals(material=material)
      self.scene.add_geometry(merged,node_name=f'botanical_{len(self.scene.geometry)}')
    blob=self.scene.export(file_type='glb')
    path.write_bytes(blob)
    print(path.name,round(len(blob)/1024),'KB',self.counter,'meshes')

s=SceneBuilder()
s.rings([.28,.33,.37,.355,.30,.29,.31],[0,.04,.20,.37,.47,.53,.55],CERAMIC,18)
s.rings([.29,.27,.23],[.54,.56,.59],SOIL,18)
for stem_i in range(9):
  a=stem_i*2*pi/9
  tilt=.28+float(rng.uniform(-.12,.16))
  h=float(rng.uniform(.73,1.16))
  x=sin(a)*tilt;z=cos(a)*tilt
  s.between((0,.55,0),(x,h,z),.025,STEM,6)
  for j in range(3):
    f=(j+1)/4;theta=a+j*2.3
    cx=x*f*.7;cy=.55+(h-.55)*f;cz=z*f*.7
    s.leaf((cx,cy,cz),(.28*cos(theta),.65,.28*sin(theta)),.38+float(rng.random())*.14,.13+float(rng.random())*.035,[LEAF,LIGHTLEAF][(j+stem_i)%2])
  if stem_i<5:s.rose((x,h,z),.56+float(rng.random())*.16,[ROSE,BLUSH,CREAM][stem_i%3])
  else:
    for j in range(3):
      theta=a+j*2*pi/3
      s.leaf((x*.82,h-.04,z*.82),(.42*cos(theta),.22,.42*sin(theta)),.36,.13,LIGHTLEAF)
s.export('heritage-rose-planter.glb')
