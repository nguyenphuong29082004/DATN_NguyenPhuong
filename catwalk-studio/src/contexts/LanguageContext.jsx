/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { en, vi } from '../locales';

const STORAGE_KEY = 'catwalk_language';
const DEFAULT_LANG = 'vi';

const locales = { en, vi };

const LanguageContext = createContext({});

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

/**
 * Resolve a dot-separated key from an object
 * e.g. t('landing.hero.subtitle') → locales.vi.landing.hero.subtitle
 */
function resolve(obj, path) {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
    } catch {
      return DEFAULT_LANG;
    }
  });

  const setLang = useCallback((newLang) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch { /* ignore */ }
    // Update the html lang attribute
    document.documentElement.lang = newLang;
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'vi' ? 'en' : 'vi');
  }, [lang, setLang]);

  /**
   * Translation function.
   * Usage: t('landing.hero.subtitle') or t('auth.signIn')
   */
  const t = useCallback((key, replacements) => {
    const value = resolve(locales[lang], key) ?? resolve(locales['en'], key) ?? key;
    if (typeof value !== 'string') return value;
    if (!replacements) return value;
    // Simple template replacement: {key} → value
    return value.replace(/\{(\w+)\}/g, (_, k) => replacements[k] ?? `{${k}}`);
  }, [lang]);

  const value = useMemo(() => ({
    lang,
    setLang,
    toggleLang,
    t,
    isVi: lang === 'vi',
    isEn: lang === 'en',
  }), [lang, setLang, toggleLang, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
