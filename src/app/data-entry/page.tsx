'use client';

import { useState, useEffect, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/lib/auth-context';
import {
  getPlayers,
  getMeasurementItems,
  getMeasurementSessions,
  createMeasurementSession,
  upsertMeasurementResult,
  getMeasurementResults,
} from '@/lib/data';
import { Profile, MeasurementItem, MeasurementSession } from '@/lib/types';
import {
  Save,
  ChevronRight,
  ChevronLeft,
  Check,
  CalendarDays,
  UserCircle,
  Plus,
} from 'lucide-react';

export default function DataEntryPage() {
  const { user } = useAuth();
  const [players, setPlayers] = useState<Profile[]>([]);
  const [items, setItems] = useState<MeasurementItem[]>([]);
  const [sessions, setSessions] = useState<MeasurementSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<MeasurementSession | null>(null);
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedPlayers, setSavedPlayers] = useState<Set<string>>(new Set());
  const [newSessionDate, setNewSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [showNewSession, setShowNewSession] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [p, i, s] = await Promise.all([
        getPlayers(),
        getMeasurementItems(true),
        getMeasurementSessions(),
      ]);
      setPlayers(p);
      setItems(i);
      setSessions(s);
      if (s.length > 0 && !selectedSession) {
        setSelectedSession(s[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load existing values when session or player changes
  useEffect(() => {
    if (!selectedSession || players.length === 0) return;
    const player = players[selectedPlayerIndex];
    if (!player) return;

    getMeasurementResults({ session_id: selectedSession.id, player_id: player.id })
      .then(results => {
        const vals: Record<string, string> = {};
        results.forEach(r => {
          vals[r.item_id] = String(r.value);
        });
        setValues(vals);
      })
      .catch(console.error);
  }, [selectedSession, selectedPlayerIndex, players]);

  const currentPlayer = players[selectedPlayerIndex];

  async function handleSave() {
    if (!selectedSession || !currentPlayer || !user) return;
    setSaving(true);
    try {
      for (const item of items) {
        const val = values[item.id];
        if (val && val !== '') {
          await upsertMeasurementResult({
            session_id: selectedSession.id,
            player_id: currentPlayer.id,
            item_id: item.id,
            value: parseFloat(val),
          });
        }
      }
      setSaved(true);
      setSavedPlayers(prev => new Set(prev).add(currentPlayer.id));
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAndNext() {
    await handleSave();
    if (selectedPlayerIndex < players.length - 1) {
      setSelectedPlayerIndex(prev => prev + 1);
      setValues({});
    }
  }

  async function handleCreateSession() {
    if (!user) return;
    try {
      const newSession = await createMeasurementSession({
        date: newSessionDate,
        recorded_by: user.id,
      });
      setSessions(prev => [newSession, ...prev]);
      setSelectedSession(newSession);
      setShowNewSession(false);
    } catch (err) {
      console.error(err);
    }
  }

  function handleNumpad(itemId: string, key: string) {
    setValues(prev => {
      const current = prev[itemId] || '';
      if (key === 'backspace') {
        return { ...prev, [itemId]: current.slice(0, -1) };
      }
      if (key === '.' && current.includes('.')) return prev;
      return { ...prev, [itemId]: current + key };
    });
  }

  if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
    return (
      <AppShell>
        <div className="text-center py-12 text-slate-500">アクセス権限がありません</div>
      </AppShell>
    );
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
      <div className="max-w-6xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4">データ入力</h1>

        {/* Session Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <CalendarDays size={20} className="text-blue-600" />
            <span className="font-medium text-slate-700">測定日:</span>
            {selectedSession ? (
              <select
                value={selectedSession.id}
                onChange={e => {
                  const s = sessions.find(s => s.id === e.target.value);
                  if (s) setSelectedSession(s);
                }}
                className="px-3 py-2 border border-slate-300 rounded-lg text-base"
              >
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>{s.date}</option>
                ))}
              </select>
            ) : (
              <span className="text-slate-400">セッションを作成してください</span>
            )}
            <button
              onClick={() => setShowNewSession(!showNewSession)}
              className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              <Plus size={16} />
              新規測定日
            </button>
          </div>

          {showNewSession && (
            <div className="mt-3 flex items-center gap-3 pt-3 border-t border-slate-200">
              <input
                type="date"
                value={newSessionDate}
                onChange={e => setNewSessionDate(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-base"
              />
              <button
                onClick={handleCreateSession}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
              >
                作成
              </button>
            </div>
          )}
        </div>

        {selectedSession && (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
            {/* Player List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3">
              <h3 className="font-medium text-slate-700 mb-2 flex items-center gap-2">
                <UserCircle size={18} />
                選手一覧
              </h3>
              <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                {players.map((player, index) => (
                  <button
                    key={player.id}
                    onClick={() => {
                      setSelectedPlayerIndex(index);
                      setValues({});
                    }}
                    className={`w-full text-left px-3 py-3 rounded-lg text-sm font-medium transition flex items-center justify-between ${
                      index === selectedPlayerIndex
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span>{player.name}</span>
                    {savedPlayers.has(player.id) && (
                      <Check size={16} className="text-green-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
              {currentPlayer && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-slate-800">
                      {currentPlayer.name}
                    </h2>
                    <span className="text-sm text-slate-400">
                      {selectedPlayerIndex + 1} / {players.length}
                    </span>
                  </div>

                  <div className="space-y-6">
                    {items.map(item => (
                      <div key={item.id} className="border border-slate-200 rounded-xl p-4">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          {item.name}
                          <span className="ml-2 text-slate-400 font-normal">({item.unit})</span>
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={values[item.id] || ''}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                setValues(prev => ({ ...prev, [item.id]: val }));
                              }
                            }}
                            className="w-full text-2xl sm:text-3xl font-mono px-4 py-3 border-2 border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-center"
                            placeholder="0.00"
                          />
                          <span className="text-lg text-slate-500 font-medium whitespace-nowrap">
                            {item.unit}
                          </span>
                        </div>
                        {/* Numpad for iPad */}
                        <div className="grid grid-cols-4 gap-2 mt-3">
                          {['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.', 'backspace'].map(key => (
                            <button
                              key={key}
                              onClick={() => handleNumpad(item.id, key)}
                              className={`py-3 rounded-lg text-lg font-medium transition ${
                                key === 'backspace'
                                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {key === 'backspace' ? '⌫' : key}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <button
                      onClick={() => {
                        if (selectedPlayerIndex > 0) {
                          setSelectedPlayerIndex(prev => prev - 1);
                          setValues({});
                        }
                      }}
                      disabled={selectedPlayerIndex === 0}
                      className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-30 text-base"
                    >
                      <ChevronLeft size={18} />
                      前の選手
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 text-base font-medium"
                    >
                      {saving ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      ) : saved ? (
                        <>
                          <Check size={18} />
                          保存完了
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          保存
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleSaveAndNext}
                      disabled={saving || selectedPlayerIndex >= players.length - 1}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 text-lg font-bold"
                    >
                      <Save size={18} />
                      保存して次へ
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
