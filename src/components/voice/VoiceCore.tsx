"use client";

import { motion, AnimatePresence } from "framer-motion";

interface VoiceCoreProps {
  isListening: boolean;
  isSpeaking: boolean;
  isThinking?: boolean;
  onClick?: () => void;
}

export default function VoiceCore({ isListening, isSpeaking, isThinking, onClick }: VoiceCoreProps) {
  // State-based styles
  const getCoreGradient = () => {
    if (isListening) return "from-emerald-400 to-cyan-500 shadow-[0_0_50px_rgba(52,211,153,0.5)]";
    if (isThinking) return "from-purple-500 to-indigo-600 shadow-[0_0_50px_rgba(139,92,246,0.5)]";
    if (isSpeaking) return "from-indigo-atenea to-neon-violet shadow-[0_0_50px_rgba(79,70,229,0.5)]";
    return "from-indigo-900/40 to-indigo-800/40 border border-indigo-500/20 shadow-none";
  };

  return (
    <div className="relative flex items-center justify-center w-56 h-56 cursor-pointer group" onClick={onClick}>
      {/* Dynamic Background Glow */}
      <motion.div
        className={`absolute w-full h-full rounded-full blur-3xl opacity-30 transition-colors duration-500 ${
          isListening ? 'bg-emerald-500' : isThinking ? 'bg-purple-500' : isSpeaking ? 'bg-indigo-500' : 'bg-indigo-900/20'
        }`}
        animate={{
          scale: (isSpeaking || isListening) ? [1, 1.2, 1] : 1,
          opacity: (isSpeaking || isListening) ? [0.3, 0.6, 0.3] : 0.2,
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Pulsing Rings for Listening */}
      <AnimatePresence>
        {isListening && (
          <>
            {[1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute w-full h-full border-2 border-emerald-400/40 rounded-full"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.5 + i * 0.2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: i * 0.5 }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Main Core */}
      <motion.div
        className={`relative z-10 w-36 h-36 rounded-full bg-gradient-to-br flex items-center justify-center transition-all duration-500 ${getCoreGradient()}`}
        animate={{
          scale: isSpeaking ? [1, 1.05, 1] : 1,
        }}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        {/* Thinking Spinner */}
        <AnimatePresence>
          {isThinking && (
            <motion.div
              initial={{ rotate: 0, opacity: 0 }}
              animate={{ rotate: 360, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ rotate: { duration: 1, repeat: Infinity, ease: "linear" } }}
              className="absolute inset-0 border-t-2 border-r-2 border-white/40 rounded-full"
            />
          )}
        </AnimatePresence>

        {/* Inner Animated Visuals */}
        <div className="relative w-20 h-20 flex items-center justify-center">
           {isSpeaking ? (
             <div className="flex items-end justify-center space-x-1 h-8">
               {[1, 2, 3, 4, 5].map((i) => (
                 <motion.div
                   key={i}
                   className="w-1.5 bg-white/90 rounded-full"
                   animate={{
                     height: [8, 24, 12, 32, 8][i-1] * Math.random() + 8
                   }}
                   transition={{ duration: 0.4, repeat: Infinity, repeatType: "reverse" }}
                 />
               ))}
             </div>
           ) : isListening ? (
             <motion.div
               animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
               transition={{ duration: 1, repeat: Infinity }}
               className="w-12 h-12 bg-white/30 rounded-full blur-md"
             />
           ) : (
             <div className="w-16 h-16 rounded-full border border-white/10" />
           )}
        </div>

        {/* Glass Reflection */}
        <div className="absolute top-2 left-6 w-12 h-6 bg-white/10 rounded-full blur-sm rotate-[-15deg]" />
      </motion.div>

      {/* Neural Lines (Dynamic) */}
      <svg className="absolute w-[180%] h-[180%] pointer-events-none overflow-visible" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isListening ? "#34d399" : isThinking ? "#a78bfa" : "#4f46e5"} />
            <stop offset="100%" stopColor={isListening ? "#06b6d4" : isThinking ? "#6366f1" : "#8b5cf6"} />
          </linearGradient>
        </defs>
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.line
            key={i}
            x1="50"
            y1="50"
            x2={50 + 45 * Math.cos((i * 45 * Math.PI) / 180)}
            y2={50 + 45 * Math.sin((i * 45 * Math.PI) / 180)}
            stroke="url(#lineGrad)"
            strokeWidth="0.3"
            strokeDasharray="4 4"
            className="opacity-20"
            animate={{
              strokeDashoffset: (isSpeaking || isListening || isThinking) ? [-10, 0] : 0,
              opacity: (isSpeaking || isListening || isThinking) ? 0.4 : 0.1,
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        ))}
      </svg>
    </div>
  );
}
