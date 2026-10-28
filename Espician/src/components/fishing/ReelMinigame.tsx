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
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const progressTextRef = useRef<HTMLSpanElement | null>(null);
  const heldRef = useRef(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  const [isInside, setIsInside] = React.useState(false);

  useEffect(() => {
    const t = TUNING[species.rarity];
    const powerBonus = rod.rodStyle === 'power' ? 0.08 : 0;
    const barW = Math.min(0.58, t.bar + rod.sweetSpotSizeBonus * 0.006 + powerBonus);
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
      
      // Directly update progress bar and text at high precision 60-120 FPS
      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${Math.max(4, Math.min(100, progress * 100))}%`;
      }
      if (progressTextRef.current) {
        progressTextRef.current.innerText = `${Math.round(progress * 100)}% / 100%`;
      }

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

          // Translucent track slot
          ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
          ctx.beginPath();
          ctx.roundRect(pad, trackY, trackW, trackH, 8);
          ctx.fill();
          ctx.strokeStyle = inside ? 'rgba(52, 211, 153, 0.9)' : 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Tick markers on track
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
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
            barGrad.addColorStop(0, 'rgba(52, 211, 153, 0.35)');
            barGrad.addColorStop(0.5, 'rgba(52, 211, 153, 0.65)');
            barGrad.addColorStop(1, 'rgba(52, 211, 153, 0.35)');
            ctx.shadowColor = '#34d399';
            ctx.shadowBlur = 12;
          } else {
            barGrad.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
            barGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.45)');
            barGrad.addColorStop(1, 'rgba(56, 189, 248, 0.25)');
          }

          ctx.fillStyle = barGrad;
          ctx.beginPath();
          ctx.roundRect(bx, trackY + 2, bw, trackH - 4, 6);
          ctx.fill();

          ctx.strokeStyle = inside ? '#10b981' : '#38bdf8';
          ctx.lineWidth = 2;
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
    <div className="w-full max-w-[340px] sm:max-w-[380px] bg-white/75 dark:bg-slate-900/60 backdrop-blur-xl border-2 border-white/90 shadow-[0_12px_36px_rgba(2,132,199,0.2)] rounded-2xl p-3 select-none text-slate-800">
      {/* Top Header: Target Fish & Status */}
      <div className="flex items-center justify-between text-[11px] mb-2 px-0.5">
        <div className="flex items-center gap-1.5">
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${rar.badgeBg} ${rar.badgeText} ${rar.borderColor}`}>
            {species.rarity.toUpperCase()}
          </span>
          <span className="font-extrabold text-slate-900 dark:text-white truncate max-w-[140px] drop-shadow-sm">
            {fishName(species, lang)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full border tracking-wider transition-all ${
            isInside
              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-400 animate-pulse'
              : 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-300'
          }`}>
            {isInside ? '✨ LOCK-ON' : '⚠️ OUT OF SYNC'}
          </span>
        </div>
      </div>

      {/* Tension Track Canvas (Translucent) */}
      <canvas ref={canvasRef} width={360} height={42} className="w-full block rounded-xl shadow-inner" />

      {/* Labeled Capture Progress Bar (Clearly tells user what this bar is!) */}
      <div className="mt-2 mb-2 px-0.5">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-700 dark:text-slate-200 mb-1">
          <span className="flex items-center gap-1 text-sky-700 dark:text-sky-300 font-black">
            <span>🎣</span>
            <span>{lang === 'th' ? 'ดึงปลาขึ้นสู่ผิวน้ำ (Reel Progress):' : 'Reel Progress:'}</span>
          </span>
          <span ref={progressTextRef} className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">
            40% / 100%
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-200/80 dark:bg-black/50 rounded-full overflow-hidden border border-white/80 shadow-inner">
          <div
            ref={progressBarRef}
            className={`h-full rounded-full transition-[background] duration-200 ${
              isInside
                ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]'
                : 'bg-gradient-to-r from-rose-400 to-amber-400'
            }`}
            style={{ width: '40%' }}
          />
        </div>
      </div>

      {/* Juicy 3D Cute Game Button */}
      <button
        onPointerDown={press(true)}
        onPointerUp={press(false)}
        onPointerLeave={press(false)}
        onPointerCancel={press(false)}
        className={`w-full py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 touch-none shadow-md ${
          heldRef.current || isInside
            ? 'bg-gradient-to-b from-[#10b981] to-[#059669] text-white shadow-[0_3px_0_#047857] scale-[0.98]'
            : 'bg-gradient-to-b from-[#ff6b81] to-[#ff4757] hover:brightness-105 text-white shadow-[0_3px_0_#c23616]'
        }`}
      >
        <Zap className={`w-3.5 h-3.5 ${isInside ? 'text-yellow-200 animate-bounce' : 'text-white'}`} />
        <span>{lang === 'th' ? 'กดค้าง [SPACE] เพื่อเย่อเบ็ด' : 'HOLD [SPACE] TO REEL'}</span>
      </button>
    </div>
  );
};
