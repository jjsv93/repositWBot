"use client"
import { useEffect, useState } from "react"
import Link from "next/link"

export default function BorrowersPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetch("/api/borrowers").then(r=>r.json()).then(d=>{setData(d);setLoading(false)}) }, [])
  if (loading) return <div className="p-8 flex justify-center"><div className="spinner"/></div>
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Borrowers</h1>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead><tr className="bg-slate-50 border-b">
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Name</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Email</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Phone</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Credit Score</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Loan</th>
          </tr></thead>
          <tbody>{data.map(b=>(
            <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-5 py-3.5 text-sm font-medium">{b.firstName} {b.lastName}</td>
              <td className="px-5 py-3.5 text-sm text-slate-600">{b.email||"—"}</td>
              <td className="px-5 py-3.5 text-sm text-slate-600">{b.phone||"—"}</td>
              <td className="px-5 py-3.5 text-sm">{b.creditScore||"—"}</td>
              <td className="px-5 py-3.5">{b.loan ? <Link href={`/dashboard/loans/${b.loan.id}`} className="text-sm text-indigo-600 hover:underline">View Loan</Link> : "—"}</td>
            </tr>
          ))}</tbody>
        </table>
        {data.length===0 && <p className="text-center py-12 text-sm text-slate-400">No borrowers</p>}
      </div>
    </div>
  )
}
