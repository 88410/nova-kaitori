import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Prices from './pages/Prices'
import AI from './pages/AI'
import ProductDetail from './pages/ProductDetail'
import LanguageSwitcher from './components/LanguageSwitcher'
import SiteFooter from './components/SiteFooter'
import LegalPage from './pages/LegalPage'

function App() {
  return (
    <>
      <LanguageSwitcher />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ai" element={<AI />} />
        <Route path="/prices" element={<Prices />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/notice" element={<LegalPage />} />
        <Route path="/privacy" element={<LegalPage />} />
        <Route path="/terms" element={<LegalPage />} />
      </Routes>
      <SiteFooter />
    </>
  )
}

export default App
