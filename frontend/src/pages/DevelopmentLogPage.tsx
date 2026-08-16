import { DEVELOPMENT_LOGS } from './Home'
import { useI18n } from '../i18n'
import { PageHeader } from '../components/PageChrome'

export default function DevelopmentLogPage() {
  const { language, t } = useI18n()
  const developmentLogs = [...DEVELOPMENT_LOGS].reverse()

  return (
    <main className="min-h-screen overflow-hidden bg-[#07080b] text-white">
      <PageHeader title={t('developmentLogTitle')} tone="dark" />

      <section className="relative px-4 pb-24 pt-12 sm:px-6 sm:pt-20 lg:px-8">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-80"
          style={{ background: 'radial-gradient(circle at 50% 0%, rgba(124, 58, 237, 0.16), transparent 68%)' }}
        />
        <div className="relative mx-auto max-w-6xl">
          <p className="text-[11px] font-semibold tracking-[0.28em] text-violet-300/60">DEVELOPMENT ARCHIVE</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-medium tracking-[-0.04em] sm:text-6xl">{t('developmentLogTitle')}</h1>
          <p className="mt-6 max-w-2xl text-sm leading-8 text-white/45 sm:text-base">{t('developmentLogDescription')}</p>

          <div className="mt-12 grid gap-4 sm:mt-16">
            {developmentLogs.map((entry, index) => (
              <article
                key={entry.period}
                className={`grid gap-7 rounded-2xl border border-white/10 border-l-2 p-6 md:grid-cols-[180px_1fr] md:p-8 ${
                  index % 3 === 0
                    ? 'border-l-violet-400/70 bg-[#121022]'
                    : index % 3 === 1
                      ? 'border-l-cyan-400/70 bg-[#0b161e]'
                      : 'border-l-emerald-400/70 bg-[#0b1714]'
                }`}
              >
                <div>
                  <p className="text-2xl font-medium tracking-tight text-white/85">{entry.period}</p>
                  <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300/55">
                    {String(developmentLogs.length - index).padStart(2, '0')} · {entry.phase[language]}
                  </p>
                </div>
                <div className="max-w-3xl">
                  <h2 className="text-xl font-medium leading-8 tracking-tight sm:text-2xl">{entry.title[language]}</h2>
                  <p className="mt-4 text-sm leading-8 text-white/45 sm:text-base">{entry.content[language]}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
