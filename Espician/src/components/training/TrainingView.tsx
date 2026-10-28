import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { TrainingType, TRAINING_COSTS } from '../../core/calculators/trainingCalculator';
import { Dumbbell, Crosshair, Eye, Users, Award, AlertCircle, CheckCircle2, Zap, Activity } from 'lucide-react';

export const TrainingView: React.FC = () => {
  const { myTeam, trainPlayer, lastTrainingLog } = useGameStore();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(myTeam.roster[0]?.id || '');
  const [actionFeedback, setActionFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  const activePlayer = myTeam.roster.find((p) => p.id === selectedPlayerId) || myTeam.roster[0];

  const handleTrain = (type: TrainingType) => {
    if (!activePlayer) return;
    const res = trainPlayer(activePlayer.id, type);
    setActionFeedback({ success: res.success, msg: res.message });
  };

  const drills: {
    type: TrainingType;
    title: string;
    description: string;
    icon: React.FC<{ className?: string }>;
    cost: number;
    statCurrent: number;
    statCap: number;
  }[] = [
    {
      type: 'mechanics',
      title: 'Mechanics Bootcamp (ความแม่นยำและการกดสกิล)',
      description: 'ซ้อมลาสครีปและคอมโบสกิล เพิ่มดาเมจและความเร็วในการออกของ',
      icon: Crosshair,
      cost: TRAINING_COSTS.mechanics,
      statCurrent: activePlayer?.stats.mechanics || 0,
      statCap: activePlayer?.dna.maxMechanicsCap || 100
    },
    {
      type: 'mapAwareness',
      title: 'Macro & Map Awareness (การอ่านแผนที่)',
      description: 'วิเคราะห์มุมอับ วอร์ด และการดักแก๊งค์ ช่วยเพิ่มอัตราการหลบดาเมจ',
      icon: Eye,
      cost: TRAINING_COSTS.mapAwareness,
      statCurrent: activePlayer?.stats.mapAwareness || 0,
      statCap: activePlayer?.dna.maxAwarenessCap || 100
    },
    {
      type: 'teamwork',
      title: 'Team Synergy Scrim (ทีมเวิร์กและการเติมเพื่อน)',
      description: 'ซ้อมไฟต์ 5v5 และการเข้าออกจังหวะปะทะร่วมกับเพื่อนร่วมทีม',
      icon: Users,
      cost: TRAINING_COSTS.teamwork,
      statCurrent: activePlayer?.stats.teamwork || 0,
      statCap: 100
    },
    {
      type: 'clutch',
      title: 'Clutch Training (การคุมสมาธิจังหวะคับขัน)',
      description: 'จำลองสถานการณ์เลือดน้อยและโดนรุม เพิ่มโอกาสพลิกเกม',
      icon: Zap,
      cost: TRAINING_COSTS.clutch,
      statCurrent: activePlayer?.stats.clutch || 0,
      statCap: 100
    },
    {
      type: 'stamina',
      title: 'Physical & Stamina (ความอึดและฟิตเนส)',
      description: 'ฟิตเนสกล้ามเนื้อ ช่วยลดอัตราการเสียพลังงานในการซ้อมและแข่ง',
      icon: Activity,
      cost: TRAINING_COSTS.stamina,
      statCurrent: activePlayer?.stats.stamina || 0,
      statCap: 100
    },
    {
      type: 'professionalism',
      title: 'Mindset & Professionalism (วินัยมืออาชีพ)',
      description: 'ลดความดื้อรั้น (Ego) เสริมสร้างวินัยในการปฏิบัติตามแผนโค้ช',
      icon: Award,
      cost: TRAINING_COSTS.professionalism,
      statCurrent: activePlayer?.stats.professionalism || 0,
      statCap: 100
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-[#121826] border border-[#23304c] rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Dumbbell className="w-6 h-6 text-indigo-400" /> แคมป์ฝึกซ้อมวิทยาศาสตร์การกีฬา (Training Facility)
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            เลือกนักแข่งและจัดคอร์สฝึกเฉพาะด้าน การพัฒนาจะขึ้นอยู่กับค่า LearningSpeed และจำกัดโดย DNA Cap
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#182032] px-4 py-2 rounded-xl border border-[#23304c]">
          <span className="text-xs text-slate-400">งบประมาณพร้อมใช้:</span>
          <span className="text-base font-bold text-amber-400 font-mono">${myTeam.totalBudget.toLocaleString()}</span>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Player Selector & Profile */}
        <div className="space-y-4">
          <div className="bg-[#141c2e] border border-[#202d47] rounded-xl p-5 shadow-lg">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              เลือกนักแข่งเพื่อฝึกซ้อม
            </label>
            <div className="space-y-2">
              {myTeam.roster.map((player) => {
                const isSelected = player.id === activePlayer.id;
                return (
                  <button
                    key={player.id}
                    onClick={() => {
                      setSelectedPlayerId(player.id);
                      setActionFeedback(null);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500/50 text-white'
                        : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img src={player.avatar} alt="" className="w-9 h-9 rounded-md bg-slate-800" />
                      <div>
                        <div className="font-bold text-sm">{player.inGameName}</div>
                        <div className="text-[11px] text-slate-400">{player.role} • พลังงาน {player.energy}%</div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-indigo-400 font-mono">
                      x{player.dna.learningSpeed}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Player DNA Highlights */}
          {activePlayer && (
            <div className="bg-[#141c2e] border border-[#202d47] rounded-xl p-5 shadow-lg space-y-3">
              <h3 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-2 flex items-center justify-between">
                <span>พันธุกรรมของ {activePlayer.inGameName}</span>
                <span className="text-xs text-teal-400 font-mono">Speed x{activePlayer.dna.learningSpeed}</span>
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400">เพดาน Mechanics</span>
                  <div className="text-base font-bold text-cyan-400 font-mono">{activePlayer.dna.maxMechanicsCap} pt</div>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400">เพดาน Awareness</span>
                  <div className="text-base font-bold text-indigo-400 font-mono">{activePlayer.dna.maxAwarenessCap} pt</div>
                </div>
              </div>

              {/* Conditions summary */}
              {activePlayer.conditions.length > 0 && (
                <div className="pt-1">
                  <span className="text-[10px] text-slate-400 font-semibold block mb-1">ผลกระทบจากบัฟ/ดีบัฟ:</span>
                  <div className="space-y-1">
                    {activePlayer.conditions.map((c) => (
                      <div key={c.id} className="text-[11px] text-slate-300 flex items-center gap-1.5">
                        <span>{c.icon}</span> <span>{c.name}: {c.effectText}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Available Training Courses */}
        <div className="lg:col-span-2 space-y-4">
          {/* Feedback banner */}
          {(actionFeedback || lastTrainingLog) && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 transition ${
                actionFeedback?.success ?? true
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}
            >
              {actionFeedback?.success ?? true ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs font-semibold leading-relaxed">
                {actionFeedback?.msg || lastTrainingLog}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drills.map((drill) => {
              const Icon = drill.icon;
              const isHitCap = drill.statCurrent >= drill.statCap;
              const canAfford = myTeam.totalBudget >= drill.cost;
              const hasEnergy = (activePlayer?.energy || 0) >= 20;

              return (
                <div
                  key={drill.type}
                  className="bg-[#141c2e] border border-[#202d47] rounded-xl p-5 shadow-lg flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-sm text-amber-400 font-mono">${drill.cost}</span>
                    </div>

                    <h4 className="font-bold text-sm text-white">{drill.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{drill.description}</p>

                    {/* Progress to Cap */}
                    <div className="pt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">ระดับปัจจุบัน:</span>
                        <span className="font-bold text-slate-200 font-mono">
                          {drill.statCurrent} / {drill.statCap}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, (drill.statCurrent / drill.statCap) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={isHitCap || !canAfford || !hasEnergy}
                    onClick={() => handleTrain(drill.type)}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
                      isHitCap
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                        : !canAfford
                        ? 'bg-red-950/40 text-red-400 cursor-not-allowed border border-red-800/40'
                        : !hasEnergy
                        ? 'bg-amber-950/40 text-amber-400 cursor-not-allowed border border-amber-800/40'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                    }`}
                  >
                    {isHitCap ? (
                      'ชนเพดานพรสวรรค์แล้ว (Maxed)'
                    ) : !canAfford ? (
                      'งบประมาณไม่พอ'
                    ) : !hasEnergy ? (
                      'เหนื่อยเกินไป (ต้องพักผ่อน)'
                    ) : (
                      <>
                        <Dumbbell className="w-4 h-4" /> เริ่มการฝึกซ้อม (${drill.cost})
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
