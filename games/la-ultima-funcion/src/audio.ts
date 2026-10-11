type SoundKind="click"|"found"|"wrong"|"scare"|"success"|"steps"|"curtain"|"whisper"|"applause"|"door";
type Vec3=[number,number,number];
export class TheaterAudio{
  private ctx:AudioContext|null=null;
  private master:GainNode|null=null;
  private ambientBus:GainNode|null=null;
  private quietUntil=0;
  private pendingVoice?:SpeechSynthesisUtterance;
  private ambience:OscillatorNode[]=[];
  private metronome:number|null=null;
  private musicSource?:AudioBufferSourceNode;
  private musicLevel?:GainNode;
  private finalAct=false;
  private noise?:AudioBuffer;
  private recordings:Partial<Record<"footstep"|"door",AudioBuffer>>={};
  private muted=false;
  private listener:Vec3=[0,1.64,13.1];
  private usherPosition:Vec3=[-2,1,-10.5];
  private listenerForward:Vec3=[0,0,-1];
  unlock(){
    if(this.ctx){void this.ctx.resume();return;}
    const ctx=new AudioContext();this.ctx=ctx;
    const master=ctx.createGain();master.gain.value=.55;master.connect(ctx.destination);this.master=master;
    const ambientBus=ctx.createGain();ambientBus.gain.value=1;ambientBus.connect(master);this.ambientBus=ambientBus;
    for(const [frequency,amp] of [[55,.019],[82.41,.012],[110.7,.005]]){
      const osc=ctx.createOscillator();osc.type="sine";osc.frequency.value=frequency;
      const gain=ctx.createGain();gain.gain.value=amp;osc.connect(gain);gain.connect(ambientBus);osc.start();this.ambience.push(osc);
    }
    // A generated, low-frequency air bed: no copyrighted recordings or browser autoplay problem.
    const buffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),data=buffer.getChannelData(0);
    let last=0,seed=1968;
    for(let i=0;i<data.length;i++){
      seed=(1664525*seed+1013904223)>>>0;
      last=(last+.016*((seed/4294967295)*2-1))/1.016;data[i]=last*2.9;
    }
    this.noise=buffer;
    // Dissonant, low orchestral pedal with almost imperceptible tremolo.
    for(const hz of [82.41,103.83,123.47]){
      const strings=ctx.createOscillator();strings.type="sawtooth";strings.frequency.value=hz;
      const low=ctx.createBiquadFilter();low.type="lowpass";low.frequency.value=275;
      const gain=ctx.createGain();gain.gain.value=.005;
      const lfo=ctx.createOscillator();lfo.frequency.value=.13+hz/1000;
      const depth=ctx.createGain();depth.gain.value=.003;
      lfo.connect(depth);depth.connect(gain.gain);
      strings.connect(low);low.connect(gain);gain.connect(ambientBus);
      strings.start();lfo.start();this.ambience.push(strings,lfo);
    }
    // A diegetic clock placed by the entrance, rather than a global timer beep.
    this.metronome=window.setInterval(()=>{
      if(!this.ctx||this.ctx.state!=="running"||this.muted||this.ctx.currentTime<this.quietUntil)return;
      this.tone(1240,630,this.ctx.currentTime,.049,"triangle",.038,[-8.35,1.6,13.25]);
    },1130);
    const bed=ctx.createBufferSource();bed.buffer=buffer;bed.loop=true;
    const low=ctx.createBiquadFilter();low.type="lowpass";low.frequency.value=220;
    const vol=ctx.createGain();vol.gain.value=.095;
    bed.connect(low);low.connect(vol);vol.connect(ambientBus);bed.start();
    void this.loadLicensedMusic(ctx,ambientBus);
    void this.loadRecordedSfx(ctx);
  }
  private async loadLicensedMusic(ctx:AudioContext,master:GainNode){
    try{
      // Optional recording, verified CC0. A synthesized bed remains when missing
      // or when the browser cannot decode Vorbis (older iOS releases).
      const prefix=import.meta.env.BASE_URL||"/";
      const response=await fetch(prefix+"audio/lost.ogg");
      if(!response.ok) return;
      const payload=await response.arrayBuffer();
      if(this.ctx!==ctx)return;
      const buffer=await ctx.decodeAudioData(payload);
      if(this.ctx!==ctx)return;
      const source=ctx.createBufferSource(),level=ctx.createGain();
      source.buffer=buffer;source.loop=true;
      level.gain.setValueAtTime(0,ctx.currentTime);
      level.gain.setTargetAtTime(this.finalAct ? 0.025 : 0.17,ctx.currentTime,1.6);
      source.connect(level);level.connect(master);source.start();
      this.musicSource=source;this.musicLevel=level;
    }catch(error){
      console.info("La música CC0 no está disponible; continúa el ambiente sintetizado.",error);
    }
  }
  setScene(scene:"inicio"|"luces"|"proyector"|"telon"|"final"){
    this.finalAct=scene==="final";
    const ctx=this.ctx,level=this.musicLevel;
    if(ctx&&level)level.gain.setTargetAtTime(this.finalAct ? 0.025 : 0.17,ctx.currentTime,.7);
  }
  private async loadRecordedSfx(ctx:AudioContext){
    const base=import.meta.env.BASE_URL||"/";
    await Promise.all((["footstep","door"] as const).map(async(key)=>{
      try{
        const result=await fetch(base+"audio/"+key+".ogg");
        if(!result.ok)return;
        const bytes=await result.arrayBuffer();
        const buffer=await ctx.decodeAudioData(bytes);
        if(this.ctx===ctx)this.recordings[key]=buffer;
      }catch{ /* The synthesized fallback works on browsers without Ogg Vorbis. */ }
    }));
  }
  private playRecording(key:"footstep"|"door",position:Vec3,volume=.8,delay=0){
    const buffer=this.recordings[key],ctx=this.ctx;
    if(!buffer||!ctx)return false;
    const at=ctx.currentTime+delay;
    const out=this.output(position);if(!out)return false;
    const source=ctx.createBufferSource();source.buffer=buffer;
    const gain=ctx.createGain();gain.gain.value=volume;
    source.connect(gain);gain.connect(out);
    source.start(at);
    source.onended=()=>{source.disconnect();gain.disconnect();if(out instanceof PannerNode)out.disconnect();};
    return true;
  }
  updateListener(x:number,y:number,z:number,fx:number,fy:number,fz:number,ux:number,uy:number,uz:number){
    this.usherPosition=[ux,uy,uz];this.listener=[x,y,z];this.listenerForward=[fx,fy,fz];
    const ctx=this.ctx;if(!ctx)return;
    const l=ctx.listener,time=ctx.currentTime;
    if(l.positionX){
      l.positionX.setTargetAtTime(x,time,.04);l.positionY.setTargetAtTime(y,time,.04);l.positionZ.setTargetAtTime(z,time,.04);
      l.forwardX.setTargetAtTime(fx,time,.04);l.forwardY.setTargetAtTime(fy,time,.04);l.forwardZ.setTargetAtTime(fz,time,.04);
      l.upX.setValueAtTime(0,time);l.upY.setValueAtTime(1,time);l.upZ.setValueAtTime(0,time);
    }else{l.setPosition(x,y,z);l.setOrientation(fx,fy,fz,0,1,0);}
  }
  setMuted(value:boolean){this.muted=value;if(this.master&&this.ctx)this.master.gain.setTargetAtTime(value?0:.55,this.ctx.currentTime,.03);}
  isMuted(){return this.muted;}
  silenceFor(seconds:number){
    const ctx=this.ctx,bus=this.ambientBus;if(!ctx||!bus)return;
    const at=ctx.currentTime;
    const duration=Math.max(.2,Math.min(4,seconds));
    this.quietUntil=at+duration;
    bus.gain.cancelScheduledValues(at);
    bus.gain.setValueAtTime(bus.gain.value,at);
    bus.gain.linearRampToValueAtTime(.0001,at+.15);
    bus.gain.setValueAtTime(.0001,at+duration);
    bus.gain.linearRampToValueAtTime(1,at+duration+.95);
  }
  speakWarning(text="Disculpe… ese no es su asiento."){
    // Narration fallback when no licensed studio recording is installed.
    // Browser voices differ by device; text is always subtitled by the UI.
    if(this.muted||typeof window==="undefined"||!("speechSynthesis" in window))return false;
    try{
      const synth=window.speechSynthesis;
      const available=synth.getVoices().filter(v=>v.lang.toLowerCase().startsWith("es"));
      const preferred=available.find(v=>v.lang.toLowerCase()==="es-ar")||
        available.find(v=>v.lang.toLowerCase().startsWith("es-es"))||available[0];
      synth.cancel();
      const utterance=new SpeechSynthesisUtterance(text);
      utterance.lang=preferred?.lang||"es-AR";if(preferred)utterance.voice=preferred;utterance.rate=.77;utterance.pitch=.68;utterance.volume=.86;
      this.pendingVoice=utterance;
      utterance.onend=()=>{if(this.pendingVoice===utterance)this.pendingVoice=undefined;};
      synth.speak(utterance);return true;
    }catch{return false;}
  }
  play(kind:SoundKind="click"){
    const ctx=this.ctx,master=this.master;if(!ctx||!master)return;
    const at=ctx.currentTime;
    if(kind==="door"){
      const pos:[number,number,number]=[0,1.7,15.7];
      if(this.playRecording("door",pos,.95))return;
      this.breath(at,.31,.6,pos,96);
      this.tone(108,45,at,.6,"triangle",.38,pos);
      this.tone(620,135,at+.05,.19,"triangle",.07,pos);
      return;
    }
    if(kind==="steps"){
      if(this.recordings.footstep){
        for(let i=0;i<3;i++)this.playRecording("footstep",[this.usherPosition[0]+(i%2?-.17:.17),this.usherPosition[1]-.85,this.usherPosition[2]],.55,i*.31);
        return;
      }
      for(let i=0;i<3;i++){
        const loc=this.usherPosition;
        this.tone(75+i*4,43,at+i*.33,.18,"triangle",.26,[loc[0],loc[1]-.9,loc[2]]);
        this.breath(at+i*.33,.09,.13,[loc[0],loc[1]-.9,loc[2]],160);
      }
      return;
    }
    if(kind==="whisper"){
      // Binaural impression: a filtered exhalation follows the player from just behind.
      const [x,y,z]=this.listener,[fx,,fz]=this.listenerForward;
      this.breath(at,.85,.37,[x-fx*1.15,y,z-fz*1.15],790);
      this.tone(110,81,at,.6,"sine",.05,[x-fx*1.15,y,z-fz*1.15]);
      return;
    }
    if(kind==="applause"){
      for(let i=0;i<32;i++){
        const x=Math.sin(i*12.9898)*7.1;
        const z=3.5+(i%8);
        this.breath(at+i*.065,.16,.14,[x,1.5,z],1450);
      }
      return;
    }
    if(kind==="curtain"){
      for(let i=0;i<9;i++)this.tone(80+i*10,53,at+i*.11,.24,"sawtooth",.04,[0,1,-14]);
      return;
    }
    const defs:{
      [key in "click"|"found"|"wrong"|"scare"|"success"]:readonly [number,number,number,OscillatorType,number]
    }={
      click:[690,420,.07,"triangle",.12],
      found:[460,880,.4,"sine",.17],
      wrong:[190,89,.28,"sawtooth",.09],
      scare:[91,39,.85,"sawtooth",.14],
      success:[440,880,1.5,"sine",.14]
    };
    const d=defs[kind];this.tone(d[0],d[1],at,d[2],d[3],d[4]);
    if(kind==="scare")this.breath(at,.43,.28,[0,1,-5],120);
    if(kind==="success"){
      this.tone(550,1100,at+.2,1.35,"sine",.1);
      this.tone(660,1320,at+.43,1.1,"sine",.075);
    }
  }
  private output(location?:Vec3){
    if(!this.ctx||!this.master)return null;
    if(!location)return this.master;
    const p=this.ctx.createPanner();
    p.panningModel="HRTF";p.distanceModel="inverse";p.refDistance=1.5;p.maxDistance=30;p.rolloffFactor=.8;
    p.positionX.value=location[0];p.positionY.value=location[1];p.positionZ.value=location[2];
    p.connect(this.master);return p;
  }
  private breath(at:number,length:number,vol:number,location:Vec3,freq:number){
    if(!this.ctx||!this.noise)return;
    const ctx=this.ctx,out=this.output(location);if(!out)return;
    const source=ctx.createBufferSource();source.buffer=this.noise;source.loop=true;
    const filter=ctx.createBiquadFilter();filter.type="bandpass";filter.frequency.value=freq;filter.Q.value=.5;
    const g=ctx.createGain();g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(Math.max(.0001,vol),at+.025);
    g.gain.exponentialRampToValueAtTime(.0001,at+length);
    source.connect(filter);filter.connect(g);g.connect(out);source.start(at);source.stop(at+length+.02);
    source.onended=()=>{source.disconnect();filter.disconnect();g.disconnect();if(out instanceof PannerNode)out.disconnect();};
  }
  private tone(from:number,to:number,at:number,length:number,wave:OscillatorType,vol:number,location?:Vec3){
    if(!this.ctx)return;const out=this.output(location);if(!out)return;
    const ctx=this.ctx,osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type=wave;osc.frequency.setValueAtTime(from,at);osc.frequency.exponentialRampToValueAtTime(Math.max(1,to),at+length);
    gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(vol,at+.018);
    gain.gain.exponentialRampToValueAtTime(.0001,at+length);
    osc.connect(gain);gain.connect(out);osc.start(at);osc.stop(at+length+.02);
    osc.onended=()=>{osc.disconnect();gain.disconnect();if(out instanceof PannerNode)out.disconnect();};
  }
  dispose(){if(typeof window!=="undefined"&&this.pendingVoice&&"speechSynthesis" in window)window.speechSynthesis.cancel();this.pendingVoice=undefined;if(this.metronome!==null)window.clearInterval(this.metronome);this.metronome=null;try{this.musicSource?.stop();}catch{}this.musicSource=undefined;this.musicLevel=undefined;this.ambience.forEach(o=>{try{o.stop();}catch{}});void this.ctx?.close();this.ctx=null;}
}
