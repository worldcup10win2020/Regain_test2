'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { UserRole } from '@/lib/types';
import {
  LogOut,
  BarChart3,
  ClipboardEdit,
  Users,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    label: 'データ入力',
    href: '/data-entry',
    icon: <ClipboardEdit size={20} />,
    roles: ['admin', 'staff'],
  },
  {
    label: '選手ダッシュボード',
    href: '/player-dashboard',
    icon: <BarChart3 size={20} />,
    roles: ['player'],
  },
  {
    label: 'コーチダッシュボード',
    href: '/coach-dashboard',
    icon: <Users size={20} />,
    roles: ['admin', 'staff'],
  },
  {
    label: '管理設定',
    href: '/admin',
    icon: <Settings size={20} />,
    roles: ['admin'],
  },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) return null;

  const filteredNav = navItems.filter(item => item.roles.includes(user.role));

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="sm:hidden p-2 rounded-lg hover:bg-slate-100"
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <Link href="/" className="font-bold text-lg text-blue-600">
                REGAIN Metrics
              </Link>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden sm:flex items-center gap-1">
              {filteredNav.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500 hidden sm:block">
                {user.name}
                <span className="ml-1 px-1.5 py-0.5 bg-slate-100 rounded text-xs uppercase">
                  {user.role}
                </span>
              </span>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                title="ログアウト"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      {menuOpen && (
        <div className="sm:hidden bg-white border-b border-slate-200 px-4 py-2">
          <div className="mb-2 text-sm text-slate-500">
            {user.name}
            <span className="ml-1 px-1.5 py-0.5 bg-slate-100 rounded text-xs uppercase">
              {user.role}
            </span>
          </div>
          {filteredNav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${
                pathname === item.href
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {children}
      </main>
    </div>
  );
}
