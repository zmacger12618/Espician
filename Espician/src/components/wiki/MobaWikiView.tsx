import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { CHAMPIONS_DATABASE } from '../../core/data/championsDatabase';
import { ChampionData, ChampionRole, MetaTier } from '../../types';
import { 
  Flame, 
  TrendingUp, 
  RefreshCw, 
  ShieldAlert, 
  Swords, 
  Crosshair, 
  Info,
  Award
} from 'lucide-react';

export const MobaWikiView: React.FC = () => {
  const { currentPatch, updatePatchNotes, championPvPStats } = useGameStore();
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [inspectChamp, setInspectChamp] = useState<ChampionData | null>(null);

  const filteredChamps = CHAMPIONS_DATABASE.filter((c) => {
    const roleMatch = selectedRole === 'All' || c.role === selectedRole;
    const tierMatch = selectedTier === 'All' || c.metaTier === selectedTier;
    return roleMatch && tierMatch;
  });

  const roles: ('All' | ChampionRole)[] = ['All', 'Tank', 'Assassin', 'Mage', 'Marksman', 'Support'];
  const tiers: ('All' | MetaTier)[] = ['All', 'S', 'A', 'B'];

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      {/* Header Banner: Patch Notes & Server Meta */}
      <div className="bg-[#0e1424] border border-[#212d47] rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30 font-mono">
                PATCH {currentPatch.version}
              </span>
              <span className="text-xs text-slate-400">• อัปเดต: {currentPatch.releaseDate}</span>
            </div>
            <h2 className="text-2xl font-black text-white">{currentPatch.title}</h2>
          </div>

          <button
            onClick={() => updatePatchNotes()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition shadow-sm"
            title="จำลองเซิร์ฟเวอร์อัปเดตแพตช์และเปลี่ยนเมต้าแชมเปี้ยน"
          >
            <RefreshCw className="w-4 h-4 text-indigo-400" /> อัปเดตแพตช์ใหม่ (Simulate Patch Update)
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          {currentPatch.metaDescription}
        </p>

        {/* Buffed & Nerfed Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
          <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-2.5">
            <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-emerald-300 block mb-0.5">บัฟในแพตช์นี้ (+10% Combat Efficiency):</strong>
              <div className="text-slate-300 flex flex-wrap gap-1.5 mt-1">
                {currentPatch.buffedChampions.map((cId) => {
                  const ch = CHAMPIONS_DATABASE.find((c) => c.id === cId);
                  return (
                    <span key={cId} className="px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-800/50">
                      {ch?.icon} {ch?.name || cId}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-rose-300 block mb-0.5">เนิร์ฟในแพตช์นี้ (-8% Combat Efficiency):</strong>
              <div className="text-slate-300 flex flex-wrap gap-1.5 mt-1">
                {currentPatch.nerfedChampions.map((cId) => {
                  const ch = CHAMPIONS_DATABASE.find((c) => c.id === cId);
                  return (
                    <span key={cId} className="px-2 py-0.5 rounded bg-rose-900/40 text-rose-300 border border-rose-800/50">
                      {ch?.icon} {ch?.name || cId}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        {/* Role Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-xs text-slate-400 mr-2 font-medium">ตำแหน่ง:</span>
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRole(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedRole === r
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800/40 text-slate-400 hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Tier Filters */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 mr-1 font-medium">Meta Tier:</span>
          {tiers.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTier(t)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                selectedTier === t
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800/40 text-slate-400 hover:text-white'
              }`}
            >
              {t === 'All' ? 'ทั้งหมด' : `${t}-Tier`}
            </button>
          ))}
        </div>
      </div>

      {/* 40 Champions Database Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredChamps.map((champ) => {
          const pvp = championPvPStats[champ.id] || { picks: 0, wins: 0, kills: 0, deaths: 0, assists: 0 };
          const winRate = pvp.picks > 0 ? Math.round((pvp.wins / pvp.picks) * 100) : 50;

          return (
            <div
              key={champ.id}
              onClick={() => setInspectChamp(champ)}
              className="cursor-pointer bg-[#141b2e] border border-[#202d47] hover:border-[#384b72] rounded-2xl p-4 shadow-lg flex flex-col justify-between space-y-3 transition hover:-translate-y-1"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{champ.icon}</span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-black border font-mono ${
                      champ.metaTier === 'S'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm shadow-amber-500/20'
                        : champ.metaTier === 'A'
                        ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {champ.metaTier}-TIER
                  </span>
                </div>

                <h3 className="font-extrabold text-sm text-white truncate">{champ.name}</h3>
                <p className="text-[11px] text-slate-400 truncate">{champ.title}</p>
                <div className="text-[10px] text-indigo-300 font-semibold mt-1">สาย: {champ.role}</div>

                {/* Counter Matchups Preview */}
                <div className="mt-2.5 space-y-1 text-[10px] bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                  <div className="text-emerald-400 truncate">
                    ⚔️ ได้เปรียบ: {champ.counterStrongAgainst.length} ตัว
                  </div>
                  <div className="text-rose-400 truncate">
                    🛡️ แพ้ทาง: {champ.counterWeakAgainst.length} ตัว
                  </div>
                </div>
              </div>

              {/* PvP Community Stats */}
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] font-mono text-slate-400">
                <span>PvP Win Rate: <strong className="text-amber-400">{winRate}%</strong></span>
                <span>Picks: <strong className="text-white">{pvp.picks}</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Champion Detail Modal (Skills & Lore) */}
      {inspectChamp && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#121826] border border-[#23304c] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{inspectChamp.icon}</span>
                <div>
                  <h3 className="text-lg font-black text-white">{inspectChamp.name}</h3>
                  <p className="text-xs text-slate-400">{inspectChamp.title} • {inspectChamp.role}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectChamp(null)}
                className="text-slate-400 hover:text-white font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* 4 Skills List */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                ชุดสกิลการต่อสู้ (Passive, Q, W, E, R)
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {inspectChamp.skills.map((s) => (
                  <div key={s.key} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-0.5">
                    <div className="flex items-center justify-between font-bold text-white">
                      <span className="text-indigo-400">[{s.key}] {s.name}</span>
                      <span className="text-[10px] px-2 py-0.2 rounded bg-slate-800 text-slate-400">{s.type}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{s.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setInspectChamp(null)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
