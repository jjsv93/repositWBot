"use client"
import { useEffect, useState } from "react"
import Link from "next/link"

interface Loan {
  id: string; status: string; loanType: string; loanAmount: number | null
  borrowerRel: { firstName: string | null; lastName: string | null } | null
  propertyRel: { address: string | null } | null
  conditions: { status: string }[]
}

const STATUS_COLORS: Record<string, string> = {
  LEAD: "bg-slate-100 text-slate-700", SUBMITTED: "bg-blue-50 text-blue-700",
  PROCESSING: "bg-amber-50 text-amber-700", APPROVED: "bg-emerald-50 text-emerald-700",
  CLEAR_TO_CLOSE: "bg-violet-50 text-violet-700", FUNDED: "bg-green-50 text-green-700", DEAD: "bg-red-50 text-red-600",
}
const STATUSES = ["LEAD", "SUBMITTED", "PROCESSING", "APPROVED", "CLEAR_TO_CLOSE", "FUNDED", "DEAD"]

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetch("/api/loans").then(r => r.json()).then(d => { setLoans(d); setLoading(false) }) }, [])

  async function changeStatus(id: string, status: string) {
    await fetch(`/api/loans/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) })
    setLoans(loans.map(l => l.id === id ? { ...l, status } : l))
  }

  if (loading) return <div className="p-8 flex justify-center"><div className="spinner" /></div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Loans</h1>
        <Link href="/dashboard/loans/new" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">+ Create Loan</Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-slate-200 bg-slate-50">
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Borrower</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Property</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Amount</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Conditions</th>
          </tr></thead>
          <tbody>
            {loans.map(l => {
              const name = l.borrowerRel ? `${l.borrowerRel.firstName || ""} ${l.borrowerRel.lastName || ""}`.trim() : "—"
              const cleared = l.conditions.filter(c => c.status === "CLEARED").length
              return (
                <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-5 py-3.5"><Link href={`/dashboard/loans/${l.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">{name}</Link></td>
                  <td className="px-5 py-3.5 text-sm text-slate-600 max-w-[200px] truncate">{l.propertyRel?.address || "—"}</td>
                  <td className="px-5 py-3.5 text-sm font-medium">{l.loanAmount ? `$${l.loanAmount.toLocaleString()}` : "—"}</td>
                  <td className="px-5 py-3.5">
                    <select value={l.status} onChange={e => changeStatus(l.id, e.target.value)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[l.status]}`}>
                      {STATUSES.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3.5"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${l.loanType === "BRIDGE" ? "bg-orange-50 text-orange-700" : "bg-blue-50 text-blue-700"}`}>{l.loanType}</span></td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{cleared}/{l.conditions.length}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {loans.length === 0 && <div className="text-center py-12 text-slate-400">No loans yet</div>}
      </div>
    </div>
  )
}
