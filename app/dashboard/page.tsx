"use client"
import { useEffect, useState } from "react"
import Link from "next/link"

interface Loan {
  id: string; status: string; loanType: string; loanAmount: number | null
  borrowerRel: { firstName: string | null; lastName: string | null } | null
  propertyRel: { address: string | null } | null
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
function addr(l: Loan) { return l.propertyRel?.address || "—" }
function condProgress(l: Loan) { const t = l.conditions.length; const c = l.conditions.filter(x => x.status === "CLEARED").length; return { total: t, cleared: c } }

export default function DashboardPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [view, setView] = useState<"pipeline" | "list">("pipeline")
  const [showTaskSettings, setShowTaskSettings] = useState(false)
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <div className="flex gap-3">
          {user?.role !== 'BORROWER' && (
            <button 
              onClick={() => setShowTaskSettings(true)}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Task Settings
            </button>
          )}
          <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden">
            <button onClick={() => setView("pipeline")} className={`px-4 py-2 text-sm font-medium ${view === "pipeline" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}>Pipeline</button>
            <button onClick={() => setView("list")} className={`px-4 py-2 text-sm font-medium ${view === "list" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}>List</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Loans", value: stats.total },
          { label: "Pipeline Value", value: fmt(stats.pipeline) },
          { label: "Funded YTD", value: fmt(stats.funded) },
          { label: "My Tasks", value: stats.myTasks, color: stats.myTasks > 0 ? "text-blue-600" : undefined },
          { label: "Overdue Tasks", value: stats.overdueTasks, color: stats.overdueTasks > 0 ? "text-red-600" : undefined },
          { label: "Open Conditions", value: stats.openConditions },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color || ''}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {view === "pipeline" ? (
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

      {showTaskSettings && (
        <TaskSettingsModal 
          user={user}
          onClose={() => setShowTaskSettings(false)} 
        />
      )}
    </div>
  )
}

function TaskSettingsModal({ user, onClose }: any) {
  const [settings, setSettings] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/task-reminder-settings").then(r => r.json()),
      fetch("/api/users").then(r => r.json())
    ]).then(([settingsData, usersData]) => {
      setSettings(settingsData || {
        enabled: false,
        frequency: 'DAILY',
        recipientUserIds: []
      })
      setUsers(usersData)
      setLoading(false)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/task-reminder-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    })
    onClose()
  }

  if (loading) return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="text-center">Loading...</div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Task Reminder Settings</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="enabled"
              checked={settings.enabled}
              onChange={e => setSettings({...settings, enabled: e.target.checked})}
              className="mr-2"
            />
            <label htmlFor="enabled" className="text-sm">Enable task reminders</label>
          </div>

          {settings.enabled && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Frequency</label>
                <select
                  value={settings.frequency}
                  onChange={e => setSettings({...settings, frequency: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="DAILY">Daily</option>
                  <option value="EVERY_2_DAYS">Every 2 Days</option>
                  <option value="EVERY_3_DAYS">Every 3 Days</option>
                  <option value="WEEKDAYS_ONLY">Weekdays Only</option>
                  <option value="WEEKLY">Weekly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Send reminders to:</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                  {users.map((u: any) => (
                    <div key={u.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`user-${u.id}`}
                        checked={settings.recipientUserIds.includes(u.id)}
                        onChange={e => {
                          const ids = settings.recipientUserIds
                          if (e.target.checked) {
                            setSettings({...settings, recipientUserIds: [...ids, u.id]})
                          } else {
                            setSettings({...settings, recipientUserIds: ids.filter((id: string) => id !== u.id)})
                          }
                        }}
                        className="mr-2"
                      />
                      <label htmlFor={`user-${u.id}`} className="text-sm">
                        {u.name} ({u.email}) - {u.role}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
