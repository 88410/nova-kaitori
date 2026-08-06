import { FormEvent, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { KeyRound, LogIn, Mail } from 'lucide-react'
import { apiPost } from '../lib/api'
import { type MemberProfile } from '../lib/member'
import { useI18n } from '../i18n'

function getErrorKey(error: unknown) {
  const response = (error as { response?: { status?: number } }).response
  if (response?.status === 401) return 'memberLoginErrorGeneric'
  if (response?.status === 429) return 'memberAuthRateLimited'
  if (response?.status === 422) return 'memberRegisterErrorValidation'
  return 'memberLoginErrorGeneric'
}

export default function MemberLogin() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorKey(null)
    setIsSubmitting(true)

    try {
      const member = await apiPost<MemberProfile>('/api/v1/members/login', { email, password })
      queryClient.setQueryData(['current-member'], member)
      navigate('/members/me')
    } catch (error) {
      setErrorKey(getErrorKey(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-900">
            ← {t('back')}
          </Link>
          <h1 className="text-lg font-semibold text-slate-900">{t('memberLoginNav')}</h1>
          <span className="w-10" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {t('memberLoginEyebrow')}
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">{t('memberLoginTitle')}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{t('memberLoginDescription')}</p>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-800">{t('memberEmail')}</span>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-slate-400">
                <Mail className="h-5 w-5 text-slate-400" />
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder={t('memberEmailPlaceholder')}
                  type="email"
                  maxLength={255}
                  required
                />
              </div>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-800">{t('memberPassword')}</span>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-slate-400">
                <KeyRound className="h-5 w-5 text-slate-400" />
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder={t('memberPasswordPlaceholder')}
                  type="password"
                  minLength={8}
                  maxLength={128}
                  required
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:bg-slate-300"
            >
              <LogIn className="h-4 w-4" />
              {isSubmitting ? t('memberLoginSubmitting') : t('memberLoginSubmit')}
            </button>
          </form>

          {errorKey && (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm leading-6 text-rose-700">
              {t(errorKey)}
            </div>
          )}

          <div className="mt-6 text-sm text-slate-600">
            {t('memberLoginNoAccount')}{' '}
            <Link to="/members/register" className="font-medium text-slate-950 hover:underline">
              {t('memberRegisterNav')}
            </Link>
          </div>
          <div className="mt-3 text-sm">
            <Link to="/members/reset-password" className="font-medium text-slate-950 hover:underline">
              {t('memberForgotPassword')}
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
