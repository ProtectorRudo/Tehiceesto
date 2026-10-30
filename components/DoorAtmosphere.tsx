"use client";
import "./DoorAtmosphere.css";

/**
 * Shared cinematic light volume. Pure decoration: no timers, no user data, no
 * scene navigation. Parent scene owns opening/entering state and progression.
 */
export default function DoorAtmosphere(){
  return <span className="thi-door-atmosphere" aria-hidden="true">
    <span className="thi-door-atmosphere__core"/>
    <span className="thi-door-atmosphere__beam thi-door-atmosphere__beam--left"/>
    <span className="thi-door-atmosphere__beam thi-door-atmosphere__beam--right"/>
    <span className="thi-door-atmosphere__haze"/>
    {Array.from({length:12},(_,i)=><i className="thi-door-atmosphere__mote" key={i} style={{"--mote-index":i} as React.CSSProperties}/>)}
  </span>;
}
