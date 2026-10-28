import React, { useEffect, useRef } from 'react';
import { FishSpeciesData, FishRarity, FishingRodItem, RARITY_CONFIG } from '../../core/data/fishingDatabase';
import { GameLang, FISHING_UI, fishName } from '../../core/data/fishingI18n';
import { soundEngine } from '../../services/soundEngine';
import { renderFishIllustration } from './FishRig';
import { Zap } from 'lucide-react';

interface Props {
  species: FishSpeciesData;
  rod: FishingRodItem;
  auto: boolean;
  hueShiftDeg: number;
  lang?: GameLang;
  onDone: (win: boolean) => void;
}

const TUNING: Record<
  FishRarity,
  { bar: number; stiff: number; dash: number; gain: number; loss: number; start: number }
> = {
  Common: { bar: 0.32, stiff: 5, dash: 0.12, gain: 0.34, loss: 0.12, start: 0.45 },
  Uncommon: { bar: 0.28, stiff: 7, dash: 0.22, gain: 0.3, loss: 0.15, start: 0.4 },
  Rare: { bar: 0.25, stiff: 9, dash: 0.34, gain: 0.27, loss: 0.18, start: 0.35 },
  Epic: { bar: 0.22, stiff: 11, dash: 0.5, gain: 0.24, loss: 0.2, start: 0.32 },
  Legendary: { bar: 0.2, stiff: 13, dash: 0.7, gain: 0.22, loss: 0.22, start: 0.3 },
  Secret: { bar: 0.18, stiff: 15, dash: 0.9, gain: 0.2, loss: 0.24, start: 0.28 }
};

const CUT_STYLE = {
  borderRadius: '10px'
};

export const ReelMinigame: React.FC<Props> = ({
  species,
  rod,
  auto,
  hueShiftDeg,
  lang = 'th',
  onDone
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const heldRef = useRef(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  const [displayProgress, setDisplayProgress] = React.useState(0.4);
  const [isInside, setIsInside] = React.useState(false);

  useEffect(() => {
    const t = TUNING[species.rarity];
    const barW = Math.min(0.48, t.bar + rod.sweetSpotSizeBonus * 0.006);
    const stiff = t.stiff * (0.9 + species.difficulty * 0.02);
    const loss = t.loss * (1 - Math.min(0.6, rod.lineStrengthBonus / 200));

    let fish = 0.5;
    let fishV = 0;
    let target = 0.6;
    let retarget = 0;
    let bar = 0.5;
    let barV = 0;
    let progress = t.start;
    let last = performance.now();
    let lastTickSound = 0;
    let finished = false;
    let anim = 0;
    let flash = 0;

    const onKey = (e: KeyboardEvent, down: boolean) => {
      if (e.code === 'Space') {
        e.preventDefault();
        heldRef.current = down;
      }
    };
    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // Fish AI movement
      retarget -= dt;
      if (retarget <= 0) {
        const dash = Math.random() < t.dash * 0.5;
        target = dash
          ? Math.max(0.08, Math.min(0.92, fish + (Math.random() < 0.5 ? -1 : 1) * (0.28 + Math.random() * 0.32)))
          : 0.1 + Math.random() * 0.8;
        retarget = dash ? 0.45 + Math.random() * 0.45 : 1 + Math.random() * 1.5 - t.dash * 0.4;
      }
      fishV += ((target - fish) * stiff - fishV * 2 * Math.sqrt(stiff) * 0.7) * dt;
      fish = Math.max(0.05, Math.min(0.95, fish + fishV * dt));

      // Bar momentum
      let held = heldRef.current;
      if (auto) {
        const err = Math.sin(now * 0.002 * (1 + species.difficulty * 0.2)) * 0.03 * (1 + species.difficulty * 0.35);
        held = bar + barV * 0.18 < fish + err;
      }
      const acc = held ? 3.6 : -3.2;
      barV += acc * dt;
      barV *= Math.pow(0.06, dt);
      bar += barV * dt;
      const lo = barW / 2;
      const hi = 1 - barW / 2;
      if (bar < lo) {
        bar = lo;
        barV = Math.abs(barV) * 0.25;
      } else if (bar > hi) {
        bar = hi;
        barV = -Math.abs(barV) * 0.25;
      }

      const inside = Math.abs(fish - bar) <= barW / 2;
      setIsInside(inside);
      progress += (inside ? t.gain : -loss) * dt;
      progress = Math.max(0, Math.min(1, progress));
      setDisplayProgress(progress);
      flash = inside ? Math.min(1, flash + dt * 6) : Math.max(0, flash - dt * 6);

      if (now - lastTickSound > (inside ? 135 : 220)) {
        lastTickSound = now;
        soundEngine.playReelTick(inside);
      }

      // Render modern high-tech gauge
      const c = canvasRef.current;
      if (c) {
        const ctx = c.getContext('2d');
        if (ctx) {
          const W = c.width;
          const H = c.height;
          ctx.clearRect(0, 0, W, H);

          const trackY = 6;
          const trackH = 30;
          const pad = 6;
          const trackW = W - pad * 2;

          // Track slot
          ctx.fillStyle = 'rgba(6, 8, 14, 0.9)';
          ctx.beginPath();
          ctx.roundRect(pad, trackY, trackW, trackH, 6);
          ctx.fill();
          ctx.strokeStyle = inside ? 'rgba(255, 70, 85, 0.5)' : 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Tick markers on track
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 1;
          for (let step = 1; step < 10; step++) {
            const tx = pad + (step / 10) * trackW;
            ctx.beginPath();
            ctx.moveTo(tx, trackY + 3);
            ctx.lineTo(tx, trackY + trackH - 3);
            ctx.stroke();
          }

          // Sweet-spot zone
          const bx = pad + (bar - barW / 2) * trackW;
          const bw = barW * trackW;

          ctx.save();
          const barGrad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
          if (inside) {
            barGrad.addColorStop(0, 'rgba(255, 70, 85, 0.25)');
            barGrad.addColorStop(0.5, 'rgba(255, 70, 85, 0.45)');
            barGrad.addColorStop(1, 'rgba(255, 70, 85, 0.25)');
            ctx.shadowColor = '#ff4655';
            ctx.shadowBlur = 10;
          } else {
            barGrad.addColorStop(0, 'rgba(56, 189, 248, 0.15)');
            barGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.3)');
            barGrad.addColorStop(1, 'rgba(56, 189, 248, 0.15)');
          }

          ctx.fillStyle = barGrad;
          ctx.beginPath();
          ctx.roundRect(bx, trackY + 2, bw, trackH - 4, 4);
          ctx.fill();

          ctx.strokeStyle = inside ? '#ff4655' : 'rgba(56, 189, 248, 0.8)';
          ctx.lineWidth = 1.6;
          ctx.stroke();

          // Left/Right Bracket indicators on sweet-spot
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.0;
          // Left bracket [
          ctx.beginPath();
          ctx.moveTo(bx + 4, trackY + 5);
          ctx.lineTo(bx + 1, trackY + 5);
          ctx.lineTo(bx + 1, trackY + trackH - 5);
          ctx.lineTo(bx + 4, trackY + trackH - 5);
          ctx.stroke();
          // Right bracket ]
          ctx.beginPath();
          ctx.moveTo(bx + bw - 4, trackY + 5);
          ctx.lineTo(bx + bw - 1, trackY + 5);
          ctx.lineTo(bx + bw - 1, trackY + trackH - 5);
          ctx.lineTo(bx + bw - 4, trackY + trackH - 5);
          ctx.stroke();
          ctx.restore();

          // Fish representation (sleek illustrated swimming icon)
          const fx = pad + fish * trackW;
          const fy = trackY + trackH / 2;

          ctx.save();
          renderFishIllustration(
            ctx,
            species,
            fx,
            fy,
            0.32,
            hueShiftDeg,
            now * 0.001,
            fishV >= 0
          );
          ctx.restore();
        }
      }

      if (!finished && (progress >= 1 || progress <= 0)) {
        finished = true;
        doneRef.current(progress >= 1);
        return;
      }
      anim = requestAnimationFrame(loop);
    };
    anim = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(anim);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, [species, rod, auto, hueShiftDeg]);

  const press = (v: boolean) => () => {
    heldRef.current = v;
  };

  const rar = RARITY_CONFIG[species.rarity] || RARITY_CONFIG.Common;

  return (
    <div className="w-full max-w-[340px] sm:max-w-[380px] bg-gradient-to-b from-[#1c1612]/95 via-[#130f0c]/95 to-[#0b0806]/95 backdrop-blur-md border-2 border-[#b8860b]/70 p-3 shadow-[0_12px_32px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,235,165,0.2)] rounded-xl select-none">
      {/* Top Header: Target Fish & Capture Gauge */}
      <div className="flex items-center justify-between text-[11px] mb-2 px-0.5">
        <div className="flex items-center gap-1.5">
          <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${rar.badgeBg} ${rar.badgeText} ${rar.borderColor}`}>
            {species.rarity.toUpperCase()}
          </span>
          <span className="font-extrabold text-[#fef08a] truncate max-w-[130px] drop-shadow-sm">
            {fishName(species, lang)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[11px] font-mono font-bold ${isInside ? 'text-amber-300' : 'text-zinc-400'}`}>
            {Math.round(displayProgress * 100)}%
          </span>
          <span className={`text-[9px] uppercase font-black px-1.5 py-0.2 rounded border tracking-wider ${isInside ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 animate-pulse' : 'bg-black/40 text-zinc-500 border-zinc-700'}`}>
            {isInside ? 'HOOKED' : 'TENSION'}
          </span>
        </div>
      </div>

      {/* Tension Track Canvas */}
      <canvas ref={canvasRef} width={360} height={42} className="w-full block rounded-lg shadow-inner" />

      {/* Sleek Capture Progress Bar */}
      <div className="w-full h-2 bg-black/80 rounded-full overflow-hidden mt-2 mb-2.5 border border-[#b8860b]/40 shadow-inner">
        <div
          className={`h-full transition-all duration-75 ${
            isInside
              ? 'bg-gradient-to-r from-amber-400 via-rose-500 to-emerald-400'
              : 'bg-gradient-to-r from-zinc-700 via-amber-700 to-rose-600'
          }`}
          style={{ width: `${Math.max(4, displayProgress * 100)}%` }}
        />
      </div>

      {/* Tactile 3D Fantasy Hold Button */}
      <button
        onPointerDown={press(true)}
        onPointerUp={press(false)}
        onPointerLeave={press(false)}
        onPointerCancel={press(false)}
        className={`w-full py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 touch-none shadow-md ${
          heldRef.current || isInside
            ? 'bg-gradient-to-b from-[#ef4444] via-[#dc2626] to-[#991b1b] border-2 border-[#fca5a5] text-white shadow-[0_3px_0_#450a0a] scale-[0.98]'
            : 'bg-gradient-to-b from-[#2a1e16] to-[#18120d] hover:from-[#3a2b20] hover:to-[#221a13] text-[#fef3c7] border border-[#b8860b]/60 shadow-[0_2px_0_#0a0806]'
        }`}
      >
        <Zap className={`w-3.5 h-3.5 ${isInside ? 'text-amber-300 animate-bounce' : 'text-amber-500'}`} />
        <span>{lang === 'th' ? 'กดค้าง [SPACE] เพื่อเย่อเบ็ด' : 'HOLD [SPACE] TO REEL'}</span>
      </button>
    </div>
  );
};
