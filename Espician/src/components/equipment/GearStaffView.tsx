import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { GamingGear, GearSlot } from '../../types';
import { GEAR_SHOP_CATALOG, COACHING_STAFF_CATALOG } from '../../core/data/defaultGearAndStaff';
import { 
  Gamepad2, 
  Users, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Cpu,
  Layers
} from 'lucide-react';

export const GearStaffView: React.FC = () => {
  const { myTeam, equipPlayerGear, upgradeGear, hireStaff } = useGameStore();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(myTeam.roster[0]?.id || '');
  const [viewTab, setViewTab] = useState<'gear' | 'staff'>('gear');
  const [feedback, setFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  const activePlayer = myTeam.roster.find((p) => p.id === selectedPlayerId) || myTeam.roster[0];

  const handleEquip = (gear: GamingGear) => {
    if (!activePlayer) return;
    const res = equipPlayerGear(activePlayer.id, gear);
    setFeedback({ success: res.success, msg: res.message });
  };

  const handleUpgrade = (slot: GearSlot) => {
    if (!activePlayer) return;
    const res = upgradeGear(activePlayer.id, slot);
    setFeedback({ success: res.success, msg: res.message });
  };

  const handleHire = (staffId: string) => {
    const res = hireStaff(staffId);
    setFeedback({ success: res.success, msg: res.message });
  };

  const gearSlots: { slot: GearSlot; label: string; icon: string }[] = [
    { slot: 'mouse', label: 'เมาส์โปร (Mouse)', icon: '🖱️' },
    { slot: 'keyboard', label: 'คีย์บอร์ดแมคคานิค (Keyboard)', icon: '⌨️' },
    { slot: 'monitor', label: 'จอมอนิเตอร์ 360Hz (Monitor)', icon: '🖥️' },
    { slot: 'headset', label: 'หูฟังสื่อสาร Spatial (Headset)', icon: '🎧' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-[#121826] border border-[#23304c] rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Gamepad2 className="w-6 h-6 text-indigo-400" /> ระบบเกียร์สวมใส่ & ทีมงานโค้ช (Equipment & Staff Facility)
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            ติดอาวุธเกมมิ่งเกียร์ระดับโปร, ตีบวกอัปเกรดประสิทธิภาพอุปกรณ์ (+1 ถึง +5), และจ้างทีมงานโค้ชมืออาชีพ
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#182032] px-4 py-2 rounded-xl border border-[#23304c]">
          <span className="text-xs text-slate-400">งบประมาณสโมสร:</span>
          <span className="text-base font-bold text-amber-400 font-mono">${myTeam.totalBudget.toLocaleString()}</span>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 transition ${
            feedback.success
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}
        >
          {feedback.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="text-xs font-semibold leading-relaxed">{feedback.msg}</div>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => { setViewTab('gear'); setFeedback(null); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            viewTab === 'gear'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
              : 'text-slate-400 hover:text-white bg-slate-800/40'
          }`}
        >
          <Cpu className="w-4 h-4" /> อุปกรณ์เกมมิ่งเกียร์ & ตีบวก (+1 - +5)
        </button>
        <button
          onClick={() => { setViewTab('staff'); setFeedback(null); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            viewTab === 'staff'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
              : 'text-slate-400 hover:text-white bg-slate-800/40'
          }`}
        >
          <Users className="w-4 h-4" /> ทีมงานโค้ช & นักจิตวิทยา ({myTeam.coaches.length})
        </button>
      </div>

      {viewTab === 'gear' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Player Selector & Equipment Slots (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#141c2e] border border-[#202d47] rounded-2xl p-5 shadow-lg space-y-3">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                เลือกนักแข่งเพื่อปรับแต่งอุปกรณ์
              </label>
              <div className="space-y-2">
                {myTeam.roster.map((player) => {
                  const isSelected = player.id === activePlayer.id;
                  return (
                    <button
                      key={player.id}
                      onClick={() => {
                        setSelectedPlayerId(player.id);
                        setFeedback(null);
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
                          <div className="text-[11px] text-slate-400">{player.role} • เลเวล {player.level}</div>
                        </div>
                      </div>
                      <span className="text-xs font-black font-mono text-amber-400">
                        CP {player.combatPoint}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Player Gear Slots */}
            {activePlayer && (
              <div className="bg-[#141c2e] border border-[#202d47] rounded-2xl p-5 shadow-lg space-y-3">
                <h3 className="font-bold text-sm text-white border-b border-slate-800 pb-2 flex items-center justify-between">
                  <span>ช่องใส่อุปกรณ์ของ {activePlayer.inGameName}</span>
                  <span className="text-xs text-indigo-400 font-mono">CP {activePlayer.combatPoint}</span>
                </h3>

                <div className="space-y-2.5">
                  {gearSlots.map(({ slot, label, icon }) => {
                    const gear = activePlayer.equippedGear?.[slot];
                    const upgradeCost = gear ? (gear.upgradeLevel + 1) * 600 : 0;
                    const canUpgrade = gear && gear.upgradeLevel < 5 && myTeam.totalBudget >= upgradeCost;

                    return (
                      <div
                        key={slot}
                        className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{icon}</span>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              {gear ? gear.name : label}
                              {gear && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                                  +{gear.upgradeLevel}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {gear ? (
                                <span className="text-indigo-300">
                                  +{gear.bonusValue + gear.upgradeLevel * 2} {gear.bonusStat} • {gear.specialAffix}
                                </span>
                              ) : (
                                <span className="text-slate-500 italic">ยังไม่ได้ติดตั้งอุปกรณ์</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {gear && (
                          <button
                            disabled={!canUpgrade || gear.upgradeLevel >= 5}
                            onClick={() => handleUpgrade(slot)}
                            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1 ${
                              gear.upgradeLevel >= 5
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : canUpgrade
                                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            <TrendingUp className="w-3.5 h-3.5" />
                            {gear.upgradeLevel >= 5 ? 'Max +5' : `ตีบวก ($${upgradeCost})`}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right: Gear Shop Catalog (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-[#141c2e] border border-[#202d47] rounded-2xl p-5 shadow-lg space-y-4">
              <h3 className="font-bold text-base text-white border-b border-slate-800 pb-2 flex items-center justify-between">
                <span>คลังสั่งซื้อเกมมิ่งเกียร์มืออาชีพ (Esports Pro Gear Store)</span>
                <span className="text-xs text-amber-400">พร้อมติดตั้งทันที</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {GEAR_SHOP_CATALOG.map((item) => {
                  const canAfford = myTeam.totalBudget >= item.price;

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{item.icon}</span>
                          <span className="font-bold text-sm text-amber-400 font-mono">
                            ${item.price.toLocaleString()}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-white">{item.name}</h4>
                        <div className="text-xs text-indigo-300 font-semibold mt-1">
                          +{item.bonusValue} {item.bonusStat}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.specialAffix}</p>
                      </div>

                      <button
                        disabled={!canAfford}
                        onClick={() => handleEquip(item)}
                        className={`w-full py-2 px-3 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                          canAfford
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        ซื้อและติดตั้งให้ {activePlayer?.inGameName}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Staff Facility Tab */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {COACHING_STAFF_CATALOG.map((staff) => {
              const isHired = myTeam.coaches.some((c) => c.id === staff.id);
              const canAfford = myTeam.totalBudget >= staff.salary * 2;

              return (
                <div
                  key={staff.id}
                  className="bg-[#141c2e] border border-[#202d47] rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <img src={staff.avatar} alt="" className="w-12 h-12 rounded-xl bg-slate-800 p-1 border border-slate-700" />
                      <div>
                        <div className="font-bold text-sm text-white">{staff.name}</div>
                        <div className="text-[11px] text-indigo-400 font-semibold">{staff.role}</div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800 leading-relaxed">
                      {staff.perkDescription}
                    </div>

                    <div className="mt-3 text-xs text-slate-400 flex justify-between items-center">
                      <span>ค่าจ้างสโมสร:</span>
                      <strong className="text-amber-400 font-mono">${staff.salary}/wk</strong>
                    </div>
                  </div>

                  <button
                    disabled={isHired || !canAfford}
                    onClick={() => handleHire(staff.id)}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                      isHired
                        ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/50 cursor-default'
                        : canAfford
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {isHired ? (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-400" /> อยู่ในสังกัดแล้ว
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4" /> เซ็นสัญญาจ้างงาน
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
