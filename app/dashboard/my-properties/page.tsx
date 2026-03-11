"use client"
import { useEffect, useState, useRef } from "react"

const inputCls = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
const labelCls = "block text-sm font-medium text-slate-700 mb-1"
const btnPrimary = "px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
const btnSecondary = "px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
const btnDanger = "px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"

const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"]

const PROPERTY_DOC_CATEGORIES = ["Purchase Contract", "Insurance Binder", "Rent Roll", "Lease Agreement", "Property Photos", "Appraisal", "Tax Bill", "Scope of Work", "Other"]

export default function MyPropertiesPage() {
  const [loans, setLoans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedLoanId, setSelectedLoanId] = useState("")
  const [form, setForm] = useState({ address: "", city: "", state: "FL", zip: "" })
  const [expandedProperty, setExpandedProperty] = useState<string | null>(null)
  const [propertyDocs, setPropertyDocs] = useState<Record<string, any[]>>({})
  const [uploading, setUploading] = useState(false)
  const [docCategory, setDocCategory] = useState("Purchase Contract")
  const [docName, setDocName] = useState("")
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    fetch("/api/loans").then(r => r.json()).then(data => {
      setLoans(data)
      setLoading(false)
    })
  }, [])

  const properties = loans.flatMap(l =>
    (l.properties || []).map((p: any) => ({
      ...p,
      loanId: l.id,
      loanType: l.loanType,
      loanStatus: l.status
    }))
  )

  async function toggleProperty(propId: string) {
    if (expandedProperty === propId) {
      setExpandedProperty(null)
      return
    }
    setExpandedProperty(propId)
    if (!propertyDocs[propId]) {
      const docs = await fetch(`/api/profile-documents?propertyId=${propId}`).then(r => r.json())
      setPropertyDocs(prev => ({ ...prev, [propId]: docs }))
    }
  }

  async function addProperty() {
    if (!selectedLoanId || !form.address) return
    setSaving(true)
    const fullAddress = [form.address, form.city, form.state, form.zip].filter(Boolean).join(", ")
    await fetch(`/api/loans/${selectedLoanId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addProperty: { address: fullAddress, city: form.city, state: form.state, zip: form.zip }
      })
    })
    const updated = await fetch("/api/loans").then(r => r.json())
    setLoans(updated)
    setAdding(false)
    setForm({ address: "", city: "", state: "FL", zip: "" })
    setSaving(false)
  }

  async function uploadPropertyDoc(propId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const name = docName || file.name.replace(/\.[^/.]+$/, "")

    await fetch("/api/profile-documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        category: docCategory,
        fileName: file.name,
        fileUrl: `/uploads/${file.name}`,
        propertyId: propId,
      })
    })

    const docs = await fetch(`/api/profile-documents?propertyId=${propId}`).then(r => r.json())
    setPropertyDocs(prev => ({ ...prev, [propId]: docs }))
    setUploading(false)
    setDocName("")
    if (fileRefs.current[propId]) fileRefs.current[propId]!.value = ""
  }

  async function deleteDoc(propId: string, docId: string) {
    await fetch(`/api/profile-documents?id=${docId}`, { method: "DELETE" })
    setPropertyDocs(prev => ({ ...prev, [propId]: (prev[propId] || []).filter(d => d.id !== docId) }))
  }

  if (loading) return <div className="p-8 flex justify-center"><div className="spinner" /></div>

  const STATUS_COLORS: Record<string, string> = {
    LEAD: "bg-blue-50 text-blue-700",
    PROCESSING: "bg-amber-50 text-amber-700",
    APPROVED: "bg-emerald-50 text-emerald-700",
    DOCS_OUT: "bg-purple-50 text-purple-700",
    DOCS_BACK: "bg-indigo-50 text-indigo-700",
    FUNDED: "bg-green-50 text-green-700",
    DEAD: "bg-slate-50 text-slate-700",
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Properties</h1>
          <p className="text-sm text-slate-500 mt-1">Properties associated with your loans — upload docs once and reuse across loans</p>
        </div>
        <button onClick={() => setAdding(!adding)} className={btnPrimary}>
          {adding ? "Cancel" : "+ Add Property"}
        </button>
      </div>

      {adding && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">New Property</h3>
          <p className="text-xs text-slate-400">Property will be submitted for broker review</p>
          <div><label className={labelCls}>Link to Loan *</label>
            <select className={inputCls} value={selectedLoanId} onChange={e => setSelectedLoanId(e.target.value)}>
              <option value="">Select a loan...</option>
              {loans.map(l => (
                <option key={l.id} value={l.id}>{l.properties?.[0]?.address || `Loan #${l.id.slice(0,8)}`} ({l.loanType})</option>
              ))}
            </select>
          </div>
          <div><label className={labelCls}>Street Address *</label>
            <input className={inputCls} value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="1247 Ocean Drive" /></div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className={labelCls}>City</label>
              <input className={inputCls} value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="Miami Beach" /></div>
            <div><label className={labelCls}>State</label>
              <select className={inputCls} value={form.state} onChange={e => setForm({...form, state: e.target.value})}>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select></div>
            <div><label className={labelCls}>ZIP</label>
              <input className={inputCls} value={form.zip} onChange={e => setForm({...form, zip: e.target.value})} placeholder="33139" /></div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setAdding(false)} className={btnSecondary}>Cancel</button>
            <button onClick={addProperty} disabled={saving || !selectedLoanId || !form.address} className={btnPrimary}>
              {saving ? "Adding..." : "Add Property"}
            </button>
          </div>
        </div>
      )}

      {properties.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-sm text-slate-400">No properties yet. Add one to a loan to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {properties.map((p: any) => (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <button onClick={() => toggleProperty(p.id)} className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-900">{p.address}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {p.estimatedValue && <span className="text-xs text-slate-500">Value: ${p.estimatedValue.toLocaleString()}</span>}
                    {p.monthlyRent && <span className="text-xs text-slate-500">Rent: ${p.monthlyRent.toLocaleString()}/mo</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{p.loanType}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[p.loanStatus] || "bg-slate-50 text-slate-700"}`}>{p.loanStatus?.replace("_"," ")}</span>
                  <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandedProperty === p.id ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </button>

              {expandedProperty === p.id && (
                <div className="border-t border-slate-100 p-5 space-y-4">
                  <h4 className="text-sm font-semibold text-slate-700">Property Documents</h4>

                  <div className="flex items-end gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-slate-600 mb-1 block">Document Name</label>
                      <input className={inputCls} value={docName} onChange={e => setDocName(e.target.value)} placeholder="e.g. Purchase Contract" />
                    </div>
                    <div className="w-44">
                      <label className="text-xs font-medium text-slate-600 mb-1 block">Category</label>
                      <select className={inputCls} value={docCategory} onChange={e => setDocCategory(e.target.value)}>
                        {PROPERTY_DOC_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <input ref={el => { fileRefs.current[p.id] = el }} type="file" className="hidden" onChange={e => uploadPropertyDoc(p.id, e)} />
                      <button onClick={() => fileRefs.current[p.id]?.click()} disabled={uploading} className={btnPrimary + " text-xs"}>
                        {uploading ? "..." : "Upload"}
                      </button>
                    </div>
                  </div>

                  {(propertyDocs[p.id] || []).length > 0 ? (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left text-xs font-semibold text-slate-500 uppercase px-3 py-2">Document</th>
                          <th className="text-left text-xs font-semibold text-slate-500 uppercase px-3 py-2">Category</th>
                          <th className="text-left text-xs font-semibold text-slate-500 uppercase px-3 py-2">Uploaded</th>
                          <th className="text-right text-xs font-semibold text-slate-500 uppercase px-3 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(propertyDocs[p.id] || []).map((d: any) => (
                          <tr key={d.id} className="border-b border-slate-50">
                            <td className="px-3 py-2 text-sm font-medium">{d.name}</td>
                            <td className="px-3 py-2"><span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">{d.category || "—"}</span></td>
                            <td className="px-3 py-2 text-xs text-slate-500">{new Date(d.createdAt).toLocaleDateString()}</td>
                            <td className="px-3 py-2 text-right"><button onClick={() => deleteDoc(p.id, d.id)} className={btnDanger}>Delete</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-center py-4 text-xs text-slate-400">No documents uploaded</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
