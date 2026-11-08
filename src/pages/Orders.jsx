import { useState, useEffect, useRef } from "react";
import { useTheme } from '../context/ThemeContext.jsx';
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import {
    FiSearch,
    FiPrinter,
    FiCheck,
    FiDownload,
    FiX,
    FiLoader,
    FiShoppingBag,
    FiMoreVertical,
    FiEdit,
    FiTrash2,
    FiEye,
    FiDollarSign,
    FiZap,
    FiChevronDown,
    FiCheckSquare,
    FiBox,
    FiPieChart,
    FiArrowRight,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { toPng } from "html-to-image";
import { ListSkeleton } from "../components/Skeletons.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Orders() {
    const navigate = useNavigate();
    const location = useLocation();
    const { showKeyboardHints } = useTheme();
  const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState("");
    const [paidFilter, setPaidFilter] = useState(""); // '' = all, 'true' = paid, 'false' = unpaid
    const [settledFilter, setSettledFilter] = useState(""); // '' = all, 'true' = settled, 'false' = unsettled
    const [selectedOrders, setSelectedOrders] = useState([]);

    // Modal & Menus
    const [receiptOrder, setReceiptOrder] = useState(null);
    const [detailsOrder, setDetailsOrder] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [openDropdown, setOpenDropdown] = useState(null);
    const billRef = useRef(null);

    // Selection dropdown & ref
    const [isHeaderSelectOpen, setIsHeaderSelectOpen] = useState(false);
    const [isToolbarSelectOpen, setIsToolbarSelectOpen] = useState(false);
    const headerCheckboxRef = useRef(null);

    // Quick Settle state
    const [isQuickSettleOpen, setIsQuickSettleOpen] = useState(false);
    const [quickSettleLoading, setQuickSettleLoading] = useState(false);
    const [quickSettleOrders, setQuickSettleOrders] = useState([]);
    const [aggregatedFlowers, setAggregatedFlowers] = useState([]);
    const [selectedFlowerKeys, setSelectedFlowerKeys] = useState(new Set());
    const [quickSettleSearch, setQuickSettleSearch] = useState("");
    const [quickSettleFilter, setQuickSettleFilter] = useState("all");

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest(".options-dropdown-container")) {
                setOpenDropdown(null);
            }
            if (!e.target.closest(".header-select-container")) {
                setIsHeaderSelectOpen(false);
            }
            if (!e.target.closest(".toolbar-select-container")) {
                setIsToolbarSelectOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchOrders = async (
        searchTerm = search,
        paid = paidFilter,
        settled = settledFilter,
    ) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: 100 });
            if (searchTerm) params.append("search", searchTerm);
            if (paid !== "") params.append("paid", paid);
            if (settled !== "") params.append("settled", settled);

            const res = await axios.get(
                `${API_URL}/orders?${params.toString()}`,
            );
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

    // Handle auto-opening order details from Timeline redirect
    useEffect(() => {
        if (location.state?.openOrderId && orders.length > 0) {
            const targetOrder = orders.find(
                (o) => o.orderId === location.state.openOrderId,
            );
            if (targetOrder && !detailsOrder) {
                setDetailsOrder(targetOrder);
                // Clear the state so it doesn't repeatedly open if closed
                navigate(location.pathname, { replace: true });
            }
        }
    }, [
        orders,
        location.state?.openOrderId,
        navigate,
        location.pathname,
        detailsOrder,
    ]);

    const toggleOrderSelection = (order) => {
        if (selectedOrders.find((o) => o._id === order._id)) {
            setSelectedOrders(
                selectedOrders.filter((o) => o._id !== order._id),
            );
        } else {
            setSelectedOrders([...selectedOrders, order]);
        }
    };

    const unsettledOrders = orders.filter((o) => !o.settled);
    const paidUnsettledOrders = orders.filter((o) => !o.settled && o.paid);

    const isAllUnsettledSelected =
        unsettledOrders.length > 0 &&
        unsettledOrders.every((o) =>
            selectedOrders.some((s) => s._id === o._id),
        );

    const isSomeUnsettledSelected =
        selectedOrders.length > 0 && !isAllUnsettledSelected;

    useEffect(() => {
        if (headerCheckboxRef.current) {
            headerCheckboxRef.current.indeterminate = isSomeUnsettledSelected;
        }
    }, [isSomeUnsettledSelected]);

    const handleToggleSelectAll = () => {
        if (isAllUnsettledSelected) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders([...unsettledOrders]);
        }
    };

    const handleSelectAllUnsettled = () => {
        setSelectedOrders([...unsettledOrders]);
    };

    const handleSelectPaidUnsettled = () => {
        setSelectedOrders([...paidUnsettledOrders]);
    };

    const handleDeselectAll = () => {
        setSelectedOrders([]);
    };

    // Quick Settle Aggregation & Data Fetching
    const fetchQuickSettleData = async () => {
        setQuickSettleLoading(true);
        try {
            const [ordersRes, flowersRes] = await Promise.all([
                axios.get(`${API_URL}/orders?settled=false&limit=1000`),
                axios.get(`${API_URL}/flowers?limit=200`),
            ]);

            const rawOrders = ordersRes.data.data || [];
            const rawFlowers = flowersRes.data.data || [];

            setQuickSettleOrders(rawOrders);

            const map = new Map();

            // 1. Initialize from flower catalog
            rawFlowers.forEach((f) => {
                map.set(String(f._id), {
                    id: String(f._id),
                    name: f.name,
                    flowerId: f.flowerId,
                    costPrice: f.costPrice || 0,
                    sellingPrice: f.sellingPrice || 0,
                    unsettledQty: 0,
                    unsettledCost: 0,
                    unsettledRevenue: 0,
                    orderIds: new Set(),
                });
            });

            // 2. Aggregate from unsettled orders
            rawOrders.forEach((o) => {
                o.items?.forEach((item) => {
                    const flowerId = item.flower?._id || item.flower;
                    const key = flowerId ? String(flowerId) : (item.customProduct ? `custom_${item.customProduct}` : null);
                    if (!key) return;

                    let entry = map.get(key);
                    if (!entry) {
                        entry = {
                            id: key,
                            name: item.customProduct || item.flower?.name || "Custom Item",
                            flowerId: item.flower?.flowerId || "CUSTOM",
                            costPrice: item.cost || item.flower?.costPrice || 0,
                            sellingPrice: item.price || item.flower?.sellingPrice || 0,
                            unsettledQty: 0,
                            unsettledCost: 0,
                            unsettledRevenue: 0,
                            orderIds: new Set(),
                        };
                        map.set(key, entry);
                    }

                    const qty = Number(item.qty) || 0;
                    const unitCost = Number(item.cost !== undefined ? item.cost : entry.costPrice) || 0;
                    const unitPrice = Number(item.price !== undefined ? item.price : entry.sellingPrice) || 0;

                    entry.unsettledQty += qty;
                    entry.unsettledCost += qty * unitCost;
                    entry.unsettledRevenue += qty * unitPrice;
                    entry.orderIds.add(o._id);
                });
            });

            const list = Array.from(map.values()).map(item => ({
                ...item,
                orderCount: item.orderIds.size,
            }));

            // Sort: pending flowers first (descending by unsettledCost), then alphabetically
            list.sort((a, b) => {
                if (a.unsettledQty > 0 && b.unsettledQty === 0) return -1;
                if (a.unsettledQty === 0 && b.unsettledQty > 0) return 1;
                if (a.unsettledQty > 0 && b.unsettledQty > 0) {
                    return b.unsettledCost - a.unsettledCost;
                }
                return a.name.localeCompare(b.name);
            });

            setAggregatedFlowers(list);

            // Pre-select all pending flowers by default
            const initialSelected = new Set(
                list.filter((f) => f.unsettledQty > 0).map((f) => f.id)
            );
            setSelectedFlowerKeys(initialSelected);
        } catch (error) {
            console.error("Failed to load quick settle data", error);
            toast.error("Failed to load flower settlement data");
        } finally {
            setQuickSettleLoading(false);
        }
    };

    const toggleFlowerSelection = (id) => {
        setSelectedFlowerKeys((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleSelectAllPendingFlowers = () => {
        const pendingIds = aggregatedFlowers
            .filter((f) => f.unsettledQty > 0)
            .map((f) => f.id);
        setSelectedFlowerKeys(new Set(pendingIds));
    };

    const handleDeselectAllFlowers = () => {
        setSelectedFlowerKeys(new Set());
    };

    // Quick settle stats
    const selectedFlowersList = aggregatedFlowers.filter((f) =>
        selectedFlowerKeys.has(f.id)
    );

    const qsTotalCost = selectedFlowersList.reduce(
        (sum, f) => sum + f.unsettledCost,
        0
    );
    const qsTotalQty = selectedFlowersList.reduce(
        (sum, f) => sum + f.unsettledQty,
        0
    );
    const qsTotalRevenue = selectedFlowersList.reduce(
        (sum, f) => sum + f.unsettledRevenue,
        0
    );

    const qsAffectedOrderIds = new Set();
    selectedFlowersList.forEach((f) => {
        f.orderIds.forEach((id) => qsAffectedOrderIds.add(id));
    });
    const qsAffectedOrdersCount = qsAffectedOrderIds.size;

    const qsProfit = qsTotalRevenue - qsTotalCost;
    const qsMarginPercent =
        qsTotalRevenue > 0
            ? ((qsProfit / qsTotalRevenue) * 100).toFixed(1)
            : 0;

    const filteredQuickSettleFlowers = aggregatedFlowers.filter((flower) => {
        if (quickSettleSearch.trim()) {
            const term = quickSettleSearch.toLowerCase();
            const matchesName = flower.name.toLowerCase().includes(term);
            const matchesId = flower.flowerId?.toLowerCase() || "";
            if (!matchesName && !matchesId.includes(term)) return false;
        }

        if (quickSettleFilter === "pending") {
            return flower.unsettledQty > 0;
        }
        if (quickSettleFilter === "selected") {
            return selectedFlowerKeys.has(flower.id);
        }
        return true;
    });

    const handleProceedQuickSettle = () => {
        if (selectedFlowerKeys.size === 0) {
            toast.error("Please select at least one flower to settle.");
            return;
        }

        const relevantOrders = quickSettleOrders.filter((order) =>
            order.items?.some((item) => {
                const flowerId = item.flower?._id || item.flower;
                const key = flowerId ? String(flowerId) : (item.customProduct ? `custom_${item.customProduct}` : null);
                return selectedFlowerKeys.has(key);
            })
        );

        if (relevantOrders.length === 0) {
            toast.error("No unsettled orders found for the selected flowers.");
            return;
        }

        const preparedOrders = relevantOrders.map((order) => ({
            ...order,
            items: order.items.map((item) => {
                const flowerId = item.flower?._id || item.flower;
                const key = flowerId ? String(flowerId) : (item.customProduct ? `custom_${item.customProduct}` : null);
                const isSelected = selectedFlowerKeys.has(key);
                return {
                    ...item,
                    billQty: item.qty,
                    removedFromBill: !isSelected,
                };
            }),
        }));

        setIsQuickSettleOpen(false);

        navigate("/settle", {
            state: {
                selectedOrders: preparedOrders,
                isQuickSettle: true,
                selectedFlowerNames: selectedFlowersList.map((f) => f.name),
            },
        });
    };

    const handleDelete = async (orderId) => {
        if (
            !window.confirm(
                "Are you sure you want to delete this order? This action cannot be undone.",
            )
        )
            return;
        try {
            await axios.delete(`${API_URL}/orders/${orderId}`);
            toast.success("Order deleted successfully");
            fetchOrders();
        } catch (error) {
            toast.error("Failed to delete order");
        }
    };

    
    // Keep selection in bounds
    useEffect(() => {
        if (orders.length > 0 && selectedIndex >= orders.length) {
            setSelectedIndex(orders.length - 1);
        }
    }, [orders]);

    // Auto-scroll selected row into view
    useEffect(() => {
        if (selectedIndex >= 0) {
            document.getElementById('order-row-' + selectedIndex)?.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    // Desktop Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isQuickSettleOpen) {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    setIsQuickSettleOpen(false);
                }
                return;
            }

            if (e.altKey && (e.key === 'q' || e.key === 'Q')) {
                e.preventDefault();
                setIsQuickSettleOpen(true);
                fetchQuickSettleData();
                return;
            }

            if (receiptOrder) {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    setReceiptOrder(null);
                } else if (e.key === 'Enter' || e.key === 'd' || e.key === 'D') {
                    e.preventDefault();
                    handleDownloadBill();
                }
                return;
            }

            if (detailsOrder) {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    setDetailsOrder(null);
                } else if (e.key === 'r' || e.key === 'R' || e.key === 'p' || e.key === 'P') {
                    e.preventDefault();
                    setReceiptOrder(detailsOrder);
                    setDetailsOrder(null);
                }
                return;
            }

            const activeTag = document.activeElement ? document.activeElement.tagName : '';
            const isInput = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT';
            const isSearch = document.activeElement && document.activeElement.getAttribute('placeholder')?.includes('Search');

            if (e.key === 'ArrowDown') {
                if (orders.length > 0) {
                    e.preventDefault();
                    setSelectedIndex((prev) => (prev + 1 >= orders.length ? 0 : prev + 1));
                }
            } else if (e.key === 'ArrowUp') {
                if (orders.length > 0) {
                    e.preventDefault();
                    setSelectedIndex((prev) => (prev <= 0 ? orders.length - 1 : prev - 1));
                }
            } else if (e.key === 'Enter' && (!isInput || !isSearch)) {
                if (selectedIndex >= 0 && orders[selectedIndex]) {
                    e.preventDefault();
                    setDetailsOrder(orders[selectedIndex]);
                }
            } else if (e.key === ' ' && !isInput) {
                if (selectedIndex >= 0 && orders[selectedIndex] && !orders[selectedIndex].settled) {
                    e.preventDefault();
                    toggleOrderSelection(orders[selectedIndex]);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [receiptOrder, detailsOrder, isQuickSettleOpen, selectedIndex, orders, selectedOrders]);

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
            const dataUrl = await toPng(billRef.current, {
                cacheBust: true,
                backgroundColor: "#ffffff",
                width: billRef.current.scrollWidth,
                height: billRef.current.scrollHeight,
                pixelRatio: 2,
            });
            const link = document.createElement("a");
            const sanitize = (str) =>
                String(str || "")
                    .trim()
                    .replace(/[\\/:*?"<>|]/g, "")
                    .replace(/\s+/g, " ");

            const orderId = sanitize(receiptOrder?.orderId) || "Order";
            const buyerName = sanitize(receiptOrder?.buyer?.name) || "Unknown";
            const locationName = sanitize(receiptOrder?.buyer?.location) || "Unknown";

            link.download = `${orderId}-${buyerName}-${locationName}.png`;
            link.href = dataUrl;
            link.click();
            toast.success("Receipt downloaded");
        } catch (err) {
            console.error(err);
            toast.error("Failed to generate image");
        }
    };

    // Helper formats
    const formatCurrency = (amount) =>
        `Rs. ${Number(amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
                        <p className="text-slate-500 font-medium mt-2">
                            Manage all customer orders and settlements.
                        </p>
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

                        {/* Batch Select Dropdown */}
                        <div className="relative toolbar-select-container w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={() => setIsToolbarSelectOpen(!isToolbarSelectOpen)}
                                className="py-3 px-4 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 hover:bg-slate-50 shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto transition-all"
                            >
                                <FiCheckSquare size={17} className="text-indigo-600" />
                                <span>
                                    {selectedOrders.length > 0
                                        ? `Selected (${selectedOrders.length})`
                                        : "Select Orders"}
                                </span>
                                <FiChevronDown size={14} className="text-slate-400" />
                            </button>

                            {isToolbarSelectOpen && (
                                <div className="absolute left-0 sm:right-0 sm:left-auto top-14 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-30 text-left">
                                    <div className="px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        Batch Select Orders
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleSelectAllUnsettled();
                                            setIsToolbarSelectOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-between"
                                    >
                                        <span>All Unsettled</span>
                                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono">
                                            {unsettledOrders.length}
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleSelectPaidUnsettled();
                                            setIsToolbarSelectOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center justify-between"
                                    >
                                        <span>Paid Only (Unsettled)</span>
                                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-mono">
                                            {paidUnsettledOrders.length}
                                        </span>
                                    </button>
                                    {selectedOrders.length > 0 && (
                                        <>
                                            <div className="border-t border-slate-100 my-1"></div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    handleDeselectAll();
                                                    setIsToolbarSelectOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-1.5"
                                            >
                                                <span>Clear Selection</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Quick Settle Action */}
                        <button
                            type="button"
                            onClick={() => {
                                setIsQuickSettleOpen(true);
                                fetchQuickSettleData();
                            }}
                            className="py-3 px-5 rounded-2xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md hover:shadow-lg hover:shadow-amber-500/25 transition-all flex items-center justify-center gap-2 whitespace-nowrap w-full sm:w-auto hover:-translate-y-0.5 active:scale-95"
                            title="Quick Settle by selecting flowers"
                        >
                            <FiZap size={18} className="text-amber-100" />
                            Quick Settle
                        </button>

                        {/* Settle Action */}
                        <button
                            disabled={selectedOrders.length === 0}
                            onClick={() =>
                                navigate("/settle", {
                                    state: { selectedOrders },
                                })
                            }
                            className={`py-3 px-6 rounded-2xl font-bold transition-all shadow-md flex items-center justify-center gap-2 whitespace-nowrap w-full sm:w-auto
                ${selectedOrders.length > 0 ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
                        >
                            <FiCheck size={20} />
                            Settle ({selectedOrders.length})
                        </button>
                    </div>
                </div>

                {/* Selected Orders Summary Banner */}
                {selectedOrders.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl text-xs sm:text-sm text-indigo-900 gap-3 shadow-xs">
                        <div className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
                            <span className="font-bold">
                                {selectedOrders.length} {selectedOrders.length === 1 ? 'order' : 'orders'} selected for settlement
                            </span>
                            <span className="text-slate-400 hidden sm:inline">·</span>
                            <span className="text-slate-600 hidden sm:inline">
                                Total Value: <strong>{formatCurrency(selectedOrders.reduce((s, o) => s + (o.totalAmount || 0), 0))}</strong>
                            </span>
                        </div>
                        <div className="flex items-center gap-3 self-end sm:self-auto">
                            <button
                                type="button"
                                onClick={handleDeselectAll}
                                className="text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors"
                            >
                                Clear Selection
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate("/settle", { state: { selectedOrders } })}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-sm transition-all hover:-translate-y-0.5"
                            >
                                Proceed to Settle →
                            </button>
                        </div>
                    </div>
                )}

                
                {/* Desktop Keyboard Hints */}
                {showKeyboardHints && <div className="hidden sm:flex items-center gap-3 bg-indigo-50/70 border border-indigo-100 px-4 py-2 rounded-2xl text-xs text-slate-600">
                    <span className="font-bold text-indigo-700">⌨️ Keyboard:</span>
                    <span><kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono text-[11px]">↑ / ↓</kbd> Navigate</span>
                    <span><kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono text-[11px]">Space</kbd> Select for Settle</span>
                    <span><kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono text-[11px]">Enter</kbd> View Details</span>
                    <span><kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono text-[11px]">R</kbd> View Receipt</span>
                    <span><kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono text-[11px]">Alt+Q</kbd> Quick Settle</span>
                    <span><kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono text-[11px]">Esc</kbd> Close Modal</span>
                </div>}

                {/* Content Table */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
                    {loading ? (
                        <ListSkeleton />
                    ) : orders.length === 0 ? (
                        <div className="w-full h-[400px] flex flex-col items-center justify-center text-slate-400">
                            <div className="bg-slate-50 p-6 rounded-full mb-4">
                                <FiShoppingBag
                                    size={48}
                                    className="text-slate-300"
                                />
                            </div>
                            <h3 className="text-xl font-bold text-slate-600 mb-1">
                                No orders found
                            </h3>
                            <p className="text-sm">
                                Try adjusting your filters or search query.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="hidden lg:block overflow-x-auto w-full">
                                <table className="w-full text-left border-collapse min-w-[1000px]">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-sm uppercase tracking-wider">
                                            <th className="p-5 pl-6 rounded-tl-3xl w-14">
                                                <div className="flex items-center gap-1.5 relative header-select-container">
                                                    <input
                                                        type="checkbox"
                                                        ref={headerCheckboxRef}
                                                        checked={isAllUnsettledSelected}
                                                        disabled={unsettledOrders.length === 0}
                                                        onChange={handleToggleSelectAll}
                                                        title={isAllUnsettledSelected ? "Deselect All" : "Select All Unsettled"}
                                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setIsHeaderSelectOpen(!isHeaderSelectOpen);
                                                        }}
                                                        disabled={unsettledOrders.length === 0}
                                                        className="p-0.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-200/60 transition-colors"
                                                        title="Select all or paid"
                                                    >
                                                        <FiChevronDown size={14} />
                                                    </button>

                                                    {isHeaderSelectOpen && (
                                                        <div className="absolute left-0 top-8 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-30 text-left font-normal normal-case">
                                                            <div className="px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                                                Select Orders
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    handleSelectAllUnsettled();
                                                                    setIsHeaderSelectOpen(false);
                                                                }}
                                                                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-between"
                                                            >
                                                                <span>All Unsettled</span>
                                                                <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                                                                    {unsettledOrders.length}
                                                                </span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    handleSelectPaidUnsettled();
                                                                    setIsHeaderSelectOpen(false);
                                                                }}
                                                                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center justify-between"
                                                            >
                                                                <span>Paid Only</span>
                                                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-mono">
                                                                    {paidUnsettledOrders.length}
                                                                </span>
                                                            </button>
                                                            {selectedOrders.length > 0 && (
                                                                <>
                                                                    <div className="border-t border-slate-100 my-1"></div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            handleDeselectAll();
                                                                            setIsHeaderSelectOpen(false);
                                                                        }}
                                                                        className="w-full text-left px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                                                                    >
                                                                        Deselect All
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </th>
                                            <th className="p-5">
                                                Order ID / Date
                                            </th>
                                            <th className="p-5">Buyer</th>
                                            <th className="p-5">Total</th>
                                            <th className="p-5">Payment</th>
                                            <th className="p-5">Settlement</th>
                                            <th className="p-5 pr-6 text-right rounded-tr-3xl">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm md:text-base">
                                        {orders.map((order, index) => {
                                            const isSelected =
                                                !!selectedOrders.find(
                                                    (o) => o._id === order._id,
                                                );
                                            return (
                                                <tr
                                                    id={'order-row-' + index}
                                                    key={order._id}
                                                    tabIndex={0}
                                                    onFocus={() => setSelectedIndex(index)}
                                                    onClick={(e) => {
                                                        setSelectedIndex(index);
                                                        if (
                                                            e.target.closest(
                                                                'input[type="checkbox"]',
                                                            ) ||
                                                            e.target.closest(
                                                                "button",
                                                            ) ||
                                                            e.target.closest(
                                                                ".options-dropdown-container",
                                                            )
                                                        )
                                                            return;
                                                        setDetailsOrder(order);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            setDetailsOrder(order);
                                                        } else if (e.key === ' ' && !order.settled) {
                                                            e.preventDefault();
                                                            toggleOrderSelection(order);
                                                        }
                                                    }}
                                                    className={'hover:bg-slate-50 transition-colors group cursor-pointer border-b border-slate-200 last:border-0 ' +
                                                        (index === selectedIndex
                                                            ? 'ring-2 ring-indigo-500 bg-indigo-50/80 font-semibold'
                                                            : isSelected
                                                            ? 'bg-indigo-50'
                                                            : 'bg-white')}
                                                >
                                                    <td className="p-5 pl-6">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            disabled={
                                                                order.settled
                                                            }
                                                            onChange={() =>
                                                                toggleOrderSelection(
                                                                    order,
                                                                )
                                                            }
                                                            className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer"
                                                        />
                                                    </td>
                                                    <td className="p-5">
                                                        <p className="font-mono text-sm text-slate-500 font-semibold">
                                                            {order.orderId}
                                                        </p>
                                                        <p className="text-xs text-slate-400 font-medium">
                                                            {new Date(
                                                                order.createdAt,
                                                            ).toLocaleDateString()}{" "}
                                                            {new Date(
                                                                order.createdAt,
                                                            ).toLocaleTimeString(
                                                                [],
                                                                {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                },
                                                            )}
                                                        </p>
                                                    </td>
                                                    <td className="p-5">
                                                        <p className="font-bold text-slate-800">
                                                            {order.buyer
                                                                ?.name ||
                                                                "Unknown"}
                                                        </p>
                                                        {order.buyer
                                                            ?.businessName && (
                                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                                {
                                                                    order.buyer
                                                                        .businessName
                                                                }
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="p-5 font-bold text-slate-800">
                                                        {formatCurrency(
                                                            order.totalAmount,
                                                        )}
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
                                                                onClick={() =>
                                                                    handleMarkPaid(
                                                                        order._id,
                                                                    )
                                                                }
                                                                className="px-3 py-1.5 text-emerald-600 font-bold hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200 text-xs shadow-sm"
                                                                title="Mark Paid"
                                                            >
                                                                $ Pay
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() =>
                                                                setOpenDropdown(
                                                                    openDropdown ===
                                                                        order._id
                                                                        ? null
                                                                        : order._id,
                                                                )
                                                            }
                                                            className="px-2 py-1.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 inline-flex items-center gap-1 text-xs shadow-sm"
                                                        >
                                                            Options{" "}
                                                            <FiMoreVertical />
                                                        </button>

                                                        {openDropdown ===
                                                            order._id && (
                                                            <div className="absolute right-6 top-10 mt-1 w-32 bg-white dark:bg-[#1e293b] rounded-xl shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] border border-slate-100 py-1 z-30 text-left">
                                                                <button
                                                                    onClick={() => {
                                                                        setOpenDropdown(
                                                                            null,
                                                                        );
                                                                        navigate(
                                                                            `/edit-order/${order._id}`,
                                                                        );
                                                                    }}
                                                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2 font-medium"
                                                                >
                                                                    <FiEdit />{" "}
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setOpenDropdown(
                                                                            null,
                                                                        );
                                                                        handleDelete(
                                                                            order._id,
                                                                        );
                                                                    }}
                                                                    className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                                                                >
                                                                    <FiTrash2 />{" "}
                                                                    Delete
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
                            <div className="lg:hidden flex flex-col gap-3 px-3 py-4 bg-slate-50/50 rounded-b-2xl">
                                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium shadow-xs">
                                    <span className="font-bold text-slate-600">Select:</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        <button
                                            type="button"
                                            onClick={handleSelectAllUnsettled}
                                            className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg border border-indigo-100"
                                        >
                                            All ({unsettledOrders.length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSelectPaidUnsettled}
                                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-100"
                                        >
                                            Paid ({paidUnsettledOrders.length})
                                        </button>
                                        {selectedOrders.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={handleDeselectAll}
                                                className="px-2 py-1 bg-rose-50 text-rose-600 font-bold rounded-lg border border-rose-100"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {orders.map((order) => {
                                    const isSelected = !!selectedOrders.find(
                                        (o) => o._id === order._id,
                                    );
                                    return (
                                        <div
                                            key={order._id}
                                            onClick={(e) => {
                                                if (
                                                    e.target.closest(
                                                        'input[type="checkbox"]',
                                                    ) ||
                                                    e.target.closest(
                                                        "button",
                                                    ) ||
                                                    e.target.closest(
                                                        ".options-dropdown-container",
                                                    )
                                                )
                                                    return;
                                                setDetailsOrder(order);
                                            }}
                                            className={`p-4 flex flex-col gap-3 transition-all cursor-pointer rounded-2xl border shadow-sm ${isSelected ? "border-indigo-400 bg-indigo-50/50 ring-1 ring-indigo-400" : "border-slate-200 bg-white hover:border-slate-300"}`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-start gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        disabled={order.settled}
                                                        onChange={() =>
                                                            toggleOrderSelection(
                                                                order,
                                                            )
                                                        }
                                                        className="w-5 h-5 mt-1 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer shrink-0 shadow-sm"
                                                    />
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-base leading-tight mb-0.5">
                                                            {order.buyer
                                                                ?.name ||
                                                                "Unknown"}
                                                        </p>
                                                        <p className="font-mono text-xs text-slate-500 font-semibold">
                                                            {order.orderId}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="font-bold text-indigo-700 text-lg leading-tight mb-0.5">
                                                        {formatCurrency(
                                                            order.totalAmount,
                                                        )}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 font-medium">
                                                        {new Date(
                                                            order.createdAt,
                                                        ).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center mt-2 pt-3 border-t border-slate-100/60">
                                                <div className="flex flex-col sm:flex-row gap-1.5">
                                                    {order.paid ? (
                                                        <span className="px-2.5 py-1 rounded-md text-[10px] uppercase font-black tracking-wide bg-emerald-100 text-emerald-700 inline-flex items-center justify-center">
                                                            Paid
                                                        </span>
                                                    ) : (
                                                        <span className="px-2.5 py-1 rounded-md text-[10px] uppercase font-black tracking-wide bg-rose-100 text-rose-700 inline-flex items-center justify-center">
                                                            Unpaid
                                                        </span>
                                                    )}
                                                    {order.settled ? (
                                                        <span className="px-2.5 py-1 rounded-md text-[10px] uppercase font-black tracking-wide bg-blue-100 text-blue-700 inline-flex items-center justify-center">
                                                            Settled
                                                        </span>
                                                    ) : (
                                                        <span className="px-2.5 py-1 rounded-md text-[10px] uppercase font-black tracking-wide bg-amber-100 text-amber-700 inline-flex items-center justify-center">
                                                            Pending
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 isolate relative options-dropdown-container">
                                                    {!order.paid && (
                                                        <button
                                                            onClick={() =>
                                                                handleMarkPaid(
                                                                    order._id,
                                                                )
                                                            }
                                                            className="px-4 py-2 text-emerald-600 font-bold bg-emerald-50 rounded-xl transition-colors border border-emerald-200 text-xs shadow-sm active:scale-95"
                                                        >
                                                            {" "}
                                                            Pay
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() =>
                                                            setOpenDropdown(
                                                                openDropdown ===
                                                                    order._id
                                                                    ? null
                                                                    : order._id,
                                                            )
                                                        }
                                                        className="px-3 py-2 text-slate-600 font-bold bg-slate-50 rounded-xl transition-colors border border-slate-200 flex items-center gap-1.5 text-xs shadow-sm active:scale-95"
                                                    >
                                                        {" "}
                                                        Options{" "}
                                                        <FiMoreVertical
                                                            size={14}
                                                        />
                                                    </button>

                                                    {openDropdown ===
                                                        order._id && (
                                                        <div className="absolute right-0 bottom-full mb-2 w-32 bg-white dark:bg-[#1e293b] rounded-xl shadow-xl dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] border border-slate-100 py-1 z-30 text-left">
                                                            <button
                                                                onClick={() => {
                                                                    setOpenDropdown(
                                                                        null,
                                                                    );
                                                                    navigate(
                                                                        `/edit-order/${order._id}`,
                                                                    );
                                                                }}
                                                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2 font-medium"
                                                            >
                                                                <FiEdit /> Edit
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setOpenDropdown(
                                                                        null,
                                                                    );
                                                                    handleDelete(
                                                                        order._id,
                                                                    );
                                                                }}
                                                                className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                                                            >
                                                                <FiTrash2 />{" "}
                                                                Delete
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-20">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setDetailsOrder(null)}
                    ></div>
                    <div className="relative flex flex-col w-full max-w-2xl bg-white dark:bg-[#111827] rounded-3xl shadow-xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-slate-200 overflow-hidden z-20 max-h-[85vh]">
                        <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                    <FiShoppingBag size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 leading-tight">
                                        Order Details
                                    </h2>
                                    <p className="text-xs font-mono text-slate-500">
                                        {detailsOrder.orderId}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setDetailsOrder(null)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                            >
                                <FiX size={24} />
                            </button>
                        </div>

                        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 min-h-0 space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                        Buyer Details
                                    </p>
                                    <p className="font-semibold text-slate-800 text-base">
                                        {detailsOrder.buyer?.name || "Unknown"}
                                    </p>
                                    {detailsOrder.buyer?.businessName && (
                                        <p className="text-xs font-medium text-slate-500">
                                            {detailsOrder.buyer.businessName}
                                        </p>
                                    )}
                                    <p className="text-sm mt-2 text-slate-600 flex items-center gap-2">
                                        {detailsOrder.buyer?.telephone ||
                                            "No Phone"}
                                    </p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                        Order Summary
                                    </p>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-slate-500">
                                            Date
                                        </span>
                                        <span className="font-medium text-slate-700">
                                            {new Date(
                                                detailsOrder.createdAt,
                                            ).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-slate-500">
                                            Total
                                        </span>
                                        <span className="font-bold text-indigo-600">
                                            {formatCurrency(
                                                detailsOrder.totalAmount,
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">
                                            Status
                                        </span>
                                        <span>
                                            {detailsOrder.paid ? (
                                                <span className="text-emerald-600 font-bold">
                                                    Paid
                                                </span>
                                            ) : (
                                                <span className="text-rose-600 font-bold">
                                                    Unpaid
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 pl-1 flex justify-between items-end">
                                    <span>Order Items</span>
                                    <span className="text-xs font-medium text-slate-500 lowercase bg-slate-100 px-2 py-0.5 rounded-md">
                                        {detailsOrder.items.length} items
                                    </span>
                                </h3>
                                <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-sm text-sm">
                                    <table className="w-full text-left min-w-[400px]">
                                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs">
                                            <tr>
                                                <th className="px-4 py-3 font-semibold">
                                                    Item
                                                </th>
                                                <th className="px-4 py-3 font-semibold text-right">
                                                    Cost
                                                </th>
                                                <th className="px-4 py-3 font-semibold text-right">
                                                    Price
                                                </th>
                                                <th className="px-4 py-3 font-semibold text-right">
                                                    Qty
                                                </th>
                                                <th className="px-4 py-3 font-semibold text-right">
                                                    Total
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {detailsOrder.items.map(
                                                (item, idx) => (
                                                    <tr
                                                        key={idx}
                                                        className="hover:bg-slate-50/50"
                                                    >
                                                        <td className="px-4 py-3 font-medium text-slate-700">
                                                            {item.customProduct ||
                                                                item.flower
                                                                    ?.name ||
                                                                "Item"}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-slate-500">
                                                            {formatCurrency(
                                                                item.cost,
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-slate-700">
                                                            {formatCurrency(
                                                                item.price,
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-medium text-slate-700">
                                                            {item.qty}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-bold text-slate-800">
                                                            {formatCurrency(
                                                                item.price *
                                                                    item.qty,
                                                            )}
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                                        <FiDollarSign /> Potential Profit
                                    </p>
                                </div>
                                <div className="text-2xl font-black text-emerald-600">
                                    {formatCurrency(
                                        detailsOrder.items.reduce(
                                            (sum, item) =>
                                                sum +
                                                ((item.price || 0) -
                                                    (item.cost || 0)) *
                                                    item.qty,
                                            0,
                                        ),
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                            <button
                                onClick={() => {
                                    setReceiptOrder(detailsOrder);
                                    setDetailsOrder(null);
                                }}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2"
                            >
                                <FiPrinter size={18} /> View Receipt
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt View Modal */}
            {receiptOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setReceiptOrder(null)}
                    ></div>
                    <div className="relative flex flex-col items-center w-full max-w-lg">
                        <div className="w-full flex justify-between items-center mb-4 bg-white p-3 rounded-2xl shadow-lg border border-slate-200 relative z-10 box-border">
                            <button
                                onClick={handleDownloadBill}
                                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 transition-colors"
                            >
                                <FiDownload size={16} /> Download
                            </button>
                            <button
                                onClick={() => setReceiptOrder(null)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                            >
                                <FiX size={24} />
                            </button>
                        </div>

                        {/* The exactly matched Printable Bill Element */}
                        <div className="w-full overflow-auto custom-scrollbar flex justify-start items-start bg-slate-100 p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-2xl relative z-10 max-h-[75vh]">
                            <div
                                ref={billRef}
                                style={{ width: "450px", minWidth: "450px" }}
                                className="preserve-light bg-white p-8 border border-slate-200 shadow-md print-friendly relative shrink-0"
                            >
                                <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>

                                <div className="text-center mb-6 pt-2">
                                    <img
                                        src="/light-logo.png"
                                        alt="Logo"
                                        className="h-10 md:h-12 w-auto mx-auto mb-2 object-contain"
                                    />
                                    <h1 className="text-sm font-semibold text-slate-400 tracking-[20px] pt-4 uppercase">
                                        INVOICE
                                    </h1>
                                </div>

                                <div className="border-t border-b border-dashed border-slate-300 py-4 mb-5 text-sm text-slate-600 grid grid-cols-2 gap-y-2">
                                    <div>
                                        <span className="font-semibold block text-xs uppercase text-slate-400">
                                            Order ID
                                        </span>{" "}
                                        <span className="font-medium">
                                            {receiptOrder.orderId}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-semibold block text-xs uppercase text-slate-400">
                                            Date
                                        </span>{" "}
                                        <span className="font-medium">
                                            {new Date(
                                                receiptOrder.createdAt,
                                            ).toLocaleDateString()}{" "}
                                            {new Date(
                                                receiptOrder.createdAt,
                                            ).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                    </div>
                                    <div className="col-span-2 mt-2">
                                        <span className="font-semibold block text-xs uppercase text-slate-400">
                                            Bill To
                                        </span>{" "}
                                        <span className="font-medium">
                                            {receiptOrder.buyer?.name ||
                                                "Unknown"}{" "}
                                            {receiptOrder.buyer?.businessName
                                                ? `(${receiptOrder.buyer.businessName})`
                                                : ""}
                                        </span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="font-medium">
                                            {receiptOrder.buyer?.telephone ||
                                                "N/A"}
                                        </span>{" "}
                                        <span className="text-slate-400 mx-1">
                                            •
                                        </span>{" "}
                                        <span>
                                            {receiptOrder.buyer?.location ||
                                                "N/A"}
                                        </span>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-200 text-left text-slate-800 text-xs uppercase tracking-wider bg-slate-50">
                                                <th className="py-2 px-2 font-semibold rounded-l-md">
                                                    Item
                                                </th>
                                                <th className="py-2 px-2 font-semibold text-right">
                                                    Qty
                                                </th>
                                                <th className="py-2 px-2 font-semibold text-right">
                                                    Price
                                                </th>
                                                <th className="py-2 px-2 font-semibold text-right rounded-r-md">
                                                    Total
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-slate-700 font-medium">
                                            {receiptOrder.items.map(
                                                (item, idx) => (
                                                    <tr
                                                        key={idx}
                                                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                                                    >
                                                        <td className="py-3 px-2">
                                                            {item.customProduct ||
                                                                item.flower
                                                                    ?.name ||
                                                                "Item"}
                                                        </td>
                                                        <td className="py-3 px-2 text-right">
                                                            {item.qty}
                                                        </td>
                                                        <td className="py-3 px-2 text-right">
                                                            {formatCurrency(
                                                                item.price,
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-2 text-right font-bold text-slate-800">
                                                            {formatCurrency(
                                                                item.price *
                                                                    item.qty,
                                                            )}
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="border-t border-slate-200 pt-4 space-y-2 text-sm ml-auto w-2/3">
                                    {receiptOrder.discount > 0 ? (
                                        <div className="flex justify-between text-slate-600 font-medium px-2">
                                            <span>Subtotal</span>
                                            <span>
                                                {formatCurrency(
                                                    receiptOrder.totalAmount +
                                                        receiptOrder.discount,
                                                )}
                                            </span>
                                        </div>
                                    ) : null}
                                    {receiptOrder.discount > 0 && (
                                        <div className="flex justify-between text-emerald-600 font-medium px-2 bg-emerald-50 py-1 rounded">
                                            <span>Discount</span>
                                            <span>
                                                -
                                                {formatCurrency(
                                                    receiptOrder.discount,
                                                )}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-xl font-black text-slate-800 pt-3 border-t-2 border-slate-800 mt-2 px-2 pb-1 bg-slate-50 rounded-b-lg">
                                        <span>Total</span>
                                        <span>
                                            {formatCurrency(
                                                receiptOrder.totalAmount,
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-center mt-10 pt-4 border-t border-dashed border-slate-300">
                                    <p className="text-sm font-semibold text-slate-600">
                                        Thank you for your business!
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Visit us again or contact support for
                                        help.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Settle Modal */}
            {isQuickSettleOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-20">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsQuickSettleOpen(false)}
                    ></div>

                    {/* Modal Card */}
                    <div className="relative flex flex-col w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden z-20 max-h-[85vh]">
                        {/* Modal Header */}
                        <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                                    <FiZap size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 leading-tight">
                                        Quick Flower Settlement
                                    </h2>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                        Select flowers from unsettled orders to generate a supplier bill
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsQuickSettleOpen(false)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                            >
                                <FiX size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 min-h-0 space-y-6">
                            {/* Stats Cards Dashboard */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Total to Settle */}
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            Total to Settle
                                        </span>
                                        <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                            <FiDollarSign size={14} />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-slate-800 tracking-tight">
                                            {formatCurrency(qsTotalCost)}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Supplier cost for selected
                                        </p>
                                    </div>
                                </div>

                                {/* Total Stems */}
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            Total Stems
                                        </span>
                                        <div className="w-6 h-6 rounded-lg bg-fuchsia-100 text-fuchsia-600 flex items-center justify-center">
                                            <FiBox size={14} />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-slate-800 tracking-tight">
                                            {qsTotalQty} <span className="text-sm font-semibold text-slate-500">stems</span>
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Across selected flowers
                                        </p>
                                    </div>
                                </div>

                                {/* Orders Covered */}
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            Orders Covered
                                        </span>
                                        <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                                            <FiShoppingBag size={14} />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-slate-800 tracking-tight">
                                            {qsAffectedOrdersCount} <span className="text-sm font-semibold text-slate-500">orders</span>
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Unsettled customer orders
                                        </p>
                                    </div>
                                </div>

                                {/* Sales & Margin */}
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            Sales & Margin
                                        </span>
                                        <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                            <FiPieChart size={14} />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-slate-800 tracking-tight">
                                            {formatCurrency(qsTotalRevenue)}
                                        </p>
                                        <p className="text-xs text-emerald-600 font-bold mt-1">
                                            Margin: +{qsMarginPercent}% ({formatCurrency(qsProfit)})
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Search & Filter Toolbar */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                <div className="relative flex-1">
                                    <div className="absolute top-1/2 -translate-y-1/2 left-3.5 pointer-events-none text-slate-400">
                                        <FiSearch size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search flower by name or ID..."
                                        value={quickSettleSearch}
                                        onChange={(e) => setQuickSettleSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                                    />
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    {/* Tabs */}
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => setQuickSettleFilter("all")}
                                            className={`px-3 py-1.5 rounded-xl text-xs transition-colors ${
                                                quickSettleFilter === "all"
                                                    ? "bg-indigo-50 text-indigo-600 font-bold border border-indigo-200"
                                                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium border border-slate-200"
                                            }`}
                                        >
                                            All ({aggregatedFlowers.length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setQuickSettleFilter("pending")}
                                            className={`px-3 py-1.5 rounded-xl text-xs transition-colors ${
                                                quickSettleFilter === "pending"
                                                    ? "bg-indigo-50 text-indigo-600 font-bold border border-indigo-200"
                                                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium border border-slate-200"
                                            }`}
                                        >
                                            Pending ({aggregatedFlowers.filter((f) => f.unsettledQty > 0).length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setQuickSettleFilter("selected")}
                                            className={`px-3 py-1.5 rounded-xl text-xs transition-colors ${
                                                quickSettleFilter === "selected"
                                                    ? "bg-indigo-50 text-indigo-600 font-bold border border-indigo-200"
                                                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium border border-slate-200"
                                            }`}
                                        >
                                            Selected ({selectedFlowerKeys.size})
                                        </button>
                                    </div>

                                    {/* Action Buttons */}
                                    <button
                                        type="button"
                                        onClick={handleSelectAllPendingFlowers}
                                        className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors"
                                    >
                                        Select Pending
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDeselectAllFlowers}
                                        className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>

                            {/* Flower Items Table */}
                            {quickSettleLoading ? (
                                <div className="py-16 flex flex-col items-center justify-center text-slate-400">
                                    <FiLoader size={36} className="animate-spin text-indigo-600 mb-3" />
                                    <p className="text-sm font-semibold">Loading flowers from unsettled orders...</p>
                                </div>
                            ) : filteredQuickSettleFlowers.length === 0 ? (
                                <div className="py-14 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <FiBox size={36} className="mx-auto mb-2 text-slate-300" />
                                    <p className="font-bold text-slate-600 text-sm">No flowers found</p>
                                    <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or filter tab.</p>
                                </div>
                            ) : (
                                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm text-sm">
                                    <div className="overflow-x-auto max-h-[360px] custom-scrollbar">
                                        <table className="w-full text-left min-w-[500px]">
                                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-4 py-3 w-10">
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                filteredQuickSettleFlowers.length > 0 &&
                                                                filteredQuickSettleFlowers.every(f => selectedFlowerKeys.has(f.id))
                                                            }
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedFlowerKeys(new Set(filteredQuickSettleFlowers.map(f => f.id)));
                                                                } else {
                                                                    handleDeselectAllFlowers();
                                                                }
                                                            }}
                                                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                                        />
                                                    </th>
                                                    <th className="px-4 py-3 font-semibold">Flower Item</th>
                                                    <th className="px-4 py-3 font-semibold text-right">Cost</th>
                                                    <th className="px-4 py-3 font-semibold text-right">Price</th>
                                                    <th className="px-4 py-3 font-semibold text-right">Pending Qty</th>
                                                    <th className="px-4 py-3 font-semibold text-right">To Settle</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredQuickSettleFlowers.map((flower) => {
                                                    const isSelected = selectedFlowerKeys.has(flower.id);
                                                    const hasPending = flower.unsettledQty > 0;
                                                    return (
                                                        <tr
                                                            key={flower.id}
                                                            onClick={() => toggleFlowerSelection(flower.id)}
                                                            className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${
                                                                isSelected ? "bg-indigo-50/80 font-semibold" : ""
                                                            } ${!hasPending ? "opacity-50" : ""}`}
                                                        >
                                                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => toggleFlowerSelection(flower.id)}
                                                                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-3 font-medium text-slate-700">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-slate-800 text-sm">
                                                                        {flower.name}
                                                                    </span>
                                                                    <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md font-semibold">
                                                                        {flower.flowerId}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-right text-slate-500">
                                                                {formatCurrency(flower.costPrice)}
                                                            </td>
                                                            <td className="px-4 py-3 text-right text-slate-700">
                                                                {formatCurrency(flower.sellingPrice)}
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-medium text-slate-700">
                                                                <span className="font-bold text-slate-800">{flower.unsettledQty}</span>
                                                                <span className="text-xs text-slate-400 block font-normal">
                                                                    in {flower.orderCount} {flower.orderCount === 1 ? 'order' : 'orders'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-bold text-indigo-600">
                                                                {formatCurrency(flower.unsettledCost)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                            <div className="text-sm text-slate-600 text-center sm:text-left">
                                <span className="font-bold text-slate-800">{selectedFlowerKeys.size}</span> flowers selected · Total to Settle: <span className="font-bold text-indigo-600">{formatCurrency(qsTotalCost)}</span> <span className="text-slate-400 font-normal">({qsAffectedOrdersCount} orders)</span>
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={() => setIsQuickSettleOpen(false)}
                                    className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={selectedFlowerKeys.size === 0}
                                    onClick={handleProceedQuickSettle}
                                    className={`flex-1 sm:flex-none px-5 py-2.5 font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm ${
                                        selectedFlowerKeys.size > 0
                                            ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                    }`}
                                >
                                    <span>Proceed to Settle Review</span>
                                    <FiArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
