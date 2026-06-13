import { createContext, useContext } from 'react'
import en from './en'
import es from './es'

export type Translations = { [K in keyof typeof en]: string }

export const translations: Record<'en' | 'es', Translations> = { en, es }

export const I18nContext = createContext<Translations>(en as Translations)

export function useT(): Translations {
  return useContext(I18nContext)
}
