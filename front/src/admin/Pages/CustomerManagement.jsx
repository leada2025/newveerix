import React, { useEffect, useState } from "react";
import axios from "../../api/Axios";
import { Pencil, Trash2, Plus, Eye, EyeOff, Search, ChevronLeft, ChevronRight } from "lucide-react";

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Form fields
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    company: "",
    city: "",
    gst: "",
  });

  // ✅ Pagination states
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [perPageOptions] = useState([10, 20, 50.,100]);

  const token = localStorage.getItem("authToken");

  const fetchCustomers = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const { data } = await axios.get("/api/users/customers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // ✅ Search functionality
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredCustomers(customers);
      setPage(1);
    } else {
      const filtered = customers.filter(customer =>
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.GSTno?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered);
      setPage(1);
    }
  }, [searchTerm, customers]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleAddOrEdit = async () => {
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        companyName: form.company,
        city: form.city,
        GSTno: form.gst,
        role: "customer",
      };

      if (isEditing && selectedCustomer) {
        await axios.put(
          `/api/users/customers/${selectedCustomer._id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post("/api/users/signup", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      fetchCustomers();
      setOpen(false);
      setIsEditing(false);
      setSelectedCustomer(null);
      setForm({
        name: "",
        email: "",
        password: "",
        company: "",
        city: "",
        gst: "",
      });
      setShowPassword(false);
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message?.includes("already exists")) {
        alert("User already exists with this email!");
      } else {
        console.error(err);
        alert("Something went wrong!");
      }
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
    setForm({
      name: customer.name,
      email: customer.email,
      password: "",
      company: customer.companyName || "",
      city: customer.city || "",
      gst: customer.GSTno || "",
    });
    setOpen(true);
  };

  const handleToggleActive = async (customer) => {
    try {
      await axios.patch(`/api/users/customers/${customer._id}`, {
        active: !customer.active,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update state instantly
      setCustomers((prev) =>
        prev.map((c) =>
          c._id === customer._id ? { ...c, active: !c.active } : c
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ Pagination logic
  const totalPages = Math.ceil(filteredCustomers.length / perPage);
  const paginatedCustomers = filteredCustomers.slice((page - 1) * perPage, page * perPage);

  // ✅ Calculate range for showing records
  const startRecord = (page - 1) * perPage + 1;
  const endRecord = Math.min(page * perPage, filteredCustomers.length);
  const totalRecords = filteredCustomers.length;

  // ✅ Handle per page change
  const handlePerPageChange = (e) => {
    const newPerPage = parseInt(e.target.value);
    setPerPage(newPerPage);
    setPage(1); // Reset to first page when changing items per page
  };

  // ✅ Generate pagination buttons with ellipsis
  const getPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages are less than or equal to max visible
      for (let i = 1; i <= totalPages; i++) {
        buttons.push(i);
      }
    } else {
      // Always show first page
      buttons.push(1);

      // Calculate start and end of visible pages
      let start = Math.max(2, page - 1);
      let end = Math.min(totalPages - 1, page + 1);

      // Adjust if we're at the beginning
      if (page <= 3) {
        end = 4;
      }

      // Adjust if we're at the end
      if (page >= totalPages - 2) {
        start = totalPages - 3;
      }

      // Add ellipsis after first page if needed
      if (start > 2) {
        buttons.push('...');
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        buttons.push(i);
      }

      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        buttons.push('...');
      }

      // Always show last page
      buttons.push(totalPages);
    }

    return buttons;
  };

  return (
    <div className="p-4 lg:p-6 w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold" style={{ color: "#d1383a" }}>
          Customer Management
        </h2>
        <button
          onClick={() => {
            setOpen(true);
            setIsEditing(false);
            setForm({
              name: "",
              email: "",
              password: "",
              company: "",
              city: "",
              gst: "",
            });
            setShowPassword(false);
          }}
          className="flex items-center justify-center bg-[#d1383a] hover:bg-[#a22a2a] text-white px-4 py-2 rounded-lg shadow w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Customer
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search customers by name, email, company, city, or GST..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d1383a] focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>
        {searchTerm && (
          <p className="text-sm text-gray-500 mt-2">
            Found {filteredCustomers.length} customer(s) matching "{searchTerm}"
          </p>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="px-3 py-3 text-left font-medium whitespace-nowrap">Name</th>
                <th className="px-3 py-3 text-left font-medium whitespace-nowrap">Email</th>
                <th className="px-3 py-3 text-left font-medium whitespace-nowrap hidden md:table-cell">Company</th>
                <th className="px-3 py-3 text-left font-medium whitespace-nowrap hidden lg:table-cell">City</th>
                <th className="px-3 py-3 text-left font-medium whitespace-nowrap hidden xl:table-cell">GST</th>
                <th className="px-3 py-3 text-left font-medium whitespace-nowrap">Status</th>
                <th className="px-3 py-3 text-left font-medium whitespace-nowrap hidden sm:table-cell">Created</th>
                <th className="px-3 py-3 text-right font-medium whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#d1383a]"></div>
                    </div>
                  </td>
                </tr>
              ) : paginatedCustomers.length ? (
                paginatedCustomers.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 whitespace-nowrap font-medium">{c.name}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{c.email}</td>
                    <td className="px-3 py-3 whitespace-nowrap hidden md:table-cell">{c.companyName || "-"}</td>
                    <td className="px-3 py-3 whitespace-nowrap hidden lg:table-cell">{c.city || "-"}</td>
                    <td className="px-3 py-3 whitespace-nowrap hidden xl:table-cell">{c.GSTno || "-"}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(c)}
                        className={`px-2 py-1 rounded text-white text-xs whitespace-nowrap min-w-[60px] ${
                          c.active
                            ? "bg-green-500 hover:bg-green-600"
                            : "bg-gray-400 hover:bg-gray-500"
                        }`}
                      >
                        {c.active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs hidden sm:table-cell">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleEdit(c)}
                          className="p-1 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(c._id)}
                          className="p-1 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">
                    {searchTerm ? "No customers found matching your search" : "No customers found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-gray-200 gap-4">
            {/* Records per page selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <select
                value={perPage}
                onChange={handlePerPageChange}
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#d1383a]"
              >
                {perPageOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-600">entries</span>
            </div>

            {/* Records info */}
            <div className="text-sm text-gray-600">
              Showing {startRecord} to {endRecord} of {totalRecords} entries
              {searchTerm && " (filtered)"}
            </div>

            {/* Pagination buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="p-2 rounded-lg transition text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {getPaginationButtons().map((pageNum, index) => (
                <button
                  key={index}
                  onClick={() => typeof pageNum === 'number' ? setPage(pageNum) : null}
                  disabled={pageNum === '...'}
                  className={`px-3 py-1 rounded-lg transition text-sm min-w-[36px] ${
                    page === pageNum
                      ? "bg-[#d1383a] text-white shadow"
                      : pageNum === '...'
                      ? "bg-transparent cursor-default"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              
              <button
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="p-2 rounded-lg transition text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
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
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#d1383a] focus:border-transparent"
                />
                <input
                  type="email"
                  placeholder="Email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#d1383a] focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Company"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#d1383a] focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="City"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#d1383a] focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="GST Number"
                  name="gst"
                  value={form.gst}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#d1383a] focus:border-transparent"
                />
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#d1383a] focus:border-transparent pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddOrEdit}
                  className="px-4 py-2 bg-[#d1383a] hover:bg-[#a22a2a] text-white rounded transition-colors"
                >
                  {isEditing ? "Update" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}