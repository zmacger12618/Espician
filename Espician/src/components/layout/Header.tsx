import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import {
  ACCOUNT_LEVEL_ROADMAP,
  getRequiredExpForNextLevel
} from '../../core/data/gameplayGuideData';
import {
  Coins,
  Trophy,
  Moon,
  Sun,
  Calendar,
  Compass,
  LogOut,
  Lock,
  Sparkles,
  CheckCircle2,
  ChevronUp,
  ShieldCheck,
  LayoutGrid
} from 'lucide-react';

interface HeaderProps {
  onBackToPortal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onBackToPortal }) => {
  const {
    myTeam,
    currentDay,
    restTeam,
    setTutorialOpen,
    currentUser,
    logout,
    theme,
    toggleTheme,
    levelUpAlert,
    clearLevelUpAlert,
    lockedTabAlert,
    clearLockedTabAlert
  } = useGameStore();

  const [showLevelRoadmapModal, setShowLevelRoadmapModal] = useState<boolean>(false);

  const accountLevel = currentUser?.accountLevel || 1;
  const accountExp = currentUser?.accountExp || 0;
  const maxExp = getRequiredExpForNextLevel(accountLevel);
  const expPercent = Math.min(100, Math.round((accountExp / maxExp) * 100));

  return (
    <>
      <header className="bg-[#08080c]/95 border-b border-[#1c1c28] backdrop-blur-md sticky top-0 z-40 px-6 py-2.5 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Brand & Manager License Level Badge */}
          <div className="flex items-center gap-3">
            {onBackToPortal && (
              <button
                type="button"
                onClick={onBackToPortal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#12131c] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-mono font-bold transition"
                style={{
                  clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)'
                }}
                title="กลับหน้าหลัก"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-[#ff4655]" />
                <span>หน้าหลัก</span>
              </button>
            )}
            <div
              className="w-9 h-9 bg-[#ff4655] flex items-center justify-center shadow-lg shadow-[#ff4655]/25 text-white font-black text-lg tracking-tighter"
              style={{
                clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)'
              }}
            >
              {myTeam.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-white tracking-wide uppercase font-mono">
                  {myTeam.name}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 bg-[#ff4655]/15 text-[#ff4655] border border-[#ff4655]/30 font-mono font-bold">
                  ESPICIAN MANAGER
                </span>
                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5" /> PRO
                </span>
              </div>

              {/* Interactive Account Level & EXP Bar */}
              <button
                type="button"
                data-tour-id="tour-account-level"
                onClick={() => setShowLevelRoadmapModal(true)}
                className="flex items-center gap-2 mt-1 group text-left"
                title="ระดับใบอนุญาตและ EXP"
              >
                <span className="text-[10px] px-1.5 py-0.2 bg-[#ff4655] text-white font-black font-mono">
                  LV.{accountLevel}
                </span>
                <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#ff4655] to-amber-400 transition-all duration-300"
                    style={{ width: `${expPercent}%` }}
                  />
                </div>
                <span className="text-[10px] text-zinc-400 group-hover:text-white font-mono">
                  {accountExp}/{maxExp} EXP
                </span>
              </button>
            </div>
          </div>

          {/* Right: Compact Resources & Action Buttons */}
          <div className="flex items-center gap-2 text-xs">
            <div
              data-tour-id="tour-resources"
              className="flex items-center gap-2"
            >
              <div className="hidden sm:flex items-center gap-1.5 bg-[#12131c] px-2.5 py-1.5 border border-[#20202e]">
                <Calendar className="w-3.5 h-3.5 text-[#ff4655]" />
                <span className="font-mono font-bold text-white">DAY {currentDay}</span>
              </div>

              <div className="flex items-center gap-1.5 bg-[#12131c] px-3 py-1.5 border border-[#20202e]">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <strong className="text-amber-400 font-mono">${myTeam.totalBudget.toLocaleString()}</strong>
              </div>

              <div className="hidden md:flex items-center gap-1 bg-[#12131c] px-2.5 py-1.5 border border-[#20202e]">
                <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                <strong className="text-yellow-400 font-mono">{myTeam.teamReputation}%</strong>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 bg-[#12131c] hover:bg-zinc-800 text-amber-400 border border-[#20202e] transition"
              title="สลับโหมดสี"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-[#ff4655]" />
              )}
            </button>

            <button
              data-tour-id="tour-guide-btn"
              onClick={() => setTutorialOpen(true)}
              className="flex items-center gap-1 bg-[#12131c] hover:bg-zinc-800 text-[#ff4655] border border-[#ff4655]/40 px-2.5 py-1.5 font-bold transition font-mono"
              title="คู่มือ"
            >
              <Compass className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">คู่มือ</span>
            </button>

            <button
              data-tour-id="tour-rest-btn"
              onClick={restTeam}
              className="flex items-center gap-1 bg-[#ff4655] hover:bg-[#e03a48] text-white px-3 py-1.5 font-bold transition shadow-md shadow-[#ff4655]/25"
              style={{
                clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)'
              }}
              title="พักทีม (+25 EXP)"
            >
              <Moon className="w-3.5 h-3.5" />
              <span>พักทีม</span>
            </button>

            <button
              onClick={logout}
              className="p-2 bg-[#12131c] hover:bg-rose-950/40 hover:text-rose-400 text-zinc-400 border border-[#20202e] transition"
              title="ออกจากระบบ"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* MODAL 1: Account Level Roadmap Modal */}
      {showLevelRoadmapModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#141419] border border-[#2a2a34] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#24242c] pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#ff4655] uppercase">
                  MANAGER LICENSE & PROGRESSION
                </span>
                <h3 className="font-black text-base text-white">
                  ระดับผู้จัดการทีมอีสปอร์ต (Manager Lv.{accountLevel})
                </h3>
              </div>
              <button
                onClick={() => setShowLevelRoadmapModal(false)}
                className="text-zinc-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#1a1a22] border border-[#2a2a36] flex items-center justify-between text-xs">
              <span>ค่าประสบการณ์ผู้จัดการทีม (EXP):</span>
              <strong className="font-mono text-amber-400">
                {accountExp} / {maxExp} EXP (แข่งชนะ +110, ซ้อม +40, อัปเกียร์ +50)
              </strong>
            </div>

            <div className="space-y-2.5">
              {ACCOUNT_LEVEL_ROADMAP.map((item) => {
                const isUnlocked = accountLevel >= item.level;
                return (
                  <div
                    key={item.level}
                    className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                      isUnlocked
                        ? 'bg-[#1a1a22] border-emerald-500/40'
                        : 'bg-[#111115] border-[#24242c] opacity-70'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded font-mono font-black text-[10px] ${
                            isUnlocked ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          LV.{item.level}
                        </span>
                        <strong className="text-white">{item.rankTitle}</strong>
                      </div>
                      <p className="text-zinc-300 font-semibold">
                        สิทธิ์การใช้งานที่เปิด: {item.unlockedFeatureNames.join(' + ')}
                      </p>
                      <p className="text-[11px] text-zinc-400">{item.rewardDescription}</p>
                    </div>
                    <div className="shrink-0">
                      {isUnlocked ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Lock className="w-4 h-4 text-zinc-500" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Locked Tab Notification */}
      {lockedTabAlert && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141419] border border-[#d13639]/60 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#d13639]/15 border border-[#d13639]/40 flex items-center justify-center text-[#ff4655] mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">
                REQUIRED LICENSE: MANAGER LV.{lockedTabAlert.requiredLevel}
              </span>
              <h4 className="text-base font-black text-white mt-0.5">
                {lockedTabAlert.featureName}
              </h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                ฟีเจอร์นี้จะเปิดใช้งานเมื่อระดับผู้จัดการทีมถึงเกณฑ์ ปัจจุบันคุณอยู่ที่{' '}
                <strong className="text-white">Lv.{accountLevel}</strong> ({accountExp}/{maxExp} EXP)
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-black/40 border border-[#272730] text-[11px] text-zinc-300">
              💡 <strong>วิธีสะสม EXP อย่างรวดเร็ว:</strong> ลงแข่งในหน้า Match Day (+110 EXP) หรือฝึกซ้อมนักแข่ง (+40 EXP)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  clearLockedTabAlert();
                  setShowLevelRoadmapModal(true);
                }}
                className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition"
              >
                ดูระดับการปลดล็อก
              </button>
              <button
                onClick={clearLockedTabAlert}
                className="flex-1 py-2 rounded-xl bg-[#d13639] hover:bg-[#ff4655] text-white text-xs font-bold transition"
              >
                รับทราบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Account Level-Up Celebration */}
      {levelUpAlert && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#141419] border-2 border-amber-400/80 rounded-2xl max-w-md w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400 mx-auto">
              <ChevronUp className="w-8 h-8 animate-bounce" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black font-mono">
                <Sparkles className="w-3 h-3" /> MANAGER LICENSE UPGRADED!
              </span>
              <h3 className="text-2xl font-black text-white mt-1">
                เลื่อนระดับสู่ LV.{levelUpAlert.newLevel} ({levelUpAlert.rankTitle})
              </h3>
            </div>

            {levelUpAlert.unlockedFeatureNames.length > 0 && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1">
                <strong className="text-emerald-400 block">🔓 เปิดระบบบริหารสโมสรใหม่แล้ว:</strong>
                {levelUpAlert.unlockedFeatureNames.map((f, i) => (
                  <div key={i} className="text-white font-bold">
                    • {f}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={clearLevelUpAlert}
              className="w-full py-2.5 rounded-xl bg-[#d13639] hover:bg-[#ff4655] text-white font-extrabold text-xs transition shadow-lg"
            >
              ดำเนินการต่อ
            </button>
          </div>
        </div>
      )}
    </>
  );
};
