import React, { useEffect, useState } from "react";
import axios from "../../api/Axios";
import { Edit2, Trash2, X,Plus } from "lucide-react";

export default function UserAccess() {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "" });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false); // modal toggle
  const [editId, setEditId] = useState(null);

  const pageSize = 5;
  const token = localStorage.getItem("authToken");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchRoles();
    fetchEmployees();
  }, []);

  const fetchRoles = async () => {
    const res = await axios.get("/api/roles/employee-roles", { headers });
    setRoles(res.data);
  };

  const fetchEmployees = async () => {
    const res = await axios.get("/api/users/employees", { headers });
    setEmployees(res.data);
  };

  const handleSubmit = async () => {
    if (editId) {
      await axios.put(`/api/users/${editId}`, form, { headers });
    } else {
      await axios.post("/api/users/add-employee", form, { headers });
    }
    setForm({ name: "", email: "", password: "", role: "" });
    setEditId(null);
    setShowForm(false);
    fetchEmployees();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      await axios.delete(`/api/users/${id}`, { headers });
      fetchEmployees();
    }
  };

  const filtered = employees.filter((emp) =>
    emp.name.toLowerCase().includes(search.toLowerCase())
  );
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  return (
   <div className="p-6 max-w-7xl mx-auto">
  {/* Header */}
  <div className="flex justify-between items-center mb-6">
    <h2 className="text-2xl font-bold text-[#d1383a]">User Access Management</h2>
    <button
      onClick={() => {
        setForm({ name: "", email: "", password: "", role: "" });
        setEditId(null);
        setShowForm(true);
      }}
      className="flex items-center bg-[#d1383a] hover:bg-[#a22a2a] text-white px-4 py-2 rounded-lg shadow"
    >
      <Plus className="w-4 h-4 mr-2" /> Add Employee
    </button>
  </div>

  {/* Search */}
  <div className="flex justify-between mb-3">
    <input
      type="text"
      placeholder="Search employees..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="border border-gray-300 p-2 rounded w-1/3 focus:ring-2 focus:ring-[#d1383a] outline-none"
    />
  </div>

  {/* Employee Table */}
  <div className="bg-white rounded-xl shadow overflow-hidden">
    <table className="min-w-full text-sm">
      <thead className="bg-gray-100 text-gray-600">
        <tr>
          <th className="px-6 py-3 text-left font-medium">Name</th>
          <th className="px-6 py-3 text-left font-medium">Email</th>
          <th className="px-6 py-3 text-left font-medium">Role</th>
          <th className="px-6 py-3 text-right font-medium">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {paginated.length ? (
          paginated.map((emp) => (
            <tr key={emp._id} className="hover:bg-gray-50">
              <td className="px-6 py-3">{emp.name}</td>
              <td className="px-6 py-3">{emp.email}</td>
              <td className="px-6 py-3">{emp.role?.name}</td>
              <td className="px-6 py-3 flex justify-end gap-2">
                <button
                  className="p-2 bg-yellow-100 hover:bg-yellow-200 rounded"
                  onClick={() => {
                    setForm({
                      name: emp.name,
                      email: emp.email,
                      password: "",
                      role: emp.role?._id || "",
                    });
                    setEditId(emp._id);
                    setShowForm(true);
                  }}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  className="p-2 bg-red-500 hover:bg-red-600 text-white rounded"
                  onClick={() => handleDelete(emp._id)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="4" className="text-center py-6 text-gray-500">
              No employees found
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>

  {/* Pagination */}
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

  {/* Add/Edit Employee Modal */}
  {showForm && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
          onClick={() => setShowForm(false)}
        >
          <X size={20} />
        </button>
        <h3 className="text-lg font-bold mb-4">
          {editId ? "Edit Employee" : "Add Employee"}
        </h3>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-[#d1383a]"
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-[#d1383a]"
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-[#d1383a]"
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-[#d1383a]"
          >
            <option value="">Select Role</option>
            {roles.map((role) => (
              <option key={role._id} value={role._id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleSubmit}
          className="mt-6 w-full bg-[#d1383a] text-white px-4 py-2 rounded shadow hover:bg-[#a22a2a]"
        >
          {editId ? "Update Employee" : "Add Employee"}
        </button>
      </div>
    </div>
  )}
</div>

  );
}
