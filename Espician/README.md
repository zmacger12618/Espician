# Espician - Esports MOBA Management Simulator (2026 Web Edition)

เกมจำลองการบริหารและคุมทีมอีสปอร์ต MOBA สไตล์ Football Manager ผสม LoL/RoV บนเว็บเบราว์เซอร์ พัฒนาด้วยเทคโนโลยีเว็บมาตรฐานปี 2026

---

## 🚀 วิธีเปิดเล่นเดโม (Quick Start)

เปิด Terminal ในโฟลเดอร์นี้ แล้วรันคำสั่ง:

```bash
npm run dev
```

จากนั้นเปิดเบราว์เซอร์ไปที่: `http://localhost:3000`

---

## 🏛️ สถาปัตยกรรมโครงสร้างโปรเจกต์ (2026 Modern Architecture)

```text
Espician/
├── src/
│   ├── types/                     # TypeScript Domain Models & Value Objects
│   │   └── index.ts               # PlayerData, DNA, Stats, Champion, Team, Match
│   ├── core/                      # Pure Business Logic (Framework-Agnostic)
│   │   ├── data/                  # ฐานข้อมูลตัวละครและทีมนักแข่งเริ่มต้น
│   │   └── calculators/           # คำนวณสูตรฝึกซ้อม (DNA/Caps) และการต่อสู้ (Combat/Crit)
│   ├── simulation/                # Decoupled Match Engine
│   │   ├── mobaMapData.ts         # พิกัดแผนที่ 3 เลน ป้อม ป่า และเน็กซัส
│   │   └── MatchEngine.ts         # Tick-based 5v5 MOBA Simulation & Combat Loop
│   ├── store/                     # Reactive State Management (Zustand)
│   │   └── useGameStore.ts        # Roster, Budget, Training, Day/Season, Tactic
│   ├── components/                # Modular UI Components (Tailwind CSS)
│   │   ├── layout/                # Header (สถานะทีม/การเงิน) & Navigation
│   │   ├── match/                 # MatchArenaView & MiniMapCanvas (2D Live Simulation)
│   │   ├── roster/                # RosterView & Player Profile Analysis
│   │   ├── training/              # TrainingView (ห้องฝึกซ้อม 4 คอร์ส)
│   │   └── tactics/               # TacticsView (จัดผังตัวจริงและแท็กติกการเล่น)
│   ├── App.tsx                    # Main App Controller
│   ├── main.tsx                   # React Root
│   └── index.css                  # Esports Dark Theme Styles
├── _unity_archive/                # สำรองไฟล์เดิมของ Unity (ปลอดภัย ไม่สูญหาย)
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🎮 ฟีเจอร์หลักในเดโม

1. **2D Live MOBA Arena:**
   - มินิแมพจำลองการต่อสู้ 5v5 แบบ Real-time บน 3 เลน (Top, Mid, Bot)
   - ป้อมปราการ (Towers) และป้อมใหญ่ (Nexus)
   - ปรับความเร็วการจำลองได้ 1x, 2x, 5x หรือข้ามไปจนจบแมตช์
   - Combat Log รายงานคิลและเหตุการณ์ในสนามสดๆ
2. **Genetics & DNA System:**
   - นักกีฬามีพรสวรรค์ติดตัว (LearningSpeed, Max Mechanics Cap, Max Awareness Cap, Ego)
   - สเตตัสที่ฝึกฝนได้จะไม่สามารถทะลุเพดานพันธุกรรมได้
3. **Training Facility:**
   - 4 คอร์สการฝึก: Mechanics, Macro & Map Awareness, Team Synergy, Professionalism
   - มีระบบจำลองพลังงาน (Energy) และการใช้งบประมาณสโมสร
4. **Tactics & Lineup:**
   - เลือกจัดตัวจริง 5 ตำแหน่ง (Top, Jungle, Mid, ADC, Support)
   - เลือกแผนการเล่น: Aggressive, Balanced, LateGameScaling, SplitPush
