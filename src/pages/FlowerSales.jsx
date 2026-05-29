import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
    FiArrowLeft,
    FiSearch,
    FiBarChart2,
    FiShoppingBag,
    FiTrendingUp,
    FiDollarSign,
    FiChevronUp,
    FiChevronDown,
    FiCalendar,
    FiX,
    FiTag,
    FiPercent,
} from "react-icons/fi";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function FlowerSales() {
    const { isDark } = useTheme();
    const navigate = useNavigate();

    // Data states
    const [months, setMonths] = useState([]);
    const [salesData, setSalesData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search and filters
    const [search, setSearch] = useState("");
    const [hideZeroSales, setHideZeroSales] = useState(false);

    // Selected Timeframe: "all-time" or a specific month key like "2026-5"
    const [selectedTimeframe, setSelectedTimeframe] = useState("all-time");

    // Table sorting
    const [sortBy, setSortBy] = useState("revenue"); // "qty" | "revenue" | "profit" | "margin"
    const [sortOrder, setSortOrder] = useState("desc"); // "desc" | "asc"

    // Selected flower for the pop-up modal
    const [selectedFlowerId, setSelectedFlowerId] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    // Modal chart metric toggle: "qty" | "revenue" | "profit"
    const [chartMetric, setChartMetric] = useState("revenue");

    // Fetch flower sales stats
    useEffect(() => {
        const fetchFlowerSales = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${API_URL}/stats/flower-sales`);
                setMonths(res.data.monthsList || []);
                setSalesData(res.data.flowerSales || []);
            } catch (error) {
                console.error("Failed to fetch flower sales analytics", error);
                toast.error("Failed to load flower sales analytics");
            } finally {
                setLoading(false);
            }
        };

        fetchFlowerSales();
    }, []);

    // Formatting helpers
    const formatCurrency = (val) =>
        `Rs. ${Number(val || 0).toLocaleString("en-US", {
            maximumFractionDigits: 0,
        })}`;

    // Get statistics based on the currently selected timeframe
    const getTimeframeStats = (flower, timeframeKey) => {
        if (timeframeKey === "all-time") {
            const qty = flower.allTime.qty || 0;
            const revenue = flower.allTime.revenue || 0;
            const profit = flower.allTime.profit || 0;
            const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
            return { qty, revenue, profit, margin };
        }

        const mData = flower.monthly[timeframeKey] || { qty: 0, revenue: 0, profit: 0 };
        const qty = mData.qty || 0;
        const revenue = mData.revenue || 0;
        const profit = mData.profit || 0;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
        return { qty, revenue, profit, margin };
    };

    // Sort column handler
    const handleSort = (columnKey) => {
        if (sortBy === columnKey) {
            setSortOrder(sortOrder === "desc" ? "asc" : "desc");
        } else {
            setSortBy(columnKey);
            setSortOrder("desc");
        }
    };

    // Filter and Sort flower list
    const filteredAndSortedFlowers = salesData
        .filter((flower) => {
            // Search filter
            const matchesSearch =
                flower.name.toLowerCase().includes(search.toLowerCase()) ||
                flower.flowerId.toLowerCase().includes(search.toLowerCase());

            // Zero sales filter
            const stats = getTimeframeStats(flower, selectedTimeframe);
            const matchesZeroSales = !hideZeroSales || stats.qty > 0;

            return matchesSearch && matchesZeroSales;
        })
        .sort((a, b) => {
            const statsA = getTimeframeStats(a, selectedTimeframe);
            const statsB = getTimeframeStats(b, selectedTimeframe);

            const valA = statsA[sortBy];
            const valB = statsB[sortBy];

            if (valA < valB) return sortOrder === "asc" ? -1 : 1;
            if (valA > valB) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });

    // Selected flower details for the modal
    const selectedFlower = salesData.find((f) => f._id === selectedFlowerId);
    const selectedFlowerTimeframeStats = selectedFlower
        ? getTimeframeStats(selectedFlower, selectedTimeframe)
        : { qty: 0, revenue: 0, profit: 0, margin: 0 };

    // Build Recharts data in chronological order (left-to-right) for the selected flower
    const chartData = selectedFlower && months.length > 0
        ? [...months].reverse().map((m) => {
              const mData = selectedFlower.monthly[m.key] || { qty: 0, revenue: 0, profit: 0 };
              const margin = mData.revenue > 0 ? ((mData.profit / mData.revenue) * 100) : 0;
              return {
                  name: m.label,
                  qty: mData.qty,
                  revenue: mData.revenue,
                  profit: mData.profit,
                  margin: Math.round(margin),
              };
          })
        : [];

    const handleRowClick = (flower) => {
        setSelectedFlowerId(flower._id);
        setModalOpen(true);
    };

    const getSelectedTimeframeLabel = () => {
        if (selectedTimeframe === "all-time") return "All Time (Lifetime)";
        const m = months.find((month) => month.key === selectedTimeframe);
        return m ? m.label : "";
    };

    // Render loading state
    if (loading) {
        return (
            <div className="w-full flex justify-center pb-20 sm:pb-12 bg-slate-50 min-h-[100vh] dark:bg-slate-950">
                <div className="w-full max-w-7xl mx-auto px-4 pt-8 animate-pulse">
                    <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-48 mb-6"></div>
                    <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-3xl w-full mb-8"></div>
                    <div className="h-[500px] bg-slate-200 dark:bg-slate-800 rounded-4xl w-full"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex justify-center pb-20 sm:pb-12 bg-slate-50 min-h-screen dark:bg-slate-950 transition-colors duration-300">
            <div className="w-full max-w-7xl px-4 pt-4 sm:pt-6">
                
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate("/")}
                            className="p-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-xs transition-all active:scale-95 cursor-pointer"
                            title="Back to Dashboard"
                        >
                            <FiArrowLeft size={18} />
                        </button>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                Flower Sales Analytics
                            </h1>
                            <p className="text-xs sm:text-sm font-semibold text-slate-400 mt-0.5">
                                Select a timeframe and see the sales performance details of your flowers. Click a row to see trend charts.
                            </p>
                        </div>
                    </div>

                    {/* Timeframe Selector Dropdown */}
                    <div className="relative shrink-0 flex items-center gap-2">
                        <span className="text-slate-400 dark:text-slate-500">
                            <FiCalendar size={18} />
                        </span>
                        <select
                            value={selectedTimeframe}
                            onChange={(e) => setSelectedTimeframe(e.target.value)}
                            className="min-w-[200px] px-4 py-2.5 appearance-none rounded-2xl font-bold text-slate-700 bg-white/80 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all pr-10 cursor-pointer"
                        >
                            <option value="all-time">All Time (Lifetime)</option>
                            {months.map((m, idx) => (
                                <option key={m.key} value={m.key}>
                                    {m.label} {idx === 0 ? "(This Month)" : idx === 1 ? "(Last Month)" : ""}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute right-4 text-slate-400">
                            <FiChevronDown size={16} />
                        </div>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm p-4 sm:p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                            <FiSearch size={18} />
                        </span>
                        <input
                            type="text"
                            placeholder="Search flower by name or code (e.g. F001)..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm font-semibold border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700 dark:text-slate-200 transition-all placeholder:text-slate-400"
                        />
                    </div>
                    
                    <label className="inline-flex items-center gap-3 cursor-pointer self-start md:self-auto select-none">
                        <input
                            type="checkbox"
                            checked={hideZeroSales}
                            onChange={(e) => setHideZeroSales(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="relative w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                            Hide flowers with 0 sales for {selectedTimeframe === "all-time" ? "Lifetime" : "this month"}
                        </span>
                    </label>
                </div>

                {/* Flower Grid Table Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-4xl p-6 transition-all flex flex-col min-h-[480px]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2.5">
                            <span className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                <FiBarChart2 size={16} />
                            </span>
                            Flower Sales - {getSelectedTimeframeLabel()}
                        </h2>
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-full text-xs font-bold text-slate-500">
                            {filteredAndSortedFlowers.length} of {salesData.length} active catalog items
                        </span>
                    </div>

                    {/* Interactive Data Table (Desktop only) */}
                    <div className="hidden sm:block flex-1 overflow-x-auto custom-scrollbar -mx-6 px-6">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800/80 pb-3">
                                    <th className="py-3 pr-4 font-black text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider min-w-[200px]">
                                        Flower
                                    </th>
                                    
                                    {/* Units Sold Column */}
                                    <th
                                        onClick={() => handleSort("qty")}
                                        className="py-3 px-4 font-black text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950 rounded-lg select-none min-w-[120px] text-right"
                                    >
                                        <div className="flex items-center justify-end gap-1.5">
                                            Units Sold
                                            {sortBy === "qty" && (
                                                sortOrder === "desc" ? <FiChevronDown size={14} className="text-indigo-500" /> : <FiChevronUp size={14} className="text-indigo-500" />
                                            )}
                                        </div>
                                    </th>

                                    {/* Revenue Column */}
                                    <th
                                        onClick={() => handleSort("revenue")}
                                        className="py-3 px-4 font-black text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950 rounded-lg select-none min-w-[150px] text-right"
                                    >
                                        <div className="flex items-center justify-end gap-1.5">
                                            Revenue
                                            {sortBy === "revenue" && (
                                                sortOrder === "desc" ? <FiChevronDown size={14} className="text-indigo-500" /> : <FiChevronUp size={14} className="text-indigo-500" />
                                            )}
                                        </div>
                                    </th>

                                    {/* Net Profit Column */}
                                    <th
                                        onClick={() => handleSort("profit")}
                                        className="py-3 px-4 font-black text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950 rounded-lg select-none min-w-[150px] text-right"
                                    >
                                        <div className="flex items-center justify-end gap-1.5">
                                            Net Profit
                                            {sortBy === "profit" && (
                                                sortOrder === "desc" ? <FiChevronDown size={14} className="text-indigo-500" /> : <FiChevronUp size={14} className="text-indigo-500" />
                                            )}
                                        </div>
                                    </th>

                                    {/* Margin Column */}
                                    <th
                                        onClick={() => handleSort("margin")}
                                        className="py-3 px-4 font-black text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950 rounded-lg select-none min-w-[130px] text-right"
                                    >
                                        <div className="flex items-center justify-end gap-1.5">
                                            Profit Margin
                                            {sortBy === "margin" && (
                                                sortOrder === "desc" ? <FiChevronDown size={14} className="text-indigo-500" /> : <FiChevronUp size={14} className="text-indigo-500" />
                                            )}
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAndSortedFlowers.length > 0 ? (
                                    filteredAndSortedFlowers.map((flower) => {
                                        const stats = getTimeframeStats(flower, selectedTimeframe);
                                        const isZero = stats.qty === 0;

                                        return (
                                            <tr
                                                key={flower._id}
                                                onClick={() => handleRowClick(flower)}
                                                className="border-b border-slate-50 dark:border-slate-800/40 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 cursor-pointer transition-all duration-150"
                                            >
                                                {/* Name / ID */}
                                                <td className="py-4 pr-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                                                            {flower.name}
                                                        </span>
                                                        <span className="text-[10px] font-black text-slate-400 mt-0.5 uppercase tracking-wider">
                                                            Code: {flower.flowerId}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Units Sold Cell */}
                                                <td className="py-4 px-4 text-right font-bold text-slate-700 dark:text-slate-300 text-sm">
                                                    {isZero ? "-" : stats.qty}
                                                </td>

                                                {/* Revenue Cell */}
                                                <td className="py-4 px-4 text-right font-black text-slate-900 dark:text-white text-sm">
                                                    {isZero ? "-" : formatCurrency(stats.revenue)}
                                                </td>

                                                {/* Profit Cell */}
                                                <td className={`py-4 px-4 text-right font-black text-sm ${
                                                    isZero ? "text-slate-400" : stats.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                                                }`}>
                                                    {isZero ? "-" : formatCurrency(stats.profit)}
                                                </td>

                                                {/* Profit Margin Cell */}
                                                <td className="py-4 px-4 text-right">
                                                    {isZero ? (
                                                        <span className="text-slate-400">-</span>
                                                    ) : (
                                                        <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                                                            stats.margin >= 30
                                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                                                                : stats.margin >= 15
                                                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                                                                    : "bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400"
                                                        }`}>
                                                            {stats.margin.toFixed(1)}%
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="text-center py-20 text-slate-400 dark:text-slate-500 font-bold">
                                            No flowers match your search filter for this timeframe.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Interactive Mobile List View (Mobile only) */}
                    <div className="block sm:hidden flex-1 space-y-4">
                        {filteredAndSortedFlowers.length > 0 ? (
                            filteredAndSortedFlowers.map((flower) => {
                                const stats = getTimeframeStats(flower, selectedTimeframe);
                                const isZero = stats.qty === 0;

                                return (
                                    <div
                                        key={flower._id}
                                        onClick={() => handleRowClick(flower)}
                                        className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl flex flex-col gap-3 active:bg-indigo-50/50 dark:active:bg-indigo-950/20 transition-all cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                                                    {flower.name}
                                                </span>
                                                <span className="text-[10px] font-black text-slate-400 mt-0.5 uppercase tracking-wider">
                                                    Code: {flower.flowerId}
                                                </span>
                                            </div>
                                            {!isZero && (
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                                    stats.margin >= 30
                                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                                                        : stats.margin >= 15
                                                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                                                            : "bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400"
                                                }`}>
                                                    {stats.margin.toFixed(1)}% margin
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 text-center bg-white dark:bg-slate-900/60 p-2.5 rounded-xl shadow-xs">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Units</span>
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                                                    {isZero ? "-" : stats.qty}
                                                </span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Revenue</span>
                                                <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5 truncate">
                                                    {isZero ? "-" : formatCurrency(stats.revenue)}
                                                </span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Net Profit</span>
                                                <span className={`text-xs font-black mt-0.5 truncate ${
                                                    isZero ? "text-slate-400" : stats.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                                                }`}>
                                                    {isZero ? "-" : formatCurrency(stats.profit)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-12 text-slate-400 dark:text-slate-500 font-bold bg-slate-50 dark:bg-slate-950 rounded-2xl">
                                No flowers match your search filter for this timeframe.
                            </div>
                        )}
                    </div>
                </div>

                {/* Pop-up Deep Dive Details Modal */}
                {modalOpen && selectedFlower && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl sm:rounded-4xl w-full max-w-2xl max-h-[92vh] overflow-y-auto custom-scrollbar p-5 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative animate-fade-in-up"
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setModalOpen(false)}
                                className="absolute top-5 right-5 p-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-all cursor-pointer"
                                title="Close Details"
                            >
                                <FiX size={18} />
                            </button>

                            {/* Header Info */}
                            <div className="mb-6 pr-8">
                                <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 border border-indigo-100/50 dark:border-indigo-900/50 rounded-lg text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                                    Flower Sales Analytics Detail
                                </span>
                                <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 leading-tight">
                                    {selectedFlower.name}
                                </h2>
                                <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider flex items-center gap-1.5">
                                    <FiTag size={12} /> Catalog Code: {selectedFlower.flowerId}
                                </p>
                            </div>

                            {/* Catalog Price Info */}
                            <div className="grid grid-cols-2 gap-3 mb-6 bg-slate-50/50 dark:bg-slate-950 p-3 sm:p-4 rounded-2xl">
                                <div>
                                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Catalog Cost Price</p>
                                    <p className="text-sm sm:text-base font-extrabold text-slate-700 dark:text-slate-300 mt-0.5">{formatCurrency(selectedFlower.costPrice)}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Catalog Selling Price</p>
                                    <p className="text-sm sm:text-base font-extrabold text-slate-700 dark:text-slate-300 mt-0.5">{formatCurrency(selectedFlower.sellingPrice)}</p>
                                </div>
                            </div>

                            <hr className="border-slate-100 dark:border-slate-800/80 my-4" />

                            {/* Timeframe specific statistics */}
                            <div className="space-y-4 my-4">
                                <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                    Summary Statistics ({getSelectedTimeframeLabel()})
                                </h3>
                                
                                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                    <div className="bg-slate-50/50 dark:bg-slate-950 p-2.5 sm:p-3 rounded-2xl flex flex-col justify-between">
                                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500">Units Sold</span>
                                        <span className="text-sm sm:text-lg font-black text-slate-900 dark:text-white mt-1">{selectedFlowerTimeframeStats.qty}</span>
                                    </div>
                                    <div className="bg-slate-50/50 dark:bg-slate-950 p-2.5 sm:p-3 rounded-2xl flex flex-col justify-between">
                                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500">Gross Sales</span>
                                        <span className="text-sm sm:text-lg font-black text-slate-900 dark:text-white mt-1 truncate" title={formatCurrency(selectedFlowerTimeframeStats.revenue)}>
                                            Rs. {selectedFlowerTimeframeStats.revenue >= 1000 ? `${(selectedFlowerTimeframeStats.revenue / 1000).toFixed(1)}k` : selectedFlowerTimeframeStats.revenue}
                                        </span>
                                    </div>
                                    <div className="bg-slate-50/50 dark:bg-slate-950 p-2.5 sm:p-3 rounded-2xl flex flex-col justify-between">
                                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500">Net Profit</span>
                                        <span className={`text-sm sm:text-lg font-black mt-1 truncate ${
                                            selectedFlowerTimeframeStats.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                                        }`} title={formatCurrency(selectedFlowerTimeframeStats.profit)}>
                                            Rs. {selectedFlowerTimeframeStats.profit >= 1000 ? `${(selectedFlowerTimeframeStats.profit / 1000).toFixed(1)}k` : selectedFlowerTimeframeStats.profit}
                                        </span>
                                    </div>
                                </div>
                                
                                {selectedFlowerTimeframeStats.revenue > 0 && (
                                    <div className="flex justify-between items-center bg-emerald-50/40 dark:bg-emerald-950/10 px-4 py-2.5 rounded-xl border border-emerald-100/50 dark:border-emerald-950/20 text-xs">
                                        <span className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1"><FiPercent /> Profit Margin for timeframe</span>
                                        <span className="font-black text-emerald-600 dark:text-emerald-400">
                                            {selectedFlowerTimeframeStats.margin.toFixed(1)}% margin
                                        </span>
                                    </div>
                                )}
                            </div>

                            <hr className="border-slate-100 dark:border-slate-800/80 my-4" />

                            {/* 12-Month Chronological Trend Chart inside Modal */}
                            <div className="mt-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                    <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                        12-Month Chronological Performance Trend
                                    </h3>
                                    
                                    {/* Chart metric selector inside Modal */}
                                    <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl self-start sm:self-auto shrink-0 border border-slate-200/50 dark:border-slate-800/50">
                                        <button
                                            onClick={() => setChartMetric("qty")}
                                            className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${
                                                chartMetric === "qty"
                                                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                                                    : "text-slate-500 dark:text-slate-400"
                                            }`}
                                        >
                                            Units
                                        </button>
                                        <button
                                            onClick={() => setChartMetric("revenue")}
                                            className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${
                                                chartMetric === "revenue"
                                                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                                                    : "text-slate-500 dark:text-slate-400"
                                            }`}
                                        >
                                            Revenue
                                        </button>
                                        <button
                                            onClick={() => setChartMetric("profit")}
                                            className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${
                                                chartMetric === "profit"
                                                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                                                    : "text-slate-500 dark:text-slate-400"
                                            }`}
                                        >
                                            Profit
                                        </button>
                                    </div>
                                </div>
                                
                                {chartData.length > 0 ? (
                                    <div className="w-full h-56 mt-2 relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorModalFlowerMetric" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                                                <XAxis
                                                    dataKey="name"
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tick={{ fill: isDark ? "#475569" : "#94a3b8", fontSize: 10, fontWeight: 700 }}
                                                />
                                                <YAxis
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tick={{ fill: isDark ? "#475569" : "#94a3b8", fontSize: 10, fontWeight: 700 }}
                                                />
                                                <Tooltip
                                                    cursor={{ stroke: "#6366f1", strokeWidth: 1, strokeDasharray: "4 4" }}
                                                    contentStyle={{
                                                        borderRadius: "16px",
                                                        border: "none",
                                                        boxShadow: isDark ? "0 10px 30px -5px rgba(0,0,0,0.5)" : "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                                                        padding: "12px",
                                                        backgroundColor: isDark ? "#1e293b" : "#fff",
                                                        color: isDark ? "#e2e8f0" : "#1e293b",
                                                    }}
                                                    formatter={(val) => [chartMetric === "qty" ? `${val} units` : formatCurrency(val), chartMetric.toUpperCase()]}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey={chartMetric}
                                                    stroke="#6366f1"
                                                    strokeWidth={2.5}
                                                    fillOpacity={1}
                                                    fill="url(#colorModalFlowerMetric)"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="w-full h-56 flex items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-2xl">
                                        No monthly sales data history available.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
