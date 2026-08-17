import { ChevronRight, Database, MessageSquare, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import AdminShell from '../components/AdminShell'

const modules = [
  {
    to: '/admin/members',
    Icon: Users,
    title: '会員管理',
    description: 'ユーザー名、メールアドレス、登録日時、ログイン記録を確認します。',
  },
  {
    to: '/admin/prices',
    Icon: Database,
    title: '価格記録',
    description: '店舗から商品へ進み、公式価格と表データを並べて確認します。',
  },
  {
    to: '/admin/ai-history',
    Icon: MessageSquare,
    title: 'AI記録',
    description: '会員と訪問者の質問、回答、利用日時、IPを確認します。',
  },
]

export default function AdminDashboard() {
  return (
    <AdminShell title="データ管理" backTo="/members/me">
      <div>
        <p className="text-xs font-semibold tracking-[0.18em] text-violet-600">NOVA ADMIN</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">管理メニュー</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">確認する項目を選んでください。ここには詳細データを表示しません。</p>
      </div>

      <section className="mt-6 grid gap-3 md:grid-cols-3">
        {modules.map(({ to, Icon, title, description }) => (
          <Link key={to} to={to} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-violet-200 hover:shadow-md">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-50 text-violet-700"><Icon className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold">{title}</h2>
                  <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-violet-600" />
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </AdminShell>
  )
}
