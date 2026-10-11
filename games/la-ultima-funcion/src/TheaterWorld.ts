import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneRigged } from "three/addons/utils/SkeletonUtils.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { TheaterCinematics } from "./TheaterCinematics";
import { UsherDirector } from "./UsherDirector";

export type TheaterAction = "butaca" | "fusible" | "portafusible" | "bobina" | "montar" | "enfoque" | "palco" | "ambar" | "azul" | "rojo" | "rueda1" | "rueda2" | "rueda3" | "proyector" | "telon" | "programa";
export type TheaterPhase = "inicio" | "luces" | "proyector" | "telon" | "final";
type SoundEvent = "pasos" | "apagón" | "susurro" | "aplausos" | "portazo" | "advertencia" | "presencia" | "aparicion" | "retirada" | "electricidad" | "fallo_luces" | "palco_aparicion" | "palco_visto" | "palco_desvanecido" | "film_terror" | "final_falso";
export interface WorldEvents { onFocus:(target:TheaterAction|null)=>void; onAction:(target:TheaterAction)=>void; onEvent:(event:SoundEvent)=>void; onListener:(x:number,y:number,z:number,fx:number,fy:number,fz:number,ux:number,uy:number,uz:number)=>void; }

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
  private pointerStartX=0;private pointerStartY=0;private pointerStartTime=0;
  private active=false;private ended=false;private elapsed=0;private startWallAt=0;private eventDone=false;
  private cleanupFns:Array<()=>void>=[];
  private usher=new THREE.Group();private usherMixer?:THREE.AnimationMixer;
  private usherDirector?:UsherDirector;
  private usherRigAnchor?:THREE.Group;
  private boxSpecter?:THREE.Group;
  private boxSpecterLight?:THREE.PointLight;
  private boxSpecterMixer?:THREE.AnimationMixer;
  private boxSpecterStartedAt=-1;
  private boxSpecterLooked=false;
  private boxSpecterCue=false;
  private boxSpecterVisible=false;
  private boxGazeSeconds=0;
  private filmSequenceStartedAt=-1;
  private filmFrame=0;
  private fusePickup?:THREE.Group;
  private installedFuse?:THREE.Group;
  private reelPickup?:THREE.Group;
  private mountedReel?:THREE.Group;
  private fuseInstalled=false;
  private reelMounted=false;
  private focusSetting=0;
  private focusKnob?:THREE.Mesh;

  private usherKey?:THREE.PointLight;
  private curtainLeft?:THREE.Mesh;private curtainRight?:THREE.Mesh;
  private entranceDoors:THREE.Group[]=[];private entranceClosed=false;private entranceSlam=false;
  private curtainProgress=0;private lamps:THREE.PointLight[]=[];
  private scenery=new THREE.Group();private chandelierPlaceholder?:THREE.Group;private lightsDone=false;
  private projectorReel?:THREE.Group;private projectorFallback?:THREE.Group;private specialSeat?:THREE.Group;private seatKey?:THREE.Group;
  private wheelFaces:THREE.MeshBasicMaterial[]=[];private wheelValues:[number,number,number]=[0,0,0];
  private projectorScreen?:THREE.Mesh;private projectorBeam?:THREE.SpotLight;
  private threatMessage?:THREE.Mesh;private projectorProfessionalLoaded=false;
  private cinema?:TheaterCinematics;
  private primaryStageSpot?:THREE.SpotLight;
  private blueStageFill?:THREE.PointLight;
  private phase:TheaterPhase="inicio";private clockTime=0;
  private usherGoal=new THREE.Vector3(5.8,0,-10.95);
  private warningStage:"idle"|"queued"|"silence"|"apparition"|"resolved"="idle";
  private warningAt=Infinity;
  private warningAppearedAt=Infinity;
  private warningStart=0;
  private warningSeen=false;
  private warningPreviousDestination=new THREE.Vector3();
  private warningFlash=0;
  private warningLight?:THREE.PointLight;
  private decorMixers:THREE.AnimationMixer[]=[];
  private assets=new Map<string,Promise<GLTF>>();
  private sharedLoader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  private velvetMaterials:THREE.MeshStandardMaterial[]=[];
  private velvetReady=false;
  private seatNumberMeshes:THREE.InstancedMesh[]=[];
  private usherIdle?:THREE.AnimationAction;private usherWalk?:THREE.AnimationAction;private usherWalking=false;
  private watchers:THREE.Group[]=[];
  private privateBoxes:THREE.Group[]=[];
  private dust?:THREE.Points;
  private frameTimeAccumulator=0;private frameTimeSamples=0;private nextScareAt=24;private lastWalkerSfx=0;
  private fpsSamples=0;private fpsDuration=0;private measuredFps=0;
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
  start(){this.active=true;this.startWallAt=performance.now()-this.elapsed*1000;this.clock.getDelta();}
  stop(){this.active=false;}
  setPhase(p:TheaterPhase){
    this.phase=p;this.cinema?.setAct(p);
    if(p==="luces"){this.usherGoal.set(-5.9,0,-10.95);this.events.onEvent("pasos");}
    if(p==="proyector"){
      this.events.onEvent("electricidad");
      this.triggerBoxSpecter();
      if(this.warningStage==="idle"){
        this.warningStage="queued";
        this.warningAt=this.elapsed+4.5;
      }
      this.lightsDone=false;this.setScreen("FALTA BOBINA · ENFOQUE 2");
      this.usherGoal.set(5.9,0,-10.95);this.events.onEvent("susurro");
      this.watchers.forEach(w=>w.visible=false);
    }
    if(p==="telon"){
      this.projectorReel?.rotateZ(.2);this.usherGoal.set(-6.0,0,-10.95);
      this.events.onEvent("pasos");
    }
    if(p==="final"){
      this.events.onEvent("final_falso");
      this.cancelWarning();
      if(this.threatMessage)this.threatMessage.visible=false;
      this.ended=true;this.events.onEvent("aplausos");
      this.scene.background=new THREE.Color(0x25131d);
      if(this.lamps[1])this.lamps[1].intensity=25;
    }
  }
  setMove(x:number,y:number){this.move={x,y};}
  activate(){if(this.actionTarget){this.events.onAction(this.actionTarget);return;}const closest=this.closestObject();if(closest)this.events.onAction(closest);}
  markLight(index:number){if(this.emitterLights[index])this.emitterLights[index].emissiveIntensity=1.9;this.cinema?.activateCircuit(index);}
  resetLights(){this.emitterLights.forEach(m=>m.emissiveIntensity=.16);this.cinema?.resetCircuits();}
  collectKey(){if(this.seatKey){this.seatKey.visible=false;this.seatKey=undefined;}}
  collectFuse(){if(this.fusePickup)this.fusePickup.visible=false;}
  installFuse(){this.fuseInstalled=true;if(this.installedFuse)this.installedFuse.visible=true;this.emitterLights.forEach(m=>m.emissiveIntensity=.43);}
  collectReel(){if(this.reelPickup)this.reelPickup.visible=false;}
  mountReel(){this.reelMounted=true;if(this.mountedReel)this.mountedReel.visible=true;}
  rotateFocus(){
    this.focusSetting=(this.focusSetting+1)%4;
    if(this.focusKnob)this.focusKnob.rotation.z=this.focusSetting*Math.PI/2;
    return this.focusSetting;
  }
  triggerFailedCircuit(){
    this.events.onEvent("fallo_luces");
    this.usherGoal.set(0,0,-10.83);
    this.boxSpecterCue=false;
    this.triggerBoxSpecter();
  }
  getMechanicalStatus(){
    return {fuseInstalled:this.fuseInstalled,reelMounted:this.reelMounted,focus:this.focusSetting,
      boxFigure:!!this.boxSpecter,boxVisible:!!this.boxSpecter?.visible,boxSeen:this.boxSpecterLooked,
      actorGround:this.usherDirector?.getGroundingStatus()};
  }
  getCharacterPosition(){return this.usher.position.toArray();}
  viewMechanicalPartsForTest(){
    if(!import.meta.env.DEV)return false;
    this.camera.position.set(6.1,1.64,-7.8);
    this.camera.lookAt(7.25,1.5,-9.5);
    this.yaw=this.camera.rotation.y;this.pitch=this.camera.rotation.x;
    return true;
  }
  viewBoxFigureForTest(){
    if(!import.meta.env.DEV)return false;
    this.camera.position.set(0,1.64,-6.0);
    this.camera.lookAt(-6.0,6.4,-13.1);
    this.yaw=this.camera.rotation.y;this.pitch=this.camera.rotation.x;
    return true;
  }

  viewNumberedSeatForTest(){
    if(!import.meta.env.DEV||!this.specialSeat)return false;
    const p=this.specialSeat.position;
    this.camera.position.set(p.x,1.6,p.z+1.55);
    this.camera.lookAt(p.x,1.48,p.z+.54);
    this.yaw=this.camera.rotation.y;this.pitch=this.camera.rotation.x;
    return true;
  }
  viewRowSignageForTest(){
    if(!import.meta.env.DEV)return false;
    this.camera.position.set(0,1.68,9.5);
    this.camera.lookAt(0,1.82,2.4);
    this.yaw=this.camera.rotation.y;this.pitch=this.camera.rotation.x;
    return true;
  }
  getSeatNumberingStatus(){
    return {rows:8,perRow:10,
      numbered:this.seatNumberMeshes.reduce((sum,m)=>sum+m.count,0),
      digits:this.seatNumberMeshes.length,
      target:"FILA 3 · ASIENTO 8",
      targetPosition:this.specialSeat?.position.toArray()};
  }
  getCharacterStatus(){return {human:!!this.usher.getObjectByName("AcomodadorHumanoRiggeado"),idle:!!this.usherIdle,walk:!!this.usherWalk};}
  getUsherDetails(){return this.usherDirector?.getStatus();}
  viewUsherForTest(){
    if(!import.meta.env.DEV||!this.usherDirector)return false;
    const actor=this.usher.position;
    this.camera.position.set(actor.x+1.5,1.64,actor.z-3.0);
    this.camera.lookAt(actor.x,1.7,actor.z);
    this.yaw=this.camera.rotation.y;this.pitch=this.camera.rotation.x;
    return true;
  }
  getCinematicStatus(){return {projectorModel:this.projectorProfessionalLoaded,director:!!this.cinema,velvetPBR:this.velvetReady,threatVisible:!!this.threatMessage?.visible,act:this.phase};}
  getPerformanceStatus(){
    return {
      fps:Math.round(this.measuredFps),
      pixelRatio:Number(this.renderer.getPixelRatio().toFixed(2)),
      drawCalls:this.renderer.info.render.calls,
      triangles:this.renderer.info.render.triangles,
      models:this.projectorProfessionalLoaded&&this.velvetReady
    };
  }
  getWarningStatus(){return {stage:this.warningStage,seen:this.warningSeen};}
  forceWarningForTest(){
    if(!import.meta.env.DEV||this.phase!=="proyector")return false;
    // Move to a free aisle before triggering a scripted scare in the headless browser.
    this.camera.position.set(0,1.64,0);
    this.yaw=0;this.pitch=0;this.camera.rotation.set(0,0,0,"YXZ");
    this.warningStage="queued";this.warningAt=this.elapsed;
    this.startWarning(); // Real event handler, deterministic under software WebGL.
    return true;
  }
  advanceWarningForTest(){
    if(!import.meta.env.DEV||this.warningStage!=="silence")return false;
    this.spawnApparition();
    return true;
  }
  finishWarningForTest(){
    if(!import.meta.env.DEV||this.warningStage!=="apparition"||!this.warningSeen)return false;
    this.warningAppearedAt=this.elapsed-3;
    this.updateWarning();
    return this.getWarningStatus().stage==="resolved";
  }
  turnToApparitionForTest(){
    if(!import.meta.env.DEV||this.warningStage!=="apparition")return false;
    const target=this.usher.position.clone();target.y=1.65;
    this.camera.lookAt(target);
    this.yaw=this.camera.rotation.y;this.pitch=this.camera.rotation.x;
    this.camera.getWorldDirection(this.forwardScratch);
    this.updateWarning();
    return this.warningSeen;
  }
  private cancelWarning(){
    if(this.warningStage==="idle"||this.warningStage==="resolved")return;
    this.warningStage="resolved";
    this.warningLight?.parent?.remove(this.warningLight);
    this.warningLight=undefined;
    this.usherGoal.copy(this.warningPreviousDestination.lengthSq()?this.warningPreviousDestination:new THREE.Vector3(-6.0,0,-10.95));
    this.warningFlash=0;
  }
  private startWarning(){
    if(this.warningStage!=="queued"||this.ended)return;
    this.warningStage="silence";this.warningStart=this.elapsed;
    this.warningPreviousDestination.copy(this.usherGoal);
    this.events.onEvent("advertencia");
  }
  // The raised stage begins at z ≈ -12.2. The usher is not a ghost:
  // it must remain on the auditorium floor, clear of stage fascia,
  // projection equipment and upholstered seats.
  private usherWalkable(x:number,z:number){
    return z>=-11.12&&z<=12.1&&Math.abs(x)<=8.1&&this.valid(x,z);
  }
  getUsherGroundingStatus(){
    return {position:this.usher.position.toArray(),stageBoundary:-11.12,
      safe:this.usherWalkable(this.usher.position.x,this.usher.position.z),
      footAnchors:this.usherDirector?.getGroundingStatus()};
  }
  private chooseApparitionPosition(){
    // The actor appears where there is space behind the camera, not through a chair.
    const p=this.camera.position;
    const forward=new THREE.Vector3();
    this.camera.getWorldDirection(forward);forward.y=0;forward.normalize();
    const toBack=forward.clone().multiplyScalar(-1);
    const options:THREE.Vector3[]=[];
    for(const distance of [1.9,2.5,3.2]){
      for(const offset of [0, .6, -.6,1.25,-1.25]){
        const lateral=new THREE.Vector3(-forward.z,0,forward.x).multiplyScalar(offset);
        options.push(new THREE.Vector3(p.x+toBack.x*distance+lateral.x,0,p.z+toBack.z*distance+lateral.z));
      }
    }
    const good=options.find(v=>this.usherWalkable(v.x,v.z));
    if(good)return good;
    // Safe aisle fallback when player is between rows of seats.
    const aisles=[new THREE.Vector3(0,0,p.z),new THREE.Vector3(7.7,0,p.z),new THREE.Vector3(-7.7,0,p.z)];
    return aisles.find(v=>this.usherWalkable(v.x,v.z))||new THREE.Vector3(0,0,-10.9);
  }
  private spawnApparition(){
    if(this.warningStage!=="silence"||this.ended)return;
    this.warningStage="apparition";this.warningAppearedAt=this.elapsed;
    const loc=this.chooseApparitionPosition();
    this.usher.position.copy(loc);this.usherGoal.copy(loc);
    const dir=this.camera.position.clone().sub(loc);
    this.usher.rotation.y=Math.atan2(dir.x,-dir.z);
    this.warningLight=new THREE.PointLight(0xc87569,5.2,4.1,2);
    this.warningLight.position.set(loc.x,2.05,loc.z);
    this.scene.add(this.warningLight);
    this.events.onEvent("presencia");
  }
  private updateWarning(){
    if(this.warningStage==="queued"&&this.elapsed>=this.warningAt)this.startWarning();
    if(this.warningStage==="silence"&&this.elapsed-this.warningStart>=3.25)this.spawnApparition();
    if(this.warningStage!=="apparition")return;
    const direction=this.usher.position.clone().sub(this.camera.position);
    const distance=direction.length();
    direction.y=0;direction.normalize();
    const facing=this.forwardScratch.clone();facing.y=0;facing.normalize();
    const looking=distance<4.5&&facing.dot(direction)>.75;
    if(looking&&!this.warningSeen){
      this.warningSeen=true;
      this.warningFlash=.22;
      this.events.onEvent("aparicion");
    }
    const time=this.elapsed-this.warningAppearedAt;
    if(time>(this.warningSeen?2.1:9.0)){
      this.warningStage="resolved";
      this.warningLight?.parent?.remove(this.warningLight);this.warningLight=undefined;
      this.usher.position.set(-6.0,0,-10.95);this.usherGoal.copy(this.warningPreviousDestination);
      this.events.onEvent("retirada");
    }
  }
  turnWheel(index:number){
    if(index<0||index>2)return;
    this.wheelValues[index]=(this.wheelValues[index]+1)%10;
    this.paintWheel(index);
  }
  getWheelValues(){return [...this.wheelValues] as [number,number,number];}
  aimAtForTest(action:TheaterAction){
    if(!import.meta.env.DEV)return false;
    const target=this.targets.find(o=>o.userData.action===action);if(!target)return false;
    const pos=target.getWorldPosition(new THREE.Vector3());
    this.camera.position.set(pos.x,1.64,pos.z+2.45);
    this.camera.lookAt(pos);
    this.yaw=this.camera.rotation.y;this.pitch=this.camera.rotation.x;
    return true;
  }
  private paintWheel(index:number){
    const m=this.wheelFaces[index];if(!m)return;
    m.map?.dispose();
    const value=this.wheelValues[index];
    const canvas=document.createElement("canvas");canvas.width=192;canvas.height=256;
    const ctx=canvas.getContext("2d")!;
    const gradient=ctx.createLinearGradient(0,0,192,0);
    gradient.addColorStop(0,"#181619");gradient.addColorStop(.5,"#5f5651");gradient.addColorStop(1,"#19171b");
    ctx.fillStyle=gradient;ctx.fillRect(0,0,192,256);
    ctx.strokeStyle="#bf965c";ctx.lineWidth=6;ctx.strokeRect(5,5,182,246);
    ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle="#f3dfaa";
    ctx.font="bold 178px Georgia";ctx.fillText(String(value),96,131);
    m.map=new THREE.CanvasTexture(canvas);m.map.colorSpace=THREE.SRGBColorSpace;m.needsUpdate=true;
  }
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
    this.primaryStageSpot=stageLight;this.blueStageFill=stageBlue;
    this.buildStructure();this.buildPrivateBoxes();this.buildEntranceDoors();this.buildSeats();this.buildPanels();this.buildStage();this.buildUsher();this.buildThreatMessage();
    this.buildAtmosphere();
    if(this.primaryStageSpot&&this.blueStageFill&&this.projectorBeam)this.cinema=new TheaterCinematics(s,this.primaryStageSpot,this.blueStageFill,this.projectorBeam);
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
    this.buildFrozenClock();
    const sign=this.textPlane(["TEATRO BELLADONNA","ÚLTIMA FUNCIÓN","EST. 1968"],3.9,2.3);
    sign.position.set(0,3.5,15.83);sign.rotation.y=Math.PI;room.add(sign);
    const ticket=this.textPlane(["ENTRADA RESERVADA","FILA 3  •  ASIENTO 8","NO PIERDA SU BOLETO"],2.25,1.55);
    ticket.position.set(-8.95,2.1,12);ticket.rotation.y=Math.PI/2;room.add(ticket);this.bind(ticket,"programa");
    this.colliders.push({x:-8.95,z:12,rx:.28,rz:.9});
  }
  private triggerBoxSpecter(){
    this.boxSpecterCue=true;
    this.boxSpecterStartedAt=this.elapsed;
    this.boxSpecterVisible=true;
    this.boxSpecterLooked=false;
    this.boxGazeSeconds=0;
    if(this.boxSpecter)this.boxSpecter.visible=true;
    this.events.onEvent("palco_aparicion");
  }
  private updateBoxSpecter(dt:number){
    if(!this.boxSpecterCue||this.ended)return;
    if(this.boxSpecter)this.boxSpecter.visible=this.boxSpecterVisible;
    const box=new THREE.Vector3(-6.0,6.4,-13.1);
    const delta=box.sub(this.camera.position);
    const length=delta.length();
    this.camera.getWorldDirection(this.forwardScratch);
    const looking=this.forwardScratch.dot(delta.normalize())>.91&&length<26;
    this.boxGazeSeconds=looking?this.boxGazeSeconds+dt:Math.max(0,this.boxGazeSeconds-dt*.7);
    if(this.boxGazeSeconds>.35&&!this.boxSpecterLooked){
      this.boxSpecterLooked=true;this.events.onEvent("palco_visto");
      this.warningFlash=Math.max(this.warningFlash,.18);
    }
    if(this.boxSpecterLooked&&this.boxSpecterVisible&&this.boxGazeSeconds>.8){
      this.boxSpecterVisible=false;
      if(this.boxSpecter)this.boxSpecter.visible=false;
      this.events.onEvent("palco_desvanecido");
    }
    if(this.elapsed-this.boxSpecterStartedAt>22&&this.boxSpecterVisible){
      this.boxSpecterVisible=false;
      if(this.boxSpecter)this.boxSpecter.visible=false;
      this.events.onEvent("palco_desvanecido");
    }
  }
  private buildPrivateBoxes(){
    // Before, upper rails and silhouettes suggested a balcony but there was
    // no identifiable, physical box. These two elevated private galleries
    // have platforms, depth, curtained entrances, gilded parapets and signs.
    const timber=new THREE.MeshStandardMaterial({color:0x3b2928,roughness:.77,metalness:.04});
    const walnut=new THREE.MeshStandardMaterial({color:0x5b3833,roughness:.64,metalness:.08});
    const gilt=new THREE.MeshStandardMaterial({color:0xaf864e,roughness:.32,metalness:.75});
    const curtain=new THREE.MeshStandardMaterial({color:0x682537,roughness:.92,metalness:0,side:THREE.DoubleSide});
    const darkInterior=new THREE.MeshStandardMaterial({color:0x1b121a,roughness:.98,side:THREE.DoubleSide});
    const bulb=new THREE.MeshStandardMaterial({color:0xffdaa0,emissive:0xffa868,emissiveIntensity:2.7,roughness:.27});
    for(const side of [-1,1]){
      const group=new THREE.Group();
      group.name=side<0?"Palco 1 - izquierdo":"Palco 2 - derecho";
      group.position.set(side*6.0,0,-13.1);
      this.scenery.add(group);this.privateBoxes.push(group);
      // A warm focus illuminates the labelled box from the orchestra; no
      // shadow map is needed on mobile, and the figure remains readable.
      const rim=new THREE.PointLight(side<0?0xea9196:0xf1b57f,side<0?7.5:4.5,6.3,2);
      rim.position.set(0,6.8,1.75);rim.castShadow=false;group.add(rim);
      if(side<0)this.boxSpecterLight=rim;
      const timberFloor=addMesh(new RoundedBoxGeometry(2.98,.23,3.7,3,.065),walnut,[0,5.05,-.15],group);
      timberFloor.receiveShadow=true;
      addMesh(new RoundedBoxGeometry(3.05,.17,.3,3,.04),gilt,[0,4.97,1.57],group);
      addMesh(new THREE.PlaneGeometry(2.92,2.55),darkInterior,[0,6.5,-1.84],group);
      // Side enclosure around the 1968 theater private box.
      for(const x of [-1.48,1.48]){
        addMesh(new RoundedBoxGeometry(.16,2.15,2.9,2,.055),timber,[x,6.25,-.32],group);
        const column=addMesh(new THREE.CylinderGeometry(.135,.155,2.55,14),walnut,[x,6.35,1.47],group);
        column.castShadow=true;
        addMesh(new THREE.SphereGeometry(.18,12,9),gilt,[x,7.69,1.47],group);
        addMesh(new THREE.SphereGeometry(.15,12,9),bulb,[x*.84,6.86,-1.34],group);
      }
      // Art Deco/victorian proscenium and carved upper arch.
      const archBeam=new THREE.Mesh(new THREE.TorusGeometry(1.42,.095,10,42,Math.PI),gilt);
      archBeam.position.set(0,7.65,1.49);group.add(archBeam);
      addMesh(new RoundedBoxGeometry(3.17,.28,.28,3,.09),gilt,[0,7.7,1.45],group);
      // The heavy drapes are pleated geometry, not 2D backdrops.
      for(const x of [-1.16,1.16]){
        const curtainFold=new THREE.Mesh(this.curtainGeometry(.55,2.0),curtain);
        curtainFold.position.set(x,5.2,1.54);
        curtainFold.rotation.y=x>0?-.13:.13;
        curtainFold.castShadow=true;group.add(curtainFold);
        addMesh(new THREE.TorusGeometry(.16,.03,8,18,Math.PI),gilt,[x,5.91,1.59],group).rotation.y=Math.PI/2;
      }
      // Raised protective front parapet with visible vertical balusters.
      addMesh(new RoundedBoxGeometry(2.96,.24,.33,3,.08),walnut,[0,5.74,1.62],group);
      addMesh(new RoundedBoxGeometry(3.05,.09,.36,3,.032),gilt,[0,5.88,1.62],group);
      const bars=new THREE.InstancedMesh(new THREE.CylinderGeometry(.039,.056,.57,9),gilt,9);
      const d=new THREE.Object3D();
      for(let i=0;i<9;i++){d.position.set(-1.25+i*.3125,5.40,1.62);d.updateMatrix();bars.setMatrixAt(i,d.matrix);}
      bars.instanceMatrix.needsUpdate=true;group.add(bars);
      addMesh(new RoundedBoxGeometry(2.95,.1,.33,2,.045),gilt,[0,5.09,1.62],group);
      // This sign can be read from the auditorium floor looking up.
      const label=this.textPlane([side<0?"PALCO 1":"PALCO 2",side<0?"IZQUIERDO":"DERECHO"],1.51,.72);
      label.name="Identificación de "+group.name;
      label.position.set(0,5.34,1.86);group.add(label);
    }
  }
  viewActorOnStageForTest(){
    if(!import.meta.env.DEV)return false;
    this.camera.position.set(0,1.64,-6.5);
    this.camera.lookAt(this.usher.position.x,1.5,this.usher.position.z);
    this.yaw=this.camera.rotation.y;this.pitch=this.camera.rotation.x;
    return true;
  }
  getPrivateBoxesStatus(){
    return {count:this.privateBoxes.length,
      names:this.privateBoxes.map(p=>p.name),
      labels:this.privateBoxes.map(p=>p.children.some(c=>c.name.startsWith("Identificación de")))};
  }
  viewPrivateBoxForTest(){
    if(!import.meta.env.DEV||this.privateBoxes.length!==2)return false;
    this.camera.position.set(0,1.64,4);
    this.camera.lookAt(-6.0,6.38,-13.1);
    this.yaw=this.camera.rotation.y;this.pitch=this.camera.rotation.x;
    return true;
  }
  private buildEntranceDoors(){
    const dmat=mat(0x58372b,.63),inlay=mat(0x8f6144,.52),hinges=brass;
    for(const side of [-1,1]){
      const pivot=new THREE.Group();pivot.position.set(side*1.5,0,15.82);this.scenery.add(pivot);
      const slab=addMesh(new THREE.BoxGeometry(1.48,3.9,.19),dmat,[-side*.74,2.01,0],pivot,true);
      for(const height of [1.2,2.65]){
        const panel=addMesh(new THREE.BoxGeometry(1.13,1.15,.035),inlay,[-side*.74,height,-.12],pivot);
        addMesh(new THREE.BoxGeometry(1.06,1.07,.05),dmat,[-side*.74,height,-.15],pivot);
      }
      const handle=addMesh(new THREE.SphereGeometry(.095,12,8),hinges,[-side*1.33,1.83,-.19],pivot);
      for(const yy of [.48,2.1,3.5]){
        addMesh(new THREE.BoxGeometry(.12,.3,.1),hinges,[-side*.07,yy,0],pivot);
      }
      pivot.rotation.y=-side*1.35;
      this.entranceDoors.push(pivot);
    }
    const sign=this.textPlane(["BELLADONNA","SALIDA"],3.45,1.1);
    sign.position.set(0,4.5,15.76);sign.rotation.y=Math.PI;
    this.scenery.add(sign);
    // Rear doors remain closed; the player hears them lock behind them.
    this.colliders.push({x:0,z:15.82,rx:1.52,rz:.18});
  }
  private buildFrozenClock(){
    // The clock stopped at 03:17 on the night everyone vanished. Real hands,
    // engraved number markers and brass details provide the clue visually.
    const c=new THREE.Group();c.position.set(-7.75,3.92,10.8);
    c.rotation.y=Math.PI/2;
    const woodRing=addMesh(new THREE.CylinderGeometry(.84,.84,.23,48),wood,[0,0,-.13],c);woodRing.rotation.x=Math.PI/2;
    const metalRing=addMesh(new THREE.TorusGeometry(.73,.055,12,48),brass,[0,0,.02],c);
    const face=addMesh(new THREE.CircleGeometry(.69,48),cream,[0,0,.019],c);
    const markerMat=mat(0x36271f,.7,.28);
    for(let i=0;i<12;i++){
      const a=Math.PI*2*i/12;
      const tick=addMesh(new THREE.BoxGeometry(.036,i%3===0?.15:.09,.022),markerMat,
        [Math.sin(a)*.57,Math.cos(a)*.57,.046],c);
      tick.rotation.z=-a;
    }
    const hand=(angle:number,length:number,width:number,z:number)=>{
      const arm=addMesh(new THREE.BoxGeometry(width,length,.028),markerMat,
        [Math.sin(angle)*length*.38,Math.cos(angle)*length*.38,z],c);
      arm.rotation.z=-angle;
    };
    hand((3+17/60)*Math.PI/6,.39,.064,.07);
    hand(17*Math.PI/30,.57,.038,.10);
    addMesh(new THREE.SphereGeometry(.08,12,9),brass,[0,0,.12],c);
    this.scenery.add(c);
    this.colliders.push({x:-7.82,z:10.8,rx:.23,rz:.9});
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
    this.velvetMaterials.push(fabric);
    // The 80 theatre chairs retain their detailed instanced upholstery. The
    // numbering is physical 3D signage — 10 GPU batches, not 80 separate draws.
    const items:Array<{geo:THREE.BufferGeometry,m:THREE.Material,p:THREE.Vector3Tuple,tilt?:number}>=[
      {geo:new RoundedBoxGeometry(.79,.15,.7,3,.045),m:frame,p:[0,.51,0]},
      {geo:new RoundedBoxGeometry(.70,.21,.65,4,.095),m:fabric,p:[0,.64,-.045]},
      {geo:new RoundedBoxGeometry(.78,1.1,.23,3,.06),m:frame,p:[0,1.12,.31],tilt:.07},
      {geo:new RoundedBoxGeometry(.67,.90,.15,4,.066),m:fabric,p:[0,1.13,.434],tilt:.07},
      {geo:new RoundedBoxGeometry(.11,.09,.87,3,.035),m:fadedGold,p:[-.425,.94,0]},
      {geo:new RoundedBoxGeometry(.11,.09,.87,3,.035),m:fadedGold,p:[.425,.94,0]},
      {geo:new THREE.CylinderGeometry(.055,.075,.52,8),m:frame,p:[-.36,.25,-.3]},
      {geo:new THREE.CylinderGeometry(.055,.075,.52,8),m:frame,p:[.36,.25,-.3]},
    ];
    const xs=[-6.3,-5.4,-4.5,-3.6,-2.7,2.7,3.6,4.5,5.4,6.3];
    const allSeats:Array<{row:number;number:number;p:THREE.Vector3Tuple}>=[];
    const positions:THREE.Vector3Tuple[]=[];
    let selected:THREE.Vector3Tuple=[4.5,0,3];
    for(let row=0;row<8;row++){
      const z=7-row*2;
      for(let col=0;col<10;col++){
        const x=xs[col],p:THREE.Vector3Tuple=[x,0,z];
        allSeats.push({row:row+1,number:col+1,p});
        if(row===2&&col===7){selected=p;continue;}
        positions.push(p);this.colliders.push({x,z,rx:.38,rz:.35});
      }
    }
    const matrix=new THREE.Object3D();
    for(const part of items){
      const inst=new THREE.InstancedMesh(part.geo,part.m,positions.length);
      positions.forEach((p,i)=>{
        matrix.position.set(p[0]+part.p[0],p[1]+part.p[1],p[2]+part.p[2]);
        matrix.rotation.set(part.tilt??0,0,0);
        matrix.scale.set(1,1,1);matrix.updateMatrix();inst.setMatrixAt(i,matrix.matrix);
      });
      inst.instanceMatrix.needsUpdate=true;this.scenery.add(inst);
    }
    const special=new THREE.Group();special.position.set(...selected);
    special.name="Fila 3 · Asiento 8";
    items.forEach(part=>{const piece=addMesh(part.geo,part.m,part.p,special);piece.rotation.x=part.tilt??0;});
    // Every backrest, including the target, receives a numbered brass plaque.
    const plateGeo=new RoundedBoxGeometry(.38,.29,.025,2,.045);
    const ordinaryPlate=new THREE.MeshStandardMaterial({color:0x987747,metalness:.76,roughness:.3});
    const platePositions=allSeats.filter(s=>!(s.row===3&&s.number===8));
    const plates=new THREE.InstancedMesh(plateGeo,ordinaryPlate,platePositions.length);
    platePositions.forEach((seat,i)=>{
      const p=seat.p;
      matrix.position.set(p[0],1.52,p[2]+.548);
      matrix.rotation.set(0,0,0);matrix.scale.set(1,1,1);matrix.updateMatrix();
      plates.setMatrixAt(i,matrix.matrix);
    });
    plates.instanceMatrix.needsUpdate=true;plates.name="Placas metálicas de asientos numerados";
    this.scenery.add(plates);
    addMesh(new RoundedBoxGeometry(.40,.31,.03,3,.049),brass,[0,1.52,.551],special);
    // BasicMaterial keeps the old ivory engraving legible in theatrical low light.
    const plaqueSurface=new THREE.PlaneGeometry(.31,.235);
    const numberedSeatMeshes:THREE.InstancedMesh[]=[];
    for(let number=1;number<=10;number++){
      const canvas=document.createElement("canvas");canvas.width=256;canvas.height=192;
      const ctx=canvas.getContext("2d")!;
      const grad=ctx.createLinearGradient(0,0,256,192);
      grad.addColorStop(0,"#30201b");grad.addColorStop(1,"#4a3029");
      ctx.fillStyle=grad;ctx.fillRect(0,0,256,192);
      ctx.lineWidth=7;ctx.strokeStyle="#c59b56";ctx.strokeRect(10,10,236,172);
      ctx.fillStyle="#f9e9bd";ctx.font="bold 145px Georgia,serif";
      ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(String(number),128,105);
      const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
      const material=new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide});
      const group=allSeats.filter(seat=>seat.number===number);
      const mesh=new THREE.InstancedMesh(plaqueSurface,material,group.length);
      mesh.name="ASIENTO "+number;
      mesh.userData.seats=group.map(seat=>({fila:seat.row,asiento:seat.number}));
      group.forEach((seat,i)=>{
        const p=seat.p;
        // A tiny forward offset avoids z-fighting with the brass backing.
        matrix.position.set(p[0],1.52,p[2]+.570);
        matrix.rotation.set(0,0,0);matrix.scale.set(1,1,1);matrix.updateMatrix();
        mesh.setMatrixAt(i,matrix.matrix);
      });
      mesh.instanceMatrix.needsUpdate=true;numberedSeatMeshes.push(mesh);
      this.scenery.add(mesh);
    }
    // Real row markers attached to the aisle-end chairs, seen while walking
    // towards the stage. "FILA 1" is the first row from the theatre entrance.
    const signBacking=new THREE.InstancedMesh(
      new RoundedBoxGeometry(.58,.37,.037,2,.035),brass,16);
    const signBracket=new THREE.InstancedMesh(
      new THREE.CylinderGeometry(.016,.016,.35,8),fadedGold,16);
    for(let row=1;row<=8;row++){
      const canvas=document.createElement("canvas");canvas.width=512;canvas.height=256;
      const ctx=canvas.getContext("2d")!;
      ctx.fillStyle="#35221e";ctx.fillRect(0,0,512,256);
      ctx.strokeStyle="#c79d5d";ctx.lineWidth=10;ctx.strokeRect(13,13,486,230);
      ctx.textAlign="center";ctx.fillStyle="#f8e5bf";ctx.textBaseline="middle";
      ctx.font="bold 62px Georgia,serif";ctx.fillText("FILA",256,84);
      ctx.font="bold 114px Georgia,serif";ctx.fillText(String(row),256,178);
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
      const labelMat=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide});
      const rowMesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(.51,.3),labelMat,2);
      rowMesh.name="Señal de FILA "+row;
      for(let side=0;side<2;side++){
        const x=side===0?-2.35:2.35,z=7-(row-1)*2;
        matrix.position.set(x,1.91,z+.58);
        matrix.rotation.set(0,0,0);matrix.scale.set(1,1,1);matrix.updateMatrix();
        rowMesh.setMatrixAt(side,matrix.matrix);
        matrix.position.set(x,1.91,z+.550);matrix.updateMatrix();
        signBacking.setMatrixAt((row-1)*2+side,matrix.matrix);
        matrix.position.set(x,1.65,z+.548);matrix.scale.set(1,1,1);matrix.updateMatrix();
        signBracket.setMatrixAt((row-1)*2+side,matrix.matrix);
      }
      rowMesh.instanceMatrix.needsUpdate=true;this.scenery.add(rowMesh);
    }
    signBacking.instanceMatrix.needsUpdate=true;signBracket.instanceMatrix.needsUpdate=true;
    this.scenery.add(signBacking,signBracket);
    // The numbered target is distinguished by a worn reserved-seat tab,
    // but remains readable only once the player approaches the correct row.
    const reserved=new THREE.Mesh(
      new THREE.PlaneGeometry(.52,.12),
      new THREE.MeshBasicMaterial({map:labelTexture(["RESERVADO"],"#e7be7b","#4b2521"),side:THREE.DoubleSide})
    );
    reserved.position.set(0,1.25,.559);reserved.name="Placa RESERVADO";
    special.add(reserved);
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
    this.seatNumberMeshes=numberedSeatMeshes;
  }
  private buildPanels(){
    const pedestal=(x:number,z:number)=>{const g=new THREE.Group();g.position.set(x,0,z);
      addMesh(new THREE.CylinderGeometry(.69,.84,1.12,14),wood,[0,.56,0],g);
      addMesh(new THREE.CylinderGeometry(.77,.8,.12,14),brass,[0,1.17,0],g);
      this.scenery.add(g);return g;
    };
    const p=pedestal(-7.25,-9.7);
    const plaque=this.textPlane(["CONSOLA ELÉCTRICA","FUSIBLE · TRES CIRCUITOS"],2.4,.92);
    plaque.position.set(0,2.15,-.3);p.add(plaque);
    (["ambar","azul","rojo"] as TheaterAction[]).forEach((name,i)=>{
      const hue=[0xffb65f,0x65a5ff,0xe5595c][i];
      const x=(i-1)*.46;const m=new THREE.MeshStandardMaterial({color:hue,metalness:.2,roughness:.3,emissive:hue,emissiveIntensity:.16});
      this.emitterLights.push(m);
      const button=addMesh(new THREE.CylinderGeometry(.18,.21,.22,16),m,[x,1.33,.02],p);
      this.bind(button,name);
      addMesh(new THREE.TorusGeometry(.215,.042,8,18),brass,[x,1.24,.02],p).rotation.x=Math.PI/2;
    });
    // A physical 1968 fuse on the utility shelf. It cannot be used by tapping
    // a fictitious modal — it must be taken and plugged into the 3D console.
    const fuse=new THREE.Group();fuse.name="Fusible de porcelana 1968";fuse.position.set(-5.7,.83,-8.4);
    addMesh(new RoundedBoxGeometry(.74,.08,.54,3,.025),wood,[0,-.1,0],fuse);
    const fuseBody=addMesh(new THREE.CylinderGeometry(.093,.093,.53,18),cream,[0,.13,0],fuse);
    fuseBody.rotation.z=Math.PI/2;
    for(const xx of [-.28,.28]){
      const metal=addMesh(new THREE.CylinderGeometry(.117,.117,.095,16),brass,[xx,.13,0],fuse);
      metal.rotation.z=Math.PI/2;
    }
    this.scenery.add(fuse);this.bind(fuse,"fusible");this.fusePickup=fuse;
    const socket=new THREE.Group();socket.name="Portafusible físico";socket.position.set(-.02,1.62,.46);p.add(socket);
    const socketPlate=addMesh(new RoundedBoxGeometry(.53,.35,.1,3,.05),black,[0,0,0],socket);
    socketPlate.material=mat(0x222126,.38,.45);
    addMesh(new THREE.TorusGeometry(.15,.03,8,22),brass,[0,0,.073],socket);
    this.bind(socket,"portafusible");
    const insertedFuse=new THREE.Group();insertedFuse.visible=false;
    const installedBody=addMesh(new THREE.CylinderGeometry(.095,.095,.37,16),cream,[0,0,.19],insertedFuse);
    installedBody.rotation.z=Math.PI/2;
    for(const x of [-.205,.205])addMesh(new THREE.CylinderGeometry(.12,.12,.07,14),brass,[x,0,.19],insertedFuse).rotation.z=Math.PI/2;
    socket.add(insertedFuse);this.installedFuse=insertedFuse;
    // Projector apparatus with two independent mechanical reels, prism lens and plinth.
    const pr=pedestal(7.2,-9.9);
    const fallback=new THREE.Group();pr.add(fallback);this.projectorFallback=fallback;
    const body=addMesh(new THREE.BoxGeometry(.82,.55,.68),mat(0x33363b,.39,.7),[0,1.55,0],fallback);body.rotation.y=.24;
    const reel=new THREE.Group();reel.position.set(0,1.99,.03);fallback.add(reel);this.projectorReel=reel;
    for(const x of [-.26,.27]){
      addMesh(new THREE.TorusGeometry(.3,.062,9,24),fadedGold,[x,0,0],reel);
      addMesh(new THREE.CylinderGeometry(.09,.09,.13,12),brass,[x,0,0],reel).rotation.z=Math.PI/2;
      for(let j=0;j<5;j++){const a=j*Math.PI*2/5;
        const arm=addMesh(new THREE.BoxGeometry(.2,.034,.037),fadedGold,[x+Math.cos(a)*.12,Math.sin(a)*.12,0],reel);arm.rotation.z=a;
      }
    }
    const lens=addMesh(new THREE.CylinderGeometry(.23,.15,.52,16),mat(0x525660,.22,.8),[0,1.52,-.53],fallback);lens.rotation.x=Math.PI/2;
    addMesh(new THREE.CylinderGeometry(.11,.13,.51,12),mat(0x191b29,.13,.65),[0,1.52,-.82],fallback).rotation.x=Math.PI/2;
    const reflector=new THREE.SpotLight(0xc9d9ff,0,12,Math.PI/7,.6);reflector.position.set(7.2,1.65,-10.5);
    reflector.target.position.set(0,3,-17.7);this.scene.add(reflector,reflector.target);this.projectorBeam=reflector;
    this.bind(pr,"proyector");
    // An engraved focus ring is part of the machine, not a popup.
    const focusAssembly=new THREE.Group();focusAssembly.position.set(.82,1.63,.04);pr.add(focusAssembly);
    addMesh(new THREE.CylinderGeometry(.24,.24,.16,24),mat(0x34343a,.44,.66),[0,0,0],focusAssembly).rotation.z=Math.PI/2;
    const focusKnob=addMesh(new THREE.TorusGeometry(.21,.04,8,24),brass,[.10,0,0],focusAssembly);
    focusKnob.rotation.y=Math.PI/2;this.focusKnob=focusKnob;
    for(let i=0;i<4;i++)addMesh(new THREE.SphereGeometry(.028,8,6),cream,[.115,Math.sin(i*Math.PI/2)*.17,Math.cos(i*Math.PI/2)*.17],focusAssembly);
    this.bind(focusAssembly,"enfoque");
    const mount=new THREE.Group();mount.position.set(-.56,1.94,.39);pr.add(mount);
    addMesh(new THREE.CylinderGeometry(.20,.22,.17,18),mat(0x26282b,.46,.7),[0,0,0],mount).rotation.z=Math.PI/2;
    this.bind(mount,"montar");
    const installed=new THREE.Group();installed.position.set(-.59,2.2,.08);installed.visible=false;pr.add(installed);
    addMesh(new THREE.TorusGeometry(.31,.065,9,32),brass,[0,0,0],installed);
    for(let i=0;i<6;i++){const a=i*Math.PI/3;
      const spoke=addMesh(new THREE.BoxGeometry(.32,.037,.04),fadedGold,[Math.cos(a)*.12,Math.sin(a)*.12,0],installed);
      spoke.rotation.z=a;
    }
    this.mountedReel=installed;
    const looseReel=new THREE.Group();looseReel.name="Bobina perdida";looseReel.position.set(7.93,.9,-7.52);
    addMesh(new THREE.CylinderGeometry(.19,.23,.12,22),mat(0x332a29,.59,.48),[0,-.15,0],looseReel);
    addMesh(new THREE.TorusGeometry(.26,.055,10,28),brass,[0,.08,.02],looseReel).rotation.x=Math.PI/2;
    for(let i=0;i<6;i++){const a=i*Math.PI/3;
      const spoke=addMesh(new THREE.BoxGeometry(.25,.035,.04),brass,[Math.cos(a)*.1,.10,Math.sin(a)*.1],looseReel);
      spoke.rotation.y=a;
    }
    this.scenery.add(looseReel);this.bind(looseReel,"bobina");this.reelPickup=looseReel;
    // The three combination wheels belong to the actual projector cabinet. They are
    // clickable 3D pieces, with physically located number faces.
    addMesh(new THREE.BoxGeometry(1.65,.66,.4),mat(0x2a292b,.36,.7),[0,1.13,.52],pr);
    addMesh(new THREE.BoxGeometry(1.71,.1,.48),brass,[0,1.51,.52],pr);
    for(let i=0;i<3;i++){
      const px=(i-1)*.49;
      const knurl=addMesh(new THREE.CylinderGeometry(.2,.2,.36,20),mat(0x574e47,.34,.75),[px,1.16,.78],pr);
      knurl.rotation.x=Math.PI/2;
      const faceMat=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
      const face=addMesh(new THREE.PlaneGeometry(.35,.44),faceMat,[px,1.16,1.00],pr);
      this.wheelFaces.push(faceMat);
      this.paintWheel(i);
      // Bind both the face and the mechanical wheel, not an invisible UI layer.
      this.bind(face,("rueda"+(i+1)) as TheaterAction);
      this.bind(knurl,("rueda"+(i+1)) as TheaterAction);
    }
    this.colliders.push({x:7.2,z:-9.9,rx:.72,rz:.68},{x:-7.25,z:-9.7,rx:.72,rz:.68});
    const pl=this.textPlane(["ARCHIVO BELLADONNA","CONSULTE EL RELOJ"],2.25,1.05);
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
  private buildThreatMessage(){
    const c=document.createElement("canvas");c.width=1024;c.height=256;
    const q=c.getContext("2d")!;
    q.clearRect(0,0,1024,256);
    q.textBaseline="middle";q.textAlign="center";
    q.font="bold 115px Georgia";
    q.shadowColor="#c0001d";q.shadowBlur=29;
    q.strokeStyle="rgba(80,0,13,.72)";q.lineWidth=12;
    q.strokeText("TE ESTÁN MIRANDO",512,125,960);
    q.fillStyle="#e53035";q.fillText("TE ESTÁN MIRANDO",512,125,960);
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(5.9,1.47),
      new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide,opacity:.94}));
    mesh.position.set(0,4.8,-15.52);mesh.visible=false;this.scenery.add(mesh);
    this.threatMessage=mesh;
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
    const curtainMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,metalness:0,side:THREE.DoubleSide,map:fabricTexture()});
    this.velvetMaterials.push(curtainMat);
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
  playRecoveredFilm(){
    this.filmSequenceStartedAt=this.elapsed;this.filmFrame=0;
    this.events.onEvent("film_terror");
    this.lightsDone=true;
    this.cinema?.showFilm();
    if(this.projectorBeam)this.projectorBeam.intensity=26;
    this.setScreen("CINTA 17-X-1968 · NO MIREN ARRIBA");
    this.events.onEvent("susurro");
  }
  private setScreen(text:string){
    const target=this.projectorScreen;if(!target)return;
    const material=target.material as THREE.MeshBasicMaterial;material.map?.dispose();
    material.map=labelTexture(["ARCHIVO RECUPERADO",text,"LA CLAVE ESTÁ EN EL TIEMPO"],"#fff0c6","#241f23");material.needsUpdate=true;
  }
  private buildUsher(){
    const u=this.usher;u.position.set(5.8,0,-10.95);u.name="Acomodador";
    // A single unshadowed localized key light restores readable face and
    // uniform at night without lighting the whole auditorium or requiring a flashlight.
    this.usherKey=new THREE.PointLight(0xffd2aa,19,4.7,2);
    this.usherKey.castShadow=false;
    this.scene.add(this.usherKey);
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
  private loadModel(url:string){
    const saved=this.assets.get(url);if(saved)return saved;
    const pending=this.sharedLoader.loadAsync(url).catch(error=>{this.assets.delete(url);throw error;});
    this.assets.set(url,pending);return pending;
  }
  private async loadVelvetPBR(materials:{color?:string;normal?:string;arm?:string}){
    if(!materials.color||!materials.normal||!materials.arm)return;
    try{
      const loader=new THREE.TextureLoader();
      const [color,normal,arm]=await Promise.all([
        loader.loadAsync(materials.color),loader.loadAsync(materials.normal),loader.loadAsync(materials.arm)
      ]);
      color.colorSpace=THREE.SRGBColorSpace;
      for(const texture of [color,normal,arm]){
        texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
        texture.repeat.set(2,2);
        texture.anisotropy=Math.min(4,this.renderer.capabilities.getMaxAnisotropy());
      }
      if(!this.scenery.parent){color.dispose();normal.dispose();arm.dispose();return;}
      for(const material of this.velvetMaterials){
        material.map?.dispose();
        material.map=color;material.normalMap=normal;material.roughnessMap=arm;
        material.normalScale.set(.35,.35);material.roughness=.92;material.metalness=0;
        material.needsUpdate=true;
      }
      this.velvetReady=true;
    }catch(error){console.warn("Terciopelo PBR no disponible, se conserva el tejido procedural.",error);}
  }
  private async loadDecorManifest(){
    try{
      const response=await fetch("/models/manifest.json");
      if(!response.ok)return;
      const manifest=await response.json() as {assets?:Record<string,string>;materials?:{velvet?:{color?:string;normal?:string;arm?:string}}};
      if(manifest.materials?.velvet)void this.loadVelvetPBR(manifest.materials.velvet);
      if(manifest.assets?.usher)void this.useUsherGLB(manifest.assets.usher);
      if(manifest.assets?.projector){
        void this.loadDecorGLTF(manifest.assets.projector,[7.2,1.64,-9.9],.78,Math.PI).then(model=>{
          if(!model)return;
          if(this.projectorFallback)this.projectorFallback.visible=false;
          this.projectorProfessionalLoaded=true;
          this.bind(model,"proyector");
        });
      }
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
        ["marbleBust",[7.8,1.2,-13.8],.48,0],
        ["victorianConsole",[-8.15,.72,7.9],1.4,Math.PI/2],
        ["victorianConsole",[8.15,.72,7.9],1.4,-Math.PI/2],
        ["ornateSideTable",[-8.15,.36,0.7],.73,Math.PI/2],
        ["ornateSideTable",[8.15,.36,.7],.73,-Math.PI/2]
      ] as const;
      await Promise.all(furniture.map(async ([key,position,height,angle])=>{
        const url=manifest.assets?.[key];
        if(url)await this.loadDecorGLTF(url,[...position] as THREE.Vector3Tuple,height,angle);
      }));
    }catch(err){console.warn("No se pudo cargar todo el decorado GLTF, se conserva el entorno.",err);}
  }
  private async loadDecorGLTF(url:string,where:THREE.Vector3Tuple,height:number,yaw:number){
    try{
      const gltf=await this.loadModel(url);
      const model=cloneRigged(gltf.scene);
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
      const gltf=await this.loadModel(url);
      const model=cloneRigged(gltf.scene);model.name="AcomodadorHumanoRiggeado";
      // The authored Jordan rig faces +Z. The theatre navigation and the
      // player-facing costume details use -Z as forward.
      model.rotation.y=Math.PI;
      // Scale to 2.15m and ground the feet regardless of original authoring units.
      const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3());
      model.scale.multiplyScalar(2.15/Math.max(.1,size.y));
      model.updateMatrixWorld(true);
      const newBounds=new THREE.Box3().setFromObject(model);
      model.position.y-=newBounds.min.y;
      model.traverse(o=>{if(o instanceof THREE.Mesh || o instanceof THREE.SkinnedMesh){
        o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;
      }});
      const mixer=new THREE.AnimationMixer(model);
      const idle=gltf.animations.find(a=>/idle/i.test(a.name))||gltf.animations[0];
      const walk=gltf.animations.find(a=>/relaxed.*walk|walk.*relaxed|walk/i.test(a.name))||gltf.animations[1];
      if(idle){this.usherIdle=mixer.clipAction(idle);this.usherIdle.play();}
      if(walk&&walk!==idle){
        this.usherWalk=mixer.clipAction(walk);
        this.usherWalk.setLoop(THREE.LoopRepeat,Infinity);
        this.usherWalk.setEffectiveWeight(0);
        this.usherWalk.play();
      }
      // Stable external anchor: animated root translation cannot drag the
      // feet under the theatre floor or pull the model apart from its path.
      const rigAnchor=new THREE.Group();rigAnchor.name="GroundedRigAnchor";
      rigAnchor.add(model);
      this.usher.clear();this.usher.add(rigAnchor);this.usherRigAnchor=rigAnchor;this.usherMixer=mixer;
      this.usherDirector?.dispose();
      this.usherDirector=new UsherDirector(this.usher,model,this.camera);
      // A genuinely animated second figure inhabits the physical upper box.
      // Reuse loaded GLB buffers; the ghost has a separate skeleton and mixer.
      if(this.privateBoxes[0]){
        const shadow=cloneRigged(gltf.scene);
        shadow.scale.copy(model.scale);shadow.rotation.copy(model.rotation);
        shadow.position.copy(model.position);
        shadow.traverse(node=>{
          if(node instanceof THREE.Mesh){
            node.castShadow=false;node.receiveShadow=false;
            const dark=new THREE.MeshStandardMaterial({
              color:0x140d15,emissive:0x350b21,emissiveIntensity:.43,roughness:1,
              side:THREE.DoubleSide,transparent:false
            });
            node.material=dark;
          }
        });
        const figure=new THREE.Group();figure.name="Silueta viva del PALCO 1";
        figure.position.set(.72,5.24,.84);figure.add(shadow);
        figure.visible=false;this.privateBoxes[0].add(figure);
        this.boxSpecter=figure;
        if(idle){
          const ghostMixer=new THREE.AnimationMixer(shadow);
          ghostMixer.clipAction(idle).play();this.boxSpecterMixer=ghostMixer;
        }
        if(this.phase==="proyector"||this.boxSpecterCue)this.triggerBoxSpecter();
      }
    }catch(err){console.warn("No se pudo incorporar el humano animado, se conserva el Acomodador provisional.",err);}
  }
  private setupControls(){
    const down=(e:PointerEvent)=>{
      if(!this.active)return;
      if((e.target as HTMLElement)!==this.canvas || this.dragId!==null)return;
      this.dragId=e.pointerId;this.pointerX=e.clientX;this.pointerY=e.clientY;
      this.pointerStartX=e.clientX;this.pointerStartY=e.clientY;this.pointerStartTime=performance.now();
      this.canvas.setPointerCapture(e.pointerId);
    };
    const move=(e:PointerEvent)=>{if(this.dragId!==e.pointerId||!this.active)return;
      const scale=matchMedia("(pointer:coarse)").matches?.004:.003;
      this.yaw-=(e.clientX-this.pointerX)*scale;this.pitch-=(e.clientY-this.pointerY)*scale;
      this.pitch=THREE.MathUtils.clamp(this.pitch,-1.08,1.02);
      this.pointerX=e.clientX;this.pointerY=e.clientY;
    };
    const up=(e:PointerEvent)=>{
      if(e.pointerId!==this.dragId)return;
      this.dragId=null;
      const drag=Math.hypot(e.clientX-this.pointerStartX,e.clientY-this.pointerStartY);
      if(e.type==="pointerup"&&this.active&&drag<13&&performance.now()-this.pointerStartTime<550){
        // Directly touch the actual 3D furniture/machine, not just a floating popup.
        const rect=this.canvas.getBoundingClientRect();
        const x=(e.clientX-rect.left)/rect.width*2-1;
        const y=-((e.clientY-rect.top)/rect.height*2-1);
        this.ray.setFromCamera(new THREE.Vector2(x,y),this.camera);
        for(const hit of this.ray.intersectObjects(this.targets,true)){
          let item:THREE.Object3D|null=hit.object;
          while(item&&!item.userData.action)item=item.parent;
          if(item?.userData.action&&hit.distance<=3.5){
            this.events.onAction(item.userData.action as TheaterAction);
            if(navigator.vibrate)navigator.vibrate(18);
            break;
          }
        }
      }
    };
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
    let best=1.8,ret:TheaterAction|null=null;const p=this.camera.position;
    const forward=new THREE.Vector3();this.camera.getWorldDirection(forward);
    for(const root of this.targets){
      const pos=new THREE.Vector3();root.getWorldPosition(pos);
      const toTarget=pos.clone().sub(p),dist=toTarget.length();
      if(!root.visible||!root.userData.action||dist>best||dist<.001)continue;
      if(toTarget.normalize().dot(forward)<.55)continue;
      best=dist;ret=root.userData.action as TheaterAction;
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
    const rawDt=this.clock.getDelta();
    const dt=Math.min(.05,rawDt);this.clockTime+=dt;
    if(this.active&&rawDt>0&&rawDt<5){
      this.fpsDuration+=rawDt;this.fpsSamples++;
      if(this.fpsDuration>=1.5){
        this.measuredFps=this.fpsSamples/this.fpsDuration;
        this.fpsDuration=0;this.fpsSamples=0;
      }
    }
    if(this.active){
      // Narrative events use monotonic elapsed wall time. dt is clamped only for
      // animation/physics, so a slow mobile GPU cannot delay a scare by minutes.
      this.elapsed=Math.max(this.elapsed,(performance.now()-this.startWallAt)/1000);
      this.updateMovement(dt);this.checkFocus();
      if(this.entranceDoors.length&&!this.entranceClosed){
        const eased=THREE.MathUtils.smoothstep(this.elapsed,.35,1.75);
        for(let i=0;i<2;i++){
          const side=i===0?-1:1;
          this.entranceDoors[i].rotation.y=(-side*1.35)*(1-eased);
        }
        if(eased>=1){this.entranceClosed=true;if(!this.entranceSlam){this.entranceSlam=true;this.events.onEvent("portazo");}}
      }
      this.camera.getWorldDirection(this.forwardScratch);const p=this.camera.position,dir=this.forwardScratch;
      this.updateWarning();this.updateBoxSpecter(dt);
      this.events.onListener(p.x,p.y,p.z,dir.x,dir.y,dir.z,this.usher.position.x,this.usher.position.y+1,this.usher.position.z);
      if(this.elapsed>52&&!this.eventDone&&this.phase!=="final"){
        this.eventDone=true;this.events.onEvent("apagón");
        if(this.threatMessage)this.threatMessage.visible=true;
        this.usher.position.set(-1.4,0,-10.9);this.usherGoal.set(-1.4,0,-10.9);
      }
      if(this.elapsed>this.nextScareAt&&!this.ended){
        this.nextScareAt+=39;
        this.events.onEvent("susurro");
        this.boxSpecterCue&&this.boxSpecterVisible&&(this.boxGazeSeconds+=.04);
      }
      const actorMoving=this.warningStage!=="apparition" && this.warningStage!=="silence" && this.usher.position.distanceToSquared(this.usherGoal)>.06;
      if(this.usherIdle&&this.usherWalk&&this.usherWalking!==actorMoving){
        const previous=this.usherWalking?this.usherWalk:this.usherIdle;
        const next=actorMoving?this.usherWalk:this.usherIdle;
        next.reset().play();previous.crossFadeTo(next,.34,false);
        this.usherWalking=actorMoving;
      }
      if(actorMoving){
        const distance=this.usher.position.distanceTo(this.usherGoal);
        // Fixed world-space stride (m/s) instead of an exponential lerp that
        // stalls near the destination. Damped turning prevents instant pivots.
        // Walk across the clear corridor in front of the stage. Do not use
        // a straight-line root transform that cuts through the stage facade.
        const destination=this.usherGoal.clone();
        destination.y=0;
        destination.z=Math.max(-11.10,destination.z);
        const direction=destination.sub(this.usher.position);
        const targetDistance=direction.length();
        if(targetDistance>.0001){
          const stride=Math.min(targetDistance,dt*1.24);
          const nx=this.usher.position.x+direction.x/targetDistance*stride;
          const nz=this.usher.position.z+direction.z/targetDistance*stride;
          const desiredYaw=Math.atan2(direction.x,-direction.z);
          const yawError=Math.atan2(Math.sin(desiredYaw-this.usher.rotation.y),Math.cos(desiredYaw-this.usher.rotation.y));
          this.usher.rotation.y+=yawError*(1-Math.exp(-4.3*dt));
          if(this.usherWalkable(nx,nz)){
            this.usher.position.set(nx,0,nz);
          }else{
            // Keep the actor away from the obstacle and the stage edge.
            const xCan=this.usherWalkable(nx,this.usher.position.z);
            const zCan=this.usherWalkable(this.usher.position.x,nz);
            if(xCan)this.usher.position.x=nx;
            else if(zCan)this.usher.position.z=nz;
          }
        }
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
    this.cinema?.update(dt);
    if(this.filmSequenceStartedAt>=0&&this.phase!=="final"){
      const age=this.elapsed-this.filmSequenceStartedAt;
      const frames=["CINTA 17-X-1968 · ARCHIVO 83","FILA 3 · ASIENTO 8 · VACÍO",
        "EL PALCO 1 ESTÁ OCUPADO","TODAVÍA QUEDA UN ESPECTADOR"];
      const index=Math.min(frames.length-1,Math.floor(age/1.4));
      if(index!==this.filmFrame){this.filmFrame=index;this.setScreen(frames[index]);}
      if(age>=6.8)this.filmSequenceStartedAt=-1;
    }
    if(this.usherKey){
      const angle=this.usher.rotation.y;
      const cx=Math.cos(angle),sx=Math.sin(angle);
      this.usherKey.position.set(
        this.usher.position.x+.73*cx-1.05*sx,
        this.usher.position.y+2.02,
        this.usher.position.z-.73*sx-1.05*cx
      );
      this.usherKey.intensity=this.ended?8:19;
    }
    if(this.warningLight)this.warningLight.intensity=4.7+Math.sin(this.clockTime*9)*.6;
    if(this.warningFlash>0){this.warningFlash=Math.max(0,this.warningFlash-dt);this.renderer.toneMappingExposure=1.32+this.warningFlash*2.4;}
    else if(this.renderer.toneMappingExposure!==1.32)this.renderer.toneMappingExposure=1.32;
    this.usherDirector?.beforeAnimation();
    this.usherMixer?.update(dt);
    this.boxSpecterMixer?.update(dt);
    this.usherDirector?.update(dt,this.active&&!this.ended);
    this.usherDirector?.correctFootContact(dt);
    this.decorMixers.forEach(m=>m.update(dt));
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
    this.cinema?.dispose();
    this.usherDirector?.dispose();this.usherDirector=undefined;
    this.usherKey?.parent?.remove(this.usherKey);this.usherKey=undefined;
    this.warningLight?.parent?.remove(this.warningLight);this.warningLight=undefined;
    this.scenery.traverse(obj=>{if(obj instanceof THREE.Mesh||obj instanceof THREE.InstancedMesh){obj.geometry.dispose();const a=Array.isArray(obj.material)?obj.material:[obj.material];
      a.forEach(m=>{if("map" in m&&(m as any).map)(m as any).map.dispose();m.dispose();});}});
    this.renderer.dispose();this.canvas.remove();
  }
}
