import { CoachingStaff, GamingGear } from '../../types';

export const GEAR_SHOP_CATALOG: GamingGear[] = [
  {
    id: 'gear_mouse_1',
    name: 'Viper Ultralight 8K',
    slot: 'mouse',
    tier: 3,
    upgradeLevel: 0,
    bonusStat: 'mechanics',
    bonusValue: 6,
    specialAffix: '+10% Critical Strike Chance',
    price: 1800,
    icon: '🖱️'
  },
  {
    id: 'gear_kb_1',
    name: 'Apex Hall-Effect Rapid Trigger',
    slot: 'keyboard',
    tier: 3,
    upgradeLevel: 0,
    bonusStat: 'stamina',
    bonusValue: 5,
    specialAffix: 'ลดการใช้พลังงานในการซ้อม 15%',
    price: 1600,
    icon: '⌨️'
  },
  {
    id: 'gear_monitor_1',
    name: 'OLED 360Hz Esports Pro',
    slot: 'monitor',
    tier: 4,
    upgradeLevel: 0,
    bonusStat: 'mapAwareness',
    bonusValue: 8,
    specialAffix: 'เพิ่มโอกาสหลบการโจมตี (Dodge) +12%',
    price: 2500,
    icon: '🖥️'
  },
  {
    id: 'gear_headset_1',
    name: 'Aero Spatial Pro Comm',
    slot: 'headset',
    tier: 3,
    upgradeLevel: 0,
    bonusStat: 'teamwork',
    bonusValue: 7,
    specialAffix: 'เพิ่มความแม่นยำในการสั่งการไฟต์',
    price: 1500,
    icon: '🎧'
  }
];

export const COACHING_STAFF_CATALOG: CoachingStaff[] = [
  {
    id: 'staff_coach_teddy',
    name: 'Teddy "The Strategist"',
    role: 'HeadCoach',
    salary: 800,
    level: 3,
    perkDescription: 'เพิ่มอัตราการสั่งแผนแท็กติก และเพิ่มดาเมจไฟต์ 5v5 +10%',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Teddy'
  },
  {
    id: 'staff_mech_sensei',
    name: 'Master Jin',
    role: 'DataAnalyst',
    salary: 600,
    level: 2,
    perkDescription: 'เพิ่ม EXP จากการฝึกซ้อม Mechanics และ Awareness +25%',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=MasterJin'
  },
  {
    id: 'staff_psych_mira',
    name: 'Dr. Mira Ph.D.',
    role: 'Psychologist',
    salary: 700,
    level: 3,
    perkDescription: 'รักษาดีบัฟ "ขี้เกียจ" และ "หัวร้อน" อัตโนมัติเมื่อกดพักทีม',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=DrMira'
  },
  {
    id: 'staff_physio_dan',
    name: 'Doc Dan',
    role: 'Physio',
    salary: 550,
    level: 2,
    perkDescription: 'ลดโอกาสเกิดอาการข้อมืออักเสบ 50% และฟื้นฟู Energy +10%',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=DocDan'
  }
];
