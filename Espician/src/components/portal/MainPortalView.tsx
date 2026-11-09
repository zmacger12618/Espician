import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Anchor, Play, LogOut, Globe, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { GameLang, FISHING_UI, getSavedLang, saveLang } from '../../core/data/fishingI18n';
import { soundEngine } from '../../services/soundEngine';
import { AnimeVfxSystem } from '../ui/vfx';

interface MainPortalViewProps {
  onSelectGame: (game: 'manager' | 'fishing') => void;
  userName?: string;
  userEmail?: string;
  accountLevel?: number;
  onLogout?: () => void;
}

export const MainPortalView: React.FC<MainPortalViewProps> = ({
  onSelectGame,
  userName,
  accountLevel = 1,
  onLogout
}) => {
  const [lang, setLang] = useState<GameLang>(() => getSavedLang());
  const [muted, setMuted] = useState<boolean>(() => soundEngine.getSettings().muted);
  const t = FISHING_UI[lang];

  const handleToggleLang = () => {
    const next: GameLang = lang === 'th' ? 'en' : 'th';
    setLang(next);
    saveLang(next);
    soundEngine.playClick();
  };

  const handleToggleMute = () => {
    const m = soundEngine.toggleMute();
    setMuted(m);
    if (!m) soundEngine.playClick();
  };
  return (
    <div className="min-h-screen bg-[#07070a] text-zinc-100 flex flex-col relative overflow-hidden font-sans selection:bg-[#ff4655] selection:text-white">
      {/* Riot Crimson & Noir Ambient Glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[550px] h-[550px] rounded-full bg-[#ff4655]/10 blur-[140px]" />
      <div className="pointer-events-none absolute top-1/2 -right-40 w-[550px] h-[550px] rounded-full bg-[#d13639]/10 blur-[150px]" />

      {/* Header */}
      <header className="relative z-10 border-b border-zinc-800/80 bg-[#07070a]/90 backdrop-blur-md px-6 lg:px-12 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 bg-[#ff4655] flex items-center justify-center font-black text-white text-base shadow-lg shadow-[#ff4655]/30 tracking-tighter"
            style={{
              clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)'
            }}
          >
            E
          </div>
          <div>
            <span className="font-black text-sm tracking-widest text-white uppercase font-mono">
              ESPICIAN <span className="text-[#ff4655]">HUB</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleToggleLang}
            className="px-2.5 py-1 bg-zinc-900 hover:border-[#ff4655] border border-zinc-800 text-xs font-extrabold text-zinc-200 hover:text-[#ff4655] flex items-center gap-1.5 transition"
          >
            <Globe className="w-3.5 h-3.5 text-[#ff4655]" />
            {lang.toUpperCase()}
          </button>
          <button
            onClick={handleToggleMute}
            className="p-1.5 bg-zinc-900 hover:border-[#ff4655] border border-zinc-800 text-zinc-300 hover:text-[#ff4655] transition"
          >
            {muted ? <VolumeX className="w-4 h-4 text-[#ff4655]" /> : <Volume2 className="w-4 h-4" />}
          </button>
          {userName && (
            <div className="px-3 py-1 bg-zinc-900 border border-zinc-800 flex items-center gap-2 text-xs font-mono">
              <span className="font-bold text-zinc-200">{userName}</span>
              <span className="px-1.5 py-0.2 bg-[#ff4655]/20 text-[#ff4655] font-extrabold text-[10px]">
                LV.{accountLevel}
              </span>
            </div>
          )}
          {onLogout && (
            <button
              onClick={() => {
                soundEngine.playClick();
                onLogout();
              }}
              title={t.portalLogout}
              className="p-1.5 bg-zinc-900 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-300 border border-zinc-800 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Game Selection Grid */}
      <main className="relative z-10 max-w-4xl w-full mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full"
        >
          {/* Card 1: Espician Manager */}
          <motion.button
            whileHover={{ scale: 1.025, y: -3 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            onClick={(e) => {
              soundEngine.playClick();
              AnimeVfxSystem.createRippleShockwave(e, 'rgba(255, 70, 85, 0.45)');
              setTimeout(() => onSelectGame('manager'), 120);
            }}
            className="group relative bg-[#0d0e14] border border-zinc-800 hover:border-[#ff4655] p-7 text-left transition-colors duration-300 shadow-2xl hover:shadow-[#ff4655]/20 flex flex-col justify-between overflow-hidden select-none"
            style={{
              clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)'
            }}
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div
                  className="w-13 h-13 p-3 bg-zinc-900 border border-zinc-800 group-hover:border-[#ff4655] group-hover:bg-[#ff4655]/10 flex items-center justify-center transition"
                  style={{
                    clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)'
                  }}
                >
                  <Trophy className="w-7 h-7 text-[#ff4655]" />
                </div>
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest group-hover:text-[#ff4655] transition">
                  01 / SIMULATOR
                </span>
              </div>
              <h2 className="text-xl font-black text-white tracking-wide uppercase mb-1">
                Espician Manager
              </h2>
              <p className="text-xs text-zinc-400 font-mono mb-6">
                {t.managerSubtitle}
              </p>
            </div>

            <div
              className="flex items-center justify-center gap-2 py-2.5 bg-zinc-900 border border-zinc-800 group-hover:bg-[#ff4655] group-hover:border-[#ff4655] text-white font-black text-xs uppercase tracking-wider transition"
              style={{
                clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)'
              }}
            >
              <Play className="w-3.5 h-3.5 fill-current" /> {t.portalPlay}
            </div>
          </motion.button>

          {/* Card 2: Espician Fishing */}
          <motion.button
            whileHover={{ scale: 1.025, y: -3 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            onClick={(e) => {
              soundEngine.playClick();
              AnimeVfxSystem.createRippleShockwave(e, 'rgba(14, 165, 233, 0.45)');
              setTimeout(() => onSelectGame('fishing'), 120);
            }}
            className="group relative bg-[#0d0e14] border border-zinc-800 hover:border-sky-400 p-7 text-left transition-colors duration-300 shadow-2xl hover:shadow-sky-500/20 flex flex-col justify-between overflow-hidden select-none"
            style={{
              clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)'
            }}
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div
                  className="w-13 h-13 p-3 bg-zinc-900 border border-zinc-800 group-hover:border-sky-400 group-hover:bg-sky-500/10 flex items-center justify-center transition"
                  style={{
                    clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)'
                  }}
                >
                  <Anchor className="w-7 h-7 text-sky-400" />
                </div>
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest group-hover:text-sky-400 transition">
                  02 / 2D ANIME OCEAN
                </span>
              </div>
              <h2 className="text-xl font-black text-white tracking-wide uppercase mb-1">
                Espician Fishing
              </h2>
              <p className="text-xs text-zinc-400 font-mono mb-6">
                {t.fishingSubtitle}
              </p>
            </div>

            <div
              className="flex items-center justify-center gap-2 py-2.5 bg-zinc-900 border border-zinc-800 group-hover:bg-sky-500 group-hover:border-sky-500 text-white font-black text-xs uppercase tracking-wider transition"
              style={{
                clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)'
              }}
            >
              <Play className="w-3.5 h-3.5 fill-current" /> {t.portalPlay}
            </div>
          </motion.button>
        </motion.div>
      </main>
    </div>
  );
};
