import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Language = 'en' | 'zh' | 'ja'

type TranslationValue = string | ((params: Record<string, string | number>) => string)

type TranslationMap = Record<string, TranslationValue>

const STORAGE_KEY = 'nova_language'

const translations: Record<Language, TranslationMap> = {
  en: {
    languageLabel: 'Language',
    languageEnglish: 'English',
    languageChinese: '中文',
    languageJapanese: '日本語',
    metaTitle: 'NOVA - iPhone Buyback Price Comparison',
    metaDescription:
      'Compare iPhone buyback prices in real time and get AI-assisted store recommendations.',
    metaKeywords:
      'iPhone buyback, buyback price comparison, smartphone trade-in, iPhone resale, NOVA AI',
    homeTagline: 'Highest iPhone Buyback Prices × AI',
    homeHeroTitle: 'Professional iPhone Buyback Comparison',
    homeHeroDescription:
      'Compare current buyback prices across stores, review shop details, and use NOVA AI to narrow down the best place to sell.',
    homePrimaryCta: 'Ask NOVA AI',
    homeSecondaryCta: 'Browse Price Table',
    homeStoreListTitle: 'Store Directory',
    homeStoreListDescription: 'Browse the shops currently listed on NOVA and jump to each official site.',
    homeFeaturedStores: 'Partner Stores',
    homeEmptyStores: 'No stores available right now.',
    homeStoreWebsite: 'Website',
    homeStorePhone: 'Phone',
    homeStoreAddress: 'Address',
    homeQuickPointOne: 'Live buyback price comparison',
    homeQuickPointTwo: 'Detailed store information',
    homeQuickPointThree: 'AI guidance for supported models',
    companyName: 'Novatech Co., Ltd.',
    footerNotice: 'Notice',
    footerPrivacy: 'Privacy Policy',
    footerTerms: 'Terms of Use',
    novaAi: 'NOVA AI',
    priceDetails: 'Price Details',
    back: 'Back',
    remainingCount: ({ count }) => `${count} left`,
    thinking: 'Thinking...',
    inputPlaceholder: 'Ask your question...',
    noQuestionsLeft: 'You have used all questions for today',
    send: 'Send',
    aiExamplesTitle: 'Example questions',
    aiWelcome:
      'I am NOVA AI. Ask about an iPhone model, and I will suggest a store, price, and link when supported.',
    aiEmptyReply: 'No result yet. Please try again.',
    aiLimitReached: 'You have reached today\'s question limit (10).',
    aiError: 'Something went wrong. Please try again later.',
    allStoresLatestPrices: 'Latest buyback prices across all stores',
    priceLastUpdated: 'Price last updated',
    priceUpdateStale: 'Automatic updates appear delayed. Latest visible data may not be current.',
    filterAll: 'All',
    close: 'Close',
    store: 'Store',
    buybackPrice: 'Buyback Price',
    retailPrice: 'Retail Price',
    profit: 'Profit',
    change: 'Change',
    capacity: 'Capacity',
    topPriceRetailProfit: 'Top price / retail / profit',
    details: 'Details',
    noData: 'No data available',
    retailLabel: 'Retail',
    bestBuybackPrice: 'Best Buyback Price',
    highestPrice: 'Top Price',
    byStorePrices: 'Prices by Store',
    priceTrend: 'Price Trend',
    noHistory: 'No history data available',
    conditionSeparator: ' · ',
    newRetailPrice: 'Retail Price',
    bestPriceBadge: 'Best',
    chartPrice: 'Price',
  },
  zh: {
    languageLabel: '语言',
    languageEnglish: 'English',
    languageChinese: '中文',
    languageJapanese: '日本語',
    metaTitle: 'NOVA - iPhone 回收价格对比',
    metaDescription: '实时比较 iPhone 回收价格，并获得 AI 店铺推荐。',
    metaKeywords: 'iPhone回收, 回收价格对比, 手机回收, iPhone转卖, NOVA AI',
    homeTagline: 'iPhone 最高回收价格 × AI',
    homeHeroTitle: '专业的 iPhone 回收价格对比',
    homeHeroDescription: '比较各店铺当前回收价，查看店铺信息，并用 NOVA AI 快速判断该卖给谁。',
    homePrimaryCta: '咨询 NOVA AI',
    homeSecondaryCta: '查看价格表',
    homeStoreListTitle: '店铺列表',
    homeStoreListDescription: '查看当前收录的店铺，并可直接进入各店官网。',
    homeFeaturedStores: '合作店铺',
    homeEmptyStores: '暂时没有可显示的店铺。',
    homeStoreWebsite: '官网',
    homeStorePhone: '电话',
    homeStoreAddress: '地址',
    homeQuickPointOne: '实时回收价格对比',
    homeQuickPointTwo: '店铺资料一目了然',
    homeQuickPointThree: '支持机型可直接用 AI 询问',
    companyName: '诺瓦科技株式会社',
    footerNotice: '注意事项',
    footerPrivacy: '隐私政策',
    footerTerms: '使用条款',
    novaAi: 'NOVA AI',
    priceDetails: '价格明细',
    back: '返回',
    remainingCount: ({ count }) => `剩余 ${count} 次`,
    thinking: '正在思考...',
    inputPlaceholder: '输入你的问题...',
    noQuestionsLeft: '今天的提问次数已用完',
    send: '发送',
    aiExamplesTitle: '示例问题',
    aiWelcome: '我是 NOVA AI。你可以直接问某个 iPhone 型号；若当前测试版支持，我会告诉你店铺、价格和链接。',
    aiEmptyReply: '暂时没有结果，请再试一次。',
    aiLimitReached: '今天已达到提问上限（10次）。',
    aiError: '发生错误，请稍后再试。',
    allStoresLatestPrices: '全部店铺的最新回收价格',
    priceLastUpdated: '价格更新时间',
    priceUpdateStale: '自动更新似乎已延迟，当前显示的数据可能不是最新。',
    filterAll: '全部',
    close: '关闭',
    store: '店铺',
    buybackPrice: '回收价格',
    retailPrice: '原价',
    profit: '利润',
    change: '变动',
    capacity: '容量',
    topPriceRetailProfit: '最高价 / 原价 / 利润',
    details: '详情',
    noData: '暂无数据',
    retailLabel: '原价',
    bestBuybackPrice: '最高回收价格',
    highestPrice: '最高价',
    byStorePrices: '各店铺回收价格',
    priceTrend: '价格走势',
    noHistory: '暂无历史数据',
    conditionSeparator: ' · ',
    newRetailPrice: '新机价格',
    bestPriceBadge: '最高价',
    chartPrice: '价格',
  },
  ja: {
    languageLabel: '言語',
    languageEnglish: 'English',
    languageChinese: '中文',
    languageJapanese: '日本語',
    metaTitle: 'NOVA - iPhone買取価格比較',
    metaDescription: 'iPhoneの買取価格をリアルタイムで比較し、AIによる店舗提案を受けられます。',
    metaKeywords: 'iPhone買取, 買取価格比較, スマホ買取, iPhone売却, NOVA AI',
    homeTagline: 'iPhone 最高買取価格 × AI',
    homeHeroTitle: 'iPhoneの買取価格を比べられるシンプルな比較サイト',
    homeHeroDescription:
      '各店舗の最新買取価格を比較し、掲載中の店舗を確認しながら、NOVA AIにもそのまま相談できます。',
    homePrimaryCta: 'NOVA AIに相談',
    homeSecondaryCta: '価格一覧を見る',
    homeStoreListTitle: '店舗一覧',
    homeStoreListDescription: '現在掲載中の店舗を一覧で確認できます。',
    homeFeaturedStores: '掲載店舗',
    homeEmptyStores: '表示できる店舗情報がありません。',
    homeStoreWebsite: '公式サイト',
    homeStorePhone: '電話番号',
    homeStoreAddress: '住所',
    homeQuickPointOne: '最新の買取価格を比較',
    homeQuickPointTwo: '店舗情報をまとめて確認',
    homeQuickPointThree: '対応機種はそのままAIに相談',
    companyName: 'ノーヴァテック株式会社',
    footerNotice: '注意事項',
    footerPrivacy: 'プライバシーポリシー',
    footerTerms: '利用規約',
    novaAi: 'NOVA AI',
    priceDetails: '価格一覧',
    back: '戻る',
    remainingCount: ({ count }) => `残り ${count} 回`,
    thinking: '考え中...',
    inputPlaceholder: '知りたい機種や条件を入力してください',
    noQuestionsLeft: '本日のご利用回数の上限に達しました',
    send: '送信',
    aiExamplesTitle: '質問例',
    aiWelcome:
      'NOVA AIです。iPhoneの機種名や容量をそのまま入力してください。対応中のモデルであれば、買取価格の高い店舗と公式サイトをご案内します。',
    aiEmptyReply: '回答を作成できませんでした。しばらくしてからもう一度お試しください。',
    aiLimitReached: '本日のご利用上限（10回）に達しました。',
    aiError: 'エラーが発生しました。しばらくしてからお試しください。',
    allStoresLatestPrices: '全店舗の最新買取価格',
    priceLastUpdated: '価格更新日時',
    priceUpdateStale: '自動更新が遅れている可能性があります。表示中の価格は最新でない場合があります。',
    filterAll: '全部',
    close: '閉じる',
    store: '店舗',
    buybackPrice: '買取価格',
    retailPrice: '定価',
    profit: '利益',
    change: '変動',
    capacity: '容量',
    topPriceRetailProfit: '最高買取価格 / 定価 / 利益',
    details: '詳細',
    noData: 'データがありません',
    retailLabel: '定価',
    bestBuybackPrice: '最高買取価格',
    highestPrice: '最高値',
    byStorePrices: '店舗別買取価格',
    priceTrend: '価格推移',
    noHistory: '履歴データがありません',
    conditionSeparator: ' · ',
    newRetailPrice: '新品時価格',
    bestPriceBadge: '最高値',
    chartPrice: '価格',
  },
}

type I18nContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

function getStoredLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'en' || stored === 'zh' || stored === 'ja') return stored

  const browserLanguage = navigator.language.toLowerCase()
  if (browserLanguage.startsWith('zh')) return 'zh'
  if (browserLanguage.startsWith('ja')) return 'ja'
  return 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => getStoredLanguage())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language)
    document.documentElement.lang = language

    const title = translations[language].metaTitle
    const description = translations[language].metaDescription
    const keywords = translations[language].metaKeywords

    if (typeof title === 'string') {
      document.title = title
    }

    if (typeof description === 'string') {
      const descriptionTag = document.querySelector('meta[name="description"]')
      if (descriptionTag) descriptionTag.setAttribute('content', description)
    }

    if (typeof keywords === 'string') {
      const keywordsTag = document.querySelector('meta[name="keywords"]')
      if (keywordsTag) keywordsTag.setAttribute('content', keywords)
    }
  }, [language])

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key, params = {}) => {
        const entry = translations[language][key]
        if (typeof entry === 'function') return entry(params)
        return entry ?? key
      },
    }),
    [language],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }

  return context
}
