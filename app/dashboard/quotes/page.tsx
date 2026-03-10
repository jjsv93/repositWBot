"use client"
import { useEffect, useState } from "react"
import Link from "next/link"

export default function QuotesPage() {
  const [quoteRequests, setQuoteRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [showGiveQuoteModal, setShowGiveQuoteModal] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/quote-requests").then(r=>r.json()),
      fetch("/api/me").then(r=>r.json())
    ]).then(([quotes, userData]) => {
      setQuoteRequests(quotes)
      setUser(userData)
      setLoading(false)
    })
  }, [])

  async function acceptQuote(quoteOptionId: string) {
    const response = await fetch('/api/quote-options', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteOptionId })
    })
    if (response.ok) {
      // Refresh the data
      const quotes = await fetch("/api/quote-requests").then(r=>r.json())
      setQuoteRequests(quotes)
    }
  }

  async function startLoan(quoteRequestId: string) {
    const response = await fetch(`/api/quote-requests/${quoteRequestId}/start-loan`, {
      method: 'POST'
    })
    if (response.ok) {
      const loan = await response.json()
      // Redirect to the new loan
      window.location.href = `/dashboard/loans/${loan.id}`
    }
  }

  if (loading) return <div className="p-8 flex justify-center"><div className="spinner"/></div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {user?.role === 'BORROWER' ? 'My Quotes' : 'Quote Requests'}
        </h1>
        {user?.role === 'BROKER' && (
          <button 
            onClick={() => setShowGiveQuoteModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            Give Quote
          </button>
        )}
      </div>

      <div className="space-y-4">
        {quoteRequests.map(request => (
          <QuoteRequestCard 
            key={request.id} 
            request={request} 
            user={user}
            onAcceptQuote={acceptQuote}
            onStartLoan={startLoan}
          />
        ))}
        {quoteRequests.length === 0 && (
          <p className="text-center py-12 text-sm text-slate-400">
            {user?.role === 'BORROWER' ? 'No quotes available' : 'No quote requests found'}
          </p>
        )}
      </div>

      {showGiveQuoteModal && (
        <GiveQuoteModal 
          onClose={() => setShowGiveQuoteModal(false)} 
          onAdd={(request: any) => {
            setQuoteRequests([request, ...quoteRequests])
            setShowGiveQuoteModal(false)
          }}
        />
      )}
    </div>
  )
}

function QuoteRequestCard({ request, user, onAcceptQuote, onStartLoan }: any) {
  const acceptedOption = request.quoteOptions.find((opt: any) => opt.status === 'ACCEPTED')
  const hasAcceptedQuote = !!acceptedOption

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg">{request.borrowerEmail}</h3>
          <p className="text-slate-600 text-sm">
            {request.propertyAddress}, {request.propertyCity}, {request.propertyState} {request.propertyZip}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {new Date(request.createdAt).toLocaleDateString()}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          request.status === 'OPEN' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'
        }`}>
          {request.status}
        </span>
      </div>

      {request.quoteOptions.length > 0 ? (
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Quote Options:</h4>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {request.quoteOptions.map((option: any) => (
              <div key={option.id} className={`p-4 border rounded-lg ${
                option.status === 'ACCEPTED' ? 'border-green-200 bg-green-50' : 'border-slate-200'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium">{option.loanType}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    option.status === 'ACCEPTED' ? 'bg-green-100 text-green-600' :
                    option.status === 'SENT' ? 'bg-blue-100 text-blue-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {option.status}
                  </span>
                </div>
                <div className="text-sm space-y-1">
                  <p>Amount: <span className="font-medium">${option.loanAmount.toLocaleString()}</span></p>
                  <p>Rate: <span className="font-medium">{option.interestRate}%</span></p>
                  <p>Term: <span className="font-medium">{Math.round(option.termMonths/12)}y</span></p>
                  {option.points && <p>Points: <span className="font-medium">{option.points}%</span></p>}
                  <p>Payment: <span className="font-medium">${option.estimatedPayment.toLocaleString()}/mo</span></p>
                </div>
                
                {user?.role === 'BORROWER' && option.status === 'SENT' && !hasAcceptedQuote && (
                  <button
                    onClick={() => onAcceptQuote(option.id)}
                    className="w-full mt-3 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                  >
                    Accept Quote
                  </button>
                )}
              </div>
            ))}
          </div>

          {user?.role === 'BROKER' && hasAcceptedQuote && (
            <button
              onClick={() => onStartLoan(request.id)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              Start Loan from Accepted Quote
            </button>
          )}
        </div>
      ) : (
        user?.role === 'BROKER' && (
          <AddQuoteOptionsButton requestId={request.id} />
        )
      )}
    </div>
  )
}

function AddQuoteOptionsButton({ requestId }: { requestId: string }) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
      >
        Add Quote Options
      </button>
      {showModal && (
        <QuoteOptionsModal
          requestId={requestId}
          onClose={() => setShowModal(false)}
          onAdd={() => {
            setShowModal(false)
            window.location.reload()
          }}
        />
      )}
    </>
  )
}

function GiveQuoteModal({ onClose, onAdd }: any) {
  const [formData, setFormData] = useState({
    borrowerEmail: '',
    propertyAddress: '',
    propertyCity: '',
    propertyState: '',
    propertyZip: ''
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const response = await fetch('/api/quote-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    const request = await response.json()
    onAdd(request)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Create Quote Request</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Borrower Email *</label>
            <input
              type="email"
              required
              value={formData.borrowerEmail}
              onChange={e => setFormData({...formData, borrowerEmail: e.target.value})}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Property Address *</label>
            <input
              type="text"
              required
              value={formData.propertyAddress}
              onChange={e => setFormData({...formData, propertyAddress: e.target.value})}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">City *</label>
              <input
                type="text"
                required
                value={formData.propertyCity}
                onChange={e => setFormData({...formData, propertyCity: e.target.value})}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">State *</label>
              <input
                type="text"
                required
                value={formData.propertyState}
                onChange={e => setFormData({...formData, propertyState: e.target.value})}
                className="w-full p-2 border rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ZIP Code *</label>
            <input
              type="text"
              required
              value={formData.propertyZip}
              onChange={e => setFormData({...formData, propertyZip: e.target.value})}
              className="w-full p-2 border rounded-lg"
            />
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
              Create Request
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function QuoteOptionsModal({ requestId, onClose, onAdd }: any) {
  const [options, setOptions] = useState([{
    loanType: 'DSCR',
    loanAmount: '',
    interestRate: '',
    termMonths: 360,
    points: '',
    estimatedPayment: ''
  }])

  function addOption() {
    setOptions([...options, {
      loanType: 'DSCR',
      loanAmount: '',
      interestRate: '',
      termMonths: 360,
      points: '',
      estimatedPayment: ''
    }])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    for (const option of options) {
      await fetch('/api/quote-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteRequestId: requestId,
          loanType: option.loanType,
          loanAmount: parseFloat(option.loanAmount),
          interestRate: parseFloat(option.interestRate),
          termMonths: option.termMonths,
          points: option.points ? parseFloat(option.points) : null,
          estimatedPayment: parseFloat(option.estimatedPayment)
        })
      })
    }
    
    onAdd()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Add Quote Options</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {options.map((option, index) => (
            <div key={index} className="p-4 border border-slate-200 rounded-lg space-y-3">
              <h3 className="font-medium">Option {index + 1}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Loan Type</label>
                  <select
                    value={option.loanType}
                    onChange={e => {
                      const newOptions = [...options]
                      newOptions[index].loanType = e.target.value
                      setOptions(newOptions)
                    }}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="DSCR">DSCR</option>
                    <option value="BRIDGE">Bridge</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Loan Amount *</label>
                  <input
                    type="number"
                    required
                    value={option.loanAmount}
                    onChange={e => {
                      const newOptions = [...options]
                      newOptions[index].loanAmount = e.target.value
                      setOptions(newOptions)
                    }}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Interest Rate (%) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={option.interestRate}
                    onChange={e => {
                      const newOptions = [...options]
                      newOptions[index].interestRate = e.target.value
                      setOptions(newOptions)
                    }}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Term (Months)</label>
                  <select
                    value={option.termMonths}
                    onChange={e => {
                      const newOptions = [...options]
                      newOptions[index].termMonths = parseInt(e.target.value)
                      setOptions(newOptions)
                    }}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value={12}>1 Year</option>
                    <option value={24}>2 Years</option>
                    <option value={36}>3 Years</option>
                    <option value={60}>5 Years</option>
                    <option value={360}>30 Years</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Points (%)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={option.points}
                    onChange={e => {
                      const newOptions = [...options]
                      newOptions[index].points = e.target.value
                      setOptions(newOptions)
                    }}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Est. Monthly Payment *</label>
                  <input
                    type="number"
                    required
                    value={option.estimatedPayment}
                    onChange={e => {
                      const newOptions = [...options]
                      newOptions[index].estimatedPayment = e.target.value
                      setOptions(newOptions)
                    }}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addOption}
            className="w-full px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
          >
            Add Another Option
          </button>

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
              Send Quote Options
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}