import { useI18n, type Language } from '../i18n'

const LANGUAGE_OPTIONS: Language[] = ['en', 'zh', 'ja']

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n()
  const isCompanySite = import.meta.env.VITE_SITE_MODE === 'company'

  return (
    <div className={`fixed top-4 z-[60] ${isCompanySite ? 'right-[7.25rem] sm:right-[7.75rem]' : 'right-4'}`}>
      <label className="sr-only" htmlFor="language-select">
        {t('languageLabel')}
      </label>
      <select
        id="language-select"
        value={language}
        onChange={(event) => setLanguage(event.target.value as Language)}
        className={`h-10 rounded-full px-3 text-xs shadow-sm outline-none backdrop-blur sm:px-4 sm:text-sm ${
          isCompanySite
            ? 'border border-white/15 bg-[#07080b]/80 text-white focus:border-white/40'
            : 'border border-slate-200 bg-white/95 text-slate-700 focus:border-slate-400'
        }`}
      >
        {LANGUAGE_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option === 'en' ? t('languageEnglish') : option === 'zh' ? t('languageChinese') : t('languageJapanese')}
          </option>
        ))}
      </select>
    </div>
  )
}
