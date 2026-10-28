import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import {
  AIDifficultyLevel,
  MatchControlMode,
  MatchEngine,
  TacticalOrderType
} from '../../simulation/MatchEngine';
import { MiniMapCanvas } from './MiniMapCanvas';
import { TeamTactic } from '../../types';
import {
  Play,
  Pause,
  FastForward,
  RotateCcw,
  Trophy,
  Skull,
  Swords,
  Shield,
  Flame,
  Crosshair,
  Bot,
  Users,
  Settings2,
  Wifi
} from 'lucide-react';

const AI_DIFFICULTY_CONFIGS: {
  id: AIDifficultyLevel;
  title: string;
  clubName: string;
  shortName: string;
  cpLabel: string;
  prize: number;
  desc: string;
  badgeColor: string;
}[] = [
  {
    id: 'easy',
    title: 'Easy (Rookie)',
    clubName: 'Nova Academy',
    shortName: 'NVA',
    cpLabel: 'CP ~66',
    prize: 3500,
    desc: 'ทีมอคาเดมี่ เหมาะสำหรับทดสอบแผน',
    badgeColor: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
  },
  {
    id: 'normal',
    title: 'Normal (Pro)',
    clubName: 'Viper Esports',
    shortName: 'VIP',
    cpLabel: 'CP ~78',
    prize: 5500,
    desc: 'ทีมมาตรฐานลีก เดินเกมตามจังหวะ',
    badgeColor: 'border-blue-500/40 bg-blue-500/10 text-blue-300'
  },
  {
    id: 'hard',
    title: 'Hard (Finals)',
    clubName: 'Crimson Sovereign',
    shortName: 'CRS',
    cpLabel: 'CP ~88',
    prize: 8500,
    desc: 'ทีมหัวตาราง ดาเมจและชิงอ็อบเจกต์แม่นยำ',
    badgeColor: 'border-amber-500/40 bg-amber-500/10 text-amber-300'
  },
  {
    id: 'world_class',
    title: 'World Class',
    clubName: 'Apex Dynasty',
    shortName: 'APX',
    cpLabel: 'CP ~96',
    prize: 12500,
    desc: 'ทีมระดับแชมป์โลก ค่าพลังสูงสุด',
    badgeColor: 'border-rose-500/40 bg-rose-500/10 text-rose-300'
  }
];

export const MatchArenaView: React.FC = () => {
  const {
    myTeam,
    enemyTeam,
    onMatchFinished,
    tutorialState,
    completeTutorialMatch,
    setTeamTactic,
    setTab
  } = useGameStore();

  const [showPreMatchSetup, setShowPreMatchSetup] = useState<boolean>(false);
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficultyLevel>('normal');
  const [controlMode, setControlMode] = useState<MatchControlMode>('vs_ai');

  const engineRef = useRef<MatchEngine | null>(null);

  const [, setTick] = useState<number>(0);
  const [matchResultClaimed, setMatchResultClaimed] = useState<boolean>(false);
  const [rewardInfo, setRewardInfo] = useState<{
    prize: number;
    repGain: number;
    encounterLog?: string;
  } | null>(null);

  const selectedAiPreset =
    AI_DIFFICULTY_CONFIGS.find((d) => d.id === aiDifficulty) || AI_DIFFICULTY_CONFIGS[1];

  const configuredEnemyTeam = {
    ...enemyTeam,
    name: controlMode === 'dual_coach' ? 'Red Challenger Club' : selectedAiPreset.clubName,
    shortName: controlMode === 'dual_coach' ? 'RED' : selectedAiPreset.shortName
  };

  if (!engineRef.current || engineRef.current.entities.length === 0) {
    engineRef.current = new MatchEngine(
      myTeam,
      configuredEnemyTeam,
      () => setTick((t) => t + 1),
      tutorialState.guaranteedWin || tutorialState.isActive,
      { aiDifficulty, controlMode }
    );
  }

  const engine = engineRef.current;

  // Realistic 1:1 Base Game Time Loop (50ms interval -> 0.05s per tick at 1x = 1 game sec per 1 real sec)
  useEffect(() => {
    const interval = setInterval(() => {
      if (engine && engine.isRunning && !engine.winner && !showPreMatchSetup) {
        engine.tick(0.05);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [engine?.isRunning, engine?.speed, showPreMatchSetup]);

  // Check when match ends (Nexus Destroyed)
  useEffect(() => {
    if (engine.winner && !matchResultClaimed) {
      const res = onMatchFinished(engine.winner);
      const finalPrize =
        engine.winner === 'blue' ? selectedAiPreset.prize : Math.round(selectedAiPreset.prize * 0.32);
      setRewardInfo({ ...res, prize: finalPrize });
      setMatchResultClaimed(true);

      if (tutorialState.guaranteedWin || tutorialState.isActive) {
        setTimeout(() => {
          completeTutorialMatch();
        }, 1200);
      }
    }
  }, [engine.winner, matchResultClaimed, tutorialState.guaranteedWin, tutorialState.isActive]);

  const togglePlay = () => {
    if (!engine) return;
    engine.isRunning = !engine.isRunning;
    setTick((t) => t + 1);
  };

  const handleLaunchMatchWithConfig = (
    nextDiff: AIDifficultyLevel = aiDifficulty,
    nextMode: MatchControlMode = controlMode
  ) => {
    if (!engine) return;
    const preset =
      AI_DIFFICULTY_CONFIGS.find((d) => d.id === nextDiff) || AI_DIFFICULTY_CONFIGS[1];
    const nextEnemy = {
      ...enemyTeam,
      name: nextMode === 'dual_coach' ? 'Red Challenger Club' : preset.clubName,
      shortName: nextMode === 'dual_coach' ? 'RED' : preset.shortName
    };
    engine.reset(
      myTeam,
      nextEnemy,
      tutorialState.guaranteedWin || tutorialState.isActive,
      { aiDifficulty: nextDiff, controlMode: nextMode }
    );
    setMatchResultClaimed(false);
    setRewardInfo(null);
    setShowPreMatchSetup(false);
    setTick((t) => t + 1);
  };

  const handleReset = () => {
    handleLaunchMatchWithConfig(aiDifficulty, controlMode);
  };

  const setSpeed = (spd: number) => {
    if (!engine) return;
    engine.speed = spd;
    setTick((t) => t + 1);
  };

  const handleTacticalOrder = (order: TacticalOrderType, side: 'blue' | 'red' = 'blue') => {
    if (!engine) return;
    engine.setTacticalOrder(order, side);
    setTick((t) => t + 1);
  };

  const handleFastForward = () => {
    if (!engine) return;
    engine.fastForwardToEnd();
    setTick((t) => t + 1);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const goldDiff = engine.blueGold - engine.redGold;

  return (
    <div className="max-w-7xl mx-auto px-6 py-5 space-y-4">
      {/* PRE-MATCH LOBBY / CONFIGURATION DRAWER */}
      {showPreMatchSetup && (
        <div className="bg-[#0e1424] border-2 border-[#d13639]/60 rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-mono font-bold text-[#ff4655] uppercase tracking-widest">
                MATCHMAKING &amp; SCRIM CONFIGURATION
              </span>
              <h2 className="text-xl font-black text-white">
                ตั้งค่ารูปแบบการแข่งขันและเลือกระดับคู่แข่ง (Pre-Match Lobby)
              </h2>
            </div>
            <button
              onClick={() => setShowPreMatchSetup(false)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
            >
              กลับสู่สนามปัจจุบัน
            </button>
          </div>

          {/* 1. Select Match Mode: vs AI Bot vs 2-Player Coach vs Online LAN */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setControlMode('vs_ai')}
              className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 ${
                controlMode === 'vs_ai'
                  ? 'bg-[#ff4655]/15 border-[#ff4655] text-white'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <Bot className="w-5 h-5 text-[#ff4655] shrink-0" />
              <div>
                <div className="font-black text-xs text-white uppercase tracking-wider">VS BOT (AI)</div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  แข่งกับบอทสโมสร 4 ระดับความยาก
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setControlMode('dual_coach')}
              className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 ${
                controlMode === 'dual_coach'
                  ? 'bg-[#ff4655]/15 border-[#ff4655] text-white'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <Users className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <div className="font-black text-xs text-white uppercase tracking-wider">2-PLAYER COACH</div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  ดวล 2 ผู้เล่นสั่งแผนสดสองฝั่ง
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTab('online')}
              className="p-3.5 rounded-xl border bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-left transition flex items-center gap-3"
            >
              <Wifi className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="font-black text-xs text-white uppercase tracking-wider">ONLINE LAN</div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  ดวลผู้จัดการทีมคนอื่นผ่านห้อง LAN
                </p>
              </div>
            </button>
          </div>

          {/* 2. AI Difficulty Selector (When in vs_ai mode) */}
          {controlMode === 'vs_ai' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                เลือกระดับความยากของ AI และสโมสรคู่แข่ง:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {AI_DIFFICULTY_CONFIGS.map((cfg) => (
                  <button
                    key={cfg.id}
                    type="button"
                    onClick={() => setAiDifficulty(cfg.id)}
                    className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between gap-2 ${
                      aiDifficulty === cfg.id
                        ? 'bg-[#172036] border-[#ff4655] shadow-lg shadow-[#d13639]/15'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${cfg.badgeColor}`}>
                          {cfg.cpLabel}
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-400">
                          +${cfg.prize.toLocaleString()}
                        </span>
                      </div>
                      <div className="font-black text-sm text-white">{cfg.title}</div>
                      <div className="text-xs font-bold text-slate-300 mt-0.5">
                        สโมสร: {cfg.clubName} ({cfg.shortName})
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{cfg.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Team Tactic Quick Selector & Launch Button */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-bold">แผนหลักของทีมคุณ:</span>
              {(['Balanced', 'Aggressive', 'LateGameScaling', 'SplitPush'] as TeamTactic[]).map(
                (tac) => (
                  <button
                    key={tac}
                    type="button"
                    onClick={() => setTeamTactic(tac)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition ${
                      myTeam.currentTactic === tac
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {tac}
                  </button>
                )
              )}
            </div>

            <button
              type="button"
              onClick={() => handleLaunchMatchWithConfig(aiDifficulty, controlMode)}
              className="px-6 py-2.5 rounded-xl bg-[#ff4655] hover:bg-[#e03a48] text-white font-black text-xs transition shadow-lg shadow-[#ff4655]/20 flex items-center gap-2 uppercase tracking-wider"
              style={{
                clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)'
              }}
            >
              <Swords className="w-4 h-4" /> เริ่มการแข่งขัน
            </button>
          </div>
        </div>
      )}

      {/* Announcer Banner Popup */}
      {engine.announcerBanner && (
        <div
          className={`p-3 rounded-2xl border text-center shadow-xl animate-in fade-in zoom-in-95 duration-200 ${
            engine.announcerBanner.team === 'blue'
              ? 'bg-blue-950/85 border-blue-500/60 text-blue-200'
              : engine.announcerBanner.team === 'red'
                ? 'bg-rose-950/85 border-rose-500/60 text-rose-200'
                : 'bg-amber-950/85 border-amber-500/60 text-amber-200'
          }`}
        >
          <div className="text-base sm:text-lg font-black tracking-widest uppercase">
            ⚡ {engine.announcerBanner.text} ⚡
          </div>
          {engine.announcerBanner.subText && (
            <div className="text-xs text-slate-300 font-medium mt-0.5">
              {engine.announcerBanner.subText}
            </div>
          )}
        </div>
      )}

      {/* Broadcast Scoreboard + Nexus HP Status */}
      <div
        data-tour-id="tour-scoreboard"
        className="bg-[#0e1424] border border-[#212d47] rounded-3xl p-5 shadow-2xl backdrop-blur"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Blue Team Info */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-blue-500/25">
              {myTeam.shortName}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg text-white">{myTeam.name}</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-bold border border-blue-500/30">
                  NEXUS {Math.round((engine.blueNexus.health / engine.blueNexus.maxHealth) * 100)}%
                </span>
              </div>
              <div className="text-xs text-blue-400 font-mono flex items-center gap-2.5 mt-0.5">
                <span>💰 ${(engine.blueGold).toLocaleString()}</span>
                <span>•</span>
                <span>🐉 {engine.blueDragons}</span>
                <span>•</span>
                <span>👑 {engine.blueBarons}</span>
                <span>•</span>
                <span>🏰 {engine.towers.filter((t) => t.team === 'blue' && !t.isDestroyed).length}/6</span>
              </div>
            </div>
          </div>

          {/* Central Match Time & Kills */}
          <div className="text-center">
            <div className="font-mono text-xs text-slate-400 tracking-widest uppercase mb-1 flex items-center justify-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  engine.isRunning ? 'bg-red-500 animate-ping' : 'bg-amber-400'
                }`}
              />
              <span>TIME ({engine.speed}x):</span>
              <span className="text-white font-bold">{formatTime(engine.gameTime)}</span>
            </div>
            <div className="flex items-center justify-center gap-6">
              <span className="text-3xl sm:text-4xl font-black text-blue-400 font-mono">
                {engine.blueKills}
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-500 font-mono">VS</span>
              <span className="text-3xl sm:text-4xl font-black text-rose-500 font-mono">
                {engine.redKills}
              </span>
            </div>

            <div className="text-[10px] font-mono mt-1">
              <span className={goldDiff >= 0 ? 'text-blue-400 font-bold' : 'text-rose-400 font-bold'}>
                Gold Lead: {goldDiff >= 0 ? `+${goldDiff.toLocaleString()}` : `${goldDiff.toLocaleString()}`}
              </span>
            </div>
          </div>

          {/* Red Team Info */}
          <div className="flex items-center gap-3.5 text-right">
            <div>
              <div className="flex items-center justify-end gap-2">
                <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-bold border border-rose-500/30">
                  NEXUS {Math.round((engine.redNexus.health / engine.redNexus.maxHealth) * 100)}%
                </span>
                <span className="font-extrabold text-base sm:text-lg text-white">
                  {configuredEnemyTeam.name}
                </span>
              </div>
              <div className="text-xs text-rose-400 font-mono flex items-center justify-end gap-2.5 mt-0.5">
                <span>🏰 {engine.towers.filter((t) => t.team === 'red' && !t.isDestroyed).length}/6</span>
                <span>•</span>
                <span>🐉 {engine.redDragons}</span>
                <span>•</span>
                <span>👑 {engine.redBarons}</span>
                <span>•</span>
                <span>💰 ${(engine.redGold).toLocaleString()}</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-rose-500/25">
              {configuredEnemyTeam.shortName}
            </div>
          </div>
        </div>

        {/* Match Controls & Live Tactical Call Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Playback & Speed Controls */}
          <div data-tour-id="tour-match-controls" className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowPreMatchSetup((prev) => !prev)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 px-3 py-2 rounded-xl font-bold border border-amber-500/30 transition"
              title="เลือกคู่แข่ง AI ยาก/ง่าย หรือสลับโหมดผู้เล่น"
            >
              <Settings2 className="w-4 h-4" />
              <span>
                {controlMode === 'dual_coach'
                  ? 'โหมด: 2 ผู้เล่น'
                  : `AI: ${aiDifficulty.toUpperCase()}`}
              </span>
            </button>

            <button
              onClick={togglePlay}
              disabled={!!engine.winner}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold transition shadow ${
                engine.isRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-[#d13639] hover:bg-[#ff4655] text-white shadow-red-600/30'
              }`}
            >
              {engine.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {engine.isRunning ? 'หยุดชั่วคราว' : 'เล่นต่อ'}
            </button>

            <button
              onClick={handleFastForward}
              disabled={!!engine.winner}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl font-semibold border border-slate-700 transition"
              title="คำนวณจนกว่า Nexus ฝ่ายใดฝ่ายหนึ่งจะแตก"
            >
              <FastForward className="w-4 h-4 text-rose-400" /> ข้ามไปจบเกม
            </button>

            <button
              onClick={handleReset}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl font-semibold border border-slate-700 transition"
              title="รีเซ็ตแมตช์ใหม่"
            >
              <RotateCcw className="w-4 h-4" /> เริ่มใหม่
            </button>

            {/* Speed Selector (1x is true 1:1 real-time; 2x, 4x, 8x for fast simulation) */}
            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 px-2 font-medium">เร่งเวลา:</span>
              {[1, 2, 4, 8].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setSpeed(spd)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    engine.speed === spd
                      ? 'bg-[#d13639] text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Real-Time Coach Tactical Command Bar */}
          <div
            data-tour-id="tour-tactical-calls"
            className="flex flex-wrap items-center gap-1.5 bg-[#090d16] p-1.5 rounded-xl border border-slate-800"
          >
            <span className="text-[11px] font-bold text-blue-400 px-2 flex items-center gap-1">
              <Crosshair className="w-3.5 h-3.5" /> แผน Blue:
            </span>
            <button
              onClick={() => handleTacticalOrder('standard', 'blue')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
                engine.tacticalOrder === 'standard'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              ⚖️ มาตรฐาน
            </button>
            <button
              onClick={() => handleTacticalOrder('all_in', 'blue')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                engine.tacticalOrder === 'all_in'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Swords className="w-3.5 h-3.5" /> บุกตีป้อม/Nexus
            </button>
            <button
              onClick={() => handleTacticalOrder('objective', 'blue')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                engine.tacticalOrder === 'objective'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Flame className="w-3.5 h-3.5" /> ตีมังกร/บารอน
            </button>
            <button
              onClick={() => handleTacticalOrder('defend', 'blue')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                engine.tacticalOrder === 'defend'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5" /> ถอยกันป้อม
            </button>
          </div>
        </div>

        {/* Optional 2nd Player Red Team Coach Bar when in Dual Coach Mode */}
        {controlMode === 'dual_coach' && (
          <div className="mt-2 pt-2 border-t border-slate-800/50 flex items-center justify-end gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-rose-400 px-2">
              🎮 แผนผู้เล่นคนที่ 2 (Red Side):
            </span>
            {(['standard', 'all_in', 'objective', 'defend'] as TacticalOrderType[]).map((ord) => (
              <button
                key={ord}
                onClick={() => handleTacticalOrder(ord, 'red')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  engine.redTacticalOrder === ord
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {ord.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid: MiniMap Canvas & Live Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-[#0e1424] border border-[#212d47] rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              สนามจำลองการแข่งขัน MOBA 5v5 (ตัดสินแพ้ชนะเมื่อตี Nexus แตกเท่านั้น)
            </span>
            <span className="text-slate-400 font-mono">
              Blue Nexus: {engine.blueNexus.health} | Red Nexus: {engine.redNexus.health}
            </span>
          </div>

          <MiniMapCanvas
            entities={engine.entities}
            towers={engine.towers}
            blueNexus={engine.blueNexus}
            redNexus={engine.redNexus}
            minionWaves={engine.minionWaves}
            dragonBoss={engine.dragonBoss}
            baronBoss={engine.baronBoss}
            gameTime={engine.gameTime}
            combatVisuals={engine.consumeRecentVisuals()}
            tacticalOrder={engine.tacticalOrder}
            isRunning={engine.isRunning && !engine.winner}
          />
        </div>

        {/* Right: Live Combat Log & Scoreboard */}
        <div data-tour-id="tour-combat-log" className="lg:col-span-5 space-y-4">
          <div className="bg-[#0e1424] border border-[#212d47] rounded-3xl p-5 shadow-xl space-y-3">
            <h3 className="font-bold text-sm text-white flex items-center justify-between border-b border-slate-800 pb-2">
              <span>พากย์สดและเหตุการณ์สำคัญ (Live Play-by-Play)</span>
              <span className="text-xs font-mono text-rose-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" /> LIVE
              </span>
            </h3>

            <div className="h-56 overflow-y-auto space-y-2 pr-1 text-xs">
              {engine.events.map((ev) => (
                <div
                  key={ev.id}
                  className={`p-2 rounded-xl border leading-relaxed flex items-start gap-2 ${
                    ev.type === 'kill'
                      ? ev.killerTeam === 'blue'
                        ? 'bg-blue-950/40 border-blue-500/30 text-blue-200'
                        : 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                      : ev.type === 'dragon' || ev.type === 'baron'
                        ? 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                        : ev.type === 'tower'
                          ? 'bg-yellow-950/30 border-yellow-500/30 text-yellow-200'
                          : 'bg-slate-900/40 border-slate-800 text-slate-300'
                  }`}
                >
                  <span className="font-mono text-[10px] text-slate-400 shrink-0 mt-0.5">
                    [{ev.timestamp}]
                  </span>
                  <span>{ev.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0e1424] border border-[#212d47] rounded-3xl p-5 shadow-xl space-y-3">
            <h3 className="font-bold text-sm text-white border-b border-slate-800 pb-2 flex items-center justify-between">
              <span>สถานะนักแข่ง &amp; ไอเทมในสนาม (Live Telemetry)</span>
              <span className="text-[11px] text-slate-400 font-normal">HP • KDA • Gold</span>
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {engine.entities.map((e) => {
                const hpPct = Math.max(0, Math.min(100, (e.currentHealth / e.maxHealth) * 100));
                return (
                  <div
                    key={e.id}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                      e.team === 'blue'
                        ? 'bg-blue-950/20 border-blue-900/40'
                        : 'bg-rose-950/20 border-rose-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                      <span className="text-base shrink-0">{e.champion.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-200 flex items-center gap-1.5">
                          <span className="truncate">{e.name}</span>
                          <span className="text-[10px] text-slate-400 shrink-0">({e.role})</span>
                          {e.isDead && (
                            <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-mono">
                              รอเกิด {Math.ceil(e.respawnTimer)}s
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 truncate mt-0.5">
                          <span className="truncate">{e.currentAction}</span>
                          {e.items.length > 0 && (
                            <span className="text-xs ml-1 flex gap-0.5 shrink-0">
                              {e.items.map((it) => (
                                <span key={it.id} title={it.name}>
                                  {it.icon}
                                </span>
                              ))}
                            </span>
                          )}
                        </div>
                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full transition-all duration-150 ${
                              e.team === 'blue' ? 'bg-emerald-400' : 'bg-rose-500'
                            }`}
                            style={{ width: `${hpPct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono shrink-0">
                      <div className="text-slate-200 font-bold">
                        {e.kills}/{e.deaths}/{e.assists}
                      </div>
                      <div className="text-[10px] text-amber-400">
                        {e.cs} CS • ${e.gold}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Victory / Defeat Modal */}
      {engine.winner && rewardInfo && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1424] border-2 border-slate-700 rounded-3xl max-w-md w-full p-6 sm:p-8 text-center space-y-5 shadow-2xl">
            <div className="flex justify-center">
              {engine.winner === 'blue' ? (
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-500/20">
                  <Trophy className="w-10 h-10" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-500/20">
                  <Skull className="w-10 h-10" />
                </div>
              )}
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {engine.winner === 'blue'
                  ? 'VICTORY! ทำลาย Nexus สำเร็จ'
                  : 'DEFEAT! ฐานทัพหลักถูกทำลาย'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                ผลการแข่งขัน: {myTeam.shortName} ({engine.blueKills}) - {configuredEnemyTeam.shortName} ({engine.redKills})
              </p>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">เงินรางวัลจากการแข่งขัน:</span>
                <span className="font-bold text-amber-400 text-sm font-mono">
                  +${rewardInfo.prize.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">ชื่อเสียงสโมสร:</span>
                <span
                  className={`font-bold font-mono ${
                    rewardInfo.repGain >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {rewardInfo.repGain >= 0 ? `+${rewardInfo.repGain}%` : `${rewardInfo.repGain}%`}
                </span>
              </div>
              {rewardInfo.encounterLog && (
                <div className="pt-2 border-t border-slate-800 text-indigo-300 text-[11px] text-left">
                  {rewardInfo.encounterLog}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => {
                  handleReset();
                  setShowPreMatchSetup(true);
                }}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition"
              >
                เปลี่ยนคู่แข่ง / ตั้งค่าความยาก
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-3 bg-[#d13639] hover:bg-[#ff4655] text-white font-extrabold rounded-xl text-xs transition shadow-lg shadow-red-600/30"
              >
                {tutorialState.isActive ? 'รับรางวัลและเปิดซองนักแข่ง!' : 'รับรางวัลและแข่งนัดถัดไป'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
