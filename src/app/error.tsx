"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Home, RefreshCw } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Portfolio Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="text-center max-w-md space-y-8">

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-16 h-16 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center"
        >
          <AlertCircle className="w-8 h-8 text-red-400" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="space-y-2"
        >
          <h1 className="font-display text-2xl font-semibold text-zinc-100">Something went wrong</h1>
          <p className="text-zinc-500 text-sm">
            Don&apos;t worry, this happens sometimes. Let&apos;s get you back on track.
          </p>
        </motion.div>

        {process.env.NODE_ENV === "development" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-left"
          >
            <p className="text-xs font-data text-zinc-600 mb-1">Error</p>
            <pre className="text-xs text-red-400 overflow-auto font-data">{error.message}</pre>
            {error.digest && (
              <p className="text-xs text-zinc-700 mt-2 font-data">ID: {error.digest}</p>
            )}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <button onClick={reset} className="btn-primary inline-flex items-center gap-2">
            <RefreshCw size={15} />
            Try Again
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <Home size={15} />
            Go Home
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-xs text-zinc-700 font-data"
        >
          If this persists, email{" "}
          <a href="mailto:angga@muslim.com" className="text-emerald-500/60 hover:text-emerald-400 transition-colors">
            angga@muslim.com
          </a>
        </motion.p>
      </div>
    </div>
  );
}
