import { ActiveTab } from '../../store/useGameStore';
import rawGuideText from '../../../GAMEPLAY_GUIDE.txt?raw';

export interface ProductTourStep {
  stepIndex: number;
  title: string;
  shortHint: string;
  badge: string;
  targetTab: ActiveTab;
  targetSelector: string;
  requiredLevel: number;
  targetZoneName: string;
  summary: string;
  actionTip: string;
  proTip: string;
}

export interface AccountLevelUnlockInfo {
  level: number;
  rankTitle: string;
  expRequired: number;
  unlockedTabs: ActiveTab[];
  unlockedFeatureNames: string[];
  rewardDescription: string;
}

export const RAW_GAMEPLAY_GUIDE_TXT: string = rawGuideText;

export const ACCOUNT_LEVEL_ROADMAP: AccountLevelUnlockInfo[] = [
  {
    level: 1,
    rankTitle: 'Rookie Manager',
    expRequired: 0,
    unlockedTabs: ['match', 'roster'],
    unlockedFeatureNames: ['Match Day (สนามแข่งเรียลไทม์)', 'Roster (ขุมกำลัง & พรสวรรค์ DNA)'],
    rewardDescription: 'เริ่มต้นบริหารสโมสร ลงประเดิมสนามนัดแรกเพื่อรับสิทธิ์คัดเลือกนักแข่งชุดหลัก 5 คนเข้าทีม'
  },
  {
    level: 2,
    rankTitle: 'Tactical Coach',
    expRequired: 100,
    unlockedTabs: ['training', 'tactics'],
    unlockedFeatureNames: ['Training (ตารางฝึกซ้อม)', 'Tactics (แผนการเล่น & ดราฟต์)'],
    rewardDescription: 'เปิดระบบตารางฝึกซ้อมพัฒนาค่าพลัง และระบบวางแผนดราฟต์แชมเปี้ยนแก้ทางคู่แข่ง'
  },
  {
    level: 3,
    rankTitle: 'Esports Director',
    expRequired: 250,
    unlockedTabs: ['gear', 'wiki'],
    unlockedFeatureNames: ['Gear & Staff (อัปเกรดอุปกรณ์ +5 & โค้ช)', 'Meta & 40 Champs (ฐานข้อมูลแชมเปี้ยน)'],
    rewardDescription: 'เปิดระบบอัปเกรดเกมมิ่งเกียร์ระดับโปร, จ้างทีมงานโค้ช และวิเคราะห์แพตช์เมต้า'
  },
  {
    level: 4,
    rankTitle: 'Global Franchise Owner',
    expRequired: 450,
    unlockedTabs: ['market', 'online'],
    unlockedFeatureNames: ['Market (ตลาดซื้อขายนักแข่ง)', 'Online Lobby (แข่งขันผ่านระบบ LAN)'],
    rewardDescription: 'เปิดระบบตลาดซื้อขายนักแข่งระดับโลก ส่งแมวมองค้นหาดาวรุ่ง และดวลกับผู้จัดการทีมคนอื่น'
  }
];

export const TAB_REQUIRED_LEVEL: Record<ActiveTab, number> = {
  match: 1,
  roster: 1,
  training: 2,
  tactics: 2,
  gear: 3,
  wiki: 3,
  market: 4,
  online: 4
};

export function getRequiredExpForNextLevel(level: number): number {
  if (level <= 1) return 100;
  if (level === 2) return 150;
  if (level === 3) return 200;
  return 250 + (level - 4) * 100;
}

export const PRODUCT_TOUR_STEPS: ProductTourStep[] = [
  {
    stepIndex: 0,
    title: '5v5 Live Simulator',
    shortHint: 'ชมการเคลื่อนที่และปะทะแบบเรียลไทม์ คลิกฮีโร่เพื่อดูสเตตัส',
    badge: '1 / 8',
    targetTab: 'match',
    targetSelector: '[data-tour-id="tour-simulator-canvas"]',
    requiredLevel: 1,
    targetZoneName: '2D Real-Time Simulator',
    summary: 'จำลองการเดินเลน ปะทะ และชิงมังกร/บารอนแบบเรียลไทม์ตามค่าพลัง',
    actionTip: 'คลิกที่ฮีโร่เพื่อดู HP, KDA และไอเทมปัจจุบัน',
    proTip: 'การตัดสินใจของนักแข่งขึ้นอยู่กับ Mechanics และ Macro'
  },
  {
    stepIndex: 1,
    title: 'คำสั่งแผนข้างสนาม',
    shortHint: 'สั่งทีมบุก คุมเลน หรือชิงมังกรแบบสดๆ',
    badge: '2 / 8',
    targetTab: 'match',
    targetSelector: '[data-tour-id="tour-tactical-calls"]',
    requiredLevel: 1,
    targetZoneName: 'Tactical Command Bar',
    summary: 'สั่งปรับเปลี่ยนรูปแบบการเดินเกมของลูกทีมได้ตลอดแมตช์',
    actionTip: 'กด บุกทะลวง เมื่อได้เปรียบ หรือ ถอยตั้งรับ เมื่อเลือดน้อย',
    proTip: 'รวมพลตีมังกร/บารอน เพื่อชิงบัฟปิดเกม'
  },
  {
    stepIndex: 2,
    title: 'ควบคุมความเร็วแมตช์',
    shortHint: 'ปรับสปีด 1x / 2x / 4x หรือสรุปผลจบเกมทันที',
    badge: '3 / 8',
    targetTab: 'match',
    targetSelector: '[data-tour-id="tour-match-controls"]',
    requiredLevel: 1,
    targetZoneName: 'Match Controls',
    summary: 'ควบคุมสปีดการรับชม หรือกดสรุปผลทันทีเพื่อรับรางวัล',
    actionTip: 'กด 4x หรือ สรุปผล เพื่อจบแมตช์อย่างรวดเร็ว',
    proTip: 'จบแมตช์แรกจะได้รับสิทธิ์สุ่ม Starter Pack'
  },
  {
    stepIndex: 3,
    title: 'กระดานสกอร์สด',
    shortHint: 'เช็คสกอร์ Kills, อ็อบเจกต์ และ Gold Lead',
    badge: '4 / 8',
    targetTab: 'match',
    targetSelector: '[data-tour-id="tour-scoreboard"]',
    requiredLevel: 1,
    targetZoneName: 'Broadcast Scoreboard',
    summary: 'แสดงสถานะการเงิน Kills และอ็อบเจกต์สำคัญในแมตช์',
    actionTip: 'ตรวจ Gold Lead เพื่อประเมินจังหวะทีมไฟต์',
    proTip: 'มังกรเพิ่มสเตตัสถาวร บารอนช่วยดันป้อม'
  },
  {
    stepIndex: 4,
    title: 'ระดับผู้จัดการทีม',
    shortHint: 'คลิกดูสิทธิ์การปลดล็อกฟีเจอร์ในแต่ละเลเวล',
    badge: '5 / 8',
    targetTab: 'match',
    targetSelector: '[data-tour-id="tour-account-level"]',
    requiredLevel: 1,
    targetZoneName: 'Manager Level',
    summary: 'แข่ง ซ้อม และอัปเกรดเพื่อรับ EXP เลื่อนระดับสโมสร',
    actionTip: 'คลิกแถบ LV เพื่อดูเงื่อนไขปลดล็อกระบบ',
    proTip: 'ชนะนัดแรกจะปลดล็อกระบบฝึกซ้อมทันที'
  },
  {
    stepIndex: 5,
    title: 'งบประมาณ & ชื่อเสียง',
    shortHint: 'ตรวจเช็ควัน เงินทุน ($) และชื่อเสียงสโมสร (%)',
    badge: '6 / 8',
    targetTab: 'match',
    targetSelector: '[data-tour-id="tour-resources"]',
    requiredLevel: 1,
    targetZoneName: 'Club Resources',
    summary: 'เงินใช้ซื้อของและจ่ายค่าเหนื่อย ชื่อเสียงดึงดูดสปอนเซอร์',
    actionTip: 'บริหารงบให้พอดีกับค่าเหนื่อยรายสัปดาห์',
    proTip: 'ชื่อเสียงสูงช่วยดึงดูดนักแข่งระดับท็อป'
  },
  {
    stepIndex: 6,
    title: 'พักทีม (Rest Team)',
    shortHint: 'ฟื้นฟูความเหนื่อยล้าและข้ามสู่วันถัดไป',
    badge: '7 / 8',
    targetTab: 'match',
    targetSelector: '[data-tour-id="tour-rest-btn"]',
    requiredLevel: 1,
    targetZoneName: 'Rest Button',
    summary: 'ลดความล้าและฟื้นฟูกำลังใจของนักแข่งทุกคน',
    actionTip: 'กดพักทีมเมื่อหลอดความล้าเริ่มสูง',
    proTip: 'อย่าปล่อยให้ความล้าเกิน 70% ป้องกันบาดเจ็บ'
  },
  {
    stepIndex: 7,
    title: 'เมนูบริหารสโมสร',
    shortHint: 'เข้าสู่ Roster, Training, Tactics, Gear และ Market',
    badge: '8 / 8',
    targetTab: 'match',
    targetSelector: '[data-tour-id="tour-nav-tabs"]',
    requiredLevel: 1,
    targetZoneName: 'Club Menu',
    summary: 'ศูนย์รวมระบบบริหารสโมสรอีสปอร์ตครบวงจร',
    actionTip: 'เริ่มลุยแมตช์หรือสลับไปจัดตัวผู้เล่นได้เลย',
    proTip: 'กดปุ่ม คู่มือ ด้านบนเพื่อเปิดคำแนะนำอีกครั้งได้ตลอด'
  }
];
