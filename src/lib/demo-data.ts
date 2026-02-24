import { Profile, MeasurementItem, MeasurementSession, MeasurementResult } from './types';

// Demo profiles
export const demoProfiles: Profile[] = [
  { id: 'admin-1', role: 'admin', name: '増田 嵩大', email: 'admin@regain.com' },
  { id: 'staff-1', role: 'staff', name: '田中 コーチ', email: 'staff@regain.com' },
  { id: 'player-1', role: 'player', name: '山田 太郎', email: 'player1@regain.com' },
  { id: 'player-2', role: 'player', name: '佐藤 次郎', email: 'player2@regain.com' },
  { id: 'player-3', role: 'player', name: '鈴木 三郎', email: 'player3@regain.com' },
  { id: 'player-4', role: 'player', name: '高橋 四郎', email: 'player4@regain.com' },
  { id: 'player-5', role: 'player', name: '伊藤 五郎', email: 'player5@regain.com' },
  { id: 'player-6', role: 'player', name: '渡辺 六郎', email: 'player6@regain.com' },
];

// Demo measurement items
export const demoMeasurementItems: MeasurementItem[] = [
  { id: 'item-1', name: '垂直跳び', unit: 'cm', is_inverted: false, is_active: true, sort_order: 1 },
  { id: 'item-2', name: 'スプリント 20m走', unit: '秒', is_inverted: true, is_active: true, sort_order: 2 },
  { id: 'item-3', name: 'ドロップジャンプ', unit: 'RSI', is_inverted: false, is_active: true, sort_order: 3 },
  { id: 'item-4', name: 'アジリティテスト', unit: '秒', is_inverted: true, is_active: true, sort_order: 4 },
];

// Demo sessions (monthly measurements)
export const demoSessions: MeasurementSession[] = [
  { id: 'session-1', date: '2025-09-15', recorded_by: 'staff-1' },
  { id: 'session-2', date: '2025-10-13', recorded_by: 'staff-1' },
  { id: 'session-3', date: '2025-11-10', recorded_by: 'staff-1' },
  { id: 'session-4', date: '2025-12-08', recorded_by: 'admin-1' },
  { id: 'session-5', date: '2026-01-12', recorded_by: 'staff-1' },
  { id: 'session-6', date: '2026-02-09', recorded_by: 'admin-1' },
];

// Generate demo results for all players across all sessions
function generateDemoResults(): MeasurementResult[] {
  const results: MeasurementResult[] = [];
  const playerBases: Record<string, Record<string, { base: number; trend: number }>> = {
    'player-1': { 'item-1': { base: 55, trend: 1.2 }, 'item-2': { base: 3.2, trend: -0.03 }, 'item-3': { base: 1.8, trend: 0.05 }, 'item-4': { base: 5.5, trend: -0.05 } },
    'player-2': { 'item-1': { base: 50, trend: 0.8 }, 'item-2': { base: 3.4, trend: -0.02 }, 'item-3': { base: 1.6, trend: 0.03 }, 'item-4': { base: 5.8, trend: -0.04 } },
    'player-3': { 'item-1': { base: 48, trend: 1.5 }, 'item-2': { base: 3.5, trend: -0.04 }, 'item-3': { base: 1.5, trend: 0.06 }, 'item-4': { base: 6.0, trend: -0.03 } },
    'player-4': { 'item-1': { base: 52, trend: -0.5 }, 'item-2': { base: 3.3, trend: 0.02 }, 'item-3': { base: 1.7, trend: -0.02 }, 'item-4': { base: 5.6, trend: 0.03 } },
    'player-5': { 'item-1': { base: 47, trend: 2.0 }, 'item-2': { base: 3.6, trend: -0.05 }, 'item-3': { base: 1.4, trend: 0.07 }, 'item-4': { base: 6.2, trend: -0.06 } },
    'player-6': { 'item-1': { base: 53, trend: 0.3 }, 'item-2': { base: 3.1, trend: -0.01 }, 'item-3': { base: 1.9, trend: 0.02 }, 'item-4': { base: 5.4, trend: -0.02 } },
  };

  let counter = 0;
  for (const [playerId, items] of Object.entries(playerBases)) {
    for (let sessionIndex = 0; sessionIndex < demoSessions.length; sessionIndex++) {
      const session = demoSessions[sessionIndex];
      for (const [itemId, config] of Object.entries(items)) {
        counter++;
        const value = config.base + config.trend * sessionIndex + (Math.random() - 0.5) * Math.abs(config.trend) * 2;
        results.push({
          id: `result-${counter}`,
          session_id: session.id,
          player_id: playerId,
          item_id: itemId,
          value: Math.round(value * 100) / 100,
        });
      }
    }
  }
  return results;
}

export const demoResults: MeasurementResult[] = generateDemoResults();

// Demo user credentials
export const demoCredentials = [
  { email: 'admin@regain.com', password: 'admin123', role: 'admin' as const, name: '増田 嵩大' },
  { email: 'staff@regain.com', password: 'staff123', role: 'staff' as const, name: '田中 コーチ' },
  { email: 'player1@regain.com', password: 'player123', role: 'player' as const, name: '山田 太郎' },
];
