import { FormEvent, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, KeyRound, Mail, ShieldAlert } from 'lucide-react'
import { apiGet, apiPost } from '../lib/api'
import { useI18n } from '../i18n'

interface MessageResponse {
  message: string
}

interface ResetAvailabilityResponse {
  enabled: boolean
}

function getErrorKey(error: unknown) {
  const response = (error as { response?: { status?: number } }).response
  if (response?.status === 400) return 'memberResetPasswordInvalidToken'
  if (response?.status === 422) return 'memberRegisterErrorValidation'
  if (response?.status === 429) return 'memberAuthRateLimited'
  return 'memberResetPasswordErrorGeneric'
}

export default function MemberResetPassword() {
  const { t } = useI18n()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const isConfirmation = Boolean(token)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [completed, setCompleted] = useState(false)
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: availability, isLoading } = useQuery({
    queryKey: ['password-reset-config'],
    queryFn: () => apiGet<ResetAvailabilityResponse>('/api/v1/members/password-reset/config'),
    staleTime: 1000 * 60 * 5,
    retry: false,
  })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorKey(null)
    setCompleted(false)

    if (isConfirmation && password !== passwordConfirm) {
      setErrorKey('memberRegisterErrorPasswordMismatch')
      return
    }

    setIsSubmitting(true)
    try {
      if (isConfirmation) {
        await apiPost<MessageResponse>('/api/v1/members/password-reset/confirm', { token, password })
        setPassword('')
        setPasswordConfirm('')
      } else {
        await apiPost<MessageResponse>('/api/v1/members/password-reset/request', { email })
        setEmail('')
      }
      setCompleted(true)
    } catch (error) {
      setErrorKey(getErrorKey(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetUnavailable = !isConfirmation && !isLoading && availability?.enabled === false

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-900">
            ← {t('back')}
          </Link>
          <h1 className="text-lg font-semibold text-slate-900">{t('memberResetPasswordNav')}</h1>
          <span className="w-10" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {t('memberResetPasswordEyebrow')}
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">
            {t(isConfirmation ? 'memberResetPasswordConfirmTitle' : 'memberResetPasswordTitle')}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            {t(isConfirmation ? 'memberResetPasswordConfirmDescription' : 'memberResetPasswordDescription')}
          </p>

          {resetUnavailable ? (
            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-5 text-sm text-amber-900">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">{t('memberResetPasswordUnavailableTitle')}</p>
                  <p className="mt-1 leading-6">{t('memberResetPasswordUnavailableDescription')}</p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
              {!isConfirmation && (
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
              )}

              {isConfirmation && (
                <>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-800">{t('memberNewPassword')}</span>
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
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-800">{t('memberPasswordConfirm')}</span>
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-slate-400">
                      <KeyRound className="h-5 w-5 text-slate-400" />
                      <input
                        value={passwordConfirm}
                        onChange={(event) => setPasswordConfirm(event.target.value)}
                        className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                        placeholder={t('memberPasswordConfirmPlaceholder')}
                        type="password"
                        minLength={8}
                        maxLength={128}
                        required
                      />
                    </div>
                  </label>
                </>
              )}

              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:bg-slate-300"
              >
                {isSubmitting
                  ? t('memberResetPasswordSubmitting')
                  : t(isConfirmation ? 'memberResetPasswordConfirmSubmit' : 'memberResetPasswordSubmit')}
              </button>
            </form>
          )}

          {completed && (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5" />
                <div>
                  <p className="font-semibold">
                    {t(isConfirmation ? 'memberResetPasswordSuccessTitle' : 'memberResetPasswordRequestSuccessTitle')}
                  </p>
                  <p className="mt-1 leading-6">
                    {t(isConfirmation ? 'memberResetPasswordSuccessDescription' : 'memberResetPasswordRequestSuccessDescription')}
                  </p>
                  {isConfirmation && (
                    <Link to="/members/login" className="mt-3 inline-flex font-medium text-emerald-900 hover:underline">
                      {t('memberLoginNav')}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {errorKey && (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm leading-6 text-rose-700">
              {t(errorKey)}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
