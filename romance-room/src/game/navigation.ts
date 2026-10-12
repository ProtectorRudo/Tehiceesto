import type { Stage } from './logic';

export type HorizontalPoint = { x: number; z: number };
type Obstacle = { name: string; x: number; z: number; halfX: number; halfZ: number };

// Camera-height collision proxies deliberately include a 24 cm player radius.
// This keeps interactive surfaces reachable without walking through the furniture.
const furniture: readonly Obstacle[] = [
  {name:'escritorio',x:-3.6,z:2,halfX:1.75,halfZ:1.02},
  {name:'gramófono',x:3.85,z:-1.85,halfX:1.17,halfZ:1.02},
  {name:'biblioteca',x:7.66,z:-3.8,halfX:.92,halfZ:2.55},
  {name:'sillón izquierdo',x:-5,z:3,halfX:1.0,halfZ:1.05},
  {name:'sillón derecho',x:5,z:4,halfX:1.0,halfZ:1.05},
  {name:'mesa del jardín',x:0,z:-15.2,halfX:1.08,halfZ:1.08},
];

export function isWalkable(p:HorizontalPoint,stage:Stage):boolean {
  if(p.x < -7.65 || p.x > 7.65 || p.z > 6.55 || p.z < (stage>=4?-16.35:-5.65)) return false;
  // Library back wall has exactly one passage. The opening only unlocks after the books.
  if(stage>=4 && p.z < -6.35 && p.z > -7.6 && Math.abs(p.x)>1.5) return false;
  for(const o of furniture){
    if(o.z < -7 && stage < 4) continue;
    if(Math.abs(p.x-o.x)<o.halfX && Math.abs(p.z-o.z)<o.halfZ) return false;
  }
  return true;
}

export function resolveMovement(from: HorizontalPoint, towards: HorizontalPoint,stage:Stage):HorizontalPoint {
  if(isWalkable(towards,stage)) return towards;
  // Sliding along an obstacle is much more natural on touch than a hard stop.
  const xOnly={x:towards.x,z:from.z};
  const zOnly={x:from.x,z:towards.z};
  if(isWalkable(xOnly,stage)) return xOnly;
  if(isWalkable(zOnly,stage)) return zOnly;
  return from;
}
