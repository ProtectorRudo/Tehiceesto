/** Stable, fixed-centre virtual stick. Pixel displacement is normalized with a deadzone.
 * Both axes are camera-relative; pushing upwards returns negative Y.
 */
export type Stick = {x:number;y:number};
export function stickVector(dx:number,dy:number,radius=44,deadzone=.10):Stick {
  if(!Number.isFinite(dx)||!Number.isFinite(dy)||radius<=0)return {x:0,y:0};
  const length=Math.hypot(dx,dy);
  if(length<=radius*deadzone)return {x:0,y:0};
  const amplitude=Math.pow(Math.min(1,(length/radius-deadzone)/(1-deadzone)),1.16);
  return {x:dx/length*amplitude,y:dy/length*amplitude};
}
export function stickOffset(dx:number,dy:number,radius=44):Stick {
  const l=Math.hypot(dx,dy);const factor=l>radius?radius/l:1;
  return {x:dx*factor,y:dy*factor};
}
