import { Link } from 'react-router-dom'
import PriceTable from '../components/PriceTable'
import { useI18n } from '../i18n'

export default function Prices() {
  const { t } = useI18n()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-900">
            ← {t('back')}
          </Link>
          <h2 className="text-lg font-semibold text-slate-900">{t('priceDetails')}</h2>
          <span className="w-10" />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <PriceTable />
      </main>
    </div>
  )
}
