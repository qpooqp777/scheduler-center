import { useState, useEffect, useCallback } from 'react'
import { ThemeMode } from '../types'

const THEME_KEY = 'scheduler-theme'

export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(THEME_KEY) as ThemeMode | null
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      return stored
    }
    return 'system'
  })

  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light')
    }
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode)
    localStorage.setItem(THEME_KEY, newMode)
  }, [])

  const resolvedMode = mode === 'system' ? systemPreference : mode

  return { mode, setMode, resolvedMode }
}
