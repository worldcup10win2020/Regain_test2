import { supabase, isSupabaseConfigured } from './supabase';
import { Profile, MeasurementItem, MeasurementSession, MeasurementResult } from './types';
import {
  demoProfiles,
  demoMeasurementItems,
  demoSessions,
  demoResults,
} from './demo-data';

const isDemo = !isSupabaseConfigured();

// ========================
// Profiles
// ========================
export async function getProfiles(): Promise<Profile[]> {
  if (isDemo) return demoProfiles;
  const { data, error } = await supabase.from('profiles').select('*').order('name');
  if (error) throw error;
  return data;
}

export async function getPlayers(): Promise<Profile[]> {
  if (isDemo) return demoProfiles.filter(p => p.role === 'player');
  const { data, error } = await supabase.from('profiles').select('*').eq('role', 'player').order('name');
  if (error) throw error;
  return data;
}

export async function getProfile(id: string): Promise<Profile | null> {
  if (isDemo) return demoProfiles.find(p => p.id === id) || null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

export async function createProfile(profile: { name: string; email: string; role: string; password: string }): Promise<Profile> {
  if (isDemo) {
    const newProfile: Profile = {
      id: `player-${Date.now()}`,
      name: profile.name,
      role: profile.role as Profile['role'],
      email: profile.email,
    };
    demoProfiles.push(newProfile);
    return newProfile;
  }
  // In production, use Supabase Admin API to create user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: profile.email,
    password: profile.password,
    email_confirm: true,
  });
  if (authError) throw authError;
  
  const { data, error } = await supabase.from('profiles').insert({
    id: authData.user.id,
    name: profile.name,
    role: profile.role,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function updateProfile(id: string, updates: Partial<Profile>): Promise<void> {
  if (isDemo) {
    const idx = demoProfiles.findIndex(p => p.id === id);
    if (idx >= 0) Object.assign(demoProfiles[idx], updates);
    return;
  }
  const { error } = await supabase.from('profiles').update(updates).eq('id', id);
  if (error) throw error;
}

// ========================
// Measurement Items
// ========================
export async function getMeasurementItems(activeOnly = false): Promise<MeasurementItem[]> {
  if (isDemo) {
    return activeOnly ? demoMeasurementItems.filter(i => i.is_active) : demoMeasurementItems;
  }
  let query = supabase.from('measurement_items').select('*').order('sort_order');
  if (activeOnly) query = query.eq('is_active', true);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createMeasurementItem(item: Omit<MeasurementItem, 'id' | 'created_at'>): Promise<MeasurementItem> {
  if (isDemo) {
    const newItem: MeasurementItem = { ...item, id: `item-${Date.now()}` };
    demoMeasurementItems.push(newItem);
    return newItem;
  }
  const { data, error } = await supabase.from('measurement_items').insert(item).select().single();
  if (error) throw error;
  return data;
}

export async function updateMeasurementItem(id: string, updates: Partial<MeasurementItem>): Promise<void> {
  if (isDemo) {
    const idx = demoMeasurementItems.findIndex(i => i.id === id);
    if (idx >= 0) Object.assign(demoMeasurementItems[idx], updates);
    return;
  }
  const { error } = await supabase.from('measurement_items').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteMeasurementItem(id: string): Promise<void> {
  if (isDemo) {
    const idx = demoMeasurementItems.findIndex(i => i.id === id);
    if (idx >= 0) demoMeasurementItems.splice(idx, 1);
    return;
  }
  const { error } = await supabase.from('measurement_items').delete().eq('id', id);
  if (error) throw error;
}

// ========================
// Measurement Sessions
// ========================
export async function getMeasurementSessions(): Promise<MeasurementSession[]> {
  if (isDemo) return [...demoSessions].sort((a, b) => b.date.localeCompare(a.date));
  const { data, error } = await supabase.from('measurement_sessions').select('*').order('date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createMeasurementSession(session: { date: string; recorded_by: string }): Promise<MeasurementSession> {
  if (isDemo) {
    const newSession: MeasurementSession = { ...session, id: `session-${Date.now()}` };
    demoSessions.push(newSession);
    return newSession;
  }
  const { data, error } = await supabase.from('measurement_sessions').insert(session).select().single();
  if (error) throw error;
  return data;
}

// ========================
// Measurement Results
// ========================
export async function getMeasurementResults(filters?: {
  player_id?: string;
  session_id?: string;
}): Promise<MeasurementResult[]> {
  if (isDemo) {
    let results = [...demoResults];
    if (filters?.player_id) results = results.filter(r => r.player_id === filters.player_id);
    if (filters?.session_id) results = results.filter(r => r.session_id === filters.session_id);
    return results;
  }
  let query = supabase.from('measurement_results').select('*');
  if (filters?.player_id) query = query.eq('player_id', filters.player_id);
  if (filters?.session_id) query = query.eq('session_id', filters.session_id);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function upsertMeasurementResult(result: {
  session_id: string;
  player_id: string;
  item_id: string;
  value: number;
}): Promise<MeasurementResult> {
  if (isDemo) {
    const existingIdx = demoResults.findIndex(
      r => r.session_id === result.session_id && r.player_id === result.player_id && r.item_id === result.item_id
    );
    if (existingIdx >= 0) {
      demoResults[existingIdx].value = result.value;
      return demoResults[existingIdx];
    }
    const newResult: MeasurementResult = { ...result, id: `result-${Date.now()}-${Math.random().toString(36).slice(2)}` };
    demoResults.push(newResult);
    return newResult;
  }
  // Upsert: check if exists then update or insert
  const { data: existing } = await supabase
    .from('measurement_results')
    .select('id')
    .eq('session_id', result.session_id)
    .eq('player_id', result.player_id)
    .eq('item_id', result.item_id)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from('measurement_results')
      .update({ value: result.value })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('measurement_results')
    .insert(result)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ========================
// Aggregated Data Helpers
// ========================
export async function getPlayerMeasurementHistory(playerId: string) {
  const [items, sessions, results] = await Promise.all([
    getMeasurementItems(true),
    getMeasurementSessions(),
    getMeasurementResults({ player_id: playerId }),
  ]);

  const sortedSessions = [...sessions].sort((a, b) => a.date.localeCompare(b.date));

  return { items, sessions: sortedSessions, results };
}

export async function getAllPlayersLatestResults() {
  const [players, items, sessions, results] = await Promise.all([
    getPlayers(),
    getMeasurementItems(true),
    getMeasurementSessions(),
    getMeasurementResults(),
  ]);

  const sortedSessions = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  const latestSession = sortedSessions[0];
  const previousSession = sortedSessions[1];

  return { players, items, sessions: sortedSessions, results, latestSession, previousSession };
}
