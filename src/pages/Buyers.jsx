import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
    FiSearch,
    FiPlus,
    FiEdit2,
    FiTrash2,
    FiUsers,
    FiLoader,
    FiX,
    FiShoppingBag,
    FiDollarSign,
    FiClock,
    FiArrowRight,
    FiPhone,
    FiMapPin,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { ListSkeleton } from "../components/Skeletons.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Buyers() {
    const navigate = useNavigate();
    const [buyers, setBuyers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // CRUD Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBuyer, setEditingBuyer] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        telephone: "",
        location: "",
        businessName: "",
    });

    // Order history panel state (#8)
    const [historyBuyer, setHistoryBuyer] = useState(null);
    const [buyerOrders, setBuyerOrders] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const fetchBuyers = async (search = "") => {
        setLoading(true);
        try {
            const res = await axios.get(
                `${API_URL}/buyers?search=${search}&limit=100`,
            );
            setBuyers(res.data.data);
        } catch (error) {
            toast.error("Failed to load buyers directory.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => fetchBuyers(searchTerm), 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch all orders for a specific buyer (#8)
    const openOrderHistory = async (buyer) => {
        setHistoryBuyer(buyer);
        setHistoryLoading(true);
        setBuyerOrders([]);
        try {
            const res = await axios.get(
                `${API_URL}/orders?buyerObjectId=${buyer._id}&limit=100`,
            );
            setBuyerOrders(res.data.data);
        } catch {
            toast.error("Failed to load order history.");
        } finally {
            setHistoryLoading(false);
        }
    };

    const closeOrderHistory = () => {
        setHistoryBuyer(null);
        setBuyerOrders([]);
    };

    const handleOpenModal = (buyer = null) => {
        if (buyer) {
            setEditingBuyer(buyer);
            setFormData({
                name: buyer.name,
                telephone: buyer.telephone,
                location: buyer.location,
                businessName: buyer.businessName || "",
            });
        } else {
            setEditingBuyer(null);
            setFormData({
                name: "",
                telephone: "",
                location: "",
                businessName: "",
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingBuyer(null);
        setFormData({
            name: "",
            telephone: "",
            location: "",
            businessName: "",
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBuyer) {
                await axios.put(
                    `${API_URL}/buyers/${editingBuyer._id}`,
                    formData,
                );
                toast.success("Buyer updated successfully!");
            } else {
                await axios.post(`${API_URL}/buyers`, formData);
                toast.success("Buyer added successfully!");
            }
            handleCloseModal();
            fetchBuyers(searchTerm);
        } catch (error) {
            toast.error(
                error.response?.data?.error || "Failed to save buyer details.",
            );
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this buyer?")) {
            try {
                await axios.delete(`${API_URL}/buyers/${id}`);
                toast.success("Buyer deleted successfully.");
                fetchBuyers(searchTerm);
            } catch {
                toast.error("Failed to delete buyer.");
            }
        }
    };

    const formatCurrency = (amount) =>
        `Rs. ${Number(amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Derive stats for the history panel
    const historyStats = buyerOrders.reduce(
        (acc, o) => ({
            totalSpent: acc.totalSpent + (o.totalAmount || 0),
            paidCount: acc.paidCount + (o.paid ? 1 : 0),
            unpaidCount: acc.unpaidCount + (!o.paid ? 1 : 0),
        }),
        { totalSpent: 0, paidCount: 0, unpaidCount: 0 },
    );

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
                        <p className="text-slate-500 font-medium mt-2">
                            Manage your customers and their contact details.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
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
                        <button
                            onClick={() => handleOpenModal()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-2xl shadow-md hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2"
                        >
                            <FiPlus size={20} />
                            Add Buyer
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
                    {loading ? (
                        <ListSkeleton />
                    ) : buyers.length === 0 ? (
                        <div className="w-full h-[400px] flex flex-col items-center justify-center text-slate-400">
                            <div className="bg-slate-50 p-6 rounded-full mb-4">
                                <FiUsers size={48} className="text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-600 mb-1">
                                No buyers found
                            </h3>
                            <p className="text-sm">
                                Try adjusting your search or add a new buyer.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto w-full">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-sm uppercase tracking-wider">
                                            <th className="p-5 pl-6 rounded-tl-3xl">
                                                ID
                                            </th>
                                            <th className="p-5">
                                                Name / Business
                                            </th>
                                            <th className="p-5">Contact</th>
                                            <th className="p-5">Location</th>
                                            <th className="p-5 pr-6 text-right rounded-tr-3xl">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 text-sm md:text-base">
                                        {buyers.map((buyer) => (
                                            <tr
                                                key={buyer._id}
                                                onClick={() =>
                                                    openOrderHistory(buyer)
                                                }
                                                className="hover:bg-amber-50/40 transition-colors group cursor-pointer"
                                            >
                                                <td className="p-5 pl-6 font-mono text-sm text-slate-400 font-semibold">
                                                    {buyer.buyerId}
                                                </td>
                                                <td className="p-5">
                                                    <p className="font-bold text-slate-800 group-hover:text-amber-700 transition-colors">
                                                        {buyer.name}
                                                    </p>
                                                    {buyer.businessName && (
                                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                                                            {buyer.businessName}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="p-5 font-medium text-slate-600">
                                                    {buyer.telephone}
                                                </td>
                                                <td className="p-5 font-medium text-slate-600">
                                                    {buyer.location}
                                                </td>
                                                <td
                                                    className="p-5 pr-6 text-right space-x-1"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <button
                                                        onClick={() =>
                                                            openOrderHistory(
                                                                buyer,
                                                            )
                                                        }
                                                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors inline-block"
                                                        title="View Order History"
                                                    >
                                                        <FiShoppingBag
                                                            size={18}
                                                        />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleOpenModal(
                                                                buyer,
                                                            )
                                                        }
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors inline-block"
                                                        title="Edit"
                                                    >
                                                        <FiEdit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                buyer._id,
                                                            )
                                                        }
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

                            {/* Mobile Card View */}
                            <div className="md:hidden flex flex-col divide-y divide-slate-100">
                                {buyers.map((buyer) => (
                                    <div
                                        key={buyer._id}
                                        onClick={() => openOrderHistory(buyer)}
                                        className="p-4 flex flex-col gap-3 hover:bg-amber-50/30 cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-slate-800 text-base">
                                                    {buyer.name}
                                                </p>
                                                {buyer.businessName && (
                                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                        {buyer.businessName}
                                                    </p>
                                                )}
                                                <p className="text-xs font-mono text-slate-400 mt-0.5">
                                                    {buyer.buyerId}
                                                </p>
                                            </div>
                                            <div
                                                className="flex gap-1"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <button
                                                    onClick={() =>
                                                        handleOpenModal(buyer)
                                                    }
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                                                >
                                                    <FiEdit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDelete(buyer._id)
                                                    }
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                                >
                                                    <FiTrash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                                            <span className="flex items-center gap-1">
                                                <FiPhone size={12} />{" "}
                                                {buyer.telephone}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <FiMapPin size={12} />{" "}
                                                {buyer.location}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── Order History Slide-out Panel (#8) ──────────────────────────── */}
            {historyBuyer && (
                <div className="fixed inset-0 z-50 flex items-stretch justify-end">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                        onClick={closeOrderHistory}
                    />

                    {/* Panel */}
                    <div className="relative w-full max-w-md bg-white dark:bg-[#111827] shadow-2xl dark:shadow-[0_0_60px_rgba(0,0,0,0.6)] flex flex-col z-10 overflow-hidden">
                        {/* Panel Header */}
                        <div className="p-5 border-b border-slate-100 bg-slate-50 shrink-0">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">
                                        {historyBuyer.name}
                                    </h2>
                                    {historyBuyer.businessName && (
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                            {historyBuyer.businessName}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-3 mt-2 text-sm text-slate-500 font-medium">
                                        <span className="flex items-center gap-1">
                                            <FiPhone size={12} />{" "}
                                            {historyBuyer.telephone}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <FiMapPin size={12} />{" "}
                                            {historyBuyer.location}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={closeOrderHistory}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors shrink-0"
                                >
                                    <FiX size={22} />
                                </button>
                            </div>

                            {/* Quick Stats */}
                            {!historyLoading && buyerOrders.length > 0 && (
                                <div className="grid grid-cols-3 gap-2 mt-4">
                                    <div className="bg-white rounded-2xl p-3 border border-slate-200 text-center">
                                        <p className="text-2xl font-black text-indigo-600">
                                            {buyerOrders.length}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            Orders
                                        </p>
                                    </div>
                                    <div className="bg-white rounded-2xl p-3 border border-slate-200 text-center">
                                        <p className="text-lg font-black text-emerald-600 leading-tight">
                                            {formatCurrency(
                                                historyStats.totalSpent,
                                            )}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            Total Spent
                                        </p>
                                    </div>
                                    <div className="bg-white rounded-2xl p-3 border border-slate-200 text-center">
                                        <p className="text-2xl font-black text-rose-500">
                                            {historyStats.unpaidCount}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            Unpaid
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Panel Body — Order List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {historyLoading ? (
                                <div className="h-full flex flex-col items-center justify-center text-indigo-400 py-20">
                                    <FiLoader
                                        className="animate-spin mb-3"
                                        size={32}
                                    />
                                    <p className="text-slate-400 font-medium text-sm">
                                        Loading orders...
                                    </p>
                                </div>
                            ) : buyerOrders.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
                                    <div className="bg-slate-50 p-5 rounded-full mb-4">
                                        <FiShoppingBag
                                            size={36}
                                            className="text-slate-300"
                                        />
                                    </div>
                                    <p className="font-semibold text-slate-500">
                                        No orders yet
                                    </p>
                                    <button
                                        onClick={() => {
                                            closeOrderHistory();
                                            navigate("/new-order");
                                        }}
                                        className="mt-4 px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                    >
                                        <FiPlus size={14} /> Create First Order
                                    </button>
                                </div>
                            ) : (
                                buyerOrders.map((order) => (
                                    <div
                                        key={order._id}
                                        className="bg-white border border-slate-100 rounded-2xl p-4 hover:border-indigo-200 hover:shadow-md transition-all"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-mono text-xs text-slate-400 font-semibold">
                                                    {order.orderId}
                                                </p>
                                                <p className="font-black text-slate-800 text-lg leading-tight">
                                                    {formatCurrency(
                                                        order.totalAmount,
                                                    )}
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-1 items-end">
                                                <span
                                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${order.paid ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                                                >
                                                    {order.paid
                                                        ? "Paid"
                                                        : "Unpaid"}
                                                </span>
                                                <span
                                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${order.settled ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}
                                                >
                                                    {order.settled
                                                        ? "Settled"
                                                        : "Pending"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Items preview */}
                                        <div className="mt-2 space-y-1">
                                            {order.items
                                                .slice(0, 3)
                                                .map((item, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex justify-between text-xs text-slate-500 font-medium"
                                                    >
                                                        <span className="truncate">
                                                            {item.customProduct ||
                                                                item.flower
                                                                    ?.name ||
                                                                "Item"}
                                                        </span>
                                                        <span className="shrink-0 ml-2">
                                                            × {item.qty}
                                                        </span>
                                                    </div>
                                                ))}
                                            {order.items.length > 3 && (
                                                <p className="text-xs text-slate-400 font-medium">
                                                    +{order.items.length - 3}{" "}
                                                    more items
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
                                            <FiClock size={10} />
                                            {new Date(
                                                order.createdAt,
                                            ).toLocaleDateString(undefined, {
                                                weekday: "short",
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                            {order.paidDate && (
                                                <span className="ml-2 text-emerald-500">
                                                    • Paid{" "}
                                                    {new Date(
                                                        order.paidDate,
                                                    ).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Panel Footer — pb-24 on mobile to clear the fixed bottom nav bar */}
                        <div className="p-4 pb-24 sm:pb-4 border-t border-slate-100 bg-slate-50 shrink-0">
                            <button
                                onClick={() => {
                                    closeOrderHistory();
                                    navigate("/new-order");
                                }}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                            >
                                <FiPlus size={18} /> New Order for{" "}
                                {historyBuyer.name.split(" ")[0]}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── CRUD Modal ──────────────────────────────────────────────────── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
                        onClick={handleCloseModal}
                    />
                    <div className="bg-white dark:bg-[#111827] rounded-3xl shadow-2xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] w-full max-w-md overflow-hidden relative">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-xl font-bold text-slate-800">
                                {editingBuyer ? "Edit Buyer" : "Add New Buyer"}
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
                            >
                                <FiX size={20} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="px-6 py-6 space-y-5"
                        >
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Full Name
                                </label>
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
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Business Name (Optional)
                                </label>
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
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Telephone
                                    </label>
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
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Location
                                    </label>
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
                                    {editingBuyer
                                        ? "Save Changes"
                                        : "Create Buyer"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
