import { PlayerData, PlayerRole, TransferListing } from '../../types';
import { CONDITIONS_CATALOG } from './defaultData';
import { CombatPointCalculator } from '../calculators/CombatPointCalculator';

function withCalculatedCP(player: Omit<PlayerData, 'combatPoint'>): PlayerData {
  const draft: PlayerData = { ...player, combatPoint: 0 };
  const cpBreakdown = CombatPointCalculator.calculate(draft);
  return { ...draft, combatPoint: cpBreakdown.totalCP };
}

/**
 * ฐานข้อมูลตลาดซื้อขายนักแข่งเริ่มต้น (Deterministic Database Seed - ไม่มีสุ่มมั่ว)
 */
export const INITIAL_MARKET_LISTINGS: TransferListing[] = [
  {
    id: 'mkt_kuro',
    price: 4500,
    listedBy: 'free_agent',
    scoutedAt: 'ตลาดนักแข่งอิสระ (Free Agent Pool)',
    player: withCalculatedCP({
      id: 'fa_kuro',
      inGameName: 'KuroBlaze',
      realName: 'Ken Kuroda',
      age: 18,
      role: 'Mid',
      salary: 1100,
      morale: 85,
      energy: 95,
      level: 3,
      exp: 200,
      maxExp: 600,
      marketPrice: 4500,
      dna: {
        maxMechanicsCap: 94,
        maxAwarenessCap: 82,
        baseEgo: 45,
        learningSpeed: 1.3
      },
      stats: {
        mechanics: 76,
        mapAwareness: 64,
        teamwork: 66,
        professionalism: 72,
        clutch: 84,
        consistency: 74,
        stamina: 82
      },
      conditions: [CONDITIONS_CATALOG.on_fire],
      equippedGear: {},
      championMasteries: { c_ignis_prime: 82, c_fa_shadow: 75 },
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=KuroBlaze'
    })
  },
  {
    id: 'mkt_goliath',
    price: 3800,
    listedBy: 'academy',
    scoutedAt: 'ศูนย์ฝึกเยาวชน (Pro Academy)',
    player: withCalculatedCP({
      id: 'fa_goliath',
      inGameName: 'Goliath',
      realName: 'Boonrod S.',
      age: 17,
      role: 'Top',
      salary: 950,
      morale: 90,
      energy: 100,
      level: 2,
      exp: 150,
      maxExp: 400,
      marketPrice: 3800,
      dna: {
        maxMechanicsCap: 88,
        maxAwarenessCap: 90,
        baseEgo: 30,
        learningSpeed: 1.25
      },
      stats: {
        mechanics: 70,
        mapAwareness: 72,
        teamwork: 78,
        professionalism: 85,
        clutch: 72,
        consistency: 80,
        stamina: 90
      },
      conditions: [CONDITIONS_CATALOG.team_pillar],
      equippedGear: {},
      championMasteries: { c_mg_ironclad: 84 },
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Goliath'
    })
  },
  {
    id: 'mkt_hyper',
    price: 5200,
    listedBy: 'rival',
    scoutedAt: 'บัญชีซื้อขายสโมสรลีกสูงสุด',
    player: withCalculatedCP({
      id: 'fa_hyper',
      inGameName: 'HyperViper',
      realName: 'Thanat T.',
      age: 20,
      role: 'ADC',
      salary: 1350,
      morale: 82,
      energy: 90,
      level: 4,
      exp: 350,
      maxExp: 800,
      marketPrice: 5200,
      dna: {
        maxMechanicsCap: 95,
        maxAwarenessCap: 80,
        baseEgo: 60,
        learningSpeed: 1.18
      },
      stats: {
        mechanics: 82,
        mapAwareness: 66,
        teamwork: 64,
        professionalism: 68,
        clutch: 88,
        consistency: 74,
        stamina: 78
      },
      conditions: [CONDITIONS_CATALOG.clutch_god],
      equippedGear: {},
      championMasteries: { c_valkyrie_swift: 88 },
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=HyperViper'
    })
  }
];

/**
 * ฐานข้อมูลดาวรุ่งสำหรับระบบแมวมอง (Deterministic Scouting Catalog - เรียงตามลำดับการค้นพบ)
 */
export const SCOUT_PROSPECTS_CATALOG: TransferListing[] = [
  {
    id: 'mkt_scout_zephyr',
    price: 4200,
    listedBy: 'academy',
    scoutedAt: '⭐ ดาวรุ่งอันดับ 1 ลีกอคาเดมี่เกาหลี',
    player: withCalculatedCP({
      id: 'p_scout_zephyr',
      inGameName: 'ZephyrKR',
      realName: 'Ji-Hoon Park',
      age: 17,
      role: 'Jungle',
      salary: 980,
      morale: 92,
      energy: 100,
      level: 2,
      exp: 120,
      maxExp: 400,
      marketPrice: 4200,
      dna: {
        maxMechanicsCap: 96,
        maxAwarenessCap: 94,
        baseEgo: 38,
        learningSpeed: 1.38
      },
      stats: {
        mechanics: 75,
        mapAwareness: 79,
        teamwork: 74,
        professionalism: 82,
        clutch: 80,
        consistency: 78,
        stamina: 88
      },
      conditions: [CONDITIONS_CATALOG.on_fire],
      equippedGear: {},
      championMasteries: { c_fa_shadow: 84 },
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ZephyrKR'
    })
  },
  {
    id: 'mkt_scout_aether',
    price: 4100,
    listedBy: 'academy',
    scoutedAt: '⭐ ดาวรุ่งพรสวรรค์สูง (Challenger SoloQ)',
    player: withCalculatedCP({
      id: 'p_scout_aether',
      inGameName: 'Aetherius',
      realName: 'Nattawut S.',
      age: 18,
      role: 'Support',
      salary: 920,
      morale: 90,
      energy: 98,
      level: 2,
      exp: 180,
      maxExp: 400,
      marketPrice: 4100,
      dna: {
        maxMechanicsCap: 88,
        maxAwarenessCap: 97,
        baseEgo: 25,
        learningSpeed: 1.32
      },
      stats: {
        mechanics: 68,
        mapAwareness: 85,
        teamwork: 88,
        professionalism: 90,
        clutch: 78,
        consistency: 86,
        stamina: 85
      },
      conditions: [CONDITIONS_CATALOG.team_pillar],
      equippedGear: {},
      championMasteries: { c_luna_celestial: 86 },
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Aetherius'
    })
  },
  {
    id: 'mkt_scout_kaiser',
    price: 4900,
    listedBy: 'free_agent',
    scoutedAt: 'ลีกรองยุโรป (Regional Masters)',
    player: withCalculatedCP({
      id: 'p_scout_kaiser',
      inGameName: 'KaiserBlade',
      realName: 'Lukas Meyer',
      age: 19,
      role: 'Top',
      salary: 1150,
      morale: 88,
      energy: 95,
      level: 3,
      exp: 240,
      maxExp: 600,
      marketPrice: 4900,
      dna: {
        maxMechanicsCap: 94,
        maxAwarenessCap: 88,
        baseEgo: 48,
        learningSpeed: 1.28
      },
      stats: {
        mechanics: 79,
        mapAwareness: 74,
        teamwork: 75,
        professionalism: 80,
        clutch: 84,
        consistency: 81,
        stamina: 86
      },
      conditions: [CONDITIONS_CATALOG.clutch_god],
      equippedGear: {},
      championMasteries: { c_mg_ironclad: 85 },
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=KaiserBlade'
    })
  },
  {
    id: 'mkt_scout_solari',
    price: 5400,
    listedBy: 'academy',
    scoutedAt: '⭐ แชมป์รายการเยาวชนนานาชาติ',
    player: withCalculatedCP({
      id: 'p_scout_solari',
      inGameName: 'SolariX',
      realName: 'Chanon W.',
      age: 18,
      role: 'Mid',
      salary: 1250,
      morale: 94,
      energy: 100,
      level: 3,
      exp: 310,
      maxExp: 600,
      marketPrice: 5400,
      dna: {
        maxMechanicsCap: 98,
        maxAwarenessCap: 92,
        baseEgo: 52,
        learningSpeed: 1.42
      },
      stats: {
        mechanics: 83,
        mapAwareness: 78,
        teamwork: 76,
        professionalism: 84,
        clutch: 90,
        consistency: 82,
        stamina: 86
      },
      conditions: [CONDITIONS_CATALOG.on_fire, CONDITIONS_CATALOG.clutch_god],
      equippedGear: {},
      championMasteries: { c_ignis_prime: 90 },
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=SolariX'
    })
  },
  {
    id: 'mkt_scout_nova',
    price: 4700,
    listedBy: 'free_agent',
    scoutedAt: 'ลีกอาชีพแปซิฟิก (PCS Contenders)',
    player: withCalculatedCP({
      id: 'p_scout_nova',
      inGameName: 'NovaShot',
      realName: 'Wei-Ting Lin',
      age: 19,
      role: 'ADC',
      salary: 1120,
      morale: 88,
      energy: 95,
      level: 3,
      exp: 220,
      maxExp: 600,
      marketPrice: 4700,
      dna: {
        maxMechanicsCap: 95,
        maxAwarenessCap: 86,
        baseEgo: 42,
        learningSpeed: 1.26
      },
      stats: {
        mechanics: 81,
        mapAwareness: 72,
        teamwork: 74,
        professionalism: 79,
        clutch: 85,
        consistency: 80,
        stamina: 84
      },
      conditions: [CONDITIONS_CATALOG.on_fire],
      equippedGear: {},
      championMasteries: { c_valkyrie_swift: 86 },
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=NovaShot'
    })
  }
];

let deterministicScoutCursor = 0;

/**
 * ดึงข้อมูลนักแข่งจากฐานข้อมูล Scout Prospects แบบเป็นขั้นเป็นตอน (ไม่มีการสุ่มมั่ว)
 */
export function generateScoutedPlayer(existingIds: string[] = []): TransferListing {
  const available = SCOUT_PROSPECTS_CATALOG.filter(
    (item) => !existingIds.includes(item.player.id)
  );
  const picked =
    available.length > 0
      ? available[0]
      : SCOUT_PROSPECTS_CATALOG[deterministicScoutCursor % SCOUT_PROSPECTS_CATALOG.length];

  deterministicScoutCursor += 1;
  return JSON.parse(JSON.stringify(picked));
}

/**
 * ขุมกำลังชุดเริ่มต้น 5 ตำแหน่งจากฐานข้อมูลสโมสร (Deterministic Starter Squad)
 */
export function generateStarterSquad(): PlayerData[] {
  const starterPlayers: Omit<PlayerData, 'combatPoint'>[] = [
    {
      id: 'starter_top_0',
      inGameName: 'TitanShield',
      realName: 'Kritเมธา ว.',
      age: 18,
      role: 'Top' as PlayerRole,
      salary: 900,
      morale: 90,
      energy: 100,
      level: 2,
      exp: 100,
      maxExp: 400,
      marketPrice: 4200,
      dna: { maxMechanicsCap: 90, maxAwarenessCap: 88, baseEgo: 35, learningSpeed: 1.25 },
      stats: {
        mechanics: 73,
        mapAwareness: 72,
        teamwork: 76,
        professionalism: 82,
        clutch: 74,
        consistency: 78,
        stamina: 86
      },
      conditions: [CONDITIONS_CATALOG.team_pillar],
      equippedGear: {},
      championMasteries: { c_mg_ironclad: 80 },
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=TitanShield'
    },
    {
      id: 'starter_jungle_1',
      inGameName: 'NightStalker',
      realName: 'Pachara K.',
      age: 19,
      role: 'Jungle' as PlayerRole,
      salary: 950,
      morale: 90,
      energy: 100,
      level: 2,
      exp: 100,
      maxExp: 400,
      marketPrice: 4400,
      dna: { maxMechanicsCap: 92, maxAwarenessCap: 94, baseEgo: 40, learningSpeed: 1.28 },
      stats: {
        mechanics: 75,
        mapAwareness: 78,
        teamwork: 74,
        professionalism: 80,
        clutch: 78,
        consistency: 79,
        stamina: 84
      },
      conditions: [CONDITIONS_CATALOG.on_fire],
      equippedGear: {},
      championMasteries: { c_fa_shadow: 82 },
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=NightStalker'
    },
    {
      id: 'starter_mid_2',
      inGameName: 'ArcanePro',
      realName: 'Sirawit T.',
      age: 18,
      role: 'Mid' as PlayerRole,
      salary: 1050,
      morale: 92,
      energy: 100,
      level: 2,
      exp: 120,
      maxExp: 400,
      marketPrice: 4800,
      dna: { maxMechanicsCap: 96, maxAwarenessCap: 90, baseEgo: 45, learningSpeed: 1.35 },
      stats: {
        mechanics: 79,
        mapAwareness: 74,
        teamwork: 72,
        professionalism: 78,
        clutch: 84,
        consistency: 76,
        stamina: 85
      },
      conditions: [CONDITIONS_CATALOG.clutch_god],
      equippedGear: {},
      championMasteries: { c_ignis_prime: 85 },
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ArcanePro'
    },
    {
      id: 'starter_adc_3',
      inGameName: 'PulseFire',
      realName: 'Teerapat N.',
      age: 19,
      role: 'ADC' as PlayerRole,
      salary: 1000,
      morale: 90,
      energy: 100,
      level: 2,
      exp: 100,
      maxExp: 400,
      marketPrice: 4600,
      dna: { maxMechanicsCap: 94, maxAwarenessCap: 85, baseEgo: 42, learningSpeed: 1.26 },
      stats: {
        mechanics: 78,
        mapAwareness: 70,
        teamwork: 73,
        professionalism: 79,
        clutch: 82,
        consistency: 78,
        stamina: 82
      },
      conditions: [CONDITIONS_CATALOG.on_fire],
      equippedGear: {},
      championMasteries: { c_valkyrie_swift: 84 },
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=PulseFire'
    },
    {
      id: 'starter_support_4',
      inGameName: 'AegisWard',
      realName: 'Worawut C.',
      age: 20,
      role: 'Support' as PlayerRole,
      salary: 880,
      morale: 92,
      energy: 100,
      level: 2,
      exp: 100,
      maxExp: 400,
      marketPrice: 4000,
      dna: { maxMechanicsCap: 84, maxAwarenessCap: 96, baseEgo: 25, learningSpeed: 1.22 },
      stats: {
        mechanics: 68,
        mapAwareness: 84,
        teamwork: 86,
        professionalism: 88,
        clutch: 76,
        consistency: 85,
        stamina: 86
      },
      conditions: [CONDITIONS_CATALOG.team_pillar],
      equippedGear: {},
      championMasteries: { c_luna_celestial: 85 },
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AegisWard'
    }
  ];

  return starterPlayers.map(withCalculatedCP);
}
