'use client'

import { useState, useEffect } from 'react'
import { createClientSupabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/ThemeProvider'
import { type ThemeName } from '@/lib/themes'

// ── Toggle ───────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 48, height: 26, borderRadius: 13,
        background: checked ? '#7c3aed' : 'rgba(255,255,255,0.15)',
        border: 'none', cursor: 'pointer',
        position: 'relative', transition: 'background 0.2s ease',
        flexShrink: 0,
      }}
      role="switch"
      aria-checked={checked}
    >
      <div style={{
        position: 'absolute', top: 3,
        left: checked ? 25 : 3,
        width: 20, height: 20, borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s ease',
      }} />
    </button>
  )
}

// ── Section card ─────────────────────────────────────────────
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(124,58,237,0.14)',
      borderRadius: 16, padding: 24, marginBottom: 20,
    }}>
      <h2 style={{
        color: '#a78bfa', fontSize: '0.8rem', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 20,
      }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

// ── Policy modal ─────────────────────────────────────────────
function PolicyModal({ title, children, onClose }: {
  title: string; children: React.ReactNode; onClose: () => void
}) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#0d0a1e', border: '1px solid rgba(124,58,237,0.25)',
          borderRadius: 16, padding: 32, maxWidth: 560, width: '100%',
          maxHeight: '80vh', overflow: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ color: '#a78bfa', fontWeight: 800, fontSize: '1.05rem' }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.5)', fontSize: '1.2rem', lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 14,
          color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', lineHeight: 1.75,
        }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────
export default function ConfiguracoesPage() {
  const router = useRouter()
  const { theme, setTheme, fontSize, setFontSize } = useTheme()

  const [fullName, setFullName] = useState('')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameMsg, setNameMsg] = useState<string | null>(null)
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const [checkinReminder, setCheckinReminder] = useState(false)
  const [missionNotifs, setMissionNotifs] = useState(false)

  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const supabase = createClientSupabase()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      supabase.from('profiles').select('full_name').eq('id', user.id).single()
        .then(({ data }) => { if (data?.full_name) setFullName(data.full_name) })
    })
    setCheckinReminder(localStorage.getItem('grindup_checkin_reminder') === 'true')
    setMissionNotifs(localStorage.getItem('grindup_mission_notifs') === 'true')
  }, [router])

  async function handleSaveName() {
    if (!fullName.trim()) return
    setNameSaving(true)
    setNameMsg(null)
    const supabase = createClientSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('profiles').update({ full_name: fullName.trim() }).eq('id', user.id)
    setNameSaving(false)
    setNameMsg(error ? 'Erro ao salvar.' : 'Nome salvo com sucesso!')
    setTimeout(() => setNameMsg(null), 3000)
  }

  async function handleChangePassword() {
    setPasswordMsg(null)
    const supabase = createClientSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return
    const { error } = await supabase.auth.resetPasswordForEmail(user.email)
    setPasswordMsg(error ? 'Erro ao enviar email.' : 'Email de redefinição enviado! Verifique sua caixa de entrada.')
    setTimeout(() => setPasswordMsg(null), 6000)
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'DELETAR') return
    setDeleting(true)
    const supabase = createClientSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').delete().eq('id', user.id)
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleExportData() {
    setExporting(true)
    const supabase = createClientSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setExporting(false); return }

    const [profileRes, tasksRes, goalsRes, txRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('tasks').select('*').eq('user_id', user.id),
      supabase.from('goals').select('*').eq('user_id', user.id),
      supabase.from('financial_transactions').select('*').eq('user_id', user.id),
    ])

    const blob = new Blob([JSON.stringify({
      profile: profileRes.data,
      tasks: tasksRes.data,
      goals: goalsRes.data,
      transactions: txRes.data,
      exportedAt: new Date().toISOString(),
    }, null, 2)], { type: 'application/json' })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `grindup-dados-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  function handleCheckinReminder(v: boolean) {
    setCheckinReminder(v)
    localStorage.setItem('grindup_checkin_reminder', String(v))
  }

  function handleMissionNotifs(v: boolean) {
    setMissionNotifs(v)
    localStorage.setItem('grindup_mission_notifs', String(v))
  }

  const THEMES: { key: ThemeName; emoji: string; label: string; desc: string }[] = [
    { key: 'default', emoji: '🌑', label: 'Padrão', desc: 'Roxo escuro — original' },
    { key: 'dark',    emoji: '🌙', label: 'Dark',   desc: 'Preto puro, sem roxo' },
    { key: 'light',   emoji: '☀️', label: 'Light',  desc: 'Claro com acentos roxos' },
  ]

  const FONT_SIZES = [
    { key: 'small',  label: 'Pequeno' },
    { key: 'medium', label: 'Médio'   },
    { key: 'large',  label: 'Grande'  },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      padding: '32px 16px',
      maxWidth: 720, margin: '0 auto',
    }}>
      <style>{`
        .cfg-input { transition: border-color 0.2s ease; }
        .cfg-input:focus { border-color: rgba(124,58,237,0.5) !important; outline: none; }
        .cfg-btn { transition: all 0.2s ease; }
        .cfg-btn:hover:not(:disabled) { filter: brightness(1.15); }
        .cfg-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <h1 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800, marginBottom: 28 }}>
        Configurações
      </h1>

      {/* ── SEÇÃO 1: Aparência ── */}
      <SectionCard title="Aparência">
        <div style={{ marginBottom: 24 }}>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Tema
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {THEMES.map(t => (
              <button
                key={t.key}
                onClick={() => setTheme(t.key)}
                className="cfg-btn"
                style={{
                  padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
                  background: theme === t.key ? 'rgba(124,58,237,0.22)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${theme === t.key ? 'rgba(124,58,237,0.55)' : 'rgba(255,255,255,0.1)'}`,
                  color: theme === t.key ? '#a78bfa' : 'rgba(255,255,255,0.55)',
                  fontSize: '0.875rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 10,
                  flex: '1 1 160px',
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{t.emoji}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700 }}>{t.label}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 400, opacity: 0.7, marginTop: 1 }}>{t.desc}</div>
                </div>
                {theme === t.key && (
                  <div style={{
                    marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#7c3aed', flexShrink: 0,
                  }} />
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Tamanho de fonte
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {FONT_SIZES.map(f => (
              <button
                key={f.key}
                onClick={() => setFontSize(f.key)}
                className="cfg-btn"
                style={{
                  padding: '8px 16px', borderRadius: 10, cursor: 'pointer', flex: 1,
                  background: fontSize === f.key ? 'rgba(124,58,237,0.22)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${fontSize === f.key ? 'rgba(124,58,237,0.55)' : 'rgba(255,255,255,0.1)'}`,
                  color: fontSize === f.key ? '#a78bfa' : 'rgba(255,255,255,0.55)',
                  fontSize: '0.875rem', fontWeight: 600,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* ── SEÇÃO 2: Conta ── */}
      <SectionCard title="Conta">
        {/* Nome */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Nome completo
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveName()}
              className="cfg-input"
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 10,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(124,58,237,0.2)',
                color: '#fff', fontSize: '0.875rem',
              }}
              placeholder="Seu nome completo"
            />
            <button
              onClick={handleSaveName}
              disabled={nameSaving || !fullName.trim()}
              className="cfg-btn"
              style={{
                padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
                background: 'rgba(124,58,237,0.22)', border: '1px solid rgba(124,58,237,0.4)',
                color: '#a78bfa', fontWeight: 700, fontSize: '0.875rem', whiteSpace: 'nowrap',
              }}
            >
              {nameSaving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
          {nameMsg && (
            <p style={{ color: nameMsg.includes('Erro') ? '#f87171' : '#4ade80', fontSize: '0.8rem', marginTop: 6 }}>
              {nameMsg}
            </p>
          )}
        </div>

        {/* Senha */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, marginBottom: 20 }}>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Senha
          </p>
          <button
            onClick={handleChangePassword}
            className="cfg-btn"
            style={{
              padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: '0.875rem',
            }}
          >
            Trocar senha
          </button>
          {passwordMsg && (
            <p style={{ color: passwordMsg.includes('Erro') ? '#f87171' : '#4ade80', fontSize: '0.8rem', marginTop: 8, maxWidth: 400, lineHeight: 1.5 }}>
              {passwordMsg}
            </p>
          )}
        </div>

        {/* Deletar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Zona de perigo
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="cfg-btn"
            style={{
              padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
              background: 'rgba(185,28,28,0.14)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#f87171', fontWeight: 600, fontSize: '0.875rem',
            }}
          >
            Deletar conta
          </button>
        </div>
      </SectionCard>

      {/* ── SEÇÃO 3: Notificações ── */}
      <SectionCard title="Notificações">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 16 }}>
          <div>
            <p style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 600, marginBottom: 3 }}>Lembrete de check-in</p>
            <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.78rem' }}>Receba um lembrete diário para fazer check-in</p>
          </div>
          <Toggle checked={checkinReminder} onChange={handleCheckinReminder} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 16 }}>
          <div>
            <p style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 600, marginBottom: 3 }}>Notificações de missões</p>
            <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.78rem' }}>Seja notificado sobre novas missões diárias</p>
          </div>
          <Toggle checked={missionNotifs} onChange={handleMissionNotifs} />
        </div>
        <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: '0.75rem', fontStyle: 'italic' }}>
          As notificações dependem das permissões do seu navegador
        </p>
      </SectionCard>

      {/* ── SEÇÃO 4: Privacidade ── */}
      <SectionCard title="Privacidade">
        <div style={{ marginBottom: 20 }}>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Seus dados
          </p>
          <button
            onClick={handleExportData}
            disabled={exporting}
            className="cfg-btn"
            style={{
              padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
              background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.3)',
              color: '#60a5fa', fontWeight: 600, fontSize: '0.875rem',
            }}
          >
            {exporting ? 'Exportando…' : 'Exportar meus dados'}
          </button>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', marginTop: 8 }}>
            Baixa um arquivo JSON com seu perfil, tarefas, metas e transações.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowPrivacyModal(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              color: '#a78bfa', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'underline',
              textUnderlineOffset: 3,
            }}
          >
            Política de Privacidade
          </button>
          <button
            onClick={() => setShowTermsModal(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              color: '#a78bfa', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'underline',
              textUnderlineOffset: 3,
            }}
          >
            Termos de Uso
          </button>
        </div>
      </SectionCard>

      {/* ── Modal: Deletar conta ── */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            background: '#0d0a1e', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 16, padding: 32, maxWidth: 440, width: '100%',
          }}>
            <h3 style={{ color: '#f87171', fontWeight: 800, fontSize: '1.1rem', marginBottom: 12 }}>
              Deletar conta permanentemente
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', marginBottom: 20, lineHeight: 1.7 }}>
              Esta ação é <strong style={{ color: '#f87171' }}>irreversível</strong>. Todos os seus dados serão excluídos.
              Para confirmar, digite <strong style={{ color: '#f87171' }}>DELETAR</strong> abaixo.
            </p>
            <input
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="DELETAR"
              className="cfg-input"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10, marginBottom: 16,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#fff', fontSize: '0.875rem', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText('') }}
                className="cfg-btn"
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 10, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: '0.875rem',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETAR' || deleting}
                className="cfg-btn"
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 10,
                  cursor: deleteConfirmText === 'DELETAR' && !deleting ? 'pointer' : 'not-allowed',
                  background: deleteConfirmText === 'DELETAR' ? 'rgba(185,28,28,0.35)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${deleteConfirmText === 'DELETAR' ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  color: deleteConfirmText === 'DELETAR' ? '#f87171' : 'rgba(255,255,255,0.25)',
                  fontWeight: 700, fontSize: '0.875rem',
                  transition: 'all 0.2s ease',
                }}
              >
                {deleting ? 'Deletando…' : 'Confirmar exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Política de Privacidade ── */}
      {showPrivacyModal && (
        <PolicyModal title="Política de Privacidade" onClose={() => setShowPrivacyModal(false)}>
          <p><strong style={{ color: 'rgba(255,255,255,0.8)' }}>Coleta de dados:</strong> Coletamos apenas os dados necessários para o funcionamento do GrindUP, incluindo nome, email, tarefas, metas e transações financeiras.</p>
          <p><strong style={{ color: 'rgba(255,255,255,0.8)' }}>Uso dos dados:</strong> Seus dados são usados exclusivamente para fornecer os serviços do GrindUP. Não vendemos nem compartilhamos suas informações com terceiros.</p>
          <p><strong style={{ color: 'rgba(255,255,255,0.8)' }}>Armazenamento:</strong> Todos os dados são armazenados de forma segura em servidores com criptografia. Você pode solicitar a exclusão completa a qualquer momento.</p>
          <p><strong style={{ color: 'rgba(255,255,255,0.8)' }}>Cookies:</strong> Utilizamos cookies de sessão para manter você autenticado. Não utilizamos cookies de rastreamento de terceiros.</p>
          <p><strong style={{ color: 'rgba(255,255,255,0.8)' }}>Contato:</strong> Para questões sobre privacidade, entre em contato: suporte@grindup.app</p>
        </PolicyModal>
      )}

      {/* ── Modal: Termos de Uso ── */}
      {showTermsModal && (
        <PolicyModal title="Termos de Uso" onClose={() => setShowTermsModal(false)}>
          <p><strong style={{ color: 'rgba(255,255,255,0.8)' }}>Uso do serviço:</strong> O GrindUP é uma plataforma de produtividade gamificada. Ao usar o serviço, você concorda em utilizá-lo de forma lícita e responsável.</p>
          <p><strong style={{ color: 'rgba(255,255,255,0.8)' }}>Conta:</strong> Você é responsável por manter a segurança da sua conta. Não compartilhe suas credenciais com terceiros.</p>
          <p><strong style={{ color: 'rgba(255,255,255,0.8)' }}>Conteúdo:</strong> Você mantém a propriedade de todos os dados inseridos. O GrindUP não reivindica direitos sobre seu conteúdo.</p>
          <p><strong style={{ color: 'rgba(255,255,255,0.8)' }}>Pagamentos:</strong> Os planos pagos são cobrados mensalmente. Você pode cancelar a qualquer momento. Não há reembolso por períodos parciais já utilizados.</p>
          <p><strong style={{ color: 'rgba(255,255,255,0.8)' }}>Limitações:</strong> O GrindUP não se responsabiliza por perda de dados decorrente de erros do usuário. Faça backups regulares usando a função de exportação.</p>
        </PolicyModal>
      )}
    </div>
  )
}
