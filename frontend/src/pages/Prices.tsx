import PriceTable from '../components/PriceTable'
import { LightPage, PageHeader } from '../components/PageChrome'
import { useI18n } from '../i18n'

export default function Prices() {
  const { t } = useI18n()

  return (
    <LightPage>
      <PageHeader title={t('priceDetails')} />
      <main className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6">
        <PriceTable />
      </main>
    </LightPage>
  )
}
