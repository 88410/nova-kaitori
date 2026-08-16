import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Building2 } from 'lucide-react'
import { useI18n } from '../i18n'
import { apiGet } from '../lib/api'

const STORE_ACCENTS = [
  'border-l-violet-500 bg-violet-50/50',
  'border-l-cyan-500 bg-cyan-50/50',
  'border-l-emerald-500 bg-emerald-50/50',
]

interface Store {
  id: number
  name: string
  website_url?: string | null
  summary?: string | null
  is_sponsored?: boolean
  priority: number
}

export default function Stores() {
  const { t } = useI18n()
  const { data: stores } = useQuery<Store[]>({
    queryKey: ['stores'],
    queryFn: async () => apiGet<Store[]>('/api/v1/stores'),
    staleTime: 1000 * 60 * 10,
  })

  const visibleStores = [...(stores ?? [])].sort((a, b) => {
    if (a.is_sponsored && !b.is_sponsored) return -1
    if (!a.is_sponsored && b.is_sponsored) return 1
    return b.priority - a.priority
  })

  return (
    <div className="min-h-[100dvh] bg-[#f3f5f9] text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-3 sm:px-4">
          <Link to="/" className="shrink-0 text-sm font-medium text-slate-600 hover:text-slate-950">
            ← {t('back')}
          </Link>
          <h2 className="min-w-0 truncate px-2 text-base font-semibold text-slate-950 sm:text-lg">{t('homeStoreListTitle')}</h2>
          <span className="w-16 shrink-0" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-8">
        <section className="sm:rounded-2xl sm:border sm:border-slate-200 sm:bg-white sm:p-6">
          <p className="hidden text-xs font-semibold uppercase tracking-[0.18em] text-violet-600 sm:block">{t('homeFeaturedStores')}</p>
          <h1 className="text-xl font-semibold text-slate-950 sm:mt-2 sm:text-2xl">{t('homeStoreListTitle')}</h1>
          <p className="mt-1 text-sm leading-6 text-slate-600 sm:mt-2">{t('homeStoreListDescription')}</p>

          {visibleStores.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-slate-300 px-4 py-8 text-sm text-slate-500">
              {t('homeEmptyStores')}
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:mt-6 sm:gap-4 md:grid-cols-2">
              {visibleStores.map((store, index) => (
                <article key={store.id} className={`rounded-xl border border-l-4 border-slate-200 p-4 ${STORE_ACCENTS[index % STORE_ACCENTS.length]}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-semibold text-slate-950">{store.name}</h3>
                        {store.is_sponsored && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                            Sponsor
                          </span>
                        )}
                      </div>
                      {store.summary && (
                        <p
                          className="mt-2 overflow-hidden text-sm leading-6 text-slate-600"
                          style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2 }}
                        >
                          {store.summary}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 rounded-lg border border-white bg-white/80 p-2 text-slate-500 shadow-sm">
                      <Building2 className="h-4 w-4" />
                    </div>
                  </div>

                  {store.website_url && (
                    <a
                      href={store.website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:text-slate-950 sm:mt-4"
                    >
                      {t('homeStoreWebsite')}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
