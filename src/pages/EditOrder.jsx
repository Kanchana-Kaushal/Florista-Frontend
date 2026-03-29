import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FiArrowLeft, FiSave, FiSearch, FiPlus, FiTrash2, FiPlusCircle } from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function EditOrder() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    const [buyer, setBuyer] = useState(null);
    const [cart, setCart] = useState([]);
    const [discount, setDiscount] = useState(0);
    const [paid, setPaid] = useState(false);
    const [settled, setSettled] = useState(false);

    // Item Search State
    const [flowerSearch, setFlowerSearch] = useState('');
    const [flowers, setFlowers] = useState([]);
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [customItem, setCustomItem] = useState({ name: '', cost: '', price: '', qty: 1 });

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await axios.get(`${API_URL}/orders/${id}`);
                const data = res.data;
                setBuyer(data.buyer);
                setDiscount(data.discount || 0);
                setPaid(data.paid || false);
                setSettled(data.settled || false);
                setCart(data.items.map(item => ({
                    ...item,
                    flower: item.flower || null
                })));
            } catch (error) {
                console.error(error);
                toast.error("Failed to fetch order details");
                navigate('/orders');
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id, navigate]);

    // Search Flowers
    useEffect(() => {
        if (flowerSearch.length > 1 && !isCustomMode) {
            const fetchFl = async () => {
                try {
                    const res = await axios.get(`${API_URL}/flowers?search=${flowerSearch}`);
                    setFlowers(res.data.data);
                } catch (error) {}
            };
            const debounce = setTimeout(fetchFl, 300);
            return () => clearTimeout(debounce);
        } else {
            setFlowers([]);
        }
    }, [flowerSearch, isCustomMode]);

    const addFlowerToCart = (flower) => {
        const existing = cart.find(item => item.flower && (item.flower._id === flower._id));
        if (existing) {
            setCart(cart.map(item => item === existing ? { ...item, qty: item.qty + 1 } : item));
        } else {
            setCart([...cart, { flower, cost: flower.costPrice, price: flower.sellingPrice, qty: 1 }]);
        }
        setFlowerSearch('');
        setFlowers([]);
        toast.success(`Added ${flower.name}`);
    };

    const addCustomToCart = (e) => {
        e.preventDefault();
        if (!customItem.name || !customItem.price) return toast.error('Name & Price required');
        setCart([...cart, { 
            customProduct: customItem.name, 
            cost: Number(customItem.cost || 0), 
            price: Number(customItem.price), 
            qty: Number(customItem.qty || 1) 
        }]);
        setCustomItem({ name: '', cost: '', price: '', qty: 1 });
        setIsCustomMode(false);
    };

    const handleItemChange = (index, field, value) => {
        const newCart = [...cart];
        newCart[index][field] = Number(value);
        setCart(newCart);
    };

    const removeFromCart = (index) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
    };

    const subtotal = cart.reduce((sum, item) => sum + ((item.price || 0) * (item.qty || 1)), 0);
    const finalTotal = Math.max(0, subtotal - (discount || 0));

    const handleSaveChanges = async () => {
        if (cart.length === 0) return toast.error('Order must have at least one item');
        
        setSubmitting(true);
        try {
            const itemsPayload = cart.map(item => ({
                flower: item.flower ? item.flower._id : undefined,
                customProduct: item.customProduct,
                cost: item.cost,
                price: item.price,
                qty: item.qty
            }));

            const payload = {
                items: itemsPayload,
                discount: Number(discount),
                totalAmount: finalTotal,
                paid,
                settled
            };

            await axios.put(`${API_URL}/orders/${id}`, payload);
            toast.success('Order updated successfully!');
            navigate('/orders');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to update order');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-10 text-center"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div><p className="mt-4 text-slate-500 font-medium">Loading Editor...</p></div>;

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6 pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2.5 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 text-slate-600 transition-all hover:scale-105">
                        <FiArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">Edit Order</h1>
                        <p className="text-slate-500 font-medium mt-1">Modifying order for {buyer?.name}</p>
                    </div>
                </div>
                <button 
                    onClick={handleSaveChanges}
                    disabled={submitting}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                    <FiSave size={20} />
                    {submitting ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Col: Add Items & Cart */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Buyer summary (Read only) */}
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex justify-between items-center">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Buyer Locked</p>
                            <p className="font-bold text-slate-800 text-lg">{buyer?.name} {buyer?.businessName ? `(${buyer.businessName})` : ''}</p>
                            <p className="text-sm text-slate-500">{buyer?.telephone} • {buyer?.location}</p>
                        </div>
                    </div>

                    {/* Manage Items */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-slate-800">Order Items</h2>
                        </div>
                        
                        <div className="space-y-4 mb-6">
                            {cart.map((item, index) => (
                                <div key={index} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-sm relative">
                                    <button onClick={() => removeFromCart(index)} className="absolute -top-3 -right-3 bg-white w-8 h-8 rounded-full shadow-md text-rose-500 flex items-center justify-center border border-slate-100 hover:bg-rose-50 transition-colors">
                                        <FiTrash2 size={16} />
                                    </button>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-800 text-lg mb-1">{item.customProduct || item.flower?.name}</p>
                                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest bg-white inline-block px-2 py-0.5 rounded border border-slate-100">Cost: Rs. {item.cost || 0}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Price (Rs.)</label>
                                            <input type="number" min="0" className="w-24 p-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-800" value={item.price} onChange={(e) => handleItemChange(index, 'price', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Qty</label>
                                            <input type="number" min="1" className="w-16 p-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-800 text-center" value={item.qty} onChange={(e) => handleItemChange(index, 'qty', e.target.value)} />
                                        </div>
                                        <div className="pt-5 w-24 text-right font-black text-slate-800 text-lg pr-2">
                                            Rs. {(item.price || 0) * (item.qty || 1)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {cart.length === 0 && <p className="text-center text-slate-400 py-4 font-medium border-2 border-dashed border-slate-200 rounded-xl">No items in order</p>}
                        </div>

                        {/* Add New Item */}
                        <div className="border-t border-slate-100 pt-6">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-slate-700">Add Items</h3>
                                <button onClick={() => setIsCustomMode(!isCustomMode)} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors">
                                    {isCustomMode ? 'Search Inventory' : '+ Custom Item'}
                                </button>
                            </div>
                            
                            {isCustomMode ? (
                                <form onSubmit={addCustomToCart} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap gap-3 items-end">
                                    <div className="flex-1 min-w-[150px]"><label className="text-xs font-semibold text-slate-500 mb-1 block">Name</label><input required className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" value={customItem.name} onChange={e=>setCustomItem({...customItem, name: e.target.value})} /></div>
                                    <div className="w-24"><label className="text-xs font-semibold text-slate-500 mb-1 block">Cost</label><input type="number" className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" value={customItem.cost} onChange={e=>setCustomItem({...customItem, cost: e.target.value})} /></div>
                                    <div className="w-24"><label className="text-xs font-semibold text-slate-500 mb-1 block">Price</label><input type="number" required className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" value={customItem.price} onChange={e=>setCustomItem({...customItem, price: e.target.value})} /></div>
                                    <div className="w-20"><label className="text-xs font-semibold text-slate-500 mb-1 block">Qty</label><input type="number" required className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" value={customItem.qty} onChange={e=>setCustomItem({...customItem, qty: e.target.value})} /></div>
                                    <button type="submit" className="bg-slate-800 text-white p-2.5 rounded-lg hover:bg-slate-900 transition-colors shadow-sm whitespace-nowrap"><FiPlusCircle size={20}/></button>
                                </form>
                            ) : (
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <FiSearch />
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="Search inventory to add..." 
                                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 font-medium"
                                        value={flowerSearch}
                                        onChange={(e) => setFlowerSearch(e.target.value)}
                                    />
                                    {flowers.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto ring-1 ring-black ring-opacity-5">
                                            {flowers.map(f => (
                                                <div key={f._id} onClick={() => addFlowerToCart(f)} className="p-3 hover:bg-indigo-50 cursor-pointer flex justify-between items-center group border-b border-slate-100 last:border-0">
                                                    <div><p className="font-bold text-slate-800">{f.name}</p><p className="text-xs text-slate-500">Cost: Rs. {f.costPrice}</p></div>
                                                    <div className="font-bold text-indigo-600 bg-white px-3 py-1 rounded-full shadow-sm text-sm border border-indigo-100">+ Rs. {f.sellingPrice}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Col: Summary & Status */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-max sticky top-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">Order Configuration</h2>
                    
                    <div className="space-y-6">
                        {/* Status Toggles */}
                        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <label className="flex items-center justify-between cursor-pointer group">
                                <span className="font-bold text-slate-700 group-hover:text-slate-900">Payment Status</span>
                                <div className="relative inline-block w-12 h-6 rounded-full transition-colors duration-200 ease-in-out" style={{ backgroundColor: paid ? '#10b981' : '#e2e8f0' }}>
                                    <input type="checkbox" className="opacity-0 w-0 h-0" checked={paid} onChange={(e) => setPaid(e.target.checked)} />
                                    <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${paid ? 'transform translate-x-6' : ''}`}></span>
                                </div>
                            </label>
                            <label className="flex items-center justify-between cursor-pointer group pt-3 border-t border-slate-200">
                                <span className="font-bold text-slate-700 group-hover:text-slate-900">Settled Status</span>
                                <div className="relative inline-block w-12 h-6 rounded-full transition-colors duration-200 ease-in-out" style={{ backgroundColor: settled ? '#3b82f6' : '#e2e8f0' }}>
                                    <input type="checkbox" className="opacity-0 w-0 h-0" checked={settled} onChange={(e) => setSettled(e.target.checked)} />
                                    <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${settled ? 'transform translate-x-6' : ''}`}></span>
                                </div>
                            </label>
                        </div>

                        {/* Financials */}
                        <div className="pt-2">
                            <div className="flex justify-between items-center text-slate-600 mb-3 font-medium px-2">
                                <span>Subtotal</span>
                                <span>Rs. {subtotal}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-indigo-50 border border-indigo-100 mb-4 shadow-sm">
                                <span className="text-indigo-800 font-bold">Discount (Rs.)</span>
                                <input 
                                    type="number" 
                                    min="0" 
                                    className="w-24 p-2 bg-white border border-indigo-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-right font-black text-indigo-900 shadow-sm"
                                    value={discount === 0 ? '' : discount}
                                    placeholder="0"
                                    onChange={(e) => setDiscount(e.target.value === '' ? 0 : Number(e.target.value))}
                                />
                            </div>
                            <div className="flex justify-between items-center text-2xl font-black text-slate-800 pt-4 border-t-2 border-slate-800 px-2 pb-2 bg-slate-50 rounded-b-xl">
                                <span>Total</span>
                                <span className="text-emerald-600">Rs. {finalTotal}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
