'use client'

import { useState, useRef, useCallback } from 'react'
import { createClientSupabase } from '@/lib/supabase'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 2 * 1024 * 1024  // 2 MB
const MIN_DIMENSION = 200

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface AvatarUploadProps {
  userId: string
  avatarUrl: string | null
  displayName: string
  initials: string
  onAvatarChange: (url: string) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getImageDimensions(objectUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload  = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = () => reject(new Error('Erro ao ler imagem'))
    img.src = objectUrl
  })
}

async function validateAvatarFile(file: File): Promise<string | null> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Formato inválido. Use JPG, PNG ou WEBP'
  }
  if (file.size > MAX_BYTES) {
    return 'Arquivo muito grande. Máximo 2MB para foto de perfil'
  }
  const url = URL.createObjectURL(file)
  try {
    const { w, h } = await getImageDimensions(url)
    if (w < MIN_DIMENSION || h < MIN_DIMENSION) {
      return 'Imagem muito pequena. Mínimo 200x200px para foto de perfil'
    }
  } finally {
    URL.revokeObjectURL(url)
  }
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────────────────────────────────────

function CameraIcon() {
  return (
    <svg
      width={20} height={20} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <div style={{
      width: 14, height: 14,
      border: '2px solid rgba(255,255,255,0.25)',
      borderTopColor: '#fff',
      borderRadius: '50%',
      animation: 'au-spin 0.72s linear infinite',
      flexShrink: 0,
    }} />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function AvatarUpload({
  userId,
  avatarUrl: initialAvatarUrl,
  displayName,
  initials,
  onAvatarChange,
}: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const [preview, setPreview]     = useState<{ file: File; objectUrl: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [success, setSuccess]     = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── File selection & validation ──────────────────────────
  const handleFileSelect = useCallback(async (file: File) => {
    setError(null)

    const objectUrl = URL.createObjectURL(file)
    const err = await validateAvatarFile(file).catch(() => 'Erro ao validar imagem')
    if (err) {
      URL.revokeObjectURL(objectUrl)
      setError(err)
      setTimeout(() => setError(null), 4000)
      return
    }
    setPreview({ file, objectUrl })
  }, [])

  // ── Cancel preview ───────────────────────────────────────
  const cancelPreview = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview.objectUrl)
    setPreview(null)
    setError(null)
  }, [preview])

  // ── Confirm upload ───────────────────────────────────────
  const handleConfirm = useCallback(async () => {
    if (!preview) return
    setUploading(true)
    setError(null)

    try {
      const supabase = createClientSupabase()
      const ext  = preview.file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const path = `${userId}/avatar.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, preview.file, { upsert: true, contentType: preview.file.type })

      if (uploadErr) throw new Error(uploadErr.message)

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      const bustedUrl = `${publicUrl}?t=${Date.now()}`

      const { error: dbErr } = await supabase
        .from('profiles')
        .update({ avatar_url: bustedUrl })
        .eq('id', userId)

      if (dbErr) throw new Error(dbErr.message)

      setAvatarUrl(bustedUrl)
      onAvatarChange(bustedUrl)

      // Success toast for 3s
      setSuccess('Foto de perfil atualizada!')
      if (successTimerRef.current) clearTimeout(successTimerRef.current)
      successTimerRef.current = setTimeout(() => setSuccess(null), 3000)

      cancelPreview()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao fazer upload')
    } finally {
      setUploading(false)
    }
  }, [preview, userId, onAvatarChange, cancelPreview])

  const hasAvatar = Boolean(avatarUrl?.trim())

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes au-spin { to { transform: rotate(360deg); } }
        @keyframes au-fadein {
          from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .au-avatar-wrap .au-cam-overlay { opacity: 0; transition: opacity 0.18s ease; }
        .au-avatar-wrap:hover .au-cam-overlay { opacity: 1; }
      `}</style>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) handleFileSelect(f)
          e.target.value = ''
        }}
      />

      {/* ── Avatar circle ─────────────────────────────────── */}
      <div
        className="au-avatar-wrap"
        title={`Alterar foto de perfil de ${displayName}`}
        onClick={() => inputRef.current?.click()}
        style={{
          position: 'absolute',
          bottom: -48,
          left: 32,
          width: 96,
          height: 96,
          borderRadius: '50%',
          overflow: 'hidden',
          cursor: 'pointer',
          border: '3px solid rgba(124,58,237,0.75)',
          boxShadow: '0 0 28px rgba(124,58,237,0.55)',
          flexShrink: 0,
        }}
      >
        {hasAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl!}
            alt={displayName}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', fontWeight: 900, color: '#fff',
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            userSelect: 'none',
          }}>
            {initials}
          </div>
        )}

        {/* Camera overlay on hover */}
        <div
          className="au-cam-overlay"
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.58)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff',
            borderRadius: '50%',
          }}
        >
          <CameraIcon />
        </div>
      </div>

      {/* ── Error toast (appears above the banner) ────────── */}
      {error && (
        <div style={{
          position: 'absolute',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(185,28,28,0.92)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(248,113,113,0.45)',
          borderRadius: 10,
          padding: '10px 20px',
          color: '#fff',
          fontSize: '0.82rem',
          fontWeight: 600,
          zIndex: 20,
          whiteSpace: 'nowrap',
          animation: 'au-fadein 0.2s ease',
        }}>
          ✕ {error}
        </div>
      )}

      {/* ── Success toast ─────────────────────────────────── */}
      {success && (
        <div style={{
          position: 'absolute',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(5,150,105,0.92)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(52,211,153,0.45)',
          borderRadius: 10,
          padding: '10px 20px',
          color: '#fff',
          fontSize: '0.82rem',
          fontWeight: 600,
          zIndex: 20,
          whiteSpace: 'nowrap',
          animation: 'au-fadein 0.2s ease',
        }}>
          ✓ {success}
        </div>
      )}

      {/* ── Preview modal ─────────────────────────────────── */}
      {preview && (
        <div
          onClick={e => { if (e.target === e.currentTarget && !uploading) cancelPreview() }}
          style={{
            position: 'fixed', inset: 0, zIndex: 500,
            background: 'rgba(0,0,0,0.82)',
            backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
        >
          <div style={{
            width: '90%', maxWidth: 420,
            background: 'linear-gradient(160deg, #0f0a1a 0%, #100c1e 100%)',
            border: '1px solid rgba(124,58,237,0.45)',
            borderRadius: 20,
            boxShadow:
              '0 0 0 1px rgba(124,58,237,0.12), 0 24px 64px rgba(0,0,0,0.7), 0 0 56px rgba(124,58,237,0.14)',
            overflow: 'hidden',
          }}>

            {/* Header */}
            <div style={{
              padding: '20px 24px 16px',
              borderBottom: '1px solid rgba(124,58,237,0.18)',
              background: 'rgba(124,58,237,0.06)',
            }}>
              <p style={{
                margin: 0, fontSize: '0.68rem', fontWeight: 700,
                color: 'rgba(167,139,250,0.8)', textTransform: 'uppercase',
                letterSpacing: '0.08em', marginBottom: 4,
              }}>
                Preview
              </p>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
                Foto de Perfil
              </h3>
            </div>

            {/* Preview image */}
            <div style={{ padding: '24px 24px 0' }}>
              <div style={{
                borderRadius: '50%',
                overflow: 'hidden',
                width: 160, height: 160,
                margin: '0 auto',
                border: '3px solid rgba(124,58,237,0.6)',
                boxShadow: '0 0 32px rgba(124,58,237,0.4)',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview.objectUrl}
                  alt="Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '20px 24px 24px',
              display: 'flex', gap: 10, justifyContent: 'flex-end',
            }}>
              <button
                onClick={cancelPreview}
                disabled={uploading}
                style={{
                  padding: '10px 20px', borderRadius: 10,
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'rgba(255,255,255,0.55)',
                  fontSize: '0.85rem', fontWeight: 600,
                  opacity: uploading ? 0.5 : 1,
                  transition: 'all 0.14s ease',
                }}
              >
                Cancelar
              </button>

              <button
                onClick={handleConfirm}
                disabled={uploading}
                style={{
                  padding: '10px 22px', borderRadius: 10,
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  border: '1px solid rgba(124,58,237,0.65)',
                  background: uploading
                    ? 'rgba(124,58,237,0.2)'
                    : 'linear-gradient(135deg, rgba(124,58,237,0.9), rgba(79,70,229,0.95))',
                  color: '#fff', fontSize: '0.85rem', fontWeight: 700,
                  boxShadow: uploading
                    ? 'none'
                    : '0 0 20px rgba(124,58,237,0.45), 0 4px 12px rgba(0,0,0,0.3)',
                  display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'all 0.14s ease',
                }}
              >
                {uploading ? (
                  <>
                    <SpinnerIcon />
                    Enviando...
                  </>
                ) : (
                  'Confirmar upload'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
