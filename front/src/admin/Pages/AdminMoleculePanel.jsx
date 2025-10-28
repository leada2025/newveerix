import React, { useEffect, useState, useMemo } from "react";
import axios from "../../api/Axios";
import { Pencil, Trash2, Check, X, Plus, ArrowUpDown, Search } from "lucide-react";

const AdminMoleculePanel = () => {
  const [molecules, setMolecules] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [newMolecule, setNewMolecule] = useState("");
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [sortBy, setSortBy] = useState("alpha"); // 'alpha' or 'date'
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc' or 'desc'

  const getAuthHeader = () => {
    const token = localStorage.getItem("authToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchMolecules = async () => {
    try {
      const res = await axios.get("/api/molecules");
      const sorted = res.data.sort((a, b) => a.name.localeCompare(b.name));
      setMolecules(sorted);
      setFiltered(sorted);
    } catch (err) {
      console.error("Failed to fetch molecules", err);
    }
  };

  useEffect(() => {
    fetchMolecules();
  }, []);

  // 🔍 Search filter
  useEffect(() => {
    const f = molecules.filter((m) =>
      m.name.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(f);
  }, [search, molecules]);

  // 🔀 Sorting
  const handleSort = (type) => {
    let newOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortBy(type);
    setSortOrder(newOrder);

    let sorted = [...filtered];
    if (type === "alpha") {
      sorted.sort((a, b) =>
        newOrder === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name)
      );
    } else if (type === "date") {
      sorted.sort((a, b) =>
        newOrder === "asc"
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt)
      );
    }
    setFiltered(sorted);
  };

  // ➕ Add molecule
  const handleAdd = async () => {
    if (!newMolecule.trim()) return;
    setLoading(true);
    try {
      await axios.post(
        "/api/molecules",
        { name: newMolecule.trim() },
        { headers: getAuthHeader() }
      );
      setNewMolecule("");
      fetchMolecules();
    } catch (err) {
      console.error("Error adding molecule:", err.response?.data || err.message);
      alert("Error adding molecule. You may not be authorized.");
    } finally {
      setLoading(false);
    }
  };

  // ✏️ Update
  const handleEdit = async (id) => {
    if (!editValue.trim()) return;
    try {
      await axios.patch(
        `/api/molecules/${id}`,
        { name: editValue.trim() },
        { headers: getAuthHeader() }
      );
      setEditId(null);
      setEditValue("");
      fetchMolecules();
    } catch (err) {
      console.error("Error updating molecule:", err.response?.data || err.message);
      alert("Error updating molecule. You may not be authorized.");
    }
  };

  // 🗑️ Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this molecule?")) return;
    try {
      await axios.delete(`/api/molecules/${id}`, { headers: getAuthHeader() });
      fetchMolecules();
    } catch (err) {
      console.error("Delete error:", err.response?.data || err.message);
      alert("Error deleting molecule. You may not be authorized.");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <h2 className="text-xl font-semibold text-gray-800">Molecule Management</h2>

        {/* 🔍 Search Bar */}
        <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 w-full sm:w-80 bg-gray-50">
          <Search size={16} className="text-gray-400 mr-2" />
          <input
            type="text"
            className="w-full bg-transparent focus:outline-none text-sm"
            placeholder="Search molecules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ➕ Add Form */}
      <div className="flex items-center gap-3 mb-6">
        <input
          type="text"
          className="border border-gray-300 px-3 py-2 rounded-lg w-full text-sm focus:ring-2 focus:ring-[#d1383a] focus:border-[#d1383a] outline-none"
          placeholder="Enter molecule name"
          value={newMolecule}
          onChange={(e) => setNewMolecule(e.target.value)}
        />
        <button
          onClick={handleAdd}
          disabled={loading}
          className="bg-[#d1383a] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition disabled:opacity-50"
        >
          <Plus size={18} />
          Add
        </button>
      </div>

      {/* 🧭 Sort Controls */}
      <div className="flex justify-end gap-3 mb-4 text-sm text-gray-600">
        <button
          onClick={() => handleSort("alpha")}
          className={`flex items-center gap-1 px-3 py-1 rounded border ${
            sortBy === "alpha" ? "border-[#d1383a] text-[#d1383a]" : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <ArrowUpDown size={14} />
          A–Z
        </button>
        <button
          onClick={() => handleSort("date")}
          className={`flex items-center gap-1 px-3 py-1 rounded border ${
            sortBy === "date" ? "border-[#d1383a] text-[#d1383a]" : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <ArrowUpDown size={14} />
          Date
        </button>
      </div>

      {/* 📋 Molecule List */}
      <div className="overflow-hidden border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Molecule Name</th>
              <th className="px-4 py-3 text-left font-medium">Created</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((mol) => (
                <tr key={mol._id} className="hover:bg-gray-50 border-b last:border-none">
                  <td className="px-4 py-3 text-gray-800">
                    {editId === mol._id ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="border px-2 py-1 rounded w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    ) : (
                      mol.name
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {mol.createdAt
                      ? new Date(mol.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {editId === mol._id ? (
                      <>
                        <button
                          onClick={() => handleEdit(mol._id)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setEditId(null);
                            setEditValue("");
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X size={18} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditId(mol._id);
                            setEditValue(mol.name);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(mol._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center text-gray-500 py-6">
                  No molecules found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminMoleculePanel;
