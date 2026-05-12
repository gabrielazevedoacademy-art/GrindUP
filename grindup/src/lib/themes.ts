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
    '--bg-primary': '#f0f0f8',
    '--bg-secondary': '#ffffff',
    '--text-primary': '#1a1a2e',
    '--accent': '#7c3aed',
  },
}

export function applyTheme(theme: ThemeName) {
  const vars = themes[theme]
  // Apply CSS variables to :root
  Object.entries(vars).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value)
  })
  // Set data-theme for CSS rule selectors
  document.documentElement.setAttribute('data-theme', theme)
  // Apply body background and color directly so inline-styled wrappers inherit
  document.body.style.background = vars['--bg-primary']
  document.body.style.color = vars['--text-primary']
}
