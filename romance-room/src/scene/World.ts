import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { AnimationMixer } from 'three';
import type { Stage } from '../game/logic';

type Interactive = 'desk'|'clock'|'gramophone'|'painting'|'letter'|'cabinet'|'books'|'gardenGate'|'lantern0'|'lantern1'|'lantern2'|'present';
type Callbacks = {onInteract:(what:Interactive, sub?:string)=>void; onMove?:(x:number,z:number)=>void};
const gold = 0xb69a66;
const palette=[0x2d3948,0x6d3a39,0x766146,0x3c514b,0x5c405c];
const mat=(color:number,roughness=.68,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const brass=mat(0xb59a65,.23,.79), black=mat(0x17191b,.42,.35), ivory=mat(0xdfcba7,.66,.02);
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
  private gate?:THREE.Group;
  private slidingShelf?:THREE.Group;
  private clockHands?:THREE.Group;
  private painting?:THREE.Group;
  private clockTime=0;
  private lanternMeshes:THREE.Mesh[]=[];
  private petals?:THREE.Points;
  private mixers:AnimationMixer[]=[];
  private glowLights:THREE.Light[]=[];
  private storm=0;
  private rushEnabled=false;
  private romantic=false;
  private speed=2.6;
  private materials:THREE.Material[]=[];
  private disposed=false;
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
    this.renderer.toneMappingExposure=1.28;
    this.renderer.shadowMap.enabled=true;
    this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,this.mobile?1.35:1.65));
    this.scene.background=new THREE.Color(0x151216);
    this.scene.fog=new THREE.FogExp2(0x21191b,.027);
    this.camera.position.set(0,1.63,5.5);
    this.setupLight(); this.createStudy(); this.createGarden(); this.placeAssets();
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
    this.scene.add(new THREE.HemisphereLight(0xc5d8ff,0x27170d,1.25));
    const moon=new THREE.DirectionalLight(0x95b5d5,.58);moon.position.set(-4,9,-8);moon.castShadow=true;
    moon.shadow.mapSize.set(this.mobile?512:1024,this.mobile?512:1024);
    moon.shadow.camera.left=-17;moon.shadow.camera.right=17;moon.shadow.camera.top=17;moon.shadow.camera.bottom=-17;moon.shadow.bias=-.0005; this.scene.add(moon);
    const lamp=(x:number,y:number,z:number,power:number,color=0xffc477,distance=9)=>{
      const light=new THREE.PointLight(color,power,distance,2);light.position.set(x,y,z);this.scene.add(light);this.glowLights.push(light);return light;
    };
    lamp(-3.4,3.4,1.0,35); lamp(3.8,3.4,-2.2,27);lamp(0,3.3,-5.2,16);lamp(-2.7,3.2,-3.8,20);lamp(0,3,-11,21,0xffd3a0,11);
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
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=768;
    const ctx=canvas.getContext('2d')!;
    ctx.fillStyle='#33221d';ctx.fillRect(0,0,768,768);
    for(let row=0;row<22;row++){
      const y=row*35;const shift=(row%2)*105;
      for(let col=-1;col<7;col++){
        let xx=col*138-shift;
        const bright=(seedRand()-.5)*26;let c=Math.round(60+bright);ctx.fillStyle=`rgb(${c},${Math.round(c*.65)},${Math.round(c*.46)})`;ctx.fillRect(xx+2,y+2,134,32);
        for(let a=0;a<4;a++){ctx.strokeStyle=`rgba(13,8,7,${.08+seedRand()*.15})`;ctx.beginPath();ctx.moveTo(xx+10,y+8+a*6);ctx.bezierCurveTo(xx+55,y+6+a*8,xx+90,y+8+a*4,xx+124,y+9+a*6);ctx.stroke()}
      }
    }
    const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(w/8,d/8);tex.anisotropy=4;
    const material=new THREE.MeshStandardMaterial({map:tex,roughness:.7,metalness:.03});
    const floor=this.mesh(new THREE.PlaneGeometry(w,d),material,this.scene,[x,.015,z],false);
    floor.rotation.x=-Math.PI/2;
  }
  private wallPanel(x:number,z:number,rot:number,width:number){
    const group=new THREE.Group();group.position.set(x,0,z);group.rotation.y=rot;this.scene.add(group);
    this.block(group,width,5.0,.16,0,2.5,0,mat(0x292321,.98),0);
    this.block(group,width,.22,.16,0,.15,.14,mat(0x4a3426));
    this.block(group,width,.18,.16,0,4.45,.14,mat(0x514131));
    this.block(group,width,.08,.12,0,1.2,.15,brass);
    for(let j=0;j<Math.floor(width/2.2);j++){
      const cx=-width/2+1.15+j*2.15;
      this.block(group,1.83,2.7,.07,cx,2.76,.13,mat(0x3c3029,.91));
      this.block(group,1.91,.035,.10,cx,1.43,.23,brass);
      this.block(group,1.91,.035,.10,cx,4.08,.23,brass);
      this.block(group,.033,2.68,.10,cx-.96,2.75,.23,brass);
      this.block(group,.033,2.68,.10,cx+.96,2.75,.23,brass);
    }
  }
  private createStudy(){
    this.woodFloor(0,0,18,16);
    this.wallPanel(-9,0,Math.PI/2,16);this.wallPanel(9,0,-Math.PI/2,16);
    this.wallPanel(0,8,Math.PI,18);this.wallPanel(-5.4,-7,0,7.2);this.wallPanel(5.4,-7,0,7.2);
    this.block(this.scene,3.6,.72,.23,0,4.65,-7,mat(0x44332b));
    this.mesh(new THREE.PlaneGeometry(18,16),mat(0x261d19,.96),this.scene,[0,5.05,.5],false).rotation.x=Math.PI/2;
    // Wool rug with decorative woven border
    const rug=new THREE.Group();rug.position.set(0,.045,1);this.scene.add(rug);
    const rugMesh=this.mesh(new THREE.PlaneGeometry(6.5,7.4),mat(0x533c34,1),rug);rugMesh.rotation.x=-Math.PI/2;
    const border=this.mesh(new THREE.RingGeometry(2.5,2.65,6),mat(gold,.85),rug);border.rotation.x=-Math.PI/2; border.scale.set(1,1.2,1);
    for(let i=0;i<12;i++) this.block(this.scene,.035,.11,.14,-8.7+i*1.57,4.6,-6.78,brass);
    this.createWindow(-6.8,-6.75,2.6,2.7);
    this.createWindow(6.8,-6.75,2.6,2.7);
    this.createClock();this.createDesk();this.createGramophone();this.createPaintings();this.createBookshelf();this.createGate();
    this.createArmchair(-5,3);this.createArmchair(5,4);
    this.createChandelier();
    for(let i=0;i<10;i++) {
      const x=-8.5+seedRand()*17,z=-6.5+seedRand()*12;
      this.cylinder(this.scene,.12,.055,x,4.7,z,brass);
    }
  }
  private createWindow(x:number,z:number,w:number,h:number){
    this.block(this.scene,w+.2,h+.2,.18,x,2.67,z+.1,mat(0x5c4933,.55));
    this.block(this.scene,w,h,.04,x,2.67,z+.18,new THREE.MeshPhysicalMaterial({color:0x5f7290,roughness:.1,metalness:.25,transparent:true,opacity:.31}));
    this.block(this.scene,.08,h,.14,x,2.67,z+.26,brass);
    this.block(this.scene,w,.08,.14,x,2.67,z+.26,brass);
    for(let i=0;i<7;i++) {
      const rain=this.mesh(new THREE.BoxGeometry(.006,.25,.004),new THREE.MeshBasicMaterial({color:0xb4c3d4,transparent:true,opacity:.27}),this.scene,[x-w/2+seedRand()*w,1.45+seedRand()*2.5,z+.16],false);
      rain.rotation.z=.12;
    }
    // Curtains are three-dimensional folded geometry, not flat wallpaper.
    for(const side of [-1,1]){
      const cloth=new THREE.Group();cloth.position.set(x+side*(w/2+.13),2.85,z+.36);this.scene.add(cloth);
      for(let n=0;n<4;n++){const fold=this.block(cloth,.15,2.5,.13,-side*n*.06,0,n*.04,mat(0x745444,.97));fold.rotation.z=side*(.015*n)}
      this.cylinder(cloth,.13,.19,0,-.18,.11,brass);
    }
  }
  private createClock(){
    const g=new THREE.Group();g.position.set(-4.45,2.45,-6.64);this.scene.add(g);
    const housing=mat(0x6c4529,.5);this.block(g,1.55,2.3,.35,0,0,-.04,housing,.18);
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
    const wood=mat(0x70462d,.56);
    this.block(g,3.0,.14,1.5,0,1.05,0,wood,.10);
    this.block(g,2.85,.34,1.36,0,.82,0,mat(0x452d23));
    for(const x of [-1.35,1.35])for(const z of [-.56,.56])this.block(g,.2,1.01,.22,x,.5,z,wood,.05);
    for(const x of [-.82,0,.82]){
      this.block(g,.73,.22,.035,x,.78,.715,mat(0x583725));
      this.cylinder(g,.045,.03,x,.77,.747,brass).rotation.x=Math.PI/2;
    }
    this.block(g,1.02,.05,.7,-.48,1.18,-.22,mat(0x958367)); // page
    const txt=this.createText('9:15  •  el instante en que todo comienza',512,64,'#69513c','#e7d7b4');
    const sign=this.mesh(new THREE.PlaneGeometry(1.12,.17),new THREE.MeshBasicMaterial({map:txt,transparent:true}),g,[-.48,1.216,-.22],false);sign.rotation.x=-Math.PI/2;
    this.block(g,.55,.07,.38,.8,1.18,-.24,mat(0x1e3e50)); // diary
    this.cylinder(g,.05,.15,1.16,1.24,.15,brass);this.cylinder(g,.075,.12,1.16,1.4,.15,ivory);
    this.hotspot(g,'desk',-.25,1.2,.0,2.9,.7,1.5);
    this.hotspot(g,'cabinet',0,.78,.86,2.8,.34,.25);
    const key=new THREE.Group();key.position.set(-1.22,1.17,.38);g.add(key);this.keyMesh=key;
    this.torus(key,.08,.023,0,0,0,brass);this.block(key,.024,.2,.02,0,-.11,0,brass);
  }
  private createGramophone(){
    const g=new THREE.Group();g.position.set(3.85,1.35,-1.85);this.scene.add(g);
    const pedestal=mat(0x6b452d,.51);
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
      const tex=this.createText(`${name}     ${digit}`,410,112,'#e2d5b8','#26323d');
      this.mesh(new THREE.PlaneGeometry(1.46,.41),new THREE.MeshBasicMaterial({map:tex,transparent:true}),g,[0,0,.16],false);
      this.hotspot(g,'painting',0,0,.24,1.9,1.3,.25,name);
      if(i===1) this.painting=g;
    });
  }
  private createBookshelf(){
    const g=new THREE.Group();g.position.set(7.66,0,-3.8);g.rotation.y=-Math.PI/2;this.scene.add(g);
    this.slidingShelf=g;
    const wood=mat(0x69472d,.58);
    this.block(g,4.7,4.45,.62,0,2.23,0,wood,.07);
    this.block(g,4.36,4.1,.68,0,2.27,.27,mat(0x281c18),.02);
    for(const row of [0.8,1.78,2.78,3.8]){
      this.block(g,4.5,.14,.75,0,row,.34,wood,.03);
      for(let j=0;j<27;j++){
        const w=.07+seedRand()*.07;
        const h=.53+seedRand()*.26;
        const c=palette[Math.floor(seedRand()*palette.length)];
        const book=this.block(g,w,h,.33,-2.07+j*.16,row+.085+h/2,.35,mat(c,.77),.004);
        book.rotation.z=(seedRand()-.5)*.08;
        if(j%6===0)this.block(g,.017,h*.75,.34,book.position.x,row+.085+h/2,.35,brass,0);
      }
    }
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
    this.block(leaf,3.5,4.52,.21,0,2.26,-.04,mat(0x654a31),.13);
    this.block(leaf,3.14,4.22,.08,0,2.25,.04,new THREE.MeshPhysicalMaterial({color:0x6e7e84,roughness:.24,metalness:.31,transparent:true,opacity:.44}));
    for(const x of [-.86,0,.86])this.block(leaf,.043,4.2,.15,x,2.25,.16,brass);
    this.block(leaf,3.3,.042,.15,0,2.4,.16,brass);
    this.cylinder(leaf,.07,.11,.72,1.35,.19,brass).rotation.x=Math.PI/2;
    this.hotspot(leaf,'gardenGate',0,2,.32,3.4,4.5,.35);
    // Gate starts visually closed until the secret bookshelf resolves.
  }
  private createArmchair(x:number,z:number){
    const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=(x<0?.7:-.8);this.scene.add(g);
    const cloth=mat(0x5e463b,.94),wood=mat(0x42291f,.63);
    this.block(g,1.22,.3,1.0,0,.62,0,cloth,.12);
    this.block(g,1.18,1.13,.25,0,1.35,-.47,cloth,.14).rotation.x=-.12;
    for(const s of [-1,1]){
      this.block(g,.21,.54,.97,s*.64,.84,0,wood,.07);
      this.sphere(g,.17,s*.64,1.08,.3,cloth);
      for(const zz of [-.35,.38])this.cylinder(g,.07,.45,s*.55,.25,zz,wood);
    }
  }
  private createChandelier(){
    const g=new THREE.Group();g.position.set(0,3.95,-.1);this.scene.add(g);
    this.cylinder(g,.065,.85,0,.42,0,brass,18);
    this.cylinder(g,.45,.16,0,0,0,brass);
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4;
      const x=Math.cos(a)*.86,z=Math.sin(a)*.86;
      const stem=this.block(g,.044,.08,.85,x*.47,0,z*.45,brass);stem.rotation.y=a+Math.PI/2;
      this.cylinder(g,.16,.075,x,.11,z,brass);
      this.sphere(g,.09,x,.3,z,mat(0xffdf9e,.32));
    }
  }
  private createGarden(){
    this.woodFloor(0,-12.4,16,13);
    const soil=mat(0x303a2e,.94);const leaf=mat(0x365c47,.85);
    const walkway=this.mesh(new THREE.PlaneGeometry(3.5,10),mat(0x6b6b66,.91),this.scene,[0,.04,-11.2],false);walkway.rotation.x=-Math.PI/2;
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
    const dummy=new THREE.Object3D();
    for(let i=0;i<230;i++){
      const x=(seedRand()-.5)*13.5,z=-7.4-seedRand()*9.4;
      dummy.position.set(x,.32,z);dummy.scale.setScalar(.7+seedRand()*.5);dummy.updateMatrix();stems.setMatrixAt(i,dummy.matrix);
      dummy.position.y=.67;dummy.scale.setScalar(.65+seedRand()*.8);dummy.updateMatrix();flowers.setMatrixAt(i,dummy.matrix);
      flowers.setColorAt(i,new THREE.Color([0xe8acc8,0xffd4d2,0xe6bf8a,0xd5c4ff][i%4]));
    }
    stems.castShadow=false;flowers.castShadow=false;this.scene.add(stems,flowers);
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
      const led=this.sphere(this.scene,.065,x,4.55+(seedRand()-.5)*.35,z,mat(0xffd89a,.3,.05));led.material=new THREE.MeshBasicMaterial({color:0xffdba0});
    }
    for(let i=0;i<3;i++) this.createLantern(i,[-2.3,0,2.3][i],-13.3);
    this.createPetals();
  }
  private createDinnerTable(){
    const g=new THREE.Group();g.position.set(0,0,-15.2);this.scene.add(g);
    const cloth=mat(0xf3e4cb,.91);
    this.cylinder(g,.87,.16,0,1.07,0,cloth,42);
    this.cylinder(g,.10,1.03,0,.55,0,brass,16);
    this.cylinder(g,.57,.09,0,.045,0,brass,30);
    for(const side of [-1,1]) {
      const chair=new THREE.Group();chair.position.set(side*1.7,0,0);chair.rotation.y=side*Math.PI/2;g.add(chair);
      this.block(chair,.8,.13,.7,0,.65,0,mat(0x6b3e36),.10);
      this.block(chair,.8,.88,.14,0,1.07,-.3,mat(0x744a40),.08);
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
    if(stage===5){this.romantic=true;this.rushEnabled=false;this.storm=0;this.renderer.toneMappingExposure=1.38;if(this.petals)(this.petals.material as THREE.PointsMaterial).opacity=.87;}
  }
  setKeyFound(found:boolean){if(this.keyMesh)this.keyMesh.visible=!found;}
  setLanterns(values:number[]){
    this.lanternMeshes.forEach((m,i)=>{
      const lit=values.includes(i);
      (m.material as THREE.MeshStandardMaterial).emissive=new THREE.Color(lit?0xffcc85:0x000000);
      (m.material as THREE.MeshStandardMaterial).emissiveIntensity=lit?1.8:0;
    });
  }
  setRushIntensity(t:number){this.storm=t;if(this.stage===4&&this.gate)this.gate.rotation.y=-Math.PI*.52+Math.PI*.47*t;}
  private openGate(){if(this.gate)this.gate.rotation.y=-Math.PI*.52;if(this.slidingShelf)this.slidingShelf.position.z=-4.1;}
  enableMovement(value:boolean){this.canWalk=value;}
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
    if(this.mobile && p.downX<this.canvas.clientWidth*.43){
      this.joystick.x=THREE.MathUtils.clamp((p.x-p.downX)/55,-1,1);
      this.joystick.y=THREE.MathUtils.clamp((p.y-p.downY)/55,-1,1);
    } else {
      this.yaw-=dx*.0042;this.pitch=THREE.MathUtils.clamp(this.pitch-dy*.0031,-1.15,1.15);
    }
  }
  private onPointerUp(e:PointerEvent){
    const p=this.pointers.get(e.pointerId);this.pointers.delete(e.pointerId);
    if(this.pointers.size<2)this.pinchDistance=0;
    if(p){if(!p.moved && this.pointers.size===0)this.handleTap(e.clientX,e.clientY);if(p.downX<this.canvas.clientWidth*.43)this.joystick={x:0,y:0}}
  }
  private handleTap(x:number,y:number){
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
      xx=THREE.MathUtils.clamp(xx,-7.6,7.6);
      zz=THREE.MathUtils.clamp(zz,this.stage>=4?-16.35:-5.65,6.55);
      // Prevent walking around either side of the locked central gate.
      if(this.stage<4&&zz<-5.2&&Math.abs(xx)<1.9)zz=-5.2;
      this.camera.position.set(xx,1.63,zz);this.handlers.onMove?.(xx,zz);
    }
    this.camera.rotation.order='YXZ';this.camera.rotation.y=this.yaw;this.camera.rotation.x=this.pitch;
    if(this.clockHands){this.clockTime+=dt;this.clockHands.rotation.z=-Math.sin(this.clockTime*1.5)*.025;}
    if(this.painting&&this.stage>=2)this.painting.position.y=3.34;
    if(this.petals){this.petals.rotation.y+=dt*.025;
      const pts=this.petals.geometry.attributes.position as THREE.BufferAttribute;
      for(let i=0;i<pts.count;i++){
        let y=pts.getY(i)-dt*(this.romantic?.3:this.rushEnabled?.14:0);
        if(y<.1)y=5.4;pts.setY(i,y);
      }
      pts.needsUpdate=this.romantic;
    }
    if(this.rushEnabled){
      const wave=Math.sin(this.clockTime*7)*.13*this.storm;
      this.glowLights.forEach((l,i)=>{if(i<4)(l as THREE.PointLight).intensity=25*(1-this.storm*.5)+wave*14});
    }
    this.mixers.forEach(m=>m.update(dt));
    this.renderer.render(this.scene,this.camera);
    this.raf=requestAnimationFrame(this.render);
  };
  getPosition(){return this.camera.position.clone();}
  dispose(){
    this.disposed=true;cancelAnimationFrame(this.raf);
    this.canvas.removeEventListener('pointerdown',this.boundPointerDown);this.canvas.removeEventListener('pointermove',this.boundPointerMove);
    this.canvas.removeEventListener('pointerup',this.boundPointerUp);this.canvas.removeEventListener('pointercancel',this.boundPointerUp);this.canvas.removeEventListener('wheel',this.boundWheel);
    window.removeEventListener('keydown',this.boundKeyDown);window.removeEventListener('keyup',this.boundKeyUp);window.removeEventListener('resize',this.boundResize);
    this.scene.traverse(obj=>{if(obj instanceof THREE.Mesh || obj instanceof THREE.Points){obj.geometry.dispose();if(Array.isArray(obj.material))obj.material.forEach(m=>m.dispose());else obj.material.dispose()}});
    this.renderer.dispose();
  }
}
