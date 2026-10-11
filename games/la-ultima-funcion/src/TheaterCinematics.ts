import * as THREE from "three";

/** Cinematic but clue-safe theatrical lighting (no flashlight needed). */
export type Act="inicio"|"luces"|"proyector"|"telon"|"final";
const ease=(value:number,target:number,dt:number,speed=2.1)=>
  THREE.MathUtils.lerp(value,target,1-Math.exp(-speed*dt));

export class TheaterCinematics{
  private stageSpot:THREE.SpotLight;
  private stageBounce:THREE.PointLight;
  private filmSpot:THREE.SpotLight;
  private beam:THREE.Mesh<THREE.CylinderGeometry,THREE.ShaderMaterial>;
  private act:Act="inicio";
  private circuits=0;
  private film=false;
  private seconds=0;
  private stageColor=new THREE.Color(0xffd8af);
  private targetColor=new THREE.Color(0xffd8af);
  private defaultStageIntensity:number;
  private defaultBounceIntensity:number;

  constructor(scene:THREE.Scene,stageSpot:THREE.SpotLight,stageBounce:THREE.PointLight,filmSpot:THREE.SpotLight){
    this.stageSpot=stageSpot;this.stageBounce=stageBounce;this.filmSpot=filmSpot;
    this.defaultStageIntensity=stageSpot.intensity;this.defaultBounceIntensity=stageBounce.intensity;
    const source=new THREE.Vector3(7.2,1.65,-10.5),destination=new THREE.Vector3(0,3.1,-18.8);
    const axis=destination.clone().sub(source);
    const geometry=new THREE.CylinderGeometry(.10,2.8,axis.length(),32,1,true);
    const material=new THREE.ShaderMaterial({
      transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide,
      blending:THREE.AdditiveBlending,
      uniforms:{uAmount:{value:0},uPulse:{value:0}},
      vertexShader:"varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
      fragmentShader:"uniform float uAmount; uniform float uPulse; varying vec2 vUv; void main(){float nearLight=1.0-smoothstep(.60,.98,vUv.y);float rim=pow(abs(sin(vUv.x*6.28318)),.65);float slice=smoothstep(0.,.11,vUv.y)*(1.-smoothstep(.88,1.,vUv.y));float alpha=uAmount*(.023+.025*rim)*nearLight*slice*(.92+.08*uPulse);gl_FragColor=vec4(.60,.72,1.,alpha);}"
    });
    const beam=new THREE.Mesh(geometry,material);
    beam.position.copy(source).add(destination).multiplyScalar(.5);
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),source.clone().sub(destination).normalize());
    beam.frustumCulled=false;scene.add(beam);this.beam=beam;
  }
  setAct(next:Act){
    this.act=next;
    if(next==="luces")this.targetColor.set(0xffd9ab);
    if(next==="proyector")this.targetColor.set(0x8a9bdb);
    if(next==="telon")this.targetColor.set(0xb4b0d5);
    if(next==="final")this.targetColor.set(0xffd19b);
  }
  activateCircuit(which:number){
    this.circuits=Math.max(this.circuits,which+1);
    if(this.circuits===1)this.targetColor.set(0xffb06b);
    if(this.circuits===2)this.targetColor.set(0x9db4e8);
    if(this.circuits>=3)this.targetColor.set(0xd798b2);
  }
  resetCircuits(){this.circuits=0;this.targetColor.set(0xffd8af);}
  showFilm(){this.film=true;this.targetColor.set(0x91a1e6);}
  update(dt:number){
    this.seconds+=dt;
    const finale=this.act==="final",filmRunning=this.film&&!finale;
    const oscillation=Math.sin(this.seconds*13.2)*Math.sin(this.seconds*2.4);
    const focusX=filmRunning?Math.sin(this.seconds*.31)*.32:Math.sin(this.seconds*.13)*.45;
    this.stageSpot.target.position.x=focusX;this.stageSpot.target.updateMatrixWorld();
    const targetIntensity=finale?166:filmRunning?93:this.circuits?110:this.defaultStageIntensity;
    this.stageSpot.intensity=ease(this.stageSpot.intensity,targetIntensity,dt,.75);
    this.stageBounce.intensity=ease(this.stageBounce.intensity,finale?33:filmRunning?14:this.defaultBounceIntensity,dt,.9);
    this.stageColor.lerp(this.targetColor,1-Math.exp(-1.6*dt));
    this.stageSpot.color.copy(this.stageColor);
    this.filmSpot.intensity=ease(this.filmSpot.intensity,filmRunning?24:0,dt,2.4);
    this.beam.material.uniforms.uAmount.value=ease(this.beam.material.uniforms.uAmount.value,filmRunning?1:0,dt,2.1);
    this.beam.material.uniforms.uPulse.value=oscillation;
    if(filmRunning)this.stageSpot.intensity*=1+THREE.MathUtils.clamp(oscillation*.018,-.025,.025);
    if(finale)this.beam.material.uniforms.uAmount.value*=Math.max(0,1-dt*2);
  }
  dispose(){this.beam.parent?.remove(this.beam);this.beam.geometry.dispose();this.beam.material.dispose();}
}
