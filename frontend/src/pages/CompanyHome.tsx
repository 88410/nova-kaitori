import { ArrowUpRight, Database, LineChart, Sparkles, Store as StoreIcon } from 'lucide-react'
import { type Language, useI18n } from '../i18n'

type CompanyCopy = {
  brand: string
  navCompany: string
  navLog: string
  eyebrow: string
  title: string
  lead: string
  novaEyebrow: string
  novaTitle: string
  novaLead: string
  novaButton: string
  profileTitle: string
  profileLead: string
  addressLabel: string
  address: string
  businessLabel: string
  business: string
  registrationTitle: string
  registrationItems: Array<{ label: string; value: string }>
  teamTitle: string
  teamItems: Array<{ label: string; value: string }>
  strengthsTitle: string
  strengths: Array<{ title: string; body: string }>
  priceRecordsLabel: string
  productsLabel: string
  partnerStoresLabel: string
}

const COMPANY_COPY: Record<Language, CompanyCopy> = {
  en: {
    brand: 'Novatech Co., Ltd.',
    navCompany: 'Company Profile',
    navLog: 'Development Log',
    eyebrow: 'AI business development',
    title: 'Building practical AI products for cross-border device circulation.',
    lead:
      'Novatech Co., Ltd. develops data-driven software for price intelligence and customer-facing AI guidance. Our first public product is NOVA AI, an iPhone buyback price intelligence platform for the Japanese market.',
    novaEyebrow: 'Featured Product',
    novaTitle: 'NOVA AI',
    novaLead:
      'NOVA AI combines store-level buyback price data, product details, multilingual guidance, and AI-assisted store recommendations so users can decide where to sell faster and with clearer context.',
    novaButton: 'Open NOVA AI',
    profileTitle: 'Company Information',
    profileLead:
      'The company page presents the operating entity, service direction, and technical release records in Japanese, Chinese, and English.',
    addressLabel: 'Address',
    address: 'Musashino Building, 2-13-10 Shinjuku, Shinjuku-ku, Tokyo',
    businessLabel: 'Business',
    business: 'AI business development',
    registrationTitle: 'Corporate Registration',
    registrationItems: [
      {
        label: 'Corporate Number',
        value: '0111-01-110714',
      },
      {
        label: 'Capital',
        value: 'JPY 6,000,000',
      },
      {
        label: 'Founded',
        value: 'February 17, 2025',
      },
    ],
    teamTitle: 'Operations & Technical Support Framework',
    teamItems: [
      {
        label: 'Morita',
        value: 'Business operations and product planning',
      },
      {
        label: 'Sato',
        value: 'Customer experience and service guidance',
      },
      {
        label: 'Tanaka',
        value: 'System maintenance and operational stability',
      },
      {
        label: 'Liu',
        value: 'Merchant-side coordination and price-data acquisition',
      },
    ],
    strengthsTitle: 'Operating Focus',
    strengths: [
      {
        title: 'Price intelligence',
        body: 'Structured collection and presentation of store-by-store buyback data.',
      },
      {
        title: 'AI consultation',
        body: 'Natural-language support for model selection, store comparison, and selling decisions.',
      },
      {
        title: 'Multilingual service',
        body: 'Japanese, Chinese, and English pages prepared for customers and business partners.',
      },
    ],
    priceRecordsLabel: 'price records',
    productsLabel: 'products',
    partnerStoresLabel: 'partner stores',
  },
  zh: {
    brand: '诺瓦科技株式会社',
    navCompany: '公司概要',
    navLog: '开发日志',
    eyebrow: 'AI 业务开发',
    title: '为跨境电子设备流通开发可落地的 AI 产品。',
    lead:
      '诺瓦科技株式会社围绕价格智能和面向客户的 AI 引导开发数据驱动的软件产品。当前第一个公开产品是 NOVA AI，一个面向日本市场的 iPhone 回收价格智能平台。',
    novaEyebrow: '核心产品',
    novaTitle: 'NOVA AI',
    novaLead:
      'NOVA AI 整合各店铺回收价格、商品信息、多语言说明和 AI 店铺推荐，让用户更快判断应该卖给哪家店，并理解价格差异背后的依据。',
    novaButton: '进入 NOVA AI',
    profileTitle: '公司信息',
    profileLead: '本页面以日语、中文、英文展示运营主体、服务方向和技术发布记录。',
    addressLabel: '所在地',
    address: '东京都新宿区新宿2丁目13番10号 武藏野大楼',
    businessLabel: '事业内容',
    business: 'AI 业务开发',
    registrationTitle: '法人登记信息',
    registrationItems: [
      {
        label: '法人番号',
        value: '０１１１－０１－１１０７１４',
      },
      {
        label: '资本金',
        value: '金６００万円',
      },
      {
        label: '成立年月日',
        value: '令和７年２月１７日',
      },
    ],
    teamTitle: '运营与技术支持体系',
    teamItems: [
      {
        label: '森田',
        value: '业务运营与产品规划',
      },
      {
        label: '佐藤',
        value: '客户体验与服务引导',
      },
      {
        label: '田中',
        value: '系统维护与运行稳定',
      },
      {
        label: '劉',
        value: '商家侧沟通与价格数据获取',
      },
    ],
    strengthsTitle: '业务重点',
    strengths: [
      {
        title: '价格智能',
        body: '结构化收集并展示各店铺回收价格数据。',
      },
      {
        title: 'AI 咨询',
        body: '用自然语言支持机型判断、店铺比较和出售决策。',
      },
      {
        title: '多语言服务',
        body: '面向客户和业务伙伴准备日语、中文、英文页面。',
      },
    ],
    priceRecordsLabel: '价格数据',
    productsLabel: '收录商品',
    partnerStoresLabel: '合作店铺',
  },
  ja: {
    brand: 'ノーヴァテック株式会社',
    navCompany: '会社概要',
    navLog: '開発ログ',
    eyebrow: 'AI事業開発',
    title: '越境デバイス流通に向けた実用的なAIプロダクトを開発しています。',
    lead:
      'ノーヴァテック株式会社は、価格インテリジェンスと顧客向けAI案内を支えるデータ駆動型ソフトウェアを開発しています。最初の公開プロダクトは、日本市場向けのiPhone買取価格インテリジェンスプラットフォーム「NOVA AI」です。',
    novaEyebrow: '主要プロダクト',
    novaTitle: 'NOVA AI',
    novaLead:
      'NOVA AIは、店舗別の買取価格データ、商品情報、多言語案内、AIによる店舗提案を組み合わせ、どの店舗に売却するべきかをより速く、根拠を持って判断できるようにします。',
    novaButton: 'NOVA AIを開く',
    profileTitle: '会社情報',
    profileLead: '運営主体、サービス方針、技術リリース記録を日本語・中国語・英語で掲載しています。',
    addressLabel: '所在地',
    address: '東京都新宿区新宿2丁目13番10号 武蔵野ビル',
    businessLabel: '事業内容',
    business: 'AI事業開発',
    registrationTitle: '法人登記情報',
    registrationItems: [
      {
        label: '法人番号',
        value: '０１１１－０１－１１０７１４',
      },
      {
        label: '資本金',
        value: '金６００万円',
      },
      {
        label: '成立年月日',
        value: '令和７年２月１７日',
      },
    ],
    teamTitle: '運営・技術支援体制',
    teamItems: [
      {
        label: '森田',
        value: '事業運営・プロダクト企画',
      },
      {
        label: '佐藤',
        value: '顧客体験・サービス案内',
      },
      {
        label: '田中',
        value: 'システム保守・運用安定化',
      },
      {
        label: '劉',
        value: '店舗側連携・価格データ取得',
      },
    ],
    strengthsTitle: '事業上の重点',
    strengths: [
      {
        title: '価格インテリジェンス',
        body: '店舗別の買取価格データを構造化して収集・表示します。',
      },
      {
        title: 'AI相談',
        body: '機種選定、店舗比較、売却判断を自然言語で支援します。',
      },
      {
        title: '多言語サービス',
        body: '顧客と事業パートナー向けに日本語・中国語・英語のページを整備します。',
      },
    ],
    priceRecordsLabel: '価格データ',
    productsLabel: '掲載商品',
    partnerStoresLabel: '掲載店舗',
  },
}

const PRODUCT_URL = 'https://ai.novatekku.com/'

export default function CompanyHome() {
  const { language } = useI18n()
  const copy = COMPANY_COPY[language]

  return (
    <main className="min-h-screen bg-stone-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-900 text-sm font-semibold">
              NT
            </span>
            <span className="text-sm font-semibold sm:text-base">{copy.brand}</span>
          </a>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-16">
        <div className="flex flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{copy.eyebrow}</p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{copy.title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">{copy.lead}</p>
        </div>

        <div id="nova-ai" className="border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{copy.novaEyebrow}</p>
              <h2 className="mt-2 text-3xl font-semibold">{copy.novaTitle}</h2>
            </div>
            <Sparkles className="h-8 w-8 text-cyan-700" />
          </div>
          <p className="mt-5 text-base leading-8 text-slate-600">{copy.novaLead}</p>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="min-w-0 border border-slate-200 p-2.5 sm:p-3">
              <LineChart className="h-4 w-4 text-cyan-700" />
              <p className="mt-2 text-sm font-semibold leading-none">611K+</p>
              <p className="mt-1 text-[11px] leading-4 text-slate-500">{copy.priceRecordsLabel}</p>
            </div>
            <div className="min-w-0 border border-slate-200 p-2.5 sm:p-3">
              <Database className="h-4 w-4 text-emerald-700" />
              <p className="mt-2 text-sm font-semibold leading-none">53</p>
              <p className="mt-1 text-[11px] leading-4 text-slate-500">{copy.productsLabel}</p>
            </div>
            <div className="min-w-0 border border-slate-200 p-2.5 sm:p-3">
              <StoreIcon className="h-4 w-4 text-indigo-700" />
              <p className="mt-2 text-sm font-semibold leading-none">23</p>
              <p className="mt-1 text-[11px] leading-4 text-slate-500">{copy.partnerStoresLabel}</p>
            </div>
          </div>
          <a
            href={PRODUCT_URL}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            {copy.novaButton}
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </section>
    </main>
  )
}
