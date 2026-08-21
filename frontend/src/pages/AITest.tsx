import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductNav from '../components/ProductNav'
import testData from '../data/aiTestCases.json'
import { buildExpandedTestCases, type AITestCase as TestCase } from '../data/aiTestCatalog'
import { useI18n, type Language } from '../i18n'

interface TestData {
  generatedAt: string
  model: string
  reasoningEffort: string
  cases: Record<Language, TestCase[]>
}

const COPY: Record<Language, { title: string; subtitle: string; snapshot: string; question: string; answer: string; back: string; openChat: string; previous: string; next: string; page: string }> = {
  en: {
    title: 'NOVA AI · 200 Q&A',
    subtitle: 'An iPhone question set covering prices, models, international variants, buyback and cross-border trade.',
    snapshot: 'Live price questions should use the latest valid NOVA data. Historical examples are for reference only.',
    question: 'Question',
    answer: 'Answer guide',
    back: 'Home',
    openChat: 'Open live chat',
    previous: 'Previous',
    next: 'Next',
    page: 'Page',
  },
  zh: {
    title: 'NOVA AI · 200 问答',
    subtitle: '覆盖 iPhone 价格、历代机型、各国版本、回收与跨境贸易的问题集。',
    snapshot: '实时价格问题应使用 NOVA 最新有效数据，历史例子仅供参考。',
    question: '问题',
    answer: '回答要点',
    back: '返回首页',
    openChat: '打开实时聊天',
    previous: '上一页',
    next: '下一页',
    page: '页码',
  },
  ja: {
    title: 'NOVA AI・200問',
    subtitle: 'iPhone価格、歴代機種、各国・地域モデル、買取、越境取引をまとめた問題集です。',
    snapshot: '現在価格の質問にはNOVAの最新有効データを使用します。過去の例は参考情報です。',
    question: '質問',
    answer: '回答ポイント',
    back: 'トップへ戻る',
    openChat: 'リアルタイムチャット',
    previous: '前へ',
    next: '次へ',
    page: 'ページ',
  },
}

const data = testData as TestData
const PAGE_SIZE = 20

export default function AITest() {
  const { language } = useI18n()
  const copy = COPY[language]
  const cases = useMemo(() => buildExpandedTestCases(language, data.cases[language]), [language])
  const [page, setPage] = useState(1)
  const pageCount = Math.ceil(cases.length / PAGE_SIZE)
  const visibleCases = cases.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const generatedAt = new Intl.DateTimeFormat(
    language === 'zh' ? 'zh-CN' : language === 'en' ? 'en-US' : 'ja-JP',
    { dateStyle: 'medium', timeStyle: 'short' },
  ).format(new Date(data.generatedAt))

  useEffect(() => {
    setPage(1)
  }, [language])

  const changePage = (nextPage: number) => {
    setPage(Math.min(Math.max(nextPage, 1), pageCount))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const pagination = (
    <nav className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-3" aria-label={copy.page}>
      <button
        type="button"
        onClick={() => changePage(page - 1)}
        disabled={page === 1}
        className="min-h-11 rounded-xl border border-slate-700 px-4 text-sm font-medium text-slate-200 transition-colors hover:border-violet-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
      >
        ← {copy.previous}
      </button>
      <span className="text-center text-sm text-slate-400">
        {copy.page} <strong className="text-white">{page}</strong> / {pageCount}
      </span>
      <button
        type="button"
        onClick={() => changePage(page + 1)}
        disabled={page === pageCount}
        className="min-h-11 rounded-xl border border-slate-700 px-4 text-sm font-medium text-slate-200 transition-colors hover:border-violet-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
      >
        {copy.next} →
      </button>
    </nav>
  )

  return (
    <>
      <ProductNav />
      <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/95">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link to="/" className="text-slate-400 transition-colors hover:text-white">
              ← {copy.back}
            </Link>
            <Link to="/ai" className="text-violet-300 transition-colors hover:text-violet-200">
              {copy.openChat} →
            </Link>
          </div>
          <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-violet-300">NOVA AI TEST</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">{copy.title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">{copy.subtitle}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-1.5 text-violet-200">
                {data.model}
              </span>
              <span className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-sky-200">
                effort: {data.reasoningEffort}
              </span>
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-emerald-200">
                {cases.length} Q&amp;A
              </span>
            </div>
          </div>
          <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs leading-5 text-amber-100/80">
            {copy.snapshot} · {generatedAt}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-8 sm:px-6 sm:py-10">
        {pagination}
        {visibleCases.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl shadow-black/10">
            <div className="border-b border-slate-800 bg-slate-900/80 px-4 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500 text-sm font-bold text-white">
                  {item.id}
                </span>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">{item.category}</span>
              </div>
              <p className="mt-3 text-xs font-medium uppercase tracking-wider text-slate-500">{copy.question}</p>
              <h2 className="mt-1 text-base font-semibold leading-7 text-white sm:text-lg">{item.question}</h2>
            </div>
            <div className="px-4 py-5 sm:px-6">
              <p className="text-xs font-medium uppercase tracking-wider text-violet-300">{copy.answer}</p>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-300 sm:text-[15px]">{item.answer}</p>
            </div>
          </article>
        ))}
        {pagination}
      </main>
      </div>
    </>
  )
}
