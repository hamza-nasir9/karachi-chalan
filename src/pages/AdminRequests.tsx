import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Filter, Eye, ChevronLeft, ChevronRight, SlidersHorizontal, ArrowUpDown, Inbox, ShieldCheck, AlertTriangle, RefreshCw } from 'lucide-react'
import { RequestStatus, STATUS_LABEL, statusBadge as badge, type RequestStatusType, type VerificationRequest } from '../lib/requestModel'
import { getService } from '../lib/services'

const FILTERS: Array<{ label: string; value: RequestStatusType | 'ALL' }> = [
  { label: 'All', value: 'ALL' },
  { label: 'New', value: RequestStatus.NEW },
  { label: 'In Review', value: RequestStatus.IN_REVIEW },
  { label: 'Result Ready', value: RequestStatus.RESULT_READY },
  { label: 'Completed', value: RequestStatus.COMPLETED },
]

function maskCNIC(d: string) {
  const digits = String(d || '').replace(/\D/g, '')
  if (digits.length !== 13) return '•••••••••••••'
  return `${digits.slice(0, 5)}-•••••••-${digits.slice(12)}`
}
function maskMobile(d: string) {
  const digits = String(d || '').replace(/\D/g, '')
  if (digits.length !== 11) return '•••••••••••'
  return `${digits.slice(0, 4)}-•••${digits.slice(7)}`
}

export default function AdminRequests() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<RequestStatusType | 'ALL'>('ALL')
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const [items, setItems] = useState<VerificationRequest[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))
      params.set('sort', sort)
      const res = await fetch(`/api/admin/requests?${params.toString()}`, { credentials: 'include' })
      if (res.status === 401) {
        navigate('/admin/login', { replace: true, state: { msg: 'Please sign in to view requests.' } })
        return
      }
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) throw new Error(json?.error?.message || `Failed (${res.status})`)
      setItems(json.data.items || [])
      setTotal(json.data.total || 0)
    } catch (e: any) {
      setError(e.message || 'Failed to load requests')
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [search, status, page, sort, navigate])

  useEffect(() => { fetchData() }, [fetchData])

  const pages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[26px] font-[900] tracking-[-0.03em] leading-none">Requests</h1>
        <p className="text-[13.5px] text-[#5B6B85] mt-1.5 leading-6 max-w-[640px]">
          Search and filter real verification requests from <span className="font-[700] text-[#0C1E3A]">MongoDB</span>. All personal data is admin-only — CNIC & mobile masked in list, never in URL.
        </p>
      </div>

      <div className="bg-white rounded-[18px] border border-[#0C1E3A]/5 p-4 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between shadow-sm">
        <div className="relative flex-1 max-w-[560px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search: Request ID, Name, Vehicle, Challan / Complaint No., Email, Mobile, CNIC"
            className="w-full h-11 rounded-full border border-[#0C1E3A]/10 bg-[#F8FAFC] pl-10 pr-4 text-[13px] font-[500] outline-none focus:bg-white focus:border-[#0C1E3A]/20 focus:ring-4 focus:ring-[#0C1E3A]/5 placeholder:text-[#94A3B8]"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-[800] tracking-[0.08em] text-[#5B6B85]"><Filter size={12} /> FILTER</span>
          <select
            value={status}
            onChange={e => { setStatus(e.target.value as any); setPage(1) }}
            className="h-10 rounded-full border border-[#0C1E3A]/10 bg-white px-3 pr-8 text-[13px] font-[600] outline-none focus:border-[#0C1E3A]/20"
          >
            {FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <button
            onClick={() => { setSort(s => s === 'newest' ? 'oldest' : 'newest'); setPage(1) }}
            className="h-10 px-4 rounded-full border border-[#0C1E3A]/10 bg-white text-[12px] font-[700] inline-flex items-center gap-1.5 hover:bg-[#F8FAFC] active:scale-[0.98]"
          >
            <ArrowUpDown size={12} /> {sort === 'newest' ? 'Newest first' : 'Oldest first'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-[#FEF2F2] border border-red-200 px-4 py-3 flex gap-3 text-[13px] leading-5 text-[#7F1D1D]">
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-600" />
          <span className="flex-1">{error}</span>
          <button onClick={fetchData} className="shrink-0 h-8 px-3 rounded-full bg-white border border-red-200 text-[12px] font-[700] inline-flex items-center gap-1"><RefreshCw size={12} /> Retry</button>
        </div>
      )}

      <div className="bg-white rounded-[18px] border border-[#0C1E3A]/5 shadow-sm overflow-hidden">
        <div className="px-5 py-3 flex items-center justify-between text-[12px] font-medium text-[#5B6B85] bg-[#F8FAFC] border-b border-[#0C1E3A]/5">
          <span className="inline-flex items-center gap-2"><SlidersHorizontal size={12} /> {loading ? 'Loading…' : `${total} result${total !== 1 ? 's' : ''}`} {search && <>for “<span className="font-[700] text-[#0C1E3A]">{search}</span>”</>} {status !== 'ALL' && <>• {(STATUS_LABEL as any)[status]}</>}</span>
          <span className="hidden sm:inline font-[700]">Page {page} of {pages}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-[13px]">
            <thead className="bg-white text-[11px] font-[800] tracking-[0.08em] text-[#5B6B85] border-b border-[#0C1E3A]/5">
              <tr>
                <th className="text-left px-6 py-3">REQUEST ID</th>
                <th className="text-left px-4 py-3">USER</th>
                <th className="text-left px-4 py-3">SERVICE</th>
                <th className="text-left px-4 py-3">VEHICLE</th>
                <th className="text-left px-4 py-3">CONTACT</th>
                <th className="text-left px-4 py-3">DATE</th>
                <th className="text-left px-4 py-3">STATUS</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0C1E3A]/5">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-[#F1F5F9] rounded" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-20 bg-[#F1F5F9] rounded" /></td>
                    <td className="px-4 py-4"><div className="h-5 w-24 bg-[#F1F5F9] rounded-full" /></td>
                    <td className="px-4 py-4"><div className="h-5 w-20 bg-[#F1F5F9] rounded" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-32 bg-[#F1F5F9] rounded" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-16 bg-[#F1F5F9] rounded" /></td>
                    <td className="px-4 py-4"><div className="h-5 w-16 bg-[#F1F5F9] rounded-full" /></td>
                    <td className="px-4 py-4"><div className="h-8 w-16 bg-[#F1F5F9] rounded-full" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-14 text-center">
                    <div className="max-w-[420px] mx-auto">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-[#F1F5F9] border border-[#0C1E3A]/5 grid place-items-center text-[#64748B]"><Inbox size={20} /></div>
                      <div className="mt-3 text-[14px] font-[800] text-[#0C1E3A]">No matching requests</div>
                      <div className="mt-1 text-[13px] leading-5 text-[#5B6B85]">Try adjusting search or filters. Or submit a new verification on the public site — data is read directly from MongoDB.</div>
                      {(search || status !== 'ALL') && (
                        <button onClick={() => { setSearch(''); setStatus('ALL'); setPage(1) }} className="mt-4 h-9 px-4 rounded-full bg-[#0C1E3A] text-white text-[13px] font-[700]">Clear filters</button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : items.map(r => (
                <tr key={r.requestId} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-6 py-4 mono font-[700] text-[#0C1E3A] tracking-wide whitespace-nowrap">{r.requestId}</td>
                  <td className="px-4 py-4">
                    <div className="font-[700] leading-none">{r.fullName}</div>
                    <div className="text-[11px] mono text-[#64748B] mt-1 inline-flex items-center gap-1"><ShieldCheck size={10} /> {maskCNIC(String((r as any).cnic || ''))}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-[800] tracking-wide ${getService(r.requestType).tag}`}>{getService(r.requestType).badge}</span>
                  </td>
                  <td className="px-4 py-4">
                    {r.vehicleRegistrationNumber ? (
                      <>
                        <div className="mono font-[700] inline-flex bg-[#FEFCE8] border border-[#0C1E3A]/10 rounded-lg px-2 py-1 text-[12px]">{r.vehicleRegistrationNumber}</div>
                        {(r.vehicleType || r.vehicleColor) && <div className="text-[11px] text-[#5B6B85] mt-1">{r.vehicleType}{r.vehicleColor ? ` • ${r.vehicleColor}` : ''}</div>}
                      </>
                    ) : <span className="text-[#94A3B8]">—</span>}
                  </td>
                  <td className="px-4 py-4">
                    <div className="truncate max-w-[180px] font-[500] leading-none">{r.email}</div>
                    <div className="text-[11px] mono text-[#64748B] mt-1">{maskMobile(String((r as any).mobile || ''))}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-[#5B6B85] text-[12.5px]">{new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="px-4 py-4"><span className={`rounded-full border px-2.5 py-1 text-[11px] font-[800] tracking-wide whitespace-nowrap ${badge(r.status)}`}>{(STATUS_LABEL as any)[r.status]}</span></td>
                  <td className="px-4 py-4"><Link to={`/admin/requests/${r.requestId}`} className="h-8 px-3.5 rounded-full bg-[#0C1E3A] hover:bg-[#0A1933] text-white text-[12px] font-[700] inline-flex items-center gap-1 shadow-sm"> <Eye size={12} /> View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#0C1E3A]/5 bg-white">
          <span className="text-[12px] text-[#5B6B85]">
            {total === 0 ? 'No records' : `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}
          </span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="h-9 px-4 rounded-full border border-[#0C1E3A]/10 bg-white text-[13px] font-[700] disabled:opacity-40 inline-flex items-center gap-1 hover:bg-[#F8FAFC]"><ChevronLeft size={14} /> Prev</button>
            <span className="text-[13px] font-[800] min-w-[64px] text-center">{page} / {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))} className="h-9 px-4 rounded-full border border-[#0C1E3A]/10 bg-white text-[13px] font-[700] disabled:opacity-40 inline-flex items-center gap-1 hover:bg-[#F8FAFC]">Next <ChevronRight size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  )
}
