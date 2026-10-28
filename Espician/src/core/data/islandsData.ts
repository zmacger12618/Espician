/**
 * Multi-Island Progression System for Espician Fishing
 * Defines the 5 distinct island biomes, unlock progression requirements,
 * visual atmosphere palettes, weather systems, and endemic fish pools.
 */

export interface IslandBiome {
  id: string;
  nameTh: string;
  nameEn: string;
  subtitleTh: string;
  subtitleEn: string;
  descriptionTh: string;
  descriptionEn: string;
  order: number;
  requiredLevel: number;
  requiredCoins: number;
  requiredRodId: string;
  skyGradient: [string, string, string];
  seaGradient: [string, string, string];
  ambientType: 'sunny_tropical' | 'bioluminescent_reef' | 'volcanic_embers' | 'aurora_snow' | 'celestial_void';
  pierStyle: 'rustic_wood' | 'coral_plank' | 'obsidian_stone' | 'frosted_timber' | 'astral_crystal';
  accentGlow: string;
  weatherChoices: Array<{ id: string; nameTh: string; nameEn: string }>;
  endemicFishIds: string[];
}

export const ALL_ISLANDS: IslandBiome[] = [
  {
    id: 'island_emerald_haven',
    nameTh: 'เกาะท่าเรือมรกต',
    nameEn: 'Emerald Haven Pier',
    subtitleTh: 'ท่าเรือน้ำใส ชายฝั่งลมสงบ',
    subtitleEn: 'Calm Tropical Coastal Pier',
    descriptionTh: 'ท่าเรือไม้โบราณน้ำใสราวกระจก ลมทะเลพัดเอื่อยๆ เหมาะสำหรับการฝึกเริ่มต้นและพบปลาชายฝั่งทั่วไป',
    descriptionEn: 'Crystal-clear peaceful wooden pier with gentle tropical breezes. The perfect starter haven.',
    order: 1,
    requiredLevel: 1,
    requiredCoins: 0,
    requiredRodId: 'rod_bamboo',
    skyGradient: ['#38bdf8', '#7dd3fc', '#bae6fd'],
    seaGradient: ['#0284c7', '#0369a1', '#075985'],
    ambientType: 'sunny_tropical',
    pierStyle: 'rustic_wood',
    accentGlow: '#38bdf8',
    weatherChoices: [
      { id: 'sunny', nameTh: 'แดดสดใส', nameEn: 'Sunny' },
      { id: 'morning_mist', nameTh: 'หมอกยามเช้า', nameEn: 'Morning Mist' },
      { id: 'golden_sunset', nameTh: 'อาทิตย์อัสดง', nameEn: 'Golden Sunset' }
    ],
    endemicFishIds: [
      'fish_01_sardine',
      'fish_02_clown',
      'fish_03_mackerel',
      'creature_21_shrimp',
      'fish_05_bream'
    ]
  },
  {
    id: 'island_coral_sanctuary',
    nameTh: 'เกาะแนวปะการังเรืองแสง',
    nameEn: 'Coral Sanctuary Lagoon',
    subtitleTh: 'ลากูนปะการังเรืองแสงนีออน',
    subtitleEn: 'Luminous Neon Coral Reefs',
    descriptionTh: 'ลากูนน้ำตื้นเขตร้อนที่เต็มไปด้วยแนวปะการังเปล่งประกายสีนีออนและสิ่งมีชีวิตสีสันสดใส',
    descriptionEn: 'Luminous turquoise lagoon teeming with glowing neon coral formations and exotic fauna.',
    order: 2,
    requiredLevel: 12,
    requiredCoins: 6500,
    requiredRodId: 'rod_coral_carbon',
    skyGradient: ['#06b6d4', '#22d3ee', '#a5f3fc'],
    seaGradient: ['#0d9488', '#0f766e', '#115e59'],
    ambientType: 'bioluminescent_reef',
    pierStyle: 'coral_plank',
    accentGlow: '#2dd4bf',
    weatherChoices: [
      { id: 'turquoise_breeze', nameTh: 'ลมทะเลมรกต', nameEn: 'Turquoise Breeze' },
      { id: 'bioluminescent_night', nameTh: 'ราตรีเรืองแสง', nameEn: 'Bioluminescent Glow' }
    ],
    endemicFishIds: [
      'fish_04_flounder',
      'fish_07_parrot',
      'fish_08_boxfish',
      'creature_22_squid',
      'fish_11_lionfish'
    ]
  },
  {
    id: 'island_volcanic_atoll',
    nameTh: 'เกาะภูเขาไฟหินดำ',
    nameEn: 'Volcanic Ash Atoll',
    subtitleTh: 'หินบะซอลต์ธารลาวาใต้สมุทร',
    subtitleEn: 'Obsidian Basalt & Simmering Waters',
    descriptionTh: 'ร่องหินบะซอลต์สีดำทมิฬล้อมรอบธารแมกมาใต้สมุทร ลมทะเลพัดพาละอองไฟระยิบระยับและปลาเพลิงดุร้าย',
    descriptionEn: 'Obsidian basalt cliffs jutting from simmering volcanic waters with glowing embers and fierce predators.',
    order: 3,
    requiredLevel: 25,
    requiredCoins: 28000,
    requiredRodId: 'rod_deep_titanium',
    skyGradient: ['#450a0a', '#7f1d1d', '#991b1b'],
    seaGradient: ['#18181b', '#27272a', '#3f3f46'],
    ambientType: 'volcanic_embers',
    pierStyle: 'obsidian_stone',
    accentGlow: '#ef4444',
    weatherChoices: [
      { id: 'ash_ember_storm', nameTh: 'พายุละอองไฟ', nameEn: 'Ash & Embers' },
      { id: 'crimson_twilight', nameTh: 'สนธยาสีเลือด', nameEn: 'Crimson Twilight' }
    ],
    endemicFishIds: [
      'fish_09_barracuda',
      'fish_10_tuna',
      'creature_24_seahorse',
      'fish_12_mahimahi',
      'fish_14_swordfish'
    ]
  },
  {
    id: 'island_aurora_fjord',
    nameTh: 'เกาะธารน้ำแข็งออโรร่า',
    nameEn: 'Aurora Glacial Fjord',
    subtitleTh: 'ฟยอร์ดน้ำแข็ง ระบำแสงเหนือ',
    subtitleEn: 'Glacial Ice & Dancing Northern Lights',
    descriptionTh: 'อ่าวธารน้ำแข็งอันสงบเงียบ แสงเหนือออโรร่าสีเขียวมรกตและม่วงครามเต้นระบำบนท้องฟ้ายามค่ำ ชุมนุมปลาโบราณหายาก',
    descriptionEn: 'Crystal-clear arctic fjord under shimmering green and purple dancing celestial aurora with relic species.',
    order: 4,
    requiredLevel: 38,
    requiredCoins: 95000,
    requiredRodId: 'rod_starlight',
    skyGradient: ['#020617', '#0f172a', '#1e1b4b'],
    seaGradient: ['#0c4a6e', '#0369a1', '#0284c7'],
    ambientType: 'aurora_snow',
    pierStyle: 'frosted_timber',
    accentGlow: '#c084fc',
    weatherChoices: [
      { id: 'aurora_borealis', nameTh: 'แสงเหนือเต้นระบำ', nameEn: 'Dancing Aurora' },
      { id: 'gentle_blizzard', nameTh: 'เกล็ดหิมะโปรย', nameEn: 'Gentle Snowfall' }
    ],
    endemicFishIds: [
      'fish_06_snapper',
      'creature_23_jellyfish',
      'fish_13_mantaray',
      'fish_16_oarfish',
      'creature_25_octopus'
    ]
  },
  {
    id: 'island_celestial_archipelago',
    nameTh: 'เกาะสวรรค์ลอยฟ้ากลางมิติ',
    nameEn: 'Celestial Void Archipelago',
    subtitleTh: 'เกาะลอยฟ้าห้วงอวกาศ ธารดาราจักร',
    subtitleEn: 'Floating Astral Isles & Cosmic Seas',
    descriptionTh: 'เกาะลอยฟ้าศักดิ์สิทธิ์ที่ล่องลอยอยู่เหนือมิติ ท้องฟ้าเป็นห้วงอวกาศและสายน้ำคือธารดวงดาว ถิ่นอาศัยของปลาลับระดับคอสมิก',
    descriptionEn: 'Sacred floating isles above a cosmic void where the sea flows with stardust, home to cosmic secret leviathans.',
    order: 5,
    requiredLevel: 50,
    requiredCoins: 320000,
    requiredRodId: 'rod_chronos_abyss',
    skyGradient: ['#18062b', '#2e1065', '#4c1d95'],
    seaGradient: ['#311042', '#1a0526', '#09010f'],
    ambientType: 'celestial_void',
    pierStyle: 'astral_crystal',
    accentGlow: '#f59e0b',
    weatherChoices: [
      { id: 'starlight_cascade', nameTh: 'ฝนดาวตกดาราจักร', nameEn: 'Starlight Cascade' },
      { id: 'void_nebula', nameTh: 'ม่านเนบิวลาห้วงลึก', nameEn: 'Void Nebula Rift' }
    ],
    endemicFishIds: [
      'fish_15_angler',
      'fish_17_whaleshark',
      'fish_18_coelacanth',
      'fish_19_leviathan',
      'fish_20_chronoskoi',
      'creature_26_nautilus'
    ]
  }
];

export function getIslandById(id: string): IslandBiome {
  return ALL_ISLANDS.find((i) => i.id === id) || ALL_ISLANDS[0];
}

export function isIslandUnlocked(
  island: IslandBiome,
  playerLevel: number,
  playerCoins: number,
  ownedRodIds: string[]
): {
  unlocked: boolean;
  missingLevel?: number;
  missingCoins?: number;
  missingRodId?: string;
} {
  if (playerLevel < island.requiredLevel) {
    return { unlocked: false, missingLevel: island.requiredLevel };
  }
  if (playerCoins < island.requiredCoins) {
    return { unlocked: false, missingCoins: island.requiredCoins };
  }
  if (!ownedRodIds.includes(island.requiredRodId)) {
    return { unlocked: false, missingRodId: island.requiredRodId };
  }
  return { unlocked: true };
}
