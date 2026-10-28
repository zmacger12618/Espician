import { create } from 'zustand';
import {
  PlayerData,
  PlayerRole,
  TeamData,
  TeamTactic,
  TransferListing,
  GamingGear,
  GearSlot,
  UserAccount,
  TutorialState,
  MobaPatchNotes,
  ChampionPvPStats
} from '../types';
import { INITIAL_USER_TEAM, INITIAL_ENEMY_TEAM, CONDITIONS_CATALOG } from '../core/data/defaultData';
import {
  INITIAL_MARKET_LISTINGS,
  generateScoutedPlayer,
  generateStarterSquad
} from '../core/data/defaultMarket';
import { COACHING_STAFF_CATALOG } from '../core/data/defaultGearAndStaff';
import { CURRENT_PATCH_NOTES, simulateNewPatch } from '../core/data/patchNotes';
import { TrainingCalculator, TrainingType } from '../core/calculators/trainingCalculator';
import { CombatPointCalculator } from '../core/calculators/CombatPointCalculator';
import {
  PRODUCT_TOUR_STEPS,
  ACCOUNT_LEVEL_ROADMAP,
  TAB_REQUIRED_LEVEL,
  getRequiredExpForNextLevel
} from '../core/data/gameplayGuideData';
import { ApiService, ClubStatePayload, getSavedSessionToken } from '../services/apiService';

export type ActiveTab =
  | 'match'
  | 'roster'
  | 'training'
  | 'tactics'
  | 'gear'
  | 'market'
  | 'wiki'
  | 'online';

export interface LevelUpAlert {
  newLevel: number;
  rankTitle: string;
  unlockedFeatureNames: string[];
}

export interface LockedTabAlert {
  tab: ActiveTab;
  requiredLevel: number;
  featureName: string;
}

interface GameState {
  currentUser: UserAccount | null;
  isHydratingAuth: boolean;
  theme: 'dark' | 'light';
  currentTab: ActiveTab;
  currentDay: number;
  myTeam: TeamData;
  enemyTeam: TeamData;
  selectedPlayer: PlayerData | null;
  lastTrainingLog: string | null;
  marketListings: TransferListing[];
  isTutorialOpen: boolean;

  // Progressive Disclosure & Account Level Alerts
  levelUpAlert: LevelUpAlert | null;
  lockedTabAlert: LockedTabAlert | null;

  // Tutorial & Onboarding State
  tutorialState: TutorialState;
  showStarterPackModal: boolean;
  pendingStarterSquad: PlayerData[];

  // MOBA Ecosystem: Meta & PvP Stats
  currentPatch: MobaPatchNotes;
  championPvPStats: Record<string, ChampionPvPStats>;

  // Actions
  toggleTheme: () => void;
  login: (user: UserAccount, starterSquad?: PlayerData[]) => void;
  registerUser: (user: UserAccount, starterSquad: PlayerData[]) => void;
  loginWithDatabaseSession: (user: UserAccount, clubState: ClubStatePayload | null) => void;
  hydrateFromDatabase: () => Promise<void>;
  syncToDatabase: () => Promise<void>;
  logout: () => void;

  // Account Level & Progressive Disclosure Actions
  addAccountExp: (expGain: number) => void;
  clearLevelUpAlert: () => void;
  clearLockedTabAlert: () => void;

  setTab: (tab: ActiveTab) => void;
  setTutorialOpen: (open: boolean) => void;
  setSelectedPlayer: (player: PlayerData | null) => void;
  setTeamTactic: (tactic: TeamTactic) => void;
  assignLineup: (role: PlayerRole, playerId: string) => void;
  assignChampion: (role: PlayerRole, championId: string) => void;
  trainPlayer: (playerId: string, type: TrainingType) => { success: boolean; message: string };
  restTeam: () => void;
  onMatchFinished: (winner: 'blue' | 'red') => {
    prize: number;
    repGain: number;
    encounterLog?: string;
  };
  setEnemyTeam: (team: TeamData) => void;

  // Tutorial & Product Tour Flow
  setTutorialStep: (step: number) => void;
  advanceTutorial: () => void;
  skipProductTour: () => void;
  startProductTour: () => void;
  completeTutorialMatch: () => void;
  confirmStarterSquad: () => void;

  // MOBA Meta Updates
  updatePatchNotes: () => void;

  // Market & Medical Actions
  buyPlayer: (listing: TransferListing) => { success: boolean; message: string };
  sellPlayer: (playerId: string) => { success: boolean; message: string };
  scoutNewPlayers: () => { success: boolean; message: string };
  treatPlayerCondition: (
    playerId: string,
    conditionId: string
  ) => { success: boolean; message: string };

  // Equipment & Staff Actions
  equipPlayerGear: (playerId: string, gear: GamingGear) => { success: boolean; message: string };
  upgradeGear: (playerId: string, slot: GearSlot) => { success: boolean; message: string };
  hireStaff: (staffId: string) => { success: boolean; message: string };
}

const TAB_LABELS: Record<ActiveTab, string> = {
  match: 'Match Day (สนามแข่ง)',
  roster: 'Roster (นักกีฬา & DNA)',
  training: 'Training (ฝึกซ้อม)',
  tactics: 'Tactics (แผน & ดราฟต์)',
  gear: 'Gear & Staff (เกียร์ +5 & โค้ช)',
  wiki: 'Meta & 40 Champs (เมต้าเกม)',
  market: 'Market (ตลาดซื้อขาย)',
  online: 'Online Lobby (ห้องแข่ง LAN)'
};

export const useGameStore = create<GameState>((set, get) => ({
  currentUser: null,
  isHydratingAuth: false,
  theme: 'dark',
  currentTab: 'match',
  currentDay: 1,
  myTeam: INITIAL_USER_TEAM,
  enemyTeam: INITIAL_ENEMY_TEAM,
  selectedPlayer: INITIAL_USER_TEAM.roster[0],
  lastTrainingLog: null,
  marketListings: INITIAL_MARKET_LISTINGS,
  isTutorialOpen: false,

  levelUpAlert: null,
  lockedTabAlert: null,

  tutorialState: {
    isActive: false,
    step: 0,
    guaranteedWin: false
  },
  showStarterPackModal: false,
  pendingStarterSquad: [],

  currentPatch: CURRENT_PATCH_NOTES,
  championPvPStats: {},

  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(nextTheme);
    }
    set({ theme: nextTheme });
  },

  syncToDatabase: async () => {
    const {
      currentUser,
      currentDay,
      myTeam,
      marketListings,
      championPvPStats,
      pendingStarterSquad
    } = get();
    if (!currentUser) return;
    await ApiService.saveClubState({
      currentDay,
      myTeam,
      marketListings,
      championPvPStats,
      pendingStarterSquad,
      isTutorialCompleted: currentUser.isTutorialCompleted,
      accountLevel: currentUser.accountLevel || 1,
      accountExp: currentUser.accountExp || 0
    });
  },

  hydrateFromDatabase: async () => {
    const token = getSavedSessionToken();
    if (!token) return;
    set({ isHydratingAuth: true });
    try {
      const { user, clubState } = await ApiService.fetchMe();
      get().loginWithDatabaseSession(user, clubState);
    } catch {
      // Session invalid or expired
    } finally {
      set({ isHydratingAuth: false });
    }
  },

  loginWithDatabaseSession: (user, clubState) => {
    const isNew = !user.isTutorialCompleted;
    const cleanCoachName = user.coachName || user.username || 'Pro Coach';
    const cleanClubName = user.clubName || `${cleanCoachName} Esports`;
    const cleanShortName =
      cleanCoachName
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 3)
        .toUpperCase() || 'ESP';

    const loadedTeam = clubState?.myTeam || {
      ...INITIAL_USER_TEAM,
      name: cleanClubName,
      shortName: cleanShortName,
      coachName: cleanCoachName
    };

    const loadedPendingSquad =
      clubState?.pendingStarterSquad && clubState.pendingStarterSquad.length >= 5
        ? clubState.pendingStarterSquad
        : generateStarterSquad();

    set({
      currentUser: {
        ...user,
        clubName: cleanClubName,
        coachName: cleanCoachName,
        accountLevel: user.accountLevel || 1,
        accountExp: user.accountExp || 0
      },
      currentTab: 'match',
      currentDay: clubState?.currentDay || 1,
      myTeam: loadedTeam,
      selectedPlayer: loadedTeam.roster[0] || null,
      marketListings:
        clubState?.marketListings && clubState.marketListings.length > 0
          ? clubState.marketListings
          : INITIAL_MARKET_LISTINGS,
      championPvPStats: clubState?.championPvPStats || {},
      pendingStarterSquad: loadedPendingSquad,
      showStarterPackModal: false,
      tutorialState: {
        isActive: isNew,
        step: 0,
        guaranteedWin: isNew
      }
    });

    if (!clubState) {
      get().syncToDatabase();
    }
  },

  login: (user, starterSquad) => {
    const { myTeam } = get();
    const finalPendingSquad =
      starterSquad && starterSquad.length >= 5 ? starterSquad : generateStarterSquad();
    const isNew = !user.isTutorialCompleted;
    const cleanCoachName = user.coachName || user.username || 'Pro Coach';
    const cleanClubName = user.clubName || `${cleanCoachName} Esports`;
    const cleanShortName =
      cleanCoachName
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 3)
        .toUpperCase() || 'ESP';

    set({
      currentUser: {
        ...user,
        clubName: cleanClubName,
        coachName: cleanCoachName,
        accountLevel: user.accountLevel || 1,
        accountExp: user.accountExp || 0
      },
      currentTab: 'match',
      tutorialState: {
        isActive: isNew,
        step: 0,
        guaranteedWin: isNew
      },
      showStarterPackModal: false,
      pendingStarterSquad: finalPendingSquad,
      myTeam: {
        ...myTeam,
        name: cleanClubName,
        shortName: cleanShortName,
        coachName: cleanCoachName
      }
    });
  },

  registerUser: (user, starterSquad) => {
    get().login({ ...user, isTutorialCompleted: false, accountLevel: 1, accountExp: 0 }, starterSquad);
  },

  logout: () => {
    ApiService.logout();
    set({
      currentUser: null,
      levelUpAlert: null,
      lockedTabAlert: null,
      tutorialState: { isActive: false, step: 0, guaranteedWin: false }
    });
  },

  addAccountExp: (expGain) => {
    const { currentUser } = get();
    if (!currentUser) return;

    let level = currentUser.accountLevel || 1;
    let exp = (currentUser.accountExp || 0) + expGain;
    let leveledUpTo: number | null = null;
    let newlyUnlocked: string[] = [];

    while (exp >= getRequiredExpForNextLevel(level)) {
      exp -= getRequiredExpForNextLevel(level);
      level += 1;
      leveledUpTo = level;
      const roadmapEntry = ACCOUNT_LEVEL_ROADMAP.find((r) => r.level === level);
      if (roadmapEntry) {
        newlyUnlocked = [...newlyUnlocked, ...roadmapEntry.unlockedFeatureNames];
      }
    }

    const updatedUser: UserAccount = {
      ...currentUser,
      accountLevel: level,
      accountExp: exp
    };

    const nextAlert: LevelUpAlert | null = leveledUpTo
      ? {
          newLevel: leveledUpTo,
          rankTitle:
            ACCOUNT_LEVEL_ROADMAP.find((r) => r.level === leveledUpTo)?.rankTitle ||
            'Pro Manager',
          unlockedFeatureNames: newlyUnlocked
        }
      : get().levelUpAlert;

    set({
      currentUser: updatedUser,
      levelUpAlert: nextAlert
    });

    get().syncToDatabase();
  },

  clearLevelUpAlert: () => set({ levelUpAlert: null }),
  clearLockedTabAlert: () => set({ lockedTabAlert: null }),

  setTab: (tab) => {
    const { currentUser } = get();
    const userLevel = currentUser?.accountLevel || 1;
    const reqLevel = TAB_REQUIRED_LEVEL[tab] || 1;

    if (userLevel < reqLevel) {
      set({
        lockedTabAlert: {
          tab,
          requiredLevel: reqLevel,
          featureName: TAB_LABELS[tab]
        }
      });
      return;
    }

    set({ currentTab: tab, lockedTabAlert: null });
  },

  setTutorialStep: (step) => {
    const { currentUser } = get();
    const userLevel = currentUser?.accountLevel || 1;
    const clampedStep = Math.max(0, Math.min(PRODUCT_TOUR_STEPS.length - 1, step));
    const desiredTab = PRODUCT_TOUR_STEPS[clampedStep]?.targetTab || 'match';
    const safeTab = (TAB_REQUIRED_LEVEL[desiredTab] || 1) <= userLevel ? desiredTab : 'match';

    set((state) => ({
      currentTab: safeTab,
      tutorialState: { ...state.tutorialState, isActive: true, step: clampedStep }
    }));
  },

  advanceTutorial: () => {
    const { tutorialState, currentUser } = get();
    const userLevel = currentUser?.accountLevel || 1;
    const nextStep = tutorialState.step + 1;
    if (nextStep >= PRODUCT_TOUR_STEPS.length) {
      set((state) => ({
        currentTab: 'match',
        tutorialState: { ...state.tutorialState, isActive: false, step: 0 }
      }));
      return;
    }
    const desiredTab = PRODUCT_TOUR_STEPS[nextStep]?.targetTab || 'match';
    const safeTab = (TAB_REQUIRED_LEVEL[desiredTab] || 1) <= userLevel ? desiredTab : 'match';
    set((state) => ({
      currentTab: safeTab,
      tutorialState: { ...state.tutorialState, step: nextStep }
    }));
  },

  skipProductTour: () => {
    set((state) => ({
      tutorialState: { ...state.tutorialState, isActive: false }
    }));
  },

  startProductTour: () => {
    set((state) => ({
      currentTab: 'match',
      tutorialState: { ...state.tutorialState, isActive: true, step: 0 }
    }));
  },

  completeTutorialMatch: () => {
    set({
      tutorialState: { isActive: false, step: 3, guaranteedWin: false },
      showStarterPackModal: true
    });
  },

  confirmStarterSquad: () => {
    const { myTeam, pendingStarterSquad, currentUser } = get();
    const squad = pendingStarterSquad.length >= 5 ? pendingStarterSquad : generateStarterSquad();

    const newLineup: Record<PlayerRole, string> = {
      Top: squad.find((p) => p.role === 'Top')?.id || squad[0].id,
      Jungle: squad.find((p) => p.role === 'Jungle')?.id || squad[1].id,
      Mid: squad.find((p) => p.role === 'Mid')?.id || squad[2].id,
      ADC: squad.find((p) => p.role === 'ADC')?.id || squad[3].id,
      Support: squad.find((p) => p.role === 'Support')?.id || squad[4].id
    };

    set({
      showStarterPackModal: false,
      currentTab: 'roster',
      myTeam: {
        ...myTeam,
        roster: squad,
        selectedLineup: newLineup
      },
      selectedPlayer: squad[0],
      currentUser: currentUser ? { ...currentUser, isTutorialCompleted: true } : null
    });

    get().syncToDatabase();
  },

  setTutorialOpen: (open) => set({ isTutorialOpen: open }),

  setSelectedPlayer: (player) => set({ selectedPlayer: player }),

  setEnemyTeam: (team) => set({ enemyTeam: team }),

  setTeamTactic: (tactic) => {
    set((state) => ({
      myTeam: { ...state.myTeam, currentTactic: tactic }
    }));
    get().syncToDatabase();
  },

  assignLineup: (role, playerId) => {
    set((state) => ({
      myTeam: {
        ...state.myTeam,
        selectedLineup: {
          ...state.myTeam.selectedLineup,
          [role]: playerId
        }
      }
    }));
    get().syncToDatabase();
  },

  assignChampion: (role, championId) => {
    set((state) => ({
      myTeam: {
        ...state.myTeam,
        assignedChampions: {
          ...(state.myTeam.assignedChampions || {
            Top: 'c_mg_ironclad',
            Jungle: 'c_fa_shadow',
            Mid: 'c_ignis_prime',
            ADC: 'c_valkyrie_swift',
            Support: 'c_luna_celestial'
          }),
          [role]: championId
        } as Record<PlayerRole, string>
      }
    }));
    get().syncToDatabase();
  },

  trainPlayer: (playerId, type) => {
    const { myTeam } = get();
    const player = myTeam.roster.find((p) => p.id === playerId);
    if (!player) return { success: false, message: 'ไม่พบนักกีฬาคนนี้ในทีม' };

    const hasAnalyst = myTeam.coaches.some((c) => c.role === 'DataAnalyst');
    const staffBonusExpMultiplier = hasAnalyst ? 1.25 : 1.0;

    const result = TrainingCalculator.calculateTraining(
      player,
      type,
      myTeam.totalBudget,
      staffBonusExpMultiplier
    );

    if (result.success) {
      const updatedRoster = myTeam.roster.map((p) => {
        if (p.id === playerId) {
          const newStats = { ...p.stats, [type]: result.newStatValue };
          const newExp = (p.exp || 0) + result.expGained;
          const newLevel = result.leveledUp ? (p.level || 1) + 1 : p.level;
          const newMaxExp = result.leveledUp ? newLevel * 200 : p.maxExp;

          const updatedPlayer: PlayerData = {
            ...p,
            energy: Math.max(10, p.energy - result.energyCost),
            level: newLevel,
            exp: result.leveledUp ? newExp - p.maxExp : newExp,
            maxExp: newMaxExp,
            stats: newStats,
            combatPoint: 0
          };

          const cpData = CombatPointCalculator.calculate(updatedPlayer);
          updatedPlayer.combatPoint = cpData.totalCP;
          return updatedPlayer;
        }
        return p;
      });

      set({
        myTeam: {
          ...myTeam,
          totalBudget: myTeam.totalBudget - result.cost,
          roster: updatedRoster
        },
        selectedPlayer: updatedRoster.find((p) => p.id === playerId) || null,
        lastTrainingLog: result.message
      });

      get().addAccountExp(40);
      return { success: true, message: result.message };
    } else {
      return { success: false, message: result.message };
    }
  },

  restTeam: () => {
    const { myTeam, currentDay } = get();
    const hasPsychologist = myTeam.coaches.some((c) => c.role === 'Psychologist');
    const hasPhysio = myTeam.coaches.some((c) => c.role === 'Physio');

    const updatedRoster = myTeam.roster.map((p) => {
      let updatedConditions = p.conditions
        .map((c) => {
          if (c.durationDays !== undefined) {
            return { ...c, durationDays: c.durationDays - 1 };
          }
          return c;
        })
        .filter((c) => c.durationDays === undefined || c.durationDays > 0);

      if (hasPsychologist) {
        updatedConditions = updatedConditions.filter((c) => c.id !== 'cond_lazy');
      }

      if (hasPhysio) {
        updatedConditions = updatedConditions.filter((c) => c.id !== 'cond_wrist_strain');
      }

      const nextMorale = Math.min(100, p.morale + 10);
      const nextEnergy = Math.min(100, p.energy + (hasPhysio ? 45 : 35));

      if (
        nextMorale >= 95 &&
        nextEnergy >= 90 &&
        !updatedConditions.some((c) => c.id === 'cond_on_fire')
      ) {
        updatedConditions.push(CONDITIONS_CATALOG.on_fire);
      }

      const pUpdated: PlayerData = {
        ...p,
        energy: nextEnergy,
        morale: nextMorale,
        conditions: updatedConditions,
        combatPoint: 0
      };

      pUpdated.combatPoint = CombatPointCalculator.calculate(pUpdated).totalCP;
      return pUpdated;
    });

    set({
      currentDay: currentDay + 1,
      myTeam: {
        ...myTeam,
        roster: updatedRoster
      },
      lastTrainingLog: `พักฟื้นทีมเรียบร้อย (เข้าสู่วันที่ ${currentDay + 1})`
    });

    get().addAccountExp(25);
  },

  onMatchFinished: (winner) => {
    const { myTeam, currentDay } = get();
    const isWin = winner === 'blue';
    const prize = isWin ? 5500 : 1800;
    const repGain = isWin ? 5 : -1;

    const matchExpGain = isWin ? 240 : 140;
    const encounterLog = isWin
      ? '🔥 ชัยชนะจากการประสานงานตามแผน! นักแข่งทุกคนได้รับ Match EXP เต็มจำนวน'
      : '📈 ทีมงานโค้ชบันทึกสถิติการแข่งขันเพื่อปรับปรุงแผนการเล่นในนัดถัดไป';

    const updatedRoster = myTeam.roster.map((player) => {
      const expTotal = (player.exp || 0) + matchExpGain;
      let newLevel = player.level || 1;
      let newExp = expTotal;
      let maxExp = player.maxExp || 500;

      if (newExp >= maxExp) {
        newLevel += 1;
        newExp -= maxExp;
        maxExp = newLevel * 200;
      }

      const updatedPlayer: PlayerData = {
        ...player,
        level: newLevel,
        exp: newExp,
        maxExp,
        combatPoint: 0
      };

      updatedPlayer.combatPoint = CombatPointCalculator.calculate(updatedPlayer).totalCP;
      return updatedPlayer;
    });

    set({
      currentDay: currentDay + 1,
      myTeam: {
        ...myTeam,
        totalBudget: myTeam.totalBudget + prize,
        teamReputation: Math.max(0, Math.min(100, myTeam.teamReputation + repGain)),
        fansCount: myTeam.fansCount + (isWin ? 950 : 200),
        roster: updatedRoster
      }
    });

    // Record match in SQLite and award Account EXP (+100 EXP guarantees Lv.1 -> Lv.2 on first match!)
    ApiService.recordMatch({ winner, prize, repGain, day: currentDay });
    get().addAccountExp(isWin ? 110 : 75);

    return { prize, repGain, encounterLog };
  },

  updatePatchNotes: () => {
    const nextPatch = simulateNewPatch(get().currentPatch);
    set({ currentPatch: nextPatch });
  },

  buyPlayer: (listing) => {
    const { myTeam, marketListings } = get();

    if (myTeam.totalBudget < listing.price) {
      return { success: false, message: 'งบประมาณสโมสรไม่เพียงพอ!' };
    }

    const updatedRoster = [...myTeam.roster, listing.player];
    const updatedMarket = marketListings.filter((l) => l.id !== listing.id);

    set({
      myTeam: {
        ...myTeam,
        totalBudget: myTeam.totalBudget - listing.price,
        roster: updatedRoster
      },
      marketListings: updatedMarket
    });

    get().addAccountExp(50);
    return {
      success: true,
      message: `เซ็นสัญญา ${listing.player.inGameName} (${listing.player.role}) สำเร็จ!`
    };
  },

  sellPlayer: (playerId) => {
    const { myTeam } = get();
    const player = myTeam.roster.find((p) => p.id === playerId);
    if (!player) return { success: false, message: 'ไม่พบนักกีฬาคนนี้ในทีม' };

    const sellPrice = Math.round(player.marketPrice * 0.75);
    const updatedRoster = myTeam.roster.filter((p) => p.id !== playerId);

    set({
      myTeam: {
        ...myTeam,
        totalBudget: myTeam.totalBudget + sellPrice,
        roster: updatedRoster
      }
    });

    get().syncToDatabase();
    return {
      success: true,
      message: `ปล่อยตัว ${player.inGameName} รับเงิน +$${sellPrice.toLocaleString()}`
    };
  },

  scoutNewPlayers: () => {
    const { myTeam, marketListings } = get();
    const scoutCost = 1000;

    if (myTeam.totalBudget < scoutCost) {
      return { success: false, message: 'งบประมาณไม่พอสำหรับส่งแมวมอง ($1,000)' };
    }

    const existingIds = [
      ...myTeam.roster.map((p) => p.id),
      ...marketListings.map((l) => l.player.id)
    ];
    const p1 = generateScoutedPlayer(existingIds);
    const p2 = generateScoutedPlayer([...existingIds, p1.player.id]);
    const newProspects = [p1, p2].filter(
      (item, index, self) =>
        !existingIds.includes(item.player.id) &&
        self.findIndex((t) => t.player.id === item.player.id) === index
    );

    if (newProspects.length === 0) {
      return {
        success: false,
        message: 'แมวมองได้ค้นพบนักแข่งดาวรุ่งในฐานข้อมูลครบทุกคนแล้ว!'
      };
    }

    set({
      myTeam: {
        ...myTeam,
        totalBudget: myTeam.totalBudget - scoutCost
      },
      marketListings: [...newProspects, ...marketListings]
    });

    get().addAccountExp(35);
    return {
      success: true,
      message: `แมวมองค้นพบดาวรุ่งใหม่ ${newProspects.length} คนจากฐานข้อมูลลีกเข้าสู่ตลาดแล้ว!`
    };
  },

  treatPlayerCondition: (playerId, conditionId) => {
    const { myTeam } = get();
    const player = myTeam.roster.find((p) => p.id === playerId);
    if (!player) return { success: false, message: 'ไม่พบนักกีฬาคนนี้' };

    const treatmentCost = 600;
    if (myTeam.totalBudget < treatmentCost) {
      return { success: false, message: 'งบประมาณไม่พอสำหรับค่ารักษา ($600)' };
    }

    const updatedRoster = myTeam.roster.map((p) => {
      if (p.id === playerId) {
        const updatedConditions = p.conditions.filter((c) => c.id !== conditionId);
        const pUpdated: PlayerData = { ...p, conditions: updatedConditions, combatPoint: 0 };
        pUpdated.combatPoint = CombatPointCalculator.calculate(pUpdated).totalCP;
        return pUpdated;
      }
      return p;
    });

    set({
      myTeam: {
        ...myTeam,
        totalBudget: myTeam.totalBudget - treatmentCost,
        roster: updatedRoster
      }
    });

    get().addAccountExp(25);
    return {
      success: true,
      message: `รักษาอาการของ ${player.inGameName} เรียบร้อย!`
    };
  },

  equipPlayerGear: (playerId, gear) => {
    const { myTeam } = get();
    const player = myTeam.roster.find((p) => p.id === playerId);
    if (!player) return { success: false, message: 'ไม่พบนักกีฬาคนนี้' };

    if (myTeam.totalBudget < gear.price) {
      return { success: false, message: 'งบประมาณไม่เพียงพอซื้ออุปกรณ์นี้!' };
    }

    const updatedRoster = myTeam.roster.map((p) => {
      if (p.id === playerId) {
        const equipped = { ...p.equippedGear, [gear.slot]: gear };
        const pUpdated: PlayerData = { ...p, equippedGear: equipped, combatPoint: 0 };
        pUpdated.combatPoint = CombatPointCalculator.calculate(pUpdated).totalCP;
        return pUpdated;
      }
      return p;
    });

    set({
      myTeam: {
        ...myTeam,
        totalBudget: myTeam.totalBudget - gear.price,
        roster: updatedRoster
      }
    });

    get().addAccountExp(45);
    return {
      success: true,
      message: `ติดตั้ง ${gear.name} ให้ ${player.inGameName} สำเร็จ!`
    };
  },

  upgradeGear: (playerId, slot) => {
    const { myTeam } = get();
    const player = myTeam.roster.find((p) => p.id === playerId);
    if (!player) return { success: false, message: 'ไม่พบนักกีฬา' };

    const currentGear = player.equippedGear?.[slot];
    if (!currentGear) return { success: false, message: 'ไม่มีอุปกรณ์ในช่องนี้' };

    if (currentGear.upgradeLevel >= 5) {
      return { success: false, message: 'ตีบวกถึงระดับสูงสุด (+5) แล้ว!' };
    }

    const upgradeCost = (currentGear.upgradeLevel + 1) * 600;
    if (myTeam.totalBudget < upgradeCost) {
      return { success: false, message: `งบประมาณไม่พออัปเกรดอุปกรณ์ ($${upgradeCost})` };
    }

    const upgradedGear: GamingGear = {
      ...currentGear,
      upgradeLevel: currentGear.upgradeLevel + 1,
      bonusValue: currentGear.bonusValue + 2
    };

    const updatedRoster = myTeam.roster.map((p) => {
      if (p.id === playerId) {
        const equipped = { ...p.equippedGear, [slot]: upgradedGear };
        const pUpdated: PlayerData = { ...p, equippedGear: equipped, combatPoint: 0 };
        pUpdated.combatPoint = CombatPointCalculator.calculate(pUpdated).totalCP;
        return pUpdated;
      }
      return p;
    });

    set({
      myTeam: {
        ...myTeam,
        totalBudget: myTeam.totalBudget - upgradeCost,
        roster: updatedRoster
      }
    });

    get().addAccountExp(50);
    return {
      success: true,
      message: `✨ ตีบวกสำเร็จ! ${upgradedGear.name} เป็น +${upgradedGear.upgradeLevel}!`
    };
  },

  hireStaff: (staffId) => {
    const { myTeam } = get();
    const staff = COACHING_STAFF_CATALOG.find((s) => s.id === staffId);
    if (!staff) return { success: false, message: 'ไม่พบทีมงานคนนี้' };

    if (myTeam.coaches.some((c) => c.id === staffId)) {
      return { success: false, message: 'ทีมงานคนนี้อยู่ในสังกัดแล้ว!' };
    }

    const signingBonus = staff.salary * 2;
    if (myTeam.totalBudget < signingBonus) {
      return { success: false, message: `งบประมาณไม่พอจ่ายค่าเซ็นสัญญา ($${signingBonus})` };
    }

    set({
      myTeam: {
        ...myTeam,
        totalBudget: myTeam.totalBudget - signingBonus,
        coaches: [...myTeam.coaches, staff]
      }
    });

    get().addAccountExp(60);
    return {
      success: true,
      message: `จ้าง ${staff.name} (${staff.role}) สำเร็จ!`
    };
  }
}));
