import { Link } from 'react-router-dom'
import testData from '../data/aiTestCases.json'
import { useI18n, type Language } from '../i18n'

interface TestCase {
  id: number
  category: string
  question: string
  answer: string
}

interface TestData {
  generatedAt: string
  model: string
  reasoningEffort: string
  cases: Record<Language, TestCase[]>
}

const COPY: Record<Language, { title: string; subtitle: string; snapshot: string; question: string; answer: string; back: string; openChat: string }> = {
  en: {
    title: 'NOVA AI · 20 Q&A',
    subtitle: 'A saved set of real Terra responses covering local prices and general smartphone questions.',
    snapshot: 'Price answers use the local NOVA price snapshot from the generation time and may change later.',
    question: 'Question',
    answer: 'Terra answer',
    back: 'Home',
    openChat: 'Open live chat',
  },
  zh: {
    title: 'NOVA AI · 20 问答',
    subtitle: '真实 Terra 回答结果，包含 NOVA 本地价格和手机知识问题。',
    snapshot: '价格回答使用生成时的 NOVA 本地价格快照，之后可能随市场更新。',
    question: '问题',
    answer: 'Terra 回答',
    back: '返回首页',
    openChat: '打开实时聊天',
  },
  ja: {
    title: 'NOVA AI・20問テスト',
    subtitle: 'NOVA のローカル価格とスマホ相談に対する、実際の Terra 回答結果です。',
    snapshot: '価格回答は生成時点の NOVA ローカル価格スナップショットです。現在価格は更新される場合があります。',
    question: '質問',
    answer: 'Terra の回答',
    back: 'トップへ戻る',
    openChat: 'リアルタイムチャット',
  },
}

const data = testData as TestData

export default function AITest() {
  const { language } = useI18n()
  const copy = COPY[language]
  const cases = data.cases[language]
  const generatedAt = new Intl.DateTimeFormat(
    language === 'zh' ? 'zh-CN' : language === 'en' ? 'en-US' : 'ja-JP',
    { dateStyle: 'medium', timeStyle: 'short' },
  ).format(new Date(data.generatedAt))

  return (
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
        {cases.map((item) => (
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
      </main>
    </div>
  )
}
