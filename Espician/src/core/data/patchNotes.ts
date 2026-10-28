import { MobaPatchNotes } from '../../types';

export const CURRENT_PATCH_NOTES: MobaPatchNotes = {
  version: '14.8.2 (Esports Meta)',
  title: 'Season of the Shadow & Frontline Engage',
  releaseDate: '22 ตุลาคม 2026',
  metaDescription:
    'ในแพตช์ปัจจุบัน เมต้าเน้นความคล่องตัวของมือสังหาร (Assassin) และความหนาของแทงค์เปิดไฟต์ (Frontline Engage) แชมเปี้ยนที่มีสกิล CC แข็งแกร่งได้รับความนิยมสูงสุดในทัวร์นาเมนต์ระดับโลก',
  buffedChampions: ['c_fa_shadow', 'c_pyke_ripper', 'c_kaisa_voidadc', 'c_volk_shredder'],
  nerfedChampions: ['c_lux_light', 'c_anivia_cryo', 'c_ashe_frost']
};

export function simulateNewPatch(current: MobaPatchNotes): MobaPatchNotes {
  const versions = ['14.9.1', '14.9.2', '15.0.0 (Pre-Season)'];
  const nextVer = versions[Math.floor(Math.random() * versions.length)];
  return {
    version: nextVer,
    title: 'The Balance of Magic & Marksmen Shift',
    releaseDate: 'อัปเดตเซิร์ฟเวอร์เรียบร้อย',
    metaDescription: 'ปรับบาลานซ์ดาเมจเลทเกม เสริมเกราะแครี่ระยะไกล และลดคูลดาวน์เมจควบคุมพื้นที่',
    buffedChampions: ['c_valkyrie_swift', 'c_ignis_prime', 'c_ahri_fox', 'c_jinx_chaos'],
    nerfedChampions: ['c_fa_shadow', 'c_lee_monk']
  };
}
