import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, Bookmark, History, LogOut, UserRound } from 'lucide-react'
import { clearStoredMember, getStoredMember } from '../lib/member'
import { useI18n, type Language } from '../i18n'
import { LightPage, PageHeader, lightPanelClass } from '../components/PageChrome'

function formatDateTime(value: string, language: Language) {
  return new Intl.DateTimeFormat(
    language === 'ja' ? 'ja-JP' : language === 'zh' ? 'zh-CN' : 'en-US',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(new Date(value))
}

export default function MemberProfile() {
  const { language, t } = useI18n()
  const navigate = useNavigate()
  const [member, setMember] = useState(() => getStoredMember())

  const futureItems = useMemo(
    () => [
      { icon: Bookmark, title: t('memberSavedModels'), description: t('memberSavedModelsDescription') },
      { icon: Bell, title: t('memberPriceAlerts'), description: t('memberPriceAlertsDescription') },
      { icon: History, title: t('memberConsultHistory'), description: t('memberConsultHistoryDescription') },
    ],
    [t],
  )

  const handleLogout = () => {
    clearStoredMember()
    setMember(null)
    navigate('/')
  }

  if (!member) {
    return (
      <LightPage>
        <PageHeader title={t('memberMyPageNav')} />
        <main className="mx-auto max-w-4xl px-3 py-4 sm:px-4 sm:py-10">
          <section className={`border-t-2 border-t-violet-500 px-5 py-8 text-center sm:px-8 ${lightPanelClass}`}>
            <p className="text-lg font-semibold text-slate-950">{t('memberProfileEmptyTitle')}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{t('memberProfileEmptyDescription')}</p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/members/login"
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-medium text-white"
              >
                {t('memberLoginNav')}
              </Link>
              <Link
                to="/members/register"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-900"
              >
                {t('memberRegisterNav')}
              </Link>
            </div>
          </section>
        </main>
      </LightPage>
    )
  }

  return (
    <LightPage>
      <PageHeader title={t('memberMyPageNav')} />

      <main className="mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-10">
        <section className={`border-t-2 border-t-violet-500 p-5 sm:p-8 ${lightPanelClass}`}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-white">
                <UserRound className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {t('memberProfileEyebrow')}
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-950">{member.username}</h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                {t('memberNormalStatus')}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300 hover:text-slate-950"
              >
                <LogOut className="h-3.5 w-3.5" />
                {t('memberLogout')}
              </button>
            </div>
          </div>

          <dl className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <dt className="text-xs font-medium text-slate-500">{t('memberUsername')}</dt>
              <dd className="mt-2 text-sm font-semibold text-slate-950">{member.username}</dd>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <dt className="text-xs font-medium text-slate-500">{t('memberEmail')}</dt>
              <dd className="mt-2 break-all text-sm font-semibold text-slate-950">{member.email}</dd>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <dt className="text-xs font-medium text-slate-500">{t('memberRegisteredAt')}</dt>
              <dd className="mt-2 text-sm font-semibold text-slate-950">{formatDateTime(member.created_at, language)}</dd>
            </div>
          </dl>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {futureItems.map((item) => (
            <article key={item.title} className={`p-5 ${lightPanelClass}`}>
              <div className="flex items-center justify-between gap-3">
                <item.icon className="h-5 w-5 text-slate-500" />
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                  {t('memberComingSoon')}
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            </article>
          ))}
        </section>
      </main>
    </LightPage>
  )
}
