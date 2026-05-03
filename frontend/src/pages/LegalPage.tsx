import { Link, useLocation } from 'react-router-dom'
import { useI18n, type Language } from '../i18n'

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
            'Business: Trading operations and AI business development',
          ],
        },
        {
          heading: 'Key Members',
          body: [
            'Morita, AI Technology Lead: Leads AI feature design, development, and business implementation, with responsibility for improving price comparison and store recommendation accuracy.',
            'LIU ZHANQI, Store Partner Lead: Manages store relationships, merchant information maintenance, and store-side coordination.',
            'SATO KENICHI, Product Strategy Lead: Leads product design and improvement planning that connects store pricing, user needs, and operational decision-making.',
            'TANAKA MISAKI, System Operations Lead: Maintains monitoring, system operations, and quality control frameworks that support reliable market information.',
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
            'NOVA may process language settings, question text, and session identifiers needed to provide the AI feature.',
            'This information is used to improve response quality and service stability.',
          ],
        },
        {
          heading: 'Use of Information',
          body: [
            'We use collected information only for operating the comparison service, improving the product, and responding to inquiries when necessary.',
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
      title: '公司简介',
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
            '事业内容：贸易业务、AI 业务开发',
          ],
        },
        {
          heading: '主要员工介绍',
          body: [
            '森田，AI 技术负责人：负责 AI 功能设计、开发和业务导入，推进价格比较与店铺推荐精度提升。',
            '刘 展奇，店铺合作负责人：负责对接收录店铺、维护商家信息，并推进店铺侧沟通协调。',
            '佐藤 健一，产品战略负责人：负责连接店铺价格、用户需求和运营判断的产品设计与改善方针。',
            '田中 美咲，系统运营负责人：负责系统监视、运行维护和质量管理机制建设，支撑市场信息的稳定性。',
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
            '为提供 AI 功能，NOVA 可能处理语言设置、提问内容以及会话标识等必要信息。',
            '这些信息仅用于提升回答质量和维持服务稳定。',
          ],
        },
        {
          heading: '信息用途',
          body: [
            '收集的信息仅用于运营比价服务、改善产品体验，以及在必要时处理咨询。',
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
            '事業内容：貿易業務、AI事業開発',
          ],
        },
        {
          heading: '主要メンバー',
          body: [
            '森田（AI技術責任者）：AI機能の設計・開発・業務導入を推進し、価格比較と店舗提案の精度向上を担当。',
            '劉 展奇（店舗パートナー責任者）：掲載店舗との連携、商家情報の維持管理、店舗側との調整を担当。',
            '佐藤 健一（プロダクト戦略責任者）：店舗価格、ユーザーニーズ、運用判断をつなぐプロダクト設計と改善方針を担当。',
            '田中 美咲（システム運用責任者）：システム監視、運用保守、品質管理体制を整備し、市場情報の安定性を担当。',
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
            'NOVAでは、AI機能の提供に必要な範囲で、言語設定、質問内容、セッション識別子などの情報を取り扱う場合があります。',
            'これらの情報は、回答品質の向上とサービスの安定運用のために利用します。',
          ],
        },
        {
          heading: '利用目的',
          body: [
            '取得した情報は、価格比較サービスの提供、機能改善、お問い合わせ対応のために利用します。',
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
  const { language, t } = useI18n()
  const location = useLocation()
  const content = LEGAL_CONTENT[language][location.pathname] ?? LEGAL_CONTENT.ja['/notice']

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-900">
            ← {t('back')}
          </Link>
          <h1 className="text-lg font-semibold text-slate-900">{content.title}</h1>
          <span className="w-10" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8">
          {content.lead && <p className="text-sm leading-7 text-slate-600">{content.lead}</p>}
          <div className={`${content.lead ? 'mt-8' : ''} space-y-8`}>
            {content.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-base font-semibold text-slate-900">{section.heading}</h2>
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
    </div>
  )
}
