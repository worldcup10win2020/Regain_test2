# REGAIN Metrics

サッカーチーム向け体力測定データ管理・可視化アプリケーション

## Project Overview
- **Name**: REGAIN Metrics
- **Goal**: 体力測定データの即時入力・可視化を通じて、選手の成長推移を「過去の自分」との比較で把握し、データに基づいたコミュニケーションを促進する
- **Concept**: 「他人との比較」ではなく「過去の自分」との比較

## URLs
- **Preview**: ローカル開発サーバーでのプレビュー
- **Production**: Cloudflare Pagesにデプロイ後に発行されるURL

## Features

### 実装済み機能

#### 1. ログイン画面（全ユーザー共通）
- メールアドレス・パスワード認証（Supabase Auth）
- 権限に応じた自動リダイレクト（Admin/Staff → 管理画面、Player → 選手ダッシュボード）
- デモモード対応（Supabase未設定時に自動有効化）

#### 2. データ入力画面（Staff / Admin向け）
- iPad横向き最適化レイアウト
- 測定セッション管理（日付指定で新規作成）
- 選手選択 → データ入力 → 保存 → 次の選手への連続入力フロー
- テンキー入力対応（誤操作防止の大きなボタン）
- 4種目の測定データ入力:
  - 垂直跳び (cm)
  - スプリント 20m走 (秒)
  - ドロップジャンプ (RSI)
  - アジリティテスト (秒)

#### 3. 選手向けダッシュボード画面（Player向け）
- スマホ縦向き最適化
- 個人成績推移グラフ（折れ線グラフ）
- Y軸反転ロジック（スプリント・アジリティは小さいほどグラフ上向き）
- 前回比表示（矢印アイコン・色分け）
- 自身のデータのみ表示（他選手データ非表示）
- 相談促進メッセージ表示

#### 4. コーチ・管理者向けダッシュボード画面（Staff / Admin向け）
- チーム全体サマリー（測定項目ごとの平均値カード）
- チーム平均値の推移グラフ（項目切り替えタブ）
- 選手一覧 + 前回比アラート（色付けバッジ）
- 個別選手の詳細データ閲覧

#### 5. ユーザー・測定項目管理画面（Adminのみ）
- ユーザー管理: 選手・スタッフのアカウント追加
- パスワード手動リセット機能
- 測定項目管理: 名称・単位・Y軸反転フラグ・有効/無効の設定
- 測定項目の追加・編集・削除

### デモモード
Supabaseの環境変数が未設定の場合、デモモードが自動有効化されます。
- **Admin**: admin@regain.com
- **Staff**: staff@regain.com
- **Player**: tanaka@regain.com / suzuki@regain.com / takahashi@regain.com 等
- パスワードは任意の値で入力可能

## Data Architecture

### データモデル
| テーブル | 概要 |
|---------|------|
| `profiles` | ユーザー情報（Supabase Auth連携、役割: admin/staff/player）|
| `measurement_items` | 測定項目定義（名称、単位、Y軸反転フラグ、有効/無効）|
| `measurement_sessions` | 測定実施日・記録者 |
| `measurement_results` | 測定結果データ（セッション×選手×項目の一意組み合わせ）|

### ストレージ
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **RLS**: Row Level Security有効（選手は自身のデータのみアクセス可）

## Tech Stack
- **Frontend**: HTML + Tailwind CSS (CDN) + Vanilla JavaScript
- **Backend**: Hono (TypeScript) on Cloudflare Workers
- **Database**: Supabase (PostgreSQL)
- **Charts**: Chart.js
- **Icons**: Font Awesome
- **Hosting**: Cloudflare Pages

## User Guide

### 管理者向け
1. 管理者アカウントでログイン
2. 「管理設定」で選手・スタッフのアカウントを追加
3. 「データ入力」で測定セッションを作成し、選手データを入力
4. 「ダッシュボード」でチーム全体と個別選手のデータを確認

### スタッフ向け
1. スタッフアカウントでログイン
2. 測定当日、iPadで「データ入力」画面を開く
3. セッションを選択し、選手ごとにデータを入力・保存
4. 「ダッシュボード」で結果を確認

### 選手向け
1. 選手アカウントでスマホからログイン
2. ダッシュボードで自分の最新結果と推移グラフを確認
3. 前回比（↑↓）で改善・低下を把握
4. わからないことはコーチに相談

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Local preview
npm run preview

# Deploy to Cloudflare Pages
npm run deploy
```

## Deployment
- **Platform**: Cloudflare Pages
- **Tech Stack**: Hono + TypeScript + Tailwind CSS (CDN)
- **Status**: ✅ Active (Demo Mode)
- **詳細手順**: [DEPLOYMENT.md](./DEPLOYMENT.md) を参照

## Future Roadmap
- [ ] データのCSVエクスポート機能（Tableau等での詳細分析用）
- [ ] 怪我情報の記録機能（痛みあり/なし）
- [ ] VBTデバイス等とのAPI連携
- [ ] 測定項目の並び替え機能
- [ ] 通知機能（測定結果通知）
