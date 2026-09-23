import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Suspense, lazy, useEffect, useState } from 'react'
import { Loader2, ShieldCheck } from 'lucide-react'
import { checkAuth } from './lib/adminAuth'
import Guides from './pages/Guides';
import LocateCameras from './pages/LocateCameras';
import ViolationsFines from './pages/ViolationsFines';
import PayChallanOnline from './pages/PayChallanOnline';

const PublicApp = lazy(() => import('./pages/PublicApp'))
const ServiceRequest = lazy(() => import('./pages/ServiceRequest'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminRequests = lazy(() => import('./pages/AdminRequests'))
const AdminRequestDetail = lazy(() => import('./pages/AdminRequestDetail'))
const AdminLayout = lazy(() => import('./components/AdminLayout'))

function LoadingFallback() {
  return (
    <div className="min-h-screen grid place-items-center bg-[#FDFDFB] text-[#0C1E3A]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-[#0C1E3A] text-white grid place-items-center animate-pulse"><ShieldCheck size={20} /></div>
        <div className="flex items-center gap-2 text-[13px] font-[600] text-[#5B6B85]"><Loader2 size={14} className="animate-spin" /> Loading…</div>
      </div>
    </div>
  )
}

function RequireAdmin() {
  const loc = useLocation()
  const [checking, setChecking] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    let cancelled = false
    checkAuth().then(res => {
      if (cancelled) return
      setAuthed(res.authenticated)
      setChecking(false)
    })
    return () => { cancelled = true }
  }, [loc.pathname])

  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#0C1E3A] text-white grid place-items-center animate-pulse"><ShieldCheck size={20} /></div>
          <div className="flex items-center gap-2 text-[13px] font-[600] text-[#5B6B85]"><Loader2 size={14} className="animate-spin" /> Checking admin session…</div>
          <div className="text-[11px] text-[#94A3B8]">Secure HttpOnly cookie verification</div>
        </div>
      </div>
    )
  }

  if (!authed) {
    return <Navigate to="/admin/login" replace state={{ from: loc.pathname, msg: 'Please sign in to access the admin panel.' }} />
  }
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* ✅ PUBLIC ROUTES */}
          <Route path="/" element={<PublicApp />} />
          <Route path="/guides" element={<Guides />} />
          <Route path="/locate-cameras" element={<LocateCameras />} />
          <Route path="/fines" element={<ViolationsFines />} />
          <Route path="/guides/pay-challan-online" element={<PayChallanOnline />} />
          <Route path="/services/:slug" element={<ServiceRequest />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          
          {/* ✅ ADMIN ROUTES */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/requests" element={<AdminRequests />} />
            <Route path="/admin/requests/:id" element={<AdminRequestDetail />} />
          </Route>
          
          {/* ✅ 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}