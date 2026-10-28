import React, { useState } from 'react';
import { PlayerData } from '../../types';
import { CombatPointCalculator } from '../../core/calculators/CombatPointCalculator';
import { Sparkles, Check, Gift, ArrowRight } from 'lucide-react';

interface StarterPackModalProps {
  isOpen: boolean;
  starterSquad: PlayerData[];
  onConfirm: () => void;
}

export const StarterPackModal: React.FC<StarterPackModalProps> = ({
  isOpen,
  starterSquad,
  onConfirm
}) => {
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [isPackOpened, setIsPackOpened] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleOpenPack = () => {
    setIsPackOpened(true);
    // Flip cards sequentially with cool animation
    starterSquad.forEach((_, idx) => {
      setTimeout(() => {
        setFlippedCards((prev) => ({ ...prev, [idx]: true }));
      }, (idx + 1) * 350);
    });
  };

  const allFlipped = starterSquad.every((_, idx) => flippedCards[idx]);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-lg z-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-[#0e1424] border border-[#212d47] rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold mb-2">
            <Gift className="w-4 h-4" /> ปลดล็อกชุดนักแข่งเริ่มต้น (Starter Roster 5v5)
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {isPackOpened ? 'ยินดีต้อนรับนักแข่ง 5 คนแรกเข้าสู่สโมสร!' : 'ซองการ์ดนักแข่งชุดเริ่มต้นของคุณ'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-lg mx-auto">
            {isPackOpened
              ? 'นักแข่งชุดนี้มีค่าพลังรบ (CP) ระดับเริ่มต้นที่สมดุล พร้อมให้คุณพัฒนาและปั้นฝีมือไปสู่ระดับโลก'
              : 'ผ่านแมตช์ฝึกสอนเรียบร้อย! กดเปิดซองเพื่อสุ่มเปิดตัวจริง 5 ตำแหน่ง (Top, Jungle, Mid, ADC, Support)'}
          </p>
        </div>

        {!isPackOpened ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-6">
            <div
              onClick={handleOpenPack}
              className="cursor-pointer group relative w-44 h-64 rounded-2xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-violet-500 p-1 shadow-2xl shadow-indigo-500/40 transform hover:scale-105 transition-all duration-300 flex flex-col items-center justify-between p-4"
            >
              <div className="w-full flex justify-between text-xs font-bold text-indigo-200">
                <span>ESPICIAN</span>
                <span>PACK</span>
              </div>
              <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center text-4xl shadow-inner animate-pulse">
                🎁
              </div>
              <div className="text-xs font-extrabold text-white tracking-wider uppercase group-hover:tracking-widest transition-all">
                CLICK TO OPEN
              </div>
            </div>

            <button
              onClick={handleOpenPack}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm transition shadow-xl shadow-amber-500/30 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> กดเปิดซองนักแข่งเริ่มต้น
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 5 Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
              {starterSquad.map((player, idx) => {
                const isFlipped = flippedCards[idx];
                const cpData = CombatPointCalculator.calculate(player);

                return (
                  <div
                    key={player.id}
                    className={`h-72 rounded-2xl transition-all duration-500 transform ${
                      isFlipped
                        ? 'bg-[#141b2e] border border-[#23314d] shadow-xl translate-y-0 opacity-100'
                        : 'bg-indigo-950 border border-indigo-800 scale-95 opacity-50'
                    } flex flex-col justify-between p-3.5 text-left relative overflow-hidden`}
                  >
                    {isFlipped ? (
                      <>
                        {/* Top: Role & CP */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-indigo-400 border border-slate-700">
                            {player.role}
                          </span>
                          <span className={`text-[11px] font-black font-mono px-2 py-0.5 rounded-lg border ${cpData.tierColor}`}>
                            CP {cpData.totalCP}
                          </span>
                        </div>

                        {/* Middle: Avatar & InGameName */}
                        <div className="text-center my-auto space-y-1">
                          <img
                            src={player.avatar}
                            alt=""
                            className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 p-1 mx-auto shadow-md"
                          />
                          <div className="font-extrabold text-sm text-white truncate">{player.inGameName}</div>
                          <div className="text-[10px] text-slate-400">อายุ {player.age} ปี • Lv.{player.level}</div>
                        </div>

                        {/* Traits & Key stats */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-[10px]">
                          {player.conditions.length > 0 && (
                            <div className="text-slate-300 truncate">
                              {player.conditions[0].icon} {player.conditions[0].name}
                            </div>
                          )}
                          <div className="flex justify-between text-slate-400">
                            <span>DNA Speed:</span>
                            <strong className="text-teal-400 font-mono">x{player.dna.learningSpeed}</strong>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Mechanics:</span>
                            <strong className="text-cyan-400 font-mono">{player.stats.mechanics}</strong>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center space-y-2 text-indigo-300">
                        <Sparkles className="w-6 h-6 animate-spin" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">กำลังเปิดการ์ด...</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Confirm button */}
            {allFlipped && (
              <button
                onClick={onConfirm}
                className="w-full sm:w-auto px-10 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm transition shadow-lg shadow-emerald-600/30 inline-flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> เข้าสู่เซสชันบริหารสโมสรทันที <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
