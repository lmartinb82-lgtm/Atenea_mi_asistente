"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { LogIn, UserPlus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
    } else {
      router.push("/");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0b0c1e] p-6 overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#11132d] border border-indigo-500/20 rounded-3xl p-8 shadow-[0_0_50px_rgba(79,70,229,0.1)] backdrop-blur-xl"
      >
        <div className="text-center mb-8">
           <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
              ATENEA
           </h1>
           <p className="text-xs text-indigo-400 mt-2 uppercase tracking-[0.2em] font-semibold opacity-60">
              Neural Intelligence Portal
           </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
           <div>
              <label className="block text-xs font-semibold text-indigo-300 mb-2 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full bg-indigo-500/5 border border-indigo-500/30 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-all text-indigo-100"
                required
              />
           </div>
           <div>
              <label className="block text-xs font-semibold text-indigo-300 mb-2 uppercase tracking-wider">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-indigo-500/5 border border-indigo-500/30 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-all text-indigo-100"
                required
              />
           </div>

           {error && <p className="text-xs text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20">{error}</p>}

           <button
             type="submit"
             disabled={isLoading}
             className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center space-x-2 font-medium"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : (isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />)}
              <span>{isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}</span>
           </button>
        </form>

        <div className="mt-8 text-center">
           <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest font-semibold"
           >
              {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
           </button>
        </div>
      </motion.div>
    </div>
  );
}
