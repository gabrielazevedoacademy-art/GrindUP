'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClientSupabase } from '@/lib/supabase'

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
type PlanId  = 'free' | 'pro' | 'elite'
type Billing = 'monthly' | 'annual'

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const STARS = [
  { s:1, t:'4%',  l:'11%', d:'4s',  dl:'0s'   },
  { s:2, t:'9%',  l:'73%', d:'6s',  dl:'1.2s' },
  { s:1, t:'15%', l:'38%', d:'5s',  dl:'0.5s' },
  { s:1, t:'22%', l:'85%', d:'7s',  dl:'2s'   },
  { s:2, t:'28%', l:'5%',  d:'4.5s',dl:'3s'   },
  { s:1, t:'33%', l:'55%', d:'6s',  dl:'0.8s' },
  { s:1, t:'41%', l:'92%', d:'5s',  dl:'1.5s' },
  { s:2, t:'47%', l:'25%', d:'7s',  dl:'0.3s' },
  { s:1, t:'52%', l:'66%', d:'4s',  dl:'2.5s' },
  { s:1, t:'59%', l:'14%', d:'6s',  dl:'1s'   },
  { s:2, t:'64%', l:'48%', d:'5.5s',dl:'3.5s' },
  { s:1, t:'71%', l:'80%', d:'4s',  dl:'0.7s' },
  { s:1, t:'76%', l:'32%', d:'7s',  dl:'2s'   },
  { s:2, t:'82%', l:'62%', d:'5s',  dl:'1.3s' },
  { s:1, t:'88%', l:'7%',  d:'6s',  dl:'4s'   },
  { s:1, t:'93%', l:'90%', d:'4.5s',dl:'0.9s' },
  { s:2, t:'7%',  l:'43%', d:'5s',  dl:'2.2s' },
  { s:1, t:'18%', l:'19%', d:'7s',  dl:'1.7s' },
  { s:1, t:'36%', l:'75%', d:'4s',  dl:'3.2s' },
  { s:2, t:'55%', l:'37%', d:'6s',  dl:'0.4s' },
  { s:1, t:'68%', l:'93%', d:'5s',  dl:'1.8s' },
  { s:1, t:'79%', l:'18%', d:'4.5s',dl:'2.8s' },
  { s:2, t:'86%', l:'50%', d:'6s',  dl:'0.6s' },
  { s:1, t:'12%', l:'62%', d:'5s',  dl:'3.7s' },
  { s:1, t:'45%', l:'3%',  d:'7s',  dl:'1.1s' },
  { s:2, t:'61%', l:'28%', d:'4s',  dl:'2.4s' },
  { s:1, t:'74%', l:'71%', d:'6s',  dl:'0.2s' },
  { s:1, t:'91%', l:'42%', d:'5s',  dl:'3.9s' },
  { s:2, t:'25%', l:'97%', d:'4.5s',dl:'1.6s' },
  { s:1, t:'50%', l:'82%', d:'7s',  dl:'2.7s' },
]

const PLANS = [
  {
    id:            'free' as PlanId,
    name:          'Free',
    badge:         'Grátis para sempre',
    badgeColor:    '#9ca3af',
    badgeBg:       'rgba(107,114,128,0.12)',
    badgeBorder:   'rgba(107,114,128,0.25)',
    priceMonthly:  0,
    priceAnnual:   0,
    accentColor:   'rgba(255,255,255,0.65)',
    borderColor:   'rgba(255,255,255,0.1)',
    bgColor:       'rgba(255,255,255,0.03)',
    btnBg:         'rgba(255,255,255,0.07)',
    btnBorder:     'rgba(255,255,255,0.14)',
    btnColor:      '#fff',
    features: [
      { label: '5 tarefas por dia',       ok: true  },
      { label: '3 metas ativas',          ok: true  },
      { label: '20 transações por mês',   ok: true  },
      { label: 'Agenda completa',         ok: true  },
      { label: 'Check-in diário',         ok: true  },
      { label: 'Sistema de XP e níveis',  ok: true  },
      { label: 'Missões diárias',         ok: false },
      { label: 'Resumo semanal',          ok: false },
      { label: 'Capas premium',           ok: false },
      { label: 'Molduras exclusivas',     ok: false },
    ],
  },
  {
    id:            'pro' as PlanId,
    name:          'Pro',
    badge:         'MAIS POPULAR',
    badgeColor:    '#a78bfa',
    badgeBg:       'rgba(124,58,237,0.18)',
    badgeBorder:   'rgba(124,58,237,0.45)',
    priceMonthly:  9.90,
    priceAnnual:   7.92,
    accentColor:   '#a78bfa',
    borderColor:   'rgba(124,58,237,0.55)',
    bgColor:       'rgba(124,58,237,0.07)',
    btnBg:         'linear-gradient(135deg,#7c3aed,#6d28d9)',
    btnBorder:     'rgba(124,58,237,0.5)',
    btnColor:      '#fff',
    features: [
      { label: 'Tarefas ilimitadas',      ok: true  },
      { label: 'Metas ilimitadas',        ok: true  },
      { label: 'Transações ilimitadas',   ok: true  },
      { label: 'Agenda completa',         ok: true  },
      { label: 'Check-in diário',         ok: true  },
      { label: 'Sistema de XP e níveis',  ok: true  },
      { label: 'Missões diárias',         ok: true  },
      { label: 'Resumo semanal',          ok: true  },
      { label: 'Capas premium Elite',     ok: false },
      { label: 'Molduras exclusivas Elite',ok: false},
      { label: 'Avatar animado',          ok: false },
    ],
  },
  {
    id:            'elite' as PlanId,
    name:          'Elite',
    badge:         'PREMIUM',
    badgeColor:    '#fbbf24',
    badgeBg:       'rgba(251,191,36,0.12)',
    badgeBorder:   'rgba(251,191,36,0.4)',
    priceMonthly:  19.90,
    priceAnnual:   15.92,
    accentColor:   '#fbbf24',
    borderColor:   'rgba(251,191,36,0.5)',
    bgColor:       'rgba(251,191,36,0.04)',
    btnBg:         'linear-gradient(135deg,#b45309,#d97706)',
    btnBorder:     'rgba(251,191,36,0.45)',
    btnColor:      '#fff',
    features: [
      { label: 'Tarefas ilimitadas',           ok: true },
      { label: 'Metas ilimitadas',             ok: true },
      { label: 'Transações ilimitadas',        ok: true },
      { label: 'Agenda completa',              ok: true },
      { label: 'Check-in diário',              ok: true },
      { label: 'Sistema de XP e níveis',       ok: true },
      { label: 'Missões diárias',              ok: true },
      { label: 'Resumo semanal',               ok: true },
      { label: 'Capas animadas exclusivas',    ok: true },
      { label: 'Molduras de avatar exclusivas',ok: true },
      { label: 'Avatar animado (GIF)',         ok: true },
      { label: 'Badge Elite exclusivo',        ok: true },
      { label: 'Suporte prioritário',          ok: true },
    ],
  },
]

const COMPARE_ROWS: { cat: string; label: string; free: boolean | string; pro: boolean | string; elite: boolean | string }[] = [
  { cat: 'Produtividade', label: 'Tarefas por dia',          free: '5',           pro: 'Ilimitadas',   elite: 'Ilimitadas'   },
  { cat: 'Produtividade', label: 'Metas ativas',             free: '3',           pro: 'Ilimitadas',   elite: 'Ilimitadas'   },
  { cat: 'Produtividade', label: 'Resumo semanal',           free: false,         pro: true,           elite: true           },
  { cat: 'Finanças',      label: 'Transações mensais',       free: '20',          pro: 'Ilimitadas',   elite: 'Ilimitadas'   },
  { cat: 'Geral',         label: 'Agenda completa',          free: true,          pro: true,           elite: true           },
  { cat: 'Geral',         label: 'Check-in diário',          free: true,          pro: true,           elite: true           },
  { cat: 'Gamificação',   label: 'Sistema de XP e Níveis',   free: true,          pro: true,           elite: true           },
  { cat: 'Gamificação',   label: 'Missões diárias',          free: false,         pro: true,           elite: true           },
  { cat: 'Visual',        label: 'Capas animadas',           free: false,         pro: false,          elite: true           },
  { cat: 'Visual',        label: 'Molduras de avatar',       free: false,         pro: false,          elite: true           },
  { cat: 'Visual',        label: 'Avatar animado (GIF)',     free: false,         pro: false,          elite: true           },
  { cat: 'Visual',        label: 'Badge Elite exclusivo',    free: false,         pro: false,          elite: true           },
  { cat: 'Suporte',       label: 'Suporte prioritário',      free: false,         pro: false,          elite: true           },
]

const FAQ_ITEMS = [
  {
    q: 'Posso cancelar a qualquer momento?',
    a: 'Sim, sem multa ou fidelidade. Você pode cancelar quando quiser e continuará com acesso até o fim do período já pago.',
  },
  {
    q: 'O plano Free tem limite de tempo?',
    a: 'Não. O plano Free é gratuito para sempre, sem prazo de validade. Você pode usá-lo indefinidamente sem precisar inserir cartão de crédito.',
  },
  {
    q: 'Como funciona o desconto anual?',
    a: 'Ao escolher o plano anual, você paga 12 meses de uma só vez e recebe 20% de desconto em relação ao preço mensal. O valor é cobrado integralmente no momento da assinatura.',
  },
  {
    q: 'Meus dados ficam salvos se eu cancelar?',
    a: 'Sim. Após o cancelamento, seus dados ficam armazenados com segurança por 30 dias. Dentro desse prazo você pode reativar a assinatura e recuperar tudo normalmente.',
  },
  {
    q: 'Posso mudar de plano a qualquer momento?',
    a: 'Sim. Upgrades entram em vigor imediatamente. Downgrades são agendados para o próximo ciclo de cobrança, mantendo seu plano atual até o fim do período pago.',
  },
]

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const PLAN_ORDER: Record<string, number> = { free: 0, pro: 1, elite: 2 }

function getBtn(planId: PlanId, loggedIn: boolean, userPlan: string | null): {
  label: string
  action: 'register' | 'modal' | 'none'
  style: 'primary' | 'current' | 'muted'
} {
  if (!loggedIn) {
    if (planId === 'free') return { label: 'Começar grátis', action: 'register', style: 'primary' }
    return { label: 'Assinar agora', action: 'modal', style: 'primary' }
  }
  const cur = userPlan ?? 'free'
  if (planId === cur)                              return { label: 'Plano atual',   action: 'none',     style: 'current' }
  if (PLAN_ORDER[planId] > PLAN_ORDER[cur])        return { label: 'Fazer upgrade', action: 'modal',    style: 'primary' }
  return { label: 'Plano incluído', action: 'none', style: 'muted' }
}

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ─────────────────────────────────────────────────────────────
// REVEAL ON SCROLL
// ─────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, stretch = false }: { children: React.ReactNode; delay?: number; stretch?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect() } },
      { threshold: 0.08 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} style={{
      opacity:    vis ? 1 : 0,
      transform:  vis ? 'translateY(0)' : 'translateY(26px)',
      transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      ...(stretch ? { height: '100%', display: 'flex', flexDirection: 'column' } : {}),
    }}>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MODAL "EM BREVE"
// ─────────────────────────────────────────────────────────────
function ModalEmBreve({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        animation: 'fadeIn 0.18s ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        width: '100%', maxWidth: 420, borderRadius: 22,
        background: 'linear-gradient(145deg,#120c22,#0d0a1e)',
        border: '1px solid rgba(124,58,237,0.4)',
        boxShadow: '0 0 60px rgba(124,58,237,0.25), 0 24px 64px rgba(0,0,0,0.65)',
        padding: '40px 28px', textAlign: 'center',
        animation: 'slideUp 0.22s ease',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: 18 }}>🚀</div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', marginBottom: 12 }}>
          Em breve!
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 28 }}>
          Os pagamentos estão sendo configurados. Entre em contato e garanta seu plano com antecedência.
        </p>
        <a
          href="mailto:contato@grindup.com.br"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
            padding: '13px 0', borderRadius: 12, marginBottom: 12,
            background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
            border: '1px solid rgba(124,58,237,0.5)',
            color: '#fff', fontSize: '0.9rem', fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 0 22px rgba(124,58,237,0.45)',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          contato@grindup.com.br
        </a>
        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '11px 0', borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
            color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
          }}
        >
          Fechar
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PLAN CARD INNER
// ─────────────────────────────────────────────────────────────
function PlanCardInner({
  plan, price, billing, btn, onModal,
}: {
  plan: typeof PLANS[0]
  price: number
  billing: Billing
  btn: ReturnType<typeof getBtn>
  onModal: () => void
}) {
  const savings = billing === 'annual' && plan.priceMonthly > 0
    ? (plan.priceMonthly - plan.priceAnnual) * 12
    : 0

  return (
    <div style={{
      borderRadius: 22, padding: '32px 26px',
      background: plan.bgColor,
      border: plan.id === 'elite' ? 'none' : `1px solid ${plan.borderColor}`,
      display: 'flex', flexDirection: 'column', height: '100%',
    }}>
      {/* Badge */}
      <div style={{ marginBottom: 18 }}>
        <span style={{
          display: 'inline-block', padding: '4px 12px', borderRadius: 999,
          fontSize: '0.67rem', fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase',
          background: plan.badgeBg, color: plan.badgeColor, border: `1px solid ${plan.badgeBorder}`,
        }}>
          {plan.badge}
        </span>
      </div>

      {/* Name */}
      <h3 style={{ fontSize: '1.45rem', fontWeight: 900, color: plan.accentColor, marginBottom: 18, letterSpacing: '-0.5px' }}>
        {plan.name}
      </h3>

      {/* Price */}
      <div style={{ marginBottom: 26, minHeight: 64 }}>
        {plan.priceMonthly === 0 ? (
          <div>
            <span style={{ fontSize: '2.6rem', fontWeight: 900, color: '#fff', letterSpacing: '-1.5px', lineHeight: 1 }}>
              R$&nbsp;0
            </span>
            <span style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>
              /mês
            </span>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '2.6rem', fontWeight: 900, color: '#fff', letterSpacing: '-1.5px', lineHeight: 1 }}>
                {brl(price)}
              </span>
              <span style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.3)' }}>
                /mês
              </span>
            </div>
            {billing === 'annual' && (
              <div style={{ marginTop: 5, fontSize: '0.74rem', color: '#4ade80', fontWeight: 600 }}>
                {brl(price * 12)}/ano — economize {brl(savings)}
              </div>
            )}
            {billing === 'monthly' && (
              <div style={{ marginTop: 5, fontSize: '0.74rem', color: 'rgba(255,255,255,0.25)' }}>
                ou {brl(plan.priceAnnual)}/mês no plano anual
              </div>
            )}
          </div>
        )}
      </div>

      {/* Features */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28, flex: 1 }}>
        {plan.features.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              flexShrink: 0, width: 19, height: 19, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: f.ok ? 'rgba(74,222,128,0.13)' : 'rgba(255,255,255,0.04)',
            }}>
              {f.ok ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth={3} strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={2.5} strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              )}
            </div>
            <span style={{
              fontSize: '0.84rem',
              color: f.ok ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.22)',
            }}>
              {f.label}
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      {btn.action === 'register' && (
        <Link href="/cadastro" style={{
          display: 'block', padding: '13px 0', borderRadius: 12, textAlign: 'center',
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
          color: '#fff', fontSize: '0.9rem', fontWeight: 700, textDecoration: 'none',
          transition: 'background 0.2s', marginTop: 'auto',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.14)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.08)' }}
        >
          Começar grátis →
        </Link>
      )}
      {btn.action === 'modal' && (
        <button
          onClick={onModal}
          style={{
            width: '100%', padding: '13px 0', borderRadius: 12, cursor: 'pointer',
            background: plan.btnBg, border: `1px solid ${plan.btnBorder}`,
            color: plan.btnColor, fontSize: '0.9rem', fontWeight: 700,
            boxShadow: plan.id === 'elite'
              ? '0 0 24px rgba(251,191,36,0.25)'
              : '0 0 24px rgba(124,58,237,0.3)',
            transition: 'transform 0.18s ease, filter 0.18s ease',
            marginTop: 'auto',
          }}
          onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform='translateY(-1px)'; b.style.filter='brightness(1.12)' }}
          onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform='translateY(0)'; b.style.filter='none' }}
        >
          {btn.label} →
        </button>
      )}
      {btn.action === 'none' && (
        <div style={{
          padding: '13px 0', borderRadius: 12, textAlign: 'center', marginTop: 'auto',
          background: btn.style === 'current'
            ? (plan.id === 'elite' ? 'rgba(251,191,36,0.1)' : plan.id === 'pro' ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.06)')
            : 'rgba(255,255,255,0.02)',
          border: btn.style === 'current'
            ? (plan.id === 'elite' ? '1px solid rgba(251,191,36,0.3)' : plan.id === 'pro' ? '1px solid rgba(124,58,237,0.3)' : '1px solid rgba(255,255,255,0.12)')
            : '1px solid rgba(255,255,255,0.05)',
          color: btn.style === 'current'
            ? (plan.id === 'elite' ? '#fbbf24' : plan.id === 'pro' ? '#a78bfa' : 'rgba(255,255,255,0.55)')
            : 'rgba(255,255,255,0.2)',
          fontSize: '0.85rem', fontWeight: 700,
        }}>
          {btn.label}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// CELL RENDERER FOR COMPARISON TABLE
// ─────────────────────────────────────────────────────────────
function CompareCell({ val, col }: { val: boolean | string; col: 'free' | 'pro' | 'elite' }) {
  const accent = col === 'elite' ? '#fbbf24' : col === 'pro' ? '#a78bfa' : 'rgba(255,255,255,0.5)'
  if (typeof val === 'boolean') {
    return val ? (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth={2.5} strokeLinecap="round" style={{ display:'inline-block' }}>
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ) : (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={2} strokeLinecap="round" style={{ display:'inline-block' }}>
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    )
  }
  return <span style={{ fontSize:'0.8rem', fontWeight:700, color: accent }}>{val}</span>
}

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────
export default function PlanosPage() {
  const [loggedIn,   setLoggedIn]   = useState(false)
  const [userPlan,   setUserPlan]   = useState<string | null>(null)
  const [checking,   setChecking]   = useState(true)
  const [billing,    setBilling]    = useState<Billing>('monthly')
  const [openFaq,    setOpenFaq]    = useState<number | null>(null)
  const [showModal,  setShowModal]  = useState(false)
  const [backUrl,    setBackUrl]    = useState('/')

  useEffect(() => {
    const supabase = createClientSupabase()

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setLoggedIn(true)
        setBackUrl('/dashboard')
        const { data } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
        if (data) setUserPlan(data.plan)
      }
      setChecking(false)
    })
  }, [])

  return (
    <div style={{
      background: 'linear-gradient(180deg,#05050f 0%,#0a0520 40%,#0d0a1e 70%,#05050f 100%)',
      color: '#fff', fontFamily: 'system-ui,-apple-system,sans-serif',
      overflowX: 'hidden', minHeight: '100vh', position: 'relative',
    }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes twinkle { 0%,100% { opacity:0.2; } 50% { opacity:0.85; } }
        @keyframes goldShimmer {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes proGlow {
          0%,100% { box-shadow: 0 0 40px rgba(124,58,237,0.2), 0 20px 50px rgba(0,0,0,0.45); }
          50%      { box-shadow: 0 0 70px rgba(124,58,237,0.4), 0 20px 60px rgba(0,0,0,0.55); }
        }
        .plans-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          align-items: stretch;
        }
        @media (max-width: 860px) {
          .plans-grid { grid-template-columns: 1fr; max-width: 420px; margin: 0 auto; }
        }
        .cmp-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 16px; }
        .cmp-table { width: 100%; border-collapse: collapse; min-width: 520px; }
        .faq-row:hover { border-color: rgba(124,58,237,0.35) !important; }
      `}</style>

      {/* ── Stars background ── */}
      <div aria-hidden="true" style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', overflow:'hidden' }}>
        {STARS.map((s, i) => (
          <div key={i} style={{
            position: 'absolute', width: s.s, height: s.s,
            top: s.t, left: s.l, borderRadius: '50%',
            background: 'rgba(200,190,255,0.9)',
            animation: `twinkle ${s.d} ease-in-out ${s.dl} infinite`,
            willChange: 'opacity',
          }} />
        ))}
      </div>

      {showModal && <ModalEmBreve onClose={() => setShowModal(false)} />}

      {/* ── NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 24px',
        background: 'rgba(5,5,15,0.88)',
        backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
        borderBottom: '1px solid rgba(124,58,237,0.1)',
      }}>
        <Link
          href={backUrl}
          style={{ display:'flex', alignItems:'center', gap:7, color:'rgba(255,255,255,0.5)', textDecoration:'none', fontSize:'0.87rem', fontWeight:600, transition:'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Voltar
        </Link>

        <span style={{ fontSize:'1.05rem', fontWeight:900 }}>
          Grind<span style={{ color:'#a78bfa' }}>UP</span>
        </span>

        {!checking && (
          <Link
            href={loggedIn ? '/dashboard' : '/login'}
            style={{
              padding:'7px 16px', borderRadius:9,
              background:'rgba(124,58,237,0.14)', border:'1px solid rgba(124,58,237,0.32)',
              color:'#a78bfa', fontSize:'0.82rem', fontWeight:600, textDecoration:'none',
            }}
          >
            {loggedIn ? 'Dashboard →' : 'Entrar'}
          </Link>
        )}
        {checking && <div style={{ width: 80 }} />}
      </nav>

      {/* ── HERO ── */}
      <section style={{ position:'relative', zIndex:2, padding:'80px 24px 56px', textAlign:'center' }}>
        <Reveal>
          <div style={{
            display:'inline-block', marginBottom:20, padding:'5px 16px', borderRadius:999,
            background:'rgba(124,58,237,0.12)', border:'1px solid rgba(124,58,237,0.28)',
            fontSize:'0.72rem', fontWeight:800, color:'#a78bfa', letterSpacing:'0.1em', textTransform:'uppercase',
          }}>
            Planos & Preços
          </div>
          <h1 style={{
            fontSize:'clamp(2rem,5vw,3.4rem)', fontWeight:900, letterSpacing:'-1.5px',
            lineHeight:1.08, marginBottom:18,
          }}>
            Escolha seu plano
          </h1>
          <p style={{
            fontSize:'clamp(0.95rem,2.5vw,1.12rem)', color:'rgba(255,255,255,0.45)',
            maxWidth:460, margin:'0 auto 44px', lineHeight:1.6,
          }}>
            Comece grátis e evolua quando quiser.<br />Sem pegadinhas.
          </p>

          {/* Billing toggle */}
          <div style={{
            display:'inline-flex', alignItems:'center', gap:6,
            padding:'5px 6px', borderRadius:999,
            background:'rgba(255,255,255,0.05)', border:'1px solid rgba(124,58,237,0.2)',
          }}>
            {(['monthly','annual'] as Billing[]).map(b => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                style={{
                  padding:'8px 20px', borderRadius:999, border:'none',
                  background: billing === b ? 'rgba(124,58,237,0.4)' : 'transparent',
                  color: billing === b ? '#fff' : 'rgba(255,255,255,0.4)',
                  fontSize:'0.84rem', fontWeight:700, cursor:'pointer',
                  transition:'all 0.2s',
                  display:'flex', alignItems:'center', gap:8,
                }}
              >
                {b === 'monthly' ? 'Mensal' : 'Anual'}
                {b === 'annual' && (
                  <span style={{
                    fontSize:'0.63rem', fontWeight:800, padding:'2px 8px', borderRadius:999,
                    background:'rgba(74,222,128,0.18)', color:'#4ade80',
                    border:'1px solid rgba(74,222,128,0.28)', letterSpacing:'0.04em',
                  }}>
                    −20%
                  </span>
                )}
              </button>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── PLAN CARDS ── */}
      <section style={{ position:'relative', zIndex:2, padding:'0 24px 80px' }}>
        <div className="plans-grid" style={{ maxWidth:1060, margin:'0 auto' }}>
          {PLANS.map((plan, i) => {
            const price = billing === 'annual' ? plan.priceAnnual : plan.priceMonthly
            const btn     = getBtn(plan.id, loggedIn, userPlan)
            const isCur   = loggedIn && userPlan === plan.id
            const isElite = plan.id === 'elite'
            const isPro   = plan.id === 'pro'

            return (
              <Reveal key={plan.id} delay={i * 90} stretch>
                <div style={{ position:'relative', flex: 1 }}>
                  {/* "Seu plano atual" pill */}
                  {isCur && (
                    <div style={{
                      position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', zIndex:10,
                      padding:'4px 14px', borderRadius:999, whiteSpace:'nowrap',
                      background: isElite
                        ? 'linear-gradient(135deg,#b45309,#fbbf24)'
                        : isPro
                        ? 'linear-gradient(135deg,#7c3aed,#a78bfa)'
                        : 'rgba(100,100,110,0.8)',
                      fontSize:'0.65rem', fontWeight:800, color:'#fff',
                      letterSpacing:'0.08em', textTransform:'uppercase',
                      boxShadow: isElite ? '0 0 14px rgba(251,191,36,0.4)' : isPro ? '0 0 14px rgba(124,58,237,0.5)' : 'none',
                    }}>
                      ✓ Seu plano atual
                    </div>
                  )}

                  {/* Elite — shimmer gold border wrapper */}
                  {isElite ? (
                    <div style={{
                      background:'linear-gradient(135deg,rgba(251,191,36,0.75),rgba(234,179,8,0.2),rgba(251,191,36,0.85),rgba(161,98,7,0.2),rgba(251,191,36,0.7))',
                      backgroundSize:'300% 300%', animation:'goldShimmer 4s ease infinite',
                      borderRadius:22, padding:1,
                      boxShadow:'0 0 48px rgba(251,191,36,0.15), 0 20px 50px rgba(0,0,0,0.45)',
                      height: '100%',
                    }}>
                      <PlanCardInner plan={plan} price={price} billing={billing} btn={btn} onModal={() => setShowModal(true)} />
                    </div>
                  ) : isPro ? (
                    <div style={{ animation:'proGlow 3s ease-in-out infinite', borderRadius:22, height: '100%' }}>
                      <PlanCardInner plan={plan} price={price} billing={billing} btn={btn} onModal={() => setShowModal(true)} />
                    </div>
                  ) : (
                    <PlanCardInner plan={plan} price={price} billing={billing} btn={btn} onModal={() => setShowModal(true)} />
                  )}
                </div>
              </Reveal>
            )
          })}
        </div>
      </section>

      {/* ── COMPARISON TABLE ── */}
      <section style={{ position:'relative', zIndex:2, padding:'0 24px 80px' }}>
        <div style={{ maxWidth:1060, margin:'0 auto' }}>
          <Reveal>
            <h2 style={{ fontSize:'clamp(1.4rem,3vw,2rem)', fontWeight:900, textAlign:'center', marginBottom:8 }}>
              Comparação completa
            </h2>
            <p style={{ textAlign:'center', color:'rgba(255,255,255,0.35)', fontSize:'0.88rem', marginBottom:36 }}>
              Todos os recursos em cada plano
            </p>
          </Reveal>
          <Reveal delay={80}>
            <div className="cmp-wrap" style={{ border:'1px solid rgba(255,255,255,0.07)', background:'rgba(255,255,255,0.02)' }}>
              <table className="cmp-table">
                <thead>
                  <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
                    <th style={{ padding:'16px 20px', textAlign:'left', color:'rgba(255,255,255,0.35)', fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em' }}>
                      Recurso
                    </th>
                    {(['Free','Pro','Elite'] as const).map(n => (
                      <th key={n} style={{
                        padding:'16px 20px', textAlign:'center', fontSize:'0.9rem', fontWeight:800,
                        color: n==='Elite' ? '#fbbf24' : n==='Pro' ? '#a78bfa' : 'rgba(255,255,255,0.55)',
                        minWidth: 100,
                      }}>
                        {n}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'transparent' }}>
                      <td style={{ padding:'13px 20px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize:'0.63rem', fontWeight:600, color:'rgba(255,255,255,0.22)', marginRight:8, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                          {row.cat}
                        </span>
                        <span style={{ fontSize:'0.84rem', color:'rgba(255,255,255,0.62)' }}>
                          {row.label}
                        </span>
                      </td>
                      {(['free','pro','elite'] as const).map(col => (
                        <td key={col} style={{ padding:'13px 20px', textAlign:'center', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                          <CompareCell val={row[col]} col={col} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ position:'relative', zIndex:2, padding:'0 24px 80px' }}>
        <div style={{ maxWidth:660, margin:'0 auto' }}>
          <Reveal>
            <h2 style={{ fontSize:'clamp(1.4rem,3vw,2rem)', fontWeight:900, textAlign:'center', marginBottom:8 }}>
              Perguntas frequentes
            </h2>
            <p style={{ textAlign:'center', color:'rgba(255,255,255,0.35)', fontSize:'0.88rem', marginBottom:36 }}>
              Tire suas dúvidas antes de decidir
            </p>
          </Reveal>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {FAQ_ITEMS.map((item, i) => (
              <Reveal key={i} delay={i * 55}>
                <div
                  className="faq-row"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    borderRadius:14, cursor:'pointer', overflow:'hidden',
                    border: openFaq === i ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.07)',
                    background: openFaq === i ? 'rgba(124,58,237,0.07)' : 'rgba(255,255,255,0.03)',
                    transition:'border-color 0.2s, background 0.2s',
                  }}
                >
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 20px', gap:12 }}>
                    <span style={{ fontSize:'0.9rem', fontWeight:700, color:'#fff', flex:1 }}>
                      {item.q}
                    </span>
                    <svg
                      width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth={2.5} strokeLinecap="round"
                      style={{ flexShrink:0, transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0)', transition:'transform 0.25s ease' }}
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                  {openFaq === i && (
                    <div style={{ padding:'0 20px 18px', animation:'fadeIn 0.2s ease' }}>
                      <p style={{ fontSize:'0.875rem', color:'rgba(255,255,255,0.45)', lineHeight:1.7 }}>
                        {item.a}
                      </p>
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ position:'relative', zIndex:2, padding:'0 24px 96px', textAlign:'center' }}>
        <Reveal>
          <div style={{
            display:'inline-block', padding:'44px 40px', borderRadius:24,
            background:'rgba(124,58,237,0.07)', border:'1px solid rgba(124,58,237,0.18)',
            maxWidth:500, margin:'0 auto',
          }}>
            <div style={{ fontSize:'2.5rem', marginBottom:14 }}>💬</div>
            <h3 style={{ fontSize:'1.3rem', fontWeight:800, color:'#fff', marginBottom:10 }}>
              Ainda com dúvidas?
            </h3>
            <p style={{ fontSize:'0.88rem', color:'rgba(255,255,255,0.4)', marginBottom:24, lineHeight:1.65 }}>
              Fale conosco por email e respondemos em até 24 horas.
            </p>
            <a
              href="mailto:contato@grindup.com.br"
              style={{
                display:'inline-flex', alignItems:'center', gap:9,
                padding:'12px 22px', borderRadius:12,
                background:'rgba(124,58,237,0.18)', border:'1px solid rgba(124,58,237,0.38)',
                color:'#a78bfa', fontSize:'0.9rem', fontWeight:700, textDecoration:'none',
                transition:'background 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background='rgba(124,58,237,0.32)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background='rgba(124,58,237,0.18)' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              contato@grindup.com.br
            </a>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        position:'relative', zIndex:2,
        borderTop:'1px solid rgba(124,58,237,0.1)',
        padding:'32px 24px', textAlign:'center',
      }}>
        <p style={{ color:'rgba(255,255,255,0.15)', fontSize:'0.75rem' }}>
          © {new Date().getFullYear()} GrindUP. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  )
}
