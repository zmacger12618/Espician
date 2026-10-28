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

const islandEndemicMap = {
  island_emerald_haven: ['fish_01_sardine', 'fish_02_clownfish', 'fish_03_mackerel', 'creature_21_shrimp', 'fish_05_bream', 'fish_29_solar_ray'],
  island_coral_sanctuary: ['fish_04_flounder', 'fish_07_parrotfish', 'fish_08_boxfish', 'creature_22_squid', 'fish_11_lionfish', 'fish_27_sunburst_dorado'],
  island_volcanic_atoll: ['fish_09_barracuda', 'fish_10_tuna', 'creature_24_seahorse', 'fish_12_mahimahi', 'fish_14_swordfish', 'fish_30_abyssal_biolum'],
  island_aurora_fjord: ['fish_06_snapper', 'creature_23_jellyfish', 'fish_13_mantaray', 'fish_16_oarfish', 'creature_25_octopus', 'fish_31_dawn_trout'],
  island_celestial_archipelago: ['fish_15_angler', 'fish_17_whaleshark', 'fish_18_coelacanth', 'fish_19_leviathan', 'fish_20_chronoskoi', 'creature_26_nautilus', 'fish_28_midnight_moonfish', 'fish_32_starlight_dragonet']
};

// Calibrated EXP curve:
function expNeededForLevel(level) {
  return Math.floor(83.5 * Math.pow(level, 1.68));
}

let sumExp55 = 0;
for (let l = 1; l < 55; l++) sumExp55 += expNeededForLevel(l);
console.log('Calibrated Total EXP needed for Lv.55:', sumExp55.toLocaleString());

function calculateBaseBiteChance(rod, bait) {
  const rodBonus = (rod.baseAttractionBonusPct || 0) / 100;
  const baitBonus = (bait.baseAttractionBonusPct || 0) / 100;
  return Math.min(0.60, 0.10 + rodBonus + baitBonus);
}

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

// Simulate 1 player journey with realistic quest claims and budget strategy
function simulatePlayer(playerId) {
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
  let dailyClaimedDay = -1;

  // Track main quests completed (milestones)
  let mainQuestsClaimed = 0;
  const mainQuestCoins = [200, 500, 1500, 2500, 5000, 10000, 15000, 25000, 45000, 60000, 100000, 150000, 200000, 300000];
  const mainQuestExp = [80, 200, 600, 1000, 2200, 4500, 6500, 11000, 18000, 25000, 40000, 60000, 80000, 120000];

  while (true) {
    const hasAllIslands = unlockedIslands.length === ISLANDS.length;
    const hasAllRods = ownedRods.length === RODS.length;
    const hasAllCostumes = ownedCostumes.length === COSTUMES.length;
    const hasAllSpecies = encyclopedia.size === FISH_SPECIES.length;
    const hasLevel55 = level >= 55;

    if (hasAllIslands && hasAllRods && hasAllCostumes && hasAllSpecies && hasLevel55) {
      break;
    }

    if (totalPlaytimeSec > 3600 * 500) {
      break; // 500 hr limit
    }

    // Daily quest claim simulation (approx once every 6 hours of playtime = 1 day)
    const currentDay = Math.floor(totalPlaytimeSec / (3600 * 6));
    if (currentDay > dailyClaimedDay) {
      dailyClaimedDay = currentDay;
      coins += 1800; // 3 daily quests avg
      exp += 800;
      while (exp >= nextLevelExp) {
        exp -= nextLevelExp;
        level++;
        nextLevelExp = expNeededForLevel(level);
      }
    }

    // Main quest progress triggers
    if (mainQuestsClaimed < 14) {
      let canClaim = false;
      if (mainQuestsClaimed === 0 && totalCatches >= 1) canClaim = true;
      else if (mainQuestsClaimed === 1 && totalCatches >= 5) canClaim = true;
      else if (mainQuestsClaimed === 2 && totalCatches >= 25) canClaim = true;
      else if (mainQuestsClaimed === 3 && encyclopedia.size >= 5) canClaim = true;
      else if (mainQuestsClaimed === 4 && totalCatches >= 50) canClaim = true;
      else if (mainQuestsClaimed === 5 && level >= 5) canClaim = true;
      else if (mainQuestsClaimed === 6 && encyclopedia.size >= 10) canClaim = true;
      else if (mainQuestsClaimed === 7 && level >= 15) canClaim = true;
      else if (mainQuestsClaimed === 8 && level >= 28) canClaim = true;
      else if (mainQuestsClaimed === 9 && encyclopedia.size >= 18) canClaim = true;
      else if (mainQuestsClaimed === 10 && level >= 42) canClaim = true;
      else if (mainQuestsClaimed === 11 && encyclopedia.size >= 24) canClaim = true;
      else if (mainQuestsClaimed === 12 && level >= 50) canClaim = true;
      else if (mainQuestsClaimed === 13 && encyclopedia.size >= 26) canClaim = true;

      if (canClaim) {
        coins += mainQuestCoins[mainQuestsClaimed];
        exp += mainQuestExp[mainQuestsClaimed];
        mainQuestsClaimed++;
        while (exp >= nextLevelExp) {
          exp -= nextLevelExp;
          level++;
          nextLevelExp = expNeededForLevel(level);
        }
      }
    }

    // Determine target island (prioritize islands with missing endemic species)
    let targetIsland = unlockedIslands[unlockedIslands.length - 1];
    for (const isl of unlockedIslands) {
      const endemics = islandEndemicMap[isl] || [];
      if (endemics.some(fid => !encyclopedia.has(fid))) {
        targetIsland = isl;
        break;
      }
    }

    // Sensible player budget strategy for baits:
    // Only buy baits if we have sufficient savings towards next milestone!
    let nextCost = 99999999;
    const nextRod = RODS.find(r => !ownedRods.includes(r.id));
    const nextIsland = ISLANDS.find(i => !unlockedIslands.includes(i.id));
    if (nextRod && level >= nextRod.requiredLevel) nextCost = Math.min(nextCost, nextRod.price);
    if (nextIsland && level >= nextIsland.requiredLevel) nextCost = Math.min(nextCost, nextIsland.requiredCoins);

    let equippedBait = BAITS[0]; // Free Sandworm
    // If we have comfortable reserve or are hunting endgame Secret species:
    if (coins > nextCost + 40000 && unlockedIslands.includes('island_celestial_archipelago')) {
      equippedBait = BAITS[5]; // Astral
      coins -= Math.round(equippedBait.pricePerPack / equippedBait.packQuantity);
    } else if (coins > nextCost + 15000 && unlockedIslands.includes('island_aurora_fjord')) {
      equippedBait = BAITS[4]; // Golden
      coins -= Math.round(equippedBait.pricePerPack / equippedBait.packQuantity);
    } else if (coins > nextCost + 6000) {
      equippedBait = BAITS[2]; // Squid
      coins -= Math.round(equippedBait.pricePerPack / equippedBait.packQuantity);
    } else if (coins > nextCost + 1500) {
      equippedBait = BAITS[1]; // Krill
      coins -= Math.round(equippedBait.pricePerPack / equippedBait.packQuantity);
    }

    // Day/Night rotation
    const tod = (Math.floor(simMinutes / 720) % 2 === 0) ? 'day' : 'night';
    simMinutes += 1;
    totalPlaytimeSec += 60; // 1-minute tick

    const baseRate = calculateBaseBiteChance(equippedRod, equippedBait);
    const biteChance = Math.min(1.0, baseRate + pityBonus);

    if (Math.random() < biteChance) {
      pityBonus = 0;
      totalPlaytimeSec += 18; // minigame + anim
      const caught = rollFishSpecies(equippedRod, equippedBait, tod, targetIsland);
      totalCatches++;
      encyclopedia.add(caught.id);

      // Sell fish (avg multiplier 1.28 with size bonus)
      const sellPrice = Math.round(caught.basePrice * 1.28);
      coins += sellPrice;

      exp += caught.expReward;
      while (exp >= nextLevelExp) {
        exp -= nextLevelExp;
        level++;
        nextLevelExp = expNeededForLevel(level);
      }

      // Upgrade purchases:
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

      // Costumes purchased when main upgrades don't immediately block
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

  return {
    hours: totalPlaytimeSec / 3600,
    level,
    totalCatches,
    coins,
    speciesCount: encyclopedia.size,
    rodsCount: ownedRods.length,
    costumesCount: ownedCostumes.length,
    islandsCount: unlockedIslands.length,
    mainQuests: mainQuestsClaimed
  };
}

console.log('Running 50 player simulation runs with calibrated 240-hour parameters...');
const results = [];
for (let i = 0; i < 50; i++) {
  results.push(simulatePlayer(i));
}

const avgHours = results.reduce((a, b) => a + b.hours, 0) / results.length;
const minHours = Math.min(...results.map(r => r.hours));
const maxHours = Math.max(...results.map(r => r.hours));
const avgCatches = results.reduce((a, b) => a + b.totalCatches, 0) / results.length;

console.log(`\n=== 240-HOUR BALANCING SIMULATION RESULTS ===`);
console.log(`Average Playtime to 100% Completion: ${avgHours.toFixed(1)} Hours`);
console.log(`Min Playtime: ${minHours.toFixed(1)} Hours`);
console.log(`Max Playtime: ${maxHours.toFixed(1)} Hours`);
console.log(`Average Total Catches: ${Math.round(avgCatches)} fish`);
console.log(`Sample result 0:`, results[0]);
