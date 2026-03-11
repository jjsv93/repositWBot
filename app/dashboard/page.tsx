"use client"
import { useEffect, useState } from "react"
import Link from "next/link"

interface Loan {
  id: string; status: string; loanType: string; loanAmount: number | null
  borrowerRel: { firstName: string | null; lastName: string | null } | null
  properties: { address: string | null }[]
  conditions: { status: string }[]
  createdAt: string
}

const STATUS_COLS = ["LEAD", "SUBMITTED", "PROCESSING", "APPROVED", "CLEAR_TO_CLOSE", "FUNDED"]
const STATUS_LABELS: Record<string, string> = { LEAD: "Lead", SUBMITTED: "Submitted", PROCESSING: "Processing", APPROVED: "Approved", CLEAR_TO_CLOSE: "CTC", FUNDED: "Funded" }
const STATUS_COLORS: Record<string, string> = {
  LEAD: "bg-slate-100 text-slate-700", SUBMITTED: "bg-blue-50 text-blue-700",
  PROCESSING: "bg-amber-50 text-amber-700", APPROVED: "bg-emerald-50 text-emerald-700",
  CLEAR_TO_CLOSE: "bg-violet-50 text-violet-700", FUNDED: "bg-green-50 text-green-700", DEAD: "bg-red-50 text-red-600",
}

function fmt(n: number | null) { return n ? `$${n.toLocaleString()}` : "—" }
function borrowerName(l: Loan) { return l.borrowerRel ? `${l.borrowerRel.firstName || ""} ${l.borrowerRel.lastName || ""}`.trim() || "—" : "—" }
function addr(l: Loan) { return l.properties?.[0]?.address || "—" }
function condProgress(l: Loan) { const t = l.conditions.length; const c = l.conditions.filter(x => x.status === "CLEARED").length; return { total: t, cleared: c } }

export default function DashboardPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [view, setView] = useState<"pipeline" | "list">("pipeline")
  
  const [loading, setLoading] = useState(true)

  useEffect(() => { 
    Promise.all([
      fetch("/api/loans").then(r => r.json()),
      fetch("/api/tasks").then(r => r.json()),
      fetch("/api/me").then(r => r.json())
    ]).then(([loansData, tasksData, userData]) => {
      setLoans(loansData)
      setTasks(tasksData.filter((t: any) => t.status === 'OPEN')) // Only open tasks
      setUser(userData)
      setLoading(false)
    })
  }, [])

  const now = new Date()
  const myTasks = tasks.filter(t => t.assignedToId === user?.id)
  const overdueTasks = myTasks.filter(t => t.dueDate && new Date(t.dueDate) < now)
  
  const stats = {
    total: loans.length,
    pipeline: loans.filter(l => l.status !== "FUNDED" && l.status !== "DEAD").reduce((s, l) => s + (l.loanAmount || 0), 0),
    funded: loans.filter(l => l.status === "FUNDED").reduce((s, l) => s + (l.loanAmount || 0), 0),
    myTasks: myTasks.length,
    overdueTasks: overdueTasks.length,
    openConditions: loans.reduce((s, l) => s + l.conditions.filter(c => c.status !== "CLEARED").length, 0),
  }

  if (loading) return <div className="p-8 flex justify-center"><div className="spinner" /></div>

  const isBorrower = user?.role === "BORROWER"

  const borrowerStats = [
    { label: "My Loans", value: stats.total },
    { label: "My Tasks", value: stats.myTasks, color: stats.myTasks > 0 ? "text-blue-600" : undefined },
    { label: "Overdue Tasks", value: stats.overdueTasks, color: stats.overdueTasks > 0 ? "text-red-600" : undefined },
    { label: "Open Conditions", value: stats.openConditions },
  ]

  const brokerStats = [
    { label: "Total Loans", value: stats.total },
    { label: "Pipeline Value", value: fmt(stats.pipeline) },
    { label: "Funded YTD", value: fmt(stats.funded) },
    { label: "My Tasks", value: stats.myTasks, color: stats.myTasks > 0 ? "text-blue-600" : undefined },
    { label: "Overdue Tasks", value: stats.overdueTasks, color: stats.overdueTasks > 0 ? "text-red-600" : undefined },
    { label: "Open Conditions", value: stats.openConditions },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{isBorrower ? "My Loans" : "Dashboard"}</h1>
        {!isBorrower && (
          <div className="flex gap-3">
            <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden">
              <button onClick={() => setView("pipeline")} className={`px-4 py-2 text-sm font-medium ${view === "pipeline" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}>Pipeline</button>
              <button onClick={() => setView("list")} className={`px-4 py-2 text-sm font-medium ${view === "list" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}>List</button>
            </div>
          </div>
        )}
      </div>

      <div className={`grid gap-4 ${isBorrower ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-4 lg:grid-cols-6"}`}>
        {(isBorrower ? borrowerStats : brokerStats).map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color || ''}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {isBorrower ? (
        /* Borrower: simple loan list with status + conditions */
        <div className="space-y-3">
          {loans.map(l => {
            const name = l.borrowerRel ? `${l.borrowerRel.firstName||""} ${l.borrowerRel.lastName||""}`.trim() : "Loan"
            const openConds = l.conditions.filter(c => c.status !== "CLEARED").length
            const totalConds = l.conditions.length
            return (
              <Link key={l.id} href={`/dashboard/loans/${l.id}`} className="block bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{l.properties?.[0]?.address || name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{l.loanAmount ? `$${l.loanAmount.toLocaleString()}` : ""} · {l.loanType}</p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${STATUS_COLORS[l.status]}`}>{l.status.replace("_"," ")}</span>
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: totalConds ? `${((totalConds - openConds) / totalConds) * 100}%` : "0%" }} />
                  </div>
                  <span className="text-xs text-slate-500">{totalConds - openConds}/{totalConds} conditions cleared</span>
                </div>
              </Link>
            )
          })}
          {loans.length === 0 && <p className="text-center py-12 text-sm text-slate-400">No loans found</p>}
        </div>
      ) : view === "pipeline" ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUS_COLS.map(status => {
            const col = loans.filter(l => l.status === status)
            return (
              <div key={status} className="min-w-[260px] flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</span>
                  <span className="text-xs text-slate-400">{col.length}</span>
                </div>
                <div className="space-y-3">
                  {col.map(loan => {
                    const cp = condProgress(loan)
                    return (
                      <Link key={loan.id} href={`/dashboard/loans/${loan.id}`}
                        className="block bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md hover:border-indigo-200 transition-all">
                        <p className="font-semibold text-sm text-slate-900 truncate">{borrowerName(loan)}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{addr(loan)}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-sm font-semibold text-slate-900">{fmt(loan.loanAmount)}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${loan.loanType === "BRIDGE" ? "bg-orange-50 text-orange-700" : "bg-blue-50 text-blue-700"}`}>{loan.loanType}</span>
                        </div>
                        {cp.total > 0 && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                              <span>Conditions</span><span>{cp.cleared}/{cp.total}</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(cp.cleared / cp.total) * 100}%` }} />
                            </div>
                          </div>
                        )}
                      </Link>
                    )
                  })}
                  {col.length === 0 && <p className="text-xs text-slate-400 text-center py-8">No loans</p>}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Borrower</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Property</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Amount</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Conditions</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
            </tr></thead>
            <tbody>
              {loans.map(loan => {
                const cp = condProgress(loan)
                return (
                  <tr key={loan.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => window.location.href = `/dashboard/loans/${loan.id}`}>
                    <td className="px-5 py-3.5 text-sm font-medium">{borrowerName(loan)}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600 max-w-[200px] truncate">{addr(loan)}</td>
                    <td className="px-5 py-3.5 text-sm font-medium">{fmt(loan.loanAmount)}</td>
                    <td className="px-5 py-3.5"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${loan.loanType === "BRIDGE" ? "bg-orange-50 text-orange-700" : "bg-blue-50 text-blue-700"}`}>{loan.loanType}</span></td>
                    <td className="px-5 py-3.5"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[loan.status]}`}>{STATUS_LABELS[loan.status] || loan.status}</span></td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{cp.cleared}/{cp.total}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-400">{new Date(loan.createdAt).toLocaleDateString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}
