import {
  MatchEntity,
  TowerEntity,
  MatchLogEvent,
  TeamData,
  PlayerRole
} from '../types';
import { CHAMPIONS_DATABASE } from '../core/data/championsDatabase';
import { MOBA_ITEMS_DB } from '../core/data/mobaItems';
import { CURRENT_PATCH_NOTES } from '../core/data/patchNotes';
import {
  INITIAL_TOWERS,
  MOBA_LANES,
  JUNGLE_CAMPS,
  OBJECTIVE_PITS,
  MapWaypoint
} from './mobaMapData';
import { CombatCalculator } from '../core/calculators/combatCalculator';

export type TacticalOrderType = 'standard' | 'all_in' | 'objective' | 'defend';
export type AIDifficultyLevel = 'easy' | 'normal' | 'hard' | 'world_class';
export type MatchControlMode = 'vs_ai' | 'dual_coach';

export interface MatchConfigOptions {
  aiDifficulty: AIDifficultyLevel;
  controlMode: MatchControlMode;
  isTutorial?: boolean;
}

export interface NexusStructure {
  team: 'blue' | 'red';
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  isVulnerable: boolean;
}

export interface CombatVisualEvent {
  id: string;
  type: 'projectile' | 'slash' | 'shockwave' | 'tower_laser' | 'floating_text';
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  team: 'blue' | 'red' | 'neutral';
  text?: string;
  subType?: 'damage' | 'crit' | 'gold' | 'skill' | 'objective';
  createdAt: number;
}

export interface MinionWaveEntity {
  id: string;
  team: 'blue' | 'red';
  lane: 'top' | 'mid' | 'bot';
  progress: number; // 0.0 (Blue Nexus) -> 1.0 (Red Nexus) along lane polyline
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  isEngaged: boolean;
}

export interface NeutralObjectiveBoss {
  type: 'dragon' | 'baron';
  name: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  isAlive: boolean;
  spawnTime: number;
}

interface EntityRuntimeState {
  attackCooldown: number;
  skillCooldown: number;
  attackCounter: number;
  jungleCampIdx: number;
  campClearProgress: number;
  assignedLane: 'top' | 'mid' | 'bot';
  aiState:
    | 'LANE_ADVANCE'
    | 'WAVE_CLEAR'
    | 'CHAMPION_DUEL'
    | 'TOWER_SIEGE'
    | 'NEXUS_ASSAULT'
    | 'JUNGLE_PATH'
    | 'TACTICAL_ROAM'
    | 'OBJECTIVE_CONTEST'
    | 'RETREAT_HEAL';
}

export class MatchEngine {
  public gameTime: number = 0; // Realistic seconds (1x = 1s per real second)
  public blueKills: number = 0;
  public redKills: number = 0;
  public blueGold: number = 2500;
  public redGold: number = 2500;
  public blueDragons: number = 0;
  public redDragons: number = 0;
  public blueBarons: number = 0;
  public redBarons: number = 0;
  public entities: MatchEntity[] = [];
  public towers: TowerEntity[] = [];
  public blueNexus: NexusStructure = {
    team: 'blue',
    x: 12,
    y: 88,
    health: 5000,
    maxHealth: 5000,
    isVulnerable: false
  };
  public redNexus: NexusStructure = {
    team: 'red',
    x: 88,
    y: 12,
    health: 5000,
    maxHealth: 5000,
    isVulnerable: false
  };
  public minionWaves: MinionWaveEntity[] = [];
  public dragonBoss: NeutralObjectiveBoss = {
    type: 'dragon',
    name: 'Ancient Dragon',
    x: OBJECTIVE_PITS.dragon.x,
    y: OBJECTIVE_PITS.dragon.y,
    health: 4000,
    maxHealth: 4000,
    isAlive: false,
    spawnTime: 30
  };
  public baronBoss: NeutralObjectiveBoss = {
    type: 'baron',
    name: 'Baron Nashor',
    x: OBJECTIVE_PITS.baron.x,
    y: OBJECTIVE_PITS.baron.y,
    health: 6500,
    maxHealth: 6500,
    isAlive: false,
    spawnTime: 90
  };
  public events: MatchLogEvent[] = [];
  public combatVisuals: CombatVisualEvent[] = [];
  public winner: 'blue' | 'red' | null = null;
  public isRunning: boolean = true;
  public speed: number = 1;
  public isTutorialMatch: boolean = false;
  public aiDifficulty: AIDifficultyLevel = 'normal';
  public controlMode: MatchControlMode = 'vs_ai';
  public tacticalOrder: TacticalOrderType = 'standard';
  public redTacticalOrder: TacticalOrderType = 'standard';
  public announcerBanner: { text: string; subText?: string; team: 'blue' | 'red' | 'neutral' } | null = null;

  private runtimeMap: Record<string, EntityRuntimeState> = {};
  private towerCooldowns: Record<string, number> = {};
  private nexusCooldowns: { blue: number; red: number } = { blue: 0, red: 0 };
  private nextWaveSpawnTime: number = 1;
  private waveCounter: number = 0;
  private visualSeq: number = 0;
  private onStateChangeCallback?: () => void;
  private firstBloodTaken: boolean = false;
  private blueTeamData: TeamData;
  private redTeamData: TeamData;

  constructor(
    blueTeam: TeamData,
    redTeam: TeamData,
    onStateChange?: () => void,
    isTutorial: boolean = false,
    config?: Partial<MatchConfigOptions>
  ) {
    this.onStateChangeCallback = onStateChange;
    this.isTutorialMatch = isTutorial;
    this.blueTeamData = blueTeam;
    this.redTeamData = redTeam;
    if (config?.aiDifficulty) this.aiDifficulty = config.aiDifficulty;
    if (config?.controlMode) this.controlMode = config.controlMode;
    this.reset(blueTeam, redTeam, isTutorial, config);
  }

  public reset(
    blueTeam: TeamData,
    redTeam: TeamData,
    isTutorial: boolean = false,
    config?: Partial<MatchConfigOptions>
  ) {
    this.gameTime = 0;
    this.blueKills = 0;
    this.redKills = 0;
    this.blueGold = 2500;
    this.redGold = 2500;
    this.blueDragons = 0;
    this.redDragons = 0;
    this.blueBarons = 0;
    this.redBarons = 0;
    this.winner = null;
    this.isRunning = true;
    this.firstBloodTaken = false;
    this.announcerBanner = null;
    this.tacticalOrder = 'standard';
    this.redTacticalOrder = 'standard';
    this.isTutorialMatch = isTutorial;
    if (config?.aiDifficulty) this.aiDifficulty = config.aiDifficulty;
    if (config?.controlMode) this.controlMode = config.controlMode;
    this.blueTeamData = blueTeam;
    this.redTeamData = redTeam;
    this.events = [];
    this.combatVisuals = [];
    this.minionWaves = [];
    this.runtimeMap = {};
    this.towerCooldowns = {};
    this.nexusCooldowns = { blue: 0, red: 0 };
    this.nextWaveSpawnTime = 1;
    this.waveCounter = 0;
    this.towers = JSON.parse(JSON.stringify(INITIAL_TOWERS));

    this.blueNexus = {
      team: 'blue',
      x: 12,
      y: 88,
      health: 5000,
      maxHealth: 5000,
      isVulnerable: false
    };
    this.redNexus = {
      team: 'red',
      x: 88,
      y: 12,
      health: 5000,
      maxHealth: 5000,
      isVulnerable: false
    };

    this.dragonBoss = {
      type: 'dragon',
      name: 'Ancient Dragon',
      x: OBJECTIVE_PITS.dragon.x,
      y: OBJECTIVE_PITS.dragon.y,
      health: 4000,
      maxHealth: 4000,
      isAlive: true,
      spawnTime: 0
    };

    this.baronBoss = {
      type: 'baron',
      name: 'Baron Nashor',
      x: OBJECTIVE_PITS.baron.x,
      y: OBJECTIVE_PITS.baron.y,
      health: 6500,
      maxHealth: 6500,
      isAlive: false,
      spawnTime: 75
    };

    const roles: PlayerRole[] = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'];
    const diffMult = this.getDifficultyMultiplier();

    const createTeamEntities = (teamData: TeamData, side: 'blue' | 'red'): MatchEntity[] => {
      return roles.map((role, idx) => {
        const playerId = teamData.selectedLineup[role];
        const rawPlayer =
          teamData.roster.find((p) => p.id === playerId) ||
          teamData.roster.find((p) => p.role === role) ||
          teamData.roster[idx] ||
          teamData.roster[0];

        // Scale enemy AI stats based on selected AI Difficulty
        const player =
          side === 'red' && this.controlMode === 'vs_ai'
            ? {
                ...rawPlayer,
                stats: {
                  mechanics: Math.min(99, Math.round(rawPlayer.stats.mechanics * diffMult.statScale)),
                  mapAwareness: Math.min(99, Math.round(rawPlayer.stats.mapAwareness * diffMult.statScale)),
                  teamwork: Math.min(99, Math.round(rawPlayer.stats.teamwork * diffMult.statScale)),
                  professionalism: rawPlayer.stats.professionalism,
                  clutch: Math.min(99, Math.round(rawPlayer.stats.clutch * diffMult.statScale)),
                  consistency: Math.min(99, Math.round(rawPlayer.stats.consistency * diffMult.statScale)),
                  stamina: rawPlayer.stats.stamina
                }
              }
            : rawPlayer;

        const assignedChampId = teamData.assignedChampions?.[role];
        let champ = CHAMPIONS_DATABASE.find((c) => c.id === assignedChampId);
        if (!champ) {
          const roleChamps = CHAMPIONS_DATABASE.filter((c) =>
            this.mapRoleToChampionRole(role).includes(c.role)
          );
          champ = roleChamps[(side === 'blue' ? idx : idx + 2) % roleChamps.length] || CHAMPIONS_DATABASE[0];
        }

        const baseLane = this.getBaseRoleLane(role);
        const startProgress = side === 'blue' ? 0.28 : 0.72;
        const startPos =
          role === 'Jungle'
            ? side === 'blue'
              ? { x: 26, y: 56 }
              : { x: 74, y: 44 }
            : this.getPointAtLaneProgress(
                baseLane,
                startProgress,
                role === 'Support' ? 2.2 : role === 'ADC' ? -1.5 : 0
              );

        const entityId = `${side}_${role}`;

        this.runtimeMap[entityId] = {
          attackCooldown: 0.3 + idx * 0.1,
          skillCooldown: 1.8 + idx * 0.25,
          attackCounter: 0,
          jungleCampIdx: 0,
          campClearProgress: 0,
          assignedLane: baseLane,
          aiState: role === 'Jungle' ? 'JUNGLE_PATH' : 'LANE_ADVANCE'
        };

        const staminaBonusHp = Math.round((player.stats.stamina - 50) * 4.5);
        const rawMaxHp = Math.max(850, champ.baseHealth + staminaBonusHp);
        const finalMaxHp =
          side === 'blue' && isTutorial
            ? Math.round(rawMaxHp * 1.25)
            : side === 'red' && this.controlMode === 'vs_ai'
              ? Math.round(rawMaxHp * diffMult.hpScale)
              : rawMaxHp;

        return {
          id: entityId,
          name: player.inGameName,
          team: side,
          role,
          player,
          champion: champ,
          x: startPos.x,
          y: startPos.y,
          targetX: startPos.x,
          targetY: startPos.y,
          currentHealth: finalMaxHp,
          maxHealth: finalMaxHp,
          isDead: false,
          respawnTimer: 0,
          kills: 0,
          deaths: 0,
          assists: 0,
          cs: 0,
          gold: 500,
          items: [],
          currentAction: role === 'Jungle' ? 'เริ่มเคลียร์แคมป์ป่า' : `เดินคุมเลน ${baseLane.toUpperCase()}`
        };
      });
    };

    const blueEntities = createTeamEntities(blueTeam, 'blue');
    const redEntities = createTeamEntities(redTeam, 'red');
    this.entities = [...blueEntities, ...redEntities];

    this.spawnMinionWaves();

    const diffLabel =
      this.controlMode === 'dual_coach'
        ? 'โหมดดวลโค้ช 2 ผู้เล่น (Dual Coach PvP)'
        : `AI ระดับ ${this.aiDifficulty.toUpperCase()}`;

    this.addLog(
      'info',
      `--- เริ่มการแข่งขัน ${blueTeam.name} ปะทะ ${redTeam.name} (${diffLabel}) | เป้าหมาย: ทำลาย Nexus ฝ่ายตรงข้าม! ---`
    );
    this.notify();
  }

  public getDifficultyMultiplier() {
    switch (this.aiDifficulty) {
      case 'easy':
        return { statScale: 0.82, hpScale: 0.88, dmgScale: 0.82, prizeBonus: 3500 };
      case 'hard':
        return { statScale: 1.12, hpScale: 1.08, dmgScale: 1.12, prizeBonus: 8500 };
      case 'world_class':
        return { statScale: 1.25, hpScale: 1.18, dmgScale: 1.22, prizeBonus: 12500 };
      case 'normal':
      default:
        return { statScale: 1.0, hpScale: 1.0, dmgScale: 1.0, prizeBonus: 5500 };
    }
  }

  public setTacticalOrder(order: TacticalOrderType, team: 'blue' | 'red' = 'blue') {
    if (team === 'blue') {
      if (this.tacticalOrder === order) return;
      this.tacticalOrder = order;
    } else {
      if (this.redTacticalOrder === order) return;
      this.redTacticalOrder = order;
    }

    const teamLabel = team === 'blue' ? this.blueTeamData.shortName : this.redTeamData.shortName;
    const orderLabels: Record<TacticalOrderType, string> = {
      standard: `⚖️ [${teamLabel}] ปรับแผน: คุมโซนมาตรฐานและดันเลนตามจังหวะเวฟ`,
      all_in: `⚔️ [${teamLabel}] สั่งบุกทะลวง: โฟกัสโจมตีป้อมและ Nexus ศัตรู!`,
      objective: `🐉 [${teamLabel}] สั่งรวมพล: เคลื่อนทัพยึด Dragon / Baron Pit ทันที!`,
      defend: `🛡️ [${teamLabel}] สั่งตั้งรับ: ถอยร่นรักษาแนวป้องกันหน้าป้อมและฐานทัพ`
    };

    this.addLog('info', orderLabels[order], team);
    this.pushVisual({
      type: 'floating_text',
      fromX: 50,
      fromY: team === 'blue' ? 54 : 46,
      toX: 50,
      toY: team === 'blue' ? 48 : 40,
      team,
      text:
        order === 'all_in'
          ? `⚔️ ${teamLabel} ALL-IN SIEGE`
          : order === 'objective'
            ? `🐉 ${teamLabel} OBJECTIVE CALL`
            : order === 'defend'
              ? `🛡️ ${teamLabel} DEFENSE`
              : `⚖️ ${teamLabel} STANDARD`,
      subType: 'objective'
    });
    this.notify();
  }

  private pushVisual(event: Omit<CombatVisualEvent, 'id' | 'createdAt'>) {
    this.visualSeq += 1;
    this.combatVisuals.push({
      ...event,
      id: `vis_${this.visualSeq}`,
      createdAt: Date.now()
    });
    if (this.combatVisuals.length > 75) {
      this.combatVisuals.splice(0, this.combatVisuals.length - 75);
    }
  }

  public consumeRecentVisuals(maxAgeMs: number = 850): CombatVisualEvent[] {
    const now = Date.now();
    this.combatVisuals = this.combatVisuals.filter((v) => now - v.createdAt < maxAgeMs);
    return this.combatVisuals;
  }

  private mapRoleToChampionRole(role: PlayerRole): string[] {
    switch (role) {
      case 'Top': return ['Tank', 'Assassin'];
      case 'Jungle': return ['Assassin', 'Tank', 'Marksman'];
      case 'Mid': return ['Mage', 'Assassin'];
      case 'ADC': return ['Marksman'];
      case 'Support': return ['Support', 'Tank'];
    }
  }

  private getBaseRoleLane(role: PlayerRole): 'top' | 'mid' | 'bot' {
    if (role === 'Top') return 'top';
    if (role === 'Mid' || role === 'Jungle') return 'mid';
    return 'bot';
  }

  /**
   * คำนวณพิกัด (x, y) บนเส้นทางเลนจากค่าความคืบหน้า s (0.00 = Blue Nexus -> 1.00 = Red Nexus)
   * แก้ปัญหา ADC และ Support ติดมุมฉากหรือยืนนิ่งหลังป้อม 100%
   */
  public getPointAtLaneProgress(
    lane: 'top' | 'mid' | 'bot',
    progress: number,
    lateralOffset: number = 0
  ): MapWaypoint {
    const waypoints = MOBA_LANES[lane];
    const clampedS = Math.max(0.02, Math.min(0.98, progress));

    // Calculate segment lengths
    const segLengths: number[] = [];
    let totalLen = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const d = Math.hypot(
        waypoints[i + 1].x - waypoints[i].x,
        waypoints[i + 1].y - waypoints[i].y
      );
      segLengths.push(d);
      totalLen += d;
    }

    const targetDist = clampedS * totalLen;
    let accum = 0;

    for (let i = 0; i < segLengths.length; i++) {
      const segLen = segLengths[i];
      if (accum + segLen >= targetDist || i === segLengths.length - 1) {
        const localT = segLen > 0 ? (targetDist - accum) / segLen : 0;
        const p0 = waypoints[i];
        const p1 = waypoints[i + 1];
        const x = p0.x + (p1.x - p0.x) * localT;
        const y = p0.y + (p1.y - p0.y) * localT;

        if (lateralOffset !== 0 && segLen > 0) {
          const nx = -(p1.y - p0.y) / segLen;
          const ny = (p1.x - p0.x) / segLen;
          return { x: x + nx * lateralOffset, y: y + ny * lateralOffset };
        }
        return { x, y };
      }
      accum += segLen;
    }

    return { x: waypoints[0].x, y: waypoints[0].y };
  }

  /**
   * แปลงพิกัด (x, y) ของป้อมหรือยูนิตเป็นค่าความคืบหน้า s (0.0 -> 1.0) บนเส้นทางเลน
   */
  private getProgressOfPointOnLane(lane: 'top' | 'mid' | 'bot', px: number, py: number): number {
    const waypoints = MOBA_LANES[lane];
    let totalLen = 0;
    const segLengths: number[] = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
      const d = Math.hypot(
        waypoints[i + 1].x - waypoints[i].x,
        waypoints[i + 1].y - waypoints[i].y
      );
      segLengths.push(d);
      totalLen += d;
    }

    let bestDist = 9999;
    let bestS = 0.5;
    let accum = 0;

    for (let i = 0; i < segLengths.length; i++) {
      const p0 = waypoints[i];
      const p1 = waypoints[i + 1];
      const segLen = segLengths[i];
      if (segLen > 0) {
        const vx = p1.x - p0.x;
        const vy = p1.y - p0.y;
        const wx = px - p0.x;
        const wy = py - p0.y;
        const proj = Math.max(0, Math.min(1, (wx * vx + wy * vy) / (segLen * segLen)));
        const cx = p0.x + vx * proj;
        const cy = p0.y + vy * proj;
        const d = Math.hypot(px - cx, py - cy);
        if (d < bestDist) {
          bestDist = d;
          bestS = (accum + proj * segLen) / totalLen;
        }
      }
      accum += segLen;
    }

    return bestS;
  }

  /**
   * ตรวจสอบว่าเลนใดที่ป้อมแตกหมดแล้ว เพื่อสั่งให้ ADC/Support/Top โรเตชั่นไปช่วยตีเลนอื่นหรือบุก Nexus!
   */
  private selectSmartLaneForRole(
    team: 'blue' | 'red',
    role: PlayerRole
  ): 'top' | 'mid' | 'bot' {
    const defaultLane = this.getBaseRoleLane(role);
    const enemyTeam = team === 'blue' ? 'red' : 'blue';

    // Check if enemy towers in defaultLane are still standing
    const defaultLaneEnemyTowers = this.towers.filter(
      (t) => t.team === enemyTeam && t.lane === defaultLane && !t.isDestroyed
    );

    if (defaultLaneEnemyTowers.length > 0) {
      return defaultLane;
    }

    // If default lane towers are completely destroyed:
    // Check if other lanes still have Tier 1 towers to help push, or push straight through cleared lane to Nexus!
    const midEnemyTowers = this.towers.filter(
      (t) => t.team === enemyTeam && t.lane === 'mid' && !t.isDestroyed
    );
    if (midEnemyTowers.length > 0 && this.gameTime < 140) {
      return 'mid';
    }

    return defaultLane; // Push down the cleared lane directly to Enemy Nexus!
  }

  private spawnMinionWaves() {
    this.waveCounter += 1;
    const lanes: ('top' | 'mid' | 'bot')[] = ['top', 'mid', 'bot'];

    for (const lane of lanes) {
      const blueStart = this.getPointAtLaneProgress(lane, 0.05);
      this.minionWaves.push({
        id: `wave_b_${lane}_${this.waveCounter}`,
        team: 'blue',
        lane,
        progress: 0.05,
        x: blueStart.x,
        y: blueStart.y,
        health: 500 + this.waveCounter * 15,
        maxHealth: 500 + this.waveCounter * 15,
        isEngaged: false
      });

      const redStart = this.getPointAtLaneProgress(lane, 0.95);
      this.minionWaves.push({
        id: `wave_r_${lane}_${this.waveCounter}`,
        team: 'red',
        lane,
        progress: 0.95,
        x: redStart.x,
        y: redStart.y,
        health: 500 + this.waveCounter * 15,
        maxHealth: 500 + this.waveCounter * 15,
        isEngaged: false
      });
    }
  }

  private processMinionWaves(dt: number) {
    if (this.gameTime >= this.nextWaveSpawnTime) {
      this.spawnMinionWaves();
      this.nextWaveSpawnTime = this.gameTime + 22;
    }

    // Progress speed along polyline (0..1)
    const progressRate = 0.048;

    for (const wave of this.minionWaves) {
      if (wave.health <= 0) continue;

      const enemyWave = this.minionWaves.find(
        (w) =>
          w.team !== wave.team &&
          w.lane === wave.lane &&
          w.health > 0 &&
          Math.hypot(w.x - wave.x, w.y - wave.y) <= 6.0
      );

      const enemyTower = this.towers.find(
        (t) =>
          t.team !== wave.team &&
          t.lane === wave.lane &&
          !t.isDestroyed &&
          Math.hypot(t.x - wave.x, t.y - wave.y) <= 6.5
      );

      const enemyNexus = wave.team === 'blue' ? this.redNexus : this.blueNexus;
      const atEnemyNexus =
        enemyNexus.isVulnerable &&
        Math.hypot(enemyNexus.x - wave.x, enemyNexus.y - wave.y) <= 7.5;

      if (enemyWave) {
        wave.isEngaged = true;
        const minionDps =
          (wave.team === 'blue' && this.blueBarons > 0) ||
          (wave.team === 'red' && this.redBarons > 0)
            ? 105
            : 65;
        enemyWave.health -= minionDps * dt;
        if (enemyWave.health <= 0) {
          this.rewardNearbyChampionsForWaveClear(wave.team, enemyWave.x, enemyWave.y);
        }
        continue;
      }

      if (enemyTower) {
        wave.isEngaged = true;
        const siegeDps =
          (wave.team === 'blue' && this.blueBarons > 0) ||
          (wave.team === 'red' && this.redBarons > 0)
            ? 95
            : 48;
        enemyTower.health = Math.max(0, enemyTower.health - siegeDps * dt);
        if (enemyTower.health <= 0 && !enemyTower.isDestroyed) {
          this.handleTowerDestroyed(enemyTower, wave.team);
        }
        continue;
      }

      if (atEnemyNexus) {
        wave.isEngaged = true;
        const nexusDps =
          (wave.team === 'blue' && this.blueBarons > 0) ||
          (wave.team === 'red' && this.redBarons > 0)
            ? 110
            : 55;
        enemyNexus.health = Math.max(0, enemyNexus.health - nexusDps * dt);
        continue;
      }

      wave.isEngaged = false;
      if (wave.team === 'blue') {
        wave.progress = Math.min(0.95, wave.progress + progressRate * dt);
      } else {
        wave.progress = Math.max(0.05, wave.progress - progressRate * dt);
      }

      const pt = this.getPointAtLaneProgress(wave.lane, wave.progress);
      wave.x = pt.x;
      wave.y = pt.y;
    }

    this.minionWaves = this.minionWaves.filter((w) => w.health > 0);
  }

  private rewardNearbyChampionsForWaveClear(team: 'blue' | 'red', wx: number, wy: number) {
    const nearbyAllies = this.entities.filter(
      (e) => e.team === team && !e.isDead && Math.hypot(e.x - wx, e.y - wy) <= 18
    );

    if (nearbyAllies.length === 0) return;

    const primaryFarmer =
      nearbyAllies.find((e) => e.role !== 'Support') || nearbyAllies[0];
    const supportAlly = nearbyAllies.find((e) => e.role === 'Support' && e.id !== primaryFarmer.id);

    const csGain = primaryFarmer.player.stats.mechanics >= 75 ? 4 : 3;
    const goldGain = csGain * 25;

    primaryFarmer.cs += csGain;
    primaryFarmer.gold += goldGain;
    if (team === 'blue') this.blueGold += goldGain;
    else this.redGold += goldGain;

    // Support relic/assist gold sharing
    if (supportAlly) {
      const supGold = Math.round(goldGain * 0.45);
      supportAlly.gold += supGold;
      if (team === 'blue') this.blueGold += supGold;
      else this.redGold += supGold;
      this.checkItemPurchase(supportAlly);
    }

    this.pushVisual({
      type: 'floating_text',
      fromX: primaryFarmer.x,
      fromY: primaryFarmer.y - 2,
      toX: primaryFarmer.x,
      toY: primaryFarmer.y - 6,
      team,
      text: `+${goldGain}G (${csGain} CS)`,
      subType: 'gold'
    });

    this.checkItemPurchase(primaryFarmer);
  }

  /**
   * คำนวณค่าความคืบหน้าแนวรบ (Frontline Progress s in 0..1) ของแต่ละเลนอย่างแม่นยำ
   * ทำให้ ADC, Support, Mid, Top เดินหน้าไปตามเวฟและตีป้อมจนถึง Nexus โดยไม่ติดหลังป้อม
   */
  private getLaneFrontlineProgress(team: 'blue' | 'red', lane: 'top' | 'mid' | 'bot'): number {
    const enemyTeam = team === 'blue' ? 'red' : 'blue';

    // 1. Find first standing enemy tower in this lane
    const enemyTowers = this.towers
      .filter((t) => t.team === enemyTeam && t.lane === lane && !t.isDestroyed)
      .sort((a, b) => a.tier - b.tier);

    let maxAllowedProgress = team === 'blue' ? 0.93 : 0.07; // Default: right in front of enemy Nexus

    if (enemyTowers.length > 0) {
      const firstTower = enemyTowers[0];
      const towerS = this.getProgressOfPointOnLane(lane, firstTower.x, firstTower.y);
      maxAllowedProgress = team === 'blue' ? towerS - 0.045 : towerS + 0.045;
    }

    // 2. Find furthest allied minion wave in this lane
    const alliedWaves = this.minionWaves.filter(
      (w) => w.team === team && w.lane === lane && w.health > 0
    );

    if (alliedWaves.length > 0) {
      if (team === 'blue') {
        const furthestWaveS = Math.max(...alliedWaves.map((w) => w.progress));
        // Advance with wave (at least past own T1 tower 0.42 so they never sit behind own tower!)
        const activeS = Math.max(0.44, furthestWaveS);
        return Math.min(maxAllowedProgress, activeS);
      } else {
        const furthestWaveS = Math.min(...alliedWaves.map((w) => w.progress));
        const activeS = Math.min(0.56, furthestWaveS);
        return Math.max(maxAllowedProgress, activeS);
      }
    }

    return maxAllowedProgress;
  }

  private updateNexusVulnerability() {
    const lanes: ('top' | 'mid' | 'bot')[] = ['top', 'mid', 'bot'];

    // Red Nexus is vulnerable if ANY lane has lost both Red T1 and Red T2 towers
    const redLaneBreached = lanes.some(
      (lane) =>
        this.towers.filter((t) => t.team === 'red' && t.lane === lane && !t.isDestroyed).length === 0
    );
    if (redLaneBreached && !this.redNexus.isVulnerable) {
      this.redNexus.isVulnerable = true;
      this.addLog(
        'objective',
        `🚨 แนวป้องกันฐานทัพของ ${this.redTeamData.name} แตกแล้ว! ตอนนี้สามารถโจมตี RED NEXUS ได้โดยตรง!`,
        'blue'
      );
    }

    // Blue Nexus is vulnerable if ANY lane has lost both Blue T1 and Blue T2 towers
    const blueLaneBreached = lanes.some(
      (lane) =>
        this.towers.filter((t) => t.team === 'blue' && t.lane === lane && !t.isDestroyed).length === 0
    );
    if (blueLaneBreached && !this.blueNexus.isVulnerable) {
      this.blueNexus.isVulnerable = true;
      this.addLog(
        'objective',
        `🚨 แนวป้องกันฐานทัพของ ${this.blueTeamData.name} แตกแล้ว! ศัตรูกำลังบุกโจมตี BLUE NEXUS!`,
        'red'
      );
    }
  }

  /**
   * AI Coach อัตโนมัติสำหรับฝั่ง Red (เมื่อเล่นโหมด vs AI)
   * ปรับความฉลาดตามระดับความยาก (Easy / Normal / Hard / World Class)
   */
  private updateRedTeamAIOrder() {
    if (this.controlMode === 'dual_coach') return;

    const redAlive = this.entities.filter((e) => e.team === 'red' && !e.isDead).length;
    const blueAlive = this.entities.filter((e) => e.team === 'blue' && !e.isDead).length;

    if (this.blueNexus.isVulnerable && redAlive >= 3) {
      this.redTacticalOrder = 'all_in';
      return;
    }

    if (
      (this.aiDifficulty === 'hard' || this.aiDifficulty === 'world_class') &&
      (this.baronBoss.isAlive || this.dragonBoss.isAlive) &&
      redAlive > blueAlive &&
      this.gameTime > 45
    ) {
      this.redTacticalOrder = 'objective';
      return;
    }

    if (redAlive <= 2 && blueAlive >= 4 && this.aiDifficulty !== 'easy') {
      this.redTacticalOrder = 'defend';
      return;
    }

    this.redTacticalOrder = 'standard';
  }

  /**
   * เดินเวลาเกมพื้นฐานแบบสมจริง (1x = 0.05 วินาทีต่อ Tick 50ms = 1 วินาทีจริงต่อ 1 วินาทีในเกม)
   */
  public tick(deltaTime: number = 0.05) {
    if (this.winner || !this.isRunning) return;

    const scaledDt = deltaTime * this.speed;
    this.gameTime += scaledDt;

    // 1. Passive Team Economy
    this.blueGold += Math.round(scaledDt * 5.0);
    this.redGold += Math.round(scaledDt * 5.0);

    // 2. Check Neutral Boss Spawns
    if (!this.dragonBoss.isAlive && this.gameTime >= this.dragonBoss.spawnTime) {
      this.dragonBoss.isAlive = true;
      this.dragonBoss.health = this.dragonBoss.maxHealth;
      this.addLog('info', '🐉 มังกรบรรพกาล (Ancient Dragon) ปรากฏตัวที่หลุมมังกร!', undefined);
    }
    if (!this.baronBoss.isAlive && this.gameTime >= this.baronBoss.spawnTime) {
      this.baronBoss.isAlive = true;
      this.baronBoss.health = this.baronBoss.maxHealth;
      this.addLog('info', '👑 บารอนนาชอร์ (Baron Nashor) ปรากฏตัวที่หลุมบารอน!', undefined);
    }

    // 3. Update Nexus Vulnerability & AI Coach Macro
    this.updateNexusVulnerability();
    this.updateRedTeamAIOrder();

    // 4. Process Minion Waves
    this.processMinionWaves(scaledDt);

    // 5. Process Multi-Dimensional Smart Champion AI & Combat
    this.processChampionsMultiDimensionalAI(scaledDt);

    // 6. Process Tower & Nexus Defense Lasers
    this.processStructureDefenses(scaledDt);

    // 7. Check Nexus Destruction Victory Condition
    this.checkVictoryCondition();

    this.notify();
  }

  /**
   * เคลื่อนที่ฮีโร่: หากอยู่ในเลนเดียวกันและอยู่ห่างกันมาก จะเดินเลียบตามเส้นโค้งของเลน (Polyline)
   * เพื่อไม่ให้เดินตัดทะลุกำแพงหรือติดหลังป้อม
   */
  private moveChampionSmartly(
    entity: MatchEntity,
    destX: number,
    destY: number,
    baseSpeed: number,
    dt: number,
    laneForPathing?: 'top' | 'mid' | 'bot'
  ) {
    entity.targetX = Math.max(8, Math.min(92, destX));
    entity.targetY = Math.max(8, Math.min(92, destY));

    let nextX = entity.targetX;
    let nextY = entity.targetY;

    // If pathing along Top or Bot lane over a long distance, step along the lane polyline curve!
    if (laneForPathing && laneForPathing !== 'mid') {
      const distDirect = Math.hypot(entity.targetX - entity.x, entity.targetY - entity.y);
      if (distDirect > 14) {
        const curS = this.getProgressOfPointOnLane(laneForPathing, entity.x, entity.y);
        const targetS = this.getProgressOfPointOnLane(
          laneForPathing,
          entity.targetX,
          entity.targetY
        );
        const stepS =
          targetS > curS
            ? Math.min(targetS, curS + 0.14)
            : Math.max(targetS, curS - 0.14);
        const lateral =
          entity.role === 'Support' ? 2.0 : entity.role === 'ADC' ? -1.4 : 0;
        const wp = this.getPointAtLaneProgress(laneForPathing, stepS, lateral);
        nextX = wp.x;
        nextY = wp.y;
      }
    }

    const dx = nextX - entity.x;
    const dy = nextY - entity.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 0.1) {
      const hasBoots = entity.items.some((i) => i.id === 'item_boots');
      const speed = baseSpeed * (hasBoots ? 1.2 : 1.0);
      const step = Math.min(dist, speed * dt);
      entity.x = Math.max(8, Math.min(92, entity.x + (dx / dist) * step));
      entity.y = Math.max(8, Math.min(92, entity.y + (dy / dist) * step));
    }
  }

  private processChampionsMultiDimensionalAI(dt: number) {
    for (const unit of this.entities) {
      const rt = this.runtimeMap[unit.id];
      if (!rt) continue;

      rt.attackCooldown = Math.max(0, rt.attackCooldown - dt);
      rt.skillCooldown = Math.max(0, rt.skillCooldown - dt);

      if (unit.castingSkill && rt.skillCooldown < 3.0) {
        unit.castingSkill = undefined;
      }

      // Respawn Logic
      if (unit.isDead) {
        unit.respawnTimer -= dt;
        if (unit.respawnTimer <= 0) {
          unit.isDead = false;
          unit.currentHealth = unit.maxHealth;
          const spawnPos = unit.team === 'blue' ? { x: 12, y: 88 } : { x: 88, y: 12 };
          unit.x = spawnPos.x;
          unit.y = spawnPos.y;
          unit.targetX = spawnPos.x;
          unit.targetY = spawnPos.y;
          rt.aiState = unit.role === 'Jungle' ? 'JUNGLE_PATH' : 'LANE_ADVANCE';
          this.addLog(
            'info',
            `${unit.name} (${unit.champion.name}) ฟื้นคืนชีพพร้อมกลับเข้าสู่สนามรบ`,
            unit.team
          );
        }
        continue;
      }

      const hpRatio = unit.currentHealth / unit.maxHealth;
      const isBlue = unit.team === 'blue';
      const activeTeamOrder = isBlue ? this.tacticalOrder : this.redTacticalOrder;
      const isRanged =
        unit.champion.role === 'Marksman' ||
        unit.champion.role === 'Mage' ||
        unit.champion.role === 'Support';
      const attackRange = isRanged ? 9.5 : 4.8;

      // Dynamically update assigned lane (rotates to Mid/Nexus if own lane towers are cleared!)
      rt.assignedLane = this.selectSmartLaneForRole(unit.team, unit.role);
      const lane = rt.assignedLane;

      // Fountain & Friendly Tower Healing Aura
      const friendlyBase = isBlue ? { x: 12, y: 88 } : { x: 88, y: 12 };
      const enemyNexus = isBlue ? this.redNexus : this.blueNexus;
      const distToBase = Math.hypot(unit.x - friendlyBase.x, unit.y - friendlyBase.y);
      const nearFriendlyTower = this.towers.find(
        (t) =>
          t.team === unit.team &&
          !t.isDestroyed &&
          Math.hypot(t.x - unit.x, t.y - unit.y) <= 8.5
      );

      if (distToBase <= 10) {
        unit.currentHealth = Math.min(unit.maxHealth, unit.currentHealth + 260 * dt);
        this.checkItemPurchase(unit);
      } else if (nearFriendlyTower) {
        unit.currentHealth = Math.min(unit.maxHealth, unit.currentHealth + 45 * dt);
      }

      // Support Active Heal / Shield Aura for nearby injured ADC or teammates
      if (unit.role === 'Support') {
        const injuredAlly = this.entities.find(
          (a) =>
            a.team === unit.team &&
            a.id !== unit.id &&
            !a.isDead &&
            a.currentHealth < a.maxHealth * 0.85 &&
            Math.hypot(a.x - unit.x, a.y - unit.y) <= 12
        );
        if (injuredAlly) {
          const healRate = 24 + unit.player.stats.teamwork * 0.35;
          injuredAlly.currentHealth = Math.min(
            injuredAlly.maxHealth,
            injuredAlly.currentHealth + healRate * dt
          );
        }
      }

      // ======================================================================
      // DIMENSION 1: TACTICAL RETREAT WHEN CRITICAL HP
      // ======================================================================
      const retreatThreshold = activeTeamOrder === 'all_in' ? 0.12 : 0.24;
      if (hpRatio < retreatThreshold || (rt.aiState === 'RETREAT_HEAL' && hpRatio < 0.75)) {
        rt.aiState = 'RETREAT_HEAL';
        const safeTower = this.towers
          .filter((t) => t.team === unit.team && !t.isDestroyed && t.lane === lane)
          .sort((a, b) => a.tier - b.tier)[0];

        const retreatProgress = safeTower
          ? this.getProgressOfPointOnLane(lane, safeTower.x, safeTower.y) +
            (isBlue ? -0.04 : 0.04)
          : isBlue
            ? 0.04
            : 0.96;

        const retreatPt = this.getPointAtLaneProgress(lane, retreatProgress);
        unit.currentAction = 'ถอยฟื้นฟูพลังชีวิตแนวหลัง';
        this.moveChampionSmartly(unit, retreatPt.x, retreatPt.y, 11.5, dt, lane);
        continue;
      }

      // ======================================================================
      // DIMENSION 2: OBJECTIVE CONTEST (Dragon / Baron Pit)
      // ======================================================================
      const dragonNearby =
        this.dragonBoss.isAlive &&
        (unit.role === 'Jungle' || unit.role === 'Support' || unit.role === 'ADC') &&
        Math.hypot(unit.x - this.dragonBoss.x, unit.y - this.dragonBoss.y) <= 22 &&
        this.gameTime > 38;

      const shouldDoObjective =
        activeTeamOrder === 'objective' ||
        (unit.role === 'Jungle' && this.dragonBoss.isAlive && rt.jungleCampIdx >= 2) ||
        (dragonNearby && activeTeamOrder !== 'defend');

      if (shouldDoObjective && (this.dragonBoss.isAlive || this.baronBoss.isAlive)) {
        rt.aiState = 'OBJECTIVE_CONTEST';
        const targetBoss =
          this.baronBoss.isAlive && (this.gameTime > 95 || !this.dragonBoss.isAlive)
            ? this.baronBoss
            : this.dragonBoss;

        const roleIdx = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'].indexOf(unit.role);
        const angle = (roleIdx / 5) * Math.PI * 2 + (isBlue ? 0.35 : -0.35);
        const radius = isRanged ? 5.2 : 2.8;
        const destX = targetBoss.x + Math.cos(angle) * radius;
        const destY = targetBoss.y + Math.sin(angle) * radius;

        this.moveChampionSmartly(unit, destX, destY, 10.8, dt);

        const enemyAtPit = this.findPriorityTargetInRange(unit, 12.5);
        if (enemyAtPit) {
          unit.currentAction = `ปะทะชิงพื้นที่ ${targetBoss.name}`;
          this.executeChampionCombatAttack(unit, enemyAtPit, rt);
        } else if (Math.hypot(unit.x - targetBoss.x, unit.y - targetBoss.y) <= attackRange + 1.8) {
          unit.currentAction = `โจมตีบอส ${targetBoss.name}`;
          this.executeBossAttack(unit, targetBoss, rt);
        } else {
          unit.currentAction = `โรเตชั่นสู่หลุม ${targetBoss.name}`;
        }
        continue;
      }

      // ======================================================================
      // DIMENSION 3: DEFENSIVE TURRET HOLD
      // ======================================================================
      if (activeTeamOrder === 'defend') {
        const defendTower =
          this.towers
            .filter((t) => t.team === unit.team && !t.isDestroyed && t.lane === lane)
            .sort((a, b) => a.tier - b.tier)[0] ||
          this.towers.find((t) => t.team === unit.team && !t.isDestroyed);

        const holdPt = defendTower
          ? { x: defendTower.x, y: defendTower.y }
          : friendlyBase;
        const offset = unit.role === 'Support' ? 2.2 : unit.role === 'ADC' ? -2.0 : 0;

        this.moveChampionSmartly(unit, holdPt.x + offset, holdPt.y - offset, 10.5, dt, lane);
        const enemyNear = this.findPriorityTargetInRange(unit, attackRange + 2.0);
        if (enemyNear) {
          unit.currentAction = `ตั้งรับโจมตี ${enemyNear.name}`;
          this.executeChampionCombatAttack(unit, enemyNear, rt);
        } else {
          unit.currentAction = 'ตรึงแนวป้องกันหน้าป้อม';
        }
        continue;
      }

      // ======================================================================
      // DIMENSION 4: JUNGLER PATHFINDING, CAMP CLEARING & SMART LANE GANKING
      // ======================================================================
      if (unit.role === 'Jungle' && activeTeamOrder === 'standard' && !enemyNexus.isVulnerable) {
        const myCamps = JUNGLE_CAMPS.filter((c) => c.teamSide === unit.team);
        const stepIdx = rt.jungleCampIdx % (myCamps.length + 1);

        if (stepIdx < myCamps.length) {
          rt.aiState = 'JUNGLE_PATH';
          const camp = myCamps[stepIdx];
          const distToCamp = Math.hypot(unit.x - camp.x, unit.y - camp.y);

          if (distToCamp > 2.4) {
            unit.currentAction = `เดินฟาร์มป่า (${camp.name})`;
            this.moveChampionSmartly(unit, camp.x, camp.y, 11.2, dt);
          } else {
            unit.currentAction = `กำลังเคลียร์ ${camp.name}`;
            rt.campClearProgress += dt;
            if (rt.attackCooldown <= 0) {
              rt.attackCooldown = CombatCalculator.calculateAttackInterval(unit.player, unit.champion);
              this.pushVisual({
                type: 'slash',
                fromX: unit.x,
                fromY: unit.y,
                toX: camp.x,
                toY: camp.y,
                team: unit.team
              });
            }
            if (rt.campClearProgress >= 2.6) {
              rt.campClearProgress = 0;
              rt.jungleCampIdx += 1;
              unit.cs += 4;
              unit.gold += 95;
              if (isBlue) this.blueGold += 95;
              else this.redGold += 95;
              this.pushVisual({
                type: 'floating_text',
                fromX: unit.x,
                fromY: unit.y - 2,
                toX: unit.x,
                toY: unit.y - 6,
                team: unit.team,
                text: `+95G (${camp.name})`,
                subType: 'gold'
              });
              this.checkItemPurchase(unit);
            }
          }
          continue;
        } else {
          // Smart Gank Selection: Pick the enemy laner with lowest HP or furthest from their base!
          rt.aiState = 'TACTICAL_ROAM';
          const gankCandidates = this.entities
            .filter((e) => e.team !== unit.team && !e.isDead)
            .sort(
              (a, b) =>
                a.currentHealth / a.maxHealth - b.currentHealth / b.maxHealth
            );
          const gankTarget = gankCandidates[0];

          if (gankTarget) {
            const distGank = Math.hypot(unit.x - gankTarget.x, unit.y - gankTarget.y);
            unit.currentAction = `แก๊งค์เลนกดดัน ${gankTarget.name} (${gankTarget.role})`;
            if (distGank > attackRange * 0.85) {
              this.moveChampionSmartly(unit, gankTarget.x, gankTarget.y, 11.8, dt);
            }
            if (distGank <= attackRange + 1.2) {
              this.executeChampionCombatAttack(unit, gankTarget, rt);
            }
            rt.campClearProgress += dt;
            if (rt.campClearProgress >= 6.0) {
              rt.campClearProgress = 0;
              rt.jungleCampIdx += 1;
            }
            continue;
          }
        }
      }

      // ======================================================================
      // DIMENSION 5: ENEMY NEXUS ASSAULT (When Base is Breached!)
      // ======================================================================
      const laneEnemyTowersLeft = this.towers.filter(
        (t) => t.team !== unit.team && t.lane === lane && !t.isDestroyed
      ).length;

      if (
        enemyNexus.isVulnerable &&
        (laneEnemyTowersLeft === 0 || activeTeamOrder === 'all_in')
      ) {
        rt.aiState = 'NEXUS_ASSAULT';
        const distToEnemyNexus = Math.hypot(unit.x - enemyNexus.x, unit.y - enemyNexus.y);

        // Fight enemy defenders near the Nexus if they block, or attack the Nexus directly!
        const nexusDefender = this.findPriorityTargetInRange(unit, 10.5);
        if (nexusDefender && activeTeamOrder !== 'all_in') {
          unit.currentAction = `ปะทะหน้าฐานทัพกับ ${nexusDefender.name}`;
          if (Math.hypot(unit.x - nexusDefender.x, unit.y - nexusDefender.y) > attackRange) {
            this.moveChampionSmartly(unit, nexusDefender.x, nexusDefender.y, 10.5, dt, lane);
          } else {
            this.executeChampionCombatAttack(unit, nexusDefender, rt);
          }
          continue;
        }

        unit.currentAction = `🔥 บุกโจมตี ${enemyNexus.team.toUpperCase()} NEXUS!`;
        if (distToEnemyNexus > attackRange + 1.5) {
          this.moveChampionSmartly(unit, enemyNexus.x, enemyNexus.y, 10.8, dt, lane);
        } else {
          this.executeNexusAttack(unit, enemyNexus, rt);
        }
        continue;
      }

      // ======================================================================
      // DIMENSION 6: SMART LANE PROGRESSION (ADC + Support Synergy, Trading & Tower Siege)
      // ======================================================================
      const frontlineS = this.getLaneFrontlineProgress(unit.team, lane);

      // Role-specific positioning along the lane polyline:
      // - Support steps slightly ahead (+0.012 for Blue, -0.012 for Red) to zone & protect ADC!
      // - ADC stands slightly behind (-0.022 for Blue, +0.022 for Red) at safe ranged attack distance!
      const sRoleDelta =
        unit.role === 'Support'
          ? isBlue
            ? 0.012
            : -0.012
          : isRanged
            ? isBlue
              ? -0.022
              : 0.022
            : 0;

      const lateralOffset =
        unit.role === 'Support' ? 2.2 : unit.role === 'ADC' ? -1.6 : 0;

      const desiredLanePt = this.getPointAtLaneProgress(
        lane,
        frontlineS + sRoleDelta,
        lateralOffset
      );

      // Find priority enemy champion & nearest standing enemy tower in lane
      const priorityEnemy = this.findPriorityTargetInRange(unit, 13.5);
      const laneEnemyTower = this.towers
        .filter((t) => t.team !== unit.team && t.lane === lane && !t.isDestroyed)
        .sort((a, b) => a.tier - b.tier)[0];

      const alliedMinionsAtTower =
        laneEnemyTower &&
        this.minionWaves.some(
          (w) =>
            w.team === unit.team &&
            w.lane === lane &&
            Math.hypot(w.x - laneEnemyTower.x, w.y - laneEnemyTower.y) <= 8.5
        );

      // 6A. Engage Enemy Champion (with Smart Kiting for ADC/Mage & Peel for Support)
      if (priorityEnemy) {
        const distEnemy = Math.hypot(unit.x - priorityEnemy.x, unit.y - priorityEnemy.y);
        const enemyUnderTower =
          laneEnemyTower &&
          Math.hypot(priorityEnemy.x - laneEnemyTower.x, priorityEnemy.y - laneEnemyTower.y) <= 8.0;

        if (!enemyUnderTower || alliedMinionsAtTower || activeTeamOrder === 'all_in') {
          rt.aiState = 'CHAMPION_DUEL';
          unit.currentAction =
            unit.role === 'Support'
              ? `โซนพื้นที่คุ้มกันแครี่ & กดดัน ${priorityEnemy.name}`
              : `ดวลสกิลโฟกัส ${priorityEnemy.name}`;

          if (distEnemy > attackRange) {
            this.moveChampionSmartly(unit, priorityEnemy.x, priorityEnemy.y, 10.2, dt, lane);
          } else if (isRanged && distEnemy < attackRange * 0.58) {
            // Kite back along the lane polyline toward own tower while firing!
            const curS = this.getProgressOfPointOnLane(lane, unit.x, unit.y);
            const kiteS = isBlue ? curS - 0.05 : curS + 0.05;
            const kitePt = this.getPointAtLaneProgress(lane, kiteS, lateralOffset);
            this.moveChampionSmartly(unit, kitePt.x, kitePt.y, 10.0, dt, lane);
          }

          if (distEnemy <= attackRange + 1.5) {
            this.executeChampionCombatAttack(unit, priorityEnemy, rt);
          }
          continue;
        }
      }

      // 6B. Siege Enemy Tower when at Frontline
      if (
        laneEnemyTower &&
        Math.hypot(unit.x - laneEnemyTower.x, unit.y - laneEnemyTower.y) <= attackRange + 3.5 &&
        (alliedMinionsAtTower || activeTeamOrder === 'all_in')
      ) {
        rt.aiState = 'TOWER_SIEGE';
        unit.currentAction = `กดดันตีป้อม ${lane.toUpperCase()} Tier ${laneEnemyTower.tier}`;
        const distTower = Math.hypot(unit.x - laneEnemyTower.x, unit.y - laneEnemyTower.y);
        if (distTower > attackRange) {
          this.moveChampionSmartly(unit, laneEnemyTower.x, laneEnemyTower.y, 9.8, dt, lane);
        } else {
          this.executeTowerSiegeAttack(unit, laneEnemyTower, rt);
        }
        continue;
      }

      // 6C. Advance along Lane Polyline & Farm Enemy Minions
      const distToFront = Math.hypot(unit.x - desiredLanePt.x, unit.y - desiredLanePt.y);
      if (distToFront > 1.8) {
        rt.aiState = 'LANE_ADVANCE';
        unit.currentAction =
          unit.role === 'Support'
            ? `เดินประกบคุ้มกัน ADC เลน ${lane.toUpperCase()}`
            : `เดินดันเวฟเลน ${lane.toUpperCase()}`;
        this.moveChampionSmartly(unit, desiredLanePt.x, desiredLanePt.y, 10.4, dt, lane);
      } else {
        rt.aiState = 'WAVE_CLEAR';
        unit.currentAction =
          unit.role === 'Support'
            ? `คุมพุ่มไม้และช่วยดันเวฟเลน ${lane.toUpperCase()}`
            : `ลาสต์ช็อตมินเนี่ยนเลน ${lane.toUpperCase()}`;

        const enemyWave = this.minionWaves.find(
          (w) =>
            w.team !== unit.team &&
            w.lane === lane &&
            Math.hypot(w.x - unit.x, w.y - unit.y) <= attackRange + 2.5
        );
        if (enemyWave && rt.attackCooldown <= 0) {
          rt.attackCooldown = CombatCalculator.calculateAttackInterval(unit.player, unit.champion);
          enemyWave.health -= unit.role === 'Support' ? 32 : 58;
          this.pushVisual({
            type: isRanged ? 'projectile' : 'slash',
            fromX: unit.x,
            fromY: unit.y,
            toX: enemyWave.x,
            toY: enemyWave.y,
            team: unit.team
          });
          if (enemyWave.health <= 0) {
            this.rewardNearbyChampionsForWaveClear(unit.team, enemyWave.x, enemyWave.y);
          }
        }
      }
    }
  }

  /**
   * ระบบเลือกเป้าหมายอัจฉริยะ (Smart Target Priority):
   * โฟกัสศัตรูที่เลือดเหลือน้อยที่สุด หรือแครี่/เมจที่อยู่ในระยะยิง
   */
  private findPriorityTargetInRange(unit: MatchEntity, maxRadius: number): MatchEntity | null {
    const candidates = this.entities.filter(
      (other) =>
        other.team !== unit.team &&
        !other.isDead &&
        Math.hypot(unit.x - other.x, unit.y - other.y) <= maxRadius
    );
    if (candidates.length === 0) return null;

    candidates.sort((a, b) => {
      const scoreA =
        (1 - a.currentHealth / a.maxHealth) * 50 +
        (a.role === 'ADC' || a.role === 'Mid' ? 15 : 0) -
        Math.hypot(unit.x - a.x, unit.y - a.y);
      const scoreB =
        (1 - b.currentHealth / b.maxHealth) * 50 +
        (b.role === 'ADC' || b.role === 'Mid' ? 15 : 0) -
        Math.hypot(unit.x - b.x, unit.y - b.y);
      return scoreB - scoreA;
    });

    return candidates[0];
  }

  private executeChampionCombatAttack(
    attacker: MatchEntity,
    defender: MatchEntity,
    rt: EntityRuntimeState
  ) {
    if (rt.attackCooldown > 0 || defender.isDead) return;

    rt.attackCounter += 1;
    rt.attackCooldown = CombatCalculator.calculateAttackInterval(attacker.player, attacker.champion);

    const isRanged =
      attacker.champion.role === 'Marksman' ||
      attacker.champion.role === 'Mage' ||
      attacker.champion.role === 'Support';

    this.pushVisual({
      type: isRanged ? 'projectile' : 'slash',
      fromX: attacker.x,
      fromY: attacker.y,
      toX: defender.x,
      toY: defender.y,
      team: attacker.team
    });

    let skillBonusMult = 1.0;
    if (rt.skillCooldown <= 0 && attacker.champion.skills.length > 0) {
      rt.skillCooldown = CombatCalculator.calculateSkillCooldown(attacker.player, attacker.champion);
      const skillIdx = rt.attackCounter % attacker.champion.skills.length;
      const castSkill = attacker.champion.skills[skillIdx];
      attacker.castingSkill = `${castSkill.key}: ${castSkill.name}`;
      skillBonusMult = castSkill.key === 'R' ? 1.45 : 1.2;

      this.pushVisual({
        type: 'shockwave',
        fromX: defender.x,
        fromY: defender.y,
        toX: defender.x,
        toY: defender.y,
        team: attacker.team
      });
    }

    const atkHpRatio = attacker.currentHealth / attacker.maxHealth;
    const defHpRatio = defender.currentHealth / defender.maxHealth;

    let tacticalMult = skillBonusMult;
    if (attacker.champion.counterStrongAgainst.includes(defender.champion.id)) tacticalMult += 0.18;
    if (attacker.champion.counterWeakAgainst.includes(defender.champion.id)) tacticalMult -= 0.12;
    if (CURRENT_PATCH_NOTES.buffedChampions.includes(attacker.champion.id)) tacticalMult += 0.08;
    if (CURRENT_PATCH_NOTES.nerfedChampions.includes(attacker.champion.id)) tacticalMult -= 0.06;

    const teamObj = attacker.team === 'blue' ? this.blueTeamData : this.redTeamData;
    const enemyTeamObj = attacker.team === 'blue' ? this.redTeamData : this.blueTeamData;
    const atkTacMod = CombatCalculator.getTacticModifiers(teamObj.currentTactic);
    const defTacMod = CombatCalculator.getTacticModifiers(enemyTeamObj.currentTactic);
    tacticalMult *= atkTacMod.damageMult / defTacMod.defenseMult;

    const activeOrder = attacker.team === 'blue' ? this.tacticalOrder : this.redTacticalOrder;
    const enemyOrder = attacker.team === 'blue' ? this.redTacticalOrder : this.tacticalOrder;

    if (activeOrder === 'all_in') tacticalMult *= 1.18;
    if (enemyOrder === 'defend') tacticalMult *= 0.84;

    if (attacker.team === 'blue' && this.blueDragons > 0) {
      tacticalMult *= 1 + this.blueDragons * 0.08;
    } else if (attacker.team === 'red' && this.redDragons > 0) {
      tacticalMult *= 1 + this.redDragons * 0.08;
    }

    if (attacker.team === 'red' && this.controlMode === 'vs_ai') {
      tacticalMult *= this.getDifficultyMultiplier().dmgScale;
    }

    if (this.isTutorialMatch) {
      tacticalMult *= attacker.team === 'blue' ? 1.55 : 0.55;
    }

    const isDodged = CombatCalculator.checkDodgeOrOutplay(
      defender.player,
      attacker.player,
      defHpRatio,
      rt.attackCounter
    );

    if (isDodged) {
      this.pushVisual({
        type: 'floating_text',
        fromX: defender.x,
        fromY: defender.y - 2,
        toX: defender.x,
        toY: defender.y - 6,
        team: defender.team,
        text: 'OUTPLAY / DODGE!',
        subType: 'skill'
      });
      return;
    }

    const atkResult = CombatCalculator.calculateAttackDamage(
      attacker.player,
      attacker.champion,
      atkHpRatio,
      rt.attackCounter
    );
    const itemBonusDmg = attacker.items.length * 15;
    const finalDamage = Math.max(
      18,
      Math.round((atkResult.damage + itemBonusDmg) * 0.72 * tacticalMult)
    );

    defender.currentHealth = Math.max(0, defender.currentHealth - finalDamage);

    this.pushVisual({
      type: 'floating_text',
      fromX: defender.x,
      fromY: defender.y - 2,
      toX: defender.x,
      toY: defender.y - 6,
      team: attacker.team,
      text: atkResult.isCrit ? `💥 CRIT -${finalDamage}` : `-${finalDamage}`,
      subType: atkResult.isCrit ? 'crit' : 'damage'
    });

    if (atkResult.isClutchActive && rt.attackCounter % 4 === 0) {
      this.addLog(
        'outplay',
        `⚡ ${attacker.name} ดึงศักยภาพ Clutch สวนกลับใส่ ${defender.name} (-${finalDamage} HP)!`,
        attacker.team
      );
    }

    if (defender.currentHealth <= 0) {
      this.handleKill(attacker, defender);
    }
  }

  private executeTowerSiegeAttack(
    attacker: MatchEntity,
    tower: TowerEntity,
    rt: EntityRuntimeState
  ) {
    if (rt.attackCooldown > 0 || tower.isDestroyed) return;

    rt.attackCounter += 1;
    rt.attackCooldown = CombatCalculator.calculateAttackInterval(attacker.player, attacker.champion);

    const baronMult =
      (attacker.team === 'blue' && this.blueBarons > 0) ||
      (attacker.team === 'red' && this.redBarons > 0)
        ? 1.65
        : 1.0;

    const siegeDmg = Math.round(
      (115 + attacker.player.stats.mechanics * 0.9 + attacker.items.length * 28) *
        baronMult *
        (this.isTutorialMatch && attacker.team === 'blue' ? 1.45 : 1.0)
    );

    tower.health = Math.max(0, tower.health - siegeDmg);

    this.pushVisual({
      type: 'projectile',
      fromX: attacker.x,
      fromY: attacker.y,
      toX: tower.x,
      toY: tower.y,
      team: attacker.team
    });

    if (tower.health <= 0 && !tower.isDestroyed) {
      this.handleTowerDestroyed(tower, attacker.team);
    }
  }

  /**
   * โจมตีฐานทัพหลัก (Nexus) ของศัตรูจนแตกเพื่อคว้าชัยชนะ!
   */
  private executeNexusAttack(
    attacker: MatchEntity,
    nexus: NexusStructure,
    rt: EntityRuntimeState
  ) {
    if (rt.attackCooldown > 0 || nexus.health <= 0) return;

    rt.attackCounter += 1;
    rt.attackCooldown = CombatCalculator.calculateAttackInterval(attacker.player, attacker.champion);

    const baronMult =
      (attacker.team === 'blue' && this.blueBarons > 0) ||
      (attacker.team === 'red' && this.redBarons > 0)
        ? 1.7
        : 1.0;

    const nexusDmg = Math.round(
      (135 + attacker.player.stats.mechanics * 1.0 + attacker.items.length * 32) *
        baronMult *
        (this.isTutorialMatch && attacker.team === 'blue' ? 1.5 : 1.0)
    );

    nexus.health = Math.max(0, nexus.health - nexusDmg);

    this.pushVisual({
      type: 'projectile',
      fromX: attacker.x,
      fromY: attacker.y,
      toX: nexus.x,
      toY: nexus.y,
      team: attacker.team
    });

    this.pushVisual({
      type: 'floating_text',
      fromX: nexus.x + (rt.attackCounter % 2 === 0 ? -2 : 2),
      fromY: nexus.y - 3,
      toX: nexus.x,
      toY: nexus.y - 7,
      team: attacker.team,
      text: `💥 NEXUS -${nexusDmg}`,
      subType: 'crit'
    });
  }

  private handleTowerDestroyed(tower: TowerEntity, destroyerTeam: 'blue' | 'red') {
    tower.isDestroyed = true;
    tower.health = 0;

    if (destroyerTeam === 'blue') {
      this.blueGold += 700;
    } else {
      this.redGold += 700;
    }

    const teamName =
      destroyerTeam === 'blue' ? this.blueTeamData.name : this.redTeamData.name;

    this.pushVisual({
      type: 'shockwave',
      fromX: tower.x,
      fromY: tower.y,
      toX: tower.x,
      toY: tower.y,
      team: destroyerTeam
    });
    this.pushVisual({
      type: 'floating_text',
      fromX: tower.x,
      fromY: tower.y - 2,
      toX: tower.x,
      toY: tower.y - 7,
      team: destroyerTeam,
      text: '🏰 TURRET DESTROYED +700G',
      subType: 'gold'
    });

    this.addLog(
      'tower',
      `🏰 [${teamName}] ทำลายป้อม ${tower.lane.toUpperCase()} Tier ${tower.tier} สำเร็จ! (+700G)`,
      destroyerTeam
    );

    this.updateNexusVulnerability();
  }

  private processStructureDefenses(dt: number) {
    // 1. Standing Towers fire defense lasers
    for (const tower of this.towers) {
      if (tower.isDestroyed) continue;

      this.towerCooldowns[tower.id] = Math.max(0, (this.towerCooldowns[tower.id] || 0) - dt);
      if (this.towerCooldowns[tower.id] > 0) continue;

      const enemyMinion = this.minionWaves.find(
        (w) =>
          w.team !== tower.team &&
          w.health > 0 &&
          Math.hypot(w.x - tower.x, w.y - tower.y) <= 9.0
      );

      if (enemyMinion) {
        this.towerCooldowns[tower.id] = 1.35;
        enemyMinion.health -= 125;
        this.pushVisual({
          type: 'tower_laser',
          fromX: tower.x,
          fromY: tower.y,
          toX: enemyMinion.x,
          toY: enemyMinion.y,
          team: tower.team
        });
        continue;
      }

      const enemyChamp = this.entities.find(
        (e) =>
          e.team !== tower.team &&
          !e.isDead &&
          Math.hypot(e.x - tower.x, e.y - tower.y) <= 9.2
      );

      if (enemyChamp) {
        this.towerCooldowns[tower.id] = 1.35;
        enemyChamp.currentHealth = Math.max(0, enemyChamp.currentHealth - 135);
        this.pushVisual({
          type: 'tower_laser',
          fromX: tower.x,
          fromY: tower.y,
          toX: enemyChamp.x,
          toY: enemyChamp.y,
          team: tower.team
        });
      }
    }

    // 2. Nexus Defense Turrets
    const nexuses = [this.blueNexus, this.redNexus];
    for (const nex of nexuses) {
      if (nex.health <= 0) continue;
      this.nexusCooldowns[nex.team] = Math.max(0, this.nexusCooldowns[nex.team] - dt);
      if (this.nexusCooldowns[nex.team] > 0) continue;

      const enemyInBase = this.entities.find(
        (e) =>
          e.team !== nex.team &&
          !e.isDead &&
          Math.hypot(e.x - nex.x, e.y - nex.y) <= 10.5
      );
      if (enemyInBase) {
        this.nexusCooldowns[nex.team] = 1.25;
        enemyInBase.currentHealth = Math.max(0, enemyInBase.currentHealth - 120);
        this.pushVisual({
          type: 'tower_laser',
          fromX: nex.x,
          fromY: nex.y,
          toX: enemyInBase.x,
          toY: enemyInBase.y,
          team: nex.team
        });
      }
    }
  }

  private executeBossAttack(
    attacker: MatchEntity,
    boss: NeutralObjectiveBoss,
    rt: EntityRuntimeState
  ) {
    if (rt.attackCooldown > 0 || !boss.isAlive) return;

    rt.attackCounter += 1;
    rt.attackCooldown = CombatCalculator.calculateAttackInterval(attacker.player, attacker.champion);

    const bossDmg = Math.round(
      145 + attacker.player.stats.mechanics * 1.15 + attacker.items.length * 38
    );
    boss.health = Math.max(0, boss.health - bossDmg);

    this.pushVisual({
      type: 'projectile',
      fromX: attacker.x,
      fromY: attacker.y,
      toX: boss.x,
      toY: boss.y,
      team: attacker.team
    });

    if (boss.health <= 0) {
      boss.isAlive = false;
      boss.spawnTime = this.gameTime + 90;
      const teamName =
        attacker.team === 'blue' ? this.blueTeamData.name : this.redTeamData.name;

      if (boss.type === 'dragon') {
        if (attacker.team === 'blue') {
          this.blueDragons += 1;
          this.blueGold += 500;
        } else {
          this.redDragons += 1;
          this.redGold += 500;
        }
        this.announcerBanner = {
          text: 'DRAGON SECURED!',
          subText: `${attacker.name} (${teamName}) สังหาร Ancient Dragon สำเร็จ! (+8% Team Damage)`,
          team: attacker.team
        };
        this.addLog(
          'dragon',
          `🐉 [${teamName}] ${attacker.name} ปิดดาเมจสังหาร Ancient Dragon รับบัฟโจมตีทั้งทีม!`,
          attacker.team
        );
      } else {
        if (attacker.team === 'blue') {
          this.blueBarons += 1;
          this.blueGold += 1200;
        } else {
          this.redBarons += 1;
          this.redGold += 1200;
        }
        this.announcerBanner = {
          text: 'BARON NASHOR SLAIN!',
          subText: `${teamName} สังหาร Baron Nashor รับบัฟเสริมทัพมินเนี่ยนและพลังตีป้อม!`,
          team: attacker.team
        };
        this.addLog(
          'baron',
          `👑 [${teamName}] โค่นล้ม Baron Nashor สำเร็จ! (+1,200G & Baron Siege Buff)`,
          attacker.team
        );
      }

      this.pushVisual({
        type: 'shockwave',
        fromX: boss.x,
        fromY: boss.y,
        toX: boss.x,
        toY: boss.y,
        team: attacker.team
      });

      if (attacker.team === 'blue' && this.tacticalOrder === 'objective') {
        this.tacticalOrder = 'standard';
      } else if (attacker.team === 'red' && this.redTacticalOrder === 'objective') {
        this.redTacticalOrder = 'standard';
      }
    }
  }

  private checkItemPurchase(entity: MatchEntity) {
    if (entity.items.length >= 4) return;

    if (entity.items.length === 0 && entity.gold >= 1100) {
      entity.items.push(MOBA_ITEMS_DB.item_boots);
      entity.gold -= 1100;
      return;
    }

    const neededItemIds = entity.champion.coreItemIds.filter(
      (id) => !entity.items.some((it) => it.id === id)
    );
    if (neededItemIds.length > 0) {
      const nextItemId = neededItemIds[0];
      const itemData = MOBA_ITEMS_DB[nextItemId];
      if (itemData && entity.gold >= itemData.price) {
        entity.items.push(itemData);
        entity.gold -= itemData.price;
        entity.maxHealth += 180;
        entity.currentHealth += 180;
        this.pushVisual({
          type: 'floating_text',
          fromX: entity.x,
          fromY: entity.y,
          toX: entity.x,
          toY: entity.y - 5,
          team: entity.team,
          text: `🛒 ${itemData.name}`,
          subType: 'gold'
        });
      }
    }
  }

  private handleKill(killer: MatchEntity, victim: MatchEntity) {
    victim.isDead = true;
    victim.currentHealth = 0;
    victim.deaths += 1;
    victim.respawnTimer = this.isTutorialMatch ? 6 : 8 + Math.floor(this.gameTime / 60) * 2.5;
    victim.currentAction = 'รอเกิดใหม่ที่ฐานทัพ';

    killer.kills += 1;
    killer.gold += 350;

    for (const ally of this.entities) {
      if (ally.team === killer.team && ally.id !== killer.id && !ally.isDead) {
        if (Math.hypot(ally.x - victim.x, ally.y - victim.y) <= 22) {
          ally.assists += 1;
          ally.gold += 120;
        }
      }
    }

    const killerTeam = killer.team;
    if (killerTeam === 'blue') {
      this.blueKills += 1;
      this.blueGold += 350;
    } else {
      this.redKills += 1;
      this.redGold += 350;
    }

    this.checkItemPurchase(killer);

    this.pushVisual({
      type: 'floating_text',
      fromX: victim.x,
      fromY: victim.y,
      toX: victim.x,
      toY: victim.y - 7,
      team: killerTeam,
      text: `⚔️ ${killer.name} +350G`,
      subType: 'gold'
    });

    if (!this.firstBloodTaken) {
      this.firstBloodTaken = true;
      this.announcerBanner = {
        text: 'FIRST BLOOD!',
        subText: `${killer.name} (${killer.champion.name}) สังหารเปิดสนามเหนือ ${victim.name}`,
        team: killerTeam
      };
      this.addLog(
        'kill',
        `🩸 FIRST BLOOD! ${killer.name} สังหาร ${victim.name} ประเดิมคิลแรกของแมตช์!`,
        killerTeam
      );
      return;
    }

    if (killer.kills >= 5) {
      this.announcerBanner = {
        text: 'PENTAKILL!',
        subText: `${killer.name} โชว์ฟอร์มระดับโลก กวาดคิลต่อเนื่อง!`,
        team: killerTeam
      };
    } else if (killer.kills >= 3) {
      this.announcerBanner = {
        text: 'TRIPLE KILL!',
        subText: `${killer.name} ครองความได้เปรียบในไฟต์นี้!`,
        team: killerTeam
      };
    }

    this.addLog(
      'kill',
      `⚔️ [${killerTeam.toUpperCase()}] ${killer.name} (${killer.champion.name}) สังหาร ${victim.name}!`,
      killerTeam
    );
  }

  /**
   * เงื่อนไขการชนะที่แท้จริงตามกติกา MOBA: ต้องตี Nexus ของอีกฝ่ายจน HP เหลือ 0 เท่านั้น!
   */
  private checkVictoryCondition() {
    if (this.redNexus.health <= 0) {
      this.redNexus.health = 0;
      this.winner = 'blue';
      this.isRunning = false;
      this.pushVisual({
        type: 'shockwave',
        fromX: this.redNexus.x,
        fromY: this.redNexus.y,
        toX: this.redNexus.x,
        toY: this.redNexus.y,
        team: 'blue'
      });
      this.announcerBanner = {
        text: 'VICTORY! NEXUS DESTROYED',
        subText: `${this.blueTeamData.name} บุกทำลาย Red Nexus สำเร็จ คว้าชัยชนะในแมตช์นี้!`,
        team: 'blue'
      };
      this.addLog(
        'objective',
        `🏆 VICTORY! ${this.blueTeamData.name} ทำลาย Red Nexus ของ ${this.redTeamData.name} คว้าชัยชนะอย่างสมบูรณ์แบบ!`,
        'blue'
      );
    } else if (this.blueNexus.health <= 0) {
      this.blueNexus.health = 0;
      this.winner = 'red';
      this.isRunning = false;
      this.pushVisual({
        type: 'shockwave',
        fromX: this.blueNexus.x,
        fromY: this.blueNexus.y,
        toX: this.blueNexus.x,
        toY: this.blueNexus.y,
        team: 'red'
      });
      this.announcerBanner = {
        text: 'DEFEAT! NEXUS FALLEN',
        subText: `${this.redTeamData.name} บุกทำลาย Blue Nexus สำเร็จ`,
        team: 'red'
      };
      this.addLog(
        'objective',
        `💀 DEFEAT! ${this.redTeamData.name} ทำลาย Blue Nexus คว้าชัยชนะในศึกนี้!`,
        'red'
      );
    }
  }

  public fastForwardToEnd() {
    let safetyCounter = 0;
    const prevSpeed = this.speed;
    this.speed = 1;
    while (!this.winner && safetyCounter < 2400) {
      this.tick(0.5);
      safetyCounter++;
    }
    this.speed = prevSpeed;
    if (!this.winner) {
      if (this.isTutorialMatch || this.redNexus.health <= this.blueNexus.health) {
        this.redNexus.health = 0;
      } else {
        this.blueNexus.health = 0;
      }
      this.checkVictoryCondition();
    }
    this.notify();
  }

  private addLog(type: MatchLogEvent['type'], text: string, killerTeam?: 'blue' | 'red') {
    const mins = Math.floor(this.gameTime / 60).toString().padStart(2, '0');
    const secs = Math.floor(this.gameTime % 60).toString().padStart(2, '0');
    this.events.unshift({
      id: `log_${Date.now()}_${this.events.length}`,
      timestamp: `${mins}:${secs}`,
      type,
      text,
      killerTeam
    });
    if (this.events.length > 50) this.events.pop();
  }

  private notify() {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback();
    }
  }
}
