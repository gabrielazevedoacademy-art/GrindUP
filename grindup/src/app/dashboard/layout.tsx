'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClientSupabase } from '@/lib/supabase'
import ADMIN_EMAILS from '@/lib/admin'
import AvatarFrame from '@/components/AvatarFrame'

type Profile = {
  full_name: string | null
  username: string | null
  avatar_url: string | null
  plan: string
  level: number
}

const NAV = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: '/dashboard/tarefas',
    label: 'Tarefas',
    icon: (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: '/dashboard/agenda',
    label: 'Agenda',
    icon: (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" />
        <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    href: '/dashboard/financas',
    label: 'Finanças',
    icon: (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <line x1="12" y1="2" x2="12" y2="22" strokeLinecap="round" />
        <path strokeLinecap="round" d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
  {
    href: '/dashboard/metas',
    label: 'Metas',
    icon: (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    href: '/dashboard/checkin',
    label: 'Check-in',
    icon: (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="10" />
        <path strokeLinecap="round" d="M8 13.5s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" strokeLinecap="round" strokeWidth={2.5} />
        <line x1="15" y1="9" x2="15.01" y2="9" strokeLinecap="round" strokeWidth={2.5} />
      </svg>
    ),
  },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const supabase = createClientSupabase()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setIsAdmin(ADMIN_EMAILS.includes(user.email ?? ''))
      supabase
        .from('profiles')
        .select('full_name, username, avatar_url, plan, level')
        .eq('id', user.id)
        .single()
        .then(({ data }) => setProfile(data))
    })
  }, [router])

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  async function handleLogout() {
    setLoggingOut(true)
    const supabase = createClientSupabase()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const displayName = profile?.full_name || profile?.username || 'Usuário'
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <div
      className="flex min-h-screen"
      style={{
        background:
          'linear-gradient(135deg, #0a0a0f, #0d0a1e, #0a0f1e, #080a0f, #0d0a1e, #0a0a0f)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 8s ease infinite',
      }}
    >
      <style>{`
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          25%  { background-position: 100% 50%; }
          50%  { background-position: 100% 0%; }
          75%  { background-position: 0% 100%; }
          100% { background-position: 0% 50%; }
        }
        .dash-nav-link {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 12px; border-radius: 12px;
          font-size: 0.875rem; font-weight: 500;
          color: rgba(255,255,255,0.5);
          transition: color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
          text-decoration: none;
        }
        .dash-nav-link:hover {
          color: rgba(255,255,255,0.85);
          background: rgba(124,58,237,0.1);
        }
        .dash-nav-link.active {
          color: #a78bfa;
          background: rgba(124,58,237,0.16);
          box-shadow: 0 0 14px rgba(124,58,237,0.18);
        }
        .dash-logout-btn {
          display: flex; align-items: center; gap: 8px;
          width: 100%; padding: 8px 12px; border-radius: 10px;
          font-size: 0.75rem; font-weight: 500;
          color: rgba(255,255,255,0.35);
          background: rgba(255,255,255,0.04);
          border: none; cursor: pointer;
          transition: color 0.2s ease, background 0.2s ease;
          min-height: 44px;
        }
        .dash-logout-btn:hover { color: rgba(255,255,255,0.65); background: rgba(255,255,255,0.07); }
        .dash-logout-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .dash-admin-link {
          display: flex; align-items: center; gap: 8px;
          width: 100%; padding: 8px 12px; border-radius: 10px;
          font-size: 0.75rem; font-weight: 600;
          color: rgba(251,146,60,0.65);
          background: rgba(232,92,13,0.06);
          border: 1px solid rgba(232,92,13,0.15);
          text-decoration: none; margin-bottom: 6px;
          transition: color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .dash-admin-link:hover {
          color: #fb923c;
          background: rgba(232,92,13,0.12);
          border-color: rgba(232,92,13,0.35);
          box-shadow: 0 0 12px rgba(232,92,13,0.2);
        }
        .module-card {
          display: block; border-radius: 16px; padding: 24px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(124,58,237,0.14);
          box-shadow: 0 0 20px rgba(124,58,237,0.05);
          text-decoration: none;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .module-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 32px rgba(124,58,237,0.22);
          border-color: rgba(124,58,237,0.4);
        }
        .stat-card {
          border-radius: 16px; padding: 20px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(124,58,237,0.14);
          box-shadow: 0 0 20px rgba(124,58,237,0.06);
        }
        .xp-bar-fill {
          height: 100%; border-radius: 999px;
          background: linear-gradient(90deg, #7c3aed, #a78bfa);
          box-shadow: 0 0 14px rgba(124,58,237,0.6);
          animation: xpGlow 2s ease-in-out infinite;
        }
        @keyframes xpGlow {
          0%, 100% { box-shadow: 0 0 10px rgba(124,58,237,0.5); }
          50%       { box-shadow: 0 0 22px rgba(124,58,237,0.9), 0 0 40px rgba(124,58,237,0.3); }
        }
        .dash-sidebar {
          width: 256px;
          transform: translateX(-100%);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .dash-sidebar.open { transform: translateX(0); }
        @media (max-width: 767px) {
          .dash-sidebar { width: 80%; max-width: 280px; }
          .stat-card { padding: 14px; }
          .module-card { padding: 16px; }
        }
        @media (min-width: 768px) {
          .dash-sidebar { transform: translateX(0); }
          .dash-mobile-header { display: none; }
          .dash-overlay { display: none; }
          .dash-sidebar-close { display: none !important; }
        }
      `}</style>

      {/* ── Mobile Header ── */}
      <header
        className="dash-mobile-header fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-4"
        style={{
          height: 56,
          background: 'rgba(10,10,15,0.96)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(124,58,237,0.18)',
        }}
      >
        <button
          onClick={() => setSidebarOpen(prev => !prev)}
          style={{
            width: 44, height: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.75)', fontSize: '1.4rem',
            borderRadius: 8,
          }}
          aria-label="Abrir menu"
        >
          ☰
        </button>
        <h1 className="text-xl font-black tracking-tight text-white">
          Grind
          <span style={{ color: '#a78bfa', textShadow: '0 0 10px rgba(167,139,250,0.8), 0 0 25px rgba(124,58,237,0.5)' }}>
            UP
          </span>
        </h1>
        <div style={{ width: 44 }} />
      </header>

      {/* ── Overlay ── */}
      {sidebarOpen && (
        <div
          className="dash-overlay fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`dash-sidebar${sidebarOpen ? ' open' : ''} fixed left-0 top-0 z-50 flex h-full flex-col`}
        style={{
          background: 'rgba(255,255,255,0.025)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(124,58,237,0.18)',
          boxShadow: '4px 0 24px rgba(124,58,237,0.07)',
        }}
      >
        {/* Logo */}
        <div
          className="px-6 py-5"
          style={{ borderBottom: '1px solid rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <h1 className="text-2xl font-black tracking-tight text-white">
            Grind
            <span
              style={{
                color: '#a78bfa',
                textShadow:
                  '0 0 10px rgba(167,139,250,0.8), 0 0 25px rgba(124,58,237,0.5)',
              }}
            >
              UP
            </span>
          </h1>
          <button
            className="dash-sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar menu"
            style={{
              width: 44, height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.6)', fontSize: '1.2rem',
              borderRadius: 8,
            }}
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {NAV.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`dash-nav-link${isActive ? ' active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        <div
          className="p-4"
          style={{ borderTop: '1px solid rgba(124,58,237,0.1)' }}
        >
          <div className="mb-3 flex items-center gap-3">
            <AvatarFrame
              avatarUrl={profile?.avatar_url ?? null}
              displayName={displayName}
              initials={initials}
              level={profile?.level ?? 1}
              size={36}
              selectable={false}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{displayName}</p>
              <p className="truncate text-xs capitalize text-gray-500">
                {profile?.plan ?? 'free'}
              </p>
            </div>
          </div>

          {isAdmin && (
            <>
              <div style={{ borderTop: '1px solid rgba(232,92,13,0.15)', marginBottom: 8 }} />
              <Link href="/admin" className="dash-admin-link" onClick={() => setSidebarOpen(false)}>
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Painel Admin
              </Link>
            </>
          )}

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="dash-logout-btn"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {loggingOut ? 'Saindo...' : 'Sair da conta'}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="min-h-screen flex-1 overflow-y-auto pt-14 md:ml-64 md:pt-0">
        {children}
      </main>
    </div>
  )
}
