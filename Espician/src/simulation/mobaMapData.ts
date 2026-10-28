import { TowerEntity } from '../types';

export interface MapWaypoint {
  x: number;
  y: number;
  name?: string;
}

export interface JungleCampNode {
  id: string;
  name: string;
  teamSide: 'blue' | 'red';
  x: number;
  y: number;
  buffType: 'blue_buff' | 'red_buff' | 'camp';
}

/**
 * โครงสร้างเส้นทางเดินเลนมาตรฐาน MOBA 5v5 (พิกัด 0..100)
 * Blue Nexus อยู่ซ้ายล่าง (12, 88) -> Red Nexus อยู่ขวาบน (88, 12)
 */
export const MOBA_LANES: Record<'top' | 'mid' | 'bot', MapWaypoint[]> = {
  top: [
    { x: 12, y: 88, name: 'Blue Nexus' },
    { x: 12, y: 64, name: 'Blue Top T2' },
    { x: 12, y: 38, name: 'Blue Top T1' },
    { x: 14, y: 14, name: 'Top Clash Zone' },
    { x: 38, y: 12, name: 'Red Top T1' },
    { x: 64, y: 12, name: 'Red Top T2' },
    { x: 88, y: 12, name: 'Red Nexus' }
  ],
  mid: [
    { x: 12, y: 88, name: 'Blue Nexus' },
    { x: 26, y: 74, name: 'Blue Mid T2' },
    { x: 38, y: 62, name: 'Blue Mid T1' },
    { x: 50, y: 50, name: 'Mid River Center' },
    { x: 62, y: 38, name: 'Red Mid T1' },
    { x: 74, y: 26, name: 'Red Mid T2' },
    { x: 88, y: 12, name: 'Red Nexus' }
  ],
  bot: [
    { x: 12, y: 88, name: 'Blue Nexus' },
    { x: 36, y: 88, name: 'Blue Bot T2' },
    { x: 62, y: 88, name: 'Blue Bot T1' },
    { x: 86, y: 86, name: 'Bot Clash Zone' },
    { x: 88, y: 62, name: 'Red Bot T1' },
    { x: 88, y: 36, name: 'Red Bot T2' },
    { x: 88, y: 12, name: 'Red Nexus' }
  ]
};

export const JUNGLE_CAMPS: JungleCampNode[] = [
  // Blue Side Jungle
  { id: 'jg_b_blue', name: 'Blue Sentinel', teamSide: 'blue', x: 26, y: 56, buffType: 'blue_buff' },
  { id: 'jg_b_gromp', name: 'Gromp', teamSide: 'blue', x: 19, y: 46, buffType: 'camp' },
  { id: 'jg_b_raptors', name: 'Raptors', teamSide: 'blue', x: 44, y: 68, buffType: 'camp' },
  { id: 'jg_b_red', name: 'Red Brambleback', teamSide: 'blue', x: 54, y: 78, buffType: 'red_buff' },
  // Red Side Jungle
  { id: 'jg_r_blue', name: 'Blue Sentinel', teamSide: 'red', x: 74, y: 44, buffType: 'blue_buff' },
  { id: 'jg_r_gromp', name: 'Gromp', teamSide: 'red', x: 81, y: 54, buffType: 'camp' },
  { id: 'jg_r_raptors', name: 'Raptors', teamSide: 'red', x: 56, y: 32, buffType: 'camp' },
  { id: 'jg_r_red', name: 'Red Brambleback', teamSide: 'red', x: 46, y: 22, buffType: 'red_buff' }
];

export const OBJECTIVE_PITS = {
  baron: { x: 34, y: 34, name: 'Baron Nashor', radius: 7 },
  dragon: { x: 66, y: 66, name: 'Ancient Dragon', radius: 7 }
};

export const INITIAL_TOWERS: TowerEntity[] = [
  // Blue Towers (เรียงลำดับ Tier 1 -> Tier 2 ในแต่ละเลน)
  { id: 't_b_top_1', team: 'blue', lane: 'top', tier: 1, x: 12, y: 38, health: 3200, maxHealth: 3200, isDestroyed: false },
  { id: 't_b_top_2', team: 'blue', lane: 'top', tier: 2, x: 12, y: 64, health: 3800, maxHealth: 3800, isDestroyed: false },
  { id: 't_b_mid_1', team: 'blue', lane: 'mid', tier: 1, x: 38, y: 62, health: 3200, maxHealth: 3200, isDestroyed: false },
  { id: 't_b_mid_2', team: 'blue', lane: 'mid', tier: 2, x: 26, y: 74, health: 3800, maxHealth: 3800, isDestroyed: false },
  { id: 't_b_bot_1', team: 'blue', lane: 'bot', tier: 1, x: 62, y: 88, health: 3200, maxHealth: 3200, isDestroyed: false },
  { id: 't_b_bot_2', team: 'blue', lane: 'bot', tier: 2, x: 36, y: 88, health: 3800, maxHealth: 3800, isDestroyed: false },

  // Red Towers (เรียงลำดับ Tier 1 -> Tier 2 ในแต่ละเลน)
  { id: 't_r_top_1', team: 'red', lane: 'top', tier: 1, x: 38, y: 12, health: 3200, maxHealth: 3200, isDestroyed: false },
  { id: 't_r_top_2', team: 'red', lane: 'top', tier: 2, x: 64, y: 12, health: 3800, maxHealth: 3800, isDestroyed: false },
  { id: 't_r_mid_1', team: 'red', lane: 'mid', tier: 1, x: 62, y: 38, health: 3200, maxHealth: 3200, isDestroyed: false },
  { id: 't_r_mid_2', team: 'red', lane: 'mid', tier: 2, x: 74, y: 26, health: 3800, maxHealth: 3800, isDestroyed: false },
  { id: 't_r_bot_1', team: 'red', lane: 'bot', tier: 1, x: 88, y: 62, health: 3200, maxHealth: 3200, isDestroyed: false },
  { id: 't_r_bot_2', team: 'red', lane: 'bot', tier: 2, x: 88, y: 36, health: 3800, maxHealth: 3800, isDestroyed: false }
];
