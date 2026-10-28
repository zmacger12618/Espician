import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { PlayerRole, TeamTactic } from '../../types';
import { SlidersHorizontal, ShieldAlert, Zap, Compass, Split } from 'lucide-react';

export const TacticsView: React.FC = () => {
  const { myTeam, setTeamTactic, assignLineup } = useGameStore();

  const roles: PlayerRole[] = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'];

  const tactics: {
    id: TeamTactic;
    title: string;
    description: string;
    icon: React.FC<{ className?: string }>;
    bonus: string;
  }[] = [
    {
      id: 'Balanced',
      title: 'สมดุลรอบด้าน (Balanced Strategy)',
      description: 'เน้นฟาร์มตามจังหวะ คุมออบเจกต์ ไม่เสี่ยงเกินตัว',
      icon: Compass,
      bonus: 'ดาเมจ 100% | ป้องกัน 100% | อัตราโรมมิ่ง 50%'
    },
    {
      id: 'Aggressive',
      title: 'บุกดุดันต้นเกม (Early Game Aggro)',
      description: 'อินเวดป่า ดักแก๊งค์เลน กดดันไม่ให้คู่แข่งฟาร์มสบาย',
      icon: Zap,
      bonus: 'ดาเมจ +15% | โดนสวนกลับแรงขึ้น +10% | อัตราโรมมิ่ง 70%'
    },
    {
      id: 'LateGameScaling',
      title: 'ควบคุมและยื้อเลทเกม (Scaling Turtle)',
      description: 'เล่นปลอดภัยหน้าป้อม รอแครี่ไอเทมฟูลแล้วรวมไฟต์ใหญ่',
      icon: ShieldAlert,
      bonus: 'พลังป้องกัน +15% | ดาเมจต้นเกม -5% | เน้นคุมพื้นที่'
    },
    {
      id: 'SplitPush',
      title: 'ดันแยกเลนคู่ขนาน (1-3-1 Split Push)',
      description: 'ให้โซโล่เลนดันป้อมลึก บังคับให้ศัตรูต้องแยกตัวมารับมือ',
      icon: Split,
      bonus: 'ดาเมจป้อม +20% | เสี่ยงโดนรุม 4v5 กลางแผนที่'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      {/* Banner */}
      <div className="bg-[#121826] border border-[#23304c] rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <SlidersHorizontal className="w-6 h-6 text-indigo-400" /> แผนกลยุทธ์และการจัดตัวผู้เล่น (Tactics & Lineup)
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            กำหนดสไตล์การเล่นของทีมและเลือกตัวจริงที่จะลงแข่งขันในแต่ละตำแหน่ง
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lineup assignment */}
        <div className="bg-[#141c2e] border border-[#202d47] rounded-2xl p-6 shadow-lg space-y-4">
          <h3 className="font-bold text-base text-white border-b border-slate-800 pb-3 flex items-center justify-between">
            <span>ผังตัวจริง 5 ตำแหน่ง</span>
            <span className="text-xs text-indigo-400 font-mono">Match Ready</span>
          </h3>

          <div className="space-y-3">
            {roles.map((role) => {
              const currentAssignedId = myTeam.selectedLineup[role];
              const currentPlayer = myTeam.roster.find((p) => p.id === currentAssignedId) || myTeam.roster[0];

              return (
                <div
                  key={role}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/50 border border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-14 text-xs font-bold text-indigo-400 bg-indigo-950/60 border border-indigo-800/40 px-2.5 py-1 rounded-md text-center">
                      {role}
                    </span>
                    <div>
                      <div className="font-bold text-sm text-white">{currentPlayer.inGameName}</div>
                      <div className="text-xs text-slate-400">
                        Mechanics: <strong className="text-cyan-300 font-mono">{currentPlayer.stats.mechanics}</strong> • Awareness: <strong className="text-indigo-300 font-mono">{currentPlayer.stats.mapAwareness}</strong> • Clutch: <strong className="text-amber-300 font-mono">{currentPlayer.stats.clutch}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Selector */}
                  <select
                    value={currentPlayer.id}
                    onChange={(e) => assignLineup(role, e.target.value)}
                    className="bg-[#182032] border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    {myTeam.roster.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.inGameName} ({p.role})
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tactical Stance */}
        <div className="bg-[#141c2e] border border-[#202d47] rounded-2xl p-6 shadow-lg space-y-4">
          <h3 className="font-bold text-base text-white border-b border-slate-800 pb-3">
            สไตล์การเล่นของทีม (Team Philosophy)
          </h3>

          <div className="space-y-3">
            {tactics.map((tac) => {
              const Icon = tac.icon;
              const isSelected = myTeam.currentTactic === tac.id;

              return (
                <button
                  key={tac.id}
                  onClick={() => setTeamTactic(tac.id)}
                  className={`w-full text-left p-4 rounded-xl border transition flex items-start gap-3.5 ${
                    isSelected
                      ? 'bg-indigo-600/10 border-indigo-500/50 shadow-md shadow-indigo-600/10'
                      : 'bg-slate-900/30 border-slate-800 hover:bg-slate-900/60'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{tac.title}</span>
                      {isSelected && (
                        <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/40">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{tac.description}</p>
                    <div className="text-[11px] font-mono text-indigo-300 mt-2 bg-slate-950/60 px-2 py-0.5 rounded inline-block">
                      {tac.bonus}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
