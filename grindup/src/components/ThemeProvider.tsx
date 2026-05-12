'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { applyTheme, type ThemeName } from '@/lib/themes'

type ThemeContextType = {
  theme: ThemeName
  setTheme: (t: ThemeName) => void
  fontSize: string
  setFontSize: (s: string) => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'default',
  setTheme: () => {},
  fontSize: 'medium',
  setFontSize: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

const FONT_SIZES: Record<string, string> = {
  small: '14px',
  medium: '16px',
  large: '18px',
}

function applyFontSize(size: string) {
  // Set directly on <html> so all rem-based sizes respond immediately
  document.documentElement.style.fontSize = FONT_SIZES[size] || '16px'
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>('default')
  const [fontSize, setFontSizeState] = useState('medium')

  useEffect(() => {
    const savedTheme = (localStorage.getItem('grindup_theme') as ThemeName) || 'default'
    const savedFontSize = localStorage.getItem('grindup_font_size') || 'medium'
    setThemeState(savedTheme)
    setFontSizeState(savedFontSize)
    applyTheme(savedTheme)
    applyFontSize(savedFontSize)
  }, [])

  function setTheme(t: ThemeName) {
    setThemeState(t)
    localStorage.setItem('grindup_theme', t)
    applyTheme(t)
  }

  function setFontSize(s: string) {
    setFontSizeState(s)
    localStorage.setItem('grindup_font_size', s)
    applyFontSize(s)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, fontSize, setFontSize }}>
      {children}
    </ThemeContext.Provider>
  )
}
