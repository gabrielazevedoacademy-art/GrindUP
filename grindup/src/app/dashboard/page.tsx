'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClientSupabase } from '@/lib/supabase'
import { getXPProgress, MAX_LEVEL } from '@/lib/levels'
import WelcomeAnimation from '@/components/WelcomeAnimation'
import CheckinPopup from '@/components/CheckinPopup'
import CoverSelector from '@/components/CoverSelector'
import AvatarUpload from '@/components/AvatarUpload'

type Profile = {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  cover_url: string | null
  plan: string
  xp: number
  level: number
  streak_days: number
}

// ─────────────────────────────────────────────────────────────
// DASHBOARD CONTENT
// ─────────────────────────────────────────────────────────────
const PLAN_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  free:  { bg: 'rgba(100,100,110,0.18)', color: '#9ca3af', border: 'rgba(100,100,110,0.3)'  },
  pro:   { bg: 'rgba(124,58,237,0.18)',  color: '#a78bfa', border: 'rgba(124,58,237,0.4)'   },
  elite: { bg: 'rgba(234,179,8,0.14)',   color: '#fbbf24', border: 'rgba(234,179,8,0.35)'   },
}

const MODULES = [
  {
    href: '/dashboard/tarefas',
    title: 'Tarefas',
    subtitle: 'Organize suas atividades diárias e ganhe XP',
    preview: 'Nenhuma tarefa pendente',
    iconColor: '#a78bfa',
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: '/dashboard/financas',
    title: 'Finanças',
    subtitle: 'Controle receitas, despesas e construa riqueza',
    preview: 'R$ 0,00 registrado',
    iconColor: '#34d399',
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <line x1="12" y1="2" x2="12" y2="22" strokeLinecap="round" />
        <path strokeLinecap="round" d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
  {
    href: '/dashboard/agenda',
    title: 'Agenda',
    subtitle: 'Planeje seus compromissos e não perca nada',
    preview: 'Nenhum evento hoje',
    iconColor: '#60a5fa',
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" />
        <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    href: '/dashboard/metas',
    title: 'Metas',
    subtitle: 'Defina objetivos e acompanhe seu progresso',
    preview: 'Nenhuma meta ativa',
    iconColor: '#f97316',
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
]

const ACCEPTED_COVER = ['image/jpeg', 'image/png', 'image/webp']
const MAX_COVER_BYTES = 5 * 1024 * 1024

function DashboardContent({
  profile,
  onAvatarChange,
  onCoverChange,
}: {
  profile: Profile
  onAvatarChange: (url: string) => void
  onCoverChange:  (url: string) => void
}) {
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [coverError, setCoverError] = useState<string | null>(null)

  const displayName = profile.full_name || profile.username || 'Usuário'
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const planStyle = PLAN_STYLE[profile.plan as keyof typeof PLAN_STYLE] ?? PLAN_STYLE.free

  const xpProgress     = getXPProgress(profile.xp)
  const xpPct          = xpProgress.percentage
  const xpForNextLevel = xpProgress.needed
  const isMaxLevel     = profile.level >= MAX_LEVEL

  async function handleCoverFile(file: File) {
    setCoverError(null)
    if (!ACCEPTED_COVER.includes(file.type)) {
      setCoverError('Formato inválido. Use JPG, PNG ou WEBP')
      return
    }
    if (file.size > MAX_COVER_BYTES) {
      setCoverError('Arquivo muito grande. Máximo 5MB para capa')
      return
    }
    const supabase = createClientSupabase()
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `${profile.id}/cover.${ext}`
    const { error: upErr } = await supabase.storage
      .from('covers')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (upErr) { setCoverError(upErr.message); return }
    const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(path)
    const url = `${publicUrl}?t=${Date.now()}`
    await supabase.from('profiles').update({ cover_url: url }).eq('id', profile.id)
    onCoverChange(url)
    setTimeout(() => setCoverError(null), 100)
  }

  const gamingStats = [
    {
      label: 'Nível',
      value: profile.level,
      color: '#a78bfa',
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ),
    },
    {
      label: 'XP Total',
      value: profile.xp.toLocaleString('pt-BR'),
      color: '#60a5fa',
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" />
        </svg>
      ),
    },
    {
      label: 'Streak',
      value: profile.streak_days > 0 ? `${profile.streak_days}d` : '—',
      color: '#f97316',
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
        </svg>
      ),
    },
    {
      label: 'Missões hoje',
      value: 0,
      color: '#fbbf24',
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <circle cx="12" cy="8" r="6" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
        </svg>
      ),
    },
  ]

  return (
    <div className="min-h-screen">

      {/* ── Banner + avatar (editable) ── */}
      <div style={{ position: 'relative', marginBottom: 60 }}>
        {/* Hidden cover file input (triggered by CoverSelector's upload button) */}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) handleCoverFile(f)
            e.target.value = ''
          }}
        />

        {/* Animated/image cover banner */}
        <CoverSelector
          userId={profile.id}
          plan={profile.plan}
          coverValue={profile.cover_url}
          onCoverChange={onCoverChange}
          onUploadClick={() => coverInputRef.current?.click()}
        />

        {/* Avatar circle — overlaps the bottom of the banner */}
        <AvatarUpload
          userId={profile.id}
          avatarUrl={profile.avatar_url}
          displayName={displayName}
          initials={initials}
          onAvatarChange={onAvatarChange}
        />

        {/* Cover upload error toast */}
        {coverError && (
          <div style={{
            position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(185,28,28,0.92)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(248,113,113,0.4)',
            borderRadius: 10, padding: '9px 18px',
            color: '#fff', fontSize: '0.82rem', fontWeight: 600,
            zIndex: 20, whiteSpace: 'nowrap',
          }}>
            ✕ {coverError}
          </div>
        )}
      </div>

      <div className="px-8 pb-10">

        {/* ── Name + plan badge ── */}
        <div style={{ paddingLeft: 148, paddingBottom: 16 }}>
          <h2 className="mb-2 text-2xl font-black text-white">{displayName}</h2>
          <span
            className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
            style={{
              background: planStyle.bg,
              color: planStyle.color,
              border: `1px solid ${planStyle.border}`,
            }}
          >
            {profile.plan}
          </span>
        </div>

        {/* ── Gamification stat cards ── */}
        <div className="mb-5 grid grid-cols-4 gap-4">
          {gamingStats.map((s) => (
            <div key={s.label} className="stat-card">
              <div style={{ color: s.color, marginBottom: 8 }}>{s.icon}</div>
              <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="mt-1 text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── XP progress bar ── */}
        <div
          className="mb-6 rounded-2xl p-5"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(124,58,237,0.14)',
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">
              {isMaxLevel ? 'Nível máximo atingido!' : `Progresso para o Nível ${profile.level + 1}`}
            </span>
            <span className="text-sm font-bold text-violet-400">{xpPct.toFixed(0)}%</span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 999, overflow: 'hidden' }}>
            <div className="xp-bar-fill" style={{ width: `${xpPct}%`, transition: 'width 0.6s ease' }} />
          </div>
          <div className="mt-2 flex justify-between">
            <span className="text-xs text-gray-600">{xpProgress.current.toLocaleString('pt-BR')} XP</span>
            <span className="text-xs text-gray-600">{isMaxLevel ? '—' : xpForNextLevel.toLocaleString('pt-BR') + ' XP'}</span>
          </div>
        </div>

        {/* ── Module grid 2×2 ── */}
        <div className="grid grid-cols-2 gap-4">
          {MODULES.map((mod) => (
            <Link key={mod.href} href={mod.href} className="module-card">
              <div style={{ color: mod.iconColor, marginBottom: 14 }}>{mod.icon}</div>
              <h3 className="mb-1 text-base font-bold text-white">{mod.title}</h3>
              <p className="mb-3 text-xs leading-relaxed text-gray-500">{mod.subtitle}</p>
              <p className="mb-5 text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>{mod.preview}</p>
              <span
                className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                style={{
                  background: 'rgba(124,58,237,0.14)',
                  color: '#a78bfa',
                  border: '1px solid rgba(124,58,237,0.25)',
                }}
              >
                Acessar →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClientSupabase()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(data)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div
          style={{
            width: 36,
            height: 36,
            border: '3px solid rgba(124,58,237,0.22)',
            borderTopColor: '#7c3aed',
            borderRadius: '50%',
            animation: 'spin 0.75s linear infinite',
          }}
        />
      </div>
    )
  }

  if (!profile) return null

  return (
    <>
      <WelcomeAnimation
        userName={profile.full_name || profile.username || ''}
        userLevel={profile.level}
        userXp={profile.xp}
        onComplete={() => {}}
      />
      <DashboardContent
        profile={profile}
        onAvatarChange={url => setProfile(p => p ? { ...p, avatar_url: url } : p)}
        onCoverChange={url  => setProfile(p => p ? { ...p, cover_url:  url } : p)}
      />
      <CheckinPopup />
    </>
  )
}
