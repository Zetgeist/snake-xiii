import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, LogOut, TrendingUp, Gauge, Timer, Play, MousePointer2, Keyboard, ChevronDown, Zap, Flame, Skull } from 'lucide-react';
import { GameEngine, Difficulty } from './GameEngine';
import { SnakePreview } from './SnakePreview';
import confetti from 'canvas-confetti';

interface ArenaProps {
  onQuit: () => void;
  skinColor: string;
  uiColor: string;
  onSkinChange: (color: string) => void;
  personalBest: number;
  onPersonalBestUpdate: (score: number) => void;
  onPlayMusic: () => void;
  onSubmitScore: (finalScore: number, difficulty: Difficulty) => void | Promise<void>;
}

export const Arena: React.FC<ArenaProps> = ({
  onQuit,
  skinColor,
  uiColor,
  onSkinChange,
  personalBest,
  onPersonalBestUpdate,
  onPlayMusic,
  onSubmitScore,
}) => {
  // Evita que el motor dispare Game Over varias veces antes de que `isPaused` se aplique
  const gameOverHandledRef = React.useRef(false);
  const scoreRef = React.useRef(0);

  const [score, setScore] = useState(0);
  const [speedLevel, setSpeedLevel] = useState(1);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [time, setTime] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [gameId, setGameId] = useState(0);
  const [arenaRadius, setArenaRadius] = useState(300);
  const [controlMode, setControlMode] = useState<'keyboard' | 'mouse'>('keyboard');
  const [isControlDropdownOpen, setIsControlDropdownOpen] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [isDifficultyDropdownOpen, setIsDifficultyDropdownOpen] = useState(false);
  const [isGameOverDifficultyOpen, setIsGameOverDifficultyOpen] = useState(false);

  const skins = [
    { name: 'Neon Pink', color: '#f425af' },
    { name: 'Cyan', color: '#06b6d4' },
    { name: 'Emerald', color: '#10b981' },
    { name: 'Amber', color: '#f59e0b' },
    { name: 'Violet', color: '#8b5cf6' },
  ];

  useEffect(() => {
    const updateRadius = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setArenaRadius(350);
      } else {
        setArenaRadius(300);
      }
    };
    updateRadius();
    window.addEventListener('resize', updateRadius);
    return () => window.removeEventListener('resize', updateRadius);
  }, []);

  const startCountdown = () => {
    setIsReady(true);
    setHasPlayed(true);
    setCountdown(3);
    onPlayMusic();
  };

  useEffect(() => {
    if (countdown === null) return;
    
    const timer = window.setTimeout(() => {
      if (countdown > 1) {
        setCountdown(countdown - 1);
      } else if (countdown === 1) {
        setCountdown(0);
      } else {
        setCountdown(null);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    let interval: number;
    if (!isGameOver && countdown === null && isReady) {
      interval = window.setInterval(() => {
        setTime(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isGameOver, countdown, isReady]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleScoreUpdate = React.useCallback((newScore: number, newSpeedLevel: number) => {
    scoreRef.current = newScore;
    setScore(newScore);
    setSpeedLevel(newSpeedLevel);
  }, []);

  const handleGameOver = React.useCallback(
    (win?: boolean) => {
      if (gameOverHandledRef.current) return;
      gameOverHandledRef.current = true;

      setIsGameOver(true);
      setIsWin(!!win);

      const baseScore = scoreRef.current;
      const finalScore = win ? baseScore + Math.max(0, 5000 - time * 50) : baseScore;

      // Importante: no hacer efectos secundarios dentro de `setScore(prev => ...)`
      // En dev con StrictMode, React puede invocar el updater más de una vez.
      setScore(finalScore);

      // Notificamos al contenedor para que guarde la puntuación en Supabase (una sola vez)
      void onSubmitScore(finalScore, difficulty);

      if (finalScore > personalBest) {
        onPersonalBestUpdate(finalScore);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: [skinColor, '#0bda87', '#ffffff'],
        });
      }
    },
    [time, personalBest, onPersonalBestUpdate, skinColor, onSubmitScore, difficulty],
  );

  const handleRestart = React.useCallback(() => {
    gameOverHandledRef.current = false;
    scoreRef.current = 0;
    setScore(0);
    setSpeedLevel(1);
    setTime(0);
    setIsGameOver(false);
    setIsWin(false);
    setIsReady(true);
    setGameId(prev => prev + 1);
    setCountdown(3);
  }, []);

  return (
    <div className="flex-1 relative flex flex-col items-center justify-center p-6">
      {/* HUD Left */}
      <div className="absolute top-8 left-12 flex flex-col gap-1 z-20">
        <span className="text-xs font-bold tracking-widest uppercase opacity-80" style={{ color: uiColor }}>Current Score</span>
        <div className="flex flex-col">
          <div className="text-5xl font-bold tracking-tighter text-white">
            {score.toLocaleString()}
          </div>
        </div>
      </div>

      {/* HUD Right */}
      <div className="absolute top-8 right-12 flex flex-col items-end gap-1 text-right z-20">
        <span className="text-xs font-bold tracking-widest text-slate-400 uppercase opacity-80">Personal Best</span>
        <div className="text-5xl font-bold tracking-tighter text-white">
          {personalBest.toLocaleString()}
        </div>
      </div>

      {/* Arena */}
      <div className="relative group">
        <div className="absolute inset-0 opacity-10 blur-[100px] rounded-full scale-110 pointer-events-none" style={{ backgroundColor: skinColor }} />
        
        <div className="relative size-[600px] lg:size-[700px] rounded-full circular-arena-border bg-slate-900/40 backdrop-blur-sm flex items-center justify-center overflow-hidden" style={{ borderColor: `${uiColor}cc` }}>
          <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at center, transparent 0%, #000 100%)' }} />
          
          <GameEngine 
            key={gameId}
            onScoreUpdate={handleScoreUpdate} 
            onGameOver={handleGameOver} 
            isPaused={isGameOver || countdown !== null || !isReady}
            radius={arenaRadius}
            skinColor={skinColor}
            controlMode={controlMode}
            difficulty={difficulty}
          />

          <AnimatePresence>
            {!isReady && !isGameOver && (
              <motion.div
                key="ready"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-background-dark/80 backdrop-blur-xl z-30 p-8"
              >
                <h2 className="text-4xl font-black italic text-white mb-8 uppercase tracking-tighter" style={{ textShadow: `0 0 20px ${uiColor}` }}>
                  Customize Your Run
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 w-full max-w-4xl">
                  {/* Left Column: Skins & Preview */}
                  <div className="bg-slate-900/60 border border-white/5 p-5 rounded-3xl flex flex-col items-center gap-4">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: uiColor }}>Skin Color</span>
                      <div className="flex gap-2">
                        {skins.map((skin) => (
                          <button
                            key={skin.color}
                            onClick={() => onSkinChange(skin.color)}
                            className={`size-7 rounded-full transition-all hover:scale-110 ${skinColor === skin.color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'opacity-40 hover:opacity-70'}`}
                            style={{ backgroundColor: skin.color, boxShadow: skinColor === skin.color ? `0 0 15px ${skin.color}` : 'none' }}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div className="size-24 flex items-center justify-center bg-black/40 rounded-2xl border border-white/5 relative overflow-hidden">
                      <SnakePreview color={skinColor} />
                    </div>
                  </div>

                  {/* Middle Column: Difficulty */}
                  <div className="bg-slate-900/60 border border-white/5 p-5 rounded-3xl flex flex-col items-center justify-center gap-4">
                    <div className="flex flex-col items-center gap-3 w-full">
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: uiColor }}>Difficulty</span>
                      <div className="relative w-full">
                        <button
                          onClick={() => setIsDifficultyDropdownOpen(!isDifficultyDropdownOpen)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/80 border border-white/10 rounded-2xl text-white font-bold transition-all hover:bg-slate-700"
                        >
                          <div className="flex items-center gap-3">
                            {difficulty === 'easy' && <Zap className="size-5 text-emerald-400" />}
                            {difficulty === 'medium' && <Flame className="size-5 text-amber-400" />}
                            {difficulty === 'hard' && <Skull className="size-5 text-rose-500" />}
                            <span className="uppercase tracking-widest text-xs">
                              {difficulty}
                            </span>
                          </div>
                          <ChevronDown className={`size-4 transition-transform ${isDifficultyDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                          {isDifficultyDropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl"
                            >
                              {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                                <button
                                  key={d}
                                  onClick={() => { setDifficulty(d); setIsDifficultyDropdownOpen(false); }}
                                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left ${difficulty === d ? 'bg-white/5' : ''}`}
                                >
                                  {d === 'easy' && <Zap className="size-4 text-emerald-400" />}
                                  {d === 'medium' && <Flame className="size-4 text-amber-400" />}
                                  {d === 'hard' && <Skull className="size-4 text-rose-500" />}
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold text-white uppercase tracking-widest">{d}</span>
                                    <span className="text-[9px] text-slate-500 uppercase">
                                      {d === 'easy' && 'Chill pace'}
                                      {d === 'medium' && 'Faster & tighter'}
                                      {d === 'hard' && 'Insane speed'}
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 text-center uppercase leading-relaxed tracking-widest">
                      {difficulty === 'easy' && 'Perfect for beginners.'}
                      {difficulty === 'medium' && 'For seasoned snake charmers.'}
                      {difficulty === 'hard' && 'Only for the elite.'}
                    </p>
                  </div>

                  {/* Right Column: Controls */}
                  <div className="bg-slate-900/60 border border-white/5 p-5 rounded-3xl flex flex-col items-center justify-center gap-4">
                    <div className="flex flex-col items-center gap-3 w-full">
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: uiColor }}>Control Method</span>
                      <div className="relative w-full">
                        <button
                          onClick={() => setIsControlDropdownOpen(!isControlDropdownOpen)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/80 border border-white/10 rounded-2xl text-white font-bold transition-all hover:bg-slate-700"
                        >
                          <div className="flex items-center gap-3">
                            {controlMode === 'keyboard' ? <Keyboard className="size-5" style={{ color: uiColor }} /> : <MousePointer2 className="size-5" style={{ color: uiColor }} />}
                            <span className="uppercase tracking-widest text-xs">
                              {controlMode === 'keyboard' ? 'Keyboard' : 'Mouse'}
                            </span>
                          </div>
                          <ChevronDown className={`size-4 transition-transform ${isControlDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                          {isControlDropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl"
                            >
                              <button
                                onClick={() => { setControlMode('keyboard'); setIsControlDropdownOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left ${controlMode === 'keyboard' ? 'bg-white/5' : ''}`}
                              >
                                <Keyboard className="size-4 text-slate-400" />
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-white uppercase tracking-widest">Keyboard</span>
                                  <span className="text-[9px] text-slate-500 uppercase">Use A/D keys</span>
                                </div>
                              </button>
                              <button
                                onClick={() => { setControlMode('mouse'); setIsControlDropdownOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left ${controlMode === 'mouse' ? 'bg-white/5' : ''}`}
                              >
                                <MousePointer2 className="size-4 text-slate-400" />
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-white uppercase tracking-widest">Mouse</span>
                                  <span className="text-[9px] text-slate-500 uppercase">Follow cursor</span>
                                </div>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    
                    <p className="text-[10px] text-slate-500 text-center uppercase leading-relaxed tracking-widest">
                      {controlMode === 'keyboard' 
                        ? 'Classic arcade feel.' 
                        : 'Fluid movement.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={startCountdown}
                  className="group relative flex items-center justify-center px-16 py-6 text-white text-2xl font-black tracking-[0.2em] rounded-full transition-all hover:scale-105 active:scale-95 shadow-2xl uppercase italic"
                  style={{ backgroundColor: uiColor, boxShadow: `0 0 30px ${uiColor}66` }}
                >
                  <span className="relative z-10 flex items-center gap-4">
                    Start Game
                    <Play className="fill-current size-8" />
                  </span>
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </motion.div>
            )}

            {countdown !== null && (
              <motion.div
                key="countdown"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.5 }}
                className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none"
              >
                <span className="text-9xl font-black italic text-white" style={{ textShadow: `0 0 40px ${uiColor}` }}>
                  {countdown === 0 ? 'GO!' : countdown}
                </span>
              </motion.div>
            )}

            {isGameOver && (
              <motion.div
                key="gameover"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-background-dark/80 backdrop-blur-lg z-30"
              >
                <h2 className="text-6xl font-black italic text-white mb-2" style={{ textShadow: `0 0 30px ${uiColor}` }}>
                  {isWin ? 'VICTORY!' : 'GAME OVER'}
                </h2>
                <p className="text-slate-400 mb-2 font-bold tracking-widest uppercase">Final Score: {score.toLocaleString()}</p>
                {isWin && <p className="text-accent-neon mb-6 font-bold text-sm">Time: {formatTime(time)}</p>}
                {!isWin && <div className="mb-6" />}
                
                {/* Difficulty Selector on Game Over */}
                <div className="relative mb-8 w-48">
                  <button
                    onClick={() => setIsGameOverDifficultyOpen(!isGameOverDifficultyOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/80 border border-white/10 rounded-2xl text-white font-bold transition-all hover:bg-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      {difficulty === 'easy' && <Zap className="size-4 text-emerald-400" />}
                      {difficulty === 'medium' && <Flame className="size-4 text-amber-400" />}
                      {difficulty === 'hard' && <Skull className="size-4 text-rose-500" />}
                      <span className="uppercase tracking-widest text-[10px]">
                        {difficulty}
                      </span>
                    </div>
                    <ChevronDown className={`size-3 transition-transform ${isGameOverDifficultyOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isGameOverDifficultyOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl"
                      >
                        {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                          <button
                            key={d}
                            onClick={() => { setDifficulty(d); setIsGameOverDifficultyOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left ${difficulty === d ? 'bg-white/5' : ''}`}
                          >
                            {d === 'easy' && <Zap className="size-3 text-emerald-400" />}
                            {d === 'medium' && <Flame className="size-3 text-amber-400" />}
                            {d === 'hard' && <Skull className="size-3 text-rose-500" />}
                            <span className="text-[10px] font-bold text-white uppercase tracking-widest">{d}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleRestart}
                    className="flex items-center gap-3 px-8 h-14 text-white rounded-full font-bold text-lg hover:scale-105 transition-transform"
                    style={{ backgroundColor: uiColor, boxShadow: `0 0 20px ${uiColor}66` }}
                  >
                    <RotateCcw className="size-5" />
                    Try Again
                  </button>
                  <button
                    onClick={onQuit}
                    className="flex items-center gap-3 px-8 h-14 bg-slate-800/80 text-slate-100 border border-slate-700 rounded-full font-bold text-lg hover:bg-slate-700 transition-colors"
                  >
                    <LogOut className="size-5" />
                    Quit
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3">
          <div className="h-[2px] w-12 opacity-30" style={{ backgroundColor: uiColor }} />
          <span className="text-sm font-bold tracking-[0.3em] text-slate-400 uppercase">XIII Snakes v2.4</span>
          <div className="h-[2px] w-12 opacity-30" style={{ backgroundColor: uiColor }} />
        </div>
      </div>

      {/* Stats Sidebar */}
      <aside className="fixed right-8 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-20">
        <StatWidget icon={Gauge} label="Speed" value={`+${speedLevel}`} color="text-primary" style={{ color: uiColor }} />
        <StatWidget icon={Timer} label="Elapsed" value={formatTime(time)} color="text-accent-neon" />
      </aside>

      {/* Footer Controls */}
      <div className="absolute bottom-12 left-12 flex gap-4 z-20">
        {hasPlayed && (
          <button
            onClick={handleRestart}
            className="flex items-center gap-3 px-8 h-14 text-white rounded-full font-bold text-lg hover:scale-105 transition-transform active:scale-95"
            style={{ backgroundColor: uiColor, boxShadow: `0 0 20px ${uiColor}4d` }}
          >
            <RotateCcw className="size-5" />
            Restart Game
          </button>
        )}
        <button
          onClick={onQuit}
          className="flex items-center gap-3 px-8 h-14 bg-slate-800/80 text-slate-100 border border-slate-700 rounded-full font-bold text-lg hover:bg-slate-700 transition-colors active:scale-95"
        >
          <LogOut className="size-5" />
          Quit Arena
        </button>
      </div>
    </div>
  );
};

const StatWidget = ({ icon: Icon, label, value, color, style }: { icon: any, label: string, value: string, color: string, style?: React.CSSProperties }) => (
  <div className="p-4 rounded-xl border border-slate-700/50 bg-slate-800/20 backdrop-blur-sm flex flex-col gap-3 min-w-[120px]">
    <div className={cn("flex items-center gap-2", color)} style={style}>
      <Icon className="size-4" />
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </div>
    <div className="text-2xl font-bold text-white tracking-tight" style={style}>{value}</div>
  </div>
);

import { cn } from '../lib/utils';
