import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ArrowUpRight, FileSearch, Clock3, CheckCircle2, Award, Ban, AlertTriangle, Eye, Mail, ArrowRight, RefreshCw, ShieldCheck, TrendingUp, Database, AlertCircle, LogOut } from 'lucide-react'
import { STATUS_LABEL } from '../lib/requestModel'
import type { VerificationRequest } from '../lib/requestModel'

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    NEW: 'bg-amber-50 text-amber-700 border-amber-200',
    IN_REVIEW: 'bg-blue-50 text-blue-700 border-blue-200',
    CHALLAN_FOUND: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    NO_CHALLAN_FOUND: 'bg-slate-50 text-slate-700 border-slate-200',
    UNABLE_TO_VERIFY: 'bg-red-50 text-red-700 border-red-200',
    MORE_INFORMATION_REQUIRED: 'bg-orange-50 text-orange-700 border-orange-200',
    COMPLETED: 'bg-[#0C1E3A] text-white border-[#0C1E3A]',
  }
  return map[s] || 'bg-slate-50 text-slate-700 border-slate-200'
}

interface Stats {
  total: number
  new: number
  inReview: number
  completed: number
  challanFound: number
  noChallanFound: number
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recent, setRecent] = useState<VerificationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dbWarning, setDbWarning] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    setDbWarning(null)
    try {
      const [statsRes, recentRes] = await Promise.all([
        fetch('/api/admin/stats', { credentials: 'include' }),
        fetch('/api/admin/requests?page=1&pageSize=6&sort=newest', { credentials: 'include' }),
      ])

      // Handle auth
      if (statsRes.status === 401 || recentRes.status === 401) {
        navigate('/admin/login', { replace: true, state: { msg: 'Session expired. Please sign in again.' } })
        return
      }

      const statsJson = await statsRes.json().catch(() => null)
      const recentJson = await recentRes.json().catch(() => null)

      if (!statsRes.ok || !statsJson?.success) {
        const msg = statsJson?.error?.message || `Stats failed (${statsRes.status})`
        if (msg.toLowerCase().includes('not configured') || msg.toLowerCase().includes('mongodb')) {
          setDbWarning(msg)
        } else {
          throw new Error(msg)
        }
      } else {
        setStats(statsJson.data)
        if (statsJson.data?.note) setDbWarning(statsJson.data.note)
      }

      if (!recentRes.ok || !recentJson?.success) {
        const msg = recentJson?.error?.message || `Requests failed (${recentRes.status})`
        if (msg.toLowerCase().includes('not configured')) {
          setDbWarning(msg)
        } else {
          throw new Error(msg)
        }
      } else {
        setRecent(recentJson.data?.items || [])
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-[800] tracking-[0.12em] text-[#0F766E]">
            <span className="w-6 h-px bg-[#0F766E]" /> ADMIN OVERVIEW
          </div>
          <h1 className="mt-2 text-[26px] sm:text-[30px] font-[900] tracking-[-0.03em] leading-none">Dashboard</h1>
          <p className="mt-2 text-[13.5px] leading-6 text-[#5B6B85] max-w-[600px] text-pretty">
            Overview of verification requests. Review new submissions, track progress and email results. <span className="font-[600] text-[#0C1E3A]">No automated lookup</span> — manual verification only.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link to="/admin/requests" className="h-10 px-5 rounded-full bg-[#0C1E3A] hover:bg-[#0A1933] text-white text-[13px] font-[800] inline-flex items-center gap-2 shadow-sm active:scale-[0.98] transition">
            View all requests <ArrowUpRight size={14} />
          </Link>
          <button
            onClick={fetchData}
            aria-label="Refresh"
            className="h-10 w-10 rounded-full bg-white border border-[#0C1E3A]/10 grid place-items-center hover:bg-[#F8FAFC] active:scale-[0.96] shadow-sm transition"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {dbWarning && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 flex gap-3 text-[13px] leading-5 text-amber-900">
          <Database size={16} className="shrink-0 mt-0.5" />
          <div>
            <div className="font-[800] flex items-center gap-1.5"><AlertCircle size={14} /> Database not configured — preview mode</div>
            <div className="mt-1 text-[12px] leading-5">
              Public submissions are using in-memory fallback (not persistent). Configure <span className="mono font-[700]">MONGODB_URI</span> in Vercel Environment Variables and redeploy for production persistence.
              Required: <span className="mono">MONGODB_URI</span>, <span className="mono">JWT_SECRET</span>, <span className="mono">RESEND_API_KEY</span>, <span className="mono">EMAIL_FROM</span>.
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-[#FEF2F2] border border-red-200 px-4 py-4 flex gap-3 text-[13px] leading-6 text-[#7F1D1D]">
          <AlertTriangle size={18} className="shrink-0 mt-0.5 text-red-600" />
          <div className="flex-1">
            <div className="font-[800]">Failed to load dashboard</div>
            <div>{error}</div>
            <button onClick={fetchData} className="mt-3 h-8 px-4 rounded-full bg-[#0C1E3A] text-white text-[12px] font-[700]">Retry</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-[18px] bg-white border border-[#0C1E3A]/5 p-4 sm:p-5 shadow-sm animate-pulse">
              <div className="w-9 h-9 rounded-xl bg-[#F1F5F9]" />
              <div className="mt-4 h-6 w-12 bg-[#F1F5F9] rounded" />
              <div className="mt-2 h-4 w-20 bg-[#F1F5F9] rounded" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          {[
            { label: 'Total Requests', value: stats.total, sub: 'All time', icon: FileSearch, accent: 'bg-[#0C1E3A] text-white' },
            { label: 'New', value: stats.new, sub: 'Needs review', icon: AlertTriangle, accent: 'bg-amber-500 text-white' },
            { label: 'In Review', value: stats.inReview, sub: 'Being checked', icon: Clock3, accent: 'bg-blue-600 text-white' },
            { label: 'Completed', value: stats.completed, sub: 'Emailed', icon: CheckCircle2, accent: 'bg-[#0C1E3A] text-white' },
            { label: 'Challan Found', value: stats.challanFound, sub: 'Verified hits', icon: Award, accent: 'bg-emerald-600 text-white' },
            { label: 'No Challan', value: stats.noChallanFound, sub: 'No record', icon: Ban, accent: 'bg-slate-700 text-white' },
          ].map(c => (
            <div key={c.label} className="rounded-[18px] bg-white border border-[#0C1E3A]/5 p-4 sm:p-5 shadow-sm hover:shadow-[0_8px_24px_rgba(12,30,58,0.06)] hover:-translate-y-0.5 transition-all group">
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-xl grid place-items-center shadow-sm ${c.accent} group-hover:scale-105 transition-transform`}><c.icon size={16} /></div>
                <span className="text-[10px] font-[800] tracking-[0.08em] text-[#94A3B8]">{c.sub.toUpperCase()}</span>
              </div>
              <div className="mt-3.5 text-[28px] font-[900] tracking-[-0.02em] leading-none">{c.value}</div>
              <div className="text-[13px] font-[700] text-[#0C1E3A] mt-1">{c.label}</div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="bg-white rounded-[20px] border border-[#0C1E3A]/5 shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 h-[56px] flex items-center justify-between border-b border-[#0C1E3A]/5 bg-[#FDFDFB]">
          <h2 className="text-[14px] font-[800] flex items-center gap-2"><TrendingUp size={14} className="text-[#0F766E]" /> Recent requests</h2>
          <Link to="/admin/requests" className="text-[13px] font-[700] text-[#0C1E3A] inline-flex items-center gap-1 hover:text-[#0F766E] hover:underline underline-offset-4">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[760px] text-[13px]">
            <thead className="bg-[#F8FAFC] text-[11px] font-[800] tracking-[0.08em] text-[#5B6B85]">
              <tr>
                <th className="text-left px-4 sm:px-6 py-3 font-[800]">REQUEST ID</th>
                <th className="text-left px-4 py-3 font-[800]">USER</th>
                <th className="text-left px-4 py-3 font-[800]">VEHICLE</th>
                <th className="text-left px-4 py-3 font-[800]">EMAIL</th>
                <th className="text-left px-4 py-3 font-[800]">DATE</th>
                <th className="text-left px-4 py-3 font-[800]">STATUS</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0C1E3A]/5">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-[#F1F5F9] rounded" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-20 bg-[#F1F5F9] rounded" /></td>
                    <td className="px-4 py-4"><div className="h-5 w-20 bg-[#F1F5F9] rounded" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-32 bg-[#F1F5F9] rounded" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-16 bg-[#F1F5F9] rounded" /></td>
                    <td className="px-4 py-4"><div className="h-5 w-16 bg-[#F1F5F9] rounded-full" /></td>
                    <td className="px-4 py-4"><div className="h-8 w-16 bg-[#F1F5F9] rounded-full" /></td>
                  </tr>
                ))
              ) : recent.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="max-w-[420px] mx-auto">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-[#F1F5F9] border border-[#0C1E3A]/5 grid place-items-center text-[#64748B]"><Mail size={18} /></div>
                      <div className="mt-3 text-[14px] font-[800]">No requests yet</div>
                      <p className="mt-1 text-[13px] leading-5 text-[#5B6B85]">Submit a verification on the public site to see it here. Data is read directly from MongoDB — no demo seeding.</p>
                    </div>
                  </td>
                </tr>
              ) : recent.map(r => (
                <tr key={r.requestId} className="hover:bg-[#F8FAFC]/70 transition-colors">
                  <td className="px-4 sm:px-6 py-4 mono font-[700] tracking-wide text-[#0C1E3A] whitespace-nowrap">{r.requestId}</td>
                  <td className="px-4 py-4 font-[600] whitespace-nowrap">{r.fullName}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="mono font-[700] bg-[#FEFCE8] border border-[#0C1E3A]/15 rounded-lg px-2 py-1 text-[12px]">{r.vehicleRegistrationNumber}</span>
                    <span className="text-[#5B6B85] text-[12px] ml-2">{r.vehicleType}</span>
                  </td>
                  <td className="px-4 py-4 text-[#2E4160] truncate max-w-[180px]">{r.email}</td>
                  <td className="px-4 py-4 text-[#5B6B85] whitespace-nowrap text-[12.5px]">{new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-[800] tracking-wide ${statusBadge(r.status)}`}>{(STATUS_LABEL as any)[r.status] || r.status}</span>
                  </td>
                  <td className="px-4 py-4">
                    <Link to={`/admin/requests/${r.requestId}`} className="inline-flex items-center gap-1 h-8 px-3.5 rounded-full bg-white border border-[#0C1E3A]/10 text-[12px] font-[700] hover:bg-[#F8FAFC] hover:border-[#0C1E3A]/15 active:scale-[0.97] transition">
                      <Eye size={12} /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 sm:px-6 py-3 bg-[#F8FAFC] border-t border-[#0C1E3A]/5 flex flex-wrap items-center gap-3 text-[11px] font-medium text-[#5B6B85]">
          <span className="inline-flex items-center gap-1.5"><Search size={12} /> Search by Request ID, name, vehicle, email, mobile or CNIC on the Requests page.</span>
          <span className="hidden sm:inline-flex items-center gap-1.5 ml-auto bg-white border border-[#0C1E3A]/10 rounded-full px-2.5 py-1"><ShieldCheck size={11} className="text-[#0F766E]" /> Admin-only • MongoDB • HttpOnly</span>
        </div>
      </div>
    </div>
  )
}
