-- =============================================
-- REGAIN Metrics - Database Schema
-- Supabase (PostgreSQL) テーブル定義 & RLSポリシー
-- =============================================

-- =============================================
-- 1. profiles テーブル（ユーザー情報）
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'player')) DEFAULT 'player',
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- RLS有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ポリシー: 全ユーザーが自身のプロフィールを閲覧可能
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- ポリシー: Admin/Staffは全プロフィールを閲覧可能
CREATE POLICY "Admin and staff can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- ポリシー: Adminのみプロフィールを作成・更新可能
CREATE POLICY "Admin can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can update profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 新規ユーザー登録時に自動でprofilesレコードを作成するトリガー
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'player'),
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =============================================
-- 2. measurement_items テーブル（測定項目定義）
-- =============================================
CREATE TABLE IF NOT EXISTS measurement_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  is_inverted BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- RLS有効化
ALTER TABLE measurement_items ENABLE ROW LEVEL SECURITY;

-- ポリシー: 全ユーザーが閲覧可能
CREATE POLICY "All users can view measurement items"
  ON measurement_items FOR SELECT
  USING (true);

-- ポリシー: Adminのみ追加・編集・削除可能
CREATE POLICY "Admin can insert measurement items"
  ON measurement_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can update measurement items"
  ON measurement_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can delete measurement items"
  ON measurement_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );


-- =============================================
-- 3. measurement_sessions テーブル（測定実施日）
-- =============================================
CREATE TABLE IF NOT EXISTS measurement_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- RLS有効化
ALTER TABLE measurement_sessions ENABLE ROW LEVEL SECURITY;

-- ポリシー: 全ユーザーが閲覧可能
CREATE POLICY "All users can view measurement sessions"
  ON measurement_sessions FOR SELECT
  USING (true);

-- ポリシー: Admin/Staffが作成・更新可能
CREATE POLICY "Admin and staff can insert sessions"
  ON measurement_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admin and staff can update sessions"
  ON measurement_sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );


-- =============================================
-- 4. measurement_results テーブル（測定結果データ）
-- =============================================
CREATE TABLE IF NOT EXISTS measurement_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES measurement_sessions(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES measurement_items(id) ON DELETE CASCADE NOT NULL,
  value NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  UNIQUE(session_id, player_id, item_id)
);

-- RLS有効化
ALTER TABLE measurement_results ENABLE ROW LEVEL SECURITY;

-- ポリシー: Playerは自身のデータのみ閲覧可能
CREATE POLICY "Players can view own results"
  ON measurement_results FOR SELECT
  USING (
    auth.uid() = player_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- ポリシー: Admin/Staffは全操作可能
CREATE POLICY "Admin and staff can insert results"
  ON measurement_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admin and staff can update results"
  ON measurement_results FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admin and staff can delete results"
  ON measurement_results FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );


-- =============================================
-- 5. 初期データ投入（測定項目のデフォルト値）
-- =============================================
INSERT INTO measurement_items (name, unit, is_inverted, is_active, sort_order)
VALUES
  ('垂直跳び', 'cm', FALSE, TRUE, 1),
  ('スプリント 20m走', '秒', TRUE, TRUE, 2),
  ('ドロップジャンプ', 'RSI', FALSE, TRUE, 3),
  ('アジリティテスト', '秒', TRUE, TRUE, 4);


-- =============================================
-- インデックス（パフォーマンス最適化）
-- =============================================
CREATE INDEX IF NOT EXISTS idx_measurement_results_session_id ON measurement_results(session_id);
CREATE INDEX IF NOT EXISTS idx_measurement_results_player_id ON measurement_results(player_id);
CREATE INDEX IF NOT EXISTS idx_measurement_results_item_id ON measurement_results(item_id);
CREATE INDEX IF NOT EXISTS idx_measurement_sessions_date ON measurement_sessions(date DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
