"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/Header/Bahasa";
import type { Experience } from "@/world/Experience";

// Everything readable lives in the 3D world; the DOM only carries a progress
// bar while assets load, the touch joystick, and a WebGL failure fallback.

function Joystick({ experience }: { experience: React.RefObject<Experience | null> }) {
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const pointerId = useRef<number | null>(null);

  const move = (e: React.PointerEvent) => {
    if (pointerId.current !== e.pointerId || !base.current) return;
    const r = base.current.getBoundingClientRect();
    const radius = r.width / 2;
    let dx = (e.clientX - (r.left + radius)) / radius;
    let dy = (e.clientY - (r.top + radius)) / radius;
    const len = Math.hypot(dx, dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }
    setKnob({ x: dx, y: dy });
    const c = experience.current?.controls;
    if (c) c.joystick = { x: Math.abs(dx) > 0.15 ? dx : 0, y: Math.abs(dy) > 0.15 ? -dy : 0 };
  };
  const end = (e: React.PointerEvent) => {
    if (pointerId.current !== e.pointerId) return;
    pointerId.current = null;
    setKnob({ x: 0, y: 0 });
    const c = experience.current?.controls;
    if (c) c.joystick = { x: 0, y: 0 };
  };

  return (
    <div
      ref={base}
      aria-hidden
      className="absolute bottom-6 left-6 h-32 w-32 touch-none rounded-full border-2 border-[#1d3557]/25 bg-[#fbfdff]/40 backdrop-blur-sm"
      onPointerDown={(e) => {
        pointerId.current = e.pointerId;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        move(e);
      }}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div
        className="absolute left-1/2 top-1/2 h-12 w-12 rounded-full bg-[#1d3557] shadow-lg"
        style={{ transform: `translate(calc(-50% + ${knob.x * 40}px), calc(-50% + ${knob.y * 40}px))` }}
      />
    </div>
  );
}

export default function Experience3D() {
  const { language, setLanguage } = useLanguage();
  const container = useRef<HTMLDivElement>(null);
  const experience = useRef<Experience | null>(null);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [touch, setTouch] = useState(false);
  const langRef = useRef(language);
  langRef.current = language;
  const toggleRef = useRef(() => {});
  toggleRef.current = () => setLanguage(langRef.current === "en" ? "id" : "en");

  useEffect(() => {
    setTouch(window.matchMedia("(pointer: coarse)").matches);
    let exp: Experience | null = null;
    let cancelled = false;
    import("@/world/Experience")
      .then(({ Experience }) => {
        if (cancelled || !container.current) return;
        exp = new Experience(container.current, langRef.current, {
          onProgress: (r) => setProgress(r),
          onStart: () => setStarted(true),
          onToggleLanguage: () => toggleRef.current(),
        });
        experience.current = exp;
        return exp.load().then(() => {
          if (!cancelled) setReady(true);
        });
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      exp?.dispose();
      experience.current = null;
    };
  }, []);

  useEffect(() => {
    experience.current?.setLanguage(language);
  }, [language]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#bfe3f5] select-none">
      <div ref={container} className="absolute inset-0" />

      {touch && started && <Joystick experience={experience} />}

      <div
        className={`pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#d6f0f7] via-[#bfe3f5] to-[#cdeee0] transition-opacity duration-1000 ${
          ready ? "opacity-0" : "opacity-100"
        }`}
      >
        {failed ? (
          <div className="pointer-events-auto text-center text-[#1d3557]">
            <p>{language === "en" ? "Your browser couldn't start WebGL." : "Browser kamu tidak bisa menjalankan WebGL."}</p>
            <a href="/blog" className="mt-3 inline-block rounded-full bg-[#1d3557] px-5 py-2 text-[#fbfdff]">
              Blog
            </a>
          </div>
        ) : (
          <div className="w-56" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#1d3557]/15">
              <div className="h-full rounded-full bg-[#1d3557] transition-[width] duration-300" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
