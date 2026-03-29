import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPrinter, FiCheck, FiDownload, FiX, FiLoader, FiShoppingBag, FiMoreVertical, FiEdit, FiTrash2, FiEye, FiDollarSign } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { toPng } from 'html-to-image';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [paidFilter, setPaidFilter] = useState(''); // '' = all, 'true' = paid, 'false' = unpaid
  const [settledFilter, setSettledFilter] = useState(''); // '' = all, 'true' = settled, 'false' = unsettled
  const [selectedOrders, setSelectedOrders] = useState([]);

  // Modal & Menus
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [detailsOrder, setDetailsOrder] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const billRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.options-dropdown-container')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchOrders = async (searchTerm = search, paid = paidFilter, settled = settledFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 100 });
      if (searchTerm) params.append('search', searchTerm);
      if (paid !== '') params.append('paid', paid);
      if (settled !== '') params.append('settled', settled);

      const res = await axios.get(`${API_URL}/orders?${params.toString()}`);
      setOrders(res.data.data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast.error("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchOrders();
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [search, paidFilter, settledFilter]);

  const toggleOrderSelection = (order) => {
    if (selectedOrders.find(o => o._id === order._id)) {
      setSelectedOrders(selectedOrders.filter(o => o._id !== order._id));
    } else {
      setSelectedOrders([...selectedOrders, order]);
    }
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this order? This action cannot be undone.")) return;
    try {
      await axios.delete(`${API_URL}/orders/${orderId}`);
      toast.success("Order deleted successfully");
      fetchOrders();
    } catch (error) {
      toast.error("Failed to delete order");
    }
  };

  const handleMarkPaid = async (orderId) => {
    try {
      await axios.put(`${API_URL}/orders/${orderId}`, { paid: true });
      toast.success("Order marked as paid!");
      fetchOrders();
    } catch (error) {
      toast.error("Failed to mark order as paid");
    }
  };

  const handleDownloadBill = async () => {
    if (billRef.current === null) return;
    try {
      const dataUrl = await toPng(billRef.current, { cacheBust: true, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `Receipt_${receiptOrder.orderId}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Receipt downloaded');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate image');
    }
  };

  // Helper formats
  const formatCurrency = (amount) => `Rs. ${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="w-full flex justify-center py-6 px-4">
      <div className="max-w-7xl w-full space-y-6">
        
        {/* Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <span className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                <FiShoppingBag size={28} />
              </span>
              My Orders
            </h1>
            <p className="text-slate-500 font-medium mt-2">Manage all customer orders and settlements.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 items-center w-full lg:w-auto">
            {/* Filters */}
            <select 
              value={paidFilter} 
              onChange={(e) => setPaidFilter(e.target.value)}
              className="px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 font-medium text-slate-700 shadow-sm w-full sm:w-auto"
            >
              <option value="">All Payments</option>
              <option value="true">Paid Only</option>
              <option value="false">Unpaid Only</option>
            </select>

            <select 
              value={settledFilter} 
              onChange={(e) => setSettledFilter(e.target.value)}
              className="px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 font-medium text-slate-700 shadow-sm w-full sm:w-auto"
            >
              <option value="">All Regions</option>
              <option value="true">Settled</option>
              <option value="false">Unsettled</option>
            </select>

            {/* Search */}
            <div className="relative w-full sm:w-auto">
              <div className="absolute top-1/2 -translate-y-1/2 left-3 pointer-events-none text-slate-400">
                <FiSearch />
              </div>
              <input 
                type="text" 
                placeholder="Search order or buyer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 shadow-sm font-medium text-slate-700"
              />
            </div>

            {/* Settle Action */}
            <button 
              disabled={selectedOrders.length === 0}
              onClick={() => navigate('/settle', { state: { selectedOrders } })}
              className={`py-3 px-6 rounded-2xl font-bold transition-all shadow-md flex items-center justify-center gap-2 whitespace-nowrap w-full sm:w-auto
                ${selectedOrders.length > 0 ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
            >
              <FiCheck size={20} />
              Settle ({selectedOrders.length})
            </button>
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="w-full h-[400px] flex flex-col items-center justify-center text-indigo-500">
              <FiLoader className="animate-spin mb-4" size={40} />
              <p className="font-medium text-slate-500">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="w-full h-[400px] flex flex-col items-center justify-center text-slate-400">
              <div className="bg-slate-50 p-6 rounded-full mb-4">
                <FiShoppingBag size={48} className="text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-600 mb-1">No orders found</h3>
              <p className="text-sm">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <>
            <div className="hidden lg:block overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-sm uppercase tracking-wider">
                    <th className="p-5 pl-6 rounded-tl-3xl w-10"></th>
                    <th className="p-5">Order ID / Date</th>
                    <th className="p-5">Buyer</th>
                    <th className="p-5">Total</th>
                    <th className="p-5">Payment</th>
                    <th className="p-5">Settlement</th>
                    <th className="p-5 pr-6 text-right rounded-tr-3xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm md:text-base">
                  {orders.map((order) => {
                    const isSelected = !!selectedOrders.find(o => o._id === order._id);
                    return (
                      <tr 
                        key={order._id} 
                        onClick={(e) => {
                          if (e.target.closest('input[type="checkbox"]') || e.target.closest('button') || e.target.closest('.options-dropdown-container')) return;
                          setDetailsOrder(order);
                        }}
                        className={`hover:bg-indigo-50/30 transition-colors group cursor-pointer ${isSelected ? 'bg-indigo-50' : ''}`}
                      >
                        <td className="p-5 pl-6">
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            disabled={order.settled}
                            onChange={() => toggleOrderSelection(order)}
                            className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer"
                          />
                        </td>
                        <td className="p-5">
                          <p className="font-mono text-sm text-slate-500 font-semibold">{order.orderId}</p>
                          <p className="text-xs text-slate-400 font-medium">{new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </td>
                        <td className="p-5">
                          <p className="font-bold text-slate-800">{order.buyer?.name || 'Unknown'}</p>
                          {order.buyer?.businessName && <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{order.buyer.businessName}</p>}
                        </td>
                        <td className="p-5 font-bold text-slate-800">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td className="p-5">
                          {order.paid ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                              Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                              Unpaid
                            </span>
                          )}
                        </td>
                        <td className="p-5">
                          {order.settled ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                              Settled
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="p-5 pr-6 text-right space-x-2 whitespace-nowrap relative options-dropdown-container">
                          {!order.paid && (
                            <button 
                              onClick={() => handleMarkPaid(order._id)}
                              className="px-3 py-1.5 text-emerald-600 font-bold hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200 text-xs shadow-sm"
                              title="Mark Paid"
                            >
                              $ Pay
                            </button>
                          )}
                          <button 
                            onClick={() => setOpenDropdown(openDropdown === order._id ? null : order._id)}
                            className="px-2 py-1.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 inline-flex items-center gap-1 text-xs shadow-sm"
                          >
                            Options <FiMoreVertical />
                          </button>
                          
                          {openDropdown === order._id && (
                            <div className="absolute right-6 top-10 mt-1 w-32 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-30 text-left">
                              <button 
                                onClick={() => { setOpenDropdown(null); navigate(`/edit-order/${order._id}`); }}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2 font-medium"
                              >
                                <FiEdit /> Edit
                              </button>
                              <button 
                                onClick={() => { setOpenDropdown(null); handleDelete(order._id); }}
                                className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                              >
                                <FiTrash2 /> Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden flex flex-col divide-y divide-slate-100">
              {orders.map((order) => {
                const isSelected = !!selectedOrders.find(o => o._id === order._id);
                return (
                  <div 
                    key={order._id} 
                    onClick={(e) => {
                      if (e.target.closest('input[type="checkbox"]') || e.target.closest('button') || e.target.closest('.options-dropdown-container')) return;
                      setDetailsOrder(order);
                    }}
                    className={`p-4 flex flex-col gap-3 transition-colors cursor-pointer ${isSelected ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'bg-white border-l-4 border-transparent'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <input 
                            type="checkbox" 
                            checked={isSelected}
                            disabled={order.settled}
                            onChange={() => toggleOrderSelection(order)}
                            className="w-5 h-5 mt-1 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer shrink-0 shadow-sm"
                        />
                        <div>
                            <p className="font-bold text-slate-800 text-base leading-tight mb-0.5">{order.buyer?.name || 'Unknown'}</p>
                            <p className="font-mono text-xs text-slate-500 font-semibold">{order.orderId}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-indigo-700 text-lg leading-tight mb-0.5">{formatCurrency(order.totalAmount)}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-2 pt-3 border-t border-slate-100/60">
                      <div className="flex flex-col sm:flex-row gap-1.5">
                        {order.paid ? <span className="px-2.5 py-1 rounded-md text-[10px] uppercase font-black tracking-wide bg-emerald-100 text-emerald-700 inline-flex items-center justify-center">Paid</span> : <span className="px-2.5 py-1 rounded-md text-[10px] uppercase font-black tracking-wide bg-rose-100 text-rose-700 inline-flex items-center justify-center">Unpaid</span>}
                        {order.settled ? <span className="px-2.5 py-1 rounded-md text-[10px] uppercase font-black tracking-wide bg-blue-100 text-blue-700 inline-flex items-center justify-center">Settled</span> : <span className="px-2.5 py-1 rounded-md text-[10px] uppercase font-black tracking-wide bg-amber-100 text-amber-700 inline-flex items-center justify-center">Pending</span>}
                      </div>
                      <div className="flex gap-2 isolate relative options-dropdown-container">
                        {!order.paid && (
                          <button onClick={() => handleMarkPaid(order._id)} className="px-4 py-2 text-emerald-600 font-bold bg-emerald-50 rounded-xl transition-colors border border-emerald-200 text-xs shadow-sm active:scale-95"> Pay</button>
                        )}
                        <button onClick={() => setOpenDropdown(openDropdown === order._id ? null : order._id)} className="px-3 py-2 text-slate-600 font-bold bg-slate-50 rounded-xl transition-colors border border-slate-200 flex items-center gap-1.5 text-xs shadow-sm active:scale-95"> Options <FiMoreVertical size={14} /></button>
                        
                        {openDropdown === order._id && (
                          <div className="absolute right-0 bottom-full mb-2 w-32 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-30 text-left">
                            <button 
                              onClick={() => { setOpenDropdown(null); navigate(`/edit-order/${order._id}`); }}
                              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2 font-medium"
                            >
                              <FiEdit /> Edit
                            </button>
                            <button 
                              onClick={() => { setOpenDropdown(null); handleDelete(order._id); }}
                              className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                            >
                              <FiTrash2 /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            </>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {detailsOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setDetailsOrder(null)}></div>
          <div className="relative flex flex-col w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden z-20 max-h-[90vh]">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <FiShoppingBag size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 leading-tight">Order Details</h2>
                  <p className="text-xs font-mono text-slate-500">{detailsOrder.orderId}</p>
                </div>
              </div>
              <button onClick={() => setDetailsOrder(null)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors">
                <FiX size={24} />
              </button>
            </div>
            
            <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Buyer Details</p>
                  <p className="font-semibold text-slate-800 text-base">{detailsOrder.buyer?.name || 'Unknown'}</p>
                  {detailsOrder.buyer?.businessName && <p className="text-xs font-medium text-slate-500">{detailsOrder.buyer.businessName}</p>}
                  <p className="text-sm mt-2 text-slate-600 flex items-center gap-2">{detailsOrder.buyer?.telephone || 'No Phone'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Order Summary</p>
                  <div className="flex justify-between mb-1"><span className="text-slate-500">Date</span><span className="font-medium text-slate-700">{new Date(detailsOrder.createdAt).toLocaleDateString()}</span></div>
                  <div className="flex justify-between mb-1"><span className="text-slate-500">Total</span><span className="font-bold text-indigo-600">{formatCurrency(detailsOrder.totalAmount)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Status</span><span>{detailsOrder.paid ? <span className="text-emerald-600 font-bold">Paid</span> : <span className="text-rose-600 font-bold">Unpaid</span>}</span></div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 pl-1 flex justify-between items-end">
                  <span>Order Items</span>
                  <span className="text-xs font-medium text-slate-500 lowercase bg-slate-100 px-2 py-0.5 rounded-md">{detailsOrder.items.length} items</span>
                </h3>
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm text-sm">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Item</th>
                        <th className="px-4 py-3 font-semibold text-right">Cost</th>
                        <th className="px-4 py-3 font-semibold text-right">Price</th>
                        <th className="px-4 py-3 font-semibold text-right">Qty</th>
                        <th className="px-4 py-3 font-semibold text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detailsOrder.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-medium text-slate-700">{item.customProduct || item.flower?.name || 'Item'}</td>
                          <td className="px-4 py-3 text-right text-slate-500">{formatCurrency(item.cost)}</td>
                          <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(item.price)}</td>
                          <td className="px-4 py-3 text-right font-medium text-slate-700">{item.qty}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-800">{formatCurrency(item.price * item.qty)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-indigo-900 flex items-center gap-2"><FiDollarSign /> Potential Profit</p>
                  <p className="text-xs text-indigo-600/70 mt-1">Calculated as (Selling Price - Cost) × Quantity</p>
                </div>
                <div className="text-2xl font-black text-emerald-600">
                  {formatCurrency(detailsOrder.items.reduce((sum, item) => sum + (((item.price || 0) - (item.cost || 0)) * item.qty), 0))}
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => { setReceiptOrder(detailsOrder); setDetailsOrder(null); }} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2">
                <FiPrinter size={18} /> View Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt View Modal */}
      {receiptOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setReceiptOrder(null)}></div>
          <div className="relative flex flex-col items-center w-full max-w-lg">
            <div className="w-full flex justify-between items-center mb-4 bg-white p-3 rounded-2xl shadow-lg border border-slate-200 relative z-10 box-border">
                <button onClick={handleDownloadBill} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 transition-colors">
                    <FiDownload size={16} /> Download
                </button>
                <button onClick={() => setReceiptOrder(null)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors">
                    <FiX size={24} />
                </button>
            </div>
            
            {/* The exactly matched Printable Bill Element */}
            <div className="w-full overflow-auto custom-scrollbar flex justify-center items-start bg-slate-100 p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-2xl relative z-10 max-h-[75vh]">
                <div ref={billRef} className="bg-white p-6 sm:p-8 border border-slate-200 shadow-md print-friendly relative shrink-0 h-max" style={{ width: '450px' }}>
                    <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>

                    <div className="text-center mb-6 pt-2">
                        <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-purple-600 rounded-lg shadow-sm flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
                            F
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Florista ERP</h1>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">Official Receipt</p>
                    </div>
                    
                    <div className="border-t border-b border-dashed border-slate-300 py-4 mb-5 text-sm text-slate-600 grid grid-cols-2 gap-y-2">
                        <div><span className="font-semibold block text-xs uppercase text-slate-400">Order ID</span> <span className="font-medium">{receiptOrder.orderId}</span></div>
                        <div className="text-right"><span className="font-semibold block text-xs uppercase text-slate-400">Date</span> <span className="font-medium">{new Date(receiptOrder.createdAt).toLocaleDateString()} {new Date(receiptOrder.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
                        <div className="col-span-2 mt-2"><span className="font-semibold block text-xs uppercase text-slate-400">Bill To</span> <span className="font-medium">{receiptOrder.buyer?.name || 'Unknown'} {receiptOrder.buyer?.businessName ? `(${receiptOrder.buyer.businessName})` : ''}</span></div>
                        <div className="col-span-2"><span className="font-medium">{receiptOrder.buyer?.telephone || 'N/A'}</span> <span className="text-slate-400 mx-1">•</span> <span>{receiptOrder.buyer?.location || 'N/A'}</span></div>
                    </div>

                    <div className="mb-6">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-left text-slate-800 text-xs uppercase tracking-wider bg-slate-50">
                                    <th className="py-2 px-2 font-semibold rounded-l-md">Item</th>
                                    <th className="py-2 px-2 font-semibold text-right">Qty</th>
                                    <th className="py-2 px-2 font-semibold text-right">Price</th>
                                    <th className="py-2 px-2 font-semibold text-right rounded-r-md">Total</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-700 font-medium">
                                {receiptOrder.items.map((item, idx) => (
                                    <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                        <td className="py-3 px-2">{item.customProduct || item.flower?.name || 'Item'}</td>
                                        <td className="py-3 px-2 text-right">{item.qty}</td>
                                        <td className="py-3 px-2 text-right">{formatCurrency(item.price)}</td>
                                        <td className="py-3 px-2 text-right font-bold text-slate-800">{formatCurrency(item.price * item.qty)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t border-slate-200 pt-4 space-y-2 text-sm ml-auto w-2/3">
                        {receiptOrder.discount > 0 ? (
                            <div className="flex justify-between text-slate-600 font-medium px-2">
                                <span>Subtotal</span>
                                <span>{formatCurrency(receiptOrder.totalAmount + receiptOrder.discount)}</span>
                            </div>
                        ) : null}
                        {receiptOrder.discount > 0 && (
                            <div className="flex justify-between text-emerald-600 font-medium px-2 bg-emerald-50 py-1 rounded">
                                <span>Discount</span>
                                <span>-{formatCurrency(receiptOrder.discount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-xl font-black text-slate-800 pt-3 border-t-2 border-slate-800 mt-2 px-2 pb-1 bg-slate-50 rounded-b-lg">
                            <span>Total</span>
                            <span>{formatCurrency(receiptOrder.totalAmount)}</span>
                        </div>
                    </div>
                    
                    <div className="text-center mt-10 pt-4 border-t border-dashed border-slate-300">
                        <p className="text-sm font-semibold text-slate-600">Thank you for your business!</p>
                        <p className="text-xs text-slate-400 mt-1">Visit us again or contact support for help.</p>
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
