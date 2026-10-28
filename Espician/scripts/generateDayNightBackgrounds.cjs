const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const BG_DIR = path.join(__dirname, '../public/assets/fishing/backgrounds');

const ISLANDS = [
  'island_emerald_haven',
  'island_coral_sanctuary',
  'island_volcanic_atoll',
  'island_aurora_fjord',
  'island_celestial_archipelago'
];

/**
 * Creates night version from a daytime background by applying
 * a deep midnight color transformation, moonlit specular highlights,
 * starry sky layer, and ambient night bloom.
 */
async function generateNightVersion(islandId) {
  const baseFile = path.join(BG_DIR, `${islandId}.jpg`);
  const outFile = path.join(BG_DIR, `${islandId}_night.jpg`);
  if (!fs.existsSync(baseFile)) return;

  const meta = await sharp(baseFile).metadata();
  const w = meta.width || 1376;
  const h = meta.height || 768;
  const horizon = Math.round(h * 0.52);

  // Night tint overlay SVG
  const nightSvg = `
  <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Night Sky Tint Gradient -->
      <linearGradient id="nightSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#040612" stop-opacity="0.82" />
        <stop offset="60%" stop-color="#0b132b" stop-opacity="0.65" />
        <stop offset="100%" stop-color="#1c2541" stop-opacity="0.45" />
      </linearGradient>

      <!-- Night Sea Tint Gradient -->
      <linearGradient id="nightSea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#070d1e" stop-opacity="0.4" />
        <stop offset="50%" stop-color="#050a16" stop-opacity="0.6" />
        <stop offset="100%" stop-color="#020409" stop-opacity="0.75" />
      </linearGradient>

      <!-- Moon Gradient -->
      <radialGradient id="moonGlow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stop-color="#fef08a" stop-opacity="0.9" />
        <stop offset="40%" stop-color="#bae6fd" stop-opacity="0.3" />
        <stop offset="100%" stop-color="#0b132b" stop-opacity="0" />
      </radialGradient>

      <!-- Moon Water Reflection -->
      <linearGradient id="moonRef" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fef9c3" stop-opacity="0.45" />
        <stop offset="60%" stop-color="#7dd3fc" stop-opacity="0.15" />
        <stop offset="100%" stop-color="#38bdf8" stop-opacity="0" />
      </linearGradient>
    </defs>

    <!-- Sky Night Tint -->
    <rect width="${w}" height="${horizon}" fill="url(#nightSky)" />

    <!-- Twinkling Night Stars -->
    ${Array.from({ length: 90 }, (_, i) => {
      const sx = (i * 137 + 53) % w;
      const sy = (i * 79 + 23) % (horizon - 25);
      const r = (i % 6 === 0) ? 2.0 : (i % 2 === 0) ? 1.3 : 0.8;
      const op = 0.4 + (i % 5) * 0.12;
      return `<circle cx="${sx}" cy="${sy}" r="${r}" fill="#ffffff" opacity="${op}" />`;
    }).join('\n')}

    <!-- Glowing Moon in Night Sky -->
    <circle cx="${w * 0.76}" cy="${horizon * 0.32}" r="64" fill="url(#moonGlow)" />
    <circle cx="${w * 0.76}" cy="${horizon * 0.32}" r="26" fill="#fef9c3" />
    <circle cx="${w * 0.76 - 7}" cy="${horizon * 0.32 - 4}" r="23" fill="#0c1733" opacity="0.88" />

    <!-- Sea Night Tint -->
    <rect y="${horizon}" width="${w}" height="${h - horizon}" fill="url(#nightSea)" />

    <!-- Moon Water Reflection Shimmer -->
    <polygon points="${w * 0.76 - 12},${horizon} ${w * 0.76 + 12},${horizon} ${w * 0.76 + 75},${h} ${w * 0.76 - 75},${h}" fill="url(#moonRef)" />
  </svg>
  `;

  // Apply cool dark color matrix, darken, and composite night elements
  await sharp(baseFile)
    .modulate({ brightness: 0.62, saturation: 0.85 })
    .composite([{ input: Buffer.from(nightSvg), blend: 'over' }])
    .jpeg({ quality: 90 })
    .toFile(outFile);

  console.log(`Generated night background: ${outFile}`);
}

/**
 * Creates day version by optimizing vibrancy, sunlit warmth, and contrast.
 */
async function generateDayVersion(islandId) {
  const baseFile = path.join(BG_DIR, `${islandId}.jpg`);
  const outFile = path.join(BG_DIR, `${islandId}_day.jpg`);
  if (!fs.existsSync(baseFile)) return;

  // Simply copy or enhance vibrancy for the day version
  await sharp(baseFile)
    .modulate({ brightness: 1.02, saturation: 1.05 })
    .jpeg({ quality: 92 })
    .toFile(outFile);

  console.log(`Generated day background: ${outFile}`);
}

async function main() {
  for (const id of ISLANDS) {
    await generateDayVersion(id);
    await generateNightVersion(id);
  }
  console.log('Successfully created all Day & Night painted island backgrounds!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
