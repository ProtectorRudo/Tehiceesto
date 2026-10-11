import * as THREE from "three";

/**
 * Belladonna usher art direction.
 * Works on the existing rigged GLB: never replaces skinning or AnimationMixer.
 * A restrained theatre cap and brass insignia attach to animated skeleton bones.
 * Bone offsets are applied AFTER the mixer, so walking / idle animations survive.
 */
export class UsherDirector {
  readonly head:THREE.Bone|null;
  readonly neck:THREE.Bone|null;
  readonly chest:THREE.Bone|null;
  readonly accessories:THREE.Group[]=[];
  private readonly root:THREE.Group;
  private readonly model:THREE.Object3D;
  private readonly camera:THREE.Camera;
  private yaw=0;
  private eyeContact=false;
  private readonly localCamera=new THREE.Vector3();
  private readonly relative=new THREE.Vector3();
  private readonly headWorld=new THREE.Vector3();
  private readonly cameraFacing=new THREE.Vector3();
  private readonly towardHead=new THREE.Vector3();
  private readonly rot=new THREE.Quaternion();
  private readonly inverseDelta=new THREE.Quaternion();
  private readonly previousNeckDelta=new THREE.Quaternion();
  private readonly previousHeadDelta=new THREE.Quaternion();
  private readonly previousBreathDelta=new THREE.Quaternion();
  private appliedLastFrame=false;
  private readonly up=new THREE.Vector3(0,1,0);
  private readonly side=new THREE.Vector3(1,0,0);
  private readonly dirtyMaterials:THREE.Material[]=[];
  private readonly capTexture:THREE.Texture;

  constructor(root:THREE.Group,model:THREE.Object3D,camera:THREE.Camera){
    this.root=root;this.model=model;this.camera=camera;
    const bones:THREE.Bone[]=[];
    model.traverse(object=>{
      if(object instanceof THREE.Bone)bones.push(object);
    });
    const find=(names:RegExp[])=>bones.find(b=>names.some(p=>p.test(b.name)))||null;
    this.head=find([/(^|[_\s:])head($|[_\s:])/i,/head/i]);
    this.neck=find([/(^|[_\s:])neck($|[_\s:])/i,/neck/i]);
    this.chest=find([/(^|[_\s:])spine.?2/i,/(^|[_\s:])chest($|[_\s:])/i,/spine.?1/i,/spine/i]);
    this.capTexture=this.makeInsignia();
    model.updateMatrixWorld(true);
    this.restyleExistingOutfit();
    this.createUniformAccents();
  }

  private restyleExistingOutfit(){
    // Recolor only unambiguous clothing slots. Never tint a combined
    // skin/head/clothes mesh or modify shared GLTF materials.
    const clothing=/(coat|jacket|vest|blazer|uniform|suit|shirt|trouser|pants|boots?|shoes?|clothing)/i;
    const skin=/(skin|face|hand|body|eyelash|hair|teeth|mouth|eye\b)/i;
    this.model.traverse(node=>{
      if(!(node instanceof THREE.Mesh))return;
      const slots=Array.isArray(node.material)?node.material:[node.material];
      const updated=slots.map(mat=>{
        if(!(mat instanceof THREE.MeshStandardMaterial))return mat;
        const name=(node.name+" "+mat.name).toLowerCase();
        if(!clothing.test(name)||skin.test(name))return mat;
        const copy=mat.clone();
        if(/boot|shoe|trouser|pants/.test(name)){
          copy.color.multiply(new THREE.Color(0x76717b));
          copy.roughness=Math.max(.73,copy.roughness);
        }else{
          copy.color.multiply(new THREE.Color(0x824c58));
          copy.roughness=Math.max(.76,copy.roughness);
          copy.metalness=Math.min(.18,copy.metalness);
        }
        copy.needsUpdate=true;
        this.dirtyMaterials.push(copy);
        return copy;
      });
      node.material=Array.isArray(node.material)?updated:updated[0];
    });
  }

  private makeInsignia(){
    const canvas=document.createElement("canvas");canvas.width=256;canvas.height=256;
    const ctx=canvas.getContext("2d")!;
    ctx.clearRect(0,0,256,256);
    const gold=ctx.createRadialGradient(118,80,5,128,128,130);
    gold.addColorStop(0,"#f4d89e");gold.addColorStop(.47,"#c39a50");gold.addColorStop(1,"#594228");
    ctx.fillStyle=gold;
    ctx.beginPath();ctx.moveTo(128,17);ctx.bezierCurveTo(170,43,204,55,206,104);
    ctx.bezierCurveTo(205,163,162,210,128,242);
    ctx.bezierCurveTo(94,210,51,163,50,104);
    ctx.bezierCurveTo(51,55,86,43,128,17);ctx.fill();
    ctx.strokeStyle="#2a1c21";ctx.lineWidth=8;ctx.stroke();
    ctx.fillStyle="#381b25";ctx.font="bold 94px Georgia";ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillText("B",128,131);
    ctx.font="bold 22px Georgia";ctx.fillText("1968",128,186);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    texture.anisotropy=4;return texture;
  }

  private createUniformAccents(){
    // Small accessories are shaped surfaces, not body-replacement cubes.
    const burgundy=new THREE.MeshStandardMaterial({color:0x371a27,roughness:.82,metalness:.08,side:THREE.DoubleSide});
    const brim=new THREE.MeshStandardMaterial({color:0x21161b,roughness:.62,metalness:.1});
    const piping=new THREE.MeshStandardMaterial({color:0xa98752,roughness:.37,metalness:.72});
    this.dirtyMaterials.push(burgundy,brim,piping);
    const geometry=new THREE.LatheGeometry([
      new THREE.Vector2(0,.13),new THREE.Vector2(.16,.135),
      new THREE.Vector2(.205,.105),new THREE.Vector2(.215,-.04),
      new THREE.Vector2(.215,-.07),new THREE.Vector2(.26,-.095),
      new THREE.Vector2(.28,-.13),new THREE.Vector2(.28,-.15),
      new THREE.Vector2(.14,-.15),new THREE.Vector2(0,-.15)
    ],32);
    const cap=new THREE.Group();cap.name="BelladonnaUniformCap";
    // The cap must frame the face, not look like a wide-brimmed mushroom hat.
    cap.scale.setScalar(.69);
    const shell=new THREE.Mesh(geometry,burgundy);shell.castShadow=true;cap.add(shell);
    const peak=new THREE.Mesh(new THREE.SphereGeometry(1,24,10,0,Math.PI*2,0,Math.PI*.5),brim);
    peak.scale.set(.25,.025,.15);peak.position.set(0,-.153,-.18);
    cap.add(peak);
    const cord=new THREE.Mesh(new THREE.TorusGeometry(.218,.008,6,40),piping);
    cord.rotation.x=Math.PI/2;cord.position.y=-.092;cap.add(cord);
    const crest=new THREE.Mesh(new THREE.PlaneGeometry(.105,.12),new THREE.MeshBasicMaterial({
      map:this.capTexture,transparent:true,depthWrite:false,side:THREE.DoubleSide
    }));
    crest.position.set(0,-.008,-.221);cap.add(crest);
    this.dirtyMaterials.push(crest.material);
    this.attachAtHead(cap);
    this.accessories.push(cap);

    // The brass badge follows the ribcage, not the head.
    if(this.chest){
      const badge=new THREE.Group();badge.name="BelladonnaUsherBadge";
      const insignia=new THREE.Mesh(new THREE.PlaneGeometry(.12,.13),new THREE.MeshStandardMaterial({
        map:this.capTexture,transparent:true,roughness:.45,metalness:.27,side:THREE.DoubleSide
      }));
      this.dirtyMaterials.push(insignia.material);
      insignia.castShadow=true;badge.add(insignia);
      this.model.updateMatrixWorld(true);
      const bounds=new THREE.Box3().setFromObject(this.model);
      const chestWorld=this.chest.getWorldPosition(new THREE.Vector3());
      badge.position.set(chestWorld.x+.16,bounds.min.y+bounds.getSize(new THREE.Vector3()).y*.7,chestWorld.z-.17);
      this.chest.attach(badge);
      this.accessories.push(badge);
    }
  }

  private attachAtHead(cap:THREE.Group){
    this.model.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromObject(this.model);
    const top=bounds.max.y;
    const bone=this.head||this.neck;
    const p=bone?.getWorldPosition(new THREE.Vector3())||bounds.getCenter(new THREE.Vector3());
    cap.position.set(p.x,top+.095,p.z+.065);
    if(bone)bone.attach(cap);else this.model.attach(cap);
  }

  beforeAnimation(){
    // The animation clip may not key every head/neck joint. Remove only our
    // previous additive offsets before AnimationMixer updates; otherwise the
    // unkeyed bone accumulates rotation and eventually spins unnaturally.
    if(!this.appliedLastFrame)return;
    if(this.head){
      this.head.quaternion.multiply(this.inverseDelta.copy(this.previousBreathDelta).invert());
      this.head.quaternion.multiply(this.inverseDelta.copy(this.previousHeadDelta).invert());
    }
    if(this.neck)this.neck.quaternion.multiply(this.inverseDelta.copy(this.previousNeckDelta).invert());
    this.appliedLastFrame=false;
  }

  update(dt:number,observing:boolean){
    const targetWorld=this.camera.position;
    this.root.updateMatrixWorld(true);
    const head=this.head||this.neck;
    if(!head)return;
    head.getWorldPosition(this.headWorld);
    this.localCamera.copy(targetWorld);
    this.root.worldToLocal(this.localCamera);
    this.relative.copy(this.headWorld);
    this.root.worldToLocal(this.relative);
    this.relative.sub(this.localCamera);
    const distance=this.headWorld.distanceTo(targetWorld);
    this.camera.getWorldDirection(this.cameraFacing);
    this.towardHead.copy(this.headWorld).sub(targetWorld).normalize();
    const visibleToPlayer=this.cameraFacing.dot(this.towardHead)>.66;
    const gazeEnabled=observing&&visibleToPlayer&&distance<9.2&&distance>1.1;
    const target=gazeEnabled?THREE.MathUtils.clamp(
      Math.atan2(-this.relative.x,this.relative.z),-.38,.38
    ):Math.sin(performance.now()*.0004)*.055;
    this.yaw=THREE.MathUtils.damp(this.yaw,target,1.55,dt);
    this.eyeContact=gazeEnabled&&Math.abs(this.yaw)>.02;
    // AnimationMixer is updated first by caller. Offset each animated quaternion
    // with a subtle neck / head look direction and breathing, retaining walks.
    if(this.neck){
      this.previousNeckDelta.setFromAxisAngle(this.up,this.yaw*.34);
      this.neck.quaternion.multiply(this.previousNeckDelta);
    }
    if(this.head){
      this.previousHeadDelta.setFromAxisAngle(this.up,this.yaw*.66);
      this.head.quaternion.multiply(this.previousHeadDelta);
      this.previousBreathDelta.setFromAxisAngle(this.side,Math.sin(performance.now()*.0017)*.025);
      this.head.quaternion.multiply(this.previousBreathDelta);
    }
    this.appliedLastFrame=true;
  }

  getStatus(){
    return {headBone:!!(this.head||this.neck),chestBone:!!this.chest,
      periodCap:this.accessories.some(a=>a.name==="BelladonnaUniformCap"),
      insignia:this.accessories.some(a=>a.name==="BelladonnaUsherBadge"),
      eyeContact:this.eyeContact,rigOffset:Math.abs(this.yaw)};
  }

  dispose(){
    for(const group of this.accessories){
      group.traverse(node=>{
        if(node instanceof THREE.Mesh)node.geometry.dispose();
      });
      group.removeFromParent();
    }
    this.accessories.length=0;
    this.capTexture.dispose();
    for(const mat of this.dirtyMaterials)mat.dispose();
  }
}
