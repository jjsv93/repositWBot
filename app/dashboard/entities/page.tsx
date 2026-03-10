"use client"
import { useEffect, useState } from "react"
import Link from "next/link"

export default function EntitiesPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetch("/api/entities").then(r=>r.json()).then(d=>{setData(d);setLoading(false)}) }, [])
  if (loading) return <div className="p-8 flex justify-center"><div className="spinner"/></div>
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Entities</h1>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead><tr className="bg-slate-50 border-b">
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Entity Name</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">State</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">EIN</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Loan</th>
          </tr></thead>
          <tbody>{data.map(e=>(
            <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-5 py-3.5 text-sm font-medium">{e.entityName||"—"}</td>
              <td className="px-5 py-3.5 text-sm text-slate-600">{e.entityType?.replace("_"," ")||"—"}</td>
              <td className="px-5 py-3.5 text-sm text-slate-600">{e.stateOfFormation||"—"}</td>
              <td className="px-5 py-3.5 text-sm text-slate-600">{e.ein||"—"}</td>
              <td className="px-5 py-3.5">{e.loan ? <Link href={`/dashboard/loans/${e.loan.id}`} className="text-sm text-indigo-600 hover:underline">View Loan</Link> : "—"}</td>
            </tr>
          ))}</tbody>
        </table>
        {data.length===0 && <p className="text-center py-12 text-sm text-slate-400">No entities</p>}
      </div>
    </div>
  )
}
