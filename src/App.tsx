import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { Home } from './components/Home';
import { Arena } from './components/Arena';
import type { Difficulty } from './components/GameEngine';
import { fetchGlobalHighScore, saveScore } from './lib/scoresApi';

type Screen = 'home' | 'arena';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [skinColor, setSkinColor] = useState('#f425af');
  const [uiColor, setUiColor] = useState('#f425af');
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [personalBest, setPersonalBest] = useState(() => {
    const saved = localStorage.getItem('xiii-snakes-pb');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [globalBest, setGlobalBest] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  const handlePersonalBestUpdate = React.useCallback((newScore: number) => {
    setPersonalBest(newScore);
    localStorage.setItem('xiii-snakes-pb', newScore.toString());
  }, []);

  const handleSubmitScore = React.useCallback(
    async (finalScore: number, difficulty: Difficulty) => {
      try {
        // Guarda la puntuación en Supabase
        const res = await saveScore({
          points: finalScore,
          difficulty,
          // Más adelante puedes sustituir esto por un nombre real de jugador
          playerName: 'Anonymous',
        });
        if (!res.ok) {
          console.error('Supabase insert failed:', res.error);
          return;
        }
        console.debug('Score inserted into Supabase:', { points: finalScore, difficulty });

        // Si es mejor que el global actual, actualizamos en memoria
        setGlobalBest(prev => {
          if (prev === null || finalScore > prev) {
            return finalScore;
          }
          return prev;
        });
      } catch (error) {
        console.error('Error submitting score to Supabase:', error);
      }
    },
    [],
  );
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const playMusic = React.useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(err => {
        console.log("Autoplay prevented, waiting for interaction:", err);
      });
    }
  }, []);

  // Handle first interaction to start audio if blocked
  React.useEffect(() => {
    const handleFirstInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        playMusic();
        window.removeEventListener('click', handleFirstInteraction);
        window.removeEventListener('keydown', handleFirstInteraction);
      }
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);
    
    // Try playing immediately
    playMusic();

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [hasInteracted, playMusic]);

  // Cargar el récord global desde Supabase al iniciar la app
  React.useEffect(() => {
    let isMounted = true;

    const loadGlobalBest = async () => {
      const best = await fetchGlobalHighScore();
      if (isMounted && best !== null) {
        setGlobalBest(best);
      }
    };

    loadGlobalBest();

    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      if (!isMuted && hasInteracted) {
        audioRef.current.play().catch(() => {});
      } else if (isMuted) {
        audioRef.current.pause();
      }
    }
  }, [isMuted, volume, hasInteracted]);

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-background-dark">
      <audio 
        ref={audioRef}
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" 
        loop 
        preload="auto"
      />
      {/* Background Layer */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-[-50%] rotate-45 scale-150 bg-radial-[circle_at_center,_transparent_0%,_#0a0508_70%] opacity-40">
          <div 
            className="absolute inset-0 blur-[80px]" 
            style={{ 
              background: `conic-gradient(from 0deg at 50% 50%, ${uiColor} 0deg, #7e22ce 90deg, #06b6d4 180deg, ${uiColor} 270deg, ${uiColor} 360deg)` 
            }} 
          />
        </div>
        <div 
          className="absolute inset-0 opacity-20 mix-blend-overlay"
          style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/carbon-fibre.png')" }}
        />
      </div>

      {/* Decorative Glows */}
      <div className="fixed top-1/4 -left-12 size-64 rounded-full blur-[120px] pointer-events-none" style={{ backgroundColor: `${uiColor}1a` }} />
      <div className="fixed bottom-1/4 -right-12 size-64 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <Header 
        onSkinChange={setSkinColor} 
        skinColor={skinColor}
        onUiColorChange={setUiColor}
        uiColor={uiColor}
        isMuted={isMuted} 
        onToggleMute={() => setIsMuted(!isMuted)} 
        volume={volume}
        onVolumeChange={setVolume}
      />

      <AnimatePresence mode="wait">
        {screen === 'home' ? (
          <motion.div
            key="home"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 flex flex-col"
          >
            <Home 
              onStart={() => {
                setScreen('arena');
                playMusic();
              }} 
              personalBest={personalBest} 
              uiColor={uiColor}
              globalBest={globalBest}
            />
          </motion.div>
        ) : (
          <motion.div
            key="arena"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
          >
            <Arena 
              onQuit={() => setScreen('home')} 
              skinColor={skinColor} 
              uiColor={uiColor}
              onSkinChange={setSkinColor}
              personalBest={personalBest}
              onPersonalBestUpdate={handlePersonalBestUpdate}
              onPlayMusic={playMusic}
              onSubmitScore={handleSubmitScore}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Warning */}
      <div className="lg:hidden fixed inset-0 z-[100] bg-background-dark flex flex-col items-center justify-center p-10 text-center">
        <div className="size-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
          <motion.div
            animate={{ rotate: [0, 90, 90, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <svg className="size-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </motion.div>
        </div>
        <h2 className="text-2xl font-bold mb-4">Desktop Optimized</h2>
        <p className="text-slate-400">
          The Psychedelic Snake Arena is designed for large screens with high refresh rates. 
          Please switch to a desktop browser for the best experience.
        </p>
      </div>
    </div>
  );
}
