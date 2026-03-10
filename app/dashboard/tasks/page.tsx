"use client"
import { useEffect, useState } from "react"
import Link from "next/link"

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [filter, setFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    Promise.all([
      fetch("/api/tasks").then(r=>r.json()),
      fetch("/api/me").then(r=>r.json()),
    ]).then(([t,u])=>{setTasks(t);setUser(u);setLoading(false)})
  }, [])

  async function toggle(id: string, status: string) {
    const newStatus = status === "COMPLETED" ? "OPEN" : "COMPLETED"
    await fetch(`/api/tasks/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ status: newStatus }) })
    setTasks(tasks.map(t => t.id === id ? {...t, status: newStatus} : t))
  }

  const now = new Date()
  const today = now.toISOString().slice(0,10)
  const filtered = tasks.filter(t => {
    if (filter === "mine") return t.assignedTo?.name === user?.name || t.assignedToId === user?.id
    if (filter === "today") return t.dueDate?.slice(0,10) === today
    if (filter === "overdue") return t.dueDate && t.status === "OPEN" && new Date(t.dueDate) < now
    return true
  })

  if (loading) return <div className="p-8 flex justify-center"><div className="spinner"/></div>

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Tasks</h1>
      <div className="flex gap-2">
        {[["all","All"],["mine","Mine"],["today","Due Today"],["overdue","Overdue"]].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter===k?"bg-indigo-600 text-white":"bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{l}</button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.map(t => {
          const overdue = t.dueDate && t.status === "OPEN" && new Date(t.dueDate) < now
          const loanName = t.loan?.borrowerRel ? `${t.loan.borrowerRel.firstName||""} ${t.loan.borrowerRel.lastName||""}`.trim() : "—"
          const completed = t.status === "COMPLETED"
          return (
            <div key={t.id} className={`flex items-center gap-3 bg-white rounded-xl border p-4 ${overdue?"border-red-200":"border-slate-200"}`}>
              <input type="checkbox" checked={completed} onChange={()=>toggle(t.id,t.status)} className="w-4.5 h-4.5 rounded border-slate-300 text-indigo-600" />
              <div className="flex-1">
                <p className={`text-sm font-medium ${completed?"line-through text-slate-400":""}`}>{t.title}</p>
                <div className="flex gap-3 mt-0.5">
                  <Link href={`/dashboard/loans/${t.loanId}`} className="text-xs text-indigo-600 hover:underline">{loanName}</Link>
                  {t.assignedTo && <span className="text-xs text-slate-400">{t.assignedTo.name}</span>}
                  {t.dueDate && <span className={`text-xs ${overdue?"text-red-600 font-medium":"text-slate-400"}`}>Due {new Date(t.dueDate).toLocaleDateString()}</span>}
                  {t.condition && <span className="text-xs text-blue-600">Condition: {t.condition.title}</span>}
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length===0 && <p className="text-center py-12 text-sm text-slate-400">No tasks found</p>}
      </div>
    </div>
  )
}
