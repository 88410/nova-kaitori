import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Activity, ArrowRight, Building2, Clock3, Database, Store as StoreIcon } from 'lucide-react'
import { apiGet } from '../lib/api'
import { type Language, useI18n } from '../i18n'

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

interface DashboardPrice {
  id: number
  price: number
  scraped_at: string | null
  profit: number | null
  store: {
    id: number
    name: string
  } | null
  product: {
    id: number
    name: string
    model: string
    capacity?: string | null
    condition?: string | null
    retail_price?: number | null
  } | null
}

interface HomepageSummary {
  recommended_models: DashboardPrice[]
  stats: {
    last_updated: string | null
    today_updates: number
    total_products: number
    total_stores: number
    price_changes_24h: number
  }
}

function formatCurrency(value: number, language: Language) {
  return new Intl.NumberFormat(
    language === 'ja' ? 'ja-JP' : language === 'zh' ? 'zh-CN' : 'en-US',
    {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0,
    },
  ).format(value)
}

function formatDateTime(value: string | null, language: Language) {
  if (!value) return '—'

  return new Intl.DateTimeFormat(
    language === 'ja' ? 'ja-JP' : language === 'zh' ? 'zh-CN' : 'en-US',
    {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(new Date(value))
}

export default function Home() {
  const { language, t } = useI18n()
  const { data: stores } = useQuery<Store[]>({
    queryKey: ['stores-home'],
    queryFn: async () => apiGet<Store[]>('/api/v1/stores'),
    staleTime: 1000 * 60 * 10,
  })
  const { data: homepageSummary } = useQuery<HomepageSummary>({
    queryKey: ['homepage-summary'],
    queryFn: async () => apiGet<HomepageSummary>('/api/v1/homepage/summary'),
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60,
  })

  const featuredStores = [...(stores ?? [])]
    .sort((a, b) => {
      if (a.is_sponsored && !b.is_sponsored) return -1
      if (!a.is_sponsored && b.is_sponsored) return 1
      return b.priority - a.priority
    })
    .slice(0, 6)

  const stats = homepageSummary?.stats
  const statusItems = [
    {
      icon: Clock3,
      label: t('homeLatestUpdate'),
      value: formatDateTime(stats?.last_updated ?? null, language),
    },
    {
      icon: Activity,
      label: t('homeTodayUpdates'),
      value: (stats?.today_updates ?? 0).toLocaleString(),
    },
    {
      icon: Database,
      label: t('homeTotalProducts'),
      value: (stats?.total_products ?? 0).toLocaleString(),
    },
    {
      icon: StoreIcon,
      label: t('homeActiveStores'),
      value: (stats?.total_stores ?? 0).toLocaleString(),
    },
    {
      icon: Activity,
      label: t('homePriceChanges24h'),
      value: (stats?.price_changes_24h ?? 0).toLocaleString(),
    },
  ]

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

        <section className="mt-8 grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-[28px] border border-slate-200 bg-slate-950 px-6 py-6 text-white shadow-sm sm:px-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">{t('homeFreshnessEyebrow')}</p>
                <h2 className="mt-2 text-2xl font-semibold">{t('homeFreshnessTitle')}</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">{t('homeFreshnessDescription')}</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                {t('homeStatusLive')}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {statusItems.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-slate-300">
                    <item.icon className="h-4 w-4" />
                    <p className="text-xs font-medium uppercase tracking-[0.16em]">{item.label}</p>
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-6 shadow-sm sm:px-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('homeMarketDashboardEyebrow')}</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">{t('homeMarketDashboardTitle')}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{t('homeMarketDashboardDescription')}</p>
              </div>
              <Link to="/prices" className="hidden text-sm font-medium text-slate-700 hover:text-slate-950 sm:block">
                {t('priceDetails')}
              </Link>
            </div>

            {homepageSummary?.recommended_models?.length ? (
              <div className="mt-6 grid gap-4">
                {homepageSummary.recommended_models.map((entry, index) => {
                  const product = entry.product
                  const store = entry.store
                  const summary = [product?.capacity, product?.condition].filter(Boolean).join(t('conditionSeparator'))

                  if (!product || !store) return null

                  return (
                    <Link
                      key={entry.id}
                      to={`/product/${product.id}`}
                      className="group rounded-2xl border border-slate-200 bg-slate-50/80 p-5 transition-colors hover:border-slate-300 hover:bg-white"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="inline-flex rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white">
                            #{index + 1}
                          </div>
                          <h3 className="mt-3 text-lg font-semibold text-slate-950">{product.model || product.name}</h3>
                          {summary && <p className="mt-1 text-sm text-slate-600">{summary}</p>}
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-700" />
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{t('bestBuybackPrice')}</p>
                          <p className="mt-1 text-xl font-semibold text-slate-950">{formatCurrency(entry.price, language)}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{t('retailPrice')}</p>
                          <p className="mt-1 text-xl font-semibold text-slate-950">
                            {product.retail_price ? formatCurrency(product.retail_price, language) : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{t('profit')}</p>
                          <p className="mt-1 text-xl font-semibold text-emerald-700">
                            {entry.profit !== null ? formatCurrency(entry.profit, language) : '—'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-slate-200 pt-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{t('homeDashboardStoreLabel')}</p>
                        <p className="mt-1 text-sm font-medium text-slate-900">{store.name}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-sm text-slate-500">
                {t('homeNoDashboardData')}
              </div>
            )}
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
