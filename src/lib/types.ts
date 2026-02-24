export type UserRole = 'admin' | 'staff' | 'player';

export interface Profile {
  id: string;
  role: UserRole;
  name: string;
  email?: string;
  created_at?: string;
}

export interface MeasurementItem {
  id: string;
  name: string;
  unit: string;
  is_inverted: boolean;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
}

export interface MeasurementSession {
  id: string;
  date: string;
  recorded_by: string;
  created_at?: string;
}

export interface MeasurementResult {
  id: string;
  session_id: string;
  player_id: string;
  item_id: string;
  value: number;
  created_at?: string;
}

// Extended types with joined data
export interface MeasurementResultWithDetails extends MeasurementResult {
  measurement_items?: MeasurementItem;
  measurement_sessions?: MeasurementSession;
  profiles?: Profile;
}

export interface PlayerMeasurementData {
  player: Profile;
  sessions: {
    session: MeasurementSession;
    results: {
      item: MeasurementItem;
      value: number;
    }[];
  }[];
}
