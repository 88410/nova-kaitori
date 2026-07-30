import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Building2 } from 'lucide-react'
import { useI18n } from '../i18n'
import { apiGet } from '../lib/api'

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
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-900">
            ← {t('back')}
          </Link>
          <h2 className="text-lg font-semibold text-slate-900">{t('homeStoreListTitle')}</h2>
          <span className="w-10" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('homeFeaturedStores')}</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">{t('homeStoreListTitle')}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{t('homeStoreListDescription')}</p>

          {visibleStores.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-slate-300 px-4 py-8 text-sm text-slate-500">
              {t('homeEmptyStores')}
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {visibleStores.map((store) => (
                <article key={store.id} className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-950">{store.name}</h3>
                        {store.is_sponsored && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                            Sponsor
                          </span>
                        )}
                      </div>
                      {store.summary && <p className="mt-2 text-sm leading-6 text-slate-600">{store.summary}</p>}
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500">
                      <Building2 className="h-4 w-4" />
                    </div>
                  </div>

                  {store.website_url && (
                    <a
                      href={store.website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
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
