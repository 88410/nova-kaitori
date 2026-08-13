import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Prices from './pages/Prices'
import Stores from './pages/Stores'
import MemberRegister from './pages/MemberRegister'
import MemberLogin from './pages/MemberLogin'
import MemberProfile from './pages/MemberProfile'
import MemberResetPassword from './pages/MemberResetPassword'
import AI from './pages/AI'
import ProductDetail from './pages/ProductDetail'
import LanguageSwitcher from './components/LanguageSwitcher'
import SiteFooter from './components/SiteFooter'
import LegalPage from './pages/LegalPage'
import CompanyHome from './pages/CompanyHome'
import DevelopmentLogPage from './pages/DevelopmentLogPage'

const isCompanySite = import.meta.env.VITE_SITE_MODE === 'company'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

function App() {
  const { pathname } = useLocation()

  if (isCompanySite) {
    return (
      <>
        <LanguageSwitcher />
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<CompanyHome />} />
          <Route path="/company" element={<LegalPage />} />
          <Route path="/development" element={<DevelopmentLogPage />} />
          <Route path="/notice" element={<LegalPage />} />
          <Route path="/privacy" element={<LegalPage />} />
          <Route path="/terms" element={<LegalPage />} />
          <Route path="*" element={<CompanyHome />} />
        </Routes>
        <SiteFooter />
      </>
    )
  }

  return (
    <>
      {pathname !== '/' && pathname !== '/ai' && <LanguageSwitcher />}
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<AI />} />
        <Route path="/ai" element={<AI />} />
        <Route path="/prices" element={<Prices />} />
        <Route path="/stores" element={<Stores />} />
        <Route path="/members/register" element={<MemberRegister />} />
        <Route path="/members/login" element={<MemberLogin />} />
        <Route path="/members/reset-password" element={<MemberResetPassword />} />
        <Route path="/members/me" element={<MemberProfile />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/company" element={<LegalPage />} />
        <Route path="/notice" element={<LegalPage />} />
        <Route path="/privacy" element={<LegalPage />} />
        <Route path="/terms" element={<LegalPage />} />
      </Routes>
      {pathname !== '/' && pathname !== '/ai' && <SiteFooter />}
    </>
  )
}

export default App
