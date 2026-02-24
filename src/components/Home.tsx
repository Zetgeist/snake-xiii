import React, { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Settings, Trophy, Users, Star } from 'lucide-react';

interface HomeProps {
  onStart: () => void;
  personalBest: number;
  uiColor: string;
  globalBest: number | null;
}

export const Home: React.FC<HomeProps> = ({ onStart, personalBest, uiColor, globalBest }) => {
  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center relative px-4">
        {/* Circular Boundary Hint */}
        <div className="absolute size-[500px] md:size-[700px] rounded-full circular-boundary pointer-events-none flex items-center justify-center">
          <div className="size-[95%] rounded-full border border-primary/10 border-dashed" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center z-20 space-y-8"
        >
          <div className="space-y-2">
            <h3 className="font-bold tracking-[0.5em] uppercase text-sm md:text-base opacity-80" style={{ color: uiColor }}>
              No confío para nada en ti
            </h3>
            <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-white neon-glow italic scale-y-110" style={{ '--neon-color': uiColor } as any}>
              XIII SNAKES
            </h1>
            <p className="text-slate-400 text-lg md:text-xl font-medium max-w-md mx-auto mt-4 leading-relaxed">
              XIII levels for heaven
            </p>
          </div>

          <div className="flex flex-col items-center gap-6 pt-8">
            <button
              onClick={onStart}
              className="group relative flex items-center justify-center px-12 py-5 text-white text-xl font-bold tracking-widest rounded-full transition-transform hover:scale-105 active:scale-95"
              style={{ backgroundColor: uiColor, boxShadow: `0 0 30px ${uiColor}66` }}
            >
              <span className="relative z-10 flex items-center gap-3 uppercase">
                Start Game
                <Play className="fill-current size-6" />
              </span>
              <div className="absolute inset-0 bg-white/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </motion.div>
      </main>

      <footer className="p-8 md:p-12 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-4 md:gap-8">
          <StatCard
            icon={Trophy}
            label="Global High Score"
            value={globalBest !== null ? globalBest.toLocaleString() : '---'}
            color={uiColor}
          />
          <StatCard icon={Users} label="Players Online" value="1" color={uiColor} />
          <StatCard icon={Star} label="Your Rank" value="#1" color={uiColor} />
        </div>
        
        <div className="mt-8 flex justify-center items-center gap-6 text-[10px] uppercase tracking-[0.3em] font-bold text-slate-600">
          <span>V2.4.0 ALPHA</span>
          <span className="size-1 rounded-full bg-slate-800" />
          <span>© 2024 PSYCHEDELIC STUDIOS</span>
          <span className="size-1 rounded-full bg-slate-800" />
          <a className="hover:text-primary transition-colors" href="#">Privacy</a>
        </div>
      </footer>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: string }) => (
  <div className="flex-1 min-w-[200px] bg-slate-900/40 backdrop-blur-md border border-white/5 p-6 rounded-xl flex flex-col items-center text-center">
    <Icon className="mb-2 size-6" style={{ color }} />
    <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">{label}</p>
    <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
  </div>
);
