import React, { useEffect, useState } from "react";
import axios from "../../api/Axios";
import { Pencil, Trash2, Check, X } from "lucide-react";

const AdminMoleculePanel = () => {
  const [molecules, setMolecules] = useState([]);
  const [newMolecule, setNewMolecule] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editAmount, setEditAmount] = useState("");

  const fetchMolecules = async () => {
    try {
      const res = await axios.get("/api/molecules");
      setMolecules(res.data);
    } catch (err) {
      console.error("Failed to fetch molecules", err);
    }
  };

  useEffect(() => {
    fetchMolecules();
  }, []);

  // ✅ Helper: Get token from localStorage
  const getAuthHeader = () => {
    const token = localStorage.getItem("authToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleAdd = async () => {
    if (!newMolecule.trim()) return;
    setLoading(true);
    try {
      await axios.post(
        "/api/molecules",
        { name: newMolecule.trim(), amount: Number(newAmount) || 0 },
        { headers: getAuthHeader() } // ✅ attach token here
      );
      setNewMolecule("");
      setNewAmount("");
      fetchMolecules();
    } catch (err) {
      console.error("Error adding molecule:", err.response?.data || err.message);
      alert("Error adding molecule. You may not be authorized.");
    } finally {
      setLoading(false);
    }
  };

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

  const handleEdit = async (id) => {
    if (!editValue.trim()) return;
    try {
      await axios.patch(
        `/api/molecules/${id}`,
        { name: editValue.trim(), amount: Number(editAmount) || 0 },
        { headers: getAuthHeader() } // ✅ attach token
      );
      setEditId(null);
      setEditValue("");
      setEditAmount("");
      fetchMolecules();
    } catch (err) {
      console.error("Error updating molecule:", err.response?.data || err.message);
      alert("Error updating molecule. You may not be authorized.");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg border border-gray-200 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Molecule Management</h2>

      {/* Add Form */}
      <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg mb-6 flex items-center gap-3">
        <input
          type="text"
          className="border px-3 py-2 rounded w-full focus:ring-2 focus:ring-[#d1383a] focus:outline-none"
          placeholder="Enter molecule name"
          value={newMolecule}
          onChange={(e) => setNewMolecule(e.target.value)}
        />
        <input
          type="number"
          className="border px-3 py-2 rounded w-32 focus:ring-2 focus:ring-[#d1383a] focus:outline-none"
          placeholder="Amount"
          value={newAmount}
          onChange={(e) => setNewAmount(e.target.value)}
        />
        <button
          onClick={handleAdd}
          disabled={loading}
          className="bg-[#d1383a] text-white px-6 py-2 rounded hover:bg-red-700 transition"
        >
          Add
        </button>
      </div>

      {/* Molecule List */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-100 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-2 border-b">Name</th>
              <th className="px-4 py-2 border-b">Amount</th>
              <th className="px-4 py-2 border-b text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {molecules.map((mol) => (
              <tr key={mol._id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border-b">
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
                <td className="px-4 py-2 border-b">
                  {editId === mol._id ? (
                    <input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="border px-2 py-1 rounded w-28 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Amount"
                    />
                  ) : (
                    <span className="text-gray-700">{mol.amount || 0}</span>
                  )}
                </td>
                <td className="px-4 py-2 border-b text-right space-x-2">
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
                          setEditAmount("");
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
                          setEditAmount(mol.amount || 0);
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
            ))}
            {molecules.length === 0 && (
              <tr>
                <td colSpan="3" className="px-4 py-6 text-center text-gray-500">
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
