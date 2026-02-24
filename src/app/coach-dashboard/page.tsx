'use client';

import { useState, useEffect, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/lib/auth-context';
import { getAllPlayersLatestResults, getPlayerMeasurementHistory } from '@/lib/data';
import { Profile, MeasurementItem, MeasurementSession, MeasurementResult } from '@/lib/types';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  ChevronRight,
  ArrowLeft,
  BarChart3,
  AlertTriangle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#8b5cf6', '#ec4899'];
const SIGNIFICANT_CHANGE_THRESHOLD = 0.10; // 10% change

export default function CoachDashboardPage() {
  const { user } = useAuth();
  const [players, setPlayers] = useState<Profile[]>([]);
  const [items, setItems] = useState<MeasurementItem[]>([]);
  const [sessions, setSessions] = useState<MeasurementSession[]>([]);
  const [allResults, setAllResults] = useState<MeasurementResult[]>([]);
  const [latestSession, setLatestSession] = useState<MeasurementSession | null>(null);
  const [previousSession, setPreviousSession] = useState<MeasurementSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<Profile | null>(null);
  const [playerHistory, setPlayerHistory] = useState<{
    items: MeasurementItem[];
    sessions: MeasurementSession[];
    results: MeasurementResult[];
  } | null>(null);
  const [view, setView] = useState<'overview' | 'player'>('overview');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllPlayersLatestResults();
      setPlayers(data.players);
      setItems(data.items);
      setSessions(data.sessions);
      setAllResults(data.results);
      setLatestSession(data.latestSession || null);
      setPreviousSession(data.previousSession || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function selectPlayer(player: Profile) {
    setSelectedPlayer(player);
    setView('player');
    try {
      const history = await getPlayerMeasurementHistory(player.id);
      setPlayerHistory(history);
    } catch (err) {
      console.error(err);
    }
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

  function getPlayerValue(playerId: string, itemId: string, sessionId: string): number | null {
    const result = allResults.find(
      r => r.player_id === playerId && r.item_id === itemId && r.session_id === sessionId
    );
    return result?.value ?? null;
  }

  function getPlayerDiff(playerId: string, itemId: string) {
    if (!latestSession || !previousSession) return null;
    const latest = getPlayerValue(playerId, itemId, latestSession.id);
    const prev = getPlayerValue(playerId, itemId, previousSession.id);
    if (latest === null || prev === null) return null;
    const diff = latest - prev;
    const percentChange = prev !== 0 ? Math.abs(diff / prev) : 0;
    const item = items.find(i => i.id === itemId);
    const isImprovement = item?.is_inverted ? diff < 0 : diff > 0;
    const isSignificant = percentChange >= SIGNIFICANT_CHANGE_THRESHOLD;
    return { diff, isImprovement, isSignificant, latest, prev };
  }

  // Team average per session per item
  function getTeamAverageData(item: MeasurementItem) {
    const sortedSessions = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
    return sortedSessions.map(session => {
      const sessionResults = allResults.filter(
        r => r.session_id === session.id && r.item_id === item.id
      );
      if (sessionResults.length === 0) return null;
      const avg = sessionResults.reduce((sum, r) => sum + r.value, 0) / sessionResults.length;
      return {
        date: session.date.slice(5),
        fullDate: session.date,
        average: Math.round(avg * 100) / 100,
      };
    }).filter(Boolean);
  }

  // Player detail view
  if (view === 'player' && selectedPlayer && playerHistory) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => { setView('overview'); setSelectedPlayer(null); setPlayerHistory(null); }}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft size={18} />
            チーム一覧に戻る
          </button>

          <h1 className="text-xl font-bold text-slate-800 mb-1">{selectedPlayer.name}</h1>
          <p className="text-sm text-slate-500 mb-6">個人測定データ詳細</p>

          <div className="space-y-4">
            {playerHistory.items.map((item, idx) => {
              const chartData = playerHistory.sessions.map(session => {
                const result = playerHistory.results.find(
                  r => r.session_id === session.id && r.item_id === item.id
                );
                return {
                  date: session.date.slice(5),
                  value: result?.value ?? null,
                };
              }).filter(d => d.value !== null);

              // Get diff
              const sortedSessions = [...playerHistory.sessions].sort((a, b) => b.date.localeCompare(a.date));
              let latest: number | null = null;
              let previous: number | null = null;
              for (const session of sortedSessions) {
                const result = playerHistory.results.find(
                  r => r.session_id === session.id && r.item_id === item.id
                );
                if (result) {
                  if (latest === null) latest = result.value;
                  else if (previous === null) { previous = result.value; break; }
                }
              }
              const diff = latest !== null && previous !== null ? latest - previous : null;
              const isImprovement = diff !== null ? (item.is_inverted ? diff < 0 : diff > 0) : null;

              return (
                <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-700">{item.name}</h3>
                    <span className="text-xs text-slate-400">{item.unit}</span>
                  </div>

                  {latest !== null && diff !== null && (
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl font-bold text-slate-800">{latest}</span>
                      <span className="text-sm text-slate-400">{item.unit}</span>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium ${
                        isImprovement ? 'bg-green-50 text-green-700' : diff === 0 ? 'bg-slate-50 text-slate-500' : 'bg-red-50 text-red-700'
                      }`}>
                        {isImprovement ? <TrendingUp size={16} /> : diff === 0 ? <Minus size={16} /> : <TrendingDown size={16} />}
                        <span>{diff > 0 ? '+' : ''}{diff.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {chartData.length > 1 && (
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                          <YAxis reversed={item.is_inverted} tick={{ fontSize: 11, fill: '#94a3b8' }} domain={['auto', 'auto']} />
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          <Tooltip formatter={(value: any) => [`${value} ${item.unit}`, item.name]} />
                          <Line type="monotone" dataKey="value" stroke={COLORS[idx % COLORS.length]} strokeWidth={2.5} dot={{ r: 4, fill: COLORS[idx % COLORS.length] }} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </AppShell>
    );
  }

  // Overview
  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6">コーチダッシュボード</h1>

        {/* Team Average Charts */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-600" />
            チーム平均推移
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item, idx) => {
              const data = getTeamAverageData(item);
              return (
                <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-700 text-sm">{item.name}</h3>
                    <span className="text-xs text-slate-400">{item.unit}</span>
                  </div>
                  {data.length > 1 ? (
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                          <YAxis reversed={item.is_inverted} tick={{ fontSize: 10, fill: '#94a3b8' }} domain={['auto', 'auto']} />
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          <Tooltip formatter={(value: any) => [`${value} ${item.unit}`, 'チーム平均']} />
                          <Line type="monotone" dataKey="average" stroke={COLORS[idx % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 text-center py-8">データ不足</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Player List with alerts */}
        <section>
          <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Users size={20} className="text-blue-600" />
            選手一覧
            {latestSession && (
              <span className="text-xs text-slate-400 font-normal ml-2">
                最新測定: {latestSession.date}
              </span>
            )}
          </h2>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-[200px_repeat(4,1fr)_40px] gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500">
              <div>選手名</div>
              {items.map(item => (
                <div key={item.id} className="text-center">{item.name} ({item.unit})</div>
              ))}
              <div></div>
            </div>

            {/* Player Rows */}
            {players.map(player => {
              const hasAlert = items.some(item => {
                const d = getPlayerDiff(player.id, item.id);
                return d && d.isSignificant;
              });

              return (
                <button
                  key={player.id}
                  onClick={() => selectPlayer(player)}
                  className="w-full text-left grid grid-cols-1 md:grid-cols-[200px_repeat(4,1fr)_40px] gap-2 px-4 py-3 border-b border-slate-100 hover:bg-blue-50/50 transition"
                >
                  <div className="flex items-center gap-2 font-medium text-slate-700">
                    {hasAlert && <AlertTriangle size={14} className="text-amber-500" />}
                    {player.name}
                  </div>
                  {items.map(item => {
                    const d = getPlayerDiff(player.id, item.id);
                    const latestVal = latestSession ? getPlayerValue(player.id, item.id, latestSession.id) : null;
                    return (
                      <div key={item.id} className="flex items-center justify-center md:justify-center gap-1">
                        <span className="text-sm md:hidden text-slate-400">{item.name}: </span>
                        <span className="text-sm font-mono">
                          {latestVal !== null ? latestVal : '-'}
                        </span>
                        {d && (
                          <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded ${
                            d.isImprovement
                              ? d.isSignificant ? 'bg-green-100 text-green-700' : 'text-green-600'
                              : d.diff === 0
                              ? 'text-slate-400'
                              : d.isSignificant ? 'bg-red-100 text-red-700' : 'text-red-600'
                          }`}>
                            {d.isImprovement ? <TrendingUp size={12} /> : d.diff === 0 ? <Minus size={12} /> : <TrendingDown size={12} />}
                            {d.diff > 0 ? '+' : ''}{d.diff.toFixed(2)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  <div className="hidden md:flex items-center justify-center">
                    <ChevronRight size={16} className="text-slate-400" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
