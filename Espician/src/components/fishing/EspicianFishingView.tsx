import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import {
  TWENTY_OCEAN_FISH_SPECIES,
  FISHING_RODS_CATALOG,
  FISHING_BAITS_CATALOG,
  OCEAN_MOODS,
  RARITY_CONFIG,
  FishRarity,
  FishSpeciesData,
  FishingRodItem,
  FishingBaitItem,
  CaughtFishInstance,
  OceanTimeMood,
  rollFishAndWaitTime,
  createCaughtFishInstance,
  getRealTimeOfDay,
  calculateBaseBiteChance,
  calculateTickWaitTime,
  performBiteRoll,
  rollFishSpecies
} from '../../core/data/fishingDatabase';
import {
  COSTUMES,
  CostumeItem,
  DAILY_POOL,
  MAIN_QUESTS,
  QuestDef,
  QuestMetric,
  QuestState,
  NPC_CAST,
  emptyQuestState,
  ensureDaily,
  questProgress,
  todayKey,
  trackQuest,
  expNeededForLevel,
  ACHIEVEMENT_CATALOG,
  AchievementDef,
  FISH_EXCHANGE_SHOP,
  FishExchangeItem
} from '../../core/data/fishingMeta';
import {
  ALL_ISLANDS,
  getIslandById,
  isIslandUnlocked,
  IslandBiome
} from '../../core/data/islandsData';
import { FishingPhase, renderOceanFishingScene, renderFishIllustration } from './FishingArtRenderer';
import { drawAngler } from './FishingCharacter';
import { renderRodPreview } from './FishingRodArt';
import { ReelMinigame } from './ReelMinigame';
import { soundEngine, SoundSettings } from '../../services/soundEngine';
import {
  GameLang,
  FISHING_UI,
  MOOD_EN,
  getSavedLang,
  saveLang,
  fishName,
  fishDesc,
  fishHabitat,
  rodName,
  rodDesc,
  baitName,
  baitDesc,
  costumeName,
  costumeDesc,
  questLabel,
  variantLabel,
  rodWaitTextI18n,
  rodControlTextI18n,
  rodLuckTextI18n
} from '../../core/data/fishingI18n';
import {
  Anchor,
  ShoppingBag,
  BookOpen,
  Fish,
  Coins,
  ArrowLeft,
  Layers,
  Zap,
  Bot,
  Waves,
  Target,
  Shirt,
  X,
  Check,
  Lock,
  Volume2,
  VolumeX,
  Settings,
  Globe,
  Compass,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { ApiService } from '../../services/apiService';
import { AnimeVfxSystem, GameActionButton } from '../ui/vfx';

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */
export interface PersistentFishingState {
  schemaVersion?: number;
  anglerLevel: number;
  anglerExp: number;
  seaCoins: number;
  ownedRodIds: string[];
  equippedRodId: string;
  baitInventory: Record<string, number>;
  equippedBaitId: string;
  caughtInventory: CaughtFishInstance[];
  encyclopediaMap: Record<
    string,
    { count: number; bestWeightKg: number; bestLengthCm: number; unlockedVariants: string[] }
  >;
  totalCatches: number;
  ownedCostumeIds: string[];
  equippedCostumeId: string;
  quests: QuestState;
  currentIslandId: string;
  unlockedIslandIds: string[];
  aquariumTier: number;
  ownedAquariumTiers: number[];
}

export interface AquariumTankDef {
  tier: number;
  id: string;
  nameTh: string;
  nameEn: string;
  subtitleTh: string;
  subtitleEn: string;
  descriptionTh: string;
  descriptionEn: string;
  capacity: number;
  coinMultiplier: number;
  price: number;
  requiredLevel: number;
  accentColor: string;
  waterColors: [string, string, string];
  sandGradient: [string, string];
  causticColor: string;
  particleType: 'bubble' | 'sparkle' | 'ember' | 'crystal' | 'stardust';
  floraStyle: 'seaweed' | 'coral' | 'vents' | 'ice' | 'nebula';
}

export const AQUARIUM_TANKS: AquariumTankDef[] = [
  {
    tier: 1,
    id: 'tank_starter',
    nameTh: 'ตู้กระจกใสธารมรกต',
    nameEn: 'Emerald Starter Glass Tank',
    subtitleTh: 'ตู้ปลามาตรฐานริมสะพานปลา',
    subtitleEn: 'Standard Pier Glass Tank',
    descriptionTh: 'ตู้ปลากระจกอะคริลิคใสพร้อมพื้นทรายธารมรกตและสาหร่ายเขียว เหมาะสำหรับผู้เริ่มต้นสะสมปลา',
    descriptionEn: 'Clear acrylic glass aquarium with emerald sand and lush green seaweeds.',
    capacity: 4,
    coinMultiplier: 1.0,
    price: 0,
    requiredLevel: 1,
    accentColor: '#10b981',
    waterColors: ['#0f3443', '#112233', '#081420'],
    sandGradient: ['#e2c290', '#b08968'],
    causticColor: 'rgba(180, 240, 255, 0.09)',
    particleType: 'bubble',
    floraStyle: 'seaweed'
  },
  {
    tier: 2,
    id: 'tank_coral',
    nameTh: 'ตู้ปะการังเรืองแสงนีออน',
    nameEn: 'Bioluminescent Coral Lagoon',
    subtitleTh: 'รังปะการังเรืองแสงหลากสี',
    subtitleEn: 'Vibrant Neon Coral Haven',
    descriptionTh: 'อัญมณีใต้สมุทรที่ประดับด้วยกิ่งปะการังเขากวางและดอกไม้ทะเลเรืองแสงสีชมพู-ม่วง พร้อมระบบกรองน้ำชีวภาพ',
    descriptionEn: 'Jewel of the sea adorned with glowing staghorn corals and sea anemones.',
    capacity: 8,
    coinMultiplier: 1.35,
    price: 3500,
    requiredLevel: 5,
    accentColor: '#ec4899',
    waterColors: ['#1e1b4b', '#1e293b', '#0f172a'],
    sandGradient: ['#f472b6', '#831843'],
    causticColor: 'rgba(236, 72, 153, 0.12)',
    particleType: 'sparkle',
    floraStyle: 'coral'
  },
  {
    tier: 3,
    id: 'tank_volcanic',
    nameTh: 'ตู้อเวจีลาวาน้ำลึก',
    nameEn: 'Deep Volcanic Abyssal Tank',
    subtitleTh: 'ปล่องความร้อนใต้สมุทรลาวา',
    subtitleEn: 'Hydrothermal Vent Sanctum',
    descriptionTh: 'ตู้ปลาเสริมแรงดันสูง ล้อมรอบด้วยหินบะซอลต์และปล่องลาวาพ่นละอองความร้อนสีอำพัน ให้บรรยากาศลึกลับน่าเกรงขาม',
    descriptionEn: 'Reinforced high-pressure tank surrounded by basalt rocks and glowing thermal vents.',
    capacity: 14,
    coinMultiplier: 1.8,
    price: 12000,
    requiredLevel: 12,
    accentColor: '#f97316',
    waterColors: ['#3b0764', '#1f1338', '#0b0416'],
    sandGradient: ['#991b1b', '#450a0a'],
    causticColor: 'rgba(249, 115, 22, 0.14)',
    particleType: 'ember',
    floraStyle: 'vents'
  },
  {
    tier: 4,
    id: 'tank_aurora',
    nameTh: 'ตู้วิหารธารน้ำแข็งออโรร่า',
    nameEn: 'Aurora Glacial Crystal Sanctum',
    subtitleTh: 'วิหารผลึกน้ำแข็งสะท้อนแสงเหนือ',
    subtitleEn: 'Northern Lights Crystal Dome',
    descriptionTh: 'สถาปัตยกรรมผลึกน้ำแข็งออโรร่าสะท้อนแสงสีเขียวมรกตและฟ้าเทอร์ควอยซ์ ลวดลายหรูหราพร้อมละอองหิมะใต้น้ำ',
    descriptionEn: 'Crystal glacial dome reflecting emerald auroral ribbons and diamond ice sparkles.',
    capacity: 22,
    coinMultiplier: 2.5,
    price: 38000,
    requiredLevel: 20,
    accentColor: '#06b6d4',
    waterColors: ['#042f2e', '#0c4a6e', '#022c22'],
    sandGradient: ['#bae6fd', '#0284c7'],
    causticColor: 'rgba(52, 211, 153, 0.16)',
    particleType: 'crystal',
    floraStyle: 'ice'
  },
  {
    tier: 5,
    id: 'tank_celestial',
    nameTh: 'มหาอควาเรียมแดนดาราสวรรค์',
    nameEn: 'Celestial Starlight Void Palace',
    subtitleTh: 'จักรวาลห้วงนิมิตไร้สิ้นสุด',
    subtitleEn: 'Infinite Astral Cosmic Palace',
    descriptionTh: 'สุดยอดตู้ปลาระดับพระราชวังลอยฟ้า ผสานห้วงอวกาศ กาแล็กซี และมวลหมู่ดาวตกใต้น้ำ จุสัตว์น้ำได้มหาศาล',
    descriptionEn: 'Supreme floating palace fusing deep space nebulae, cosmic dust, and swimming marine stars.',
    capacity: 32,
    coinMultiplier: 4.0,
    price: 95000,
    requiredLevel: 30,
    accentColor: '#8b5cf6',
    waterColors: ['#1e0b36', '#0f0826', '#05020c'],
    sandGradient: ['#ddd6fe', '#5b21b6'],
    causticColor: 'rgba(251, 191, 36, 0.22)',
    particleType: 'stardust',
    floraStyle: 'nebula'
  }
];

const FREE_BAIT_ID = FISHING_BAITS_CATALOG.find((b) => b.pricePerPack === 0)?.id || 'bait_sandworm';
const TOTAL_SPECIES = TWENTY_OCEAN_FISH_SPECIES.length;
const RARITY_ORDER: FishRarity[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Secret'];

const DEFAULT_FISHING_STATE: PersistentFishingState = {
  schemaVersion: 3,
  anglerLevel: 1,
  anglerExp: 0,
  seaCoins: 350,
  ownedRodIds: ['rod_bamboo'],
  equippedRodId: 'rod_bamboo',
  baitInventory: { [FREE_BAIT_ID]: 999, bait_krill: 5 },
  equippedBaitId: FREE_BAIT_ID,
  caughtInventory: [],
  encyclopediaMap: {},
  totalCatches: 0,
  ownedCostumeIds: ['costume_brown'],
  equippedCostumeId: 'costume_brown',
  quests: emptyQuestState(),
  currentIslandId: 'island_emerald_haven',
  unlockedIslandIds: ['island_emerald_haven'],
  aquariumTier: 1,
  ownedAquariumTiers: [1]
};

function normalizeState(raw: any): PersistentFishingState {
  // If old version detected without schemaVersion === 3, smoothly migrate
  const isV3 = raw && raw.schemaVersion === 3;
  const source = isV3 ? raw : DEFAULT_FISHING_STATE;

  const base: PersistentFishingState = { ...DEFAULT_FISHING_STATE, ...(source || {}) };
  const inv: Record<string, number> = { ...(base.baitInventory || {}) };
  Object.keys(inv).forEach((k) => {
    if (!FISHING_BAITS_CATALOG.some((b) => b.id === k)) delete inv[k];
  });
  inv[FREE_BAIT_ID] = 999;
  const rods = Array.from(new Set(['rod_bamboo', ...(base.ownedRodIds || [])])).filter((id) =>
    FISHING_RODS_CATALOG.some((r) => r.id === id)
  );
  const costumes = Array.from(new Set(['costume_brown', ...(base.ownedCostumeIds || [])])).filter((id) =>
    COSTUMES.some((c) => c.id === id)
  );
  const empty = emptyQuestState();
  const qIn = (base && base.quests) || empty;
  const quests = ensureDaily({
    stats: qIn.stats || {},
    daily: qIn.daily || empty.daily,
    mainClaimed: qIn.mainClaimed || {}
  });
  const unlockedIsles = Array.from(new Set(['island_emerald_haven', ...(base.unlockedIslandIds || [])]));
  const curIsle = unlockedIsles.includes(base.currentIslandId) ? base.currentIslandId : 'island_emerald_haven';
  const aquaTier = typeof base.aquariumTier === 'number' && base.aquariumTier >= 1 ? base.aquariumTier : 1;
  const ownedAqua = Array.isArray(base.ownedAquariumTiers) && base.ownedAquariumTiers.length > 0 ? Array.from(new Set([1, ...base.ownedAquariumTiers])) : [1];

  return {
    ...base,
    schemaVersion: 3,
    baitInventory: inv,
    equippedBaitId: FISHING_BAITS_CATALOG.some((b) => b.id === base.equippedBaitId) ? base.equippedBaitId : FREE_BAIT_ID,
    ownedRodIds: rods,
    equippedRodId: rods.includes(base.equippedRodId) ? base.equippedRodId : 'rod_bamboo',
    ownedCostumeIds: costumes,
    equippedCostumeId: costumes.includes(base.equippedCostumeId) ? base.equippedCostumeId : 'costume_brown',
    quests,
    currentIslandId: curIsle,
    unlockedIslandIds: unlockedIsles,
    aquariumTier: aquaTier,
    ownedAquariumTiers: ownedAqua
  };
}

function addExp(p: { anglerLevel: number; anglerExp: number }, exp: number) {
  let e = p.anglerExp + exp;
  let l = p.anglerLevel;
  while (e >= expNeededForLevel(l)) {
    e -= expNeededForLevel(l);
    l += 1;
  }
  return { anglerLevel: l, anglerExp: e };
}

/* ------------------------------------------------------------------ */
/* Small helpers & UI atoms                                            */
/* ------------------------------------------------------------------ */
type Tone = 'info' | 'good' | 'bad' | 'rare';
interface Toast {
  id: number;
  text: string;
  tone: Tone;
}
const TONE_BAR: Record<Tone, string> = {
  info: 'bg-white/70',
  good: 'bg-emerald-400',
  bad: 'bg-[#ff4655]',
  rare: 'bg-amber-300'
};

const shortName = (s: string) => s.replace(/\s*\(.*\)\s*/, '').trim();

const rodWaitText = (r: FishingRodItem) =>
  r.waitTimeReductionPct <= 0
    ? 'ปลากินเบ็ดตามจังหวะปกติของท้องทะเล'
    : r.waitTimeReductionPct < 20
    ? 'ช่วยให้ปลากินเบ็ดเร็วขึ้นเล็กน้อย'
    : r.waitTimeReductionPct < 40
    ? 'ปลากินเบ็ดเร็วขึ้นอย่างเห็นได้ชัด'
    : r.waitTimeReductionPct < 55
    ? 'ปลากินเบ็ดเร็วมาก ไม่ต้องรอนาน'
    : 'ปลาแทบรอไม่ไหวที่จะเข้ามากินเบ็ด';
const rodControlText = (r: FishingRodItem) =>
  r.sweetSpotSizeBonus <= 0
    ? 'แถบจับปลามีขนาดมาตรฐาน ต้องใช้สมาธิ'
    : r.sweetSpotSizeBonus < 30
    ? 'แถบจับปลากว้างขึ้นเล็กน้อย คุมปลาง่ายขึ้น'
    : r.sweetSpotSizeBonus < 50
    ? 'แถบจับปลากว้าง สายเบ็ดทนทานต่อแรงดึง'
    : 'แถบจับปลากว้างมาก สายเบ็ดแทบไม่หลุดมือ';
const rodLuckText = (r: FishingRodItem) =>
  r.rarityBoostMultiplier <= 1
    ? 'เหมาะกับปลาและสัตว์ทะเลทั่วไปตามชายฝั่ง'
    : r.rarityBoostMultiplier < 2
    ? 'ดึงดูดปลาหายากให้เข้ามาใกล้ขึ้น'
    : r.rarityBoostMultiplier < 4
    ? 'ปลาระดับ Epic และ Legendary เริ่มสนใจเหยื่อของคุณ'
    : 'เปิดประตูสู่ปลาและสัตว์ทะเลระดับ Secret';

const PANEL =
  'bg-white/95 backdrop-blur-xl border-2 border-sky-100 rounded-3xl shadow-[0_12px_36px_rgba(2,132,199,0.08)] text-slate-800';
const CUT_STYLE: React.CSSProperties = {
  borderRadius: '14px'
};

const FishPreviewCanvas: React.FC<{
  species: FishSpeciesData;
  hueShiftDeg?: number;
  width?: number;
  height?: number;
  scale?: number;
  discovered?: boolean;
}> = ({ species, hueShiftDeg = 0, width = 180, height = 110, scale = 1.15, discovered = true }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    let id = 0;
    const start = performance.now();
    const loop = (now: number) => {
      const ctx = ref.current?.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, width, height);
        ctx.save();
        if (!discovered) ctx.filter = 'brightness(0) opacity(0.5)';
        renderFishIllustration(ctx, species, width * 0.5, height * 0.52, scale, discovered ? hueShiftDeg : 0, (now - start) * 0.001, true);
        ctx.restore();
      }
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [species, hueShiftDeg, width, height, scale, discovered]);
  return <canvas ref={ref} width={width} height={height} className="mx-auto block" />;
};

const RodCanvas: React.FC<{ rod: FishingRodItem; width: number; height: number; animate?: boolean }> = ({
  rod,
  width,
  height,
  animate = true
}) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const tier = Math.max(0, FISHING_RODS_CATALOG.findIndex((r) => r.id === rod.id));
  useEffect(() => {
    let id = 0;
    const start = performance.now();
    const draw = (now: number) => {
      const ctx = ref.current?.getContext('2d');
      if (ctx) renderRodPreview(ctx, width, height, rod.rodColor, tier, (now - start) * 0.001);
      if (animate) id = requestAnimationFrame(draw);
    };
    id = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(id);
  }, [rod, width, height, animate, tier]);
  return <canvas ref={ref} width={width} height={height} className="block" />;
};

const ScenePreview: React.FC<{ costume: CostumeItem; rod: FishingRodItem }> = ({ costume, rod }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const tier = Math.max(0, FISHING_RODS_CATALOG.findIndex((r) => r.id === rod.id));
  useEffect(() => {
    let id = 0;
    const start = performance.now();
    const loop = (now: number) => {
      const c = ref.current;
      const ctx = c?.getContext('2d');
      if (c && ctx) {
        const t = (now - start) * 0.001;
        renderOceanFishingScene({
          ctx,
          width: c.width,
          height: c.height,
          timeSec: t,
          mood: 'sunset',
          phase: 'IDLE_READY',
          rodColor: rod.rodColor,
          rodTier: tier,
          waitProgress01: 0,
          reelTension01: 0,
          costume,
          rig: { breath: 0.5 + 0.5 * Math.sin(t * 2.1), sway: 0.5 + 0.5 * Math.sin(t * 1.4), blink: Math.sin(t * 0.8) > 0.97 ? 1 : 0 }
        });
      }
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [costume, rod, tier]);
  return <canvas ref={ref} width={640} height={360} className="w-full block" />;
};

const SpritePreviewStage: React.FC<{
  costume: CostumeItem;
  rod: FishingRodItem;
  action: 'idle' | 'walk' | 'cast' | 'jerk' | 'bite' | 'reeling' | 'victory' | 'fail' | 'retrieve';
}> = ({ costume, rod, action }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const tier = Math.max(0, FISHING_RODS_CATALOG.findIndex((r) => r.id === rod.id));

  useEffect(() => {
    let id = 0;
    const start = performance.now();
    const loop = (now: number) => {
      const c = ref.current;
      const ctx = c?.getContext('2d');
      if (c && ctx) {
        const t = (now - start) * 0.001;
        ctx.clearRect(0, 0, c.width, c.height);

        // Soft anime radial light beam
        const rad = ctx.createRadialGradient(
          c.width / 2,
          c.height * 0.65,
          10,
          c.width / 2,
          c.height * 0.65,
          130
        );
        rad.addColorStop(0, 'rgba(255, 70, 85, 0.15)');
        rad.addColorStop(0.6, 'rgba(254, 240, 138, 0.06)');
        rad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = rad;
        ctx.fillRect(0, 0, c.width, c.height);

        // Pedestal platform
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.strokeStyle = 'rgba(255, 70, 85, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(c.width / 2, c.height * 0.76, 75, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        let phase: FishingPhase = 'IDLE_READY';
        let entranceProgress01 = 1.0;
        let jerkAgeSec = 99;
        let castProgress01 = 0;

        if (action === 'walk') {
          phase = 'IDLE_READY';
          entranceProgress01 = (t * 0.35) % 0.7; // looping walk
        } else if (action === 'cast') {
          phase = 'CASTING';
          castProgress01 = (t * 0.8) % 1.0; // looping cast swing
        } else if (action === 'jerk') {
          phase = 'WAITING_FOR_BITE';
          jerkAgeSec = t % 0.7; // looping jerk line action
        } else if (action === 'bite') {
          phase = 'FISH_BITING';
        } else if (action === 'reeling') {
          phase = 'REELING_MINIGAME';
        } else if (action === 'victory') {
          phase = 'CATCH_REVEAL';
        } else if (action === 'fail') {
          phase = 'CATCH_FAIL';
        } else if (action === 'retrieve') {
          phase = 'RETRIEVING';
        }

        ctx.save();
        ctx.translate(c.width / 2 - 18, c.height * 0.74);
        ctx.scale(1.35, 1.35); // 1.35x zoom showcase
        ctx.translate(-c.width * 0.44 + 22, -c.height * 0.63);

        drawAngler(ctx, {
          pierEdgeX: c.width * 0.44,
          pierDeckY: c.height * 0.63,
          width: c.width,
          height: c.height,
          timeSec: t,
          phase,
          rodColor: rod.rodColor,
          rodTier: tier,
          reelTension01: 0.6,
          hookedSpecies: null,
          castProgress01,
          catchProgress01: 1,
          catchHue: 0,
          jerkAgeSec,
          costume,
          entranceProgress01,
          rig: {
            breath: 0.5 + 0.5 * Math.sin(t * 2.3),
            sway: 0.5 + 0.5 * Math.sin(t * 1.5),
            blink: 0
          }
        });
        ctx.restore();
      }
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [costume, rod, tier, action]);

  return <canvas ref={ref} width={480} height={280} className="w-full block bg-[#07070a]" />;
};

const Modal: React.FC<{
  onClose: () => void;
  hideCloseButton?: boolean;
  maxWidthClass?: string;
  children: React.ReactNode;
}> = ({ onClose, hideCloseButton = false, maxWidthClass = 'max-w-lg', children }) => (
  <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
    <div
      style={{ ...CUT_STYLE, animation: 'popIn .25s ease-out' }}
      className={`relative bg-white/98 backdrop-blur-2xl border-2 border-sky-100 shadow-[0_25px_60px_rgba(2,132,199,0.2)] rounded-3xl w-full ${maxWidthClass} max-h-[92vh] overflow-y-auto text-slate-800`}
      onClick={(e) => e.stopPropagation()}
    >
      {!hideCloseButton && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-500 border border-slate-200 flex items-center justify-center hover:scale-105 active:scale-95 shadow-sm z-30 transition"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      {children}
    </div>
  </div>
);

const AdminCheatModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  fishingState: PersistentFishingState;
  isAutoFishing: boolean;
  onToggleAutoFishing: () => void;
  onAddCoins: (amount: number) => void;
  onSetLevel: (level: number) => void;
  onUnlockAll: () => void;
  onInstantCatch: () => void;
  onResetSave: () => void;
  viewMode: 'user' | 'dev';
  onToggleViewMode: () => void;
  lang: GameLang;
}> = ({
  isOpen,
  onClose,
  fishingState,
  isAutoFishing,
  onToggleAutoFishing,
  onAddCoins,
  onSetLevel,
  onUnlockAll,
  onInstantCatch,
  onResetSave,
  viewMode,
  onToggleViewMode,
  lang
}) => {
  if (!isOpen) return null;
  return (
    <Modal onClose={onClose} maxWidthClass="max-w-2xl">
      <div className="p-6 space-y-5 bg-white text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-sky-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-600 font-bold text-lg shadow-sm">
              ⚡
            </div>
            <div>
              <div className="text-[10px] tracking-[0.2em] text-amber-600 uppercase font-mono font-black">
                DEVELOPER GOD-MODE CONSOLE
              </div>
              <h2 className="text-lg font-black text-slate-800">
                ADMIN CONTROL PANEL · MACGA GARRY
              </h2>
            </div>
          </div>
          <span className="px-2.5 py-1 text-[11px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300 rounded-xl">
            ROOT ACCESS: GRANTED
          </span>
        </div>

        {/* 1. AUTO-FISHING TOGGLE */}
        <div className="p-4 bg-emerald-50/70 border-2 border-emerald-200 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <div className="text-sm font-black text-emerald-800 flex items-center gap-2">
              <Bot className="w-4 h-4 text-emerald-600" />
              <span>ระบบตกปลาอัตโนมัติ (Auto-Fish God Mode)</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              เหวี่ยงเบ็ดอัตโนมัติ → ล่อปลาฮุบทันที → กรอสายชนะ 100% → เก็บปลาวนลูปต่อเนื่อง
            </p>
          </div>
          <button
            onClick={onToggleAutoFishing}
            className={`px-5 py-2.5 font-black text-xs tracking-wider transition rounded-xl shadow-sm ${
              isAutoFishing
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {isAutoFishing ? '🟢 AUTO-FISHING: ON' : '⚪ AUTO-FISHING: OFF'}
          </button>
        </div>

        {/* 2. STAT VIEW MODE (USER vs DEV) */}
        <div className="p-4 bg-purple-50/70 border-2 border-purple-200 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <div className="text-sm font-black text-purple-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>สลับมุมมองสถิติ (Inspection Stat Mode)</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {viewMode === 'dev'
                ? '🔬 กำลังแสดงโหมดเดฟ: เจาะลึกเปอร์เซ็นต์จริง, Pity %, เวลาจริง, อัตราฮุบเบ็ด'
                : '🎮 กำลังแสดงโหมดผู้เล่น: ซ่อนตัวเลขทศนิยม แสดงเฉพาะชื่อ RPG สมจริง'}
            </p>
          </div>
          <button
            onClick={onToggleViewMode}
            className={`px-4 py-2 font-black text-xs tracking-wider border rounded-xl transition shadow-sm ${
              viewMode === 'dev'
                ? 'bg-purple-600 text-white border-purple-400'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {viewMode === 'dev' ? '🔬 DEV STATS (ACTIVE)' : '🎮 USER RPG (ACTIVE)'}
          </button>
        </div>

        {/* 3. CURRENCY CHEATS (เพิ่ม/ลดเงิน) */}
        <div className="space-y-2">
          <div className="text-xs font-black text-amber-700 uppercase tracking-wider flex items-center gap-2">
            <Coins className="w-4 h-4" />
            <span>ปรับแต่งเงิน (Sea Coins) · ปัจจุบัน: {fishingState.seaCoins.toLocaleString()}</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <button
              onClick={() => onAddCoins(10000)}
              className="py-2 px-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 text-xs font-black font-mono transition rounded-xl"
            >
              +10,000
            </button>
            <button
              onClick={() => onAddCoins(100000)}
              className="py-2 px-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 text-xs font-black font-mono transition rounded-xl"
            >
              +100,000
            </button>
            <button
              onClick={() => onAddCoins(1000000)}
              className="py-2 px-2 bg-amber-100 hover:bg-amber-200 border border-amber-400 text-amber-900 text-xs font-black font-mono transition rounded-xl"
            >
              +1,000,000
            </button>
            <button
              onClick={() => onAddCoins(-10000)}
              className="py-2 px-2 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 text-xs font-black font-mono transition rounded-xl"
            >
              -10,000
            </button>
            <button
              onClick={() => onAddCoins(-100000)}
              className="py-2 px-2 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 text-xs font-black font-mono transition rounded-xl"
            >
              -100,000
            </button>
            <button
              onClick={() => onAddCoins(-fishingState.seaCoins)}
              className="py-2 px-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-600 text-xs font-black transition rounded-xl"
            >
              ล้างเงิน (0)
            </button>
          </div>
        </div>

        {/* 4. LEVEL & PROGRESSION CHEATS (เพิ่ม/ลดเลเวล) */}
        <div className="space-y-2">
          <div className="text-xs font-black text-sky-700 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>ปรับแต่งเลเวล (Angler Level) · ปัจจุบัน: Lv.{fishingState.anglerLevel}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <button
              onClick={() => onSetLevel(fishingState.anglerLevel + 1)}
              className="py-2 px-2 bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-800 text-xs font-black transition rounded-xl"
            >
              +1 Level
            </button>
            <button
              onClick={() => onSetLevel(fishingState.anglerLevel + 5)}
              className="py-2 px-2 bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-800 text-xs font-black transition rounded-xl"
            >
              +5 Levels
            </button>
            <button
              onClick={() => onSetLevel(55)}
              className="py-2 px-2 bg-sky-100 hover:bg-sky-200 border border-sky-400 text-sky-900 text-xs font-black transition rounded-xl"
            >
              Max Lv.55 (ตัน)
            </button>
            <button
              onClick={() => onSetLevel(Math.max(1, fishingState.anglerLevel - 1))}
              className="py-2 px-2 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 text-xs font-black transition rounded-xl"
            >
              -1 Level
            </button>
            <button
              onClick={() => onSetLevel(1)}
              className="py-2 px-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-600 text-xs font-black transition rounded-xl"
            >
              รีเซ็ต Lv.1
            </button>
          </div>
        </div>

        {/* 5. INSTANT UNLOCK & INVENTORY GOD-MODE */}
        <div className="space-y-2">
          <div className="text-xs font-black text-emerald-700 uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span>ปลดล็อคเนื้อหาทั้งหมด 100% (Instant Sandbox Unlock)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={onUnlockAll}
              className="py-3 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black text-xs tracking-wide shadow-md transition rounded-2xl"
            >
              🔓 ปลดล็อคเบ็ด, คอสตูม, เกาะ & เหยื่อ 999
            </button>
            <button
              onClick={onInstantCatch}
              className="py-3 px-3 bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-400 hover:to-blue-400 text-white font-black text-xs tracking-wide shadow-md transition rounded-2xl"
            >
              ⚡ ดึงปลาขึ้นทันที (Instant Catch)
            </button>
            <button
              onClick={onResetSave}
              className="py-3 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 font-black text-xs tracking-wide transition rounded-2xl"
            >
              🗑️ ล้างเซฟเริ่มต้นใหม่ (Reset State)
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

/* ------------------------------------------------------------------ */
/* Main view                                                           */
/* ------------------------------------------------------------------ */
interface EspicianFishingViewProps {
  onBackToPortal: () => void;
  userEmail?: string;
}

type TabId = 'bag' | 'shop' | 'encyclopedia' | 'aquarium' | 'quests' | 'wardrobe' | 'achieve' | 'exchange';
type Detail = { kind: 'rod' | 'bait' | 'costume'; id: string } | null;

export const EspicianFishingView: React.FC<EspicianFishingViewProps> = ({ onBackToPortal, userEmail }) => {
  const storageKey = `espician_fishing_state_${userEmail || 'guest'}`;

  const [fishingState, setFishingState] = useState<PersistentFishingState>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return normalizeState(JSON.parse(saved));
    } catch {
      /* ignore */
    }
    return normalizeState(null);
  });

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    ApiService.fetchMe()
      .then((res) => {
        if (mounted && res?.user) setCurrentUser(res.user);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    ApiService.getFishingState()
      .then((remote: Partial<PersistentFishingState> | null) => {
        if (mounted && remote && typeof remote.seaCoins === 'number') {
          setFishingState((prev) => normalizeState({ ...prev, ...remote }));
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(fishingState));
    } catch {
      /* ignore */
    }
    const timer = setTimeout(() => {
      ApiService.saveFishingState(fishingState).catch(() => {});
    }, 600);
    return () => clearTimeout(timer);
  }, [fishingState, storageKey]);

  // daily quest rollover while the page stays open
  useEffect(() => {
    const i = setInterval(() => {
      setFishingState((p) => (p.quests.daily.dateKey === todayKey() ? p : { ...p, quests: ensureDaily(p.quests) }));
    }, 60000);
    return () => clearInterval(i);
  }, []);

  // Real-time Day/Night Clock
  const [clockTime, setClockTime] = useState<Date>(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setClockTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const realTimeOfDay = getRealTimeOfDay();
  const mood: OceanTimeMood = realTimeOfDay === 'day' ? 'morning' : 'night_glow';

  // Admin & Dev Inspection States (Specifically for macga garry & admins)
  const isAdminUser = useMemo(() => {
    if (currentUser?.isAdmin) return true;
    const u = (currentUser?.username || '').toLowerCase();
    const e = (currentUser?.email || userEmail || '').toLowerCase();
    return u.includes('macga') || e.includes('macga') || e === 'zmacger@gmail.com' || u === 'admin';
  }, [currentUser, userEmail]);

  const [viewMode, setViewMode] = useState<'user' | 'dev'>('user');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [isAutoFishing, setIsAutoFishing] = useState(false);
  const [pityBonus, setPityBonus] = useState(0);

  const [phase, setPhase] = useState<FishingPhase>('IDLE_READY');
  const [activeTab, setActiveTab] = useState<TabId>('bag');
  const [fastMode, setFastMode] = useState(false);
  const [autoReel, setAutoReel] = useState(false);
  const [pendingSpecies, setPendingSpecies] = useState<FishSpeciesData | null>(null);
  const [latestCatch, setLatestCatch] = useState<CaughtFishInstance | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [jerkCooling, setJerkCooling] = useState(false);
  const [detail, setDetail] = useState<Detail>(null);
  const [lang, setLang] = useState<GameLang>(() => getSavedLang());
  const [soundSettings, setSoundSettings] = useState<SoundSettings>(() => soundEngine.getSettings());
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isEntranceCutscene, setIsEntranceCutscene] = useState(true);
  const [isIslandMapOpen, setIsIslandMapOpen] = useState(false);
  const [selectedIslandId, setSelectedIslandId] = useState<string | null>(null);
  const [selectedNpcQuest, setSelectedNpcQuest] = useState<QuestDef | null>(null);
  const t = FISHING_UI[lang];

  const currentIsland = useMemo(
    () => getIslandById(fishingState.currentIslandId),
    [fishingState.currentIslandId]
  );

  useEffect(() => {
    soundEngine.setIsland(fishingState.currentIslandId);
  }, [fishingState.currentIslandId]);

  const toggleLang = () => {
    const next: GameLang = lang === 'th' ? 'en' : 'th';
    setLang(next);
    saveLang(next);
    soundEngine.playClick();
  };

  useEffect(() => {
    const unsub = soundEngine.subscribe((s) => setSoundSettings(s));
    const startAudio = () => {
      soundEngine.startBgm();
    };
    window.addEventListener('pointerdown', startAudio, { once: true });
    return () => {
      unsub();
      window.removeEventListener('pointerdown', startAudio);
      soundEngine.stopBgm();
    };
  }, []);

  const waitRef = useRef({ total: 60, remaining: 60 });
  const [waitSecondsRemaining, setWaitSecondsRemaining] = useState(60);
  const phaseRef = useRef<FishingPhase>('IDLE_READY');
  phaseRef.current = phase;
  const catchHueRef = useRef(0);
  const toastId = useRef(0);
  const castSeq = useRef(0);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const flashRef = useRef<HTMLDivElement | null>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const aquariumCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // GSAP-driven rig values (character idle, cast, jerk, catch, entrance walk & sit)
  const animRef = useRef({ breath: 0.5, sway: 0.5, blink: 0, cast: 0, catchP: 0, jerk: 1, entrance: 0 });

  const playEntranceCutscene = useCallback(() => {
    setIsEntranceCutscene(true);
    const a = animRef.current;
    a.entrance = 0;
    gsap.killTweensOf(a, 'entrance');

    let lastStep = -1;
    let playedSitSound = false;

    gsap.to(a, {
      entrance: 1,
      duration: 2.7,
      ease: 'power1.inOut',
      onUpdate: () => {
        // Footstep clicks while walking along the wooden pier (0..0.72)
        if (a.entrance < 0.72) {
          const stepNum = Math.floor((a.entrance / 0.72) * 8);
          if (stepNum !== lastStep) {
            lastStep = stepNum;
            soundEngine.playFootstep(stepNum % 2 === 0);
          }
        } else if (!playedSitSound && a.entrance >= 0.72) {
          playedSitSound = true;
          soundEngine.playSitDown();
        }
      },
      onComplete: () => {
        setIsEntranceCutscene(false);
      }
    });
  }, []);

  const skipEntranceCutscene = useCallback(() => {
    const a = animRef.current;
    gsap.killTweensOf(a, 'entrance');
    a.entrance = 1;
    setIsEntranceCutscene(false);
  }, []);

  useEffect(() => {
    playEntranceCutscene();
  }, [playEntranceCutscene]);

  useEffect(() => {
    const a = animRef.current;
    const ctx = gsap.context(() => {
      gsap.to(a, { breath: 1, duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      gsap.to(a, { sway: 1, duration: 3.4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.4 });
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.4 });
      tl.to(a, { blink: 1, duration: 0.07 }).to(a, { blink: 0, duration: 0.12 });
      tl.eventCallback('onRepeat', () => {
        tl.repeatDelay(1.8 + Math.random() * 4);
      });
    });
    return () => {
      gsap.killTweensOf(a);
      ctx.revert();
    };
  }, []);

  const notify = useCallback((text: string, tone: Tone = 'info') => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-3), { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  const equippedRod = useMemo(
    () => FISHING_RODS_CATALOG.find((r) => r.id === fishingState.equippedRodId) || FISHING_RODS_CATALOG[0],
    [fishingState.equippedRodId]
  );
  const rodTier = Math.max(0, FISHING_RODS_CATALOG.findIndex((r) => r.id === equippedRod.id));
  const equippedBait = useMemo(
    () => FISHING_BAITS_CATALOG.find((b) => b.id === fishingState.equippedBaitId) || FISHING_BAITS_CATALOG[0],
    [fishingState.equippedBaitId]
  );
  const equippedCostume = useMemo(
    () => COSTUMES.find((c) => c.id === fishingState.equippedCostumeId) || COSTUMES[0],
    [fishingState.equippedCostumeId]
  );
  const expForNextLevel = expNeededForLevel(fishingState.anglerLevel);

  const currentAquariumTier = fishingState.aquariumTier || 1;
  const currentTank = useMemo(
    () => AQUARIUM_TANKS.find((t) => t.tier === currentAquariumTier) || AQUARIUM_TANKS[0],
    [currentAquariumTier]
  );
  const [aquaSubTab, setAquaSubTab] = useState<'in_tank' | 'add_fish' | 'shop_tank'>('in_tank');
  const [showTankModal, setShowTankModal] = useState(false);
  const [showFishSelectModal, setShowFishSelectModal] = useState(false);

  const aquariumFishList = useMemo(
    () => fishingState.caughtInventory.filter((f) => f.isLockedInAquarium),
    [fishingState.caughtInventory]
  );

  const availableFishToAdd = useMemo(
    () => fishingState.caughtInventory.filter((f) => !f.isLockedInAquarium),
    [fishingState.caughtInventory]
  );

  const basePassiveCoinsPerMin = useMemo(
    () =>
      aquariumFishList.reduce((sum, item) => {
        const sp = TWENTY_OCEAN_FISH_SPECIES.find((s) => s.id === item.speciesId);
        return sp ? sum + Math.max(2, Math.round(sp.basePrice * 0.03)) : sum;
      }, 0),
    [aquariumFishList]
  );

  const totalPassiveCoinsPerMin = useMemo(
    () => Math.round(basePassiveCoinsPerMin * currentTank.coinMultiplier),
    [basePassiveCoinsPerMin, currentTank.coinMultiplier]
  );

  useEffect(() => {
    if (totalPassiveCoinsPerMin <= 0) return;
    const gain = Math.max(1, Math.round(totalPassiveCoinsPerMin / 3));
    const i = setInterval(() => setFishingState((p) => ({ ...p, seaCoins: p.seaCoins + gain })), 20000);
    return () => clearInterval(i);
  }, [totalPassiveCoinsPerMin]);

  const ownedBaits = useMemo(
    () =>
      FISHING_BAITS_CATALOG.filter((b) => b.pricePerPack === 0 || (fishingState.baitInventory[b.id] || 0) > 0),
    [fishingState.baitInventory]
  );
  const baitCount = (b: FishingBaitItem) => (b.pricePerPack === 0 ? Infinity : fishingState.baitInventory[b.id] || 0);

  /* ---------------- quests ---------------- */
  const questClaimable = useMemo(() => {
    const q = fishingState.quests;
    let n = 0;
    q.daily.ids.forEach((id) => {
      const d = DAILY_POOL.find((x) => x.id === id);
      if (d && !q.daily.claimed[id] && questProgress(d, q, 'daily', fishingState.anglerLevel) >= d.target) n++;
    });
    for (let i = 0; i < MAIN_QUESTS.length; i++) {
      const m = MAIN_QUESTS[i];
      if (q.mainClaimed[m.id]) continue;
      if (questProgress(m, q, 'main', fishingState.anglerLevel) >= m.target) n++;
      break;
    }
    return n;
  }, [fishingState.quests, fishingState.anglerLevel]);

  const claimQuest = (kind: 'daily' | 'main', def: QuestDef) => {
    const q = fishingState.quests;
    const claimed = kind === 'daily' ? q.daily.claimed[def.id] : q.mainClaimed[def.id];
    if (claimed || questProgress(def, q, kind, fishingState.anglerLevel) < def.target) return;
    const before = fishingState.anglerLevel;
    const gain = addExp(fishingState, def.exp);
    setFishingState((p) => {
      const g = addExp(p, def.exp);
      return {
        ...p,
        seaCoins: p.seaCoins + def.coins,
        anglerLevel: g.anglerLevel,
        anglerExp: g.anglerExp,
        quests:
          kind === 'daily'
            ? { ...p.quests, daily: { ...p.quests.daily, claimed: { ...p.quests.daily.claimed, [def.id]: true } } }
            : { ...p.quests, mainClaimed: { ...p.quests.mainClaimed, [def.id]: true } }
      };
    });
    soundEngine.playCoin();
    notify(`${t.claimReward} +${def.coins.toLocaleString()}`, 'good');
    if (gain.anglerLevel > before) notify(t.levelUp, 'good');
  };

  /* ---------------- fishing flow ---------------- */
  const handleCastLine = () => {
    if (isEntranceCutscene) {
      skipEntranceCutscene();
    }
    soundEngine.startBgm();
    soundEngine.playCast();
    setTimeout(() => soundEngine.playSplash(), 1450);
    let bait = equippedBait;
    const free = bait.pricePerPack === 0;
    if (!free && (fishingState.baitInventory[bait.id] || 0) <= 0) {
      bait = FISHING_BAITS_CATALOG.find((b) => b.id === FREE_BAIT_ID) || FISHING_BAITS_CATALOG[0];
      setFishingState((p) => ({ ...p, equippedBaitId: FREE_BAIT_ID }));
      notify(t.outOfBaitSwitch, 'bad');
    } else if (!free) {
      const id = bait.id;
      const left = (fishingState.baitInventory[id] || 1) - 1;
      setFishingState((p) => ({
        ...p,
        baitInventory: { ...p.baitInventory, [id]: Math.max(0, (p.baitInventory[id] || 1) - 1) }
      }));
      if (left <= 0) notify(t.lastBait, 'bad');
    }
    castSeq.current += 1;
    const initialWait = calculateTickWaitTime(equippedRod, equippedBait, fastMode);
    waitRef.current = { total: initialWait, remaining: initialWait };
    setWaitSecondsRemaining(initialWait);
    setPendingSpecies(null);
    setLatestCatch(null);
    setFishingState((p) => ({ ...p, quests: trackQuest(p.quests, 'cast') }));
    setPhase('CASTING');
    const a = animRef.current;
    a.cast = 0;
    gsap.to(a, {
      cast: 1,
      duration: 1.8,
      ease: 'power2.out',
      onComplete: () => {
        if (phaseRef.current === 'CASTING') setPhase('WAITING_FOR_BITE');
      }
    });
  };

  // Percentage & Pity 1-minute Tick Bite Engine
  useEffect(() => {
    if (phase !== 'WAITING_FOR_BITE') return;
    const timer = setInterval(() => {
      waitRef.current.remaining -= 1;
      setWaitSecondsRemaining(Math.max(0, waitRef.current.remaining));
      if (waitRef.current.remaining <= 0) {
        // Regular 1-min roll
        const res = performBiteRoll(
          equippedRod,
          equippedBait,
          pityBonus,
          false,
          fishingState.currentIslandId,
          realTimeOfDay
        );
        if (res.hit && res.species) {
          clearInterval(timer);
          setPendingSpecies(res.species);
          setPityBonus(0);
          setPhase('FISH_BITING');
          soundEngine.playBite();
          notify(t.fishBiting, 'rare');
        } else {
          setPityBonus(res.newPity);
          const nextWait = calculateTickWaitTime(equippedRod, equippedBait, fastMode);
          waitRef.current = { total: nextWait, remaining: nextWait };
          setWaitSecondsRemaining(nextWait);
          if (viewMode === 'dev') {
            notify(`[DEV] Regular check missed. Pity accumulated: +${(res.newPity * 100).toFixed(2)}%`, 'info');
          } else {
            notify(
              lang === 'th'
                ? '🌊 ยังไม่มีปลากินเบ็ด... แต่ปลาเริ่มว่ายวนเข้ามาตอมเหยื่อ (+โอกาส)'
                : '🌊 No bite yet... fish circling around the bait (+Pity)',
              'info'
            );
          }
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, fastMode, equippedRod, equippedBait, pityBonus, fishingState.currentIslandId, realTimeOfDay, viewMode, lang, notify, t.fishBiting]);

  const handleJerk = () => {
    if (phase !== 'WAITING_FOR_BITE' || jerkCooling) return;
    soundEngine.playJerk();
    const a = animRef.current;
    a.jerk = 0;
    gsap.to(a, { jerk: 1, duration: 0.7, ease: 'none' });
    setJerkCooling(true);
    setTimeout(() => setJerkCooling(false), 3000);
    setFishingState((p) => ({ ...p, quests: trackQuest(p.quests, 'jerk') }));

    // Immediate Jerk roll (10% of regular bite rate)
    const res = performBiteRoll(
      equippedRod,
      equippedBait,
      pityBonus,
      true,
      fishingState.currentIslandId,
      realTimeOfDay
    );
    if (res.hit && res.species) {
      setPendingSpecies(res.species);
      setPityBonus(0);
      setPhase('FISH_BITING');
      soundEngine.playBite();
      notify(lang === 'th' ? '⚡ กระตุกสายโดนใจ! ปลาติดเบ็ดทันที!' : '⚡ Line jerked! Immediate strike!', 'rare');
    } else {
      setPityBonus(res.newPity);
      notify(
        lang === 'th'
          ? `🎣 กระตุกสายล่อปลา... ปลาระแวงแต่เริ่มสนใจ (+Pity)`
          : `🎣 Line jerked... water stirred (+Pity)`,
        'info'
      );
    }
  };

  const startReeling = useCallback(() => {
    if (!pendingSpecies) return;
    soundEngine.playClick();
    catchHueRef.current = 0;
    setPhase('REELING_MINIGAME');
  }, [pendingSpecies]);

  useEffect(() => {
    if (phase !== 'FISH_BITING') return;
    const tm = setTimeout(
      () => {
        if (autoReel) startReeling();
        else {
          soundEngine.playFail();
          setPhase('CATCH_FAIL');
          setPendingSpecies(null);
          notify(t.fishEscaped, 'bad');
          setTimeout(() => setPhase('IDLE_READY'), 2000);
        }
      },
      autoReel ? 600 : 300000 // Fish nibbles for up to 5 minutes before escaping
    );
    return () => clearTimeout(tm);
  }, [phase, autoReel, startReeling, notify, t.fishEscaped]);

  const handleReelDone = useCallback(
    (win: boolean) => {
      if (!pendingSpecies) return;
      if (!win) {
        soundEngine.playFail();
        setPhase('CATCH_FAIL');
        setPendingSpecies(null);
        notify(t.gotAway, 'bad');
        setTimeout(() => setPhase('IDLE_READY'), 2200);
        return;
      }
      const sp = pendingSpecies;
      soundEngine.playSplash();
      soundEngine.playCatch(sp.rarity);
      const caught = createCaughtFishInstance(sp, mood, fishingState.totalCatches + castSeq.current);
      catchHueRef.current = caught.hueShiftDeg;
      setLatestCatch(caught);
      setPhase('CATCHING');

      const isNew = !fishingState.encyclopediaMap[sp.id];
      const before = fishingState.anglerLevel;
      const gain = addExp(fishingState, sp.expReward);
      const ri = RARITY_ORDER.indexOf(sp.rarity);

      setFishingState((prev) => {
        const g = addExp(prev, sp.expReward);
        let q = trackQuest(prev.quests, 'catch');
        if (ri >= 1) q = trackQuest(q, 'catch_uncommon_plus');
        if (ri >= 2) q = trackQuest(q, 'catch_rare_plus');
        if (ri >= 3) q = trackQuest(q, 'catch_epic_plus');
        if (sp.category === 'creature') q = trackQuest(q, 'catch_creature');
        if (!prev.encyclopediaMap[sp.id]) q = trackQuest(q, 'new_species');

        // Check Bag Limit (10 Fish Max, excluding aquarium fish)
        const bagFish = prev.caughtInventory.filter((f) => !f.isLockedInAquarium);
        const isBagFull = bagFish.length >= 10;
        let newInventory = prev.caughtInventory;
        let extraCoins = 0;

        if (isBagFull) {
          extraCoins = caught.sellPrice;
          q = trackQuest(q, 'earn_coins', extraCoins);
        } else {
          newInventory = [caught, ...prev.caughtInventory];
        }

        const entry = prev.encyclopediaMap[sp.id] || { count: 0, bestWeightKg: 0, bestLengthCm: 0, unlockedVariants: [] };
        return {
          ...prev,
          seaCoins: prev.seaCoins + extraCoins,
          anglerLevel: g.anglerLevel,
          anglerExp: g.anglerExp,
          totalCatches: prev.totalCatches + 1,
          caughtInventory: newInventory,
          quests: q,
          encyclopediaMap: {
            ...prev.encyclopediaMap,
            [sp.id]: {
              count: entry.count + 1,
              bestWeightKg: Math.max(entry.bestWeightKg, caught.weightKg),
              bestLengthCm: Math.max(entry.bestLengthCm, caught.lengthCm),
              unlockedVariants: entry.unlockedVariants.includes(caught.variantTitle)
                ? entry.unlockedVariants
                : [...entry.unlockedVariants, caught.variantTitle]
            }
          }
        };
      });

      const bagFishNow = fishingState.caughtInventory.filter((f) => !f.isLockedInAquarium);
      if (bagFishNow.length >= 10) {
        soundEngine.playCoin();
        notify(
          lang === 'th'
            ? `🎒 กระเป๋าเต็ม (สูงสุด 10 ตัว)! ขาย ${fishName(sp, lang)} ได้รับ ${caught.sellPrice.toLocaleString()} เหรียญอัตโนมัติ`
            : `🎒 Bag full (10 max)! Auto-sold ${fishName(sp, 'en')} for ${caught.sellPrice.toLocaleString()} Coins`,
          'rare'
        );
      }

      if (isNew) notify(`${t.newDiscovery} · ${fishName(sp, lang)}`, 'rare');
      if (gain.anglerLevel > before) setTimeout(() => notify(t.levelUp, 'good'), 400);

      const a = animRef.current;
      a.catchP = 0;
      gsap.to(a, {
        catchP: 1,
        duration: 2.4,
        ease: 'power1.inOut',
        onComplete: () => setPhase('CATCH_REVEAL')
      });
      if (flashRef.current) {
        flashRef.current.style.background = RARITY_CONFIG[sp.rarity].glowColor;
        gsap.fromTo(
          flashRef.current,
          { opacity: ri >= 3 ? 0.75 : 0.35 },
          { opacity: 0, duration: 0.9, ease: 'power2.out', delay: 2.1 }
        );
      }
    },
    [pendingSpecies, mood, fishingState, notify, lang, t.gotAway, t.levelUp, t.newDiscovery]
  );

  useEffect(() => {
    if (phase === 'CATCH_REVEAL' && cardRef.current) {
      const el = cardRef.current;
      gsap.fromTo(el, { scale: 0.72, opacity: 0, y: 28 }, { scale: 1, opacity: 1, y: 0, duration: 0.55, ease: 'back.out(1.8)' });
      gsap.fromTo(
        el.querySelectorAll('[data-pop]'),
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.08, delay: 0.25, ease: 'power2.out' }
      );
      if (latestCatch) {
        const sp = TWENTY_OCEAN_FISH_SPECIES.find((s) => s.id === latestCatch.speciesId);
        if (sp) AnimeVfxSystem.triggerVictoryCelebration(sp.rarity);
      }
    }
  }, [phase, latestCatch]);

  // Auto-Fishing Loop for Admin Testing
  useEffect(() => {
    if (!isAutoFishing) return;
    const loopTimer = setInterval(() => {
      if (phaseRef.current === 'IDLE_READY' && !isEntranceCutscene) {
        handleCastLine();
      } else if (phaseRef.current === 'WAITING_FOR_BITE') {
        if (waitRef.current.remaining > 2) {
          waitRef.current.remaining = 1;
        }
      } else if (phaseRef.current === 'FISH_BITING') {
        startReeling();
      } else if (phaseRef.current === 'REELING_MINIGAME') {
        handleReelDone(true);
      } else if (phaseRef.current === 'CATCH_REVEAL') {
        setPhase('IDLE_READY');
      }
    }, 850);
    return () => clearInterval(loopTimer);
  }, [isAutoFishing, isEntranceCutscene, handleCastLine, startReeling, handleReelDone]);

  // Admin Cheat actions for macga garry
  const adminAddCoins = (amount: number) => {
    setFishingState((p) => ({ ...p, seaCoins: Math.max(0, p.seaCoins + amount) }));
    soundEngine.playCoin();
    notify(`Admin: ${amount > 0 ? '+' : ''}${amount.toLocaleString()} Sea Coins`, 'good');
  };

  const adminSetLevel = (targetLevel: number) => {
    setFishingState((p) => ({
      ...p,
      anglerLevel: Math.max(1, targetLevel),
      anglerExp: 0
    }));
    soundEngine.playLevelUp();
    notify(`Admin: Set Angler Level to ${targetLevel}`, 'good');
  };

  const adminUnlockAll = () => {
    const allRods = FISHING_RODS_CATALOG.map((r) => r.id);
    const allCostumes = COSTUMES.map((c) => c.id);
    const allIsles = ALL_ISLANDS.map((i) => i.id);
    const fullBaits: Record<string, number> = {};
    FISHING_BAITS_CATALOG.forEach((b) => {
      fullBaits[b.id] = 999;
    });

    setFishingState((p) => ({
      ...p,
      seaCoins: p.seaCoins + 500000,
      anglerLevel: Math.max(p.anglerLevel, 55),
      ownedRodIds: allRods,
      ownedCostumeIds: allCostumes,
      unlockedIslandIds: allIsles,
      baitInventory: fullBaits,
      aquariumTier: 5,
      ownedAquariumTiers: [1, 2, 3, 4, 5]
    }));
    soundEngine.playCatch('Secret');
    notify('Admin: Unlocked all Rods, Costumes, Islands, Baits & 5 Aquarium Tanks!', 'rare');
  };

  const adminInstantCatch = () => {
    if (phase === 'WAITING_FOR_BITE' || phase === 'FISH_BITING' || phase === 'REELING_MINIGAME') {
      const sp = pendingSpecies || rollFishSpecies(equippedRod, equippedBait, realTimeOfDay, fishingState.currentIslandId);
      setPendingSpecies(sp);
      handleReelDone(true);
      notify('Admin: Instant Catch Triggered!', 'rare');
    } else {
      notify('Admin: Cast line first to instant catch', 'info');
    }
  };

  /* ---------------- scene loop ---------------- */
  const sceneRef = useRef<any>({});
  sceneRef.current = {
    mood,
    phase,
    rodColor: equippedRod.rodColor,
    rodTier,
    species: pendingSpecies,
    costume: equippedCostume,
    islandId: fishingState.currentIslandId,
    timeOfDay: realTimeOfDay
  };
  /* ---------------- 60-120 FPS 2D Rig Scene Loop ---------------- */
  useEffect(() => {
    let id = 0;
    const start = performance.now();
    const loop = (now: number) => {
      const canvas = mainCanvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        const s = sceneRef.current;
        const a = animRef.current;
        renderOceanFishingScene({
          ctx,
          width: canvas.width,
          height: canvas.height,
          timeSec: (now - start) * 0.001,
          mood: s.mood,
          phase: s.phase,
          rodColor: s.rodColor,
          rodTier: s.rodTier,
          waitProgress01: 0,
          reelTension01: s.phase === 'REELING_MINIGAME' ? 0.6 : 0.3,
          hookedSpecies: s.species,
          castProgress01: a.cast,
          catchProgress01: a.catchP,
          catchHue: catchHueRef.current,
          jerkAgeSec: a.jerk >= 1 ? 99 : a.jerk * 0.7,
          costume: s.costume,
          entranceProgress01: a.entrance,
          islandId: s.islandId,
          timeOfDay: s.timeOfDay,
          rig: { breath: a.breath, sway: a.sway, blink: a.blink }
        });
      }
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);

  /* ---------------- high-end anime aquarium loop ---------------- */
  useEffect(() => {
    if (activeTab !== 'aquarium') return;
    let id = 0;
    const start = performance.now();
    const loop = (now: number) => {
      const canvas = aquariumCanvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        const w = canvas.width,
          h = canvas.height,
          t = (now - start) * 0.001;

        // 1. Theme-based deep oceanic water gradient
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, currentTank.waterColors[0]);
        grad.addColorStop(0.55, currentTank.waterColors[1]);
        grad.addColorStop(1, currentTank.waterColors[2]);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // 2. Cosmic / Aurora sky effects for Tier 4 & 5
        if (currentTank.floraStyle === 'nebula') {
          // Celestial floating stars & stardust
          for (let s = 0; s < 28; s++) {
            const sx = (s * 43 + Math.sin(t * 0.5 + s) * 12) % w;
            const sy = (s * 23 + Math.cos(t * 0.4 + s) * 8) % (h * 0.65);
            const sr = 1 + (s % 3) * 0.8 + Math.sin(t * 3 + s) * 0.5;
            ctx.fillStyle = s % 2 === 0 ? 'rgba(253, 224, 71, 0.75)' : 'rgba(192, 132, 252, 0.65)';
            ctx.beginPath();
            ctx.arc(sx, sy, Math.max(0.6, sr), 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (currentTank.floraStyle === 'ice') {
          // Aurora Northern Lights ribbon
          ctx.save();
          ctx.globalAlpha = 0.28;
          const auroraGrad = ctx.createLinearGradient(0, 0, w, 0);
          auroraGrad.addColorStop(0, '#06b6d4');
          auroraGrad.addColorStop(0.5, '#10b981');
          auroraGrad.addColorStop(1, '#3b82f6');
          ctx.fillStyle = auroraGrad;
          ctx.beginPath();
          ctx.moveTo(0, 15);
          for (let x = 0; x <= w; x += 30) {
            const y = 25 + Math.sin(x * 0.015 + t * 1.2) * 16 + Math.cos(x * 0.03 + t) * 8;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(w, 0);
          ctx.lineTo(0, 0);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        // 3. Dynamic Volumetric Caustic Light Beams (Sunlight rays dancing through water)
        for (let r = 0; r < 5; r++) {
          ctx.fillStyle = currentTank.causticColor;
          ctx.beginPath();
          const rx = 50 + r * (w / 4.4) + Math.sin(t * 0.8 + r * 1.3) * 20;
          const topWidth = 20 + Math.sin(t + r) * 8;
          const bottomWidth = 85 + Math.cos(t * 0.9 + r) * 18;
          ctx.moveTo(rx, 0);
          ctx.lineTo(rx + topWidth, 0);
          ctx.lineTo(rx + bottomWidth + 35, h);
          ctx.lineTo(rx - 20, h);
          ctx.closePath();
          ctx.fill();
        }

        // 4. Layered Seabed Sand with Gradient & Texture
        const sandGrad = ctx.createLinearGradient(0, h - 45, 0, h);
        sandGrad.addColorStop(0, currentTank.sandGradient[0]);
        sandGrad.addColorStop(1, currentTank.sandGradient[1]);
        ctx.fillStyle = sandGrad;
        ctx.beginPath();
        ctx.moveTo(0, h - 35);
        for (let x = 0; x <= w; x += 40) {
          const sy = h - 35 + Math.sin(x * 0.02 + 1) * 4;
          ctx.lineTo(x, sy);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();

        // Seabed accent pebbles
        for (let k = 0; k < 6; k++) {
          const kx = 40 + k * (w / 5.2) + (k % 2 ? 15 : -10);
          const ky = h - 18 + (k % 3) * 3;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.beginPath();
          ctx.ellipse(kx, ky, 15 + (k % 4) * 4, 7 + (k % 3) * 2, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // 5. Swaying Flora / Monoliths
        if (currentTank.floraStyle === 'seaweed') {
          for (let s = 0; s < 11; s++) {
            const sx = 25 + s * (w / 11.5);
            const sway = Math.sin(t * 2.2 + s * 0.8) * (10 + (s % 3) * 4);
            ctx.strokeStyle = s % 2 === 0 ? '#10b981' : '#059669';
            ctx.lineWidth = 4.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(sx, h - 25);
            ctx.quadraticCurveTo(sx + sway, h - 65, sx + sway * 1.5, h - 105 - (s % 4) * 12);
            ctx.stroke();
          }
        } else if (currentTank.floraStyle === 'coral') {
          for (let s = 0; s < 9; s++) {
            const sx = 35 + s * (w / 9.5);
            const sway = Math.sin(t * 1.8 + s) * 7;
            ctx.strokeStyle = s % 3 === 0 ? '#f43f5e' : s % 3 === 1 ? '#d946ef' : '#fb923c';
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(sx, h - 25);
            ctx.quadraticCurveTo(sx + sway, h - 60, sx + sway * 1.3, h - 90);
            ctx.stroke();
            // Branch
            ctx.beginPath();
            ctx.moveTo(sx + sway * 0.6, h - 55);
            ctx.lineTo(sx + sway + 14, h - 75);
            ctx.moveTo(sx + sway * 0.6, h - 55);
            ctx.lineTo(sx + sway - 12, h - 72);
            ctx.stroke();
          }
        } else if (currentTank.floraStyle === 'vents') {
          for (let v = 0; v < 4; v++) {
            const vx = 60 + v * (w / 4);
            ctx.fillStyle = '#1c1917';
            ctx.beginPath();
            ctx.moveTo(vx - 22, h - 22);
            ctx.lineTo(vx - 10, h - 65);
            ctx.lineTo(vx + 10, h - 65);
            ctx.lineTo(vx + 22, h - 22);
            ctx.closePath();
            ctx.fill();
            // Vent glow
            ctx.fillStyle = 'rgba(249, 115, 22, 0.75)';
            ctx.beginPath();
            ctx.ellipse(vx, h - 65, 9, 3, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (currentTank.floraStyle === 'ice') {
          for (let ic = 0; ic < 8; ic++) {
            const ix = 30 + ic * (w / 8.5);
            const ih = 70 + (ic % 4) * 25;
            ctx.fillStyle = 'rgba(186, 230, 253, 0.45)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(ix - 12, h - 25);
            ctx.lineTo(ix, h - 25 - ih);
            ctx.lineTo(ix + 12, h - 25);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
        } else {
          // Nebula Cosmic Monoliths
          for (let m = 0; m < 5; m++) {
            const mx = 50 + m * (w / 5);
            const mh = 85 + (m % 3) * 30;
            ctx.fillStyle = 'rgba(139, 92, 246, 0.35)';
            ctx.strokeStyle = 'rgba(216, 180, 254, 0.75)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(mx - 14, h - 25);
            ctx.lineTo(mx, h - 25 - mh);
            ctx.lineTo(mx + 14, h - 25);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
        }

        // 6. Particle & Bubble Aerator Stream
        for (let b = 0; b < 24; b++) {
          const bx = ((b * 67 + Math.sin(t * 2.5 + b) * 8) % (w - 40)) + 20;
          const by = h - 28 - ((t * (35 + (b % 4) * 10) + b * 28) % (h - 45));
          const br = 2 + (b % 4) * 0.9;
          if (currentTank.particleType === 'ember') {
            ctx.fillStyle = 'rgba(251, 146, 60, 0.75)';
            ctx.beginPath();
            ctx.arc(bx, by, br * 0.8, 0, Math.PI * 2);
            ctx.fill();
          } else if (currentTank.particleType === 'stardust') {
            ctx.fillStyle = b % 2 === 0 ? 'rgba(253, 224, 71, 0.85)' : 'rgba(192, 132, 252, 0.8)';
            ctx.beginPath();
            ctx.arc(bx, by, br * 0.9, 0, Math.PI * 2);
            ctx.fill();
          } else if (currentTank.particleType === 'crystal') {
            ctx.fillStyle = 'rgba(186, 230, 253, 0.8)';
            ctx.beginPath();
            ctx.arc(bx, by, br * 0.8, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Standard / Sparkle bubbles with highlight
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
            ctx.lineWidth = 1.3;
            ctx.beginPath();
            ctx.arc(bx, by, br, 0, Math.PI * 2);
            ctx.stroke();
            // Specular shine on bubble
            ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.beginPath();
            ctx.arc(bx - br * 0.35, by - br * 0.35, br * 0.3, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // 7. Lively Swimming Fishes with Ground Shadows & Rarity Auras
        const activeFishes = aquariumFishList.slice(0, currentTank.capacity);
        activeFishes.forEach((fi, idx) => {
          const sp = TWENTY_OCEAN_FISH_SPECIES.find((s) => s.id === fi.speciesId);
          if (!sp) return;

          const speed = 24 + (idx % 5) * 8;
          const cw = w - 160;
          const raw = (t * speed + idx * 125) % (cw * 2);
          const right = raw <= cw;
          const fx = 80 + (right ? raw : cw * 2 - raw);
          const depthY = 60 + ((idx * 48) % (h - 150));
          const fy = depthY + Math.sin(t * 1.8 + idx * 1.5) * 12;

          const baseSc = fi.sizeTier === 'CrownGiant' ? 0.78 : fi.sizeTier === 'Large' ? 0.65 : 0.52;
          const sc = baseSc * (0.85 + (idx % 3) * 0.08);

          // Ground shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
          ctx.beginPath();
          ctx.ellipse(fx, h - 22, sc * 32, 6, 0, 0, Math.PI * 2);
          ctx.fill();

          // Rarity glow aura for Epic, Legendary, Secret
          if (sp.rarity === 'Legendary' || sp.rarity === 'Secret' || sp.rarity === 'Epic') {
            ctx.save();
            ctx.shadowColor = sp.rarity === 'Secret' ? '#f59e0b' : sp.rarity === 'Legendary' ? '#ec4899' : '#8b5cf6';
            ctx.shadowBlur = 16;
            renderFishIllustration(ctx, sp, fx, fy, sc, fi.hueShiftDeg, t * 1.2 + idx, right);
            ctx.restore();
          } else {
            renderFishIllustration(ctx, sp, fx, fy, sc, fi.hueShiftDeg, t * 1.2 + idx, right);
          }
        });

        // 8. Acrylic Glass Specular Highlight & Water Surface Wave Line
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 25) {
          const wy = 8 + Math.sin(x * 0.03 + t * 2) * 3;
          if (x === 0) ctx.moveTo(x, wy);
          else ctx.lineTo(x, wy);
        }
        ctx.stroke();

        const glassGrad = ctx.createLinearGradient(0, 0, w, 0);
        glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        glassGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.05)');
        glassGrad.addColorStop(0.8, 'rgba(255, 255, 255, 0.2)');
        glassGrad.addColorStop(1, 'rgba(255, 255, 255, 0.02)');
        ctx.fillStyle = glassGrad;
        ctx.fillRect(0, 0, w, 18);
        ctx.restore();
      }
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [activeTab, aquariumFishList, currentTank]);

  /* ---------------- actions ---------------- */
  const handleSellFish = (uid: string) => {
    const f = fishingState.caughtInventory.find((x) => x.uid === uid);
    if (!f || f.isLockedInAquarium) return;
    soundEngine.playCoin();
    setFishingState((p) => ({
      ...p,
      seaCoins: p.seaCoins + f.sellPrice,
      caughtInventory: p.caughtInventory.filter((x) => x.uid !== uid),
      quests: trackQuest(p.quests, 'earn_coins', f.sellPrice)
    }));
    notify(`+${f.sellPrice.toLocaleString()}`, 'good');
  };

  const handleSellAll = () => {
    const list = fishingState.caughtInventory.filter((f) => !f.isLockedInAquarium);
    if (!list.length) return;
    soundEngine.playCoin();
    const total = list.reduce((a, f) => a + f.sellPrice, 0);
    setFishingState((p) => ({
      ...p,
      seaCoins: p.seaCoins + total,
      caughtInventory: p.caughtInventory.filter((f) => f.isLockedInAquarium),
      quests: trackQuest(p.quests, 'earn_coins', total)
    }));
    notify(`${t.soldAllToast} (${list.length}) +${total.toLocaleString()}`, 'good');
  };

  const handleToggleAquarium = (uid: string) => {
    const f = fishingState.caughtInventory.find((x) => x.uid === uid);
    if (!f) return;
    const adding = !f.isLockedInAquarium;
    if (adding && aquariumFishList.length >= currentTank.capacity) {
      soundEngine.playFail();
      return notify(
        lang === 'th'
          ? `ตู้ปลาเต็มโควต้าแล้ว (${currentTank.capacity} ตัว)! กรุณาอัพเกรดตู้ปลา`
          : `Aquarium full (${currentTank.capacity} max)! Upgrade tank to expand capacity`,
        'bad'
      );
    }
    soundEngine.playClick();
    setFishingState((p) => ({
      ...p,
      caughtInventory: p.caughtInventory.map((x) => (x.uid === uid ? { ...x, isLockedInAquarium: adding } : x)),
      quests: adding ? trackQuest(p.quests, 'aquarium_add') : p.quests
    }));
    notify(adding ? t.addedAquarium : t.removedAquarium, 'info');
  };

  const buyOrEquipAquariumTank = (tier: number) => {
    const tank = AQUARIUM_TANKS.find((t) => t.tier === tier);
    if (!tank) return;
    const owned = (fishingState.ownedAquariumTiers || [1]).includes(tier);
    if (owned) {
      soundEngine.playClick();
      setFishingState((p) => ({ ...p, aquariumTier: tier }));
      notify(
        lang === 'th' ? `เปลี่ยนมาใช้ ${tank.nameTh} เรียบร้อยแล้ว` : `Equipped ${tank.nameEn}`,
        'info'
      );
      return;
    }
    if (fishingState.anglerLevel < tank.requiredLevel) {
      soundEngine.playFail();
      return notify(
        lang === 'th' ? `ต้องการเลเวลนักตกปลา Lv.${tank.requiredLevel} เพื่อปลดล็อค` : `Requires Level ${tank.requiredLevel}`,
        'bad'
      );
    }
    if (fishingState.seaCoins < tank.price) {
      soundEngine.playFail();
      return notify(t.notEnoughCoins, 'bad');
    }
    soundEngine.playCoin();
    setFishingState((p) => ({
      ...p,
      seaCoins: p.seaCoins - tank.price,
      aquariumTier: tier,
      ownedAquariumTiers: Array.from(new Set([...(p.ownedAquariumTiers || [1]), tier]))
    }));
    notify(
      lang === 'th'
        ? `✨ อัพเกรดเป็น ${tank.nameTh} สำเร็จ! ความจุเพิ่มเป็น ${tank.capacity} ตัว (โบนัสเหรียญ x${tank.coinMultiplier})`
        : `Upgraded to ${tank.nameEn}! Capacity: ${tank.capacity}`,
      'rare'
    );
  };

  const handleExchangeFish = (item: FishExchangeItem) => {
    const bagFish = fishingState.caughtInventory.filter((f) => !f.isLockedInAquarium);
    for (const req of item.requiredFish) {
      const count = bagFish.filter((f) => f.speciesId === req.speciesId).length;
      if (count < req.count) {
        soundEngine.playFail();
        return notify(
          lang === 'th' ? `ยังสะสมปลาไม่ครบตามเงื่อนไขเพื่อแลก ${item.nameTh}!` : `Not enough fish to exchange!`,
          'bad'
        );
      }
    }
    const toConsume = { ...item.requiredFish.reduce((acc, r) => ({ ...acc, [r.speciesId]: r.count }), {} as Record<string, number>) };
    const newInventory = fishingState.caughtInventory.filter((f) => {
      if (f.isLockedInAquarium) return true;
      if ((toConsume[f.speciesId] || 0) > 0) {
        toConsume[f.speciesId]--;
        return false;
      }
      return true;
    });

    soundEngine.playCoin();
    setFishingState((p) => {
      let ownedCostumes = p.ownedCostumeIds;
      if (item.type === 'costume') {
        ownedCostumes = Array.from(new Set([...p.ownedCostumeIds, item.rewardItemId]));
      }
      return {
        ...p,
        caughtInventory: newInventory,
        ownedCostumeIds: ownedCostumes
      };
    });
    notify(
      lang === 'th' ? `✨ แลกรับ ${item.nameTh} สำเร็จแล้ว!` : `Unlocked ${item.nameEn}!`,
      'rare'
    );
  };

  const buyOrEquipRod = (rodId: string) => {
    const rod = FISHING_RODS_CATALOG.find((r) => r.id === rodId);
    if (!rod) return;
    if (fishingState.ownedRodIds.includes(rodId)) {
      soundEngine.playClick();
      // Pity reset & retrieve line on rod swap
      setPityBonus(0);
      if (phase !== 'IDLE_READY') {
        setPhase('IDLE_READY');
        setPendingSpecies(null);
        notify(lang === 'th' ? 'เปลี่ยนคันเบ็ด: ดึงสายเบ็ดกลับและรีเซ็ตโอกาสลุ้นปลา (Pity)' : 'Rod changed: line retrieved & pity reset', 'info');
      }
      setFishingState((p) => ({ ...p, equippedRodId: rodId }));
      notify(`${t.equippedToast} ${rodName(rod, lang)}`, 'info');
      return;
    }
    if (fishingState.anglerLevel < rod.requiredLevel) {
      soundEngine.playFail();
      return notify(`${t.needLevel} ${rod.requiredLevel}`, 'bad');
    }
    if (fishingState.seaCoins < rod.price) {
      soundEngine.playFail();
      return notify(t.notEnoughCoins, 'bad');
    }
    soundEngine.playCoin();
    setPityBonus(0);
    if (phase !== 'IDLE_READY') {
      setPhase('IDLE_READY');
      setPendingSpecies(null);
    }
    setFishingState((p) => ({
      ...p,
      seaCoins: p.seaCoins - rod.price,
      ownedRodIds: [...p.ownedRodIds, rodId],
      equippedRodId: rodId
    }));
    notify(`${t.boughtToast} ${rodName(rod, lang)}`, 'good');
  };

  const equipBait = (baitId: string) => {
    const b = FISHING_BAITS_CATALOG.find((x) => x.id === baitId);
    if (!b) return;
    if (b.pricePerPack > 0 && (fishingState.baitInventory[baitId] || 0) <= 0) {
      soundEngine.playFail();
      return notify(t.noBaitOwned, 'bad');
    }
    soundEngine.playClick();
    // Pity reset & retrieve line on bait swap
    setPityBonus(0);
    if (phase !== 'IDLE_READY') {
      setPhase('IDLE_READY');
      setPendingSpecies(null);
      notify(lang === 'th' ? 'เปลี่ยนเหยื่อ: ดึงสายเบ็ดกลับและรีเซ็ตโอกาสลุ้นปลา (Pity)' : 'Bait changed: line retrieved & pity reset', 'info');
    }
    setFishingState((p) => ({ ...p, equippedBaitId: baitId }));
  };

  const buyBait = (baitId: string) => {
    const bait = FISHING_BAITS_CATALOG.find((b) => b.id === baitId);
    if (!bait || bait.pricePerPack <= 0) return;
    if (fishingState.seaCoins < bait.pricePerPack) {
      soundEngine.playFail();
      return notify(t.notEnoughCoins, 'bad');
    }
    soundEngine.playCoin();
    setFishingState((p) => ({
      ...p,
      seaCoins: p.seaCoins - bait.pricePerPack,
      baitInventory: { ...p.baitInventory, [baitId]: (p.baitInventory[baitId] || 0) + bait.packQuantity }
    }));
    notify(`${t.boughtToast} ${baitName(bait, lang)} +${bait.packQuantity}`, 'good');
  };

  const buyOrWearCostume = (id: string) => {
    const c = COSTUMES.find((x) => x.id === id);
    if (!c) return;
    if (fishingState.ownedCostumeIds.includes(id)) {
      soundEngine.playClick();
      setFishingState((p) => ({ ...p, equippedCostumeId: id }));
      notify(`${t.woreToast} ${costumeName(c, lang)}`, 'info');
      playEntranceCutscene();
      return;
    }
    if (fishingState.seaCoins < c.price) {
      soundEngine.playFail();
      return notify(t.notEnoughCoins, 'bad');
    }
    soundEngine.playCoin();
    setFishingState((p) => ({
      ...p,
      seaCoins: p.seaCoins - c.price,
      ownedCostumeIds: [...p.ownedCostumeIds, id],
      equippedCostumeId: id
    }));
    notify(`${t.boughtToast} ${costumeName(c, lang)}`, 'rare');
    playEntranceCutscene();
  };

  const latestCatchSpecies = useMemo(
    () => (latestCatch ? TWENTY_OCEAN_FISH_SPECIES.find((s) => s.id === latestCatch.speciesId) || null : null),
    [latestCatch]
  );
  const discoveredCount = Object.keys(fishingState.encyclopediaMap).length;

  const tabBtn = (id: TabId, icon: React.ReactNode, label: string, badge?: React.ReactNode) => (
    <button
      key={id}
      onClick={() => {
        soundEngine.playClick();
        setActiveTab(id);
      }}
      className={`relative py-2 px-0.5 flex flex-col items-center justify-center gap-1 transition-all rounded-xl ${
        activeTab === id
          ? 'text-sky-600 font-black bg-sky-50/90 shadow-sm border border-sky-200'
          : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center gap-1">
        <span className={activeTab === id ? 'text-sky-600' : ''}>{icon}</span>
        {badge}
      </div>
      <span className="text-[9px] font-black tracking-wider uppercase leading-none">
        {label}
      </span>
    </button>
  );

  /* ---------------- detail modal ---------------- */
  const renderDetail = () => {
    if (!detail) return null;
    if (detail.kind === 'rod') {
      const rod = FISHING_RODS_CATALOG.find((r) => r.id === detail.id);
      if (!rod) return null;
      const owned = fishingState.ownedRodIds.includes(rod.id);
      const equipped = fishingState.equippedRodId === rod.id;
      const locked = !owned && fishingState.anglerLevel < rod.requiredLevel;
      return (
        <Modal onClose={() => setDetail(null)}>
          <div className="bg-sky-50/80 p-4 border-b border-sky-100 flex items-center justify-center">
            <RodCanvas rod={rod} width={512} height={200} />
          </div>
          <div className="p-6 space-y-3 bg-white text-slate-800">
            <div>
              <div className="text-[10px] tracking-[0.2em] text-sky-600 uppercase font-black">{t.rod}</div>
              <h3 className="text-xl font-black text-slate-800">{rodName(rod, lang)}</h3>
              <div className="text-xs text-slate-500 font-medium">{lang === 'th' ? rod.nameEn : rod.nameTh}</div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{rodDesc(rod, lang)}</p>
            {viewMode === 'dev' ? (
              <div className="bg-purple-50 border border-purple-200 p-3 rounded-2xl space-y-1 font-mono text-xs text-purple-900 shadow-sm">
                <div className="font-bold text-purple-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>🔬 DEV MATH BREAKDOWN (FORMULA STATS):</span>
                </div>
                <div>Base Attraction Bonus: +{rod.baseAttractionBonusPct}% to Base Bite Chance</div>
                <div>Wait Time Reduction: -{rod.waitTimeReductionPct}%</div>
                <div>Sweet Spot Bar Bonus: +{rod.sweetSpotSizeBonus}px</div>
                <div>Line Strength Bonus: +{rod.lineStrengthBonus}%</div>
                <div>Rarity Boost Multiplier: {rod.rarityBoostMultiplier}x</div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 bg-sky-50 border border-sky-100 p-3 text-center rounded-2xl">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">
                    {lang === 'th' ? 'พลังดึงดูด' : 'Attraction'}
                  </div>
                  <div className="text-base font-black text-amber-600 font-mono">{rod.attractionPower || 100}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">
                    {lang === 'th' ? 'โชคสมุทร' : 'Fortune'}
                  </div>
                  <div className="text-base font-black text-sky-600 font-mono">{rod.oceanFortune || 'D'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">
                    {lang === 'th' ? 'ความทนทาน' : 'Resilience'}
                  </div>
                  <div className="text-base font-black text-emerald-600 font-mono">{rod.lineResilience || 100}</div>
                </div>
              </div>
            )}
            <ul className="text-sm text-slate-600 space-y-1.5 border-l-2 border-sky-300 pl-3">
              <li>{rodWaitTextI18n(rod, lang)}</li>
              <li>{rodControlTextI18n(rod, lang)}</li>
              <li>{rodLuckTextI18n(rod, lang)}</li>
            </ul>
            <button
              onClick={() => buyOrEquipRod(rod.id)}
              disabled={equipped || locked}
              className="w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider transition-all bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#0369a1] hover:from-[#60a5fa] hover:to-[#0284c7] disabled:from-slate-200 disabled:to-slate-300 text-white disabled:text-slate-400 border-2 border-white disabled:border-slate-200 shadow-[0_5px_0_#075985] disabled:shadow-none active:translate-y-1 active:shadow-[0_1px_0_#075985] flex items-center justify-center gap-2"
            >
              {equipped
                ? t.equipped
                : owned
                ? t.useRod
                : locked
                ? `${t.needLevel} ${rod.requiredLevel}`
                : `${t.buy} · ${rod.price.toLocaleString()} 🪙`}
            </button>
          </div>
        </Modal>
      );
    }
    if (detail.kind === 'bait') {
      const bait = FISHING_BAITS_CATALOG.find((b) => b.id === detail.id);
      if (!bait) return null;
      const free = bait.pricePerPack === 0;
      const count = baitCount(bait);
      const equipped = fishingState.equippedBaitId === bait.id;
      return (
        <Modal onClose={() => setDetail(null)}>
          <div className="h-36 flex items-center justify-center bg-sky-50/80 border-b border-sky-100">
            <div
              className="w-16 h-16 rounded-full"
              style={{ background: `radial-gradient(circle at 35% 30%, #fff, ${bait.iconColor} 55%, #0284c7 130%)`, boxShadow: `0 0 36px ${bait.iconColor}66` }}
            />
          </div>
          <div className="p-6 space-y-3 bg-white text-slate-800">
            <div>
              <div className="text-[10px] tracking-[0.2em] text-sky-600 uppercase font-black">{t.bait}</div>
              <h3 className="text-xl font-black text-slate-800">{baitName(bait, lang)}</h3>
              <div className="text-xs text-slate-500 font-medium">{lang === 'th' ? bait.nameEn : shortName(bait.nameTh)}</div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{baitDesc(bait, lang)}</p>
            <div className="flex flex-wrap gap-1.5">
              {bait.targetFishIds.map((fid) => {
                const sp = TWENTY_OCEAN_FISH_SPECIES.find((s) => s.id === fid);
                const found = Boolean(fishingState.encyclopediaMap[fid]);
                return (
                  <span key={fid} className="text-[11px] px-2.5 py-0.5 rounded-xl border border-sky-100 bg-sky-50 text-sky-800 font-bold">
                    {found && sp ? fishName(sp, lang) : '???'}
                  </span>
                );
              })}
            </div>
            <div className="text-xs text-sky-700 font-mono font-bold">
              {free ? t.unlimited : `${t.inStock} ${count} · ${t.perPack} ${bait.packQuantity}`}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => equipBait(bait.id)}
                disabled={equipped || (!free && (count as number) <= 0)}
                className="py-3 rounded-2xl font-black text-xs uppercase tracking-wider bg-sky-50 hover:bg-sky-100 border-2 border-sky-200 text-sky-800 disabled:opacity-40 shadow-sm active:translate-y-0.5 transition"
              >
                {equipped ? t.usingBait : t.useBait}
              </button>
              {!free && (
                <button
                  onClick={() => buyBait(bait.id)}
                  className="py-3 rounded-2xl font-black text-xs uppercase tracking-wider bg-gradient-to-b from-[#fbbf24] via-[#f59e0b] to-[#d97706] hover:from-[#fcd34d] hover:to-[#f59e0b] text-white border-2 border-white shadow-[0_3px_0_#b45309] active:translate-y-0.5 active:shadow-none transition"
                >
                  {t.buy} · {bait.pricePerPack.toLocaleString()} 🪙
                </button>
              )}
            </div>
          </div>
        </Modal>
      );
    }
const CostumeDetailModal: React.FC<{
  costume: CostumeItem;
  rod: FishingRodItem;
  owned: boolean;
  worn: boolean;
  lang: GameLang;
  onClose: () => void;
  onBuyOrWear: () => void;
}> = ({ costume, rod, owned, worn, lang, onClose, onBuyOrWear }) => {
  const [tab, setTab] = useState<'base_sprite' | 'base_art' | 'scene'>('base_sprite');
  const [action, setAction] = useState<'idle' | 'walk' | 'cast' | 'jerk' | 'bite' | 'reeling' | 'victory' | 'fail' | 'retrieve'>('idle');
  const t = FISHING_UI[lang];

  return (
    <Modal onClose={onClose}>
      {/* Abby-style Granblue Wiki Toggle Navigation */}
      <div className="flex items-center gap-1.5 p-2.5 bg-sky-50 border-b border-sky-100 pr-12">
        <button
          onClick={() => setTab('base_sprite')}
          className={`flex-1 py-1.5 px-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            tab === 'base_sprite'
              ? 'bg-sky-500 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-sky-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{lang === 'th' ? 'ตัวละครขยับ (Sprite)' : 'Base Sprite'}</span>
        </button>
        <button
          onClick={() => setTab('base_art')}
          className={`flex-1 py-1.5 px-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            tab === 'base_art'
              ? 'bg-sky-500 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-sky-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{lang === 'th' ? 'ภาพอาร์ต (Art)' : 'Base Art'}</span>
        </button>
        <button
          onClick={() => setTab('scene')}
          className={`py-1.5 px-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            tab === 'scene'
              ? 'bg-sky-500 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-sky-100'
          }`}
          title={lang === 'th' ? 'ฉากริมทะเล' : 'Ocean Scene'}
        >
          <Compass className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tab Visuals */}
      {tab === 'base_art' ? (
        <div className="relative bg-slate-900 flex items-center justify-center p-4 border-b border-sky-100 overflow-hidden">
          <div className="relative max-w-[280px] aspect-[3/4] rounded-2xl overflow-hidden border-2 border-white/60 shadow-2xl bg-black/60">
            <img
              src={`/assets/fishing/sprites/${costume.id}/art.png`}
              alt={costumeName(costume, lang)}
              className="w-full h-full object-cover object-top"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `/assets/fishing/sprites/${costume.id}/idle.png`;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-2.5 left-2 right-2 text-center pointer-events-none">
              <span className="text-[10px] tracking-[0.2em] uppercase text-amber-300 font-extrabold drop-shadow">
                ★ ★ ★ ★ ★ SSR Granblue Art
              </span>
            </div>
          </div>
        </div>
      ) : tab === 'base_sprite' ? (
        <div className="border-b border-sky-100 bg-sky-50/40">
          <SpritePreviewStage costume={costume} rod={rod} action={action} />
          {/* Action pose selector buttons (GBF Animation Player style) */}
          <div className="p-2 bg-white flex items-center justify-start sm:justify-center gap-1 border-t border-sky-100 overflow-x-auto">
            <span className="text-[10px] uppercase font-black text-sky-700 mr-1 flex-shrink-0">Pose:</span>
            {[
              { id: 'idle', labelTh: 'ปกติ', labelEn: 'Idle' },
              { id: 'walk', labelTh: 'เดิน', labelEn: 'Walk' },
              { id: 'cast', labelTh: 'เหวี่ยง', labelEn: 'Cast' },
              { id: 'jerk', labelTh: 'กระตุก', labelEn: 'Jerk' },
              { id: 'bite', labelTh: 'ติดเบ็ด!', labelEn: 'Bite!' },
              { id: 'reeling', labelTh: 'เย่อเบ็ด', labelEn: 'Reel' },
              { id: 'victory', labelTh: 'ชูปลา', labelEn: 'Win' },
              { id: 'fail', labelTh: 'หลุด/พลาด', labelEn: 'Fail' },
              { id: 'retrieve', labelTh: 'เก็บสาย', labelEn: 'Retrieve' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setAction(p.id as any)}
                className={`px-2.5 py-1 text-[11px] font-black rounded-xl transition-all border ${
                  action === p.id
                    ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800'
                }`}
              >
                {lang === 'th' ? p.labelTh : p.labelEn}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <ScenePreview costume={costume} rod={rod} />
      )}

      {/* Info & Action Buttons */}
      <div className="p-6 space-y-3 bg-white text-slate-800">
        <div>
          <div className="text-[10px] tracking-[0.2em] text-sky-600 uppercase font-black">{t.costume}</div>
          <h3 className="text-xl font-black text-slate-800 flex items-center justify-between">
            <span>{costumeName(costume, lang)}</span>
            {worn && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase font-black">
                {t.wearing}
              </span>
            )}
          </h3>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">{costumeDesc(costume, lang)}</p>
        <button
          onClick={onBuyOrWear}
          disabled={worn}
          className="w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#0369a1] hover:from-[#60a5fa] hover:to-[#0284c7] disabled:from-slate-200 disabled:to-slate-300 text-white disabled:text-slate-400 border-2 border-white disabled:border-slate-200 shadow-[0_5px_0_#075985] disabled:shadow-none active:translate-y-1 active:shadow-[0_1px_0_#075985] transition-all flex items-center justify-center gap-2"
        >
          {worn ? t.wearing : owned ? t.wear : `${t.buy} · ${costume.price.toLocaleString()}`}
        </button>
      </div>
    </Modal>
  );
};

    const costume = COSTUMES.find((c) => c.id === detail.id);
    if (!costume) return null;
    const owned = fishingState.ownedCostumeIds.includes(costume.id);
    const worn = fishingState.equippedCostumeId === costume.id;
    return (
      <CostumeDetailModal
        costume={costume}
        rod={equippedRod}
        owned={owned}
        worn={worn}
        lang={lang}
        onClose={() => setDetail(null)}
        onBuyOrWear={() => buyOrWearCostume(costume.id)}
      />
    );
  };

  /* ---------------- quest row ---------------- */
  const QuestRow = ({
    def,
    kind,
    locked,
    isTeaser,
    onOpenStory
  }: {
    def: QuestDef;
    kind: 'daily' | 'main';
    locked?: boolean;
    isTeaser?: boolean;
    onOpenStory?: () => void;
  }) => {
    const q = fishingState.quests;
    const prog = questProgress(def, q, kind, fishingState.anglerLevel);
    const done = prog >= def.target;
    const claimed = kind === 'daily' ? q.daily.claimed[def.id] : q.mainClaimed[def.id];
    const npc = def.npcId ? NPC_CAST[def.npcId] : null;

    if (isTeaser) {
      return (
        <div className="px-3 py-2.5 border border-white/5 bg-black/20 opacity-40 text-xs text-zinc-500 flex items-center justify-between">
          <span className="italic">??? [ปลดล็อคเมื่อผ่านเควสก่อนหน้า]</span>
          <Lock className="w-3.5 h-3.5 text-zinc-600" />
        </div>
      );
    }

    return (
      <div className={`px-3.5 py-2.5 rounded-2xl border-2 transition ${claimed ? 'border-slate-200 bg-slate-50 opacity-50' : locked ? 'border-slate-200 bg-slate-100 opacity-40' : 'border-sky-100 bg-white shadow-sm'}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {npc && (
              <button
                onClick={() => {
                  soundEngine.playNpcBlip();
                  onOpenStory?.();
                }}
                title={lang === 'th' ? `ฟังเรื่องเล่าจาก ${npc.nameTh}` : `Hear story from ${npc.nameEn}`}
                className="w-8 h-8 rounded-full bg-sky-50 border border-sky-200 hover:border-sky-400 flex items-center justify-center text-base shadow-sm transition hover:scale-105"
              >
                {npc.avatarIcon}
              </button>
            )}
            <div className="min-w-0 flex-1">
              <div
                onClick={() => {
                  if (npc && onOpenStory) {
                    soundEngine.playNpcBlip();
                    onOpenStory();
                  }
                }}
                className={`text-xs font-bold text-slate-800 truncate ${npc ? 'cursor-pointer hover:text-sky-600' : ''}`}
              >
                {questLabel(def, lang)}
              </div>
              {npc && (
                <div className="text-[10px] text-sky-600 font-bold">
                  {lang === 'th' ? npc.nameTh : npc.nameEn}
                </div>
              )}
            </div>
          </div>

          {def.targetIslandId && fishingState.unlockedIslandIds.includes(def.targetIslandId) && fishingState.currentIslandId !== def.targetIslandId && !locked && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                soundEngine.playClick();
                setFishingState((p) => ({ ...p, currentIslandId: def.targetIslandId! }));
                setPityBonus(0);
                setPhase('IDLE_READY');
                setPendingSpecies(null);
                playEntranceCutscene();
                const targetIsle = ALL_ISLANDS.find((i) => i.id === def.targetIslandId);
                notify(
                  lang === 'th'
                    ? `🗺️ ออกเรือเดินทางด่วนสู่ ${targetIsle?.nameTh || 'เกาะเป้าหมาย'}!`
                    : `🗺️ Set sail to ${targetIsle?.nameEn || 'target island'}!`,
                  'info'
                );
              }}
              className="px-2 py-1 rounded-xl text-[10px] font-black bg-sky-500 hover:bg-sky-600 text-white shadow-xs transition active:scale-95 flex items-center gap-1 shrink-0"
              title={lang === 'th' ? 'เดินทางไปเกาะเป้าหมายทันที' : 'Fast Travel to Island'}
            >
              <span>🗺️</span>
              <span>{lang === 'th' ? 'เดินทาง' : 'Travel'}</span>
            </button>
          )}

          {locked ? (
            <Lock className="w-3.5 h-3.5 text-slate-400" />
          ) : claimed ? (
            <Check className="w-4 h-4 text-emerald-500 font-black" />
          ) : (
            <button
              onClick={() => claimQuest(kind, def)}
              disabled={!done}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all ${
                done
                  ? 'bg-gradient-to-b from-amber-400 to-amber-500 border border-amber-300 text-slate-900 shadow-md animate-pulse active:scale-95'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
            >
              {done ? (lang === 'th' ? 'รับรางวัล' : 'Claim') : `${prog}/${def.target}`}
            </button>
          )}
        </div>
        <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div
            className="h-full bg-gradient-to-r from-sky-400 to-teal-400 transition-all duration-500 rounded-full"
            style={{ width: `${Math.min(100, (prog / def.target) * 100)}%` }}
          />
        </div>
      </div>
    );
  };

  const firstOpenMain = MAIN_QUESTS.findIndex((m) => !fishingState.quests.mainClaimed[m.id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f9ff] via-[#e0f2fe] to-[#f8fafc] text-slate-800 flex flex-col font-sans">
      <style>{`
        @keyframes toastIn { from { opacity:0; transform: translateX(14px);} to { opacity:1; transform:none;} }
        @keyframes popIn { from { opacity:0; transform: scale(.94);} to { opacity:1; transform:none;} }
        @keyframes hookPulse { 0%,100% { transform: scale(1);} 50% { transform: scale(1.07);} }
        @keyframes cool { from { width:0 } to { width:100% } }
      `}</style>

      {/* toasts */}
      <div className="fixed top-16 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{ animation: 'toastIn .25s ease-out', ...CUT_STYLE }}
            className="flex items-stretch bg-white/95 border-2 border-sky-100 shadow-xl min-w-[150px] rounded-2xl overflow-hidden"
          >
            <span className={`w-1.5 ${TONE_BAR[t.tone]}`} />
            <span className="px-3.5 py-2 text-sm font-bold text-slate-800">{t.text}</span>
          </div>
        ))}
      </div>

      {detail && renderDetail()}

      {/* Admin God-Mode Cheat Console Modal (Specifically for macga garry & Admins) */}
      {showAdminModal && isAdminUser && (
        <AdminCheatModal
          isOpen={showAdminModal}
          onClose={() => setShowAdminModal(false)}
          fishingState={fishingState}
          isAutoFishing={isAutoFishing}
          onToggleAutoFishing={() => {
            soundEngine.playClick();
            setIsAutoFishing((v) => !v);
          }}
          onAddCoins={adminAddCoins}
          onSetLevel={adminSetLevel}
          onUnlockAll={adminUnlockAll}
          onInstantCatch={adminInstantCatch}
          onResetSave={() => {
            if (window.confirm('ยืนยันล้างข้อมูลเซฟตกปลาทั้งหมดและเริ่มต้นใหม่ใช่หรือไม่?')) {
              localStorage.removeItem(storageKey);
              setFishingState(normalizeState(null));
              notify('Admin: Reset state to starter defaults', 'bad');
              setShowAdminModal(false);
            }
          }}
          viewMode={viewMode}
          onToggleViewMode={() => {
            soundEngine.playClick();
            setViewMode((v) => (v === 'user' ? 'dev' : 'user'));
          }}
          lang={lang}
        />
      )}

      {/* Settings Modal (Audio Volume + Language) */}
      {showSettingsModal && (
        <Modal onClose={() => setShowSettingsModal(false)}>
          <div className="p-6 space-y-5 bg-white text-slate-800">
            <div className="flex items-center gap-2 border-b-2 border-sky-100 pb-3">
              <Settings className="w-5 h-5 text-sky-600" />
              <h3 className="text-lg font-black text-slate-800 tracking-wider uppercase">{t.settingsTitle}</h3>
            </div>

            {/* Language Selector */}
            <div className="space-y-2">
              <div className="text-xs font-black text-sky-700 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-sky-600" />
                {t.language}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setLang('th');
                    saveLang('th');
                    soundEngine.playClick();
                  }}
                  className={`py-2.5 rounded-2xl border-2 text-xs font-black transition shadow-sm ${
                    lang === 'th' ? 'border-sky-500 bg-sky-50 text-sky-800 ring-1 ring-sky-300' : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🇹🇭 ภาษาไทย (TH)
                </button>
                <button
                  onClick={() => {
                    setLang('en');
                    saveLang('en');
                    soundEngine.playClick();
                  }}
                  className={`py-2.5 rounded-2xl border-2 text-xs font-black transition shadow-sm ${
                    lang === 'en' ? 'border-sky-500 bg-sky-50 text-sky-800 ring-1 ring-sky-300' : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🇬🇧 English (EN)
                </button>
              </div>
            </div>

            {/* Volume Controls */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-700">{t.muteAll}</span>
                <button
                  onClick={() => {
                    soundEngine.toggleMute();
                    soundEngine.playClick();
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 transition shadow-sm ${
                    soundSettings.muted
                      ? 'border-rose-300 bg-rose-50 text-rose-600'
                      : 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {soundSettings.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  {soundSettings.muted ? 'MUTED' : 'ON'}
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-500 font-bold">
                  <span>{t.masterVolume}</span>
                  <span className="font-mono text-slate-800">{Math.round(soundSettings.masterVolume)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(soundSettings.masterVolume)}
                  onChange={(e) => soundEngine.updateSettings({ masterVolume: Number(e.target.value), muted: false })}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-500 font-bold">
                  <span>{t.bgmVolume}</span>
                  <span className="font-mono text-slate-800">{Math.round(soundSettings.bgmVolume)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(soundSettings.bgmVolume)}
                  onChange={(e) => soundEngine.updateSettings({ bgmVolume: Number(e.target.value), muted: false })}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-500 font-bold">
                  <span>{t.sfxVolume}</span>
                  <span className="font-mono text-slate-800">{Math.round(soundSettings.sfxVolume)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(soundSettings.sfxVolume)}
                  onChange={(e) => {
                    soundEngine.updateSettings({ sfxVolume: Number(e.target.value), muted: false });
                  }}
                  onMouseUp={() => soundEngine.playClick()}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>
              <div className="pt-3 border-t border-sky-100 space-y-1">
                <button
                  onClick={() => {
                    if (window.confirm(lang === 'th' ? 'ต้องการล้างข้อมูลเซฟเพื่อเริ่มใหม่ตามสเกล V3 หรือไม่? (ข้อมูลปลาและไอเทมจะถูกรีเซ็ต)' : 'Reset save data to V3 Hardcore system?')) {
                      localStorage.removeItem(storageKey);
                      setFishingState(normalizeState(null));
                      soundEngine.playClick();
                      notify(lang === 'th' ? 'ล้างข้อมูลเซฟและปรับใช้สเกล V3 เรียบร้อยแล้ว' : 'Save data reset to V3 Hardcore system', 'good');
                      setShowSettingsModal(false);
                    }
                  }}
                  className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 font-black text-xs tracking-wider uppercase transition rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  <span>{lang === 'th' ? 'ล้างข้อมูลเซฟเพื่อเริ่มใหม่ (Reset V3 Save)' : 'Reset Save Data (V3 System)'}</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                soundEngine.playClick();
                setShowSettingsModal(false);
              }}
              className="w-full py-3 bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#0369a1] hover:from-[#60a5fa] hover:to-[#0284c7] text-white font-black text-xs tracking-wider uppercase transition rounded-2xl shadow-[0_4px_0_#075985]"
            >
              {t.close}
            </button>
          </div>
        </Modal>
      )}

      {/* Cygames / Granblue Fantasy Style NPC Story Dialogue Modal */}
      {selectedNpcQuest && selectedNpcQuest.npcId && (
        <Modal onClose={() => setSelectedNpcQuest(null)}>
          <div className="p-6 space-y-4 max-w-lg bg-white text-slate-800">
            {/* NPC Header with Avatar */}
            <div className="flex items-center gap-3 border-b-2 border-sky-100 pb-3">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 border-2 border-sky-200 flex items-center justify-center text-3xl shadow-sm">
                {NPC_CAST[selectedNpcQuest.npcId]?.avatarIcon || '⚓'}
              </div>
              <div>
                <div className="text-[11px] font-mono tracking-widest text-sky-600 uppercase font-bold">
                  {lang === 'th' ? NPC_CAST[selectedNpcQuest.npcId]?.titleTh : NPC_CAST[selectedNpcQuest.npcId]?.titleEn}
                </div>
                <h3 className="text-lg font-black text-slate-800">
                  {lang === 'th' ? NPC_CAST[selectedNpcQuest.npcId]?.nameTh : NPC_CAST[selectedNpcQuest.npcId]?.nameEn}
                </h3>
              </div>
            </div>

            {/* Spoken Dialogue (Granblue Story Style) */}
            <div className="p-4 bg-sky-50/70 border-2 border-sky-100 rounded-2xl relative shadow-inner">
              <span className="text-sky-400 font-serif text-3xl absolute -top-1 left-2 select-none">“</span>
              <p className="text-sm text-slate-700 leading-relaxed indent-4 pt-1 font-sans">
                {lang === 'th' ? selectedNpcQuest.dialogueTh : selectedNpcQuest.dialogueEn || selectedNpcQuest.dialogueTh}
              </p>
              <span className="text-sky-400 font-serif text-3xl absolute -bottom-4 right-2 select-none">”</span>
            </div>

            {/* Quest Objective & Reward */}
            <div className="p-3.5 bg-sky-50 border border-sky-100 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-black">{lang === 'th' ? 'ภารกิจเป้าหมาย' : 'Objective'}</div>
                <div className="text-xs font-black text-slate-800 mt-0.5">{questLabel(selectedNpcQuest, lang)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-amber-600 font-black flex items-center gap-1 justify-end font-mono">
                  <Coins className="w-3.5 h-3.5" />
                  <span>+{selectedNpcQuest.coins.toLocaleString()}</span>
                </div>
                <div className="text-[10px] text-sky-600 font-bold font-mono">+{selectedNpcQuest.exp} EXP</div>
              </div>
            </div>

            <button
              onClick={() => {
                soundEngine.playNpcBlip();
                setSelectedNpcQuest(null);
              }}
              className="w-full py-3.5 rounded-2xl font-black text-xs tracking-wider uppercase transition-all bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#0369a1] hover:from-[#60a5fa] hover:to-[#0284c7] text-white border-2 border-white shadow-[0_4px_0_#075985] active:translate-y-1 active:shadow-none flex items-center justify-center gap-2"
            >
              <span>⛵ {lang === 'th' ? 'รับทราบและออกเดินทาง!' : 'Acknowledge & Set Sail!'}</span>
            </button>
          </div>
        </Modal>
      )}

      {/* Commercial RPG Stage Selection Modal (เหมือนเกมในตลาด) */}
      {isIslandMapOpen && (
        <Modal onClose={() => setIsIslandMapOpen(false)} hideCloseButton maxWidthClass="max-w-4xl">
          <div className="p-4 sm:p-6 space-y-4 max-w-4xl bg-white/98 backdrop-blur-2xl border-2 border-sky-100 text-slate-800 rounded-3xl shadow-[0_24px_64px_rgba(2,132,199,0.18)]">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-sky-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 border-2 border-sky-200 flex items-center justify-center shadow-md text-white">
                  <Compass className="w-5 h-5 animate-spin-slow" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-wider flex items-center gap-2">
                    <span>{lang === 'th' ? '🗺️ แผนที่สำรวจน่านน้ำเอสพิเชียน' : '🗺️ Espician Archipelago Expedition'}</span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-700 font-extrabold border border-sky-200">
                      STAGE {currentIsland.order} / 5
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {lang === 'th'
                      ? 'เลือกเกาะเป้าหมายเพื่อตรวจความพร้อม สภาพอากาศ สัตว์น้ำประจำถิ่น และออกเรือสำรวจ'
                      : 'Select target stage island to inspect endemic fauna, weather conditions, and set sail'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setIsIslandMapOpen(false);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-500 border border-slate-200 flex items-center justify-center hover:scale-105 active:scale-95 shadow-sm transition"
                title="Close Map"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 5 Stage Cards Carousel / Grid (Commercial RPG Stage Selector) */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
              {[
                { id: 'island_emerald_haven', stage: 1, labelTh: 'เกาะมรกต', labelEn: 'Emerald Haven', reqLv: 1 },
                { id: 'island_coral_sanctuary', stage: 2, labelTh: 'รังปะการังเรืองแสง', labelEn: 'Coral Lagoon', reqLv: 5 },
                { id: 'island_volcanic_atoll', stage: 3, labelTh: 'อ่าวภูเขาไฟลาวา', labelEn: 'Volcanic Atoll', reqLv: 12 },
                { id: 'island_aurora_fjord', stage: 4, labelTh: 'ธารน้ำแข็งออโรร่า', labelEn: 'Aurora Fjord', reqLv: 20 },
                { id: 'island_celestial_archipelago', stage: 5, labelTh: 'แดนดาราสวรรค์', labelEn: 'Celestial Void', reqLv: 30 }
              ].map((node) => {
                const isle = ALL_ISLANDS.find((i) => i.id === node.id)!;
                const isCurrent = fishingState.currentIslandId === node.id;
                const isUnlocked = fishingState.unlockedIslandIds.includes(node.id);
                const isSelected = (selectedIslandId || fishingState.currentIslandId) === node.id;

                return (
                  <button
                    key={node.id}
                    onClick={() => {
                      soundEngine.playClick();
                      setSelectedIslandId(node.id);
                    }}
                    className={`relative text-left p-2.5 rounded-2xl border-2 transition-all duration-200 flex flex-col justify-between overflow-hidden group shadow-sm ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/80 ring-2 ring-sky-300 shadow-md scale-[1.02]'
                        : isCurrent
                        ? 'border-amber-400 bg-amber-50/70'
                        : isUnlocked
                        ? 'border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50/30'
                        : 'border-slate-200 bg-slate-100/70 opacity-60'
                    }`}
                  >
                    {/* Stage Thumbnail */}
                    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-2 bg-slate-200">
                      <img
                        src={`/assets/fishing/backgrounds/${node.id}.jpg`}
                        alt={node.labelEn}
                        className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                          !isUnlocked ? 'grayscale contrast-125' : ''
                        }`}
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                      {/* Top Badges */}
                      <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/70 text-white font-black text-[9px] tracking-wider uppercase border border-white/20">
                        STAGE 0{node.stage}
                      </div>

                      {isCurrent && (
                        <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-amber-500 text-white font-black text-[9px] shadow-sm flex items-center gap-0.5">
                          <Anchor className="w-2.5 h-2.5" />
                          <span>ประจำการ</span>
                        </div>
                      )}

                      {!isUnlocked && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex flex-col items-center justify-center text-white">
                          <Lock className="w-5 h-5 text-amber-300 mb-0.5" />
                          <span className="text-[10px] font-bold">Lv.{node.reqLv}</span>
                        </div>
                      )}
                    </div>

                    {/* Stage Name & Fish Count */}
                    <div>
                      <div className="font-black text-xs text-slate-800 truncate">
                        {lang === 'th' ? node.labelTh : node.labelEn}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                        <span>🐟 {isle.endemicFishIds.length} ชนิด</span>
                        {isUnlocked && <span className="text-emerald-600 font-bold">✓ พร้อม</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Island Deployment Dossier (แผงเตรียมตัวออกเรือ) */}
            {(() => {
              const curId = selectedIslandId || fishingState.currentIslandId;
              const isle = ALL_ISLANDS.find((i) => i.id === curId) || ALL_ISLANDS[0];
              const isCurrent = fishingState.currentIslandId === isle.id;
              const isUnlocked = fishingState.unlockedIslandIds.includes(isle.id);
              const reqCheck = isIslandUnlocked(isle, fishingState.anglerLevel, fishingState.seaCoins, fishingState.ownedRodIds);
              const canUnlockNow = !isUnlocked && reqCheck.unlocked;

              return (
                <div className="bg-sky-50/70 border-2 border-sky-100 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row gap-5 items-stretch shadow-inner">
                  {/* Island Panoramic Banner */}
                  <div className="relative w-full md:w-64 h-44 rounded-xl overflow-hidden border-2 border-sky-200 flex-shrink-0 shadow-md bg-slate-900">
                    <img
                      src={`/assets/fishing/backgrounds/${isle.id}.jpg`}
                      alt={isle.nameEn}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-sky-600/90 text-white text-[10px] font-black border border-white/30 shadow">
                      STAGE {isle.order}
                    </div>
                    {isCurrent && (
                      <div className="absolute bottom-2.5 left-2.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 text-[11px] font-black flex items-center gap-1 shadow-md">
                        <Anchor className="w-3.5 h-3.5" />
                        <span>{lang === 'th' ? 'ประจำการอยู่ที่นี่' : 'ANCHORED'}</span>
                      </div>
                    )}
                  </div>

                  {/* Island Details & Marine Fauna */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5 border-b border-sky-200/60 pb-1.5">
                        <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
                          <span>{lang === 'th' ? isle.nameTh : isle.nameEn}</span>
                        </h4>
                        <span className="text-xs text-sky-700 font-bold bg-sky-100 px-2 py-0.5 rounded-full border border-sky-200">
                          {lang === 'th' ? isle.subtitleTh : isle.subtitleEn}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed mb-3">
                        {lang === 'th' ? isle.descriptionTh : isle.descriptionEn}
                      </p>

                      {/* Endemic Fish Specimen Badges */}
                      <div className="mb-3">
                        <span className="text-[10px] font-extrabold text-sky-700 uppercase tracking-wider block mb-1.5">
                          {lang === 'th' ? '🐟 สัตว์น้ำประจำถิ่น (Endemic Marine Species):' : 'Endemic Species:'}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {isle.endemicFishIds.map((fId) => {
                            const f = TWENTY_OCEAN_FISH_SPECIES.find((x: FishSpeciesData) => x.id === fId);
                            if (!f) return null;
                            const rc = RARITY_CONFIG[f.rarity];
                            return (
                              <span
                                key={fId}
                                className="px-2.5 py-1 rounded-xl text-[11px] bg-white border border-sky-100 text-slate-700 flex items-center gap-1.5 shadow-sm"
                              >
                                <span>{f.category === 'creature' ? '🦑' : '🐟'}</span>
                                <span className="font-bold">{lang === 'th' ? f.nameTh : f.nameEn}</span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-extrabold ${rc.badgeBg} ${rc.badgeText}`}>
                                  {f.rarity}
                                </span>
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Unlock Requirements if Locked */}
                      {!isUnlocked && (
                        <div className="p-3 bg-white border border-rose-200 rounded-xl text-xs space-y-1 mb-2 shadow-sm">
                          <div className="text-[10px] font-black uppercase text-rose-600">
                            {lang === 'th' ? 'เงื่อนไขการปลดล็อคเส้นทางเดินเรือ:' : 'Unlock Requirements:'}
                          </div>
                          <div className={`flex items-center justify-between ${fishingState.anglerLevel >= isle.requiredLevel ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                            <span>• {lang === 'th' ? 'เลเวลนักตกปลา' : 'Angler Level'} {isle.requiredLevel}</span>
                            <span className="font-mono font-bold">{fishingState.anglerLevel} / {isle.requiredLevel}</span>
                          </div>
                          {isle.requiredCoins > 0 && (
                            <div className={`flex items-center justify-between ${fishingState.seaCoins >= isle.requiredCoins ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                              <span>• {lang === 'th' ? 'เหรียญทะเล' : 'Coins'} {isle.requiredCoins.toLocaleString()}</span>
                              <span className="font-mono font-bold">{fishingState.seaCoins.toLocaleString()}</span>
                            </div>
                          )}
                          {isle.requiredRodId && (
                            <div className={`flex items-center justify-between ${fishingState.ownedRodIds.includes(isle.requiredRodId) ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                              <span>• {rodName(FISHING_RODS_CATALOG.find((r) => r.id === isle.requiredRodId) || FISHING_RODS_CATALOG[0], lang)}</span>
                              <span>{fishingState.ownedRodIds.includes(isle.requiredRodId) ? '✓ ครบถ้วน' : '✗ ขาดคันเบ็ดนี้'}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                      {isCurrent ? (
                        <div className="text-center py-3 rounded-2xl text-xs font-black text-sky-800 border-2 border-sky-200 bg-white shadow-sm flex items-center justify-center gap-2">
                          <Anchor className="w-4 h-4 text-sky-600" />
                          <span>{lang === 'th' ? '⚓ กำลังทอดสมออยู่ที่เกาะนี้เรียบร้อยแล้ว' : '⚓ Currently Anchored at this Island'}</span>
                        </div>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => {
                            soundEngine.playSplash();
                            soundEngine.setIsland(isle.id);
                            setFishingState((prev) => ({ ...prev, currentIslandId: isle.id }));
                            // Reset pity & retrieve line & run entrance walking cutscene
                            setPityBonus(0);
                            setPhase('IDLE_READY');
                            setPendingSpecies(null);
                            setIsIslandMapOpen(false);
                            playEntranceCutscene();
                            notify(
                              lang === 'th'
                                ? `ออกเรือเดินทางสู่ ${isle.nameTh}! เริ่มสำรวจสะพานปลา`
                                : `Set sail to ${isle.nameEn}! Walking onto pier`,
                              'good'
                            );
                          }}
                          className="w-full py-3.5 rounded-2xl font-black text-sm tracking-wider uppercase transition-all bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#0369a1] hover:from-[#60a5fa] hover:to-[#0284c7] text-white border-2 border-white shadow-[0_5px_0_#075985,0_10px_20px_rgba(2,132,199,0.3)] active:translate-y-1 active:shadow-[0_1px_0_#075985] flex items-center justify-center gap-2"
                        >
                          <Compass className="w-4 h-4 text-sky-100" />
                          <span>{lang === 'th' ? `⛵ ออกเดินทางสู่ ${isle.nameTh} (SET SAIL)` : `⛵ Set Sail to ${isle.nameEn}`}</span>
                        </button>
                      ) : canUnlockNow ? (
                        <button
                          onClick={() => {
                            soundEngine.playCoin();
                            soundEngine.setIsland(isle.id);
                            setFishingState((prev) => ({
                              ...prev,
                              seaCoins: prev.seaCoins - isle.requiredCoins,
                              unlockedIslandIds: Array.from(new Set([...prev.unlockedIslandIds, isle.id])),
                              currentIslandId: isle.id
                            }));
                            // Reset pity & retrieve line & run entrance walking cutscene
                            setPityBonus(0);
                            setPhase('IDLE_READY');
                            setPendingSpecies(null);
                            setIsIslandMapOpen(false);
                            playEntranceCutscene();
                            notify(
                              lang === 'th'
                                ? `ปลดล็อค ${isle.nameTh} สำเร็จแล้วและออกเรือทันที!`
                                : `Unlocked ${isle.nameEn} and set sail!`,
                              'rare'
                            );
                          }}
                          className="w-full py-3.5 rounded-2xl font-black text-sm tracking-wider uppercase transition-all bg-gradient-to-b from-[#fbbf24] via-[#f59e0b] to-[#d97706] hover:from-[#fcd34d] hover:to-[#f59e0b] text-white border-2 border-white shadow-[0_5px_0_#b45309,0_10px_20px_rgba(245,158,11,0.35)] active:translate-y-1 active:shadow-[0_1px_0_#b45309] animate-pulse flex items-center justify-center gap-2"
                        >
                          <Sparkles className="w-4 h-4 text-amber-100" />
                          <span>
                            {lang === 'th'
                              ? `✨ ปลดล็อคเกาะ & ออกเรือทันที (${isle.requiredCoins.toLocaleString()} เหรียญ)`
                              : `✨ Unlock Island & Set Sail (${isle.requiredCoins.toLocaleString()} Coins)`}
                          </span>
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full py-3 rounded-2xl bg-slate-200 text-slate-400 font-bold text-xs tracking-wider uppercase cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>{lang === 'th' ? '🔒 ยังไม่ผ่านเงื่อนไขการออกเรือของสมาคม' : 'Requirements Unmet (Locked)'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </Modal>
      )}

      {/* 5-Tier Aquarium Showroom Modal */}
      {showTankModal && (
        <Modal onClose={() => setShowTankModal(false)} maxWidthClass="max-w-3xl">
          <div className="p-4 sm:p-6 space-y-4 bg-white text-slate-800 rounded-3xl">
            <div className="flex items-center justify-between border-b-2 border-sky-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-400 to-sky-600 text-white flex items-center justify-center font-black shadow-md">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-wider">
                    {lang === 'th' ? 'โชว์รูมอควาเรียมระดับ 1 - 5' : 'Aquarium Showroom (Tiers 1 - 5)'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {lang === 'th' ? 'อัปเกรดเพื่อขยายโควต้าการจัดแสดงปลาและรับโบนัสทวีคูณเหรียญ' : 'Upgrade tanks to increase fish display capacity & coin multipliers'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setShowTankModal(false);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-500 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {AQUARIUM_TANKS.map((tank) => {
                const isOwned = (fishingState.ownedAquariumTiers || [1]).includes(tank.tier);
                const isEquipped = fishingState.aquariumTier === tank.tier;
                const isLevelLocked = fishingState.anglerLevel < tank.requiredLevel;
                const canAfford = fishingState.seaCoins >= tank.price;

                return (
                  <div
                    key={tank.id}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      isEquipped
                        ? 'border-sky-500 bg-sky-50/80 shadow-md ring-2 ring-sky-300'
                        : isOwned
                        ? 'border-teal-200 bg-teal-50/40 hover:border-teal-400'
                        : 'border-slate-200 bg-white hover:border-sky-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="px-2.5 py-0.5 rounded-lg text-xs font-black text-white shadow-xs"
                            style={{ backgroundColor: tank.accentColor }}
                          >
                            TIER {tank.tier}
                          </span>
                          <span className="font-black text-sm text-slate-800">
                            {lang === 'th' ? tank.nameTh : tank.nameEn}
                          </span>
                          {isEquipped && (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-sky-500 text-white shadow-xs">
                              {lang === 'th' ? 'ใช้งานอยู่' : 'EQUIPPED'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          {lang === 'th' ? tank.descriptionTh : tank.descriptionEn}
                        </p>
                        <div className="flex items-center gap-4 text-xs font-bold pt-1">
                          <span className="text-sky-700">
                            🐠 {lang === 'th' ? 'โควต้าปลา:' : 'Capacity:'} <strong className="text-slate-900 font-black">{tank.capacity}</strong> {lang === 'th' ? 'ตัว' : 'fish'}
                          </span>
                          <span className="text-amber-600">
                            ✨ {lang === 'th' ? 'โบนัสเหรียญ:' : 'Coin Multiplier:'} <strong className="text-slate-900 font-black">x{tank.coinMultiplier}</strong>
                          </span>
                          {tank.requiredLevel > 1 && (
                            <span className={isLevelLocked ? 'text-rose-500' : 'text-slate-500'}>
                              🎖️ Lv.{tank.requiredLevel}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center justify-end">
                        {isEquipped ? (
                          <button
                            disabled
                            className="px-4 py-2 rounded-xl text-xs font-black bg-sky-100 text-sky-700 cursor-default"
                          >
                            ✓ {lang === 'th' ? 'กำลังแสดงผล' : 'Active'}
                          </button>
                        ) : isOwned ? (
                          <button
                            onClick={() => buyOrEquipAquariumTank(tank.tier)}
                            className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white shadow-md active:scale-95 transition"
                          >
                            {lang === 'th' ? 'สวมใส่ตู้นี้' : 'Equip Tank'}
                          </button>
                        ) : (
                          <button
                            onClick={() => buyOrEquipAquariumTank(tank.tier)}
                            disabled={isLevelLocked || !canAfford}
                            className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-slate-200 disabled:to-slate-300 text-white disabled:text-slate-400 shadow-md disabled:shadow-none active:scale-95 transition flex items-center gap-1.5"
                          >
                            <Coins className="w-3.5 h-3.5" />
                            <span>{tank.price.toLocaleString()}</span>
                            <span>{lang === 'th' ? 'ปลดล็อก' : 'Unlock'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Modal>
      )}

      {/* Aquarium Fish Selection Modal (Pick from bag) */}
      {showFishSelectModal && (
        <Modal onClose={() => setShowFishSelectModal(false)} maxWidthClass="max-w-2xl">
          <div className="p-4 sm:p-6 space-y-4 bg-white text-slate-800 rounded-3xl">
            <div className="flex items-center justify-between border-b-2 border-sky-100 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-wider flex items-center gap-2">
                  <span>🐠</span>
                  <span>{lang === 'th' ? 'เลือกปลาใส่ตู้' : 'Add Fish to Aquarium'}</span>
                  <span className="text-xs font-normal text-sky-600 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200">
                    {aquariumFishList.length}/{currentTank.capacity}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'th' ? 'ปลาในตู้จะไม่ถูกขายเมื่อกดขายทั้งหมด และจะว่ายน้ำแสดงให้ชม' : 'Fish in aquarium are protected from bulk sell and swim dynamically'}
                </p>
              </div>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setShowFishSelectModal(false);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-500 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[55vh] overflow-y-auto space-y-2 pr-1">
              {fishingState.caughtInventory.filter((f) => !f.isLockedInAquarium).length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <div className="text-3xl mb-2">🪣</div>
                  <div className="text-sm font-bold">{lang === 'th' ? 'ไม่มีปลาในกระเป๋าสำหรับใส่ตู้' : 'No available fish in your inventory'}</div>
                  <div className="text-xs text-slate-400 mt-1">{lang === 'th' ? 'ออกไปตกปลาเพื่อนำมาใส่ตู้ปลาของคุณ!' : 'Go fishing to bring new species home!'}</div>
                </div>
              ) : (
                fishingState.caughtInventory
                  .filter((f) => !f.isLockedInAquarium)
                  .map((item) => {
                    const species = TWENTY_OCEAN_FISH_SPECIES.find((s) => s.id === item.speciesId);
                    const rarity = species?.rarity || 'Common';
                    const rc = RARITY_CONFIG[rarity];
                    const isFull = aquariumFishList.length >= currentTank.capacity;
                    return (
                      <div
                        key={item.uid}
                        className="p-3 rounded-2xl border-2 border-slate-100 hover:border-sky-200 bg-slate-50/50 flex items-center justify-between gap-3 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xl shadow-xs">
                            {species?.category === 'creature' ? '🦑' : '🐟'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-xs text-slate-800">
                                {species ? fishName(species, lang) : item.speciesId}
                              </span>
                              <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${rc.borderColor} ${rc.badgeBg} ${rc.badgeText}`}>
                                {rarity}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {item.weightKg.toFixed(2)} kg · {item.lengthCm.toFixed(1)} cm
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            handleToggleAquarium(item.uid);
                          }}
                          disabled={isFull}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-sky-500 hover:bg-sky-600 disabled:bg-slate-200 text-white disabled:text-slate-400 shadow-sm active:scale-95 transition"
                        >
                          {lang === 'th' ? '+ นำเข้าตู้' : '+ Add'}
                        </button>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Bright Cute Anime Adventurer Guild HUD Header */}
      <header className="border-b-2 border-sky-100 bg-white/95 backdrop-blur-xl px-4 lg:px-8 py-2.5 flex items-center justify-between gap-3 sticky top-0 z-30 shadow-[0_4px_20px_rgba(2,132,199,0.06)] text-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundEngine.playClick();
              onBackToPortal();
            }}
            title={t.home}
            className="p-2 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-700 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Anchor className="w-4 h-4 text-sky-600" />
            <span className="text-sm font-black tracking-wider text-slate-800 uppercase">
              Espician <span className="text-sky-600">Fishing</span>
            </span>
          </div>

          {/* Integrated Nautical Island & Day/Night Talisman */}
          <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-sky-100">
            <button
              onClick={() => {
                soundEngine.playClick();
                setIsIslandMapOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border-2 border-sky-200 text-sky-800 text-xs font-black tracking-wider uppercase transition shadow-sm active:translate-y-0.5"
              title={lang === 'th' ? 'เปิดแผนที่สำรวจหมู่เกาะ' : 'Open Archipelago Stage Map'}
            >
              <Compass className="w-4 h-4 text-sky-600 animate-spin-slow" />
              <span>{lang === 'th' ? currentIsland.nameTh : currentIsland.nameEn}</span>
              <span className="text-[10px] text-sky-600/90 font-bold bg-sky-200/60 px-1.5 py-0.5 rounded-md">🗺️ แผนที่</span>
            </button>

            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-xs font-bold tracking-wider shadow-sm transition ${
                realTimeOfDay === 'day'
                  ? 'border-amber-300 bg-amber-50 text-amber-700'
                  : 'border-indigo-300 bg-indigo-50 text-indigo-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full animate-pulse ${realTimeOfDay === 'day' ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-indigo-500 shadow-[0_0_8px_#6366f1]'}`} />
              <span>{realTimeOfDay === 'day' ? '☀️ กลางวัน (DAY)' : '🌙 กลางคืน (NIGHT)'}</span>
            </div>
          </div>
        </div>

        {/* Clean, Non-AI Boxed Top HUD Ribbon */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Rank & EXP */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black tracking-wider text-sky-700 uppercase">Lv.{fishingState.anglerLevel}</span>
            <div className="w-16 sm:w-20 h-2 bg-slate-100 rounded-full overflow-hidden ring-1 ring-sky-200/60">
              <div
                className="h-full bg-gradient-to-r from-sky-400 to-teal-400 transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, (fishingState.anglerExp / expForNextLevel) * 100)}%` }}
              />
            </div>
          </div>

          {/* Sea Coins */}
          <div className="flex items-center gap-1.5 text-amber-600 font-black">
            <Coins className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-black font-mono tracking-tight">{fishingState.seaCoins.toLocaleString()}</span>
          </div>

          {/* Species Dex */}
          <div className="hidden sm:flex items-center gap-1.5 text-slate-500 text-xs font-bold" title="Species Discovered">
            <BookOpen className="w-4 h-4 text-sky-500" />
            <span className="font-mono text-slate-700">{discoveredCount}</span>
            <span className="text-[10px] text-slate-400">/{TOTAL_SPECIES}</span>
          </div>

          {/* Central User Account Badge */}
          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-sky-100">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-teal-400 border border-sky-200 flex items-center justify-center text-[11px] font-black text-white uppercase shadow-sm">
              {currentUser?.username?.[0] || 'U'}
            </div>
            <div className="text-left">
              <div className="text-[11px] font-bold text-slate-800 leading-tight flex items-center gap-1">
                <span>{currentUser?.username || (userEmail ? userEmail.split('@')[0] : 'Guest Angler')}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" title="Cloud Synced" />
              </div>
              <div className="text-[9px] text-sky-600/80 tracking-wider font-mono">
                {currentUser?.club_name || 'Espician Guild'}
              </div>
            </div>
          </div>

          {/* Language, Settings & Admin Cheat Controls */}
          <div className="flex items-center gap-1.5">
            {isAdminUser && (
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setShowAdminModal(true);
                }}
                className="px-2.5 py-1 rounded-lg border border-amber-300 bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-900 text-[10px] font-black tracking-wider uppercase transition shadow-sm animate-pulse"
              >
                ⚡ ADMIN
              </button>
            )}
            <button
              onClick={toggleLang}
              title={t.language}
              className="px-2.5 py-1 rounded-lg border border-sky-200 bg-sky-50 hover:bg-sky-100 text-xs font-black tracking-wider text-sky-700 transition shadow-sm"
            >
              {lang.toUpperCase()}
            </button>
            <button
              onClick={() => {
                soundEngine.toggleMute();
                soundEngine.playClick();
              }}
              title={t.muteAll}
              className={`p-1.5 rounded-lg border transition shadow-sm ${
                soundSettings.muted
                  ? 'border-rose-300 text-rose-600 bg-rose-50'
                  : 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100'
              }`}
            >
              {soundSettings.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-sky-600" />}
            </button>
            <button
              onClick={() => {
                soundEngine.playClick();
                setShowSettingsModal(true);
              }}
              title={t.settingsTitle}
              className="p-1.5 rounded-lg border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 transition shadow-sm"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 flex flex-col gap-3">
          {/* Live Dev Math Inspection HUD (Only rendered in Developer Inspection Mode) */}
          {viewMode === 'dev' && (() => {
            const baseBiteRate = calculateBaseBiteChance(equippedRod, equippedBait);
            const totalBiteRate = Math.min(1.0, baseBiteRate + (pityBonus || 0));
            const jerkBiteRate = Math.min(1.0, totalBiteRate * 0.10);
            const activePoolCount = TWENTY_OCEAN_FISH_SPECIES.filter(
              (s) => !s.timeAvailability || s.timeAvailability === 'all' || s.timeAvailability === realTimeOfDay
            ).length;
            return (
              <div
                className="p-3 bg-purple-50 border-2 border-purple-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-purple-900 shadow-sm"
              >
                <div className="flex items-center gap-3.5 flex-wrap">
                  <span className="text-purple-600 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>FORMULA DEBUG:</span>
                  </span>
                  <span>
                    Base Bite: <strong className="text-purple-950 font-bold">{(baseBiteRate * 100).toFixed(1)}%</strong>
                  </span>
                  <span>
                    Pity Bonus: <strong className="text-amber-600 font-bold">+{((pityBonus || 0) * 100).toFixed(2)}%</strong>
                  </span>
                  <span>
                    Tick Roll Chance: <strong className="text-emerald-600 font-bold">{(totalBiteRate * 100).toFixed(2)}%</strong>
                  </span>
                  <span>
                    Instant Jerk Chance: <strong className="text-sky-600 font-bold">{(jerkBiteRate * 100).toFixed(2)}%</strong>
                  </span>
                  <span>
                    Available Pool: <strong className="text-purple-950 font-bold">{activePoolCount}/{TOTAL_SPECIES} ({realTimeOfDay.toUpperCase()})</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold border rounded-lg ${
                      isAutoFishing
                        ? 'border-emerald-400 bg-emerald-100 text-emerald-800'
                        : 'border-slate-200 bg-white text-slate-500'
                    }`}
                  >
                    AUTO-FISHING: {isAutoFishing ? 'ACTIVE' : 'IDLE'}
                  </span>
                  <button
                    onClick={() => {
                      setPityBonus(0);
                      notify('Pity bonus reset to 0%', 'info');
                    }}
                    className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 text-[10px] border border-slate-300 rounded-lg shadow-sm"
                  >
                    Reset Pity
                  </button>
                </div>
              </div>
            );
          })()}

          <div className="relative overflow-hidden border-4 border-white rounded-3xl bg-slate-900 aspect-[16/9] shadow-[0_20px_50px_rgba(2,132,199,0.15)] ring-1 ring-sky-100">
            <canvas
              ref={mainCanvasRef}
              width={960}
              height={540}
              onClick={() => {
                if (isEntranceCutscene) skipEntranceCutscene();
              }}
              className="w-full h-full object-cover block cursor-pointer"
            />
            <div ref={flashRef} className="absolute inset-0 pointer-events-none opacity-0 mix-blend-screen" />

            {/* Entrance cutscene indicator & skip pill */}
            {isEntranceCutscene && (
              <div className="absolute bottom-4 inset-x-0 flex justify-center z-10">
                <button
                  onClick={skipEntranceCutscene}
                  className="px-6 py-2.5 rounded-2xl bg-white/95 backdrop-blur-md border-2 border-sky-200 text-slate-800 font-black text-xs tracking-wide shadow-xl flex items-center gap-2 hover:bg-sky-50 transition animate-pulse"
                >
                  <span>🚶 {t.arrivingAtPier}</span>
                </button>
              </div>
            )}

            {/* Top-Left Tactical Loadout Tackle Belt: Rod & Bait */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setDetail({ kind: 'rod', id: equippedRod.id });
                }}
                className="bg-white/90 backdrop-blur-md border-2 border-sky-100 hover:border-sky-300 text-slate-800 rounded-2xl px-3.5 py-1.5 flex items-center gap-2 text-xs transition shadow-md"
              >
                <span className="w-2.5 h-2.5 rounded-full shadow-sm ring-1 ring-slate-400" style={{ backgroundColor: equippedRod.rodColor }} />
                <span className="font-extrabold text-slate-800 tracking-wide">{rodName(equippedRod, lang)}</span>
              </button>

              <button
                onClick={() => {
                  soundEngine.playClick();
                  const idx = ownedBaits.findIndex((b) => b.id === fishingState.equippedBaitId);
                  const nextBait = ownedBaits[(idx + 1) % ownedBaits.length];
                  if (nextBait) equipBait(nextBait.id);
                }}
                className="bg-white/90 backdrop-blur-md border-2 border-sky-100 hover:border-sky-300 text-slate-800 rounded-2xl px-3.5 py-1.5 flex items-center gap-2 text-xs transition shadow-md"
                title={lang === 'th' ? 'คลิกเพื่อสลับเหยื่อตกปลา' : 'Click to cycle bait'}
              >
                <span className="w-2.5 h-2.5 rounded-full ring-1 ring-slate-400" style={{ backgroundColor: equippedBait.iconColor }} />
                <span className="font-bold text-xs text-slate-700">{baitName(equippedBait, lang)}</span>
                <span className="font-mono font-bold text-[10px] text-amber-600">
                  {baitCount(equippedBait) === Infinity ? '∞' : `x${baitCount(equippedBait)}`}
                </span>
                <span className="text-[10px] text-sky-600 font-mono">▾</span>
              </button>
            </div>

            {/* Bottom-Left Entrance Walk Replay Button */}
            {phase === 'IDLE_READY' && !isEntranceCutscene && (
              <button
                onClick={() => {
                  soundEngine.playClick();
                  playEntranceCutscene();
                }}
                title={t.replayEntrance}
                className="absolute bottom-4 left-4 z-10 px-3.5 py-1.5 rounded-2xl bg-white/90 hover:bg-white border-2 border-sky-100 text-slate-700 hover:text-sky-600 text-xs font-bold transition flex items-center gap-1.5 shadow-md"
              >
                <span>🚶 {lang === 'th' ? 'เดินเข้าสะพาน' : 'Walk'}</span>
              </button>
            )}

            {phase === 'WAITING_FOR_BITE' && (
              <>
                {/* Atmospheric Bite Waiting Pill without exposing roll timers */}
                <div className="absolute bottom-4 inset-x-0 flex justify-center pointer-events-none z-10 px-4">
                  <div
                    className="pointer-events-auto px-5 py-2.5 rounded-2xl bg-white/95 backdrop-blur-xl border-2 border-sky-200 text-xs text-slate-800 shadow-xl flex items-center gap-3"
                  >
                    <div className="flex items-center gap-2 text-sky-700 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse shadow-[0_0_8px_#0ea5e9]" />
                      <span>{lang === 'th' ? '🌊 สายเบ็ดลอยในกระแสน้ำ...' : 'Line drifting in ocean current...'}</span>
                    </div>
                    {pityBonus > 0 && (
                      <>
                        <div className="h-3.5 w-px bg-slate-200" />
                        <div className="text-emerald-600 font-extrabold text-[11px] flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                          <span>{lang === 'th' ? '✨ ผิวน้ำกระเพื่อม... ปลาระแวงเริ่มสนใจ' : 'Water ripples... fish showing interest'}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="absolute bottom-4 right-4 z-10">
                  <GameActionButton
                    onClick={handleJerk}
                    disabled={jerkCooling}
                    cooldownActive={jerkCooling}
                    cooldownDurationSec={3.5}
                    variant="primary"
                    icon={<Waves className="w-4 h-4 text-sky-100" />}
                    className="px-6 py-3 rounded-2xl text-sm"
                  >
                    {t.jerkRod}
                  </GameActionButton>
                </div>
              </>
            )}

            {phase === 'FISH_BITING' && !autoReel && (
              <div className="absolute inset-0 flex items-end justify-center pb-8 pointer-events-none">
                <GameActionButton
                  onClick={startReeling}
                  variant="crimson"
                  pulseWhenReady={true}
                  icon={<Sparkles className="w-6 h-6 text-amber-200 animate-spin" />}
                  className="pointer-events-auto px-14 py-4 rounded-2xl text-xl animate-bounce"
                >
                  {t.pullHook}
                </GameActionButton>
              </div>
            )}

            {phase === 'REELING_MINIGAME' && pendingSpecies && (
              <div className="absolute bottom-3 right-3 sm:right-6 z-20">
                <ReelMinigame species={pendingSpecies} rod={equippedRod} auto={autoReel} hueShiftDeg={0} lang={lang} onDone={handleReelDone} />
              </div>
            )}

            {phase === 'CATCH_REVEAL' && latestCatch && latestCatchSpecies && (
              <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4 z-20">
                <div
                  ref={cardRef}
                  className="bg-white/98 backdrop-blur-2xl border-2 border-sky-100 rounded-3xl p-6 max-w-sm w-full text-center shadow-[0_20px_50px_rgba(2,132,199,0.25)] text-slate-800"
                >
                  <span
                    data-pop
                    className={`text-[11px] px-3 py-0.5 rounded-full font-black border tracking-wider ${RARITY_CONFIG[latestCatchSpecies.rarity].badgeBg} ${RARITY_CONFIG[latestCatchSpecies.rarity].badgeText} ${RARITY_CONFIG[latestCatchSpecies.rarity].borderColor}`}
                  >
                    {latestCatchSpecies.rarity.toUpperCase()}
                  </span>
                  <h3 data-pop className="text-xl font-black text-slate-800 mt-2">
                    {fishName(latestCatchSpecies, lang)}
                  </h3>
                  <div className="my-2 bg-sky-50 border border-sky-100 rounded-2xl p-2 shadow-inner">
                    <FishPreviewCanvas species={latestCatchSpecies} hueShiftDeg={latestCatch.hueShiftDeg} width={280} height={130} scale={1.3} />
                  </div>
                  <div data-pop className="text-sm font-bold text-slate-600">
                    {latestCatch.weightKg} kg · {latestCatch.sizeTier}
                  </div>
                  <div data-pop className="text-xs text-sky-600 mb-4 font-bold">
                    {variantLabel(latestCatch.variantTitle, lang)}
                  </div>
                  <div data-pop className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => {
                        handleSellFish(latestCatch.uid);
                        setPhase('IDLE_READY');
                      }}
                      className="py-2.5 rounded-xl font-black text-xs bg-gradient-to-b from-[#f59e0b] to-[#d97706] border border-white text-white shadow-[0_3px_0_#b45309] active:translate-y-0.5 active:shadow-none"
                    >
                      {t.sell} {latestCatch.sellPrice.toLocaleString()}
                    </button>
                    <button
                      onClick={() => {
                        handleToggleAquarium(latestCatch.uid);
                        setPhase('IDLE_READY');
                        setActiveTab('aquarium');
                      }}
                      className="py-2.5 rounded-xl font-black text-xs bg-gradient-to-b from-[#38bdf8] to-[#0284c7] border border-white text-white shadow-[0_3px_0_#075985] active:translate-y-0.5 active:shadow-none"
                    >
                      {t.aquarium}
                    </button>
                    <button
                      onClick={() => {
                        soundEngine.playClick();
                        setPhase('IDLE_READY');
                      }}
                      className="py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 shadow-sm active:translate-y-0.5 active:shadow-none"
                    >
                      {t.keep}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {phase === 'IDLE_READY' && !isEntranceCutscene && (
              <div className="absolute bottom-4 inset-x-0 flex justify-center pointer-events-none">
                <GameActionButton
                  onClick={handleCastLine}
                  variant="crimson"
                  pulseWhenReady={true}
                  icon={<Anchor className="w-5 h-5 text-white" />}
                  className="pointer-events-auto px-12 py-3.5 rounded-2xl text-base sm:text-lg"
                >
                  {t.castLine}
                </GameActionButton>
              </div>
            )}
          </div>
        </div>

        {/* JRPG Command Deck Side Panel */}
        <div className={`lg:col-span-4 ${PANEL} flex flex-col h-[640px]`}>
          <div className="flex items-center overflow-x-auto no-scrollbar border-b border-sky-100 bg-sky-50/50 p-1.5 gap-1 rounded-t-3xl">
            {tabBtn('bag', <Fish className="w-3.5 h-3.5" />, lang === 'th' ? 'คลังปลา' : 'BAG', <span className="text-[10px] font-mono font-bold text-sky-600">({fishingState.caughtInventory.filter(f => !f.isLockedInAquarium).length}/10)</span>)}
            {tabBtn('shop', <ShoppingBag className="w-3.5 h-3.5" />, lang === 'th' ? 'ร้านค้า' : 'SHOP')}
            {tabBtn('wardrobe', <Shirt className="w-3.5 h-3.5" />, lang === 'th' ? 'คอสตูม' : 'STYLE')}
            {tabBtn('encyclopedia', <BookOpen className="w-3.5 h-3.5" />, lang === 'th' ? 'สมุดปลา' : 'CODEX', <span className="text-[10px] font-mono font-bold text-sky-600">{discoveredCount}</span>)}
            {tabBtn(
              'quests',
              <Target className="w-3.5 h-3.5" />,
              lang === 'th' ? 'เควส' : 'QUEST',
              questClaimable > 0 ? (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_6px_#f59e0b]" />
              ) : undefined
            )}
            {tabBtn('aquarium', <Layers className="w-3.5 h-3.5" />, lang === 'th' ? 'ตู้ปลา' : 'AQUA', <span className="text-[10px] font-mono font-bold text-sky-600">{aquariumFishList.length}/{currentTank.capacity}</span>)}
            {tabBtn('exchange', <Sparkles className="w-3.5 h-3.5" />, lang === 'th' ? 'แลกปลา' : 'TRADE')}
            {tabBtn('achieve', <Target className="w-3.5 h-3.5" />, lang === 'th' ? 'ความสำเร็จ' : 'ACHIEVE')}
          </div>

          <div className="flex-1 overflow-hidden p-3.5 flex flex-col">
            {activeTab === 'bag' && (
              <>
                <button
                  onClick={handleSellAll}
                  className="w-full mb-3 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider bg-gradient-to-b from-[#fbbf24] via-[#f59e0b] to-[#d97706] hover:from-[#fcd34d] hover:to-[#f59e0b] text-white border-2 border-white shadow-[0_3px_0_#b45309] active:translate-y-0.5 active:shadow-none transition flex items-center justify-center gap-2"
                >
                  <Coins className="w-4 h-4 text-white" />
                  <span>{t.sellAll}</span>
                </button>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {fishingState.caughtInventory.length === 0 ? (
                    <div className="text-center py-20 text-slate-300 font-bold text-sm">
                      {lang === 'th' ? 'ยังไม่มีปลาในคลัง เหวี่ยงเบ็ดเพื่อเริ่มตกปลา!' : 'No fish in bag. Cast line to fish!'}
                    </div>
                  ) : (
                    fishingState.caughtInventory.map((item) => {
                      const sp = TWENTY_OCEAN_FISH_SPECIES.find((s) => s.id === item.speciesId);
                      if (!sp) return null;
                      const rc = RARITY_CONFIG[sp.rarity];
                      return (
                        <div key={item.uid} className="bg-white border-2 border-sky-100 hover:border-sky-300 rounded-2xl p-2.5 flex items-center justify-between gap-2 shadow-sm transition">
                          <div className="flex items-center gap-2.5">
                            <div className="w-14 h-11 bg-sky-50 rounded-xl overflow-hidden border border-sky-200">
                              <FishPreviewCanvas species={sp} hueShiftDeg={item.hueShiftDeg} width={56} height={44} scale={0.4} />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-black text-slate-800">{fishName(sp, lang)}</span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-black border ${rc.badgeBg} ${rc.badgeText} ${rc.borderColor}`}>{sp.rarity}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono font-bold">{item.weightKg} kg</div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <button
                              onClick={() => handleToggleAquarium(item.uid)}
                              className={`text-[10px] px-2 py-1 rounded-xl border transition shadow-sm ${
                                item.isLockedInAquarium ? 'border-sky-400 text-sky-700 bg-sky-50' : 'border-slate-200 text-slate-400 hover:text-slate-700 bg-white'
                              }`}
                              title="Aquarium Lock"
                            >
                              <Layers className="w-3 h-3" />
                            </button>
                            {!item.isLockedInAquarium && (
                              <button onClick={() => handleSellFish(item.uid)} className="text-xs font-black text-amber-600 hover:text-amber-700 font-mono bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 shadow-sm">
                                +{item.sellPrice.toLocaleString()} 🪙
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}

            {activeTab === 'shop' && (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                <div className="space-y-1.5">
                  <div className="text-[10px] tracking-[0.15em] text-sky-700 uppercase font-black px-1 flex items-center gap-1.5">
                    <span>🎣</span>
                    <span>{lang === 'th' ? 'คันเบ็ดตกปลา' : 'FISHING RODS'}</span>
                  </div>
                  {FISHING_RODS_CATALOG.map((rod) => {
                    const owned = fishingState.ownedRodIds.includes(rod.id);
                    const equipped = fishingState.equippedRodId === rod.id;
                    const locked = !owned && fishingState.anglerLevel < rod.requiredLevel;
                    return (
                      <button
                        key={rod.id}
                        onClick={() => {
                          soundEngine.playClick();
                          setDetail({ kind: 'rod', id: rod.id });
                        }}
                        className={`w-full text-left px-3.5 py-2.5 rounded-2xl border-2 flex items-center justify-between gap-2 transition-all shadow-sm ${
                          equipped
                            ? 'border-sky-500 bg-sky-50/90 shadow-md ring-1 ring-sky-300'
                            : 'border-sky-100 bg-white hover:border-sky-300 hover:bg-sky-50/30'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-3 h-3 rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: rod.rodColor }} />
                          <span className="text-xs font-black text-slate-800">{rodName(rod, lang)}</span>
                        </div>
                        <span className={`text-[11px] font-black ${equipped ? 'text-sky-600 font-black' : owned ? 'text-slate-400' : locked ? 'text-slate-400' : 'text-amber-600 font-mono'}`}>
                          {equipped ? <Check className="w-4 h-4 text-sky-600" /> : owned ? t.owned : locked ? `Lv.${rod.requiredLevel}` : rod.price.toLocaleString()}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="space-y-1.5">
                  <div className="text-[10px] tracking-[0.15em] text-sky-700 uppercase font-black px-1 flex items-center gap-1.5">
                    <span>🪱</span>
                    <span>{lang === 'th' ? 'เหยื่อตกปลา' : 'BAITS & LURES'}</span>
                  </div>
                  {FISHING_BAITS_CATALOG.map((bait) => {
                    const n = baitCount(bait);
                    const equipped = fishingState.equippedBaitId === bait.id;
                    return (
                      <button
                        key={bait.id}
                        onClick={() => {
                          soundEngine.playClick();
                          setDetail({ kind: 'bait', id: bait.id });
                        }}
                        className={`w-full text-left px-3.5 py-2.5 rounded-2xl border-2 flex items-center justify-between gap-2 transition-all shadow-sm ${
                          equipped
                            ? 'border-sky-500 bg-sky-50/90 shadow-md ring-1 ring-sky-300'
                            : 'border-sky-100 bg-white hover:border-sky-300 hover:bg-sky-50/30'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-3 h-3 rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: bait.iconColor }} />
                          <span className="text-xs font-black text-slate-800">{baitName(bait, lang)}</span>
                        </div>
                        <span className="text-[11px] text-slate-600 font-mono font-bold">
                          {n === Infinity ? '∞' : `x${n}`}
                          {bait.pricePerPack > 0 && <span className="text-amber-600 ml-2 font-black">{bait.pricePerPack.toLocaleString()}</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'encyclopedia' && (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {TWENTY_OCEAN_FISH_SPECIES.map((sp) => {
                  const rec = fishingState.encyclopediaMap[sp.id];
                  const found = Boolean(rec && rec.count > 0);
                  const rc = RARITY_CONFIG[sp.rarity];
                  const open = expanded === sp.id;
                  return (
                    <button
                      key={sp.id}
                      onClick={() => {
                        soundEngine.playClick();
                        setExpanded(open ? null : sp.id);
                      }}
                      className="w-full text-left bg-white border-2 border-sky-100 hover:border-sky-300 rounded-2xl p-3 transition shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-black text-slate-800">
                          #{sp.indexNumber} {found ? fishName(sp, lang) : '???'}
                          {sp.category === 'creature' && <span className="ml-1.5 text-[9px] text-amber-500">✨ {t.specialTag}</span>}
                        </span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-md font-black border ${rc.badgeBg} ${rc.badgeText} ${rc.borderColor}`}>{sp.rarity}</span>
                      </div>
                      <div className="bg-sky-50/70 rounded-xl p-1.5 border border-sky-100">
                        <FishPreviewCanvas species={sp} discovered={found} width={150} height={66} scale={0.62} />
                      </div>
                      {open && (
                        <div className="mt-2 text-[11px] text-slate-600 space-y-0.5 border-t border-sky-100 pt-1.5">
                          {found && <p className="font-medium">{fishDesc(sp, lang)}</p>}
                          <p className="font-mono text-slate-500">
                            {fishHabitat(sp, lang)} · {sp.minWeightKg}–{sp.maxWeightKg} kg
                            {found && ` · ×${rec.count}`}
                          </p>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {activeTab === 'aquarium' && (
              <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-y-auto pr-1">
                {/* Header bar: Tank status, Tier, Quota, Multiplier, and Modals Triggers */}
                <div className="bg-gradient-to-r from-sky-500/10 via-teal-500/10 to-indigo-500/10 border-2 border-sky-200/80 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white shadow-md font-black text-lg">
                      🌊
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-800">
                          {lang === 'th' ? currentTank.nameTh : currentTank.nameEn}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-500 text-white shadow-xs">
                          Tier {currentTank.tier}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {lang === 'th' ? currentTank.descriptionTh : currentTank.descriptionEn}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Capacity badge */}
                    <div className="px-3 py-1.5 rounded-xl bg-white border border-sky-200 shadow-xs flex items-center gap-1.5">
                      <Fish className="w-4 h-4 text-sky-500" />
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 font-bold leading-none">
                          {lang === 'th' ? 'โควต้าปลา' : 'Quota'}
                        </div>
                        <div className="text-xs font-black text-slate-800">
                          {aquariumFishList.length} <span className="text-slate-400">/</span> {currentTank.capacity} {lang === 'th' ? 'ตัว' : 'fish'}
                        </div>
                      </div>
                    </div>

                    {/* Passive income badge */}
                    <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/80 border border-amber-200 shadow-xs flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-amber-500" />
                      <div className="text-right">
                        <div className="text-[10px] text-amber-700 font-bold leading-none">
                          {lang === 'th' ? `ผลิตเหรียญ (x${currentTank.coinMultiplier})` : `Income (x${currentTank.coinMultiplier})`}
                        </div>
                        <div className="text-xs font-black text-amber-900">
                          +{totalPassiveCoinsPerMin} <span className="text-[10px] font-normal">{t.perMin}</span>
                        </div>
                      </div>
                    </div>

                    {/* Shop Modal Trigger */}
                    <button
                      onClick={() => setShowTankModal(true)}
                      className="px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 text-white shadow-sm flex items-center gap-1.5 transition active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{lang === 'th' ? 'ร้านตู้ปลา (5 Tiers)' : 'Tanks Shop'}</span>
                    </button>

                    {/* Add Fish Modal Trigger */}
                    <button
                      onClick={() => setShowFishSelectModal(true)}
                      className="px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white shadow-sm flex items-center gap-1.5 transition active:scale-95"
                    >
                      <span>📥</span>
                      <span>{lang === 'th' ? '+ นำปลาเข้าตู้' : '+ Add Fish'}</span>
                    </button>
                  </div>
                </div>

                {/* Animated Canvas */}
                <div className="relative rounded-2xl overflow-hidden border-2 border-sky-300 shadow-md bg-slate-950 group">
                  <canvas ref={aquariumCanvasRef} width={640} height={360} className="w-full aspect-video block" />
                  
                  {/* Subtle glass reflection & frame overlay */}
                  <div className="absolute inset-0 pointer-events-none border border-white/20 rounded-2xl bg-gradient-to-t from-black/20 via-transparent to-white/10" />
                  
                  {/* Empty guidance if 0 fish */}
                  {aquariumFishList.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-950/40 backdrop-blur-[2px] text-center">
                      <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl mb-2 animate-bounce">
                        🐠
                      </div>
                      <div className="text-sm font-bold text-white drop-shadow">
                        {lang === 'th' ? 'ตู้ปลายังว่างอยู่!' : 'The Aquarium is Empty!'}
                      </div>
                      <p className="text-xs text-sky-100 max-w-sm mt-1 drop-shadow">
                        {lang === 'th'
                          ? 'ใส่ปลาที่คุณตกได้เข้ามาแหวกว่าย เพื่อผลิตเหรียญ Sea Coins อัตโนมัติตลอดเวลา'
                          : 'Add caught fish from your bag to swim and generate passive Sea Coins!'}
                      </p>
                      <button
                        onClick={() => setShowFishSelectModal(true)}
                        className="mt-3 px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-black shadow-md transition active:scale-95"
                      >
                        {lang === 'th' ? '+ นำปลาเข้าตู้' : '+ Add Fish to Tank'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Swimming Fishes List Header */}
                <div className="flex items-center justify-between border-b border-sky-100 pb-1">
                  <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Fish className="w-4 h-4 text-sky-500" />
                    <span>{lang === 'th' ? `ปลาที่กำลังแหวกว่ายในตู้ (${aquariumFishList.length}/${currentTank.capacity} ตัว)` : `Fishes in Tank (${aquariumFishList.length}/${currentTank.capacity})`}</span>
                  </div>
                  <div className="text-[11px] text-sky-600 font-bold">
                    {lang === 'th' ? `ผลิตรวม +${totalPassiveCoinsPerMin} เหรียญ/นาที` : `Yield +${totalPassiveCoinsPerMin} coins/min`}
                  </div>
                </div>

                {/* List of fishes in tank */}
                <div className="space-y-2">
                  {aquariumFishList.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-sky-50/50 rounded-2xl border border-sky-100">
                      {lang === 'th' ? 'ยังไม่มีปลาอยู่ในตู้ปลาขณะนี้ กดปุ่ม "+ นำปลาเข้าตู้" เพื่อเลือกปลาจากกระเป๋า' : 'No fish in the tank yet. Click "+ Add Fish" to add from inventory.'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {aquariumFishList.map((item) => {
                        const sp = TWENTY_OCEAN_FISH_SPECIES.find((s) => s.id === item.speciesId);
                        if (!sp) return null;
                        const rc = RARITY_CONFIG[sp.rarity];
                        const passiveCoins = Math.max(2, Math.round(sp.basePrice * 0.03 * currentTank.coinMultiplier));
                        return (
                          <div
                            key={item.uid}
                            className="p-2.5 rounded-2xl bg-white border border-sky-100 hover:border-sky-300 shadow-xs flex items-center justify-between gap-2 transition"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-12 h-10 bg-sky-50 rounded-xl p-1 border border-sky-100 flex items-center justify-center shrink-0">
                                <FishPreviewCanvas species={sp} hueShiftDeg={item.hueShiftDeg} discovered={true} width={70} height={36} scale={0.45} />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-black text-slate-800 truncate">
                                    {fishName(sp, lang)}
                                  </span>
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-black border ${rc.badgeBg} ${rc.badgeText} ${rc.borderColor}`}>
                                    {sp.rarity.toUpperCase()}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  {item.weightKg} kg · <span className="text-amber-600 font-bold">+{passiveCoins}/m</span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleToggleAquarium(item.uid)}
                              className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 border border-slate-200 hover:border-rose-200 transition shrink-0 active:scale-95"
                            >
                              {lang === 'th' ? 'นำออก' : 'Remove'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'quests' && (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                <div>
                  <div className="text-[10px] tracking-[0.15em] text-sky-700 uppercase mb-2 font-black">{t.daily}</div>
                  <div className="space-y-2">
                    {fishingState.quests.daily.ids.map((id) => {
                      const d = DAILY_POOL.find((x) => x.id === id);
                      return d ? <QuestRow key={id} def={d} kind="daily" /> : null;
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] tracking-[0.15em] text-sky-700 uppercase mb-2 font-black">{t.main}</div>
                  <div className="space-y-2">
                    {MAIN_QUESTS.map((m, i) => {
                      const claimed = fishingState.quests.mainClaimed[m.id];
                      // Sequential hiding: Hide quests that are far in the future!
                      if (firstOpenMain !== -1 && i > firstOpenMain + 1) return null;
                      if (claimed && i < firstOpenMain - 1) return null;
                      const isTeaser = firstOpenMain !== -1 && i === firstOpenMain + 1;
                      return (
                        <QuestRow
                          key={m.id}
                          def={m}
                          kind="main"
                          locked={isTeaser}
                          isTeaser={isTeaser}
                          onOpenStory={() => setSelectedNpcQuest(m)}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'wardrobe' && (
              <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2.5 pr-1 content-start">
                {COSTUMES.map((c) => {
                  const owned = fishingState.ownedCostumeIds.includes(c.id);
                  const worn = fishingState.equippedCostumeId === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        soundEngine.playClick();
                        setDetail({ kind: 'costume', id: c.id });
                      }}
                      className={`text-left p-3 rounded-2xl border-2 transition-all shadow-sm ${
                        worn
                          ? 'border-sky-500 bg-sky-50/90 shadow-md ring-1 ring-sky-300'
                          : 'border-sky-100 bg-white hover:border-sky-300 hover:bg-sky-50/30'
                      }`}
                    >
                      <div className="w-full h-24 mb-2 rounded-xl overflow-hidden bg-slate-900 border border-sky-100 relative shadow-inner">
                        <img
                          src={`/assets/fishing/sprites/${c.id}/art.png`}
                          alt={costumeName(c, lang)}
                          className="w-full h-full object-cover object-top"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = `/assets/fishing/sprites/${c.id}/idle.png`;
                          }}
                        />
                        <div className="absolute bottom-1 right-1 flex gap-1">
                          {[c.dressA, c.dressC, c.accent].map((col, i) => (
                            <span key={i} className="w-3 h-3 rounded-full border border-white/60 shadow" style={{ backgroundColor: col }} />
                          ))}
                        </div>
                      </div>
                      <div className="text-xs font-black leading-snug text-slate-800">{costumeName(c, lang)}</div>
                      <div className={`text-[11px] mt-1 font-black ${worn ? 'text-sky-600' : owned ? 'text-slate-400' : 'text-amber-600 font-mono'}`}>
                        {worn ? t.wornNow : owned ? t.owned : c.price.toLocaleString()}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {activeTab === 'exchange' && (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 shadow-xs">
                  <div className="font-black text-amber-950 flex items-center gap-1.5">
                    <span>🏮</span>
                    <span>{lang === 'th' ? 'ร้านค้าแลกเปลี่ยนสัตว์น้ำสมาคม' : 'Marine Exchange Guild'}</span>
                  </div>
                  <div className="text-[11px] text-amber-800/80 mt-1">
                    {lang === 'th'
                      ? 'นำปลาที่สะสมในกระเป๋ามาแลกเปลี่ยนเป็นชุดคอสตูมหายากได้ฟรี! ทยอยส่งมอบได้ (กระเป๋าถือได้ 10 ตัว)'
                      : 'Trade caught marine fish from your bag for exclusive costumes! (Bag holds 10 max)'}
                  </div>
                </div>

                <div className="space-y-3">
                  {FISH_EXCHANGE_SHOP.map((ex) => {
                    const bagFish = fishingState.caughtInventory.filter((f) => !f.isLockedInAquarium);
                    const isOwnedCostume = ex.type === 'costume' && fishingState.ownedCostumeIds.includes(ex.rewardItemId);
                    const allReqMet = ex.requiredFish.every((req) => {
                      const count = bagFish.filter((f) => f.speciesId === req.speciesId).length;
                      return count >= req.count;
                    });

                    return (
                      <div
                        key={ex.id}
                        className="p-3.5 rounded-2xl border-2 border-slate-100 bg-white hover:border-sky-200 shadow-xs space-y-2.5 transition"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{ex.icon}</span>
                            <div>
                              <div className="font-black text-xs text-slate-800">
                                {lang === 'th' ? ex.nameTh : ex.nameEn}
                              </div>
                              <div className="text-[10px] text-slate-500 font-medium">
                                {lang === 'th' ? ex.descTh : ex.descEn}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Required Fish checklist */}
                        <div className="bg-slate-50 rounded-xl p-2.5 space-y-1.5 border border-slate-100">
                          <div className="text-[10px] font-black tracking-wider uppercase text-slate-400">
                            {lang === 'th' ? 'ปลาที่ต้องใช้ (ในกระเป๋า):' : 'Required Fish (Bag):'}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {ex.requiredFish.map((req) => {
                              const sp = TWENTY_OCEAN_FISH_SPECIES.find((s) => s.id === req.speciesId);
                              const currentCount = bagFish.filter((f) => f.speciesId === req.speciesId).length;
                              const met = currentCount >= req.count;
                              return (
                                <div
                                  key={req.speciesId}
                                  className={`px-2 py-1 rounded-lg border text-[11px] font-bold flex items-center justify-between ${
                                    met
                                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                      : 'border-slate-200 bg-white text-slate-600'
                                  }`}
                                >
                                  <span className="truncate">{sp ? fishName(sp, lang) : req.speciesId}</span>
                                  <span className={met ? 'text-emerald-700 font-black' : 'text-amber-600 font-black'}>
                                    {currentCount}/{req.count}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <button
                          onClick={() => handleExchangeFish(ex)}
                          disabled={isOwnedCostume || !allReqMet}
                          className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                            isOwnedCostume
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                              : allReqMet
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md active:scale-95'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                          }`}
                        >
                          {isOwnedCostume
                            ? (lang === 'th' ? '✓ ได้รับชุดนี้แล้ว' : '✓ Already Owned')
                            : (lang === 'th' ? 'แลกเปลี่ยนของรางวัล' : 'Exchange Reward')}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'achieve' && (
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
                {/* Adventure Records Log */}
                <div className="bg-gradient-to-br from-indigo-50 to-sky-50 border-2 border-indigo-100 rounded-2xl p-3 shadow-xs">
                  <div className="text-[10px] font-black uppercase tracking-wider text-indigo-700 mb-2 flex items-center gap-1.5">
                    <span>📜</span>
                    <span>{lang === 'th' ? 'บันทึกประวัติการผจญภัยนักตกปลา' : 'Angler Adventure Log'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white/80 p-2 rounded-xl border border-indigo-100">
                      <div className="text-[10px] text-slate-400 font-bold">{lang === 'th' ? 'โยนเบ็ดทั้งหมด' : 'Total Casts'}</div>
                      <div className="text-base font-black font-mono text-indigo-900">{fishingState.quests.stats.casts || 0}</div>
                    </div>
                    <div className="bg-white/80 p-2 rounded-xl border border-indigo-100">
                      <div className="text-[10px] text-slate-400 font-bold">{lang === 'th' ? 'ตกได้สำเร็จ' : 'Total Catches'}</div>
                      <div className="text-base font-black font-mono text-emerald-600">{fishingState.totalCatches}</div>
                    </div>
                    <div className="bg-white/80 p-2 rounded-xl border border-indigo-100">
                      <div className="text-[10px] text-slate-400 font-bold">{lang === 'th' ? 'กระตุกเบ็ด (Jerk)' : 'Jerks'}</div>
                      <div className="text-base font-black font-mono text-sky-600">{fishingState.quests.stats.jerks || 0}</div>
                    </div>
                    <div className="bg-white/80 p-2 rounded-xl border border-indigo-100">
                      <div className="text-[10px] text-slate-400 font-bold">{lang === 'th' ? 'สำรวจสายพันธุ์' : 'Species'}</div>
                      <div className="text-base font-black font-mono text-amber-600">{discoveredCount}/{TOTAL_SPECIES}</div>
                    </div>
                  </div>
                </div>

                {/* Achievement Cards Catalog */}
                <div className="space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-wider text-sky-700 px-1">
                    {lang === 'th' ? 'เป้าหมายความสำเร็จ (18 รายการ)' : 'Achievements (18 Catalog)'}
                  </div>
                  {ACHIEVEMENT_CATALOG.map((ach) => {
                    let currentVal = 0;
                    if (ach.metric === 'cast') currentVal = fishingState.quests.stats.casts || 0;
                    else if (ach.metric === 'catch') currentVal = fishingState.totalCatches;
                    else if (ach.metric === 'jerk') currentVal = fishingState.quests.stats.jerks || 0;
                    else if (ach.metric === 'aquarium_add') currentVal = fishingState.caughtInventory.filter((f) => f.isLockedInAquarium).length;
                    else if (ach.metric === 'new_species') currentVal = discoveredCount;
                    else if (ach.metric === 'earn_coins') currentVal = fishingState.quests.stats.earnedCoins || fishingState.seaCoins;
                    else if (ach.metric === 'catch_rare_plus') {
                      currentVal = Object.entries(fishingState.encyclopediaMap).reduce((acc, [id, r]) => {
                        const s = TWENTY_OCEAN_FISH_SPECIES.find((x) => x.id === id);
                        return s && ['Rare', 'Epic', 'Legendary', 'Secret'].includes(s.rarity) ? acc + r.count : acc;
                      }, 0);
                    } else if (ach.metric === 'catch_epic_plus') {
                      currentVal = Object.entries(fishingState.encyclopediaMap).reduce((acc, [id, r]) => {
                        const s = TWENTY_OCEAN_FISH_SPECIES.find((x) => x.id === id);
                        return s && ['Epic', 'Legendary', 'Secret'].includes(s.rarity) ? acc + r.count : acc;
                      }, 0);
                    } else if (ach.metric === 'catch_legendary_plus') {
                      currentVal = Object.entries(fishingState.encyclopediaMap).reduce((acc, [id, r]) => {
                        const s = TWENTY_OCEAN_FISH_SPECIES.find((x) => x.id === id);
                        return s && ['Legendary', 'Secret'].includes(s.rarity) ? acc + r.count : acc;
                      }, 0);
                    } else if (ach.metric === 'catch_secret') {
                      currentVal = Object.entries(fishingState.encyclopediaMap).reduce((acc, [id, r]) => {
                        const s = TWENTY_OCEAN_FISH_SPECIES.find((x) => x.id === id);
                        return s && s.rarity === 'Secret' ? acc + r.count : acc;
                      }, 0);
                    }

                    const isDone = currentVal >= ach.target;
                    const pct = Math.min(100, Math.floor((currentVal / ach.target) * 100));

                    return (
                      <div
                        key={ach.id}
                        className={`p-3 rounded-2xl border-2 transition-all ${
                          isDone
                            ? 'border-emerald-300 bg-emerald-50/50 shadow-xs'
                            : 'border-slate-100 bg-white hover:border-sky-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{ach.icon}</span>
                            <div>
                              <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                                <span>{lang === 'th' ? ach.titleTh : ach.titleEn}</span>
                                {isDone && (
                                  <span className="text-[9px] font-black bg-emerald-500 text-white px-1.5 py-0.2 rounded-md">
                                    ✓ CLEAR
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 font-medium">
                                {lang === 'th' ? ach.descTh : ach.descEn}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-black text-amber-600 font-mono">
                              +{ach.rewardCoins.toLocaleString()} 🪙
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 rounded-full ${
                                isDone ? 'bg-emerald-500' : 'bg-sky-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0">
                            {currentVal.toLocaleString()}/{ach.target.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
