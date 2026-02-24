'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { LogIn, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { user, signIn, loading, isDemo } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const redirectByRole = useCallback((role: string) => {
    switch (role) {
      case 'admin':
      case 'staff':
        router.push('/coach-dashboard');
        break;
      case 'player':
        router.push('/player-dashboard');
        break;
      default:
        router.push('/');
    }
  }, [router]);

  useEffect(() => {
    if (!loading && user) {
      redirectByRole(user.role);
    }
  }, [user, loading, redirectByRole]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">REGAIN Metrics</h1>
          <p className="text-slate-500 text-sm">体力測定データ管理・可視化</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-6 text-center">ログイン</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-base"
                placeholder="example@regain.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                パスワード
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-base pr-12"
                  placeholder="パスワード"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition text-base"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <LogIn size={18} />
                  ログイン
                </>
              )}
            </button>
          </form>
        </div>

        {isDemo && (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-amber-800 text-sm font-medium mb-2">デモモード</p>
            <p className="text-amber-700 text-xs mb-3">
              Supabaseが未設定のため、デモデータで動作しています。
            </p>
            <div className="space-y-1.5 text-xs text-amber-700">
              <div className="flex justify-between bg-amber-100/50 rounded px-2 py-1">
                <span>管理者:</span>
                <span>admin@regain.com / admin123</span>
              </div>
              <div className="flex justify-between bg-amber-100/50 rounded px-2 py-1">
                <span>スタッフ:</span>
                <span>staff@regain.com / staff123</span>
              </div>
              <div className="flex justify-between bg-amber-100/50 rounded px-2 py-1">
                <span>選手:</span>
                <span>player1@regain.com / player123</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
