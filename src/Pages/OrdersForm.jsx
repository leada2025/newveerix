import React, { useState, useEffect } from 'react';
import axios from '../api/Axios';
import { ArrowLeft, ArrowRight } from 'lucide-react';

function Step({ index, label, active, done }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium 
        ${done ? 'bg-emerald-500 text-white'
          : active ? 'bg-emerald-100 text-emerald-700'
          : 'bg-slate-200 text-slate-500'}`}
      >
        {done ? '✔' : index}
      </div>
      <div className={`text-sm ${active ? 'font-semibold' : 'text-slate-600'}`}>{label}</div>
    </div>
  );
}

export default function NewOrderModal({ open, onClose, customerId, quoteData,onCreate  }) {
  const [step, setStep] = useState(1);
    const [submitted, setSubmitted] = useState(false); 
  const [form, setForm] = useState({
    brand: '',
    molecule: '',
    customMolecule: '',
    qty: '',
    unit: 'boxes',
  });
  const [moleculeOptions, setMoleculeOptions] = useState([]);
  const [quote, setQuote] = useState(null);

  // ---- Map quote status to step
  const statusOrder = ['Pending', 'Quote Sent', 'Approved Quote', 'Payment Requested', 'Paid'];
const getStepFromStatus = (status) => {
  switch (status) {
    case 'Pending': return 2;
    case 'Quote Sent': return 2;
    case 'Approved Quote': return 3;
    case 'Payment Requested': return 3;
    case 'Paid': return 4;
    default: return 1;
  }
};

const isStepDone = (index) => {
  if (!quote) return false;

  // Only mark previous steps as done
  const stepNumber = getStepFromStatus(quote.status);
  return index < stepNumber;
};



  const stepStatus = [
    { label: 'Request Quote' },
    { label: 'Quote Approval' },
    { label: 'Payment Requested' },
    { label: 'Paid' },
  ];

  // ---- Sync quote data
  useEffect(() => {
  if (quoteData) {
    setQuote(quoteData);
    setForm({
      brand: quoteData.brandName || '',
      molecule: quoteData.moleculeName || '',
      customMolecule: quoteData.customMolecule || '',
      qty: quoteData.quantity || '',
      unit: quoteData.unit || 'boxes',
    });
    // Sync step with status
    setStep(getStepFromStatus(quoteData.status));
  } else {
    setQuote(null);
    setForm({ brand: '', molecule: '', customMolecule: '', qty: '', unit: 'boxes' });
    setStep(1);
  }
  setSubmitted(false);
}, [quoteData]);

  // ---- Fetch molecules
  useEffect(() => {
    if (!open) return;
    axios.get('/api/molecules')
      .then(res => setMoleculeOptions(res.data.map(m => ({ value: m.name, label: m.name }))))
      .catch(err => console.error('Failed to fetch molecules:', err));
  }, [open]);

  if (!open) return null;

 // Determine max step allowed based on quote status
const getMaxStep = () => {
  if (!quote) return 2; // Only step 1 available if no quote
  const stepNumber = getStepFromStatus(quote.status);
  return stepNumber;
};



const prev = () => setStep(s => Math.max(1, s - 1));
const next = () => {
  const maxStep = getMaxStep();
  setStep(s => Math.min(s + 1, maxStep));
};



  // ---- Submit quote
  const submitQuote = async () => {
    try {
      const payload = {
        customerId,
        moleculeName: form.molecule,
        customMolecule: form.customMolecule,
        quantity: form.qty,
        unit: form.unit,
        brandName: form.brand,
      };
      const res = await axios.post('/api/quotes', payload);
       onCreate(res.data);
      setQuote(res.data);
      setStep(2);
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit quote:', err);
    }
  };

  // ---- Accept quote
  const acceptQuote = async () => {
    if (!quote) return;
    try {
      const res = await axios.patch(`/api/quotes/${quote._id}/approve-customer`);
      setQuote(res.data);
      setStep(3);
    } catch (err) {
      console.error('Failed to approve quote:', err);
    }
  };

  const quantityOptions = [300, 500, 1000];
   // Step 1 submit button should be disabled if status is not Pending or fields not filled
const isSubmitDisabled =
  !form.brand ||
  (!form.molecule && !form.customMolecule) ||
  !form.qty ||
  !!quote?.status; // disable if any status exists



  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="w-[900px] bg-white rounded-2xl p-6 shadow-lg">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-lg font-semibold">New Quote Request</div>
            <div className="text-sm text-slate-500">
              Follow the steps to request a quote and track approval.
            </div>
          </div>
          <button onClick={onClose} className="text-sm text-slate-500">Close</button>
        </div>

        {/* Stepper */}
        <div className="mb-6 grid grid-cols-4 gap-3">
          {stepStatus.map((s, i) => (
            <Step
              key={i}
              index={i + 1}
              label={s.label}
              active={step === i + 1}
              done={isStepDone(i)}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-slate-50 p-4 rounded-lg mb-4">
          {/* Step 1 */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500">Brand Name</label>
                <input
                  type="text"
                  value={form.brand}
                  onChange={e => setForm({ ...form, brand: e.target.value })}
                  className="mt-1 p-2 border rounded-lg w-full"
                  placeholder="Enter Brand Name"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Molecule</label>
                <select
                  value={form.molecule}
                  onChange={e => setForm({ ...form, molecule: e.target.value, customMolecule: '' })}
                  disabled={!!form.customMolecule}
                  className="mt-1 p-2 border rounded-lg w-full disabled:bg-slate-100"
                >
                  <option value="">Select Molecule</option>
                  {moleculeOptions.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500">Or Custom Molecule</label>
                <input
                  value={form.customMolecule}
                  onChange={e => setForm({ ...form, customMolecule: e.target.value, molecule: '' })}
                  disabled={!!form.molecule}
                  className="mt-1 p-2 border rounded-lg w-full disabled:bg-slate-100"
                  placeholder="Custom molecule"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Quantity</label>
                <select
                  value={form.qty}
                  onChange={e => setForm({ ...form, qty: e.target.value })}
                  className="mt-1 p-2 border rounded-lg w-full"
                >
                  <option value="">Select Quantity</option>
                  {quantityOptions.map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500">Unit</label>
                <select
                  value={form.unit}
                  onChange={e => setForm({ ...form, unit: e.target.value })}
                  className="mt-1 p-2 border rounded-lg w-full"
                >
                  <option value="boxes">boxes</option>
                  <option value="packs">packs</option>
                  <option value="units">units</option>
                </select>
              </div>
              <div className="col-span-2 flex justify-end mt-3">
                <button
          onClick={submitQuote}
          disabled={isSubmitDisabled}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit Request
        </button>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div>
              <div className="text-sm font-medium mb-2">Quote Approval</div>
              <div className="p-4 bg-white rounded-lg border">
                <p className="text-sm text-slate-600">Estimated Rate:</p>
                <p className="text-xl font-bold text-emerald-600">
                  ₹ {quote?.estimatedRate || 'Waiting for admin…'}
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={acceptQuote}
                  disabled={quote?.status !== 'Quote Sent'}
                  className={`px-4 py-2 rounded-lg bg-emerald-600 text-white
                    ${quote?.status !== 'Quote Sent' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {quote?.status === 'Approved Quote' ? 'Quote Approved' : 'Accept Quote'}
                </button>
                <button onClick={prev} className="px-4 py-2 rounded-lg border">Back</button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
  <div>
    <div className="text-sm font-medium mb-2">Payment Requested</div>
    <div className="p-4 bg-white rounded-lg border">
      <p className="text-sm text-slate-600">Requested Amount:</p>
      <p className="text-xl font-bold text-emerald-600">
        ₹ {quote?.requestedAmount || 'Waiting for admin…'}
      </p>
    </div>

    {quote?.status === "Payment Requested" && (
      <div className="mt-4">
        {!form.paymentSubmitted ? (
          <button
            onClick={async () => {
              try {
                // Call API to mark payment submitted (if needed)
                await axios.patch(`/api/quotes/${quote._id}/customer-payment`, {
                  // No transactionId needed
                });
                alert("Payment done!");
                setForm(prev => ({ ...prev, paymentSubmitted: true }));
              } catch (err) {
                console.error("Failed to submit payment:", err);
              }
            }}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white"
          >
            Pay Now
          </button>
        ) : (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
            Payment is being processed...<br />
            Once our team verifies, we will give you confirmation.
          </div>
        )}
      </div>
    )}

    <div className="text-xs text-slate-500 mt-2">
      After you submit payment, the admin will verify and mark as <b>Paid</b>.
    </div>
  </div>
)}

          {/* Step 4 */}
          {step === 4 && (
            <div>
              <div className="text-sm font-medium mb-2">Payment Confirmed</div>
              <div className="p-4 bg-white rounded-lg border text-emerald-600 font-bold">
                Payment Successful!
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={onClose} className="px-4 py-2 rounded-lg bg-emerald-600 text-white">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500">Step {step} of 4</div>
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button onClick={prev} className="p-2 rounded-lg border">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            {step < 4 && (
              <button
                onClick={next}
                className={`p-2 rounded-lg border bg-emerald-600 text-white`}
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
