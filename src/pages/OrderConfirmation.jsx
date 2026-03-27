import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FiArrowLeft, FiCheck, FiDownload, FiPrinter } from 'react-icons/fi';
import { toPng } from 'html-to-image';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function OrderConfirmation() {
    const location = useLocation();
    const navigate = useNavigate();
    const billRef = useRef(null);
    
    // State from previous page
    const [buyer, setBuyer] = useState(location.state?.buyer || null);
    const [cart, setCart] = useState(location.state?.cart || []);
    const [discount, setDiscount] = useState(0);
    
    // Status
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmedOrder, setConfirmedOrder] = useState(null);

    useEffect(() => {
        if (!buyer || cart.length === 0) {
            navigate('/new-order');
        }
    }, [buyer, cart, navigate]);

    useEffect(() => {
        if (confirmedOrder) {
            const timer = setTimeout(() => {
                handleDownloadBill();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [confirmedOrder]);

    const handleItemChange = (index, field, value) => {
        const newCart = [...cart];
        newCart[index][field] = Number(value);
        setCart(newCart);
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const finalTotal = Math.max(0, subtotal - discount);

    const handleConfirmOrder = async () => {
        setIsSubmitting(true);
        try {
            // Format for backend
            const itemsPayload = cart.map(item => ({
                flower: item.flower ? item.flower._id : undefined,
                customProduct: item.customProduct,
                cost: item.cost,
                price: item.price,
                qty: item.qty
            }));

            const payload = {
                buyer: buyer._id,
                items: itemsPayload,
                discount: Number(discount),
                totalAmount: finalTotal
            };

            const res = await axios.post(`${API_URL}/orders`, payload);
            setConfirmedOrder(res.data);
            toast.success('Order confirmed successfully!');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to confirm order');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDownloadBill = async () => {
        if (billRef.current === null) return;
        try {
            const dataUrl = await toPng(billRef.current, { cacheBust: true, backgroundColor: '#ffffff' });
            const link = document.createElement('a');
            link.download = `Bill_${confirmedOrder.orderId}.png`;
            link.href = dataUrl;
            link.click();
            toast.success('Bill downloaded');
        } catch (err) {
            console.error(err);
            toast.error('Failed to generate image');
        }
    };

    if (!buyer) return null;

    if (confirmedOrder) {
        return (
            <div className="w-full max-w-2xl mx-auto space-y-6 flex flex-col items-center">
                <div className="w-full bg-emerald-50 text-emerald-700 p-6 rounded-2xl flex flex-col items-center justify-center border border-emerald-100 shadow-sm text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600 shadow-sm">
                        <FiCheck size={32} />
                    </div>
                    <h2 className="text-2xl font-bold">Order Confirmed!</h2>
                    <p className="mt-2 opacity-90 font-medium">Order ID: {confirmedOrder.orderId}</p>
                </div>

                <div className="w-full flex gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-200 justify-center">
                    <button onClick={handleDownloadBill} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl border border-indigo-700 shadow-sm hover:bg-indigo-700 font-medium transition-all hover:-translate-y-0.5">
                        <FiDownload /> Download Bill Image
                    </button>
                    <button onClick={() => navigate('/new-order')} className="flex items-center gap-2 bg-white text-slate-700 px-6 py-2.5 rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 font-medium transition-all hover:-translate-y-0.5">
                        Create Another Order
                    </button>
                    <button onClick={() => navigate('/')} className="flex items-center gap-2 bg-slate-100 text-slate-600 px-6 py-2.5 rounded-xl border border-slate-200 shadow-sm hover:bg-slate-200 font-medium transition-all hover:-translate-y-0.5">
                        Home
                    </button>
                </div>

                {/* Printable/Downloadable Bill Node */}
                <div className="w-full bg-slate-50 flex flex-col items-center p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm overflow-auto max-h-[80vh]">
                    <p className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-2 shrink-0">
                        <FiPrinter /> Receipt Preview
                    </p>
                    <div ref={billRef} className="bg-white p-6 sm:p-8 border border-slate-200 shadow-md print-friendly relative shrink-0 h-max" style={{ width: '450px' }}>
                        {/* Decorative Top Border */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>

                        <div className="text-center mb-6 pt-2">
                            <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-purple-600 rounded-lg shadow-sm flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
                                F
                            </div>
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Florista ERP</h1>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">Official Receipt</p>
                        </div>
                        
                        <div className="border-t border-b border-dashed border-slate-300 py-4 mb-5 text-sm text-slate-600 grid grid-cols-2 gap-y-2">
                            <div><span className="font-semibold block text-xs uppercase text-slate-400">Order ID</span> <span className="font-medium">{confirmedOrder.orderId}</span></div>
                            <div className="text-right"><span className="font-semibold block text-xs uppercase text-slate-400">Date</span> <span className="font-medium">{new Date(confirmedOrder.createdAt).toLocaleDateString()} {new Date(confirmedOrder.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
                            <div className="col-span-2 mt-2"><span className="font-semibold block text-xs uppercase text-slate-400">Bill To</span> <span className="font-medium">{buyer.name} {buyer.businessName ? `(${buyer.businessName})` : ''}</span></div>
                            <div className="col-span-2"><span className="font-medium">{buyer.telephone}</span> <span className="text-slate-400 mx-1">•</span> <span>{buyer.location}</span></div>
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
                                    {cart.map((item, idx) => (
                                        <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                            <td className="py-3 px-2">{item.customProduct || item.flower?.name}</td>
                                            <td className="py-3 px-2 text-right">{item.qty}</td>
                                            <td className="py-3 px-2 text-right">Rs. {item.price}</td>
                                            <td className="py-3 px-2 text-right font-bold text-slate-800">Rs. {item.price * item.qty}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="border-t border-slate-200 pt-4 space-y-2 text-sm ml-auto w-2/3">
                            <div className="flex justify-between text-slate-600 font-medium px-2">
                                <span>Subtotal</span>
                                <span>Rs. {subtotal}</span>
                            </div>
                            {discount > 0 && (
                                <div className="flex justify-between text-emerald-600 font-medium px-2 bg-emerald-50 py-1 rounded">
                                    <span>Discount</span>
                                    <span>-Rs. {discount}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-xl font-black text-slate-800 pt-3 border-t-2 border-slate-800 mt-2 px-2 pb-1 bg-slate-50 rounded-b-lg">
                                <span>Total</span>
                                <span>Rs. {finalTotal}</span>
                            </div>
                        </div>
                        
                        <div className="text-center mt-10 pt-4 border-t border-dashed border-slate-300">
                            <p className="text-sm font-semibold text-slate-600">Thank you for your business!</p>
                            <p className="text-xs text-slate-400 mt-1">Visit us again or contact support for help.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2.5 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 text-slate-600 transition-all hover:scale-105">
                    <FiArrowLeft size={20} />
                </button>
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Confirm Order</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm">1</span> 
                            Buyer Details
                        </h2>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-inner">
                            <p className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                {buyer.name} 
                                {buyer.businessName && <span className="bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-full font-medium tracking-wide uppercase">{buyer.businessName}</span>}
                            </p>
                            <p className="text-slate-600 mt-1 font-medium bg-white inline-block px-3 py-1 rounded-md border border-slate-100 shadow-sm text-sm">{buyer.telephone} • {buyer.location}</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm">2</span> 
                            Order Items 
                            <span className="text-sm font-normal text-slate-400 ml-auto">(Edit Pricing & Qty)</span>
                        </h2>
                        <div className="space-y-4">
                            {cart.map((item, index) => (
                                <div key={index} className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-800 mb-1">{item.customProduct || item.flower?.name}</p>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest bg-white inline-block px-2 py-0.5 rounded border border-slate-100">Cost: Rs. {item.cost}</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Price (Rs. )</label>
                                            <input 
                                                type="number" 
                                                min="0"
                                                className="w-24 p-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-800"
                                                value={item.price}
                                                onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Qty</label>
                                            <input 
                                                type="number" 
                                                min="1"
                                                className="w-20 p-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-800 text-center"
                                                value={item.qty}
                                                onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                                            />
                                        </div>
                                        <div className="pt-5 w-24 text-right font-black text-slate-800 text-lg pr-2">
                                            Rs. {item.price * item.qty}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 self-start sticky top-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 bg-slate-50 p-2 rounded-lg text-center border border-slate-100">Order Summary</h2>
                    <div className="space-y-4 text-slate-600 mb-6 font-medium">
                        <div className="flex justify-between items-center p-2 rounded hover:bg-slate-50">
                            <span>Subtotal</span>
                            <span className="font-bold text-slate-800">Rs. {subtotal}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded bg-indigo-50 border border-indigo-100">
                            <span className="text-indigo-800 font-semibold">Discount (Rs. )</span>
                            <input 
                                type="number" 
                                min="0" 
                                className="w-28 p-2 bg-white border border-indigo-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-right font-bold text-indigo-900 shadow-sm"
                                value={discount}
                                onChange={(e) => setDiscount(Number(e.target.value))}
                            />
                        </div>
                        <div className="pt-4 flex justify-between items-center text-xl font-black text-slate-800 border-t-2 border-slate-800 mt-2 px-2 pb-1">
                            <span>Total</span>
                            <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-lg">Rs. {finalTotal}</span>
                        </div>
                    </div>
                    <button 
                        onClick={handleConfirmOrder}
                        disabled={isSubmitting}
                        className={`w-full py-4 flex items-center justify-center gap-2 rounded-xl font-bold text-lg transition-all shadow-md ${isSubmitting ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-1 hover:shadow-lg'} text-white uppercase tracking-wide`}
                    >
                        {isSubmitting ? 'Confirming...' : <><FiCheck size={24} /> Confirm Order</>}
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-4 font-medium">Please double check pricing before confirming.</p>
                </div>
            </div>
        </div>
    );
}
