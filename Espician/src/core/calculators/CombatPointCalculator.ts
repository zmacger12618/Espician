import { PlayerData, PlayerRole, PlayerStats } from '../../types';

export interface CombatPointBreakdown {
  totalCP: number;
  baseStatScore: number;
  dnaTalentBonus: number;
  gearBonus: number;
  conditionModifier: number;
  levelBonus: number;
  talentTierBonus?: number;
  affinityMatchBonus?: number;
  tier: 'Legendary' | 'Master' | 'Diamond' | 'Gold' | 'Silver' | 'Bronze';
  tierColor: string;
}

export class CombatPointCalculator {
  /**
   * คำนวณ Combat Point (CP) อ้างอิงตามสูตรเกมอีสปอร์ต/กีฬาชั้นนำสากล
   * ผสานระหว่าง สเตตัสประจำตำแหน่ง + พรสวรรค์กำเนิด (DNA) + เกียร์ + นิสัย/บัฟ + เลเวล
   */
  public static calculate(player: PlayerData): CombatPointBreakdown {
    // 1. Role-based Weighted Stat Score (0 - 100)
    const stats = player.stats;
    const baseStatScore = this.calculateWeightedRoleScore(player.role, stats);

    // 2. DNA Talent Potential Bonus (วัดพรสวรรค์และเพดานขีดจำกัด)
    // นักแข่งที่เพดานสูง (เช่น 95+) และ Learning Speed สูง จะมีแต้มพรสวรรค์แฝง
    const avgCap = (player.dna.maxMechanicsCap + player.dna.maxAwarenessCap) / 2;
    const talentRatio = Math.max(0, (avgCap - 70) / 30); // 0 to 1
    const dnaTalentBonus = Number((talentRatio * 10 * player.dna.learningSpeed).toFixed(1));

    // 2.1 Talent Tier Bonus (S+, S, A, B, C)
    let talentTierBonus = 0;
    if (player.dna.talentTier) {
      switch (player.dna.talentTier) {
        case 'S+': talentTierBonus = 5.0; break;
        case 'S': talentTierBonus = 3.5; break;
        case 'A': talentTierBonus = 2.0; break;
        case 'B': talentTierBonus = 1.0; break;
        case 'C': talentTierBonus = 0.0; break;
      }
    }

    // 2.2 Training Affinity & Role Alignment Bonus
    let affinityMatchBonus = 0;
    if (player.dna.trainingAffinity) {
      const isRoleAligned =
        (player.role === 'ADC' && player.dna.trainingAffinity === 'Mechanics') ||
        (player.role === 'Mid' && player.dna.trainingAffinity === 'Mechanics') ||
        (player.role === 'Jungle' && player.dna.trainingAffinity === 'Awareness') ||
        (player.role === 'Support' && player.dna.trainingAffinity === 'Teamwork') ||
        (player.role === 'Top' && (player.dna.trainingAffinity === 'Stamina' || player.dna.trainingAffinity === 'Mechanics'));
      if (isRoleAligned) {
        affinityMatchBonus = 2.0;
      }
    }

    // 2.3 Hidden Traits Assessment
    let hiddenTraitsBonus = 0;
    if (player.dna.hiddenTraits && Array.isArray(player.dna.hiddenTraits)) {
      player.dna.hiddenTraits.forEach((trait) => {
        if (trait === 'ice_in_veins' || trait === 'clutch_master') hiddenTraitsBonus += 1.5;
        if (trait === 'macro_prodigy' || trait === 'hyper_mechanics') hiddenTraitsBonus += 2.0;
        if (trait === 'unwavering_focus') hiddenTraitsBonus += 1.0;
      });
    }

    // 3. Equipment & Gear Enhancement Bonus
    let gearBonus = 0;
    if (player.equippedGear) {
      Object.values(player.equippedGear).forEach((gear) => {
        if (gear) {
          gearBonus += gear.bonusValue + gear.upgradeLevel * 1.5;
        }
      });
    }

    // 4. Traits & Conditions Modifier (นิสัยและสภาพจิตใจ/ร่างกาย)
    let conditionModifier = 0;
    if (player.conditions) {
      player.conditions.forEach((c) => {
        switch (c.id) {
          case 'cond_on_fire': conditionModifier += 4; break;
          case 'cond_clutch_god': conditionModifier += 3; break;
          case 'cond_team_pillar': conditionModifier += 3; break;
          case 'cond_lazy': conditionModifier -= 3; break;
          case 'cond_wrist_strain': conditionModifier -= 6; break;
          case 'cond_tilter': conditionModifier -= 2; break;
          case 'cond_flu': conditionModifier -= 4; break;
        }
      });
    }

    // 5. Level & Experience Bonus
    const levelBonus = Number(((player.level || 1) * 0.4).toFixed(1));

    // Total Combat Point
    const totalTalentBonus = dnaTalentBonus + talentTierBonus + affinityMatchBonus + hiddenTraitsBonus;
    const rawTotal = baseStatScore * 0.72 + totalTalentBonus + gearBonus * 0.5 + conditionModifier + levelBonus;
    const totalCP = Math.max(40, Math.min(99, Math.round(rawTotal)));

    // Tier Classification (สากล Esports Ranking)
    let tier: CombatPointBreakdown['tier'] = 'Bronze';
    let tierColor = 'text-amber-700 border-amber-800/40 bg-amber-950/30';

    if (totalCP >= 92) {
      tier = 'Legendary';
      tierColor = 'text-fuchsia-400 border-fuchsia-500/50 bg-fuchsia-950/40 shadow-fuchsia-500/20';
    } else if (totalCP >= 84) {
      tier = 'Master';
      tierColor = 'text-amber-400 border-amber-500/50 bg-amber-950/40 shadow-amber-500/20';
    } else if (totalCP >= 76) {
      tier = 'Diamond';
      tierColor = 'text-cyan-400 border-cyan-500/50 bg-cyan-950/40 shadow-cyan-500/20';
    } else if (totalCP >= 68) {
      tier = 'Gold';
      tierColor = 'text-yellow-300 border-yellow-500/40 bg-yellow-950/30';
    } else if (totalCP >= 60) {
      tier = 'Silver';
      tierColor = 'text-slate-300 border-slate-500/40 bg-slate-800/40';
    }

    return {
      totalCP,
      baseStatScore: Math.round(baseStatScore),
      dnaTalentBonus: Number(totalTalentBonus.toFixed(1)),
      gearBonus,
      conditionModifier,
      levelBonus,
      talentTierBonus,
      affinityMatchBonus,
      tier,
      tierColor
    };
  }

  private static calculateWeightedRoleScore(role: PlayerRole, s: PlayerStats): number {
    switch (role) {
      case 'Top':
        return (
          s.mechanics * 0.22 +
          s.stamina * 0.22 +
          s.teamwork * 0.18 +
          s.mapAwareness * 0.15 +
          s.clutch * 0.13 +
          s.consistency * 0.1
        );
      case 'Jungle':
        return (
          s.mapAwareness * 0.26 +
          s.consistency * 0.22 +
          s.teamwork * 0.20 +
          s.mechanics * 0.16 +
          s.clutch * 0.16
        );
      case 'Mid':
        return (
          s.mechanics * 0.32 +
          s.clutch * 0.22 +
          s.mapAwareness * 0.18 +
          s.consistency * 0.14 +
          s.teamwork * 0.14
        );
      case 'ADC':
        return (
          s.mechanics * 0.35 +
          s.clutch * 0.24 +
          s.consistency * 0.16 +
          s.mapAwareness * 0.13 +
          s.stamina * 0.12
        );
      case 'Support':
        return (
          s.teamwork * 0.32 +
          s.mapAwareness * 0.26 +
          s.professionalism * 0.16 +
          s.clutch * 0.14 +
          s.consistency * 0.12
        );
    }
  }
}
