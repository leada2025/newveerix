import React, { useState, useEffect } from 'react';
import axios from '../api/Axios';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { MessageSquare } from 'lucide-react';
import socket from "../Components/Socket"; // ✅ Make sure this import path is correct

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
      <div className={`text-sm ${active ? 'font-semibold text-emerald-700' : 'text-slate-600'}`}>
        {label}
      </div>
    </div>
  );
}

export default function NewOrderModal({ open, onClose, customerId, quoteData,onCreate,onOpenChat  }) {
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
const [showConfirm, setShowConfirm] = useState(false);
const [showChat, setShowChat] = useState(false);
const [quoteLimitReached, setQuoteLimitReached] = useState(false);
  // ---- Map quote status to step
  const statusOrder = ['Pending', 'Quote Sent', 'Approved Quote', 'Payment Requested', 'Paid'];
const getStepFromStatus = (status, quote) => {
  // If advance paid, go to final-step (4)
  if (quote?.advancePaid) return 4;
  switch (status) {
    case 'Pending': return 2;
    case 'Quote Sent': return 2;
    case 'Approved Quote': return 3; // admin approved but not paid (if you keep old mapping)
    case 'Payment Requested': return 3;
    case 'Advance Paid': return 4;
    case 'Final Payment Submitted': return 4; 
    case 'Paid': return 4;
    case 'Final Payment Requested': return 4;
    default: return 1;
  }
};


const isStepDone = (index) => {
  if (!quote) return false;

  // ✅ Only show tick (✔) for "Paid" on 4th step
  if (index === 4) {
    return quote.status === "Paid";
  }

  // For earlier steps, done if before current step
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



const submitQuote = async () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    const existingRes = await axios.get(`/api/quotes/customer/${user._id}`);
    const existingBrandNames = existingRes.data.map(q => q.brandName.toLowerCase());

    if (existingBrandNames.includes(form.brand.toLowerCase())) {
      alert("You have already submitted a quote for this brand name.");
      return;
    }

    // Submit the new quote
    const payload = {
      customerId: user._id,
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
    if (err.response?.data?.message) alert(err.response.data.message);
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

const isFormDisabled = !!quote?.status; 

// All your hooks (useState, useEffect, etc.)
useEffect(() => {
  if (!open) return; // run only when modal open

  if (!socket.connected) {
    socket.connect();
  }

  const user = JSON.parse(localStorage.getItem("user"));
  if (user?._id) {
    socket.emit("joinRoom", `customer_${user._id}`);
  }

const handleQuoteUpdate = (data) => {
  const updated = data.quote;
  setQuote((prev) => {
    if (!prev || updated._id !== prev._id) return prev;
    const newStep = getStepFromStatus(updated.status, updated);
    setStep(newStep);
    return updated;
  });
};


  socket.on("quote_updated", handleQuoteUpdate);

  return () => {
    socket.off("quote_updated", handleQuoteUpdate);
    socket.disconnect(); // 👈 ensure proper cleanup when modal closes
  };
}, [open]);
useEffect(() => {
  if (!open) return;

  if (quoteData) {
    // Existing quote: show current step & form
    setQuote(quoteData);
    setForm({
      brand: quoteData.brandName || '',
      molecule: quoteData.moleculeName || '',
      customMolecule: quoteData.customMolecule || '',
      qty: quoteData.quantity || '',
      unit: quoteData.unit || 'boxes',
    });
    setStep(getStepFromStatus(quoteData.status)); // ✅ current step
  } else {
    // New quote: empty form, step 1
    setQuote(null);
    setForm({ brand: '', molecule: '', customMolecule: '', qty: '', unit: 'boxes' });
    setStep(1); // start at step 1
  }

  setSubmitted(false);
  setShowConfirm(false);
}, [open, quoteData]);


useEffect(() => {
  if (!open) return;

  const user = JSON.parse(localStorage.getItem('user'));
  axios.get(`/api/quotes/customer/${user._id}`)
    .then(res => {
      // Count only active quotes
      const activeQuotes = res.data.filter(q => !['Paid', 'Rejected'].includes(q.status));
      setQuoteLimitReached(activeQuotes.length >= 5);
    })
    .catch(err => console.error(err));
}, [open]);


if (!open) return null;



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
      done={isStepDone(i + 1)} // ✅ pass 1-based index
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
        disabled={isFormDisabled}
        className="mt-1 p-2 border rounded-lg w-full disabled:bg-slate-100"
        placeholder="Enter Brand Name"
      />
    </div>
    <div>
      <label className="text-xs text-slate-500">Molecule</label>
      <select
        value={form.molecule}
        onChange={e => setForm({ ...form, molecule: e.target.value, customMolecule: '' })}
        disabled={isFormDisabled || !!form.customMolecule}
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
        disabled={isFormDisabled || !!form.molecule}
        className="mt-1 p-2 border rounded-lg w-full disabled:bg-slate-100"
        placeholder="Custom molecule"
      />
    </div>
    <div>
      <label className="text-xs text-slate-500">Quantity</label>
      <select
        value={form.qty}
        onChange={e => setForm({ ...form, qty: e.target.value })}
        disabled={isFormDisabled}
        className="mt-1 p-2 border rounded-lg w-full disabled:bg-slate-100"
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
        disabled={isFormDisabled}
        className="mt-1 p-2 border rounded-lg w-full disabled:bg-slate-100"
      >
        <option value="boxes">boxes</option>
        <option value="packs">packs</option>
        <option value="units">units</option>
      </select>
    </div>

    <div className="col-span-2 flex justify-end mt-3">
      <button
        onClick={submitQuote}
        disabled={isSubmitDisabled  || quoteLimitReached}
        className="px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Submit Request
      </button>
    </div>
  </div>
)}
{quoteLimitReached && (
  <p className="text-red-500 text-sm mt-2">
    You have reached the maximum of 5 active quotes.
  </p>
)}
          {/* Step 2 */}
{step === 2 && (
  <div>
    <div className="text-sm font-medium mb-2">Quote Approval</div>

    <div className="p-4 bg-white rounded-lg border">
      <p className="text-sm text-slate-600">Estimated Rate:</p>
      <p className="text-xl font-bold text-emerald-600">
  {quote?.estimatedRate ? (
    <>
      ₹ {quote.estimatedRate}
      <span className="font-normal text-sm text-slate-700">
        {" "}
        for {quote.quantity} {quote.unit || "units"}
      </span>
    </>
  ) : (
    <span className="font-normal text-slate-600">
      Please wait, we will send you a quote soon...
    </span>
  )}
</p>

    </div>

    <div className="mt-4 flex flex-col gap-3">
      <div className="flex gap-2">
        <button
          onClick={() => setShowConfirm(true)}
          disabled={quote?.status !== 'Quote Sent'}
          className={`px-4 py-2 rounded-lg bg-emerald-600 text-white
            ${quote?.status !== 'Quote Sent' ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {quote?.status === 'Approved Quote' ? 'Quote Approved' : 'Accept Quote'}
        </button>

     <button
          onClick={() =>
    onOpenChat(quote?._id, quote?.customerId?._id)
  }
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white"
          title="Chat with Admin"
        >
         <span className="text-sm font-medium text-white">Request Changes</span><MessageSquare className="w-5 h-5" />
        </button>
      </div>

   
    </div>
  </div>
)}

          {/* Step 3 */}
        {/* Step 3 */}
{/* Step 3 - Payment Requested */}
{/* Step 3 - Payment Requested */}
{step === 3 && (
  <div>
    <div className="text-sm font-medium mb-2">Payment Requested</div>

    {/* Amount & Percentage */}
    <div className="p-4 bg-white rounded-lg border">
      <p className="text-sm text-slate-600 mb-1">Requested Amount:</p>
      <p className="text-xl font-bold text-emerald-600">
        ₹ {quote?.requestedAmount || "Waiting for admin…"}
      </p>

      {/* Compute advance percentage dynamically */}
      {(() => {
        const advancePercentage =
          quote?.requestedPercentage ??
          (quote?.requestedAmount && quote?.estimatedRate
            ? Math.round((quote.requestedAmount / quote.estimatedRate) * 100)
            : null);

        return advancePercentage ? (
          <p className="text-sm text-slate-500 mt-2">
            {advancePercentage}% advance required now. Remaining{" "}
            {100 - advancePercentage}% is payable before dispatch.
          </p>
        ) : (
          <p className="text-sm text-slate-500 mt-2">
            Waiting for admin to select advance percentage.
          </p>
        );
      })()}
    </div>

    {/* Payment Action */}
    {quote?.status === "Payment Requested" ? (
      <div className="mt-4">
        {!form.paymentSubmitted ? (
          (() => {
            const advancePercentage =
              quote?.requestedPercentage ??
              (quote?.requestedAmount && quote?.estimatedRate
                ? Math.round((quote.requestedAmount / quote.estimatedRate) * 100)
                : null);

            return (
              <button
                onClick={async () => {
                  if (!advancePercentage) return;

                  try {
                    const token = localStorage.getItem("authToken"); // 🔑 token
                    await axios.patch(
                      `/api/quotes/${quote._id}/customer-advance-payment`,
                      {
                        method: "UPI",
                        transactionId: "TXN" + Date.now(),
                        screenshotUrl: null,
                      },
                      { headers: { Authorization: `Bearer ${token}` } }
                    );

                    alert("Advance payment submitted!");
                    setForm((prev) => ({ ...prev, paymentSubmitted: true }));
                  } catch (err) {
                    console.error("Failed to submit payment:", err?.response?.data || err);
                    alert(err?.response?.data?.message || "Failed to submit payment. Try again.");
                  }
                }}
                disabled={!advancePercentage}
                className={`px-4 py-2 rounded-lg ${
                  advancePercentage
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-300 text-slate-500 cursor-not-allowed"
                }`}
              >
                Pay {advancePercentage ?? 50}% Advance
              </button>
            );
          })()
        ) : (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
            Advance payment is being processed...
            <br />
            Once verified, the remaining{" "}
            {100 -
              (quote?.requestedPercentage ??
                (quote?.requestedAmount && quote?.estimatedRate
                  ? Math.round((quote.requestedAmount / quote.estimatedRate) * 100)
                  : 50))}{" "}
            % will be requested before dispatch.
          </div>
        )}
      </div>
    ) : (
      <div className="p-4 mt-4 bg-slate-50 border border-slate-200 rounded text-slate-600">
       Confirmed your advance payment.
      </div>
    )}

    <div className="text-xs text-slate-500 mt-3">
      After you complete the advance payment, the admin will confirm and request the remaining{" "}
      {100 -
        (quote?.requestedPercentage ??
          (quote?.requestedAmount && quote?.estimatedRate
            ? Math.round((quote.requestedAmount / quote.estimatedRate) * 100)
            : 50))}{" "}
      % before dispatch.
    </div>
  </div>
)}


          {/* Step 4 */}
 {step === 4 && (
  <div>
    <div className="text-sm font-medium mb-2">Payment</div>

    {/* Advance success banner */}
    <div className="p-4 bg-green-50 rounded border border-green-100 mb-3">
      <p className="font-medium text-green-700">✅ Advance payment completed.</p>
      <p className="text-sm text-slate-600">Thank you — your advance has been received.</p>
    </div>

    {/* Balance card */}
    <div className="p-4 bg-white rounded border">
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm text-slate-700">Remaining Balance</div>
        <div className="text-lg font-bold text-emerald-600">
          ₹ {quote?.balanceAmount ?? (quote?.finalAmount ? (quote.finalAmount - (quote.payments?.reduce((s,p)=>s+(p.amount||0),0) || 0)) : '—')}
        </div>
      </div>

      {/* If admin requested final payment -> enable pay button */}
      {quote?.status === 'Final Payment Requested' && !quote?.finalPaid ? (
        <div className="mt-3 flex gap-3 items-center">
          <button
            onClick={async () => {
              try {
                const token = localStorage.getItem("authToken");
                const amount = quote.balanceAmount ?? (quote.finalAmount - (quote.payments?.reduce((s,p)=>s+(p.amount||0),0) || 0));
                const res = await axios.patch(`/api/quotes/${quote._id}/customer-final-payment`, {
                  amount,
                  method: "UPI",
                  transactionId: "TXN_FINAL_" + Date.now()
                }, { headers: { Authorization: `Bearer ${token}` } });

                // update local quote
                setQuote(res.data);
                alert("Final payment submitted! Awaiting admin verification.");
              } catch (err) {
                console.error("Final payment error", err);
                alert(err?.response?.data?.message || "Final payment failed");
              }
            }}
            className="px-4 py-2 rounded bg-emerald-600 text-white"
          >
            Pay Final Amount
          </button>

          <div className="text-sm text-slate-500">
            or contact support if you need another payment method.
          </div>
        </div>
      ) : quote?.status === 'Final Payment Submitted' && !quote?.finalPaid ? (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
          ✅ Payment submitted. We will verify your payment shortly.
        </div>
      ) : quote?.status === 'Paid' || quote?.finalPaid ? (
        <div className="p-3 bg-green-50 rounded text-green-800">
          ✅ Full payment received. Order complete.
        </div>
      ) : (
        <div className="p-3 bg-yellow-50 rounded text-yellow-800">
          Waiting for admin to request final payment...
        </div>
      )}
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
      {showConfirm && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/50 bg-opacity-40 z-50">
    <div className="bg-white rounded-xl shadow-lg p-6 w-80">
      <h3 className="text-lg font-semibold text-slate-800 mb-2">
        Confirm Acceptance
      </h3>
      <p className="text-sm text-slate-600 mb-4">
        Are you sure you want to accept this quote?
      </p>
      <div className="flex justify-end gap-3">
        <button
          onClick={() => setShowConfirm(false)}
          className="px-4 py-2 rounded-lg border text-slate-700"
        >
          Cancel
        </button>
        <button
          onClick={async () => {
            await acceptQuote();
            setShowConfirm(false);
          }}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white"
        >
          Yes, Accept
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
