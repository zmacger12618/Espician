import React, { useEffect, useRef, useState } from 'react';
import { MatchEntity, TowerEntity } from '../../types';
import {
  CombatVisualEvent,
  MinionWaveEntity,
  NeutralObjectiveBoss,
  NexusStructure,
  TacticalOrderType
} from '../../simulation/MatchEngine';
import { JUNGLE_CAMPS, MOBA_LANES } from '../../simulation/mobaMapData';

interface MiniMapCanvasProps {
  entities: MatchEntity[];
  towers: TowerEntity[];
  blueNexus?: NexusStructure;
  redNexus?: NexusStructure;
  minionWaves?: MinionWaveEntity[];
  dragonBoss?: NeutralObjectiveBoss;
  baronBoss?: NeutralObjectiveBoss;
  gameTime: number;
  combatVisuals?: CombatVisualEvent[];
  tacticalOrder?: TacticalOrderType;
  isRunning?: boolean;
}

export const MiniMapCanvas: React.FC<MiniMapCanvasProps> = ({
  entities,
  towers,
  blueNexus,
  redNexus,
  minionWaves = [],
  dragonBoss,
  baronBoss,
  gameTime,
  combatVisuals = [],
  tacticalOrder = 'standard',
  isRunning = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const entitiesRef = useRef<MatchEntity[]>(entities);
  const towersRef = useRef<TowerEntity[]>(towers);
  const blueNexusRef = useRef<NexusStructure | undefined>(blueNexus);
  const redNexusRef = useRef<NexusStructure | undefined>(redNexus);
  const wavesRef = useRef<MinionWaveEntity[]>(minionWaves);
  const dragonRef = useRef<NeutralObjectiveBoss | undefined>(dragonBoss);
  const baronRef = useRef<NeutralObjectiveBoss | undefined>(baronBoss);
  const visualsRef = useRef<CombatVisualEvent[]>(combatVisuals);
  const orderRef = useRef<TacticalOrderType>(tacticalOrder);
  const gameTimeRef = useRef<number>(gameTime);
  const smoothedPosRef = useRef<Record<string, { x: number; y: number }>>({});
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>('blue_Mid');
  const [showTacticalVectors, setShowTacticalVectors] = useState<boolean>(true);

  useEffect(() => {
    entitiesRef.current = entities;
  }, [entities]);

  useEffect(() => {
    towersRef.current = towers;
  }, [towers]);

  useEffect(() => {
    blueNexusRef.current = blueNexus;
    redNexusRef.current = redNexus;
  }, [blueNexus, redNexus]);

  useEffect(() => {
    wavesRef.current = minionWaves;
  }, [minionWaves]);

  useEffect(() => {
    dragonRef.current = dragonBoss;
    baronRef.current = baronBoss;
  }, [dragonBoss, baronBoss]);

  useEffect(() => {
    visualsRef.current = combatVisuals;
  }, [combatVisuals]);

  useEffect(() => {
    orderRef.current = tacticalOrder;
  }, [tacticalOrder]);

  useEffect(() => {
    gameTimeRef.current = gameTime;
  }, [gameTime]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    let closest: MatchEntity | null = null;
    let minD = 999;
    for (const ent of entitiesRef.current) {
      const pos = smoothedPosRef.current[ent.id] || { x: ent.x, y: ent.y };
      const d = Math.hypot(pos.x - clickX, pos.y - clickY);
      if (d < minD && d < 8) {
        minD = d;
        closest = ent;
      }
    }
    if (closest) {
      setSelectedEntityId(closest.id);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const startTime = performance.now();

    const renderLoop = (now: number) => {
      const elapsedSec = (now - startTime) / 1000;
      const width = canvas.width;
      const height = canvas.height;
      const currentEntities = entitiesRef.current;
      const currentTowers = towersRef.current;
      const currentWaves = wavesRef.current;
      const currentDragon = dragonRef.current;
      const currentBaron = baronRef.current;
      const currentVisuals = visualsRef.current;
      const currentOrder = orderRef.current;
      const curGameTime = gameTimeRef.current;

      // 1. Tactical Arena Terrain Background
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        30,
        width * 0.5,
        height * 0.5,
        width * 0.75
      );
      bgGrad.addColorStop(0, '#0d1627');
      bgGrad.addColorStop(0.65, '#090f1d');
      bgGrad.addColorStop(1, '#050811');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Coordinate Grid (Every 10% map units)
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.25)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 10; i++) {
        const pos = (i / 10) * width;
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(width, pos);
        ctx.stroke();
      }

      // 3. River Channel (Top-Left (14,14) -> Baron (34,34) -> Mid (50,50) -> Dragon (66,66) -> Bot-Right (86,86))
      ctx.save();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.16)';
      ctx.lineWidth = 42;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(width * 0.14, height * 0.14);
      ctx.bezierCurveTo(
        width * 0.34,
        height * 0.32,
        width * 0.66,
        height * 0.68,
        width * 0.86,
        height * 0.86
      );
      ctx.stroke();

      ctx.strokeStyle = 'rgba(34, 211, 238, 0.22)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([12, 16]);
      ctx.lineDashOffset = -elapsedSec * 22;
      ctx.beginPath();
      ctx.moveTo(width * 0.16, height * 0.16);
      ctx.bezierCurveTo(
        width * 0.34,
        height * 0.34,
        width * 0.66,
        height * 0.66,
        width * 0.84,
        height * 0.84
      );
      ctx.stroke();
      ctx.restore();

      // 4. Exact MOBA Lane Polylines (Top, Mid, Bot from MOBA_LANES)
      ctx.save();
      const drawLanePolyline = (waypoints: { x: number; y: number }[]) => {
        if (waypoints.length === 0) return;
        ctx.beginPath();
        ctx.moveTo((waypoints[0].x / 100) * width, (waypoints[0].y / 100) * height);
        for (let i = 1; i < waypoints.length; i++) {
          ctx.lineTo((waypoints[i].x / 100) * width, (waypoints[i].y / 100) * height);
        }
        ctx.stroke();
      };

      // Outer lane road
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.48)';
      ctx.lineWidth = 28;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      drawLanePolyline(MOBA_LANES.top);
      drawLanePolyline(MOBA_LANES.mid);
      drawLanePolyline(MOBA_LANES.bot);

      // Inner lane pathing guide line
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.22)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      drawLanePolyline(MOBA_LANES.top);
      drawLanePolyline(MOBA_LANES.mid);
      drawLanePolyline(MOBA_LANES.bot);
      ctx.restore();

      // 5. Jungle Camp Nodes (8 Deterministic Camps)
      ctx.save();
      for (const camp of JUNGLE_CAMPS) {
        const cx = (camp.x / 100) * width;
        const cy = (camp.y / 100) * height;
        ctx.fillStyle =
          camp.buffType === 'blue_buff'
            ? 'rgba(37, 99, 235, 0.22)'
            : camp.buffType === 'red_buff'
              ? 'rgba(220, 38, 38, 0.22)'
              : 'rgba(30, 41, 59, 0.55)';
        ctx.strokeStyle =
          camp.buffType === 'blue_buff'
            ? 'rgba(96, 165, 250, 0.55)'
            : camp.buffType === 'red_buff'
              ? 'rgba(248, 113, 113, 0.55)'
              : 'rgba(100, 116, 139, 0.45)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(cx, cy, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'rgba(203, 213, 225, 0.65)';
        ctx.font = 'bold 6.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          camp.buffType === 'blue_buff' ? 'BLUE' : camp.buffType === 'red_buff' ? 'RED' : 'CAMP',
          cx,
          cy + 2.5
        );
      }
      ctx.restore();

      // 6. Neutral Objective Pits (Baron at 34,34 & Dragon at 66,66) with Real Boss HP Bars
      const drawBossPit = (
        boss: NeutralObjectiveBoss | undefined,
        fallbackX: number,
        fallbackY: number,
        color: string,
        glow: string,
        icon: string,
        label: string
      ) => {
        const bx = ((boss?.x ?? fallbackX) / 100) * width;
        const by = ((boss?.y ?? fallbackY) / 100) * height;
        const isAlive = boss ? boss.isAlive : true;

        ctx.save();
        ctx.fillStyle = glow;
        ctx.strokeStyle = color;
        ctx.lineWidth = isAlive ? 2 : 1;
        if (!isAlive) ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(bx, by, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (currentOrder === 'objective' && isAlive) {
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(bx, by, 23 + Math.sin(elapsedSec * 5) * 2.5, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.fillStyle = isAlive ? '#ffffff' : '#64748b';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${icon} ${label}`, bx, by + 3);

        // Boss HP Bar or Respawn Countdown
        if (boss) {
          if (boss.isAlive) {
            const barW = 34;
            const barH = 4;
            const hpPct = Math.max(0, boss.health / boss.maxHealth);
            ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
            ctx.fillRect(bx - barW / 2, by - 25, barW, barH);
            ctx.fillStyle = color;
            ctx.fillRect(bx - barW / 2, by - 25, barW * hpPct, barH);
          } else {
            const remain = Math.max(0, Math.ceil(boss.spawnTime - curGameTime));
            ctx.fillStyle = '#94a3b8';
            ctx.font = 'bold 7.5px monospace';
            ctx.fillText(`SPAWN ${remain}s`, bx, by - 21);
          }
        }
        ctx.restore();
      };

      drawBossPit(
        currentBaron,
        34,
        34,
        '#a855f7',
        'rgba(147, 51, 234, 0.22)',
        '👑',
        'BARON'
      );
      drawBossPit(
        currentDragon,
        66,
        66,
        '#f97316',
        'rgba(234, 88, 12, 0.22)',
        '🐉',
        'DRAGON'
      );

      // 7. Bases / Nexuses (Blue at 12,88 & Red at 88,12) with Real HP Bars
      const drawNexus = (
        nx: number,
        ny: number,
        fill: string,
        stroke: string,
        label: string,
        nexObj?: NexusStructure
      ) => {
        ctx.save();
        const hpRatio = nexObj ? Math.max(0, nexObj.health / nexObj.maxHealth) : 1;

        if (nexObj?.isVulnerable) {
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 3]);
          ctx.beginPath();
          ctx.arc(nx, ny, 24 + Math.sin(elapsedSec * 6) * 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        ctx.fillStyle = hpRatio > 0 ? fill : '#1e293b';
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(nx, ny, 19, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, nx, ny + 1);

        if (nexObj) {
          ctx.font = 'bold 7.5px monospace';
          ctx.fillStyle = '#fde047';
          ctx.fillText(`${Math.round(hpRatio * 100)}%`, nx, ny + 10);

          const barW = 38;
          const barH = 4.5;
          ctx.fillStyle = 'rgba(2, 6, 23, 0.92)';
          ctx.fillRect(nx - barW / 2, ny - 26, barW, barH);
          ctx.fillStyle = nexObj.team === 'blue' ? '#38bdf8' : '#fb7185';
          ctx.fillRect(nx - barW / 2, ny - 26, barW * hpRatio, barH);
        }
        ctx.restore();
      };

      drawNexus(
        width * 0.12,
        height * 0.88,
        '#1d4ed8',
        '#60a5fa',
        'BLUE NEXUS',
        blueNexusRef.current
      );
      drawNexus(
        width * 0.88,
        height * 0.12,
        '#b91c1c',
        '#f87171',
        'RED NEXUS',
        redNexusRef.current
      );

      // 8. Real Engine-Simulated Minion Waves (with 3-unit squad + HP bar)
      ctx.save();
      for (const wave of currentWaves) {
        if (wave.health <= 0) continue;
        const wx = (wave.x / 100) * width;
        const wy = (wave.y / 100) * height;
        const isBlue = wave.team === 'blue';

        // Draw 3 minion dots in a tight tactical triangle
        const offsets = [
          { dx: -4, dy: -3 },
          { dx: 4, dy: -3 },
          { dx: 0, dy: 4 }
        ];
        ctx.fillStyle = isBlue ? '#38bdf8' : '#fb7185';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1;
        for (const off of offsets) {
          ctx.beginPath();
          ctx.arc(wx + off.dx, wy + off.dy, 3.1, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        // Minion Wave HP Bar
        const barW = 16;
        const barH = 2.5;
        const hpRatio = Math.max(0, wave.health / wave.maxHealth);
        ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
        ctx.fillRect(wx - barW / 2, wy - 10, barW, barH);
        ctx.fillStyle = isBlue ? '#38bdf8' : '#fb7185';
        ctx.fillRect(wx - barW / 2, wy - 10, barW * hpRatio, barH);
      }
      ctx.restore();

      // 9. Towers & Siege Turrets (with Aggro Range Ring when damaged/active)
      currentTowers.forEach((t) => {
        const tx = (t.x / 100) * width;
        const ty = (t.y / 100) * height;

        if (t.isDestroyed) {
          ctx.save();
          ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
          ctx.strokeStyle = 'rgba(71, 85, 105, 0.5)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(tx, ty, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
          return;
        }

        ctx.save();
        if (showTacticalVectors) {
          // Subtle tower defense range circle (9.0 map units)
          ctx.strokeStyle =
            t.team === 'blue' ? 'rgba(59, 130, 246, 0.14)' : 'rgba(244, 63, 94, 0.14)';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.arc(tx, ty, width * 0.09, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        ctx.fillStyle = t.team === 'blue' ? '#2563eb' : '#dc2626';
        ctx.strokeStyle = t.team === 'blue' ? '#93c5fd' : '#fca5a5';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.rect(tx - 7, ty - 7, 14, 14);
        ctx.fill();
        ctx.stroke();

        // Tower Tier Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 7.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`T${t.tier}`, tx, ty + 2.5);

        // Tower HP Bar
        const barW = 24;
        const barH = 3.5;
        const hpPct = Math.max(0, t.health / t.maxHealth);
        ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
        ctx.fillRect(tx - barW / 2, ty - 13, barW, barH);
        ctx.fillStyle = t.team === 'blue' ? '#38bdf8' : '#fb7185';
        ctx.fillRect(tx - barW / 2, ty - 13, barW * hpPct, barH);
        ctx.restore();
      });

      // 10. Algorithmic Combat Visual Effects (Projectiles, Slashes, Shockwaves, Tower Lasers)
      const nowEpoch = Date.now();
      for (const v of currentVisuals) {
        const ageMs = nowEpoch - v.createdAt;
        if (ageMs > 850) continue;
        const progress = Math.min(1, ageMs / 420);

        const fx = (v.fromX / 100) * width;
        const fy = (v.fromY / 100) * height;
        const tx = (v.toX / 100) * width;
        const ty = (v.toY / 100) * height;

        ctx.save();
        if (v.type === 'projectile') {
          const curX = fx + (tx - fx) * progress;
          const curY = fy + (ty - fy) * progress;
          const tailProgress = Math.max(0, progress - 0.3);

          ctx.strokeStyle =
            v.team === 'blue' ? 'rgba(56, 189, 248, 0.85)' : 'rgba(251, 113, 133, 0.85)';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(fx + (tx - fx) * tailProgress, fy + (ty - fy) * tailProgress);
          ctx.lineTo(curX, curY);
          ctx.stroke();

          ctx.fillStyle = v.team === 'blue' ? '#e0f2fe' : '#ffe4e6';
          ctx.beginPath();
          ctx.arc(curX, curY, 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (v.type === 'slash') {
          const midX = (fx + tx) * 0.5;
          const midY = (fy + ty) * 0.5;
          const angle = Math.atan2(ty - fy, tx - fx);
          ctx.strokeStyle =
            v.team === 'blue'
              ? `rgba(56, 189, 248, ${1 - progress})`
              : `rgba(251, 113, 133, ${1 - progress})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(midX, midY, 9 + progress * 6, angle - 0.9, angle + 0.9);
          ctx.stroke();
        } else if (v.type === 'shockwave') {
          const radius = 6 + progress * 24;
          ctx.strokeStyle =
            v.team === 'blue'
              ? `rgba(56, 189, 248, ${Math.max(0, 0.9 - progress)})`
              : `rgba(244, 63, 94, ${Math.max(0, 0.9 - progress)})`;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.arc(tx, ty, radius, 0, Math.PI * 2);
          ctx.stroke();
        } else if (v.type === 'tower_laser') {
          ctx.strokeStyle =
            v.team === 'blue'
              ? `rgba(96, 165, 250, ${1 - progress})`
              : `rgba(248, 113, 113, ${1 - progress})`;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(fx, fy);
          ctx.lineTo(tx, ty);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 11. Champions (Strict Vector Pathing + Target Vectors — Zero Random Jitter)
      currentEntities.forEach((entity) => {
        if (!smoothedPosRef.current[entity.id]) {
          smoothedPosRef.current[entity.id] = { x: entity.x, y: entity.y };
        }
        const smooth = smoothedPosRef.current[entity.id];
        smooth.x += (entity.x - smooth.x) * 0.22;
        smooth.y += (entity.y - smooth.y) * 0.22;

        const ex = (smooth.x / 100) * width;
        const ey = (smooth.y / 100) * height;
        const tx = (entity.targetX / 100) * width;
        const ty = (entity.targetY / 100) * height;

        if (entity.isDead) {
          ctx.save();
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.strokeStyle =
            entity.team === 'blue' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(244, 63, 94, 0.5)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(ex, ey, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${Math.ceil(entity.respawnTimer)}s`, ex, ey + 3);
          ctx.restore();
          return;
        }

        const isSelected = selectedEntityId === entity.id;

        // Draw Pathfinding Vector Line from Champion to Target Coordinate
        if (showTacticalVectors && Math.hypot(tx - ex, ty - ey) > 6) {
          ctx.save();
          ctx.strokeStyle =
            entity.team === 'blue' ? 'rgba(56, 189, 248, 0.45)' : 'rgba(251, 113, 133, 0.45)';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(ex, ey);
          ctx.lineTo(tx, ty);
          ctx.stroke();

          ctx.fillStyle =
            entity.team === 'blue' ? 'rgba(56, 189, 248, 0.7)' : 'rgba(251, 113, 133, 0.7)';
          ctx.beginPath();
          ctx.arc(tx, ty, 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Selected Unit Attack Range Circle
        if (isSelected) {
          const isRanged =
            entity.champion.role === 'Marksman' ||
            entity.champion.role === 'Mage' ||
            entity.champion.role === 'Support';
          const rangePx = ((isRanged ? 9.2 : 4.6) / 100) * width;

          ctx.save();
          ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(ex, ey, rangePx, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Skill Casting FX
        if (entity.castingSkill) {
          ctx.save();
          ctx.strokeStyle =
            entity.team === 'blue' ? 'rgba(56, 189, 248, 0.9)' : 'rgba(244, 63, 94, 0.9)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(ex, ey, 18, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 8.5px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`⚡ ${entity.castingSkill}`, ex, ey - 26);
          ctx.restore();
        }

        // Champion Token
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor =
          entity.team === 'blue' ? 'rgba(37, 99, 235, 0.75)' : 'rgba(225, 29, 72, 0.75)';

        ctx.fillStyle = entity.team === 'blue' ? '#2563eb' : '#e11d48';
        ctx.strokeStyle = isSelected ? '#fde047' : '#ffffff';
        ctx.lineWidth = isSelected ? 2.5 : 1.8;
        ctx.beginPath();
        ctx.arc(ex, ey, 11.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Role Badge
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(entity.role.substring(0, 3).toUpperCase(), ex, ey + 3);

        // Health Bar
        const hpWidth = 28;
        const hpHeight = 3.5;
        const hpRatio = Math.max(0, entity.currentHealth / entity.maxHealth);

        ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
        ctx.fillRect(ex - hpWidth / 2, ey - 17, hpWidth, hpHeight);

        ctx.fillStyle = entity.team === 'blue' ? '#10b981' : '#f43f5e';
        ctx.fillRect(ex - hpWidth / 2, ey - 17, hpWidth * hpRatio, hpHeight);

        // Player Name
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText(entity.name, ex, ey - 20);
      });

      // 12. Floating Combat Numbers
      for (const v of currentVisuals) {
        if (v.type !== 'floating_text' || !v.text) continue;
        const ageMs = nowEpoch - v.createdAt;
        if (ageMs > 850) continue;
        const progress = Math.min(1, ageMs / 800);

        const fx = (v.fromX / 100) * width;
        const fy = (v.fromY / 100) * height - progress * 20;

        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - progress * 0.85);
        ctx.font =
          v.subType === 'crit' || v.subType === 'objective'
            ? 'bold 10.5px sans-serif'
            : 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle =
          v.subType === 'gold'
            ? '#facc15'
            : v.subType === 'crit'
              ? '#fb923c'
              : v.subType === 'objective'
                ? '#38bdf8'
                : v.subType === 'skill'
                  ? '#a78bfa'
                  : '#ffffff';
        ctx.fillText(v.text, fx, fy);
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [selectedEntityId, showTacticalVectors]);

  const inspectedEntity =
    entities.find((e) => e.id === selectedEntityId) ||
    entities.find((e) => e.team === 'blue' && !e.isDead) ||
    entities[0];

  return (
    <div
      data-tour-id="tour-simulator-canvas"
      className="relative w-full aspect-square max-w-[580px] mx-auto rounded-2xl overflow-hidden border border-[#202d47] shadow-2xl bg-[#070b14]"
    >
      <canvas
        ref={canvasRef}
        width={580}
        height={580}
        onClick={handleCanvasClick}
        className="w-full h-full block cursor-pointer"
        title="คลิกที่ตัวละครบนสนามเพื่อดูเส้นทางเดินเกมและระยะโจมตี"
      />

      {/* Top-Left Live Unit Telemetry Overlay */}
      {inspectedEntity && (
        <div className="absolute top-3 left-3 bg-[#090d16]/90 backdrop-blur-md border border-[#1e293b] rounded-xl px-3 py-2 text-[11px] text-slate-200 shadow-lg pointer-events-none max-w-[245px]">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-bold text-white flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  inspectedEntity.team === 'blue' ? 'bg-blue-500' : 'bg-rose-500'
                }`}
              />
              {inspectedEntity.name} ({inspectedEntity.role})
            </span>
            <span className="text-[10px] font-mono text-amber-400">
              {inspectedEntity.kills}/{inspectedEntity.deaths}/{inspectedEntity.assists} • {inspectedEntity.cs} CS
            </span>
          </div>
          <div className="text-[10px] text-slate-400 truncate mb-1">
            {inspectedEntity.champion.name} • {inspectedEntity.currentAction}
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-150 ${
                inspectedEntity.team === 'blue' ? 'bg-emerald-400' : 'bg-rose-500'
              }`}
              style={{
                width: `${Math.max(
                  0,
                  Math.min(100, (inspectedEntity.currentHealth / inspectedEntity.maxHealth) * 100)
                )}%`
              }}
            />
          </div>
        </div>
      )}

      {/* Top-Right Tactical Vector Toggle & Engine Status */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setShowTacticalVectors((prev) => !prev)}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition backdrop-blur-md ${
            showTacticalVectors
              ? 'bg-blue-600/30 border-blue-400/50 text-blue-200'
              : 'bg-[#090d16]/90 border-[#1e293b] text-slate-400'
          }`}
          title="เปิด/ปิด เส้นเวกเตอร์ทิศทางเดินและระยะยิงของป้อม"
        >
          {showTacticalVectors ? '🎯 แสดงเวกเตอร์คำนวณ' : '🎯 ซ่อนเวกเตอร์'}
        </button>

        <div className="bg-[#090d16]/90 backdrop-blur-md border border-[#1e293b] rounded-lg px-2.5 py-1 text-[10px] font-semibold flex items-center gap-1.5 text-slate-300 pointer-events-none">
          <span
            className={`w-2 h-2 rounded-full ${
              isRunning ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
            }`}
          />
          <span>{isRunning ? 'FSM ENGINE LIVE' : 'PAUSED'}</span>
        </div>
      </div>

      {/* Bottom Legend */}
      <div className="absolute bottom-3 left-3 right-3 bg-[#0e1424]/90 backdrop-blur border border-[#202d47] text-[10px] px-3 py-1.5 rounded-lg flex flex-wrap items-center justify-between gap-2 text-slate-300 pointer-events-none">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> Blue (ทีมคุณ)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Red (คู่แข่ง)
          </span>
          <span className="text-sky-300">••• Minion Waves</span>
          <span className="text-amber-400">🐉 Dragon</span>
          <span className="text-purple-400">👑 Baron</span>
        </div>
        <span className="text-slate-400 hidden sm:inline">คลิกฮีโร่เพื่อดูระยะโจมตีจริง</span>
      </div>
    </div>
  );
};
