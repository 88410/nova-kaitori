import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiPost } from '../lib/api'
import { useI18n, type Language } from '../i18n'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface AIChatResponse {
  reply: string
  remaining: number
}

const EXAMPLE_PROMPTS: Record<Language, string[]> = {
  en: [
    'Which store offers the highest buyback price for iPhone 17 Pro Max 256GB?',
    'Compare buyback prices for iPhone 17 Pro 256GB across stores.',
    'If I sell an iPhone 17 128GB today, which shop looks best?',
  ],
  zh: [
    'iPhone 17 Pro Max 256GB 现在哪家回收价最高？',
    '帮我比较一下 iPhone 17 Pro 256GB 各店铺回收价格。',
    '如果我今天卖 iPhone 17 128GB，推荐哪家店？',
  ],
  ja: [
    'iPhone 17 Pro Max 256GB は今どの店舗が一番高いですか？',
    'iPhone 17 Pro 256GB の買取価格を店舗ごとに比較してください。',
    '今日 iPhone 17 128GB を売るなら、どのお店がおすすめですか？',
  ],
}

export default function AI() {
  const { language, t } = useI18n()
  const [sessionId] = useState(() => crypto.randomUUID())
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: t('aiWelcome'),
    },
  ])
  const [input, setInput] = useState('')
  const [remaining, setRemaining] = useState(10)
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const examplePrompts = EXAMPLE_PROMPTS[language]

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length !== 1 || prev[0]?.id !== 'welcome') return prev
      return [
        {
          id: 'welcome',
          role: 'assistant',
          content: t('aiWelcome'),
        },
      ]
    })
  }, [language, t])

  const handleSend = async () => {
    const content = input.trim()
    if (!content || isLoading || remaining <= 0) return

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const data = await apiPost<AIChatResponse>('/api/v1/ai/chat', {
        session_id: sessionId,
        message: content,
      })

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          content: data.reply || t('aiEmptyReply'),
        },
      ])
      setRemaining(data.remaining)
    } catch (error: any) {
      const status = error?.response?.status
      const message =
        status === 429
          ? t('aiLimitReached')
          : t('aiError')

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          content: message,
        },
      ])

      if (status === 429) {
        setRemaining(0)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleExampleClick = (prompt: string) => {
    if (isLoading || remaining <= 0) return
    setInput(prompt)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-900">
            ← {t('back')}
          </Link>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-slate-900">{t('novaAi')}</h2>
            <p className="text-xs text-slate-500">{t('remainingCount', { count: remaining })}</p>
          </div>
          <span className="w-10" />
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-6">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={
                  msg.role === 'user'
                    ? 'max-w-[80%] rounded-2xl bg-black px-4 py-3 text-white'
                    : 'max-w-[80%] rounded-2xl bg-white px-4 py-3 text-slate-800 shadow-sm'
                }
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">{t('thinking')}</div>
            </div>
          )}
          {messages.length === 1 && !isLoading && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">{t('aiExamplesTitle')}</p>
              <div className="flex flex-col gap-2">
                {examplePrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleExampleClick(prompt)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-4">
          <input
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:border-slate-400"
            placeholder={remaining > 0 ? t('inputPlaceholder') : t('noQuestionsLeft')}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleSend()}
            disabled={remaining <= 0 || isLoading}
            maxLength={200}
          />
          <button
            className="rounded-xl bg-black px-4 py-3 text-sm font-medium text-white disabled:bg-slate-300"
            onClick={handleSend}
            disabled={remaining <= 0 || isLoading || !input.trim()}
          >
            {t('send')}
          </button>
        </div>
      </footer>
    </div>
  )
}
