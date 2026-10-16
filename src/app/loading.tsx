"use client";

import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="text-center space-y-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-12 h-12 mx-auto rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"
        >
          <span className="text-emerald-400 text-lg font-bold font-data">A</span>
        </motion.div>

        <div className="flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
