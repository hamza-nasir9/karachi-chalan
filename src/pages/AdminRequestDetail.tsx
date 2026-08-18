import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ShieldCheck, Car, User, Phone, Mail, MapPin, Clock, ClipboardCheck,
  Eye, EyeOff, ExternalLink, CheckCircle2, AlertTriangle, Send, Copy, Check, Plus,
  StickyNote, History, Loader2, AlertCircle, ArrowUpRight, RefreshCw, Info, Lock, XCircle, RotateCcw, BadgeCheck, FileSearch, Database
} from 'lucide-react'
import { getCachedAdminUser } from '../lib/adminAuth'
import { STATUS_LABEL, type RequestStatusType, type VerificationRequest } from '../lib/requestModel'
import { prepareVerificationEmail, isEmailConfigured, getEmailConfigRequirements } from '../lib/emailService'
import type { VerificationResult, InternalNote, EmailRecord } from '../types/adminTypes'

function maskCNIC(d: string) { return d.length === 13 ? `${d.slice(0, 5)}-•••••••-${d.slice(12)}` : '•••••••••••••' }
function maskMobile(d: string) { return d.length === 11 ? `${d.slice(0, 4)}-•••${d.slice(7)}` : '•••••••••••' }

const badge = (s: string) => {
  const m: Record<string, string> = {
    NEW: 'bg-amber-50 text-amber-700 border-amber-200',
    IN_REVIEW: 'bg-blue-50 text-blue-700 border-blue-200',
    CHALLAN_FOUND: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    NO_CHALLAN_FOUND: 'bg-slate-50 text-slate-700 border-slate-200',
    UNABLE_TO_VERIFY: 'bg-red-50 text-red-700 border-red-200',
    MORE_INFORMATION_REQUIRED: 'bg-orange-50 text-orange-700 border-orange-200',
    COMPLETED: 'bg-[#0C1E3A] text-white border-[#0C1E3A]',
  }
  return m[s] || 'bg-slate-50 text-slate-700 border-slate-200'
}

export default function AdminRequestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const admin = getCachedAdminUser()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [request, setRequest] = useState<VerificationRequest | null>(null)
  const [verification, setVerification] = useState<VerificationResult | null>(null)
  const [internalNotes, setInternalNotes] = useState<InternalNote[]>([])
  const [completedAt, setCompletedAt] = useState<string | null>(null)
  const [emails, setEmails] = useState<EmailRecord[]>([])

  const [reveal, setReveal] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)
  const [outcome, setOutcome] = useState<RequestStatusType | ''>('')
  const [saving, setSaving] = useState(false)
  const [saveOk, setSaveOk] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [emailHtml, setEmailHtml] = useState('')
  const [templateId, setTemplateId] = useState<string>('')
  const [showPreview, setShowPreview] = useState(false)

  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendSuccess, setSendSuccess] = useState<{ messageId?: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2200) }

  const [f, setF] = useState({ challanNumber: '', violation: '', challanDate: '', challanTime: '', location: '', fineAmount: '', dueDate: '', paymentStatus: '', referencePsid: '', notes: '' })
  const [otherNotes, setOtherNotes] = useState('')

  const fetchDetail = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/requests/${encodeURIComponent(id)}`, { credentials: 'include' })
      if (res.status === 401) { navigate('/admin/login', { replace: true, state: { msg: 'Please sign in to view this request.' } }); return }
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) throw new Error(json?.error?.message || `Failed (${res.status})`)
      const data = json.data
      const req: VerificationRequest = data.request
      setRequest(req)
      const v = data.enrichment?.verification || null
      setVerification(v)
      setInternalNotes(data.enrichment?.internalNotes || [])
      setCompletedAt(data.enrichment?.completedAt || (req as any).completedAt || null)
      setEmails(data.emails || [])

      // Pre-fill form from saved verification
      if (v?.outcome === 'CHALLAN_FOUND') {
        setF({
          challanNumber: v.challanNumber || '', violation: v.violation || '', challanDate: v.challanDate || '', challanTime: v.challanTime || '',
          location: v.location || '', fineAmount: v.fineAmount || '', dueDate: v.dueDate || '', paymentStatus: v.paymentStatus || '', referencePsid: v.referencePsid || '', notes: v.notes || ''
        })
        setOutcome('CHALLAN_FOUND')
      } else if (v) {
        setOutcome(v.outcome as any)
        setOtherNotes(v.notes || '')
      } else {
        setOutcome('')
        setOtherNotes('')
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load request')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => { fetchDetail() }, [fetchDetail])

  // Build editable email draft from current form + verification
  useEffect(() => {
    if (!request) return
    let v: VerificationResult | null = null
    if (outcome) {
      v = {
        outcome: outcome as any,
        challanNumber: f.challanNumber, violation: f.violation, challanDate: f.challanDate, challanTime: f.challanTime,
        location: f.location, fineAmount: f.fineAmount, dueDate: f.dueDate, paymentStatus: f.paymentStatus, referencePsid: f.referencePsid,
        notes: outcome === 'CHALLAN_FOUND' ? f.notes : otherNotes,
        updatedAt: new Date().toISOString(), updatedBy: admin?.email || ''
      }
    } else if (verification) {
      v = verification
    }
    if (!v) {
      setEmailSubject(`Update on your E-Challan verification — ${request.requestId}`)
      setEmailBody(`Dear ${request.fullName.split(' ')[0]},\n\nWe are reviewing your verification request ${request.requestId} for vehicle ${request.vehicleRegistrationNumber}.\nOur team is checking the relevant records and will email the result within 24–48 working hours.\n\n— Karachi E-Challan Verification Team\nsupport@karachiechallan.pk`)
      setEmailHtml('')
      setTemplateId('')
      return
    }
    const prepared = prepareVerificationEmail(request as any, v as any)
    setEmailSubject(prepared.subject)
    setEmailBody(prepared.text)
    setEmailHtml(prepared.html)
    setTemplateId(prepared.templateId)
  }, [request?.requestId, outcome, f.challanNumber, f.violation, f.challanDate, f.challanTime, f.location, f.fineAmount, f.dueDate, f.paymentStatus, f.referencePsid, f.notes, otherNotes, verification?.outcome])

  const handleMarkInReview = async () => {
    if (!id) return
    setSaveError(null); setSaveOk(null)
    try {
      const res = await fetch(`/api/admin/requests/${encodeURIComponent(id)}/status`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ status: 'IN_REVIEW' })
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) throw new Error(json?.error?.message || `Failed (${res.status})`)
      setSaveOk('Marked as In Review — you may now record the verification result below.')
      setTimeout(() => setSaveOk(null), 3200)
      showToast('Status → In Review')
      fetchDetail()
    } catch (e: any) {
      setSaveError(e.message || 'Failed to update status')
    }
  }

  const handleAddNote = async () => {
    if (!noteText.trim() || !id) return
    setNoteSaving(true)
    try {
      const res = await fetch(`/api/admin/requests/${encodeURIComponent(id)}/notes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ text: noteText })
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) throw new Error(json?.error?.message || `Failed (${res.status})`)
      setNoteText('')
      showToast('Internal note added — private')
      fetchDetail()
    } catch (e: any) {
      showToast(e.message || 'Failed to add note')
    } finally {
      setNoteSaving(false)
    }
  }

  const validateBeforeSave = (): Record<string, string> => {
    const e: Record<string, string> = {}
    if (!outcome) e.outcome = 'Select a result outcome.'
    if (outcome === 'CHALLAN_FOUND') {
      if (!f.challanNumber.trim()) e.challanNumber = 'Challan Number is required.'
      else if (f.challanNumber.trim().length < 4) e.challanNumber = 'Challan Number too short.'
      if (f.fineAmount && isNaN(Number(f.fineAmount.replace(/[,Rs.\s]/g, '')))) e.fineAmount = 'Enter a valid number (e.g., 1500).'
      if (f.challanDate && isNaN(new Date(f.challanDate).getTime())) e.challanDate = 'Invalid date.'
      if (f.dueDate && isNaN(new Date(f.dueDate).getTime())) e.dueDate = 'Invalid due date.'
    } else if (outcome) {
      if (!otherNotes.trim()) {
        if (outcome === 'MORE_INFORMATION_REQUIRED') e.otherNotes = 'Describe what information is required.'
        else if (outcome === 'UNABLE_TO_VERIFY') e.otherNotes = 'Provide the reason you were unable to verify.'
        else e.otherNotes = 'Add notes / explanation for this result.'
      } else if (otherNotes.trim().length < 10) e.otherNotes = 'Add a more detailed explanation (≥10 characters).'
    }
    return e
  }

  const handleSaveResult = async () => {
    const errs = validateBeforeSave()
    if (Object.keys(errs).length) { setFieldErrors(errs); setSaveError(Object.values(errs)[0]); return }
    if (!id || !outcome || saving) return
    setSaving(true); setSaveOk(null); setSaveError(null); setFieldErrors({})
    try {
      const payload: any = {
        outcome,
        notes: outcome === 'CHALLAN_FOUND' ? f.notes.trim() || undefined : otherNotes.trim(),
      }
      if (outcome === 'CHALLAN_FOUND') {
        Object.assign(payload, {
          challanNumber: f.challanNumber.trim(),
          violation: f.violation.trim() || undefined,
          challanDate: f.challanDate || undefined,
          challanTime: f.challanTime || undefined,
          location: f.location.trim() || undefined,
          fineAmount: f.fineAmount.trim() || undefined,
          dueDate: f.dueDate || undefined,
          paymentStatus: f.paymentStatus || undefined,
          referencePsid: f.referencePsid.trim() || undefined,
        })
      }
      const res = await fetch(`/api/admin/requests/${encodeURIComponent(id)}/verification`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify(payload)
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) throw new Error(json?.error?.message || `Failed (${res.status})`)
      setSaveOk(`Result saved as ${(STATUS_LABEL as any)[outcome]} — preview and send the email below.`)
      setShowPreview(true)
      showToast('Verification result saved')
      fetchDetail()
    } catch (e: any) {
      setSaveError(e.message || 'Failed to save result')
    } finally {
      setSaving(false)
    }
  }

  const handleSendEmail = async () => {
    if (!id || !request || sending) return
    if (!outcome && !verification) { setSendError('Save a verification result first.'); return }
    if (!emailSubject.trim() || !emailBody.trim()) { setSendError('Subject and message are required.'); return }
    setSending(true); setSendError(null); setSendSuccess(null)
    try {
      const res = await fetch(`/api/admin/requests/${encodeURIComponent(id)}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subject: emailSubject.trim(), text: emailBody, html: emailHtml, templateId: templateId || outcome || verification?.outcome })
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) {
        const msg = json?.error?.message || `Email failed (${res.status})`
        throw new Error(msg)
      }
      setSendSuccess({ messageId: json.data?.messageId })
      showToast('Email sent — request completed')
      fetchDetail()
    } catch (e: any) {
      setSendError(e.message || 'Email failed — request was NOT marked completed. Please retry.')
    } finally {
      setSending(false)
    }
  }

  const copyId = async () => {
    if (!request) return
    await navigator.clipboard.writeText(request.requestId)
    setCopied(true); showToast('Request ID copied'); setTimeout(() => setCopied(false), 1500)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-40 bg-[#E2E8F0] rounded animate-pulse" />
        <div className="bg-white rounded-[20px] border border-[#0C1E3A]/5 p-8 animate-pulse">
          <div className="h-6 w-48 bg-[#F1F5F9] rounded" />
          <div className="mt-4 h-4 w-full bg-[#F1F5F9] rounded" />
          <div className="mt-2 h-4 w-3/4 bg-[#F1F5F9] rounded" />
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-[18px] border border-[#0C1E3A]/5 p-6 h-64 animate-pulse bg-[#F8FAFC]" />
          <div className="bg-white rounded-[18px] border border-[#0C1E3A]/5 p-6 h-64 animate-pulse bg-[#F8FAFC]" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-[20px] border border-red-200 p-8 text-center max-w-[560px] mx-auto mt-6 shadow-sm">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FEF2F2] border border-red-200 grid place-items-center text-red-600"><AlertTriangle size={22} /></div>
        <div className="mt-4 text-[16px] font-[800]">Failed to load request</div>
        <p className="mt-2 text-[13px] leading-6 text-[#5B6B85]">{error}</p>
        <p className="mt-2 text-[12px] text-[#94A3B8]">Request ID: <span className="mono font-[700] text-[#0C1E3A]">{id}</span></p>
        <div className="mt-6 flex gap-3 justify-center">
          <button onClick={fetchDetail} className="h-10 px-6 rounded-full bg-[#0C1E3A] text-white text-[13px] font-[700] inline-flex items-center gap-1.5"><RefreshCw size={14} /> Retry</button>
          <Link to="/admin/requests" className="h-10 px-6 rounded-full bg-white border border-[#0C1E3A]/10 text-[13px] font-[700] inline-flex items-center gap-1.5">Back to Requests</Link>
        </div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="bg-white rounded-[20px] border border-[#0C1E3A]/5 p-10 text-center max-w-[520px] mx-auto mt-8 shadow-sm">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FEF2F2] border border-red-200 grid place-items-center text-red-600"><FileSearch size={22} /></div>
        <div className="mt-4 text-[18px] font-[800] tracking-[-0.01em]">Request not found</div>
        <p className="mt-2 text-[13px] leading-6 text-[#5B6B85] max-w-[380px] mx-auto">
          <span className="mono font-[700] text-[#0C1E3A]">{id}</span> does not exist. It may have been deleted or the ID is incorrect. Data is stored in MongoDB.
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <Link to="/admin/requests" className="h-10 px-6 rounded-full bg-[#0C1E3A] text-white text-[13px] font-[700] inline-flex items-center gap-1.5"><ArrowLeft size={14} /> Requests</Link>
          <Link to="/admin/dashboard" className="h-10 px-6 rounded-full bg-white border border-[#0C1E3A]/10 text-[13px] font-[700] inline-flex items-center gap-1.5">Dashboard</Link>
        </div>
      </div>
    )
  }

  const canMarkInReview = request.status === 'NEW'
  const hasResult = !!verification
  const isCompleted = request.status === 'COMPLETED'

  return (
    <div className="space-y-6 overflow-x-hidden">
      <Link to="/admin/requests" className="inline-flex items-center gap-1.5 text-[13px] font-[600] text-[#5B6B85] hover:text-[#0C1E3A]"><ArrowLeft size={14} /> Back to Requests</Link>

      <div className="bg-white rounded-[20px] border border-[#0C1E3A]/5 shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-5 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="mono text-[18px] font-[900] tracking-[0.04em]">{request.requestId}</span>
              <button onClick={copyId} aria-label="Copy Request ID" className="w-7 h-7 rounded-full bg-[#F1F5F9] border border-[#0C1E3A]/10 grid place-items-center text-[#5B6B85] hover:bg-white active:scale-95 transition">
                {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
              </button>
              <span className={`rounded-full border px-3 py-1 text-[11px] font-[800] tracking-wide ${badge(request.status)}`}>{(STATUS_LABEL as any)[request.status]}</span>
              {hasResult && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 text-[11px] font-[800]"><BadgeCheck size={12} /> Result: {(STATUS_LABEL as any)[verification!.outcome]}</span>}
            </div>
            <div className="text-[12px] text-[#5B6B85] mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
              <span className="inline-flex items-center gap-1"><Clock size={12} /> Created {new Date(request.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              <span className="inline-flex items-center gap-1"><History size={12} /> Updated {new Date((request as any).updatedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              {completedAt && <span className="inline-flex items-center gap-1 text-emerald-700 font-[700]"><CheckCircle2 size={12} /> Completed {new Date(completedAt).toLocaleString('en-GB')}</span>}
            </div>
          </div>
          <div className="flex gap-2 items-center shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-[700] bg-[#F1F5F9] border border-[#0C1E3A]/10 rounded-full px-3 py-1.5"><ShieldCheck size={12} className="text-[#0F766E]" /> MongoDB • HttpOnly</span>
            <button onClick={fetchDetail} aria-label="Refresh" className="w-9 h-9 rounded-full bg-white border border-[#0C1E3A]/10 grid place-items-center hover:bg-[#F8FAFC] active:scale-95"><RefreshCw size={14} /></button>
          </div>
        </div>
        <div className="px-5 sm:px-6 py-3 bg-[#F8FAFC] border-y border-[#0C1E3A]/5 flex flex-wrap items-center gap-3 text-[12px]">
          <span className="font-[700]">Status flow:</span>
          <span className="mono text-[11px] bg-white border border-[#0C1E3A]/10 rounded-full px-2.5 py-1">NEW → IN REVIEW → RESULT → COMPLETED</span>
          <span className="text-[#5B6B85] hidden sm:inline">Manual verification • Resend available after COMPLETED</span>
          {isCompleted && <span className="ml-auto inline-flex items-center gap-1 text-emerald-700 font-[700]"><CheckCircle2 size={12} /> Completed</span>}
        </div>
        {(saveOk || saveError) && (
          <div className={`mx-5 sm:mx-6 my-3 rounded-xl border px-4 py-3 flex gap-2.5 text-[13px] leading-5 ${saveOk ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-[#FEF2F2] border-red-200 text-[#7F1D1D]'}`}>
            {saveOk ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />}
            <span className="font-[500]">{saveOk || saveError}</span>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          <div className="bg-white rounded-[18px] border border-[#0C1E3A]/5 shadow-sm overflow-hidden">
            <div className="px-5 sm:px-6 h-11 flex items-center justify-between bg-[#0C1E3A] text-white">
              <span className="text-[13px] font-[800] flex items-center gap-2"><User size={14} /> User Information</span>
              <button onClick={() => setReveal(!reveal)} className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-white/10 border border-white/15 text-[11px] font-[700] hover:bg-white/15 active:scale-[0.98]">
                {reveal ? <><EyeOff size={12} /> Hide sensitive</> : <><Eye size={12} /> Reveal sensitive</>}
              </button>
            </div>
            <div className="p-5 sm:p-6 grid gap-4 text-[13px]">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-xl bg-[#F8FAFC] border border-[#0C1E3A]/5 p-4"><div className="text-[11px] font-[800] tracking-[0.08em] text-[#5B6B85]">FULL NAME</div><div className="font-[700] mt-1 break-words">{request.fullName}</div></div>
                <div className="rounded-xl bg-[#F8FAFC] border border-[#0C1E3A]/5 p-4"><div className="text-[11px] font-[800] tracking-[0.08em] text-[#5B6B85]">EMAIL</div><div className="font-[600] break-all mt-1 inline-flex items-center gap-1"><Mail size={12} className="text-[#0F766E] shrink-0" /> {request.email}</div></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-xl bg-amber-50/60 border border-amber-200 p-4"><div className="text-[11px] font-[800] tracking-[0.08em] text-[#92400E] flex items-center gap-1"><ShieldCheck size={12} /> CNIC</div><div className="mono font-[700] mt-1 break-all">{reveal ? (request as any).cnic.replace(/(\d{5})(\d{7})(\d{1})/, '$1-$2-$3') : maskCNIC((request as any).cnic)}</div><div className="text-[11px] text-[#92400E]/70 mt-1">HttpOnly session • Masked by default</div></div>
                <div className="rounded-xl bg-amber-50/60 border border-amber-200 p-4"><div className="text-[11px] font-[800] tracking-[0.08em] text-[#92400E] flex items-center gap-1"><Phone size={12} /> MOBILE</div><div className="mono font-[700] mt-1">{reveal ? (request as any).mobile.replace(/(\d{4})(\d{7})/, '$1-$2') : maskMobile((request as any).mobile)}</div><div className="text-[11px] text-[#92400E]/70 mt-1">Never in URL • Server-protected</div></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[18px] border border-[#0C1E3A]/5 shadow-sm overflow-hidden">
            <div className="px-5 sm:px-6 h-11 flex items-center gap-2 bg-[#F8FAFC] border-b border-[#0C1E3A]/5 text-[13px] font-[800]"><Car size={14} /> Vehicle & Violation</div>
            <div className="p-5 sm:p-6 grid gap-4 text-[13px]">
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-[#0C1E3A]/10 bg-[#FEFCE8] p-3"><div className="text-[11px] font-[800] tracking-[0.08em] text-[#5B6B85]">REGISTRATION</div><div className="mono font-[800] text-[15px] mt-1 break-all">{request.vehicleRegistrationNumber}</div></div>
                <div className="rounded-xl bg-[#F8FAFC] border border-[#0C1E3A]/5 p-3"><div className="text-[11px] font-[700] text-[#5B6B85]">TYPE</div><div className="font-[600] mt-1">{request.vehicleType}</div></div>
                <div className="rounded-xl bg-[#F8FAFC] border border-[#0C1E3A]/5 p-3"><div className="text-[11px] font-[700] text-[#5B6B85]">MAKE / COLOR</div><div className="font-[600] mt-1 break-words">{(request as any).vehicleMake || '—'} {(request as any).vehicleColor ? `• ${(request as any).vehicleColor}` : ''}</div></div>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-[#F8FAFC] border border-[#0C1E3A]/5 p-3"><div className="text-[11px] font-[700] text-[#5B6B85]">VIOLATION DATE</div><div className="font-[600] mt-1">{(request as any).violationDate ? new Date((request as any).violationDate).toLocaleDateString('en-GB') : '—'}</div></div>
                <div className="rounded-xl bg-[#F8FAFC] border border-[#0C1E3A]/5 p-3"><div className="text-[11px] font-[700] text-[#5B6B85]">VIOLATION TIME</div><div className="font-[600] mt-1">{(request as any).violationTime || '—'}</div></div>
                <div className="rounded-xl bg-[#F8FAFC] border border-[#0C1E3A]/5 p-3"><div className="text-[11px] font-[700] text-[#5B6B85]">AREA / LOCATION</div><div className="font-[600] mt-1 flex items-start gap-1 break-words"><MapPin size={12} className="text-[#0F766E] mt-0.5 shrink-0" /> <span>{(request as any).area || '—'}</span></div></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#F8FAFC] border border-[#0C1E3A]/5 p-3"><div className="text-[11px] font-[700] text-[#5B6B85]">EXISTING CHALLAN / REF</div><div className="mono font-[600] mt-1 break-all">{(request as any).challanRef || '—'}</div></div>
                <div className="rounded-xl bg-[#F8FAFC] border border-[#0C1E3A]/5 p-3"><div className="text-[11px] font-[700] text-[#5B6B85]">USER NOTES</div><div className="leading-5 mt-1 bg-white border border-[#0C1E3A]/5 rounded-lg px-3 py-2 min-h-[44px] break-words">{(request as any).notes || 'No notes'}</div></div>
              </div>
            </div>
          </div>

          <div className="rounded-[18px] bg-[#0C1E3A] text-white p-5 sm:p-6 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-white/5" />
            <div className="relative flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 grid place-items-center shrink-0"><ExternalLink size={18} /></div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-[800]">Manual Verification Required</div>
                <p className="text-[13px] leading-6 text-white/80 mt-1 text-pretty">Check the submitted information on the relevant external / official source, then return here to record the result. Our system does <span className="font-[700] text-white">not</span> automatically search, scrape, or connect to any external challan website.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {canMarkInReview ? (
                    <button onClick={handleMarkInReview} className="h-9 px-5 rounded-full bg-white text-[#0C1E3A] text-[13px] font-[800] inline-flex items-center gap-1.5 hover:bg-[#F1F5F9] active:scale-[0.98]">Mark as In Review <ArrowUpRight size={14} /></button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-white/10 border border-white/15 text-[12px] font-[700]"><CheckCircle2 size={14} className="text-emerald-400 shrink-0" /> {request.status === 'IN_REVIEW' ? 'In Review — ready to record result' : `Status: ${(STATUS_LABEL as any)[request.status]}`}</span>
                  )}
                  <a href="https://www.google.com/search?q=Sindh+Traffic+Police+E+Challan+official+verification" target="_blank" rel="noreferrer" className="h-9 px-4 rounded-full bg-white/10 border border-white/15 text-[12px] font-[700] inline-flex items-center gap-1.5 hover:bg-white/15 active:scale-[0.98]">Open external source <ExternalLink size={12} /></a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 min-w-0">
          <div className="bg-white rounded-[18px] border border-[#0C1E3A]/5 shadow-sm overflow-hidden">
            <div className="px-5 sm:px-6 h-11 flex items-center justify-between bg-[#F8FAFC] border-b border-[#0C1E3A]/5">
              <span className="text-[13px] font-[800] flex items-center gap-2"><ClipboardCheck size={14} /> Verification Result</span>
              <span className={`text-[11px] font-[800] rounded-full border px-2.5 py-1 shrink-0 ${hasResult ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{hasResult ? `Saved: ${(STATUS_LABEL as any)[verification!.outcome]}` : 'Awaiting result'}</span>
            </div>
            <div className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="text-[12px] font-[700] flex items-center gap-1.5">Select result <span className="text-red-600">*</span></label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {([
                    ['CHALLAN_FOUND', 'Challan Found'],
                    ['NO_CHALLAN_FOUND', 'No Challan Found'],
                    ['UNABLE_TO_VERIFY', 'Unable to Verify'],
                    ['MORE_INFORMATION_REQUIRED', 'More Info Required'],
                  ] as const).map(([v, l]) => (
                    <button key={v} onClick={() => { setOutcome(v); setFieldErrors({}); setSaveError(null) }} className={`h-10 rounded-xl border text-[12px] font-[700] transition active:scale-[0.98] ${outcome === v ? 'bg-[#0C1E3A] text-white border-[#0C1E3A] shadow' : 'bg-white border-[#0C1E3A]/10 hover:bg-[#F8FAFC] hover:border-[#0C1E3A]/15'}`}>{l}</button>
                  ))}
                </div>
                {fieldErrors.outcome && <p className="mt-2 text-[12px] font-medium text-red-600 flex items-center gap-1"><AlertCircle size={12} /> {fieldErrors.outcome}</p>}
                <p className="mt-2 text-[11px] text-[#5B6B85] flex gap-1"><Info size={12} className="mt-0.5 shrink-0" /> Determines the email template. Choose based on manual external check.</p>
              </div>

              {outcome === 'CHALLAN_FOUND' && (
                <div className="grid gap-3 pt-3 border-t border-[#0C1E3A]/5">
                  <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 text-[11px] font-[600] leading-5 text-amber-800 flex gap-1.5"><AlertTriangle size={12} className="mt-0.5 shrink-0" /> Fill exactly as on the official source — this appears in the user email.</div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-[700]">Challan Number <span className="text-red-600">*</span></label>
                      <input value={f.challanNumber} onChange={e => setF({ ...f, challanNumber: e.target.value })} placeholder="KHI-E-123456" className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] mono outline-none focus:ring-2 ${fieldErrors.challanNumber ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-[#0C1E3A]/15 focus:border-[#0C1E3A] focus:ring-[#0C1E3A]/10'}`} />
                      {fieldErrors.challanNumber && <p className="mt-1 text-[11px] text-red-600 flex items-center gap-1"><AlertCircle size={11} /> {fieldErrors.challanNumber}</p>}
                    </div>
                    <div><label className="text-[11px] font-[700]">Violation</label><input value={f.violation} onChange={e => setF({ ...f, violation: e.target.value })} placeholder="Red signal / Overspeed" className="mt-1 w-full h-9 rounded-xl border border-[#0C1E3A]/15 px-3 text-[13px] outline-none focus:border-[#0C1E3A] focus:ring-2 focus:ring-[#0C1E3A]/10" /></div>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div><label className="text-[11px] font-[700]">Date</label><input type="date" value={f.challanDate} onChange={e => setF({ ...f, challanDate: e.target.value })} className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] outline-none focus:border-[#0C1E3A] ${fieldErrors.challanDate ? 'border-red-300' : 'border-[#0C1E3A]/15'}`} />{fieldErrors.challanDate && <p className="text-[11px] text-red-600 mt-1">{fieldErrors.challanDate}</p>}</div>
                    <div><label className="text-[11px] font-[700]">Time</label><input type="time" value={f.challanTime} onChange={e => setF({ ...f, challanTime: e.target.value })} className="mt-1 w-full h-9 rounded-xl border border-[#0C1E3A]/15 px-3 text-[13px] outline-none focus:border-[#0C1E3A]" /></div>
                    <div><label className="text-[11px] font-[700]">Fine Amount (Rs.)</label><input value={f.fineAmount} onChange={e => setF({ ...f, fineAmount: e.target.value })} placeholder="1500" inputMode="numeric" className={`mt-1 w-full h-9 rounded-xl border px-3 text-[13px] mono outline-none focus:ring-2 ${fieldErrors.fineAmount ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-[#0C1E3A]/15 focus:border-[#0C1E3A] focus:ring-[#0C1E3A]/10'}`} />{fieldErrors.fineAmount && <p className="text-[11px] text-red-600 mt-1">{fieldErrors.fineAmount}</p>}</div>
                  </div>
                  <div><label className="text-[11px] font-[700]">Location</label><input value={f.location} onChange={e => setF({ ...f, location: e.target.value })} placeholder="Shahrah-e-Faisal, Karsaz" className="mt-1 w-full h-9 rounded-xl border border-[#0C1E3A]/15 px-3 text-[13px] outline-none focus:border-[#0C1E3A]" /></div>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div><label className="text-[11px] font-[700]">Due Date</label><input type="date" value={f.dueDate} onChange={e => setF({ ...f, dueDate: e.target.value })} className="mt-1 w-full h-9 rounded-xl border border-[#0C1E3A]/15 px-3 text-[13px] outline-none focus:border-[#0C1E3A]" /></div>
                    <div><label className="text-[11px] font-[700]">Payment Status</label><select value={f.paymentStatus} onChange={e => setF({ ...f, paymentStatus: e.target.value })} className="mt-1 w-full h-9 rounded-xl border border-[#0C1E3A]/15 px-3 text-[13px] outline-none bg-white focus:border-[#0C1E3A]"><option value="">Select</option><option>Unpaid</option><option>Paid</option><option>Overdue</option></select></div>
                    <div><label className="text-[11px] font-[700]">Reference / PSID</label><input value={f.referencePsid} onChange={e => setF({ ...f, referencePsid: e.target.value })} placeholder="PSID / Ref" className="mt-1 w-full h-9 rounded-xl border border-[#0C1E3A]/15 px-3 text-[13px] mono outline-none focus:border-[#0C1E3A]" /></div>
                  </div>
                  <div><label className="text-[11px] font-[700]">Result Notes</label><textarea value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} rows={3} placeholder="Guidance: where to pay, deadline…" className="mt-1 w-full rounded-xl border border-[#0C1E3A]/15 px-3 py-2 text-[13px] outline-none resize-none focus:border-[#0C1E3A]" /></div>
                </div>
              )}

              {outcome && outcome !== 'CHALLAN_FOUND' && (
                <div className="pt-3 border-t border-[#0C1E3A]/5 space-y-2">
                  <label className="text-[11px] font-[700]">{outcome === 'MORE_INFORMATION_REQUIRED' ? 'What information is required? *' : outcome === 'UNABLE_TO_VERIFY' ? 'Reason — why unable to verify? *' : 'Notes / explanation *'}</label>
                  <textarea value={otherNotes} onChange={e => { setOtherNotes(e.target.value); if (fieldErrors.otherNotes) setFieldErrors(prev => ({ ...prev, otherNotes: '' })) }} rows={4} placeholder={outcome === 'MORE_INFORMATION_REQUIRED' ? 'e.g., Please reply with clearer RC photo and confirm plate…' : outcome === 'UNABLE_TO_VERIFY' ? 'e.g., Portal unavailable / mismatch — recommend Excise…' : 'e.g., No active challan as of verification time…'} className={`w-full rounded-xl border px-3 py-2 text-[13px] leading-6 outline-none resize-none focus:ring-2 ${fieldErrors.otherNotes ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-[#0C1E3A]/15 focus:border-[#0C1E3A] focus:ring-[#0C1E3A]/10'}`} />
                  {fieldErrors.otherNotes ? <p className="text-[11px] text-red-600 flex items-center gap-1"><AlertCircle size={11} /> {fieldErrors.otherNotes}</p> : <p className="text-[11px] text-[#5B6B85]">Sent verbatim to user — keep clear. Private notes below are never sent.</p>}
                </div>
              )}

              <button disabled={!outcome || saving} onClick={handleSaveResult} className="w-full h-10 rounded-full bg-[#0C1E3A] hover:bg-[#0A1933] text-white text-[13px] font-[800] inline-flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition">
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><CheckCircle2 size={14} /> Save Verification Result</>}
              </button>
              {verification && !saveOk && !saveError && <div className="text-[11px] text-[#5B6B85] flex gap-1.5"><CheckCircle2 size={12} className="text-emerald-600 mt-0.5 shrink-0" /> Last saved {new Date(verification!.updatedAt).toLocaleString('en-GB')} by {verification!.updatedBy}</div>}
            </div>
          </div>

          <div className="bg-white rounded-[18px] border border-[#0C1E3A]/5 shadow-sm overflow-hidden">
            <div className="px-5 sm:px-6 h-11 flex items-center gap-2 bg-amber-50 border-b border-amber-100 text-[13px] font-[800] text-amber-900"><StickyNote size={14} /> Internal Notes <span className="ml-auto text-[11px] font-[600] bg-white border border-amber-200 rounded-full px-2.5 py-1 inline-flex items-center gap-1"><Lock size={10} /> Private — never emailed</span></div>
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex gap-2">
                <input value={noteText} onChange={e => setNoteText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddNote()} placeholder="Private note… e.g., checked at 11:42am, source X" className="flex-1 min-w-0 h-10 rounded-xl border border-[#0C1E3A]/15 px-3 text-[13px] outline-none focus:border-[#0C1E3A] focus:ring-2 focus:ring-[#0C1E3A]/10" />
                <button onClick={handleAddNote} disabled={!noteText.trim() || noteSaving} className="h-10 px-4 rounded-full bg-[#0C1E3A] text-white text-[12px] font-[800] disabled:opacity-40 inline-flex items-center gap-1 shrink-0 active:scale-95">
                  {noteSaving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add
                </button>
              </div>
              <div className="grid gap-2 max-h-[260px] overflow-auto pr-1">
                {internalNotes.length === 0 ? <div className="text-[12px] text-[#5B6B85] text-center py-6 border border-dashed rounded-xl">No internal notes yet. Admin-only.</div> : internalNotes.map(n => (
                  <div key={n.id} className="rounded-xl bg-[#F8FAFC] border border-[#0C1E3A]/5 p-3">
                    <div className="text-[12px] leading-5 break-words">{n.text}</div>
                    <div className="text-[11px] text-[#5B6B85] mt-1 break-words">{n.adminName} • {n.adminEmail} • {new Date(n.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[18px] border border-[#0C1E3A]/5 shadow-sm overflow-hidden">
            <div className="px-5 sm:px-6 h-11 flex items-center justify-between bg-[#EFF6FF] border-b border-blue-100">
              <span className="text-[13px] font-[800] flex items-center gap-2"><Mail size={14} /> Email to User</span>
              <span className="text-[11px] font-[700] bg-white border border-blue-200 rounded-full px-2.5 py-1 mono truncate max-w-[160px]">{request.email}</span>
            </div>
            <div className="p-5 sm:p-6 space-y-4">
              <div className="rounded-xl bg-[#F8FAFC] border border-[#0C1E3A]/5 p-3 text-[12px] space-y-2">
                <div className="flex items-center justify-between gap-2"><span className="font-[700] shrink-0">Recipient</span><span className="mono font-[600] truncate">{request.email}</span></div>
                <div className="flex items-center justify-between gap-2"><span className="font-[700]">Status</span><span className={`rounded-full border px-2.5 py-1 text-[11px] font-[800] ${badge(request.status)}`}>{(STATUS_LABEL as any)[request.status]}</span></div>
                {hasResult && <div className="flex items-center justify-between gap-2"><span className="font-[700]">Result</span><span className={`rounded-full border px-2.5 py-1 text-[11px] font-[800] ${badge(verification!.outcome)}`}>{(STATUS_LABEL as any)[verification!.outcome]}</span></div>}
              </div>

              <div>
                <label className="text-[11px] font-[700] flex items-center gap-1.5">Subject <span className="text-red-600">*</span> <span className="ml-auto text-[10px] font-[600] text-[#5B6B85]">Editable</span></label>
                <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} className="mt-1 w-full h-10 rounded-xl border border-[#0C1E3A]/15 px-3 text-[13px] font-[600] outline-none focus:border-[#0C1E3A] focus:ring-2 focus:ring-[#0C1E3A]/10" />
              </div>
              <div>
                <label className="text-[11px] font-[700] flex items-center gap-1.5">Message <span className="text-red-600">*</span> <span className="ml-auto text-[10px] font-[600] text-[#5B6B85]">{emailBody.length} chars</span></label>
                <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={10} className="mt-1 w-full rounded-xl border border-[#0C1E3A]/15 px-3 py-2 text-[13px] leading-6 outline-none resize-none focus:border-[#0C1E3A] focus:ring-2 focus:ring-[#0C1E3A]/10" />
              </div>

              {hasResult && verification?.outcome === 'CHALLAN_FOUND' && (
                <div className="rounded-xl bg-[#F8FAFC] border border-[#0C1E3A]/5 p-3">
                  <div className="text-[11px] font-[800] tracking-[0.06em] text-[#5B6B85]">VERIFICATION SNAPSHOT IN EMAIL</div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
                    <div className="rounded-lg bg-white border border-[#0C1E3A]/5 px-3 py-2"><span className="text-[#5B6B85] text-[11px] font-[700]">CHALLAN #</span><div className="mono font-[700] break-all">{verification.challanNumber || '—'}</div></div>
                    <div className="rounded-lg bg-white border border-[#0C1E3A]/5 px-3 py-2"><span className="text-[#5B6B85] text-[11px] font-[700]">VIOLATION</span><div className="font-[600] break-words">{verification.violation || '—'}</div></div>
                    <div className="rounded-lg bg-white border border-[#0C1E3A]/5 px-3 py-2"><span className="text-[#5B6B85] text-[11px] font-[700]">DATE / TIME</span><div className="font-[600]">{verification.challanDate || '—'} {verification.challanTime || ''}</div></div>
                    <div className="rounded-lg bg-white border border-[#0C1E3A]/5 px-3 py-2"><span className="text-[#5B6B85] text-[11px] font-[700]">LOCATION</span><div className="font-[600] break-words">{verification.location || '—'}</div></div>
                    <div className="rounded-lg bg-white border border-[#0C1E3A]/5 px-3 py-2"><span className="text-[#5B6B85] text-[11px] font-[700]">FINE</span><div className="mono font-[700]">{verification.fineAmount ? `Rs. ${verification.fineAmount}` : '—'}</div></div>
                    <div className="rounded-lg bg-white border border-[#0C1E3A]/5 px-3 py-2"><span className="text-[#5B6B85] text-[11px] font-[700]">DUE / STATUS / PSID</span><div className="font-[600] text-[12px] break-words">{verification.dueDate || '—'} • {verification.paymentStatus || '—'} • {verification.referencePsid || '—'}</div></div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => setShowPreview(!showPreview)} className="flex-1 h-10 rounded-full border border-[#0C1E3A]/10 bg-white text-[13px] font-[700] inline-flex items-center justify-center gap-1.5 hover:bg-[#F8FAFC] active:scale-[0.98]">
                  {showPreview ? <><EyeOff size={14} /> Hide Preview</> : <><Eye size={14} /> Preview Email</>}
                </button>
                <button disabled={sending || !hasResult || !emailSubject.trim() || !emailBody.trim()} onClick={handleSendEmail} title={!hasResult ? 'Save result first' : ''} className="flex-1 h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-[#94A3B8] disabled:opacity-60 text-white text-[13px] font-[800] inline-flex items-center justify-center gap-1.5 shadow active:scale-[0.98]">
                  {sending ? <><Loader2 size={14} className="animate-spin" /> Sending…</> : <><Send size={14} /> {isCompleted ? 'Resend Email' : 'Send Result Email'}</>}
                </button>
              </div>
              {!hasResult && <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">Save a verification result above to enable Preview & Send.</p>}

              {showPreview && (
                <div className="rounded-xl border border-[#0C1E3A]/10 bg-[#FDFDFB] p-4 space-y-3">
                  <div className="flex items-center justify-between"><div className="text-[11px] font-[800] tracking-[0.08em] text-[#5B6B85]">EMAIL PREVIEW</div><span className={`text-[11px] font-[700] rounded-full border px-2.5 py-1 ${hasResult ? badge(verification!.outcome) : 'bg-slate-50'}`}>{hasResult ? (STATUS_LABEL as any)[verification!.outcome] : 'No result'}</span></div>
                  <div className="rounded-xl bg-white border border-[#0C1E3A]/5 p-3 text-[13px]"><div><span className="font-[700]">To:</span> <span className="mono break-all">{request.email}</span></div><div className="mt-1 break-words"><span className="font-[700]">Subject:</span> {emailSubject}</div></div>
                  <div className="rounded-xl bg-white border border-[#0C1E3A]/10 overflow-hidden">
                    <div className="px-3 py-2 bg-[#0C1E3A] text-white text-[11px] font-[700] tracking-[0.06em]">MESSAGE</div>
                    <div className="p-3 whitespace-pre-wrap text-[13px] leading-6 text-[#0C1E3A] break-words">{emailBody}</div>
                  </div>
                  {hasResult && <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-[12px] leading-5 text-emerald-900 flex gap-2"><CheckCircle2 size={14} className="shrink-0 mt-0.5" /><span>Private internal notes are <span className="font-[800]">never</span> included in this email.</span></div>}
                </div>
              )}

              {sendSuccess && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex gap-2.5 text-[13px] leading-5 text-emerald-900">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-[800]">Email sent ✓ — request marked COMPLETED</div>
                    <div className="text-[12px] break-words">To {request.email} • {(STATUS_LABEL as any)[verification!.outcome]} • Status: SENT {sendSuccess.messageId && `• ${sendSuccess.messageId}`}</div>
                  </div>
                </div>
              )}
              {sendError && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex gap-2.5 text-[13px] leading-5 text-red-900">
                  <XCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                  <div className="min-w-0"><div className="font-[800]">Email failed — not completed</div><div className="text-[12px] break-words">{sendError}</div><button onClick={handleSendEmail} className="mt-2 h-8 px-4 rounded-full bg-[#0C1E3A] text-white text-[12px] font-[700] inline-flex items-center gap-1 active:scale-95"><RotateCcw size={12} /> Retry</button></div>
                </div>
              )}

              {isCompleted && !sendSuccess && !sendError && (
                <div className="rounded-xl bg-[#F1F5F9] border border-[#0C1E3A]/5 p-3 flex gap-2 text-[12px] text-[#0C1E3A]"><CheckCircle2 size={14} className="text-emerald-600 mt-0.5 shrink-0" /><span>This request is <span className="font-[800]">COMPLETED</span>. You can still <span className="font-[700]">Resend</span> — new history entry with fresh timestamp.</span></div>
              )}

              <div className="pt-2 border-t border-[#0C1E3A]/5">
                <div className="text-[12px] font-[800] flex items-center gap-1.5"><History size={12} /> Email History <span className="ml-auto text-[11px] font-[600] bg-[#F1F5F9] border border-[#0C1E3A]/10 rounded-full px-2.5 py-1">{emails.length} {emails.length === 1 ? 'email' : 'emails'}</span></div>
                <div className="mt-2 grid gap-2 max-h-[360px] overflow-auto pr-1">
                  {emails.length === 0 ? <div className="text-[12px] text-[#5B6B85] text-center py-6 border border-dashed rounded-xl">No emails yet. After saving a result, preview and send — history appears here.</div> : emails.map(e => (
                    <div key={e.id} className={`rounded-xl border p-3 ${e.status === 'SENT' ? 'bg-white border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-[700] text-[12px] truncate">{e.subject}</div>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-[800] tracking-wide ${e.status === 'SENT' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{e.status}</span>
                      </div>
                      <div className="text-[11px] text-[#5B6B85] mt-1 space-y-0.5 break-words">
                        <div>To <span className="mono font-[600]">{e.to}</span> • {e.resultType || e.templateId || '—'}</div>
                        <div>{new Date(e.sentAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })} • by {e.sentBy} {e.messageId && `• ${e.messageId}`}</div>
                      </div>
                      {e.error && <div className="mt-2 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-2 py-1">{e.error}</div>}
                      <details className="mt-2"><summary className="text-[11px] font-[700] cursor-pointer text-[#0C1E3A] hover:underline">View message</summary><div className="mt-2 whitespace-pre-wrap text-[12px] leading-5 bg-[#F8FAFC] border border-[#0C1E3A]/5 rounded-lg p-2.5 break-words">{e.body}</div></details>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-[#0C1E3A] text-white rounded-full px-4 py-2.5 text-[13px] font-[600] shadow-[0_12px_32px_rgba(12,30,58,0.22)] flex items-center gap-2">
          <Info size={14} className="text-[#7EE8DC]" /> {toast}
        </div>
      )}
    </div>
  )
}
