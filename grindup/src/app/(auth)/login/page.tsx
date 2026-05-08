'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClientSupabase } from '@/lib/supabase'

const ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': 'Email ou senha incorretos',
  'Email not confirmed': 'Confirme seu email antes de fazer login',
  'Too many requests': 'Muitas tentativas. Aguarde alguns minutos e tente novamente',
}

function translateError(msg: string): string {
  return ERROR_MAP[msg] ?? 'Ocorreu um erro. Tente novamente.'
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const supabase = createClientSupabase()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(translateError(error.message))
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'https://grind-up-ten.vercel.app/auth/callback' },
    })

    if (error) {
      setError('Erro ao conectar com Google. Tente novamente.')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-black tracking-tight text-white">
          Grind<span className="glow-up-text">UP</span>
        </h1>
        <p className="tagline-anim mt-3 text-sm tracking-widest text-gray-500 uppercase">
          Eleve sua vida para outro nível!
        </p>
      </div>

      {/* Card com borda gradiente */}
      <div className="auth-card-border w-full max-w-md">
        <div className="auth-card-inner w-full px-8 py-8">
          <h2 className="mb-6 text-lg font-semibold text-white">Entrar na conta</h2>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="btn-google mb-6 flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-medium text-gray-900"
          >
            <GoogleIcon />
            {googleLoading ? 'Redirecionando...' : 'Continuar com Google'}
          </button>

          {/* Divisor */}
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: 'rgba(124,58,237,0.15)' }} />
            <span className="text-xs text-gray-600">ou</span>
            <div className="h-px flex-1" style={{ background: 'rgba(124,58,237,0.15)' }} />
          </div>

          {/* Formulário */}
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-widest text-gray-500">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                className="auth-input w-full rounded-xl px-4 py-3 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-widest text-gray-500">
                Senha
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="auth-input w-full rounded-xl px-4 py-3 text-sm"
              />
            </div>

            {error && (
              <div
                className="rounded-xl px-4 py-3 text-sm text-red-400"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-violet-glow mt-1 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Não tem conta?{' '}
            <Link
              href="/cadastro"
              className="font-medium text-violet-400 transition hover:text-violet-300"
            >
              Criar conta grátis
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}
