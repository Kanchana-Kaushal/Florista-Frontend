import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiBox, FiLoader, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Flowers() {
  const [flowers, setFlowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFlower, setEditingFlower] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({ name: '', costPrice: '', sellingPrice: '' });

  const fetchFlowers = async (search = '') => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/flowers?search=${search}&limit=100`);
      setFlowers(res.data.data);
    } catch (error) {
      console.error("Failed to fetch flowers", error);
      toast.error("Failed to load flowers inventory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search
    const delayDebounceFn = setTimeout(() => {
      fetchFlowers(searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleOpenModal = (flower = null) => {
    if (flower) {
      setEditingFlower(flower);
      setFormData({ name: flower.name, costPrice: flower.costPrice, sellingPrice: flower.sellingPrice });
    } else {
      setEditingFlower(null);
      setFormData({ name: '', costPrice: '', sellingPrice: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingFlower(null);
    setFormData({ name: '', costPrice: '', sellingPrice: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFlower) {
        await axios.put(`http://localhost:5000/api/flowers/${editingFlower._id}`, formData);
        toast.success("Flower updated successfully!");
      } else {
        await axios.post('http://localhost:5000/api/flowers', formData);
        toast.success("Flower added successfully!");
      }
      handleCloseModal();
      fetchFlowers(searchTerm);
    } catch (error) {
      console.error("Error saving flower", error);
      toast.error(error.response?.data?.error || "Failed to save flower details.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this flower?")) {
      try {
        await axios.delete(`http://localhost:5000/api/flowers/${id}`);
        toast.success("Flower deleted successfully.");
        fetchFlowers(searchTerm);
      } catch (error) {
        console.error("Error deleting flower", error);
        toast.error("Failed to delete flower.");
      }
    }
  };

  // Format Currency Helper
  const formatCurrency = (amount) => 
    `Rs. ${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="w-full flex justify-center py-6 px-4">
      <div className="max-w-6xl w-full space-y-8">
        
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <span className="p-2 bg-fuchsia-100 text-fuchsia-600 rounded-xl">
                <FiBox size={28} />
              </span>
              Flower Inventory
            </h1>
            <p className="text-slate-500 font-medium mt-2">Manage your products, costs, and pricing.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <FiSearch />
              </div>
              <input 
                type="text" 
                placeholder="Search flowers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-fuchsia-100 focus:border-fuchsia-400 transition-all shadow-sm font-medium text-slate-700"
              />
            </div>
            {/* Add Button */}
            <button 
              onClick={() => handleOpenModal()}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-2xl shadow-md transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              <FiPlus size={20} />
              Add Flower
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="w-full h-[400px] flex flex-col items-center justify-center text-fuchsia-500">
              <FiLoader className="animate-spin mb-4" size={40} />
              <p className="font-medium text-slate-500">Loading inventory...</p>
            </div>
          ) : flowers.length === 0 ? (
            <div className="w-full h-[400px] flex flex-col items-center justify-center text-slate-400">
              <div className="bg-slate-50 p-6 rounded-full mb-4">
                <FiBox size={48} className="text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-600 mb-1">No flowers found</h3>
              <p className="text-sm">Try adjusting your search or add a new flower.</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-sm uppercase tracking-wider">
                    <th className="p-5 pl-6 rounded-tl-3xl">ID</th>
                    <th className="p-5">Flower Name</th>
                    <th className="p-5">Cost Price</th>
                    <th className="p-5">Selling Price</th>
                    <th className="p-5">Margin</th>
                    <th className="p-5 pr-6 text-right rounded-tr-3xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {flowers.map((flower) => {
                    const margin = flower.sellingPrice - flower.costPrice;
                    const marginPercent = flower.costPrice > 0 ? ((margin / flower.costPrice) * 100).toFixed(1) : 0;
                    
                    return (
                      <tr key={flower._id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-5 pl-6 font-mono text-sm text-slate-400 font-semibold">{flower.flowerId}</td>
                        <td className="p-5 font-bold text-slate-800">{flower.name}</td>
                        <td className="p-5 font-medium text-slate-600">{formatCurrency(flower.costPrice)}</td>
                        <td className="p-5 font-bold text-emerald-600">{formatCurrency(flower.sellingPrice)}</td>
                        <td className="p-5">
                          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold leading-5 bg-indigo-50 text-indigo-700">
                            {margin >= 0 ? '+' : ''}{marginPercent}%
                          </div>
                        </td>
                        <td className="p-5 pr-6 text-right space-x-2">
                          <button 
                            onClick={() => handleOpenModal(flower)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors inline-block"
                            title="Edit"
                          >
                            <FiEdit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(flower._id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors inline-block"
                            title="Delete"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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
                {editingFlower ? 'Edit Flower' : 'Add New Flower'}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors">
                <FiX size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Flower Name</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-fuchsia-100 focus:border-fuchsia-400 transition-all font-medium text-slate-800"
                  placeholder="e.g. Red Rose Bouquet"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Cost Price (Rs.)</label>
                  <input 
                    type="number" 
                    name="costPrice"
                    step="0.01"
                    min="0"
                    value={formData.costPrice}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-400 transition-all font-medium text-slate-800"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Selling Price (Rs.)</label>
                  <input 
                    type="number" 
                    name="sellingPrice"
                    step="0.01"
                    min="0"
                    value={formData.sellingPrice}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition-all font-medium text-slate-800"
                    placeholder="0.00"
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
                  className="flex-1 px-4 py-3 font-bold text-white bg-fuchsia-600 hover:bg-fuchsia-700 shadow-md shadow-fuchsia-200 rounded-xl transition-colors"
                >
                  {editingFlower ? 'Save Changes' : 'Create Flower'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
