import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export type TheaterAction = "butaca" | "ambar" | "azul" | "rojo" | "proyector" | "telon" | "programa";
export type TheaterPhase = "inicio" | "luces" | "proyector" | "telon" | "final";
type SoundEvent = "pasos" | "apagón" | "susurro" | "aplausos";
export interface WorldEvents { onFocus:(target:TheaterAction|null)=>void; onAction:(target:TheaterAction)=>void; onEvent:(event:SoundEvent)=>void; onListener:(x:number,y:number,z:number,fx:number,fy:number,fz:number)=>void; }

type Collider={x:number;z:number;rx:number;rz:number};
const golden=0xc8a56a, velvet=0x651f29;
const mat=(color:number,roughness=.78,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const wood=mat(0x39261f,.73), darkWood=mat(0x241b1c,.68), brass=mat(golden,.33,.8), fadedGold=mat(0x8b704a,.44,.62);
const redVelvet=mat(velvet,.98), black=mat(0x151318,.94), cream=mat(0xd3bd92,.94);
function addMesh(g:THREE.BufferGeometry,m:THREE.Material,p:THREE.Vector3Tuple,parent:THREE.Object3D,shadow=false){
  const o=new THREE.Mesh(g,m);o.position.set(...p);o.castShadow=shadow;o.receiveShadow=shadow;parent.add(o);return o;
}
function labelTexture(lines:string[],foreground="#dfc59a",bg="#25171c",width=768,height=512){
  const c=document.createElement("canvas");c.width=width;c.height=height;const ctx=c.getContext("2d")!;
  ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);ctx.strokeStyle="#b7925a";ctx.lineWidth=9;ctx.strokeRect(23,23,width-46,height-46);
  ctx.strokeStyle="rgba(233,194,121,.35)";ctx.lineWidth=2;ctx.strokeRect(39,39,width-78,height-78);
  lines.forEach((str,i)=>{const y=height/(lines.length+1)*(i+1);ctx.fillStyle=foreground;ctx.textAlign="center";ctx.font=(i===0?"bold 47px Georgia":"34px Georgia");ctx.fillText(str,width/2,y,width-108);});
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}
function fabricTexture(){
  const c=document.createElement("canvas");c.width=256;c.height=256;const q=c.getContext("2d")!;
  q.fillStyle="#63303a";q.fillRect(0,0,256,256);
  let seed=47;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967295;};
  for(let i=0;i<4200;i++){const x=rand()*256,y=rand()*256;q.fillStyle=rand()>.5?"rgba(248,206,187,.055)":"rgba(0,0,0,.09)";q.fillRect(x,y,1+rand()*3,1+rand()*3);}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(5,5);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function arch(parent:THREE.Group,x:number,z:number,y:number,w:number,h:number){
  const points:THREE.Vector3[]=[];
  for(let i=0;i<=36;i++){const a=Math.PI*i/36;points.push(new THREE.Vector3(x+Math.cos(a)*w/2,y+Math.sin(a)*h,z));}
  const line=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),48,.084,6,false),fadedGold);
  parent.add(line);
}
export class TheaterWorld{
  readonly scene=new THREE.Scene();
  readonly camera=new THREE.PerspectiveCamera(72,1,.06,90);
  readonly renderer:THREE.WebGLRenderer;
  readonly canvas:HTMLCanvasElement;
  private clock=new THREE.Clock();private frame=0;
  private yaw=0;private pitch=-.07;
  private move={x:0,y:0};private keys=new Set<string>();private colliders:Collider[]=[];
  private ray=new THREE.Raycaster();private targets:THREE.Object3D[]=[];
  private actionTarget:TheaterAction|null=null;
  private dragId:number|null=null;private pointerX=0;private pointerY=0;
  private active=false;private ended=false;private elapsed=0;private eventDone=false;
  private cleanupFns:Array<()=>void>=[];
  private usher=new THREE.Group();private usherMixer?:THREE.AnimationMixer;
  private curtainLeft?:THREE.Mesh;private curtainRight?:THREE.Mesh;
  private curtainProgress=0;private lamps:THREE.PointLight[]=[];
  private scenery=new THREE.Group();private chandelierPlaceholder?:THREE.Group;private lightsDone=false;
  private projectorReel?:THREE.Group;private specialSeat?:THREE.Group;private seatKey?:THREE.Group;
  private projectorScreen?:THREE.Mesh;
  private phase:TheaterPhase="inicio";private clockTime=0;
  private usherGoal=new THREE.Vector3(5.8,0,-12.3);
  private decorMixers:THREE.AnimationMixer[]=[];
  private watchers:THREE.Group[]=[];
  private dust?:THREE.Points;
  private frameTimeAccumulator=0;private frameTimeSamples=0;private nextScareAt=24;private lastWalkerSfx=0;
  private forwardScratch=new THREE.Vector3();
  private emitterLights:THREE.MeshStandardMaterial[]=[];
  readonly events:WorldEvents;
  constructor(mount:HTMLElement,events:WorldEvents){
    this.events=events;
    const cv=document.createElement("canvas");cv.className="three-canvas";this.canvas=cv;mount.append(cv);
    this.renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:false,powerPreference:"high-performance"});
    if(!(this.renderer.capabilities as any).isWebGL2){throw new Error("Este dispositivo no es compatible con WebGL2.");}
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,matchMedia("(pointer:coarse)").matches?1.35:1.8));
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.32;
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.scene.background=new THREE.Color(0x100c12);this.scene.fog=new THREE.FogExp2(0x140f12,.022);
    this.camera.rotation.order="YXZ";this.camera.position.set(0,1.64,13.1);
    this.scene.add(this.scenery);
    this.construct();
    this.setupControls();
    this.resize();window.addEventListener("resize",this.resize);
    this.frame=requestAnimationFrame(this.animate);
  }
  start(){this.active=true;this.clock.getDelta();}
  stop(){this.active=false;}
  setPhase(p:TheaterPhase){
    this.phase=p;
    if(p==="luces"){this.usherGoal.set(-5.9,0,-11.7);this.events.onEvent("pasos");}
    if(p==="proyector"){
      this.lightsDone=true;this.setScreen("3  ·  1  ·  7");
      this.usherGoal.set(6.7,0,-9.9);this.events.onEvent("susurro");
      this.watchers.forEach(w=>w.visible=true);
    }
    if(p==="telon"){
      this.projectorReel?.rotateZ(.2);this.usherGoal.set(-6.6,0,-11.8);
      this.events.onEvent("pasos");
    }
    if(p==="final"){
      this.ended=true;this.events.onEvent("aplausos");
      this.scene.background=new THREE.Color(0x25131d);
      if(this.lamps[1])this.lamps[1].intensity=25;
    }
  }
  setMove(x:number,y:number){this.move={x,y};}
  activate(){if(this.actionTarget){this.events.onAction(this.actionTarget);return;}const closest=this.closestObject();if(closest)this.events.onAction(closest);}
  markLight(index:number){if(this.emitterLights[index])this.emitterLights[index].emissiveIntensity=1.9;}
  resetLights(){this.emitterLights.forEach(m=>m.emissiveIntensity=.16);}
  collectKey(){if(this.seatKey){this.seatKey.visible=false;this.seatKey=undefined;}}
  setRevealText(name:string,event:string){
    const target=this.projectorScreen;if(!target)return;
    const material=target.material as THREE.MeshBasicMaterial;
    material.map?.dispose();
    material.map=labelTexture(["ESTA FUNCIÓN ES PARA",name.toLocaleUpperCase("es-AR").slice(0,35),
      event.toLocaleUpperCase("es-AR").slice(0,40)],"#fff0d0","#3b2027");
    material.needsUpdate=true;
  }
  openCurtain(){this.curtainProgress=.0001;if(this.phase!=="final")this.setPhase("final");}
  private construct(){
    const s=this.scene;
    s.add(new THREE.HemisphereLight(0xb7b5c1,0x372025,1.55));
    const fill=new THREE.DirectionalLight(0xffdbad,1.1);fill.position.set(3,11,5);fill.castShadow=true;fill.shadow.mapSize.set(1024,1024);
    fill.shadow.camera.left=-13;fill.shadow.camera.right=13;fill.shadow.camera.top=17;fill.shadow.camera.bottom=-17;fill.shadow.bias=-.0009;s.add(fill);
    const warm=new THREE.PointLight(0xffad64,26,26,1.9);warm.position.set(0,7,3);s.add(warm);this.lamps.push(warm);
    const stageLight=new THREE.SpotLight(0xffd6a0,110,29,Math.PI/5,.6,1.6);stageLight.position.set(0,8.5,-9);stageLight.target.position.set(0,1,-17);s.add(stageLight,stageLight.target);
    const stageBlue=new THREE.PointLight(0x5874bf,22,16,2);stageBlue.position.set(-6,5,-17);s.add(stageBlue);
    this.buildStructure();this.buildSeats();this.buildPanels();this.buildStage();this.buildUsher();
    this.buildAtmosphere();
    void this.loadDecorManifest();
    const premium=(import.meta as any).env?.VITE_USHER_GLB;
    if(typeof premium==="string" && premium)this.useUsherGLB(premium);
  }
  private buildAtmosphere(){
    // Suspended auditorium dust; one Points draw call instead of hundreds of objects.
    const positions=new Float32Array(300*3);let seed=1968;
    for(let i=0;i<300;i++){
      seed=(seed*1664525+1013904223)>>>0;positions[i*3]=((seed%20000)/10000-1)*8.6;
      seed=(seed*1664525+1013904223)>>>0;positions[i*3+1]=1.7+(seed%6500)/1000;
      seed=(seed*1664525+1013904223)>>>0;positions[i*3+2]=-15+(seed%30000)/1000;
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.BufferAttribute(positions,3));
    const dust=new THREE.Points(geo,new THREE.PointsMaterial({color:0xe9c9a0,size:.032,transparent:true,opacity:.48,depthWrite:false}));
    this.scenery.add(dust);this.dust=dust;
    // Spectators at a safe distance: visible only when the old film starts.
    const silhouetteMaterial=mat(0x131117,1);
    for(const x of [-6.5,6.5]){
      const watcher=new THREE.Group();watcher.position.set(x,5.5,-4);watcher.visible=false;
      addMesh(new THREE.SphereGeometry(.21,12,9),silhouetteMaterial,[0,.9,0],watcher);
      addMesh(new THREE.CylinderGeometry(.23,.35,.96,12),silhouetteMaterial,[0,.13,0],watcher);
      this.scenery.add(watcher);this.watchers.push(watcher);
    }
    // Theater footlights, all emissive with no additional dynamic shadow-casting lights.
    const glass=new THREE.MeshStandardMaterial({color:0xf3ca8d,emissive:0xffa357,emissiveIntensity:1.25,roughness:.32});
    const bulbs=new THREE.InstancedMesh(new THREE.SphereGeometry(.1,8,7),glass,18);const obj=new THREE.Object3D();
    for(let i=0;i<18;i++){obj.position.set(-7.65+i*.9,.39,-12.42);obj.updateMatrix();bulbs.setMatrixAt(i,obj.matrix);}
    bulbs.instanceMatrix.needsUpdate=true;this.scenery.add(bulbs);
    // Paintings in gilded frames to break up uniform walls and provide atmosphere.
    for(const side of [-1,1])for(const z of [-7,3,10]){
      const artwork=this.textPlane(["BELLADONNA","GRAN ESTRENO","17 · X · 1968"],1.28,2.0);
      artwork.position.set(side*8.93,3.55,z);artwork.rotation.y=side===1?-Math.PI/2:Math.PI/2;
      this.scenery.add(artwork);
    }
  }
  private buildStructure(){
    const room=this.scenery;
    const floor=mat(0x3c2a22,.76);const stageFloor=mat(0x4b3129,.82);const wall=mat(0x241b20,.97);
    addMesh(new THREE.BoxGeometry(19,.26,37),floor,[0,-.17,-2.2],room,true);
    addMesh(new THREE.BoxGeometry(19,.45,8),stageFloor,[0,.03,-17],room,true);
    addMesh(new THREE.BoxGeometry(19,.4,37),wall,[0,9,-2],room);
    [-9.25,9.25].forEach(x=>{
      addMesh(new THREE.BoxGeometry(.38,9,37),wall,[x,4.5,-2.2],room);
      addMesh(new THREE.BoxGeometry(.24,.3,37),fadedGold,[x-Math.sign(x)*.19,2,-2.2],room);
      addMesh(new THREE.BoxGeometry(.26,.24,37),fadedGold,[x-Math.sign(x)*.17,6.8,-2.2],room);
      addMesh(new THREE.BoxGeometry(2.5,.36,22),wood,[x-Math.sign(x)*1.5,5.2,-.6],room);
      addMesh(new THREE.BoxGeometry(.22,.85,22),brass,[x-Math.sign(x)*2.75,5.65,-.6],room);
      [-8,-3,2,7].forEach(z=>{
        addMesh(new THREE.CylinderGeometry(.27,.3,5,12),mat(0x5a4140,.85),[x-Math.sign(x)*.52,3.5,z],room);
        addMesh(new THREE.CylinderGeometry(.38,.36,.23,12),fadedGold,[x-Math.sign(x)*.52,6.1,z],room);
        addMesh(new THREE.BoxGeometry(.3,1,1.2),fadedGold,[x-Math.sign(x)*.19,3.9,z],room);
      });
    });
    [-20.4,16.1].forEach(z=>addMesh(new THREE.BoxGeometry(19,9,.38),wall,[0,4.5,z],room));
    for(let j=0;j<8;j++){
      const z=11-j*4.3;
      arch(room,0,z,6.4,17,1.6);
      addMesh(new THREE.BoxGeometry(18,.11,.18),fadedGold,[0,8.85,z],room);
    }
    // Wood floor strips: low-cost batched meshes.
    const strips=new THREE.InstancedMesh(new THREE.BoxGeometry(.1,.012,37),mat(0x735041,.86),32);
    const d=new THREE.Object3D();
    for(let i=0;i<32;i++){d.position.set(-8.7+i*.55,-.035,-2);d.scale.set(.8,1,1);d.updateMatrix();strips.setMatrixAt(i,d.matrix);}
    strips.instanceMatrix.needsUpdate=true;room.add(strips);
    // Aisle runners and gold patterned edges.
    addMesh(new THREE.BoxGeometry(2.1,.035,21),mat(0x44232b,.93),[0,.007,.55],room);
    for(const x of [-1.1,1.1])addMesh(new THREE.BoxGeometry(.055,.045,21),fadedGold,[x,.03,.55],room);
    // Balcony rails, gilded finials.
    for(const x of [-6.7,6.7])for(let z=-8;z<10;z+=1.6){
      addMesh(new THREE.CylinderGeometry(.08,.1,.56,8),brass,[x,5.85,z],room);
      addMesh(new THREE.SphereGeometry(.13,9,7),brass,[x,6.18,z],room);
    }
    for(const x of [-8.5,8.5])for(const z of [-9,-1,7,13]){
      addMesh(new THREE.CylinderGeometry(.12,.12,.62,10),brass,[x,3.35,z],room);
      addMesh(new THREE.SphereGeometry(.26,12,9),new THREE.MeshStandardMaterial({color:0xffdfa7,emissive:0xffaf58,emissiveIntensity:1.1}),[x,3.7,z],room);
    }
    // Decorative geometry stays as fallback until a professional GLB/glTF is loaded.
    const placeholder=new THREE.Group();room.add(placeholder);this.chandelierPlaceholder=placeholder;
    addMesh(new THREE.CylinderGeometry(.04,.04,2.3,8),brass,[0,7.65,6.2],placeholder);
    addMesh(new THREE.TorusGeometry(1.25,.085,8,28),brass,[0,6.25,6.2],placeholder).rotation.x=Math.PI/2;
    for(let i=0;i<10;i++){const a=Math.PI*2*i/10;
      addMesh(new THREE.SphereGeometry(.17,10,8),new THREE.MeshStandardMaterial({color:0xffe3ab,emissive:0xffb363,emissiveIntensity:1.15}),[Math.cos(a)*1.25,6.25,6.2+Math.sin(a)*1.25],placeholder);
    }
    // Lobby sign and player instruction.
    const sign=this.textPlane(["TEATRO BELLADONNA","ÚLTIMA FUNCIÓN","EST. 1968"],3.9,2.3);
    sign.position.set(0,3.5,15.83);sign.rotation.y=Math.PI;room.add(sign);
    const ticket=this.textPlane(["ENTRADA RESERVADA","FILA 3  •  ASIENTO 8","NO PIERDA SU BOLETO"],2.25,1.55);
    ticket.position.set(-8.95,2.1,12);ticket.rotation.y=Math.PI/2;room.add(ticket);this.bind(ticket,"programa");
    this.colliders.push({x:-8.95,z:12,rx:.28,rz:.9});
  }
  private textPlane(lines:string[],w:number,h:number){
    const texture=labelTexture(lines);const plane=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));
    const frame=new THREE.Group();frame.add(plane);
    addMesh(new THREE.BoxGeometry(w+.13,h+.13,.12),fadedGold,[0,0,-.09],frame);
    plane.position.z=.015;return frame;
  }
  private bind(o:THREE.Object3D,action:TheaterAction){o.userData.action=action;this.targets.push(o);}
  private buildSeats(){
    const frame=mat(0x483129,.72),fabric=new THREE.MeshStandardMaterial({map:fabricTexture(),color:0xffffff,roughness:.99});
    const items=[
      {geo:new THREE.BoxGeometry(.75,.15,.68),m:frame,p:[0,.51,0]},
      {geo:new THREE.BoxGeometry(.69,.19,.64),m:fabric,p:[0,.63,-.03]},
      {geo:new THREE.BoxGeometry(.75,1.1,.2),m:frame,p:[0,1.13,.28]},
      {geo:new THREE.BoxGeometry(.64,.82,.12),m:fabric,p:[0,1.13,.40]},
      {geo:new THREE.BoxGeometry(.12,.09,.89),m:fadedGold,p:[-.42,.93,0]},
      {geo:new THREE.BoxGeometry(.12,.09,.89),m:fadedGold,p:[.42,.93,0]},
      {geo:new THREE.CylinderGeometry(.055,.075,.52,7),m:frame,p:[-.36,.25,-.3]},
      {geo:new THREE.CylinderGeometry(.055,.075,.52,7),m:frame,p:[.36,.25,-.3]},
    ];
    const positions:THREE.Vector3Tuple[]=[];
    let selected:THREE.Vector3Tuple=[3.6,0,3];
    const xs=[-6.3,-5.4,-4.5,-3.6,-2.7,2.7,3.6,4.5,5.4,6.3];
    for(let row=0;row<8;row++){const z=7-row*2;
      for(let col=0;col<10;col++){const x=xs[col];if(row===2&&col===7){selected=[x,0,z];continue;}positions.push([x,0,z]);this.colliders.push({x,z,rx:.38,rz:.35});}
    }
    for(const part of items){
      const inst=new THREE.InstancedMesh(part.geo,part.m,positions.length);const d=new THREE.Object3D();
      positions.forEach((p,i)=>{d.position.set(p[0]+part.p[0],p[1]+part.p[1],p[2]+part.p[2]);d.updateMatrix();inst.setMatrixAt(i,d.matrix);});
      inst.instanceMatrix.needsUpdate=true;this.scenery.add(inst);
    }
    const special=new THREE.Group();special.position.set(...selected);
    items.forEach(part=>addMesh(part.geo,part.m,[part.p[0],part.p[1],part.p[2]],special));
    // Readable, physically attached brass plaque instead of a generic yellow rectangle.
    addMesh(new THREE.BoxGeometry(.82,.38,.065),brass,[0,1.53,.425],special);
    const numberPlate=new THREE.Mesh(new THREE.PlaneGeometry(.73,.29),new THREE.MeshBasicMaterial({
      map:labelTexture(["FILA 3","ASIENTO 8"],"#f8e9bf","#543b30"),side:THREE.DoubleSide
    }));
    numberPlate.position.set(0,1.53,.467);special.add(numberPlate);
    // The first puzzle's collectible actually exists in the world.
    const key=new THREE.Group();key.position.set(.13,.77,-.24);
    const shaft=addMesh(new THREE.CylinderGeometry(.035,.035,.45,12),brass,[.12,0,0],key);
    shaft.rotation.z=Math.PI/2;
    addMesh(new THREE.TorusGeometry(.13,.038,8,20),brass,[-.14,0,0],key);
    addMesh(new THREE.BoxGeometry(.05,.12,.06),brass,[.3,-.08,0],key);
    addMesh(new THREE.BoxGeometry(.05,.1,.06),brass,[.21,-.09,0],key);
    special.add(key);this.seatKey=key;
    const halo=new THREE.PointLight(0xf2b867,1.25,2.6);halo.position.set(0,1.7,.7);special.add(halo);
    this.scenery.add(special);this.bind(special,"butaca");this.specialSeat=special;
    this.colliders.push({x:selected[0],z:selected[2],rx:.38,rz:.36});
  }
  private buildPanels(){
    const pedestal=(x:number,z:number)=>{const g=new THREE.Group();g.position.set(x,0,z);
      addMesh(new THREE.CylinderGeometry(.69,.84,1.12,14),wood,[0,.56,0],g);
      addMesh(new THREE.CylinderGeometry(.77,.8,.12,14),brass,[0,1.17,0],g);
      this.scenery.add(g);return g;
    };
    const p=pedestal(-7.25,-9.7);
    const plaque=this.textPlane(["ILUMINACIÓN","ÁMBAR  •  AZUL  •  ROJO"],2.4,.92);
    plaque.position.set(0,2.15,-.3);p.add(plaque);
    (["ambar","azul","rojo"] as TheaterAction[]).forEach((name,i)=>{
      const hue=[0xffb65f,0x65a5ff,0xe5595c][i];
      const x=(i-1)*.46;const m=new THREE.MeshStandardMaterial({color:hue,metalness:.2,roughness:.3,emissive:hue,emissiveIntensity:.16});
      this.emitterLights.push(m);
      const button=addMesh(new THREE.CylinderGeometry(.18,.21,.22,16),m,[x,1.33,.02],p);
      this.bind(button,name);
      addMesh(new THREE.TorusGeometry(.215,.042,8,18),brass,[x,1.24,.02],p).rotation.x=Math.PI/2;
    });
    // Projector apparatus with two independent mechanical reels, prism lens and plinth.
    const pr=pedestal(7.2,-9.9);
    const body=addMesh(new THREE.BoxGeometry(.82,.55,.68),mat(0x33363b,.39,.7),[0,1.55,0],pr);body.rotation.y=.24;
    const reel=new THREE.Group();reel.position.set(0,1.99,.03);pr.add(reel);this.projectorReel=reel;
    for(const x of [-.26,.27]){
      addMesh(new THREE.TorusGeometry(.3,.062,9,24),fadedGold,[x,0,0],reel);
      addMesh(new THREE.CylinderGeometry(.09,.09,.13,12),brass,[x,0,0],reel).rotation.z=Math.PI/2;
      for(let j=0;j<5;j++){const a=j*Math.PI*2/5;
        const arm=addMesh(new THREE.BoxGeometry(.2,.034,.037),fadedGold,[x+Math.cos(a)*.12,Math.sin(a)*.12,0],reel);arm.rotation.z=a;
      }
    }
    const lens=addMesh(new THREE.CylinderGeometry(.23,.15,.52,16),mat(0x525660,.22,.8),[0,1.52,-.53],pr);lens.rotation.x=Math.PI/2;
    addMesh(new THREE.CylinderGeometry(.11,.13,.51,12),mat(0x191b29,.13,.65),[0,1.52,-.82],pr).rotation.x=Math.PI/2;
    const reflector=new THREE.SpotLight(0xc9d9ff,0,12,Math.PI/7,.6);reflector.position.set(7.2,1.65,-10.5);
    reflector.target.position.set(0,3,-17.7);this.scene.add(reflector,reflector.target);
    this.bind(pr,"proyector");
    const pl=this.textPlane(["ARCHIVO 03:17","INTRODUZCA EL CÓDIGO"],2.25,1.05);
    pl.position.set(0,2.9,.04);pr.add(pl);
  }
  private curtainGeometry(width:number,height:number){
    const verts:number[]=[];const uv:number[]=[];const ind:number[]=[];
    const nx=48,ny=16;
    for(let j=0;j<=ny;j++){for(let i=0;i<=nx;i++){
      const u=i/nx,v=j/ny;const pleat=Math.sin(u*Math.PI*20)*(.11+.08*v);
      verts.push((u-.5)*width, .5+(1-v)*height,pleat);
      uv.push(u,v);
    }}
    for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+(nx+1),d=c+1;ind.push(a,c,b,b,c,d);}
    const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(verts,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));g.setIndex(ind);g.computeVertexNormals();return g;
  }
  private buildStage(){
    const st=this.scenery;
    for(let i=0;i<4;i++)addMesh(new THREE.BoxGeometry(3.1,.13,.37),wood,[0,.085+i*.11,-12.2-i*.36],st);
    const front=addMesh(new THREE.BoxGeometry(18,.92,.22),fadedGold,[0,.1,-12.3],st);front.position.y=.16;
    const proscenium=mat(0x7d5a42,.48,.2);
    for(const x of [-6.9,6.9]){
      addMesh(new THREE.CylinderGeometry(.49,.53,8.2,18),proscenium,[x,4.4,-15.8],st);
      addMesh(new THREE.CylinderGeometry(.7,.7,.35,18),brass,[x,8.3,-15.8],st);
      addMesh(new THREE.CylinderGeometry(.62,.62,.32,18),brass,[x,.4,-15.8],st);
    }
    arch(st,0,-15.8,7.4,15.2,1.2);
    addMesh(new THREE.BoxGeometry(15,.43,.44),brass,[0,8.5,-15.8],st);
    const curtainMat=new THREE.MeshStandardMaterial({color:0x8b2432,roughness:1,metalness:0,side:THREE.DoubleSide,map:fabricTexture()});
    const left=new THREE.Mesh(this.curtainGeometry(6.7,7.2),curtainMat);
    const right=new THREE.Mesh(this.curtainGeometry(6.7,7.2),curtainMat);
    left.position.set(-3.35,.2,-16.08);right.position.set(3.35,.2,-16.08);
    st.add(left,right);this.curtainLeft=left;this.curtainRight=right;
    const beam=addMesh(new THREE.CylinderGeometry(.1,.1,12.8,16),brass,[0,7.95,-15.95],st);beam.rotation.z=Math.PI/2;
    for(let i=0;i<10;i++)addMesh(new THREE.SphereGeometry(.11,8,8),brass,[-5.7+i*1.28,8,-15.82],st);
    const screen=this.textPlane(["LA ÚLTIMA FUNCIÓN","EL DIRECTOR AGUARDA"],5.8,3.2);
    screen.position.set(0,3.6,-18.9);st.add(screen);this.projectorScreen=screen.children[0] as THREE.Mesh;
    const mechanism=new THREE.Group();mechanism.position.set(0,.48,-14.18);st.add(mechanism);
    addMesh(new THREE.CylinderGeometry(.66,.75,1.15,12),wood,[0,.58,0],mechanism);
    addMesh(new THREE.CylinderGeometry(.73,.73,.18,16),brass,[0,1.22,0],mechanism);
    const lever=addMesh(new THREE.CylinderGeometry(.055,.075,.83,9),brass,[0,1.64,0],mechanism);lever.rotation.z=.34;
    addMesh(new THREE.SphereGeometry(.18,16,12),redVelvet,[.14,2.04,0],mechanism);
    this.bind(mechanism,"telon");
    const inv=new THREE.PointLight(0xffd3a0,0,17);inv.position.set(0,5,-18.2);this.scene.add(inv);this.lamps.push(inv);
  }
  private setScreen(text:string){
    const target=this.projectorScreen;if(!target)return;
    const material=target.material as THREE.MeshBasicMaterial;material.map?.dispose();
    material.map=labelTexture(["ARCHIVO RECUPERADO",text,"LA CLAVE ESTÁ EN EL TIEMPO"],"#fff0c6","#241f23");material.needsUpdate=true;
  }
  private buildUsher(){
    const u=this.usher;u.position.set(5.8,0,-12.3);u.name="Acomodador";
    const jacket=mat(0x391923,.98),skin=mat(0xb8a6a0,.8),mask=mat(0xd8c9ad,.6),boots=mat(0x161417,.54);
    addMesh(new THREE.CylinderGeometry(.35,.34,1.03,16),jacket,[0,1.52,0],u);
    addMesh(new THREE.BoxGeometry(.55,.17,.31),fadedGold,[0,1.86,.19],u);
    addMesh(new THREE.SphereGeometry(.21,15,11),skin,[0,2.35,0],u);
    const head=new THREE.Group();head.name="Cabeza";head.position.set(0,2.35,0);u.add(head);
    addMesh(new THREE.SphereGeometry(.245,16,12),mask,[0,.02,-.035],head);
    for(const x of [-.085,.085])addMesh(new THREE.SphereGeometry(.041,8,8),boots,[x,.07,-.25],head);
    addMesh(new THREE.CylinderGeometry(.22,.23,.16,14),boots,[0,.31,0],head);
    const hatBrim=addMesh(new THREE.CylinderGeometry(.33,.35,.06,16),boots,[0,.28,0],head);hatBrim.rotation.x=.05;
    for(const x of [-.47,.47]){
      const sleeve=addMesh(new THREE.CylinderGeometry(.115,.105,.99,10),jacket,[x,1.52,0],u);sleeve.rotation.z=x<0?-.2:.2;
      addMesh(new THREE.SphereGeometry(.1,10,8),skin,[x*1.2,1.06,0],u);
      addMesh(new THREE.CylinderGeometry(.16,.135,.96,12),black,[x*.5,.57,0],u);
      addMesh(new THREE.BoxGeometry(.24,.14,.43),boots,[x*.5,.12,-.13],u);
    }
    const goldButtons=[1.24,1.46,1.68].map(y=>addMesh(new THREE.SphereGeometry(.055,9,7),brass,[0,y,-.341],u));
    void goldButtons;
    u.scale.set(1.03,1.03,1.03);this.scenery.add(u);
    const clip=new THREE.AnimationClip("Respiración incómoda",3,[
      new THREE.NumberKeyframeTrack("Cabeza.rotation[y]",[0,.8,1.7,2.3,3],[0,.06,.2,.03,0]),
      new THREE.NumberKeyframeTrack("Cabeza.rotation[x]",[0,1.2,2,3],[0,-.08,.07,0])
    ]);
    this.usherMixer=new THREE.AnimationMixer(u);this.usherMixer.clipAction(clip).play();
  }
  private async loadDecorManifest(){
    try{
      const response=await fetch("/models/manifest.json");
      if(!response.ok)return;
      const manifest=await response.json() as {assets?:Record<string,string>};
      if(manifest.assets?.chandelier){
        const decoration=await this.loadDecorGLTF(manifest.assets.chandelier,[0,6.1,6.2],1.85,0);
        if(decoration&&this.chandelierPlaceholder)this.chandelierPlaceholder.visible=false;
      }
      // Each room receives real PBR geometry, scaled to believable measurements.
      if(manifest.assets?.armchair){
        await Promise.all([
          this.loadDecorGLTF(manifest.assets.armchair,[-6.4,.61,11.7],1.18,.65),
          this.loadDecorGLTF(manifest.assets.armchair,[6.4,.61,11.7],1.18,-.65)
        ]);
      }
      const furniture=[
        ["grandfatherClock",[-8.35,1.1,13.25],2.18,Math.PI/2],
        ["sideTable",[-7.8,.41,-13.8],.82,.2],
        ["sideTable",[7.8,.41,-13.8],.82,-.2],
        ["mantelClock",[-7.8,1.04,-13.8],.43,.1],
        ["marbleBust",[7.8,1.2,-13.8],.48,0]
      ] as const;
      await Promise.all(furniture.map(async ([key,position,height,angle])=>{
        const url=manifest.assets?.[key];
        if(url)await this.loadDecorGLTF(url,[...position] as THREE.Vector3Tuple,height,angle);
      }));
    }catch(err){console.warn("No se pudo cargar todo el decorado GLTF, se conserva el entorno.",err);}
  }
  private async loadDecorGLTF(url:string,where:THREE.Vector3Tuple,height:number,yaw:number){
    try{
      const gltf=await new GLTFLoader().loadAsync(url);
      const model=gltf.scene;
      if(gltf.animations.length){
        const mixer=new THREE.AnimationMixer(model);
        const action=mixer.clipAction(gltf.animations[0]);action.setEffectiveTimeScale(.55);action.play();
        this.decorMixers.push(mixer);
      }
      const unscaled=new THREE.Box3().setFromObject(model);
      const size=unscaled.getSize(new THREE.Vector3());
      const factor=height/Math.max(size.y,.01);
      model.scale.setScalar(factor);model.rotation.y=yaw;
      const center=new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
      model.position.sub(center);
      const staging=new THREE.Group();staging.position.set(...where);staging.add(model);
      staging.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});
      this.scenery.add(staging);return staging;
    }catch(err){console.warn("Decorado glTF no disponible",url,err);return null;}
  }
  private async useUsherGLB(url:string){
    try{
      const gltf=await new GLTFLoader().loadAsync(url);
      this.usher.clear();gltf.scene.name="ModeloAcomodador";this.usher.add(gltf.scene);
      this.usherMixer=new THREE.AnimationMixer(gltf.scene);
      if(gltf.animations.length)this.usherMixer.clipAction(gltf.animations[0]).play();
    }catch(err){console.warn("Modelo premium no disponible, se conserva el personaje de desarrollo.",err);}
  }
  private setupControls(){
    const down=(e:PointerEvent)=>{if(!this.active)return;if((e.target as HTMLElement)!==this.canvas)return;this.dragId=e.pointerId;this.pointerX=e.clientX;this.pointerY=e.clientY;this.canvas.setPointerCapture(e.pointerId);};
    const move=(e:PointerEvent)=>{if(this.dragId!==e.pointerId||!this.active)return;
      const scale=matchMedia("(pointer:coarse)").matches?.004:.003;
      this.yaw-=(e.clientX-this.pointerX)*scale;this.pitch-=(e.clientY-this.pointerY)*scale;
      this.pitch=THREE.MathUtils.clamp(this.pitch,-1.08,1.02);
      this.pointerX=e.clientX;this.pointerY=e.clientY;
    };
    const up=(e:PointerEvent)=>{if(e.pointerId===this.dragId)this.dragId=null;};
    const keyDown=(e:KeyboardEvent)=>{this.keys.add(e.code);if((e.code==="KeyE"||e.code==="Space")&&this.active){e.preventDefault();this.activate();}};
    const keyUp=(e:KeyboardEvent)=>this.keys.delete(e.code);
    this.canvas.addEventListener("pointerdown",down);this.canvas.addEventListener("pointermove",move);
    this.canvas.addEventListener("pointerup",up);this.canvas.addEventListener("pointercancel",up);
    window.addEventListener("keydown",keyDown);window.addEventListener("keyup",keyUp);
    this.cleanupFns.push(()=>{this.canvas.removeEventListener("pointerdown",down);this.canvas.removeEventListener("pointermove",move);
      this.canvas.removeEventListener("pointerup",up);this.canvas.removeEventListener("pointercancel",up);
      window.removeEventListener("keydown",keyDown);window.removeEventListener("keyup",keyUp);});
  }
  private closestObject():TheaterAction|null{
    let best=2.0,ret:TheaterAction|null=null;const p=this.camera.position;
    for(const root of this.targets){const pos=new THREE.Vector3();root.getWorldPosition(pos);const dist=pos.distanceTo(p);
      if(dist<best){best=dist;ret=root.userData.action as TheaterAction;}
    }return ret;
  }
  private checkFocus(){
    this.ray.setFromCamera(new THREE.Vector2(0,0),this.camera);
    const hits=this.ray.intersectObjects(this.targets,true);
    let next:TheaterAction|null=null;
    for(const hit of hits){
      let target:THREE.Object3D|null=hit.object;
      while(target&&!target.userData.action)target=target.parent;
      if(target&&hit.distance<3.3){next=target.userData.action as TheaterAction;break;}
    }
    if(!next)next=this.closestObject();
    if(next!==this.actionTarget){this.actionTarget=next;this.events.onFocus(next);}
  }
  private valid(x:number,z:number){
    if(Math.abs(x)>8.65||z>15.3||z< -19.9)return false;
    for(const c of this.colliders){if(Math.abs(x-c.x)<c.rx+.24&&Math.abs(z-c.z)<c.rz+.24)return false;}
    return true;
  }
  private updateMovement(dt:number){
    const key=(...keys:string[])=>keys.some(k=>this.keys.has(k));
    let forward=this.move.y+(key("KeyW","ArrowUp")?1:0)-(key("KeyS","ArrowDown")?1:0);
    let strafe=this.move.x+(key("KeyD","ArrowRight")?1:0)-(key("KeyA","ArrowLeft")?1:0);
    const n=Math.hypot(forward,strafe)||1;forward/=n;strafe/=n;
    const speed=3.35;const px=this.camera.position.x,pz=this.camera.position.z;
    const dx=(-Math.sin(this.yaw)*forward+Math.cos(this.yaw)*strafe)*dt*speed;
    const dz=(-Math.cos(this.yaw)*forward-Math.sin(this.yaw)*strafe)*dt*speed;
    if(this.valid(px+dx,pz))this.camera.position.x+=dx;
    if(this.valid(this.camera.position.x,pz+dz))this.camera.position.z+=dz;
    this.camera.rotation.set(this.pitch,this.yaw,0,"YXZ");
  }
  private resize=()=>{const width=Math.max(1,this.canvas.parentElement?.clientWidth||innerWidth),height=Math.max(1,this.canvas.parentElement?.clientHeight||innerHeight);
    this.camera.aspect=width/height;this.camera.updateProjectionMatrix();this.renderer.setSize(width,height,false);
  };
  private animate=()=>{
    this.frame=requestAnimationFrame(this.animate);
    const dt=Math.min(.05,this.clock.getDelta());this.clockTime+=dt;
    if(this.active){
      this.elapsed+=dt;this.updateMovement(dt);this.checkFocus();
      this.camera.getWorldDirection(this.forwardScratch);const p=this.camera.position,dir=this.forwardScratch;
      this.events.onListener(p.x,p.y,p.z,dir.x,dir.y,dir.z);
      if(this.elapsed>52&&!this.eventDone&&this.phase!=="final"){
        this.eventDone=true;this.events.onEvent("apagón");
        this.usher.position.set(-1.4,0,-12.0);this.usherGoal.set(-1.4,0,-12.0);
      }
      if(this.elapsed>this.nextScareAt&&!this.ended){
        this.nextScareAt+=39;
        this.events.onEvent("susurro");
        this.watchers.forEach(w=>w.visible=!w.visible);
      }
      if(this.usher.position.distanceToSquared(this.usherGoal)>.06){
        const distance=this.usher.position.distanceTo(this.usherGoal);
        this.usher.position.lerp(this.usherGoal,Math.min(1,dt*.75));
        this.usher.rotation.y=Math.atan2(this.usherGoal.x-this.usher.position.x,-(this.usherGoal.z-this.usher.position.z));
        if(this.clockTime-this.lastWalkerSfx>1.25&&distance>.9){
          this.lastWalkerSfx=this.clockTime;this.events.onEvent("pasos");
        }
      }
      this.frameTimeAccumulator+=dt;this.frameTimeSamples++;
      if(this.frameTimeSamples>=200){
        const avg=this.frameTimeAccumulator/this.frameTimeSamples;
        const pixelRatio=this.renderer.getPixelRatio();
        if(avg>.032&&pixelRatio>.85)this.renderer.setPixelRatio(Math.max(.85,pixelRatio-.13));
        this.frameTimeAccumulator=0;this.frameTimeSamples=0;
      }
    }
    this.usherMixer?.update(dt);this.decorMixers.forEach(m=>m.update(dt));
    if(this.dust)this.dust.rotation.y=Math.sin(this.clockTime*.1)*.007;
    this.watchers.forEach((w,i)=>{w.rotation.y=Math.sin(this.clockTime*.45+i)*.12;});
    if(this.projectorReel&&this.phase!=="inicio"&&this.lightsDone)this.projectorReel.rotation.z+=dt*1.2;
    if(this.ended&&this.curtainProgress<1){
      this.curtainProgress=Math.min(1,this.curtainProgress+dt*.23);
      const e=THREE.MathUtils.smoothstep(this.curtainProgress,0,1);
      if(this.curtainLeft){this.curtainLeft.position.x=-3.35-3.1*e;this.curtainLeft.scale.x=1-.92*e;}
      if(this.curtainRight){this.curtainRight.position.x=3.35+3.1*e;this.curtainRight.scale.x=1-.92*e;}
    }
    const flicker=(this.eventDone&&this.elapsed<54.1)?(.25+.75*(Math.sin(this.elapsed*74)>0?1:0)):1;
    if(this.lamps[0])this.lamps[0].intensity=(this.ended?4:26)*flicker;
    this.renderer.render(this.scene,this.camera);
  };
  dispose(){
    cancelAnimationFrame(this.frame);window.removeEventListener("resize",this.resize);this.cleanupFns.forEach(f=>f());
    this.scenery.traverse(obj=>{if(obj instanceof THREE.Mesh||obj instanceof THREE.InstancedMesh){obj.geometry.dispose();const a=Array.isArray(obj.material)?obj.material:[obj.material];
      a.forEach(m=>{if("map" in m&&(m as any).map)(m as any).map.dispose();m.dispose();});}});
    this.renderer.dispose();this.canvas.remove();
  }
}
