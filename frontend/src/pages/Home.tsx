import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Activity, ArrowRight, Clock3, Database, Store as StoreIcon, UserPlus, UserRound } from 'lucide-react'
import { apiGet } from '../lib/api'
import { getCurrentMember } from '../lib/member'
import { type Language, useI18n } from '../i18n'

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
    first_collected_at: string | null
    latest_collected_at: string | null
    today_updates: number
    total_products: number
    total_stores: number
    total_price_records: number
    latest_price_records: number
    total_history_records: number
    total_daily_high_records: number
    covered_days: number
    price_changes_24h: number
  }
}

export interface DevelopmentLogEntry {
  period: string
  phase: Record<Language, string>
  title: Record<Language, string>
  content: Record<Language, string>
}

export const DEVELOPMENT_LOGS: DevelopmentLogEntry[] = [
  {
    period: '2025.05',
    phase: {
      en: 'Architecture Start',
      zh: '架构启动',
      ja: 'アーキテクチャ開始',
    },
    title: {
      en: 'Defined the price intelligence architecture for NOVA AI',
      zh: '确定 NOVA AI 价格智能平台架构',
      ja: 'NOVA AIの価格インテリジェンス基盤を設計',
    },
    content: {
      en: 'The initial build focused on the technical shape of the product: product master data, store master data, buyback price records, update timestamps, and a ranking model that could compare stores by device and capacity. The goal was to move from manual store checking to a structured price intelligence layer that could later power dashboards, product pages, and AI recommendations.',
      zh: '最初阶段重点确定平台的技术结构：商品主数据、店铺主数据、回收价格记录、更新时间字段，以及按机型和容量比较各店铺报价的排序模型。目标不是做一个静态展示页，而是把人工逐店查询改造成结构化的价格智能层，为后续仪表盘、商品详情和 AI 推荐打底。',
      ja: '初期段階では、商品マスタ、店舗マスタ、買取価格レコード、更新日時、機種・容量ごとの店舗ランキングなど、プロダクトの技術構造を整理しました。単なる静的ページではなく、手作業の店舗確認を構造化された価格インテリジェンス層へ置き換え、ダッシュボード、商品詳細、AI提案につなげる基盤を作る方針です。',
    },
  },
  {
    period: '2025.08',
    phase: {
      en: 'Interface Prototype',
      zh: '界面原型',
      ja: '画面プロトタイプ',
    },
    title: {
      en: 'Built the first high-density comparison interface',
      zh: '完成首版高密度价格比较界面',
      ja: '高密度な価格比較UIの初期版を構築',
    },
    content: {
      en: 'The first interface prototype focused on dense but readable price comparison. Model grouping, capacity ordering, best-price highlighting, store-level detail expansion, and mobile-safe layouts were designed together so large price tables could stay usable. This created the visual and interaction baseline for the later production React pages.',
      zh: '首版界面原型围绕高密度但可读的价格比较展开：按机型分组、按容量排序、最高价突出、店铺级明细展开，以及移动端可读布局同步设计。这个阶段确立了后续 React 正式页面的视觉和交互基线。',
      ja: '初期UIでは、高密度でも読みやすい価格比較を重視しました。機種ごとのグルーピング、容量順の表示、最高価格の強調、店舗別詳細の展開、モバイルでも崩れにくいレイアウトを同時に設計し、後のReact本番画面の基準を作りました。',
    },
  },
  {
    period: '2025.11',
    phase: {
      en: 'Data Pipeline',
      zh: '数据管线',
      ja: 'データパイプライン',
    },
    title: {
      en: 'Implemented normalization rules for messy store price data',
      zh: '实现店铺价格数据清洗与标准化规则',
      ja: '店舗価格データの正規化ルールを実装',
    },
    content: {
      en: 'The data pipeline began handling real-world store data problems: inconsistent model names, capacity notation differences, price cells mixed with notes, duplicated store columns, missing capacity values, and invalid prices. Normalization rules were added so scraped rows could be converted into stable product, store, and price records instead of being manually cleaned every time.',
      zh: '数据管线开始处理真实店铺数据里的复杂问题：机型命名不一致、容量写法不同、价格单元格混入备注、店铺列重复、容量缺失和无效价格。系统加入标准化规则，把抓取到的原始行转换成稳定的商品、店铺和价格记录，减少后续维护时的人工清洗。',
      ja: 'データパイプラインでは、実店舗データに含まれる表記ゆれを処理しました。機種名の違い、容量表記の違い、価格セル内の注記、重複した店舗列、容量欠損、無効価格などを正規化し、取得した行を安定した商品・店舗・価格レコードへ変換できるようにしました。',
    },
  },
  {
    period: '2026.01',
    phase: {
      en: 'Backend Foundation',
      zh: '后端基础',
      ja: 'バックエンド基盤',
    },
    title: {
      en: 'Built the FastAPI, PostgreSQL, Redis, and Celery service stack',
      zh: '搭建 FastAPI、PostgreSQL、Redis、Celery 服务栈',
      ja: 'FastAPI、PostgreSQL、Redis、Celeryのサービス基盤を構築',
    },
    content: {
      en: 'The platform moved into a full service stack. FastAPI exposed product, store, price, history, search, stats, and AI routes; PostgreSQL stored structured market records; Redis and Celery prepared background update execution; Docker Compose made the system reproducible. This turned NOVA AI from a prototype into a deployable application.',
      zh: '平台进入完整服务化阶段。FastAPI 提供商品、店铺、价格、历史、搜索、统计和 AI 接口；PostgreSQL 存储结构化市场数据；Redis 与 Celery 承担后台更新任务基础；Docker Compose 让整套系统可复现部署。NOVA AI 从原型转为可部署应用。',
      ja: 'この段階で、NOVA AIは本格的なサービス構成へ移行しました。FastAPIで商品、店舗、価格、履歴、検索、統計、AIの各APIを提供し、PostgreSQLに構造化データを保存、RedisとCeleryでバックグラウンド更新を準備し、Docker Composeで再現可能な実行環境を整えました。',
    },
  },
  {
    period: '2026.02',
    phase: {
      en: 'Production Release',
      zh: '生产发布',
      ja: '本番公開',
    },
    title: {
      en: 'Released the live comparison workflow with real market data',
      zh: '上线接入真实市场数据的比价流程',
      ja: '実データ連携の価格比較フローを公開',
    },
    content: {
      en: 'The public release connected the home dashboard, price table, store directory, product detail pages, and API health checks to the live data model. The deployment separated static front-end assets from the API service, making browser delivery fast while keeping backend updates isolated and easier to verify.',
      zh: '公开版本把首页仪表盘、价格表、店铺列表、商品详情和健康检查接口接入真实数据模型。部署上将静态前端资源与 API 服务分离，让页面加载更快，同时把后端更新隔离出来，便于验证和维护。',
      ja: '公開版では、トップダッシュボード、価格一覧、店舗一覧、商品詳細、ヘルスチェックAPIを実データモデルに接続しました。静的フロントエンドとAPIサービスを分離し、ブラウザ配信を高速化しながら、バックエンド更新を独立して確認しやすい構成にしました。',
    },
  },
  {
    period: '2026.03',
    phase: {
      en: 'Data Reliability',
      zh: '数据可靠性',
      ja: 'データ信頼性',
    },
    title: {
      en: 'Added freshness indicators, historical views, and safer detail pages',
      zh: '加入数据新鲜度、历史视图和更稳定的详情页',
      ja: '鮮度表示、履歴表示、安定した詳細ページを追加',
    },
    content: {
      en: 'March strengthened the reliability layer. The UI began exposing update timestamps and operational status, product detail pages gained store-by-store pricing and historical context, and stale data handling was clarified. The system could now show not only the best price, but also when the data was collected and how prices changed over time.',
      zh: '3 月重点加强数据可靠性。界面开始展示更新时间和运行状态，商品详情页加入各店铺价格与历史走势，延迟数据的提示逻辑也被整理。系统不再只展示最高价，还能说明数据何时采集、价格如何变化。',
      ja: '3月はデータ信頼性を強化しました。画面に更新日時と稼働状態を表示し、商品詳細では店舗別価格と履歴コンテキストを確認できるようにしました。最高価格だけでなく、いつ取得されたデータか、価格がどのように変化したかも把握できる構成です。',
    },
  },
  {
    period: '2026.04',
    phase: {
      en: 'AI Engine',
      zh: 'AI 引擎',
      ja: 'AIエンジン',
    },
    title: {
      en: 'Launched AI-assisted store recommendation and bulk quote logic',
      zh: '上线 AI 店铺推荐与批量询价逻辑',
      ja: 'AI店舗提案と複数台見積もりロジックを公開',
    },
    content: {
      en: 'NOVA AI added a guided decision layer on top of the price database. The AI flow compresses current market context, identifies supported models, ranks stores by price, explains the recommendation, and handles multi-device questions with unit price, subtotal, and total amount. Session limits were added to keep the beta experience controlled.',
      zh: 'NOVA AI 在价格数据库之上加入决策辅助层。AI 流程会压缩当前市场上下文，识别支持机型，按价格排序店铺，解释推荐依据，并支持多台设备的批量询价，输出单价、小计和合计金额。同时加入会话次数限制，让测试版体验可控。',
      ja: 'NOVA AIは価格データベースの上に意思決定支援レイヤーを追加しました。現在の市場コンテキストを圧縮し、対応機種を識別し、店舗を価格順に評価し、提案理由を説明します。複数端末の質問では単価、小計、合計金額まで扱い、ベータ版としての利用回数制御も追加しました。',
    },
  },
  {
    period: '2026.05',
    phase: {
      en: 'Operational Hardening',
      zh: '运维强化',
      ja: '運用強化',
    },
    title: {
      en: 'Hardened deployment flow, API configuration, and parser tests',
      zh: '强化部署流程、API 配置和解析测试',
      ja: 'デプロイ手順、API設定、解析テストを強化',
    },
    content: {
      en: 'May focused on making the system safer to operate. Static release paths, API environment variables, CORS configuration, scraper parsing behavior, capacity inference, and store mapping were tightened. Automated parser tests were added around price extraction and CSV edge cases, reducing the risk of silent data corruption when the upstream sheet format changes.',
      zh: '5 月重点提升系统可运维性。静态发布路径、API 环境变量、CORS 配置、抓取解析行为、容量推断和店铺映射都被重新整理。围绕价格提取和 CSV 边界情况补充解析测试，降低上游表格格式变化时静默污染数据的风险。',
      ja: '5月は運用時の安全性を高めました。静的ファイルの公開先、API環境変数、CORS設定、スクレイパー解析、容量推定、店舗名マッピングを整理し、価格抽出やCSVの境界ケースに対する解析テストを追加しました。上流シートの形式変更によるデータ破損リスクを下げています。',
    },
  },
  {
    period: '2026.06',
    phase: {
      en: 'Account System',
      zh: '账户系统',
      ja: 'アカウント基盤',
    },
    title: {
      en: 'Implemented password login, member state, and account-ready pages',
      zh: '实现密码登录、会员状态和账户页面基础',
      ja: 'パスワードログイン、会員状態、アカウント画面を実装',
    },
    content: {
      en: 'June added the account foundation. Registration, email login, password reset, member-state switching, and a dedicated My Page were implemented. Passwords are stored as salted PBKDF2-SHA256 hashes instead of plain text. The front end now has a base for saved models, price alerts, and future AI consultation history without exposing sensitive account data.',
      zh: '6 月加入账户基础能力：注册、邮箱登录、密码重置、会员状态切换和我的页面。密码只保存加盐 PBKDF2-SHA256 哈希，不保存明文。前端也预留了收藏机型、价格提醒和 AI 咨询履历的结构，为后续个性化功能打下基础。',
      ja: '6月はアカウント基盤を追加しました。登録、メールログイン、パスワード再設定、会員状態による表示切替、マイページを実装しました。パスワードは平文ではなくsalt付きPBKDF2-SHA256ハッシュとして保存し、保存機種、価格通知、AI相談履歴に拡張できる土台を用意しました。',
    },
  },
]

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
  const { data: currentMember } = useQuery({
    queryKey: ['current-member'],
    queryFn: getCurrentMember,
    staleTime: 1000 * 60 * 5,
    retry: false,
  })
  const { data: homepageSummary } = useQuery<HomepageSummary>({
    queryKey: ['homepage-summary'],
    queryFn: async () => apiGet<HomepageSummary>('/api/v1/homepage/summary'),
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60,
  })

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
      label: t('homeTotalPriceRecords'),
      value: (stats?.total_price_records ?? 0).toLocaleString(),
    },
  ]

  const dashboardPanel = (
    <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-6 shadow-sm sm:px-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          {t('homeMarketDashboardEyebrow')}
        </p>
        <Link to="/prices" className="hidden text-sm font-medium text-slate-700 hover:text-slate-950 sm:block">
          {t('priceDetails')}
        </Link>
      </div>

      {homepageSummary?.recommended_models?.length ? (
        <div className="mt-5 grid gap-4">
          {homepageSummary.recommended_models.map((entry, index) => {
            const product = entry.product
            const store = entry.store

            if (!product || !store) return null

            return (
              <Link
                key={entry.id}
                to={`/product/${product.id}`}
                className="group rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition-colors hover:border-slate-300 hover:bg-white sm:p-5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="shrink-0">
                    <div className="inline-flex rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white">
                      #{index + 1}
                    </div>
                  </div>
                  <h3 className="min-w-0 flex-1 truncate text-base font-semibold text-slate-950 sm:text-lg">
                    {product.name || product.model}
                  </h3>
                </div>
                <div className="mt-4 grid grid-cols-[1fr_1fr_1.15fr] gap-2 sm:grid-cols-[150px_130px_minmax(0,1fr)]">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{t('bestBuybackPrice')}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950 sm:text-lg">
                      {formatCurrency(entry.price, language)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{t('profit')}</p>
                    <p className="mt-1 text-sm font-semibold text-emerald-700 sm:text-lg">
                      {entry.profit !== null ? formatCurrency(entry.profit, language) : '—'}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{t('homeDashboardStoreLabel')}</p>
                    <p className="mt-1 truncate text-sm font-medium text-slate-900">{store.name}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-sm text-slate-500">
          {t('homeNoDashboardData')}
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 lg:px-10 lg:py-10">
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              NOVA
            </div>
            <div className="mt-4 rounded-2xl border border-amber-200 bg-white px-4 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">
                {t('homeAwardEyebrow')}
              </p>
              <p className="mt-2 text-lg font-semibold leading-7 sm:text-xl">
                <span className="bg-gradient-to-r from-rose-600 via-amber-500 to-emerald-600 bg-clip-text text-transparent">
                  {t('homeAwardTitle')}
                </span>
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t('homeAwardDescription')}</p>
            </div>
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {t('homeHeroTitle')}
            </h1>
            {t('homeHeroDescription') && (
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                {t('homeHeroDescription')}
              </p>
            )}
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
              <Link
                to="/stores"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
              >
                {t('homeStoreListTitle')}
                <StoreIcon className="h-4 w-4" />
              </Link>
              <Link
                to={currentMember ? '/members/me' : '/members/register'}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
              >
                {currentMember ? t('homeMyPageCta') : t('homeMemberCta')}
                {currentMember ? <UserRound className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              </Link>
            </div>
          </div>

          {dashboardPanel}
        </section>

        <section className="mt-6 rounded-[28px] border border-slate-200 bg-slate-950 px-6 py-6 text-white shadow-sm sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
              {t('homeFreshnessEyebrow')}
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              {t('homeStatusLive')}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
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
        </section>
      </div>
    </div>
  )
}
