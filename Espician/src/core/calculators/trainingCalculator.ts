import { PlayerData } from '../../types';

export type TrainingType = 'mechanics' | 'mapAwareness' | 'teamwork' | 'professionalism' | 'clutch' | 'stamina';

export interface TrainingResult {
  success: boolean;
  message: string;
  gain: number;
  cost: number;
  newStatValue: number;
  hitCap: boolean;
  energyCost: number;
  expGained: number;
  leveledUp: boolean;
  newLevel?: number;
}

export const TRAINING_COSTS: Record<TrainingType, number> = {
  mechanics: 600,
  mapAwareness: 550,
  teamwork: 450,
  clutch: 700,
  stamina: 400,
  professionalism: 350
};

export class TrainingCalculator {
  /**
   * คำนวณการฝึกซ้อมระดับสากล ป้องกันการโกง/เก่งไวเกินไป (Anti-Exploit / Progressive Scaling)
   * 1. คิดอัตราลดทอนเมื่อใกล้เพดาน (Diminishing Returns)
   * 2. ให้ค่าประสบการณ์ (EXP) สะสมเพื่อเลเวลอัป
   * 3. คำนึงถึงสภาพร่างกาย ความฟิต และบัฟ/ดีบัฟ
   */
  public static calculateTraining(
    player: PlayerData,
    type: TrainingType,
    currentBudget: number,
    staffBonusExpMultiplier: number = 1.0
  ): TrainingResult {
    const cost = TRAINING_COSTS[type];

    if (currentBudget < cost) {
      return {
        success: false,
        message: 'งบประมาณสโมสรไม่เพียงพอสำหรับการเปิดคอร์สนี้!',
        gain: 0,
        cost: 0,
        newStatValue: player.stats[type],
        hitCap: false,
        energyCost: 0,
        expGained: 0,
        leveledUp: false
      };
    }

    if (player.energy < 20) {
      return {
        success: false,
        message: `${player.inGameName} เหนื่อยล้าเกินไป (Energy < 20%) กรุณาให้พักผ่อน`,
        gain: 0,
        cost: 0,
        newStatValue: player.stats[type],
        hitCap: false,
        energyCost: 0,
        expGained: 0,
        leveledUp: false
      };
    }

    // ดีบัฟข้อมืออักเสบ (Wrist Strain)
    const hasWristStrain = player.conditions.some((c) => c.id === 'cond_wrist_strain');
    if (hasWristStrain && (type === 'mechanics' || type === 'clutch')) {
      return {
        success: false,
        message: `⚠️ ไม่สามารถฝึกได้เนื่องจาก ${player.inGameName} มีอาการ 'ข้อมือล้าอักเสบ' ต้องพักรักษาตัวก่อน!`,
        gain: 0,
        cost: 0,
        newStatValue: player.stats[type],
        hitCap: false,
        energyCost: 0,
        expGained: 0,
        leveledUp: false
      };
    }

    const currentVal = player.stats[type];
    let maxCap = 100;

    if (type === 'mechanics') {
      maxCap = player.dna.maxMechanicsCap;
    } else if (type === 'mapAwareness') {
      maxCap = player.dna.maxAwarenessCap;
    }

    if (currentVal >= maxCap) {
      return {
        success: false,
        message: `${player.inGameName} ชนเพดานพรสวรรค์ (DNA Cap: ${maxCap}) ไม่สามารถเก่งขึ้นในด้านนี้ได้แล้ว!`,
        gain: 0,
        cost: 0,
        newStatValue: currentVal,
        hitCap: true,
        energyCost: 0,
        expGained: 0,
        leveledUp: false
      };
    }

    // Diminishing Returns: ยิ่งใกล้เพดาน การพัฒนาจะยิ่งลดทอนแบบ Non-Linear Asymptotic Curve
    const gapToCap = maxCap - currentVal;
    const diminishingFactor = Math.max(0.18, Math.pow(Math.min(1.0, gapToCap / 32), 0.75));

    // DNA Training Affinity Bonus
    let affinityMultiplier = 1.0;
    let hasAffinityMatch = false;
    if (player.dna.trainingAffinity) {
      if (
        (player.dna.trainingAffinity === 'Mechanics' && type === 'mechanics') ||
        (player.dna.trainingAffinity === 'Awareness' && type === 'mapAwareness') ||
        (player.dna.trainingAffinity === 'Teamwork' && type === 'teamwork') ||
        (player.dna.trainingAffinity === 'Stamina' && type === 'stamina')
      ) {
        affinityMultiplier = 1.20;
        hasAffinityMatch = true;
      }
    }

    // Talent Tier Boost (S+, S, A)
    let talentTierMultiplier = 1.0;
    if (player.dna.talentTier === 'S+') talentTierMultiplier = 1.15;
    else if (player.dna.talentTier === 'S') talentTierMultiplier = 1.10;
    else if (player.dna.talentTier === 'A') talentTierMultiplier = 1.05;

    // Mental Fatigue Factor (0 - 100)
    const mentalFatigue = player.mentalFatigue || 0;
    const mentalFatigueMultiplier = Math.max(0.70, 1.0 - Math.max(0, mentalFatigue - 35) * 0.005);

    // บัฟ/ดีบัฟ ตัวคูณ
    let conditionMultiplier = 1.0;
    let conditionNote = '';

    if (player.conditions.some((c) => c.id === 'cond_on_fire')) {
      conditionMultiplier *= 1.25;
      conditionNote += ' [🔥 ไฟแรง +25%]';
    }

    if (player.conditions.some((c) => c.id === 'cond_lazy')) {
      conditionMultiplier *= 0.6;
      conditionNote += ' [🦥 ขี้เกียจซ้อม -40%]';
    }

    if (hasAffinityMatch) {
      conditionNote += ' [✨ พรสวรรค์ตรงสาย +20%]';
    }

    // Base gain (ปรับให้สมดุลสไตล์ Esports Online: 0.8 - 1.8 ต่อเซสชั่น)
    const baseGain = 1.25;
    const energyMult = Math.max(0.4, player.energy / 100);
    const moraleMult = 0.85 + (player.morale / 100) * 0.3;
    const rawGain = Number(
      (
        baseGain *
        player.dna.learningSpeed *
        affinityMultiplier *
        talentTierMultiplier *
        mentalFatigueMultiplier *
        energyMult *
        moraleMult *
        diminishingFactor *
        conditionMultiplier
      ).toFixed(1)
    );

    let actualGain = Math.max(0.3, rawGain);
    let hitCap = false;

    if (currentVal + actualGain >= maxCap) {
      actualGain = Number((maxCap - currentVal).toFixed(1));
      hitCap = true;
    }

    const newStatValue = Number((currentVal + actualGain).toFixed(1));

    // Energy consumption reduced by stamina & training affinity
    const staminaEfficiency = 1 - (player.stats.stamina / 100) * 0.35;
    const affinityEnergyDiscount = hasAffinityMatch ? 0.85 : 1.0;
    const energyCost = Math.max(7, Math.round(16 * staminaEfficiency * affinityEnergyDiscount));

    // EXP Calculation & Level Up
    const expGained = Math.round(120 * player.dna.learningSpeed * staffBonusExpMultiplier);
    const newExp = (player.exp || 0) + expGained;
    let leveledUp = false;
    let newLevel = player.level || 1;

    if (newExp >= player.maxExp) {
      leveledUp = true;
      newLevel += 1;
    }

    return {
      success: true,
      message: hitCap
        ? `${player.inGameName} พัฒนา ${type} +${actualGain} และชนเพดานขีดจำกัด DNA แล้ว! (+${expGained} EXP)`
        : `${player.inGameName} ซ้อมสำเร็จ! ค่า ${type} +${actualGain} (${currentVal} ➔ ${newStatValue})${conditionNote} (+${expGained} EXP)`,
      gain: actualGain,
      cost,
      newStatValue,
      hitCap,
      energyCost,
      expGained,
      leveledUp,
      newLevel
    };
  }

  /**
   * คำนวณประมาณการจำนวนครั้งที่ต้องฝึกจนกว่าจะชนเพดานขีดจำกัด DNA (Diminishing Return Simulation)
   */
  public static calculateEstimatedSessionsToCap(
    currentVal: number,
    maxCap: number,
    learningSpeed: number = 1.0,
    hasAffinity: boolean = false
  ): number {
    if (currentVal >= maxCap) return 0;
    let simulatedVal = currentVal;
    let sessions = 0;
    const affinityMult = hasAffinity ? 1.2 : 1.0;

    while (simulatedVal < maxCap && sessions < 200) {
      sessions++;
      const gap = maxCap - simulatedVal;
      const dimFactor = Math.max(0.18, Math.pow(Math.min(1.0, gap / 32), 0.75));
      const stepGain = Math.max(0.3, 1.25 * learningSpeed * affinityMult * dimFactor);
      simulatedVal += stepGain;
    }

    return sessions;
  }
}
