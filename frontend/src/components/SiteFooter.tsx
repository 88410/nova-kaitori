import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'

export default function SiteFooter() {
  const { t } = useI18n()

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-medium text-slate-700">{t('companyName')}</p>
        <nav className="flex flex-wrap items-center gap-4">
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
    </footer>
  )
}
