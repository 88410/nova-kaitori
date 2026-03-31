import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowRight, Building2 } from 'lucide-react'
import { apiGet } from '../lib/api'
import { useI18n } from '../i18n'

interface Store {
  id: number
  name: string
  name_kana?: string | null
  website_url?: string | null
  address?: string | null
  phone?: string | null
  summary?: string | null
  is_sponsored?: boolean
  priority: number
}

export default function Home() {
  const { t } = useI18n()
  const { data: stores } = useQuery<Store[]>({
    queryKey: ['stores-home'],
    queryFn: async () => apiGet<Store[]>('/api/v1/stores'),
    staleTime: 1000 * 60 * 10,
  })

  const featuredStores = [...(stores ?? [])]
    .sort((a, b) => {
      if (a.is_sponsored && !b.is_sponsored) return -1
      if (!a.is_sponsored && b.is_sponsored) return 1
      return b.priority - a.priority
    })
    .slice(0, 6)

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:py-10">
            <div>
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                NOVA
              </div>
              <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                {t('homeHeroTitle')}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                {t('homeHeroDescription')}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/ai"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                >
                  {t('homePrimaryCta')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/prices"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
                >
                  {t('homeSecondaryCta')}
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[t('homeQuickPointOne'), t('homeQuickPointTwo'), t('homeQuickPointThree')].map((point) => (
                <div key={point} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-sm font-medium text-slate-900">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-slate-200 bg-white px-6 py-6 shadow-sm sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('homeFeaturedStores')}</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">{t('homeStoreListTitle')}</h2>
              <p className="mt-2 text-sm text-slate-600">{t('homeStoreListDescription')}</p>
            </div>
            <Link to="/prices" className="hidden text-sm font-medium text-slate-700 hover:text-slate-950 sm:block">
              {t('priceDetails')}
            </Link>
          </div>

          {featuredStores.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-sm text-slate-500">
              {t('homeEmptyStores')}
            </div>
          ) : (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {featuredStores.map((store) => (
                <article key={store.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-950">{store.name}</h3>
                        {store.is_sponsored && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                            Sponsor
                          </span>
                        )}
                      </div>
                      {store.summary && <p className="mt-2 text-sm leading-6 text-slate-600">{store.summary}</p>}
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-500">
                      <Building2 className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-4 pt-1">
                    {store.website_url && (
                      <a
                        href={store.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
                      >
                        {t('homeStoreWebsite')}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
