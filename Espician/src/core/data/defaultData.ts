import { ChampionData, PlayerCondition, PlayerData, TeamData } from '../../types';
import { CombatPointCalculator } from '../calculators/CombatPointCalculator';
import { CHAMPIONS_DATABASE } from './championsDatabase';

export const CONDITIONS_CATALOG: Record<string, PlayerCondition> = {
  on_fire: {
    id: 'cond_on_fire',
    name: 'ไฟแรง (On Fire)',
    description: 'กำลังมั่นใจสุดขีด ฟอร์มร้อนแรง เข้าฝักทุกจังหวะ',
    type: 'buff',
    icon: '🔥',
    effectText: 'ดาเมจแข่ง +15% / อัตราพัฒนาการซ้อม +20%',
    durationDays: 3
  },
  clutch_god: {
    id: 'cond_clutch_god',
    name: 'คลัตช์ก็อด (Clutch God)',
    description: 'ยิ่งสถานการณ์คับขัน ยิ่งดึงศักยภาพสูงสุดออกมาได้',
    type: 'trait',
    icon: '⚡',
    effectText: 'เมื่อ HP < 35% ดาเมจ & อัตราหลบหลีก +30%'
  },
  team_pillar: {
    id: 'cond_team_pillar',
    name: 'เสาหลักของทีม (Team Pillar)',
    description: 'มีภาวะผู้นำ คอยดึงสติและสั่งการเพื่อนร่วมทีม',
    type: 'trait',
    icon: '👑',
    effectText: 'ช่วยเพิ่มค่า Teamwork ให้ทุกคนในทีม +5 pt'
  },
  wrist_strain: {
    id: 'cond_wrist_strain',
    name: 'ข้อมือล้าอักเสบ (Wrist Strain)',
    description: 'ซ้อมติดต่อกันนานเกินไปจนกล้ามเนื้อข้อมือเกร็งตัว',
    type: 'debuff',
    icon: '🩹',
    effectText: 'Mechanics ลดลง 20% / ห้ามฝึก Mechanics',
    durationDays: 2
  },
  lazy: {
    id: 'cond_lazy',
    name: 'ขี้เกียจซ้อม (Slacker)',
    description: 'ขาดแรงบันดาลใจ ซ้อมแบบขอไปที อารมณ์เบื่อเกม',
    type: 'debuff',
    icon: '🦥',
    effectText: 'ประสิทธิภาพการฝึกซ้อมลดลง 40%',
    durationDays: 3
  },
  tilter: {
    id: 'cond_tilter',
    name: 'หัวร้อนง่าย (Tilter)',
    description: 'อารมณ์ขึ้นลงง่าย หากสถานการณ์ในเกมตกเป็นรองจะเสียสมาธิ',
    type: 'trait',
    icon: '💢',
    effectText: 'เมื่อทีมโดนคิลนำ ค่า Map Awareness ลดลง 15%'
  },
  flu: {
    id: 'cond_flu',
    name: 'ป่วยไข้หวัด (Flu)',
    description: 'ร่างกายอ่อนเพลีย ภูมิคุ้มกันตก ร่างกายต้องการการพักผ่อน',
    type: 'debuff',
    icon: '🤒',
    effectText: 'พลังงานฟิตเนสลดลงเร็วเป็น 2 เท่า',
    durationDays: 2
  }
};

export const CHAMPIONS_DB: ChampionData[] = CHAMPIONS_DATABASE;

const RAW_ROSTER: Omit<PlayerData, 'combatPoint'>[] = [
  {
    id: 'p_garry',
    inGameName: 'GarryMG',
    realName: 'Garry S.',
    age: 19,
    role: 'Top',
    salary: 1200,
    morale: 90,
    energy: 95,
    level: 3,
    exp: 280,
    maxExp: 600,
    marketPrice: 6500,
    dna: {
      maxMechanicsCap: 92,
      maxAwarenessCap: 85,
      baseEgo: 55,
      learningSpeed: 1.25
    },
    stats: {
      mechanics: 75,
      mapAwareness: 68,
      teamwork: 70,
      professionalism: 60,
      clutch: 82,
      consistency: 74,
      stamina: 80
    },
    conditions: [CONDITIONS_CATALOG.lazy],
    equippedGear: {},
    championMasteries: {
      'c_mg': 85,
      'c_fa': 50
    },
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Garry'
  },
  {
    id: 'p_shadow',
    inGameName: 'ShadowX',
    realName: 'Natapong K.',
    age: 20,
    role: 'Jungle',
    salary: 1400,
    morale: 85,
    energy: 90,
    level: 4,
    exp: 420,
    maxExp: 800,
    marketPrice: 7200,
    dna: {
      maxMechanicsCap: 88,
      maxAwarenessCap: 94,
      baseEgo: 40,
      learningSpeed: 1.15
    },
    stats: {
      mechanics: 70,
      mapAwareness: 82,
      teamwork: 74,
      professionalism: 80,
      clutch: 75,
      consistency: 85,
      stamina: 78
    },
    conditions: [CONDITIONS_CATALOG.team_pillar],
    equippedGear: {},
    championMasteries: {
      'c_fa': 88,
      'c_mg': 60
    },
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Shadow'
  },
  {
    id: 'p_facon',
    inGameName: 'FaCoN',
    realName: 'Fa Thanaporn',
    age: 18,
    role: 'Mid',
    salary: 1600,
    morale: 95,
    energy: 100,
    level: 5,
    exp: 150,
    maxExp: 1000,
    marketPrice: 9500,
    dna: {
      maxMechanicsCap: 98,
      maxAwarenessCap: 82,
      baseEgo: 70,
      learningSpeed: 1.4
    },
    stats: {
      mechanics: 84,
      mapAwareness: 65,
      teamwork: 62,
      professionalism: 55,
      clutch: 92,
      consistency: 68,
      stamina: 85
    },
    conditions: [CONDITIONS_CATALOG.on_fire, CONDITIONS_CATALOG.clutch_god],
    equippedGear: {},
    championMasteries: {
      'c_ignis': 90,
      'c_fa': 82
    },
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=FaCoN'
  },
  {
    id: 'p_sniper',
    inGameName: 'AceGunner',
    realName: 'Supachai P.',
    age: 21,
    role: 'ADC',
    salary: 1300,
    morale: 80,
    energy: 70,
    level: 3,
    exp: 310,
    maxExp: 600,
    marketPrice: 6800,
    dna: {
      maxMechanicsCap: 90,
      maxAwarenessCap: 78,
      baseEgo: 50,
      learningSpeed: 1.1
    },
    stats: {
      mechanics: 78,
      mapAwareness: 62,
      teamwork: 66,
      professionalism: 70,
      clutch: 70,
      consistency: 76,
      stamina: 65
    },
    conditions: [CONDITIONS_CATALOG.wrist_strain],
    equippedGear: {},
    championMasteries: {
      'c_valkyrie': 85
    },
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Ace'
  },
  {
    id: 'p_zenith',
    inGameName: 'Zenith',
    realName: 'Kittisak M.',
    age: 22,
    role: 'Support',
    salary: 1100,
    morale: 88,
    energy: 92,
    level: 3,
    exp: 490,
    maxExp: 600,
    marketPrice: 5900,
    dna: {
      maxMechanicsCap: 75,
      maxAwarenessCap: 95,
      baseEgo: 20,
      learningSpeed: 1.05
    },
    stats: {
      mechanics: 62,
      mapAwareness: 86,
      teamwork: 90,
      professionalism: 92,
      clutch: 78,
      consistency: 90,
      stamina: 88
    },
    conditions: [CONDITIONS_CATALOG.tilter],
    equippedGear: {},
    championMasteries: {
      'c_luna': 88,
      'c_mg': 72
    },
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Zenith'
  }
];

export const INITIAL_PLAYER_ROSTER: PlayerData[] = RAW_ROSTER.map((p) => {
  const dummyPlayer = { ...p, combatPoint: 0 };
  const cpBreakdown = CombatPointCalculator.calculate(dummyPlayer);
  return {
    ...dummyPlayer,
    combatPoint: cpBreakdown.totalCP
  };
});

export const INITIAL_ENEMY_TEAM: TeamData = {
  id: 'team_rival',
  name: 'Viper Esports',
  shortName: 'VIP',
  coachName: 'Coach Razor',
  totalBudget: 80000,
  teamReputation: 75,
  coaches: [],
  selectedLineup: {
    Top: 'e_1',
    Jungle: 'e_2',
    Mid: 'e_3',
    ADC: 'e_4',
    Support: 'e_5'
  },
  assignedChampions: {
    Top: 'c_mg_ironclad',
    Jungle: 'c_fa_shadow',
    Mid: 'c_ignis_prime',
    ADC: 'c_valkyrie_swift',
    Support: 'c_luna_celestial'
  },
  currentTactic: 'Aggressive',
  fansCount: 45000,
  roster: [
    {
      id: 'e_1',
      inGameName: 'Viper_Titan',
      realName: 'Min-Jun K.',
      age: 22,
      role: 'Top',
      salary: 1500,
      morale: 85,
      energy: 90,
      level: 4,
      exp: 100,
      maxExp: 800,
      combatPoint: 77,
      marketPrice: 7000,
      dna: { maxMechanicsCap: 85, maxAwarenessCap: 85, baseEgo: 50, learningSpeed: 1.0 },
      stats: { mechanics: 74, mapAwareness: 72, teamwork: 75, professionalism: 75, clutch: 70, consistency: 80, stamina: 82 },
      conditions: [],
      equippedGear: {},
      championMasteries: { 'c_mg': 80 },
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Viper1'
    },
    {
      id: 'e_2',
      inGameName: 'Viper_Ghost',
      realName: 'Kenji S.',
      age: 20,
      role: 'Jungle',
      salary: 1600,
      morale: 85,
      energy: 90,
      level: 4,
      exp: 200,
      maxExp: 800,
      combatPoint: 80,
      marketPrice: 7500,
      dna: { maxMechanicsCap: 88, maxAwarenessCap: 88, baseEgo: 55, learningSpeed: 1.0 },
      stats: { mechanics: 76, mapAwareness: 78, teamwork: 72, professionalism: 70, clutch: 75, consistency: 78, stamina: 80 },
      conditions: [],
      equippedGear: {},
      championMasteries: { 'c_fa': 85 },
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Viper2'
    },
    {
      id: 'e_3',
      inGameName: 'Viper_Nexus',
      realName: 'Leo Chen',
      age: 19,
      role: 'Mid',
      salary: 1800,
      morale: 90,
      energy: 95,
      level: 5,
      exp: 400,
      maxExp: 1000,
      combatPoint: 86,
      marketPrice: 8500,
      dna: { maxMechanicsCap: 95, maxAwarenessCap: 85, baseEgo: 65, learningSpeed: 1.2 },
      stats: { mechanics: 82, mapAwareness: 70, teamwork: 68, professionalism: 65, clutch: 85, consistency: 72, stamina: 84 },
      conditions: [CONDITIONS_CATALOG.on_fire],
      equippedGear: {},
      championMasteries: { 'c_ignis': 88 },
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Viper3'
    },
    {
      id: 'e_4',
      inGameName: 'Viper_Deadeye',
      realName: 'Alex R.',
      age: 21,
      role: 'ADC',
      salary: 1500,
      morale: 80,
      energy: 88,
      level: 4,
      exp: 300,
      maxExp: 800,
      combatPoint: 78,
      marketPrice: 7200,
      dna: { maxMechanicsCap: 86, maxAwarenessCap: 75, baseEgo: 50, learningSpeed: 1.0 },
      stats: { mechanics: 77, mapAwareness: 65, teamwork: 70, professionalism: 75, clutch: 72, consistency: 74, stamina: 78 },
      conditions: [],
      equippedGear: {},
      championMasteries: { 'c_valkyrie': 82 },
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Viper4'
    },
    {
      id: 'e_5',
      inGameName: 'Viper_Aura',
      realName: 'David W.',
      age: 23,
      role: 'Support',
      salary: 1200,
      morale: 85,
      energy: 90,
      level: 4,
      exp: 150,
      maxExp: 800,
      combatPoint: 76,
      marketPrice: 6200,
      dna: { maxMechanicsCap: 75, maxAwarenessCap: 90, baseEgo: 30, learningSpeed: 1.0 },
      stats: { mechanics: 65, mapAwareness: 82, teamwork: 85, professionalism: 88, clutch: 80, consistency: 88, stamina: 86 },
      conditions: [],
      equippedGear: {},
      championMasteries: { 'c_luna': 80 },
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Viper5'
    }
  ]
};

export const INITIAL_USER_TEAM: TeamData = {
  id: 'team_espician',
  name: 'Espician Gaming',
  shortName: 'ESP',
  coachName: 'Coach FaCoN',
  totalBudget: 25000,
  teamReputation: 60,
  selectedLineup: {
    Top: 'p_garry',
    Jungle: 'p_shadow',
    Mid: 'p_facon',
    ADC: 'p_sniper',
    Support: 'p_zenith'
  },
  assignedChampions: {
    Top: 'c_mg_ironclad',
    Jungle: 'c_fa_shadow',
    Mid: 'c_ignis_prime',
    ADC: 'c_valkyrie_swift',
    Support: 'c_luna_celestial'
  },
  currentTactic: 'Balanced',
  fansCount: 12500,
  coaches: [],
  roster: INITIAL_PLAYER_ROSTER
};
