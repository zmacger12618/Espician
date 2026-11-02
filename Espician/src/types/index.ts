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

export type TalentTier = 'S+' | 'S' | 'A' | 'B' | 'C';

export interface PlayerGenetics {
  maxMechanicsCap: number;   // 0-100
  maxAwarenessCap: number;   // 0-100
  baseEgo: number;           // 0-100
  learningSpeed: number;     // 0.8 - 1.5
  mentalComposureCap?: number; // 0-100
  clutchPotential?: number;    // 0-100
  talentTier?: TalentTier;
  hiddenTraits?: string[];
  trainingAffinity?: 'Mechanics' | 'Awareness' | 'Teamwork' | 'Stamina';
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
  mentalFatigue?: number; // 0-100
  contractYearsRemaining?: number;
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

export type MobaItemTier = 'Starter' | 'Basic' | 'Epic' | 'Legendary' | 'Mythic';

export interface MobaItemStats {
  attackDamage?: number;
  abilityPower?: number;
  armor?: number;
  magicResistance?: number;
  health?: number;
  movementSpeed?: number;
  critChancePct?: number;
  cooldownReductionPct?: number;
}

export type ClubLedgerEntryType =
  | 'match_prize'
  | 'sponsorship'
  | 'ticket_sales'
  | 'gear_purchase'
  | 'gear_upgrade'
  | 'staff_salary'
  | 'player_salary'
  | 'training_fee'
  | 'transfer_fee_in'
  | 'transfer_fee_out'
  | 'misc';

export interface ClubLedgerEntry {
  id: string;
  timestamp: string;
  dayIndex: number;
  type: ClubLedgerEntryType;
  amount: number;
  balanceAfter: number;
  description: string;
  counterparty?: string;
}

export interface ClubFinancialReport {
  totalRevenue: number;
  totalExpense: number;
  netProfit: number;
  currentCashReserve: number;
  payrollPerDay: number;
  projectedRunwayDays: number;
}

export interface MobaItem {
  id: string;
  name: string;
  price: number;
  category: 'Attack' | 'Magic' | 'Defense' | 'Movement';
  statsDescription: string;
  tier?: MobaItemTier;
  recipeItemIds?: string[];
  sellPrice?: number;
  passiveName?: string;
  passiveDescription?: string;
  numericalStats?: MobaItemStats;
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

export type KillStreakType =
  | 'FirstBlood'
  | 'DoubleKill'
  | 'TripleKill'
  | 'QuadraKill'
  | 'PentaKill'
  | 'Shutdown'
  | 'Godlike';

export type CombatActionType =
  | 'attack'
  | 'skill_cast'
  | 'damage_dealt'
  | 'dodge'
  | 'heal'
  | 'shield'
  | 'cc_applied'
  | 'kill'
  | 'tower_down'
  | 'dragon_slain'
  | 'baron_slain';

export interface DamageTelemetryEvent {
  sourceEntityId: string;
  targetEntityId: string;
  rawDamage: number;
  mitigatedDamage: number;
  damageType: 'physical' | 'magic' | 'true';
  isCrit: boolean;
  isClutch: boolean;
  timestampSec: number;
}

export interface PlayerMatchTelemetry {
  playerId: string;
  totalDamageDealt: number;
  totalDamageTaken: number;
  totalHealingOrShielding: number;
  goldEarned: number;
  kills: number;
  deaths: number;
  assists: number;
  kdaRatio: number;
  cs: number;
  killParticipationPct: number;
  mvpScore: number;
  isMvp?: boolean;
}

export interface MatchStatsSummary {
  matchDurationSec: number;
  winnerTeam: 'blue' | 'red';
  blueScore: number;
  redScore: number;
  blueTowersDestroyed: number;
  redTowersDestroyed: number;
  blueDragons: number;
  redDragons: number;
  blueBarons: number;
  redBarons: number;
  mvpPlayerId: string;
  playerTelemetry: Record<string, PlayerMatchTelemetry>;
}

export interface MatchLogEvent {
  id: string;
  timestamp: string;
  type: 'kill' | 'tower' | 'objective' | 'info' | 'outplay' | 'dragon' | 'baron';
  text: string;
  killerTeam?: 'blue' | 'red';
  streakType?: KillStreakType;
  involvedPlayerIds?: string[];
  goldBounty?: number;
  coordinate?: { x: number; y: number };
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

// --- Fishing Marine Ecosystem & Aquarium Showroom ---

export type AquariumTankTier = 1 | 2 | 3 | 4 | 5;

export interface AquariumTankConfig {
  tier: AquariumTankTier;
  id: string;
  nameTh: string;
  nameEn: string;
  capacity: number;
  coinMultiplier: number;
  requiredLevel: number;
  price: number;
  accentColor: string;
  waterTint?: string;
}

export type FishRarityTier = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Secret';

export interface FishCatchEvent {
  fishUid: string;
  speciesId: string;
  rarity: FishRarityTier;
  weightKg: number;
  lengthCm: number;
  sellPrice: number;
  isNewRecord: boolean;
  timestamp: string;
}

export interface AquariumTelemetryState {
  currentTier: AquariumTankTier;
  currentFishCount: number;
  maxCapacity: number;
  passiveCoinsPerSec: number;
  totalExhibitedValue: number;
}
