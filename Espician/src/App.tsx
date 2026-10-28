import React, { useEffect, useState } from 'react';
import { useGameStore } from './store/useGameStore';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import { MatchArenaView } from './components/match/MatchArenaView';
import { RosterView } from './components/roster/RosterView';
import { TrainingView } from './components/training/TrainingView';
import { TacticsView } from './components/tactics/TacticsView';
import { MarketView } from './components/market/MarketView';
import { GearStaffView } from './components/equipment/GearStaffView';
import { OnlineLobbyView } from './components/online/OnlineLobbyView';
import { MobaWikiView } from './components/wiki/MobaWikiView';
import { TutorialModal } from './components/tutorial/TutorialModal';
import { GuidedTutorialOverlay } from './components/tutorial/GuidedTutorialOverlay';
import { StarterPackModal } from './components/starter/StarterPackModal';
import { LoginView } from './components/auth/LoginView';
import { MainPortalView } from './components/portal/MainPortalView';
import { EspicianFishingView } from './components/fishing/EspicianFishingView';

export const App: React.FC = () => {
  const {
    currentTab,
    isTutorialOpen,
    setTutorialOpen,
    currentUser,
    theme,
    showStarterPackModal,
    pendingStarterSquad,
    confirmStarterSquad,
    hydrateFromDatabase,
    logout
  } = useGameStore();

  const [selectedPortalGame, setSelectedPortalGame] = useState<'portal' | 'manager' | 'fishing'>(
    'portal'
  );

  // Restore SQLite session on mount
  useEffect(() => {
    hydrateFromDatabase();
  }, []);

  // Sync theme class to document root
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(theme);
    }
  }, [theme]);

  // If user is not logged in, show the Login portal
  if (!currentUser) {
    return <LoginView />;
  }

  // 1. MAIN WEBSITE HUB (Choose between Espician Manager and Espician Fishing)
  if (selectedPortalGame === 'portal') {
    return (
      <MainPortalView
        onSelectGame={(game) => setSelectedPortalGame(game)}
        userName={currentUser.username}
        userEmail={currentUser.email}
        accountLevel={currentUser.accountLevel}
        onLogout={logout}
      />
    );
  }

  // 2. GAME 2: ESPICIAN FISHING (2D Cozy Ocean Art Fishing Game)
  if (selectedPortalGame === 'fishing') {
    return (
      <EspicianFishingView
        onBackToPortal={() => setSelectedPortalGame('portal')}
        userEmail={currentUser.email}
      />
    );
  }

  // 3. GAME 1: ESPICIAN MANAGER (5v5 MOBA Esports Management Simulator)
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-[#d13639] selection:text-white transition-colors duration-200">
      <Header onBackToPortal={() => setSelectedPortalGame('portal')} />
      <Navigation />

      <main className="flex-1 pb-16">
        {/* Global Interactive Product Tour / User Onboarding Banner */}
        <GuidedTutorialOverlay />

        {currentTab === 'match' && <MatchArenaView />}
        {currentTab === 'roster' && <RosterView />}
        {currentTab === 'training' && <TrainingView />}
        {currentTab === 'tactics' && <TacticsView />}
        {currentTab === 'gear' && <GearStaffView />}
        {currentTab === 'market' && <MarketView />}
        {currentTab === 'wiki' && <MobaWikiView />}
        {currentTab === 'online' && <OnlineLobbyView />}
      </main>

      {/* Starter Pack Reveal Modal (Triggered post-tutorial) */}
      <StarterPackModal
        isOpen={showStarterPackModal}
        starterSquad={pendingStarterSquad}
        onConfirm={confirmStarterSquad}
      />

      <TutorialModal isOpen={isTutorialOpen} onClose={() => setTutorialOpen(false)} />

      <footer className="border-t border-[#1b263b] py-4 text-center text-xs text-zinc-500 bg-[#0c1220] transition-colors">
        ESPICIAN MANAGER // PRO MOBA ESPORTS MANAGEMENT SIMULATOR &copy; 2026.
      </footer>
    </div>
  );
};

export default App;
