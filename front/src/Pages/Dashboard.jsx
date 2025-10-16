import React, { useEffect, useState, useMemo, useRef } from "react";
import axios from "../api/Axios";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Clock,
  DollarSign,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
const getStatusLabel = (status) => {
  switch (status) {
    case "Pending":
      return "Quote Initiated";
    case "Paid":
      return "Completed";
    case "Rejected":
      return "Rejected";
    case "Quote Sent":
      return "Quote Sent";
    case "Payment Requested":
      return "Payment Requested";
    case "Approved Quote":
      return "Approved Quote";
    default:
      return status || "Unknown";
  }
};

// ---------------- MAIN ----------------
export default function Dashboard() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const sliderRef = useRef(null);
const navigate = useNavigate();
  // fetch quotes
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/quotes", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuotes(res.data);
      } catch (err) {
        console.error("Failed to fetch quotes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // metrics
  const metrics = useMemo(() => {
    return {
      total: quotes.length,
      pending: quotes.filter((q) => q.status === "Pending").length,
      quoteSent: quotes.filter((q) => q.status === "Quote Sent").length,
      paymentRequested: quotes.filter((q) => q.status === "Payment Requested")
        .length,
      paid: quotes.filter((q) => q.status === "Paid").length,
        rejected: quotes.filter((q) => q.status === "Rejected").length, 
    };
  }, [quotes]);

  // chart data
 const chartData = useMemo(() => {
  const statuses = [
    "Pending",
    "Quote Sent",
    "Approved Quote",
    "Payment Requested",
    "Paid",
    "Rejected",
  ];
  return statuses.map((status) => ({
    name: getStatusLabel(status),
    value: quotes.filter((q) => q.status === status).length,
  }));
}, [quotes]);


  const COLORS = [
    "#3b82f6",
    "#f59e0b",
    "#22c55e",
    "#10b981",
    "#ef4444",
    "#6366f1",
  ];

  // slider settings
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: false,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* PAGE HEADER */}
        <div className="flex items-center justify-between">
        
          <p className="text-sm text-slate-500">
            Overview of quotes & recent activity
          </p>
        </div>

        {/* METRICS */}
        <MetricsGrid metrics={metrics} onMetricClick={(status) => {
  // when clicked, navigate to Orders page with filter
  navigate("/orders", { state: { statusFilter: status } });
}} />

        {/* CHARTS */}
        <ChartsSection chartData={chartData} COLORS={COLORS} />

        {/* RECENT ORDERS */}
        <RecentOrders
          loading={loading}
          quotes={quotes}
          sliderRef={sliderRef}
          sliderSettings={sliderSettings}
        />
      </div>
    </div>
  );
}

// ---------------- COMPONENTS ----------------

// metrics cards
function MetricsGrid({ metrics, onMetricClick }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
      {/* <MetricCard
        color="from-blue-500 to-blue-600"
        icon={<FileText className="w-6 h-6 text-white" />}
        label="Total Quotes"
        value={metrics.total}
        onClick={() => onMetricClick("All")}
      /> */}
      <MetricCard
        color="from-amber-500 to-amber-600"
        icon={<Clock className="w-6 h-6 text-white" />}
        label="Quote Initiated"
        value={metrics.pending}
        onClick={() => onMetricClick("Pending")}
      />
      <MetricCard
        color="from-purple-500 to-purple-600"
        icon={<FileText className="w-6 h-6 text-white" />}
        label="Quote Received"
        value={metrics.quoteSent}
        onClick={() => onMetricClick("Quote Sent")}
      />
      <MetricCard
        color="from-orange-500 to-orange-600"
        icon={<DollarSign className="w-6 h-6 text-white" />}
        label="Payment Requested"
        value={metrics.paymentRequested}
        onClick={() => onMetricClick("Payment Requested")}
      />
      <MetricCard
        color="from-green-500 to-green-600"
        icon={<DollarSign className="w-6 h-6 text-white" />}
        label="Completed"
        value={metrics.paid}
        onClick={() => onMetricClick("Paid")}
      />
      <MetricCard
        color="from-red-500 to-red-600"
        icon={<FileText className="w-6 h-6 text-white" />}
        label="Rejected"
        value={metrics.rejected}
        onClick={() => onMetricClick("Rejected")}
      />
    </div>
    
  );
}


function MetricCard({ icon, label, value, color, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-2xl shadow-sm bg-gradient-to-r ${color} text-white flex items-center gap-4 hover:shadow-md transition cursor-pointer active:scale-95`}
    >
      <div className="p-3 rounded-xl bg-white/20">{icon}</div>
      <div>
        <div className="text-sm opacity-80">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
      </div>
    </div>
  );
}


// charts
function ChartsSection({ chartData, COLORS }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* bar chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Quotes by Status</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#df4a36ff" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* pie chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Quotes Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={3}
              label
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// recent orders
function RecentOrders({ loading, quotes }) {
   const latestQuotes = useMemo(
    () => quotes.slice(-5).reverse(),
    [quotes]
  );

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Loader2 className="animate-spin w-4 h-4" />
          Loading quotes...
        </div>
      ) : latestQuotes.length === 0 ? (
        <p className="text-sm text-slate-500">No recent quotes found.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {latestQuotes.map((q) => (
            <div
              key={q._id}
              className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-3 hover:bg-slate-50 rounded-xl transition"
            >
              {/* LEFT SIDE */}
              <div className="flex flex-col">
                <p className="text-sm font-semibold text-slate-800">
                 
                </p>
                <p className="text-xs text-slate-500">
                  {q.createdAt
                    ? new Date(q.createdAt).toLocaleDateString()
                    : "-"}
                </p>
              </div>

              {/* CENTER */}
              <div className="flex-1 text-sm text-slate-600 sm:text-center">
                <p>
                  <span className="font-medium">Brand:</span>{" "}
                  {q.brandName || "-"}
                </p>
                <p>
                  <span className="font-medium">Molecule:</span>{" "}
                  {q.moleculeName || q.customMolecule || "-"}
                </p>
              </div>

              {/* RIGHT SIDE */}
              <div className="flex flex-col items-end sm:items-center gap-1">
                <span
  className={`px-3 py-1 text-xs font-medium rounded-full ${
    q.status === "Paid"
      ? "bg-green-100 text-green-700"
      : q.status === "Pending"
      ? "bg-amber-100 text-amber-700"
      : q.status === "Rejected"
      ? "bg-red-100 text-red-700"
      : "bg-slate-100 text-slate-700"
  }`}
>
  {getStatusLabel(q.status)}
</span>

                <TrackingSteps
                  steps={q.trackingSteps || ["Created", "Processing", "Done"]}
                  currentStep={q.trackingStep || 0}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// tracking steps component
function TrackingSteps({ steps, currentStep }) {
  return (
    <div className="flex items-center gap-2 mt-3">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
            ${
              index <= currentStep
                ? "bg-red-600 text-white"
                : "bg-slate-200 text-slate-500"
            }`}
          >
            {index + 1}
          </div>
          {index < steps.length - 1 && (
            <div
              className={`h-1 w-10 ${
                index < currentStep ? "bg-red-600" : "bg-slate-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
