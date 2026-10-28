export type PlayerRole = 'Top' | 'Jungle' | 'Mid' | 'ADC' | 'Support';

export type ConditionType = 'buff' | 'debuff' | 'trait';

export interface PlayerCondition {
  id: string;
  name: string;
  description: string;
  type: ConditionType;
  icon: string;
  effectText: string;
  durationDays?: number;
}

export interface PlayerGenetics {
  maxMechanicsCap: number;   // 0-100
  maxAwarenessCap: number;   // 0-100
  baseEgo: number;           // 0-100
  learningSpeed: number;     // 0.8 - 1.5
}

export interface PlayerStats {
  mechanics: number;         // 0-100
  mapAwareness: number;      // 0-100
  teamwork: number;          // 0-100
  professionalism: number;   // 0-100
  clutch: number;            // 0-100
  consistency: number;       // 0-100
  stamina: number;           // 0-100
}

export type GearSlot = 'mouse' | 'keyboard' | 'monitor' | 'headset';

export interface GamingGear {
  id: string;
  name: string;
  slot: GearSlot;
  tier: 1 | 2 | 3 | 4 | 5;
  upgradeLevel: number;
  bonusStat: keyof PlayerStats;
  bonusValue: number;
  specialAffix?: string;
  price: number;
  icon: string;
}

export type StaffRole = 'HeadCoach' | 'DataAnalyst' | 'Psychologist' | 'Physio';

export interface CoachingStaff {
  id: string;
  name: string;
  role: StaffRole;
  salary: number;
  level: number;
  perkDescription: string;
  avatar: string;
}

export interface PlayerData {
  id: string;
  inGameName: string;
  realName: string;
  age: number;
  role: PlayerRole;
  salary: number;
  morale: number;
  energy: number;
  level: number;
  exp: number;
  maxExp: number;
  combatPoint: number;
  dna: PlayerGenetics;
  stats: PlayerStats;
  conditions: PlayerCondition[];
  equippedGear: Partial<Record<GearSlot, GamingGear>>;
  championMasteries: Record<string, number>; // championId -> mastery (0-100)
  avatar: string;
  marketPrice: number;
}

// --- MOBA In-Game Ecosystem ---

export type ChampionRole = 'Assassin' | 'Tank' | 'Mage' | 'Marksman' | 'Support';
export type MetaTier = 'S' | 'A' | 'B' | 'C';

export interface ChampionSkill {
  key: 'P' | 'Q' | 'W' | 'E' | 'R';
  name: string;
  description: string;
  type: 'Damage' | 'CrowdControl' | 'Buff' | 'Dash' | 'Shield';
}

export interface MobaItem {
  id: string;
  name: string;
  price: number;
  category: 'Attack' | 'Magic' | 'Defense' | 'Movement';
  statsDescription: string;
  icon: string;
}

export interface ChampionData {
  id: string;
  name: string;
  title: string;
  role: ChampionRole;
  metaTier: MetaTier;
  baseDamage: number;
  baseHealth: number;
  complexity: number;        // 1-100
  aggressiveWeight: number;  // 0-1
  attackRange: number;
  color: string;
  icon: string;
  counterStrongAgainst: string[]; // Champion IDs that this champ beats
  counterWeakAgainst: string[];   // Champion IDs that counter this champ
  skills: ChampionSkill[];
  coreItemIds: string[];
}

export interface ChampionPvPStats {
  championId: string;
  picks: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
}

export interface MobaPatchNotes {
  version: string;
  title: string;
  releaseDate: string;
  metaDescription: string;
  buffedChampions: string[];
  nerfedChampions: string[];
}

export type TeamTactic = 'Aggressive' | 'Balanced' | 'LateGameScaling' | 'SplitPush';

export interface TeamData {
  id: string;
  name: string;
  shortName: string;
  coachName: string;
  totalBudget: number;
  teamReputation: number;
  roster: PlayerData[];
  selectedLineup: Record<PlayerRole, string>; // role -> playerId
  assignedChampions?: Record<PlayerRole, string>; // role -> championId
  currentTactic: TeamTactic;
  fansCount: number;
  coaches: CoachingStaff[];
}

export interface MatchEntity {
  id: string;
  name: string;
  team: 'blue' | 'red';
  role: PlayerRole;
  player: PlayerData;
  champion: ChampionData;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  currentHealth: number;
  maxHealth: number;
  isDead: boolean;
  respawnTimer: number;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  gold: number;
  items: MobaItem[];
  currentAction: string;
  castingSkill?: string; // visual FX
}

export interface TowerEntity {
  id: string;
  team: 'blue' | 'red';
  lane: 'top' | 'mid' | 'bot';
  tier: 1 | 2 | 3;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  isDestroyed: boolean;
}

export interface MatchLogEvent {
  id: string;
  timestamp: string;
  type: 'kill' | 'tower' | 'objective' | 'info' | 'outplay' | 'dragon' | 'baron';
  text: string;
  killerTeam?: 'blue' | 'red';
}

export interface TransferListing {
  id: string;
  player: PlayerData;
  price: number;
  listedBy: 'free_agent' | 'academy' | 'rival';
  scoutedAt: string;
}

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  provider: 'google' | 'custom' | 'guest';
  avatar: string;
  clubName: string;
  coachName: string;
  isTutorialCompleted: boolean;
  accountLevel: number;
  accountExp: number;
  isAdmin?: boolean;
}

export interface TutorialState {
  isActive: boolean;
  step: number; // 0: Welcome & Match intro, 1: Combat observation, 2: Auto-win buff notification, 3: Completed & Pack open
  guaranteedWin: boolean;
}
