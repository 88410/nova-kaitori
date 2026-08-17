import { useLocation } from 'react-router-dom'
import { useI18n, type Language } from '../i18n'
import { LightPage, PageHeader, lightPanelClass } from '../components/PageChrome'

type LegalContent = {
  title: string
  lead: string
  sections: Array<{ heading: string; body: string[] }>
}

const LEGAL_CONTENT: Record<Language, Record<string, LegalContent>> = {
  en: {
    '/company': {
      title: 'Company Overview',
      lead: '',
      sections: [
        {
          heading: 'Company Profile',
          body: [
            'Novatech Co., Ltd. develops and operates NOVA AI, an iPhone buyback price intelligence platform that integrates store-by-store pricing data, market movement, and product information to support faster and more precise selling, resale, and trading decisions.',
            'Through real-time price comparison, multilingual product guidance, AI-assisted store recommendations, and structured store intelligence, NOVA AI aims to become a decision layer for the next generation of cross-border device circulation.',
          ],
        },
        {
          heading: 'Basic Information',
          body: [
            'Address: Musashino Building, 2-13-10 Shinjuku, Shinjuku-ku, Tokyo',
            'Business: AI business development',
            'Corporate Number: 0111-01-110714',
            'Capital: JPY 6,000,000',
            'Founded: February 17, 2025',
          ],
        },
        {
          heading: 'Operations & Technical Support Framework',
          body: [
            'Morita: Business operations and product planning',
            'Sato: Customer experience and service guidance',
            'Tanaka: System maintenance and operational stability',
            'Liu: Merchant-side coordination and price-data acquisition',
          ],
        },
      ],
    },
    '/notice': {
      title: 'Notice',
      lead: 'Please review the following points before using NOVA.',
      sections: [
        {
          heading: 'Service Scope',
          body: [
            'NOVA provides publicly collected iPhone buyback price comparisons and AI-assisted guidance for reference.',
            'Prices, supported models, and shop information may change without notice.',
          ],
        },
        {
          heading: 'Pricing Disclaimer',
          body: [
            'Displayed prices are not final assessment guarantees.',
            'Actual quotes may change based on device condition, accessories, network status, and store-side checks.',
          ],
        },
      ],
    },
    '/privacy': {
      title: 'Privacy Policy',
      lead: 'This page outlines how NOVA handles basic usage information.',
      sections: [
        {
          heading: 'Collected Information',
          body: [
            'For member services, NOVA records usernames, email addresses, registration and login times, IP addresses, and browser information.',
            'For the AI feature, NOVA records language settings, questions and answers, protected session identifiers, IP addresses, and browser information.',
          ],
        },
        {
          heading: 'Use of Information',
          body: [
            'We use collected information only for operating the comparison and AI services, account security, usage management, product improvement, and responding to inquiries when necessary.',
            'We do not sell personal information to third parties.',
          ],
        },
      ],
    },
    '/terms': {
      title: 'Terms of Use',
      lead: 'By using NOVA, you agree to the following basic terms.',
      sections: [
        {
          heading: 'Permitted Use',
          body: [
            'Use the service in accordance with applicable laws and do not interfere with normal operation.',
            'Automated abuse, unauthorized copying, and harmful use are prohibited.',
          ],
        },
        {
          heading: 'Limitation',
          body: [
            'NOVA provides information on an as-is basis and does not guarantee completeness or suitability for a specific sale.',
            'Final selling decisions should be made after confirming the latest terms directly with each store.',
          ],
        },
      ],
    },
  },
  zh: {
    '/company': {
      title: '会社概要',
      lead: '',
      sections: [
        {
          heading: '公司简介',
          body: [
            '诺瓦科技株式会社正在开发并运营 NOVA AI iPhone 回收价格智能平台，整合各店铺价格数据、市场变化和商品信息，为出售、转售和贸易判断提供更快速、更精确的决策环境。',
            '通过实时价格对比、多语言商品引导、AI 店铺推荐和结构化店铺情报，NOVA AI 希望成为下一代跨境电子设备流通的智能决策层。',
          ],
        },
        {
          heading: '基本信息',
          body: [
            '所在地：东京都新宿区新宿2丁目13番10号 武藏野大楼',
            '事业内容：AI 业务开发',
            '法人番号：０１１１－０１－１１０７１４',
            '资本金：金６００万円',
            '成立年月日：令和７年２月１７日',
          ],
        },
        {
          heading: '运营与技术支持体系',
          body: [
            '森田：业务运营与产品规划',
            '佐藤：客户体验与服务引导',
            '田中：系统维护与运行稳定',
            '劉：商家侧沟通与价格数据获取',
          ],
        },
      ],
    },
    '/notice': {
      title: '注意事项',
      lead: '使用 NOVA 前，请先确认以下说明。',
      sections: [
        {
          heading: '服务范围',
          body: [
            'NOVA 提供公开收集的 iPhone 回收价格对比，以及 AI 辅助参考建议。',
            '价格、支持机型和店铺信息可能会在未通知的情况下变更。',
          ],
        },
        {
          heading: '价格说明',
          body: [
            '页面显示的价格并不代表最终成交价或最终査定结果。',
            '实际回收价可能会因机器状态、配件、网络限制或店铺审核标准而变化。',
          ],
        },
      ],
    },
    '/privacy': {
      title: '隐私政策',
      lead: '本页说明 NOVA 对基础使用信息的处理方式。',
      sections: [
        {
          heading: '收集的信息',
          body: [
            '会员服务会记录用户名、邮箱、注册及登录时间、IP 地址和浏览器信息。',
            'AI 功能会记录语言设置、问题与回答、经过保护的会话标识、IP 地址和浏览器信息。',
          ],
        },
        {
          heading: '信息用途',
          body: [
            '收集的信息仅用于运营比价与 AI 服务、账户安全、使用次数管理、产品改善，以及在必要时处理咨询。',
            '我们不会将个人信息出售给第三方。',
          ],
        },
      ],
    },
    '/terms': {
      title: '使用条款',
      lead: '使用 NOVA 即视为同意以下基础条款。',
      sections: [
        {
          heading: '允许的使用方式',
          body: [
            '请在遵守适用法律的前提下使用本服务，不得干扰正常运营。',
            '禁止恶意自动化抓取、未授权复制或其他有害使用行为。',
          ],
        },
        {
          heading: '责任限制',
          body: [
            'NOVA 以现状提供信息，不保证其完整性，也不保证一定适用于某次具体卖出。',
            '最终出售前，请务必以各店铺的最新规则与报价为准。',
          ],
        },
      ],
    },
  },
  ja: {
    '/company': {
      title: '会社概要',
      lead: '',
      sections: [
        {
          heading: '会社概要',
          body: [
            'ノーヴァテック株式会社は、iPhone買取価格インテリジェンスプラットフォーム「NOVA AI」を開発・運営し、店舗別の価格データ、市場変動、商品情報を統合することで、売却・再販・貿易判断をより速く、より精密に行える環境を提供しています。',
            'リアルタイム価格比較、多言語の商品案内、AIによる店舗提案、構造化された店舗情報を組み合わせ、国境を越えるスマートデバイス流通の意思決定レイヤーとなることを目指しています。',
          ],
        },
        {
          heading: '基本情報',
          body: [
            '所在地：東京都新宿区新宿2丁目13番10号 武蔵野ビル',
            '事業内容：AI事業開発',
            '法人番号：０１１１－０１－１１０７１４',
            '資本金：金６００万円',
            '成立年月日：令和７年２月１７日',
          ],
        },
        {
          heading: '運営・技術支援体制',
          body: [
            '森田：事業運営・プロダクト企画',
            '佐藤：顧客体験・サービス案内',
            '田中：システム保守・運用安定化',
            '劉：店舗側連携・価格データ取得',
          ],
        },
      ],
    },
    '/notice': {
      title: '注意事項',
      lead: 'NOVAをご利用いただく前に、以下の点をご確認ください。',
      sections: [
        {
          heading: 'サービス内容について',
          body: [
            'NOVAは、公開されているiPhone買取価格の比較情報と、AIによる参考案内を提供するサービスです。',
            '掲載価格、対応機種、店舗情報は予告なく更新または変更される場合があります。',
          ],
        },
        {
          heading: '価格表示について',
          body: [
            '表示価格は最終査定額を保証するものではありません。',
            '端末の状態、付属品の有無、利用制限、店舗ごとの査定基準によって実際の買取額は変動します。',
          ],
        },
      ],
    },
    '/privacy': {
      title: 'プライバシーポリシー',
      lead: 'NOVAにおける基本的な情報の取り扱いについてご案内します。',
      sections: [
        {
          heading: '取得する情報',
          body: [
            '会員機能では、ユーザー名、メールアドレス、登録・ログイン日時、IPアドレス、ブラウザ情報を記録します。',
            'AI機能では、言語設定、質問と回答、保護されたセッション識別子、IPアドレス、ブラウザ情報を記録します。',
          ],
        },
        {
          heading: '利用目的',
          body: [
            '取得した情報は、価格比較・AIサービスの提供、アカウント保護、利用回数管理、機能改善、お問い合わせ対応のために利用します。',
            '個人情報を第三者へ販売することはありません。',
          ],
        },
      ],
    },
    '/terms': {
      title: '利用規約',
      lead: 'NOVAをご利用いただくことで、以下の基本条件に同意したものとみなします。',
      sections: [
        {
          heading: '利用上のルール',
          body: [
            '法令および公序良俗に反する目的での利用、通常運営を妨げる行為は禁止します。',
            '過度な自動アクセス、無断転載、その他サービスに不利益を与える行為はお控えください。',
          ],
        },
        {
          heading: '免責事項',
          body: [
            'NOVAは情報を現状有姿で提供しており、内容の完全性や特定目的への適合性を保証するものではありません。',
            '最終的な売却判断は、各店舗の最新条件や査定結果をご確認のうえで行ってください。',
          ],
        },
      ],
    },
  },
}

export default function LegalPage() {
  const { language } = useI18n()
  const location = useLocation()
  const content = LEGAL_CONTENT[language][location.pathname] ?? LEGAL_CONTENT.ja['/notice']
  const isCompanySite = import.meta.env.VITE_SITE_MODE === 'company'

  if (isCompanySite) {
    return (
      <div className="min-h-[100dvh] bg-[#07080b] text-white">
        <PageHeader title={content.title} tone="dark" />
        <main className="relative overflow-hidden px-4 pb-20 pt-12 sm:px-6 sm:pb-28 sm:pt-20 lg:px-8">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-80"
            style={{ background: 'radial-gradient(circle at 50% 0%, rgba(124, 58, 237, 0.18), transparent 68%)' }}
          />
          <div className="relative mx-auto max-w-6xl">
            <p className="text-[11px] font-semibold tracking-[0.26em] text-violet-300/65">NOVATECH · TOKYO</p>
            <h2 className="mt-5 max-w-4xl text-4xl font-medium tracking-[-0.04em] sm:text-6xl">{content.title}</h2>
            {content.lead && <p className="mt-6 max-w-2xl text-sm leading-8 text-white/55 sm:text-base">{content.lead}</p>}

            <div className="mt-12 grid gap-4 sm:mt-16 md:grid-cols-2">
              {content.sections.map((section, index) => (
                <section
                  key={section.heading}
                  className={`rounded-2xl border border-white/10 border-t-2 p-6 sm:p-8 ${
                    index % 3 === 0
                      ? 'border-t-violet-400/70 bg-[#121022]'
                      : index % 3 === 1
                        ? 'border-t-cyan-400/70 bg-[#0b161e]'
                        : 'border-t-emerald-400/70 bg-[#0b1714]'
                  } ${content.sections.length % 2 === 1 && index === 0 ? 'md:col-span-2' : ''}`}
                >
                  <p className="text-[10px] font-semibold tracking-[0.2em] text-white/35">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <h3 className="mt-5 text-xl font-medium tracking-tight text-white">{section.heading}</h3>
                  <div className="mt-4 space-y-3">
                    {section.body.map((paragraph) => (
                      <p key={paragraph} className="text-sm leading-7 text-white/60">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <LightPage>
      <PageHeader title={content.title} />

      <main className="mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-10">
        <section className={`overflow-hidden p-5 sm:p-9 ${lightPanelClass}`}>
          <div className="mb-8 border-b border-slate-100 pb-7">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-violet-600">NOVA INFORMATION</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{content.title}</h2>
          </div>
          {content.lead && <p className="text-sm leading-7 text-slate-600">{content.lead}</p>}
          <div className={`${content.lead ? 'mt-8' : ''} grid gap-4 md:grid-cols-2`}>
            {content.sections.map((section, index) => (
              <section key={section.heading} className={`rounded-xl border border-slate-200 border-t-2 p-5 ${index % 2 === 0 ? 'border-t-violet-500 bg-violet-50/35' : 'border-t-cyan-500 bg-cyan-50/35'}`}>
                <h3 className="text-base font-semibold text-slate-900">{section.heading}</h3>
                <div className="mt-3 space-y-3">
                  {section.body.map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-7 text-slate-600">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      </main>
    </LightPage>
  )
}
