---
name: anime-2d-gamedev
description: >-
  2026 Japanese 2D Anime Cel-Shaded Rendering, Skeletal Rig Animation (GSAP + Canvas/WebGPU),
  Procedural Web Audio Synthesizer (BGM + SFX), and Bilingual (TH/EN) Game UI Architecture.
---

# Anime 2D Game Development Skill

## 1. Visual Aesthetic: Japanese 2D Anime Cel-Shading
- **Lineart (Ink Outlines):** Use dark warm ink outlines (`#1e1410`, `#1a1625`) with variable perceived thickness to separate silhouettes from backgrounds clearly.
- **Cel-Shaded Coloring:** Apply hard-edged or crisp 2-stop/3-stop cel shading (Base tone, Shadow tone, Rim-light/Specular highlight) alongside soft anime atmospheric gradients.
- **Anime Character Proportions:**
  - Expressive 3/4 view face with multi-layered jewel iris, bold upper lash line, double-eyelid crease, dual white specular highlights, and soft cheek blush.
  - Hair constructed in layered locks (back hair, side hime-locks, front bangs, reactive ahoge) with horizontal zig-zag angel-ring sheen bands.
- **Cartoon/Anime Creature Art:**
  - Bold outer ink contour, glossy expressive eyes with big highlight dots, cel-shaded belly lighting, and dynamic silhouette deformation.

## 2. Procedural Web Audio Engine
- Use `AudioContext` synthesis (oscillators, gain envelopes, biquad filters, noise buffers) for zero-latency BGM and SFX without external asset 404 risks.
- Provide independent gain nodes: `masterGain`, `bgmGain`, `sfxGain`, persisted to `localStorage`.

## 3. Bilingual Localization (TH / EN)
- All user-facing strings, item names, descriptions, and notifications must resolve through a reactive language state (`'th' | 'en'`).
