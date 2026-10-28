---
name: cygames-pixiv-character-rig
description: Cygames (Princess Connect! Re:Dive, Uma Musume Pretty Derby, Granblue Fantasy) & Pixiv 2D Anime Character Illustration + Live2D-style Canvas Mesh Deformation Rigging pipeline.
---

# Cygames & Pixiv 2D Anime Character Rigging Skill

## 1. Visual Art Direction (Princess Connect / Uma Musume / Granblue Fantasy)
- **Lineart & Coloring:** Ultra-clean, fine dark-sepia/wine-brown anime lineart (`#2d1822`) with soft color-traced inner lines, lush multi-layered cel-shading + soft airbrushed gradients on skin, hair, and fabric folds.
- **Character Design:** Expressive Pixiv/Cygames proportions, large jewel-faceted sapphire eyes with upper eyelash wings, warm peach blush, detailed multi-strand golden-blonde hair with double angel-ring specular bands, and ornate costume trim (lace, ribbons, sailor collar, yukata floral patterns, starlight filigree).
- **Asset Pipeline:** Uses AI-generated Cygames/Pixiv character illustrations (`public/assets/fishing/char_<costumeId>.png`) processed through real-time chroma-key alpha extraction (`OffscreenCanvas` / pixel distance feathering) combined with Live2D-style horizontal strip/mesh deformation.

## 2. Live2D-Style 2D Mesh & Strip Deformation on Canvas
- **Breathing & Posture Sway:** Slice the character sprite into horizontal mesh bands (`N = 28` slices) to apply smooth sinusoidal chest breathing, head/ahoge sway, hair wind wave, and dangling leg swing at 60–120 FPS.
- **Eyelid Blink & Emotion Overlay:** Overlay timed anime blink expressions and Cygames-style floating emotion emblems (`♪`, `!!`, `✦`) above the character's head.
- **Seamless Rod Integration:** Anchor the fishing rod grip directly to the character's hand coordinates in the rig so casting, jerking, and reeling bend physics synchronize with the character's upper-body motion.
