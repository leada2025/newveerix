import React, { useEffect, useState, useMemo, useRef } from "react";
import axios from "../../api/Axios";
import {
  FileText,
  Clock,
  DollarSign,
  ArrowLeft,
  ArrowRight,
  Users,
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
function MetricCard({ icon, label, value, color }) {
  return (
    <div
      className={`p-5 rounded-2xl shadow-md ${color} text-white flex items-center gap-4`}
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

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/quotes", {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        });
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
  const metrics = useMemo(() => ({
    total: quotes.length,
    pending: quotes.filter((q) => q.status === "Pending").length,
    quoteSent: quotes.filter((q) => q.status === "Quote Sent").length,
    paymentRequested: quotes.filter((q) => q.status === "Payment Requested").length,
    paid: quotes.filter((q) => q.status === "Paid").length,
  }), [quotes]);

  // ---- Chart Data -----
  const chartData = useMemo(() => {
    const statuses = ["Pending", "Quote Sent", "Payment Requested", "Paid", "Rejected"];
    return statuses.map((status) => ({
      name: status,
      value: quotes.filter((q) => q.status === status).length,
    }));
  }, [quotes]);

  const COLORS = ["#facc15", "#3b82f6", "#6366f1", "#10b981", "#ef4444"];

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
      <div className="max-w-[1200px] mx-auto space-y-8">

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <MetricCard
            color="bg-gradient-to-r from-gray-700 to-gray-900"
            icon={<FileText className="w-6 h-6 text-white" />}
            label="Total Quotes"
            value={metrics.total}
          />
          <MetricCard
            color="bg-gradient-to-r from-amber-500 to-amber-700"
            icon={<Clock className="w-6 h-6 text-white" />}
            label="Pending"
            value={metrics.pending}
          />
          <MetricCard
            color="bg-gradient-to-r from-blue-500 to-blue-700"
            icon={<FileText className="w-6 h-6 text-white" />}
            label="Quote Sent"
            value={metrics.quoteSent}
          />
          <MetricCard
            color="bg-gradient-to-r from-indigo-500 to-indigo-700"
            icon={<DollarSign className="w-6 h-6 text-white" />}
            label="Payment Requested"
            value={metrics.paymentRequested}
          />
          <MetricCard
            color="bg-gradient-to-r from-green-500 to-green-700"
            icon={<DollarSign className="w-6 h-6 text-white" />}
            label="Paid"
            value={metrics.paid}
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
                <Bar dataKey="value" fill="#d43731ff" radius={[6, 6, 0, 0]} />
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

        {/* Recent Quotes Carousel */}
        <div className="bg-white p-6 rounded-2xl shadow-md relative">
          <h2 className="text-lg font-semibold mb-4">Recent Quotes</h2>
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : quotes.length === 0 ? (
            <p className="text-sm text-slate-500">No quotes found.</p>
          ) : (
            <>
              <Slider ref={sliderRef} {...sliderSettings}>
                {quotes.slice(0, 10).map((q) => (
                  <div
                    key={q._id}
                    className="bg-white p-4 rounded-2xl border hover:shadow-lg transition mx-2 flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-slate-500">{new Date(q.createdAt).toLocaleDateString()}</p>
                      <StatusBadge status={q.status} />
                    </div>
                    <p className="font-semibold text-sm">{q.customerId?.name || "Customer"}</p>
                    <p className="font-medium">{q.brandName || "-"}</p>
                    <p className="text-sm text-slate-500">{q.moleculeName || `Custom: ${q.customMolecule}`}</p>
                    <p className="text-sm">Qty: {q.quantity} {q.unit}</p>
                  </div>
                ))}
              </Slider>

              {/* Left/Right Arrows */}
              <div
                className="absolute top-1/2 -translate-y-1/2 left-2 z-10 cursor-pointer bg-white p-2 rounded-full shadow hover:bg-slate-100"
                onClick={() => sliderRef.current.slickPrev()}
              >
                <ArrowLeft size={20} />
              </div>
              <div
                className="absolute top-1/2 -translate-y-1/2 right-2 z-10 cursor-pointer bg-white p-2 rounded-full shadow hover:bg-slate-100"
                onClick={() => sliderRef.current.slickNext()}
              >
                <ArrowRight size={20} />
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
