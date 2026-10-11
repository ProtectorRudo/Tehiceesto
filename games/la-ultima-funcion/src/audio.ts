export class TheaterAudio{
  private ctx:AudioContext|null=null;
  private master:GainNode|null=null;
  private oscillators:OscillatorNode[]=[];
  private muted=false;
  unlock(){
    if(this.ctx){void this.ctx.resume();return;}
    const ctx=new AudioContext();this.ctx=ctx;
    const master=ctx.createGain();master.gain.value=.42;master.connect(ctx.destination);this.master=master;
    for(const [frequency,amp] of [[55,.016],[82.41,.009],[110.7,.004]]){
      const osc=ctx.createOscillator();osc.type="sine";osc.frequency.value=frequency;
      const gain=ctx.createGain();gain.gain.value=amp;osc.connect(gain);gain.connect(master);osc.start();this.oscillators.push(osc);
    }
  }
  setMuted(next:boolean){this.muted=next;if(this.master&&this.ctx)this.master.gain.setTargetAtTime(next?0:.42,this.ctx.currentTime,.03);}
  isMuted(){return this.muted;}
  play(kind:"click"|"found"|"wrong"|"scare"|"success"|"steps"|"curtain"="click"){
    const ctx=this.ctx,master=this.master;if(!ctx||!master)return;
    const now=ctx.currentTime;
    if(kind==="steps"){
      for(let i=0;i<4;i++)this.tone(70+i*6,55,now+i*.27,.12,"triangle",.12);
      return;
    }
    if(kind==="curtain"){
      for(let i=0;i<8;i++)this.tone(70+i*9,55,now+i*.13,.25,"sawtooth",.022);
      return;
    }
    const defs={
      click:[720,440,.07,"triangle",.09],
      found:[520,840,.33,"sine",.17],
      wrong:[170,92,.27,"sawtooth",.10],
      scare:[84,46,1.1,"sawtooth",.13],
      success:[440,880,1.5,"sine",.13]
    } as const;
    const d=defs[kind];this.tone(d[0],d[1],now,d[2],d[3],d[4]);
    if(kind==="success"){
      this.tone(550,1100,now+.2,1.35,"sine",.08);
      this.tone(660,1320,now+.43,1.1,"sine",.06);
    }
  }
  private tone(from:number,to:number,at:number,duration:number,wave:OscillatorType,volume:number){
    if(!this.ctx||!this.master)return;
    const o=this.ctx.createOscillator(),g=this.ctx.createGain();
    o.type=wave;o.frequency.setValueAtTime(from,at);o.frequency.exponentialRampToValueAtTime(Math.max(1,to),at+duration);
    g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(volume,at+.015);
    g.gain.exponentialRampToValueAtTime(.0001,at+duration);
    o.connect(g);g.connect(this.master);o.start(at);o.stop(at+duration+.02);
  }
  dispose(){this.oscillators.forEach(o=>{try{o.stop();}catch{}});void this.ctx?.close();this.ctx=null;}
}
