"use client"
import { useEffect, useState } from "react"

const ROLE_COLORS: Record<string,string> = { ADMIN:"bg-purple-50 text-purple-700", BROKER:"bg-blue-50 text-blue-700", PROCESSOR:"bg-amber-50 text-amber-700", BORROWER:"bg-green-50 text-green-700" }

export default function CompanyPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetch("/api/users").then(r=>r.json()).then(d=>{setUsers(d);setLoading(false)}) }, [])

  if (loading) return <div className="p-8 flex justify-center"><div className="spinner"/></div>

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
          <h2 className="text-lg font-semibold">Users</h2>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium opacity-50 cursor-not-allowed">+ Invite User</button>
        </div>
        <table className="w-full">
          <thead><tr className="bg-slate-50 border-b">
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Name</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Email</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Role</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Joined</th>
          </tr></thead>
          <tbody>{users.map(u=>(
            <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-5 py-3.5 text-sm font-medium">{u.name}</td>
              <td className="px-5 py-3.5 text-sm text-slate-600">{u.email}</td>
              <td className="px-5 py-3.5"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_COLORS[u.role]||""}`}>{u.role}</span></td>
              <td className="px-5 py-3.5 text-sm text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Role Permissions</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { role: "Admin", perms: "Full access to all loans, users, and settings" },
            { role: "Broker", perms: "Manage own loans, create loans, view pipeline" },
            { role: "Processor", perms: "View all loans, manage conditions and documents" },
            { role: "Borrower", perms: "View own loan details, read-only conditions" },
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
