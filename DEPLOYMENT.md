# REGAIN Metrics デプロイ手順書

## 概要
REGAIN Metricsは、サッカーチーム向け体力測定データ管理・可視化アプリケーションです。
Cloudflare Pagesでホスティングし、Supabase (PostgreSQL) をバックエンドデータベースとして使用します。

---

## 1. Supabaseプロジェクトの作成手順

### 1.1 プロジェクト作成
1. [Supabase](https://supabase.com) にログインし、「New Project」をクリック
2. プロジェクト名: `regain-metrics`
3. リージョン: **Tokyo** (Northeast Asia) を推奨
4. データベースパスワードを設定し、安全に保管する

### 1.2 データベーステーブル作成
`SQL Editor` を開き、以下のSQLを順番に実行してください。

#### テーブル作成SQL

```sql
-- ========================
-- 1. profiles テーブル (Supabase Auth連携)
-- ========================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'player')) DEFAULT 'player',
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 新規ユーザー登録時に自動でprofilesに追加するトリガー
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'player'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================
-- 2. measurement_items テーブル (測定項目定義)
-- ========================
CREATE TABLE IF NOT EXISTS measurement_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  is_inverted BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- 3. measurement_sessions テーブル (測定実施日)
-- ========================
CREATE TABLE IF NOT EXISTS measurement_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- 4. measurement_results テーブル (測定結果データ)
-- ========================
CREATE TABLE IF NOT EXISTS measurement_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES measurement_sessions(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES measurement_items(id) ON DELETE CASCADE NOT NULL,
  value NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, player_id, item_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_results_session ON measurement_results(session_id);
CREATE INDEX IF NOT EXISTS idx_results_player ON measurement_results(player_id);
CREATE INDEX IF NOT EXISTS idx_results_item ON measurement_results(item_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
```

### 1.3 Row Level Security (RLS) 設定

```sql
-- ========================
-- RLS Policy 設定
-- ========================

-- profiles テーブル
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can view own profile"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() = id
  );

-- measurement_items テーブル
ALTER TABLE measurement_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active items"
  ON measurement_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage items"
  ON measurement_items FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- measurement_sessions テーブル
ALTER TABLE measurement_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sessions"
  ON measurement_sessions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff and Admins can create sessions"
  ON measurement_sessions FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "Staff and Admins can update sessions"
  ON measurement_sessions FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- measurement_results テーブル
ALTER TABLE measurement_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can view own results"
  ON measurement_results FOR SELECT
  USING (
    player_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Staff and Admins can insert results"
  ON measurement_results FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "Staff and Admins can update results"
  ON measurement_results FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "Staff and Admins can delete results"
  ON measurement_results FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );
```

### 1.4 初期データ投入（デフォルト測定項目）

```sql
-- デフォルトの測定項目を追加
INSERT INTO measurement_items (name, unit, is_inverted, is_active, sort_order) VALUES
  ('垂直跳び', 'cm', false, true, 0),
  ('スプリント 20m走', '秒', true, true, 1),
  ('ドロップジャンプ', 'RSI', false, true, 2),
  ('アジリティテスト', '秒', true, true, 3);
```

### 1.5 APIキーの取得
1. `Project Settings` > `API` に移動
2. 以下の値をコピーして控えておく:
   - **Project URL**: `https://xxxxxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6...`

### 1.6 管理者ユーザーの作成
1. `Authentication` > `Users` に移動
2. 「Add user」>「Create new user」をクリック
3. メールアドレスとパスワードを設定
4. 作成後、`SQL Editor` で以下を実行してAdmin権限を付与:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your-admin@example.com';
```

---

## 2. Cloudflare Pagesプロジェクトの作成手順

### 2.1 環境変数の設定
`wrangler.jsonc` の `vars` セクションに、Supabaseの値を設定してください:

```jsonc
{
  "vars": {
    "SUPABASE_URL": "https://xxxxxxxx.supabase.co",
    "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
}
```

**本番環境では、Cloudflareダッシュボードの環境変数設定を使用することを推奨します。**

### 2.2 ローカル開発
```bash
# 依存関係のインストール
npm install

# ビルド
npm run build

# ローカルプレビュー
npm run preview
```

### 2.3 Cloudflare Pagesへのデプロイ

#### 方法1: Wrangler CLIを使用（推奨）
```bash
# ビルドしてデプロイ
npm run deploy
```

#### 方法2: GitHubリポジトリ連携
1. Cloudflareダッシュボードにログイン
2. 「Pages」>「Create a project」>「Connect to Git」
3. GitHubリポジトリを選択
4. ビルド設定:
   - Framework: None
   - Build command: `npm run build`
   - Build output directory: `dist`
5. 環境変数を設定:
   - `SUPABASE_URL`: SupabaseのProject URL
   - `SUPABASE_ANON_KEY`: Supabaseのanon public key

---

## 3. Vercelでのデプロイ（代替オプション）

要件定義書に記載のVercelデプロイも可能です。

### 3.1 ビルド設定
1. Vercelダッシュボードで「Add New...」>「Project」
2. GitHubリポジトリをインポート
3. ビルド設定:
   - Framework: Other
   - Build command: `npm run build`
   - Output directory: `dist`

### 3.2 環境変数設定
- `SUPABASE_URL`: SupabaseのProject URL
- `SUPABASE_ANON_KEY`: Supabaseのanon public key

---

## 4. デプロイ確認手順

### 4.1 基本動作確認
1. デプロイ完了後、発行されたURLにアクセス
2. ログイン画面が表示されることを確認
3. 管理者アカウントでログインできることを確認

### 4.2 機能確認
1. **データ入力**: 測定セッションを作成し、選手データを入力・保存
2. **コーチダッシュボード**: チーム全体のサマリーとグラフが表示されること
3. **選手ダッシュボード**: 選手アカウントでログインし、個人データのみ表示されること
4. **管理画面**: ユーザー・測定項目の管理ができること

### 4.3 レスポンシブ確認
1. スマートフォン（縦向き）: 選手ダッシュボードの表示
2. iPad（横向き）: データ入力画面の操作性
3. PC: コーチダッシュボードと管理画面

### 4.4 データ連携確認
1. Supabaseの `Table Editor` でデータが正しく保存されていることを確認
2. RLSが正しく機能していることを確認（選手アカウントで他選手のデータが見えないこと）

---

## 5. デモモードについて

Supabaseの環境変数が未設定の場合、アプリは自動的に**デモモード**で動作します。

- **デモ用ログイン情報**:
  - Admin: `admin@regain.com` (任意のパスワード)
  - Staff: `staff@regain.com` (任意のパスワード)
  - Player: `tanaka@regain.com` (任意のパスワード)

- デモモードではサンプルデータが自動生成されます
- 本番運用にはSupabaseの設定が必須です

---

## 6. トラブルシューティング

### ログインできない
- Supabaseの `Authentication` > `Users` でユーザーが存在するか確認
- `profiles` テーブルにレコードが存在するか確認
- 環境変数が正しく設定されているか確認

### データが表示されない
- RLSポリシーが正しく設定されているか確認
- `measurement_items` に有効な項目が存在するか確認
- `measurement_sessions` と `measurement_results` にデータがあるか確認

### パスワードリセット
管理者がSQL Editorで以下を実行:
```sql
-- Supabase Dashboard の Authentication > Users から手動リセット
-- または Auth Admin API を使用
```
