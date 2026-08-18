import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { ShieldCheck, Lock, Mail, Eye, EyeOff, Loader2, AlertTriangle, ArrowLeft, AlertCircle, Info } from 'lucide-react'
import { login, isAuthenticated } from '../lib/adminAuth'

export default function AdminLogin() {
  const nav = useNavigate()
  const loc = useLocation() as any
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const redirectMsg: string | null = loc.state?.msg || null

  useEffect(() => {
    if (isAuthenticated()) nav('/admin/dashboard', { replace: true })
  }, [nav])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !password) { setError('Both email and password are required.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Enter a valid admin email address.'); return }
    if (attempts >= 5) { setError('Too many attempts. Please wait a moment before trying again.'); return }
    setLoading(true)
    const res = await login(email, password)
    setLoading(false)
    if (!res.ok) {
      setError(res.error || 'Sign in failed.')
      setAttempts(a => a + 1)
      return
    }
    setAttempts(0)
    const target = (loc.state as any)?.from || '/admin/dashboard'
    nav(target, { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#FDFDFB] flex flex-col">
      <style>{`* {font-family:'Inter',system-ui,sans-serif} .mono{font-family:'JetBrains Mono',monospace}`}</style>
      <div className="w-full bg-[#0C1E3A] text-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-9 flex items-center justify-between text-[12px]">
          <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/10 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide"><Lock size={11} /> ADMIN ACCESS ONLY — Protected area</span>
          <Link to="/" className="hidden sm:inline-flex items-center gap-1.5 text-white/70 hover:text-white font-medium"><ArrowLeft size={12} /> Back to Public Site</Link>
        </div>
      </div>

      <div className="flex-1 grid lg:grid-cols-[1.05fr_0.95fr] max-w-[1200px] w-full mx-auto">
        <div className="hidden lg:flex flex-col justify-center px-10 xl:px-14 py-12 bg-[#0C1E3A] text-white relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-[420px] h-[420px] rounded-full bg-[#0F766E]/20 blur-[50px]" />
          <div className="absolute -left-20 -bottom-20 w-[360px] h-[360px] rounded-full bg-white/5 blur-[60px]" />
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `radial-gradient(white 0.9px, transparent 0.9px)`, backgroundSize: '16px 16px' }} />
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-white text-[#0C1E3A] grid place-items-center shadow-lg"><ShieldCheck size={22} /></div>
            <h1 className="mt-6 text-[34px] font-[900] tracking-[-0.03em] leading-[0.9]">Admin Panel<br /><span className="font-normal italic" style={{ fontFamily: 'Instrument Serif, serif' }}>Secure Verification</span></h1>
            <p className="mt-4 text-[14px] leading-6 text-white/70 max-w-[440px] text-pretty">Manually review verification requests, check external sources, and email results to users. No automated scraping — human verification only.</p>
            <div className="mt-8 grid gap-3 max-w-[420px]">
              {['Encrypted admin session', 'All PII hidden from public URLs & search', 'Full audit of status & email history'].map(t => (
                <div key={t} className="flex items-center gap-2.5 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-[13px] font-medium"><span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" /> {t}</div>
              ))}
            </div>
            <div className="mt-8 rounded-xl bg-white text-[#0C1E3A] p-4 text-[12px] leading-5 shadow">
              <div className="font-[800] flex items-center gap-1.5"><AlertCircle size={12} /> Demo credentials</div>
              <div className="mono mt-1 text-[12px] leading-5">Email: admin@karachiechallan.pk<br />Password: Admin@123</div>
              <div className="mt-2 text-[11px] text-[#64748B]">In production this uses HttpOnly sessions / JWT — this demo mirrors the same route protection.</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center px-4 sm:px-8 lg:px-10 xl:px-12 py-8 sm:py-10">
          <Link to="/" className="lg:hidden inline-flex items-center gap-2 text-[13px] font-medium text-[#5B6B85] mb-6 hover:text-[#0C1E3A]"><ArrowLeft size={14} /> Back to site</Link>
          <div className="max-w-[440px] w-full mx-auto lg:mx-0">
            <div className="w-11 h-11 rounded-xl bg-[#0C1E3A] text-white grid place-items-center shadow"><ShieldCheck size={20} /></div>
            <h2 className="mt-4 text-[24px] font-[900] tracking-[-0.02em] leading-none">Sign in to Admin</h2>
            <p className="text-[13.5px] leading-6 text-[#5B6B85] mt-2 text-pretty">Protected area. Only authorized verifiers may access requests and personal information.</p>

            <form onSubmit={handleSubmit} noValidate className="mt-6 sm:mt-7 grid gap-4 bg-white rounded-[20px] border border-[#0C1E3A]/5 p-6 shadow-[0_12px_32px_rgba(12,30,58,0.06)]">
              {redirectMsg && !error && (
                <div className="rounded-xl bg-[#EFF6FF] border border-blue-200 px-4 py-3 flex gap-2.5 text-[13px] leading-5 text-[#0C4A6E]">
                  <Info size={16} className="shrink-0 mt-0.5" />
                  <span>{redirectMsg}</span>
                </div>
              )}
              {error && (
                <div role="alert" className="rounded-xl bg-[#FEF2F2] border border-red-200 px-4 py-3 flex gap-2.5 text-[13px] leading-5 text-[#7F1D1D]">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-600" />
                  <span><span className="font-[700]">Sign in failed:</span> {error}</span>
                </div>
              )}
              {attempts >= 3 && attempts < 5 && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-[12px] leading-5 text-amber-900 flex gap-2">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  Attempts: {attempts}/5 — check caps lock and try again.
                </div>
              )}
              <div>
                <label htmlFor="admin-email" className="text-[13px] font-[700] text-[#0C1E3A]">Email</label>
                <div className="relative mt-2">
                  <input
                    id="admin-email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    type="email"
                    autoComplete="email"
                    placeholder="admin@karachiechallan.pk"
                    aria-invalid={!!error}
                    className="w-full h-11 rounded-xl border border-[#0C1E3A]/15 bg-white px-4 pr-10 text-[14px] font-[500] outline-none focus:border-[#0C1E3A] focus:ring-4 focus:ring-[#0C1E3A]/10 placeholder:text-[#94A3B8]"
                  />
                  <Mail size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                </div>
              </div>
              <div>
                <label htmlFor="admin-password" className="text-[13px] font-[700] text-[#0C1E3A]">Password</label>
                <div className="relative mt-2">
                  <input
                    id="admin-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    type={show ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full h-11 rounded-xl border border-[#0C1E3A]/15 bg-white px-4 pr-10 text-[14px] font-[500] outline-none focus:border-[#0C1E3A] focus:ring-4 focus:ring-[#0C1E3A]/10"
                  />
                  <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#F1F5F9] grid place-items-center text-[#5B6B85] hover:bg-[#E2E8F0] transition"><>{show ? <EyeOff size={14} /> : <Eye size={14} />}</></button>
                </div>
              </div>
              <button disabled={loading} type="submit" className="mt-1 w-full h-11 rounded-full bg-[#0C1E3A] hover:bg-[#0A1933] disabled:opacity-60 active:scale-[0.98] text-white font-[800] text-[14px] inline-flex items-center justify-center gap-2 transition">
                {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : <><Lock size={16} /> Sign In</>}
              </button>
              <p className="text-center text-[11px] leading-4 text-[#64748B]">Demo: <span className="mono font-[600] text-[#0C1E3A]">admin@karachiechallan.pk</span> / <span className="mono font-[600] text-[#0C1E3A]">Admin@123</span></p>
            </form>
            <p className="mt-6 text-center text-[11px] text-[#64748B]">Secure • Encrypted • Admin-only PII • No PII in URLs</p>
          </div>
        </div>
      </div>
    </div>
  )
}
