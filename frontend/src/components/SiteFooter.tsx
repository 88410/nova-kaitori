import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'

export default function SiteFooter() {
  const { t } = useI18n()
  const isCompanySite = import.meta.env.VITE_SITE_MODE === 'company'

  return (
    <footer className={isCompanySite ? 'border-t border-white/10 bg-[#07080b]' : 'border-t border-slate-200 bg-white'}>
      <div className={`mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm sm:flex-row sm:items-center sm:justify-between ${isCompanySite ? 'text-white/40' : 'text-slate-500'}`}>
        <div className="flex flex-col gap-1">
          <p className={`font-medium ${isCompanySite ? 'text-white/70' : 'text-slate-700'}`}>{t('companyName')}</p>
          <a href="mailto:info@novatekku.com" className={isCompanySite ? 'break-all hover:text-white' : 'break-all hover:text-slate-900'}>
            info@novatekku.com
          </a>
        </div>
        {isCompanySite ? (
          <nav className="flex flex-wrap items-center gap-4">
            <Link to="/company" className="hover:text-white">
              {t('footerCompany')}
            </Link>
            <Link to="/development" className="hover:text-white">
              {t('developmentLogEyebrow')}
            </Link>
            <a href="https://github.com/jp-lzq/novatekku" target="_blank" rel="noreferrer" className="hover:text-white">
              GitHub
            </a>
          </nav>
        ) : (
          <nav className="flex flex-wrap items-center gap-4">
            <a href="https://novatekku.com/company" className="hover:text-slate-900">
              {t('footerCompany')}
            </a>
            <a href="https://novatekku.com/development" className="hover:text-slate-900">
              {t('developmentLogEyebrow')}
            </a>
            <Link to="/notice" className="hover:text-slate-900">
              {t('footerNotice')}
            </Link>
            <Link to="/privacy" className="hover:text-slate-900">
              {t('footerPrivacy')}
            </Link>
            <Link to="/terms" className="hover:text-slate-900">
              {t('footerTerms')}
            </Link>
            <a href="https://github.com/jp-lzq/novatekku" target="_blank" rel="noreferrer" className="hover:text-slate-900">
              GitHub
            </a>
          </nav>
        )}
      </div>
    </footer>
  )
}
