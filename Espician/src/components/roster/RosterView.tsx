import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { PlayerData } from '../../types';
import { CombatPointCalculator } from '../../core/calculators/CombatPointCalculator';
import { 
  Dna, 
  BatteryCharging, 
  Heart, 
  Zap, 
  Crosshair, 
  Eye, 
  Award, 
  Activity, 
  Sparkles,
  Gamepad2
} from 'lucide-react';

export const RosterView: React.FC = () => {
  const { myTeam, treatPlayerCondition } = useGameStore();
  const [inspectPlayer, setInspectPlayer] = useState<PlayerData | null>(null);
  const [treatFeedback, setTreatFeedback] = useState<string | null>(null);

  const roleColors: Record<string, string> = {
    Top: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    Jungle: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    Mid: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    ADC: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    Support: 'bg-pink-500/10 text-pink-400 border-pink-500/30'
  };

  const handleTreat = (playerId: string, condId: string) => {
    const res = treatPlayerCondition(playerId, condId);
    setTreatFeedback(res.message);
    if (inspectPlayer && inspectPlayer.id === playerId) {
      setInspectPlayer({
        ...inspectPlayer,
        conditions: inspectPlayer.conditions.filter((c) => c.id !== condId)
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      {/* Overview Banner */}
      <div className="bg-[#121826] border border-[#23304c] rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Dna className="w-6 h-6 text-indigo-400" /> ข้อมูลนักกีฬา พลังรบ (Combat Point) & เกียร์ (Active Roster)
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            วิเคราะห์คะแนน Combat Point (CP), เลเวล & ค่าประสบการณ์, อุปกรณ์เกมมิ่งเกียร์ที่ติดตั้ง และสถานะความพร้อม
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">ขนาดสโมสร</div>
          <div className="text-lg font-bold text-indigo-400 font-mono">{myTeam.roster.length} คนในสังกัด</div>
        </div>
      </div>

      {treatFeedback && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{treatFeedback}</span>
          <button onClick={() => setTreatFeedback(null)} className="text-slate-400 hover:text-white font-bold">✕</button>
        </div>
      )}

      {/* Players Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {myTeam.roster.map((player) => {
          const cpData = CombatPointCalculator.calculate(player);
          const expPercent = Math.min(100, Math.round(((player.exp || 0) / (player.maxExp || 500)) * 100));

          return (
            <div
              key={player.id}
              className="bg-[#141c2e] border border-[#202d47] hover:border-[#314468] rounded-2xl p-5 shadow-lg flex flex-col justify-between transition hover:-translate-y-1 space-y-4"
            >
              <div>
                {/* Header: Avatar, Name, Role & Combat Point Badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={player.avatar}
                      alt={player.inGameName}
                      className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 p-1"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-white">{player.inGameName}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${roleColors[player.role]}`}>
                          {player.role}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {player.realName} • อายุ {player.age} ปี
                      </div>
                    </div>
                  </div>

                  {/* CP Badge */}
                  <div className={`px-2.5 py-1 rounded-xl border text-center font-mono ${cpData.tierColor}`}>
                    <div className="text-[8px] uppercase tracking-wider font-bold">{cpData.tier}</div>
                    <div className="text-sm font-black leading-none">CP {cpData.totalCP}</div>
                  </div>
                </div>

                {/* Level & EXP Bar */}
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 mb-3 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-indigo-400 font-mono">Lv. {player.level || 1}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{player.exp || 0} / {player.maxExp || 500} EXP</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all"
                      style={{ width: `${expPercent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Conditions / Buffs / Debuffs Pills */}
                <div className="flex flex-wrap gap-1.5 mb-3 min-h-[22px]">
                  {player.conditions.length === 0 ? (
                    <span className="text-[10px] text-slate-500 italic">สุขภาพปกติ ไม่มีดีบัฟ</span>
                  ) : (
                    player.conditions.map((c) => (
                      <span
                        key={c.id}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 ${
                          c.type === 'buff'
                            ? 'bg-orange-950/60 text-orange-400 border border-orange-800/50'
                            : c.type === 'trait'
                            ? 'bg-purple-950/60 text-purple-400 border border-purple-800/50'
                            : 'bg-rose-950/60 text-rose-400 border border-rose-800/50'
                        }`}
                        title={c.effectText}
                      >
                        {c.icon} {c.name} {c.durationDays ? `(${c.durationDays}d)` : ''}
                      </span>
                    ))
                  )}
                </div>

                {/* Status bars (Energy & Morale) */}
                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="flex items-center gap-1"><BatteryCharging className="w-3 h-3 text-emerald-400" /> พลังงาน</span>
                      <span className="font-semibold text-emerald-400 font-mono">{player.energy}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${player.energy}%` }}></div>
                    </div>
                  </div>

                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-rose-400" /> ขวัญกำลังใจ</span>
                      <span className="font-semibold text-rose-400 font-mono">{player.morale}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full" style={{ width: `${player.morale}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Core Stats Overview */}
                <div className="grid grid-cols-2 gap-2 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-400">Mechanics:</span>{' '}
                    <strong className="text-cyan-300 font-mono">{player.stats.mechanics}</strong>{' '}
                    <span className="text-slate-500 font-mono text-[10px]">/{player.dna.maxMechanicsCap}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Awareness:</span>{' '}
                    <strong className="text-indigo-300 font-mono">{player.stats.mapAwareness}</strong>{' '}
                    <span className="text-slate-500 font-mono text-[10px]">/{player.dna.maxAwarenessCap}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Clutch:</span> <strong className="text-amber-300 font-mono">{player.stats.clutch}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Stamina:</span> <strong className="text-teal-300 font-mono">{player.stats.stamina}</strong>
                  </div>
                </div>

                {/* Equipped Gear Row */}
                <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Gamepad2 className="w-3.5 h-3.5 text-indigo-400" /> เกียร์ที่สวมใส่:
                  </span>
                  <div className="flex items-center gap-1 text-sm">
                    <span>{player.equippedGear?.mouse ? '🖱️' : '⚪'}</span>
                    <span>{player.equippedGear?.keyboard ? '⌨️' : '⚪'}</span>
                    <span>{player.equippedGear?.monitor ? '🖥️' : '⚪'}</span>
                    <span>{player.equippedGear?.headset ? '🎧' : '⚪'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <button
                onClick={() => setInspectPlayer(player)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold py-2 px-3 rounded-xl text-xs transition border border-slate-700/60 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" /> ส่อง DNA ละเอียด & รักษาอาการ
              </button>
            </div>
          );
        })}
      </div>

      {/* Inspect & Treatment Modal */}
      {inspectPlayer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#121826] border border-[#23304c] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={inspectPlayer.avatar} alt="" className="w-12 h-12 rounded-lg bg-slate-800 p-1 border border-slate-700" />
                <div>
                  <h3 className="text-xl font-bold text-white">{inspectPlayer.inGameName}</h3>
                  <p className="text-xs text-slate-400">{inspectPlayer.realName} • {inspectPlayer.role} • ${inspectPlayer.salary}/wk</p>
                </div>
              </div>
              <button
                onClick={() => setInspectPlayer(null)}
                className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Combat Point Breakdown */}
            {(() => {
              const breakdown = CombatPointCalculator.calculate(inspectPlayer);
              return (
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">สูตรคำนวณ Combat Point (CP):</span>
                    <span className={`px-2.5 py-0.5 rounded-lg border font-mono font-bold text-xs ${breakdown.tierColor}`}>
                      {breakdown.tier} (CP {breakdown.totalCP})
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
                    <div>สเตตัสหลักประจำตำแหน่ง: <strong className="text-white">{breakdown.baseStatScore} pt</strong></div>
                    <div>โบนัสพรสวรรค์ DNA: <strong className="text-teal-400">+{breakdown.dnaTalentBonus} pt</strong></div>
                    <div>โบนัสอุปกรณ์เกียร์: <strong className="text-amber-400">+{breakdown.gearBonus} pt</strong></div>
                    <div>โบนัสเลเวล & นิสัย: <strong className="text-indigo-400">{breakdown.conditionModifier + breakdown.levelBonus} pt</strong></div>
                  </div>
                </div>
              );
            })()}

            {/* Condition & Medical Action */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">สถานะบัฟ/ดีบัฟ ปัจจุบัน</span>
              {inspectPlayer.conditions.length === 0 ? (
                <div className="text-xs text-slate-400 bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                  นักแข่งสุขภาพสมบูรณ์ ฟอร์มคงที่ ไม่มีอาการเจ็บป่วยหรือดีบัฟ
                </div>
              ) : (
                <div className="space-y-2">
                  {inspectPlayer.conditions.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          {c.icon} {c.name}
                        </div>
                        <div className="text-slate-400 text-[11px]">{c.effectText}</div>
                      </div>

                      {c.type === 'debuff' && (
                        <button
                          onClick={() => handleTreat(inspectPlayer.id, c.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shrink-0"
                        >
                          ส่งรักษา ($600)
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setInspectPlayer(null)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl text-xs transition"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
