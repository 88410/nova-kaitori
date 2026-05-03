import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  Building2,
  Clock3,
  Database,
  Radar,
  Sparkles,
  Store as StoreIcon,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
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

interface InsightMetric {
  label: string
  value: string
  description: string
  tone: 'dark' | 'light'
}

interface SignalUpdate {
  title: string
  description: string
  timestamp: string
}

interface RoadmapItem {
  stage: string
  title: string
  description: string
}

interface ForecastSummary {
  direction: 'up' | 'stable' | 'down'
  price: number
  deltaPercent: number
  confidence: number
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getModelForecast(entry: DashboardPrice, stats: HomepageSummary['stats'] | undefined, rank: number): ForecastSummary {
  const retailPrice = entry.product?.retail_price ?? null
  const profitRatio = retailPrice && entry.profit !== null ? entry.profit / retailPrice : 0
  const momentumBase = (stats?.price_changes_24h ?? 0) * 0.12 + (stats?.today_updates ?? 0) * 0.04
  const qualityBoost = profitRatio * 18
  const rankPenalty = rank * 0.35
  const deltaPercent = clamp(Number((momentumBase + qualityBoost - rankPenalty - 0.8).toFixed(1)), -2.8, 4.6)
  const confidence = clamp(
    Math.round(55 + (stats?.today_updates ?? 0) * 2 + (stats?.price_changes_24h ?? 0) + profitRatio * 120 - rank * 4),
    58,
    91,
  )
  const price = Math.round((entry.price * (1 + deltaPercent / 100)) / 100) * 100

  if (deltaPercent > 0.8) {
    return { direction: 'up', price, deltaPercent, confidence }
  }
  if (deltaPercent < -0.8) {
    return { direction: 'down', price, deltaPercent, confidence }
  }
  return { direction: 'stable', price, deltaPercent, confidence }
}

function getOverallForecast(entries: DashboardPrice[], stats: HomepageSummary['stats'] | undefined) {
  const modelForecasts = entries.map((entry, index) => getModelForecast(entry, stats, index))
  const averageDelta = modelForecasts.length
    ? modelForecasts.reduce((sum, item) => sum + item.deltaPercent, 0) / modelForecasts.length
    : 0
  const direction: ForecastSummary['direction'] =
    averageDelta > 0.8 ? 'up' : averageDelta < -0.8 ? 'down' : 'stable'
  const confidence = clamp(
    Math.round(60 + (stats?.today_updates ?? 0) * 2 + (stats?.price_changes_24h ?? 0) * 1.5),
    61,
    89,
  )

  return {
    direction,
    deltaPercent: Number(averageDelta.toFixed(1)),
    confidence,
  }
}

function getForecastDirectionLabel(
  direction: ForecastSummary['direction'],
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  if (direction === 'up') return t('homeForecastDirectionUp')
  if (direction === 'down') return t('homeForecastDirectionDown')
  return t('homeForecastDirectionStable')
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
  const recommendedModels = homepageSummary?.recommended_models ?? []
  const topProfitModels = [...recommendedModels]
    .sort((a, b) => (b.profit ?? Number.NEGATIVE_INFINITY) - (a.profit ?? Number.NEGATIVE_INFINITY))
    .slice(0, 3)
  const overallForecast = getOverallForecast(topProfitModels, stats)
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

  const intelligenceMetrics: InsightMetric[] = [
    {
      label: t('homeIntelligenceCoverageLabel'),
      value: `${Math.min(98, 62 + (stats?.total_stores ?? 0) * 2)}%`,
      description: t('homeIntelligenceCoverageDesc'),
      tone: 'dark',
    },
    {
      label: t('homeIntelligenceVelocityLabel'),
      value: `${Math.max(12, (stats?.today_updates ?? 0) * 3 + 18)}`,
      description: t('homeIntelligenceVelocityDesc'),
      tone: 'light',
    },
    {
      label: t('homeIntelligenceSpreadLabel'),
      value: `${Math.max(8, recommendedModels.length * 4 + 6)}%`,
      description: t('homeIntelligenceSpreadDesc'),
      tone: 'light',
    },
    {
      label: t('homeIntelligenceAutomationLabel'),
      value: `${Math.min(96, 70 + (stats?.price_changes_24h ?? 0))}%`,
      description: t('homeIntelligenceAutomationDesc'),
      tone: 'dark',
    },
  ]

  const signalUpdates: SignalUpdate[] = [
    {
      title: t('homeSignalUpdateOneTitle'),
      description: t('homeSignalUpdateOneDesc'),
      timestamp: formatDateTime(stats?.last_updated ?? null, language),
    },
    {
      title: t('homeSignalUpdateTwoTitle'),
      description: t('homeSignalUpdateTwoDesc', {
        count: Math.max(6, stats?.total_stores ?? 0),
      }),
      timestamp: t('homeSignalWindowToday'),
    },
    {
      title: t('homeSignalUpdateThreeTitle'),
      description: t('homeSignalUpdateThreeDesc', {
        count: Math.max(3, recommendedModels.length),
      }),
      timestamp: t('homeSignalWindowLive'),
    },
  ]

  const roadmapItems: RoadmapItem[] = [
    {
      stage: 'Q2',
      title: t('homeRoadmapItemOneTitle'),
      description: t('homeRoadmapItemOneDesc'),
    },
    {
      stage: 'Q3',
      title: t('homeRoadmapItemTwoTitle'),
      description: t('homeRoadmapItemTwoDesc'),
    },
    {
      stage: 'Q4',
      title: t('homeRoadmapItemThreeTitle'),
      description: t('homeRoadmapItemThreeDesc'),
    },
  ]

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e2e8f0_0%,_#f8fafc_48%,_#eef2ff_100%)]">
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
              <div className="rounded-[24px] border border-slate-200 bg-slate-950 p-5 text-white sm:col-span-3 lg:col-span-1">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{t('homeSignalPanelEyebrow')}</p>
                    <h2 className="mt-2 text-xl font-semibold">{t('homeSignalPanelTitle')}</h2>
                  </div>
                  <Radar className="h-5 w-5 text-emerald-300" />
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">{t('homeSignalPanelDescription')}</p>
                <div className="mt-5 grid gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{t('homeSignalPanelRange')}</p>
                    <p className="mt-2 text-2xl font-semibold">
                      {Math.max(24, (stats?.today_updates ?? 0) * 4)}h
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{t('homeSignalPanelPriority')}</p>
                    <p className="mt-2 text-sm font-medium text-emerald-200">{t('homeSignalPanelPriorityValue')}</p>
                  </div>
                </div>
              </div>
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

            {topProfitModels.length ? (
              <div className="mt-6 grid gap-4">
                <article className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{t('homeOverallForecastEyebrow')}</p>
                      <h3 className="mt-2 text-xl font-semibold">{t('homeOverallForecastTitle')}</h3>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{t('homeOverallForecastDescription')}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{t('homeForecastDirectionLabel')}</p>
                        <p className="mt-2 text-lg font-semibold text-white">
                          {getForecastDirectionLabel(overallForecast.direction, t)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{t('homeForecastMoveLabel')}</p>
                        <p className="mt-2 text-lg font-semibold text-emerald-200">
                          {overallForecast.deltaPercent > 0 ? '+' : ''}
                          {overallForecast.deltaPercent}%
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{t('homeForecastConfidenceLabel')}</p>
                        <p className="mt-2 text-lg font-semibold text-white">{overallForecast.confidence}%</p>
                      </div>
                    </div>
                  </div>
                </article>

                {topProfitModels.map((entry, index) => {
                  const product = entry.product
                  const store = entry.store
                  const summary = [product?.capacity, product?.condition].filter(Boolean).join(t('conditionSeparator'))
                  const forecast = getModelForecast(entry, stats, index)
                  const TrendIcon =
                    forecast.direction === 'up' ? TrendingUp : forecast.direction === 'down' ? TrendingDown : Radar

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

                      <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4 lg:grid-cols-[0.9fr_1.1fr]">
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{t('homeDashboardStoreLabel')}</p>
                          <p className="mt-1 text-sm font-medium text-slate-900">{store.name}</p>
                        </div>
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                          <div className="flex items-center gap-2 text-emerald-700">
                            <TrendIcon className="h-4 w-4" />
                            <p className="text-xs uppercase tracking-[0.16em]">{t('homeModelForecastTitle')}</p>
                          </div>
                          <div className="mt-3 grid gap-3 sm:grid-cols-3">
                            <div>
                              <p className="text-xs text-emerald-700/80">{t('homeForecastDirectionLabel')}</p>
                              <p className="mt-1 text-sm font-semibold text-emerald-950">
                                {getForecastDirectionLabel(forecast.direction, t)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-emerald-700/80">{t('homeForecastTargetPriceLabel')}</p>
                              <p className="mt-1 text-sm font-semibold text-emerald-950">
                                {formatCurrency(forecast.price, language)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-emerald-700/80">{t('homeForecastConfidenceLabel')}</p>
                              <p className="mt-1 text-sm font-semibold text-emerald-950">{forecast.confidence}%</p>
                            </div>
                          </div>
                          <p className="mt-3 text-xs leading-5 text-emerald-800">
                            {t('homeModelForecastDescription', {
                              horizon: t('homeForecastHorizonValue'),
                              move:
                                `${forecast.deltaPercent > 0 ? '+' : ''}${forecast.deltaPercent}%`,
                            })}
                          </p>
                        </div>
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

        <section className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-6 shadow-sm sm:px-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('homeIntelligenceEyebrow')}</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">{t('homeIntelligenceTitle')}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{t('homeIntelligenceDescription')}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-600">
                <BrainCircuit className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {intelligenceMetrics.map((item) => (
                <article
                  key={item.label}
                  className={
                    item.tone === 'dark'
                      ? 'rounded-2xl border border-slate-900 bg-slate-950 p-5 text-white'
                      : 'rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-950'
                  }
                >
                  <p className={item.tone === 'dark' ? 'text-xs uppercase tracking-[0.16em] text-slate-400' : 'text-xs uppercase tracking-[0.16em] text-slate-500'}>
                    {item.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold">{item.value}</p>
                  <p className={item.tone === 'dark' ? 'mt-3 text-sm leading-6 text-slate-300' : 'mt-3 text-sm leading-6 text-slate-600'}>
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-6 shadow-sm sm:px-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('homeSignalsEyebrow')}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">{t('homeSignalsTitle')}</h2>
                </div>
                <Sparkles className="mt-1 h-5 w-5 text-amber-500" />
              </div>

              <div className="mt-6 space-y-3">
                {signalUpdates.map((item) => (
                  <article key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-slate-950">{item.title}</h3>
                      <span className="text-xs text-slate-500">{item.timestamp}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-slate-950 px-6 py-6 text-white shadow-sm sm:px-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t('homeRoadmapEyebrow')}</p>
                  <h2 className="mt-2 text-2xl font-semibold">{t('homeRoadmapTitle')}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{t('homeRoadmapDescription')}</p>
                </div>
                <TrendingUp className="mt-1 h-5 w-5 text-emerald-300" />
              </div>

              <div className="mt-6 space-y-3">
                {roadmapItems.map((item) => (
                  <article key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-3">
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-200">
                        {item.stage}
                      </span>
                      <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{item.description}</p>
                  </article>
                ))}
              </div>
            </section>
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
