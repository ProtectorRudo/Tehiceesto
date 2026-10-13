import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { AnimationMixer } from 'three';
import type { Stage } from '../game/logic';
import {resolveMovement} from '../game/navigation';

type Interactive = 'key'|'desk'|'sundial'|'waterBasin'|'clock'|'gramophone'|'painting'|'letter'|'cabinet'|'books'|'gardenGate'|'lantern0'|'lantern1'|'lantern2'|'present';
type Callbacks = {onInteract:(what:Interactive, sub?:string)=>void; onMove?:(x:number,z:number)=>void; onFocus?:(label:string|null)=>void};
const gold = 0xb7a77f;
const palette=[0x4c6471,0x98746b,0x909a6c,0x586c56,0x9b7e91];
const mat=(color:number,roughness=.68,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const brass=mat(0xae9566,.3,.7), black=mat(0x30413e,.4,.28), ivory=mat(0xf5f0dd,.74,.02);
const seedRand=(()=>{let s=541; return ()=>((s=(s*1664525+1013904223)>>>0)/4294967296)})();

export class World {
  readonly scene=new THREE.Scene();
  readonly camera=new THREE.PerspectiveCamera(72,1,.08,95);
  readonly renderer: THREE.WebGLRenderer;
  private clock=new THREE.Clock();
  private raf=0;
  private handlers:Callbacks;
  private interactive: THREE.Object3D[]=[];
  private raycaster=new THREE.Raycaster();
  private pointer=new THREE.Vector2();
  private yaw=0; private pitch=-.015;
  private inputs=new Set<string>();
  private pointers=new Map<number,{x:number,y:number,downX:number,downY:number,moved:boolean}>();
  private pinchDistance=0;
  private joystick={x:0,y:0};
  private canWalk=true;
  private stage:Stage=0;
  private keyMesh?:THREE.Group;
  private keyHotspot?:THREE.Object3D;
  private gate?:THREE.Group;
  private slidingShelf?:THREE.Group;
  private clockHands?:THREE.Group;
  private painting?:THREE.Group;
  private clockTime=0;
  private lanternMeshes:THREE.Mesh[]=[];
  private petals?:THREE.Points;
  private flowerHeads?:THREE.InstancedMesh;
  private flowerStems?:THREE.InstancedMesh;
  private readonly flowerInstances:{x:number,z:number,stemScale:number,headScale:number,flowerColor:number}[]=[];
  private botanicalLeaves?:THREE.InstancedMesh;
  private plantBaseColors:number[]=[];
  private wilt=0;
  private lastWilt=-1;

  private mixers:AnimationMixer[]=[];
  private glowLights:THREE.Light[]=[];
  private gardenBulbs:THREE.Mesh[]=[];
  private rainDrops:THREE.Mesh[]=[];
  private gardenBaseIntensity=21;
  private storm=0;
  private rushEnabled=false;
  private romantic=false;
  private speed=2.6;
  private materials:THREE.Material[]=[];
  private disposed=false;
  private currentFocus:THREE.Object3D|null=null;
  private focusTime=0;
  private frameElapsed=0;
  private frameCounter=0;
  private qualityDpr:number;
  private maxDpr:number;
  private readonly reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  private boundPointerDown:(e:PointerEvent)=>void;
  private boundPointerMove:(e:PointerEvent)=>void;
  private boundPointerUp:(e:PointerEvent)=>void;
  private boundWheel:(e:WheelEvent)=>void;
  private boundKeyDown:(e:KeyboardEvent)=>void;
  private boundKeyUp:(e:KeyboardEvent)=>void;
  private boundResize:()=>void;
  private readonly mobile=matchMedia('(pointer:coarse)').matches;

  constructor(private canvas:HTMLCanvasElement, handlers:Callbacks){
    this.handlers=handlers;
    this.renderer=new THREE.WebGLRenderer({canvas, antialias:!this.mobile, powerPreference:'high-performance', alpha:false, stencil:false});
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.35;
    this.renderer.shadowMap.enabled=true;
    this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.maxDpr=Math.min(window.devicePixelRatio,this.mobile?1.4:1.8);
    this.qualityDpr=this.maxDpr;
    this.renderer.setPixelRatio(this.qualityDpr);
    this.scene.background=new THREE.Color(0xc8e5ed);
    this.scene.fog=new THREE.FogExp2(0xcbe0d2,.010);
    this.camera.position.set(0,1.63,5.5);
    this.setupLight(); this.createStudy(); this.createGarden(); this.createExteriorLandscape(); this.placeAssets();
    this.boundPointerDown=this.onPointerDown.bind(this);this.boundPointerMove=this.onPointerMove.bind(this);this.boundPointerUp=this.onPointerUp.bind(this);
    this.boundWheel=(e)=>{e.preventDefault();this.zoom(e.deltaY*.018)};
    this.boundKeyDown=(e)=>{if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft'].includes(e.code))this.inputs.add(e.code)};
    this.boundKeyUp=(e)=>this.inputs.delete(e.code);
    this.boundResize=this.resize.bind(this);
    canvas.addEventListener('pointerdown',this.boundPointerDown);
    canvas.addEventListener('pointermove',this.boundPointerMove);
    canvas.addEventListener('pointerup',this.boundPointerUp);
    canvas.addEventListener('pointercancel',this.boundPointerUp);
    canvas.addEventListener('wheel',this.boundWheel,{passive:false});
    window.addEventListener('keydown',this.boundKeyDown); window.addEventListener('keyup',this.boundKeyUp); window.addEventListener('resize',this.boundResize);
    this.resize();this.render();
  }

  private setupLight(){
    // A genuine daylight key replaces high-intensity sepia fixtures and the dark interior.
    this.scene.add(new THREE.HemisphereLight(0xe8f7ff,0x8f9e75,2.35));
    const sun=new THREE.DirectionalLight(0xfff3d9,3.25);
    sun.position.set(-7,15,5);sun.castShadow=true;
    sun.shadow.mapSize.set(this.mobile?1024:2048,this.mobile?1024:2048);
    sun.shadow.camera.left=-20;sun.shadow.camera.right=20;sun.shadow.camera.top=20;sun.shadow.camera.bottom=-20;
    sun.shadow.camera.near=.1;sun.shadow.camera.far=47;sun.shadow.bias=-.00038;
    sun.shadow.normalBias=.026;
    this.scene.add(sun);sun.target.position.set(0,0,-4);this.scene.add(sun.target);
    const lamp=(x:number,y:number,z:number,power:number,color=0xffebc9,distance=8)=>{
      const light=new THREE.PointLight(color,power,distance,2);
      light.position.set(x,y,z);this.scene.add(light);this.glowLights.push(light);return light;
    };
    lamp(-3.4,3.4,1.0,2.1);lamp(3.8,3.4,-2.2,2.0);
    lamp(0,4.4,-5.2,1.7);lamp(-2.7,3.2,-3.8,1.8);
    lamp(0,3.5,-12.5,5.5,0xffe3af,13);
    this.gardenBaseIntensity=5.5;
  }
  private mesh(geo:THREE.BufferGeometry, material:THREE.Material,parent:THREE.Object3D,pos:[number,number,number]=[0,0,0],shadow=true){
    const m=new THREE.Mesh(geo,material);m.position.set(...pos);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);this.materials.push(material);return m;
  }
  private block(parent:THREE.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,material:THREE.Material,bevel=.025){
    if(bevel<=0) return this.mesh(new THREE.BoxGeometry(w,h,d),material,parent,[x,y,z]);
    const shape=new THREE.Shape();shape.moveTo(-w/2+bevel,-h/2);shape.lineTo(w/2-bevel,-h/2);
    shape.quadraticCurveTo(w/2,-h/2,w/2,-h/2+bevel);shape.lineTo(w/2,h/2-bevel);shape.quadraticCurveTo(w/2,h/2,w/2-bevel,h/2);
    shape.lineTo(-w/2+bevel,h/2);shape.quadraticCurveTo(-w/2,h/2,-w/2,h/2-bevel);
    shape.lineTo(-w/2,-h/2+bevel);shape.quadraticCurveTo(-w/2,-h/2,-w/2+bevel,-h/2);
    const geo=new THREE.ExtrudeGeometry(shape,{depth:d,steps:1,bevelEnabled:true,bevelSegments:2,bevelThickness:Math.min(bevel*.45,.015),bevelSize:Math.min(bevel*.45,.015)});
    geo.translate(0,0,-d/2);return this.mesh(geo,material,parent,[x,y,z]);
  }
  private cylinder(parent:THREE.Object3D,r:number,h:number,x:number,y:number,z:number,material:THREE.Material,segments=24){return this.mesh(new THREE.CylinderGeometry(r,r,h,segments),material,parent,[x,y,z]);}
  private sphere(parent:THREE.Object3D,r:number,x:number,y:number,z:number,material:THREE.Material){return this.mesh(new THREE.SphereGeometry(r,12,8),material,parent,[x,y,z]);}
  private torus(parent:THREE.Object3D,r:number,tube:number,x:number,y:number,z:number,material:THREE.Material){return this.mesh(new THREE.TorusGeometry(r,tube,8,40),material,parent,[x,y,z]);}
  private hotspot(parent:THREE.Object3D,part:Interactive,x:number,y:number,z:number,w:number,h:number,d:number,sub?:string){
    const obj=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
    obj.position.set(x,y,z);obj.userData.action=part;obj.userData.part=sub;parent.add(obj);this.interactive.push(obj);return obj;
  }
  private woodFloor(x:number,z:number,w:number,d:number){
    // Large pale limestone pavers with subtly irregular mineral veining.
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=768;
    const ctx=canvas.getContext('2d')!;
    ctx.fillStyle='#d4d5c2';ctx.fillRect(0,0,768,768);
    for(let row=0;row<9;row++){
      const y=row*86;const shift=row%2?78:0;
      for(let col=-1;col<6;col++){
        const x=col*155-shift;
        const v=Math.floor((seedRand()-.5)*21);
        const c=[218+v,219+v,204+v].map(t=>Math.max(170,Math.min(242,t)));
        ctx.fillStyle=`rgb(${c[0]},${c[1]},${c[2]})`;ctx.fillRect(x+3,y+3,149,80);
        ctx.strokeStyle='rgba(109,128,114,.17)';ctx.lineWidth=1;
        for(let i=0;i<3;i++){
          ctx.beginPath();ctx.moveTo(x+10+seedRand()*60,y+7+seedRand()*50);
          ctx.bezierCurveTo(x+48,y+11,x+98,y+77,x+130,y+10+seedRand()*62);ctx.stroke();
        }
      }
    }
    const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
    tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(w/11,d/11);tex.anisotropy=4;
    const floor=this.mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshStandardMaterial({map:tex,roughness:.94,metalness:0}),this.scene,[x,.018,z],false);
    floor.rotation.x=-Math.PI/2;
  }
  private wallPanel(x:number,z:number,rot:number,width:number){
    const frame=mat(0xe3e8d7,.46,.18);
    const mid=mat(0xb1bdb0,.39,.28);
    const glass=new THREE.MeshPhysicalMaterial({color:0xe2f5ef,roughness:.11,metalness:.04,transparent:true,opacity:.12,depthWrite:false,side:THREE.DoubleSide});
    const group=new THREE.Group();group.position.set(x,0,z);group.rotation.y=rot;this.scene.add(group);
    const bay=width/Math.ceil(width/2.12);
    const total=Math.ceil(width/2.12);
    this.block(group,width,.24,.2,0,.16,0,frame,0);
    this.block(group,width,.19,.16,0,4.95,0,frame,0);
    for(let i=0;i<=total;i++)this.block(group,.11,4.88,.16,-width/2+i*bay,2.54,0,frame,0);
    for(const y of [1.52,3.3])this.block(group,width,.09,.13,0,y,.045,mid,0);
    for(let i=0;i<total;i++){
      const bx=-width/2+(i+.5)*bay;
      // Panes are visually present but do not occlude sky or the greenery beyond.
      this.block(group,bay-.12,4.62,.018,bx,2.55,0,glass,0);
    }
  }
  private createStudy(){
    this.woodFloor(0,0,18,16);
    this.wallPanel(-9,0,Math.PI/2,16);
    this.wallPanel(9,0,-Math.PI/2,16);
    this.wallPanel(0,8,Math.PI,18);
    this.wallPanel(-5.4,-7,0,7.2);
    this.wallPanel(5.4,-7,0,7.2);
    this.createGreenhouseRoof();
    // A pale botanical runner guides the eye towards the glass doors.
    const runner=this.mesh(new THREE.PlaneGeometry(2.2,9),mat(0x9cb1a3,.98),this.scene,[0,.048,-.3],false);
    runner.rotation.x=-Math.PI/2;
    const border=mat(0xe8dac1,.82);
    for(const x of [-1.12,1.12])this.block(this.scene,.025,.02,9,x,.054,-.3,border,0);
    this.createClock();this.createDesk();this.createClueStations();this.createGramophone();this.createPaintings();this.createBookshelf();this.createGate();
    this.createArmchair(-5,3);this.createArmchair(5,4);
    this.createChandelier();this.createBotanicalDecor();
    this.createWindow(-6.8,-6.75,2.8,3.1);
    this.createWindow(6.8,-6.75,2.8,3.1);
  }
  private createGreenhouseRoof(){
    const frame=mat(0xe0e8d9,.47,.16);
    const glass=new THREE.MeshPhysicalMaterial({color:0xd8f5f4,transparent:true,opacity:.10,depthWrite:false,side:THREE.DoubleSide,roughness:.17,metalness:0});
    // The A-frame roof makes a bright skylight rather than the previous solid dark ceiling.
    for(const side of [-1,1]){
      const roof=this.mesh(new THREE.PlaneGeometry(9.35,16.3),glass,this.scene,[side*4.45,5.95,.45],false);
      roof.rotation.x=-Math.PI/2;roof.rotation.y=side*.21;
      for(let z=-7;z<=8.1;z+=2.55){
        const beam=this.block(this.scene,8.95,.1,.1,side*4.45,5.96,z,frame,0);
        beam.rotation.z=-side*.21;
      }
    }
    this.block(this.scene,.16,.20,16.4,0,6.94,.45,frame,0);
    for(let z=-7;z<=8;z+=3.8){
      for(const side of [-1,1]){
        const arch=this.block(this.scene,9,.09,.08,side*4.45,5.95,z,frame,0);
        arch.rotation.z=-side*.21;
      }
    }
  }
  private createBotanicalDecor(){
    const pots: Array<[number,number,number]> = [];
    for(const z of [-5.4,-2.3,.4,3.2,5.5]){
      pots.push([-7.7,z,.93],[7.7,z,.88]);
    }
    for(const x of [-7.6,-5.9,-2.4,2.4,5.9,7.6])pots.push([x,-6.55,.77]);
    for(const x of [-7.4,7.4])pots.push([x,6.2,1.0]);
    const foliage=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.85,side:THREE.DoubleSide,vertexColors:false});
    // Folded, tapered leaves have a midrib and 3-D silhouette; shared instanced geometry.
    const verts=new Float32Array([0,0,0,-.12,.28,0,0,.35,.09, 0,0,0,0,.35,.09,.12,.28,0, -.12,.28,0,-.09,.70,-.03,0,.35,.09, 0,.35,.09,-.09,.70,-.03,0,.91,0, 0,.35,.09,0,.91,0,.09,.70,-.03, 0,.35,.09,.09,.70,-.03,.12,.28,0]);
    const leafGeo=new THREE.BufferGeometry();leafGeo.setAttribute('position',new THREE.BufferAttribute(verts,3));leafGeo.computeVertexNormals();
    const inst=new THREE.InstancedMesh(leafGeo,foliage,pots.length*18);
    this.botanicalLeaves=inst;
    inst.castShadow=false;inst.receiveShadow=false;const dummy=new THREE.Object3D();
    let n=0;
    const potMaterial=mat(0xe2d5bb,.91);
    const lip=mat(0xf2e5cf,.76);
    for(const [px,pz,scale] of pots){
      this.cylinder(this.scene,.40*scale,.65*scale,px,.34*scale,pz,potMaterial,18);
      this.cylinder(this.scene,.44*scale,.1*scale,px,.67*scale,pz,lip,18);
      this.cylinder(this.scene,.37*scale,.03,px,.72*scale,pz,mat(0x4d6143),18);
      for(let j=0;j<18;j++){
        const angle=(j/18)*Math.PI*2,off=j%3;
        dummy.position.set(px+Math.sin(angle)*.065*scale,.72*scale,pz+Math.cos(angle)*.065*scale);
        dummy.rotation.set(.35+off*.20,angle+.55,Math.sin(angle*1.1)*.40);
        dummy.scale.setScalar(scale*(.6+seedRand()*.35));dummy.updateMatrix();inst.setMatrixAt(n,dummy.matrix);
        const leafColor=[0x446f50,0x759a71,0x365f4d,0x97b081][n%4];
        inst.setColorAt(n,new THREE.Color(leafColor));this.plantBaseColors.push(leafColor);n++;
      }
    }
    inst.instanceMatrix.needsUpdate=true;this.scene.add(inst);
    // Hanging clusters add a natural foreground in portrait mode.
    for(const x of [-6.6,-3.2,3.2,6.6]){
      for(let j=0;j<4;j++){
        const y=4.58-j*.3,z=-4.1+seedRand()*8.3;
        this.sphere(this.scene,.21+seedRand()*.12,x+(seedRand()-.5)*.5,y,z,mat(j%2?0x70976e:0x4c7757,.92));
        if(j%2===0)this.sphere(this.scene,.09,x+.11,y+.04,z+.07,mat(0xd6aaba,.83));
      }
    }
  }
  private createExteriorLandscape(){
    // Beyond the glass: light garden lawns and recognizable leafy silhouettes.
    const lawn=this.mesh(new THREE.PlaneGeometry(160,150),mat(0x91b68f,.97),this.scene,[0,-.10,-12],false);lawn.rotation.x=-Math.PI/2;
    const trunk=mat(0x7c765f,.94);
    const greens=[0x6f9d72,0x8cab83,0x5e936d,0xb2c69a];
    const treePlaces:Array<[number,number,number]> = [];
    for(let i=0;i<22;i++){
      const x=(i%2===0?-1:1)*(11.4+seedRand()*8.0),z=-16+seedRand()*37;
      treePlaces.push([x,z,.8+seedRand()*.62]);
    }
    for(let i=0;i<14;i++)treePlaces.push([-15+seedRand()*30,11+seedRand()*6,.65+seedRand()*.45]);
    for(const [x,z,scale] of treePlaces){
      this.cylinder(this.scene,.14*scale,2.3*scale,x,1.16*scale,z,trunk,9);
      for(let j=0;j<3;j++){
        const crown=this.sphere(this.scene,(.85+seedRand()*.27)*scale,x+(j-1)*.50*scale,(2.15+(j%2)*.4)*scale,z+(j%2)*.28*scale,mat(greens[(j+Math.floor(x*7+300))%greens.length],.95));
        crown.scale.set(1.13,.76,.94);
        crown.castShadow=false;
      }
    }
  }
  private createWindow(x:number,z:number,w:number,h:number){
    // Large operable French windows, no curtains or rain streaks.
    const frame=mat(0xe4e9dd,.42,.15);
    const inside=new THREE.Group();inside.position.set(x,2.55,z+.12);this.scene.add(inside);
    this.block(inside,w+.22,h+.19,.15,0,0,0,frame,0);
    const clear=new THREE.MeshPhysicalMaterial({color:0xeafff5,transparent:true,opacity:.13,roughness:.08,metalness:0,depthWrite:false});
    this.block(inside,w,h,.028,0,0,.12,clear,0);
    for(const sx of [-1,1]){
      const pivot=new THREE.Group();pivot.position.set(sx*w*.48,0,.17);pivot.rotation.y=sx*.12;inside.add(pivot);
      this.block(pivot,.053,h,.06,0,0,0,frame,0);
    }
    this.block(inside,.065,h,.08,0,0,.21,frame,0);
    this.block(inside,w,.063,.08,0,0,.22,frame,0);
  }
  private createClock(){
    const g=new THREE.Group();g.position.set(-4.45,2.45,-6.64);this.scene.add(g);
    const housing=mat(0xa98c67,.57);this.block(g,1.55,2.3,.35,0,0,-.04,housing,.18);
    this.block(g,1.1,.2,.4,0,1.18,0,housing,.08);
    const face=this.cylinder(g,.59,.095,0,.37,.27,ivory,48);face.rotation.x=Math.PI/2;
    const rim=this.torus(g,.62,.04,0,.37,.32,brass);rim.rotation.z=0;
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6;this.cylinder(g,.015,.03,Math.sin(a)*.5,.37+Math.cos(a)*.5,.35,black,12).rotation.x=Math.PI/2;
    }
    this.clockHands=new THREE.Group();this.clockHands.position.set(0,.37,.39);g.add(this.clockHands);
    const minute=this.block(this.clockHands,.035,.42,.02,0,.19,0,black);
    minute.rotation.z=.0;
    const hour=this.block(this.clockHands,.06,.31,.025,0,.13,.02,brass);hour.rotation.z=.9;
    this.cylinder(g,.23,.12,0,-.53,.37,brass).rotation.x=Math.PI/2;
    const pendulum=this.block(g,.027,.55,.018,0,-.75,.37,brass);pendulum.rotation.z=.02;
    this.hotspot(g,'clock',0,.2,.55,1.6,2.5,.6);
  }
  private createDesk(){
    const g=new THREE.Group();g.position.set(-3.6,0,2.0);this.scene.add(g);
    const wood=mat(0xa68765,.61);
    this.block(g,3.0,.14,1.5,0,1.05,0,wood,.10);
    this.block(g,2.85,.34,1.36,0,.82,0,mat(0x8b745d));
    for(const x of [-1.35,1.35])for(const z of [-.56,.56])this.block(g,.2,1.01,.22,x,.5,z,wood,.05);
    for(const x of [-.82,0,.82]){
      this.block(g,.73,.22,.035,x,.78,.715,mat(0x927758));
      this.cylinder(g,.045,.03,x,.77,.747,brass).rotation.x=Math.PI/2;
    }
    this.block(g,1.02,.05,.7,-.48,1.18,-.22,mat(0x958367)); // page
    const txt=this.createText('HORA: SOL   ·   MINUTOS: AGUA',512,64,'#69513c','#e7d7b4');
    const sign=this.mesh(new THREE.PlaneGeometry(1.12,.17),new THREE.MeshBasicMaterial({map:txt,transparent:true}),g,[-.48,1.216,-.22],false);sign.rotation.x=-Math.PI/2;
    this.block(g,.55,.07,.38,.8,1.18,-.24,mat(0x1e3e50)); // diary
    this.cylinder(g,.05,.15,1.16,1.24,.15,brass);this.cylinder(g,.075,.12,1.16,1.4,.15,ivory);
    // The desk can be examined, but it MUST NOT award the key.
    this.hotspot(g,'desk',-.25,1.24,-.18,2.9,.38,1.08);
    this.hotspot(g,'cabinet',0,.78,.86,2.8,.34,.25);

    // Actual collectible: a recognizable brass key lying on a dark velvet inset.
    // It is foregrounded in the player's view and has its OWN interaction hotspot.
    const display=new THREE.Group();display.position.set(.65,1.16,.42);g.add(display);
    const velvet=mat(0x244e4d,.86);
    this.block(display,.89,.035,.60,0,-.025,0,velvet,.055);
    const key=new THREE.Group();key.position.set(.10,.045,.03);display.add(key);this.keyMesh=key;
    const keyGold=new THREE.MeshStandardMaterial({color:0xf4c778,metalness:.82,roughness:.23,emissive:0x7b471c,emissiveIntensity:.13});
    const keyBright=new THREE.MeshStandardMaterial({color:0xffe3a0,metalness:.62,roughness:.29});
    // Ring rests flat on the writing desk, with a stem and two cut teeth.
    const bow=this.torus(key,.142,.037,.15,0,0,keyGold);bow.rotation.x=-Math.PI/2;
    this.sphere(key,.034,.15,.017,0,keyBright);
    this.block(key,.43,.045,.066,-.13,0,0,keyGold,.014);
    this.block(key,.052,.046,.17,-.30,0,.07,keyGold,.008);
    this.block(key,.054,.046,.14,-.22,0,.065,keyGold,.008);
    const glint=this.sphere(key,.040,-.05,.044,-.01,keyBright);
    glint.castShadow=false;
    this.keyHotspot=this.hotspot(display,'key',.08,.055,.25,.86,.43,.80);
  }
  private createClueStations(){
    // Two physical discoveries; neither station exposes the final clock time.
    const solar=new THREE.Group();solar.position.set(-6.2,1.12,-1.7);this.scene.add(solar);
    this.cylinder(solar,.42,.14,0,0,0,mat(0xcab689,.45));
    const disk=this.cylinder(solar,.34,.04,0,.11,0,brass,36);
    disk.rotation.x=Math.PI/2;
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4;
      const ray=this.block(solar,.027,.19,.024,Math.sin(a)*.25,.11+Math.cos(a)*.25,.11,ivory,.005);
      ray.rotation.z=-a;
    }
    this.sphere(solar,.10,0,.11,.15,mat(0xe7c77f,.34));
    this.hotspot(solar,'sundial',0,.12,.14,.90,.95,.70);
    const water=new THREE.Group();water.position.set(5.8,.82,3.3);this.scene.add(water);
    this.cylinder(water,.51,.66,0,-.42,0,mat(0xc0d8d6,.65),28);
    this.cylinder(water,.60,.14,0,.01,0,mat(0x8baca8,.38),32);
    for(let i=1;i<=4;i++){
      const ripple=this.torus(water,i*.105,.015,0,.105+i*.005,0,new THREE.MeshStandardMaterial({color:0x77b6c0,roughness:.23,metalness:.19}));
      ripple.rotation.x=Math.PI/2;
    }
    this.hotspot(water,'waterBasin',0,.11,0,1.1,.45,1.1);
  }
  private createGramophone(){
    const g=new THREE.Group();g.position.set(3.85,1.35,-1.85);this.scene.add(g);
    const pedestal=mat(0x9e876e,.58);
    this.block(this.scene,1.85,1.02,1.55,3.85,.53,-1.85,pedestal,.14);
    this.block(g,1.55,.22,1.25,0,0,0,pedestal,.10);
    this.cylinder(g,.51,.04,-.27,.14,.1,black,50);
    this.cylinder(g,.075,.055,-.27,.18,.1,brass);
    this.cylinder(g,.03,.32,.42,.29,-.26,brass);
    this.block(g,.45,.032,.045,.15,.35,-.06,brass).rotation.z=-.35;
    const base=this.cylinder(g,.19,.19,.39,.33,-.4,brass);base.rotation.x=.1;
    const hornPoints:[[number,number],...Array<[number,number]>]=[[.06,0],[.08,.22],[.13,.42],[.24,.57],[.44,.78],[.6,1.02]];
    const horn=this.mesh(new THREE.LatheGeometry(hornPoints.map(p=>new THREE.Vector2(...p)),48),new THREE.MeshStandardMaterial({color:0xad783f,metalness:.72,roughness:.28,side:THREE.DoubleSide}),g,[.43,.45,-.4]);horn.rotation.z=.23;
    this.hotspot(g,'gramophone',0,.5,.1,2,1.9,1.8,'choose');
    const positions=[-.67,.05,.69];for(let i=0;i<3;i++){
      const disc=this.cylinder(g,.25,.034,positions[i],-.01,.66,mat(palette[i]));disc.rotation.x=Math.PI/2;
      this.hotspot(g,'gramophone',positions[i],.02,.76,.46,.4,.19,['rojo','azul','oro'][i]);
    }
  }
  private createPaintings(){
    const entries=[['LUNA',2],['ESTRELLAS',7],['FLOR',4]] as const;
    entries.forEach(([name,digit],i)=>{
      const g=new THREE.Group();g.position.set(-3.25+i*3.2,3.06,7.82);g.rotation.y=Math.PI;this.scene.add(g);
      this.block(g,1.9,1.13,.11,0,0,0,brass,.06);
      this.block(g,1.72,.96,.05,0,0,.11,mat(0x293641,.84));
      const glyphs={LUNA:'☾',ESTRELLAS:'✶',FLOR:'✿'} as const;
      const tex=this.createText(Array(digit).fill(glyphs[name]).join(' '),700,132,'#e2d5b8','#26323d');
      this.mesh(new THREE.PlaneGeometry(1.46,.41),new THREE.MeshBasicMaterial({map:tex,transparent:true}),g,[0,0,.16],false);
      this.hotspot(g,'painting',0,0,.24,1.9,1.3,.25,name);
      if(i===1) this.painting=g;
    });
  }
  private createBookshelf(){
    const g=new THREE.Group();g.position.set(7.66,0,-3.8);g.rotation.y=-Math.PI/2;this.scene.add(g);
    this.slidingShelf=g;
    const wood=mat(0x9d9275,.62);
    this.block(g,4.7,4.45,.62,0,2.23,0,wood,.07);
    this.block(g,4.36,4.1,.68,0,2.27,.27,mat(0x5c6353),.02);
    // One instanced mesh per book leather color; hundreds fewer draw calls on midrange phones.
    const spineShape=new THREE.Shape();
    spineShape.moveTo(-.5,-.5);spineShape.lineTo(.5,-.5);spineShape.lineTo(.5,.5);spineShape.lineTo(-.5,.5);spineShape.closePath();
    const bookGeometry=new THREE.ExtrudeGeometry(spineShape,{depth:.33,steps:1,bevelEnabled:true,bevelThickness:.035,bevelSize:.035,bevelSegments:2});
    bookGeometry.translate(0,0,-.165);
    const colorGroups:{x:number,y:number,z:number,w:number,h:number,tilt:number,color:number}[][]=palette.map(()=>[]);
    const brassDetails:{x:number,y:number,z:number,h:number}[]=[];
    for(const row of [0.8,1.78,2.78,3.8]){
      this.block(g,4.5,.14,.75,0,row,.34,wood,.03);
      for(let j=0;j<27;j++){
        const w=.07+seedRand()*.07,h=.53+seedRand()*.26;
        const color=Math.floor(seedRand()*palette.length);
        const x=-2.07+j*.16,y=row+.085+h/2;
        colorGroups[color].push({x,y,z:.35,w,h,tilt:(seedRand()-.5)*.08,color});
        if(j%6===0)brassDetails.push({x,y,z:.55,h:h*.75});
      }
    }
    const dummy=new THREE.Object3D();
    colorGroups.forEach((books,color)=>{
      const im=new THREE.InstancedMesh(bookGeometry,mat(palette[color],.77),books.length);
      books.forEach((book,index)=>{
        dummy.position.set(book.x,book.y,book.z);dummy.rotation.set(0,0,book.tilt);
        dummy.scale.set(book.w,book.h,1);dummy.updateMatrix();im.setMatrixAt(index,dummy.matrix);
      });
      im.castShadow=false;im.receiveShadow=true;g.add(im);
    });
    const detailGeo=new THREE.BoxGeometry(.016,1,.02);
    const details=new THREE.InstancedMesh(detailGeo,brass,brassDetails.length);
    brassDetails.forEach((stripe,index)=>{
      dummy.position.set(stripe.x,stripe.y,stripe.z);dummy.rotation.set(0,0,0);
      dummy.scale.set(1,stripe.h,1);dummy.updateMatrix();details.setMatrixAt(index,dummy.matrix);
    });
    details.castShadow=false;g.add(details);
    const tags=[['luna',-1.4,1.81],['lluvia',0,1.81],['flor',1.4,1.81]] as const;
    tags.forEach(([id,x,y],i)=>{
      const group=new THREE.Group();group.position.set(x,y,.83);g.add(group);
      const book=this.block(group,.28,.62,.35,0,0,0,mat([0x5f516b,0x315e7a,0x63764c][i],.45),.02);
      book.rotation.y=.03;
      const txt=this.createText(id.toUpperCase(),320,88,'#e7dbb7','#241d1a');
      this.mesh(new THREE.PlaneGeometry(.26,.08),new THREE.MeshBasicMaterial({map:txt,transparent:true}),group,[0,0,.22],false);
      this.hotspot(group,'books',0,0,.28,.4,.78,.45,id);
    });
  }
  private createGate(){
    const g=new THREE.Group();g.position.set(-1.75,0,-6.77);this.scene.add(g);this.gate=g;
    const leaf=new THREE.Group();leaf.position.x=1.75;g.add(leaf);
    this.block(leaf,3.5,4.52,.21,0,2.26,-.04,mat(0xd4dfd0),.13);
    this.block(leaf,3.14,4.22,.08,0,2.25,.04,new THREE.MeshPhysicalMaterial({color:0xccf3ea,roughness:.13,metalness:.31,transparent:true,opacity:.44}));
    for(const x of [-.86,0,.86])this.block(leaf,.043,4.2,.15,x,2.25,.16,brass);
    this.block(leaf,3.3,.042,.15,0,2.4,.16,brass);
    this.cylinder(leaf,.07,.11,.72,1.35,.19,brass).rotation.x=Math.PI/2;
    this.hotspot(leaf,'gardenGate',0,2,.32,3.4,4.5,.35);
    // Gate starts visually closed until the secret bookshelf resolves.
  }
  private createArmchair(x:number,z:number){
    const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=(x<0?.7:-.8);this.scene.add(g);
    const cloth=mat(0xd4b8a9,.91),wood=mat(0xa58e6c,.65);
    this.block(g,1.22,.3,1.0,0,.62,0,cloth,.12);
    this.block(g,1.18,1.13,.25,0,1.35,-.47,cloth,.14).rotation.x=-.12;
    for(const s of [-1,1]){
      this.block(g,.21,.54,.97,s*.64,.84,0,wood,.07);
      this.sphere(g,.17,s*.64,1.08,.3,cloth);
      for(const zz of [-.35,.38])this.cylinder(g,.07,.45,s*.55,.25,zz,wood);
    }
  }
  private createChandelier(){
    // An airy central pendant, not the former low candle chandelier.
    const fixture=new THREE.Group();fixture.position.set(0,5.75,-.4);this.scene.add(fixture);
    const rattan=mat(0xc9a77d,.69,.02);
    this.cylinder(fixture,.025,.66,0,-.3,0,brass,12);
    const shade=this.mesh(new THREE.LatheGeometry([new THREE.Vector2(.02,0),new THREE.Vector2(.28,-.10),new THREE.Vector2(.5,-.20),new THREE.Vector2(.63,-.39),new THREE.Vector2(.55,-.49)].map(([x,y])=>new THREE.Vector2(x,y)),36),new THREE.MeshStandardMaterial({color:0xd8bd93,side:THREE.DoubleSide,roughness:.71}),fixture,[0,-.72,0]);
    shade.castShadow=false;
    this.sphere(fixture,.12,0,-.97,0,mat(0xfff6db,.25));
  }
  private createGarden(){
    this.woodFloor(0,-12.4,16,13);
    const soil=mat(0x74896c,.93);const leaf=mat(0x4d8859,.84);
    const walkway=this.mesh(new THREE.PlaneGeometry(3.5,10),mat(0xd2d3bc,.93),this.scene,[0,.04,-11.2],false);walkway.rotation.x=-Math.PI/2;
    for(let i=0;i<16;i++){
      const z=-7-i*.6;
      for(let side of [-1,1]){
        this.block(this.scene,2.3,.34,.57,side*2.45,.18,z,soil,.05);
      }
    }
    // Flower field uses instancing to keep garden viable on mobile.
    const stemGeometry=new THREE.CylinderGeometry(.014,.022,.56,5);
    const stems=new THREE.InstancedMesh(stemGeometry,leaf,230);const flowerGeo=new THREE.SphereGeometry(.09,7,5);
    const flowers=new THREE.InstancedMesh(flowerGeo,mat(0xe5a0ad,.92),230);
    this.flowerHeads=flowers;this.flowerStems=stems;
    const dummy=new THREE.Object3D();
    for(let i=0;i<230;i++){
      const x=(seedRand()-.5)*13.5,z=-7.4-seedRand()*9.4;
      const stemScale=.7+seedRand()*.5,headScale=.65+seedRand()*.8;
      const flowerColor=[0xe8acc8,0xffd4d2,0xe6bf8a,0xd5c4ff][i%4];
      this.flowerInstances.push({x,z,stemScale,headScale,flowerColor});
      dummy.position.set(x,.32,z);dummy.rotation.set(0,0,0);dummy.scale.setScalar(stemScale);dummy.updateMatrix();stems.setMatrixAt(i,dummy.matrix);
      dummy.position.y=.67;dummy.scale.setScalar(headScale);dummy.updateMatrix();flowers.setMatrixAt(i,dummy.matrix);
      flowers.setColorAt(i,new THREE.Color(flowerColor));
    }
    stems.castShadow=false;flowers.castShadow=false;this.scene.add(stems,flowers);
    this.updateBloomState(0);
    // Glass greenhouse frame, decorative arch and warm string lights.
    for(const x of [-7.3,7.3])for(const z of [-8,-11,-14,-17]){
      this.cylinder(this.scene,.05,5.1,x,2.55,z,brass);
    }
    for(const z of [-8,-11,-14,-17]){
      this.block(this.scene,14.6,.09,.07,0,5.08,z,brass);
    }
    const arch=new THREE.Mesh(new THREE.TorusGeometry(3.2,.09,9,45,Math.PI),brass);
    arch.position.set(0,2.0,-14.2);arch.rotation.z=Math.PI;this.scene.add(arch);
    this.createDinnerTable();
    for(let i=0;i<32;i++){
      const x=(seedRand()-.5)*13,z=-7.8-seedRand()*9;
      const led=this.sphere(this.scene,.065,x,4.55+(seedRand()-.5)*.35,z,new THREE.MeshBasicMaterial({color:0xffdba0}));this.gardenBulbs.push(led);
    }
    for(let i=0;i<3;i++) this.createLantern(i,[-2.3,0,2.3][i],-13.3);
    this.createPetals();
  }
  private createDinnerTable(){
    const g=new THREE.Group();g.position.set(0,0,-15.2);this.scene.add(g);
    const cloth=mat(0xfff8ec,.9);
    this.cylinder(g,.87,.16,0,1.07,0,cloth,42);
    this.cylinder(g,.10,1.03,0,.55,0,brass,16);
    this.cylinder(g,.57,.09,0,.045,0,brass,30);
    for(const side of [-1,1]) {
      const chair=new THREE.Group();chair.position.set(side*1.7,0,0);chair.rotation.y=side*Math.PI/2;g.add(chair);
      this.block(chair,.8,.13,.7,0,.65,0,mat(0xb9c5a8),.10);
      this.block(chair,.8,.88,.14,0,1.07,-.3,mat(0xb9c5a8),.08);
      for(const cx of [-.3,.3])for(const cz of [-.25,.25])this.cylinder(chair,.035,.61,cx,.3,cz,brass,12);
    }
    for(const z of [-.4,.4]){
      this.cylinder(g,.24,.017,0,1.17,z,ivory,24);
      this.cylinder(g,.04,.18,.18,1.26,z,brass,16);
    }
    const bouquet=this.cylinder(g,.13,.33,0,1.29,0,mat(0x879898,.23));bouquet.material.transparent=true;(bouquet.material as THREE.MeshStandardMaterial).opacity=.65;
    for(let i=0;i<7;i++) this.sphere(g,.11,(seedRand()-.5)*.4,1.52+(seedRand()-.5)*.2,(seedRand()-.5)*.4,mat(0xb85c65));
    const gift=new THREE.Group();gift.position.set(0,1.42,0);g.add(gift);
    this.block(gift,.32,.15,.26,0,0,0,mat(0xe9d8b8),.06);
    this.block(gift,.36,.055,.31,0,.1,0,brass,.02);
    this.block(gift,.05,.06,.34,0,.14,0,mat(0x8a374c));
    this.hotspot(g,'present',0,1.32,0,.8,.65,.8);
  }
  private createLantern(i:number,x:number,z:number){
    const group=new THREE.Group();group.position.set(x,0,z);this.scene.add(group);
    this.cylinder(group,.055,2.35,0,1.2,0,brass);
    this.cylinder(group,.2,.11,0,2.36,0,brass);
    const glass=this.cylinder(group,.18,.43,0,2.68,0,new THREE.MeshStandardMaterial({color:0x596779,roughness:.14,metalness:.12,transparent:true,opacity:.54}));
    this.lanternMeshes.push(glass);
    this.cylinder(group,.21,.07,0,2.91,0,brass);
    this.sphere(group,.1,0,2.67,0,new THREE.MeshBasicMaterial({color:0x665044}));
    const labels=['LUNA','FLOR','LLUVIA'];
    const plaque=this.createText(labels[i],350,88,'#2e6556','#f0e8cf');
    this.mesh(new THREE.PlaneGeometry(.48,.125),new THREE.MeshBasicMaterial({map:plaque}),group,[0,2.12,.21],false);
    this.hotspot(group,`lantern${i}` as Interactive,0,2.66,.15,.7,.86,.68);
  }
  private createPetals(){
    const geo=new THREE.BufferGeometry();const vertices=new Float32Array(105*3);
    for(let i=0;i<105;i++) {vertices[i*3]=(seedRand()-.5)*13;vertices[i*3+1]=.4+seedRand()*5.8;vertices[i*3+2]=-7.4-seedRand()*9}
    geo.setAttribute('position',new THREE.BufferAttribute(vertices,3));
    const matl=new THREE.PointsMaterial({color:0xffe1c6,size:.10,transparent:true,opacity:0,depthWrite:false,sizeAttenuation:true});
    this.petals=new THREE.Points(geo,matl);this.scene.add(this.petals);
  }
  private createText(text:string,w:number,h:number,color:string,bg:string){
    const cvs=document.createElement('canvas');cvs.width=w;cvs.height=h;
    const ctx=cvs.getContext('2d')!;ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    ctx.fillStyle=color;ctx.font=`${Math.floor(h*.24)}px Georgia,serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,w/2,h/2,w*.97);
    const tex=new THREE.CanvasTexture(cvs);tex.colorSpace=THREE.SRGBColorSpace;return tex;
  }
  private placeAssets(){
    // GLB pipeline ready for commercial-grade replacements. Falls back only until asset files are supplied.
    const optionalModels:[string,[number,number,number],number][]=[
      ['victorian-armchair.glb',[-6,0,-.3],1]
    ];
    const loader=new GLTFLoader();
    optionalModels.forEach(([name,position,scale])=>{
      loader.load(`/models/${name}`,gltf=>{
        if(this.disposed)return;
        gltf.scene.position.set(...position);gltf.scene.scale.setScalar(scale);
        gltf.scene.traverse(obj=>{if(obj instanceof THREE.Mesh){obj.castShadow=true;obj.receiveShadow=true}});
        this.scene.add(gltf.scene);
        if(gltf.animations.length){let mix=new AnimationMixer(gltf.scene);this.mixers.push(mix);gltf.animations.forEach(clip=>mix.clipAction(clip).play())}
      },undefined,()=>{/* Optional files absent; procedural preview continues to work. */});
    });
  }
  setStage(stage:Stage){
    this.stage=stage;
    if(stage>=4){this.openGate();this.rushEnabled=stage===4;}
    if(stage===5){this.romantic=true;this.rushEnabled=false;this.storm=0;this.updateBloomState(0);this.renderer.toneMappingExposure=1.47;if(this.petals)(this.petals.material as THREE.PointsMaterial).opacity=.87;
      if(this.glowLights[4])(this.glowLights[4] as THREE.PointLight).intensity=this.gardenBaseIntensity*1.5;
      this.gardenBulbs.forEach(bulb=>(bulb.material as THREE.MeshBasicMaterial).color.setHex(0xffdba0));
    }
  }
  setKeyFound(found:boolean){
    if(this.keyMesh)this.keyMesh.visible=!found;
    if(this.keyHotspot){
      this.keyHotspot.visible=!found;
      if(found){
        this.interactive=this.interactive.filter(object=>object!==this.keyHotspot);
        this.setFocus(null);
      }
    }
  }
  setLanterns(values:number[]){
    this.lanternMeshes.forEach((m,i)=>{
      const lit=values.includes(i);
      (m.material as THREE.MeshStandardMaterial).emissive=new THREE.Color(lit?0xffcc85:0x000000);
      (m.material as THREE.MeshStandardMaterial).emissiveIntensity=lit?1.8:0;
    });
  }
  /** The passing minutes visibly sap the garden. 3D geometry remains readable at all times. */
  setExplorationIntensity(value:number){
    if(this.stage>=4)return;
    this.updateBloomState(THREE.MathUtils.clamp(value,0,.28));
  }
  private updateBloomState(amount:number){
    const t=THREE.MathUtils.clamp(amount,0,1);
    // Updating 230 instances only when the change is noticeable avoids per-frame matrices.
    if(Math.abs(t-this.lastWilt)<.018)return;
    this.lastWilt=t;this.wilt=t;
    const stem=this.flowerStems,heads=this.flowerHeads;
    if(stem&&heads){
      const dummy=new THREE.Object3D();
      const dry=new THREE.Color(0x897e66);
      this.flowerInstances.forEach((flower,index)=>{
        const lean=t*(.2+(.32*(index%7)/6));
        dummy.rotation.set(lean*.3,0,lean*(index%2?1:-1));
        dummy.position.set(flower.x,.32-t*.13,flower.z);
        dummy.scale.set(flower.stemScale*(1-t*.22),flower.stemScale*(1-t*.34),flower.stemScale*(1-t*.22));
        dummy.updateMatrix();stem.setMatrixAt(index,dummy.matrix);
        dummy.rotation.set(t*.35,0,t*(index%2?1:-1)*.5);
        dummy.position.y=.67-t*.38;
        dummy.position.x=flower.x+(index%2?1:-1)*t*.15;
        dummy.scale.setScalar(flower.headScale*(1-t*.70));
        dummy.updateMatrix();heads.setMatrixAt(index,dummy.matrix);
        heads.setColorAt(index,new THREE.Color(flower.flowerColor).lerp(dry,t*.92));
      });
      stem.instanceMatrix.needsUpdate=true;heads.instanceMatrix.needsUpdate=true;
      if(heads.instanceColor)heads.instanceColor.needsUpdate=true;
    }
    if(this.botanicalLeaves){
      const dry=new THREE.Color(0x9a8c6b);
      for(let i=0;i<this.plantBaseColors.length;i++){
        this.botanicalLeaves.setColorAt(i,new THREE.Color(this.plantBaseColors[i]).lerp(dry,t*.72));
      }
      if(this.botanicalLeaves.instanceColor)this.botanicalLeaves.instanceColor.needsUpdate=true;
    }
  }
  setRushIntensity(t:number){
    this.storm=THREE.MathUtils.clamp(t,0,1);
    this.updateBloomState(.28+this.storm*.72);
    if(this.petals)(this.petals.material as THREE.PointsMaterial).opacity=this.reducedMotion?0:this.storm*.74;
    if(this.stage===4&&this.gate)this.gate.rotation.y=-Math.PI*.52+Math.PI*.47*this.storm;
    // The garden's own lights start shutting down as the second hand races.
    const dim=1-Math.pow(this.storm,1.5)*.78;
    if(this.glowLights[4])(this.glowLights[4] as THREE.PointLight).intensity=this.gardenBaseIntensity*dim;
    this.gardenBulbs.forEach((bulb,i)=>{
      const emission=bulb.material as THREE.MeshBasicMaterial;
      const cutoff=Math.floor(this.storm*this.gardenBulbs.length);
      emission.color.setHex(i<cutoff?0x44392e:0xffdba0);
    });
  }
  private openGate(){if(this.gate)this.gate.rotation.y=-Math.PI*.52;if(this.slidingShelf)this.slidingShelf.position.z=-4.1;}
  enableMovement(value:boolean){this.canWalk=value; if(!value){this.joystick={x:0,y:0};this.setFocus(null);}}
  setJoystick(x:number,y:number){this.joystick={x:THREE.MathUtils.clamp(x,-1,1),y:THREE.MathUtils.clamp(y,-1,1)};}
  interactFocused(){
    const obj=this.currentFocus;
    if(obj?.userData.action && this.canWalk)this.handlers.onInteract(obj.userData.action as Interactive,obj.userData.part as string|undefined);
  }
  private setFocus(hit:THREE.Object3D|null){
    if(this.currentFocus===hit)return;
    this.currentFocus=hit;
    const action=hit?.userData.action as Interactive|undefined;
    const labels:Partial<Record<Interactive,string>>={key:'Tomar llave de bronce',desk:'Leer nota del escritorio',sundial:'Examinar sol de cobre',waterBasin:'Examinar fuente',clock:'Examinar reloj',gramophone:'Escuchar discos',painting:'Leer cuadro',cabinet:'Abrir cajón',books:'Tocar libro',gardenGate:'Examinar puerta',lantern0:'Encender farola',lantern1:'Encender farola',lantern2:'Encender farola',present:'Abrir regalo'};
    this.handlers.onFocus?.(action?labels[action]||'Examinar':null);
  }
  private findFocused(){
    this.raycaster.setFromCamera(new THREE.Vector2(0,0),this.camera);
    const hit=this.raycaster.intersectObjects(this.interactive,true).find(h=>h.distance<3.5);
    if(!hit)return null;
    let obj:THREE.Object3D|null=hit.object;
    while(obj&&!obj.userData.action)obj=obj.parent;
    return obj;
  }
  private resize(){
    const {clientWidth:w,clientHeight:h}=this.canvas;
    if(!w||!h)return;
    this.renderer.setSize(w,h,false);this.camera.aspect=w/h;
    this.camera.fov=w<h?Math.max(66,Math.min(82,77)):72;
    this.camera.updateProjectionMatrix();
  }
  private zoom(change:number){this.camera.fov=THREE.MathUtils.clamp(this.camera.fov+change,48,90);this.camera.updateProjectionMatrix()}
  private onPointerDown(e:PointerEvent){
    e.preventDefault();this.canvas.setPointerCapture(e.pointerId);
    this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,downX:e.clientX,downY:e.clientY,moved:false});
    if(this.pointers.size===2){const a=[...this.pointers.values()];this.pinchDistance=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)}
  }
  private onPointerMove(e:PointerEvent){
    const p=this.pointers.get(e.pointerId);if(!p)return;
    const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
    if(Math.abs(e.clientX-p.downX)+Math.abs(e.clientY-p.downY)>8)p.moved=true;
    if(this.pointers.size>=2){const a=[...this.pointers.values()];const d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(this.pinchDistance>0)this.zoom((this.pinchDistance-d)*.055);this.pinchDistance=d;return;}
    this.yaw-=dx*(this.mobile?.0036:.0042);
    this.pitch=THREE.MathUtils.clamp(this.pitch-dy*.0029,-1.05,1.05);
  }
  private onPointerUp(e:PointerEvent){
    const p=this.pointers.get(e.pointerId);this.pointers.delete(e.pointerId);
    if(this.pointers.size<2)this.pinchDistance=0;
    if(p && !p.moved && this.pointers.size===0)this.handleTap(e.clientX,e.clientY);
  }
  private handleTap(x:number,y:number){
    if(!this.canWalk)return;
    const r=this.canvas.getBoundingClientRect();this.pointer.set(((x-r.left)/r.width)*2-1,-((y-r.top)/r.height)*2+1);
    this.raycaster.setFromCamera(this.pointer,this.camera);
    const hits=this.raycaster.intersectObjects(this.interactive,true);
    const hit=hits.find(h=>h.distance<5.4);
    if(hit){let o:THREE.Object3D|null=hit.object;while(o&&!o.userData.action)o=o.parent;if(o?.userData.action){this.handlers.onInteract(o.userData.action as Interactive,o.userData.part as string|undefined);if('vibrate' in navigator)navigator.vibrate?.(12)}}
  }
  private render=()=>{
    if(this.disposed)return;
    const dt=Math.min(this.clock.getDelta(),.045);
    if(this.canWalk){
      let fw=(this.inputs.has('KeyW')||this.inputs.has('ArrowUp')?1:0)-(this.inputs.has('KeyS')||this.inputs.has('ArrowDown')?1:0)-this.joystick.y;
      let side=(this.inputs.has('KeyD')||this.inputs.has('ArrowRight')?1:0)-(this.inputs.has('KeyA')||this.inputs.has('ArrowLeft')?1:0)+this.joystick.x;
      const magn=Math.hypot(fw,side);if(magn>1){fw/=magn;side/=magn}
      const speed=this.speed*(this.inputs.has('ShiftLeft')?1.5:1)*dt;
      let xx=this.camera.position.x+(-Math.sin(this.yaw)*fw+Math.cos(this.yaw)*side)*speed;
      let zz=this.camera.position.z+(-Math.cos(this.yaw)*fw-Math.sin(this.yaw)*side)*speed;
      const next=resolveMovement({x:this.camera.position.x,z:this.camera.position.z},{x:xx,z:zz},this.stage);
      xx=next.x;zz=next.z;
      this.camera.position.set(xx,1.63,zz);this.handlers.onMove?.(xx,zz);
    }
    this.camera.rotation.order='YXZ';this.camera.rotation.y=this.yaw;this.camera.rotation.x=this.pitch;
    if(this.clockHands){this.clockTime+=dt;this.clockHands.rotation.z=this.stage>=1?-Math.sin(this.clockTime*1.5)*.025:0;}
    if(!this.reducedMotion){
      for(const rain of this.rainDrops){rain.position.y-=dt*1.15;
        if(rain.position.y<1.3)rain.position.y=3.8;
      }
    }
    if(this.painting&&this.stage>=2)this.painting.position.y=3.34;
    if(this.petals){if(!this.reducedMotion)this.petals.rotation.y+=dt*.025;
      const pts=this.petals.geometry.attributes.position as THREE.BufferAttribute;
      for(let i=0;i<pts.count;i++){
        let y=pts.getY(i)-dt*(this.romantic?.3:this.rushEnabled?.14:0);
        if(y<.1)y=5.4;pts.setY(i,y);
      }
      pts.needsUpdate=(this.romantic||this.rushEnabled)&&!this.reducedMotion;
    }
    if(this.rushEnabled){
      const wave=Math.sin(this.clockTime*7)*.13*this.storm;
      this.glowLights.forEach((l,i)=>{if(i<4)(l as THREE.PointLight).intensity=2.1*(1-this.storm*.25)+wave*.9});
    }
    this.mixers.forEach(m=>m.update(dt));
    // Poll focus infrequently and only report changes to avoid unnecessary React renders.
    this.focusTime+=dt;
    if(this.focusTime>.14 && this.canWalk){this.focusTime=0;this.setFocus(this.findFocused());}
    this.renderer.render(this.scene,this.camera);
    this.frameElapsed+=dt;this.frameCounter++;
    if(this.frameElapsed>=3){
      const fps=this.frameCounter/this.frameElapsed;
      if(fps<31&&this.qualityDpr>0.85)this.qualityDpr=Math.max(.85,this.qualityDpr-.12);
      else if(fps>55&&this.qualityDpr<this.maxDpr)this.qualityDpr=Math.min(this.maxDpr,this.qualityDpr+.07);
      if(Math.abs(this.renderer.getPixelRatio()-this.qualityDpr)>.005)this.renderer.setPixelRatio(this.qualityDpr);
      this.frameCounter=0;this.frameElapsed=0;
    }
    this.raf=requestAnimationFrame(this.render);
  };
  getPosition(){return this.camera.position.clone();}
  dispose(){
    this.disposed=true;cancelAnimationFrame(this.raf);
    this.canvas.removeEventListener('pointerdown',this.boundPointerDown);this.canvas.removeEventListener('pointermove',this.boundPointerMove);
    this.canvas.removeEventListener('pointerup',this.boundPointerUp);this.canvas.removeEventListener('pointercancel',this.boundPointerUp);this.canvas.removeEventListener('wheel',this.boundWheel);
    window.removeEventListener('keydown',this.boundKeyDown);window.removeEventListener('keyup',this.boundKeyUp);window.removeEventListener('resize',this.boundResize);
    const disposedGeometries=new Set<THREE.BufferGeometry>();
    const disposedMaterials=new Set<THREE.Material>();
    this.scene.traverse(obj=>{
      if(obj instanceof THREE.Mesh || obj instanceof THREE.Points){
        if(!disposedGeometries.has(obj.geometry)){obj.geometry.dispose();disposedGeometries.add(obj.geometry)}
        const list=Array.isArray(obj.material)?obj.material:[obj.material];
        list.forEach(m=>{if(disposedMaterials.has(m))return;disposedMaterials.add(m);
          for(const key of ['map','normalMap','roughnessMap','metalnessMap','aoMap','emissiveMap'] as const){
            const t=(m as THREE.MeshStandardMaterial)[key];if(t)t.dispose();
          }
          m.dispose();
        });
      }
    });
    this.renderer.dispose();
  }
}
