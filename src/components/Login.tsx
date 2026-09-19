import React, { useState } from 'react';
import { Sparkles, ArrowRight, Lock, Mail } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate network delay for effect
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 1200);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-950 relative overflow-hidden font-sans">
      {/* Background aesthetics */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-900/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md p-8 rounded-2xl bg-neutral-900/60 backdrop-blur-xl border border-neutral-800 shadow-2xl shadow-black/80">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-cyan-950/50 border border-cyan-800/50 flex items-center justify-center mb-4 shadow-lg shadow-cyan-900/20">
            <Sparkles className="w-7 h-7 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono uppercase flex items-center gap-2">
            <span className="text-cyan-400">✦</span> HABITAT 3D
          </h1>
          <p className="mt-2 text-sm text-neutral-400 text-center font-mono">
            Agentic Spatial Staging Engine
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider font-mono">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-950/50 border border-neutral-800 text-neutral-100 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all placeholder:text-neutral-600"
                placeholder="architect@studio.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider font-mono">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-950/50 border border-neutral-800 text-neutral-100 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all placeholder:text-neutral-600"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full relative group overflow-hidden rounded-lg bg-cyan-600 text-white font-medium py-2.5 transition-all hover:bg-cyan-500 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            <div className="relative z-10 flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Initialize Session</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </div>
            {/* Hover glare effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />
          </button>
        </form>

        <div className="mt-8 text-center border-t border-neutral-800/80 pt-6">
          <p className="text-[11px] text-neutral-500 font-mono">
            Protected by Modal GPU network &amp; Logfire Auth.
          </p>
        </div>
      </div>
    </div>
  );
};
