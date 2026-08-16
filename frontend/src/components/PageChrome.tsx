import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useI18n } from '../i18n'

type PageHeaderProps = {
  title: string
  backTo?: string
  tone?: 'light' | 'dark'
  children?: ReactNode
}

export function PageHeader({ title, backTo = '/', tone = 'light', children }: PageHeaderProps) {
  const { t } = useI18n()
  const dark = tone === 'dark'

  return (
    <header
      className={`sticky top-0 z-40 border-b ${
        dark ? 'border-white/10 bg-[#07080b]' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[76px_minmax(0,1fr)_96px] items-center px-3 sm:h-[72px] sm:grid-cols-[180px_minmax(0,1fr)_180px] sm:px-6 lg:px-8">
        <Link
          to={backTo}
          className={`inline-flex min-w-0 items-center gap-2 text-sm font-medium transition-colors ${
            dark ? 'text-white/60 hover:text-white' : 'text-slate-600 hover:text-slate-950'
          }`}
          aria-label={t('back')}
        >
          {dark ? (
            <>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/25 text-xs font-semibold">N</span>
              <span className="hidden truncate text-xs font-semibold tracking-[0.2em] sm:block">NOVATECH</span>
            </>
          ) : (
            <>
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span className="truncate">{t('back')}</span>
            </>
          )}
        </Link>

        <h1
          className={`truncate px-2 text-center text-sm font-semibold sm:text-base ${
            dark ? 'hidden text-white/75 lg:block' : 'text-slate-950'
          }`}
        >
          {title}
        </h1>

        <div className="flex justify-end">{children}</div>
      </div>

      {dark && (
        <a
          href="https://ai.novatekku.com/"
          className="fixed right-4 top-3 z-[70] inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-3 text-xs font-semibold text-slate-950 shadow-lg shadow-black/20 sm:top-4 sm:px-4"
        >
          NOVA AI
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      )}
    </header>
  )
}

export function LightPage({ children }: { children: ReactNode }) {
  return <div className="min-h-[100dvh] bg-[#f3f5f9] text-slate-950">{children}</div>
}

export const lightPanelClass =
  'rounded-2xl border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.04)]'
