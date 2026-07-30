import { Link } from 'react-router-dom'
import { DEVELOPMENT_LOGS } from './Home'
import { useI18n } from '../i18n'

export default function DevelopmentLogPage() {
  const { language, t } = useI18n()
  const developmentLogs = [...DEVELOPMENT_LOGS].reverse()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-900">
            ← {t('back')}
          </Link>
          <h1 className="text-lg font-semibold text-slate-900">{t('developmentLogTitle')}</h1>
          <span className="w-10" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8">
          <p className="text-sm leading-7 text-slate-600">{t('developmentLogDescription')}</p>
          <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
            {developmentLogs.map((entry) => (
              <article key={entry.period} className="grid gap-4 py-5 md:grid-cols-[150px_1fr]">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{entry.period}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {t('developmentLogPhase')}: {entry.phase[language]}
                  </p>
                </div>
                <div>
                  <h2 className="text-base font-semibold leading-6 text-slate-950">{entry.title[language]}</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{entry.content[language]}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
