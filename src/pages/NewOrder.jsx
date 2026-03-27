import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FiSearch, FiPlus, FiTrash2, FiUserPlus, FiArrowRight } from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function NewOrder() {
    const navigate = useNavigate();

    // Buyer state
    const [buyerSearch, setBuyerSearch] = useState('');
    const [buyers, setBuyers] = useState([]);
    const [selectedBuyer, setSelectedBuyer] = useState(null);
    const [isCreatingBuyer, setIsCreatingBuyer] = useState(false);
    const [newBuyerData, setNewBuyerData] = useState({ name: '', telephone: '', location: '', businessName: '' });

    // Item state
    const [flowerSearch, setFlowerSearch] = useState('');
    const [flowers, setFlowers] = useState([]);
    const [cart, setCart] = useState([]);

    // Custom Item State
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [customItem, setCustomItem] = useState({ name: '', cost: '', price: '', qty: 1 });

    // Search Buyers
    useEffect(() => {
        if (buyerSearch.length > 1 && !selectedBuyer && !isCreatingBuyer) {
            const fetchBuyers = async () => {
                try {
                    const res = await axios.get(`${API_URL}/buyers?search=${buyerSearch}`);
                    setBuyers(res.data.data);
                } catch (error) {
                    console.error('Error fetching buyers:', error);
                }
            };
            const debounce = setTimeout(fetchBuyers, 300);
            return () => clearTimeout(debounce);
        } else {
            setBuyers([]);
        }
    }, [buyerSearch, selectedBuyer, isCreatingBuyer]);

    // Search Flowers
    useEffect(() => {
        if (flowerSearch.length > 1 && !isCustomMode) {
            const fetchFlowers = async () => {
                try {
                    const res = await axios.get(`${API_URL}/flowers?search=${flowerSearch}`);
                    setFlowers(res.data.data);
                } catch (error) {
                    console.error('Error fetching flowers:', error);
                }
            };
            const debounce = setTimeout(fetchFlowers, 300);
            return () => clearTimeout(debounce);
        } else {
            setFlowers([]);
        }
    }, [flowerSearch, isCustomMode]);

    const handleCreateBuyer = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_URL}/buyers`, newBuyerData);
            setSelectedBuyer(res.data);
            setIsCreatingBuyer(false);
            setBuyerSearch('');
            toast.success('Buyer created and selected');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to create buyer');
        }
    };

    const addFlowerToCart = (flower) => {
        const existing = cart.find((item) => item.flower && item.flower._id === flower._id);
        if (existing) {
            setCart(cart.map(item => item === existing ? { ...item, qty: item.qty + 1 } : item));
        } else {
            setCart([...cart, { flower, cost: flower.costPrice, price: flower.sellingPrice, qty: 1 }]);
        }
        setFlowerSearch('');
        setFlowers([]);
        toast.success(`Added ${flower.name} to cart`);
    };

    const addCustomToCart = (e) => {
        e.preventDefault();
        if (!customItem.name || !customItem.cost || !customItem.price) {
            toast.error('Fill required custom item fields');
            return;
        }
        setCart([...cart, { 
            customProduct: customItem.name, 
            cost: Number(customItem.cost), 
            price: Number(customItem.price), 
            qty: Number(customItem.qty) 
        }]);
        setCustomItem({ name: '', cost: '', price: '', qty: 1 });
        setIsCustomMode(false);
        toast.success(`Added ${customItem.name} to cart`);
    };

    const removeFromCart = (index) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
    };

    const proceedToConfirm = () => {
        if (!selectedBuyer) {
            toast.error('Please select or create a buyer');
            return;
        }
        if (cart.length === 0) {
            toast.error('Cart is empty');
            return;
        }
        navigate('/confirm-order', { state: { buyer: selectedBuyer, cart } });
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">New Order</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Column: Buyer & Items Selection */}
                <div className="space-y-6">
                    {/* Buyer Section */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-slate-800">1. Select Buyer</h2>
                            {selectedBuyer && (
                                <button onClick={() => setSelectedBuyer(null)} className="text-sm text-indigo-600 hover:underline">Change</button>
                            )}
                        </div>
                        
                        {selectedBuyer ? (
                            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                                <p className="font-semibold text-emerald-800">{selectedBuyer.name} {selectedBuyer.businessName ? `(${selectedBuyer.businessName})` : ''}</p>
                                <p className="text-sm text-emerald-600">{selectedBuyer.telephone} • {selectedBuyer.location}</p>
                            </div>
                        ) : isCreatingBuyer ? (
                            <form onSubmit={handleCreateBuyer} className="space-y-3">
                                <div><label className="text-sm font-medium text-slate-600">Name *</label><input required className="w-full p-3 text-base border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900" value={newBuyerData.name} onChange={e=>setNewBuyerData({...newBuyerData, name: e.target.value})} /></div>
                                <div><label className="text-sm font-medium text-slate-600">Telephone *</label><input required className="w-full p-3 text-base border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900" value={newBuyerData.telephone} onChange={e=>setNewBuyerData({...newBuyerData, telephone: e.target.value})} /></div>
                                <div><label className="text-sm font-medium text-slate-600">Location *</label><input required className="w-full p-3 text-base border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900" value={newBuyerData.location} onChange={e=>setNewBuyerData({...newBuyerData, location: e.target.value})} /></div>
                                <div><label className="text-sm font-medium text-slate-600">Business Name (Optional)</label><input className="w-full p-3 text-base border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900" value={newBuyerData.businessName} onChange={e=>setNewBuyerData({...newBuyerData, businessName: e.target.value})} /></div>
                                <div className="flex gap-2 pt-2">
                                    <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700">Save Buyer</button>
                                    <button type="button" onClick={() => setIsCreatingBuyer(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">Cancel</button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <FiSearch />
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="Search by name, phone, or location..." 
                                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white text-slate-900 shadow-sm"
                                        value={buyerSearch}
                                        onChange={(e) => setBuyerSearch(e.target.value)}
                                    />
                                    {buyers.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                            {buyers.map(b => (
                                                <div key={b._id} onClick={() => {setSelectedBuyer(b); setBuyerSearch(''); setBuyers([]);}} className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0">
                                                    <p className="font-medium text-slate-800">{b.name}</p>
                                                    <p className="text-xs text-slate-500">{b.telephone} • {b.location}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="text-center">
                                    <span className="text-slate-500 text-sm">or </span>
                                    <button onClick={() => setIsCreatingBuyer(true)} className="text-indigo-600 font-medium hover:underline inline-flex items-center gap-1">
                                        <FiUserPlus /> Add New Buyer
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Items Section */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-slate-800">2. Add Items</h2>
                            <button onClick={() => setIsCustomMode(!isCustomMode)} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-3 py-1 rounded-full">
                                {isCustomMode ? 'Search Inventory' : '+ Custom Item'}
                            </button>
                        </div>
                        
                        {isCustomMode ? (
                            <form onSubmit={addCustomToCart} className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Product Name</label><input required className="w-full p-3 text-base mt-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900" value={customItem.name} onChange={e=>setCustomItem({...customItem, name: e.target.value})} /></div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cost Price</label><input type="number" step="0.01" required className="w-full p-3 text-base mt-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900" value={customItem.cost} onChange={e=>setCustomItem({...customItem, cost: e.target.value})} /></div>
                                    <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Selling Price</label><input type="number" step="0.01" required className="w-full p-3 text-base mt-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900" value={customItem.price} onChange={e=>setCustomItem({...customItem, price: e.target.value})} /></div>
                                </div>
                                <div><label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quantity</label><input type="number" min="1" required className="w-full p-3 text-base mt-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900" value={customItem.qty} onChange={e=>setCustomItem({...customItem, qty: e.target.value})} /></div>
                                <button type="submit" className="w-full bg-slate-800 text-white py-2.5 rounded-lg font-medium hover:bg-slate-900 transition-colors shadow-sm">Add Custom Item</button>
                            </form>
                        ) : (
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <FiSearch />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Search flowers by name..." 
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm bg-white text-slate-900"
                                    value={flowerSearch}
                                    onChange={(e) => setFlowerSearch(e.target.value)}
                                />
                                {flowers.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto ring-1 ring-black ring-opacity-5">
                                        {flowers.map(f => (
                                            <div key={f._id} className="p-3 hover:bg-indigo-50 cursor-pointer flex justify-between items-center group transition-colors border-b border-slate-100 last:border-0" onClick={() => addFlowerToCart(f)}>
                                                <div>
                                                    <p className="font-medium text-slate-800 group-hover:text-indigo-700">{f.name}</p>
                                                    <p className="text-xs text-slate-500">Cost: Rs. {f.costPrice}</p>
                                                </div>
                                                <div className="font-semibold text-indigo-600 bg-white px-3 py-1 rounded-full shadow-sm text-sm border border-indigo-100">
                                                    Rs. {f.sellingPrice} <span className="text-slate-400 text-xs font-normal">/unit</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Cart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:h-[calc(100vh-12rem)] md:sticky md:top-6">
                    <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center justify-between">
                        <span>Current Bucket</span>
                        <span className="bg-indigo-100 text-indigo-700 py-1 px-3 rounded-full text-sm">{cart.length} items</span>
                    </h2>
                    
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200">
                                    <FiPlus size={24} className="text-slate-300" />
                                </div>
                                <p>No items added yet</p>
                            </div>
                        ) : (
                            cart.map((item, index) => (
                                <div key={index} className="flex justify-between items-center p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-100 transition-colors group">
                                    <div>
                                        <p className="font-medium text-slate-800">{item.customProduct || item.flower?.name}</p>
                                        <p className="text-sm text-slate-500">Rs. {item.price} x {item.qty} = <span className="font-medium text-slate-700">Rs. {item.price * item.qty}</span></p>
                                    </div>
                                    <button onClick={() => removeFromCart(index)} className="text-rose-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                                        <FiTrash2 />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="pt-4 mt-auto border-t border-slate-100 space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-slate-600 font-medium">Subtotal</span>
                            <span className="text-xl font-bold text-slate-800">Rs. {cart.reduce((sum, item) => sum + (item.price * item.qty), 0)}</span>
                        </div>
                        <button 
                            onClick={proceedToConfirm}
                            disabled={cart.length === 0 || !selectedBuyer}
                            className={`w-full py-3.5 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all shadow-sm ${cart.length > 0 && selectedBuyer ? 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-md hover:-translate-y-0.5' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                        >
                            Proceed to Confirmation <FiArrowRight />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
