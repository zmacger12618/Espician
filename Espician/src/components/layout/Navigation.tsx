import React from 'react';
import { useGameStore, ActiveTab } from '../../store/useGameStore';
import { TAB_REQUIRED_LEVEL } from '../../core/data/gameplayGuideData';
import {
  Swords,
  Users,
  Dumbbell,
  SlidersHorizontal,
  ShoppingCart,
  Wifi,
  Gamepad2,
  Flame,
  Lock
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const { currentTab, setTab, currentUser } = useGameStore();
  const userLevel = currentUser?.accountLevel || 1;

  const tabs: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'match', label: 'Match Day', icon: Swords },
    { id: 'roster', label: 'Roster', icon: Users },
    { id: 'training', label: 'Training', icon: Dumbbell },
    { id: 'tactics', label: 'Tactics', icon: SlidersHorizontal },
    { id: 'gear', label: 'Gear & Staff', icon: Gamepad2 },
    { id: 'wiki', label: '40 Champs', icon: Flame },
    { id: 'market', label: 'Market', icon: ShoppingCart },
    { id: 'online', label: 'Online LAN', icon: Wifi }
  ];

  return (
    <nav
      data-tour-id="tour-nav-tabs"
      className="bg-[#08080c] border-b border-[#1c1c28] px-6 py-1.5 transition-colors"
    >
      <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          const reqLevel = TAB_REQUIRED_LEVEL[tab.id] || 1;
          const isLocked = userLevel < reqLevel;

          return (
            <button
              key={tab.id}
              data-tour-id={`tour-tab-${tab.id}`}
              onClick={() => setTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-bold transition-all whitespace-nowrap uppercase tracking-wider ${
                isActive
                  ? 'bg-[#ff4655] text-white shadow-md shadow-[#ff4655]/25'
                  : isLocked
                  ? 'text-zinc-600 bg-zinc-950/60 hover:bg-zinc-900 border border-zinc-900 opacity-60'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent'
              }`}
              style={{
                clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)'
              }}
            >
              {isLocked ? (
                <Lock className="w-3.5 h-3.5 text-zinc-600" />
              ) : (
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
              )}
              <span>{tab.label}</span>
              {isLocked && (
                <span className="text-[9px] px-1 bg-zinc-800 text-amber-400 font-mono">
                  LV.{reqLevel}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
