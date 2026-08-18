import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ShieldCheck, LayoutDashboard, Files, LogOut, Menu, X, Search, ChevronRight, Home } from 'lucide-react'
import { getCachedAdminUser, logout as serverLogout } from '../lib/adminAuth'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobile, setMobile] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const loc = useLocation()
  const nav = useNavigate()
  const user = getCachedAdminUser()

  const handleLogout = async () => {
    setLoggingOut(true)
    await serverLogout()
    nav('/admin/login', { replace: true })
  }

  const isActive = (p: string) => loc.pathname === p || (p !== '/admin' && p !== '/admin/dashboard' && loc.pathname.startsWith(p))

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0C1E3A] flex">
      <style>{`*{font-family:'Inter',system-ui,sans-serif} .mono{font-family:'JetBrains Mono',monospace}`}</style>

      <aside className="hidden lg:flex w-[280px] shrink-0 flex-col bg-[#0C1E3A] text-white sticky top-0 h-screen overflow-y-auto border-r border-white/5">
        <div className="h-[72px] px-6 flex items-center gap-3 border-b border-white/10 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-white text-[#0C1E3A] grid place-items-center shadow"><ShieldCheck size={18} /></div>
          <div className="leading-tight">
            <div className="text-[15px] font-[900] tracking-[-0.02em]">Karachi E-Challan</div>
            <div className="text-[10px] font-[700] tracking-[0.12em] text-[#7EE8DC]">ADMIN PANEL</div>
          </div>
        </div>
        <nav className="p-4 grid gap-1.5" aria-label="Admin navigation">
          <Link
            to="/admin/dashboard"
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-[600] transition ${loc.pathname === '/admin' || loc.pathname === '/admin/dashboard' ? 'bg-white text-[#0C1E3A] shadow' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
          >
            <LayoutDashboard size={16} /> Dashboard { (loc.pathname === '/admin' || loc.pathname === '/admin/dashboard') && <ChevronRight size={14} className="ml-auto" />}
          </Link>
          <Link
            to="/admin/requests"
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-[600] transition ${loc.pathname.startsWith('/admin/requests') ? 'bg-white text-[#0C1E3A] shadow' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
          >
            <Files size={16} /> Requests {loc.pathname.startsWith('/admin/requests') && <ChevronRight size={14} className="ml-auto" />}
          </Link>
          <Link to="/" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-[500] text-white/60 hover:text-white hover:bg-white/10 transition mt-2">
            <Home size={16} /> View Public Site
          </Link>
        </nav>
        <div className="mt-auto p-4 space-y-3">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="text-[11px] font-[700] tracking-wide text-white/60">SIGNED IN AS</div>
            <div className="text-[13px] font-[700] mt-1 truncate">{user?.name || 'Admin'}</div>
            <div className="text-[12px] text-white/60 break-all">{user?.email || '—'}</div>
            <button onClick={handleLogout} disabled={loggingOut} className="mt-3 w-full h-9 rounded-full bg-white text-[#0C1E3A] text-[13px] font-[800] inline-flex items-center justify-center gap-1.5 hover:bg-[#F1F5F9] active:scale-[0.98] transition disabled:opacity-60">
              <LogOut size={14} /> {loggingOut ? 'Signing out…' : 'Logout'}
            </button>
          </div>
          <div className="text-[11px] leading-4 text-white/45 px-1">HttpOnly session • MongoDB • PII protected</div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-white/92 backdrop-blur-xl border-b border-[#0C1E3A]/5 h-[64px] flex items-center justify-between px-4 sm:px-6 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setMobile(!mobile)} className="lg:hidden w-10 h-10 rounded-full border border-[#0C1E3A]/10 bg-white grid place-items-center hover:bg-[#F8FAFC] active:scale-[0.96] shrink-0" aria-label="Toggle menu" aria-expanded={mobile}>
              {mobile ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="hidden sm:flex items-center gap-2 text-[13px] font-medium text-[#5B6B85] shrink-0">
              <Link to="/" className="hover:text-[#0C1E3A] hover:underline underline-offset-4 inline-flex items-center gap-1"><Home size={13} /> Public Site</Link>
              <span className="opacity-30">•</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Secure HttpOnly Session</span>
            </div>
            <div className="lg:hidden flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#0C1E3A] text-white grid place-items-center shrink-0"><ShieldCheck size={16} /></div>
              <span className="text-[13px] font-[800] truncate">Admin Panel</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/admin/requests" className="hidden sm:inline-flex items-center gap-2 h-9 px-4 rounded-full bg-[#0C1E3A] hover:bg-[#0A1933] text-white text-[13px] font-[700] shadow-sm transition">
              <Search size={14} /> Search
            </Link>
            <div className="w-9 h-9 rounded-full bg-[#0C1E3A] text-white grid place-items-center text-[12px] font-[800] shrink-0" title={user?.email}>{(user?.name || user?.email || 'A')[0].toUpperCase()}</div>
            <button onClick={handleLogout} disabled={loggingOut} className="hidden sm:inline-flex h-9 px-4 rounded-full border border-[#0C1E3A]/10 bg-white hover:bg-[#F8FAFC] text-[13px] font-[700] items-center gap-1.5 transition disabled:opacity-60">
              <LogOut size={14} /> Logout
            </button>
          </div>
        </header>

        {mobile && (
          <div className="lg:hidden bg-[#0C1E3A] text-white p-4 grid gap-2 border-b border-white/10">
            <Link to="/admin/dashboard" onClick={() => setMobile(false)} className={`px-4 py-3 rounded-xl font-[600] flex items-center justify-between ${(loc.pathname === '/admin' || loc.pathname === '/admin/dashboard') ? 'bg-white text-[#0C1E3A]' : 'bg-white/5'}`}>
              Dashboard <ChevronRight size={16} />
            </Link>
            <Link to="/admin/requests" onClick={() => setMobile(false)} className={`px-4 py-3 rounded-xl font-[600] flex items-center justify-between ${loc.pathname.startsWith('/admin/requests') ? 'bg-white text-[#0C1E3A]' : 'bg-white/5'}`}>
              Requests <ChevronRight size={16} />
            </Link>
            <Link to="/" className="px-4 py-3 rounded-xl bg-white/5 font-[600] flex items-center justify-between">Public Site <Home size={16} /></Link>
            <div className="pt-2 mt-1 border-t border-white/10 text-[12px] text-white/60 px-1 truncate">{user?.email}</div>
            <button onClick={handleLogout} disabled={loggingOut} className="h-11 rounded-full bg-white text-[#0C1E3A] font-[800] active:scale-[0.98] disabled:opacity-60">{loggingOut ? 'Signing out…' : 'Logout'}</button>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1280px] w-full mx-auto">{children}</main>
      </div>
    </div>
  )
}
