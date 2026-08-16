import { Link } from 'react-router-dom'
import PriceTable from '../components/PriceTable'
import { useI18n } from '../i18n'

export default function Prices() {
  const { t } = useI18n()

  return (
    <div className="min-h-[100dvh] bg-[#f3f5f9] text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-3 sm:px-4">
          <Link to="/" className="shrink-0 text-sm font-medium text-slate-600 hover:text-slate-950">
            ← {t('back')}
          </Link>
          <h2 className="min-w-0 truncate px-2 text-base font-semibold text-slate-950 sm:text-lg">{t('priceDetails')}</h2>
          <span className="w-16 shrink-0" />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6">
        <PriceTable />
      </main>
    </div>
  )
}
