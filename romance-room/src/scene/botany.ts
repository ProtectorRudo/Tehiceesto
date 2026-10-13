import * as THREE from 'three';

/** Layered rose: a single shared mesh, designed to be instanced rather than copied. */
export function createDetailedBloomGeometry(): THREE.BufferGeometry {
  const vertices:number[]=[],uvs:number[]=[],indices:number[]=[];
  const layers=[{count:5,radius:.070,height:.095,spread:.66},
    {count:7,radius:.142,height:.065,spread:.85},
    {count:9,radius:.222,height:.035,spread:1.00}];
  for(let layer=0;layer<layers.length;layer++){
    const group=layers[layer],rows=6,cols=6;
    for(let j=0;j<group.count;j++){
      const start=vertices.length/3,a=(j+(layer%2)*.43)*Math.PI*2/group.count;
      for(let row=0;row<=rows;row++){
        const t=row/rows;
        for(let column=0;column<=cols;column++){
          const u=column/cols*2-1;
          const width=Math.sin(Math.PI*(.10+t*.86))*(.42+.17*t);
          const theta=a+u*group.spread*width;
          const radial=(.012+group.radius*t)*(1-.15*u*u);
          const curl=.040*u*u*t+.054*t*t*(layer===0?1:-.40);
          const y=group.height+.044*Math.sin(t*Math.PI)+curl+.018*layer*t;
          vertices.push(Math.cos(theta)*radial,y,Math.sin(theta)*radial);
          uvs.push((u+1)*.5,t);
        }
      }
      for(let row=0;row<rows;row++)for(let column=0;column<cols;column++){
        const a0=start+row*(cols+1)+column,b=a0+cols+1;
        indices.push(a0,b,a0+1,a0+1,b,b+1);
      }
    }
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geo.setIndex(indices);geo.computeVertexNormals();geo.computeBoundingSphere();
  return geo;
}

/** Geometry has curved cross-section, visible front and back. */
export function createLeafGeometry(): THREE.BufferGeometry {
  const positions:number[]=[],uvs:number[]=[],indices:number[]=[];
  for(let i=0;i<=7;i++){
    const t=i/7,width=Math.pow(Math.sin(Math.PI*t),.8)*(.10+.035*t);
    const y=t*.44,z=.05*Math.sin(t*Math.PI)-.03*t*t;
    positions.push(-width,y,z,0,y,z+.026,width,y,z);
    uvs.push(0,t,.5,t,1,t);
  }
  for(let i=0;i<7;i++)for(let j=0;j<2;j++){
    const a=i*3+j,b=a+3;indices.push(a,b,a+1,a+1,b,b+1);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geo.setIndex(indices);geo.computeVertexNormals();return geo;
}

/** Woodland beyond the conservatory, batched into three draw calls. */
export function addExteriorGrove(scene: THREE.Scene,rand:()=>number): void {
  const bark=new THREE.MeshStandardMaterial({color:0x756c57,roughness:.94});
  const canopy=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.89,side:THREE.DoubleSide});
  const places:[number,number,number][]=[];
  for(let i=0;i<30;i++)places.push([(i%2===0?-1:1)*(11.6+rand()*11),-19+rand()*42,.80+rand()*.68]);
  for(let i=0;i<15;i++)places.push([-23+rand()*46,12+rand()*14,.75+rand()*.60]);
  const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.105,.15,2.7,8),bark,places.length);
  const twigs=new THREE.InstancedMesh(new THREE.CylinderGeometry(.036,.048,.92,6),bark,places.length*4);
  const leaves=new THREE.InstancedMesh(createLeafGeometry(),canopy,places.length*60);
  const palette=[0x658b61,0x779e72,0x92b184,0xa0af7c,0x557c64].map(v=>new THREE.Color(v));
  const dummy=new THREE.Object3D();let iTrunk=0,iTwig=0,iLeaf=0;
  for(const [x,z,scale] of places){
    dummy.position.set(x,1.35*scale,z);dummy.rotation.set(0,0,0);
    dummy.scale.setScalar(scale);dummy.updateMatrix();trunks.setMatrixAt(iTrunk++,dummy.matrix);
    for(let b=0;b<4;b++){
      const a=b*2.4+rand()*.45,height=(1.5+b*.26)*scale;
      dummy.position.set(x+Math.cos(a)*.28*scale,height+.25*scale,z+Math.sin(a)*.28*scale);
      dummy.rotation.set(Math.sin(a)*.54,0,-Math.cos(a)*.65);
      dummy.scale.setScalar(scale);dummy.updateMatrix();twigs.setMatrixAt(iTwig++,dummy.matrix);
    }
    for(let j=0;j<60;j++){
      const a=j*2.399963+rand()*.26,h=(1.85+rand()*1.45)*scale;
      const r=(.35+rand()*1.1)*scale;
      dummy.position.set(x+Math.cos(a)*r,h,z+Math.sin(a)*r);
      dummy.rotation.set(.25+rand()*.45,a+.4,(rand()-.5)*1.4);
      dummy.scale.setScalar((.95+rand()*.8)*scale);dummy.updateMatrix();
      leaves.setMatrixAt(iLeaf,dummy.matrix);
      leaves.setColorAt(iLeaf,palette[(j+Math.abs(Math.floor(x*10)))%palette.length]);
      iLeaf++;
    }
  }
  trunks.castShadow=false;twigs.castShadow=false;leaves.castShadow=false;
  trunks.instanceMatrix.needsUpdate=true;twigs.instanceMatrix.needsUpdate=true;
  leaves.instanceMatrix.needsUpdate=true;
  if(leaves.instanceColor)leaves.instanceColor.needsUpdate=true;
  scene.add(trunks,twigs,leaves);
}

/** Adds two curved leaves to each flower; original flower state/interaction is unchanged. */
export function addFlowerLeaves(scene:THREE.Scene, flowers:ReadonlyArray<{x:number,z:number}>):void {
  const foliage=new THREE.InstancedMesh(
    createLeafGeometry(),
    new THREE.MeshStandardMaterial({color:0x87ab81,roughness:.90,side:THREE.DoubleSide}),
    flowers.length*2
  );
  const dummy=new THREE.Object3D();
  flowers.forEach((f,i)=>{
    for(let side=0;side<2;side++){
      const a=side*Math.PI+((i%9)-4)*.067;
      dummy.position.set(f.x,.12+side*.13,f.z);
      dummy.rotation.set(Math.sin(a)*.9,a,Math.cos(a)*.9);
      dummy.scale.setScalar(.72+.25*(i%5)/4);
      dummy.updateMatrix();foliage.setMatrixAt(i*2+side,dummy.matrix);
    }
  });
  foliage.castShadow=false;foliage.receiveShadow=false;
  foliage.instanceMatrix.needsUpdate=true;scene.add(foliage);
}
