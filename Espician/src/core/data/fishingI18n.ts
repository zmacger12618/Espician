import { FishingRodItem, FishSpeciesData, FishingBaitItem, OceanTimeMood } from './fishingDatabase';
import { CostumeItem, QuestDef } from './fishingMeta';

export type GameLang = 'th' | 'en';

const LANG_KEY = 'espician_lang_v1';

export function getSavedLang(): GameLang {
  try {
    const v = localStorage.getItem(LANG_KEY);
    if (v === 'en' || v === 'th') return v;
  } catch {
    /* ignore */
  }
  return 'th';
}

export function saveLang(lang: GameLang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* ignore */
  }
}

export const COSTUME_EN: Record<string, { nameEn: string; descEn: string }> = {
  costume_brown: {
    nameEn: 'Cozy Caramel Ribbon Dress',
    descEn: 'A warm cottagecore brown anime dress with cream ribbons, comfortable for all-day seaside fishing.'
  },
  costume_cream: {
    nameEn: 'Sunlit Cream Sundress & Hat',
    descEn: 'A soft cream summer sundress paired with a wide-brim straw hat and coral ribbon.'
  },
  costume_crimson: {
    nameEn: 'Riot Crimson Noir Dress',
    descEn: 'Sleek charcoal-black gothic idol dress accented with glowing crimson trims and headband.'
  },
  costume_sailor: {
    nameEn: 'Seaside Academy Sailor Uniform',
    descEn: 'Classic Japanese JK navy sailor uniform with crisp white collar and scarlet ribbon.'
  },
  costume_yukata: {
    nameEn: 'Sakura Twilight Yukata',
    descEn: 'Traditional Japanese festival yukata in blossom pink with a golden obi sash.'
  },
  costume_starlight: {
    nameEn: 'Celestial Starlight Gown',
    descEn: 'Astral indigo magical gown adorned with a floating crown of shimmering stars.'
  }
};

export const QUEST_EN: Record<string, string> = {
  d_cast5: 'Cast line 5 times',
  d_catch3: 'Catch 3 sea creatures',
  d_catch8: 'Catch 8 sea creatures',
  d_unc2: 'Catch 2 Uncommon+ creatures',
  d_rare1: 'Catch 1 Rare+ creature',
  d_creature2: 'Catch 2 special sea creatures (shrimp/squid/etc.)',
  d_jerk10: 'Jerk the fishing line 10 times',
  d_earn500: 'Earn 500 coins from selling catches',
  d_aqua1: 'Place 1 catch into the Aquarium',
  d_new1: 'Discover 1 new species',
  m_01: 'First Cast',
  m_02: 'Catch 5 sea creatures in total',
  m_03: 'Catch 25 sea creatures in total',
  m_04: 'Discover 5 species',
  m_05: 'Catch 10 Uncommon+ creatures',
  m_06: 'Reach Angler Level 5',
  m_07: 'Catch 5 special sea creatures',
  m_08: 'Catch 10 Rare+ creatures',
  m_09: 'Earn 20,000 coins in total',
  m_10: 'Discover 15 species',
  m_11: 'Catch 3 Epic+ creatures',
  m_12: 'Complete all 26 species in Encyclopedia'
};

export const ROD_DESC_EN: Record<string, string> = {
  rod_bamboo: 'Polished seaside bamboo rod, ideal for relaxing fishing along the wooden pier.',
  rod_willow: 'Flexible breeze oakwood rod that shortens wait time and widens the catch sweet-spot.',
  rod_coral_carbon: 'Lightweight azure carbon rod that attracts Rare and Epic ocean species.',
  rod_deep_titanium: 'Pro-grade deep-trench titanium rod built to battle giant tunas and Legendary beasts.',
  rod_starlight: 'Woven with starlight fibers, drastically cutting wait time and luring Legendary catches.',
  rod_chronos_abyss: 'Mythical sovereign rod that unlocks maximum affinity for SECRET TIER abyssal creatures.'
};

export const BAIT_DESC_EN: Record<string, string> = {
  bait_sandworm: 'Unlimited free coastal bait that reliably attracts common seaside fish.',
  bait_krill: 'Fresh coral krill with a sweet scent that draws colorful reef dwellers and reduces wait time.',
  bait_squid: 'Glowing squid strips favored by deep-water predators and Rare/Epic species.',
  bait_crystal_lure: 'Prism minnow lure that refracts underwater light, attracting Crystal Swordfish & Sakura Oarfish.',
  bait_golden_essence: 'Ancient amber essence that strongly draws Nebula Whale Sharks & Solaris Coelacanths.',
  bait_astral_nectar: 'Sacred astral nectar boosting SECRET TIER encounter rates by 8.5x and halving wait times!'
};

export const MOOD_EN: Record<OceanTimeMood, { nameEn: string; bonusEn: string }> = {
  morning: { nameEn: '☀️ Morning Breeze', bonusEn: 'Coastal & reef fish abound (+10% EXP)' },
  sunset: { nameEn: '🌅 Golden Sunset', bonusEn: 'Golden & predator fish active (+20% Sell Value)' },
  night_glow: { nameEn: '🌙 Bioluminescent Night', bonusEn: 'Rare & Epic encounter rate +35%' },
  astral_storm: { nameEn: '🌠 Astral Starfall', bonusEn: 'Legendary & SECRET TIER rate 2.5x!' }
};

export const FISH_EN_INFO: Record<string, { habitatEn: string; descEn: string }> = {
  fish_01_sardine: { habitatEn: 'Coastal Surface', descEn: 'Agile schooling fish whose silver scales shimmer like floating leaves in the morning sun.' },
  fish_02_clownfish: { habitatEn: 'Shallow Coral Reef', descEn: 'Bright orange reef dweller with crisp white bands living among sea anemones.' },
  fish_03_mackerel: { habitatEn: 'Warm Coastal Current', descEn: 'Sleek surface swimmer with azure wave markings along its back.' },
  fish_04_flounder: { habitatEn: 'Sandy Pier Floor', descEn: 'Flatfish that camouflages beneath golden sand with amber spots.' },
  fish_05_bream: { habitatEn: 'Rocky Shore', descEn: 'Sturdy silver-striped sea bream often seen swimming around pier pillars.' },
  fish_06_snapper: { habitatEn: 'Deep Rocky Reef', descEn: 'Ruby-red snapper with a fierce bite and impressive pulling power.' },
  fish_07_parrotfish: { habitatEn: 'Glowing Coral Garden', descEn: 'Emerald-and-cyan parrotfish that weaves a protective bubble cocoon at night.' },
  fish_08_boxfish: { habitatEn: 'Calm Coral Bay', descEn: 'Adorable cube-shaped fish decorated with starlight spots.' },
  fish_09_barracuda: { habitatEn: 'Rushing Channel', descEn: 'Slender silver predator that strikes like an arrow at dusk.' },
  fish_10_tuna: { habitatEn: 'Open Deep Sea', descEn: 'King of ocean swimmers with royal blue-and-gold fins and immense stamina.' },
  fish_11_lionfish: { habitatEn: 'Undersea Coral Cave', descEn: 'Graceful lionfish with flowing crescent plumes like lunar silk.' },
  fish_12_mahimahi: { habitatEn: 'Tropical Surface', descEn: 'Radiant golden mahi-mahi with glowing turquoise fins that leaps above the waves.' },
  fish_13_mantaray: { habitatEn: 'Night Breeze Trench', descEn: 'Velvet-indigo manta ray gliding through night waters with starry trails.' },
  fish_14_swordfish: { habitatEn: 'Crystal Whirlpool', descEn: 'Ocean knight bearing a quartz-crystal sword bill capable of cleaving giant waves.' },
  fish_15_angler: { habitatEn: 'Bioluminescent Abyss', descEn: 'Mysterious deep-sea angler carrying a glowing cyan jewel lantern on its brow.' },
  fish_16_oarfish: { habitatEn: 'Sacred Current Seam', descEn: 'Serpentine silver oarfish crowned with glowing sakura-pink ribbon crests.' },
  fish_17_whaleshark: { habitatEn: 'Starry Night Ocean', descEn: 'Gentle guardian of the sea whose back carries a living purple-pink nebula.' },
  fish_18_coelacanth: { habitatEn: 'Submerged Ancient Temple', descEn: 'Living fossil armored in golden solar scales from a forgotten era.' },
  fish_19_leviathan: { habitatEn: 'Secret Aurora Trench', descEn: '[SECRET TIER] Mythical water dragon whose translucent fins shimmer with 7-color aurora light.' },
  fish_20_chronoskoi: { habitatEn: 'Ocean Time Rift', descEn: '[SECRET TIER] Sacred crystalline koi housing spinning astrolabe rings of golden time.' },
  creature_21_shrimp: { habitatEn: 'Seagrass Meadow', descEn: 'Translucent glass shrimp with glowing orange veins that darts backward when startled.' },
  creature_22_squid: { habitatEn: 'Mid-Depth Waters', descEn: 'Color-shifting indigo squid whose cyan spots pulse like secret signals.' },
  creature_23_jellyfish: { habitatEn: 'Twilight Waters', descEn: 'Translucent spirit jellyfish glowing like a floating paper lantern.' },
  creature_24_seahorse: { habitatEn: 'Slumbering Coral Cavern', descEn: 'Semi-mythical seahorse crowned with underwater crimson dragon flames.' },
  creature_25_octopus: { habitatEn: 'Abyssal Crater', descEn: 'Sovereign of the deep whose eight arms swirl like a living galaxy.' },
  creature_26_nautilus: { habitatEn: 'Sunken Shrine of Time', descEn: '[SECRET TIER] Golden spiral shell that turns with the hands of time.' }
};

export function fishName(sp: FishSpeciesData, lang: GameLang) {
  return lang === 'en' ? sp.nameEn : sp.nameTh;
}

export function fishDesc(sp: FishSpeciesData, lang: GameLang) {
  return lang === 'en' ? FISH_EN_INFO[sp.id]?.descEn || sp.description : sp.description;
}

export function fishHabitat(sp: FishSpeciesData, lang: GameLang) {
  return lang === 'en' ? FISH_EN_INFO[sp.id]?.habitatEn || sp.habitat : sp.habitat;
}

export function rodName(r: FishingRodItem, lang: GameLang) {
  return lang === 'en' ? r.nameEn : r.nameTh;
}

export function rodDesc(r: FishingRodItem, lang: GameLang) {
  return lang === 'en' ? ROD_DESC_EN[r.id] || r.description : r.description;
}

export function baitName(b: FishingBaitItem, lang: GameLang, short = true) {
  if (lang === 'en') return b.nameEn;
  return short ? b.nameTh.replace(/\s*\(.*\)\s*/, '').trim() : b.nameTh;
}

export function baitDesc(b: FishingBaitItem, lang: GameLang) {
  return lang === 'en' ? BAIT_DESC_EN[b.id] || b.description : b.description;
}

export function costumeName(c: CostumeItem, lang: GameLang) {
  return lang === 'en' ? COSTUME_EN[c.id]?.nameEn || c.nameTh : c.nameTh;
}

export function costumeDesc(c: CostumeItem, lang: GameLang) {
  return lang === 'en' ? COSTUME_EN[c.id]?.descEn || c.description : c.description;
}

export function questLabel(q: QuestDef, lang: GameLang) {
  return lang === 'en' ? QUEST_EN[q.id] || q.labelTh : q.labelTh;
}

export function variantLabel(v: string, lang: GameLang) {
  if (lang === 'th') return v;
  if (v.includes('Starlight')) return '✨ Starlight Morph';
  if (v.includes('Golden')) return '🌟 Golden Morph';
  if (v.includes('Sapphire')) return '💎 Sapphire Tint';
  return 'Natural Color';
}

export const rodWaitTextI18n = (r: FishingRodItem, lang: GameLang) => {
  if (lang === 'en') {
    return r.waitTimeReductionPct <= 0
      ? 'Fish bite at the natural rhythm of the sea (~60s)'
      : r.waitTimeReductionPct <= 3
      ? 'Subtly sharpens bite responsiveness (~58s)'
      : r.waitTimeReductionPct <= 6
      ? 'Subtly reduces wait time (~56s)'
      : r.waitTimeReductionPct <= 8
      ? 'Great bite responsiveness (~55s)'
      : 'Maximum bite responsiveness (~54s)';
  }
  return r.waitTimeReductionPct <= 0
    ? 'ปลากินเบ็ดตามจังหวะปกติของท้องทะเล (รอบละ 1 นาที)'
    : r.waitTimeReductionPct <= 3
    ? 'ช่วยเร่งจังหวะเบ็ดเร็วขึ้นเล็กน้อยอย่างกลมกลืน (~58 วิ)'
    : r.waitTimeReductionPct <= 6
    ? 'ช่วยลดเวลาเฝ้ารอลงอย่างเหมาะสม (~56 วิ)'
    : r.waitTimeReductionPct <= 8
    ? 'ตอบสนองต่อการกินเบ็ดได้อย่างดีเยี่ยม (~55 วิ)'
    : 'เสริมการตอบสนองของสายเบ็ดระดับสูงสุด (~54 วิ)';
};

export const rodControlTextI18n = (r: FishingRodItem, lang: GameLang) => {
  if (lang === 'en') {
    return r.sweetSpotSizeBonus <= 0
      ? 'Standard catch bar width — requires focus'
      : r.sweetSpotSizeBonus < 30
      ? 'Slightly wider catch bar for easier control'
      : r.sweetSpotSizeBonus < 50
      ? 'Wide catch bar and high line durability'
      : 'Extra-wide catch bar — fish rarely slip away';
  }
  return r.sweetSpotSizeBonus <= 0
    ? 'แถบจับปลามีขนาดมาตรฐาน ต้องใช้สมาธิ'
    : r.sweetSpotSizeBonus < 30
    ? 'แถบจับปลากว้างขึ้นเล็กน้อย คุมปลาง่ายขึ้น'
    : r.sweetSpotSizeBonus < 50
    ? 'แถบจับปลากว้าง สายเบ็ดทนทานต่อแรงดึง'
    : 'แถบจับปลากว้างมาก สายเบ็ดแทบไม่หลุดมือ';
};

export const FISHING_UI = {
  th: {
    home: 'หน้าหลัก',
    castLine: 'เหวี่ยงเบ็ด',
    jerkRod: 'กระตุกเบ็ด',
    pullHook: 'ดึง!',
    holdToReel: '🎣 กดค้างเพื่อดึง',
    sell: 'ขาย',
    sellAll: 'ขายทั้งหมด',
    aquarium: 'ตู้ปลา',
    keep: 'เก็บ',
    equipped: 'กำลังใช้งาน',
    useRod: 'ใช้คันนี้',
    needLevel: 'ต้องการเลเวล',
    buy: 'ซื้อ',
    unlimited: 'ใช้ได้ไม่จำกัด',
    inStock: 'ในคลัง',
    perPack: 'แพ็กละ',
    usingBait: 'กำลังใช้',
    useBait: 'ใช้เหยื่อนี้',
    wearing: 'กำลังสวมใส่',
    wear: 'สวมใส่',
    claim: 'รับ',
    owned: 'เป็นเจ้าของ',
    wornNow: 'สวมอยู่',
    perMin: '/ นาที',
    daily: 'รายวัน (Daily)',
    main: 'ภารกิจหลัก (Main)',
    specialTag: 'พิเศษ',
    fastMode: 'โหมดเร่งเวลา',
    autoReel: 'ดึงเบ็ดอัตโนมัติ',
    engineLabel: 'เอนจิ้น',
    rod: 'คันเบ็ด',
    bait: 'เหยื่อตกปลา',
    costume: 'คอสตูม',
    settingsTitle: 'ตั้งค่าเสียง & ภาษา',
    language: 'ภาษา (Language)',
    muteAll: 'ปิดเสียงทั้งหมด',
    masterVolume: 'ระดับเสียงหลัก (Master)',
    bgmVolume: 'เสียงเพลงประกอบ & คลื่นทะเล (BGM)',
    sfxVolume: 'เสียงเอฟเฟกต์ (SFX)',
    close: 'ตกลง',
    claimReward: 'รับรางวัล',
    levelUp: 'เลเวลอัป!',
    outOfBaitSwitch: 'เหยื่อหมด · สลับเป็นเหยื่อฟรี',
    lastBait: 'เหยื่อชิ้นสุดท้ายแล้ว',
    fishBiting: 'ปลากินเบ็ด!',
    jerkedToast: 'กระตุกเบ็ด',
    fishEscaped: 'ปลาหลุดไปแล้ว',
    gotAway: 'หลุดมือไปแล้ว',
    newDiscovery: 'ค้นพบใหม่',
    soldAllToast: 'ขายสำเร็จ',
    addedAquarium: 'เพิ่มเข้าตู้ปลา',
    removedAquarium: 'นำออกจากตู้ปลา',
    equippedToast: 'ถือ',
    notEnoughCoins: 'เหรียญไม่พอ',
    boughtToast: 'ซื้อ',
    noBaitOwned: 'ยังไม่มีเหยื่อนี้',
    woreToast: 'สวม',
    portalPlay: 'เข้าเล่น',
    portalLogout: 'ออกจากระบบ',
    arrivingAtPier: 'กำลังเดินมาที่ท่าเรือ... (แตะเพื่อข้าม)',
    replayEntrance: 'เดินมานั่งใหม่',
    managerSubtitle: 'จำลองการคุมทีมอีสปอร์ต MOBA 5v5 & แท็กติกสโมสร',
    fishingSubtitle: 'เกมตกปลาทะเล 2D อนิเมะสไตล์ Granblue Classic Chibi & สัตว์ทะเล 26 ชนิด'
  },
  en: {
    home: 'Home',
    castLine: 'CAST LINE',
    jerkRod: 'JERK LINE',
    pullHook: 'PULL!',
    holdToReel: '🎣 HOLD TO REEL',
    sell: 'Sell',
    sellAll: 'Sell All',
    aquarium: 'Aquarium',
    keep: 'Keep',
    equipped: 'Equipped',
    useRod: 'Equip Rod',
    needLevel: 'Requires Lv.',
    buy: 'Buy',
    unlimited: 'Unlimited free use',
    inStock: 'In stock',
    perPack: 'Pack of',
    usingBait: 'Equipped',
    useBait: 'Use Bait',
    wearing: 'Wearing',
    wear: 'Equip Costume',
    claim: 'Claim',
    owned: 'Owned',
    wornNow: 'Wearing',
    perMin: '/ min',
    daily: 'Daily Quests',
    main: 'Main Quests',
    specialTag: 'SPECIAL',
    fastMode: 'Fast Mode',
    autoReel: 'Auto Reel',
    engineLabel: 'ENGINE',
    rod: 'Fishing Rod',
    bait: 'Fishing Bait',
    costume: 'Costume',
    settingsTitle: 'Audio & Language Settings',
    language: 'Language',
    muteAll: 'Mute Audio',
    masterVolume: 'Master Volume',
    bgmVolume: 'Ocean & BGM Volume',
    sfxVolume: 'Sound Effects (SFX)',
    close: 'Done',
    claimReward: 'Claimed',
    levelUp: 'Level Up!',
    outOfBaitSwitch: 'Out of bait · Switched to free bait',
    lastBait: 'Used last bait in stock',
    fishBiting: 'Fish on the hook!',
    jerkedToast: 'Jerked line',
    fishEscaped: 'The fish got away!',
    gotAway: 'Slipped off the hook!',
    newDiscovery: 'New Discovery',
    soldAllToast: 'Sold catches',
    addedAquarium: 'Added to Aquarium',
    removedAquarium: 'Removed from Aquarium',
    equippedToast: 'Equipped',
    notEnoughCoins: 'Not enough coins',
    boughtToast: 'Purchased',
    noBaitOwned: 'No bait left in stock',
    woreToast: 'Wearing',
    portalPlay: 'PLAY NOW',
    portalLogout: 'Log Out',
    arrivingAtPier: 'Walking to the pier... (Tap to skip)',
    replayEntrance: 'Replay Walk',
    managerSubtitle: '5v5 MOBA Esports Simulator & Club Tactics',
    fishingSubtitle: '2D Granblue Classic Chibi Ocean Angler & 26 Sea Species'
  }
} as const;

export const rodLuckTextI18n = (r: FishingRodItem, lang: GameLang) => {
  if (lang === 'en') {
    return r.rarityBoostMultiplier <= 1
      ? 'Best suited for common coastal species'
      : r.rarityBoostMultiplier < 2
      ? 'Draws uncommon and rare species closer'
      : r.rarityBoostMultiplier < 4
      ? 'Epic and Legendary creatures take notice'
      : 'Opens the gate to SECRET TIER abyssal creatures';
  }
  return r.rarityBoostMultiplier <= 1
    ? 'เหมาะกับปลาและสัตว์ทะเลทั่วไปตามชายฝั่ง'
    : r.rarityBoostMultiplier < 2
    ? 'ดึงดูดปลาหายากให้เข้ามาใกล้ขึ้น'
    : r.rarityBoostMultiplier < 4
    ? 'ปลาระดับ Epic และ Legendary เริ่มสนใจเหยื่อของคุณ'
    : 'เปิดประตูสู่ปลาและสัตว์ทะเลระดับ Secret';
};
