"use client";

import { useEffect, useState } from "react";

const TechBackground = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle, #64748b 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Soft ambient blobs — barely visible, no animation */}
      <div className="absolute -top-60 -right-60 w-[600px] h-[600px] rounded-full bg-teal-300/10 dark:bg-teal-500/10 blur-3xl" />
      <div className="absolute -bottom-60 -left-60 w-[500px] h-[500px] rounded-full bg-cyan-300/10 dark:bg-cyan-600/8 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-slate-200/20 dark:bg-slate-800/20 blur-3xl" />
    </div>
  );
};

export default TechBackground;
