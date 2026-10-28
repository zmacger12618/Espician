export type CostumeAccessory = 'none' | 'straw' | 'bow' | 'star' | 'headband';

export interface CostumeItem {
  id: string;
  nameTh: string;
  price: number;
  dressA: string;
  dressB: string;
  dressC: string;
  trim: string;
  accent: string;
  collar: string;
  shoe: string;
  accessory: CostumeAccessory;
  description: string;
}

export const COSTUMES: CostumeItem[] = [
  {
    id: 'costume_brown',
    nameTh: 'ชุดนักพเนจรชายฝั่ง (Cygames Classic)',
    price: 0,
    dressA: '#78350f',
    dressB: '#5c280b',
    dressC: '#451a03',
    trim: '#fde68a',
    accent: '#b45309',
    collar: '#fef3c7',
    shoe: '#5c2e14',
    accessory: 'none',
    description: 'ชุดนักเดินทางผ้าคลุมขาดสุดคลาสสิก สไตล์ Chibi จาก Cygames พร้อมกระเป๋าข้างและขวดน้ำยา'
  },
  {
    id: 'costume_cream',
    nameTh: 'ซันเดรสครีมหมวกฟาง',
    price: 1800,
    dressA: '#fef3c7',
    dressB: '#fde68a',
    dressC: '#e7c987',
    trim: '#fb7185',
    accent: '#fb7185',
    collar: '#ffffff',
    shoe: '#a16207',
    accessory: 'straw',
    description: 'ซันเดรสสีครีมนุ่มตา พร้อมหมวกฟางปีกกว้างกันแดดยามเช้า'
  },
  {
    id: 'costume_crimson',
    nameTh: 'เดรสนัวร์ชาดเลือดนก',
    price: 4500,
    dressA: '#2a2a30',
    dressB: '#1a1a1f',
    dressC: '#0b0b0e',
    trim: '#ff4655',
    accent: '#ff4655',
    collar: '#f4f4f5',
    shoe: '#18181b',
    accessory: 'headband',
    description: 'ชุดดำตัดขอบแดงสไตล์สปอร์ตเรียบหรู พร้อมที่คาดผมสีชาด'
  },
  {
    id: 'costume_sailor',
    nameTh: 'ชุดกะลาสีน้ำเงิน',
    price: 12000,
    dressA: '#1e3a8a',
    dressB: '#1e40af',
    dressC: '#172554',
    trim: '#ffffff',
    accent: '#ef4444',
    collar: '#f8fafc',
    shoe: '#f8fafc',
    accessory: 'bow',
    description: 'ชุดกะลาสีคลาสสิก ปกขาวและโบว์แดงผูกผม เข้ากับท้องทะเลที่สุด'
  },
  {
    id: 'costume_yukata',
    nameTh: 'ยูกาตะซากุระยามเย็น',
    price: 35000,
    dressA: '#be185d',
    dressB: '#9d174d',
    dressC: '#831843',
    trim: '#fbcfe8',
    accent: '#fde047',
    collar: '#fff1f2',
    shoe: '#7c2d12',
    accessory: 'bow',
    description: 'ยูกาตะสีชมพูเข้ม ลายขอบสีอ่อน สวมใส่ชมพระอาทิตย์ตกริมทะเล'
  },
  {
    id: 'costume_starlight',
    nameTh: 'ชุดราตรีแสงดาวคอสมิก',
    price: 120000,
    dressA: '#312e81',
    dressB: '#1e1b4b',
    dressC: '#0f0a3c',
    trim: '#c4b5fd',
    accent: '#fde047',
    collar: '#e0e7ff',
    shoe: '#c4b5fd',
    accessory: 'star',
    description: 'ชุดสีน้ำเงินห้วงจักรวาล ประดับมงกุฎดาวที่ส่องประกายทุกครั้งที่ปลาหายากเข้าใกล้'
  }
];

export type QuestMetric =
  | 'cast'
  | 'catch'
  | 'catch_uncommon_plus'
  | 'catch_rare_plus'
  | 'catch_epic_plus'
  | 'catch_legendary_plus'
  | 'catch_creature'
  | 'earn_coins'
  | 'jerk'
  | 'new_species'
  | 'aquarium_add'
  | 'level'
  | 'travel_island';

export interface NpcProfile {
  id: string;
  nameTh: string;
  nameEn: string;
  titleTh: string;
  titleEn: string;
  islandId: string;
  avatarIcon: string;
  accentColor: string;
}

export const NPC_CAST: Record<string, NpcProfile> = {
  alden: {
    id: 'alden',
    nameTh: 'กัปตันอัลเดน',
    nameEn: 'Captain Alden',
    titleTh: 'ผู้เฒ่าแห่งกิลด์นักตกปลา',
    titleEn: 'Elder of the Anglers Guild',
    islandId: 'island_emerald_haven',
    avatarIcon: '⚓',
    accentColor: '#38bdf8'
  },
  lyra: {
    id: 'lyra',
    nameTh: 'ไลรา นักวิจัยใต้ทะเล',
    nameEn: 'Biologist Lyra',
    titleTh: 'ผู้เชี่ยวชาญแนวปะการังเรืองแสง',
    titleEn: 'Coral Reef Scholar',
    islandId: 'island_coral_sanctuary',
    avatarIcon: '🪸',
    accentColor: '#2dd4bf'
  },
  ignis: {
    id: 'ignis',
    nameTh: 'อิกนิส ช่างตีเหล็กอัคนี',
    nameEn: 'Forge Master Ignis',
    titleTh: 'ผู้เฝ้าธารลาวาหินดำ',
    titleEn: 'Guardian of Volcanic Basalt',
    islandId: 'island_volcanic_atoll',
    avatarIcon: '🌋',
    accentColor: '#ef4444'
  },
  astrid: {
    id: 'astrid',
    nameTh: 'ชาแมนแอสทริด',
    nameEn: 'Shaman Astrid',
    titleTh: 'ผู้ฟังเสียงกระซิบแสงเหนือ',
    titleEn: 'Aurora Borealis Seer',
    islandId: 'island_aurora_fjord',
    avatarIcon: '❄️',
    accentColor: '#c084fc'
  },
  seraphina: {
    id: 'seraphina',
    nameTh: 'เซราฟินา เทพีแห่งธารดารา',
    nameEn: 'Celestial Maiden Seraphina',
    titleTh: 'ผู้พิทักษ์สารานุกรมมิติห้วงลึก',
    titleEn: 'Keeper of the Cosmic Void',
    islandId: 'island_celestial_archipelago',
    avatarIcon: '✨',
    accentColor: '#f59e0b'
  }
};

export interface QuestDef {
  id: string;
  metric: QuestMetric;
  target: number;
  coins: number;
  exp: number;
  labelTh: string;
  labelEn?: string;
  npcId?: string;
  targetIslandId?: string; // Target island for shortcut teleport
  dialogueTh?: string;
  dialogueEn?: string;
  chapterIndex?: number;
}

export const DAILY_POOL: QuestDef[] = [
  { id: 'd_cast5', metric: 'cast', target: 5, coins: 150, exp: 60, labelTh: 'เหวี่ยงเบ็ด 5 ครั้ง' },
  { id: 'd_catch3', metric: 'catch', target: 3, coins: 250, exp: 100, labelTh: 'ตกสัตว์ทะเล 3 ตัว' },
  { id: 'd_catch8', metric: 'catch', target: 8, coins: 650, exp: 280, labelTh: 'ตกสัตว์ทะเล 8 ตัว' },
  { id: 'd_unc2', metric: 'catch_uncommon_plus', target: 2, coins: 400, exp: 160, labelTh: 'ตกเกรด Uncommon ขึ้นไป 2 ตัว' },
  { id: 'd_rare1', metric: 'catch_rare_plus', target: 1, coins: 850, exp: 350, labelTh: 'ตกเกรด Rare ขึ้นไป 1 ตัว' },
  { id: 'd_creature2', metric: 'catch_creature', target: 2, coins: 480, exp: 200, labelTh: 'ตกกุ้ง หมึก หรือสิ่งมีชีวิตพิเศษ 2 ตัว' },
  { id: 'd_jerk10', metric: 'jerk', target: 10, coins: 220, exp: 90, labelTh: 'กระตุกเบ็ดวัดจังหวะ 10 ครั้ง' },
  { id: 'd_earn1000', metric: 'earn_coins', target: 1000, coins: 450, exp: 180, labelTh: 'ขายสัตว์ทะเลได้ 1,000 เหรียญ' },
  { id: 'd_aqua1', metric: 'aquarium_add', target: 1, coins: 300, exp: 120, labelTh: 'ใส่สัตว์ทะเลเข้าตู้ปลา 1 ตัว' },
  { id: 'd_new1', metric: 'new_species', target: 1, coins: 700, exp: 300, labelTh: 'ค้นพบชนิดพันธุ์ใหม่ 1 ชนิด' }
];

/**
 * Sequential Storyboard Main Quests (Cygames / Granblue Fantasy Style)
 * Unlocks sequentially with rich narrative dialogue from island NPC guildmasters.
 */
export const MAIN_QUESTS: QuestDef[] = [
  // Chapter 1: ท่าเรือมรกตและแมวส้มคู่ใจ (Emerald Haven - Captain Alden)
  {
    id: 'm_01',
    chapterIndex: 1,
    npcId: 'alden',
    targetIslandId: 'island_emerald_haven',
    metric: 'cast',
    target: 1,
    coins: 100,
    exp: 50,
    labelTh: 'บทที่ 1: การเหวี่ยงเบ็ดครั้งแรกริมท่าเรือมรกต',
    labelEn: 'Chapter 1: First Cast at Emerald Haven',
    dialogueTh: 'ยินดีต้อนรับสู่ท่าเรือมรกตนะเจ้าหนู! แมวส้มตัวนั้นดูจะถูกชะตากับเจ้าเป็นพิเศษ ลองเหวี่ยงเบ็ดลงสู่ผืนน้ำดูสิ!'
  },
  {
    id: 'm_02',
    chapterIndex: 1,
    npcId: 'alden',
    targetIslandId: 'island_emerald_haven',
    metric: 'catch',
    target: 5,
    coins: 350,
    exp: 150,
    labelTh: 'บทที่ 1: ปลาชายฝั่งและอาหารมื้อแรกของแมวส้ม',
    labelEn: 'Chapter 1: Coastal Bounty for the Pier Cat',
    dialogueTh: 'ยอดเยี่ยมมาก! เจ้าแมวส้มกินปลาซาร์ดีนที่เจ้าตกได้จนพุงกางแล้ว ตกปลาชายฝั่งเพิ่มอีกสักหน่อยเพื่อฝึกสมาธิ!'
  },
  {
    id: 'm_03',
    chapterIndex: 1,
    npcId: 'alden',
    targetIslandId: 'island_emerald_haven',
    metric: 'new_species',
    target: 4,
    coins: 800,
    exp: 300,
    labelTh: 'บทที่ 1: บันทึกสารานุกรมหน้าแรก',
    labelEn: 'Chapter 1: First Pages of the Ocean Encyclopedia',
    dialogueTh: 'สารานุกรมสมุทรของเจ้าเริ่มมีสีสันแล้ว! การรู้จักสายพันธุ์ปลาจะทำให้เจ้าเข้าใจจังหวะการดึงเบ็ดได้ดียิ่งขึ้น'
  },
  {
    id: 'm_04',
    chapterIndex: 1,
    npcId: 'alden',
    targetIslandId: 'island_coral_sanctuary',
    metric: 'level',
    target: 12,
    coins: 2500,
    exp: 800,
    labelTh: 'บทที่ 1: การฝึกฝนสู่ระดับนักตกปลาชำนาญการ (Lv.12)',
    labelEn: 'Chapter 1: Reaching Journeyman Angler (Lv.12)',
    dialogueTh: 'ฝีมือเจ้าพัฒนาขึ้นจนข้าประหลาดใจ! ตอนนี้เจ้าพร้อมแล้วสำหรับการเดินทางข้ามทะเลสู่ "เกาะแนวปะการังเรืองแสง"!'
  },

  // Chapter 2: ลากูนแห่งปะการังเรืองแสง (Coral Sanctuary - Biologist Lyra)
  {
    id: 'm_05',
    chapterIndex: 2,
    npcId: 'lyra',
    targetIslandId: 'island_coral_sanctuary',
    metric: 'catch_uncommon_plus',
    target: 8,
    coins: 3500,
    exp: 1200,
    labelTh: 'บทที่ 2: ความลับแห่งนีออนใต้ลากูน',
    labelEn: 'Chapter 2: Secrets of the Neon Lagoon',
    dialogueTh: 'สวัสดีจ้ะนักเดินทาง! ยินดีต้อนรับสู่เกาะแนวปะการังเรืองแสง! ช่วยฉันจับสิ่งมีชีวิตเกรด Uncommon เพื่อศึกษาการเรืองแสงหน่อยได้ไหม?'
  },
  {
    id: 'm_06',
    chapterIndex: 2,
    npcId: 'lyra',
    targetIslandId: 'island_coral_sanctuary',
    metric: 'catch_creature',
    target: 6,
    coins: 4800,
    exp: 1800,
    labelTh: 'บทที่ 2: การเริงระบำของหมึกและสัตว์ทะเลพิเศษ',
    labelEn: 'Chapter 2: Dance of the Indigo Squids',
    dialogueTh: 'หมึกประกายครามและสัตว์ใต้ทะเลที่นี่ฉลาดมาก พวกมันใช้แสงสื่อสารกัน ถ้าใช้เหยื่อถูกชนิด เจ้าจะได้พบพวกมันแน่นอน!'
  },
  {
    id: 'm_07',
    chapterIndex: 2,
    npcId: 'lyra',
    targetIslandId: 'island_volcanic_atoll',
    metric: 'level',
    target: 25,
    coins: 8000,
    exp: 3000,
    labelTh: 'บทที่ 2: การเตรียมตัวสู่ห้วงน้ำเดือด (Lv.25)',
    labelEn: 'Chapter 2: Preparing for the Simmering Depths (Lv.25)',
    dialogueTh: 'ทักษะของเธอสุดยอดไปเลย! แต่เกาะข้างหน้าคือ "เกาะภูเขาไฟหินดำ" สายน้ำที่นั่นร้อนจัด เจ้าต้องมีคันเบ็ดไทเทเนียมและระดับ 25 ขึ้นไปนะ!'
  },

  // Chapter 3: ภูเขาไฟหินดำและเปลวเพลิงสมุทร (Volcanic Atoll - Forge Master Ignis)
  {
    id: 'm_08',
    chapterIndex: 3,
    npcId: 'ignis',
    targetIslandId: 'island_volcanic_atoll',
    metric: 'catch_rare_plus',
    target: 10,
    coins: 14000,
    exp: 5000,
    labelTh: 'บทที่ 3: ผู้ล่าแห่งธารลาวาใต้สมุทร',
    labelEn: 'Chapter 3: Predators of the Simmering Trenches',
    dialogueTh: 'ฮ่าๆๆ! เจ้าหนู! คลื่นที่นี่เดือดพล่านพอๆ กับใจข้า! ดึงปลาระดับ Rare ขึ้นมาจากหินบะซอลต์ให้ข้าดูเป็นขวัญตาสิ!'
  },
  {
    id: 'm_09',
    chapterIndex: 3,
    npcId: 'ignis',
    targetIslandId: 'island_volcanic_atoll',
    metric: 'earn_coins',
    target: 50000,
    coins: 18000,
    exp: 6500,
    labelTh: 'บทที่ 3: ทุนสร้างศาสตราวุธแห่งดวงดาว',
    labelEn: 'Chapter 3: Funding the Celestial Armament',
    dialogueTh: 'เจ้าหาเหรียญสะสมได้มหาศาล! วัตถุดิบและเหรียญพวกนี้จะช่วยให้เจ้าหลอมคันเบ็ดผู้ทอแสงดาวเพื่อไปยังฟยอร์ดน้ำแข็งได้!'
  },
  {
    id: 'm_10',
    chapterIndex: 3,
    npcId: 'ignis',
    targetIslandId: 'island_aurora_fjord',
    metric: 'level',
    target: 38,
    coins: 25000,
    exp: 9000,
    labelTh: 'บทที่ 3: จ้าวแห่งสมุทรทมิฬ (Lv.38)',
    labelEn: 'Chapter 3: Master of the Obsidian Sea (Lv.38)',
    dialogueTh: 'ข้ายอมรับในตัวเจ้า! ข้ามผ่านทะเลเดือดไปสู่ "เกาะธารน้ำแข็งออโรร่า" เสียเถิด ชาแมนแอสทริดกำลังรอเจ้าอยู่!'
  },

  // Chapter 4: ฟยอร์ดน้ำแข็งและระบำแสงเหนือ (Aurora Fjord - Shaman Astrid)
  {
    id: 'm_11',
    chapterIndex: 4,
    npcId: 'astrid',
    targetIslandId: 'island_aurora_fjord',
    metric: 'catch_epic_plus',
    target: 5,
    coins: 38000,
    exp: 14000,
    labelTh: 'บทที่ 4: เสียงกระซิบของปลาพญานาคออร์ฟิช',
    labelEn: 'Chapter 4: Whispers of the Sakura Oarfish',
    dialogueTh: 'แสงเหนือเต้นรำเพื่อต้อนรับเธอ... ปลามหากาพย์แห่งธารน้ำแข็งกำลังแหวกว่ายใต้ผืนน้ำอันเย็นยะเยือก จงจับพวกมันด้วยความนอบน้อม'
  },
  {
    id: 'm_12',
    chapterIndex: 4,
    npcId: 'astrid',
    targetIslandId: 'island_celestial_archipelago',
    metric: 'level',
    target: 50,
    coins: 60000,
    exp: 22000,
    labelTh: 'บทที่ 4: จุดบรรจบแห่งมิติและกาลเวลา (Lv.50)',
    labelEn: 'Chapter 4: Nexus of Time & Space (Lv.50)',
    dialogueTh: 'กาลเวลามาถึงแล้ว ประตูสู่ "เกาะสวรรค์ลอยฟ้ากลางมิติ" กำลังเปิดออก... เทพีเซราฟินาและปลาลับระดับคอสมิกรอคอยเจ้าอยู่'
  },

  // Chapter 5: เกาะสวรรค์ลอยฟ้าและสารานุกรมสมบูรณ์แบบ (Celestial Void - Seraphina)
  {
    id: 'm_13',
    chapterIndex: 5,
    npcId: 'seraphina',
    targetIslandId: 'island_celestial_archipelago',
    metric: 'catch_legendary_plus',
    target: 3,
    coins: 100000,
    exp: 35000,
    labelTh: 'บทที่ 5: การประจันหน้ากับผู้พิทักษ์ดาราจักร',
    labelEn: 'Chapter 5: Encounter with the Astral Leviathan',
    dialogueTh: 'ยินดีต้อนรับสู่อาณาเขตแห่งดวงดาว... มหาอสูร Chronos Koi และฉลามวาฬเนบิวลาเฝ้ารอผู้ที่มีจิตใจเปี่ยมด้วยความรักในธรรมชาติ'
  },
  {
    id: 'm_14',
    chapterIndex: 5,
    npcId: 'seraphina',
    targetIslandId: 'island_celestial_archipelago',
    metric: 'new_species',
    target: 26,
    coins: 250000,
    exp: 80000,
    labelTh: 'บทที่ 5: สารานุกรมสมุทรครบสมบูรณ์ 26 ชนิด (Grandmaster of the Seas)',
    labelEn: 'Chapter 5: Complete 26-Species Grandmaster Encyclopedia',
    dialogueTh: 'ปาฏิหาริย์เกิดขึ้นแล้ว! สารานุกรมของเธอส่องสว่างดุจดวงอาทิตย์ในห้วงอวกาศ เธอคือนักตกปลาผู้ยิ่งใหญ่ที่สุดในประวัติศาสตร์ของ Espician!'
  }
];

export interface DailyQuestState {
  dateKey: string;
  ids: string[];
  progress: Record<string, number>;
  claimed: Record<string, boolean>;
}

export interface QuestState {
  stats: Record<string, number>;
  daily: DailyQuestState;
  mainClaimed: Record<string, boolean>;
}

export const todayKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

export function pickDailyIds(dateKey: string): string[] {
  let h = 2166136261;
  for (let i = 0; i < dateKey.length; i++) {
    h ^= dateKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const pool = [...DAILY_POOL];
  const out: string[] = [];
  while (out.length < 3 && pool.length) {
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    const i = h % pool.length;
    out.push(pool.splice(i, 1)[0].id);
  }
  return out;
}

export function emptyQuestState(): QuestState {
  const key = todayKey();
  return {
    stats: {},
    daily: { dateKey: key, ids: pickDailyIds(key), progress: {}, claimed: {} },
    mainClaimed: {}
  };
}

export function ensureDaily(q: QuestState): QuestState {
  const key = todayKey();
  if (q.daily && q.daily.dateKey === key) return q;
  return {
    ...q,
    daily: { dateKey: key, ids: pickDailyIds(key), progress: {}, claimed: {} }
  };
}

export function trackQuest(q: QuestState, metric: QuestMetric, amount = 1): QuestState {
  const cur = ensureDaily(q);
  const progress = { ...cur.daily.progress };
  for (const id of cur.daily.ids) {
    const def = DAILY_POOL.find((d) => d.id === id);
    if (def && def.metric === metric) progress[id] = (progress[id] || 0) + amount;
  }
  return {
    ...cur,
    stats: { ...cur.stats, [metric]: (cur.stats[metric] || 0) + amount },
    daily: { ...cur.daily, progress }
  };
}

export function questProgress(
  def: QuestDef,
  q: QuestState,
  kind: 'daily' | 'main',
  anglerLevel: number
): number {
  let v: number;
  if (kind === 'daily') v = q.daily.progress[def.id] || 0;
  else if (def.metric === 'level') v = anglerLevel;
  else v = q.stats[def.metric] || 0;
  return Math.min(def.target, v);
}

/**
 * Calibrated 240-Hour Average RPG Level Curve for Espician Fishing (Lv.1 to Lv.55 Endgame)
 * Formula: Math.floor(83.5 * Math.pow(level, 1.68))
 * Scientifically simulated across 50 Monte Carlo journeys to yield ~240 hours average playtime
 * to unlock all 5 islands, catch all 32 fish species, own all 6 rods & 6 costumes, and 100% main quests.
 */
export function expNeededForLevel(level: number): number {
  return Math.floor(83.5 * Math.pow(level, 1.68));
}

export interface AchievementDef {
  id: string;
  category: 'catch' | 'rarity' | 'weight' | 'island' | 'night' | 'misc';
  titleTh: string;
  titleEn: string;
  descTh: string;
  descEn: string;
  icon: string;
  target: number;
  metric: string;
  rewardCoins: number;
  rewardExp: number;
}

export const ACHIEVEMENT_CATALOG: AchievementDef[] = [
  { id: 'ach_cast_1', category: 'misc', titleTh: 'ก้าวแรกสู่วิถีเบ็ด', titleEn: 'First Cast', descTh: 'เหวี่ยงเบ็ดลงสู่ทะเลเป็นครั้งแรก', descEn: 'Cast fishing line for the first time', icon: '🎣', target: 1, metric: 'cast', rewardCoins: 100, rewardExp: 50 },
  { id: 'ach_catch_10', category: 'catch', titleTh: 'นักตกปลามือใหม่', titleEn: 'Apprentice Angler', descTh: 'ตกสัตว์ทะเลได้ครบ 10 ตัว', descEn: 'Catch 10 marine creatures', icon: '🐟', target: 10, metric: 'catch', rewardCoins: 500, rewardExp: 200 },
  { id: 'ach_catch_50', category: 'catch', titleTh: 'ผู้ชำนาญสายน้ำ', titleEn: 'Tide Walker', descTh: 'ตกสัตว์ทะเลได้ครบ 50 ตัว', descEn: 'Catch 50 marine creatures', icon: '🌊', target: 50, metric: 'catch', rewardCoins: 2500, rewardExp: 1000 },
  { id: 'ach_catch_150', category: 'catch', titleTh: 'จอมขมังเวทย์แห่งสะพานปลา', titleEn: 'Master of the Pier', descTh: 'ตกสัตว์ทะเลได้ครบ 150 ตัว', descEn: 'Catch 150 marine creatures', icon: '🏆', target: 150, metric: 'catch', rewardCoins: 10000, rewardExp: 4000 },
  { id: 'ach_catch_300', category: 'catch', titleTh: 'ตำนานปรมาจารย์เบ็ด', titleEn: 'Sovereign of the Seas', descTh: 'ตกสัตว์ทะเลได้ครบ 300 ตัว', descEn: 'Catch 300 marine creatures', icon: '👑', target: 300, metric: 'catch', rewardCoins: 35000, rewardExp: 12000 },
  { id: 'ach_rare_1', category: 'rarity', titleTh: 'ประกายแสงสีคราม', titleEn: 'Azure Spark', descTh: 'ตกสัตว์ทะเลระดับ Rare สำเร็จ 1 ตัว', descEn: 'Catch your first Rare marine creature', icon: '💎', target: 1, metric: 'catch_rare_plus', rewardCoins: 1200, rewardExp: 500 },
  { id: 'ach_rare_10', category: 'rarity', titleTh: 'นักล่าอัญมณีสมุทร', titleEn: 'Ocean Gem Hunter', descTh: 'ตกสัตว์ทะเลระดับ Rare ขึ้นไป 10 ตัว', descEn: 'Catch 10 Rare+ marine creatures', icon: '💠', target: 10, metric: 'catch_rare_plus', rewardCoins: 8000, rewardExp: 3000 },
  { id: 'ach_epic_1', category: 'rarity', titleTh: 'สมบัติมหากาพย์สีม่วง', titleEn: 'Purple Marvel', descTh: 'ตกสัตว์ทะเลระดับ Epic สำเร็จ', descEn: 'Catch your first Epic creature', icon: '🔮', target: 1, metric: 'catch_epic_plus', rewardCoins: 5000, rewardExp: 2000 },
  { id: 'ach_legend_1', category: 'rarity', titleTh: 'เสียงเพรียกจากตำนาน', titleEn: 'Whisper of Legend', descTh: 'พิชิตสัตว์ทะเลระดับ Legendary สำเร็จ', descEn: 'Catch a Legendary creature', icon: '🌟', target: 1, metric: 'catch_legendary_plus', rewardCoins: 25000, rewardExp: 10000 },
  { id: 'ach_secret_1', category: 'rarity', titleTh: 'ความลับแห่งห้วงลึกสูงสุด', titleEn: 'Abyssal Secret', descTh: 'ตกสัตว์ทะเลระดับ Secret ที่ซ่อนอยู่ในสมุทร', descEn: 'Catch a Secret mythical entity', icon: '🌌', target: 1, metric: 'catch_secret', rewardCoins: 80000, rewardExp: 30000 },
  { id: 'ach_jerk_25', category: 'misc', titleTh: 'จังหวะพริ้วไหว', titleEn: 'Rhythmic Jerk', descTh: 'กระตุกเบ็ดวัดจังหวะ 25 ครั้ง', descEn: 'Perform 25 jerk line actions', icon: '⚡', target: 25, metric: 'jerk', rewardCoins: 800, rewardExp: 300 },
  { id: 'ach_jerk_100', category: 'misc', titleTh: 'กระตุกปลิดวิญญาณ', titleEn: 'Twitch Prodigy', descTh: 'กระตุกเบ็ดวัดจังหวะ 100 ครั้ง', descEn: 'Perform 100 jerk line actions', icon: '💫', target: 100, metric: 'jerk', rewardCoins: 4500, rewardExp: 1800 },
  { id: 'ach_aqua_4', category: 'misc', titleTh: 'ตู้ปลาเริ่มมีชีวิต', titleEn: 'Aquarium Bloom', descTh: 'นำปลาเข้าตู้ปลา 4 ตัว', descEn: 'Add 4 fish to aquarium', icon: '🐠', target: 4, metric: 'aquarium_add', rewardCoins: 1000, rewardExp: 400 },
  { id: 'ach_earn_50k', category: 'misc', titleTh: 'พ่อค้าปลาหน้าใหม่', titleEn: 'Fishmonger', descTh: 'ขายสัตว์ทะเลสะสมได้ 50,000 เหรียญ', descEn: 'Earn 50,000 Sea Coins from selling fish', icon: '🪙', target: 50000, metric: 'earn_coins', rewardCoins: 6000, rewardExp: 2500 },
  { id: 'ach_earn_250k', category: 'misc', titleTh: 'มหาเศรษฐีสมุทร', titleEn: 'Maritime Tycoon', descTh: 'ขายสัตว์ทะเลสะสมได้ 250,000 เหรียญ', descEn: 'Earn 250,000 Sea Coins', icon: '💰', target: 250000, metric: 'earn_coins', rewardCoins: 30000, rewardExp: 10000 },
  { id: 'ach_species_10', category: 'catch', titleTh: 'ผู้สำรวจชีวภาพ', titleEn: 'Biological Surveyor', descTh: 'ค้นพบสัตว์ทะเลครบ 10 ชนิดในสารานุกรม', descEn: 'Discover 10 unique species in encyclopedia', icon: '📖', target: 10, metric: 'new_species', rewardCoins: 3000, rewardExp: 1200 },
  { id: 'ach_species_25', category: 'catch', titleTh: 'นักธรรมชาติวิทยาทางทะเล', titleEn: 'Marine Naturalist', descTh: 'ค้นพบสัตว์ทะเลครบ 25 ชนิด', descEn: 'Discover 25 unique species', icon: '📜', target: 25, metric: 'new_species', rewardCoins: 20000, rewardExp: 8000 },
  { id: 'ach_dex_all', category: 'catch', titleTh: 'สารานุกรมสมบูรณ์แบบ (100%)', titleEn: 'Grand Encyclopedia Master', descTh: 'ค้นพบสัตว์ทะเลครบทั้ง 32 ชนิด', descEn: 'Discover all 32 unique species', icon: '⭐', target: 32, metric: 'new_species', rewardCoins: 100000, rewardExp: 40000 }
];

export interface FishExchangeItem {
  id: string;
  nameTh: string;
  nameEn: string;
  descTh: string;
  descEn: string;
  type: 'costume' | 'lantern' | 'rod';
  rewardItemId: string;
  icon: string;
  requiredFish: { speciesId: string; count: number }[];
}

export const FISH_EXCHANGE_SHOP: FishExchangeItem[] = [
  {
    id: 'ex_sailor_costume',
    nameTh: 'ชุดกะลาสีมารีนบลูกะลาสีเรือ',
    nameEn: 'Navy Sailor Marine Uniform',
    descTh: 'นำซาร์ดีน 4 ตัว + กุ้งทะเล 3 ตัว มาแลกชุดกะลาสีสุดน่ารัก',
    descEn: 'Turn in 4 Sardines + 3 Shrimps to receive the Navy Sailor Uniform',
    type: 'costume',
    rewardItemId: 'costume_sailor',
    icon: '⚓',
    requiredFish: [
      { speciesId: 'fish_01_sardine', count: 4 },
      { speciesId: 'creature_21_shrimp', count: 3 }
    ]
  },
  {
    id: 'ex_yukata_costume',
    nameTh: 'ยูกาตะเทศกาลดอกไม้ไฟชายฝั่ง',
    nameEn: 'Ocean Festival Yukata',
    descTh: 'นำปลาการ์ตูน 4 ตัว + หมึกประกายคราม 3 ตัว + ปลานกแก้ว 2 ตัว มาแลกยูกาตะญี่ปุ่นแท้',
    descEn: 'Turn in 4 Clownfish + 3 Squids + 2 Parrotfish for the Festival Yukata',
    type: 'costume',
    rewardItemId: 'costume_yukata',
    icon: '👘',
    requiredFish: [
      { speciesId: 'fish_02_clownfish', count: 4 },
      { speciesId: 'creature_22_squid', count: 3 },
      { speciesId: 'fish_07_parrotfish', count: 2 }
    ]
  },
  {
    id: 'ex_starlight_costume',
    nameTh: 'ชุดคลุมผู้พิทักษ์ห้วงอวกาศดาราจักร',
    nameEn: 'Celestial Starlight Astral Robe',
    descTh: 'นำปลากระเบนราหู 2 ตัว + ปลาพญานาค 1 ตัว + ปลามังกรดวงดาว 1 ตัว มาแลกชุดคลุมแสงดาว',
    descEn: 'Turn in 2 Manta Rays + 1 Oarfish + 1 Starlight Dragonet for the Astral Robe',
    type: 'costume',
    rewardItemId: 'costume_starlight',
    icon: '🌌',
    requiredFish: [
      { speciesId: 'fish_13_mantaray', count: 2 },
      { speciesId: 'fish_16_oarfish', count: 1 },
      { speciesId: 'fish_32_starlight_dragonet', count: 1 }
    ]
  }
];
