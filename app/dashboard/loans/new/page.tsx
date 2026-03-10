"use client"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"

export default function NewLoanPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    loanType: "DSCR",
    borrowerFirstName: "", borrowerMiddleName: "", borrowerLastName: "",
    borrowerEmail: "", borrowerPhone: "",
    propertyAddress: "", estimatedValue: "",
    loanAmount: "", ltv: "", interestRate: "7.25", termMonths: "360",
    annualTaxes: "", annualInsurance: "",
    taxMode: "annual", insuranceMode: "annual",
    prepayType: "", prepayYears: "",
    entityType: "",
  })

  function set(key: string, val: string) {
    const next = { ...form, [key]: val }
    // Sync LTV and amount
    if (key === "loanAmount" && next.estimatedValue) {
      next.ltv = ((parseFloat(val) / parseFloat(next.estimatedValue)) * 100).toFixed(1)
    }
    if (key === "ltv" && next.estimatedValue) {
      next.loanAmount = ((parseFloat(val) / 100) * parseFloat(next.estimatedValue)).toFixed(0)
    }
    if (key === "estimatedValue" && next.ltv) {
      next.loanAmount = ((parseFloat(next.ltv) / 100) * parseFloat(val)).toFixed(0)
    }
    setForm(next)
  }

  const calc = useMemo(() => {
    const P = parseFloat(form.loanAmount) || 0
    const r = (parseFloat(form.interestRate) || 0) / 100 / 12
    const n = parseInt(form.termMonths) || 360
    const pi = r > 0 && P > 0 ? P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : 0
    const taxes = form.taxMode === "monthly" ? (parseFloat(form.annualTaxes) || 0) : (parseFloat(form.annualTaxes) || 0) / 12
    const ins = form.insuranceMode === "monthly" ? (parseFloat(form.annualInsurance) || 0) : (parseFloat(form.annualInsurance) || 0) / 12
    return { pi, piti: pi + taxes + ins }
  }, [form])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const annualTaxes = form.taxMode === "monthly" ? (parseFloat(form.annualTaxes) || 0) * 12 : parseFloat(form.annualTaxes) || 0
    const annualInsurance = form.insuranceMode === "monthly" ? (parseFloat(form.annualInsurance) || 0) * 12 : parseFloat(form.annualInsurance) || 0
    const res = await fetch("/api/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, annualTaxes, annualInsurance }),
    })
    const data = await res.json()
    if (data.id) router.push(`/dashboard/loans/${data.id}`)
    else setSaving(false)
  }

  const inputCls = "w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
  const labelCls = "block text-sm font-medium text-slate-700 mb-1"

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Loan</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Loan Type */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Loan Type</h2>
          <div className="flex gap-3">
            {["DSCR", "BRIDGE"].map(t => (
              <button key={t} type="button" onClick={() => set("loanType", t)}
                className={`px-6 py-3 rounded-lg text-sm font-semibold border-2 transition-colors ${form.loanType === t ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>{t}</button>
            ))}
          </div>
        </div>

        {/* Borrower */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Borrower Information</h2>
          <div className="grid grid-cols-3 gap-4">
            <div><label className={labelCls}>First Name</label><input className={inputCls} value={form.borrowerFirstName} onChange={e => set("borrowerFirstName", e.target.value)} /></div>
            <div><label className={labelCls}>Middle Name</label><input className={inputCls} value={form.borrowerMiddleName} onChange={e => set("borrowerMiddleName", e.target.value)} /></div>
            <div><label className={labelCls}>Last Name</label><input className={inputCls} value={form.borrowerLastName} onChange={e => set("borrowerLastName", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div><label className={labelCls}>Email</label><input type="email" className={inputCls} value={form.borrowerEmail} onChange={e => set("borrowerEmail", e.target.value)} /></div>
            <div><label className={labelCls}>Phone</label><input className={inputCls} value={form.borrowerPhone} onChange={e => set("borrowerPhone", e.target.value)} /></div>
          </div>
        </div>

        {/* Property */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Property</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>Address</label><input className={inputCls} value={form.propertyAddress} onChange={e => set("propertyAddress", e.target.value)} /></div>
            <div><label className={labelCls}>Estimated Value</label><input type="number" className={inputCls} value={form.estimatedValue} onChange={e => set("estimatedValue", e.target.value)} /></div>
          </div>
        </div>

        {/* Loan Terms */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Loan Terms</h2>
          <div className="grid grid-cols-4 gap-4">
            <div><label className={labelCls}>Loan Amount</label><input type="number" className={inputCls} value={form.loanAmount} onChange={e => set("loanAmount", e.target.value)} /></div>
            <div><label className={labelCls}>LTV %</label><input type="number" step="0.1" className={inputCls} value={form.ltv} onChange={e => set("ltv", e.target.value)} /></div>
            <div><label className={labelCls}>Interest Rate %</label><input type="number" step="0.01" className={inputCls} value={form.interestRate} onChange={e => set("interestRate", e.target.value)} /></div>
            <div>
              <label className={labelCls}>Term</label>
              <select className={inputCls} value={form.termMonths} onChange={e => set("termMonths", e.target.value)}>
                <option value="360">30 Year</option><option value="240">20 Year</option><option value="180">15 Year</option><option value="120">10 Year</option><option value="60">5 Year</option><option value="12">1 Year</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-slate-700">Taxes</label>
                <div className="flex text-xs">
                  <button type="button" onClick={() => set("taxMode", "annual")} className={`px-2 py-1 rounded-l border ${form.taxMode === "annual" ? "bg-indigo-50 text-indigo-700 border-indigo-300" : "border-slate-300 text-slate-500"}`}>Annual</button>
                  <button type="button" onClick={() => set("taxMode", "monthly")} className={`px-2 py-1 rounded-r border-t border-r border-b ${form.taxMode === "monthly" ? "bg-indigo-50 text-indigo-700 border-indigo-300" : "border-slate-300 text-slate-500"}`}>Monthly</button>
                </div>
              </div>
              <input type="number" className={inputCls} value={form.annualTaxes} onChange={e => set("annualTaxes", e.target.value)} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-slate-700">Insurance</label>
                <div className="flex text-xs">
                  <button type="button" onClick={() => set("insuranceMode", "annual")} className={`px-2 py-1 rounded-l border ${form.insuranceMode === "annual" ? "bg-indigo-50 text-indigo-700 border-indigo-300" : "border-slate-300 text-slate-500"}`}>Annual</button>
                  <button type="button" onClick={() => set("insuranceMode", "monthly")} className={`px-2 py-1 rounded-r border-t border-r border-b ${form.insuranceMode === "monthly" ? "bg-indigo-50 text-indigo-700 border-indigo-300" : "border-slate-300 text-slate-500"}`}>Monthly</button>
                </div>
              </div>
              <input type="number" className={inputCls} value={form.annualInsurance} onChange={e => set("annualInsurance", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className={labelCls}>Prepay Type</label>
              <select className={inputCls} value={form.prepayType} onChange={e => set("prepayType", e.target.value)}>
                <option value="">None</option><option value="DECLINING">Declining</option><option value="FLAT">Flat</option>
              </select>
            </div>
            {form.prepayType && (
              <div><label className={labelCls}>Prepay Years</label><input type="number" className={inputCls} value={form.prepayYears} onChange={e => set("prepayYears", e.target.value)} /></div>
            )}
          </div>
          {form.loanType === "DSCR" && (
            <div className="mt-4">
              <label className={labelCls}>Entity Type</label>
              <div className="flex gap-3">
                {[["INDIVIDUAL", "Individual"], ["LLC_SINGLE", "LLC (Single)"], ["LLC_MULTI", "LLC (Multi)"]].map(([v, l]) => (
                  <button key={v} type="button" onClick={() => set("entityType", v)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${form.entityType === v ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>{l}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Calculations */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Calculations</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <p className="text-sm text-slate-500">Monthly P&I</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">${calc.pi.toFixed(2)}</p>
            </div>
            <div className="bg-indigo-50 rounded-lg p-4 text-center">
              <p className="text-sm text-indigo-600">Monthly PITI</p>
              <p className="text-2xl font-bold text-indigo-700 mt-1">${calc.piti.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50">
            {saving ? "Creating..." : "Create Loan"}
          </button>
        </div>
      </form>
    </div>
  )
}
