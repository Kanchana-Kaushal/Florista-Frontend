import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiUsers, FiLoader, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Buyers() {
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({ name: '', telephone: '', location: '', businessName: '' });

  const fetchBuyers = async (search = '') => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/buyers?search=${search}&limit=100`);
      setBuyers(res.data.data);
    } catch (error) {
      console.error("Failed to fetch buyers", error);
      toast.error("Failed to load buyers directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search
    const delayDebounceFn = setTimeout(() => {
      fetchBuyers(searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleOpenModal = (buyer = null) => {
    if (buyer) {
      setEditingBuyer(buyer);
      setFormData({ name: buyer.name, telephone: buyer.telephone, location: buyer.location, businessName: buyer.businessName || '' });
    } else {
      setEditingBuyer(null);
      setFormData({ name: '', telephone: '', location: '', businessName: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBuyer(null);
    setFormData({ name: '', telephone: '', location: '', businessName: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBuyer) {
        await axios.put(`${API_URL}/buyers/${editingBuyer._id}`, formData);
        toast.success("Buyer updated successfully!");
      } else {
        await axios.post(`${API_URL}/buyers`, formData);
        toast.success("Buyer added successfully!");
      }
      handleCloseModal();
      fetchBuyers(searchTerm);
    } catch (error) {
      console.error("Error saving buyer", error);
      toast.error(error.response?.data?.error || "Failed to save buyer details.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this buyer?")) {
      try {
        await axios.delete(`${API_URL}/buyers/${id}`);
        toast.success("Buyer deleted successfully.");
        fetchBuyers(searchTerm);
      } catch (error) {
        console.error("Error deleting buyer", error);
        toast.error("Failed to delete buyer.");
      }
    }
  };

  return (
    <div className="w-full flex justify-center py-6 px-4">
      <div className="max-w-6xl w-full space-y-8">
        
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <span className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                <FiUsers size={28} />
              </span>
              Buyer Directory
            </h1>
            <p className="text-slate-500 font-medium mt-2">Manage your customers and their contact details.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute top-1/2 -translate-y-1/2 left-3 pointer-events-none text-slate-400">
                <FiSearch />
              </div>
              <input 
                type="text" 
                placeholder="Search buyers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400 transition-all shadow-sm font-medium text-slate-700"
              />
            </div>
            {/* Add Button */}
            <button 
              onClick={() => handleOpenModal()}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-2xl shadow-md transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              <FiPlus size={20} />
              Add Buyer
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="w-full h-[400px] flex flex-col items-center justify-center text-amber-500">
              <FiLoader className="animate-spin mb-4" size={40} />
              <p className="font-medium text-slate-500">Loading directory...</p>
            </div>
          ) : buyers.length === 0 ? (
            <div className="w-full h-[400px] flex flex-col items-center justify-center text-slate-400">
              <div className="bg-slate-50 p-6 rounded-full mb-4">
                <FiUsers size={48} className="text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-600 mb-1">No buyers found</h3>
              <p className="text-sm">Try adjusting your search or add a new buyer.</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-sm uppercase tracking-wider">
                    <th className="p-5 pl-6 rounded-tl-3xl">ID</th>
                    <th className="p-5">Name / Business</th>
                    <th className="p-5">Contact</th>
                    <th className="p-5">Location</th>
                    <th className="p-5 pr-6 text-right rounded-tr-3xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm md:text-base">
                  {buyers.map((buyer) => (
                    <tr key={buyer._id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-5 pl-6 font-mono text-sm text-slate-400 font-semibold">{buyer.buyerId}</td>
                      <td className="p-5">
                        <p className="font-bold text-slate-800">{buyer.name}</p>
                        {buyer.businessName && <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">{buyer.businessName}</p>}
                      </td>
                      <td className="p-5 font-medium text-slate-600">{buyer.telephone}</td>
                      <td className="p-5 font-medium text-slate-600">{buyer.location}</td>
                      <td className="p-5 pr-6 text-right space-x-2">
                        <button 
                          onClick={() => handleOpenModal(buyer)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors inline-block"
                          title="Edit"
                        >
                          <FiEdit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(buyer._id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors inline-block"
                          title="Delete"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={handleCloseModal}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative transform transition-all scale-100">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">
                {editingBuyer ? 'Edit Buyer' : 'Add New Buyer'}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors">
                <FiX size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400 transition-all font-medium text-slate-800"
                  placeholder="e.g. Jane Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Business Name (Optional)</label>
                <input 
                  type="text" 
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400 transition-all font-medium text-slate-800"
                  placeholder="e.g. Floral Designs Ltd"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Telephone</label>
                  <input 
                    type="text" 
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400 transition-all font-medium text-slate-800"
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Location</label>
                  <input 
                    type="text" 
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400 transition-all font-medium text-slate-800"
                    placeholder="City or Area"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-3 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-3 font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-200 rounded-xl transition-colors"
                >
                  {editingBuyer ? 'Save Changes' : 'Create Buyer'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
