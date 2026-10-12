export class AudioEngine {
  private context:AudioContext|null=null;
  private master:GainNode|null=null;
  private ambience:OscillatorNode[]=[];
  private interval:number|null=null;
  private playing=false;
  private rushing=false;
  private enabled=true;
  private voice:HTMLAudioElement|null=null;
  async start(){
    if(!this.context){
      this.context=new AudioContext();
      this.master=this.context.createGain();this.master.gain.value=.18;
      this.master.connect(this.context.destination);
    }
    await this.context.resume();this.enabled=true;
    if(!this.playing){
      this.playing=true;
      for(const freq of [110,164.81,220]){
        const osc=this.context.createOscillator();osc.type='sine';osc.frequency.value=freq;
        const gain=this.context.createGain();gain.gain.value=.018;
        osc.connect(gain).connect(this.master!);osc.start();this.ambience.push(osc);
      }
      let index=0;
      const notes=[329.63,392,440,523.25,493.88,392,349.23,329.63,293.66,392];
      this.interval=window.setInterval(()=>{
        if(!this.enabled||!this.context)return;
        this.tone(notes[index%notes.length],this.rushing ? .20 : .35,this.rushing ? .10 : .07,'sine');
        if(this.rushing&&index%2===0)this.bell(.2);
        index++;
      },this.rushing?430:1550);
    }
  }
  private tone(freq:number,duration:number,volume:number,wave:OscillatorType='sine'){
    if(!this.context||!this.master||!this.enabled)return;
    const now=this.context.currentTime;
    const osc=this.context.createOscillator();const gain=this.context.createGain();
    osc.type=wave;osc.frequency.setValueAtTime(freq,now);
    gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume,now+.025);
    gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
    osc.connect(gain).connect(this.master);osc.start(now);osc.stop(now+duration+.03);
  }
  bell(scale=1){
    for(const [n,m] of [[392,.09],[784,.035],[1176,.018],[1568,.008]])this.tone(n,1.5*scale,m,'sine');
  }
  success(){this.tone(523.25,.4,.08);setTimeout(()=>this.tone(659.25,.48,.07),120);setTimeout(()=>this.tone(783.99,.72,.09),260)}
  tick(){this.tone(1160,.045,.065,'triangle')}
  playRush(){this.rushing=true;this.bell();if(this.interval!==null){clearInterval(this.interval);this.interval=null;}this.playing=false;this.ambience.forEach(o=>{try{o.stop()}catch{/* disposed */}});this.ambience=[];void this.start()}
  stopRush(){this.rushing=false;if(this.interval!==null){clearInterval(this.interval);this.interval=null;}this.playing=false;this.ambience.forEach(o=>{try{o.stop()}catch{/* disposed */}});this.ambience=[];void this.start()}
  finale(){this.stopRush();this.bell(2);this.success();}
  setEnabled(value:boolean){this.enabled=value;if(this.master&&this.context)this.master.gain.setTargetAtTime(value?.18:0,this.context.currentTime,.1);if(this.voice)this.voice.muted=!value}
  async playVoice(url:string){
    if(!url||!this.enabled)return;
    try{
      const parsed=new URL(url,location.href);
      if(!['http:','https:'].includes(parsed.protocol))return;
      this.voice?.pause();this.voice=new Audio(parsed.href);this.voice.volume=.82;
      await this.voice.play();
    }catch{/* Audio must remain optional when external files fail or autoplay is blocked. */}
  }
  dispose(){if(this.interval!==null)clearInterval(this.interval);this.voice?.pause();this.ambience.forEach(o=>{try{o.stop()}catch{/* stopped */}});void this.context?.close()}
}
