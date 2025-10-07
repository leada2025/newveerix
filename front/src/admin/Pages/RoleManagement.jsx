import React, { useState, useEffect } from "react";
import axios from "../../api/Axios";
import { Trash2, Edit2, Plus, X } from "lucide-react";

const availablePermissions = [
  "view_quotes",
  "manage_quotes",
  "manage_users",
];

export default function RoleManager() {
  const [roles, setRoles] = useState([]);
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState([]);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // search & pagination states
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    const token = localStorage.getItem("authToken");
    const res = await axios.get("/api/roles", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setRoles(res.data);
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("authToken");
    if (editId) {
      await axios.put(
        `/api/roles/${editId}`,
        { name, permissions },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } else {
      await axios.post(
        "/api/roles",
        { name, permissions },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
    setName("");
    setPermissions([]);
    setEditId(null);
    setShowForm(false);
    fetchRoles();
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("authToken");
    await axios.delete(`/api/roles/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchRoles();
  };

  const togglePermission = (perm) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  // search + paginate roles
  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filteredRoles.length / pageSize);
  const paginatedRoles = filteredRoles.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
<div className="p-6 max-w-7xl mx-auto">
  {/* Header */}
  <div className="flex justify-between items-center mb-6">
    <h2 className="text-2xl font-bold text-[#d1383a]">Role Management</h2>
    <button
      onClick={() => setShowForm(true)}
      className="flex items-center bg-[#d1383a] hover:bg-[#b52f30] text-white px-4 py-2 rounded-lg shadow"
    >
      <Plus className="w-4 h-4 mr-2" /> Create Role
    </button>
  </div>

  {/* Search */}
  <div className="flex justify-between items-center mb-3">
    <input
      type="text"
      placeholder="Search roles..."
      className="border p-2 rounded w-1/3 focus:ring-2 focus:ring-[#d1383a]"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  </div>

  {/* Table */}
  <div className="bg-white rounded-xl shadow overflow-hidden">
    <table className="min-w-full text-sm">
      <thead className="bg-gray-100 text-gray-600">
        <tr>
          <th className="px-6 py-3 text-left font-medium">Role Name</th>
          <th className="px-6 py-3 text-left font-medium">Permissions</th>
          <th className="px-6 py-3 text-right font-medium">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {paginatedRoles.length ? (
          paginatedRoles.map((role) => (
            <tr key={role._id} className="hover:bg-gray-50">
              <td className="px-6 py-3 font-medium">{role.name}</td>
              <td className="px-6 py-3 text-gray-600 text-sm">{role.permissions.join(", ")}</td>
              <td className="px-6 py-3 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setEditId(role._id);
                    setName(role.name);
                    setPermissions(role.permissions);
                    setShowForm(true);
                  }}
                  className="p-2 bg-yellow-100 hover:bg-yellow-200 rounded"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(role._id)}
                  className="p-2 bg-red-500 hover:bg-red-600 text-white rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="3" className="text-center py-6 text-gray-500">
              No roles found
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>

  {/* Pagination */}
  <div className="flex justify-between items-center mt-4">
    <span className="text-sm text-gray-600">
      Page {page} of {totalPages || 1}
    </span>
    <div className="flex gap-2">
      <button
        onClick={() => setPage((p) => Math.max(p - 1, 1))}
        disabled={page === 1}
        className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
      >
        Prev
      </button>
      <button
        onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
        disabled={page === totalPages}
        className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
      >
        Next
      </button>
    </div>
  </div>

  {/* Modal */}
  {showForm && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <h3 className="text-lg font-bold mb-4">
          {editId ? "Update Role" : "Create Role"}
        </h3>

        <input
          className="border px-3 py-2 w-full mb-4 rounded focus:ring-2 focus:ring-[#d1383a]"
          placeholder="Role Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-2 mb-4">
          {availablePermissions.map((perm) => (
            <label key={perm} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={permissions.includes(perm)}
                onChange={() => togglePermission(perm)}
              />
              {perm}
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              setShowForm(false);
              setName("");
              setPermissions([]);
              setEditId(null);
            }}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-[#d1383a] hover:bg-[#a22a2a] text-white rounded"
          >
            {editId ? "Update Role" : "Save Role"}
          </button>
        </div>
      </div>
    </div>
  )}
</div>

  );
}
