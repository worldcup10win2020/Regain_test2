'use client';

import { useState, useEffect, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/lib/auth-context';
import {
  getProfiles,
  createProfile,
  getMeasurementItems,
  createMeasurementItem,
  updateMeasurementItem,
  deleteMeasurementItem,
} from '@/lib/data';
import { Profile, MeasurementItem } from '@/lib/types';
import {
  UserPlus,
  Settings,
  Edit3,
  Trash2,
  Plus,
  Save,
  X,
  Users,
  Ruler,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'users' | 'items'>('users');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [items, setItems] = useState<MeasurementItem[]>([]);
  const [loading, setLoading] = useState(true);

  // User form state
  const [showUserForm, setShowUserForm] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'player', password: '' });

  // Item form state
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MeasurementItem | null>(null);
  const [itemForm, setItemForm] = useState({ name: '', unit: '', is_inverted: false, is_active: true, sort_order: 0 });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [p, i] = await Promise.all([getProfiles(), getMeasurementItems()]);
      setProfiles(p);
      setItems(i);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!user || user.role !== 'admin') {
    return (
      <AppShell>
        <div className="text-center py-12 text-slate-500">管理者権限が必要です</div>
      </AppShell>
    );
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createProfile(userForm);
      setShowUserForm(false);
      setUserForm({ name: '', email: '', role: 'player', password: '' });
      loadData();
    } catch (err) {
      console.error(err);
      alert('ユーザー作成に失敗しました');
    }
  }

  async function handleResetPassword(profile: Profile) {
    const newPassword = prompt(`${profile.name} の新しいパスワードを入力してください:`);
    if (!newPassword) return;
    try {
      // In production, use Supabase Admin API
      alert(`パスワードをリセットしました（デモモードでは実際にはリセットされません）`);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateMeasurementItem(editingItem.id, itemForm);
      } else {
        await createMeasurementItem(itemForm);
      }
      setShowItemForm(false);
      setEditingItem(null);
      setItemForm({ name: '', unit: '', is_inverted: false, is_active: true, sort_order: 0 });
      loadData();
    } catch (err) {
      console.error(err);
      alert('保存に失敗しました');
    }
  }

  async function handleDeleteItem(item: MeasurementItem) {
    if (!confirm(`「${item.name}」を削除しますか？`)) return;
    try {
      await deleteMeasurementItem(item.id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleToggleItemActive(item: MeasurementItem) {
    try {
      await updateMeasurementItem(item.id, { is_active: !item.is_active });
      loadData();
    } catch (err) {
      console.error(err);
    }
  }

  function startEditItem(item: MeasurementItem) {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      unit: item.unit,
      is_inverted: item.is_inverted,
      is_active: item.is_active,
      sort_order: item.sort_order,
    });
    setShowItemForm(true);
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Settings size={24} className="text-blue-600" />
          管理設定
        </h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setTab('users')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
              tab === 'users' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users size={16} />
            ユーザー管理
          </button>
          <button
            onClick={() => setTab('items')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
              tab === 'items' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Ruler size={16} />
            測定項目管理
          </button>
        </div>

        {/* User Management */}
        {tab === 'users' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-700">ユーザー一覧</h2>
              <button
                onClick={() => setShowUserForm(!showUserForm)}
                className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                <UserPlus size={16} />
                新規追加
              </button>
            </div>

            {showUserForm && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4">
                <h3 className="font-medium text-slate-700 mb-3">新規ユーザー追加</h3>
                <form onSubmit={handleCreateUser} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="名前"
                      value={userForm.name}
                      onChange={e => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="px-3 py-2 border border-slate-300 rounded-lg"
                    />
                    <input
                      type="email"
                      placeholder="メールアドレス"
                      value={userForm.email}
                      onChange={e => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                      className="px-3 py-2 border border-slate-300 rounded-lg"
                    />
                    <select
                      value={userForm.role}
                      onChange={e => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                      className="px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="player">選手 (Player)</option>
                      <option value="staff">スタッフ (Staff)</option>
                      <option value="admin">管理者 (Admin)</option>
                    </select>
                    <input
                      type="password"
                      placeholder="パスワード"
                      value={userForm.password}
                      onChange={e => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                      required
                      className="px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                      <Save size={16} />
                      保存
                    </button>
                    <button type="button" onClick={() => setShowUserForm(false)} className="flex items-center gap-1 px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">
                      <X size={16} />
                      キャンセル
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="hidden sm:grid grid-cols-[1fr_1fr_120px_100px] gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500">
                <div>名前</div>
                <div>メール</div>
                <div>権限</div>
                <div>操作</div>
              </div>
              {profiles.map(profile => (
                <div key={profile.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_120px_100px] gap-2 px-4 py-3 border-b border-slate-100 items-center">
                  <div className="font-medium text-slate-700">{profile.name}</div>
                  <div className="text-sm text-slate-500">{profile.email || '-'}</div>
                  <div>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      profile.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      profile.role === 'staff' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {profile.role === 'admin' ? '管理者' : profile.role === 'staff' ? 'スタッフ' : '選手'}
                    </span>
                  </div>
                  <div>
                    <button
                      onClick={() => handleResetPassword(profile)}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      PW リセット
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Measurement Item Management */}
        {tab === 'items' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-700">測定項目一覧</h2>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setItemForm({ name: '', unit: '', is_inverted: false, is_active: true, sort_order: items.length + 1 });
                  setShowItemForm(!showItemForm);
                }}
                className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                <Plus size={16} />
                新規追加
              </button>
            </div>

            {showItemForm && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4">
                <h3 className="font-medium text-slate-700 mb-3">
                  {editingItem ? '測定項目の編集' : '新規測定項目の追加'}
                </h3>
                <form onSubmit={handleSaveItem} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="項目名（例: 垂直跳び）"
                      value={itemForm.name}
                      onChange={e => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="px-3 py-2 border border-slate-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="単位（例: cm, 秒, RSI）"
                      value={itemForm.unit}
                      onChange={e => setItemForm(prev => ({ ...prev, unit: e.target.value }))}
                      required
                      className="px-3 py-2 border border-slate-300 rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="表示順序"
                      value={itemForm.sort_order}
                      onChange={e => setItemForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                      className="px-3 py-2 border border-slate-300 rounded-lg"
                    />
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={itemForm.is_inverted}
                          onChange={e => setItemForm(prev => ({ ...prev, is_inverted: e.target.checked }))}
                          className="w-4 h-4 rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">Y軸反転（タイム系）</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={itemForm.is_active}
                          onChange={e => setItemForm(prev => ({ ...prev, is_active: e.target.checked }))}
                          className="w-4 h-4 rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">有効</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                      <Save size={16} />
                      保存
                    </button>
                    <button type="button" onClick={() => { setShowItemForm(false); setEditingItem(null); }} className="flex items-center gap-1 px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">
                      <X size={16} />
                      キャンセル
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="hidden sm:grid grid-cols-[1fr_80px_80px_80px_120px] gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500">
                <div>項目名</div>
                <div>単位</div>
                <div>Y軸反転</div>
                <div>ステータス</div>
                <div>操作</div>
              </div>
              {items.map(item => (
                <div key={item.id} className="grid grid-cols-1 sm:grid-cols-[1fr_80px_80px_80px_120px] gap-2 px-4 py-3 border-b border-slate-100 items-center">
                  <div className="font-medium text-slate-700">{item.name}</div>
                  <div className="text-sm text-slate-500">{item.unit}</div>
                  <div className="text-sm">
                    {item.is_inverted ? (
                      <span className="text-amber-600">反転</span>
                    ) : (
                      <span className="text-slate-400">通常</span>
                    )}
                  </div>
                  <div>
                    <button onClick={() => handleToggleItemActive(item)} className="flex items-center gap-1">
                      {item.is_active ? (
                        <ToggleRight size={20} className="text-green-600" />
                      ) : (
                        <ToggleLeft size={20} className="text-slate-400" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEditItem(item)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
