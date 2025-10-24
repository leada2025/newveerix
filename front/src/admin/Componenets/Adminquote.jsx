import React, { useState, useEffect, useMemo } from "react";
import { LayoutGrid, Table as TableIcon, Search, ChevronDown,MessageSquare } from "lucide-react";
import axios from "../../api/Axios";
import QuoteChatPortal from "../../Components/QuoteChatPortal";
import { useLocation } from "react-router-dom";
import socket, { connectSocket } from "../../Components/Socket";

// ---- Status Badge ----
function StatusBadge({ status }) {
  const styles = {
    Pending: "bg-amber-100 text-amber-800",
    "Quote Sent": "bg-blue-100 text-blue-800",
    "Approved Quote": "bg-purple-100 text-purple-800",
    "Payment Requested": "bg-indigo-100 text-indigo-800",
       'Advance Paid': 'bg-indigo-100 text-purple-800',
        'Final Payment Requested': 'bg-sky-100 text-yellow-900',
    Paid: "bg-emerald-100 text-emerald-800",
    Rejected: "bg-rose-100 text-rose-800",
  };
  return (
    <span
      className={`px-2 py-0.5 text-xs rounded-full font-medium ${
        styles[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}

// ---- Main Page ----
export default function AdminQuotes() {
  const [quotes, setQuotes] = useState([]);
  const [view, setView] = useState("table"); // "table" | "card"
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortOption, setSortOption] = useState("newest"); // "newest" | "oldest" | "alphabetical"
  const [modalData, setModalData] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
const [currentPage, setCurrentPage] = useState(1);
const [rowsPerPage, setRowsPerPage] = useState(10);
const [chatInfo, setChatInfo] = useState({ show: false, quoteId: null, customerId: null });
const location = useLocation();
 const [paymentModalData, setPaymentModalData] = useState(null); // ---- Fetch Quotes ----
const fetchQuotes = async () => {
  try {
    const res = await axios.get("/api/quotes", {
      headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
    });
    // Use res.data directly (it's already an array)
    setQuotes(res.data);
  } catch (err) {
    console.error("Failed to fetch quotes:", err);
  }
};


  useEffect(() => {
    fetchQuotes();
  }, []);

  // ---- Filter, Search, Sort ----
  const processedQuotes = useMemo(() => {
    let filtered = quotes.filter((q) => {
      const matchesSearch =
        q.customerId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.moleculeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q._id?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "All" || q.status === filterStatus;
      return matchesSearch && matchesStatus;
    });

    if (sortOption === "newest") {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortOption === "oldest") {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortOption === "alphabetical") {
      filtered.sort((a, b) => (a.customerId?.name || "").localeCompare(b.customerId?.name || ""));
    }

    return filtered;
  }, [quotes, searchTerm, filterStatus, sortOption]);

  // ---- Actions ----
 const performAction = async (action, id, value, extra = {}) => {
  try {
    setLoading(true);
    let url = "";
    let body = {};

    if (action === "approve") {
      url = `/api/quotes/${id}/approve`;
      body = { estimatedRate: Number(value) };
    } else if (action === "payment") {
      url = `/api/quotes/${id}/payment`;
      body = {
        amount: Number(value),
        percentage: extra.percentage || 50, // ✅ include selected percentage
      };
    } else if (action === "paid") {
      url = `/api/quotes/${id}/paid`;
    } else if (action === "reject") {
      url = `/api/quotes/${id}/reject`;
    } else if (action === "tracking") {
      url = `/api/quotes/${id}/step`;
      body = { trackingStep: value };
    }
else if (action === "finalPayment") {
  url = `/api/quotes/${id}/request-final-payment`;
  body = { finalAmount: Number(value) };
}
else if (action === "finalPaid") {
  url = `/api/quotes/${id}/finalPaid`;
}
else if (action === "confirmAdvance") {
  url = `/api/quotes/${id}/admin-confirm-advance`;
  body = {}; // No additional body needed
}
    const res = await axios.patch(url, body, {
      headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
    });

    setModalData(null);
    setQuotes((prev) => prev.map((q) => (q._id === id ? res.data : q)));
  } catch (err) {
    console.error("Action failed:", err);
    alert(err.response?.data?.message || "Action failed");
  } finally {
    setLoading(false);
  }
};

// 👂 Listen for real-time quote updates
useEffect(() => {
  // Ensure socket connection is active
  const user = JSON.parse(localStorage.getItem("user"));
  connectSocket(user);

  // Handle incoming quote updates
  const handleQuoteUpdate = ({ quote }) => {
    setQuotes(prevQuotes => {
      // If quote already exists, replace it; otherwise, add new
      const exists = prevQuotes.some(q => q._id === quote._id);
      if (exists) {
        return prevQuotes.map(q => (q._id === quote._id ? quote : q));
      } else {
        return [quote, ...prevQuotes];
      }
    });
  };

  // Listen to event
  socket.on("quote_updated", handleQuoteUpdate);

  // Cleanup
  return () => socket.off("quote_updated", handleQuoteUpdate);
}, []);

const getActions = (quote) => {
  switch (quote.status) {
    case "Pending":
    case "Quote Sent":
      return ["approve", "reject"];
    case "Approved Quote":
      return ["payment"]; // Request advance payment
 case "Payment Requested":
  return ["confirmAdvance"]; // Mark advance paid
    case "Advance Paid":
      return ["finalPayment"]; // Request final payment
    case "Final Payment Requested":
      return ["finalPaid"]; 
       case "Final Payment Submitted":
      return ["finalPaid"]; // Mark final paid
    case "Paid": // Final paid complete
      return []; // No further actions allowed
    default:
      return [];
  }
};




const handleActionClick = (action, quote) => {
  switch (action) {
    case "approve":
      setModalData({ action, quote, value: quote.estimatedRate || "" });
      setInputValue(quote.estimatedRate || "");
      break;

    case "payment":
      if (!quote.estimatedRate) {
        alert("Estimated rate missing. Approve the quote first.");
        return;
      }
      setPaymentModalData({ quote, percentage: 50 });
      break;

    case "paid":
      performAction("paid", quote._id);
      break;

    case "confirmAdvance":   // ✅ Added this
      performAction("confirmAdvance", quote._id);
      break;

case "finalPayment":
  // Automatically request final payment, no modal
  performAction("finalPayment", quote._id);
  break;

    case "finalPaid":
      performAction("finalPaid", quote._id);
      break;

    case "reject":
      performAction("reject", quote._id);
      break;

    default:
      break;
  }
};




const paginatedQuotes = useMemo(() => {
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  return processedQuotes.slice(start, end);
}, [processedQuotes, currentPage, rowsPerPage]);

const totalPages = Math.ceil(processedQuotes.length / rowsPerPage);
useEffect(() => {
  const params = new URLSearchParams(location.search);
  const statusParam = params.get("status");

  if (statusParam) {
    setFilterStatus(statusParam);
  }
}, [location.search]);

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Quotes Management</h1>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer, molecule, ID..."
            className="pl-9 pr-3 py-2 border rounded-lg w-full text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter & Sort */}
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Quote Sent">Quote Sent</option>
            <option value="Approved Quote">Approved Quote</option>
            <option value="Payment Requested">Payment Requested</option>
            <option value="Paid">Paid</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm flex items-center"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="alphabetical">Alphabetical</option>
          </select>

          {/* View Toggle */}
          <button
            onClick={() => setView("table")}
            className={`p-2 rounded-lg ${view === "table" ? "bg-blue-100 text-blue-600" : "bg-slate-100"}`}
          >
            <TableIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("card")}
            className={`p-2 rounded-lg ${view === "card" ? "bg-blue-100 text-blue-600" : "bg-slate-100"}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Table View */}
{/* Table View */}
{view === "table" && (
  <div className="overflow-x-auto bg-white rounded-xl shadow max-w-full">
    <table className="w-full text-sm">
      <thead className="bg-slate-100 text-slate-700 text-xs uppercase">
        <tr>
          <th className="px-3 py-2 text-left w-20">Date</th>
          <th className="px-3 py-2 text-left w-32">Customer</th>
          <th className="px-3 py-2 text-left w-24">Brand</th>
          <th className="px-3 py-2 text-left w-36">Molecule</th>
          <th className="px-3 py-2 text-left w-20">Quantity</th>
          <th className="px-3 py-2 text-left w-20">Rate</th>
          <th className="px-3 py-2 text-left w-24">Payment</th>
          <th className="px-3 py-2 text-left w-28">Status</th>
          <th className="px-3 py-2 text-left w-16">Chat</th>
          <th className="px-3 py-2 text-left w-32">Actions</th>
          <th className="px-3 py-2 text-left w-36">Tracking</th>
        </tr>
      </thead>
      <tbody>
        {paginatedQuotes.map((q) => (
          <tr key={q._id} className="last:border-none hover:bg-slate-50 transition">
            <td className="px-3 py-2 text-xs">{new Date(q.createdAt).toLocaleDateString()}</td>
            <td className="px-3 py-2 truncate max-w-[120px]" title={q.customerId?.name}>
              {q.customerId?.name || "Customer"}
            </td>
            <td className="px-3 py-2 truncate max-w-[100px]" title={q.brandName}>
              {q.brandName || "-"}
            </td>


<td className="relative px-3 py-2 max-w-[140px] group">
  <span className="truncate block">{q.moleculeName || `Custom: ${q.customMolecule}`}</span>
  <span className="absolute hidden group-hover:block bg-white border border-gray-200 shadow-lg text-xs p-2 rounded w-60 z-50">
    {q.moleculeName || q.customMolecule}
  </span>
</td>


            <td className="px-3 py-2">{q.quantity} {q.unit}</td>
            <td className="px-3 py-2">{q.estimatedRate ? `₹${q.estimatedRate}` : "-"}</td>
            <td className="px-3 py-2">{q.requestedAmount ? `₹${q.requestedAmount}` : "-"}</td>
            <td className="px-3 py-2"><StatusBadge status={q.status} /></td>
            <td className="px-3 py-2">
              <button
                onClick={() => setChatInfo({ show: true, quoteId: q._id, customerId: q.customerId?._id })}
                className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                title="Chat with Customer"
              >
                <MessageSquare className="w-3 h-3" />
                Chat
              </button>
            </td>
            <td className="px-3 py-2">
              <select
                value=""
                onChange={(e) => handleActionClick(e.target.value, q)}
                className="border px-2 py-1 rounded text-xs w-full"
              >
                <option value="">Action</option>
{getActions(q).map((a) => (
  <option key={a} value={a}>
    {a === "approve" && "Approve"}
    {a === "reject" && "Reject"}
    {a === "payment" && "Request Advance Payment"}
    {a === "paid" && "Mark Advance Paid"}
    {a === "finalPayment" && "Request Final Payment"}
    {a === "finalPaid" && "Mark Final Paid"}
    {a === "confirmAdvance" && "Confirm Advance Payment"}
  </option>
))}

              </select>
            </td>
   <td className="px-3 py-2">
              <select
                value={q.trackingStep}
                onChange={(e) => performAction("tracking", q._id, Number(e.target.value))}
                className="border px-2 py-1 rounded text-xs w-full"
              >
                {q.trackingSteps.map((step, index) => (
                  <option key={index} value={index}>{step}</option>
                ))}
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}

      {/* Card View */}
 {/* Card View */}
{view === "card" && (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
    {processedQuotes.map((q) => (
      <div
        key={q._id}
        className="bg-white rounded-xl shadow p-4 border flex flex-col gap-3 hover:shadow-md transition"
      >
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold">{q.customerId?.name}</h3>
          <StatusBadge status={q.status} />
        </div>

        <p className="text-sm text-slate-500">{q.moleculeName || `Custom: ${q.customMolecule}`}</p>
        <p className="text-sm">Qty: {q.quantity} {q.unit}</p>
        <p className="text-sm">Rate: {q.estimatedRate ? `₹${q.estimatedRate}` : "-"}</p>
        <p className="text-sm">Payment: {q.requestedAmount ? `₹${q.requestedAmount}` : "-"}</p>

        {/* Chat Button */}
        <button
          onClick={() =>
            setChatInfo({
              show: true,
              quoteId: q._id,
              customerId: q.customerId?._id,
            })
          }
          className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
          title="Chat with Customer"
        >
          <MessageSquare className="w-4 h-4" />
          Chat
        </button>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-2">
          <select
            value=""
            onChange={(e) => handleActionClick(e.target.value, q)}
            className="border px-2 py-1 rounded text-sm"
          >
            <option value="">Select Action</option>
            {getActions(q.status).map((a) => (
              <option key={a} value={a}>
                {a === "approve" && "Approve"}
                {a === "reject" && "Reject"}
                {a === "payment" && "Request Payment"}
                {a === "paid" && "Mark Paid"}
                {a === "confirmAdvance" && "Confirm Advance Payment"}
              </option>
            ))}
          </select>
        </div>

        {/* Tracking Step */}
        <div className="mt-2">
          <h4 className="text-sm font-semibold">Tracking Step:</h4>
          <select
            value={q.trackingStep}
            onChange={(e) => performAction("tracking", q._id, Number(e.target.value))}
            className="w-full border px-2 py-1 rounded text-sm mt-1"
          >
            {q.trackingSteps.map((step, index) => (
              <option key={index} value={index}>
                {step}
              </option>
            ))}
          </select>
        </div>

      </div>
    ))}
  </div>
)}


      {/* Modal */}
     {modalData && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
    <div className="bg-white rounded-xl shadow-lg w-96">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold">
          Enter Estimated Rate
        </h2>
      </div>
      <div className="px-6 py-4">
        <input
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Enter estimated rate"
        />
      </div>
      <div className="px-6 py-3 flex justify-end gap-2 border-t">
        <button
          onClick={() => setModalData(null)}
          className="px-3 py-1 bg-slate-100 rounded-lg text-sm"
        >
          Cancel
        </button>
        <button
          onClick={() =>
            performAction(modalData.action, modalData.quote._id, inputValue)
          }
          disabled={!inputValue || loading}
          className={`px-3 py-1 rounded-lg text-sm ${
            !inputValue || loading
              ? "bg-slate-300 text-slate-700"
              : "bg-blue-600 text-white"
          }`}
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
)}
<div className="flex items-center justify-between mt-4">
  <div className="text-sm text-slate-600">
    Page {currentPage} of {totalPages}
  </div>
  <div className="flex items-center gap-2">
    <button
      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
      disabled={currentPage === 1}
      className="px-3 py-1 border rounded-lg disabled:opacity-50"
    >
      Prev
    </button>
    <button
      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
      disabled={currentPage === totalPages}
      className="px-3 py-1 border rounded-lg disabled:opacity-50"
    >
      Next
    </button>
    <select
      value={rowsPerPage}
      onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
      className="border px-2 py-1 rounded-lg text-sm"
    >
      <option value={5}>5 / page</option>
      <option value={10}>10 / page</option>
      <option value={20}>20 / page</option>
      <option value={50}>50 / page</option>
    </select>
  </div>
</div>
<QuoteChatPortal
  show={chatInfo.show}
  quoteId={chatInfo.quoteId}
  customerId={chatInfo.customerId}
  onClose={() => setChatInfo({ show: false, quoteId: null, customerId: null })}
   isAdmin={true}
/>
{paymentModalData && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
    <div className="bg-white rounded-xl shadow-lg w-96">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold">Request Payment</h2>
      </div>
      <div className="px-6 py-4 flex flex-col gap-3">
        <p>Select the payment percentage:</p>
        <div className="flex gap-3">
          {[30, 50, 70].map((p) => (
            <button
              key={p}
              onClick={() => setPaymentModalData(prev => ({ ...prev, percentage: p }))}
              className={`px-4 py-2 rounded-lg border ${
                paymentModalData.percentage === p ? 'bg-blue-600 text-white' : 'bg-slate-100'
              }`}
            >
              {p}%
            </button>
          ))}
        </div>
        <p className="text-sm text-slate-500 mt-2">
          Requested Amount: ₹ {Math.round(paymentModalData.quote.estimatedRate * paymentModalData.percentage / 100)}
        </p>
      </div>
      <div className="px-6 py-3 flex justify-end gap-2 border-t">
        <button
          onClick={() => setPaymentModalData(null)}
          className="px-3 py-1 bg-slate-100 rounded-lg text-sm"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            const amount = Math.round(paymentModalData.quote.estimatedRate * paymentModalData.percentage / 100);
           performAction("payment", paymentModalData.quote._id, amount, {
  percentage: paymentModalData.percentage,
});
            setPaymentModalData(null);
          }}
          className="px-3 py-1 rounded-lg text-sm bg-blue-600 text-white"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
