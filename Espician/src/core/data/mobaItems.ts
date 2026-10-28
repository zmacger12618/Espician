import { MobaItem } from '../../types';

export const MOBA_ITEMS_DB: Record<string, MobaItem> = {
  // Attack Items
  item_infinity_edge: {
    id: 'item_infinity_edge',
    name: 'ดาบผ่าพิภพ (Infinity Edge)',
    price: 3400,
    category: 'Attack',
    statsDescription: '+70 Attack Damage, +25% Critical Strike Damage',
    icon: '⚔️'
  },
  item_bloodthirster: {
    id: 'item_bloodthirster',
    name: 'ดาบกระหายเลือด (Bloodthirster)',
    price: 3200,
    category: 'Attack',
    statsDescription: '+55 Attack Damage, +18% Life Steal, Overheal Shield',
    icon: '🩸'
  },
  item_last_whisper: {
    id: 'item_last_whisper',
    name: 'เกาทัณฑ์เจาะเกราะ (Last Whisper)',
    price: 3000,
    category: 'Attack',
    statsDescription: '+45 Attack Damage, +35% Armor Penetration',
    icon: '🏹'
  },

  // Magic Items
  item_deathcap: {
    id: 'item_deathcap',
    name: 'หมวกมหาเวท (Rabadon Deathcap)',
    price: 3600,
    category: 'Magic',
    statsDescription: '+120 Ability Power, เพิ่มพลังเวททั้งหมด +35%',
    icon: '🧙‍♂️'
  },
  item_zhonya: {
    id: 'item_zhonya',
    name: 'นาฬิกาทองคำพิทักษ์ (Zhonya Hourglass)',
    price: 3000,
    category: 'Magic',
    statsDescription: '+80 Ability Power, +45 Armor, กดใช้เป็นอมตะ 2.5 วินาที',
    icon: '⏳'
  },
  item_luden: {
    id: 'item_luden',
    name: 'คทาสายฟ้าสะท้อน (Luden Tempest)',
    price: 3100,
    category: 'Magic',
    statsDescription: '+85 Ability Power, สกิลระเบิดดาเมจกระจายรอบข้าง',
    icon: '⚡'
  },

  // Defense Items
  item_sunfire: {
    id: 'item_sunfire',
    name: 'เกราะเพลิงสุริยัน (Sunfire Aegis)',
    price: 2800,
    category: 'Defense',
    statsDescription: '+500 Health, +50 Armor, เผาไหม้ดาเมจศัตรูรอบตัว',
    icon: '🔥'
  },
  item_thornmail: {
    id: 'item_thornmail',
    name: 'เกราะหนามสะท้อนดาเมจ (Thornmail)',
    price: 2700,
    category: 'Defense',
    statsDescription: '+350 Health, +70 Armor, สะท้อนดาเมจและตัดการฮีล',
    icon: '🛡️'
  },
  item_guardian_angel: {
    id: 'item_guardian_angel',
    name: 'เทวทูตคืนชีพ (Guardian Angel)',
    price: 3200,
    category: 'Defense',
    statsDescription: '+45 Attack Damage, +40 Armor, ฟื้นคืนชีพเมื่อตายในสนาม',
    icon: '👼'
  },

  // Movement & Utility
  item_boots: {
    id: 'item_boots',
    name: 'รองเท้าเกราะเหล็ก (Plated Steelcaps)',
    price: 1100,
    category: 'Movement',
    statsDescription: '+45 Move Speed, ลดดาเมจจากการโจมตีปกติ 12%',
    icon: '👢'
  }
};
