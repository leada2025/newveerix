import React, { useEffect, useState } from "react";
import axios from "../../api/Axios";
import { Pencil, Trash2, Plus, Eye, EyeOff } from "lucide-react";

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  // ✅ Pagination states
  const [page, setPage] = useState(1);
  const [perPage] = useState(5);

  const token = localStorage.getItem("authToken");

  const fetchCustomers = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const { data } = await axios.get("/api/users/customers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAddOrEdit = async () => {
    try {
      if (isEditing && selectedCustomer) {
        await axios.put(
          `/api/users/customers/${selectedCustomer._id}`,
          { ...form },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          "/api/users/signup",
          { ...form, role: "customer" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      fetchCustomers();
      setOpen(false);
      setIsEditing(false);
      setSelectedCustomer(null);
      setForm({ name: "", email: "", password: "" });
      setShowPassword(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this customer?")) return;
    try {
      await axios.delete(`/api/users/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCustomers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (customer) => {
    setIsEditing(true);
    setSelectedCustomer(customer);
    setForm({ name: customer.name, email: customer.email, password: "" });
    setOpen(true);
  };

  // Active/Deactivate toggle
  const handleToggleActive = async (customer) => {
    try {
      await axios.patch(
        `/api/users/customers/${customer._id}`,
        { active: !customer.active },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCustomers();
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ Pagination logic
  const totalPages = Math.ceil(customers.length / perPage);
  const paginatedCustomers = customers.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold" style={{ color: "#d1383a" }}>
          Customer Management
        </h2>
        <button
          onClick={() => {
            setOpen(true);
            setIsEditing(false);
            setForm({ name: "", email: "", password: "" });
            setShowPassword(false);
          }}
          className="flex items-center bg-[#d1383a] hover:bg-[#a22a2a] text-white px-4 py-2 rounded-lg shadow"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Customer
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-6 py-3 text-left font-medium">Name</th>
              <th className="px-6 py-3 text-left font-medium">Email</th>
              <th className="px-6 py-3 text-left font-medium">Status</th>
              <th className="px-6 py-3 text-left font-medium">Created At</th>
              <th className="px-6 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center py-6">
                  Loading...
                </td>
              </tr>
            ) : paginatedCustomers.length ? (
              paginatedCustomers.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">{c.name}</td>
                  <td className="px-6 py-3">{c.email}</td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => handleToggleActive(c)}
                      className={`px-2 py-1 rounded text-white text-sm ${
                        c.active
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-gray-400 hover:bg-gray-500"
                      }`}
                    >
                      {c.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-6 py-3">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3 flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(c)}
                      className="p-2 bg-gray-200 hover:bg-gray-300 rounded"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="p-2 bg-red-500 hover:bg-red-600 text-white rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-6 text-gray-500">
                  No customers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-end mt-4 gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-3 py-1 rounded-lg transition ${
                page === i + 1
                  ? "bg-[#d1383a] text-white shadow"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">
              {isEditing ? "Edit Customer" : "Add New Customer"}
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="email"
                placeholder="Email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              />
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-2"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAddOrEdit}
                className="px-4 py-2 bg-[#d1383a] hover:bg-[#a22a2a] text-white rounded"
              >
                {isEditing ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
