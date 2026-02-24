'use client';

import { useState, useEffect, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/lib/auth-context';
import { getPlayerMeasurementHistory } from '@/lib/data';
import { MeasurementItem, MeasurementSession, MeasurementResult } from '@/lib/types';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  MessageCircle,
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

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626'];

export default function PlayerDashboardPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<MeasurementItem[]>([]);
  const [sessions, setSessions] = useState<MeasurementSession[]>([]);
  const [results, setResults] = useState<MeasurementResult[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getPlayerMeasurementHistory(user.id);
      setItems(data.items);
      setSessions(data.sessions);
      setResults(data.results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!user) return null;

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </AppShell>
    );
  }

  // Build chart data per item
  function getChartData(item: MeasurementItem) {
    return sessions.map(session => {
      const result = results.find(
        r => r.session_id === session.id && r.item_id === item.id
      );
      return {
        date: session.date.slice(5), // MM-DD format
        fullDate: session.date,
        value: result?.value ?? null,
      };
    }).filter(d => d.value !== null);
  }

  function getLatestAndPrevious(item: MeasurementItem) {
    const sortedSessions = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
    let latest: number | null = null;
    let previous: number | null = null;

    for (const session of sortedSessions) {
      const result = results.find(
        r => r.session_id === session.id && r.item_id === item.id
      );
      if (result) {
        if (latest === null) {
          latest = result.value;
        } else if (previous === null) {
          previous = result.value;
          break;
        }
      }
    }

    return { latest, previous };
  }

  function getDiff(item: MeasurementItem) {
    const { latest, previous } = getLatestAndPrevious(item);
    if (latest === null || previous === null) return null;
    const diff = latest - previous;
    // For inverted items (time-based), negative diff is improvement
    const isImprovement = item.is_inverted ? diff < 0 : diff > 0;
    return { diff, isImprovement, latest, previous };
  }

  return (
    <AppShell>
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-800">マイダッシュボード</h1>
          <p className="text-sm text-slate-500 mt-1">{user.name} さんの測定記録</p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            まだ測定データがありません
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, idx) => {
              const chartData = getChartData(item);
              const diffData = getDiff(item);

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-700">{item.name}</h3>
                    <span className="text-xs text-slate-400">{item.unit}</span>
                  </div>

                  {/* Latest value and diff */}
                  {diffData && (
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl font-bold text-slate-800">
                        {diffData.latest}
                      </span>
                      <span className="text-sm text-slate-400">{item.unit}</span>
                      <div
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium ${
                          diffData.isImprovement
                            ? 'bg-green-50 text-green-700'
                            : diffData.diff === 0
                            ? 'bg-slate-50 text-slate-500'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {diffData.isImprovement ? (
                          <TrendingUp size={16} />
                        ) : diffData.diff === 0 ? (
                          <Minus size={16} />
                        ) : (
                          <TrendingDown size={16} />
                        )}
                        <span>
                          {diffData.diff > 0 ? '+' : ''}
                          {diffData.diff.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Chart */}
                  {chartData.length > 1 && (
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                          />
                          <YAxis
                            reversed={item.is_inverted}
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            domain={['auto', 'auto']}
                          />
                          <Tooltip
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter={(value: any) => [`${value} ${item.unit}`, item.name]}
                            labelFormatter={(label) => `日付: ${label}`}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke={COLORS[idx % COLORS.length]}
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: COLORS[idx % COLORS.length] }}
                            activeDot={{ r: 6 }}
                            connectNulls
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {chartData.length <= 1 && (
                    <p className="text-sm text-slate-400 text-center py-6">
                      グラフ表示には2回以上の測定が必要です
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Coaching Message */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <MessageCircle size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-700">
            数値の変化について理由がわからない場合は、コーチに相談しましょう。
            データを見ながら一緒に振り返ることで、より効果的なトレーニングに繋がります。
          </p>
        </div>
      </div>
    </AppShell>
  );
}
