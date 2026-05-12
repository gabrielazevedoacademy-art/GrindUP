export type ThemeName = 'default' | 'dark' | 'light'

export const themes: Record<ThemeName, Record<string, string>> = {
  default: {
    '--bg-primary': '#0a0a0f',
    '--bg-secondary': '#0d0a1e',
    '--text-primary': '#ffffff',
    '--accent': '#7c3aed',
  },
  dark: {
    '--bg-primary': '#000000',
    '--bg-secondary': '#0a0a0a',
    '--text-primary': '#ffffff',
    '--accent': '#7c3aed',
  },
  light: {
    '--bg-primary': '#f8f9fa',
    '--bg-secondary': '#ffffff',
    '--text-primary': '#1a1a2e',
    '--accent': '#7c3aed',
  },
}

export function applyTheme(theme: ThemeName) {
  const vars = themes[theme]
  Object.entries(vars).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value)
  })
}
