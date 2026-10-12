/** Pure, deterministic countdown. Backgrounding pauses the puzzle fairly on mobile. */
export class RushClock {
  private endAt:number|null=null;
  private pausedMilliseconds:number|null=null;
  start(now:number,duration=120000){this.endAt=now+duration;this.pausedMilliseconds=null;}
  get active(){return this.endAt!==null || this.pausedMilliseconds!==null;}
  get paused(){return this.pausedMilliseconds!==null;}
  remaining(now:number){
    if(this.pausedMilliseconds!==null)return this.pausedMilliseconds;
    return this.endAt===null?0:Math.max(0,this.endAt-now);
  }
  pause(now:number){if(this.endAt!==null){this.pausedMilliseconds=this.remaining(now);this.endAt=null;}}
  resume(now:number){if(this.pausedMilliseconds!==null){this.endAt=now+this.pausedMilliseconds;this.pausedMilliseconds=null;}}
  stop(){this.endAt=null;this.pausedMilliseconds=null;}
}
