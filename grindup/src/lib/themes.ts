export type ThemeName = 'default' | 'dark' | 'light'

const THEMES: Record<ThemeName, Record<string, string>> = {
  default: {
    '--color-bg-primary':    '#0a0a0f',
    '--color-bg-secondary':  '#0d0a1e',
    '--color-bg-card':       'rgba(255,255,255,0.03)',
    '--color-bg-card-hover': 'rgba(255,255,255,0.06)',
    '--color-bg-input':      'rgba(255,255,255,0.06)',
    '--color-bg-modal':      '#0d0a1e',
    '--color-sidebar-bg':    'rgba(15,10,30,0.97)',
    '--color-header-bg':     'rgba(10,10,15,0.97)',
    '--color-border':        'rgba(124,58,237,0.18)',
    '--color-border-strong': 'rgba(124,58,237,0.38)',
    '--color-divider':       'rgba(255,255,255,0.08)',
    '--color-text-primary':  '#ffffff',
    '--color-text-secondary':'rgba(255,255,255,0.55)',
    '--color-text-muted':    'rgba(255,255,255,0.3)',
    '--color-accent':        '#7c3aed',
    '--color-accent-soft':   'rgba(124,58,237,0.16)',
    '--color-success':       '#10b981',
    '--color-danger':        '#ef4444',
    '--color-warning':       '#f59e0b',
  },
  dark: {
    '--color-bg-primary':    '#000000',
    '--color-bg-secondary':  '#0a0a0a',
    '--color-bg-card':       'rgba(255,255,255,0.04)',
    '--color-bg-card-hover': 'rgba(255,255,255,0.08)',
    '--color-bg-input':      'rgba(255,255,255,0.07)',
    '--color-bg-modal':      '#0a0a0a',
    '--color-sidebar-bg':    'rgba(0,0,0,0.98)',
    '--color-header-bg':     'rgba(0,0,0,0.98)',
    '--color-border':        'rgba(255,255,255,0.1)',
    '--color-border-strong': 'rgba(255,255,255,0.28)',
    '--color-divider':       'rgba(255,255,255,0.09)',
    '--color-text-primary':  '#ffffff',
    '--color-text-secondary':'rgba(255,255,255,0.6)',
    '--color-text-muted':    'rgba(255,255,255,0.35)',
    '--color-accent':        '#7c3aed',
    '--color-accent-soft':   'rgba(124,58,237,0.18)',
    '--color-success':       '#10b981',
    '--color-danger':        '#ef4444',
    '--color-warning':       '#f59e0b',
  },
  light: {
    '--color-bg-primary':    '#f4f4f8',
    '--color-bg-secondary':  '#ffffff',
    '--color-bg-card':       'rgba(255,255,255,0.9)',
    '--color-bg-card-hover': '#ffffff',
    '--color-bg-input':      'rgba(0,0,0,0.04)',
    '--color-bg-modal':      '#ffffff',
    '--color-sidebar-bg':    'rgba(255,255,255,0.98)',
    '--color-header-bg':     'rgba(248,248,252,0.98)',
    '--color-border':        'rgba(124,58,237,0.14)',
    '--color-border-strong': 'rgba(124,58,237,0.35)',
    '--color-divider':       'rgba(0,0,0,0.07)',
    '--color-text-primary':  '#1a1a2e',
    '--color-text-secondary':'#4a4a6a',
    '--color-text-muted':    '#8b8ba0',
    '--color-accent':        '#7c3aed',
    '--color-accent-soft':   'rgba(124,58,237,0.1)',
    '--color-success':       '#059669',
    '--color-danger':        '#dc2626',
    '--color-warning':       '#d97706',
  },
}

export function applyTheme(theme: ThemeName) {
  const vars = THEMES[theme]
  const root = document.documentElement
  Object.entries(vars).forEach(([key, value]) => root.style.setProperty(key, value))
  root.setAttribute('data-theme', theme)
  document.body.style.background = vars['--color-bg-primary']
  document.body.style.color = vars['--color-text-primary']
}
