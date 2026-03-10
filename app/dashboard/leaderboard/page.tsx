"use client"
import { useEffect, useState } from "react"

export default function LeaderboardPage() {
  const [loans, setLoans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetch("/api/loans").then(r=>r.json()).then(d=>{setLoans(d);setLoading(false)}) }, [])

  if (loading) return <div className="p-8 flex justify-center"><div className="spinner"/></div>

  const funded = loans.filter(l => l.status === "FUNDED")
  const approved = loans.filter(l => ["APPROVED","CLEAR_TO_CLOSE","FUNDED"].includes(l.status))
  const fundedVol = funded.reduce((s: number, l: any) => s + (l.loanAmount || 0), 0)
  const approvalPct = loans.length > 0 ? ((approved.length / loans.length) * 100).toFixed(0) : "0"

  // Group by broker
  const brokerMap: Record<string, { name: string; total: number; funded: number; volume: number }> = {}
  loans.forEach(l => {
    const name = l.broker?.name || "Unassigned"
    if (!brokerMap[name]) brokerMap[name] = { name, total: 0, funded: 0, volume: 0 }
    brokerMap[name].total++
    if (l.status === "FUNDED") { brokerMap[name].funded++; brokerMap[name].volume += l.loanAmount || 0 }
  })
  const brokers = Object.values(brokerMap).sort((a, b) => b.volume - a.volume)

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Leaderboard</h1>
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Loans", value: loans.length },
          { label: "Funded Volume", value: `$${fundedVol.toLocaleString()}` },
          { label: "Approval Rate", value: `${approvalPct}%` },
          { label: "Avg Pipeline", value: `$${loans.length ? Math.round(loans.reduce((s: number, l: any) => s + (l.loanAmount || 0), 0) / loans.length).toLocaleString() : 0}` },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b"><h2 className="text-lg font-semibold">Broker Leaderboard</h2></div>
        <table className="w-full">
          <thead><tr className="bg-slate-50 border-b">
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Rank</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Broker</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Total Loans</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Funded</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Volume</th>
          </tr></thead>
          <tbody>{brokers.map((b, i) => (
            <tr key={b.name} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-5 py-3.5">
                <span className={`w-7 h-7 inline-flex items-center justify-center rounded-full text-xs font-bold ${i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-200 text-slate-600" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-slate-50 text-slate-500"}`}>{i + 1}</span>
              </td>
              <td className="px-5 py-3.5 text-sm font-medium">{b.name}</td>
              <td className="px-5 py-3.5 text-sm text-slate-600">{b.total}</td>
              <td className="px-5 py-3.5 text-sm text-slate-600">{b.funded}</td>
              <td className="px-5 py-3.5 text-sm font-semibold">${b.volume.toLocaleString()}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}
