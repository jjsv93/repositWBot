"use client"
import { useEffect, useState, useRef } from "react"

const inputCls = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
const labelCls = "block text-sm font-medium text-slate-700 mb-1"
const btnPrimary = "px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
const btnSecondary = "px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
const btnDanger = "px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"

const BORROWER_DOC_CATEGORIES = ["Government ID", "SSN Card", "Bank Statements", "Tax Returns", "Pay Stubs", "Credit Report", "Other"]

export default function BorrowerProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [borrower, setBorrower] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loans, setLoans] = useState<any[]>([])
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState("")
  const [uploading, setUploading] = useState(false)
  const [docCategory, setDocCategory] = useState("Government ID")
  const [docName, setDocName] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    creditScore: "", liquidity: "", netWorth: "", experience: "",
    ssn: "", dob: "", mailingAddress: ""
  })

  useEffect(() => { load() }, [])

  async function load() {
    const [u, profiles, loansData] = await Promise.all([
      fetch("/api/me").then(r => r.json()),
      fetch("/api/borrower-profiles").then(r => r.json()),
      fetch("/api/loans").then(r => r.json()),
    ])
    setUser(u)
    setLoans(loansData)

    const p = Array.isArray(profiles) ? profiles.find((pr: any) => pr.userId === u.id) : null
    if (p) {
      setProfile(p)
      setForm({
        firstName: p.firstName || "", lastName: p.lastName || "",
        email: p.email || u.email || "", phone: p.phone || "",
        creditScore: p.creditScore?.toString() || "", liquidity: p.liquidity?.toString() || "",
        netWorth: p.netWorth?.toString() || "", experience: p.experience?.toString() || "",
        ssn: p.ssn || "", dob: p.dob || "", mailingAddress: p.mailingAddress || ""
      })
    } else {
      setForm(f => ({ ...f, email: u.email || "" }))
    }

    // Get borrower record from first loan
    const firstLoan = loansData[0]
    if (firstLoan?.borrowerRel) {
      setBorrower(firstLoan.borrowerRel)
      // Load profile docs for this borrower
      const docsData = await fetch(`/api/profile-documents?borrowerId=${firstLoan.borrowerRel.id}`).then(r => r.json())
      setDocs(docsData)
    }
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    setMsg("")
    const body: any = {
      firstName: form.firstName, lastName: form.lastName,
      email: form.email, phone: form.phone,
      ssn: form.ssn || undefined, dob: form.dob || undefined, mailingAddress: form.mailingAddress || undefined
    }
    if (form.creditScore) body.creditScore = parseInt(form.creditScore)
    if (form.liquidity) body.liquidity = parseFloat(form.liquidity)
    if (form.netWorth) body.netWorth = parseFloat(form.netWorth)
    if (form.experience) body.experience = parseInt(form.experience)

    const res = await fetch("/api/borrower-profiles", {
      method: profile ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile ? { id: profile.id, ...body } : body)
    })

    if (res.ok) {
      const updated = await res.json()
      setProfile(updated)
      setMsg("Profile saved!")
      setTimeout(() => setMsg(""), 3000)
    } else {
      setMsg("Error saving profile")
    }
    setSaving(false)
  }

  async function uploadDoc(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !borrower) return
    setUploading(true)

    // For now, create a local object URL (replace with S3 in production)
    const fileUrl = URL.createObjectURL(file)
    const name = docName || file.name.replace(/\.[^/.]+$/, "")

    await fetch("/api/profile-documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        category: docCategory,
        fileName: file.name,
        fileUrl: `/uploads/${file.name}`, // Placeholder — S3 in production
        borrowerId: borrower.id,
      })
    })

    const docsData = await fetch(`/api/profile-documents?borrowerId=${borrower.id}`).then(r => r.json())
    setDocs(docsData)
    setUploading(false)
    setDocName("")
    if (fileRef.current) fileRef.current.value = ""
  }

  async function deleteDoc(id: string) {
    await fetch(`/api/profile-documents?id=${id}`, { method: "DELETE" })
    setDocs(docs.filter(d => d.id !== id))
  }

  if (loading) return <div className="p-8 flex justify-center"><div className="spinner" /></div>

  return (
    <div className="p-6 max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-sm text-slate-500 mt-1">Your borrower information used across all loans</p>
        </div>
        {msg && <span className={`text-sm font-medium ${msg.includes("Error") ? "text-red-600" : "text-emerald-600"}`}>{msg}</span>}
      </div>

      {/* Section 1: Personal Info */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-semibold text-slate-900">Personal Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>First Name *</label>
            <input className={inputCls} value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} placeholder="John" /></div>
          <div><label className={labelCls}>Last Name *</label>
            <input className={inputCls} value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} placeholder="Smith" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>Email</label>
            <input className={inputCls} value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="john@email.com" /></div>
          <div><label className={labelCls}>Phone</label>
            <input className={inputCls} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="555-555-5555" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>SSN</label>
            <input className={inputCls} value={form.ssn} onChange={e => setForm({...form, ssn: e.target.value})} placeholder="XXX-XX-XXXX" /></div>
          <div><label className={labelCls}>Date of Birth</label>
            <input type="date" className={inputCls} value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} /></div>
        </div>
        <div><label className={labelCls}>Mailing Address</label>
          <input className={inputCls} value={form.mailingAddress} onChange={e => setForm({...form, mailingAddress: e.target.value})} placeholder="123 Main St, City, ST 12345" /></div>

        <hr className="border-slate-100" />
        <h3 className="text-sm font-semibold text-slate-900">Financial Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>Credit Score</label>
            <input type="number" className={inputCls} value={form.creditScore} onChange={e => setForm({...form, creditScore: e.target.value})} placeholder="720" /></div>
          <div><label className={labelCls}>RE Experience (years)</label>
            <input type="number" className={inputCls} value={form.experience} onChange={e => setForm({...form, experience: e.target.value})} placeholder="3" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>Liquidity ($)</label>
            <input type="number" className={inputCls} value={form.liquidity} onChange={e => setForm({...form, liquidity: e.target.value})} placeholder="150000" /></div>
          <div><label className={labelCls}>Net Worth ($)</label>
            <input type="number" className={inputCls} value={form.netWorth} onChange={e => setForm({...form, netWorth: e.target.value})} placeholder="800000" /></div>
        </div>
        <div className="flex justify-end">
          <button onClick={save} disabled={saving || !form.firstName || !form.lastName} className={btnPrimary}>
            {saving ? "Saving..." : profile ? "Update Profile" : "Create Profile"}
          </button>
        </div>
      </div>

      {/* Section 2: Documents */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Documents</h2>
        </div>
        <p className="text-sm text-slate-500">Upload documents once — they can be reused across all your loans.</p>

        {/* Upload form */}
        <div className="flex items-end gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
          <div className="flex-1">
            <label className={labelCls}>Document Name</label>
            <input className={inputCls} value={docName} onChange={e => setDocName(e.target.value)} placeholder="e.g. Driver License Front" />
          </div>
          <div className="w-48">
            <label className={labelCls}>Category</label>
            <select className={inputCls} value={docCategory} onChange={e => setDocCategory(e.target.value)}>
              {BORROWER_DOC_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <input ref={fileRef} type="file" className="hidden" onChange={uploadDoc} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading || !borrower} className={btnPrimary}>
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>

        {!borrower && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-3">
            Documents will be available after your first loan is created by a broker.
          </p>
        )}

        {/* Document table */}
        {docs.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">Document</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">Category</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">Uploaded</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d: any) => (
                <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-3 py-2.5">
                    <p className="text-sm font-medium">{d.name}</p>
                    <p className="text-xs text-slate-400">{d.fileName}</p>
                  </td>
                  <td className="px-3 py-2.5"><span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{d.category || "—"}</span></td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{new Date(d.createdAt).toLocaleDateString()}</td>
                  <td className="px-3 py-2.5 text-right">
                    <button onClick={() => deleteDoc(d.id)} className={btnDanger}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center py-8 text-sm text-slate-400">No documents uploaded yet</p>
        )}
      </div>

      {/* Section 3: Linked Loans */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Linked Loans</h2>
        {loans.length > 0 ? (
          <div className="space-y-2">
            {loans.map((l: any) => (
              <div key={l.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <div>
                  <p className="text-sm font-medium">{l.properties?.[0]?.address || `Loan #${l.id.slice(0,8)}`}</p>
                  <p className="text-xs text-slate-500">{l.loanType} · {l.loanAmount ? `$${l.loanAmount.toLocaleString()}` : "—"}</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">{l.status?.replace("_"," ")}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No loans yet</p>
        )}
      </div>
    </div>
  )
}
