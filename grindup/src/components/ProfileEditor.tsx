'use client'

import { useState, useRef, useCallback } from 'react'
import { createClientSupabase } from '@/lib/supabase'

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
type UploadType = 'avatar' | 'cover'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_AVATAR_BYTES = 2 * 1024 * 1024
const MAX_COVER_BYTES  = 5 * 1024 * 1024

// ─────────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────────
function getImageDimensions(objectUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload  = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = () => reject(new Error('Erro ao ler imagem'))
    img.src = objectUrl
  })
}

async function validateFile(file: File, type: UploadType): Promise<string | null> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Formato inválido. Use JPG, PNG ou WEBP'
  }
  if (type === 'avatar' && file.size > MAX_AVATAR_BYTES) {
    return 'Arquivo muito grande. Máximo 2MB para foto de perfil'
  }
  if (type === 'cover' && file.size > MAX_COVER_BYTES) {
    return 'Arquivo muito grande. Máximo 5MB para capa'
  }

  const url = URL.createObjectURL(file)
  try {
    const { w, h } = await getImageDimensions(url)
    if (type === 'avatar' && (w < 200 || h < 200)) {
      return 'Imagem muito pequena. Mínimo 200x200px para foto de perfil'
    }
    if (type === 'cover' && (w < 1200 || h < 300)) {
      return 'Imagem muito pequena. Mínimo 1200x300px para capa'
    }
  } finally {
    URL.revokeObjectURL(url)
  }
  return null
}

// ─────────────────────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────────────────────
function CameraIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────
export interface ProfileEditorProps {
  userId: string
  avatarUrl: string | null
  coverUrl: string | null
  displayName: string
  initials: string
  onAvatarChange: (url: string) => void
  onCoverChange:  (url: string) => void
}

type Preview = { file: File; objectUrl: string; type: UploadType }

export default function ProfileEditor({
  userId,
  avatarUrl: initialAvatar,
  coverUrl:  initialCover,
  displayName,
  initials,
  onAvatarChange,
  onCoverChange,
}: ProfileEditorProps) {
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar)
  const [coverUrl,  setCoverUrl]  = useState(initialCover)

  const [preview,   setPreview]   = useState<Preview | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [success,   setSuccess]   = useState<string | null>(null)

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef  = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (file: File, type: UploadType) => {
    setError(null)
    setSuccess(null)

    const objectUrl = URL.createObjectURL(file)
    const err = await validateFile(file, type).catch(() => 'Erro ao validar imagem')
    if (err) {
      URL.revokeObjectURL(objectUrl)
      setError(err)
      return
    }
    setPreview({ file, objectUrl, type })
  }, [])

  async function handleConfirm() {
    if (!preview) return
    setUploading(true)
    setError(null)

    try {
      const supabase = createClientSupabase()
      const ext    = preview.file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const bucket = preview.type === 'avatar' ? 'avatars' : 'covers'
      const path   = `${userId}/${preview.type}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from(bucket)
        .upload(path, preview.file, { upsert: true, contentType: preview.file.type })

      if (uploadErr) throw new Error(uploadErr.message)

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
      const bustedUrl = `${publicUrl}?t=${Date.now()}`

      const column = preview.type === 'avatar' ? 'avatar_url' : 'cover_url'
      const { error: dbErr } = await supabase
        .from('profiles')
        .update({ [column]: bustedUrl })
        .eq('id', userId)

      if (dbErr) throw new Error(dbErr.message)

      if (preview.type === 'avatar') {
        setAvatarUrl(bustedUrl)
        onAvatarChange(bustedUrl)
      } else {
        setCoverUrl(bustedUrl)
        onCoverChange(bustedUrl)
      }

      setSuccess(preview.type === 'avatar' ? 'Foto de perfil atualizada!' : 'Foto de capa atualizada!')
      setTimeout(() => setSuccess(null), 3500)
      cancelPreview()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao fazer upload')
    } finally {
      setUploading(false)
    }
  }

  function cancelPreview() {
    if (preview) URL.revokeObjectURL(preview.objectUrl)
    setPreview(null)
  }

  const hasAvatar = Boolean(avatarUrl?.trim())
  const hasCover  = Boolean(coverUrl?.trim())

  return (
    <>
      <style>{`
        @keyframes bannerShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pe-spin { to { transform: rotate(360deg); } }
        @keyframes pe-fadein { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .pe-upload-zone .pe-overlay { opacity: 0; transition: opacity 0.18s ease; }
        .pe-upload-zone:hover .pe-overlay { opacity: 1; }
      `}</style>

      {/* Hidden file inputs */}
      <input
        ref={avatarInputRef} type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) handleFileSelect(f, 'avatar')
          e.target.value = ''
        }}
      />
      <input
        ref={coverInputRef} type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) handleFileSelect(f, 'cover')
          e.target.value = ''
        }}
      />

      {/* ── Banner + avatar wrapper ── */}
      <div style={{ position: 'relative', marginBottom: 60 }}>

        {/* ── COVER ── */}
        <div
          className="pe-upload-zone"
          style={{ position: 'relative', cursor: 'pointer', height: 180, overflow: 'hidden' }}
          onClick={() => coverInputRef.current?.click()}
          title="Clique para alterar a foto de capa"
        >
          {hasCover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl!}
              alt="Capa"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{
              height: '100%', width: '100%',
              background: 'linear-gradient(135deg, #2d1b4e, #1a0a2e, #0d1a3e, #1e0533)',
              backgroundSize: '400% 400%',
              animation: 'bannerShift 6s ease-in-out infinite',
              position: 'relative',
            }}>
              <div aria-hidden style={{ position: 'absolute', right: 60,  top: 20,  width: 180, height: 180, borderRadius: '50%', background: 'rgba(124,58,237,0.12)', filter: 'blur(50px)' }} />
              <div aria-hidden style={{ position: 'absolute', left: 80,   bottom: 0, width: 120, height: 120, borderRadius: '50%', background: 'rgba(79,70,229,0.15)',  filter: 'blur(35px)' }} />
              <div aria-hidden style={{ position: 'absolute', right: 220, top: 10,  width: 80,  height: 80,  borderRadius: '50%', background: 'rgba(167,139,250,0.08)', filter: 'blur(25px)' }} />
            </div>
          )}

          {/* Cover overlay */}
          <div
            className="pe-overlay"
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.42)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 10, padding: '9px 18px',
              color: '#fff', fontSize: '0.82rem', fontWeight: 600,
            }}>
              <CameraIcon size={15} />
              {hasCover ? 'Alterar capa' : 'Adicionar foto de capa'}
            </div>
          </div>
        </div>

        {/* ── AVATAR ── */}
        <div
          className="pe-upload-zone"
          style={{
            position: 'absolute', bottom: -48, left: 32,
            width: 96, height: 96, borderRadius: '50%',
            cursor: 'pointer', overflow: 'hidden',
            border: '3px solid rgba(124,58,237,0.75)',
            boxShadow: '0 0 28px rgba(124,58,237,0.6)',
          }}
          onClick={e => { e.stopPropagation(); avatarInputRef.current?.click() }}
          title="Clique para alterar a foto de perfil"
        >
          {hasAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl!} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.6rem', fontWeight: 900, color: '#fff',
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            }}>
              {initials}
            </div>
          )}

          {/* Avatar overlay */}
          <div
            className="pe-overlay"
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff',
            }}
          >
            <CameraIcon size={22} />
          </div>
        </div>

        {/* ── Toast: error ── */}
        {error && (
          <div style={{
            position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(185,28,28,0.92)', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(248,113,113,0.45)',
            borderRadius: 10, padding: '10px 20px',
            color: '#fff', fontSize: '0.82rem', fontWeight: 600,
            zIndex: 10, whiteSpace: 'nowrap',
            animation: 'pe-fadein 0.2s ease',
          }}>
            ✕ {error}
          </div>
        )}

        {/* ── Toast: success ── */}
        {success && (
          <div style={{
            position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(5,150,105,0.9)', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(52,211,153,0.45)',
            borderRadius: 10, padding: '10px 20px',
            color: '#fff', fontSize: '0.82rem', fontWeight: 600,
            zIndex: 10, whiteSpace: 'nowrap',
            animation: 'pe-fadein 0.2s ease',
          }}>
            ✓ {success}
          </div>
        )}
      </div>

      {/* ── Preview modal ── */}
      {preview && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={e => { if (e.target === e.currentTarget && !uploading) cancelPreview() }}
        >
          <div style={{
            width: '90%', maxWidth: 520,
            background: 'linear-gradient(160deg, #0f0a1a 0%, #100c1e 100%)',
            border: '1px solid rgba(124,58,237,0.4)',
            borderRadius: 20,
            boxShadow: '0 0 0 1px rgba(124,58,237,0.1), 0 24px 64px rgba(0,0,0,0.6), 0 0 48px rgba(124,58,237,0.12)',
            overflow: 'hidden',
          }}>
            {/* Modal header */}
            <div style={{
              padding: '20px 24px 16px',
              borderBottom: '1px solid rgba(124,58,237,0.15)',
              background: 'rgba(124,58,237,0.05)',
            }}>
              <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 700, color: 'rgba(167,139,250,0.8)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                Preview
              </p>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
                {preview.type === 'avatar' ? 'Foto de Perfil' : 'Foto de Capa'}
              </h3>
            </div>

            {/* Preview image */}
            <div style={{ padding: 24, paddingBottom: 0 }}>
              <div style={{ borderRadius: 12, overflow: 'hidden', background: 'rgba(0,0,0,0.3)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview.objectUrl}
                  alt="Preview"
                  style={{
                    width: '100%',
                    height: preview.type === 'cover' ? 140 : 220,
                    objectFit: preview.type === 'cover' ? 'cover' : 'contain',
                    display: 'block',
                  }}
                />
              </div>
            </div>

            {/* Modal footer */}
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
                    : 'linear-gradient(135deg, rgba(124,58,237,0.88), rgba(79,70,229,0.92))',
                  color: '#fff', fontSize: '0.85rem', fontWeight: 700,
                  boxShadow: uploading ? 'none' : '0 0 20px rgba(124,58,237,0.45), 0 4px 12px rgba(0,0,0,0.3)',
                  display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'all 0.15s ease',
                }}
              >
                {uploading ? (
                  <>
                    <div style={{
                      width: 14, height: 14,
                      border: '2px solid rgba(255,255,255,0.25)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'pe-spin 0.75s linear infinite',
                    }} />
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
