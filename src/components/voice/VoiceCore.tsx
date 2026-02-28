"use client";

import { motion } from "framer-motion";

interface VoiceCoreProps {
  isListening: boolean;
  isSpeaking: boolean;
  onClick?: () => void;
}

export default function VoiceCore({ isListening, isSpeaking, onClick }: VoiceCoreProps) {
  return (
    <div className="relative flex items-center justify-center w-48 h-48 cursor-pointer group" onClick={onClick}>
      {/* Outer Glow */}
      <motion.div
        className="absolute w-full h-full rounded-full bg-indigo-500/10 blur-3xl"
        animate={{
          scale: isSpeaking ? [1, 1.2, 1] : 1,
          opacity: isSpeaking ? [0.3, 0.6, 0.3] : 0.3,
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Pulsing Ring for Listening */}
      {isListening && (
        <motion.div
          className="absolute w-full h-full border-2 border-neon-violet/40 rounded-full"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
        />
      )}

      {/* Main Core */}
      <motion.div
        className="relative z-10 w-32 h-32 rounded-full bg-gradient-to-br from-indigo-atenea to-neon-violet flex items-center justify-center shadow-[0_0_50px_rgba(79,70,229,0.5)]"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Animated Inner Pattern */}
        <motion.div
          className="w-16 h-16 rounded-full border-4 border-white/20"
          animate={{
            rotate: isSpeaking || isListening ? 360 : 0,
            scale: isSpeaking ? [1, 1.1, 1] : 1,
          }}
          transition={{
            rotate: { duration: 10, repeat: Infinity, ease: "linear" },
            scale: { duration: 0.5, repeat: Infinity },
          }}
        />

        <div className="absolute w-20 h-20 rounded-full border border-white/10" />
      </motion.div>

      {/* Neural Lines (Static or Animated) */}
      <svg className="absolute w-[200%] h-[200%] pointer-events-none opacity-20 overflow-visible" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.line
            key={i}
            x1="50"
            y1="50"
            x2={50 + 40 * Math.cos((i * 30 * Math.PI) / 180)}
            y2={50 + 40 * Math.sin((i * 30 * Math.PI) / 180)}
            stroke="url(#lineGrad)"
            strokeWidth="0.5"
            strokeDasharray="5 5"
            animate={{
              strokeDashoffset: isSpeaking || isListening ? [-10, 0] : 0,
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        ))}
      </svg>
    </div>
  );
}
