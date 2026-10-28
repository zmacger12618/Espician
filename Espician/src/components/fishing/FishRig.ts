import { FishSpeciesData, FishBodyShape, RARITY_CONFIG } from '../../core/data/fishingDatabase';

/* ------------------------------------------------------------------ */
/* Color helpers                                                       */
/* ------------------------------------------------------------------ */
type RGB = [number, number, number];

const hexToRgb = (h: string): RGB => {
  let s = (h || '#888888').replace('#', '');
  if (s.length === 3) s = s.split('').map((c) => c + c).join('');
  const n = parseInt(s.slice(0, 6), 16);
  if (Number.isNaN(n)) return [136, 136, 136];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgba = (c: RGB, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mix = (a: string, b: string, t: number): RGB => {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t];
};
const shade = (h: string, amt: number): RGB =>
  amt < 0 ? mix(h, '#000000', -amt) : mix(h, '#ffffff', amt);
const col = (h: string, a = 1) => rgba(hexToRgb(h), a);

/* ------------------------------------------------------------------ */
/* Generic skeletal fish rig                                           */
/* ------------------------------------------------------------------ */
type TailKind = 'fork' | 'lunate' | 'round' | 'fan';
type DorsalKind = 'single' | 'long' | 'spiny' | 'sail' | 'none';

interface Rig {
  L: number; // length factor (1 = 86px)
  H: number; // height factor
  tail: TailKind;
  dorsal: DorsalKind;
  tailLen?: number;
  hump?: number;
  bill?: number;
  lure?: boolean;
  lobed?: boolean;
  bigMouth?: boolean;
  box?: boolean;
  longJaw?: boolean;
  bigPectoral?: boolean;
  finlets?: boolean;
  blunt?: number; // head roundness exponent (smaller = blunter)
}

const RIGS: Partial<Record<FishBodyShape, Rig>> = {
  sardine: { L: 0.92, H: 0.27, tail: 'fork', dorsal: 'single', tailLen: 0.2, blunt: 0.7 },
  clownfish: { L: 0.7, H: 0.44, tail: 'round', dorsal: 'long', tailLen: 0.16, blunt: 0.45 },
  mackerel: { L: 1.0, H: 0.3, tail: 'fork', dorsal: 'spiny', finlets: true, blunt: 0.7 },
  flounder: { L: 0.82, H: 0.64, tail: 'round', dorsal: 'long', tailLen: 0.15, blunt: 0.5 },
  bream: { L: 0.78, H: 0.56, tail: 'fork', dorsal: 'spiny', blunt: 0.5 },
  snapper: { L: 0.9, H: 0.44, tail: 'fork', dorsal: 'spiny', blunt: 0.6 },
  parrotfish: { L: 0.9, H: 0.48, tail: 'lunate', dorsal: 'long', hump: 0.12, blunt: 0.4 },
  boxfish: { L: 0.66, H: 0.5, tail: 'round', dorsal: 'none', box: true, tailLen: 0.14, blunt: 0.4 },
  barracuda: { L: 1.18, H: 0.2, tail: 'fork', dorsal: 'single', longJaw: true, blunt: 0.9 },
  tuna: { L: 1.05, H: 0.42, tail: 'lunate', dorsal: 'single', finlets: true, tailLen: 0.3, blunt: 0.65 },
  lionfish: { L: 0.8, H: 0.42, tail: 'fan', dorsal: 'spiny', bigPectoral: true, tailLen: 0.22, blunt: 0.5 },
  mahimahi: { L: 1.0, H: 0.44, tail: 'fork', dorsal: 'long', hump: 0.3, blunt: 0.35 },
  swordfish: { L: 1.05, H: 0.34, tail: 'lunate', dorsal: 'sail', bill: 0.42, tailLen: 0.3, blunt: 0.8 },
  anglerfish: { L: 0.8, H: 0.66, tail: 'round', dorsal: 'none', lure: true, bigMouth: true, tailLen: 0.18, blunt: 0.35 },
  whaleshark: { L: 1.22, H: 0.42, tail: 'lunate', dorsal: 'single', bigMouth: true, tailLen: 0.3, blunt: 0.3 },
  coelacanth: { L: 0.92, H: 0.48, tail: 'fan', dorsal: 'single', lobed: true, tailLen: 0.24, blunt: 0.45 },
  chronoskoi: { L: 1.02, H: 0.42, tail: 'fan', dorsal: 'long', tailLen: 0.5, blunt: 0.45 }
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

function drawFishRig(ctx: CanvasRenderingContext2D, sp: FishSpeciesData, rig: Rig, t: number) {
  const W = rig.L * 86;
  const Hh = rig.H * 86;
  const N = 28;
  const amp = W * 0.06;
  const ys = (u: number) => Math.sin(t * 5.2 - u * 3.4) * amp * Math.pow(u, 1.35);
  const xs = (u: number) => W / 2 - u * W;
  const blunt = rig.blunt ?? 0.55;

  const prof = (u: number) => {
    let head = Math.pow(clamp(u / 0.2, 0, 1), blunt);
    if (rig.box) head = Math.pow(clamp(u / 0.1, 0, 1), 0.4);
    const taperStart = rig.box ? 0.78 : 0.34;
    const k = clamp((u - taperStart) / (1 - taperStart), 0, 1);
    const sm = k * k * (3 - 2 * k);
    const tailEnd = rig.box ? 0.45 : 0.14;
    return head * (1 - sm * (1 - tailEnd));
  };

  const top: { x: number; y: number }[] = [];
  const bot: { x: number; y: number }[] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const th = (Hh / 2) * prof(u);
    const bump = rig.hump ? rig.hump * Math.exp(-Math.pow((u - 0.14) / 0.1, 2)) : 0;
    top.push({ x: xs(u), y: ys(u) - th * (1 + bump) });
    bot.push({ x: xs(u), y: ys(u) + th * 0.94 });
  }
  const at = (arr: { x: number; y: number }[], u: number) => {
    const f = clamp(u, 0, 1) * N;
    const i = Math.min(N - 1, Math.floor(f));
    const r = f - i;
    return { x: arr[i].x + (arr[i + 1].x - arr[i].x) * r, y: arr[i].y + (arr[i + 1].y - arr[i].y) * r };
  };

  const primary = sp.primaryColor;
  const secondary = sp.secondaryColor;
  const accent = sp.accentColor;
  const dark = col(primary, 1);
  const outline = rgba(shade(primary, -0.72), 0.92);

  /* --- Tail fin (behind body) --- */
  const tl = (rig.tailLen ?? 0.22) * 86;
  const root = { x: xs(1), y: ys(1) };
  const back = { x: xs(0.93), y: ys(0.93) };
  const tailAng = Math.atan2(root.y - back.y, root.x - back.x);
  const tailTh = Math.max(Hh * 0.55, 14);
  ctx.save();
  ctx.translate(root.x, root.y);
  ctx.rotate(tailAng + Math.sin(t * 5.2 - 3.4) * 0.18);
  const tg = ctx.createLinearGradient(0, 0, tl, 0);
  tg.addColorStop(0, col(primary, 0.95));
  tg.addColorStop(1, col(accent, 0.55));
  ctx.fillStyle = tg;
  ctx.beginPath();
  const pw = Math.max(2, Hh * 0.09);
  ctx.moveTo(-2, -pw);
  if (rig.tail === 'fork') {
    ctx.bezierCurveTo(tl * 0.4, -pw * 1.5, tl * 0.8, -tailTh * 0.7, tl, -tailTh * 0.85);
    ctx.quadraticCurveTo(tl * 0.62, 0, tl, tailTh * 0.85);
    ctx.bezierCurveTo(tl * 0.8, tailTh * 0.7, tl * 0.4, pw * 1.5, -2, pw);
  } else if (rig.tail === 'lunate') {
    ctx.bezierCurveTo(tl * 0.3, -pw * 2, tl * 0.5, -tailTh, tl * 1.05, -tailTh * 1.25);
    ctx.quadraticCurveTo(tl * 0.55, 0, tl * 1.05, tailTh * 1.25);
    ctx.bezierCurveTo(tl * 0.5, tailTh, tl * 0.3, pw * 2, -2, pw);
  } else if (rig.tail === 'round') {
    ctx.bezierCurveTo(tl * 0.4, -tailTh * 0.7, tl * 1.0, -tailTh * 0.55, tl, 0);
    ctx.bezierCurveTo(tl * 1.0, tailTh * 0.55, tl * 0.4, tailTh * 0.7, -2, pw);
  } else {
    // flowing fan
    const sway = Math.sin(t * 3 + 1) * 6;
    ctx.bezierCurveTo(tl * 0.3, -tailTh * 0.8, tl * 0.8, -tailTh * 1.1 + sway, tl * 1.15, -tailTh * 0.7 + sway);
    ctx.bezierCurveTo(tl * 0.95, -tailTh * 0.2, tl * 1.2, tailTh * 0.3 - sway, tl * 1.1, tailTh * 0.8 - sway);
    ctx.bezierCurveTo(tl * 0.8, tailTh * 1.1 - sway, tl * 0.3, tailTh * 0.8, -2, pw);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = rgba(shade(accent, 0.4), 0.28);
  ctx.lineWidth = 0.9;
  for (let k = -3; k <= 3; k++) {
    ctx.beginPath();
    ctx.moveTo(0, k * pw * 0.3);
    ctx.lineTo(tl * 0.95, k * tailTh * 0.26);
    ctx.stroke();
  }
  ctx.restore();

  /* --- Dorsal fin (behind body) --- */
  if (rig.dorsal !== 'none') {
    const fg = ctx.createLinearGradient(0, -Hh, 0, 0);
    fg.addColorStop(0, col(accent, 0.75));
    fg.addColorStop(1, col(primary, 0.9));
    ctx.fillStyle = fg;
    const flap = Math.sin(t * 4.2) * 2;
    if (rig.dorsal === 'spiny') {
      const spikes = sp.bodyShape === 'lionfish' ? 8 : 6;
      const u0 = 0.2;
      const u1 = 0.62;
      ctx.beginPath();
      const s0 = at(top, u0);
      ctx.moveTo(s0.x, s0.y + 2);
      for (let k = 0; k <= spikes; k++) {
        const u = u0 + ((u1 - u0) * k) / spikes;
        const p = at(top, u);
        const hgt = (sp.bodyShape === 'lionfish' ? 36 : 17) * (1 - Math.abs(k / spikes - 0.35) * 0.6);
        ctx.lineTo(p.x - hgt * 0.35 + flap, p.y - hgt);
        const pn = at(top, u + (u1 - u0) / spikes / 2);
        ctx.lineTo(pn.x, pn.y + 1);
      }
      const e = at(top, u1);
      ctx.lineTo(e.x, e.y + 2);
      ctx.closePath();
      ctx.fill();
    } else {
      const cfg =
        rig.dorsal === 'sail'
          ? { u0: 0.24, u1: 0.62, h: Hh * 0.95 }
          : rig.dorsal === 'long'
          ? { u0: 0.14, u1: 0.82, h: Hh * 0.33 }
          : { u0: 0.3, u1: 0.55, h: Hh * 0.42 };
      const a = at(top, cfg.u0);
      const b = at(top, cfg.u1);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y + 2);
      ctx.bezierCurveTo(a.x - 4, a.y - cfg.h + flap, (a.x + b.x) / 2 + 6, a.y - cfg.h * 1.05 + flap, b.x + 2, b.y + 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rgba(shade(accent, 0.45), 0.35);
      ctx.lineWidth = 0.8;
      for (let k = 1; k < 6; k++) {
        const p = at(top, cfg.u0 + ((cfg.u1 - cfg.u0) * k) / 6);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y + 1);
        ctx.lineTo(p.x - 2, p.y - cfg.h * (0.9 - Math.abs(k - 3) * 0.12) + flap);
        ctx.stroke();
      }
    }
    if (rig.finlets) {
      ctx.fillStyle = col(accent, 0.9);
      for (let k = 0; k < 5; k++) {
        const p = at(top, 0.68 + k * 0.05);
        const q = at(top, 0.7 + k * 0.05);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y + 1);
        ctx.lineTo(q.x - 1, q.y - 6);
        ctx.lineTo(q.x + 1, q.y + 1);
        ctx.fill();
      }
    }
  }

  /* --- Anal + pelvic fins --- */
  ctx.fillStyle = col(accent, 0.7);
  {
    const a = at(bot, 0.62);
    const b = at(bot, 0.8);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y - 2);
    ctx.quadraticCurveTo(a.x - 3, a.y + Hh * 0.22, b.x, b.y - 1);
    ctx.fill();
    const c = at(bot, 0.36);
    ctx.beginPath();
    ctx.moveTo(c.x + 3, c.y - 2);
    ctx.quadraticCurveTo(c.x - 4, c.y + Hh * 0.22 + Math.sin(t * 3) * 1.5, c.x - 8, c.y - 1);
    ctx.fill();
  }

  /* --- Bill / lure / long jaw (behind body) --- */
  if (rig.bill) {
    const bl = rig.bill * 86;
    const g = ctx.createLinearGradient(W / 2, 0, W / 2 + bl, 0);
    g.addColorStop(0, rgba(shade(primary, -0.2), 1));
    g.addColorStop(1, rgba(shade(secondary, 0.1), 1));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 6, -3.5);
    ctx.lineTo(W / 2 + bl, 0.4);
    ctx.lineTo(W / 2 - 6, 3.5);
    ctx.closePath();
    ctx.fill();
  }
  if (rig.longJaw) {
    ctx.fillStyle = rgba(shade(primary, -0.1), 1);
    ctx.beginPath();
    ctx.moveTo(W / 2 - 8, -3);
    ctx.lineTo(W / 2 + 18, -0.5);
    ctx.lineTo(W / 2 + 15, 2.2);
    ctx.lineTo(W / 2 - 8, 4);
    ctx.fill();
  }

  /* --- Body --- */
  const bodyPath = () => {
    ctx.beginPath();
    ctx.moveTo(top[0].x, top[0].y);
    for (let i = 1; i <= N; i++) ctx.lineTo(top[i].x, top[i].y);
    for (let i = N; i >= 0; i--) ctx.lineTo(bot[i].x, bot[i].y);
    ctx.closePath();
  };
  const bg = ctx.createLinearGradient(0, -Hh / 2, 0, Hh / 2);
  bg.addColorStop(0, rgba(shade(primary, -0.22), 1));
  bg.addColorStop(0.42, dark);
  bg.addColorStop(0.72, rgba(mix(primary, secondary, 0.65), 1));
  bg.addColorStop(1, rgba(shade(secondary, 0.25), 1));
  ctx.fillStyle = bg;
  if (sp.patternType === 'crystal') ctx.globalAlpha = 0.88;
  bodyPath();
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.save();
  bodyPath();
  ctx.clip();

  // scales
  ctx.strokeStyle = 'rgba(255,255,255,0.11)';
  ctx.lineWidth = 0.8;
  const sr = Math.max(3.4, Hh * 0.1);
  for (let row = -4; row <= 4; row++) {
    for (let cx = -W / 2 + 6; cx < W / 2 - 6; cx += sr * 1.7) {
      const u = (W / 2 - cx) / W;
      const cy = ys(clamp(u, 0, 1)) + row * sr * 1.05 + ((Math.round(cx / (sr * 1.7)) % 2) * sr) / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, sr, -0.2, Math.PI * 0.55);
      ctx.stroke();
    }
  }

  // patterns
  const pat = sp.patternType;
  if (pat === 'bands' || pat === 'stripes') {
    const bandsU = sp.bodyShape === 'clownfish' ? [0.26, 0.55, 0.84] : [0.22, 0.36, 0.5, 0.64, 0.78];
    bandsU.forEach((u) => {
      const p = at(top, u);
      const q = at(bot, u);
      const bw = sp.bodyShape === 'clownfish' ? 8 : 4.5;
      ctx.fillStyle = sp.bodyShape === 'clownfish' ? col(secondary, 0.96) : col(accent, 0.5);
      ctx.beginPath();
      ctx.moveTo(p.x + bw / 2, p.y - 3);
      ctx.lineTo(p.x - bw / 2, p.y - 3);
      ctx.lineTo(q.x - bw / 2, q.y + 3);
      ctx.lineTo(q.x + bw / 2, q.y + 3);
      ctx.fill();
      if (sp.bodyShape === 'clownfish') {
        ctx.strokeStyle = col(accent, 0.95);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(p.x + bw / 2, p.y - 3);
        ctx.lineTo(q.x + bw / 2, q.y + 3);
        ctx.moveTo(p.x - bw / 2, p.y - 3);
        ctx.lineTo(q.x - bw / 2, q.y + 3);
        ctx.stroke();
      }
    });
  } else if (pat === 'spots' || pat === 'starlight') {
    for (let i = 0; i < 26; i++) {
      const u = 0.12 + ((i * 0.137) % 0.78);
      const r = (i * 0.311) % 1;
      const y = ys(u) + (r - 0.5) * Hh * 0.6 * prof(u);
      const tw = pat === 'starlight' ? 0.5 + 0.5 * Math.sin(t * 3 + i) : 1;
      ctx.fillStyle = col(pat === 'starlight' ? '#ffffff' : accent, 0.55 + 0.4 * tw);
      ctx.beginPath();
      ctx.arc(xs(u), y, (pat === 'starlight' ? 1.6 : 2.2) * (0.6 + r * 0.8), 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (pat === 'gradient') {
    const gg = ctx.createLinearGradient(-W / 2, 0, W / 2, 0);
    gg.addColorStop(0, col(accent, 0.38));
    gg.addColorStop(0.6, col(accent, 0));
    ctx.fillStyle = gg;
    ctx.fillRect(-W / 2, -Hh, W, Hh * 2);
  } else if (pat === 'crystal') {
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const u = 0.15 + i * 0.13;
      const a = at(top, u);
      const b = at(bot, u + 0.1);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.lineTo(at(top, u + 0.2).x, at(top, u + 0.2).y);
      ctx.stroke();
    }
    ctx.fillStyle = col(accent, 0.18 + 0.1 * Math.sin(t * 2));
    ctx.fillRect(-W / 2, -Hh, W, Hh * 2);
  } else if (pat === 'nebula') {
    for (let i = 0; i < 4; i++) {
      const cx = Math.sin(t * 0.7 + i * 1.7) * W * 0.28;
      const cy = Math.cos(t * 0.9 + i) * Hh * 0.2;
      const rg = ctx.createRadialGradient(cx, cy, 1, cx, cy, Hh * 0.7);
      rg.addColorStop(0, col(i % 2 ? accent : secondary, 0.5));
      rg.addColorStop(1, col(accent, 0));
      ctx.fillStyle = rg;
      ctx.fillRect(-W / 2, -Hh, W, Hh * 2);
    }
  }
  if (sp.bodyShape === 'whaleshark') {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (let i = 0; i < 28; i++) {
      const u = 0.1 + ((i * 0.173) % 0.82);
      const y = ys(u) + (((i * 0.37) % 1) - 0.35) * Hh * 0.5 * prof(u);
      ctx.beginPath();
      ctx.arc(xs(u), y, 1.5 + ((i * 7) % 3) * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // lateral line + top sheen
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 3; i <= N - 3; i++) {
    const u = i / N;
    const y = ys(u) - Hh * 0.04 * prof(u);
    if (i === 3) ctx.moveTo(xs(u), y);
    else ctx.lineTo(xs(u), y);
  }
  ctx.stroke();
  const sheen = ctx.createLinearGradient(0, -Hh / 2, 0, 0);
  sheen.addColorStop(0, 'rgba(255,255,255,0.34)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.beginPath();
  for (let i = 2; i <= N - 4; i++) {
    const p = at(top, i / N);
    if (i === 2) ctx.moveTo(p.x, p.y + 1);
    else ctx.lineTo(p.x, p.y + 1);
  }
  for (let i = N - 4; i >= 2; i--) {
    const p = at(top, i / N);
    ctx.lineTo(p.x, p.y + Hh * 0.2 * prof(i / N));
  }
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = outline;
  ctx.lineWidth = 2.2;
  ctx.lineJoin = 'round';
  bodyPath();
  ctx.stroke();

  // Crisp 2D Anime Cel-Shaded Top Rim Highlight
  ctx.strokeStyle = 'rgba(255,255,255,0.52)';
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 3; i <= Math.floor(N * 0.65); i++) {
    const p = top[i];
    if (i === 3) ctx.moveTo(p.x, p.y + 2.2);
    else ctx.lineTo(p.x, p.y + 2.2);
  }
  ctx.stroke();

  /* --- Box fish plates --- */
  if (rig.box) {
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      for (let j = -1; j <= 1; j++) {
        ctx.strokeRect(-W / 2 + 14 + i * 9, j * 9 - 4, 8, 8);
      }
    }
  }

  /* --- Pectoral fin --- */
  {
    const p = at(top, 0.26);
    const py = p.y + Hh * 0.55;
    ctx.save();
    ctx.translate(p.x, py);
    ctx.rotate(0.6 + Math.sin(t * 4.5) * 0.3);
    const len = rig.bigPectoral ? 44 : rig.lobed ? 22 : 20;
    const wd = rig.bigPectoral ? 20 : rig.lobed ? 13 : 8;
    const pg = ctx.createLinearGradient(0, 0, len, 0);
    pg.addColorStop(0, col(primary, 0.95));
    pg.addColorStop(1, col(accent, rig.bigPectoral ? 0.35 : 0.6));
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(len * 0.3, -wd, len * 0.85, -wd * 0.6, len, 0);
    ctx.bezierCurveTo(len * 0.85, wd * 0.6, len * 0.3, wd, 0, 0);
    ctx.fill();
    if (rig.bigPectoral || rig.lobed) {
      ctx.strokeStyle = rgba(shade(accent, 0.5), 0.4);
      ctx.lineWidth = 0.8;
      for (let k = -3; k <= 3; k++) {
        ctx.beginPath();
        ctx.moveTo(2, 0);
        ctx.lineTo(len * 0.95, k * (wd / 4));
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /* --- Head details: gill, mouth, eye --- */
  {
    const g1 = at(top, 0.23);
    const g2 = at(bot, 0.2);
    ctx.strokeStyle = rgba(shade(primary, -0.5), 0.5);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(g1.x, g1.y + Hh * 0.08);
    ctx.quadraticCurveTo(g1.x + 6, (g1.y + g2.y) / 2, g2.x + 1, g2.y - Hh * 0.08);
    ctx.stroke();

    const nose = at(top, 0.006);
    const noseB = at(bot, 0.006);
    const my = (nose.y + noseB.y) / 2 + Hh * 0.06;
    ctx.strokeStyle = rgba(shade(primary, -0.6), 0.9);
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    if (rig.bigMouth) {
      ctx.moveTo(W / 2, my - 2);
      ctx.quadraticCurveTo(W / 2 - Hh * 0.35, my + Hh * 0.18, W / 2 - Hh * 0.55, my + 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      for (let k = 0; k < 6; k++) {
        const x = W / 2 - 2 - k * 5;
        ctx.beginPath();
        ctx.moveTo(x, my + 1 + k * 0.6);
        ctx.lineTo(x - 2, my + 6 + k * 0.4);
        ctx.lineTo(x - 4, my + 1 + k * 0.6);
        ctx.fill();
      }
    } else {
      ctx.moveTo(W / 2 - 1, my);
      ctx.quadraticCurveTo(W / 2 - 6, my + 3, W / 2 - 11, my + 1);
      ctx.stroke();
    }

    const ex = W / 2 - W * 0.14;
    const e1 = at(top, 0.14);
    const e2 = at(bot, 0.14);
    const ey = (e1.y + e2.y) / 2 - Hh * 0.06;
    const er = clamp(Hh * 0.125, 4.2, 9.2);

    // Cute anime cheek blush under eye
    ctx.fillStyle = 'rgba(251, 113, 133, 0.42)';
    ctx.beginPath();
    ctx.ellipse(ex - er * 0.35, ey + er * 0.95, er * 0.65, er * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sclera
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ex, ey, er, 0, Math.PI * 2);
    ctx.fill();

    // Glossy 2D Anime Iris & Pupil
    const ig = ctx.createRadialGradient(ex + 0.6, ey + er * 0.2, 0.5, ex + 0.6, ey, er * 0.88);
    ig.addColorStop(0, rgba(shade(accent, 0.25), 1));
    ig.addColorStop(0.5, '#1e1b4b');
    ig.addColorStop(1, '#09090b');
    ctx.fillStyle = ig;
    ctx.beginPath();
    ctx.arc(ex + er * 0.12, ey, er * 0.78, 0, Math.PI * 2);
    ctx.fill();

    // Deep pupil core
    ctx.fillStyle = '#050508';
    ctx.beginPath();
    ctx.arc(ex + er * 0.15, ey, er * 0.42, 0, Math.PI * 2);
    ctx.fill();

    // Dual Anime Specular Highlights
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ex - er * 0.22, ey - er * 0.28, er * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ex + er * 0.28, ey + er * 0.26, er * 0.16, 0, Math.PI * 2);
    ctx.fill();

    // Bold Anime Eye Outline & Upper Lash
    ctx.strokeStyle = '#150d20';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(ex, ey, er, 0, Math.PI * 2);
    ctx.stroke();
  }

  /* --- Angler lure --- */
  if (rig.lure) {
    const p = at(top, 0.12);
    const wob = Math.sin(t * 2.4) * 4;
    ctx.strokeStyle = rgba(shade(primary, -0.2), 1);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y + 2);
    ctx.quadraticCurveTo(p.x + 16, p.y - 34, p.x + 34, p.y - 22 + wob);
    ctx.stroke();
    const lx = p.x + 34;
    const ly = p.y - 22 + wob;
    const lg = ctx.createRadialGradient(lx, ly, 1, lx, ly, 22);
    lg.addColorStop(0, 'rgba(255,255,255,0.95)');
    lg.addColorStop(0.25, col(accent, 0.8));
    lg.addColorStop(1, col(accent, 0));
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(lx, ly, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(lx, ly, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ------------------------------------------------------------------ */
/* Special creature renderers (facing right, origin = center)         */
/* ------------------------------------------------------------------ */
function drawManta(ctx: CanvasRenderingContext2D, sp: FishSpeciesData, t: number) {
  const f = 1 + 0.1 * Math.sin(t * 2.6);
  const tipShift = Math.sin(t * 2.6 - 0.6) * 5;
  const wing = (s: number) => {
    ctx.moveTo(48, 0);
    ctx.quadraticCurveTo(26, -30 * f * s, -2 + tipShift, -44 * f * s);
    ctx.quadraticCurveTo(-8, -20 * s, -30, -3 * s);
    ctx.lineTo(-30, 3 * s);
    ctx.quadraticCurveTo(-8, 20 * s, -2 + tipShift, 44 * f * s);
    ctx.quadraticCurveTo(26, 30 * f * s, 48, 0);
  };
  // whip tail
  ctx.strokeStyle = col(sp.primaryColor, 1);
  for (let k = 0; k < 14; k++) {
    ctx.lineWidth = 3.2 * (1 - k / 15);
    ctx.beginPath();
    const x0 = -30 - k * 5;
    const x1 = -30 - (k + 1) * 5;
    ctx.moveTo(x0, Math.sin(t * 4 - k * 0.5) * (k * 0.7));
    ctx.lineTo(x1, Math.sin(t * 4 - (k + 1) * 0.5) * ((k + 1) * 0.7));
    ctx.stroke();
  }
  const g = ctx.createLinearGradient(-30, 0, 48, 0);
  g.addColorStop(0, rgba(shade(sp.primaryColor, -0.25), 1));
  g.addColorStop(0.6, col(sp.primaryColor, 1));
  g.addColorStop(1, rgba(shade(sp.primaryColor, 0.15), 1));
  ctx.fillStyle = g;
  ctx.beginPath();
  wing(1);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = rgba(shade(sp.primaryColor, -0.6), 0.7);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // wing rays
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  for (let k = -4; k <= 4; k++) {
    ctx.beginPath();
    ctx.moveTo(30, k * 1.5);
    ctx.quadraticCurveTo(10, k * 5 * f, -8, k * 9 * f);
    ctx.stroke();
  }
  // shoulder patches
  ctx.fillStyle = col(sp.secondaryColor, 0.85);
  [-1, 1].forEach((s) => {
    ctx.beginPath();
    ctx.ellipse(24, s * 13, 9, 4.5, s * 0.5, 0, Math.PI * 2);
    ctx.fill();
  });
  // cephalic fins
  ctx.fillStyle = rgba(shade(sp.primaryColor, -0.1), 1);
  [-1, 1].forEach((s) => {
    ctx.beginPath();
    ctx.moveTo(44, s * 4);
    ctx.quadraticCurveTo(56, s * 8, 58, s * 14 + Math.sin(t * 3) * 1.5);
    ctx.lineTo(48, s * 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(36, s * 11, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.arc(36.6, s * 11, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgba(shade(sp.primaryColor, -0.1), 1);
  });
}

function drawRibbon(ctx: CanvasRenderingContext2D, sp: FishSpeciesData, t: number, dragon: boolean) {
  const N = 46;
  const Wd = 118;
  const thick = dragon ? 11 : 7.5;
  const pts: { x: number; yt: number; yb: number; y: number }[] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const y = Math.sin(t * 3.2 - u * 7) * (4 + u * 9);
    const head = Math.pow(clamp(u / 0.07, 0, 1), 0.5);
    const th = thick * head * (1 - u * 0.82) + 0.8;
    pts.push({ x: Wd / 2 - u * Wd, y, yt: y - th, yb: y + th });
  }
  // dorsal ribbon crest
  ctx.strokeStyle = col(sp.accentColor, 0.85);
  for (let i = 2; i < N; i += 2) {
    const p = pts[i];
    const h = (dragon ? 14 : 12) * (1 - i / N * 0.6);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(p.x, p.yt + 1);
    ctx.quadraticCurveTo(p.x - 4 + Math.sin(t * 5 + i) * 3, p.yt - h * 0.6, p.x - 7 + Math.sin(t * 4 + i) * 4, p.yt - h);
    ctx.stroke();
  }
  // body
  const g = ctx.createLinearGradient(Wd / 2, 0, -Wd / 2, 0);
  g.addColorStop(0, rgba(shade(sp.primaryColor, 0.1), 1));
  g.addColorStop(0.5, col(sp.primaryColor, 1));
  g.addColorStop(1, col(sp.accentColor, 0.8));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].yt);
  for (let i = 1; i <= N; i++) ctx.lineTo(pts[i].x, pts[i].yt);
  for (let i = N; i >= 0; i--) ctx.lineTo(pts[i].x, pts[i].yb);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = rgba(shade(sp.primaryColor, -0.55), 0.7);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // belly highlight + scales
  ctx.strokeStyle = col(sp.secondaryColor, 0.45);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 3; i < N - 2; i++) {
    const p = pts[i];
    const y = p.y + (p.yb - p.y) * 0.45;
    if (i === 3) ctx.moveTo(p.x, y);
    else ctx.lineTo(p.x, y);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 0.8;
  for (let i = 4; i < N - 4; i += 2) {
    const p = pts[i];
    ctx.beginPath();
    ctx.arc(p.x, p.y, (p.yb - p.yt) * 0.35, Math.PI * 0.3, Math.PI * 1.1);
    ctx.stroke();
  }
  // head plume
  ctx.strokeStyle = col(sp.accentColor, 0.95);
  for (let k = 0; k < 5; k++) {
    ctx.lineWidth = 2 - k * 0.2;
    ctx.beginPath();
    ctx.moveTo(pts[1].x - 2, pts[1].yt);
    ctx.quadraticCurveTo(
      pts[1].x + 4 + k * 3,
      pts[1].yt - 14 - k * 3 + Math.sin(t * 4 + k) * 2,
      pts[1].x + 16 + k * 5,
      pts[1].yt - 10 - k * 4 + Math.sin(t * 3 + k) * 4
    );
    ctx.stroke();
  }
  if (dragon) {
    // horns
    ctx.fillStyle = col(sp.secondaryColor, 1);
    [-1, 1].forEach((s) => {
      ctx.beginPath();
      ctx.moveTo(pts[2].x - 2, pts[2].y + s * 3 - 6);
      ctx.quadraticCurveTo(pts[2].x + 8, pts[2].y - 22 + s * 3, pts[2].x + 20, pts[2].y - 20 + s * 3);
      ctx.quadraticCurveTo(pts[2].x + 8, pts[2].y - 14, pts[2].x + 2, pts[2].y - 4);
      ctx.fill();
    });
    // whiskers
    ctx.strokeStyle = col(sp.accentColor, 0.9);
    ctx.lineWidth = 1.6;
    [-1, 1].forEach((s) => {
      ctx.beginPath();
      ctx.moveTo(pts[0].x - 2, pts[0].y + 3);
      for (let k = 1; k <= 14; k++) {
        ctx.lineTo(
          pts[0].x - 2 + k * 3.2,
          pts[0].y + 3 + s * (4 + k * 1.2) + Math.sin(t * 4 - k * 0.5) * 3
        );
      }
      ctx.stroke();
    });
    // pectoral fins
    ctx.fillStyle = col(sp.accentColor, 0.7);
    ctx.beginPath();
    ctx.moveTo(pts[7].x, pts[7].yb);
    ctx.quadraticCurveTo(pts[7].x - 12, pts[7].yb + 20 + Math.sin(t * 5) * 4, pts[7].x - 22, pts[7].yb + 8);
    ctx.fill();
  }
  // eye
  const ex = pts[2].x + 1;
  const ey = pts[2].y - thick * 0.15;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(ex, ey, 4.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = dragon ? '#ef4444' : '#0a0a0a';
  ctx.beginPath();
  ctx.arc(ex + 0.6, ey, 2.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath();
  ctx.arc(ex + 0.7, ey, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(ex - 0.8, ey - 1.2, 0.9, 0, Math.PI * 2);
  ctx.fill();
}

function drawShrimp(ctx: CanvasRenderingContext2D, sp: FishSpeciesData, t: number) {
  const pulse = Math.sin(t * 6);
  const pos = (s: number) => ({
    x: 26 - s * 62,
    y: -16 * Math.sin(s * Math.PI * 0.95) + 10 * s + Math.sin(t * 7 - s * 4) * 3.2 * s
  });
  // antennae
  ctx.strokeStyle = col(sp.accentColor, 0.9);
  ctx.lineWidth = 1.2;
  [-1, 1].forEach((k) => {
    ctx.beginPath();
    ctx.moveTo(34, -10);
    for (let i = 1; i <= 16; i++) {
      ctx.lineTo(34 + i * 4, -10 - i * 1.2 * (k > 0 ? 0.6 : 1.1) + Math.sin(t * 3 - i * 0.5) * 3 * k);
    }
    ctx.stroke();
  });
  // legs
  ctx.strokeStyle = col(sp.secondaryColor, 0.9);
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 6; i++) {
    const p = pos(0.05 + i * 0.09);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y + 6);
    ctx.lineTo(p.x - 3 + Math.sin(t * 8 + i) * 3, p.y + 14);
    ctx.stroke();
  }
  // tail fan
  const tailP = pos(1);
  ctx.save();
  ctx.translate(tailP.x, tailP.y);
  ctx.rotate(0.4 + pulse * 0.2);
  for (let k = -2; k <= 2; k++) {
    ctx.save();
    ctx.rotate(k * 0.3);
    const lg = ctx.createLinearGradient(0, 0, -20, 0);
    lg.addColorStop(0, col(sp.primaryColor, 1));
    lg.addColorStop(1, col(sp.accentColor, 0.7));
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.ellipse(-9, 0, 10, 4.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
  // segments
  for (let i = 6; i >= 1; i--) {
    const s = i / 7;
    const p = pos(s);
    const q = pos(s + 0.06);
    const ang = Math.atan2(q.y - p.y, q.x - p.x);
    const size = 12 - i * 0.9;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(ang);
    const g = ctx.createLinearGradient(0, -size, 0, size);
    g.addColorStop(0, rgba(shade(sp.primaryColor, 0.15), 1));
    g.addColorStop(0.55, col(sp.primaryColor, 1));
    g.addColorStop(1, col(sp.secondaryColor, 1));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, 8.4, size, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = col(sp.accentColor, 0.7);
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.restore();
    // swimmerets
    ctx.strokeStyle = col(sp.secondaryColor, 0.85);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y + size - 2);
    ctx.lineTo(p.x - 3, p.y + size + 5 + Math.sin(t * 9 + i) * 2);
    ctx.stroke();
  }
  // carapace
  const hp = pos(0);
  const hg = ctx.createLinearGradient(0, -14, 0, 14);
  hg.addColorStop(0, rgba(shade(sp.primaryColor, 0.2), 1));
  hg.addColorStop(1, col(sp.primaryColor, 1));
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.ellipse(hp.x + 2, hp.y - 1, 16, 12.5, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = col(sp.accentColor, 0.8);
  ctx.lineWidth = 1.4;
  ctx.stroke();
  // rostrum
  ctx.fillStyle = col(sp.accentColor, 1);
  ctx.beginPath();
  ctx.moveTo(14, -10);
  ctx.lineTo(36, -16);
  ctx.lineTo(16, -3);
  ctx.fill();
  // eye
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath();
  ctx.arc(hp.x + 14, hp.y - 7, 3.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(hp.x + 13, hp.y - 8.2, 1.2, 0, Math.PI * 2);
  ctx.fill();
  // claws
  ctx.strokeStyle = col(sp.accentColor, 0.9);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(hp.x + 12, hp.y + 8);
  ctx.lineTo(hp.x + 24, hp.y + 14 + Math.sin(t * 3) * 2);
  ctx.stroke();
}

function drawSquid(ctx: CanvasRenderingContext2D, sp: FishSpeciesData, t: number) {
  const jet = Math.sin(t * 3.2);
  const sq = 1 + jet * 0.06;
  // arms (front, +x)
  for (let i = 0; i < 8; i++) {
    const base = -8 + i * 2.4;
    ctx.strokeStyle = col(i % 2 ? sp.primaryColor : sp.secondaryColor, 0.95);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(20, base);
    for (let k = 1; k <= 8; k++) {
      ctx.lineTo(20 + k * 3.8, base * (1 + k * 0.1) + Math.sin(t * 4 - k * 0.7 + i) * 2.4);
    }
    ctx.stroke();
  }
  [-1, 1].forEach((s) => {
    ctx.strokeStyle = col(sp.accentColor, 0.9);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(20, s * 3);
    for (let k = 1; k <= 12; k++) {
      ctx.lineTo(20 + k * 4.2, s * (3 + k * 1.4) + Math.sin(t * 3.5 - k * 0.6) * 3);
    }
    ctx.stroke();
    ctx.fillStyle = col(sp.accentColor, 1);
    ctx.beginPath();
    ctx.ellipse(20 + 12 * 4.2, s * (3 + 12 * 1.4) + Math.sin(t * 3.5 - 7.2) * 3, 4, 2.4, 0.3, 0, Math.PI * 2);
    ctx.fill();
  });
  // fins
  ctx.fillStyle = col(sp.secondaryColor, 0.85);
  [-1, 1].forEach((s) => {
    ctx.beginPath();
    ctx.moveTo(-34, 0);
    ctx.quadraticCurveTo(-48, s * (18 + jet * 3), -62, s * 3);
    ctx.quadraticCurveTo(-48, s * 6, -34, 0);
    ctx.fill();
  });
  // mantle
  const mg = ctx.createLinearGradient(0, -14, 0, 14);
  mg.addColorStop(0, rgba(shade(sp.primaryColor, -0.15), 1));
  mg.addColorStop(0.6, col(sp.primaryColor, 1));
  mg.addColorStop(1, col(sp.secondaryColor, 1));
  ctx.fillStyle = mg;
  ctx.beginPath();
  ctx.moveTo(22, -9);
  ctx.bezierCurveTo(0, -17 * sq, -36, -14 * sq, -64, 0);
  ctx.bezierCurveTo(-36, 14 * sq, 0, 17 * sq, 22, 9);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = rgba(shade(sp.primaryColor, -0.55), 0.6);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // chromatophores
  for (let i = 0; i < 22; i++) {
    const x = -52 + (i * 7.3) % 70;
    const y = -9 + ((i * 5.1) % 18);
    const a = 0.35 + 0.55 * Math.abs(Math.sin(t * 2.2 + i * 0.9));
    ctx.fillStyle = col(sp.accentColor, a);
    ctx.beginPath();
    ctx.arc(x, y * (1 - Math.abs(x) / 130), 1.7, 0, Math.PI * 2);
    ctx.fill();
  }
  // head + eye
  ctx.fillStyle = col(sp.primaryColor, 1);
  ctx.beginPath();
  ctx.ellipse(20, 0, 9, 9.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(20, -3, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(18.2, -4.3, 3.8, 2.6);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(18.2, -4.7, 0.9, 0, Math.PI * 2);
  ctx.fill();
}

function drawJelly(ctx: CanvasRenderingContext2D, sp: FishSpeciesData, t: number) {
  const pulse = Math.sin(t * 2.4);
  const ry = 30 * (1 + pulse * 0.12);
  const rx = 32 * (1 - pulse * 0.07);
  const cy = -10 + pulse * 2;
  // tentacles
  for (let i = 0; i < 12; i++) {
    const x0 = -rx * 0.85 + (i * rx * 1.7) / 11;
    ctx.strokeStyle = col(i % 2 ? sp.accentColor : sp.secondaryColor, 0.55);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x0, cy + 2);
    const len = 46 + (i % 3) * 10;
    for (let k = 1; k <= 14; k++) {
      ctx.lineTo(x0 + Math.sin(t * 3 - k * 0.55 + i) * (2 + k * 0.5), cy + 2 + (k * len) / 14);
    }
    ctx.stroke();
  }
  // oral arms
  for (let i = 0; i < 4; i++) {
    const x0 = -9 + i * 6;
    ctx.strokeStyle = col(sp.primaryColor, 0.8);
    ctx.lineWidth = 4.5 - i * 0.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, cy + 4);
    for (let k = 1; k <= 10; k++) {
      ctx.lineTo(x0 + Math.sin(t * 3.5 - k * 0.6 + i * 1.3) * (3 + k * 0.4), cy + 4 + k * 3.8);
    }
    ctx.stroke();
  }
  // bell
  const bg = ctx.createRadialGradient(0, cy - ry * 0.3, 2, 0, cy, ry * 1.1);
  bg.addColorStop(0, col(sp.secondaryColor, 0.9));
  bg.addColorStop(0.55, col(sp.primaryColor, 0.62));
  bg.addColorStop(1, col(sp.accentColor, 0.4));
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.moveTo(-rx, cy);
  ctx.bezierCurveTo(-rx, cy - ry * 1.25, rx, cy - ry * 1.25, rx, cy);
  const lobes = 8;
  for (let i = lobes; i >= 0; i--) {
    const x = -rx + (i * 2 * rx) / lobes;
    const y = cy + 4 + (i % 2 ? 4 : 0) * (1 + pulse * 0.4);
    ctx.quadraticCurveTo(x + rx / lobes, y + 4, x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = col(sp.secondaryColor, 0.6);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // canals
  ctx.strokeStyle = col(sp.secondaryColor, 0.35);
  ctx.lineWidth = 1;
  for (let i = -4; i <= 4; i++) {
    ctx.beginPath();
    ctx.moveTo(0, cy - 2);
    ctx.quadraticCurveTo(i * 5, cy - ry * 0.7, i * rx * 0.2 + i * 2, cy - ry * 0.18);
    ctx.stroke();
  }
  // inner glow core
  const cg = ctx.createRadialGradient(0, cy - 6, 1, 0, cy - 6, 14);
  cg.addColorStop(0, 'rgba(255,255,255,0.9)');
  cg.addColorStop(0.4, col(sp.accentColor, 0.6 + 0.2 * pulse));
  cg.addColorStop(1, col(sp.accentColor, 0));
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.arc(0, cy - 6, 14, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.4 * Math.sin(t * 2 + i)})`;
    ctx.beginPath();
    ctx.arc(-18 + i * 6, cy - 14 + Math.sin(i * 1.7) * 6, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function bez(p0: number[], p1: number[], p2: number[], p3: number[], u: number): [number, number] {
  const a = 1 - u;
  return [
    a * a * a * p0[0] + 3 * a * a * u * p1[0] + 3 * a * u * u * p2[0] + u * u * u * p3[0],
    a * a * a * p0[1] + 3 * a * a * u * p1[1] + 3 * a * u * u * p2[1] + u * u * u * p3[1]
  ];
}

function drawSeahorse(ctx: CanvasRenderingContext2D, sp: FishSpeciesData, t: number) {
  const sway = Math.sin(t * 1.6) * 2;
  const curl = Math.sin(t * 2) * 3;
  const segs: [number[], number[], number[], number[]][] = [
    [[14, -40 + sway], [4, -30], [16, -14], [4, 0]],
    [[4, 0], [-6, 12], [-3, 22], [-10, 28]],
    [[-10, 28], [-22, 34 + curl], [-30, 20 + curl], [-20, 15]]
  ];
  const samples: { x: number; y: number; r: number }[] = [];
  segs.forEach((s, si) => {
    for (let i = 0; i < 16; i++) {
      const u = i / 16;
      const [x, y] = bez(s[0], s[1], s[2], s[3], u);
      const g = (si + u) / 3;
      const r = g < 0.2 ? 5 + g * 8 : g < 0.45 ? 9.5 : 9.5 - (g - 0.45) * 17;
      samples.push({ x, y, r: Math.max(1.6, r) });
    }
  });
  // dorsal fin flutter
  ctx.fillStyle = col(sp.accentColor, 0.55);
  ctx.beginPath();
  ctx.moveTo(-2, -12);
  for (let i = 0; i < 6; i++) {
    ctx.lineTo(-8 - Math.sin(t * 12 - i) * 2.5, -10 + i * 3);
    ctx.lineTo(-3, -9 + i * 3 + 1.5);
  }
  ctx.fill();
  // flame crest
  for (let k = 0; k < 4; k++) {
    ctx.fillStyle = col(k % 2 ? sp.accentColor : sp.primaryColor, 0.9);
    ctx.beginPath();
    ctx.moveTo(8 - k * 3, -44 - k * 0.5);
    ctx.quadraticCurveTo(2 - k * 5, -58 - k * 2 + Math.sin(t * 6 + k) * 3, -4 - k * 4, -52 - k * 2 + Math.sin(t * 5 + k) * 3);
    ctx.quadraticCurveTo(6 - k * 3, -49, 12 - k * 3, -42);
    ctx.fill();
  }
  // body
  samples.forEach((s, i) => {
    const g = ctx.createRadialGradient(s.x - s.r * 0.3, s.y - s.r * 0.3, 1, s.x, s.y, s.r);
    g.addColorStop(0, rgba(shade(sp.primaryColor, 0.3), 1));
    g.addColorStop(0.6, col(sp.primaryColor, 1));
    g.addColorStop(1, rgba(shade(sp.primaryColor, -0.35), 1));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
    if (i % 4 === 0 && i > 8) {
      ctx.strokeStyle = col(sp.accentColor, 0.8);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 0.92, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
  // belly plates
  ctx.fillStyle = col(sp.secondaryColor, 0.85);
  for (let i = 14; i < 30; i += 3) {
    const s = samples[i];
    ctx.beginPath();
    ctx.ellipse(s.x + s.r * 0.35, s.y, s.r * 0.35, s.r * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // snout
  const h = samples[0];
  ctx.fillStyle = col(sp.primaryColor, 1);
  ctx.beginPath();
  ctx.moveTo(h.x + 2, h.y - 3.5);
  ctx.lineTo(h.x + 22, h.y - 1.5);
  ctx.lineTo(h.x + 22, h.y + 2);
  ctx.lineTo(h.x + 2, h.y + 4.5);
  ctx.fill();
  // eye
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(h.x - 1, h.y - 2, 3.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath();
  ctx.arc(h.x - 0.4, h.y - 2, 2.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(h.x - 1.2, h.y - 3, 0.8, 0, Math.PI * 2);
  ctx.fill();
  // embers
  for (let i = 0; i < 6; i++) {
    const p = (t * 0.6 + i / 6) % 1;
    ctx.fillStyle = col(sp.accentColor, (1 - p) * 0.9);
    ctx.beginPath();
    ctx.arc(2 + Math.sin(i * 3 + t) * 10, -52 - p * 30, 1.8 * (1 - p), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawOctopus(ctx: CanvasRenderingContext2D, sp: FishSpeciesData, t: number) {
  const pulse = Math.sin(t * 2) * 1.5;
  // arms
  for (let i = 0; i < 8; i++) {
    const baseAng = Math.PI * 0.5 + (i - 3.5) * 0.36;
    const bx = Math.cos(baseAng) * 14 - 2;
    const by = 6 + Math.sin(baseAng) * 6;
    let px = bx;
    let py = by;
    for (let k = 1; k <= 14; k++) {
      const w = Math.sin(t * 3 - k * 0.55 + i * 0.9) * (1.2 + k * 0.3);
      const nx = px + Math.cos(baseAng) * 2.8 - 1.1 * (k > 6 ? 1 : 0.3) + w * 0.5;
      const ny = py + 4.2 + Math.sin(baseAng) * 0.5;
      ctx.strokeStyle = k % 2 ? col(sp.primaryColor, 1) : rgba(shade(sp.primaryColor, -0.1), 1);
      ctx.lineWidth = Math.max(1.2, 7 * (1 - k / 15));
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      if (k % 2 === 0 && k < 11) {
        ctx.fillStyle = col(sp.secondaryColor, 0.85);
        ctx.beginPath();
        ctx.arc(nx + 1, ny, Math.max(0.8, 1.8 * (1 - k / 15)), 0, Math.PI * 2);
        ctx.fill();
      }
      px = nx;
      py = ny;
    }
  }
  // mantle
  const g = ctx.createRadialGradient(-2, -22 + pulse, 3, 0, -10, 34);
  g.addColorStop(0, rgba(shade(sp.primaryColor, 0.25), 1));
  g.addColorStop(0.65, col(sp.primaryColor, 1));
  g.addColorStop(1, rgba(shade(sp.primaryColor, -0.4), 1));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(2, -14 + pulse * 0.5, 23 + pulse * 0.4, 23, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(2, -14 + pulse * 0.5, 23 + pulse * 0.4, 23, 0.15, 0, Math.PI * 2);
  ctx.clip();
  for (let i = 0; i < 4; i++) {
    const cx = Math.sin(t * 0.6 + i * 1.6) * 14;
    const cy = -14 + Math.cos(t * 0.8 + i) * 10;
    const rg = ctx.createRadialGradient(cx, cy, 1, cx, cy, 18);
    rg.addColorStop(0, col(i % 2 ? sp.accentColor : sp.secondaryColor, 0.55));
    rg.addColorStop(1, col(sp.accentColor, 0));
    ctx.fillStyle = rg;
    ctx.fillRect(-30, -45, 60, 60);
  }
  for (let i = 0; i < 20; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.5 * Math.abs(Math.sin(t * 2 + i))})`;
    ctx.beginPath();
    ctx.arc(-16 + ((i * 11.3) % 34), -34 + ((i * 7.7) % 30), 1.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = rgba(shade(sp.primaryColor, -0.55), 0.7);
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.ellipse(2, -14 + pulse * 0.5, 23 + pulse * 0.4, 23, 0.15, 0, Math.PI * 2);
  ctx.stroke();
  // eyes
  [[10, -4], [-6, -3]].forEach(([x, y], i) => {
    ctx.fillStyle = '#fef9c3';
    ctx.beginPath();
    ctx.ellipse(x, y, 5.4 - i, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(x - 3, y - 0.8, 6, 1.9);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x - 1.6, y - 2.4, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = rgba(shade(sp.primaryColor, -0.55), 0.8);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x, y, 5.4 - i, 6, 0, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function drawNautilus(ctx: CanvasRenderingContext2D, sp: FishSpeciesData, t: number) {
  const bob = Math.sin(t * 1.8) * 1.5;
  // tentacles
  for (let i = 0; i < 14; i++) {
    ctx.strokeStyle = col(i % 2 ? sp.secondaryColor : sp.accentColor, 0.9);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(26, 4 + (i - 7) * 1.1);
    for (let k = 1; k <= 9; k++) {
      ctx.lineTo(26 + k * 3.2, 4 + (i - 7) * 1.4 + k * 0.8 + Math.sin(t * 4 - k * 0.7 + i) * 2.2);
    }
    ctx.stroke();
  }
  // hood
  ctx.fillStyle = rgba(shade(sp.primaryColor, -0.3), 1);
  ctx.beginPath();
  ctx.ellipse(24, 2, 13, 15, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = col(sp.accentColor, 0.7);
  ctx.beginPath();
  ctx.ellipse(28, -5, 6, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // shell
  ctx.save();
  ctx.translate(-8, -2 + bob);
  ctx.rotate(-0.12);
  const R = 32;
  const sg = ctx.createRadialGradient(-8, -10, 4, 0, 0, R);
  sg.addColorStop(0, rgba(shade(sp.secondaryColor, 0.25), 1));
  sg.addColorStop(0.55, col(sp.secondaryColor, 1));
  sg.addColorStop(1, col(sp.primaryColor, 1));
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.moveTo(18, -20);
  ctx.bezierCurveTo(10, -R - 2, -R - 2, -R * 0.9, -R, 0);
  ctx.bezierCurveTo(-R, R * 0.9, 8, R + 2, 18, 22);
  ctx.bezierCurveTo(24, 6, 24, -8, 18, -20);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.clip();
  // flame stripes
  ctx.strokeStyle = col(sp.primaryColor, 0.65);
  ctx.lineWidth = 3;
  for (let i = 0; i < 12; i++) {
    const a = -Math.PI * 0.45 + (i * Math.PI * 1.55) / 11;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 6, Math.sin(a) * 6);
    ctx.quadraticCurveTo(Math.cos(a + 0.3) * 20, Math.sin(a + 0.3) * 20, Math.cos(a + 0.1) * (R + 6), Math.sin(a + 0.1) * (R + 6));
    ctx.stroke();
  }
  // spiral
  ctx.strokeStyle = rgba(shade(sp.primaryColor, -0.5), 0.9);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let a = 0; a < Math.PI * 4.6; a += 0.12) {
    const r = 1.5 + a * 2.1;
    const x = Math.cos(a) * r * 0.9 - 2;
    const y = Math.sin(a) * r * 0.9;
    if (a === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = rgba(shade(sp.primaryColor, -0.55), 0.8);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(18, -20);
  ctx.bezierCurveTo(10, -R - 2, -R - 2, -R * 0.9, -R, 0);
  ctx.bezierCurveTo(-R, R * 0.9, 8, R + 2, 18, 22);
  ctx.stroke();
  ctx.restore();
  // eyes
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath();
  ctx.arc(30, -2, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(29, -3.2, 1.1, 0, Math.PI * 2);
  ctx.fill();
  // orbiting time stars
  for (let i = 0; i < 5; i++) {
    const a = t * 0.9 + (i * Math.PI * 2) / 5;
    ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(t * 3 + i)})`;
    drawStar(ctx, -8 + Math.cos(a) * 50, -2 + Math.sin(a) * 36, 3);
  }
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */
export function renderFishIllustration(
  ctx: CanvasRenderingContext2D,
  species: FishSpeciesData,
  cx: number,
  cy: number,
  scale: number,
  hueShiftDeg: number = 0,
  timeSec: number = 0,
  facingRight: boolean = true
) {
  ctx.save();
  ctx.translate(cx, cy);
  if (!facingRight) ctx.scale(-1, 1);
  ctx.scale(scale, scale);
  if (hueShiftDeg !== 0) ctx.filter = `hue-rotate(${hueShiftDeg}deg)`;

  const rarity = species.rarity;
  if (rarity === 'Epic' || rarity === 'Legendary' || rarity === 'Secret') {
    const aura = RARITY_CONFIG[rarity].glowColor;
    const pulse = 0.75 + 0.25 * Math.sin(timeSec * 2.2);
    const ag = ctx.createRadialGradient(0, 0, 8, 0, 0, 72);
    ag.addColorStop(0, `${aura}${rarity === 'Epic' ? '33' : '55'}`);
    ag.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = pulse;
    ctx.fillStyle = ag;
    ctx.beginPath();
    ctx.arc(0, 0, 72, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  const shape = species.bodyShape;
  switch (shape) {
    case 'mantaray':
      drawManta(ctx, species, timeSec);
      break;
    case 'oarfish':
      drawRibbon(ctx, species, timeSec, false);
      break;
    case 'leviathan':
      drawRibbon(ctx, species, timeSec, true);
      break;
    case 'shrimp':
      drawShrimp(ctx, species, timeSec);
      break;
    case 'squid':
      drawSquid(ctx, species, timeSec);
      break;
    case 'jellyfish':
      drawJelly(ctx, species, timeSec);
      break;
    case 'seahorse':
      drawSeahorse(ctx, species, timeSec);
      break;
    case 'octopus':
      drawOctopus(ctx, species, timeSec);
      break;
    case 'nautilus':
      drawNautilus(ctx, species, timeSec);
      break;
    default:
      drawFishRig(ctx, species, RIGS[shape] || RIGS.mackerel!, timeSec);
  }

  if (rarity === 'Legendary' || rarity === 'Secret') {
    ctx.fillStyle = rarity === 'Secret' ? '#fecdd3' : '#fde68a';
    for (let i = 0; i < 6; i++) {
      const a = timeSec * 0.8 + (i * Math.PI * 2) / 6;
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(timeSec * 3 + i));
      ctx.globalAlpha = tw;
      drawStar(ctx, Math.cos(a) * 56, Math.sin(a) * 32, 2.6 + tw * 1.6);
    }
    ctx.globalAlpha = 1;
  }

  // 2D Cartoon/Anime Floating Water Bubbles near mouth
  for (let b = 0; b < 3; b++) {
    const phase = (timeSec * 0.7 + b * 0.33) % 1;
    const bx = 46 + b * 6 + Math.sin(timeSec * 3 + b * 2) * 3;
    const by = -4 - phase * 24;
    const br = (2.8 - b * 0.5) * (1 - phase * 0.3);
    ctx.globalAlpha = (1 - phase) * 0.75;
    ctx.fillStyle = 'rgba(224, 242, 254, 0.35)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(bx - br * 0.32, by - br * 0.32, br * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.restore();
}
