import { Link, useLocation } from 'react-router-dom'
import { useI18n, type Language } from '../i18n'

type LegalContent = {
  title: string
  lead: string
  sections: Array<{ heading: string; body: string[] }>
}

const LEGAL_CONTENT: Record<Language, Record<string, LegalContent>> = {
  en: {
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
          <p className="text-sm leading-7 text-slate-600">{content.lead}</p>
          <div className="mt-8 space-y-8">
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
