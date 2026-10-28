const fs = require('fs');

const dbText = fs.readFileSync('src/core/data/fishingDatabase.ts', 'utf8');

const RARITY_CONFIG = {
  Common: { baseChancePct: 48.0 },
  Uncommon: { baseChancePct: 26.0 },
  Rare: { baseChancePct: 15.0 },
  Epic: { baseChancePct: 7.5 },
  Legendary: { baseChancePct: 2.8 },
  Secret: { baseChancePct: 0.7 }
};

const RODS = [
  { id: 'rod_bamboo', price: 0, requiredLevel: 1, baseAttractionBonusPct: 0, rarityBoostMultiplier: 1.0 },
  { id: 'rod_willow', price: 2500, requiredLevel: 5, baseAttractionBonusPct: 2, rarityBoostMultiplier: 1.35 },
  { id: 'rod_coral_carbon', price: 18000, requiredLevel: 15, baseAttractionBonusPct: 5, rarityBoostMultiplier: 1.85 },
  { id: 'rod_deep_titanium', price: 85000, requiredLevel: 28, baseAttractionBonusPct: 9, rarityBoostMultiplier: 2.65 },
  { id: 'rod_starlight', price: 280000, requiredLevel: 42, baseAttractionBonusPct: 14, rarityBoostMultiplier: 3.85 },
  { id: 'rod_chronos_abyss', price: 850000, requiredLevel: 55, baseAttractionBonusPct: 20, rarityBoostMultiplier: 6.2 }
];

const BAITS = [
  { id: 'bait_sandworm', pricePerPack: 0, packQuantity: 999, baseAttractionBonusPct: 0, bonusWeightMultiplier: 1.0, targetRarities: ['Common', 'Uncommon'], targetFishIds: ['fish_01_sardine', 'fish_03_mackerel', 'fish_04_flounder', 'fish_05_bream', 'fish_29_solar_ray', 'fish_31_dawn_trout'] },
  { id: 'bait_krill', pricePerPack: 250, packQuantity: 10, baseAttractionBonusPct: 2, bonusWeightMultiplier: 1.8, targetRarities: ['Common', 'Uncommon', 'Rare'], targetFishIds: ['fish_02_clownfish', 'creature_21_shrimp', 'fish_06_snapper', 'fish_07_parrotfish', 'fish_08_boxfish', 'fish_27_sunburst_dorado', 'fish_31_dawn_trout'] },
  { id: 'bait_squid', pricePerPack: 800, packQuantity: 10, baseAttractionBonusPct: 4, bonusWeightMultiplier: 2.6, targetRarities: ['Uncommon', 'Rare', 'Epic'], targetFishIds: ['creature_22_squid', 'creature_23_jellyfish', 'fish_09_barracuda', 'fish_10_tuna', 'fish_11_lionfish', 'fish_13_mantaray', 'fish_15_angler', 'fish_28_midnight_moonfish', 'fish_30_abyssal_biolum'] },
  { id: 'bait_crystal_lure', pricePerPack: 2400, packQuantity: 8, baseAttractionBonusPct: 6, bonusWeightMultiplier: 3.5, targetRarities: ['Rare', 'Epic'], targetFishIds: ['fish_10_tuna', 'fish_12_mahimahi', 'fish_14_swordfish', 'fish_16_oarfish', 'creature_24_seahorse', 'fish_28_midnight_moonfish', 'fish_29_solar_ray'] },
  { id: 'bait_golden_essence', pricePerPack: 6500, packQuantity: 6, baseAttractionBonusPct: 9, bonusWeightMultiplier: 5.0, targetRarities: ['Epic', 'Legendary'], targetFishIds: ['fish_14_swordfish', 'fish_16_oarfish', 'fish_17_whaleshark', 'fish_18_coelacanth', 'fish_32_starlight_dragonet'] },
  { id: 'bait_astral_nectar', pricePerPack: 18000, packQuantity: 5, baseAttractionBonusPct: 12, bonusWeightMultiplier: 8.5, targetRarities: ['Epic', 'Legendary', 'Secret'], targetFishIds: ['fish_15_angler', 'fish_17_whaleshark', 'fish_18_coelacanth', 'fish_19_leviathan', 'fish_20_chronoskoi', 'creature_26_nautilus', 'fish_30_abyssal_biolum', 'fish_32_starlight_dragonet'] }
];

const COSTUMES = [
  { id: 'costume_brown', price: 0 },
  { id: 'costume_cream', price: 1800 },
  { id: 'costume_crimson', price: 4500 },
  { id: 'costume_sailor', price: 12000 },
  { id: 'costume_yukata', price: 35000 },
  { id: 'costume_starlight', price: 120000 }
];

const ISLANDS = [
  { id: 'island_emerald_haven', requiredLevel: 1, requiredCoins: 0, requiredRodId: 'rod_bamboo' },
  { id: 'island_coral_sanctuary', requiredLevel: 15, requiredCoins: 12000, requiredRodId: 'rod_coral_carbon' },
  { id: 'island_volcanic_atoll', requiredLevel: 28, requiredCoins: 65000, requiredRodId: 'rod_deep_titanium' },
  { id: 'island_aurora_fjord', requiredLevel: 42, requiredCoins: 220000, requiredRodId: 'rod_starlight' },
  { id: 'island_celestial_archipelago', requiredLevel: 55, requiredCoins: 680000, requiredRodId: 'rod_chronos_abyss' }
];

const speciesMatches = [...dbText.matchAll(/id:\s*'(fish_[^']+|creature_[^']+)'[\s\S]*?rarity:\s*'([^']+)'[\s\S]*?basePrice:\s*(\d+)[\s\S]*?expReward:\s*(\d+)/g)];
const FISH_SPECIES = speciesMatches.map(m => {
  const id = m[1];
  const rarity = m[2];
  const basePrice = parseInt(m[3]);
  const expReward = parseInt(m[4]);
  const timeMatch = dbText.match(new RegExp(`id:\\s*'${id}'[\\s\\S]*?timeAvailability:\\s*'([^']+)'`));
  const timeAvailability = timeMatch ? timeMatch[1] : 'all';
  return { id, rarity, basePrice, expReward, timeAvailability };
});

function expNeededForLevel(level) {
  return Math.floor(150 * Math.pow(level, 1.72));
}

function calculateBaseBiteChance(rod, bait) {
  const rodBonus = (rod.baseAttractionBonusPct || 0) / 100;
  const baitBonus = (bait.baseAttractionBonusPct || 0) / 100;
  return Math.min(0.60, 0.10 + rodBonus + baitBonus);
}

const islandEndemicMap = {
  island_emerald_haven: ['fish_01_sardine', 'fish_02_clownfish', 'fish_03_mackerel', 'creature_21_shrimp', 'fish_05_bream', 'fish_29_solar_ray'],
  island_coral_sanctuary: ['fish_04_flounder', 'fish_07_parrotfish', 'fish_08_boxfish', 'creature_22_squid', 'fish_11_lionfish', 'fish_27_sunburst_dorado'],
  island_volcanic_atoll: ['fish_09_barracuda', 'fish_10_tuna', 'creature_24_seahorse', 'fish_12_mahimahi', 'fish_14_swordfish', 'fish_30_abyssal_biolum'],
  island_aurora_fjord: ['fish_06_snapper', 'creature_23_jellyfish', 'fish_13_mantaray', 'fish_16_oarfish', 'creature_25_octopus', 'fish_31_dawn_trout'],
  island_celestial_archipelago: ['fish_15_angler', 'fish_17_whaleshark', 'fish_18_coelacanth', 'fish_19_leviathan', 'fish_20_chronoskoi', 'creature_26_nautilus', 'fish_28_midnight_moonfish', 'fish_32_starlight_dragonet']
};

function rollFishSpecies(rod, bait, timeOfDay, islandId) {
  const candidatePool = FISH_SPECIES.filter(sp => {
    if (!sp.timeAvailability || sp.timeAvailability === 'all') return true;
    return sp.timeAvailability === timeOfDay;
  });
  const poolToUse = candidatePool.length > 0 ? candidatePool : FISH_SPECIES;

  const weightedPool = poolToUse.map(sp => {
    const rarityBase = RARITY_CONFIG[sp.rarity].baseChancePct;
    let w = rarityBase;
    if (islandId) {
      const endemics = islandEndemicMap[islandId] || [];
      if (endemics.includes(sp.id)) w *= 3.4;
      else w *= 0.55;
    }
    if (sp.rarity === 'Rare') w *= Math.pow(rod.rarityBoostMultiplier, 0.55);
    if (sp.rarity === 'Epic') w *= Math.pow(rod.rarityBoostMultiplier, 0.85);
    if (sp.rarity === 'Legendary') w *= Math.pow(rod.rarityBoostMultiplier, 1.15);
    if (sp.rarity === 'Secret') w *= Math.pow(rod.rarityBoostMultiplier, 1.45);

    if (bait.targetFishIds.includes(sp.id)) {
      w *= bait.bonusWeightMultiplier;
    } else if (bait.targetRarities.includes(sp.rarity)) {
      w *= 1 + (bait.bonusWeightMultiplier - 1) * 0.45;
    }
    return { species: sp, weight: w };
  });

  const totalWeight = weightedPool.reduce((a, b) => a + b.weight, 0);
  let cursor = Math.random() * totalWeight;
  for (const item of weightedPool) {
    if (cursor <= item.weight) return item.species;
    cursor -= item.weight;
  }
  return weightedPool[0].species;
}

// Diagnose single run
let coins = 350;
let level = 1;
let exp = 0;
let nextLevelExp = expNeededForLevel(level);
let ownedRods = ['rod_bamboo'];
let equippedRod = RODS[0];
let ownedCostumes = ['costume_brown'];
let unlockedIslands = ['island_emerald_haven'];
let encyclopedia = new Set();
let totalCatches = 0;
let pityBonus = 0;
let totalPlaytimeSec = 0;
let simMinutes = 0;

for (let tick = 0; tick < 100000; tick++) {
  const hasAllIslands = unlockedIslands.length === ISLANDS.length;
  const hasAllRods = ownedRods.length === RODS.length;
  const hasAllCostumes = ownedCostumes.length === COSTUMES.length;
  const hasAllSpecies = encyclopedia.size === FISH_SPECIES.length;
  const hasLevel55 = level >= 55;

  if (tick % 5000 === 0) {
    console.log(`[Hour ${(totalPlaytimeSec/3600).toFixed(1)}] Lv.${level} (Exp:${exp}/${nextLevelExp}), Coins:${coins.toLocaleString()}, Species:${encyclopedia.size}/${FISH_SPECIES.length}, Rods:${ownedRods.length}/6, Islands:${unlockedIslands.length}/5, Costumes:${ownedCostumes.length}/6`);
  }

  if (hasAllIslands && hasAllRods && hasAllCostumes && hasAllSpecies && hasLevel55) {
    console.log(`SUCCESS at Hour ${(totalPlaytimeSec/3600).toFixed(1)}!`);
    break;
  }

  // Pick target island
  let targetIsland = unlockedIslands[unlockedIslands.length - 1];
  for (const isl of unlockedIslands) {
    const endemics = islandEndemicMap[isl] || [];
    if (endemics.some(fid => !encyclopedia.has(fid))) {
      targetIsland = isl;
      break;
    }
  }

  let equippedBait = BAITS[0];
  if (coins > 50000 && unlockedIslands.includes('island_celestial_archipelago')) {
    equippedBait = BAITS[5];
    coins -= Math.round(equippedBait.pricePerPack / equippedBait.packQuantity);
  } else if (coins > 20000) {
    equippedBait = BAITS[3];
    coins -= Math.round(equippedBait.pricePerPack / equippedBait.packQuantity);
  } else if (coins > 3000) {
    equippedBait = BAITS[1];
    coins -= Math.round(equippedBait.pricePerPack / equippedBait.packQuantity);
  }

  const tod = (Math.floor(simMinutes / 720) % 2 === 0) ? 'day' : 'night';
  simMinutes += 1;
  totalPlaytimeSec += 60;

  const baseRate = calculateBaseBiteChance(equippedRod, equippedBait);
  const biteChance = Math.min(1.0, baseRate + pityBonus);

  if (Math.random() < biteChance) {
    pityBonus = 0;
    totalPlaytimeSec += 20;
    const caught = rollFishSpecies(equippedRod, equippedBait, tod, targetIsland);
    totalCatches++;
    encyclopedia.add(caught.id);

    const sellPrice = Math.round(caught.basePrice * 1.25);
    coins += sellPrice;

    exp += caught.expReward;
    while (exp >= nextLevelExp) {
      exp -= nextLevelExp;
      level++;
      nextLevelExp = expNeededForLevel(level);
    }

    for (const r of RODS) {
      if (!ownedRods.includes(r.id) && level >= r.requiredLevel && coins >= r.price) {
        coins -= r.price;
        ownedRods.push(r.id);
        equippedRod = r;
      }
    }

    for (const isl of ISLANDS) {
      if (!unlockedIslands.includes(isl.id) && level >= isl.requiredLevel && coins >= isl.requiredCoins && ownedRods.includes(isl.requiredRodId)) {
        coins -= isl.requiredCoins;
        unlockedIslands.push(isl.id);
      }
    }

    for (const c of COSTUMES) {
      if (!ownedCostumes.includes(c.id) && coins >= c.price * 1.2) {
        coins -= c.price;
        ownedCostumes.push(c.id);
      }
    }
  } else {
    pityBonus += 0.10 * baseRate;
  }
}

// Print missing species if any
const missing = FISH_SPECIES.filter(s => !encyclopedia.has(s.id));
console.log('Missing species at end:', missing.map(s => `${s.id} (${s.rarity}, ${s.timeAvailability})`));
