import React, { useEffect, useState } from "react";
import axios from "../../api/Axios";
import { Pencil, Trash2, Check, X } from "lucide-react";

const AdminMoleculePanel = () => {
  const [molecules, setMolecules] = useState([]);
  const [newMolecule, setNewMolecule] = useState("");
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [newAmount, setNewAmount] = useState("");
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

 const handleAdd = async () => {
  if (!newMolecule.trim()) return;
  setLoading(true);
  try {
    await axios.post("/api/molecules", {
      name: newMolecule.trim(),
      amount: Number(newAmount) || 0,
    });
    setNewMolecule("");
    setNewAmount("");
    fetchMolecules();
  } catch (err) {
    alert("Error adding molecule. It may already exist.");
  } finally {
    setLoading(false);
  }
};


  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this molecule?")) return;
    try {
      await axios.delete(`/api/molecules/${id}`);
      fetchMolecules();
    } catch (err) {
      console.error("Delete error", err);
    }
  };

const handleEdit = async (id) => {
  if (!editValue.trim()) return;
  try {
    await axios.patch(`/api/molecules/${id}`, {
      name: editValue.trim(),
      amount: Number(editAmount) || 0,
    });
    setEditId(null);
    setEditValue("");
    setEditAmount("");
    fetchMolecules();
  } catch (err) {
    alert("Error updating molecule.");
  }
};


  return (
    <div className="p-6 max-w-2xl mx-auto bg-white shadow-xl rounded-xl border border-gray-200">
      <h2 className="text-2xl font-semibold text-[#d1383a] mb-6">Manage Molecules</h2>

     <div className="flex gap-3 mb-6">
  <input
    type="text"
    className="border px-4 py-2 rounded w-full"
    placeholder="Enter molecule name"
    value={newMolecule}
    onChange={(e) => setNewMolecule(e.target.value)}
  />
  <input
    type="number"
    className="border px-4 py-2 rounded w-36"
    placeholder="Amount"
    value={newAmount}
    onChange={(e) => setNewAmount(e.target.value)}
  />
  <button
    onClick={handleAdd}
    disabled={loading}
    className="bg-[#d1383a] text-white px-5 py-2 rounded hover:bg-red-700 transition"
  >
    Add
  </button>
</div>


      <ul className="space-y-3">
        {molecules.map((mol) => (
          <li
            key={mol._id}
            className="flex items-center justify-between bg-gray-100 px-4 py-2 rounded"
          >
     {editId === mol._id ? (
  <div className="flex flex-1 gap-2">
    <input
      type="text"
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      className="border px-2 py-1 rounded w-full"
    />
    <input
      type="number"
      value={editAmount}
      onChange={(e) => setEditAmount(e.target.value)}
      className="border px-2 py-1 rounded w-28"
      placeholder="Amount"
    />
  </div>
) : (
  <div className="flex-1 flex justify-between pr-4">
    <span>{mol.name}</span>
    <span className="text-gray-600 text-sm">({mol.amount || 0})</span>
  </div>
)}


            <div className="flex items-center gap-2">
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
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminMoleculePanel;
