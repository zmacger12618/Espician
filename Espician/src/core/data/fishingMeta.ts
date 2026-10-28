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
 * Hardcore RPG Level Curve for Espician Fishing (Lv.1 to Lv.50+)
 * Formula: Math.floor(150 * Math.pow(level, 1.72))
 */
export function expNeededForLevel(level: number): number {
  return Math.floor(150 * Math.pow(level, 1.72));
}
