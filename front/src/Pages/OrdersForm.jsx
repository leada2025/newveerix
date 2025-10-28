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
  const existingBrandNames = existingRes.data
  .map(q => (q.brandName ? q.brandName.toLowerCase() : ""))
  .filter(name => name !== "")


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
  brandName: form.addBrandLater ? "" : form.brand,
  addBrandLater: form.addBrandLater || false,

  cartonBoxCharges: form.cartonBoxCharges || false,
  artworkCharges: form.artworkCharges || false,
  labelCharges: form.labelCharges || false,
  cylinderCharges: form.cylinderCharges || false,
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
    (!form.addBrandLater && (!form.brand || form.brand.trim() === "")) ||
  (!form.molecule && !form.customMolecule) ||
  !form.qty ||
  !!quote?.status;// disable if any status exists

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
  <div className="grid grid-cols-2 gap-3">
    {/* Brand Name & Add Brand Later */}
    <div>
      <label className="text-xs text-slate-500">Brand Name</label>
      <input
        type="text"
        value={form.brand}
        onChange={e => setForm({ ...form, brand: e.target.value })}
        disabled={isFormDisabled || form.addBrandLater}
        className="mt-1 p-2 border rounded-lg w-full disabled:bg-slate-100"
        placeholder="Enter Brand Name"
      />
      <div className="flex items-center gap-2 mt-2">
        <input
          type="checkbox"
          id="addBrandLater"
          checked={form.addBrandLater || false}
          onChange={e => setForm({ ...form, addBrandLater: e.target.checked })}
          disabled={isFormDisabled}
        />
        <label htmlFor="addBrandLater" className="text-xs text-slate-600">
          Add BrandName Later
        </label>
      </div>
    </div>

    {/* Molecule dropdown */}
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

    {/* Custom Molecule */}
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

    {/* Quantity */}
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

    {/* Unit */}
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

    {/* Cost Checkboxes (full width) */}
    <div className="col-span-2 mt-3">
      <label className="text-xs text-slate-500">Additional Charges</label>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {[
       
          { key: "cartonBoxCharges", label: "Carton Box Charges" },
          { key: "artworkCharges", label: "Artwork Charges" },
          { key: "labelCharges", label: "Label Charges" },
          { key: "cylinderCharges", label: "Cylinder Charges" },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={form[key] || false}
              onChange={e => setForm({ ...form, [key]: e.target.checked })}
              disabled={isFormDisabled}
            />
            {label}
          </label>
        ))}
      </div>
    </div>

    {/* Submit button */}
    <div className="col-span-2 flex justify-end mt-4">
      <button
        onClick={submitQuote}
        disabled={isSubmitDisabled || quoteLimitReached}
        className="px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Submit Request
      </button>
    
    </div>
      {quoteLimitReached && ( <p className="text-red-500 text-sm mt-2"> You have reached the maximum of 5 active quotes. </p> )}
  </div>
)}

          {/* Step 2 */}
{step === 2 && (
  <div>
    <div className="text-sm font-medium mb-2">Quote Approval</div>

    {/* Quote Card */}
    <div className="bg-white rounded-lg border border-slate-200 p-5 flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-600 mb-1">Estimated Rate:</p>
        {quote?.estimatedRate ? (
          <p className="text-2xl font-bold text-emerald-600">
            ₹ {quote.estimatedRate.toLocaleString()}{" "}
            <span className="text-sm font-normal text-slate-700">
              for {quote.quantity} {quote.unit || "units"}
            </span>
          </p>
        ) : (
          <p className="text-slate-600 text-sm">
            Please wait, we will send you a quote soon...
          </p>
        )}
      </div>

      {/* ✅ Download Document */}
      {quote?.documentUrl && (
  <button
    onClick={async () => {
      try {
        const response = await fetch(quote.documentUrl);
        if (!response.ok) throw new Error("File not found");

        // Convert to Blob
        const blob = await response.blob();

        // Create object URL
        const url = window.URL.createObjectURL(blob);

        // Create a temporary link to force download
        const link = document.createElement("a");
        link.href = url;
        link.download = quote.documentName || "Quote.pdf";
        document.body.appendChild(link);
        link.click();

        // Clean up
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Download failed:", error);
        alert("Unable to download the file. Please try again later.");
      }
    }}
    className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition-colors border border-slate-200 rounded-lg px-4 py-2"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 16.5v-9m0 9l3-3m-3 3l-3-3m9 6a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0018.75 4.5H5.25A2.25 2.25 0 003 6.75v10.5A2.25 2.25 0 005.25 19.5h13.5z"
      />
    </svg>
    <span className="text-sm font-medium">Download PDF</span>
  </button>
)}

    </div>

    {/* Buttons */}
    <div className="mt-5 flex gap-3">
      <button
        onClick={() => setShowConfirm(true)}
        disabled={quote?.status !== "Quote Sent"}
        className={`px-6 py-2 rounded-lg text-white font-medium transition
          ${
            quote?.status !== "Quote Sent"
              ? "bg-emerald-300 cursor-not-allowed"
              : "bg-emerald-600 hover:bg-emerald-700"
          }`}
      >
        {quote?.status === "Approved Quote" ? "Quote Approved" : "Accept Quote"}
      </button>

      <button
        onClick={() => onOpenChat(quote?._id, quote?.customerId?._id)}
        className="px-6 py-2 rounded-lg bg-emerald-600 text-white flex items-center gap-2 hover:bg-emerald-700 transition"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.5 8.25h9m-9 3h6m-7.125 8.25L3 20.25V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25v10.5A2.25 2.25 0 0118.75 18H8.25L6.375 19.5z"
          />
        </svg>
        <span className="text-sm font-medium">Request Changes</span>
      </button>
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
 {/* Step 4 */}
{step === 4 && (
  <div>
    <div className="text-sm font-medium mb-2">Payment</div>

    {/* Advance success banner */}
    <div className="p-4 bg-green-50 rounded border border-green-100 mb-3">
      <p className="font-medium text-green-700">✅ Advance payment completed.</p>
      <p className="text-sm text-slate-600">
        Thank you — your advance has been received.
      </p>
    </div>

    {/* ✅ Conditions for final payment stage */}
    {quote?.status === "Paid" || quote?.finalPaid ? (
      // ✅ Full Payment Done
      <div className="p-4 bg-green-50 border border-green-200 rounded text-green-800 flex flex-col gap-3">
        <div>✅ Full payment received. Order complete.</div>

        {/* ✅ Download Invoice after full payment */}
        {quote?.invoiceUrl && (
          <button
            onClick={async () => {
              try {
                const response = await fetch(quote.invoiceUrl);
                if (!response.ok) throw new Error("File not found");

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = quote.invoiceName || "Invoice.pdf";
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
              } catch (error) {
                console.error("Download failed:", error);
                alert("Unable to download the invoice. Please try again later.");
              }
            }}
            className="flex items-center gap-2 w-fit text-slate-700 hover:text-emerald-600 transition-colors border border-slate-200 rounded-lg px-4 py-2 bg-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16.5v-9m0 9l3-3m-3 3l-3-3m9 6a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0018.75 4.5H5.25A2.25 2.25 0 003 6.75v10.5A2.25 2.25 0 005.25 19.5h13.5z"
              />
            </svg>
            <span className="text-sm font-medium">Download Invoice</span>
          </button>
        )}
      </div>
    ) : quote?.status === "Final Payment Requested" ? (
      <>
        {/* Balance card */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-slate-600 mb-1">Remaining Balance:</p>
            <div className="text-2xl font-bold text-emerald-600">
              ₹ {quote?.balanceAmount?.toLocaleString() || "0"}
            </div>
            {quote?.finalAmount && (
              <p className="text-sm text-slate-500 mt-1">
                Total Amount: ₹ {quote.finalAmount.toLocaleString()}
              </p>
            )}
          </div>

          {/* ✅ Download Invoice */}
          {quote?.invoiceUrl && (
            <button
              onClick={async () => {
                try {
                  const response = await fetch(quote.invoiceUrl);
                  if (!response.ok) throw new Error("File not found");

                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = quote.invoiceName || "Invoice.pdf";
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  window.URL.revokeObjectURL(url);
                } catch (error) {
                  console.error("Download failed:", error);
                  alert("Unable to download the invoice. Please try again later.");
                }
              }}
              className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition-colors border border-slate-200 rounded-lg px-4 py-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 16.5v-9m0 9l3-3m-3 3l-3-3m9 6a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0018.75 4.5H5.25A2.25 2.25 0 003 6.75v10.5A2.25 2.25 0 005.25 19.5h13.5z"
                />
              </svg>
              <span className="text-sm font-medium">Download Invoice</span>
            </button>
          )}
        </div>

        {/* Payment Action */}
        <div className="p-4 bg-white rounded border">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-slate-700">Remaining Balance</div>
            <div className="text-lg font-bold text-emerald-600">
              ₹ {quote?.balanceAmount?.toLocaleString() || "0"}
            </div>
          </div>

          {/* Pay Final Amount Button */}
          {!quote?.finalPaid && (
            <div className="mt-3 flex gap-3 items-center">
              <button
                onClick={async () => {
                  try {
                    const token = localStorage.getItem("authToken");
                    const amount =
                      quote.balanceAmount ??
                      (quote.finalAmount -
                        (quote.payments?.reduce(
                          (s, p) => s + (p.amount || 0),
                          0
                        ) || 0));
                    const res = await axios.patch(
                      `/api/quotes/${quote._id}/customer-final-payment`,
                      {
                        amount,
                        method: "UPI",
                        transactionId: "TXN_FINAL_" + Date.now(),
                      },
                      { headers: { Authorization: `Bearer ${token}` } }
                    );

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
          )}
        </div>
      </>
    ) : quote?.status === "Final Payment Submitted" && !quote?.finalPaid ? (
      // 🕐 Final payment submitted but not yet verified
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
        ✅ Payment submitted. We’ll verify your payment shortly.
      </div>
    ) : (
      // 👇 Default message (after advance but before final request)
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
        We’ll send you the final payment request soon.
      </div>
    )}
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
