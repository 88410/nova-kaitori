import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'

const VERSION_UPDATED_AT = import.meta.env.VITE_APP_VERSION_UPDATED_AT || 'dev build'

export default function SiteFooter() {
  const { t } = useI18n()

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-500">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium text-slate-700">{t('companyName')}</p>
          <nav className="flex flex-wrap items-center gap-4">
            <Link to="/company" className="hover:text-slate-900">
              {t('footerCompany')}
            </Link>
            <Link to="/notice" className="hover:text-slate-900">
              {t('footerNotice')}
            </Link>
            <Link to="/privacy" className="hover:text-slate-900">
              {t('footerPrivacy')}
            </Link>
            <Link to="/terms" className="hover:text-slate-900">
              {t('footerTerms')}
            </Link>
          </nav>
        </div>
        <div className="mt-4 border-t border-slate-200 pt-4 text-xs text-slate-400">
          {t('footerVersionUpdated')}: {VERSION_UPDATED_AT}
        </div>
      </div>
    </footer>
  )
}
