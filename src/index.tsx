import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())

// ========== HTML Pages ==========

// Main SPA - serves all pages
app.get('*', (c) => {
  const supabaseUrl = c.env?.SUPABASE_URL || ''
  const supabaseAnonKey = c.env?.SUPABASE_ANON_KEY || ''

  return c.html(`<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>REGAIN Metrics</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <script>
    window.__SUPABASE_URL__ = "${supabaseUrl}";
    window.__SUPABASE_ANON_KEY__ = "${supabaseAnonKey}";
  </script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: { 50:'#f0f9ff',100:'#e0f2fe',200:'#bae6fd',300:'#7dd3fc',400:'#38bdf8',500:'#0ea5e9',600:'#0284c7',700:'#0369a1',800:'#075985',900:'#0c4a6e' },
            accent: { 50:'#fdf4ff',100:'#fae8ff',200:'#f5d0fe',300:'#f0abfc',400:'#e879f9',500:'#d946ef',600:'#c026d3',700:'#a21caf',800:'#86198f',900:'#701a75' },
            success: '#22c55e',
            warning: '#f59e0b',
            danger: '#ef4444'
          }
        }
      }
    }
  </script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+JP:wght@300;400;500;600;700&display=swap');
    body { font-family: 'Noto Sans JP', 'Inter', sans-serif; }
    .page { display: none; }
    .page.active { display: block; }
    .fade-in { animation: fadeIn 0.3s ease-in-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .gradient-bg { background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%); }
    .card { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06); }
    .btn-primary { background: linear-gradient(135deg, #0ea5e9, #0369a1); color: white; border-radius: 8px; padding: 12px 24px; font-weight: 600; transition: all 0.2s; }
    .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .btn-danger { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border-radius: 8px; padding: 12px 24px; font-weight: 600; transition: all 0.2s; }
    .btn-secondary { background: #f1f5f9; color: #475569; border-radius: 8px; padding: 12px 24px; font-weight: 600; transition: all 0.2s; border: 1px solid #e2e8f0; }
    .btn-secondary:hover { background: #e2e8f0; }
    .input-field { border: 2px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; width: 100%; font-size: 16px; transition: border-color 0.2s; }
    .input-field:focus { outline: none; border-color: #0ea5e9; box-shadow: 0 0 0 3px rgba(14,165,233,0.1); }
    .numpad-btn { width: 72px; height: 56px; font-size: 22px; font-weight: 600; border-radius: 10px; border: 2px solid #e2e8f0; background: white; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; }
    .numpad-btn:hover { background: #f0f9ff; border-color: #0ea5e9; }
    .numpad-btn:active { background: #e0f2fe; transform: scale(0.95); }
    .toast { position: fixed; top: 20px; right: 20px; z-index: 9999; padding: 16px 24px; border-radius: 10px; color: white; font-weight: 500; animation: slideIn 0.3s ease-out; }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    .loading-spinner { border: 3px solid #e2e8f0; border-top: 3px solid #0ea5e9; border-radius: 50%; width: 24px; height: 24px; animation: spin 0.8s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .nav-item { padding: 12px 16px; border-radius: 8px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 10px; }
    .nav-item:hover { background: rgba(255,255,255,0.1); }
    .nav-item.active { background: rgba(255,255,255,0.2); font-weight: 600; }
    .stat-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .trend-up { color: #22c55e; }
    .trend-down { color: #ef4444; }
    .trend-neutral { color: #94a3b8; }
    .alert-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .alert-badge.up { background: #dcfce7; color: #16a34a; }
    .alert-badge.down { background: #fee2e2; color: #dc2626; }
    .alert-badge.neutral { background: #f1f5f9; color: #64748b; }
    .sidebar { width: 260px; min-height: 100vh; }
    @media (max-width: 768px) { .sidebar { width: 100%; min-height: auto; } }
    .player-row { transition: all 0.2s; border-left: 4px solid transparent; }
    .player-row:hover { background: #f8fafc; border-left-color: #0ea5e9; }
    .tab-btn { padding: 8px 20px; border-radius: 8px; font-weight: 500; transition: all 0.2s; cursor: pointer; }
    .tab-btn.active { background: #0ea5e9; color: white; }
    .tab-btn:not(.active) { background: #f1f5f9; color: #64748b; }
    .tab-btn:not(.active):hover { background: #e2e8f0; }
  </style>
</head>
<body class="bg-gray-50 min-h-screen">
  <!-- Loading Screen -->
  <div id="loading-screen" class="fixed inset-0 gradient-bg flex items-center justify-center z-50">
    <div class="text-center text-white">
      <div class="text-5xl font-bold mb-2 tracking-tight">REGAIN</div>
      <div class="text-xl font-light tracking-widest">METRICS</div>
      <div class="loading-spinner mx-auto mt-6" style="border-color: rgba(255,255,255,0.3); border-top-color: white;"></div>
    </div>
  </div>

  <!-- Login Page -->
  <div id="page-login" class="page">
    <div class="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div class="card p-8 w-full max-w-md fade-in">
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-bg mb-4">
            <i class="fas fa-chart-line text-white text-2xl"></i>
          </div>
          <h1 class="text-2xl font-bold text-gray-800">REGAIN Metrics</h1>
          <p class="text-gray-500 mt-1">体力測定データ管理システム</p>
        </div>
        <form id="login-form" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
            <input type="email" id="login-email" class="input-field" placeholder="email@example.com" required>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
            <input type="password" id="login-password" class="input-field" placeholder="パスワードを入力" required>
          </div>
          <div id="login-error" class="hidden text-red-500 text-sm bg-red-50 p-3 rounded-lg">
            <i class="fas fa-exclamation-circle mr-1"></i>
            <span></span>
          </div>
          <button type="submit" id="login-btn" class="btn-primary w-full text-center text-lg">
            <i class="fas fa-sign-in-alt mr-2"></i>ログイン
          </button>
        </form>
      </div>
    </div>
  </div>

  <!-- Main App Layout (Admin/Staff) -->
  <div id="page-app" class="page">
    <div class="flex flex-col md:flex-row min-h-screen">
      <!-- Sidebar -->
      <div class="sidebar gradient-bg text-white p-4 md:p-6 flex flex-col">
        <div class="mb-8 hidden md:block">
          <div class="text-2xl font-bold tracking-tight">REGAIN</div>
          <div class="text-xs tracking-widest opacity-70">METRICS</div>
        </div>
        <div class="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible" id="nav-menu">
          <!-- Nav items inserted by JS -->
        </div>
        <div class="hidden md:block mt-auto pt-6 border-t border-white/20">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <i class="fas fa-user"></i>
            </div>
            <div>
              <div id="nav-user-name" class="font-medium text-sm"></div>
              <div id="nav-user-role" class="text-xs opacity-70"></div>
            </div>
          </div>
          <button id="logout-btn" class="mt-4 w-full text-left nav-item text-white/80 hover:text-white">
            <i class="fas fa-sign-out-alt"></i>
            <span>ログアウト</span>
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 p-4 md:p-8 overflow-auto">
        <!-- Data Input Section -->
        <div id="section-input" class="section hidden">
          <div class="fade-in">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h2 class="text-2xl font-bold text-gray-800"><i class="fas fa-edit mr-2 text-primary-500"></i>データ入力</h2>
                <p class="text-gray-500 mt-1">選手を選択して測定データを入力してください</p>
              </div>
              <button id="btn-new-session" class="btn-primary">
                <i class="fas fa-plus mr-2"></i>新規セッション
              </button>
            </div>

            <!-- Session Selector -->
            <div class="card p-6 mb-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">測定セッション</label>
                  <select id="input-session-select" class="input-field">
                    <option value="">セッションを選択...</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">選手</label>
                  <select id="input-player-select" class="input-field text-lg" style="height:52px;">
                    <option value="">選手を選択...</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Input Form -->
            <div id="input-form-container" class="hidden">
              <div class="card p-6 mb-4">
                <div class="flex items-center justify-between mb-4">
                  <h3 id="input-player-name" class="text-xl font-bold text-gray-800"></h3>
                  <span id="input-save-status" class="text-sm text-gray-400"></span>
                </div>
                <div id="input-fields" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- Input fields generated by JS -->
                </div>
              </div>

              <!-- Numpad -->
              <div class="card p-6 mb-4" id="numpad-container">
                <div class="text-sm text-gray-500 mb-2">テンキー入力: <span id="numpad-target-label" class="font-medium text-primary-600">項目を選択</span></div>
                <div id="numpad-display" class="text-3xl font-bold text-gray-800 mb-3 bg-gray-50 p-3 rounded-lg text-right min-h-[48px]">-</div>
                <div class="grid grid-cols-4 gap-2 max-w-xs mx-auto">
                  <button class="numpad-btn" data-key="7">7</button>
                  <button class="numpad-btn" data-key="8">8</button>
                  <button class="numpad-btn" data-key="9">9</button>
                  <button class="numpad-btn bg-red-50 border-red-200 text-red-500" data-key="backspace"><i class="fas fa-backspace"></i></button>
                  <button class="numpad-btn" data-key="4">4</button>
                  <button class="numpad-btn" data-key="5">5</button>
                  <button class="numpad-btn" data-key="6">6</button>
                  <button class="numpad-btn bg-gray-50" data-key="clear">C</button>
                  <button class="numpad-btn" data-key="1">1</button>
                  <button class="numpad-btn" data-key="2">2</button>
                  <button class="numpad-btn" data-key="3">3</button>
                  <button class="numpad-btn row-span-2 !h-full bg-primary-50 border-primary-200 text-primary-600 font-bold" data-key="enter"><i class="fas fa-check"></i></button>
                  <button class="numpad-btn col-span-2 !w-full" data-key="0">0</button>
                  <button class="numpad-btn" data-key=".">.</button>
                </div>
              </div>

              <!-- Save Button -->
              <div class="flex gap-3">
                <button id="btn-save-input" class="btn-primary flex-1 text-center text-lg py-4">
                  <i class="fas fa-save mr-2"></i>保存して次へ
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Coach Dashboard Section -->
        <div id="section-coach-dashboard" class="section hidden">
          <div class="fade-in">
            <h2 class="text-2xl font-bold text-gray-800 mb-1"><i class="fas fa-chart-bar mr-2 text-primary-500"></i>チームダッシュボード</h2>
            <p class="text-gray-500 mb-6">チーム全体のパフォーマンスサマリー</p>

            <!-- Team Summary Cards -->
            <div id="team-summary-cards" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <!-- Generated by JS -->
            </div>

            <!-- Team Average Chart -->
            <div class="card p-6 mb-8">
              <h3 class="text-lg font-bold text-gray-800 mb-4">チーム平均値の推移</h3>
              <div class="flex gap-2 mb-4 flex-wrap" id="team-chart-tabs">
                <!-- Generated by JS -->
              </div>
              <div style="height: 300px;">
                <canvas id="team-avg-chart"></canvas>
              </div>
            </div>

            <!-- Player List with Alerts -->
            <div class="card p-6">
              <h3 class="text-lg font-bold text-gray-800 mb-4"><i class="fas fa-users mr-2"></i>選手一覧 - 前回比アラート</h3>
              <div id="player-alert-list" class="space-y-2">
                <!-- Generated by JS -->
              </div>
            </div>
          </div>
        </div>

        <!-- Player Detail Section (for coaches) -->
        <div id="section-player-detail" class="section hidden">
          <div class="fade-in">
            <button id="btn-back-to-list" class="text-primary-600 mb-4 font-medium">
              <i class="fas fa-arrow-left mr-2"></i>選手一覧に戻る
            </button>
            <div id="player-detail-header" class="mb-6"></div>
            <div id="player-detail-charts" class="grid grid-cols-1 md:grid-cols-2 gap-6"></div>
          </div>
        </div>

        <!-- Admin Section -->
        <div id="section-admin" class="section hidden">
          <div class="fade-in">
            <h2 class="text-2xl font-bold text-gray-800 mb-1"><i class="fas fa-cog mr-2 text-primary-500"></i>管理設定</h2>
            <p class="text-gray-500 mb-6">ユーザーと測定項目の管理</p>

            <!-- Tabs -->
            <div class="flex gap-2 mb-6">
              <button class="tab-btn active" data-admin-tab="users"><i class="fas fa-users mr-1"></i>ユーザー管理</button>
              <button class="tab-btn" data-admin-tab="items"><i class="fas fa-ruler mr-1"></i>測定項目管理</button>
            </div>

            <!-- User Management -->
            <div id="admin-tab-users" class="admin-tab-content">
              <div class="card p-6 mb-6">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-bold">ユーザー一覧</h3>
                  <button id="btn-add-user" class="btn-primary"><i class="fas fa-plus mr-2"></i>ユーザー追加</button>
                </div>
                <div id="user-list" class="space-y-2">
                  <!-- Generated by JS -->
                </div>
              </div>
            </div>

            <!-- Measurement Items Management -->
            <div id="admin-tab-items" class="admin-tab-content hidden">
              <div class="card p-6 mb-6">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-bold">測定項目一覧</h3>
                  <button id="btn-add-item" class="btn-primary"><i class="fas fa-plus mr-2"></i>項目追加</button>
                </div>
                <div id="item-list" class="space-y-2">
                  <!-- Generated by JS -->
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Player Dashboard (Separate layout for mobile) -->
  <div id="page-player" class="page">
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <div class="gradient-bg text-white p-4 pb-16">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-lg font-bold">REGAIN Metrics</div>
            <div id="player-greeting" class="text-sm opacity-80"></div>
          </div>
          <button id="player-logout-btn" class="bg-white/20 rounded-full w-10 h-10 flex items-center justify-center">
            <i class="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="px-4 -mt-12 pb-24">
        <!-- Latest Results -->
        <div class="card p-5 mb-4 fade-in">
          <h3 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">最新の測定結果</h3>
          <div id="player-latest-results" class="grid grid-cols-2 gap-3">
            <!-- Generated by JS -->
          </div>
        </div>

        <!-- Charts -->
        <div id="player-charts-container" class="space-y-4">
          <!-- Generated by JS -->
        </div>

        <!-- Consultation Message -->
        <div class="card p-5 mt-4 border-l-4 border-primary-400 bg-primary-50/50">
          <div class="flex items-start gap-3">
            <div class="text-primary-500 mt-0.5">
              <i class="fas fa-comment-dots text-xl"></i>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-700">数値の変化について理由がわからない場合は、コーチに相談しましょう。</p>
              <p class="text-xs text-gray-500 mt-1">データを元にしたコミュニケーションが、パフォーマンス改善の鍵です。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Modals -->
  <!-- New Session Modal -->
  <div id="modal-new-session" class="fixed inset-0 bg-black/50 z-50 hidden flex items-center justify-center p-4">
    <div class="card p-6 w-full max-w-md fade-in">
      <h3 class="text-lg font-bold mb-4">新規測定セッション</h3>
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">測定日</label>
        <input type="date" id="new-session-date" class="input-field">
      </div>
      <div class="flex gap-3">
        <button id="btn-create-session" class="btn-primary flex-1">作成</button>
        <button class="btn-secondary modal-close">キャンセル</button>
      </div>
    </div>
  </div>

  <!-- Add User Modal -->
  <div id="modal-add-user" class="fixed inset-0 bg-black/50 z-50 hidden flex items-center justify-center p-4">
    <div class="card p-6 w-full max-w-md fade-in">
      <h3 class="text-lg font-bold mb-4">ユーザー追加</h3>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">名前</label>
          <input type="text" id="new-user-name" class="input-field" placeholder="例: 山田 太郎">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
          <input type="email" id="new-user-email" class="input-field" placeholder="email@example.com">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
          <input type="password" id="new-user-password" class="input-field" placeholder="6文字以上">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">権限</label>
          <select id="new-user-role" class="input-field">
            <option value="player">Player (選手)</option>
            <option value="staff">Staff (スタッフ)</option>
            <option value="admin">Admin (管理者)</option>
          </select>
        </div>
      </div>
      <div class="flex gap-3 mt-6">
        <button id="btn-create-user" class="btn-primary flex-1">追加</button>
        <button class="btn-secondary modal-close">キャンセル</button>
      </div>
    </div>
  </div>

  <!-- Add/Edit Item Modal -->
  <div id="modal-add-item" class="fixed inset-0 bg-black/50 z-50 hidden flex items-center justify-center p-4">
    <div class="card p-6 w-full max-w-md fade-in">
      <h3 id="modal-item-title" class="text-lg font-bold mb-4">測定項目追加</h3>
      <div class="space-y-4">
        <input type="hidden" id="edit-item-id">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">項目名</label>
          <input type="text" id="item-name" class="input-field" placeholder="例: 垂直跳び">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">単位</label>
          <input type="text" id="item-unit" class="input-field" placeholder="例: cm">
        </div>
        <div class="flex items-center gap-3">
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" id="item-inverted" class="sr-only peer">
            <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
          </label>
          <span class="text-sm text-gray-700">Y軸反転（タイムなど数値が小さいほど良い場合）</span>
        </div>
        <div class="flex items-center gap-3">
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" id="item-active" class="sr-only peer" checked>
            <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
          </label>
          <span class="text-sm text-gray-700">有効</span>
        </div>
      </div>
      <div class="flex gap-3 mt-6">
        <button id="btn-save-item" class="btn-primary flex-1">保存</button>
        <button class="btn-secondary modal-close">キャンセル</button>
      </div>
    </div>
  </div>

  <!-- Reset Password Modal -->
  <div id="modal-reset-password" class="fixed inset-0 bg-black/50 z-50 hidden flex items-center justify-center p-4">
    <div class="card p-6 w-full max-w-md fade-in">
      <h3 class="text-lg font-bold mb-4">パスワードリセット</h3>
      <p class="text-sm text-gray-500 mb-4">
        <span id="reset-pw-user-name" class="font-medium text-gray-800"></span> の新しいパスワードを設定してください。
      </p>
      <input type="hidden" id="reset-pw-user-id">
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">新しいパスワード</label>
        <input type="password" id="reset-pw-new" class="input-field" placeholder="6文字以上">
      </div>
      <div class="flex gap-3">
        <button id="btn-confirm-reset-pw" class="btn-primary flex-1">リセット</button>
        <button class="btn-secondary modal-close">キャンセル</button>
      </div>
    </div>
  </div>

  <!-- App JavaScript -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
  <script>
  // ============================
  // REGAIN Metrics - Main App
  // ============================
  (function() {
    'use strict';

    // --- Supabase Init ---
    const SUPABASE_URL = window.__SUPABASE_URL__;
    const SUPABASE_ANON_KEY = window.__SUPABASE_ANON_KEY__;
    let supabase = null;
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    // --- State ---
    let currentUser = null;
    let currentProfile = null;
    let measurementItems = [];
    let players = [];
    let sessions = [];
    let allProfiles = [];
    let playerChartInstances = {};
    let teamChartInstance = null;
    let activeNumpadField = null;

    // --- Utils ---
    function $(sel) { return document.querySelector(sel); }
    function $$(sel) { return document.querySelectorAll(sel); }

    function showToast(msg, type = 'success') {
      const toast = document.createElement('div');
      toast.className = 'toast ' + (type === 'error' ? 'bg-red-500' : type === 'warning' ? 'bg-amber-500' : 'bg-green-500');
      toast.innerHTML = '<i class="fas fa-' + (type === 'error' ? 'times-circle' : type === 'warning' ? 'exclamation-triangle' : 'check-circle') + ' mr-2"></i>' + msg;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }

    function formatDate(d) {
      if (!d) return '-';
      return new Date(d).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function formatDiff(val, isInverted) {
      if (val == null || isNaN(val)) return '';
      const improved = isInverted ? val < 0 : val > 0;
      const worsened = isInverted ? val > 0 : val < 0;
      const absVal = Math.abs(val).toFixed(2);
      if (improved) return '<span class="trend-up font-bold"><i class="fas fa-arrow-up mr-1"></i>+' + absVal + '</span>';
      if (worsened) return '<span class="trend-down font-bold"><i class="fas fa-arrow-down mr-1"></i>-' + absVal + '</span>';
      return '<span class="trend-neutral"><i class="fas fa-minus mr-1"></i>0</span>';
    }

    function formatDiffBadge(val, isInverted) {
      if (val == null || isNaN(val)) return '<span class="alert-badge neutral">-</span>';
      const improved = isInverted ? val < 0 : val > 0;
      const worsened = isInverted ? val > 0 : val < 0;
      const absVal = Math.abs(val).toFixed(2);
      if (improved) return '<span class="alert-badge up"><i class="fas fa-arrow-up"></i>' + absVal + '</span>';
      if (worsened) return '<span class="alert-badge down"><i class="fas fa-arrow-down"></i>' + absVal + '</span>';
      return '<span class="alert-badge neutral">-</span>';
    }

    // --- Demo Mode (No Supabase) ---
    let demoMode = false;
    let demoData = {};

    function initDemoMode() {
      demoMode = true;
      // Generate demo data
      demoData.profiles = [
        { id: 'admin-1', name: '増田 嵩大', role: 'admin', email: 'admin@regain.com' },
        { id: 'staff-1', name: '佐藤 健一', role: 'staff', email: 'staff@regain.com' },
        { id: 'player-1', name: '田中 翔太', role: 'player', email: 'tanaka@regain.com' },
        { id: 'player-2', name: '鈴木 大輔', role: 'player', email: 'suzuki@regain.com' },
        { id: 'player-3', name: '高橋 拓也', role: 'player', email: 'takahashi@regain.com' },
        { id: 'player-4', name: '渡辺 翼', role: 'player', email: 'watanabe@regain.com' },
        { id: 'player-5', name: '伊藤 蓮', role: 'player', email: 'ito@regain.com' },
      ];
      demoData.items = [
        { id: 'item-1', name: '垂直跳び', unit: 'cm', is_inverted: false, is_active: true, sort_order: 0 },
        { id: 'item-2', name: 'スプリント 20m走', unit: '秒', is_inverted: true, is_active: true, sort_order: 1 },
        { id: 'item-3', name: 'ドロップジャンプ', unit: 'RSI', is_inverted: false, is_active: true, sort_order: 2 },
        { id: 'item-4', name: 'アジリティテスト', unit: '秒', is_inverted: true, is_active: true, sort_order: 3 },
      ];
      const now = new Date();
      demoData.sessions = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now);
        d.setMonth(d.getMonth() - i);
        demoData.sessions.push({ id: 'session-' + (6 - i), date: d.toISOString().split('T')[0], recorded_by: 'admin-1' });
      }
      demoData.results = [];
      const playerIds = demoData.profiles.filter(p => p.role === 'player').map(p => p.id);
      const baseValues = { 'item-1': [45, 50], 'item-2': [3.0, 3.5], 'item-3': [1.5, 2.5], 'item-4': [4.5, 5.5] };
      playerIds.forEach(pid => {
        const seeds = {};
        demoData.items.forEach(item => {
          const [lo, hi] = baseValues[item.id];
          seeds[item.id] = lo + Math.random() * (hi - lo);
        });
        demoData.sessions.forEach((sess, si) => {
          demoData.items.forEach(item => {
            const drift = (Math.random() - 0.4) * (item.is_inverted ? -0.1 : 1.5);
            seeds[item.id] += drift;
            demoData.results.push({
              id: 'res-' + pid + '-' + sess.id + '-' + item.id,
              session_id: sess.id,
              player_id: pid,
              item_id: item.id,
              value: parseFloat(seeds[item.id].toFixed(2))
            });
          });
        });
      });
    }

    // --- Auth ---
    async function handleLogin(email, password) {
      if (!supabase) {
        // Demo mode login
        const profile = demoData.profiles.find(p => p.email === email);
        if (!profile) throw new Error('ユーザーが見つかりません');
        currentUser = { id: profile.id, email: profile.email };
        currentProfile = profile;
        return;
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      currentUser = data.user;
      // Fetch profile
      const { data: profile, error: profileErr } = await supabase
        .from('profiles').select('*').eq('id', data.user.id).single();
      if (profileErr) throw profileErr;
      currentProfile = profile;
    }

    async function handleLogout() {
      if (supabase) await supabase.auth.signOut();
      currentUser = null;
      currentProfile = null;
      showPage('login');
    }

    // --- Data Fetching ---
    async function fetchMeasurementItems() {
      if (demoMode) { measurementItems = demoData.items.filter(i => i.is_active); return; }
      const { data, error } = await supabase.from('measurement_items').select('*').eq('is_active', true).order('sort_order');
      if (error) throw error;
      measurementItems = data || [];
    }

    async function fetchAllItems() {
      if (demoMode) return demoData.items;
      const { data } = await supabase.from('measurement_items').select('*').order('sort_order');
      return data || [];
    }

    async function fetchPlayers() {
      if (demoMode) { players = demoData.profiles.filter(p => p.role === 'player'); return; }
      const { data, error } = await supabase.from('profiles').select('*').eq('role', 'player').order('name');
      if (error) throw error;
      players = data || [];
    }

    async function fetchAllProfiles() {
      if (demoMode) { allProfiles = demoData.profiles; return; }
      const { data } = await supabase.from('profiles').select('*').order('name');
      allProfiles = data || [];
    }

    async function fetchSessions() {
      if (demoMode) { sessions = demoData.sessions.sort((a, b) => b.date.localeCompare(a.date)); return; }
      const { data } = await supabase.from('measurement_sessions').select('*').order('date', { ascending: false });
      sessions = data || [];
    }

    async function fetchResults(filters = {}) {
      if (demoMode) {
        let res = [...demoData.results];
        if (filters.player_id) res = res.filter(r => r.player_id === filters.player_id);
        if (filters.session_id) res = res.filter(r => r.session_id === filters.session_id);
        return res;
      }
      let q = supabase.from('measurement_results').select('*');
      if (filters.player_id) q = q.eq('player_id', filters.player_id);
      if (filters.session_id) q = q.eq('session_id', filters.session_id);
      const { data } = await q;
      return data || [];
    }

    async function fetchAllResultsWithSessions() {
      if (demoMode) {
        return demoData.results.map(r => ({
          ...r,
          session: demoData.sessions.find(s => s.id === r.session_id)
        }));
      }
      const { data } = await supabase
        .from('measurement_results')
        .select('*, measurement_sessions(date)')
        .order('measurement_sessions(date)', { ascending: true });
      return (data || []).map(r => ({
        ...r,
        session: { date: r.measurement_sessions?.date }
      }));
    }

    async function fetchPlayerResults(playerId) {
      if (demoMode) {
        return demoData.results
          .filter(r => r.player_id === playerId)
          .map(r => ({ ...r, session: demoData.sessions.find(s => s.id === r.session_id) }))
          .sort((a, b) => a.session.date.localeCompare(b.session.date));
      }
      const { data } = await supabase
        .from('measurement_results')
        .select('*, measurement_sessions(date)')
        .eq('player_id', playerId)
        .order('measurement_sessions(date)', { ascending: true });
      return (data || []).map(r => ({
        ...r,
        session: { date: r.measurement_sessions?.date }
      }));
    }

    // --- Page Routing ---
    function showPage(page) {
      $$('.page').forEach(p => p.classList.remove('active'));
      const el = $('#page-' + page);
      if (el) el.classList.add('active');
    }

    function showSection(section) {
      $$('.section').forEach(s => s.classList.add('hidden'));
      const el = $('#section-' + section);
      if (el) el.classList.remove('hidden');
      // Update nav
      $$('.nav-item').forEach(n => n.classList.remove('active'));
      const navItem = document.querySelector('[data-section="' + section + '"]');
      if (navItem) navItem.classList.add('active');
    }

    // --- Build Navigation ---
    function buildNav() {
      const menu = $('#nav-menu');
      menu.innerHTML = '';
      const role = currentProfile.role;
      const items = [];
      if (role === 'admin' || role === 'staff') {
        items.push({ id: 'input', icon: 'fa-edit', label: 'データ入力' });
        items.push({ id: 'coach-dashboard', icon: 'fa-chart-bar', label: 'ダッシュボード' });
      }
      if (role === 'admin') {
        items.push({ id: 'admin', icon: 'fa-cog', label: '管理設定' });
      }
      items.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'nav-item' + (idx === 0 ? ' active' : '');
        div.dataset.section = item.id;
        div.innerHTML = '<i class="fas ' + item.icon + '"></i><span>' + item.label + '</span>';
        div.addEventListener('click', () => {
          showSection(item.id);
          if (item.id === 'coach-dashboard') loadCoachDashboard();
          if (item.id === 'admin') loadAdminSection();
          if (item.id === 'input') loadInputSection();
        });
        menu.appendChild(div);
      });

      $('#nav-user-name').textContent = currentProfile.name;
      const roleLabels = { admin: 'Admin', staff: 'Staff', player: 'Player' };
      $('#nav-user-role').textContent = roleLabels[currentProfile.role] || '';
    }

    // --- Input Section ---
    async function loadInputSection() {
      await Promise.all([fetchMeasurementItems(), fetchPlayers(), fetchSessions()]);
      // Populate sessions
      const sessSelect = $('#input-session-select');
      sessSelect.innerHTML = '<option value="">セッションを選択...</option>';
      sessions.forEach(s => {
        sessSelect.innerHTML += '<option value="' + s.id + '">' + formatDate(s.date) + '</option>';
      });
      // Populate players
      const playerSelect = $('#input-player-select');
      playerSelect.innerHTML = '<option value="">選手を選択...</option>';
      players.forEach(p => {
        playerSelect.innerHTML += '<option value="' + p.id + '">' + p.name + '</option>';
      });
      $('#input-form-container').classList.add('hidden');
    }

    function buildInputFields() {
      const container = $('#input-fields');
      container.innerHTML = '';
      measurementItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'bg-gray-50 rounded-xl p-4';
        div.innerHTML = 
          '<label class="block text-sm font-medium text-gray-600 mb-1">' + item.name + ' <span class="text-gray-400">(' + item.unit + ')</span></label>' +
          '<input type="number" step="0.01" id="input-val-' + item.id + '" data-item-id="' + item.id + '" ' +
          'class="input-field text-2xl font-bold text-center numpad-input" placeholder="0.00" inputmode="decimal">';
        container.appendChild(div);
      });
      // Numpad targeting
      $$('.numpad-input').forEach(input => {
        input.addEventListener('focus', () => {
          activeNumpadField = input;
          const item = measurementItems.find(i => i.id === input.dataset.itemId);
          $('#numpad-target-label').textContent = item ? item.name : '';
          $('#numpad-display').textContent = input.value || '-';
        });
      });
    }

    async function loadExistingResults(sessionId, playerId) {
      const results = await fetchResults({ session_id: sessionId, player_id: playerId });
      results.forEach(r => {
        const el = $('#input-val-' + r.item_id);
        if (el) el.value = r.value;
      });
    }

    async function saveInputData() {
      const sessionId = $('#input-session-select').value;
      const playerId = $('#input-player-select').value;
      if (!sessionId || !playerId) { showToast('セッションと選手を選択してください', 'warning'); return; }

      const results = [];
      measurementItems.forEach(item => {
        const el = $('#input-val-' + item.id);
        const val = parseFloat(el.value);
        if (!isNaN(val)) {
          results.push({ session_id: sessionId, player_id: playerId, item_id: item.id, value: val });
        }
      });

      if (results.length === 0) { showToast('少なくとも1つのデータを入力してください', 'warning'); return; }

      try {
        if (demoMode) {
          results.forEach(r => {
            const existing = demoData.results.find(dr => dr.session_id === r.session_id && dr.player_id === r.player_id && dr.item_id === r.item_id);
            if (existing) { existing.value = r.value; }
            else { demoData.results.push({ ...r, id: 'res-' + Date.now() + Math.random() }); }
          });
        } else {
          for (const r of results) {
            const { data: existing } = await supabase.from('measurement_results')
              .select('id').eq('session_id', r.session_id).eq('player_id', r.player_id).eq('item_id', r.item_id).single();
            if (existing) {
              await supabase.from('measurement_results').update({ value: r.value }).eq('id', existing.id);
            } else {
              await supabase.from('measurement_results').insert(r);
            }
          }
        }
        showToast('データを保存しました');
        // Move to next player
        const playerSelect = $('#input-player-select');
        const currentIdx = playerSelect.selectedIndex;
        if (currentIdx < playerSelect.options.length - 1) {
          playerSelect.selectedIndex = currentIdx + 1;
          playerSelect.dispatchEvent(new Event('change'));
        }
      } catch (e) {
        showToast('保存に失敗しました: ' + e.message, 'error');
      }
    }

    // --- Coach Dashboard ---
    async function loadCoachDashboard() {
      await Promise.all([fetchMeasurementItems(), fetchPlayers(), fetchSessions()]);
      const allResults = await fetchAllResultsWithSessions();

      // Team Summary Cards
      const cardsContainer = $('#team-summary-cards');
      cardsContainer.innerHTML = '';
      measurementItems.forEach(item => {
        const itemResults = allResults.filter(r => r.item_id === item.id);
        const latestSession = sessions[0];
        const prevSession = sessions[1];
        let latestAvg = null, prevAvg = null, diff = null;
        if (latestSession) {
          const latestVals = itemResults.filter(r => r.session_id === latestSession.id).map(r => r.value);
          if (latestVals.length > 0) latestAvg = latestVals.reduce((a, b) => a + b, 0) / latestVals.length;
        }
        if (prevSession) {
          const prevVals = itemResults.filter(r => r.session_id === prevSession.id).map(r => r.value);
          if (prevVals.length > 0) prevAvg = prevVals.reduce((a, b) => a + b, 0) / prevVals.length;
        }
        if (latestAvg != null && prevAvg != null) diff = latestAvg - prevAvg;
        cardsContainer.innerHTML += 
          '<div class="stat-card">' +
            '<div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">' + item.name + '</div>' +
            '<div class="text-2xl font-bold text-gray-800">' + (latestAvg != null ? latestAvg.toFixed(1) : '-') + '</div>' +
            '<div class="text-xs text-gray-500">' + item.unit + '</div>' +
            '<div class="mt-2 text-sm">' + formatDiff(diff, item.is_inverted) + '</div>' +
          '</div>';
      });

      // Team Chart Tabs
      const tabsContainer = $('#team-chart-tabs');
      tabsContainer.innerHTML = '';
      measurementItems.forEach((item, idx) => {
        const btn = document.createElement('button');
        btn.className = 'tab-btn' + (idx === 0 ? ' active' : '');
        btn.textContent = item.name;
        btn.addEventListener('click', () => {
          tabsContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          drawTeamChart(item, allResults);
        });
        tabsContainer.appendChild(btn);
      });
      if (measurementItems.length > 0) drawTeamChart(measurementItems[0], allResults);

      // Player Alert List
      buildPlayerAlertList(allResults);
    }

    function drawTeamChart(item, allResults) {
      const sortedSessions = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
      const labels = sortedSessions.map(s => formatDate(s.date));
      const avgData = sortedSessions.map(s => {
        const vals = allResults.filter(r => r.session_id === s.id && r.item_id === item.id).map(r => r.value);
        return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
      });

      if (teamChartInstance) teamChartInstance.destroy();
      const ctx = document.getElementById('team-avg-chart').getContext('2d');
      teamChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: item.name + ' (チーム平均)',
            data: avgData,
            borderColor: '#0ea5e9',
            backgroundColor: 'rgba(14,165,233,0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 6,
            pointBackgroundColor: '#0ea5e9',
            borderWidth: 3,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              reverse: item.is_inverted,
              title: { display: true, text: item.unit, font: { weight: 'bold' } },
              grid: { color: 'rgba(0,0,0,0.05)' }
            },
            x: { grid: { display: false } }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => item.name + ': ' + (ctx.parsed.y != null ? ctx.parsed.y.toFixed(2) : '-') + ' ' + item.unit
              }
            }
          }
        }
      });
    }

    function buildPlayerAlertList(allResults) {
      const container = $('#player-alert-list');
      container.innerHTML = '';
      const latestSession = sessions[0];
      const prevSession = sessions[1];
      if (!latestSession) { container.innerHTML = '<p class="text-gray-400 text-center py-4">データがありません</p>'; return; }

      players.forEach(player => {
        const row = document.createElement('div');
        row.className = 'player-row p-4 rounded-lg cursor-pointer';
        let badges = '';
        measurementItems.forEach(item => {
          const latestVal = allResults.find(r => r.session_id === latestSession.id && r.player_id === player.id && r.item_id === item.id)?.value;
          const prevVal = prevSession ? allResults.find(r => r.session_id === prevSession.id && r.player_id === player.id && r.item_id === item.id)?.value : null;
          const diff = (latestVal != null && prevVal != null) ? latestVal - prevVal : null;
          badges += '<div class="text-center"><div class="text-xs text-gray-400 mb-1">' + item.name + '</div>' +
            '<div class="text-sm font-medium">' + (latestVal != null ? latestVal.toFixed(1) : '-') + '</div>' +
            '<div>' + formatDiffBadge(diff, item.is_inverted) + '</div></div>';
        });
        row.innerHTML = 
          '<div class="flex items-center gap-4">' +
            '<div class="w-10 h-10 rounded-full gradient-bg text-white flex items-center justify-center font-bold text-sm">' + player.name.charAt(0) + '</div>' +
            '<div class="flex-1">' +
              '<div class="font-medium text-gray-800">' + player.name + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">' + badges + '</div>';
        row.addEventListener('click', () => showPlayerDetail(player.id, allResults));
        container.appendChild(row);
      });
    }

    async function showPlayerDetail(playerId, allResults) {
      showSection('player-detail');
      const player = players.find(p => p.id === playerId);
      if (!player) return;

      $('#player-detail-header').innerHTML = 
        '<div class="flex items-center gap-4">' +
          '<div class="w-14 h-14 rounded-full gradient-bg text-white flex items-center justify-center font-bold text-xl">' + player.name.charAt(0) + '</div>' +
          '<div><h3 class="text-xl font-bold text-gray-800">' + player.name + '</h3><p class="text-gray-500">個人成績推移</p></div>' +
        '</div>';

      const chartsContainer = $('#player-detail-charts');
      chartsContainer.innerHTML = '';
      Object.values(playerChartInstances).forEach(c => c.destroy());
      playerChartInstances = {};

      const playerResults = allResults ? allResults.filter(r => r.player_id === playerId) : await fetchPlayerResults(playerId);
      const sortedSessions = [...sessions].sort((a, b) => a.date.localeCompare(b.date));

      measurementItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card p-5';
        const canvasId = 'detail-chart-' + item.id;
        card.innerHTML = '<h4 class="font-bold text-gray-700 mb-3">' + item.name + ' (' + item.unit + ')' + (item.is_inverted ? ' <span class="text-xs text-gray-400">※小さいほど良い</span>' : '') + '</h4><canvas id="' + canvasId + '" height="200"></canvas>';
        chartsContainer.appendChild(card);

        const labels = sortedSessions.map(s => formatDate(s.date));
        const values = sortedSessions.map(s => {
          const r = playerResults.find(r => r.session_id === s.id && r.item_id === item.id);
          return r ? r.value : null;
        });

        const ctx = document.getElementById(canvasId).getContext('2d');
        playerChartInstances[item.id] = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: item.name,
              data: values,
              borderColor: '#0ea5e9',
              backgroundColor: 'rgba(14,165,233,0.1)',
              fill: true,
              tension: 0.4,
              pointRadius: 6,
              pointBackgroundColor: '#0ea5e9',
              borderWidth: 3,
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                reverse: item.is_inverted,
                title: { display: true, text: item.unit },
                grid: { color: 'rgba(0,0,0,0.05)' }
              },
              x: { grid: { display: false } }
            },
            plugins: { legend: { display: false } }
          }
        });
      });
    }

    // --- Player Dashboard ---
    async function loadPlayerDashboard() {
      await fetchMeasurementItems();
      await fetchSessions();
      const results = await fetchPlayerResults(currentUser.id);

      $('#player-greeting').textContent = currentProfile.name + ' さん';

      // Latest Results
      const latestContainer = $('#player-latest-results');
      latestContainer.innerHTML = '';
      const sortedSessions = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
      const latestSession = sessions[0]; // most recent (desc sorted)
      const prevSession = sessions[1];

      measurementItems.forEach(item => {
        const latestResult = results.find(r => r.session_id === latestSession?.id && r.item_id === item.id);
        const prevResult = prevSession ? results.find(r => r.session_id === prevSession?.id && r.item_id === item.id) : null;
        const diff = (latestResult && prevResult) ? latestResult.value - prevResult.value : null;

        latestContainer.innerHTML += 
          '<div class="bg-gray-50 rounded-xl p-4 text-center">' +
            '<div class="text-xs font-bold text-gray-400 uppercase tracking-wider">' + item.name + '</div>' +
            '<div class="text-3xl font-bold text-gray-800 mt-1">' + (latestResult ? latestResult.value.toFixed(1) : '-') + '</div>' +
            '<div class="text-xs text-gray-500">' + item.unit + '</div>' +
            '<div class="mt-1">' + formatDiff(diff, item.is_inverted) + '</div>' +
          '</div>';
      });

      // Charts
      const chartsContainer = $('#player-charts-container');
      chartsContainer.innerHTML = '';
      Object.values(playerChartInstances).forEach(c => c.destroy());
      playerChartInstances = {};

      measurementItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card p-5 fade-in';
        const canvasId = 'player-chart-' + item.id;
        card.innerHTML = 
          '<div class="flex items-center justify-between mb-3">' +
            '<h4 class="font-bold text-gray-700">' + item.name + '</h4>' +
            '<span class="text-xs text-gray-400">' + item.unit + (item.is_inverted ? '（小さいほど良い）' : '') + '</span>' +
          '</div>' +
          '<canvas id="' + canvasId + '" height="200"></canvas>';
        chartsContainer.appendChild(card);

        const labels = sortedSessions.map(s => formatDate(s.date));
        const values = sortedSessions.map(s => {
          const r = results.find(r => r.session_id === s.id && r.item_id === item.id);
          return r ? r.value : null;
        });

        const ctx = document.getElementById(canvasId).getContext('2d');
        playerChartInstances[item.id] = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: item.name,
              data: values,
              borderColor: '#0ea5e9',
              backgroundColor: 'rgba(14,165,233,0.1)',
              fill: true,
              tension: 0.4,
              pointRadius: 6,
              pointBackgroundColor: '#0ea5e9',
              borderWidth: 3,
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                reverse: item.is_inverted,
                title: { display: true, text: item.unit },
                grid: { color: 'rgba(0,0,0,0.05)' }
              },
              x: {
                grid: { display: false },
                ticks: { maxRotation: 45 }
              }
            },
            plugins: { legend: { display: false } }
          }
        });
      });
    }

    // --- Admin Section ---
    async function loadAdminSection() {
      await Promise.all([fetchAllProfiles(), fetchMeasurementItems()]);
      const allItems = await fetchAllItems();
      buildUserList();
      buildItemList(allItems);
    }

    function buildUserList() {
      const container = $('#user-list');
      container.innerHTML = '';
      const roleLabels = { admin: 'Admin', staff: 'Staff', player: 'Player' };
      const roleColors = { admin: 'bg-purple-100 text-purple-700', staff: 'bg-blue-100 text-blue-700', player: 'bg-green-100 text-green-700' };
      allProfiles.forEach(p => {
        container.innerHTML += 
          '<div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">' +
            '<div class="flex items-center gap-3">' +
              '<div class="w-10 h-10 rounded-full gradient-bg text-white flex items-center justify-center font-bold text-sm">' + (p.name || '?').charAt(0) + '</div>' +
              '<div>' +
                '<div class="font-medium text-gray-800">' + (p.name || 'Unnamed') + '</div>' +
                '<div class="text-sm text-gray-500">' + (p.email || p.id) + '</div>' +
              '</div>' +
            '</div>' +
            '<div class="flex items-center gap-2">' +
              '<span class="px-3 py-1 rounded-full text-xs font-bold ' + (roleColors[p.role] || '') + '">' + (roleLabels[p.role] || p.role) + '</span>' +
              '<button class="btn-reset-pw text-sm text-primary-600 hover:underline" data-user-id="' + p.id + '" data-user-name="' + (p.name || '') + '"><i class="fas fa-key"></i></button>' +
            '</div>' +
          '</div>';
      });
      // Reset password handlers
      container.querySelectorAll('.btn-reset-pw').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          $('#reset-pw-user-id').value = btn.dataset.userId;
          $('#reset-pw-user-name').textContent = btn.dataset.userName;
          $('#modal-reset-password').classList.remove('hidden');
        });
      });
    }

    function buildItemList(items) {
      const container = $('#item-list');
      container.innerHTML = '';
      items.forEach(item => {
        container.innerHTML += 
          '<div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">' +
            '<div class="flex items-center gap-3">' +
              '<div class="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center"><i class="fas fa-ruler"></i></div>' +
              '<div>' +
                '<div class="font-medium text-gray-800">' + item.name + ' <span class="text-gray-400">(' + item.unit + ')</span></div>' +
                '<div class="text-xs text-gray-500">' +
                  (item.is_inverted ? '<span class="text-amber-600"><i class="fas fa-exchange-alt mr-1"></i>Y軸反転</span> ' : '') +
                  (item.is_active ? '<span class="text-green-600"><i class="fas fa-check mr-1"></i>有効</span>' : '<span class="text-red-500"><i class="fas fa-times mr-1"></i>無効</span>') +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="flex gap-2">' +
              '<button class="btn-edit-item text-primary-600 hover:text-primary-800 p-2" data-item-id="' + item.id + '"><i class="fas fa-edit"></i></button>' +
              '<button class="btn-delete-item text-red-400 hover:text-red-600 p-2" data-item-id="' + item.id + '"><i class="fas fa-trash"></i></button>' +
            '</div>' +
          '</div>';
      });
      // Edit handlers
      container.querySelectorAll('.btn-edit-item').forEach(btn => {
        btn.addEventListener('click', () => {
          const item = items.find(i => i.id === btn.dataset.itemId);
          if (!item) return;
          $('#modal-item-title').textContent = '測定項目編集';
          $('#edit-item-id').value = item.id;
          $('#item-name').value = item.name;
          $('#item-unit').value = item.unit;
          $('#item-inverted').checked = item.is_inverted;
          $('#item-active').checked = item.is_active;
          $('#modal-add-item').classList.remove('hidden');
        });
      });
      // Delete handlers
      container.querySelectorAll('.btn-delete-item').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('この測定項目を削除しますか？')) return;
          const itemId = btn.dataset.itemId;
          if (demoMode) {
            demoData.items = demoData.items.filter(i => i.id !== itemId);
          } else {
            await supabase.from('measurement_items').delete().eq('id', itemId);
          }
          showToast('項目を削除しました');
          loadAdminSection();
        });
      });
    }

    // --- Admin Actions ---
    async function createUser() {
      const name = $('#new-user-name').value.trim();
      const email = $('#new-user-email').value.trim();
      const password = $('#new-user-password').value;
      const role = $('#new-user-role').value;
      if (!name || !email || !password) { showToast('全項目を入力してください', 'warning'); return; }
      if (password.length < 6) { showToast('パスワードは6文字以上にしてください', 'warning'); return; }

      try {
        if (demoMode) {
          const newId = 'user-' + Date.now();
          demoData.profiles.push({ id: newId, name, email, role });
          showToast('ユーザーを追加しました（デモ）');
        } else {
          // Use Supabase Auth admin API via service role or invite
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name, role } }
          });
          if (error) throw error;
          // Insert profile
          if (data.user) {
            await supabase.from('profiles').upsert({
              id: data.user.id, name, role, email
            });
          }
          showToast('ユーザーを追加しました');
        }
        $('#modal-add-user').classList.add('hidden');
        loadAdminSection();
      } catch (e) {
        showToast('エラー: ' + e.message, 'error');
      }
    }

    async function saveItem() {
      const id = $('#edit-item-id').value;
      const name = $('#item-name').value.trim();
      const unit = $('#item-unit').value.trim();
      const is_inverted = $('#item-inverted').checked;
      const is_active = $('#item-active').checked;
      if (!name || !unit) { showToast('項目名と単位を入力してください', 'warning'); return; }

      try {
        if (demoMode) {
          if (id) {
            const item = demoData.items.find(i => i.id === id);
            if (item) { Object.assign(item, { name, unit, is_inverted, is_active }); }
          } else {
            demoData.items.push({ id: 'item-' + Date.now(), name, unit, is_inverted, is_active, sort_order: demoData.items.length });
          }
        } else {
          if (id) {
            await supabase.from('measurement_items').update({ name, unit, is_inverted, is_active }).eq('id', id);
          } else {
            await supabase.from('measurement_items').insert({ name, unit, is_inverted, is_active });
          }
        }
        showToast('保存しました');
        $('#modal-add-item').classList.add('hidden');
        loadAdminSection();
      } catch (e) {
        showToast('エラー: ' + e.message, 'error');
      }
    }

    async function createSession() {
      const date = $('#new-session-date').value;
      if (!date) { showToast('日付を入力してください', 'warning'); return; }
      try {
        if (demoMode) {
          demoData.sessions.push({ id: 'session-' + Date.now(), date, recorded_by: currentUser.id });
        } else {
          await supabase.from('measurement_sessions').insert({ date, recorded_by: currentUser.id });
        }
        showToast('セッションを作成しました');
        $('#modal-new-session').classList.add('hidden');
        loadInputSection();
      } catch (e) {
        showToast('エラー: ' + e.message, 'error');
      }
    }

    async function resetPassword() {
      const userId = $('#reset-pw-user-id').value;
      const newPassword = $('#reset-pw-new').value;
      if (!newPassword || newPassword.length < 6) { showToast('パスワードは6文字以上にしてください', 'warning'); return; }
      try {
        if (demoMode) {
          showToast('パスワードをリセットしました（デモ）');
        } else {
          // This requires service_role key - would need a server-side function
          // For now using client-side as demo
          showToast('パスワードリセットにはサーバーサイド機能が必要です', 'warning');
        }
        $('#modal-reset-password').classList.add('hidden');
      } catch (e) {
        showToast('エラー: ' + e.message, 'error');
      }
    }

    // --- Numpad ---
    function handleNumpad(key) {
      if (!activeNumpadField) return;
      let val = activeNumpadField.value;
      if (key === 'backspace') {
        val = val.slice(0, -1);
      } else if (key === 'clear') {
        val = '';
      } else if (key === 'enter') {
        // Move to next field
        const fields = [...$$('.numpad-input')];
        const idx = fields.indexOf(activeNumpadField);
        if (idx < fields.length - 1) fields[idx + 1].focus();
        return;
      } else if (key === '.') {
        if (!val.includes('.')) val += '.';
      } else {
        val += key;
      }
      activeNumpadField.value = val;
      $('#numpad-display').textContent = val || '-';
    }

    // --- Event Listeners ---
    function initEvents() {
      // Login
      $('#login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = $('#login-btn');
        btn.disabled = true;
        btn.innerHTML = '<div class="loading-spinner mx-auto" style="border-color:rgba(255,255,255,0.3);border-top-color:white;"></div>';
        try {
          await handleLogin($('#login-email').value, $('#login-password').value);
          await initApp();
        } catch (err) {
          const errDiv = $('#login-error');
          errDiv.classList.remove('hidden');
          errDiv.querySelector('span').textContent = err.message || 'ログインに失敗しました';
        } finally {
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>ログイン';
        }
      });

      // Logout
      $('#logout-btn')?.addEventListener('click', handleLogout);
      $('#player-logout-btn')?.addEventListener('click', handleLogout);

      // Session/Player selection
      $('#input-player-select').addEventListener('change', async () => {
        const playerId = $('#input-player-select').value;
        const sessionId = $('#input-session-select').value;
        if (playerId && sessionId) {
          const player = players.find(p => p.id === playerId);
          $('#input-player-name').textContent = player?.name || '';
          $('#input-form-container').classList.remove('hidden');
          buildInputFields();
          await loadExistingResults(sessionId, playerId);
          // Focus first field
          const firstField = document.querySelector('.numpad-input');
          if (firstField) firstField.focus();
        } else {
          $('#input-form-container').classList.add('hidden');
        }
      });

      $('#input-session-select').addEventListener('change', () => {
        $('#input-player-select').dispatchEvent(new Event('change'));
      });

      // Save input
      $('#btn-save-input').addEventListener('click', saveInputData);

      // New session
      $('#btn-new-session').addEventListener('click', () => {
        $('#new-session-date').value = new Date().toISOString().split('T')[0];
        $('#modal-new-session').classList.remove('hidden');
      });
      $('#btn-create-session').addEventListener('click', createSession);

      // Numpad
      $$('.numpad-btn').forEach(btn => {
        btn.addEventListener('click', () => handleNumpad(btn.dataset.key));
      });

      // Admin tabs
      $$('[data-admin-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
          $$('[data-admin-tab]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          $$('.admin-tab-content').forEach(c => c.classList.add('hidden'));
          $('#admin-tab-' + btn.dataset.adminTab).classList.remove('hidden');
        });
      });

      // Add user
      $('#btn-add-user').addEventListener('click', () => {
        $('#new-user-name').value = '';
        $('#new-user-email').value = '';
        $('#new-user-password').value = '';
        $('#new-user-role').value = 'player';
        $('#modal-add-user').classList.remove('hidden');
      });
      $('#btn-create-user').addEventListener('click', createUser);

      // Add item
      $('#btn-add-item').addEventListener('click', () => {
        $('#modal-item-title').textContent = '測定項目追加';
        $('#edit-item-id').value = '';
        $('#item-name').value = '';
        $('#item-unit').value = '';
        $('#item-inverted').checked = false;
        $('#item-active').checked = true;
        $('#modal-add-item').classList.remove('hidden');
      });
      $('#btn-save-item').addEventListener('click', saveItem);

      // Reset password
      $('#btn-confirm-reset-pw').addEventListener('click', resetPassword);

      // Back to list
      $('#btn-back-to-list').addEventListener('click', () => {
        showSection('coach-dashboard');
        loadCoachDashboard();
      });

      // Modal close
      $$('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
          btn.closest('[id^="modal-"]').classList.add('hidden');
        });
      });

      // Close modal on backdrop
      $$('[id^="modal-"]').forEach(modal => {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) modal.classList.add('hidden');
        });
      });
    }

    // --- Init App ---
    async function initApp() {
      if (!currentProfile) return;
      const role = currentProfile.role;

      if (role === 'player') {
        showPage('player');
        await loadPlayerDashboard();
      } else {
        showPage('app');
        buildNav();
        showSection('input');
        await loadInputSection();
      }
    }

    // --- Boot ---
    async function boot() {
      initEvents();

      if (!supabase) {
        // No Supabase configured - enter demo mode
        initDemoMode();
        $('#loading-screen').style.display = 'none';
        showPage('login');
        // Auto-fill demo credentials
        $('#login-email').value = 'admin@regain.com';
        $('#login-password').value = 'demo123';
        return;
      }

      // Check existing session
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          currentUser = session.user;
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          if (profile) {
            currentProfile = profile;
            await initApp();
            $('#loading-screen').style.display = 'none';
            return;
          }
        }
      } catch (e) {
        console.error('Session check error:', e);
      }

      $('#loading-screen').style.display = 'none';
      showPage('login');
    }

    boot();
  })();
  </script>
</body>
</html>`)
})

export default app
