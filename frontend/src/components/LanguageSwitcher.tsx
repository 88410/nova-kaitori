import { useI18n, type Language } from '../i18n'

const LANGUAGE_OPTIONS: Language[] = ['en', 'zh', 'ja']

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n()

  return (
    <div className="fixed right-4 top-4 z-50">
      <label className="sr-only" htmlFor="language-select">
        {t('languageLabel')}
      </label>
      <select
        id="language-select"
        value={language}
        onChange={(event) => setLanguage(event.target.value as Language)}
        className="rounded-full border border-slate-200 bg-white/95 px-4 py-2 text-sm text-slate-700 shadow-sm outline-none backdrop-blur focus:border-slate-400"
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
