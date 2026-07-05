import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from '@/locales/en.json';
import ar from '@/locales/ar.json';

export const supportedLngs = ['en', 'ar'] as const;
export type AppLang = (typeof supportedLngs)[number];

export const isRTL = (lng: string) => lng === 'ar';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    fallbackLng: 'en',
    supportedLngs: [...supportedLngs],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'app_lang',
      caches: ['localStorage'],
    },
  });

const applyDir = (lng: string) => {
  if (typeof document === 'undefined') return;
  const rtl = isRTL(lng);
  document.documentElement.lang = lng;
  document.documentElement.dir = rtl ? 'rtl' : 'ltr';
  document.documentElement.classList.toggle('font-arabic', rtl);
};

applyDir(i18n.language);
i18n.on('languageChanged', applyDir);

export default i18n;
