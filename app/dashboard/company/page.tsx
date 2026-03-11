"use client"
import { useEffect, useState } from "react"

const ROLE_COLORS: Record<string,string> = { ADMIN:"bg-purple-50 text-purple-700", BROKER:"bg-blue-50 text-blue-700", PROCESSOR:"bg-amber-50 text-amber-700" }

export default function CompanyPage() {
  const [users, setUsers] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [form, setForm] = useState({ name:"", email:"", role:"BROKER" })
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  function load() {
    Promise.all([
      fetch("/api/users?company=true").then(r=>r.json()),
      fetch("/api/me").then(r=>r.json()),
    ]).then(([u, me]) => { setUsers(u); setUser(me); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  async function invite() {
    if (!form.name || !form.email) { setError("Name and email required"); return }
    setSaving(true); setError("")
    const res = await fetch("/api/users", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Failed to invite user")
      setSaving(false); return
    }
    setSaving(false); setShowInvite(false); setForm({ name:"", email:"", role:"BROKER" }); load()
  }

  async function removeUser(userId: string) {
    if (!confirm("Remove this user from the company? Their account will not be deleted.")) return
    await fetch("/api/users", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    })
    load()
  }

  if (loading) return <div className="p-8 flex justify-center"><div className="spinner"/></div>

  const isAdmin = user?.role === "ADMIN"

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Company Settings</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Company Information</h2>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label><input className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" defaultValue="Capital Lending Group" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label><input className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" defaultValue="info@capitallending.com" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone</label><input className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" defaultValue="(800) 555-0100" /></div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold">Team Members</h2>
            <p className="text-sm text-slate-500 mt-0.5">{users.length} user{users.length !== 1 ? "s" : ""}</p>
          </div>
          {isAdmin && (
            <button onClick={() => setShowInvite(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">+ Invite User</button>
          )}
        </div>

        {showInvite && (
          <div className="p-5 border-b border-slate-200 bg-slate-50">
            <h3 className="text-sm font-semibold mb-3">Invite New Team Member</h3>
            <div className="grid grid-cols-3 gap-3">
              <input className="px-3 py-2 rounded-lg border border-slate-300 text-sm" placeholder="Full name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              <input className="px-3 py-2 rounded-lg border border-slate-300 text-sm" placeholder="Email address" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              <select className="px-3 py-2 rounded-lg border border-slate-300 text-sm" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="BROKER">Broker</option>
                <option value="PROCESSOR">Processor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
            <div className="flex gap-2 mt-3">
              <button onClick={invite} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">{saving ? "Inviting..." : "Send Invite"}</button>
              <button onClick={() => { setShowInvite(false); setError("") }} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50">Cancel</button>
            </div>
            <p className="text-xs text-slate-400 mt-2">New users are created with a default password (password123). They should change it on first login.</p>
          </div>
        )}

        <table className="w-full">
          <thead><tr className="bg-slate-50 border-b">
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Name</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Email</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Role</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Joined</th>
            {isAdmin && <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase"></th>}
          </tr></thead>
          <tbody>{users.filter(u => u.role !== "BORROWER").map(u=>(
            <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-5 py-3.5 text-sm font-medium">{u.name}</td>
              <td className="px-5 py-3.5 text-sm text-slate-600">{u.email}</td>
              <td className="px-5 py-3.5"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_COLORS[u.role]||"bg-slate-50 text-slate-700"}`}>{u.role}</span></td>
              <td className="px-5 py-3.5 text-sm text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
              {isAdmin && <td className="px-5 py-3.5">{u.id !== user?.id && <button onClick={() => removeUser(u.id)} className="text-xs text-red-500 hover:text-red-700">Remove</button>}</td>}
            </tr>
          ))}</tbody>
        </table>
        {users.filter(u => u.role !== "BORROWER").length === 0 && <p className="text-center py-8 text-sm text-slate-400">No team members</p>}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Role Permissions</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { role: "Admin", perms: "Full access to all loans, users, and settings. Can invite team members." },
            { role: "Broker", perms: "Create loans, view own loans and assigned loans, manage contacts and tasks." },
            { role: "Processor", perms: "View assigned loans, manage conditions, documents, and tasks." },
          ].map(r=>(
            <div key={r.role} className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm font-semibold">{r.role}</p>
              <p className="text-xs text-slate-500 mt-1">{r.perms}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
