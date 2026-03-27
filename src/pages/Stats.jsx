import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext.jsx";
import {
    FiTrendingUp,
    FiDollarSign,
    FiShoppingBag,
    FiAlertCircle,
    FiLoader,
    FiCalendar,
    FiCheckCircle,
    FiClock,
    FiBarChart2,
    FiActivity
} from "react-icons/fi";
import toast from "react-hot-toast";

export default function Stats() {
    const { user } = useContext(AuthContext);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [monthOffset, setMonthOffset] = useState(0);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`http://localhost:5000/api/stats?monthOffset=${monthOffset}`);
                setData(res.data);
            } catch (error) {
                console.error("Failed to fetch stats", error);
                toast.error("Failed to load dashboard statistics");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [monthOffset]);

    if (loading && !data) {
        return (
            <div className="w-full min-h-[60vh] flex flex-col items-center justify-center text-indigo-500">
                <FiLoader className="animate-spin mb-6" size={56} />
                <p className="font-bold tracking-tight text-slate-400 text-lg animate-pulse">
                    Crunching the numbers...
                </p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="w-full text-center py-12 text-slate-500 font-medium">
                Failed to load data. Please refresh the page.
            </div>
        );
    }

    const { overview, topFlowers, salesByLocation, topBuyers, recentActivity } = data;

    // Formatting currency
    const formatCurrency = (amount) =>
        `Rs. ${Number(amount || 0).toLocaleString("en-US", {
            maximumFractionDigits: 0,
        })}`;

    // Math calculation for max horizontal bars
    const maxFlowerRevenue =
        topFlowers?.length > 0
            ? Math.max(...topFlowers.map((f) => f.totalRevenue))
            : 1;
    const maxLocationSales =
        salesByLocation?.length > 0
            ? Math.max(...salesByLocation.map((l) => l.totalSales))
            : 1;

    const unpaidCount = overview.unpaidOrders + overview.unsettledOrders;
    const hasAlerts = unpaidCount > 0;

    return (
        <div className="w-full flex justify-center pb-20 sm:pb-12 bg-slate-50 min-h-screen">
            <div className="w-full">
                {/* Hero Greeting Banner */}
                <div className="w-full bg-linear-to-b from-indigo-100/60 to-transparent pt-8 sm:pt-12 pb-16 px-4">
                    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                        <div>
                            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight flex items-baseline gap-2">
                                Welcome back{user?.username ? `, ${user.username}` : ''} <span className="inline-block hover:animate-bounce text-4xl">👋</span>
                            </h1>
                            <p className="text-slate-500 font-medium mt-2 sm:text-lg">
                                Here is how your business is performing at a glance.
                            </p>
                        </div>

                        {/* Beautiful Pill Selector for Timeframe */}
                        <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-slate-200/60 flex overflow-x-auto w-full lg:w-auto custom-scrollbar">
                            {[
                                { label: "This Month", value: 0 },
                                { label: "Last Month", value: 1 },
                                { label: "2 Months Ago", value: 2 },
                                { label: "Older", value: 3 },
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setMonthOffset(opt.value)}
                                    className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 flex-1 lg:flex-none ${
                                        monthOffset === opt.value
                                            ? "bg-indigo-600 text-white shadow-md scale-100"
                                            : "text-slate-500 hover:bg-slate-100 hover:text-indigo-600 scale-95"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                            {monthOffset > 3 && (
                                <div className="px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap bg-indigo-600 text-white shadow-md">
                                    {monthOffset} Months Ago
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 -mt-10 sm:-mt-12">
                    {/* Top Level Metric Cards (Horizontal scroll on Mobile) */}
                    <div className="flex overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 hide-scrollbar-mobile pointer-events-auto snap-x">
                        
                        <AnimatedMetricCard
                            title="Total Revenue"
                            value={formatCurrency(overview.totalSales)}
                            icon={FiDollarSign}
                            color="indigo"
                            gradient="from-indigo-500/10 to-transparent"
                        />
                        <AnimatedMetricCard
                            title="Net Profit"
                            value={formatCurrency(overview.totalProfit)}
                            icon={FiTrendingUp}
                            color="emerald"
                            gradient="from-emerald-500/10 to-transparent"
                        />
                        <AnimatedMetricCard
                            title="Completed Orders"
                            value={overview.fulfilledOrders}
                            icon={FiShoppingBag}
                            color="blue"
                            gradient="from-blue-500/10 to-transparent"
                        />
                        <AnimatedMetricCard
                            title="Action Required"
                            value={`${unpaidCount} Pending`}
                            subtitle="Unpaid or Unsettled items"
                            icon={FiAlertCircle}
                            color="rose"
                            gradient="from-rose-500/10 to-transparent"
                            isAlert={hasAlerts}
                        />
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                        {/* Top Flowers CSS Chart */}
                        <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60 flex flex-col min-h-[380px] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
                            <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-3">
                                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><FiBarChart2 /></span>
                                Top Selling Flowers
                            </h3>
                            <div className="flex-1 w-full space-y-6">
                                {topFlowers && topFlowers.length > 0 ? (
                                    topFlowers.map((flower, idx) => (
                                        <div key={idx} className="group relative">
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="font-bold text-slate-700 text-sm">
                                                    {flower.name}
                                                </span>
                                                <span className="font-black text-slate-900 text-sm sm:text-base">
                                                    {formatCurrency(flower.totalRevenue)}
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden flex relative">
                                                {/* Gradient Animated Bar */}
                                                <div
                                                    className="bg-linear-to-r from-indigo-400 to-indigo-600 h-full rounded-full transition-all duration-1000 ease-out relative shadow-sm group-hover:to-indigo-500"
                                                    style={{ width: `${(flower.totalRevenue / maxFlowerRevenue) * 100}%` }}
                                                >
                                                    <div className="absolute inset-0 bg-white/20 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                </div>
                                            </div>
                                            <p className="text-left text-xs text-slate-400 mt-1.5 font-medium">
                                                {flower.totalQtySold} units sold
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <EmptyState message="No flower sales data yet." icon={FiShoppingBag} />
                                )}
                            </div>
                        </div>

                        {/* Revenue By Location CSS Chart */}
                        <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60 flex flex-col min-h-[380px] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
                            <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-3">
                                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><FiActivity /></span>
                                Revenue by Region
                            </h3>
                            <div className="flex-1 w-full space-y-6">
                                {salesByLocation && salesByLocation.length > 0 ? (
                                    salesByLocation.map((loc, idx) => (
                                        <div key={idx} className="group relative">
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="font-bold text-slate-700 text-sm">
                                                    {loc.location || "Unknown"}
                                                </span>
                                                <span className="font-black text-slate-900 text-sm sm:text-base">
                                                    {formatCurrency(loc.totalSales)}
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden flex relative">
                                                {/* Gradient Animated Bar */}
                                                <div
                                                    className="bg-linear-to-r from-emerald-400 to-emerald-600 h-full rounded-full transition-all duration-1000 ease-out relative shadow-sm group-hover:to-emerald-500"
                                                    style={{ width: `${(loc.totalSales / maxLocationSales) * 100}%` }}
                                                >
                                                     <div className="absolute inset-0 bg-white/20 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                </div>
                                            </div>
                                            <p className="text-left text-xs text-slate-400 mt-1.5 font-medium">
                                                {loc.totalOrders} {loc.totalOrders === 1 ? 'order' : 'orders'} completed
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <EmptyState message="No location data yet." icon={FiActivity} />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row Lists */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
                        
                        {/* Recent Activity Timeline (Takes up 7 cols on large) */}
                        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60">
                            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                Activity Timeline
                            </h3>
                            <div className="relative border-l-2 border-slate-100 ml-4 pl-6 space-y-8 mt-4">
                                {recentActivity && recentActivity.length > 0 ? (
                                    recentActivity.map((activity, idx) => (
                                        <div key={idx} className="relative group">
                                            {/* Timeline Node Icon */}
                                            <div className={`absolute -left-[35px] top-0 w-4 h-4 rounded-full border-4 border-white shadow-sm transition-transform group-hover:scale-125 ${
                                                activity.paid && activity.settled ? 'bg-emerald-500' :
                                                activity.paid || activity.settled ? 'bg-amber-400' : 'bg-rose-500'
                                            }`}></div>
                                            
                                            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl group-hover:shadow-md group-hover:-translate-y-1 transition-all">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-base flex items-center gap-2">
                                                            {activity.buyerName}
                                                        </p>
                                                        <p className="text-xs font-semibold text-slate-400 mt-1 flex items-center gap-1">
                                                            <FiClock size={12}/> {new Date(activity.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {activity.paid ? (
                                                            <span className="px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-extrabold bg-emerald-100 text-emerald-700 flex items-center gap-1"><FiCheckCircle size={10}/> Paid</span>
                                                        ) : (
                                                            <span className="px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-extrabold bg-rose-100 text-rose-700">Unpaid</span>
                                                        )}
                                                        {activity.settled ? (
                                                            <span className="px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-extrabold bg-blue-100 text-blue-700 flex items-center gap-1"><FiCheckCircle size={10}/> Settled</span>
                                                        ) : (
                                                            <span className="px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-extrabold bg-amber-100 text-amber-700">Pending Settlement</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="-ml-6"><EmptyState message="No recent activity to display." icon={FiClock} /></div>
                                )}
                            </div>
                        </div>

                        {/* Top Buyers (Takes up 5 cols on large) */}
                        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60 flex flex-col">
                            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                Lifetime Top Buyers
                            </h3>
                            <div className="space-y-4 flex-1">
                                {topBuyers && topBuyers.length > 0 ? (
                                    topBuyers.map((buyer, idx) => (
                                        <div
                                            key={idx}
                                            className="group flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-default"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-colors ${
                                                    idx === 0 ? 'bg-amber-100 text-amber-600' :
                                                    idx === 1 ? 'bg-slate-200 text-slate-600' :
                                                    idx === 2 ? 'bg-amber-50 text-amber-800' :
                                                    'bg-indigo-50 text-indigo-500'
                                                }`}>
                                                    #{idx + 1}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                        {buyer.businessName || buyer.name}
                                                    </p>
                                                    <p className="text-xs font-semibold text-slate-400 mt-0.5">
                                                        {buyer.totalOrders} total orders
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-emerald-600 tracking-tight">
                                                    {formatCurrency(buyer.lifetimeSpent)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <EmptyState message="No buyer data yet." icon={FiActivity} />
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

// ---------------- Helper Components ----------------

function AnimatedMetricCard({ title, value, subtitle, icon: Icon, color, gradient, isAlert = false }) {
    const colorStyles = {
        indigo: "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white border-indigo-100",
        emerald: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white border-emerald-100",
        blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white border-blue-100",
        rose: "bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white border-rose-100",
    };

    return (
        <div className={`min-w-[260px] sm:min-w-0 snap-center bg-white p-6 sm:p-7 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border flex flex-col relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 cursor-default ${isAlert ? 'border-rose-200 ring-4 ring-rose-50' : 'border-slate-100/80 hover:border-transparent'}`}>
            
            {/* Background Decorative Gradient */}
            <div className={`absolute -right-10 -bottom-10 w-32 h-32 rounded-full bg-linear-to-br ${gradient} opacity-50 blur-2xl group-hover:opacity-100 transition-opacity duration-500`}></div>
            
            {isAlert && (
                <div className="absolute top-4 right-4 w-3 h-3 bg-rose-500 rounded-full animate-ping"></div>
            )}
            {isAlert && (
                <div className="absolute top-4 right-4 w-3 h-3 bg-rose-500 rounded-full"></div>
            )}

            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-300 border ${colorStyles[color]} relative z-10`}>
                <Icon size={24} />
            </div>
            
            <div className="mt-6 relative z-10">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {title}
                </p>
                <h3 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-1">
                    {value}
                </h3>
                {subtitle && (
                    <p className="text-xs font-semibold text-slate-500 mt-2">{subtitle}</p>
                )}
            </div>
        </div>
    );
}

function EmptyState({ message, icon: Icon }) {
    return (
        <div className="w-full h-full min-h-[160px] flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 p-6">
            <Icon size={32} className="mb-3 text-slate-300" />
            <p className="font-medium text-center">{message}</p>
        </div>
    );
}
