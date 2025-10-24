import React, { useEffect, useState, useMemo, useRef } from "react";
import axios from "../../api/Axios";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Clock,
  DollarSign,
  ArrowLeft,
  ArrowRight,
  Users,
  XCircle, // ⬅️ Added reject icon
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

// ----- Metric Card -----
function MetricCard({ icon, label, value, color, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-2xl shadow-md ${color} text-white flex items-center gap-4 cursor-pointer hover:scale-[1.02] transition-transform`}
    >
      <div className="p-3 rounded-xl bg-white/20">{icon}</div>
      <div>
        <div className="text-sm opacity-80">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
      </div>
    </div>
  );
}

// ----- Status Badge -----
function StatusBadge({ status }) {
  const styles = {
    Pending: "bg-amber-200 text-amber-900",
    "Quote Sent": "bg-blue-200 text-blue-900",
    "Payment Requested": "bg-indigo-200 text-indigo-900",
    Paid: "bg-green-200 text-green-900",
    Rejected: "bg-rose-200 text-rose-900",
  };
  return (
    <span
      className={`px-2 py-1 text-xs font-semibold rounded-full ${
        styles[status] || "bg-gray-200 text-gray-800"
      }`}
    >
      {status}
    </span>
  );
}

// ----- Tracking Steps -----
function TrackingSteps({ steps, currentStep }) {
  return (
    <div className="flex items-center gap-2 mt-2">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
            ${index <= currentStep ? "bg-[#d1383a] text-white" : "bg-slate-200 text-slate-500"}`}
          >
            {index + 1}
          </div>
          {index < steps.length - 1 && (
            <div
              className={`h-1 w-10 ${index < currentStep ? "bg-[#d1383a]" : "bg-slate-200"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ----- Admin Dashboard -----
export default function AdminDashboard() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const sliderRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/quotes", {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        });
        console.log("Statuses:", res.data.map(q => q.status)); 
        setQuotes(res.data);
      } catch (err) {
        console.error("Failed to fetch quotes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuotes();
  }, []);

  // ---- Metrics -----
  const metrics = useMemo(
    () => ({
      total: quotes.length,
      pending: quotes.filter((q) => q.status === "Pending").length,
      quoteSent: quotes.filter((q) => q.status === "Quote Sent").length,
      paymentRequested: quotes.filter((q) => q.status === "Payment Requested").length,
      paid: quotes.filter((q) => q.status === "Paid").length,
      rejected: quotes.filter((q) => q.status === "Rejected").length, // ✅ new
    }),
    [quotes]
  );

  // ---- Chart Data -----
  const chartData = useMemo(() => {
    const statuses = ["Pending", "Quote Sent", "Payment Requested", "Final Payment Requested", "Paid", "Rejected"];
    return statuses.map((status) => ({
      name: status,
      value: quotes.filter((q) => q.status === status).length,
    }));
  }, [quotes]);

  const COLORS = [
  "#facc15", // Pending (yellow)
  "#3b82f6", // Quote Sent (blue)
  "#6366f1", // Payment Requested (indigo)
  "#8b5cf6", // Final Payment Requested (violet)
  "#10b981", // Paid (green)
  "#ef4444", // Rejected (red)
];


  // ---- Slider Settings -----
  const sliderSettings = {
    dots: false,
    infinite: quotes.length > 3,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: false,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 640, settings: { slidesToShow: 1 } },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
          <MetricCard
            color="bg-gradient-to-r from-gray-700 to-gray-900"
            icon={<FileText className="w-6 h-6 text-white" />}
            label="Total Quotes"
            value={metrics.total}
            onClick={() => navigate("/admin/quote?status=All")}
          />
          <MetricCard
            color="bg-gradient-to-r from-amber-500 to-amber-700"
            icon={<Clock className="w-6 h-6 text-white" />}
            label="Pending"
            value={metrics.pending}
            onClick={() => navigate("/admin/quote?status=Pending")}
          />
          <MetricCard
            color="bg-gradient-to-r from-blue-500 to-blue-700"
            icon={<FileText className="w-6 h-6 text-white" />}
            label="Quote Sent"
            value={metrics.quoteSent}
            onClick={() => navigate("/admin/quote?status=Quote Sent")}
          />
          <MetricCard
            color="bg-gradient-to-r from-indigo-500 to-indigo-700"
            icon={<DollarSign className="w-6 h-6 text-white" />}
            label="Payment Requested"
            value={metrics.paymentRequested}
            onClick={() => navigate("/admin/quote?status=Payment Requested")}
          />
          <MetricCard
            color="bg-gradient-to-r from-green-500 to-green-700"
            icon={<DollarSign className="w-6 h-6 text-white" />}
            label="Paid"
            value={metrics.paid}
            onClick={() => navigate("/admin/quote?status=Paid")}
          />
          {/* ✅ New Rejected Card */}
          <MetricCard
            color="bg-gradient-to-r from-rose-500 to-rose-700"
            icon={<XCircle className="w-6 h-6 text-white" />}
            label="Rejected"
            value={metrics.rejected}
            onClick={() => navigate("/admin/quote?status=Rejected")}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <h2 className="text-lg font-semibold mb-4">Quotes by Status</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
               <Bar dataKey="value" radius={[6, 6, 0, 0]}>
  {chartData.map((entry, index) => (
    <Cell key={`bar-${index}`} fill={COLORS[index % COLORS.length]} />
  ))}
</Bar>

              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Donut Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-md">
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
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Quotes List */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-slate-800">Recent Quotes</h2>
            <button
              onClick={() => navigate("/admin/quote")}
              className="text-sm text-[#d1383a] hover:text-[#b52f31] hover:underline font-medium transition"
            >
              View All
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500 py-2">Loading...</p>
          ) : quotes.length === 0 ? (
            <p className="text-sm text-slate-500 py-2">No quotes found.</p>
          ) : (
            <div className="space-y-4">
              {quotes
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 5)
                .map((q) => (
                  <div
                    key={q._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 bg-white"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#d1383a]/20 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {q.customerId?.name?.[0] || "C"}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800 text-sm sm:text-base">
                          {q.customerId?.name || "Customer"}
                        </span>
                        <span className="text-slate-500 text-sm">
                          {q.brandName || "-"} — {q.moleculeName || `Custom: ${q.customMolecule || "-"}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-3 sm:mt-0">
                      <span className="text-sm font-medium text-slate-700">
                        Qty: {q.quantity} {q.unit}
                      </span>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {new Date(q.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <StatusBadge status={q.status} />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
