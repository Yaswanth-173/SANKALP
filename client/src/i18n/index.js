import en from './en.js'
import hi from './hi.js'
import te from './te.js'
import { usePreferences } from '../context/PreferencesContext.jsx'

const dictionaries = { en, hi, te }

function lookup(dict, key) {
  return key.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), dict)
}

function interpolate(str, vars) {
  if (!vars) return str
  return str.replace(/\{(\w+)\}/g, (match, name) => (vars[name] !== undefined ? vars[name] : match))
}

export function useTranslation() {
  const { language } = usePreferences()
  const dict = dictionaries[language] || dictionaries.en

  const t = (key, vars) => {
    const value = lookup(dict, key) ?? lookup(dictionaries.en, key)
    if (value === undefined) return key
    return interpolate(value, vars)
  }

  return { t, language }
}
