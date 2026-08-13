import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DEVELOPMENT_LOGS } from './Home'
import { useI18n } from '../i18n'

export default function DevelopmentLogPage() {
  const { language, t } = useI18n()
  const developmentLogs = [...DEVELOPMENT_LOGS].reverse()

  return (
    <main className="min-h-screen overflow-hidden bg-[#07080b] text-white">
      <header className="border-b border-white/10 bg-[#07080b]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label={t('back')}>
            <span className="grid h-9 w-9 place-items-center rounded-full border border-white/25 text-xs font-semibold">N</span>
            <span className="hidden text-sm font-semibold tracking-[0.22em] sm:block">NOVATECH</span>
          </Link>
          <a
            href="https://ai.novatekku.com/"
            className="ml-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold transition-colors hover:bg-white hover:text-slate-950"
          >
            NOVA AI
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </header>

      <section className="relative px-4 pb-24 pt-20 sm:px-6 sm:pt-28 lg:px-8">
        <div className="pointer-events-none absolute left-1/2 top-[-18rem] h-[48rem] w-[48rem] -translate-x-1/2 rounded-full bg-violet-600/15 blur-[130px]" />
        <div className="relative mx-auto max-w-6xl">
          <Link to="/" className="inline-flex items-center gap-2 text-xs text-white/45 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            {t('back')}
          </Link>
          <p className="mt-12 text-[11px] font-semibold tracking-[0.28em] text-violet-300/60">DEVELOPMENT ARCHIVE</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-medium tracking-[-0.04em] sm:text-6xl">{t('developmentLogTitle')}</h1>
          <p className="mt-6 max-w-2xl text-sm leading-8 text-white/45 sm:text-base">{t('developmentLogDescription')}</p>

          <div className="mt-16 border-t border-white/10">
            {developmentLogs.map((entry, index) => (
              <article key={entry.period} className="grid gap-7 border-b border-white/10 py-10 md:grid-cols-[180px_1fr] md:py-14">
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
