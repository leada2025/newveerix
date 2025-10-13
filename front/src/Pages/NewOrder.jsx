import React, { useState, useEffect, useMemo } from 'react';
import axios from '../api/Axios';
import { 
  Bell, CreditCard, Package, Layers, ClipboardList, CheckCircle, Truck, Search, Settings, Users, Home, BarChart2, HelpCircle, Edit2, Eye, MoreHorizontal, Filter, Plus 
} from 'lucide-react';
import OrdersForm from "./OrdersForm";
import QuoteChatPortal from '../Components/QuoteChatPortal';
import { useLocation } from "react-router-dom";
import socket from "../Components/Socket";

function Badge({ text }) {
  const color = {
    'Pending': 'bg-amber-100 text-amber-800',
    'Quote Sent': 'bg-violet-50 text-violet-700',
    'Paid': 'bg-emerald-100 text-emerald-800',
    'Approved Quote': 'bg-sky-100 text-sky-800',
    'Payment Requested': 'bg-indigo-100 text-indigo-800',
      'Advance Paid': 'bg-indigo-100 text-purple-800',
        'Final Payment Requested': 'bg-sky-100 text-yellow-900',
    'Rejected': 'bg-white text-red-800'
  }[text] || 'bg-slate-100 text-slate-700';
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>{text}</span>;
}

// ---------- Main Order Page Component ----------
export default function OrderPage({ customerId }) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [openNewOrder, setOpenNewOrder] = useState(false);
  const [quotes, setQuotes] = useState([]);
  const [editingOrder, setEditingOrder] = useState(null);

  const statuses = useMemo(() => ['All', 'Pending', 'Quote Sent', 'Paid', 'Approved Quote', 'Payment Requested', 'Rejected'], []);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;
const [chatInfo, setChatInfo] = useState({ show: false, quoteId: null, customerId: null });
  // Fetch quotes
useEffect(() => {
  const token = localStorage.getItem("authToken"); // matches your login storage
  if (!token) return;

  axios.get('/api/quotes', {
    headers: {
      Authorization: `Bearer ${token}` // backend middleware expects this
    }
  })
  .then(res => {
    const sorted = res.data.sort((a, b) => b._id.localeCompare(a._id));
    setQuotes(sorted);
  })
  .catch(err => console.error("Failed to fetch quotes:", err));
}, []);


  const filtered = quotes
    .filter(o => {
      const q = query.toLowerCase();
      if (statusFilter !== 'All' && o.status !== statusFilter) return false;
      return (
        o._id.toLowerCase().includes(q) ||
        (o.brandName && o.brandName.toLowerCase().includes(q)) ||
        (o.customerId?.name && o.customerId.name.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => b._id.localeCompare(a._id));

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ordersPerPage;
    const end = start + ordersPerPage;
    return filtered.slice(start, end);
  }, [filtered, currentPage]);

  const handleCreate = (newOrder) => setQuotes(prev => [newOrder, ...prev]);

  const handleEdit = (order) => {
    setEditingOrder(order);
    setOpenNewOrder(true);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter]);
const handleOpenChat = (quoteId, custId) => {
  setChatInfo({ show: true, quoteId, customerId: custId });
};
const location = useLocation();

useEffect(() => {
  if (location.state?.statusFilter) {
    setStatusFilter(location.state.statusFilter);
  }
}, [location.state]);
// Live updates for quotes
useEffect(() => {
  const handleQuoteUpdate = ({ quote }) => {
    console.log("📡 Quote updated:", quote.status);

    setQuotes((prev) => {
      const index = prev.findIndex((q) => q._id === quote._id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = quote;
        return updated;
      } else {
        return [quote, ...prev];
      }
    });

    // 👇 ALSO update the selected order if it's the same quote
    setSelectedOrder((prev) => (prev?._id === quote._id ? quote : prev));
  };

  socket.on("quote_updated", handleQuoteUpdate);
  return () => socket.off("quote_updated", handleQuoteUpdate);
}, []);


  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-800 font-sans p-6">
      <div className="max-w-[1200px] mx-auto">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl ] font-semibold">Orders</h2>
            <div className="text-sm text-slate-500 mt-1">Manage all manufacturing orders, approvals, payments and lifecycle tracking.</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white p-2 gap-2 rounded-xl shadow-sm">
              <Search className="w-4 h-4 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} className="outline-none text-sm" placeholder="Search order ID, client or brand" />
            </div>
            <button onClick={() => setShowFilters(s => !s)} className="p-2 rounded-lg bg-white shadow-sm flex items-center gap-2"><Filter className="w-4 h-4"/> Filters</button>
            <button 
              onClick={() => { setEditingOrder(null); setOpenNewOrder(true); }} 
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#d1383a] text-white"
            >
              <Plus className="w-4 h-4"/> New Order
            </button>
          </div>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-xs text-slate-500">Status</div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="mt-1 p-2 border rounded-lg text-sm">
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-12 gap-6">
          {/* Orders Table */}
          <div className="col-span-7 bg-white p-4 rounded-2xl shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-slate-500 text-xs border-b">
                  <tr>
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Order ID</th>
                    <th className="text-left py-2">Brand / Client</th>
                    <th className="text-left py-2">Qty</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map(o => (
                    <tr key={o._id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedOrder(o)}>
                      <td className="py-3 text-xs text-slate-500">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "-"}</td>
                      <td className="py-3">{o._id}</td>
                      <td className="py-3">{o.brandName} <div className="text-xs text-slate-400">{o.customerId?.name}</div></td>
                      <td className="py-3">{o.quantity} {o.unit}</td>
                      <td className="py-3"><Badge text={o.status} /></td>
                      <td className="py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          
                          <button className="p-2 rounded-md hover:bg-slate-100" onClick={() => handleEdit(o)}><Edit2 className="w-4 h-4"/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Order Details */}
          <div className="col-span-5 bg-white p-4 rounded-2xl shadow-sm h-[70vh] overflow-y-auto">
            {selectedOrder ? (
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-xs text-slate-500">Order</div>
                    <div className="text-lg font-semibold">{selectedOrder._id} · {selectedOrder.brandName}</div>
                    <div className="text-sm text-slate-500">{selectedOrder.customerId?.name} · {selectedOrder.quantity} {selectedOrder.unit}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      Created: {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : "-"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Current Step</div>
                    <div className="text-sm font-semibold text-emerald-600">
                      {selectedOrder.trackingSteps?.[selectedOrder.trackingStep] || "Not Started"}
                    </div>
                  </div>
                </div>

                {/* Stepper (Read-only) */}
<div className="space-y-3 mb-4">
  {selectedOrder.trackingSteps?.map((step, idx) => {
    const history = selectedOrder.trackingHistory?.find(h => h.stepIndex === idx);

    return (
      <div key={idx} className="flex items-center gap-2">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
            ${selectedOrder.trackingStep >= idx ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}
        >
          {selectedOrder.trackingStep >= idx ? "✔" : idx + 1}
        </div>

        {/* Step + Time inline */}
        <div className="flex items-center gap-2">
          <span
            className={`text-sm ${
              selectedOrder.trackingStep === idx ? "font-semibold" : "text-slate-600"
            }`}
          >
            {step}
          </span>
          {history && (
            <span className="text-xs text-slate-400">
              {new Date(history.changedAt).toLocaleString()}
            </span>
          )}
        </div>
      </div>
    );
  })}
</div>

              </div>
            ) : (
              <div className="text-sm text-slate-500">Select an order from the list to view details.</div>
            )}
          </div>
        </div>

        <OrdersForm 
          open={openNewOrder} 
          onClose={() => setOpenNewOrder(false)} 
          onCreate={handleCreate} 
          quoteData={editingOrder}  
          customerId={chatInfo.customerId} 
           onOpenChat={(quoteId, custId) => handleOpenChat(quoteId, custId)} 
        />
    <QuoteChatPortal
          show={chatInfo.show}
          quoteId={chatInfo.quoteId}
         customerId={chatInfo.customerId} 
            isAdmin={false} 
           onClose={() => setChatInfo({ show: false, quoteId: null, customerId: null })}
        />
        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-slate-500">
            Showing {(currentPage-1)*ordersPerPage+1} - {Math.min(currentPage*ordersPerPage, filtered.length)} of {filtered.length} orders
          </div>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="px-3 py-1 rounded-lg border disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={currentPage === Math.ceil(filtered.length / ordersPerPage)}
              onClick={() => setCurrentPage(p => p + 1)}
              className="px-3 py-1 rounded-lg border disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
