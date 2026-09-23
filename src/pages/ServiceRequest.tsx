import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, Lock, Mail, ChevronLeft, ArrowUpRight, Send, Loader2, AlertCircle, AlertTriangle,
  CheckCircle2, Copy, Check, Shield, UserCheck, Phone, Fingerprint, FileText, Car, ClipboardCheck, Clock3, X, RefreshCw,
  type LucideIcon,
} from 'lucide-react'
import { submitServiceRequest } from '../lib/apiClient'
import { serviceBySlug, validateServiceForm, formatCNIC, formatPhone, type FieldKey, type ServiceDef } from '../lib/services'

const FIELD_ICON: Partial<Record<FieldKey, { icon: LucideIcon; size: number }>> = {
  cnic: { icon: Fingerprint, size: 16 },
  phone: { icon: Phone, size: 15 },
  email: { icon: Mail, size: 15 },
  challanNumber: { icon: FileText, size: 15 },
  complaintNumber: { icon: ClipboardCheck, size: 15 },
  vehicleNumber: { icon: Car, size: 15 },
}

const emptyValues = (s: ServiceDef): Record<string, string> => Object.fromEntries(s.fields.map(f => [f.key, '']))

export default function ServiceRequest() {
  const { slug } = useParams()
  const service = serviceBySlug(slug)
  if (!service) return <Navigate to="/" replace />
  // key = slug so switching between services never carries state over
  return <ServiceRequestForm key={service.slug} service={service} />
}

function ServiceRequestForm({ service }: { service: ServiceDef }) {
  const [values, setValues] = useState<Record<string, string>>(() => emptyValues(service))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [phase, setPhase] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<{ requestId: string; status: string; createdAt: string; duplicate: boolean; email: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const inFlight = useRef(false) // blocks a second submit before React re-renders the disabled button

  useEffect(() => {
    const prev = document.title
    document.title = `${service.title} — Karachi E-Challan`
    return () => { document.title = prev }
  }, [service.title])
  const succeeded = phase === 'success'
  useEffect(() => { window.scrollTo(0, 0) }, [succeeded])

  const submitting = phase === 'submitting'

  const setField = (key: FieldKey, raw: string) => {
    const v = key === 'cnic' ? formatCNIC(raw) : key === 'phone' ? formatPhone(raw) : raw
    setValues(prev => ({ ...prev, [key]: v }))
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n })
  }

  const focusFirst = (errs: Record<string, string>) => {
    const first = service.fields.find(f => errs[f.key])
    if (first) setTimeout(() => document.getElementById(`svc-${first.key}`)?.focus(), 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (inFlight.current || submitting) return
    const errs = validateServiceForm(service, values)
    if (Object.keys(errs).length) {
      setErrors(errs)
      setSubmitError('Please correct the highlighted fields.')
      setPhase('error')
      focusFirst(errs)
      return
    }
    inFlight.current = true
    setPhase('submitting')
    setSubmitError(null)
    setErrors({})
    try {
      const trimmed = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()]))
      const res = await submitServiceRequest(service.type, trimmed)
      if (!res.success) {
        const fields = res.error.fields || {}
        setErrors(fields)
        setSubmitError(res.error.message)
        setPhase('error')
        focusFirst(fields)
        return
      }
      setResult({
        requestId: res.data.requestId,
        status: res.data.status,
        createdAt: res.data.createdAt,
        duplicate: !!res.data.duplicate,
        email: trimmed.email,
      })
      setPhase('success')
    } finally {
      inFlight.current = false
    }
  }

  const copyId = async () => {
    if (!result) return
    try { await navigator.clipboard.writeText(result.requestId) } catch { /* clipboard unavailable */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const startAnother = () => {
    setValues(emptyValues(service))
    setErrors({})
    setResult(null)
    setSubmitError(null)
    setPhase('idle')
  }

  const submittedAt = result
    ? new Date(result.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div className="min-h-screen bg-[#FDFDFB] text-[#0C1E3A] selection:bg-[#0C1E3A] selection:text-white antialiased overflow-x-hidden flex flex-col">
      <style>{`
        * { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        .serif { font-family: 'Instrument Serif', Georgia, serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        input, select, textarea { font-size: 16px; }
        @media (min-width: 640px) { input, select, textarea { font-size: 14px; } }
        :focus-visible { outline: 2px solid #0C1E3A; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
      `}</style>

      <div className="w-full bg-[#0C1E3A] text-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-[36px] flex items-center justify-between text-[12px] leading-none">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/10 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> VERIFICATION BY REQUEST
            </span>
            <span className="hidden sm:inline text-white/80 truncate">Team review • Email result • No instant search</span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-white/70 font-medium shrink-0">
            <span className="inline-flex items-center gap-1.5"><Lock size={12} /> Secure & Private</span>
            <span className="w-px h-3 bg-white/15" />
            <a href="mailto:support@karachiechallan.pk" className="hover:text-white inline-flex items-center gap-1.5"><Mail size={12} /> support@karachiechallan.pk</a>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 bg-[#FDFDFB]/85 backdrop-blur-xl border-b border-[#0C1E3A]/[0.06]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-[68px] sm:h-[72px] flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 text-left shrink-0 group">
            <div className="w-[42px] h-[42px] rounded-[12px] bg-[#0C1E3A] flex items-center justify-center text-white shadow-[0_6px_18px_rgba(12,30,58,0.18)] group-hover:shadow-[0_8px_22px_rgba(12,30,58,0.22)] transition-shadow">
              <ShieldCheck size={20} strokeWidth={1.9} />
            </div>
            <div className="leading-tight">
              <div className="text-[16px] sm:text-[17px] font-[900] tracking-[-0.03em] leading-none">Karachi E-Challan</div>
              <div className="text-[10px] sm:text-[11px] font-semibold tracking-[0.12em] text-[#0F766E] uppercase">Verification Service</div>
            </div>
          </Link>
          <div className="hidden lg:flex items-center gap-2 text-[13px] font-medium text-[#5B6B85]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#0C1E3A]/10 px-3 py-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Secure form
            </span>
            <span className="hidden xl:inline">Encrypted and only used for this request</span>
          </div>
          <Link to="/" className="inline-flex items-center gap-2 bg-white border border-[#0C1E3A]/10 hover:bg-[#F8FAFC] active:scale-[0.98] rounded-full px-4 sm:px-5 h-[42px] text-[14px] font-[700] text-[#0C1E3A] shadow-sm transition">
            <ChevronLeft size={16} /> <span className="hidden sm:inline">Back to Home</span><span className="sm:hidden">Home</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 bg-[#F8FAFC] border-b border-[#0C1E3A]/5">
        {phase !== 'success' || !result ? (
          <div className="max-w-[840px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
            <div className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-[#5B6B85]">
              <Link to="/" className="hover:text-[#0C1E3A] inline-flex items-center gap-1"><ChevronLeft size={14} /> Home</Link>
              <span className="opacity-40">/</span>
              <span className="text-[#0C1E3A] font-[700]">{service.title}</span>
              <span className="ml-auto hidden sm:inline-flex items-center gap-1.5 text-[12px] bg-white border border-[#0C1E3A]/10 rounded-full px-3 py-1.5 shadow-sm">
                <Lock size={12} className="text-[#0F766E]" /> 256-bit SSL • Used only for this request
              </span>
            </div>

            <div className="mt-6 sm:mt-8">
              <h1 className="text-[28px] sm:text-[36px] font-[900] tracking-[-0.03em] leading-[0.9] text-[#0C1E3A] text-balance">
                {service.heading[0]} <span className="serif italic font-normal text-[#0F766E]">{service.heading[1]}</span>
              </h1>
              <p className="mt-2.5 text-[14px] sm:text-[15px] leading-6 text-[#4A5A78] max-w-[640px]">{service.intro} Requests are reviewed by our team — this is not an instant lookup.</p>
            </div>

            <motion.form
              onSubmit={handleSubmit}
              noValidate
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24 }}
              aria-busy={submitting}
              className="mt-7 bg-white rounded-[24px] border border-[#0C1E3A]/[0.06] shadow-[0_16px_48px_rgba(12,30,58,0.08)] overflow-hidden"
            >
              <div className="h-1.5 w-full bg-gradient-to-r from-[#0C1E3A] via-[#0F766E] to-[#0C1E3A]" />
              <div className="p-6 sm:p-8">
                <AnimatePresence>
                  {submitError && (
                    <motion.div role="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 rounded-2xl bg-[#FEF2F2] border border-red-200 px-4 py-3.5 flex gap-3 text-[13px] leading-5 text-[#7F1D1D]">
                      <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                      <div className="flex-1"><div className="font-[700]">{Object.keys(errors).length ? 'Please correct' : 'Could not submit'}</div><div>{submitError}</div></div>
                      <button type="button" onClick={() => setSubmitError(null)} aria-label="Dismiss" className="shrink-0 w-7 h-7 rounded-full bg-white border border-red-200 grid place-items-center hover:bg-red-50"><X size={14} /></button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <div className="inline-flex items-center gap-2 text-[11px] font-[800] tracking-[0.14em] text-[#0F766E]"><span className="w-6 h-px bg-[#0F766E]" /> YOUR DETAILS</div>
                  <h2 className="mt-2 text-[20px] sm:text-[22px] font-[800] tracking-[-0.02em]">{service.title}</h2>
                  <p className="mt-1 text-[13.5px] leading-6 text-[#5B6B85]">All fields are required.</p>
                </div>

                <div className="mt-4 rounded-xl bg-[#EFF6FF] border border-blue-100 px-4 py-3 flex gap-2.5 text-[12.5px] leading-5 text-[#1E3A5F]">
                  <Shield size={16} className="shrink-0 mt-0.5 text-[#0C1E3A]" />
                  <span><span className="font-[700]">Why we ask:</span> To find the right record and email you the reply. Encrypted, admin-only.</span>
                </div>

                <fieldset disabled={submitting} className="mt-7 grid sm:grid-cols-2 gap-5 min-w-0">
                  {service.fields.map((f, i) => {
                    const err = errors[f.key]
                    const deco = FIELD_ICON[f.key]
                    const fullWidth = f.key === 'fullName' || (i === service.fields.length - 1 && service.fields.length % 2 === 1)
                    return (
                      <div key={f.key} className={fullWidth ? 'sm:col-span-2' : ''}>
                        <label htmlFor={`svc-${f.key}`} className="flex items-center gap-2 text-[13px] font-[700]">{f.label} <span className="text-red-600" aria-hidden="true">*</span></label>
                        <div className="relative mt-2">
                          <input
                            id={`svc-${f.key}`}
                            name={f.key}
                            value={values[f.key]}
                            onChange={e => setField(f.key, e.target.value)}
                            placeholder={f.placeholder}
                            type={f.key === 'email' ? 'email' : 'text'}
                            inputMode={f.inputMode}
                            autoComplete={f.autoComplete}
                            required
                            aria-required="true"
                            aria-invalid={!!err}
                            aria-describedby={err ? `svc-${f.key}-err` : undefined}
                            className={`w-full h-[48px] rounded-xl border bg-white px-4 ${deco ? 'pr-10' : ''} text-[14px] outline-none placeholder:text-[#94A3B8] disabled:opacity-60 ${f.mono ? 'mono font-[600] tracking-wide placeholder:font-sans placeholder:font-[500] placeholder:tracking-normal' : 'font-[500]'} ${err ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-50' : 'border-[#0C1E3A]/15 focus:border-[#0C1E3A] focus:ring-4 focus:ring-[#0C1E3A]/10'}`}
                          />
                          {deco && <deco.icon size={deco.size} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />}
                        </div>
                        {f.hint && !err && <p className="mt-1.5 text-[11.5px] text-[#64748B]">{f.hint}</p>}
                        {err && <p id={`svc-${f.key}-err`} className="mt-1.5 text-[12.5px] font-medium text-red-600 flex items-center gap-1"><AlertCircle size={13} /> {err}</p>}
                      </div>
                    )
                  })}
                </fieldset>

                <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3 sm:justify-between sm:items-center border-t border-[#0C1E3A]/5 pt-6">
                  <Link to="/" className="h-[48px] px-6 rounded-full bg-white border border-[#0C1E3A]/10 hover:bg-[#F8FAFC] text-[14px] font-[700] text-[#0C1E3A] inline-flex items-center justify-center gap-2 active:scale-[0.98]">
                    <ChevronLeft size={16} /> Back
                  </Link>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="h-[48px] px-8 rounded-full bg-[#0C1E3A] hover:bg-[#0A1933] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[14px] font-[800] inline-flex items-center justify-center gap-2 shadow-[0_10px_24px_rgba(12,30,58,0.18)] min-w-[220px] active:scale-[0.98]"
                  >
                    {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting your request...</> : <>Submit Request <Send size={16} /></>}
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] font-medium text-[#64748B]">
                  <span className="inline-flex items-center gap-1"><Shield size={11} className="text-[#0F766E]" /> Privacy-first</span><span>•</span><span>No data published</span><span>•</span><span>Reply by email</span>
                </div>
              </div>
            </motion.form>

            <div className="mt-6 flex flex-wrap justify-center gap-2 text-[12px] font-medium">
              <span className="inline-flex items-center gap-1.5 bg-white border border-[#0C1E3A]/5 rounded-full px-3 py-1.5"><Lock size={12} className="text-[#0F766E]" /> Encrypted</span>
              <span className="inline-flex items-center gap-1.5 bg-white border border-[#0C1E3A]/5 rounded-full px-3 py-1.5"><UserCheck size={12} className="text-[#0F766E]" /> Human-reviewed</span>
              <span className="inline-flex items-center gap-1.5 bg-white border border-[#0C1E3A]/5 rounded-full px-3 py-1.5"><Mail size={12} className="text-[#0F766E]" /> Email-only</span>
            </div>
          </div>
        ) : (
          <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} role="status" className="bg-white rounded-[28px] border border-[#0C1E3A]/[0.06] shadow-[0_20px_60px_rgba(12,30,58,0.08)] overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-[#0C1E3A] via-[#0F766E] to-[#0C1E3A]" />
              <div className="p-6 sm:p-10 text-center">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }} className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border-2 border-emerald-200 grid place-items-center text-emerald-600">
                  <CheckCircle2 size={32} />
                </motion.div>
                {result.duplicate ? (
                  <div className="mt-4 mx-auto max-w-[520px] rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 flex gap-2.5 text-left text-[13px] leading-5 text-amber-900">
                    <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div><span className="font-[800]">Already received —</span> we found an open request with these details from the last 24 hours. Here is your existing <span className="mono font-[700]">{result.requestId}</span>.</div>
                  </div>
                ) : (
                  <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 text-[11px] font-[800] tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> REQUEST RECEIVED
                  </div>
                )}
                <h1 className="mt-4 text-[28px] sm:text-[32px] font-[900] tracking-[-0.03em] leading-tight text-[#0C1E3A]">{result.duplicate ? 'Request Already Exists' : 'Request Submitted'}</h1>
                <p className="mt-3 text-[14px] sm:text-[15px] leading-6 text-[#4A5A78] max-w-[560px] mx-auto text-pretty">
                  We have received your <span className="font-[700] text-[#0C1E3A]">{service.title}</span> request. Our team reviews each request, and the reply will be sent to <span className="font-[700] text-[#0C1E3A] break-all">{result.email}</span>.
                </p>

                <div className="mt-8 rounded-[20px] bg-[#0C1E3A] text-white p-5 sm:p-6 text-left relative overflow-hidden">
                  <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-white/5" />
                  <div className="flex flex-wrap items-start justify-between gap-4 relative">
                    <div>
                      <div className="text-[11px] font-[800] tracking-[0.14em] text-white/60">REQUEST ID</div>
                      <div className="mono text-[18px] sm:text-[22px] font-[800] tracking-[0.06em] mt-1 break-all">{result.requestId}</div>
                      <div className="text-[12px] text-white/70 mt-1">Keep this for reference</div>
                    </div>
                    <button type="button" onClick={copyId} className="inline-flex items-center gap-2 bg-white text-[#0C1E3A] rounded-full px-5 h-10 text-[13px] font-[800] hover:bg-[#F1F5F9] active:scale-[0.98] transition shrink-0">
                      {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}{copied ? 'Copied!' : 'Copy Request ID'}
                    </button>
                  </div>
                  <div className="mt-5 grid sm:grid-cols-3 gap-3 text-[13px]">
                    <div className="rounded-xl bg-white/10 border border-white/10 p-3"><div className="text-[11px] font-[700] tracking-wide text-white/60">SERVICE</div><div className="font-[600] mt-1">{service.title}</div></div>
                    <div className="rounded-xl bg-white/10 border border-white/10 p-3"><div className="text-[11px] font-[700] tracking-wide text-white/60">REPLY TO</div><div className="font-[600] break-all mt-1">{result.email}</div></div>
                    <div className="rounded-xl bg-white/10 border border-white/10 p-3"><div className="text-[11px] font-[700] tracking-wide text-white/60">SUBMITTED</div><div className="font-[600] mt-1">{submittedAt}</div></div>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-[#EFF6FF] border border-blue-100 p-4 text-left flex gap-3 text-[13px] leading-6 text-[#1E3A5F]">
                  <Clock3 size={18} className="shrink-0 mt-0.5 text-[#0C1E3A]" />
                  <div><span className="font-[700]">What’s next?</span> A team member reviews your request and emails the result to the address above. If you don’t see it, check your spam folder.</div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                  <Link to="/" className="h-[48px] px-8 rounded-full bg-[#0C1E3A] hover:bg-[#0A1933] text-white font-[800] inline-flex items-center justify-center gap-2 transition active:scale-[0.98]">Back to Home <ArrowUpRight size={16} /></Link>
                  <button type="button" onClick={startAnother} className="h-[48px] px-8 rounded-full bg-white border border-[#0C1E3A]/10 font-[700] inline-flex items-center justify-center gap-2 hover:bg-[#F8FAFC] active:scale-[0.98]">Submit another <RefreshCw size={16} /></button>
                </div>

                <p className="mt-6 text-[12px] leading-5 text-[#64748B]">Need help? <a href="mailto:support@karachiechallan.pk" className="underline decoration-dotted font-[600] text-[#0C1E3A] hover:text-[#0F766E]">support@karachiechallan.pk</a> with your Request ID.</p>
              </div>
            </motion.div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-[#0C1E3A]/5">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] leading-5">
          <span className="text-[#5B6B85] text-center sm:text-left">© 2026 Karachi E-Challan. All rights reserved. Not a government website.</span>
          <span className="inline-flex items-center gap-2 font-[600] text-[#0C1E3A] shrink-0"><Shield size={14} className="text-[#0F766E]" /> Secure • Verified • Transparent</span>
        </div>
      </footer>
    </div>
  )
}
