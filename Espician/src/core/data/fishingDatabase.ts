export type FishRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Secret';

export type FishBodyShape =
  | 'sardine'
  | 'clownfish'
  | 'mackerel'
  | 'flounder'
  | 'bream'
  | 'snapper'
  | 'parrotfish'
  | 'boxfish'
  | 'barracuda'
  | 'tuna'
  | 'lionfish'
  | 'mahimahi'
  | 'mantaray'
  | 'swordfish'
  | 'anglerfish'
  | 'oarfish'
  | 'whaleshark'
  | 'coelacanth'
  | 'leviathan'
  | 'chronoskoi'
  | 'shrimp'
  | 'squid'
  | 'jellyfish'
  | 'seahorse'
  | 'octopus'
  | 'nautilus';

export type OceanTimeMood = 'morning' | 'sunset' | 'night_glow' | 'astral_storm';

export interface FishSpeciesData {
  id: string;
  indexNumber: number;
  nameTh: string;
  nameEn: string;
  category?: 'fish' | 'creature';
  rarity: FishRarity;
  bodyShape: FishBodyShape;
  habitat: string;
  minWeightKg: number;
  maxWeightKg: number;
  minLengthCm: number;
  maxLengthCm: number;
  basePrice: number;
  expReward: number;
  difficulty: number; // 1..10 (affects minigame fish speed & erratic behavior)
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  patternType: 'stripes' | 'spots' | 'bands' | 'gradient' | 'starlight' | 'crystal' | 'nebula';
  preferredBaitIds: string[];
  description: string;
}

export interface CaughtFishInstance {
  uid: string;
  speciesId: string;
  caughtAt: string;
  weightKg: number;
  lengthCm: number;
  sizeTier: 'Tiny' | 'Normal' | 'Large' | 'CrownGiant';
  colorSeed: number;
  hueShiftDeg: number;
  variantTitle: string; // e.g. 'สีปกติ', 'เกล็ดประกายทอง (Golden Morph)', 'อัลบิโน่ (Albino)', 'ดาราจักร (Starlight)'
  sellPrice: number;
  isLockedInAquarium?: boolean;
}

export interface FishingRodItem {
  id: string;
  nameTh: string;
  nameEn: string;
  price: number;
  requiredLevel: number;
  waitTimeReductionPct: number; // Reduces the 1m - 1h wait timer
  sweetSpotSizeBonus: number; // Makes the minigame catch bar wider
  lineStrengthBonus: number; // Slows down progress loss when fish leaves bar
  rarityBoostMultiplier: number; // Boosts Rare/Epic/Legendary/Secret weights
  rodColor: string;
  description: string;
}

export interface FishingBaitItem {
  id: string;
  nameTh: string;
  nameEn: string;
  pricePerPack: number;
  packQuantity: number;
  waitTimeReductionPct: number;
  targetRarities: FishRarity[];
  targetFishIds: string[];
  bonusWeightMultiplier: number;
  iconColor: string;
  description: string;
}

export const RARITY_CONFIG: Record<
  FishRarity,
  {
    labelTh: string;
    baseChancePct: number;
    minWaitSec: number;
    maxWaitSec: number;
    badgeBg: string;
    badgeText: string;
    borderColor: string;
    glowColor: string;
  }
> = {
  Common: {
    labelTh: 'ทั่วไป (Common)',
    baseChancePct: 48.0,
    minWaitSec: 45, // 45s
    maxWaitSec: 120, // 2 mins
    badgeBg: 'bg-slate-700/60',
    badgeText: 'text-slate-200',
    borderColor: 'border-slate-500/50',
    glowColor: '#94a3b8'
  },
  Uncommon: {
    labelTh: 'พบได้ไม่ง่าย (Uncommon)',
    baseChancePct: 26.0,
    minWaitSec: 120, // 2 mins
    maxWaitSec: 360, // 6 mins
    badgeBg: 'bg-emerald-900/60',
    badgeText: 'text-emerald-300',
    borderColor: 'border-emerald-500/50',
    glowColor: '#34d399'
  },
  Rare: {
    labelTh: 'หายาก (Rare)',
    baseChancePct: 15.0,
    minWaitSec: 300, // 5 mins
    maxWaitSec: 900, // 15 mins
    badgeBg: 'bg-sky-900/60',
    badgeText: 'text-sky-300',
    borderColor: 'border-sky-400/60',
    glowColor: '#38bdf8'
  },
  Epic: {
    labelTh: 'มหากาพย์ (Epic)',
    baseChancePct: 7.5,
    minWaitSec: 720, // 12 mins
    maxWaitSec: 1800, // 30 mins
    badgeBg: 'bg-purple-900/60',
    badgeText: 'text-purple-300',
    borderColor: 'border-purple-400/60',
    glowColor: '#c084fc'
  },
  Legendary: {
    labelTh: 'ตำนานแห่งสมุทร (Legendary)',
    baseChancePct: 2.8,
    minWaitSec: 1500, // 25 mins
    maxWaitSec: 3000, // 50 mins
    badgeBg: 'bg-amber-900/60',
    badgeText: 'text-amber-300',
    borderColor: 'border-amber-400/70',
    glowColor: '#fbbf24'
  },
  Secret: {
    labelTh: 'ความลับแห่งห้วงลึก (SECRET)',
    baseChancePct: 0.7,
    minWaitSec: 2400, // 40 mins
    maxWaitSec: 4200, // 70 mins
    badgeBg: 'bg-rose-950/80',
    badgeText: 'text-rose-300',
    borderColor: 'border-rose-400/80',
    glowColor: '#fb7185'
  }
};

/**
 * ปลาทะเลทั้ง 20 ชนิดที่ออกแบบขึ้นเฉพาะสำหรับ Espician Fishing
 * ผสมผสานปลาทะเลจริงเข้ากับจินตนาการแฟนตาซีในระดับสูง
 */
export const TWENTY_OCEAN_FISH_SPECIES: FishSpeciesData[] = [
  // ======================== COMMON (5 Species) ========================
  {
    id: 'fish_01_sardine',
    indexNumber: 1,
    nameTh: 'ซาร์ดีนเกล็ดเงิน',
    nameEn: 'Silverleaf Sardine',
    rarity: 'Common',
    bodyShape: 'sardine',
    habitat: 'ผิวน้ำชายฝั่ง',
    minWeightKg: 0.08,
    maxWeightKg: 0.35,
    minLengthCm: 12,
    maxLengthCm: 26,
    basePrice: 45,
    expReward: 25,
    difficulty: 1.5,
    primaryColor: '#94a3b8',
    secondaryColor: '#e2e8f0',
    accentColor: '#38bdf8',
    patternType: 'spots',
    preferredBaitIds: ['bait_sandworm', 'bait_krill'],
    description: 'ปลาฝูงตัวเล็กปราดเปรียว เกล็ดสีเงินสะท้อนแสงอาทิตย์ยามเช้าเหมือนใบไม้เงินลอยน้ำ'
  },
  {
    id: 'fish_02_clownfish',
    indexNumber: 2,
    nameTh: 'ปลาการ์ตูนปะการังส้ม',
    nameEn: 'Coral Clownfish',
    rarity: 'Common',
    bodyShape: 'clownfish',
    habitat: 'แนวปะการังน้ำตื้น',
    minWeightKg: 0.12,
    maxWeightKg: 0.48,
    minLengthCm: 10,
    maxLengthCm: 22,
    basePrice: 60,
    expReward: 30,
    difficulty: 1.8,
    primaryColor: '#f97316',
    secondaryColor: '#ffffff',
    accentColor: '#1e293b',
    patternType: 'bands',
    preferredBaitIds: ['bait_krill'],
    description: 'ปลาสีส้มสดใสคาดแถบสีขาวตัดขอบดำ อาศัยอยู่เคียงคู่กับดอกไม้ทะเลใกล้ท่าเรือไม้'
  },
  {
    id: 'fish_03_mackerel',
    indexNumber: 3,
    nameTh: 'ปลาทูครามสมุทร',
    nameEn: 'Azure Mackerel',
    rarity: 'Common',
    bodyShape: 'mackerel',
    habitat: 'กระแสน้ำอุ่นชายฝั่ง',
    minWeightKg: 0.25,
    maxWeightKg: 0.95,
    minLengthCm: 20,
    maxLengthCm: 42,
    basePrice: 75,
    expReward: 35,
    difficulty: 2.2,
    primaryColor: '#0284c7',
    secondaryColor: '#bae6fd',
    accentColor: '#0369a1',
    patternType: 'stripes',
    preferredBaitIds: ['bait_sandworm', 'bait_krill'],
    description: 'ปลาผิวน้ำที่มีลายคลื่นสีครามพาดผ่านแผ่นหลัง ว่ายทวนเกลียวคลื่นได้อย่างคล่องแคล่ว'
  },
  {
    id: 'fish_04_flounder',
    indexNumber: 4,
    nameTh: 'ปลาตาเดียวทรายทอง',
    nameEn: 'Golden Sand Flounder',
    rarity: 'Common',
    bodyShape: 'flounder',
    habitat: 'พื้นทรายใต้สะพานปลา',
    minWeightKg: 0.4,
    maxWeightKg: 1.8,
    minLengthCm: 24,
    maxLengthCm: 50,
    basePrice: 90,
    expReward: 40,
    difficulty: 2.4,
    primaryColor: '#b45309',
    secondaryColor: '#fde68a',
    accentColor: '#f59e0b',
    patternType: 'spots',
    preferredBaitIds: ['bait_sandworm'],
    description: 'ปลาตัวแบนที่ชอบซ่อนตัวใต้ผืนทรายสีทอง มีจุดกลมสีอำพันช่วยพรางตัวจากนักล่า'
  },
  {
    id: 'fish_05_bream',
    indexNumber: 5,
    nameTh: 'ปลากะพงลายพาดเงิน',
    nameEn: 'Silver-Striped Sea Bream',
    rarity: 'Common',
    bodyShape: 'bream',
    habitat: 'โขดหินริมฝั่ง',
    minWeightKg: 0.6,
    maxWeightKg: 2.6,
    minLengthCm: 28,
    maxLengthCm: 58,
    basePrice: 110,
    expReward: 45,
    difficulty: 2.6,
    primaryColor: '#64748b',
    secondaryColor: '#f1f5f9',
    accentColor: '#cbd5e1',
    patternType: 'stripes',
    preferredBaitIds: ['bait_sandworm', 'bait_krill'],
    description: 'ปลาทะเลลำตัวกว้างแข็งแรง มีแถบสีเงินพาดตามแนวตั้ง ชอบแหวกว่ายรอบเสาไม้สะพานท่าเรือ'
  },

  // ======================== UNCOMMON (4 Species) ========================
  {
    id: 'fish_06_snapper',
    indexNumber: 6,
    nameTh: 'ปลากะพงแดงเพลิง',
    nameEn: 'Crimson Flame Snapper',
    rarity: 'Uncommon',
    bodyShape: 'snapper',
    habitat: 'แนวหินโสโครกน้ำลึก',
    minWeightKg: 1.2,
    maxWeightKg: 5.4,
    minLengthCm: 38,
    maxLengthCm: 78,
    basePrice: 210,
    expReward: 75,
    difficulty: 3.5,
    primaryColor: '#e11d48',
    secondaryColor: '#fecdd3',
    accentColor: '#fb7185',
    patternType: 'gradient',
    preferredBaitIds: ['bait_krill', 'bait_squid'],
    description: 'ปลากะพงสีแดงเข้มดั่งทับทิมแห่งท้องทะเล ฮุบเหยื่อดุดันและมีแรงดึงปลายสายไม่ธรรมดา'
  },
  {
    id: 'fish_07_parrotfish',
    indexNumber: 7,
    nameTh: 'ปลานกแก้วมรกต',
    nameEn: 'Emerald Reef Parrotfish',
    rarity: 'Uncommon',
    bodyShape: 'parrotfish',
    habitat: 'สวนปะการังเรืองแสง',
    minWeightKg: 1.0,
    maxWeightKg: 4.2,
    minLengthCm: 35,
    maxLengthCm: 70,
    basePrice: 240,
    expReward: 85,
    difficulty: 3.8,
    primaryColor: '#10b981',
    secondaryColor: '#38bdf8',
    accentColor: '#f472b6',
    patternType: 'gradient',
    preferredBaitIds: ['bait_krill', 'bait_crystal_lure'],
    description: 'ปลาเกล็ดสีมรกตเหลือบฟ้าอมชมพู สร้างม่านฟองอากาศห่อหุ้มตัวเองยามค่ำคืน'
  },
  {
    id: 'fish_08_boxfish',
    indexNumber: 8,
    nameTh: 'ปลาปักเป้ากล่องดารา',
    nameEn: 'Starlight Boxfish',
    rarity: 'Uncommon',
    bodyShape: 'boxfish',
    habitat: 'อ่าวปะการังน้ำนิ่ง',
    minWeightKg: 0.45,
    maxWeightKg: 1.6,
    minLengthCm: 16,
    maxLengthCm: 36,
    basePrice: 275,
    expReward: 95,
    difficulty: 4.0,
    primaryColor: '#eab308',
    secondaryColor: '#fef08a',
    accentColor: '#8b5cf6',
    patternType: 'spots',
    preferredBaitIds: ['bait_krill', 'bait_squid'],
    description: 'ปลารูปทรงสี่เหลี่ยมสุดน่ารัก ประดับด้วยจุดเรืองแสงคล้ายหมู่ดาวเมื่อต้องแสงจันทร์'
  },
  {
    id: 'fish_09_barracuda',
    indexNumber: 9,
    nameTh: 'ปลาน้ำดอกไม้สนธยา',
    nameEn: 'Twilight Barracuda',
    rarity: 'Uncommon',
    bodyShape: 'barracuda',
    habitat: 'ร่องน้ำกระแสเชี่ยว',
    minWeightKg: 2.5,
    maxWeightKg: 9.8,
    minLengthCm: 65,
    maxLengthCm: 135,
    basePrice: 320,
    expReward: 110,
    difficulty: 4.6,
    primaryColor: '#475569',
    secondaryColor: '#cbd5e1',
    accentColor: '#facc15',
    patternType: 'stripes',
    preferredBaitIds: ['bait_squid', 'bait_crystal_lure'],
    description: 'นักล่าลำตัวเพรียวยาวดั่งลูกศรเงิน มักออกล่าเหยื่อในช่วงเวลาพระอาทิตย์ตกดิน'
  },

  // ======================== RARE (4 Species) ========================
  {
    id: 'fish_10_tuna',
    indexNumber: 10,
    nameTh: 'ปลาทูน่าครีบน้ำเงินยักษ์',
    nameEn: 'Royal Bluefin Tuna',
    rarity: 'Rare',
    bodyShape: 'tuna',
    habitat: 'ทะเลเปิดน้ำลึก',
    minWeightKg: 18.0,
    maxWeightKg: 85.0,
    minLengthCm: 110,
    maxLengthCm: 210,
    basePrice: 680,
    expReward: 210,
    difficulty: 5.8,
    primaryColor: '#1d4ed8',
    secondaryColor: '#e2e8f0',
    accentColor: '#facc15',
    patternType: 'gradient',
    preferredBaitIds: ['bait_squid', 'bait_crystal_lure'],
    description: 'ราชานักว่ายน้ำแห่งมหาสมุทร ครีบสีน้ำเงินเข้มขลิบทอง พละกำลังสูงจนคันเบ็ดโค้งงอสุดตัว'
  },
  {
    id: 'fish_11_lionfish',
    indexNumber: 11,
    nameTh: 'ปลาสิงโตครีบจันทร์เสี้ยว',
    nameEn: 'Crescent Plume Lionfish',
    rarity: 'Rare',
    bodyShape: 'lionfish',
    habitat: 'ถ้ำปะการังใต้สมุทร',
    minWeightKg: 0.9,
    maxWeightKg: 3.2,
    minLengthCm: 28,
    maxLengthCm: 52,
    basePrice: 740,
    expReward: 230,
    difficulty: 6.0,
    primaryColor: '#be123c',
    secondaryColor: '#fff1f2',
    accentColor: '#fbbf24',
    patternType: 'bands',
    preferredBaitIds: ['bait_squid', 'bait_golden_essence'],
    description: 'ปลาสิงโตที่มีครีบยาวพริ้วไหวดั่งอาภรณ์แห่งจันทรา สวยงามแต่แฝงด้วยหนามอันสง่างาม'
  },
  {
    id: 'fish_12_mahimahi',
    indexNumber: 12,
    nameTh: 'ปลาอีโต้มอญประกายทอง',
    nameEn: 'Sunburst Mahi-Mahi',
    rarity: 'Rare',
    bodyShape: 'mahimahi',
    habitat: 'ผิวน้ำเขตร้อน',
    minWeightKg: 6.5,
    maxWeightKg: 24.0,
    minLengthCm: 80,
    maxLengthCm: 155,
    basePrice: 820,
    expReward: 250,
    difficulty: 6.3,
    primaryColor: '#eab308',
    secondaryColor: '#06b6d4',
    accentColor: '#10b981',
    patternType: 'spots',
    preferredBaitIds: ['bait_crystal_lure', 'bait_golden_essence'],
    description: 'ปลาสีทองอร่ามตัดกับครีบยาวสีเทอร์ควอยซ์เรืองแสง กระโดดเหนือผิวน้ำส่องประกายระยิบระยับ'
  },
  {
    id: 'fish_13_mantaray',
    indexNumber: 13,
    nameTh: 'ปลากระเบนราตรีพริ้วไหว',
    nameEn: 'Velvet Starlight Manta',
    rarity: 'Rare',
    bodyShape: 'mantaray',
    habitat: 'ร่องน้ำสายลมราตรี',
    minWeightKg: 14.0,
    maxWeightKg: 52.0,
    minLengthCm: 120,
    maxLengthCm: 240,
    basePrice: 950,
    expReward: 290,
    difficulty: 6.6,
    primaryColor: '#312e81',
    secondaryColor: '#e0e7ff',
    accentColor: '#38bdf8',
    patternType: 'starlight',
    preferredBaitIds: ['bait_squid', 'bait_crystal_lure'],
    description: 'ปลากระเบนปีกกว้างสีน้ำเงินกำมะหยี่ โบยบินในผืนน้ำยามค่ำคืนพร้อมละอองแสงสีฟ้าอ่อน'
  },

  // ======================== EPIC (3 Species - Fantasy Ocean) ========================
  {
    id: 'fish_14_swordfish',
    indexNumber: 14,
    nameTh: 'ปลากระโทงดาบผลึกแก้ว',
    nameEn: 'Crystal-Horn Swordfish',
    rarity: 'Epic',
    bodyShape: 'swordfish',
    habitat: 'กระแสน้ำวนคริสตัล',
    minWeightKg: 28.0,
    maxWeightKg: 115.0,
    minLengthCm: 150,
    maxLengthCm: 290,
    basePrice: 1850,
    expReward: 520,
    difficulty: 7.5,
    primaryColor: '#0ea5e9',
    secondaryColor: '#e0f2fe',
    accentColor: '#67e8f9',
    patternType: 'crystal',
    preferredBaitIds: ['bait_crystal_lure', 'bait_golden_essence'],
    description: 'อัศวินแห่งท้องทะเลผู้มีปลายดาบตกผลึกเป็นควอตซ์สีฟ้าใส สามารถตัดผ่านคลื่นยักษ์ได้ในพริบตา'
  },
  {
    id: 'fish_15_angler',
    indexNumber: 15,
    nameTh: 'ปลาตกเบ็ดโคมไฟห้วงลึก',
    nameEn: 'Abyssal Lantern Angler',
    rarity: 'Epic',
    bodyShape: 'anglerfish',
    habitat: 'ห้วงเหวมหาสมุทรเรืองแสง',
    minWeightKg: 4.5,
    maxWeightKg: 16.0,
    minLengthCm: 45,
    maxLengthCm: 95,
    basePrice: 2100,
    expReward: 580,
    difficulty: 7.8,
    primaryColor: '#4c1d95',
    secondaryColor: '#a855f7',
    accentColor: '#22d3ee',
    patternType: 'starlight',
    preferredBaitIds: ['bait_squid', 'bait_astral_nectar'],
    description: 'ปลาลึกลับจากก้นสมุทรที่มีโคมไฟอัญมณีเรืองแสงสีฟ้าครามห้อยอยู่หน้าผาก ส่องสว่างในความมืดมิด'
  },
  {
    id: 'fish_16_oarfish',
    indexNumber: 16,
    nameTh: 'ปลาออร์ฟิชริบบิ้นซากุระ',
    nameEn: 'Sakura Ribbon Oarfish',
    rarity: 'Epic',
    bodyShape: 'oarfish',
    habitat: 'รอยต่อกระแสน้ำศักดิ์สิทธิ์',
    minWeightKg: 22.0,
    maxWeightKg: 78.0,
    minLengthCm: 220,
    maxLengthCm: 480,
    basePrice: 2450,
    expReward: 650,
    difficulty: 8.1,
    primaryColor: '#f8fafc',
    secondaryColor: '#f472b6',
    accentColor: '#fb7185',
    patternType: 'gradient',
    preferredBaitIds: ['bait_crystal_lure', 'bait_golden_essence', 'bait_astral_nectar'],
    description: 'ปลาพญานาคแห่งท้องทะเล ลำตัวสีเงินยาวพริ้วไหวประดับด้วยครีบหงอนสีชมพูซากุระเรืองรอง'
  },

  // ======================== LEGENDARY (2 Species) ========================
  {
    id: 'fish_17_whaleshark',
    indexNumber: 17,
    nameTh: 'ฉลามวาฬดาราจักร',
    nameEn: 'Nebula Constellation Whale Shark',
    rarity: 'Legendary',
    bodyShape: 'whaleshark',
    habitat: 'มหาสมุทรดาราจักรยามราตรี',
    minWeightKg: 85.0,
    maxWeightKg: 320.0,
    minLengthCm: 280,
    maxLengthCm: 560,
    basePrice: 5400,
    expReward: 1400,
    difficulty: 8.8,
    primaryColor: '#1e1b4b',
    secondaryColor: '#818cf8',
    accentColor: '#f472b6',
    patternType: 'nebula',
    preferredBaitIds: ['bait_golden_essence', 'bait_astral_nectar'],
    description: 'ผู้พิทักษ์แห่งผืนน้ำ ลวดลายจุดสีขาวและเนบิวลาสีม่วงชมพูบนแผ่นหลังเคลื่อนไหวราวกับจักรวาลที่มีชีวิต'
  },
  {
    id: 'fish_18_coelacanth',
    indexNumber: 18,
    nameTh: 'ซีลาแคนท์สุริยะบรรพกาล',
    nameEn: 'Solaris Relic Coelacanth',
    rarity: 'Legendary',
    bodyShape: 'coelacanth',
    habitat: 'วิหารโบราณใต้สมุทร',
    minWeightKg: 35.0,
    maxWeightKg: 110.0,
    minLengthCm: 130,
    maxLengthCm: 230,
    basePrice: 6200,
    expReward: 1650,
    difficulty: 9.1,
    primaryColor: '#78350f',
    secondaryColor: '#f59e0b',
    accentColor: '#fef08a',
    patternType: 'crystal',
    preferredBaitIds: ['bait_golden_essence', 'bait_astral_nectar'],
    description: 'ฟอสซิลมีชีวิตที่สืบทอดมาตั้งแต่ยุคบรรพกาล เกล็ดหนาเปล่งรัศมีทองคำสุริยะที่ไม่เคยเสื่อมสลาย'
  },

  // ======================== SECRET TIER (2 Mythical Species) ========================
  {
    id: 'fish_19_leviathan',
    indexNumber: 19,
    nameTh: 'มังกรสมุทรแอสทรัลแห่งร่องลึก',
    nameEn: 'Astral Aurora Leviathan',
    rarity: 'Secret',
    bodyShape: 'leviathan',
    habitat: 'มิติร่องลึกแสงเหนือ (Secret Realm)',
    minWeightKg: 120.0,
    maxWeightKg: 480.0,
    minLengthCm: 350,
    maxLengthCm: 720,
    basePrice: 16500,
    expReward: 4200,
    difficulty: 9.6,
    primaryColor: '#06b6d4',
    secondaryColor: '#a855f7',
    accentColor: '#fde047',
    patternType: 'nebula',
    preferredBaitIds: ['bait_astral_nectar'],
    description: '[SECRET TIER] มังกรวารีในตำนานที่ปรากฏกายเพียงเสี้ยววินาทีเมื่อแสงดาวสะท้อนผิวน้ำ ครีบโปร่งแสงทอประกายออโรร่า 7 สี'
  },
  {
    id: 'fish_20_chronoskoi',
    indexNumber: 20,
    nameTh: 'ปลาคราฟแก้วข้ามกาลเวลา',
    nameEn: 'Chronos Celestial Glass Koi',
    rarity: 'Secret',
    bodyShape: 'chronoskoi',
    habitat: 'รอยแยกเวลาแห่งท้องทะเล (Secret Realm)',
    minWeightKg: 15.0,
    maxWeightKg: 64.0,
    minLengthCm: 95,
    maxLengthCm: 185,
    basePrice: 22000,
    expReward: 5500,
    difficulty: 9.8,
    primaryColor: '#f43f5e',
    secondaryColor: '#fff1f2',
    accentColor: '#38bdf8',
    patternType: 'crystal',
    preferredBaitIds: ['bait_astral_nectar'],
    description: '[SECRET TIER] ปลาศักดิ์สิทธิ์ลำตัวโปร่งใสดั่งคริสตัลบริสุทธิ์ ภายในลำตัวมีวงแหวนดาราศาสตร์และละอองเวลาสีทองหมุนวนอยู่ตลอดกาล'
  },
  // ======================== SEA CREATURES (non-fish) ========================
  {
    id: 'creature_21_shrimp',
    indexNumber: 21,
    category: 'creature',
    nameTh: 'กุ้งแก้วพงหญ้าทะเล',
    nameEn: 'Glass Reef Shrimp',
    rarity: 'Common',
    bodyShape: 'shrimp',
    habitat: 'พงหญ้าทะเลน้ำตื้น',
    minWeightKg: 0.02,
    maxWeightKg: 0.09,
    minLengthCm: 6,
    maxLengthCm: 14,
    basePrice: 55,
    expReward: 28,
    difficulty: 1.6,
    primaryColor: '#fb923c',
    secondaryColor: '#fed7aa',
    accentColor: '#f43f5e',
    patternType: 'bands',
    preferredBaitIds: ['bait_krill','bait_sandworm'],
    description: 'กุ้งตัวใสเห็นเส้นสีส้มภายในลำตัว ดีดตัวถอยหลังเร็วมากเมื่อตกใจ'
  },
  {
    id: 'creature_22_squid',
    indexNumber: 22,
    category: 'creature',
    nameTh: 'หมึกกล้วยประกายคราม',
    nameEn: 'Indigo Sparkle Squid',
    rarity: 'Uncommon',
    bodyShape: 'squid',
    habitat: 'น้ำลึกระดับกลาง',
    minWeightKg: 0.3,
    maxWeightKg: 1.8,
    minLengthCm: 25,
    maxLengthCm: 60,
    basePrice: 150,
    expReward: 90,
    difficulty: 3.6,
    primaryColor: '#a78bfa',
    secondaryColor: '#ddd6fe',
    accentColor: '#22d3ee',
    patternType: 'spots',
    preferredBaitIds: ['bait_squid'],
    description: 'หมึกผิวเปลี่ยนสีได้ตามจังหวะแสง จุดสีฟ้าบนลำตัวกะพริบเป็นจังหวะเหมือนสัญญาณลับ'
  },
  {
    id: 'creature_23_jellyfish',
    indexNumber: 23,
    category: 'creature',
    nameTh: 'แมงกะพรุนโคมวิญญาณ',
    nameEn: 'Lantern Spirit Jelly',
    rarity: 'Rare',
    bodyShape: 'jellyfish',
    habitat: 'ห้วงน้ำยามพลบค่ำ',
    minWeightKg: 0.5,
    maxWeightKg: 3,
    minLengthCm: 30,
    maxLengthCm: 80,
    basePrice: 900,
    expReward: 400,
    difficulty: 5.4,
    primaryColor: '#f472b6',
    secondaryColor: '#fbcfe8',
    accentColor: '#67e8f9',
    patternType: 'gradient',
    preferredBaitIds: ['bait_squid'],
    description: 'แมงกะพรุนโปร่งแสงที่ส่องประกายเหมือนโคมไฟลอยน้ำ ชาวประมงเล่าว่าแสงของมันนำทางวิญญาณกลับบ้าน'
  },
  {
    id: 'creature_24_seahorse',
    indexNumber: 24,
    category: 'creature',
    nameTh: 'ม้าน้ำมังกรเพลิงสมุทร',
    nameEn: 'Ember Dragon Seahorse',
    rarity: 'Epic',
    bodyShape: 'seahorse',
    habitat: 'ถ้ำปะการังหลับใหล',
    minWeightKg: 0.4,
    maxWeightKg: 2.2,
    minLengthCm: 25,
    maxLengthCm: 70,
    basePrice: 2600,
    expReward: 1200,
    difficulty: 7,
    primaryColor: '#ef4444',
    secondaryColor: '#fca5a5',
    accentColor: '#fbbf24',
    patternType: 'bands',
    preferredBaitIds: ['bait_crystal_lure','bait_golden_essence'],
    description: 'สัตว์ทะเลกึ่งตำนาน ยอดหัวลุกเป็นเปลวเพลิงสีส้มแม้อยู่ใต้น้ำ เชื่อกันว่าเป็นทายาทมังกรทะเล'
  },
  {
    id: 'creature_25_octopus',
    indexNumber: 25,
    category: 'creature',
    nameTh: 'หมึกยักษ์เนบิวลา',
    nameEn: 'Nebula Kraken Octopus',
    rarity: 'Legendary',
    bodyShape: 'octopus',
    habitat: 'หลุมลึกใต้สมุทร',
    minWeightKg: 8,
    maxWeightKg: 60,
    minLengthCm: 120,
    maxLengthCm: 320,
    basePrice: 9000,
    expReward: 3200,
    difficulty: 8.6,
    primaryColor: '#7c3aed',
    secondaryColor: '#c4b5fd',
    accentColor: '#f43f5e',
    patternType: 'nebula',
    preferredBaitIds: ['bait_golden_essence','bait_astral_nectar'],
    description: 'เจ้าแห่งความมืดที่ผิวกายมีกลุ่มดาวหมุนวน แขนทั้งแปดบิดตัวราวกับกาแล็กซี'
  },
  {
    id: 'creature_26_nautilus',
    indexNumber: 26,
    category: 'creature',
    nameTh: 'หอยงวงช้างจักรพรรดิกาล',
    nameEn: 'Chrono Nautilus',
    rarity: 'Secret',
    bodyShape: 'nautilus',
    habitat: 'สุสานเทพเจ้าใต้สมุทร (Secret Realm)',
    minWeightKg: 3,
    maxWeightKg: 20,
    minLengthCm: 60,
    maxLengthCm: 140,
    basePrice: 26000,
    expReward: 6500,
    difficulty: 9.9,
    primaryColor: '#f59e0b',
    secondaryColor: '#fde68a',
    accentColor: '#38bdf8',
    patternType: 'starlight',
    preferredBaitIds: ['bait_astral_nectar'],
    description: '[SECRET TIER] เปลือกก้นหอยทองคำที่หมุนวนตามเข็มเวลา ว่ากันว่าใครเห็นมันจะได้ย้อนเวลากลับไปหนึ่งคืน'
  }
];

/**
 * คันเบ็ดเฉพาะทาง 6 ระดับ (Specialized Fishing Rods)
 */
export const FISHING_RODS_CATALOG: FishingRodItem[] = [
  {
    id: 'rod_bamboo',
    nameTh: 'คันเบ็ดไม้ไผ่ชายฝั่ง',
    nameEn: 'Seaside Bamboo Rod',
    price: 0,
    requiredLevel: 1,
    waitTimeReductionPct: 0,
    sweetSpotSizeBonus: 0,
    lineStrengthBonus: 0,
    rarityBoostMultiplier: 1.0,
    rodColor: '#b45309',
    description: 'คันเบ็ดไม้ไผ่เรียบง่าย เหมาะสำหรับเริ่มต้นนั่งตกปลาริมท่าเรือมรกต'
  },
  {
    id: 'rod_willow',
    nameTh: 'คันเบ็ดไม้โอ๊คสายลมทะเล',
    nameEn: 'Breeze Oakwood Rod',
    price: 1200,
    requiredLevel: 4,
    waitTimeReductionPct: 15,
    sweetSpotSizeBonus: 16,
    lineStrengthBonus: 14,
    rarityBoostMultiplier: 1.35,
    rodColor: '#92400e',
    description: 'คันเบ็ดไม้โอ๊คยืดหยุ่นสูง ลดเวลารอปลาฮุบเหยื่อ 15% และขยายขนาดแถบวัดเบ็ด'
  },
  {
    id: 'rod_coral_carbon',
    nameTh: 'คันเบ็ดคาร์บอนปะการังคราม',
    nameEn: 'Azure Coral Carbon Rod',
    price: 8500,
    requiredLevel: 12,
    waitTimeReductionPct: 28,
    sweetSpotSizeBonus: 28,
    lineStrengthBonus: 26,
    rarityBoostMultiplier: 1.85,
    rodColor: '#0284c7',
    description: 'ผลิตจากคาร์บอนไฟเบอร์น้ำหนักเบา กุญแจสำคัญสู่การปลดล็อคเกาะแนวปะการังเรืองแสง'
  },
  {
    id: 'rod_deep_titanium',
    nameTh: 'คันเบ็ดไทเทเนียมร่องน้ำลึก',
    nameEn: 'Deep-Trench Titanium Rod',
    price: 42000,
    requiredLevel: 25,
    waitTimeReductionPct: 40,
    sweetSpotSizeBonus: 42,
    lineStrengthBonus: 40,
    rarityBoostMultiplier: 2.65,
    rodColor: '#6366f1',
    description: 'คันเบ็ดอัลลอยด์ทนทานสูง กุญแจสำคัญสู่การปลดล็อคเกาะภูเขาไฟหินดำ'
  },
  {
    id: 'rod_starlight',
    nameTh: 'คันเบ็ดผู้ทอแสงดาว',
    nameEn: 'Starlight Weaver Rod',
    price: 145000,
    requiredLevel: 38,
    waitTimeReductionPct: 52,
    sweetSpotSizeBonus: 56,
    lineStrengthBonus: 54,
    rarityBoostMultiplier: 3.85,
    rodColor: '#a855f7',
    description: 'สายเบ็ดทอจากเส้นใยผลึกดาว กุญแจสำคัญสู่การปลดล็อคเกาะธารน้ำแข็งออโรร่า'
  },
  {
    id: 'rod_chronos_abyss',
    nameTh: 'คันเบ็ดโพไซดอนแห่งกาลเวลา',
    nameEn: 'Chronos Sovereign Rod',
    price: 480000,
    requiredLevel: 50,
    waitTimeReductionPct: 68,
    sweetSpotSizeBonus: 75,
    lineStrengthBonus: 72,
    rarityBoostMultiplier: 6.2,
    rodColor: '#f59e0b',
    description: 'ศาสตราวุธระดับเทพเจ้า ปลดล็อคความลับแห่งเกาะสวรรค์ลอยฟ้ากลางมิติ'
  }
];

/**
 * เหยื่อตกปลาเฉพาะทาง 6 ชนิด (Specialized Baits)
 */
export const FISHING_BAITS_CATALOG: FishingBaitItem[] = [
  {
    id: 'bait_sandworm',
    nameTh: 'ไส้เดือนชายหาด (ไม่จำกัด)',
    nameEn: 'Beach Sandworm',
    pricePerPack: 0,
    packQuantity: 999,
    waitTimeReductionPct: 0,
    targetRarities: ['Common', 'Uncommon'],
    targetFishIds: ['fish_01_sardine', 'fish_03_mackerel', 'fish_04_flounder', 'fish_05_bream'],
    bonusWeightMultiplier: 1.0,
    iconColor: '#f97316',
    description: 'เหยื่อพื้นฐานที่มีให้ใช้ตลอดเวลา ดึงดูดปลาชายฝั่งทั่วไปได้ดี'
  },
  {
    id: 'bait_krill',
    nameTh: 'กุ้งฝอยสดปะการัง',
    nameEn: 'Fresh Coral Krill',
    pricePerPack: 120,
    packQuantity: 10,
    waitTimeReductionPct: 10,
    targetRarities: ['Common', 'Uncommon', 'Rare'],
    targetFishIds: ['fish_02_clownfish', 'creature_21_shrimp', 'fish_06_snapper', 'fish_07_parrotfish', 'fish_08_boxfish'],
    bonusWeightMultiplier: 1.8,
    iconColor: '#fb7185',
    description: 'กุ้งฝอยกลิ่นหอมสดใหม่ เพิ่มโอกาสติดปลาแนวปะการังสีสวยและลดเวลารอ 10%'
  },
  {
    id: 'bait_squid',
    nameTh: 'หมึกสายเรืองแสง',
    nameEn: 'Bioluminescent Squid Strip',
    pricePerPack: 360,
    packQuantity: 10,
    waitTimeReductionPct: 20,
    targetRarities: ['Uncommon', 'Rare', 'Epic'],
    targetFishIds: [
      'creature_22_squid',
      'creature_23_jellyfish',
      'fish_09_barracuda',
      'fish_10_tuna',
      'fish_11_lionfish',
      'fish_13_mantaray',
      'fish_15_angler'
    ],
    bonusWeightMultiplier: 2.6,
    iconColor: '#38bdf8',
    description: 'เนื้อหมึกเรืองแสงที่ปลานักล่าน้ำลึกและปลา Rare/Epic ชื่นชอบเป็นพิเศษ'
  },
  {
    id: 'bait_crystal_lure',
    nameTh: 'เหยื่อปลอมผลึกแก้วสมุทร',
    nameEn: 'Prism Minnow Lure',
    pricePerPack: 850,
    packQuantity: 8,
    waitTimeReductionPct: 30,
    targetRarities: ['Rare', 'Epic'],
    targetFishIds: [
      'fish_10_tuna',
      'fish_12_mahimahi',
      'fish_14_swordfish',
      'fish_16_oarfish',
      'creature_24_seahorse'
    ],
    bonusWeightMultiplier: 3.5,
    iconColor: '#22d3ee',
    description: 'เหยื่อสะท้อนแสงปริซึมใต้น้ำ ดึงดูดปลากระโทงดาบผลึกแก้วและปลาออร์ฟิชซากุระโดยตรง!'
  },
  {
    id: 'bait_golden_essence',
    nameTh: 'หัวเชื้ออำพันบรรพกาล',
    nameEn: 'Ancient Golden Essence',
    pricePerPack: 2200,
    packQuantity: 6,
    waitTimeReductionPct: 40,
    targetRarities: ['Epic', 'Legendary'],
    targetFishIds: [
      'fish_14_swordfish',
      'fish_16_oarfish',
      'fish_17_whaleshark',
      'fish_18_coelacanth'
    ],
    bonusWeightMultiplier: 5.0,
    iconColor: '#fbbf24',
    description: 'หัวเชื้อสกัดจากแร่ทองคำใต้สมุทร ดึงดูดฉลามวาฬดาราจักรและซีลาแคนท์สุริยะอย่างทรงพลัง'
  },
  {
    id: 'bait_astral_nectar',
    nameTh: 'น้ำทิพย์ดาราจักร (ล่าปลา Secret)',
    nameEn: 'Astral Leviathan Nectar',
    pricePerPack: 5800,
    packQuantity: 5,
    waitTimeReductionPct: 50,
    targetRarities: ['Epic', 'Legendary', 'Secret'],
    targetFishIds: [
      'fish_15_angler',
      'fish_17_whaleshark',
      'fish_18_coelacanth',
      'fish_19_leviathan',
      'fish_20_chronoskoi'
    ],
    bonusWeightMultiplier: 8.5,
    iconColor: '#f43f5e',
    description: 'เหยื่อศักดิ์สิทธิ์ที่เพิ่มโอกาสพบปลา SECRET TIER ถึง 8.5 เท่า และลดเวลารอลงครึ่งหนึ่ง!'
  }
];

export const OCEAN_MOODS: {
  id: OceanTimeMood;
  nameTh: string;
  bonusText: string;
  skyTop: string;
  skyBottom: string;
  seaTop: string;
  seaBottom: string;
}[] = [
  {
    id: 'morning',
    nameTh: '☀️ เช้าตรู่แดดอ่อน (Morning Breeze)',
    bonusText: 'ปลาชายฝั่งและปลาปะการังชุกชุม (+10% EXP)',
    skyTop: '#38bdf8',
    skyBottom: '#bae6fd',
    seaTop: '#0284c7',
    seaBottom: '#0f172a'
  },
  {
    id: 'sunset',
    nameTh: '🌅 ยามเย็นอาทิตย์อัสดง (Golden Sunset)',
    bonusText: 'ปลาสีทองและปลานักล่าออกหากิน (+20% ราคาขายปลา)',
    skyTop: '#7c2d12',
    skyBottom: '#fb923c',
    seaTop: '#0369a1',
    seaBottom: '#090d16'
  },
  {
    id: 'night_glow',
    nameTh: '🌙 คืนจันทร์เพ็ญเรืองแสง (Bioluminescent Night)',
    bonusText: 'โอกาสพบปลา Rare & Epic เพิ่มขึ้น +35%',
    skyTop: '#090d16',
    skyBottom: '#1e1b4b',
    seaTop: '#0f172a',
    seaBottom: '#020617'
  },
  {
    id: 'astral_storm',
    nameTh: '🌠 คืนฝนดาวตกแอสทรัล (Astral Starfall)',
    bonusText: 'โอกาสพบปลา Legendary & SECRET TIER เพิ่มขึ้น 2.5 เท่า!',
    skyTop: '#1e1b4b',
    skyBottom: '#4c1d95',
    seaTop: '#1e1b4b',
    seaBottom: '#030712'
  }
];

/**
 * อัลกอริทึมคำนวณการสุ่มปลาแบบถ่วงน้ำหนัก (Weighted Rarity & Bait Affinity Algorithm)
 * พร้อมสร้าง Seed ขนาดตัวและสีพิเศษเฉพาะตัว (Procedural Seed Variant)
 */
export function rollFishAndWaitTime(
  rod: FishingRodItem,
  bait: FishingBaitItem,
  mood: OceanTimeMood,
  isFastFocusMode: boolean,
  rollSequence: number,
  islandId?: string
): {
  species: FishSpeciesData;
  waitSeconds: number;
} {
  // 1. Compute dynamic weights for each of the fish species
  const weightedPool: { species: FishSpeciesData; weight: number }[] =
    TWENTY_OCEAN_FISH_SPECIES.map((sp) => {
      const rarityBase = RARITY_CONFIG[sp.rarity].baseChancePct;
      let w = rarityBase;

      // Apply Island Biome affinity multiplier (endemic species appear 3.5x more often on their native island)
      if (islandId) {
        const islandEndemicMap: Record<string, string[]> = {
          island_emerald_haven: ['fish_01_sardine', 'fish_02_clown', 'fish_03_mackerel', 'creature_21_shrimp', 'fish_05_bream'],
          island_coral_sanctuary: ['fish_04_flounder', 'fish_07_parrot', 'fish_08_boxfish', 'creature_22_squid', 'fish_11_lionfish'],
          island_volcanic_atoll: ['fish_09_barracuda', 'fish_10_tuna', 'creature_24_seahorse', 'fish_12_mahimahi', 'fish_14_swordfish'],
          island_aurora_fjord: ['fish_06_snapper', 'creature_23_jellyfish', 'fish_13_mantaray', 'fish_16_oarfish', 'creature_25_octopus'],
          island_celestial_archipelago: ['fish_15_angler', 'fish_17_whaleshark', 'fish_18_coelacanth', 'fish_19_leviathan', 'fish_20_chronoskoi', 'creature_26_nautilus']
        };
        const endemics = islandEndemicMap[islandId] || [];
        if (endemics.includes(sp.id)) {
          w *= 3.2;
        } else {
          w *= 0.55;
        }
      }

      // Apply Rod rarity boost to Rare, Epic, Legendary, Secret
      if (sp.rarity === 'Rare') w *= Math.pow(rod.rarityBoostMultiplier, 0.55);
      if (sp.rarity === 'Epic') w *= Math.pow(rod.rarityBoostMultiplier, 0.85);
      if (sp.rarity === 'Legendary') w *= Math.pow(rod.rarityBoostMultiplier, 1.15);
      if (sp.rarity === 'Secret') w *= Math.pow(rod.rarityBoostMultiplier, 1.45);

      // Apply Specialized Bait affinity multiplier
      if (bait.targetFishIds.includes(sp.id)) {
        w *= bait.bonusWeightMultiplier;
      } else if (bait.targetRarities.includes(sp.rarity)) {
        w *= 1 + (bait.bonusWeightMultiplier - 1) * 0.45;
      }

      // Apply Ocean Time/Weather Mood bonus
      if (mood === 'night_glow' && (sp.rarity === 'Rare' || sp.rarity === 'Epic')) {
        w *= 1.35;
      } else if (
        mood === 'astral_storm' &&
        (sp.rarity === 'Legendary' || sp.rarity === 'Secret')
      ) {
        w *= 2.5;
      }

      return { species: sp, weight: w };
    });

  const totalWeight = weightedPool.reduce((acc, item) => acc + item.weight, 0);
  // Combine high-entropy time + sequence seed
  const hashSeed = Math.abs(Math.sin(Date.now() * 0.0017 + rollSequence * 12.9898) * 43758.5453);
  const rand01 = hashSeed - Math.floor(hashSeed);

  let cursor = rand01 * totalWeight;
  let chosen = weightedPool[0].species;
  for (const item of weightedPool) {
    if (cursor <= item.weight) {
      chosen = item.species;
      break;
    }
    cursor -= item.weight;
  }

  // 2. Calculate Wait Time (1 Minute [60s] to 1 Hour [3600s] in standard Idle mode, reduced by Rod & Bait)
  const rCfg = RARITY_CONFIG[chosen.rarity];
  const seed2 = Math.abs(Math.cos(Date.now() * 0.0023 + rollSequence * 78.233) * 19341.23);
  const ratio = seed2 - Math.floor(seed2);

  // Bias wait time toward accessible end while allowing deep 1-hour waits for high tiers
  const rawWait = rCfg.minWaitSec + Math.pow(ratio, 1.6) * (rCfg.maxWaitSec - rCfg.minWaitSec);
  const totalReduction = Math.min(
    0.78,
    (rod.waitTimeReductionPct + bait.waitTimeReductionPct) / 100
  );

  let finalWaitSec = Math.max(45, Math.round(rawWait * (1 - totalReduction)));

  // If player enabled "โหมดเร่งเวลาตก (Fast Focus Mode)" for active testing/playing: 5s - 16s
  if (isFastFocusMode) {
    finalWaitSec = Math.max(4, Math.min(16, Math.round(5 + chosen.difficulty * 1.1 * (1 - totalReduction * 0.5))));
  }

  return {
    species: chosen,
    waitSeconds: finalWaitSec
  };
}

/**
 * สร้างข้อมูลปลาที่ตกได้พร้อม Seed ขนาดตัว (Tiny -> Crown Giant) และ Seed สีพิเศษ
 */
export function createCaughtFishInstance(
  species: FishSpeciesData,
  mood: OceanTimeMood,
  catchSeq: number
): CaughtFishInstance {
  const rawSeed = Math.floor(Math.abs(Math.sin(Date.now() + catchSeq * 97.13) * 1000000));
  const sizeRoll = (rawSeed % 1000) / 1000;
  const colorRoll = ((rawSeed >> 3) % 1000) / 1000;

  const weightKg = Number(
    (species.minWeightKg + sizeRoll * (species.maxWeightKg - species.minWeightKg)).toFixed(2)
  );
  const lengthCm = Number(
    (species.minLengthCm + sizeRoll * (species.maxLengthCm - species.minLengthCm)).toFixed(1)
  );

  let sizeTier: CaughtFishInstance['sizeTier'] = 'Normal';
  let sizeMultiplier = 1.0;
  if (sizeRoll >= 0.9) {
    sizeTier = 'CrownGiant';
    sizeMultiplier = 1.85;
  } else if (sizeRoll >= 0.7) {
    sizeTier = 'Large';
    sizeMultiplier = 1.35;
  } else if (sizeRoll <= 0.15) {
    sizeTier = 'Tiny';
    sizeMultiplier = 0.85;
  }

  // Color Seed Variation (Hue Shift & Special Morphs)
  let hueShiftDeg = Math.round((colorRoll - 0.5) * 36); // Subtle natural variation (-18 to +18 deg)
  let variantTitle = 'สีธรรมชาติ (Natural)';
  let variantMultiplier = 1.0;

  if (colorRoll >= 0.96) {
    hueShiftDeg = 145;
    variantTitle = '✨ ประกายดาราจักร (Starlight Morph)';
    variantMultiplier = 2.5;
  } else if (colorRoll >= 0.88) {
    hueShiftDeg = 48;
    variantTitle = '🌟 เกล็ดทองคำ (Golden Morph)';
    variantMultiplier = 1.75;
  } else if (colorRoll >= 0.78) {
    hueShiftDeg = -55;
    variantTitle = '💎 ครามอัญมณี (Sapphire Tint)';
    variantMultiplier = 1.35;
  }

  const moodPriceBonus = mood === 'sunset' ? 1.2 : 1.0;
  const sellPrice = Math.round(
    species.basePrice * (0.7 + sizeRoll * 0.6) * sizeMultiplier * variantMultiplier * moodPriceBonus
  );

  return {
    uid: `catch_${Date.now()}_${rawSeed}`,
    speciesId: species.id,
    caughtAt: new Date().toISOString(),
    weightKg,
    lengthCm,
    sizeTier,
    colorSeed: rawSeed,
    hueShiftDeg,
    variantTitle,
    sellPrice
  };
}
