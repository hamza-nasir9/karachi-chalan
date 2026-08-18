import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, Lock, Eye, Mail, FileSearch, Clock3, BadgeCheck,
  ChevronDown, ArrowRight, ArrowUpRight, Menu, X, Car, FileText,
  MapPin, Calendar, Banknote, CheckCircle2, AlertCircle, Search,
  Fingerprint, UserCheck, Send, Sparkles, ArrowDown, Phone, MailIcon,
  Shield, Clock, ClipboardCheck, Award, EyeOff, Copy, Check, AlertTriangle,
  Info, ChevronLeft, Loader2, RefreshCw, CalendarDays
} from 'lucide-react'
import { submitVerificationRequest } from '../lib/apiClient'

// ─────────── FAQ ───────────
const FAQS = [
  { q: "Is this an instant challan search?", a: "No. This is a verification request platform. You submit your vehicle and contact details, our team manually reviews the relevant records, and we send your challan status to your email. We do not provide instant automated results." },
  { q: "What information do I need to submit?", a: "Vehicle registration number (as on number plate), your full name, mobile number, and email where you want the result. The verification form guides you step-by-step — no login is required." },
  { q: "How long does verification take?", a: "Most requests are reviewed within 24–48 working hours after submission. You receive a confirmation email with your Request ID immediately, and the final result on the same email once verified." },
  { q: "Is my data secure?", a: "Yes. Your information is transmitted over 256-bit SSL, stored securely and used only to process your verification request. We never share it with third parties and never ask for card OTPs or passwords." },
  { q: "Do you have direct government database access?", a: "We do not claim direct government database access or official affiliation. Our team checks relevant public and records-based sources and compiles a clear, human-verified response. For disputes you are guided to the official Traffic Police channel." },
  { q: "What will I receive in the email?", a: "If a challan exists: challan number, violation type, date & time, location, fine amount, due date and payment status. If no record is found you receive a clear 'No record found' confirmation for your reference." },
]

type FormData = {
  vehicleNumber: string
  vehicleType: string
  vehicleMake: string
  vehicleColor: string
  fullName: string
  cnic: string
  mobile: string
  email: string
  violationDate: string
  violationTime: string
  area: string
  challanRef: string
  notes: string
}

const VEHICLE_TYPES = ["Car", "Motorcycle", "Rickshaw", "Van / Pickup", "Bus / Truck", "Other"]
const VEHICLE_COLORS = ["White", "Black", "Silver", "Grey", "Blue", "Red", "Green", "Beige", "Other"]

const initialForm: FormData = {
  vehicleNumber: "", vehicleType: "", vehicleMake: "", vehicleColor: "",
  fullName: "", cnic: "", mobile: "", email: "",
  violationDate: "", violationTime: "", area: "", challanRef: "", notes: "",
}

const DRAFT_KEY = "ecv_form_draft_v1"

function formatCNIC(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 13)
  if (d.length <= 5) return d
  if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`
}
function formatMobile(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11)
  if (d.length <= 4) return d
  return `${d.slice(0, 4)}-${d.slice(4)}`
}
function maskCNIC(cnic: string) {
  const d = cnic.replace(/\D/g, "")
  if (d.length < 13) return cnic.replace(/./g, "•")
  return `${d.slice(0, 5)}-•••••••-${d.slice(12)}`
}
function maskMobile(m: string) {
  const d = m.replace(/\D/g, "")
  if (d.length < 11) return m.replace(/./g, "•")
  return `${d.slice(0, 4)}-•••${d.slice(7)}`
}

export default function PublicApp() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [toast, setToast] = useState<string | null>(null)
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2600) }

  // ─── Flow state ───
  const [view, setView] = useState<'home' | 'form' | 'success'>('home')
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [form, setForm] = useState<FormData>(initialForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [requestId, setRequestId] = useState("")
  const [submittedAt, setSubmittedAt] = useState("")
  const [copied, setCopied] = useState(false)
  const [showSensitive, setShowSensitive] = useState(false)
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [returnedStatus, setReturnedStatus] = useState<string>("NEW")
  const formCardRef = useRef<HTMLDivElement>(null)

  // Draft persistence — preserve entered data after errors / reloads
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object' && parsed.vehicleNumber) {
          setForm(f => ({ ...f, ...parsed }))
        }
      }
    } catch {}
  }, [])
  useEffect(() => {
    if (view !== 'form') return
    const id = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)) } catch {}
    }, 500)
    return () => clearTimeout(id)
  }, [form, view])

  const scrollTo = (id: string) => {
    if (view !== 'home') {
      setView('home')
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
      setMobileOpen(false)
      return
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setMobileOpen(false)
  }
  const openForm = () => {
    setView('form')
    setStep(1)
    setSubmitError(null)
    setErrors({})
    setIsDuplicate(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setMobileOpen(false)
  }
  const goHome = () => {
    setView('home')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  useEffect(() => { window.scrollTo(0, 0) }, [view, step])
  // focus form card when step changes (a11y + polish)
  useEffect(() => { if (view === 'form') formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, [step, view])

  const validateStep1 = (): Record<string, string> => {
    const e: Record<string, string> = {}
    const v = form.vehicleNumber.trim()
    if (!v || v.length < 3) e.vehicleNumber = "Enter registration as on documents (e.g., KHI-3921)."
    else if (!/^[A-Z0-9-\s]{3,16}$/i.test(v)) e.vehicleNumber = "Use letters, numbers and dash only."
    if (!form.vehicleType) e.vehicleType = "Please select vehicle type."
    if (form.vehicleMake && form.vehicleMake.length > 60) e.vehicleMake = "Make / model too long (max 60)."
    if (form.vehicleColor && form.vehicleColor.length > 30) e.vehicleColor = "Color too long."
    return e
  }
  const validateStep2 = (): Record<string, string> => {
    const e: Record<string, string> = {}
    const n = form.fullName.trim()
    if (!n || n.length < 3) e.fullName = "Enter full name as per CNIC."
    else if (n.length > 80) e.fullName = "Name too long (max 80)."
    else if (!/^[a-zA-Z\s'.-]+$/.test(n)) e.fullName = "Name may contain letters, spaces, apostrophes and hyphens only."
    const cnicDigits = form.cnic.replace(/\D/g, "")
    if (cnicDigits.length !== 13) e.cnic = "Enter a valid 13-digit CNIC (e.g., 42201-1234567-1)."
    const mobileDigits = form.mobile.replace(/\D/g, "")
    if (mobileDigits.length !== 11 || !mobileDigits.startsWith("03")) e.mobile = "Enter 11-digit mobile starting with 03 (e.g., 0300-1234567)."
    const email = form.email.trim().toLowerCase()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) e.email = "Enter a valid email address where we can send the result."
    return e
  }

  const handleNext = () => {
    let e: Record<string, string> = {}
    if (step === 1) e = validateStep1()
    if (step === 2) e = validateStep2()
    if (Object.keys(e).length) { setErrors(e); setSubmitError(null); return }
    setErrors({})
    setSubmitError(null)
    setStep(s => Math.min(4, s + 1) as 1 | 2 | 3 | 4)
  }
  const handleBack = () => {
    setErrors({})
    setSubmitError(null)
    if (step > 1) setStep(s => (s - 1) as 1 | 2 | 3 | 4)
    else setView('home')
  }
  const handleSubmit = async () => {
    const e1 = validateStep1()
    const e2 = validateStep2()
    const combined = { ...e1, ...e2 }
    if (Object.keys(combined).length) { setErrors(combined); setStep(Object.keys(e1).length ? 1 : 2); return }
    if (!consent) { setSubmitError("Please confirm the privacy consent checkbox to submit your request."); return }
    if (submitting) return
    setSubmitting(true)
    setSubmitError(null)

    const payload = {
      vehicleRegistrationNumber: form.vehicleNumber,
      vehicleType: form.vehicleType,
      vehicleMake: form.vehicleMake || undefined,
      vehicleColor: form.vehicleColor || undefined,
      fullName: form.fullName,
      cnic: form.cnic,
      mobile: form.mobile,
      email: form.email,
      violationDate: form.violationDate || null,
      violationTime: form.violationTime || null,
      area: form.area || null,
      challanRef: form.challanRef || null,
      notes: form.notes || null,
    }

    const result = await submitVerificationRequest(payload as any)

    if (!result.success) {
      setSubmitting(false)
      if (result.error.fields) {
        const mapped: Record<string, string> = {}
        for (const [k, v] of Object.entries(result.error.fields)) {
          const mk = k === 'vehicleRegistrationNumber' ? 'vehicleNumber' : k
          mapped[mk] = v as string
        }
        setErrors(mapped)
        const first = Object.keys(mapped)[0]
        if (first && ['vehicleNumber', 'vehicleType', 'vehicleMake', 'vehicleColor'].includes(first)) setStep(1)
        else if (['fullName', 'cnic', 'mobile', 'email'].includes(first || '')) setStep(2)
        else if (['violationDate', 'violationTime', 'area', 'challanRef', 'notes'].includes(first || '')) setStep(3)
        setSubmitError(result.error.message || "Please correct the highlighted fields.")
      } else {
        setSubmitError(result.error.message)
      }
      return
    }

    setRequestId(result.data.requestId)
    setReturnedStatus(result.data.status)
    setIsDuplicate(!!result.data.duplicate)
    try {
      setSubmittedAt(new Date(result.data.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }))
    } catch {
      setSubmittedAt(new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }))
    }
    setSubmitting(false)
    try { localStorage.removeItem(DRAFT_KEY) } catch {}
    setView('success')
  }
  const copyId = async () => {
    await navigator.clipboard.writeText(requestId)
    setCopied(true)
    showToast("Request ID copied")
    setTimeout(() => setCopied(false), 1800)
  }

  const progressSteps = [
    { n: 1, label: "Vehicle", sub: "Registration" },
    { n: 2, label: "Personal", sub: "Information" },
    { n: 3, label: "Additional", sub: "Information" },
    { n: 4, label: "Review", sub: "& Submit" },
  ]

  return (
    <div className="min-h-screen bg-[#FDFDFB] text-[#0C1E3A] selection:bg-[#0C1E3A] selection:text-white antialiased overflow-x-hidden">
      <style>{`
        * { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        .serif { font-family: 'Instrument Serif', Georgia, serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        html { scroll-behavior: smooth; }
        input, select, textarea { font-size: 16px; }
        @media (min-width: 640px) { input, select, textarea { font-size: 14px; } }
        :focus-visible { outline: 2px solid #0C1E3A; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
      `}</style>

      {/* Top micro bar */}
      <div className="w-full bg-[#0C1E3A] text-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-[36px] flex items-center justify-between text-[12px] leading-none">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/10 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> VERIFICATION BY REQUEST
            </span>
            <span className="hidden sm:inline text-white/80 truncate">Manual review • Email result • No instant search</span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-white/70 font-medium shrink-0">
            <span className="inline-flex items-center gap-1.5"><Lock size={12} /> Secure & Private</span>
            <span className="w-px h-3 bg-white/15" />
            <a href="mailto:support@karachiechallan.pk" className="hover:text-white inline-flex items-center gap-1.5 focus-visible:rounded-lg"><MailIcon size={12} /> support@karachiechallan.pk</a>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#FDFDFB]/85 backdrop-blur-xl border-b border-[#0C1E3A]/[0.06]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-[68px] sm:h-[72px] flex items-center justify-between gap-4">
          <button onClick={goHome} className="flex items-center gap-3 text-left shrink-0 group">
            <div className="w-[42px] h-[42px] rounded-[12px] bg-[#0C1E3A] flex items-center justify-center text-white shadow-[0_6px_18px_rgba(12,30,58,0.18)] group-hover:shadow-[0_8px_22px_rgba(12,30,58,0.22)] transition-shadow">
              <ShieldCheck size={20} strokeWidth={1.9} />
            </div>
            <div className="leading-tight">
              <div className="text-[16px] sm:text-[17px] font-[900] tracking-[-0.03em] leading-none">Karachi E-Challan</div>
              <div className="text-[10px] sm:text-[11px] font-semibold tracking-[0.12em] text-[#0F766E] uppercase">Verification Service</div>
            </div>
          </button>

          {view === 'home' ? (
            <nav className="hidden lg:flex items-center gap-1 text-[14px] font-[550] text-[#24344F]">
              <button onClick={() => scrollTo('home')} className="px-3.5 py-2 rounded-full hover:bg-[#0C1E3A]/[0.06] hover:text-[#0C1E3A] transition focus-visible:bg-[#0C1E3A]/[0.06]">Home</button>
              <button onClick={() => scrollTo('how')} className="px-3.5 py-2 rounded-full hover:bg-[#0C1E3A]/[0.06] hover:text-[#0C1E3A] transition">How It Works</button>
              <button onClick={() => scrollTo('info')} className="px-3.5 py-2 rounded-full hover:bg-[#0C1E3A]/[0.06] hover:text-[#0C1E3A] transition">E-Challan Information</button>
              <button onClick={() => scrollTo('faq')} className="px-3.5 py-2 rounded-full hover:bg-[#0C1E3A]/[0.06] hover:text-[#0C1E3A] transition">FAQs</button>
              <button onClick={() => scrollTo('contact')} className="px-3.5 py-2 rounded-full hover:bg-[#0C1E3A]/[0.06] hover:text-[#0C1E3A] transition">Contact</button>
            </nav>
          ) : (
            <div className="hidden lg:flex items-center gap-2 text-[13px] font-medium text-[#5B6B85]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#0C1E3A]/10 px-3 py-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Secure form
              </span>
              <span className="hidden xl:inline">Encrypted and only used for verification</span>
            </div>
          )}

          <div className="flex items-center gap-2.5">
            {view === 'home' ? (
              <button onClick={openForm} className="hidden sm:inline-flex items-center gap-2 bg-[#0C1E3A] hover:bg-[#0A1933] active:scale-[0.98] text-white rounded-full px-6 h-[42px] text-[14px] font-[700] tracking-[-0.01em] shadow-[0_10px_24px_rgba(12,30,58,0.18)] transition">
                Request Verification <ArrowUpRight size={16} className="opacity-90" />
              </button>
            ) : view === 'form' ? (
              <button onClick={goHome} className="hidden sm:inline-flex items-center gap-2 bg-white border border-[#0C1E3A]/10 hover:bg-[#F8FAFC] active:scale-[0.98] rounded-full px-5 h-[42px] text-[14px] font-[700] text-[#0C1E3A] shadow-sm transition">
                <ChevronLeft size={16} /> Back to Home
              </button>
            ) : (
              <button onClick={goHome} className="hidden sm:inline-flex items-center gap-2 bg-[#0C1E3A] hover:bg-[#0A1933] text-white rounded-full px-6 h-[42px] text-[14px] font-[700] shadow transition">
                Back to Home <ArrowUpRight size={16} />
              </button>
            )}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden w-10 h-10 rounded-full bg-white border border-[#0C1E3A]/10 shadow-sm flex items-center justify-center text-[#0C1E3A] hover:bg-[#F8FAFC] active:scale-[0.96] transition" aria-label="Menu" aria-expanded={mobileOpen}>
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="lg:hidden border-t border-[#0C1E3A]/5 bg-white overflow-hidden">
              <div className="px-4 py-5 flex flex-col gap-1">
                {view === 'home' ? (
                  <>
                    {[
                      { label: 'Home', id: 'home' }, { label: 'How It Works', id: 'how' },
                      { label: 'E-Challan Information', id: 'info' }, { label: 'FAQs', id: 'faq' }, { label: 'Contact', id: 'contact' },
                    ].map(item => (
                      <button key={item.id} onClick={() => scrollTo(item.id)} className="text-left px-4 py-3.5 rounded-2xl hover:bg-[#F8FAFC] text-[15px] font-[600] text-[#0C1E3A] flex items-center justify-between active:bg-[#F1F5F9]">
                        {item.label} <ArrowRight size={16} className="opacity-40" />
                      </button>
                    ))}
                    <button onClick={openForm} className="mt-3 w-full h-[48px] rounded-full bg-[#0C1E3A] text-white font-[700] flex items-center justify-center gap-2 shadow active:scale-[0.98]">Request Verification <ArrowUpRight size={16} /></button>
                  </>
                ) : (
                  <>
                    <button onClick={goHome} className="w-full text-left px-4 py-3.5 rounded-2xl bg-[#F8FAFC] text-[15px] font-[600] flex items-center gap-2"><ChevronLeft size={16} /> Back to Home</button>
                    <div className="px-1 py-3 text-[13px] leading-5 text-[#5B6B85]">You’re in the verification request flow. Your progress is saved — continue or return home.</div>
                    {view === 'form' && <button onClick={() => setMobileOpen(false)} className="w-full h-[44px] rounded-full bg-[#0C1E3A] text-white font-[700]">Continue Form</button>}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* HOME */}
      {view === 'home' && (
        <>
          <section id="home" className="relative overflow-hidden">
            <div className="absolute inset-0 -z-10">
              <div className="absolute inset-0 bg-[#FDFDFB]" />
              <div className="absolute inset-0 opacity-[0.045]" style={{ backgroundImage: `radial-gradient(#0C1E3A 0.9px, transparent 0.9px)`, backgroundSize: '18px 18px' }} />
              <div className="absolute top-[-140px] right-[-120px] w-[680px] h-[680px] rounded-full bg-[#E6FFFB] blur-[70px] opacity-60 will-change-transform" />
              <div className="absolute bottom-[-120px] left-[-80px] w-[520px] h-[520px] rounded-full bg-[#EFF6FF] blur-[70px] opacity-60 will-change-transform" />
            </div>

            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-8 sm:pt-14 lg:pt-[56px] pb-10 sm:pb-16">
              <div className="grid lg:grid-cols-[1.02fr_0.98fr] gap-8 lg:gap-8 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white border border-[#0C1E3A]/[0.07] shadow-[0_4px_16px_rgba(12,30,58,0.06)] p-1 pr-2 text-[12.5px] font-medium max-w-full">
                    <span className="inline-flex items-center gap-1.5 bg-[#0C1E3A] text-white rounded-full px-3 py-1.5 text-[11px] font-[800] tracking-[0.08em] shrink-0">
                      <Sparkles size={12} /> VERIFICATION BY REQUEST
                    </span>
                    <span className="hidden sm:inline text-[#2E4160] pr-1 truncate">Manual verification • Email delivery</span>
                    <span className="w-7 h-7 rounded-full bg-[#0F766E] text-white grid place-items-center ml-1 shrink-0"><ArrowRight size={14} /></span>
                  </div>

                  <h1 className="mt-6 sm:mt-7 text-[34px] sm:text-[54px] lg:text-[60px] font-[900] leading-[0.88] tracking-[-0.04em] text-[#0C1E3A] text-balance">
                    Need to Check<br />Your Karachi<br /><span className="serif font-normal italic text-[#0F766E] tracking-[-0.02em]">E-Challan?</span>
                  </h1>

                  <p className="mt-4 sm:mt-5 text-[16px] sm:text-[18px] leading-[1.6] text-[#3A4A65] max-w-[560px] font-[450] text-pretty">
                    Submit your vehicle and verification details. Our team will review the relevant records and send your challan status directly to your email.
                  </p>

                  <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3">
                    <button onClick={openForm} className="inline-flex items-center justify-center gap-2 bg-[#0C1E3A] hover:bg-[#09162E] active:scale-[0.98] text-white rounded-full px-7 h-[52px] text-[15px] font-[700] shadow-[0_12px_28px_rgba(12,30,58,0.20)] transition">
                      Request Challan Verification <ArrowUpRight size={18} className="opacity-90" />
                    </button>
                    <button onClick={() => scrollTo('how')} className="inline-flex items-center justify-center gap-2 bg-white hover:bg-[#F8FAFC] border border-[#0C1E3A]/10 rounded-full px-7 h-[52px] text-[15px] font-[700] text-[#0C1E3A] shadow-sm transition active:scale-[0.98]">
                      <Eye size={16} className="text-[#5B6B85]" /> How It Works
                    </button>
                  </div>

                  <div className="mt-6 sm:mt-8 flex flex-wrap gap-2.5">
                    {[
                      { icon: Lock, label: "Private by design" },
                      { icon: UserCheck, label: "Human-verified" },
                      { icon: Mail, label: "Result via email" },
                    ].map(item => (
                      <span key={item.label} className="inline-flex items-center gap-1.5 bg-white border border-[#0C1E3A]/5 rounded-full px-3.5 py-2 shadow-sm text-[12.5px] font-medium">
                        <item.icon size={14} className="text-[#0F766E]" /> {item.label}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 sm:mt-5 flex flex-wrap items-center gap-3 text-[12.5px] font-medium text-[#64748B]">
                    <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> 24–48h processing</span>
                    <span className="hidden sm:inline w-px h-3 bg-[#0C1E3A]/10" />
                    <span className="hidden sm:inline">No instant search • No gov affiliation implied</span>
                  </div>
                </div>

                {/* Visual card */}
                <div className="relative lg:pl-4 flex justify-center lg:justify-end">
                  <div className="absolute inset-0 -z-10 hidden sm:block">
                    <div className="absolute top-8 right-6 w-[420px] h-[420px] bg-white rounded-[32px] border border-[#0C1E3A]/5 shadow-[0_24px_64px_rgba(12,30,58,0.08)]" />
                  </div>
                  <div className="relative w-full max-w-[440px]">
                    <div className="relative bg-white rounded-[22px] sm:rounded-[26px] border border-[#0C1E3A]/[0.07] shadow-[0_20px_60px_rgba(12,30,58,0.12)] overflow-hidden">
                      <div className="h-[56px] px-5 sm:px-6 flex items-center justify-between border-b border-[#0C1E3A]/[0.06] bg-[#F8FAFC]/60">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#0C1E3A] text-white grid place-items-center"><ClipboardCheck size={18} /></div>
                          <div className="leading-tight">
                            <div className="text-[13px] font-[800] tracking-[-0.01em]">Verification Request</div>
                            <div className="text-[11px] font-semibold tracking-[0.08em] text-[#0F766E]">SECURE SUBMISSION</div>
                          </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[11px] font-[700] tracking-widest text-[#0F766E]">ENCRYPTED</span>
                        </div>
                      </div>

                      <div className="p-5 sm:p-6">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-[11px] font-[800] tracking-[0.14em] text-[#5B6B85]">REQUEST ID</div>
                            <div className="mono text-[14px] font-[700] tracking-[0.04em] text-[#0C1E3A] mt-1">ECV-2026-001245</div>
                          </div>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 text-[11px] font-[800] tracking-[0.06em]">
                            <Clock size={12} /> IN REVIEW
                          </span>
                        </div>

                        <div className="mt-5 rounded-2xl border border-[#0C1E3A]/[0.07] bg-[#FDFDFB] p-4 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-[11px] font-[700] tracking-[0.12em] text-[#5B6B85]">VEHICLE INFORMATION</div>
                            <div className="mt-2">
                              <span className="inline-flex items-center gap-2 bg-[#FEFCE8] border-[1.6px] border-[#0C1E3A] rounded-[10px] px-3 py-1.5 shadow-sm">
                                <span className="w-6 h-4 rounded-[2px] bg-[#0F7A3A] border border-black/15 shrink-0" />
                                <span className="mono text-[16px] font-[900] tracking-[0.06em] leading-none">KHI • 3921</span>
                                <span className="text-[9px] font-[800] bg-[#0C1E3A] text-white px-1 py-0.5 rounded">SINDH</span>
                              </span>
                            </div>
                            <div className="mt-2 text-[12.5px] font-medium text-[#2E4160] flex items-center gap-1.5"><Car size={13} className="text-[#0F766E] shrink-0" /> Toyota Corolla • White</div>
                          </div>
                          <div className="hidden sm:grid place-items-center w-14 h-14 rounded-2xl bg-[#0C1E3A] text-white shadow-[0_8px_20px_rgba(12,30,58,0.18)] shrink-0"><Car size={22} /></div>
                        </div>

                        <div className="mt-5 grid grid-cols-4 gap-2">
                          {[
                            { label: 'Submitted', status: 'done' }, { label: 'In Review', status: 'active' },
                            { label: 'Verified', status: 'pending' }, { label: 'Emailed', status: 'pending' },
                          ].map((s, idx) => (
                            <div key={s.label} className="text-center">
                              <div className={`w-9 h-9 mx-auto rounded-full grid place-items-center text-[11px] font-[800] border-2 ${s.status === 'done' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : s.status === 'active' ? 'bg-[#0C1E3A] border-[#0C1E3A] text-white shadow-[0_6px_14px_rgba(12,30,58,0.18)]' : 'bg-white border-[#0C1E3A]/10 text-[#94A3B8]'}`}>
                                {s.status === 'done' ? <CheckCircle2 size={16} /> : idx + 1}
                              </div>
                              <div className={`mt-1.5 text-[11px] font-[700] leading-none ${s.status === 'active' ? 'text-[#0C1E3A]' : 'text-[#64748B]'}`}>{s.label}</div>
                              <div className={`mt-1 h-1 rounded-full ${s.status === 'done' ? 'bg-emerald-500' : s.status === 'active' ? 'bg-[#0C1E3A]' : 'bg-[#E2E8F0]'}`} />
                            </div>
                          ))}
                        </div>

                        <div className="mt-5 rounded-2xl bg-[#0C1E3A] text-white p-4 flex items-center justify-between gap-4 relative overflow-hidden">
                          <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-white/5" />
                          <div className="relative">
                            <div className="text-[11px] font-[700] tracking-[0.12em] text-white/60">CHALLAN STATUS</div>
                            <div className="text-[14px] font-[800] mt-1 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> Awaiting Verification</div>
                            <div className="text-[12px] text-white/70 mt-1">Result will be sent to your email</div>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10 grid place-items-center shrink-0 relative"><Mail size={18} /></div>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-2 text-[11px] font-medium text-[#5B6B85]">
                          <span className="inline-flex items-center gap-1.5"><Shield size={13} className="text-[#0F766E]" /> 256-bit SSL</span>
                          <span className="mono text-[11px]">ID: 001245 • Demo</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-gradient-to-r from-[#0C1E3A] via-[#0F766E] to-[#0C1E3A]" />
                    </div>

                    <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35, duration: 0.5 }} className="hidden sm:flex absolute -left-4 top-[52%] items-center gap-3 bg-[#0C1E3A] text-white rounded-2xl px-4 py-3 shadow-[0_16px_40px_rgba(12,30,58,0.20)] border border-white/10">
                      <div className="w-10 h-10 rounded-full bg-white/10 grid place-items-center"><Fingerprint size={18} /></div>
                      <div className="pr-1">
                        <div className="text-[12px] font-[800] leading-none">Manual Verification</div>
                        <div className="text-[11px] text-white/70">Human-reviewed records</div>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-emerald-500 grid place-items-center"><CheckCircle2 size={14} className="text-white" /></div>
                    </motion.div>

                    <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.55, duration: 0.5 }} className="hidden sm:flex absolute -right-3 -top-3 items-center gap-2.5 bg-white rounded-2xl px-3.5 py-2.5 shadow-[0_16px_40px_rgba(12,30,58,0.12)] border border-[#0C1E3A]/5 rotate-[0.6deg]">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#0F766E] grid place-items-center border border-emerald-100"><Lock size={14} /></div>
                      <div>
                        <div className="text-[12px] font-[800] leading-none">Secure Information</div>
                        <div className="text-[11px] text-[#5B6B85]">Encrypted submission</div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>

              <div className="mt-8 sm:mt-12 grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { k: "24–48h", v: "Avg. verification time" }, { k: "100%", v: "Human-reviewed" },
                  { k: "SSL", v: "256-bit encrypted" }, { k: "Email", v: "Result delivery" },
                ].map(s => (
                  <div key={s.k} className="rounded-2xl bg-white border border-[#0C1E3A]/5 px-4 py-4 flex items-center gap-3 shadow-sm hover:shadow-[0_8px_20px_rgba(12,30,58,0.06)] transition-shadow">
                    <div className="w-10 h-10 rounded-full bg-[#F1F5F9] grid place-items-center text-[#0C1E3A] font-[800] text-[12px] border border-[#0C1E3A]/5 shrink-0">{s.k}</div>
                    <div className="text-[13px] font-[600] leading-tight text-[#0C1E3A]">{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* TRUST */}
          <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-10 sm:pb-14">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {[
                { icon: Lock, title: "Secure Information", desc: "256-bit SSL and encrypted storage. Only our verification team can access your request.", accent: "bg-[#0C1E3A]" },
                { icon: UserCheck, title: "Manual Verification", desc: "Every submission is checked by a person — not a bot. Responsible and accurate.", accent: "bg-[#0F2942]" },
                { icon: Eye, title: "Clear Process", desc: "Transparent four-step flow. You always know what stage your request is in.", accent: "bg-[#12314E]" },
                { icon: Mail, title: "Email Result", desc: "Final status delivered to your inbox. No need to keep refreshing.", accent: "bg-[#0F766E]" },
              ].map(card => (
                <div key={card.title} className="group bg-white rounded-[22px] border border-[#0C1E3A]/[0.06] p-6 shadow-[0_8px_28px_rgba(12,30,58,0.06)] hover:shadow-[0_16px_40px_rgba(12,30,58,0.10)] hover:-translate-y-0.5 transition-all">
                  <div className={`w-12 h-12 rounded-2xl ${card.accent} text-white grid place-items-center shadow-[0_8px_18px_rgba(12,30,58,0.12)]`}>
                    <card.icon size={20} />
                  </div>
                  <h3 className="mt-5 text-[16px] font-[800] tracking-[-0.02em]">{card.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-6 text-[#4A5A78]">{card.desc}</p>
                  <div className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-[700] tracking-wide text-[#0F766E]"><CheckCircle2 size={14} /> Trusted process</div>
                </div>
              ))}
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section id="how" className="bg-white border-y border-[#0C1E3A]/5">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-14 sm:py-20">
              <div className="max-w-[720px] mx-auto text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#EFF6FF] border border-[#0C1E3A]/5 px-3 py-1.5 text-[11px] font-[800] tracking-[0.14em] text-[#0C1E3A]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" /> HOW IT WORKS
                </div>
                <h2 className="mt-4 text-[30px] sm:text-[44px] font-[900] tracking-[-0.04em] leading-[0.92] text-balance">
                  A simple, <span className="serif italic font-normal text-[#0F766E]">transparent</span> process
                </h2>
                <p className="mt-3 text-[15px] sm:text-[16px] leading-6 text-[#4A5A78] text-pretty">You request — we verify — you get the answer by email. No instant-search promises.</p>
              </div>

              <div className="mt-10 sm:mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 relative">
                <div className="hidden lg:block absolute top-[32px] left-[12%] right-[12%] h-px border-t-2 border-dashed border-[#0C1E3A]/15" />
                {[
                  { n: "01", title: "Submit Your Details", desc: "Fill the request with your vehicle number, name and email for the result.", icon: FileSearch },
                  { n: "02", title: "We Review Your Request", desc: "Our team checks relevant records and validates the information.", icon: Clock3 },
                  { n: "03", title: "Your Request Is Verified", desc: "We confirm validity and compile a clear challan status.", icon: BadgeCheck },
                  { n: "04", title: "Receive Your Result", desc: "Challan status is sent directly to your email.", icon: Send },
                ].map((step) => (
                  <div key={step.n} className="relative bg-[#FDFDFB] rounded-[22px] border border-[#0C1E3A]/[0.06] p-6 sm:p-7 text-center shadow-sm hover:shadow-[0_10px_24px_rgba(12,30,58,0.06)] transition-shadow">
                    <div className="w-16 h-16 mx-auto rounded-full bg-[#0C1E3A] text-white grid place-items-center shadow-[0_12px_28px_rgba(12,30,58,0.18)] relative">
                      <step.icon size={22} />
                      <span className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-[#0F766E] text-white grid place-items-center text-[11px] font-[800] border-2 border-white shadow-sm">{step.n}</span>
                    </div>
                    <h3 className="mt-5 text-[16px] font-[800] tracking-[-0.01em]">{step.title}</h3>
                    <p className="mt-2 text-[13.5px] leading-6 text-[#4A5A78]">{step.desc}</p>
                    <div className="mt-4 w-full h-px bg-[#0C1E3A]/5" />
                    <div className="mt-3 text-[11px] font-[700] tracking-[0.1em] text-[#0F766E]">STEP {step.n}</div>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex justify-center">
                <button onClick={openForm} className="inline-flex items-center gap-2 bg-white border border-[#0C1E3A]/10 hover:border-[#0C1E3A]/20 rounded-full px-2 py-1.5 pr-1 text-[14px] font-[600] shadow-sm hover:shadow transition active:scale-[0.98]">
                  <span className="px-4">Ready to start?</span>
                  <span className="inline-flex items-center gap-1.5 bg-[#0C1E3A] text-white rounded-full px-4 h-8 font-[700]">Request Verification <ArrowRight size={14} /></span>
                </button>
              </div>
            </div>
          </section>

          {/* INFO */}
          <section id="info" className="max-w-[1200px] mx-auto px-4 sm:px-6 py-14 sm:py-20">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-12 items-start">
              <div>
                <div className="inline-flex items-center gap-2 text-[11px] font-[800] tracking-[0.14em] text-[#0F766E]"><span className="w-7 h-px bg-[#0F766E]" /> E-CHALLAN INFORMATION</div>
                <h2 className="mt-3 text-[30px] sm:text-[40px] font-[900] tracking-[-0.04em] leading-[0.92] text-balance">What you may receive<br /><span className="serif italic font-normal text-[#5B6B85]">after verification</span></h2>
                <p className="mt-4 text-[15px] leading-7 text-[#4A5A78] max-w-[560px] text-pretty">After verification we email a clear summary. Details depend on whether a challan exists at review time.</p>

                <div className="mt-7 grid gap-3">
                  {[
                    "If a record is found, your email includes challan details in a simple, readable format.",
                    "If no record is found, you receive a clear confirmation — useful for your records.",
                    "We never display results instantly on the website. Results are email-only.",
                  ].map(t => (
                    <div key={t} className="flex gap-3 rounded-2xl bg-white border border-[#0C1E3A]/5 p-4 shadow-sm">
                      <CheckCircle2 size={18} className="text-[#0F766E] shrink-0 mt-0.5" />
                      <span className="text-[14px] leading-6 text-[#2E4160] font-[500]">{t}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl bg-[#FEF2F2] border border-red-200 p-4 flex gap-3 text-[13px] leading-6">
                  <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                  <div className="text-[#7F1D1D]"><span className="font-[800]">Disclaimer:</span> We do not claim government database access or affiliation. We verify via available records and provide a human-checked summary.</div>
                </div>
              </div>

              <div className="lg:sticky lg:top-[88px]">
                <div className="bg-white rounded-[26px] border border-[#0C1E3A]/[0.07] shadow-[0_16px_48px_rgba(12,30,58,0.08)] overflow-hidden">
                  <div className="px-6 sm:px-7 h-[64px] flex items-center justify-between border-b border-[#0C1E3A]/5 bg-[#0C1E3A] text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 grid place-items-center"><FileText size={16} /></div>
                      <div>
                        <div className="text-[13px] font-[800] tracking-[-0.01em]">Your Email Will Include</div>
                        <div className="text-[11px] font-medium opacity-70">When available</div>
                      </div>
                    </div>
                    <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] font-[700] tracking-wide"><Mail size={12} /> VIA EMAIL ONLY</span>
                  </div>
                  <div className="p-5 sm:p-6 grid gap-3">
                    {[
                      { icon: Search, label: "Challan number", desc: "Unique identifier if recorded" },
                      { icon: AlertCircle, label: "Violation", desc: "Type (signal, speeding, etc.)" },
                      { icon: Calendar, label: "Date / time", desc: "When violation was recorded" },
                      { icon: MapPin, label: "Location", desc: "Camera or area" },
                      { icon: Banknote, label: "Fine amount", desc: "Payable fine" },
                      { icon: Clock, label: "Due date", desc: "Last date before late fee" },
                      { icon: Award, label: "Payment status", desc: "Paid / unpaid if available" },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-4 rounded-2xl border border-[#0C1E3A]/5 bg-[#FDFDFB] px-4 py-3.5 hover:border-[#0C1E3A]/10 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-[#0C1E3A] text-white grid place-items-center shrink-0 shadow-sm"><item.icon size={16} /></div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[14px] font-[700] leading-none text-[#0C1E3A]">{item.label}</div>
                          <div className="text-[12.5px] text-[#5B6B85] leading-tight mt-1">{item.desc}</div>
                        </div>
                        <CheckCircle2 size={16} className="text-[#0F766E] shrink-0" />
                      </div>
                    ))}
                  </div>
                  <div className="mx-5 sm:mx-6 mb-6 rounded-xl bg-[#0F766E]/5 border border-[#0F766E]/15 px-4 py-3 flex items-center gap-3 text-[13px] font-medium text-[#0F3A35]">
                    <div className="w-8 h-8 rounded-full bg-[#0F766E] text-white grid place-items-center shrink-0"><Mail size={14} /></div>
                    Delivered to your email — no instant lookup
                  </div>
                </div>
                <div className="mt-3 text-center text-[11px] font-medium tracking-wide text-[#64748B]">Example preview • Email formatting may vary</div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="bg-white border-y border-[#0C1E3A]/5">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-14 sm:py-20">
              <div className="grid lg:grid-cols-[420px_1fr] gap-8 lg:gap-10 items-start">
                <div className="lg:sticky lg:top-[88px]">
                  <div className="inline-flex items-center gap-2 text-[11px] font-[800] tracking-[0.14em] text-[#0F766E]"><span className="w-7 h-px bg-[#0F766E]" /> FAQS</div>
                  <h2 className="mt-3 text-[30px] sm:text-[40px] font-[900] tracking-[-0.04em] leading-[0.92]">Common<br /><span className="serif italic font-normal text-[#5B6B85]">questions</span></h2>
                  <p className="mt-3 text-[15px] leading-6 text-[#4A5A78]">How verification, privacy and timelines work.</p>
                  <div className="mt-7 rounded-[22px] bg-[#0C1E3A] text-white p-6 flex gap-4 relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-28 h-28 rounded-full bg-white/5" />
                    <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 grid place-items-center shrink-0"><Phone size={18} /></div>
                    <div className="relative">
                      <div className="text-[14px] font-[800]">Still need help?</div>
                      <div className="text-[13px] leading-5 opacity-80 mt-1">We reply by email within one working day.</div>
                      <button onClick={() => scrollTo('contact')} className="mt-4 h-9 px-4 rounded-full bg-white text-[#0C1E3A] text-[13px] font-[800] inline-flex items-center gap-1.5 hover:bg-[#F1F5F9] transition">Contact <ArrowRight size={14} /></button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3">
                  {FAQS.map((f, i) => (
                    <div key={i} className={`rounded-[18px] border overflow-hidden transition ${openFaq === i ? 'border-[#0C1E3A]/15 shadow-[0_8px_24px_rgba(12,30,58,0.07)] bg-white' : 'border-[#0C1E3A]/5 bg-[#FDFDFB]'}`}>
                      <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full text-left px-5 sm:px-6 py-5 flex items-center justify-between gap-4 group" aria-expanded={openFaq === i}>
                        <span className="text-[15px] sm:text-[15.5px] font-[700] leading-6 tracking-[-0.01em] group-hover:text-[#0C1E3A]">{f.q}</span>
                        <span className={`w-9 h-9 rounded-full grid place-items-center shrink-0 border-2 transition ${openFaq === i ? 'bg-[#0C1E3A] border-[#0C1E3A] text-white rotate-180' : 'bg-white border-[#0C1E3A]/10 text-[#5B6B85] group-hover:border-[#0C1E3A]/15'}`}>
                          <ChevronDown size={16} />
                        </span>
                      </button>
                      <AnimatePresence>
                        {openFaq === i && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                            <div className="px-5 sm:px-6 pb-6 -mt-1 text-[14px] leading-7 text-[#4A5A78] border-t border-[#0C1E3A]/5 pt-4 mx-5 sm:mx-6">{f.a}</div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* FINAL CTA */}
          <section id="contact" className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 sm:py-14">
            <div className="relative overflow-hidden rounded-[28px] bg-[#0C1E3A] text-white p-6 sm:p-10 lg:p-14">
              <div className="absolute -right-20 -top-20 w-[420px] h-[420px] rounded-full bg-[#0F766E]/20 blur-[50px]" />
              <div className="absolute -left-20 -bottom-20 w-[360px] h-[360px] rounded-full bg-white/5 blur-[60px]" />
              <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: `radial-gradient(white 0.9px, transparent 0.9px)`, backgroundSize: '16px 16px' }} />

              <div className="relative grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-3 py-1.5 text-[11px] font-[700] tracking-[0.08em]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> READY WHEN YOU ARE
                  </div>
                  <h2 className="mt-4 text-[30px] sm:text-[44px] font-[900] tracking-[-0.04em] leading-[0.92] text-balance">Ready to Check Your<br /><span className="serif italic font-normal text-[#7EE8DC]">E-Challan?</span></h2>
                  <p className="mt-3 text-[15px] sm:text-[16px] leading-7 text-white/80 max-w-[520px] text-pretty">Submit a verification request and get a human-verified result directly by email. No instant-search gimmicks.</p>
                  <div className="mt-7 flex flex-col sm:flex-row gap-3">
                    <button onClick={openForm} className="inline-flex items-center justify-center gap-2 bg-white text-[#0C1E3A] rounded-full px-7 h-[52px] text-[15px] font-[800] shadow-[0_10px_24px_rgba(0,0,0,0.18)] hover:bg-[#F8FAFC] transition active:scale-[0.98]">
                      Request Challan Verification <ArrowUpRight size={18} />
                    </button>
                    <button onClick={() => scrollTo('how')} className="inline-flex items-center justify-center gap-2 bg-transparent border border-white/20 hover:bg-white/10 text-white rounded-full px-7 h-[52px] text-[15px] font-[700] transition active:scale-[0.98]">
                      See how it works <ArrowDown size={16} />
                    </button>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2 text-[12px] font-medium">
                    <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/10 rounded-full px-3 py-1.5"><Lock size={12} /> Secure</span>
                    <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/10 rounded-full px-3 py-1.5"><Mail size={12} /> Email-only</span>
                    <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/10 rounded-full px-3 py-1.5"><Clock3 size={12} /> 24–48h</span>
                  </div>
                </div>

                <div className="lg:pl-6">
                  <div className="bg-white rounded-[22px] p-6 sm:p-7 text-[#0C1E3A] shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0C1E3A] text-white grid place-items-center shrink-0"><ShieldCheck size={18} /></div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-[800] leading-none">What happens after you request?</div>
                        <div className="text-[12px] text-[#5B6B85]">Transparent email workflow</div>
                      </div>
                      <span className="ml-auto hidden sm:inline-flex text-[11px] font-[800] tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full shrink-0">EMAIL</span>
                    </div>
                    <div className="mt-5 grid gap-3">
                      {[
                        { t: "Confirmation email instantly", d: "With your Request ID" },
                        { t: "Manual verification (24–48h)", d: "Team reviews your details" },
                        { t: "Result by email", d: "Clear challan status or 'no record'" },
                      ].map(item => (
                        <div key={item.t} className="flex items-center gap-3 rounded-2xl bg-[#F8FAFC] border border-[#0C1E3A]/5 px-4 py-3">
                          <CheckCircle2 size={18} className="text-[#0F766E] shrink-0" />
                          <div><div className="text-[13px] font-[700] leading-none">{item.t}</div><div className="text-[12px] text-[#5B6B85]">{item.d}</div></div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 rounded-xl bg-[#0C1E3A] text-white px-4 py-3 flex items-center justify-between gap-2 text-[12px] font-medium">
                      <span className="inline-flex items-center gap-2 truncate"><Mail size={14} className="shrink-0" /> support@karachiechallan.pk</span>
                      <span className="opacity-70 hidden sm:inline shrink-0">Manual • Secure</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* FORM VIEW */}
      {view === 'form' && (
        <div className="min-h-[calc(100vh-108px)] bg-[#F8FAFC] border-b border-[#0C1E3A]/5">
          <div className="max-w-[840px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
            <div className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-[#5B6B85]">
              <button onClick={goHome} className="hover:text-[#0C1E3A] inline-flex items-center gap-1"><ChevronLeft size={14} /> Home</button>
              <span className="opacity-40">/</span>
              <span className="text-[#0C1E3A] font-[700]">Request Verification</span>
              <span className="ml-auto hidden sm:inline-flex items-center gap-1.5 text-[12px] bg-white border border-[#0C1E3A]/10 rounded-full px-3 py-1.5 shadow-sm">
                <Lock size={12} className="text-[#0F766E]" /> 256-bit SSL • Used only for verification
              </span>
            </div>

            <div className="mt-6 sm:mt-8">
              <h1 className="text-[28px] sm:text-[36px] font-[900] tracking-[-0.03em] leading-[0.9] text-[#0C1E3A] text-balance">
                Request Challan <span className="serif italic font-normal text-[#0F766E]">Verification</span>
              </h1>
              <p className="mt-2.5 text-[14px] sm:text-[15px] leading-6 text-[#4A5A78] max-w-[640px]">Fill step by step. Our team manually reviews and emails the result — no instant lookup.</p>
            </div>

            <div className="mt-7 bg-white rounded-[20px] border border-[#0C1E3A]/[0.06] shadow-[0_8px_24px_rgba(12,30,58,0.05)] p-4 sm:p-5">
              <div className="hidden sm:flex items-center justify-between gap-2">
                {progressSteps.map((s, idx) => {
                  const isActive = step === s.n
                  const isDone = step > s.n
                  return (
                    <div key={s.n} className="flex items-center gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-full grid place-items-center text-[13px] font-[800] border-2 shrink-0 transition ${isDone ? 'bg-[#0F766E] border-[#0F766E] text-white' : isActive ? 'bg-[#0C1E3A] border-[#0C1E3A] text-white shadow-[0_6px_16px_rgba(12,30,58,0.18)]' : 'bg-white border-[#0C1E3A]/15 text-[#94A3B8]'}`}>
                        {isDone ? <Check size={16} strokeWidth={3} /> : String(s.n).padStart(2, '0')}
                      </div>
                      <div className="leading-tight hidden xl:block">
                        <div className={`text-[13px] font-[800] tracking-[-0.01em] ${isActive ? 'text-[#0C1E3A]' : isDone ? 'text-[#0F766E]' : 'text-[#94A3B8]'}`}>{s.label}</div>
                        <div className={`text-[11px] font-[600] ${isActive ? 'text-[#0C1E3A]' : 'text-[#94A3B8]'}`}>{s.sub}</div>
                      </div>
                      <div className="leading-tight xl:hidden">
                        <div className={`text-[12px] font-[800] ${isActive ? 'text-[#0C1E3A]' : isDone ? 'text-[#0F766E]' : 'text-[#94A3B8]'}`}>{s.label}</div>
                      </div>
                      {idx < 3 && <div className={`flex-1 h-[2px] mx-2 rounded-full ${step > s.n ? 'bg-[#0F766E]' : 'bg-[#E2E8F0]'}`} />}
                    </div>
                  )
                })}
              </div>
              <div className="sm:hidden">
                <div className="flex items-center justify-between gap-1">
                  {progressSteps.map(s => {
                    const isActive = step === s.n
                    const isDone = step > s.n
                    return (
                      <div key={s.n} className={`w-9 h-9 rounded-full grid place-items-center text-[12px] font-[800] border-2 shrink-0 ${isDone ? 'bg-[#0F766E] border-[#0F766E] text-white' : isActive ? 'bg-[#0C1E3A] border-[#0C1E3A] text-white' : 'bg-white border-[#0C1E3A]/15 text-[#94A3B8]'}`}>
                        {isDone ? <Check size={14} /> : s.n}
                      </div>
                    )
                  })}
                </div>
                <div className="mt-3 flex gap-1">
                  {progressSteps.map(s => <div key={s.n} className={`h-1.5 flex-1 rounded-full transition-colors ${step >= s.n ? 'bg-[#0C1E3A]' : 'bg-[#E2E8F0]'}`} />)}
                </div>
                <div className="mt-2 text-center text-[12px] font-[700] tracking-wide text-[#0C1E3A]">STEP 0{step} OF 04 — {progressSteps[step - 1].label} {progressSteps[step - 1].sub}</div>
              </div>
            </div>

            <motion.div ref={formCardRef} key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }} className="mt-6 bg-white rounded-[24px] border border-[#0C1E3A]/[0.06] shadow-[0_16px_48px_rgba(12,30,58,0.08)] overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-[#0C1E3A] via-[#0F766E] to-[#0C1E3A]" />
              <div className="p-6 sm:p-8">
                <AnimatePresence>
                  {submitError && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 rounded-2xl bg-[#FEF2F2] border border-red-200 px-4 py-3.5 flex gap-3 text-[13px] leading-5 text-[#7F1D1D]">
                      <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                      <div className="flex-1"><div className="font-[700]">Please correct</div><div>{submitError}</div></div>
                      <button onClick={() => setSubmitError(null)} className="shrink-0 w-7 h-7 rounded-full bg-white border border-red-200 grid place-items-center hover:bg-red-50"><X size={14} /></button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {step === 1 && (
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-2 text-[11px] font-[800] tracking-[0.14em] text-[#0F766E]"><span className="w-6 h-px bg-[#0F766E]" /> STEP 01 — VEHICLE</div>
                        <h2 className="mt-2 text-[20px] sm:text-[22px] font-[800] tracking-[-0.02em]">Vehicle Information</h2>
                        <p className="mt-1 text-[13.5px] leading-6 text-[#5B6B85]">Which vehicle should we check?</p>
                      </div>
                      <div className="hidden sm:flex w-10 h-10 rounded-xl bg-[#0C1E3A] text-white place-items-center justify-center"><Car size={18} /></div>
                    </div>

                    <div className="mt-7 grid gap-5">
                      <div>
                        <label htmlFor="vehicleNumber" className="flex items-center gap-2 text-[13px] font-[700] text-[#0C1E3A]">
                          Vehicle Registration / Number Plate <span className="text-red-600">*</span>
                          <span className="ml-auto text-[11px] font-[600] bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">Required</span>
                        </label>
                        <div className="relative mt-2">
                          <input
                            id="vehicleNumber"
                            value={form.vehicleNumber}
                            onChange={e => setForm({ ...form, vehicleNumber: e.target.value.toUpperCase() })}
                            onBlur={() => setErrors(prev => ({ ...prev, vehicleNumber: validateStep1().vehicleNumber || '' }))}
                            placeholder="e.g., KHI-3921 or B-1234"
                            autoComplete="off"
                            aria-invalid={!!errors.vehicleNumber}
                            aria-describedby={errors.vehicleNumber ? "err-vehicleNumber" : undefined}
                            className={`w-full h-[48px] rounded-xl border bg-white px-4 pr-12 mono text-[15px] font-[600] tracking-wide placeholder:font-medium placeholder:text-[#94A3B8] outline-none transition ${errors.vehicleNumber ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-50' : 'border-[#0C1E3A]/15 focus:border-[#0C1E3A] focus:ring-4 focus:ring-[#0C1E3A]/10'}`}
                          />
                          <Car size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
                        </div>
                        <p className="mt-1.5 text-[12.5px] leading-5 text-[#64748B] flex gap-1.5"><Info size={13} className="shrink-0 mt-0.5" /> Exactly as on your vehicle documents.</p>
                        {errors.vehicleNumber && <p id="err-vehicleNumber" className="mt-1.5 text-[12.5px] font-medium text-red-600 flex items-center gap-1"><AlertCircle size={13} /> {errors.vehicleNumber}</p>}
                      </div>

                      <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                          <label htmlFor="vehicleType" className="flex items-center gap-2 text-[13px] font-[700]">Vehicle Type <span className="text-red-600">*</span></label>
                          <div className="relative mt-2">
                            <select id="vehicleType" value={form.vehicleType} onChange={e => setForm({ ...form, vehicleType: e.target.value })} aria-invalid={!!errors.vehicleType} className={`w-full h-[48px] rounded-xl border bg-white px-4 pr-10 text-[14px] font-[500] outline-none appearance-none ${errors.vehicleType ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-50' : 'border-[#0C1E3A]/15 focus:border-[#0C1E3A] focus:ring-4 focus:ring-[#0C1E3A]/10'}`}>
                              <option value="">Select vehicle type</option>
                              {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
                          </div>
                          {errors.vehicleType && <p className="mt-1.5 text-[12.5px] font-medium text-red-600 flex items-center gap-1"><AlertCircle size={13} /> {errors.vehicleType}</p>}
                        </div>
                        <div>
                          <label htmlFor="vehicleColor" className="flex items-center gap-2 text-[13px] font-[700]">Vehicle Color <span className="text-[11px] font-[600] bg-[#F1F5F9] text-[#64748B] border border-[#0C1E3A]/10 px-2 py-0.5 rounded-full">Optional</span></label>
                          <div className="relative mt-2">
                            <select id="vehicleColor" value={form.vehicleColor} onChange={e => setForm({ ...form, vehicleColor: e.target.value })} className="w-full h-[48px] rounded-xl border border-[#0C1E3A]/15 bg-white px-4 pr-10 text-[14px] font-[500] outline-none focus:border-[#0C1E3A] focus:ring-4 focus:ring-[#0C1E3A]/10 appearance-none">
                              <option value="">Select color</option>
                              {VEHICLE_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="vehicleMake" className="flex items-center gap-2 text-[13px] font-[700]">Vehicle Make / Model <span className="text-[11px] font-[600] bg-[#F1F5F9] text-[#64748B] border border-[#0C1E3A]/10 px-2 py-0.5 rounded-full">Optional</span></label>
                        <input id="vehicleMake" value={form.vehicleMake} onChange={e => setForm({ ...form, vehicleMake: e.target.value })} placeholder="e.g., Toyota Corolla 2020" autoComplete="off" className="mt-2 w-full h-[48px] rounded-xl border border-[#0C1E3A]/15 bg-white px-4 text-[14px] font-[500] outline-none focus:border-[#0C1E3A] focus:ring-4 focus:ring-[#0C1E3A]/10 placeholder:text-[#94A3B8]" />
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-2 text-[11px] font-[800] tracking-[0.14em] text-[#0F766E]"><span className="w-6 h-px bg-[#0F766E]" /> STEP 02 — PERSONAL</div>
                        <h2 className="mt-2 text-[20px] sm:text-[22px] font-[800] tracking-[-0.02em]">Personal Information</h2>
                        <p className="mt-1 text-[13.5px] leading-6 text-[#5B6B85]">For verification and email delivery. Never shared.</p>
                      </div>
                      <div className="hidden sm:flex w-10 h-10 rounded-xl bg-[#0C1E3A] text-white place-items-center justify-center"><UserCheck size={18} /></div>
                    </div>

                    <div className="mt-3 rounded-xl bg-[#EFF6FF] border border-blue-100 px-4 py-3 flex gap-2.5 text-[12.5px] leading-5 text-[#1E3A5F]">
                      <Shield size={16} className="shrink-0 mt-0.5 text-[#0C1E3A]" />
                      <span><span className="font-[700]">Why we ask:</span> To verify the correct vehicle and email your result. Encrypted, admin-only.</span>
                    </div>

                    <div className="mt-7 grid gap-5">
                      <div>
                        <label htmlFor="fullName" className="flex items-center gap-2 text-[13px] font-[700]">Full Name <span className="text-red-600">*</span></label>
                        <input id="fullName" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="As per CNIC" autoComplete="name" aria-invalid={!!errors.fullName} className={`mt-2 w-full h-[48px] rounded-xl border bg-white px-4 text-[14px] font-[500] outline-none placeholder:text-[#94A3B8] ${errors.fullName ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-50' : 'border-[#0C1E3A]/15 focus:border-[#0C1E3A] focus:ring-4 focus:ring-[#0C1E3A]/10'}`} />
                        {errors.fullName && <p className="mt-1.5 text-[12.5px] font-medium text-red-600 flex items-center gap-1"><AlertCircle size={13} /> {errors.fullName}</p>}
                      </div>

                      <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                          <label htmlFor="cnic" className="flex items-center gap-2 text-[13px] font-[700]">CNIC Number <span className="text-red-600">*</span></label>
                          <div className="relative mt-2">
                            <input id="cnic" value={form.cnic} onChange={e => setForm({ ...form, cnic: formatCNIC(e.target.value) })} placeholder="42201-1234567-1" inputMode="numeric" autoComplete="off" aria-invalid={!!errors.cnic} className={`w-full h-[48px] rounded-xl border bg-white px-4 pr-10 mono text-[14px] font-[600] tracking-wide outline-none placeholder:text-[#94A3B8] ${errors.cnic ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-50' : 'border-[#0C1E3A]/15 focus:border-[#0C1E3A] focus:ring-4 focus:ring-[#0C1E3A]/10'}`} />
                            <Fingerprint size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                          </div>
                          <p className="mt-1.5 text-[11.5px] text-[#64748B]">13 digits • Admin-only</p>
                          {errors.cnic && <p className="mt-1.5 text-[12.5px] font-medium text-red-600 flex items-center gap-1"><AlertCircle size={13} /> {errors.cnic}</p>}
                        </div>
                        <div>
                          <label htmlFor="mobile" className="flex items-center gap-2 text-[13px] font-[700]">Mobile Number <span className="text-red-600">*</span></label>
                          <div className="relative mt-2">
                            <input id="mobile" value={form.mobile} onChange={e => setForm({ ...form, mobile: formatMobile(e.target.value) })} placeholder="0300-1234567" inputMode="numeric" autoComplete="tel" aria-invalid={!!errors.mobile} className={`w-full h-[48px] rounded-xl border bg-white px-4 pr-10 mono text-[14px] font-[600] tracking-wide outline-none placeholder:text-[#94A3B8] ${errors.mobile ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-50' : 'border-[#0C1E3A]/15 focus:border-[#0C1E3A] focus:ring-4 focus:ring-[#0C1E3A]/10'}`} />
                            <Phone size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                          </div>
                          {errors.mobile && <p className="mt-1.5 text-[12.5px] font-medium text-red-600 flex items-center gap-1"><AlertCircle size={13} /> {errors.mobile}</p>}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="email" className="flex items-center gap-2 text-[13px] font-[700]">Email Address <span className="text-red-600">*</span></label>
                        <div className="relative mt-2">
                          <input id="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" type="email" inputMode="email" autoComplete="email" aria-invalid={!!errors.email} className={`w-full h-[48px] rounded-xl border bg-white px-4 pr-10 text-[14px] font-[500] outline-none placeholder:text-[#94A3B8] ${errors.email ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-50' : 'border-[#0C1E3A]/15 focus:border-[#0C1E3A] focus:ring-4 focus:ring-[#0C1E3A]/10'}`} />
                          <Mail size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                        </div>
                        <p className="mt-1.5 text-[12.5px] text-[#64748B]">Double-check — your result will be sent here.</p>
                        {errors.email && <p className="mt-1.5 text-[12.5px] font-medium text-red-600 flex items-center gap-1"><AlertCircle size={13} /> {errors.email}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-2 text-[11px] font-[800] tracking-[0.14em] text-[#0F766E]"><span className="w-6 h-px bg-[#0F766E]" /> STEP 03 — ADDITIONAL</div>
                        <h2 className="mt-2 text-[20px] sm:text-[22px] font-[800] tracking-[-0.02em]">Additional Information</h2>
                        <p className="mt-1 text-[13.5px] leading-6 text-[#5B6B85]">Optional — helps us verify faster.</p>
                      </div>
                      <div className="hidden sm:flex w-10 h-10 rounded-xl bg-[#0C1E3A] text-white place-items-center justify-center"><CalendarDays size={18} /></div>
                    </div>

                    <div className="mt-7 grid gap-5">
                      <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                          <label className="flex items-center gap-2 text-[13px] font-[700]">Approximate Violation Date <span className="text-[11px] font-[600] bg-[#F1F5F9] text-[#64748B] border border-[#0C1E3A]/10 px-2 py-0.5 rounded-full">Optional</span></label>
                          <input type="date" value={form.violationDate} onChange={e => setForm({ ...form, violationDate: e.target.value })} max={new Date().toISOString().split('T')[0]} className="mt-2 w-full h-[48px] rounded-xl border border-[#0C1E3A]/15 bg-white px-4 text-[14px] font-[500] outline-none focus:border-[#0C1E3A] focus:ring-4 focus:ring-[#0C1E3A]/10" />
                        </div>
                        <div>
                          <label className="flex items-center gap-2 text-[13px] font-[700]">Approximate Violation Time <span className="text-[11px] font-[600] bg-[#F1F5F9] text-[#64748B] border border-[#0C1E3A]/10 px-2 py-0.5 rounded-full">Optional</span></label>
                          <input type="time" value={form.violationTime} onChange={e => setForm({ ...form, violationTime: e.target.value })} className="mt-2 w-full h-[48px] rounded-xl border border-[#0C1E3A]/15 bg-white px-4 text-[14px] font-[500] outline-none focus:border-[#0C1E3A] focus:ring-4 focus:ring-[#0C1E3A]/10" />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="area" className="flex items-center gap-2 text-[13px] font-[700]">Area / Location <span className="text-[11px] font-[600] bg-[#F1F5F9] text-[#64748B] border border-[#0C1E3A]/10 px-2 py-0.5 rounded-full">Optional</span></label>
                        <div className="relative mt-2">
                          <input id="area" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} placeholder="e.g., Shahrah-e-Faisal, Clifton" autoComplete="off" className="w-full h-[48px] rounded-xl border border-[#0C1E3A]/15 bg-white px-4 pr-10 text-[14px] font-[500] outline-none focus:border-[#0C1E3A] focus:ring-4 focus:ring-[#0C1E3A]/10 placeholder:text-[#94A3B8]" />
                          <MapPin size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="challanRef" className="flex items-center gap-2 text-[13px] font-[700]">Challan / Reference Number <span className="text-[11px] font-[600] bg-[#F1F5F9] text-[#64748B] border border-[#0C1E3A]/10 px-2 py-0.5 rounded-full">Optional</span></label>
                        <input id="challanRef" value={form.challanRef} onChange={e => setForm({ ...form, challanRef: e.target.value })} placeholder="If you already have a slip number" autoComplete="off" className="mt-2 w-full h-[48px] rounded-xl border border-[#0C1E3A]/15 bg-white px-4 text-[14px] font-[500] mono outline-none focus:border-[#0C1E3A] focus:ring-4 focus:ring-[#0C1E3A]/10 placeholder:font-sans placeholder:text-[#94A3B8]" />
                      </div>
                      <div>
                        <label htmlFor="notes" className="flex items-center gap-2 text-[13px] font-[700]">Additional Notes <span className="text-[11px] font-[600] bg-[#F1F5F9] text-[#64748B] border border-[#0C1E3A]/10 px-2 py-0.5 rounded-full">Optional</span></label>
                        <textarea id="notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value.slice(0, 500) })} placeholder="Any detail that may help — e.g., sold vehicle, transfer pending…" rows={4} className="mt-2 w-full rounded-xl border border-[#0C1E3A]/15 bg-white px-4 py-3 text-[14px] font-[500] leading-6 outline-none focus:border-[#0C1E3A] focus:ring-4 focus:ring-[#0C1E3A]/10 placeholder:text-[#94A3B8] resize-none" />
                        <p className="mt-1.5 text-[12px] text-[#64748B]">{form.notes.length}/500 characters</p>
                      </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-2 text-[11px] font-[800] tracking-[0.14em] text-[#0F766E]"><span className="w-6 h-px bg-[#0F766E]" /> STEP 04 — REVIEW</div>
                        <h2 className="mt-2 text-[20px] sm:text-[22px] font-[800] tracking-[-0.02em]">Review & Submit</h2>
                        <p className="mt-1 text-[13.5px] leading-6 text-[#5B6B85]">Confirm everything before submitting.</p>
                      </div>
                      <div className="hidden sm:flex w-10 h-10 rounded-xl bg-[#0C1E3A] text-white place-items-center justify-center"><ClipboardCheck size={18} /></div>
                    </div>

                    <div className="mt-6 grid gap-4">
                      <div className="rounded-2xl border border-[#0C1E3A]/10 bg-[#F8FAFC] overflow-hidden">
                        <div className="px-4 sm:px-5 h-11 flex items-center justify-between bg-white border-b border-[#0C1E3A]/5">
                          <span className="text-[13px] font-[800] flex items-center gap-2"><Car size={14} className="text-[#0F766E]" /> Vehicle Information</span>
                          <button onClick={() => setStep(1)} className="text-[12px] font-[700] text-[#0C1E3A] hover:text-[#0F766E] inline-flex items-center gap-1 underline-offset-2 hover:underline">Edit <ArrowUpRight size={12} /></button>
                        </div>
                        <div className="p-4 sm:p-5 grid sm:grid-cols-2 gap-3 text-[13.5px]">
                          <div><span className="text-[11px] font-[700] tracking-wide text-[#5B6B85]">REGISTRATION</span><div className="font-[700] mono tracking-wide">{form.vehicleNumber || "—"}</div></div>
                          <div><span className="text-[11px] font-[700] tracking-wide text-[#5B6B85]">VEHICLE TYPE</span><div className="font-[600]">{form.vehicleType || "—"}</div></div>
                          <div><span className="text-[11px] font-[700] tracking-wide text-[#5B6B85]">MAKE / MODEL</span><div className="font-[500] text-[#2E4160]">{form.vehicleMake || <span className="text-[#94A3B8] italic">Not provided</span>}</div></div>
                          <div><span className="text-[11px] font-[700] tracking-wide text-[#5B6B85]">COLOR</span><div className="font-[500] text-[#2E4160]">{form.vehicleColor || <span className="text-[#94A3B8] italic">Not provided</span>}</div></div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[#0C1E3A]/10 bg-[#F8FAFC] overflow-hidden">
                        <div className="px-4 sm:px-5 h-11 flex items-center justify-between bg-white border-b border-[#0C1E3A]/5">
                          <span className="text-[13px] font-[800] flex items-center gap-2"><UserCheck size={14} className="text-[#0F766E]" /> Personal Information</span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => setShowSensitive(!showSensitive)} className="text-[11px] font-[700] inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F1F5F9] border border-[#0C1E3A]/10 hover:bg-white">
                              {showSensitive ? <><EyeOff size={12} /> Hide</> : <><Eye size={12} /> Show</>}
                            </button>
                            <button onClick={() => setStep(2)} className="text-[12px] font-[700] text-[#0C1E3A] hover:text-[#0F766E] inline-flex items-center gap-1 underline-offset-2 hover:underline">Edit <ArrowUpRight size={12} /></button>
                          </div>
                        </div>
                        <div className="p-4 sm:p-5 grid gap-3 text-[13.5px]">
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div><span className="text-[11px] font-[700] tracking-wide text-[#5B6B85]">FULL NAME</span><div className="font-[600]">{form.fullName}</div></div>
                            <div><span className="text-[11px] font-[700] tracking-wide text-[#5B6B85]">EMAIL</span><div className="font-[500] break-all">{form.email}</div></div>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div><span className="text-[11px] font-[700] tracking-wide text-[#5B6B85]">CNIC</span><div className="font-[600] mono">{showSensitive ? form.cnic : maskCNIC(form.cnic)}</div></div>
                            <div><span className="text-[11px] font-[700] tracking-wide text-[#5B6B85]">MOBILE</span><div className="font-[600] mono">{showSensitive ? form.mobile : maskMobile(form.mobile)}</div></div>
                          </div>
                          <div className="text-[11px] leading-4 text-[#64748B] flex gap-1.5 pt-1 border-t border-[#0C1E3A]/5 mt-1"><Lock size={11} className="mt-0.5 shrink-0" /> Masked for privacy. Toggle “Show” only on a private screen.</div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[#0C1E3A]/10 bg-[#F8FAFC] overflow-hidden">
                        <div className="px-4 sm:px-5 h-11 flex items-center justify-between bg-white border-b border-[#0C1E3A]/5">
                          <span className="text-[13px] font-[800] flex items-center gap-2"><CalendarDays size={14} className="text-[#0F766E]" /> Additional Information</span>
                          <button onClick={() => setStep(3)} className="text-[12px] font-[700] text-[#0C1E3A] hover:text-[#0F766E] inline-flex items-center gap-1 underline-offset-2 hover:underline">Edit <ArrowUpRight size={12} /></button>
                        </div>
                        <div className="p-4 sm:p-5 grid gap-3 text-[13.5px]">
                          <div className="grid sm:grid-cols-3 gap-3">
                            <div><span className="text-[11px] font-[700] tracking-wide text-[#5B6B85]">VIOLATION DATE</span><div className="font-[500]">{form.violationDate ? new Date(form.violationDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : <span className="text-[#94A3B8] italic">Not provided</span>}</div></div>
                            <div><span className="text-[11px] font-[700] tracking-wide text-[#5B6B85]">VIOLATION TIME</span><div className="font-[500]">{form.violationTime || <span className="text-[#94A3B8] italic">Not provided</span>}</div></div>
                            <div><span className="text-[11px] font-[700] tracking-wide text-[#5B6B85]">AREA / LOCATION</span><div className="font-[500]">{form.area || <span className="text-[#94A3B8] italic">Not provided</span>}</div></div>
                          </div>
                          <div><span className="text-[11px] font-[700] tracking-wide text-[#5B6B85]">CHALLAN / REF</span><div className="font-[500] mono">{form.challanRef || <span className="text-[#94A3B8] italic font-sans">Not provided</span>}</div></div>
                          <div><span className="text-[11px] font-[700] tracking-wide text-[#5B6B85]">NOTES</span><div className="font-[500] leading-6 bg-white border border-[#0C1E3A]/5 rounded-xl px-3 py-2 min-h-[44px]">{form.notes || <span className="text-[#94A3B8] italic">No additional notes</span>}</div></div>
                        </div>
                      </div>

                      <label className={`flex gap-3 rounded-2xl border p-4 cursor-pointer transition ${consent ? 'bg-emerald-50/60 border-emerald-200' : 'bg-white border-[#0C1E3A]/10 hover:border-[#0C1E3A]/20'}`}>
                        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5 w-5 h-5 rounded border-2 border-[#0C1E3A]/20 accent-[#0C1E3A] shrink-0" />
                        <span className="text-[13px] leading-6">
                          <span className="font-[700]">I confirm</span> that the information is accurate and I consent to its use for verification. I understand this is <span className="font-[700]">not an instant search</span> and results are emailed after manual verification.
                          <span className="block mt-1 text-[11.5px] text-[#5B6B85]">Request data deletion after verification via support@karachiechallan.pk.</span>
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3 sm:justify-between sm:items-center border-t border-[#0C1E3A]/5 pt-6">
                  <button onClick={handleBack} disabled={submitting} className="h-[48px] px-6 rounded-full bg-white border border-[#0C1E3A]/10 hover:bg-[#F8FAFC] text-[14px] font-[700] text-[#0C1E3A] inline-flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]">
                    <ChevronLeft size={16} /> Back
                  </button>
                  {step < 4 ? (
                    <button onClick={handleNext} className="h-[48px] px-8 rounded-full bg-[#0C1E3A] hover:bg-[#0A1933] active:scale-[0.98] text-white text-[14px] font-[800] inline-flex items-center justify-center gap-2 shadow-[0_10px_24px_rgba(12,30,58,0.18)]">
                      Continue <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button onClick={handleSubmit} disabled={submitting} className="h-[48px] px-8 rounded-full bg-[#0C1E3A] hover:bg-[#0A1933] disabled:opacity-60 text-white text-[14px] font-[800] inline-flex items-center justify-center gap-2 shadow-[0_10px_24px_rgba(12,30,58,0.18)] min-w-[220px] active:scale-[0.98]">
                      {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting your request...</> : <>Submit Verification Request <Send size={16} /></>}
                    </button>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] font-medium text-[#64748B]">
                  <span className="inline-flex items-center gap-1"><Shield size={11} className="text-[#0F766E]" /> Privacy-first</span><span>•</span><span>No data published</span><span>•</span><span>Step {step} of 4</span>
                </div>
              </div>
            </motion.div>

            <div className="mt-6 flex flex-wrap justify-center gap-2 text-[12px] font-medium">
              <span className="inline-flex items-center gap-1.5 bg-white border border-[#0C1E3A]/5 rounded-full px-3 py-1.5"><Lock size={12} className="text-[#0F766E]" /> Encrypted</span>
              <span className="inline-flex items-center gap-1.5 bg-white border border-[#0C1E3A]/5 rounded-full px-3 py-1.5"><UserCheck size={12} className="text-[#0F766E]" /> Human-reviewed</span>
              <span className="inline-flex items-center gap-1.5 bg-white border border-[#0C1E3A]/5 rounded-full px-3 py-1.5"><Mail size={12} className="text-[#0F766E]" /> Email-only</span>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS */}
      {view === 'success' && (
        <div className="min-h-[calc(100vh-108px)] bg-[#F8FAFC] border-b border-[#0C1E3A]/5">
          <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[28px] border border-[#0C1E3A]/[0.06] shadow-[0_20px_60px_rgba(12,30,58,0.08)] overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-[#0C1E3A] via-[#0F766E] to-[#0C1E3A]" />
              <div className="p-6 sm:p-10 text-center">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }} className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border-2 border-emerald-200 grid place-items-center text-emerald-600">
                  <CheckCircle2 size={32} />
                </motion.div>
                {isDuplicate ? (
                  <div className="mt-4 mx-auto max-w-[520px] rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 flex gap-2.5 text-left text-[13px] leading-5 text-amber-900">
                    <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div><span className="font-[800]">Duplicate detected —</span> we found an existing pending request for this vehicle & email from the last 24h. Returning your existing <span className="mono font-[700]">{requestId}</span>.</div>
                  </div>
                ) : (
                  <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 text-[11px] font-[800] tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> STATUS: {returnedStatus}
                  </div>
                )}
                <h1 className="mt-4 text-[28px] sm:text-[32px] font-[900] tracking-[-0.03em] leading-tight text-[#0C1E3A]">{isDuplicate ? 'Request Already Exists' : 'Request Submitted Successfully'}</h1>
                <p className="mt-3 text-[14px] sm:text-[15px] leading-6 text-[#4A5A78] max-w-[560px] mx-auto text-pretty">
                  {isDuplicate ? 'We’ve returned your existing Request ID. Track its status with this ID — no need to submit again.' : 'Your e-challan verification request has been received. Our team will review and email the result.'}
                </p>

                <div className="mt-8 rounded-[20px] bg-[#0C1E3A] text-white p-5 sm:p-6 text-left relative overflow-hidden">
                  <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-white/5" />
                  <div className="flex flex-wrap items-start justify-between gap-4 relative">
                    <div>
                      <div className="text-[11px] font-[800] tracking-[0.14em] text-white/60">REQUEST ID</div>
                      <div className="mono text-[18px] sm:text-[22px] font-[800] tracking-[0.06em] mt-1">{requestId}</div>
                      <div className="text-[12px] text-white/70 mt-1">Keep this for reference • Also sent to email</div>
                    </div>
                    <button onClick={copyId} className="inline-flex items-center gap-2 bg-white text-[#0C1E3A] rounded-full px-5 h-10 text-[13px] font-[800] hover:bg-[#F1F5F9] active:scale-[0.98] transition shrink-0">
                      {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}{copied ? "Copied!" : "Copy Request ID"}
                    </button>
                  </div>
                  <div className="mt-5 grid sm:grid-cols-3 gap-3 text-[13px]">
                    <div className="rounded-xl bg-white/10 border border-white/10 p-3"><div className="text-[11px] font-[700] tracking-wide text-white/60">EMAIL</div><div className="font-[600] break-all mt-1">{form.email}</div></div>
                    <div className="rounded-xl bg-white/10 border border-white/10 p-3"><div className="text-[11px] font-[700] tracking-wide text-white/60">STATUS</div><div className="font-[700] mt-1 inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> {returnedStatus}</div></div>
                    <div className="rounded-xl bg-white/10 border border-white/10 p-3"><div className="text-[11px] font-[700] tracking-wide text-white/60">SUBMITTED</div><div className="font-[600] mt-1">{submittedAt}</div></div>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-[#EFF6FF] border border-blue-100 p-4 text-left flex gap-3 text-[13px] leading-6 text-[#1E3A5F]">
                  <Mail size={18} className="shrink-0 mt-0.5 text-[#0C1E3A]" />
                  <div><span className="font-[700]">What’s next?</span> Result by email within 24–48 working hours. Check spam if not in inbox within 10 min.</div>
                </div>

                <div className="mt-6 grid sm:grid-cols-3 gap-3 text-left">
                  {[
                    { icon: Clock3, title: "24–48h Review", desc: "Human team checks records" },
                    { icon: Mail, title: "Email delivery", desc: "Result to your inbox" },
                    { icon: Shield, title: "Private", desc: "Used only for this request" },
                  ].map(card => (
                    <div key={card.title} className="rounded-2xl bg-[#F8FAFC] border border-[#0C1E3A]/5 p-4">
                      <div className="w-8 h-8 rounded-full bg-white border border-[#0C1E3A]/10 grid place-items-center"><card.icon size={14} /></div>
                      <div className="mt-2 text-[13px] font-[700]">{card.title}</div>
                      <div className="text-[12px] leading-5 text-[#5B6B85]">{card.desc}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={goHome} className="h-[48px] px-8 rounded-full bg-[#0C1E3A] hover:bg-[#0A1933] text-white font-[800] inline-flex items-center justify-center gap-2 transition active:scale-[0.98]">Back to Home <ArrowUpRight size={16} /></button>
                  <button onClick={() => { setView('form'); setStep(1); setRequestId(""); setIsDuplicate(false) }} className="h-[48px] px-8 rounded-full bg-white border border-[#0C1E3A]/10 font-[700] inline-flex items-center justify-center gap-2 hover:bg-[#F8FAFC] active:scale-[0.98]">Submit another <RefreshCw size={16} /></button>
                </div>

                <p className="mt-6 text-[12px] leading-5 text-[#64748B]">Need help? <a href="mailto:support@karachiechallan.pk" className="underline decoration-dotted font-[600] text-[#0C1E3A] hover:text-[#0F766E]">support@karachiechallan.pk</a> with your Request ID.</p>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-[#0C1E3A]/5">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-10 sm:pt-12 pb-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-[1.4fr_0.9fr_0.9fr] gap-8 lg:gap-10">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0C1E3A] grid place-items-center text-white"><ShieldCheck size={18} /></div>
                <div>
                  <div className="text-[15px] font-[900] tracking-[-0.02em] leading-none">Karachi E-Challan</div>
                  <div className="text-[11px] font-[700] tracking-[0.1em] text-[#0F766E] uppercase">Verification Request Platform</div>
                </div>
              </div>
              <p className="mt-4 text-[13.5px] leading-6 text-[#4A5A78] max-w-[420px] text-pretty">Premium manual verification for Karachi E-Challan. We review and email results — no instant lookup.</p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#F1F5F9] border border-[#0C1E3A]/5 px-3 py-2 text-[12px] font-[600] text-[#2E4160]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Manual • Secure • Transparent
              </div>
            </div>
            <div>
              <div className="text-[11px] font-[800] tracking-[0.12em] text-[#0C1E3A]">NAVIGATION</div>
              <ul className="mt-4 grid gap-2.5 text-[14px] font-[500] text-[#2E4160]">
                <li><button onClick={() => scrollTo('home')} className="hover:text-[#0C1E3A] hover:underline underline-offset-4 text-left">Home</button></li>
                <li><button onClick={() => scrollTo('how')} className="hover:text-[#0C1E3A] hover:underline underline-offset-4 text-left">How It Works</button></li>
                <li><button onClick={() => scrollTo('info')} className="hover:text-[#0C1E3A] hover:underline underline-offset-4 text-left">E-Challan Information</button></li>
                <li><button onClick={() => scrollTo('faq')} className="hover:text-[#0C1E3A] hover:underline underline-offset-4 text-left">FAQs</button></li>
                <li><button onClick={() => scrollTo('contact')} className="hover:text-[#0C1E3A] hover:underline underline-offset-4 text-left">Contact</button></li>
              </ul>
            </div>
            <div>
              <div className="text-[11px] font-[800] tracking-[0.12em] text-[#0C1E3A]">LEGAL & CONTACT</div>
              <ul className="mt-4 grid gap-2.5 text-[14px] font-[500] text-[#2E4160]">
                <li><button onClick={() => showToast("Privacy Policy — coming soon. Email support@karachiechallan.pk for details.")} className="hover:text-[#0C1E3A] text-left">Privacy Policy</button></li>
                <li><button onClick={() => showToast("Terms — coming soon. Contact support for information.")} className="hover:text-[#0C1E3A] text-left">Terms</button></li>
                <li><button onClick={() => showToast("Disclaimer: Not a government website. No official affiliation — manual verification only.")} className="hover:text-[#0C1E3A] text-left">Disclaimer</button></li>
                <li className="pt-2 flex items-center gap-2 text-[13px]"><Mail size={14} className="text-[#0F766E]" /> support@karachiechallan.pk</li>
                <li className="flex items-center gap-2 text-[13px]"><Phone size={14} className="text-[#0F766E]" /> 021-XXXXXXX (10am–6pm)</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-[#0C1E3A]/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] leading-5">
            <span className="text-[#5B6B85] text-center sm:text-left">© 2026 Karachi E-Challan. All rights reserved. Not a government website.</span>
            <span className="inline-flex items-center gap-2 font-[600] text-[#0C1E3A] shrink-0"><Shield size={14} className="text-[#0F766E]" /> Secure • Manual • Transparent</span>
          </div>
        </div>
      </footer>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }} className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-[90vw] bg-[#0C1E3A] text-white rounded-full px-5 py-3 text-[13px] font-[600] shadow-[0_12px_32px_rgba(12,30,58,0.22)] flex items-center gap-2">
            <Info size={14} className="text-[#7EE8DC] shrink-0" /> <span className="truncate">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
