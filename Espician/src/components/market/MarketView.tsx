import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { PlayerData, TransferListing } from '../../types';
import { ShoppingCart, Search, UserMinus, Plus, DollarSign, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

export const MarketView: React.FC = () => {
  const { myTeam, marketListings, buyPlayer, sellPlayer, scoutNewPlayers } = useGameStore();
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [feedback, setFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  const handleBuy = (listing: TransferListing) => {
    const res = buyPlayer(listing);
    setFeedback({ success: res.success, msg: res.message });
  };

  const handleSell = (player: PlayerData) => {
    if (myTeam.roster.length <= 5) {
      setFeedback({ success: false, msg: 'ไม่สามารถปล่อยตัวนักแข่งได้ เนื่องจากทีมต้องมีผู้เล่นอย่างน้อย 5 คนสำหรับลงแข่ง!' });
      return;
    }
    const res = sellPlayer(player.id);
    setFeedback({ success: res.success, msg: res.message });
  };

  const handleScout = () => {
    const res = scoutNewPlayers();
    setFeedback({ success: res.success, msg: res.message });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      {/* Banner */}
      <div className="bg-[#121826] border border-[#23304c] rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <ShoppingCart className="w-6 h-6 text-amber-400" /> ตลาดซื้อขายและค้นหานักแข่ง (Transfer Market)
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            เซ็นสัญญานักแข่งไร้สังกัด, ส่งแมวมองสเกาต์ดาวรุ่ง (Wonderkid), หรือปล่อยขายนักแข่งเพื่อระดมทุนสโมสร
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleScout}
            disabled={myTeam.totalBudget < 1000}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md shadow-amber-900/30 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" /> ส่งแมวมองสเกาต์ ($1,000)
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
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

      {/* Sub Tabs: Buy vs Sell */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => { setActiveTab('buy'); setFeedback(null); }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'buy'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-white bg-slate-800/40'
          }`}
        >
          <Search className="w-4 h-4" /> ตลาดนักแข่งเปิด ({marketListings.length})
        </button>
        <button
          onClick={() => { setActiveTab('sell'); setFeedback(null); }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'sell'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-white bg-slate-800/40'
          }`}
        >
          <DollarSign className="w-4 h-4" /> ปล่อยขายนักแข่งในทีม ({myTeam.roster.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'buy' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {marketListings.map((listing) => {
            const p = listing.player;
            const canAfford = myTeam.totalBudget >= listing.price;

            return (
              <div
                key={listing.id}
                className="bg-[#141c2e] border border-[#202d47] hover:border-[#314468] rounded-xl p-5 shadow-lg flex flex-col justify-between transition hover:-translate-y-1 space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {listing.scoutedAt}
                    </span>
                    <span className="text-xs font-bold text-amber-400 font-mono">
                      ${listing.price.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <img src={p.avatar} alt="" className="w-12 h-12 rounded-lg bg-slate-800 p-1 border border-slate-700" />
                    <div>
                      <div className="font-bold text-base text-white">{p.inGameName}</div>
                      <div className="text-xs text-slate-400">{p.role} • อายุ {p.age} ปี • ${p.salary}/wk</div>
                    </div>
                  </div>

                  {/* Conditions & Traits */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {p.conditions.map((c) => (
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
                        {c.icon} {c.name}
                      </span>
                    ))}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-slate-400">Mechanics:</span>{' '}
                      <strong className="text-cyan-400">{p.stats.mechanics}</strong>{' '}
                      <span className="text-slate-500 font-mono text-[10px]">/{p.dna.maxMechanicsCap}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Awareness:</span>{' '}
                      <strong className="text-indigo-400">{p.stats.mapAwareness}</strong>{' '}
                      <span className="text-slate-500 font-mono text-[10px]">/{p.dna.maxAwarenessCap}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Clutch:</span> <strong className="text-emerald-400">{p.stats.clutch}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">DNA Speed:</span> <strong className="text-teal-400">x{p.dna.learningSpeed}</strong>
                    </div>
                  </div>
                </div>

                <button
                  disabled={!canAfford}
                  onClick={() => handleBuy(listing)}
                  className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs transition flex items-center justify-center gap-2 ${
                    canAfford
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  }`}
                >
                  <Plus className="w-4 h-4" /> เซ็นสัญญาร่วมทีม (${listing.price.toLocaleString()})
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* Sell Roster Players */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {myTeam.roster.map((player) => {
            const sellPrice = Math.round(player.marketPrice * 0.75);

            return (
              <div
                key={player.id}
                className="bg-[#141c2e] border border-[#202d47] rounded-xl p-5 shadow-lg flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs px-2.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-bold">
                      {player.role}
                    </span>
                    <span className="text-xs font-bold text-emerald-400 font-mono">
                      ราคาขาย: +${sellPrice.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <img src={player.avatar} alt="" className="w-12 h-12 rounded-lg bg-slate-800 p-1 border border-slate-700" />
                    <div>
                      <div className="font-bold text-base text-white">{player.inGameName}</div>
                      <div className="text-xs text-slate-400">{player.realName} • ค่าเหนื่อย ${player.salary}/wk</div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 bg-slate-900/40 p-2 rounded-lg border border-slate-800">
                    Mechanics: <strong className="text-white">{player.stats.mechanics}</strong> • Awareness: <strong className="text-white">{player.stats.mapAwareness}</strong> • Clutch: <strong className="text-white">{player.stats.clutch}</strong>
                  </div>
                </div>

                <button
                  onClick={() => handleSell(player)}
                  className="w-full py-2.5 px-4 rounded-lg font-bold text-xs bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 transition flex items-center justify-center gap-2"
                >
                  <UserMinus className="w-4 h-4" /> ปล่อยตัวนักแข่ง (+${sellPrice.toLocaleString()})
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
