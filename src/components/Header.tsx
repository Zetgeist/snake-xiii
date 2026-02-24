import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Orbit, Volume2, VolumeX, ChevronDown } from 'lucide-react';

interface HeaderProps {
  onSkinChange: (color: string) => void;
  skinColor: string;
  onUiColorChange: (color: string) => void;
  uiColor: string;
  isMuted: boolean;
  onToggleMute: () => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
}

export const Header: React.FC<HeaderProps> = ({ onSkinChange, skinColor, onUiColorChange, uiColor, isMuted, onToggleMute, volume, onVolumeChange }) => {
  const [isUiOpen, setIsUiOpen] = useState(false);
  const [isSkinsOpen, setIsSkinsOpen] = useState(false);
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);

  const colors = [
    { name: 'Neon Pink', color: '#f425af' },
    { name: 'Cyan', color: '#06b6d4' },
    { name: 'Emerald', color: '#10b981' },
    { name: 'Amber', color: '#f59e0b' },
    { name: 'Violet', color: '#8b5cf6' },
  ];

  const skins = [
    { id: 'classic', name: 'Classic Eye', color: '#f425af', icon: (c: string) => <div className="size-6 rounded-full border-2 border-white/20 flex items-center justify-center"><div className="size-2 rounded-full" style={{ backgroundColor: c }} /></div> },
    { id: 'reptile', name: 'Reptile Slit', color: '#06b6d4', icon: (c: string) => <div className="size-6 rounded-full border-2 border-white/20 flex items-center justify-center"><div className="w-1 h-4 rounded-full" style={{ backgroundColor: c }} /></div> },
    { id: 'glow', name: 'Inner Glow', color: '#10b981', icon: (c: string) => <div className="size-6 rounded-full border-2 border-white/20 flex items-center justify-center shadow-[0_0_10px_rgba(255,255,255,0.5)]"><div className="size-3 rounded-full blur-[1px]" style={{ backgroundColor: c }} /></div> },
    { id: 'cyber', name: 'Cyber Ring', color: '#f59e0b', icon: (c: string) => <div className="size-6 rounded-full border-2 flex items-center justify-center" style={{ borderColor: c }}><div className="size-1 rounded-full bg-white" /></div> },
    { id: 'void', name: 'Void Eye', color: '#8b5cf6', icon: (c: string) => <div className="size-6 rounded-full bg-white/10 flex items-center justify-center border border-white/20"><div className="size-4 rounded-full border-2" style={{ borderColor: c }} /></div> },
  ];

  const currentSkin = skins.find(s => s.color === skinColor) || skins[0];

  return (
    <header className="flex items-center justify-between px-8 py-6 md:px-16 relative z-50">
      <div className="flex items-center gap-3">
        <div className="size-10 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30" style={{ borderColor: `${uiColor}4d`, backgroundColor: `${uiColor}33` }}>
          <Orbit className="size-6" style={{ color: uiColor }} />
        </div>
        <h2 className="text-xl font-bold tracking-tighter text-slate-100 uppercase italic">
          XIII Snakes
        </h2>
      </div>
      
      <div className="relative">
        <button 
          onClick={() => setIsUiOpen(!isUiOpen)}
          className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-white hover:text-primary transition-all neon-glow-sm bg-white/5 px-4 py-2 rounded-full border border-white/10"
          style={{ '--neon-color': uiColor } as any}
        >
          UI Color
          <ChevronDown className={`size-4 transition-transform ${isUiOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isUiOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-4 bg-slate-900/90 backdrop-blur-xl border border-white/10 p-2 rounded-xl min-w-[160px] shadow-2xl"
            >
              {colors.map((c) => (
                <button
                  key={c.color}
                  onClick={() => {
                    onUiColorChange(c.color);
                    setIsUiOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left ${uiColor === c.color ? 'bg-white/10' : ''}`}
                >
                  <div className="size-4 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-xs font-medium text-slate-200">{c.name}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative group">
          <button
            onClick={onToggleMute}
            onMouseEnter={() => setIsVolumeOpen(true)}
            className="size-10 flex items-center justify-center rounded-full bg-slate-800/50 hover:bg-primary/20 border border-slate-700 hover:border-primary/50 text-slate-100 transition-all"
            style={{ '--primary-color': uiColor } as any}
          >
            {isMuted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </button>

          <AnimatePresence>
            {isVolumeOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: -10 }}
                onMouseLeave={() => setIsVolumeOpen(false)}
                className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-slate-900/90 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[150px]"
              >
                <VolumeX className="size-4 text-slate-500" />
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01" 
                  value={volume} 
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: uiColor }}
                />
                <Volume2 className="size-4 text-slate-500" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setIsSkinsOpen(!isSkinsOpen)}
            className="size-10 rounded-full border border-slate-700 overflow-hidden bg-slate-800/50 flex items-center justify-center hover:border-white/50 transition-colors"
          >
            {currentSkin.icon(skinColor)}
          </button>

          <AnimatePresence>
            {isSkinsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, x: -100 }}
                animate={{ opacity: 1, y: 0, x: -100 }}
                exit={{ opacity: 0, y: 10, x: -100 }}
                className="absolute top-full right-0 mt-4 bg-slate-900/90 backdrop-blur-xl border border-white/10 p-2 rounded-xl min-w-[180px] shadow-2xl"
              >
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-white/5 mb-1">
                  Snake Skin
                </div>
                {skins.map((skin) => (
                  <button
                    key={skin.id}
                    onClick={() => {
                      onSkinChange(skin.color);
                      setIsSkinsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left ${skinColor === skin.color ? 'bg-white/10' : ''}`}
                  >
                    {skin.icon(skin.color)}
                    <span className="text-xs font-medium text-slate-200">{skin.name}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
