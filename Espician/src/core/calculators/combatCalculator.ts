import { ChampionData, PlayerData, TeamTactic } from '../../types';

export class CombatCalculator {
  /**
   * คำนวณความเร็วโจมตี (Attack Interval วินาทีต่อการโจมตี 1 ครั้ง)
   * อิงตามค่า Mechanics, Stamina และบทบาทของแชมเปี้ยน
   */
  public static calculateAttackInterval(player: PlayerData, champion: ChampionData): number {
    const baseInterval =
      champion.role === 'Marksman'
        ? 0.85
        : champion.role === 'Assassin'
          ? 0.95
          : champion.role === 'Mage'
            ? 1.15
            : 1.25;

    const mechSpeedFactor = 1 - (player.stats.mechanics / 100) * 0.22;
    const staminaFactor = 1 - (player.stats.stamina / 100) * 0.08;
    return Math.max(0.55, Number((baseInterval * mechSpeedFactor * staminaFactor).toFixed(2)));
  }

  /**
   * คำนวณคูลดาวน์สกิลอัลติเมท/สกิลหลัก (วินาที)
   * อิงตามค่า Map Awareness, Professionalism และ Champion Mastery
   */
  public static calculateSkillCooldown(player: PlayerData, champion: ChampionData): number {
    const mastery = player.championMasteries[champion.id] || 50;
    const cdr = (player.stats.mapAwareness / 100) * 0.15 + (mastery / 100) * 0.15;
    return Math.max(3.2, Number((6.0 * (1 - cdr)).toFixed(2)));
  }

  /**
   * คำนวณดาเมจต่อการโจมตีหนึ่งครั้งตามหลักอัลกอริทึม (Deterministic Cycle):
   * Base Damage ของแชมเปี้ยน + โบนัสจาก Mechanics + Consistency + Mastery + Gear + Clutch
   */
  public static calculateAttackDamage(
    player: PlayerData,
    champion: ChampionData,
    currentHpPercent: number = 1.0,
    attackCounter: number = 1
  ): { damage: number; isCrit: boolean; isClutchActive: boolean } {
    let effectiveMechanics = player.stats.mechanics;

    // ดีบัฟข้อมืออักเสบ (Mechanics ลดลง 20%)
    if (player.conditions.some((c) => c.id === 'cond_wrist_strain')) {
      effectiveMechanics *= 0.8;
    }

    // โบนัสจากอุปกรณ์เกมมิ่งเกียร์ที่สวมใส่
    let gearFlatBonus = 0;
    const gearSlots = Object.values(player.equippedGear || {});
    for (const gear of gearSlots) {
      if (!gear) continue;
      const upgradeScale = 1 + (gear.upgradeLevel || 0) * 0.25;
      gearFlatBonus += Math.round((gear.bonusValue || 4) * upgradeScale * 1.4);
    }

    const mechanicsBonus = effectiveMechanics * 0.52;
    const consistencyBonus = (player.stats.consistency / 100) * 14;
    const mastery = player.championMasteries[champion.id] || 50;
    const masteryBonus = (mastery / 100) * 18;

    // อัลกอริทึมคริติคอลแบบ Deterministic Cycle (ตามค่า Mechanics + Clutch)
    // เช่น หากค่าคริติคอล = 25% จะติดคริติคอลทุกๆ การโจมตีครั้งที่ 4 อย่างแม่นยำ
    const critRatio = Math.min(0.5, (effectiveMechanics * 0.6 + player.stats.clutch * 0.4) / 250);
    const critPeriod = Math.max(2, Math.round(1 / Math.max(0.1, critRatio)));
    const isCrit = attackCounter > 0 && attackCounter % critPeriod === 0;
    const critMultiplier = isCrit ? 1.55 : 1.0;

    // บัฟไฟแรง (On Fire)
    let conditionMultiplier = 1.0;
    if (player.conditions.some((c) => c.id === 'cond_on_fire')) {
      conditionMultiplier *= 1.15;
    }

    // Clutch Moment (เมื่อเลือดเหลือน้อยกว่า 35%)
    let isClutchActive = false;
    if (currentHpPercent < 0.35) {
      const clutchBonus = (player.stats.clutch / 100) * 0.22;
      const hasClutchTrait = player.conditions.some((c) => c.id === 'cond_clutch_god');
      conditionMultiplier *= 1.0 + clutchBonus + (hasClutchTrait ? 0.28 : 0);
      isClutchActive = true;
    }

    const baseRaw =
      (champion.baseDamage + mechanicsBonus + consistencyBonus + masteryBonus + gearFlatBonus) *
      conditionMultiplier;
    const damage = Math.round(baseRaw * critMultiplier);

    return { damage, isCrit, isClutchActive };
  }

  /**
   * คำนวณการหลบหลีกสกิล / Outplay แบบอัลกอริทึม (เปรียบเทียบ Map Awareness + Mechanics ของผู้รับกับผู้โจมตี)
   */
  public static checkDodgeOrOutplay(
    defender: PlayerData,
    attacker: PlayerData,
    defenderHpPercent: number = 1.0,
    exchangeStep: number = 1
  ): boolean {
    const defScore =
      defender.stats.mapAwareness * 0.55 +
      defender.stats.mechanics * 0.3 +
      defender.stats.teamwork * 0.15;
    const atkScore =
      attacker.stats.mechanics * 0.6 +
      attacker.stats.consistency * 0.25 +
      attacker.stats.mapAwareness * 0.15;

    let dodgeRating = Math.max(0.08, Math.min(0.35, 0.14 + (defScore - atkScore) / 350));

    if (defenderHpPercent < 0.35 && defender.conditions.some((c) => c.id === 'cond_clutch_god')) {
      dodgeRating += 0.16;
    }

    const period = Math.max(3, Math.round(1 / dodgeRating));
    return exchangeStep > 0 && exchangeStep % period === 0;
  }

  /**
   * ปรับแต่งกลยุทธ์ตาม Team Tactic
   */
  public static getTacticModifiers(tactic: TeamTactic) {
    switch (tactic) {
      case 'Aggressive':
        return { damageMult: 1.15, defenseMult: 0.92, pushSpeedMult: 1.15 };
      case 'LateGameScaling':
        return { damageMult: 0.96, defenseMult: 1.15, pushSpeedMult: 0.92 };
      case 'SplitPush':
        return { damageMult: 1.06, defenseMult: 0.98, pushSpeedMult: 1.25 };
      case 'Balanced':
      default:
        return { damageMult: 1.0, defenseMult: 1.0, pushSpeedMult: 1.0 };
    }
  }
}
