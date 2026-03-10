"use client"
import { useEffect, useState } from "react"
import Link from "next/link"

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [filter, setFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    Promise.all([
      fetch("/api/contacts").then(r=>r.json()),
      fetch("/api/companies").then(r=>r.json()),
      fetch("/api/me").then(r=>r.json())
    ]).then(([contactsData, companiesData, userData]) => {
      setContacts(contactsData)
      setCompanies(companiesData)
      setUser(userData)
      setLoading(false)
    })
  }, [])

  const filtered = contacts.filter(c => {
    if (filter === "all") return true
    return c.company?.type?.toLowerCase() === filter.toLowerCase()
  })

  if (loading) return <div className="p-8 flex justify-center"><div className="spinner"/></div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Address Book</h1>
        {user?.role !== 'BORROWER' && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            Add Contact
          </button>
        )}
      </div>
      
      <div className="flex gap-2">
        {[["all","All"],["lender","Lenders"],["title","Title"],["insurance","Insurance"]].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter===k?"bg-indigo-600 text-white":"bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{l}</button>
        ))}
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead><tr className="bg-slate-50 border-b">
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Name</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Email</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Phone</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Company</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Auto-Assign</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Active Loans</th>
          </tr></thead>
          <tbody>{filtered.map(c => {
            const fullName = `${c.firstName} ${c.lastName || ''}`.trim()
            const activeLoanCount = c.loanContacts?.length || 0
            return (
              <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-5 py-3.5 text-sm font-medium">{fullName}</td>
                <td className="px-5 py-3.5 text-sm text-slate-600">{c.email||"—"}</td>
                <td className="px-5 py-3.5 text-sm text-slate-600">{c.phone||"—"}</td>
                <td className="px-5 py-3.5">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{c.company?.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full w-fit ${
                      c.company?.type === 'LENDER' ? 'bg-blue-100 text-blue-600' :
                      c.company?.type === 'TITLE' ? 'bg-green-100 text-green-600' :
                      c.company?.type === 'INSURANCE' ? 'bg-orange-100 text-orange-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {c.company?.type}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  {c.autoAssign ? (
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Yes</span>
                  ) : (
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">No</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-sm text-slate-600">
                  {activeLoanCount > 0 ? (
                    <span className="text-indigo-600 font-medium">{activeLoanCount}</span>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            )
          })}</tbody>
        </table>
        {filtered.length===0 && <p className="text-center py-12 text-sm text-slate-400">No contacts found</p>}
      </div>

      {showAddModal && <AddContactModal companies={companies} onClose={() => setShowAddModal(false)} onAdd={(contact) => {
        setContacts([contact, ...contacts])
        setShowAddModal(false)
      }} />}
    </div>
  )
}

function AddContactModal({ companies, onClose, onAdd }: any) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyId: '',
    autoAssign: false
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const response = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    const contact = await response.json()
    onAdd(contact)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Add New Contact</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">First Name *</label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={e => setFormData({...formData, firstName: e.target.value})}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={e => setFormData({...formData, lastName: e.target.value})}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Company *</label>
            <select
              required
              value={formData.companyId}
              onChange={e => setFormData({...formData, companyId: e.target.value})}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">Select a company...</option>
              {companies.map((company: any) => (
                <option key={company.id} value={company.id}>
                  {company.name} ({company.type})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoAssign"
              checked={formData.autoAssign}
              onChange={e => setFormData({...formData, autoAssign: e.target.checked})}
              className="mr-2"
            />
            <label htmlFor="autoAssign" className="text-sm">Auto-assign to new loans</label>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Add Contact
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
