import React, { useEffect, useState, useMemo } from "react";
import axios from "../api/Axios";
import {
  Plus,
  FileText,
  Clock,
  DollarSign,
  ArrowLeft,
  ArrowRight,
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

export default function Dashboard() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const sliderRef = React.useRef(null);

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
    };
  }, [quotes]);

  // chart
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
      name: status,
      value: quotes.filter((q) => q.status === status).length,
    }));
  }, [quotes]);

  const COLORS = ["#3b82f6", "#f59e0b", "#22c55e", "#10b981", "#ef4444", "#6366f1"];

  // slider settings
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    arrows: false,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6 font-sans text-slate-800">
      <div className="max-w-[1200px] mx-auto space-y-8">
        {/* header */}
        <div className="flex items-center justify-between">
          
       
        </div>

        {/* metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <MetricCard
            color="from-blue-500 to-blue-600"
            icon={<FileText className="w-6 h-6 text-white" />}
            label="Total Quotes"
            value={metrics.total}
          />
          <MetricCard
            color="from-amber-500 to-amber-600"
            icon={<Clock className="w-6 h-6 text-white" />}
            label="Pending"
            value={metrics.pending}
          />
          <MetricCard
            color="from-purple-500 to-purple-600"
            icon={<FileText className="w-6 h-6 text-white" />}
            label="Quote Sent"
            value={metrics.quoteSent}
          />
          <MetricCard
            color="from-orange-500 to-orange-600"
            icon={<DollarSign className="w-6 h-6 text-white" />}
            label="Payment Requested"
            value={metrics.paymentRequested}
          />
          <MetricCard
            color="from-green-500 to-green-600"
            icon={<DollarSign className="w-6 h-6 text-white" />}
            label="Paid"
            value={metrics.paid}
          />
        </div>

        {/* charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* bar chart */}
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <h2 className="text-lg font-semibold mb-4">Quotes by Status</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* donut chart */}
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

        {/* recent orders with carousel arrows */}
        <div className="bg-white p-6 rounded-2xl shadow-md relative">
  <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
  {loading ? (
    <p className="text-sm text-slate-500">Loading...</p>
  ) : quotes.length === 0 ? (
    <p className="text-sm text-slate-500">No quotes found.</p>
  ) : (
    <>
      <Slider ref={sliderRef} {...sliderSettings}>
        {quotes.slice(0, 5).map((q) => (
          <div
            key={q._id}
            className="p-4 rounded-xl border hover:shadow-md transition bg-slate-50"
          >
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-xs text-slate-500">
                  {q.createdAt
                    ? new Date(q.createdAt).toLocaleDateString()
                    : "-"}
                </p>
                <p className="text-sm font-semibold text-slate-800">
                  {q.customerId?.name || "—"}
                </p>
              </div>
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
                {q.status}
              </span>
            </div>
            <div className="mb-2">
              <p className="text-sm text-slate-600">
                <span className="font-semibold">Brand:</span> {q.brandName || "-"}
              </p>
              <p className="text-sm text-slate-600">
                <span className="font-semibold">Molecule:</span> {q.moleculeName || q.customMolecule || "-"}
              </p>
            </div>
            <TrackingSteps
              steps={q.trackingSteps || ["Created", "Processing", "Done"]}
              currentStep={q.trackingStep || 0}
            />
          </div>
        ))}
      </Slider>

      {/* arrows inside box */}
      <div className="absolute top-1/2 -translate-y-1/2 left-2 z-10 cursor-pointer bg-white p-1 rounded-full shadow-md">
        <ArrowLeft
          size={20}
          className="text-gray-600 hover:text-gray-900"
          onClick={() => sliderRef.current.slickPrev()}
        />
      </div>
      <div className="absolute top-1/2 -translate-y-1/2 right-2 z-10 cursor-pointer bg-white p-1 rounded-full shadow-md">
        <ArrowRight
          size={20}
          className="text-gray-600 hover:text-gray-900"
          onClick={() => sliderRef.current.slickNext()}
        />
      </div>
    </>
  )}
</div>

      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, color }) {
  return (
    <div
      className={`p-5 rounded-2xl shadow-md bg-gradient-to-r ${color} text-white flex items-center gap-4`}
    >
      <div className="p-3 rounded-xl bg-white/20">{icon}</div>
      <div>
        <div className="text-sm opacity-80">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
      </div>
    </div>
  );
}

function TrackingSteps({ steps, currentStep }) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
            ${
              index <= currentStep
                ? "bg-[#d1383a] text-white"
                : "bg-slate-200 text-slate-500"
            }`}
          >
            {index + 1}
          </div>
          {index < steps.length - 1 && (
            <div
              className={`h-1 w-10 ${
                index < currentStep ? "bg-[#d1383a]" : "bg-slate-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
