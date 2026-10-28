"use client";

import { useEffect, useRef } from "react";
type Particle = { x: number; y: number; radius: number; speed: number; phase: number; alpha: number };

/** Lightweight optional cinematic atmosphere. Never intercepts touch or clicks. */
export default function TodaviaAtmosphere({ stage }: { stage: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = canvas.current;
    if (!element || typeof window === "undefined") return;
    const context = element.getContext("2d", { alpha: true });
    if (!context) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0, height = 0, ratio = 1, frame = 0, last = 0;
    let particles: Particle[] = [];
    const colors = ["219,191,131", "208,189,133", "226,202,158", "193,211,181", "251,210,153"];
    const rgb = colors[stage] || colors[0];
    const resize = () => {
      width = element.clientWidth; height = element.clientHeight;
      ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      element.width = Math.max(1, Math.ceil(width * ratio));
      element.height = Math.max(1, Math.ceil(height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.min(44, Math.max(15, Math.round(width / 24)));
      particles = Array.from({ length: count }, (_, i) => ({
        x: ((i * 137.508 + 31) % 100) / 100 * width,
        y: ((i * 63.19 + 17) % 100) / 100 * height,
        radius: 0.8 + (i % 5) * 0.42,
        speed: 0.07 + (i % 7) * 0.024,
        phase: i * 1.913,
        alpha: 0.12 + (i % 6) * 0.045,
      }));
    };
    const render = (now: number) => {
      if (document.hidden) { frame = 0; return; }
      frame = window.requestAnimationFrame(render);
      if (now - last < 33) return;
      const delta = Math.min(64, now - (last || now)); last = now;
      context.clearRect(0, 0, width, height);
      if (reducedMotion) return;
      context.save();
      context.globalCompositeOperation = "screen";
      for (const p of particles) {
        p.y -= p.speed * delta * 0.07;
        if (p.y < -12) p.y = height + 10;
        const x = p.x + Math.sin(now * 0.00025 + p.phase) * 13;
        const opacity = p.alpha * (0.7 + Math.sin(now * 0.0009 + p.phase) * 0.3);
        context.beginPath();
        context.arc(x, p.y, p.radius, 0, Math.PI * 2);
        context.fillStyle = "rgba(" + rgb + "," + opacity + ")";
        context.shadowBlur = 11;
        context.shadowColor = "rgba(" + rgb + ",.45)";
        context.fill();
      }
      context.restore();
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });
    const visibility = () => { if (!document.hidden && frame === 0) frame = requestAnimationFrame(render); };
    document.addEventListener("visibilitychange", visibility);
    if (!reducedMotion) frame = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", resize); document.removeEventListener("visibilitychange", visibility); };
  }, [stage]);
  return <canvas ref={canvas} className="td-atmosphere" aria-hidden="true" />;
}
