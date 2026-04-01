import React, { createContext, useState, ReactNode } from 'react'
import { translations, Language, TranslationKey } from './translations'

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

export const I18nContext = createContext<I18nContextType | undefined>(undefined)

const LANGUAGE_KEY = 'scheduler-language'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(LANGUAGE_KEY)
    if (stored && stored in translations) return stored as Language
    return 'zh-TW'
  })

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem(LANGUAGE_KEY, lang)
  }

  const t = (key: TranslationKey): string => translations[language][key] || key

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  )
}
