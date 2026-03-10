"use client"
import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

/* eslint-disable @typescript-eslint/no-explicit-any */

const STATUSES = ["LEAD","SUBMITTED","PROCESSING","APPROVED","CLEAR_TO_CLOSE","FUNDED","DEAD"]
const STATUS_COLORS: Record<string,string> = {
  LEAD:"bg-slate-100 text-slate-700",SUBMITTED:"bg-blue-50 text-blue-700",
  PROCESSING:"bg-amber-50 text-amber-700",APPROVED:"bg-emerald-50 text-emerald-700",
  CLEAR_TO_CLOSE:"bg-violet-50 text-violet-700",FUNDED:"bg-green-50 text-green-700",DEAD:"bg-red-50 text-red-600"
}
const COND_COLORS: Record<string,string> = { OPEN:"bg-amber-50 text-amber-700",RECEIVED:"bg-blue-50 text-blue-700",CLEARED:"bg-green-50 text-green-700" }

const TABS = [
  { key:"borrower", label:"Borrower", icon:"M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { key:"property", label:"Property", icon:"M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" },
  { key:"entity", label:"Entity", icon:"M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" },
  { key:"dscr", label:"DSCR Calc", icon:"M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
  { key:"contacts", label:"Contacts", icon:"M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { key:"tasks", label:"Tasks", icon:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { key:"conditions", label:"Conditions", icon:"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  { key:"team", label:"Team", icon:"M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
]

export default function LoanDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [loan, setLoan] = useState<any>(null)
  const [tab, setTab] = useState("borrower")
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    fetch(`/api/loans/${id}`).then(r => r.ok ? r.json() : null).then(d => { setLoan(d); setLoading(false) })
  }, [id])

  useEffect(() => { load(); fetch("/api/me").then(r=>r.json()).then(setUser) }, [load])

  if (loading || !loan) return <div className="p-8 flex justify-center"><div className="spinner" /></div>

  const b = loan.borrowerRel || {}
  const p = loan.propertyRel || {}
  const ent = loan.entityRel || {}
  const borrowerName = `${b.firstName||""} ${b.lastName||""}`.trim() || "Untitled Loan"
  const isBorrower = user?.role === "BORROWER"
  const visibleTabs = TABS.filter(t => !(isBorrower && t.key === "team"))

  async function changeStatus(status: string) {
    await fetch(`/api/loans/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({status}) })
    load()
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/loans" className="text-slate-400 hover:text-slate-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg></Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900">{borrowerName}</h1>
            <p className="text-sm text-slate-500">{p.address || "No address"}</p>
          </div>
        </div>
        {!isBorrower && (
          <select value={loan.status} onChange={e=>changeStatus(e.target.value)}
            className={`text-sm font-semibold px-3 py-1.5 rounded-full border-0 cursor-pointer ${STATUS_COLORS[loan.status]}`}>
            {STATUSES.map(s=><option key={s} value={s}>{s.replace("_"," ")}</option>)}
          </select>
        )}
        {isBorrower && <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${STATUS_COLORS[loan.status]}`}>{loan.status.replace("_"," ")}</span>}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar Tabs */}
        <div className="w-52 bg-white border-r border-slate-200 flex-shrink-0 overflow-y-auto py-2">
          {visibleTabs.map(t => (
            <button key={t.key} onClick={()=>setTab(t.key)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${tab===t.key ? "bg-indigo-50 text-indigo-700 border-r-2 border-indigo-600" : "text-slate-600 hover:bg-slate-50"}`}>
              <svg className="w-4.5 h-4.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={t.icon}/></svg>
              {t.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === "borrower" && <BorrowerTab loan={loan} reload={load} isBorrower={isBorrower} />}
          {tab === "property" && <PropertyTab loan={loan} reload={load} />}
          {tab === "entity" && <EntityTab loan={loan} reload={load} />}
          {tab === "dscr" && <DSCRTab loan={loan} reload={load} />}
          {tab === "contacts" && <ContactsTab loan={loan} reload={load} />}
          {tab === "tasks" && <TasksTab loan={loan} reload={load} isBorrower={isBorrower} />}
          {tab === "conditions" && <ConditionsTab loan={loan} reload={load} isBorrower={isBorrower} />}
          {tab === "team" && <TeamTab loan={loan} />}
        </div>
      </div>
    </div>
  )
}

const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
const labelCls = "block text-sm font-medium text-slate-700 mb-1"
const btnPrimary = "bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
const btnSecondary = "border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"

function BorrowerTab({ loan, reload, isBorrower }: any) {
  const b = loan.borrowerRel || {}
  const [form, setForm] = useState({
    firstName: b.firstName||"", middleName: b.middleName||"", lastName: b.lastName||"",
    email: b.email||"", phone: b.phone||"", dob: b.dob?.slice(0,10)||"", ssn: b.ssn||"", maritalStatus: b.maritalStatus||""
  })
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function save() {
    setSaving(true)
    await fetch(`/api/loans/${loan.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ borrower: { ...form, dob: form.dob ? new Date(form.dob) : null } }) })
    setSaving(false); reload()
  }

  async function uploadDoc(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const fd = new FormData(); fd.append("file", file); fd.append("type", "borrower")
    await fetch(`/api/loans/${loan.id}/documents`, { method:"POST", body: fd })
    reload()
  }

  const borrowerDocs = (loan.documents||[]).filter((d:any)=>d.type==="borrower")

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-lg font-semibold">Borrower Information</h2>
      <div className="grid grid-cols-3 gap-4">
        <div><label className={labelCls}>First Name</label><input className={inputCls} value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})} /></div>
        <div><label className={labelCls}>Middle</label><input className={inputCls} value={form.middleName} onChange={e=>setForm({...form,middleName:e.target.value})} /></div>
        <div><label className={labelCls}>Last Name</label><input className={inputCls} value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className={labelCls}>Email</label><input className={inputCls} value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></div>
        <div><label className={labelCls}>Phone</label><input className={inputCls} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div><label className={labelCls}>Date of Birth</label><input type="date" className={inputCls} value={form.dob} onChange={e=>setForm({...form,dob:e.target.value})} /></div>
        <div><label className={labelCls}>SSN</label><input className={inputCls} value={form.ssn} onChange={e=>setForm({...form,ssn:e.target.value})} placeholder="XXX-XX-XXXX" /></div>
        <div><label className={labelCls}>Marital Status</label>
          <select className={inputCls} value={form.maritalStatus} onChange={e=>setForm({...form,maritalStatus:e.target.value})}>
            <option value="">Select</option><option>Single</option><option>Married</option><option>Divorced</option><option>Widowed</option>
          </select>
        </div>
      </div>
      {!isBorrower && <button onClick={save} disabled={saving} className={btnPrimary}>{saving?"Saving...":"Save Borrower"}</button>}

      <div className="border-t pt-6">
        <h3 className="text-base font-semibold mb-3">Borrower Documents</h3>
        <input ref={fileRef} type="file" className="hidden" onChange={uploadDoc} />
        <button onClick={()=>fileRef.current?.click()} className={btnSecondary}>Upload Document</button>
        {borrowerDocs.length > 0 && (
          <div className="mt-3 space-y-2">
            {borrowerDocs.map((d:any) => (
              <div key={d.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2.5">
                <a href={d.fileUrl} target="_blank" className="text-sm text-indigo-600 hover:underline">{d.fileName}</a>
                <span className="text-xs text-slate-400">{new Date(d.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PropertyTab({ loan, reload }: any) {
  const p = loan.propertyRel || {}
  const [form, setForm] = useState({
    address: p.address||"", estimatedValue: p.estimatedValue||"",
    taxAmount: p.taxAmount||"", taxFrequency: p.taxFrequency||"ANNUAL",
    insuranceAmount: p.insuranceAmount||"", insuranceFrequency: p.insuranceFrequency||"ANNUAL",
    monthlyRent: p.monthlyRent||""
  })
  const [saving, setSaving] = useState(false)
  async function save() {
    setSaving(true)
    await fetch(`/api/loans/${loan.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ property: { ...form, estimatedValue: parseFloat(form.estimatedValue as string)||null, taxAmount: parseFloat(form.taxAmount as string)||null, insuranceAmount: parseFloat(form.insuranceAmount as string)||null, monthlyRent: parseFloat(form.monthlyRent as string)||null } }) })
    setSaving(false); reload()
  }
  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-lg font-semibold">Property Information</h2>
      <div><label className={labelCls}>Address</label><input className={inputCls} value={form.address} onChange={e=>setForm({...form,address:e.target.value})} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className={labelCls}>Estimated Value</label><input type="number" className={inputCls} value={form.estimatedValue} onChange={e=>setForm({...form,estimatedValue:e.target.value})} /></div>
        <div><label className={labelCls}>Monthly Rent</label><input type="number" className={inputCls} value={form.monthlyRent} onChange={e=>setForm({...form,monthlyRent:e.target.value})} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-slate-700">Tax Amount</label>
            <select className="text-xs border rounded px-1 py-0.5" value={form.taxFrequency} onChange={e=>setForm({...form,taxFrequency:e.target.value})}><option value="ANNUAL">Annual</option><option value="MONTHLY">Monthly</option></select>
          </div>
          <input type="number" className={inputCls} value={form.taxAmount} onChange={e=>setForm({...form,taxAmount:e.target.value})} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-slate-700">Insurance Amount</label>
            <select className="text-xs border rounded px-1 py-0.5" value={form.insuranceFrequency} onChange={e=>setForm({...form,insuranceFrequency:e.target.value})}><option value="ANNUAL">Annual</option><option value="MONTHLY">Monthly</option></select>
          </div>
          <input type="number" className={inputCls} value={form.insuranceAmount} onChange={e=>setForm({...form,insuranceAmount:e.target.value})} />
        </div>
      </div>
      <button onClick={save} disabled={saving} className={btnPrimary}>{saving?"Saving...":"Save Property"}</button>
    </div>
  )
}

function EntityTab({ loan, reload }: any) {
  const ent = loan.entityRel || {}
  const [form, setForm] = useState({
    entityType: ent.entityType||"", entityName: ent.entityName||"", ein: ent.ein||"", stateOfFormation: ent.stateOfFormation||""
  })
  const [saving, setSaving] = useState(false)
  async function save() {
    setSaving(true)
    await fetch(`/api/loans/${loan.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ entity: form }) })
    setSaving(false); reload()
  }
  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-lg font-semibold">Entity Information</h2>
      <div>
        <label className={labelCls}>Entity Type</label>
        <div className="flex gap-3">
          {[["INDIVIDUAL","Individual"],["LLC_SINGLE","LLC (Single)"],["LLC_MULTI","LLC (Multi)"]].map(([v,l])=>(
            <button key={v} type="button" onClick={()=>setForm({...form,entityType:v})}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${form.entityType===v?"border-indigo-600 bg-indigo-50 text-indigo-700":"border-slate-200 text-slate-600"}`}>{l}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className={labelCls}>Entity Name</label><input className={inputCls} value={form.entityName} onChange={e=>setForm({...form,entityName:e.target.value})} /></div>
        <div><label className={labelCls}>EIN</label><input className={inputCls} value={form.ein} onChange={e=>setForm({...form,ein:e.target.value})} /></div>
      </div>
      <div><label className={labelCls}>State of Formation</label><input className={inputCls} value={form.stateOfFormation} onChange={e=>setForm({...form,stateOfFormation:e.target.value})} /></div>
      <button onClick={save} disabled={saving} className={btnPrimary}>{saving?"Saving...":"Save Entity"}</button>
    </div>
  )
}

function DSCRTab({ loan, reload }: any) {
  const [form, setForm] = useState({
    monthlyRent: loan.monthlyRent||"", vacancyPercent: loan.vacancyPercent||"", otherExpenses: loan.otherExpenses||""
  })
  const [saving, setSaving] = useState(false)

  const rent = parseFloat(form.monthlyRent as string)||0
  const vacancy = parseFloat(form.vacancyPercent as string)||0
  const other = parseFloat(form.otherExpenses as string)||0
  const egi = rent * (1 - vacancy/100)
  const noi = egi - other

  const P = loan.loanAmount||0
  const r = (loan.interestRate||0)/100/12
  const n = loan.termMonths||360
  const pi = r > 0 && P > 0 ? P*(r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1) : 0
  const monthlyTax = (loan.annualTaxes||0)/12
  const monthlyIns = (loan.annualInsurance||0)/12
  const pitia = pi + monthlyTax + monthlyIns

  const dscrNOI = pitia > 0 ? noi / pitia : 0
  const dscrSimple = pitia > 0 ? rent / pitia : 0

  async function save() {
    setSaving(true)
    await fetch(`/api/loans/${loan.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ monthlyRent: rent, vacancyPercent: vacancy, otherExpenses: other, dscrRatio: parseFloat(dscrSimple.toFixed(2)) }) })
    setSaving(false); reload()
  }

  const dscrColor = dscrSimple >= 1.25 ? "text-emerald-600 bg-emerald-50 border-emerald-200" : dscrSimple >= 1.0 ? "text-amber-600 bg-amber-50 border-amber-200" : "text-red-600 bg-red-50 border-red-200"

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-lg font-semibold">DSCR Calculator</h2>
      <div className={`text-center py-8 rounded-xl border-2 ${dscrColor}`}>
        <p className="text-sm font-medium mb-1">DSCR Ratio (Rent / PITIA)</p>
        <p className="text-5xl font-bold">{dscrSimple.toFixed(2)}</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div><label className={labelCls}>Monthly Rent</label><input type="number" className={inputCls} value={form.monthlyRent} onChange={e=>setForm({...form,monthlyRent:e.target.value})} /></div>
        <div><label className={labelCls}>Vacancy %</label><input type="number" className={inputCls} value={form.vacancyPercent} onChange={e=>setForm({...form,vacancyPercent:e.target.value})} /></div>
        <div><label className={labelCls}>Other Monthly Expenses</label><input type="number" className={inputCls} value={form.otherExpenses} onChange={e=>setForm({...form,otherExpenses:e.target.value})} /></div>
      </div>
      <div className="bg-slate-50 rounded-xl p-5 space-y-2">
        <div className="flex justify-between text-sm"><span className="text-slate-500">Effective Gross Income</span><span className="font-medium">${egi.toFixed(2)}</span></div>
        <div className="flex justify-between text-sm"><span className="text-slate-500">NOI (EGI - Expenses)</span><span className="font-medium">${noi.toFixed(2)}</span></div>
        <div className="border-t border-slate-200 my-2" />
        <div className="flex justify-between text-sm"><span className="text-slate-500">Monthly P&I</span><span className="font-medium">${pi.toFixed(2)}</span></div>
        <div className="flex justify-between text-sm"><span className="text-slate-500">Monthly Taxes</span><span className="font-medium">${monthlyTax.toFixed(2)}</span></div>
        <div className="flex justify-between text-sm"><span className="text-slate-500">Monthly Insurance</span><span className="font-medium">${monthlyIns.toFixed(2)}</span></div>
        <div className="flex justify-between text-sm font-semibold"><span>PITIA</span><span>${pitia.toFixed(2)}</span></div>
        <div className="border-t border-slate-200 my-2" />
        <div className="flex justify-between text-sm"><span className="text-slate-500">DSCR (NOI / PITIA)</span><span className="font-semibold">{dscrNOI.toFixed(2)}</span></div>
        <div className="flex justify-between text-sm"><span className="text-slate-500">DSCR (Rent / PITIA)</span><span className="font-bold text-lg">{dscrSimple.toFixed(2)}</span></div>
      </div>
      <button onClick={save} disabled={saving} className={btnPrimary}>{saving?"Saving...":"Save DSCR"}</button>
    </div>
  )
}

function ContactsTab({ loan, reload }: any) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name:"", email:"", phone:"", role:"" })
  const [saving, setSaving] = useState(false)

  async function addContact() {
    if (!form.name) return
    setSaving(true)
    await fetch(`/api/loans/${loan.id}/contacts`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(form) })
    setForm({ name:"", email:"", phone:"", role:"" }); setAdding(false); setSaving(false); reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Contacts</h2>
        <button onClick={()=>setAdding(!adding)} className={btnPrimary}>+ Add Contact</button>
      </div>
      {adding && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input className={inputCls} placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
            <input className={inputCls} placeholder="Role" value={form.role} onChange={e=>setForm({...form,role:e.target.value})} />
            <input className={inputCls} placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
            <input className={inputCls} placeholder="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} />
          </div>
          <div className="flex gap-2">
            <button onClick={addContact} disabled={saving} className={btnPrimary}>{saving?"Saving...":"Save"}</button>
            <button onClick={()=>setAdding(false)} className={btnSecondary}>Cancel</button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead><tr className="bg-slate-50 border-b"><th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Name</th><th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Email</th><th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Phone</th><th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Role</th></tr></thead>
          <tbody>{(loan.contacts||[]).map((c:any)=>(
            <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-3 text-sm font-medium">{c.name}</td>
              <td className="px-4 py-3 text-sm text-slate-600">{c.email||"—"}</td>
              <td className="px-4 py-3 text-sm text-slate-600">{c.phone||"—"}</td>
              <td className="px-4 py-3"><span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{c.role||"—"}</span></td>
            </tr>
          ))}</tbody>
        </table>
        {(loan.contacts||[]).length === 0 && <p className="text-center py-8 text-sm text-slate-400">No contacts yet</p>}
      </div>
    </div>
  )
}

function TasksTab({ loan, reload, isBorrower }: any) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ title:"", assignedTo:"", dueDate:"" })

  async function toggleTask(taskId: string, completed: boolean) {
    await fetch(`/api/tasks/${taskId}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ completed: !completed }) })
    reload()
  }

  async function addTask() {
    if (!form.title) return
    await fetch(`/api/loans/${loan.id}/tasks`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(form) })
    setForm({ title:"", assignedTo:"", dueDate:"" }); setAdding(false); reload()
  }

  const now = new Date()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tasks</h2>
        {!isBorrower && <button onClick={()=>setAdding(!adding)} className={btnPrimary}>+ Add Task</button>}
      </div>
      {adding && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <input className={inputCls} placeholder="Task title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
          <div className="grid grid-cols-2 gap-3">
            <input className={inputCls} placeholder="Assigned to" value={form.assignedTo} onChange={e=>setForm({...form,assignedTo:e.target.value})} />
            <input type="date" className={inputCls} value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} />
          </div>
          <div className="flex gap-2">
            <button onClick={addTask} className={btnPrimary}>Save</button>
            <button onClick={()=>setAdding(false)} className={btnSecondary}>Cancel</button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {(loan.tasks||[]).map((t:any) => {
          const overdue = t.dueDate && !t.completed && new Date(t.dueDate) < now
          return (
            <div key={t.id} className={`flex items-center gap-3 bg-white rounded-xl border p-4 ${overdue ? "border-red-200 bg-red-50" : "border-slate-200"}`}>
              <input type="checkbox" checked={t.completed} onChange={()=>!isBorrower && toggleTask(t.id, t.completed)}
                className="w-4.5 h-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" readOnly={isBorrower} />
              <div className="flex-1">
                <p className={`text-sm font-medium ${t.completed ? "line-through text-slate-400" : ""}`}>{t.title}</p>
                <div className="flex gap-3 mt-0.5">
                  {t.assignedTo && <span className="text-xs text-slate-400">{t.assignedTo}</span>}
                  {t.dueDate && <span className={`text-xs ${overdue ? "text-red-600 font-medium" : "text-slate-400"}`}>Due {new Date(t.dueDate).toLocaleDateString()}</span>}
                </div>
              </div>
              {t.completed && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Done</span>}
              {overdue && <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">Overdue</span>}
            </div>
          )
        })}
        {(loan.tasks||[]).length === 0 && <p className="text-center py-8 text-sm text-slate-400">No tasks yet</p>}
      </div>
    </div>
  )
}

function ConditionsTab({ loan, reload, isBorrower }: any) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ title:"", description:"" })
  const [expandedId, setExpandedId] = useState<string|null>(null)
  const [notes, setNotes] = useState<Record<string,string>>({})
  const fileRefs = useRef<Record<string, HTMLInputElement|null>>({})

  const conditions = loan.conditions || []
  const cleared = conditions.filter((c:any) => c.status === "CLEARED").length

  async function changeCondStatus(condId: string, status: string) {
    await fetch(`/api/conditions/${condId}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ status }) })
    reload()
  }

  async function saveNotes(condId: string) {
    await fetch(`/api/conditions/${condId}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ notes: notes[condId] }) })
    reload()
  }

  async function addCondition() {
    if (!form.title) return
    await fetch("/api/conditions", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ ...form, loanId: loan.id }) })
    setForm({ title:"", description:"" }); setAdding(false); reload()
  }

  async function uploadToCondition(condId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const fd = new FormData(); fd.append("file", file); fd.append("conditionId", condId)
    await fetch(`/api/loans/${loan.id}/documents`, { method:"POST", body: fd })
    reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Conditions</h2>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-48">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: conditions.length ? `${(cleared/conditions.length)*100}%` : "0%" }} />
            </div>
            <span className="text-sm text-slate-500">{cleared} of {conditions.length} cleared</span>
          </div>
        </div>
        {!isBorrower && <button onClick={()=>setAdding(!adding)} className={btnPrimary}>+ Add Condition</button>}
      </div>

      {adding && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <input className={inputCls} placeholder="Condition title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
          <textarea className={inputCls} placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={2} />
          <div className="flex gap-2">
            <button onClick={addCondition} className={btnPrimary}>Save</button>
            <button onClick={()=>setAdding(false)} className={btnSecondary}>Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {conditions.map((c:any) => {
          const expanded = expandedId === c.id
          return (
            <div key={c.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50" onClick={()=>setExpandedId(expanded?null:c.id)}>
                <svg className={`w-4 h-4 text-slate-400 transition-transform ${expanded?"rotate-90":""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                <span className="flex-1 text-sm font-medium">{c.title}</span>
                {c.documents?.length > 0 && <span className="text-xs text-slate-400">{c.documents.length} doc{c.documents.length>1?"s":""}</span>}
                {!isBorrower ? (
                  <select value={c.status} onChange={e=>{e.stopPropagation();changeCondStatus(c.id,e.target.value)}}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer ${COND_COLORS[c.status]}`} onClick={e=>e.stopPropagation()}>
                    <option value="OPEN">OPEN</option><option value="RECEIVED">RECEIVED</option><option value="CLEARED">CLEARED</option>
                  </select>
                ) : (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${COND_COLORS[c.status]}`}>{c.status}</span>
                )}
              </div>
              {expanded && (
                <div className="border-t border-slate-100 px-4 py-4 space-y-3 bg-slate-50">
                  {c.description && <p className="text-sm text-slate-600">{c.description}</p>}
                  {!isBorrower && (
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Notes</label>
                      <textarea className={inputCls} rows={2} value={notes[c.id]??c.notes??""} onChange={e=>setNotes({...notes,[c.id]:e.target.value})} />
                      <button onClick={()=>saveNotes(c.id)} className="mt-1 text-xs text-indigo-600 hover:underline">Save Notes</button>
                    </div>
                  )}
                  {/* Documents */}
                  {c.documents?.length > 0 && (
                    <div className="space-y-1">
                      {c.documents.map((d:any) => (
                        <div key={d.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-slate-200">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                          <a href={d.fileUrl} target="_blank" className="text-sm text-indigo-600 hover:underline flex-1">{d.fileName}</a>
                        </div>
                      ))}
                    </div>
                  )}
                  {!isBorrower && (
                    <div>
                      <input ref={el => { fileRefs.current[c.id] = el }} type="file" className="hidden" onChange={e=>uploadToCondition(c.id, e)} />
                      <button onClick={()=>fileRefs.current[c.id]?.click()} className={btnSecondary + " text-xs"}>
                        <span className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                          Upload Document
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {conditions.length === 0 && <p className="text-center py-8 text-sm text-slate-400">No conditions</p>}
      </div>
    </div>
  )
}

function TeamTab({ loan }: any) {
  return (
    <div className="space-y-6 max-w-lg">
      <h2 className="text-lg font-semibold">Team</h2>
      <div className="space-y-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-semibold text-indigo-600">
            {loan.broker?.name?.split(" ").map((n:string)=>n[0]).join("")||"?"}
          </div>
          <div>
            <p className="text-sm font-medium">{loan.broker?.name||"Unassigned"}</p>
            <p className="text-xs text-slate-500">{loan.broker?.email||""}</p>
          </div>
          <span className="ml-auto text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">Broker</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-sm font-semibold text-slate-600">P</div>
          <div>
            <p className="text-sm font-medium">Processor</p>
            <p className="text-xs text-slate-500">Not yet assigned</p>
          </div>
          <span className="ml-auto text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">Processor</span>
        </div>
      </div>
    </div>
  )
}
