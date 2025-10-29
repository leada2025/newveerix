import React, { useState, useEffect } from "react";
import axios from "../../api/Axios";
import { Trash2, Edit2, Plus, X, Search, Users, Shield, Filter } from "lucide-react";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // search & pagination states
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("authToken");
      const res = await axios.get("/api/roles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoles(res.data);
    } catch (err) {
      setError("Failed to fetch roles");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Role name is required");
      return;
    }

    try {
      setLoading(true);
      setError("");
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
      
      resetForm();
      fetchRoles();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save role");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this role?")) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      await axios.delete(`/api/roles/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchRoles();
    } catch (err) {
      setError("Failed to delete role");
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (perm) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const resetForm = () => {
    setName("");
    setPermissions([]);
    setEditId(null);
    setShowForm(false);
    setError("");
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

  const getPermissionBadgeColor = (perm) => {
    const colors = {
      view_quotes: "bg-blue-100 text-blue-800",
      manage_quotes: "bg-green-100 text-green-800",
      manage_users: "bg-purple-100 text-purple-800",
    };
    return colors[perm] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gray-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 rounded-lg">
              <Shield className="w-6 h-6 text-[#d1383a]" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
          </div>
          <p className="text-gray-600">Manage user roles and permissions across the system</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Roles</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{roles.length}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Permissions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{availablePermissions.length}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search roles..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#d1383a] focus:border-transparent"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-[#d1383a] hover:bg-[#b52f30] text-white px-4 py-2.5 rounded-lg shadow-sm transition-colors duration-200 font-medium"
            >
              <Plus className="w-4 h-4" />
              Create Role
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-red-700 text-sm">{error}</span>
            </div>
            <button onClick={() => setError("")} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d1383a]"></div>
            </div>
          ) : (
            <>
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Role Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Permissions
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedRoles.length ? (
                    paginatedRoles.map((role) => (
                      <tr key={role._id} className="hover:bg-gray-50/50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-[#d1383a] rounded-full"></div>
                            <span className="font-semibold text-gray-900">{role.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {role.permissions.map((perm) => (
                              <span
                                key={perm}
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPermissionBadgeColor(perm)}`}
                              >
                                {perm}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditId(role._id);
                                setName(role.name);
                                setPermissions(role.permissions);
                                setShowForm(true);
                              }}
                              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                              title="Edit role"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(role._id)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                              title="Delete role"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <Shield className="w-12 h-12 mb-3 opacity-50" />
                          <p className="text-lg font-medium mb-1">No roles found</p>
                          <p className="text-sm">
                            {search ? "Try adjusting your search terms" : "Get started by creating your first role"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {filteredRoles.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-gray-600">
                      Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{" "}
                      <span className="font-medium">
                        {Math.min(page * pageSize, filteredRoles.length)}
                      </span>{" "}
                      of <span className="font-medium">{filteredRoles.length}</span> results
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(p - 1, 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
                      >
                        Previous
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`w-8 h-8 text-sm rounded-lg transition-colors duration-200 ${
                              page === pageNum
                                ? "bg-[#d1383a] text-white"
                                : "text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            {pageNum}
                          </button>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                        disabled={page === totalPages}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editId ? "Update Role" : "Create New Role"}
              </h3>
              <button
                onClick={resetForm}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role Name
                </label>
                <input
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d1383a] focus:border-transparent"
                  placeholder="Enter role name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions
                </label>
                <div className="space-y-2">
                  {availablePermissions.map((perm) => (
                    <label key={perm} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors duration-200">
                      <input
                        type="checkbox"
                        checked={permissions.includes(perm)}
                        onChange={() => togglePermission(perm)}
                        className="rounded border-gray-300 text-[#d1383a] focus:ring-[#d1383a]"
                      />
                      <span className="text-sm text-gray-700">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={resetForm}
                className="px-4 py-2.5 text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !name.trim()}
                className="px-4 py-2.5 bg-[#d1383a] hover:bg-[#b52f30] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200"
              >
                {loading ? "Saving..." : editId ? "Update Role" : "Create Role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}