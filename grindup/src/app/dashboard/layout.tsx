'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClientSupabase } from '@/lib/supabase'
import ADMIN_EMAILS from '@/lib/admin'
import AvatarFrame from '@/components/AvatarFrame'
import ThemeProvider from '@/components/ThemeProvider'

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
    <ThemeProvider>
    <div
      className="flex min-h-screen"
      style={{
        background: 'var(--color-bg-primary, #0a0a0f)',
        backgroundImage:
          'radial-gradient(ellipse at 0% 0%, rgba(124,58,237,0.08) 0%, transparent 50%), radial-gradient(ellipse at 100% 100%, rgba(79,70,229,0.06) 0%, transparent 50%)',
      }}
    >
      <style>{`
        .dash-nav-link {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 12px; border-radius: 12px;
          font-size: 0.875rem; font-weight: 500;
          color: var(--color-text-secondary);
          transition: color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
          text-decoration: none;
        }
        .dash-nav-link:hover {
          color: var(--color-text-primary);
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
          color: var(--color-text-muted);
          background: var(--color-bg-card);
          border: none; cursor: pointer;
          transition: color 0.2s ease, background 0.2s ease;
          min-height: 44px;
        }
        .dash-logout-btn:hover { color: var(--color-text-secondary); background: var(--color-bg-card-hover); }
        .dash-logout-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .dash-config-link {
          display: flex; align-items: center; gap: 8px;
          width: 100%; padding: 8px 12px; border-radius: 10px;
          font-size: 0.75rem; font-weight: 500;
          color: var(--color-text-secondary);
          background: transparent;
          border: none; cursor: pointer; text-decoration: none;
          transition: color 0.2s ease, background 0.2s ease;
          min-height: 44px; margin-bottom: 4px;
        }
        .dash-config-link:hover { color: var(--color-text-primary); background: rgba(124,58,237,0.08); }
        .dash-config-link.active { color: #a78bfa; background: rgba(124,58,237,0.12); }
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
        .dash-plans-link {
          display: flex; align-items: center; gap: 8px;
          width: 100%; padding: 8px 12px; border-radius: 10px;
          font-size: 0.75rem; font-weight: 600;
          color: rgba(167,139,250,0.65);
          background: rgba(124,58,237,0.06);
          border: 1px solid rgba(124,58,237,0.15);
          text-decoration: none; margin-bottom: 6px;
          transition: color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .dash-plans-link:hover {
          color: #a78bfa;
          background: rgba(124,58,237,0.12);
          border-color: rgba(124,58,237,0.35);
          box-shadow: 0 0 12px rgba(124,58,237,0.2);
        }
        .module-card {
          display: block; border-radius: 16px; padding: 24px;
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          box-shadow: 0 0 20px rgba(124,58,237,0.05);
          text-decoration: none;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .module-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 32px rgba(124,58,237,0.22);
          border-color: var(--color-border-strong);
        }
        .stat-card {
          border-radius: 16px; padding: 20px;
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          box-shadow: 0 0 20px rgba(124,58,237,0.06);
        }
        .xp-bar-fill {
          height: 100%; border-radius: 999px;
          background: linear-gradient(90deg, #7c3aed, #a78bfa);
          box-shadow: 0 0 14px rgba(124,58,237,0.55);
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
          background: 'var(--color-header-bg)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <button
          onClick={() => setSidebarOpen(prev => !prev)}
          style={{
            width: 44, height: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-secondary)', fontSize: '1.4rem',
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
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`dash-sidebar${sidebarOpen ? ' open' : ''} fixed left-0 top-0 z-50 flex h-full flex-col`}
        style={{
          background: 'var(--color-sidebar-bg)',
          borderRight: '1px solid var(--color-border)',
          boxShadow: '4px 0 24px rgba(124,58,237,0.07)',
        }}
      >
        {/* Logo */}
        <div
          className="px-6 py-5"
          style={{ borderBottom: '1px solid var(--color-divider)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
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
              color: 'var(--color-text-secondary)', fontSize: '1.2rem',
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
          style={{ borderTop: '1px solid var(--color-divider)' }}
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

          <div style={{ borderTop: '1px solid var(--color-divider)', marginBottom: 8, marginTop: 4 }} />
          <Link href="/planos" className="dash-plans-link" onClick={() => setSidebarOpen(false)}>
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Ver planos
          </Link>

          <div style={{ borderTop: '1px solid var(--color-divider)', marginBottom: 4, marginTop: 4 }} />
          <Link
            href="/dashboard/configuracoes"
            className={`dash-config-link${pathname === '/dashboard/configuracoes' ? ' active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            Configurações
          </Link>

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
    </ThemeProvider>
  )
}
