"use client"
import { useEffect, useState, useRef } from "react"

const inputCls = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
const labelCls = "block text-sm font-medium text-slate-700 mb-1"
const btnPrimary = "px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
const btnSecondary = "px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
const btnDanger = "px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"

const ENTITY_TYPES = [
  { value: "LLC_SINGLE", label: "LLC (Single Member)" },
  { value: "LLC_MULTI", label: "LLC (Multi Member)" },
  { value: "CORPORATION", label: "Corporation" },
  { value: "LP", label: "Limited Partnership" },
  { value: "TRUST", label: "Trust" },
]

const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"]

const ENTITY_DOC_CATEGORIES = ["Operating Agreement", "Articles of Organization", "EIN Letter", "Certificate of Good Standing", "Voided Check", "Other"]

export default function MyEntitiesPage() {
  const [loans, setLoans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedLoanId, setSelectedLoanId] = useState("")
  const [form, setForm] = useState({ entityName: "", entityType: "LLC_SINGLE", ein: "", stateOfFormation: "FL" })
  const [expandedEntity, setExpandedEntity] = useState<string | null>(null)
  const [entityDocs, setEntityDocs] = useState<Record<string, any[]>>({})
  const [uploading, setUploading] = useState(false)
  const [docCategory, setDocCategory] = useState("Operating Agreement")
  const [docName, setDocName] = useState("")
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    fetch("/api/loans").then(r => r.json()).then(data => {
      setLoans(data)
      setLoading(false)
    })
  }, [])

  const entities = loans.flatMap(l => l.entityRel ? [{ ...l.entityRel, loanId: l.id, loanAddress: l.properties?.[0]?.address || "Loan" }] : [])
  const uniqueEntities = entities.reduce((acc: any[], e: any) => {
    const existing = acc.find(x => x.id === e.id)
    if (existing) {
      existing.loans = [...(existing.loans || [existing.loanAddress]), e.loanAddress]
    } else {
      acc.push({ ...e, loans: [e.loanAddress] })
    }
    return acc
  }, [])

  async function toggleEntity(entityId: string) {
    if (expandedEntity === entityId) {
      setExpandedEntity(null)
      return
    }
    setExpandedEntity(entityId)
    if (!entityDocs[entityId]) {
      const docs = await fetch(`/api/profile-documents?entityId=${entityId}`).then(r => r.json())
      setEntityDocs(prev => ({ ...prev, [entityId]: docs }))
    }
  }

  async function createEntity() {
    if (!selectedLoanId || !form.entityName) return
    setSaving(true)
    const res = await fetch("/api/entities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
    if (res.ok) {
      const entity = await res.json()
      await fetch(`/api/loans/${selectedLoanId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityId: entity.id })
      })
      const updated = await fetch("/api/loans").then(r => r.json())
      setLoans(updated)
      setAdding(false)
      setForm({ entityName: "", entityType: "LLC_SINGLE", ein: "", stateOfFormation: "FL" })
    }
    setSaving(false)
  }

  async function uploadEntityDoc(entityId: string, e: React.ChangeEvent<HTMLInputElement>) {
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
        entityId,
      })
    })

    const docs = await fetch(`/api/profile-documents?entityId=${entityId}`).then(r => r.json())
    setEntityDocs(prev => ({ ...prev, [entityId]: docs }))
    setUploading(false)
    setDocName("")
    if (fileRefs.current[entityId]) fileRefs.current[entityId]!.value = ""
  }

  async function deleteDoc(entityId: string, docId: string) {
    await fetch(`/api/profile-documents?id=${docId}`, { method: "DELETE" })
    setEntityDocs(prev => ({ ...prev, [entityId]: (prev[entityId] || []).filter(d => d.id !== docId) }))
  }

  if (loading) return <div className="p-8 flex justify-center"><div className="spinner" /></div>

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Entities</h1>
          <p className="text-sm text-slate-500 mt-1">Legal entities associated with your loans</p>
        </div>
        <button onClick={() => setAdding(!adding)} className={btnPrimary}>
          {adding ? "Cancel" : "+ Add Entity"}
        </button>
      </div>

      {adding && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">New Entity</h3>
          <div><label className={labelCls}>Link to Loan *</label>
            <select className={inputCls} value={selectedLoanId} onChange={e => setSelectedLoanId(e.target.value)}>
              <option value="">Select a loan...</option>
              {loans.filter(l => !l.entityRel).map(l => (
                <option key={l.id} value={l.id}>{l.properties?.[0]?.address || `Loan #${l.id.slice(0,8)}`}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>Entity Name *</label>
              <input className={inputCls} value={form.entityName} onChange={e => setForm({...form, entityName: e.target.value})} placeholder="My Holdings LLC" /></div>
            <div><label className={labelCls}>Entity Type</label>
              <select className={inputCls} value={form.entityType} onChange={e => setForm({...form, entityType: e.target.value})}>
                {ENTITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>EIN</label>
              <input className={inputCls} value={form.ein} onChange={e => setForm({...form, ein: e.target.value})} placeholder="XX-XXXXXXX" /></div>
            <div><label className={labelCls}>State of Formation</label>
              <select className={inputCls} value={form.stateOfFormation} onChange={e => setForm({...form, stateOfFormation: e.target.value})}>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select></div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setAdding(false)} className={btnSecondary}>Cancel</button>
            <button onClick={createEntity} disabled={saving || !selectedLoanId || !form.entityName} className={btnPrimary}>
              {saving ? "Creating..." : "Create Entity"}
            </button>
          </div>
        </div>
      )}

      {uniqueEntities.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-sm text-slate-400">No entities yet. Create one to associate with your loan.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {uniqueEntities.map((ent: any) => (
            <div key={ent.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <button onClick={() => toggleEntity(ent.id)} className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-900">{ent.entityName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {ENTITY_TYPES.find(t => t.value === ent.entityType)?.label || ent.entityType} · {ent.stateOfFormation || "—"} · EIN: {ent.ein || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{ent.loans?.join(", ")}</span>
                  <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandedEntity === ent.id ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </button>

              {expandedEntity === ent.id && (
                <div className="border-t border-slate-100 p-5 space-y-4">
                  <h4 className="text-sm font-semibold text-slate-700">Entity Documents</h4>

                  {/* Upload */}
                  <div className="flex items-end gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-slate-600 mb-1 block">Document Name</label>
                      <input className={inputCls} value={docName} onChange={e => setDocName(e.target.value)} placeholder="e.g. Operating Agreement" />
                    </div>
                    <div className="w-44">
                      <label className="text-xs font-medium text-slate-600 mb-1 block">Category</label>
                      <select className={inputCls} value={docCategory} onChange={e => setDocCategory(e.target.value)}>
                        {ENTITY_DOC_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <input ref={el => { fileRefs.current[ent.id] = el }} type="file" className="hidden" onChange={e => uploadEntityDoc(ent.id, e)} />
                      <button onClick={() => fileRefs.current[ent.id]?.click()} disabled={uploading} className={btnPrimary + " text-xs"}>
                        {uploading ? "..." : "Upload"}
                      </button>
                    </div>
                  </div>

                  {/* Documents */}
                  {(entityDocs[ent.id] || []).length > 0 ? (
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
                        {(entityDocs[ent.id] || []).map((d: any) => (
                          <tr key={d.id} className="border-b border-slate-50">
                            <td className="px-3 py-2 text-sm font-medium">{d.name}</td>
                            <td className="px-3 py-2"><span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full">{d.category || "—"}</span></td>
                            <td className="px-3 py-2 text-xs text-slate-500">{new Date(d.createdAt).toLocaleDateString()}</td>
                            <td className="px-3 py-2 text-right"><button onClick={() => deleteDoc(ent.id, d.id)} className={btnDanger}>Delete</button></td>
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
