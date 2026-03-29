import { useState, useContext } from "react";
import {
    Routes,
    Route,
    Link,
    Outlet,
    useLocation,
    useNavigate,
} from "react-router-dom";
import {
    FiHome,
    FiInfo,
    FiPlus,
    FiShoppingBag,
    FiArchive,
    FiUsers,
    FiPieChart,
    FiLogOut,
} from "react-icons/fi";
import { AuthProvider, AuthContext } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import Stats from "./pages/Stats.jsx";
import Flowers from "./pages/Flowers.jsx";
import NewOrder from "./pages/NewOrder.jsx";
import OrderConfirmation from "./pages/OrderConfirmation.jsx";
import Orders from "./pages/Orders.jsx";
import EditOrder from "./pages/EditOrder.jsx";
import SettleOrders from "./pages/SettleOrders.jsx";
import Buyers from "./pages/Buyers.jsx";
import toast from "react-hot-toast";

function About() {
    return (
        <div className="p-8 bg-white rounded-2xl shadow-xl w-full max-w-lg mt-10 border border-slate-100 text-center">
            <div className="bg-emerald-100 p-4 rounded-full mb-6 text-emerald-600 inline-block shadow-sm mx-auto border border-emerald-200">
                <FiInfo size={48} />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-4">
                About the App
            </h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
                This app uses React, Vite, TailwindCSS (v4), React Router DOM,
                Axios, React Icons, and React Hot Toast. Everything is
                configured and ready to go!
            </p>
            <div className="flex flex-wrap justify-center gap-2">
                {["React", "Vite", "Tailwind", "Axios", "Router", "Icons"].map(
                    (tech) => (
                        <span
                            key={tech}
                            className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-medium border border-slate-200"
                        >
                            {tech}
                        </span>
                    ),
                )}
            </div>
        </div>
    );
}

function NavItem({ to, icon, label, exact = false, isFloating = false }) {
    const location = useLocation();
    const isActive = exact
        ? location.pathname === to
        : (location.pathname.startsWith(to) && to !== "/") ||
          (to === "/" && location.pathname === "/");

    if (isFloating) {
        return (
            <Link to={to} className="flex flex-col items-center justify-center -mt-6">
                <div className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-300/50 border-4 border-slate-50 relative z-10 transition-transform hover:scale-105 active:scale-95">
                    {icon}
                </div>
                <span className="text-[10px] font-black text-indigo-700 mt-1 tracking-tight">
                    {label}
                </span>
            </Link>
        );
    }

    return (
        // Mobile: pill chip background when active
        // Desktop: subtle filled pill
        <Link
            to={to}
            className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-1.5 rounded-2xl transition-all duration-200 text-sm font-medium select-none ${
                isActive
                    ? "text-indigo-600 bg-indigo-50 sm:border sm:border-indigo-100/80"
                    : "text-slate-400 sm:text-slate-500 hover:text-indigo-500 hover:bg-slate-50"
            }`}
        >
            <div className={`transition-all duration-200 ${isActive ? "scale-110 sm:scale-100" : ""}`}>
                {icon}
            </div>
            <span className={`text-[10px] sm:text-sm mt-0.5 sm:mt-0 ${
                isActive ? "font-black text-indigo-600" : "font-medium"
            }`}>
                {label}
            </span>
        </Link>
    );
}

function Layout() {
    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        toast.success("Logged out successfully");
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col items-center w-full relative pb-20 sm:pb-0">
            {/* Top Navigation */}
            <nav className="w-full bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200/70 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex justify-between items-center">

                    {/* Brand */}
                    <div className="flex items-center gap-2.5 text-indigo-900 font-extrabold text-xl tracking-tight">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md shadow-indigo-200/60 flex items-center justify-center text-white text-lg sm:text-xl font-black flex-shrink-0">
                            F
                        </div>
                        <div className="hidden sm:flex flex-col leading-none">
                            <span className="text-slate-900 font-black tracking-tight">Florista</span>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">ERP System</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Desktop Links */}
                        <div className="hidden sm:flex gap-1 lg:gap-2 items-center sm:border-r border-slate-200 sm:pr-4">
                            <NavItem to="/" icon={<FiPieChart size={18} />} label="Dashboard" exact={true} />
                            <NavItem to="/orders" icon={<FiShoppingBag size={18} />} label="Orders" />
                            <NavItem to="/new-order" icon={<FiPlus size={18} />} label="New Order" />
                            <NavItem to="/flowers" icon={<FiArchive size={18} />} label="Inventory" />
                            <NavItem to="/buyers" icon={<FiUsers size={18} />} label="Buyers" />
                        </div>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-rose-500 hover:text-rose-700 font-bold bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl transition-all text-sm select-none active:scale-95 border border-rose-100/50"
                        >
                            <FiLogOut size={18} />
                            <span className="hidden sm:block">Logout</span>
                        </button>
                    </div>
                </div>
            </nav>

            <main className="flex-1 w-full max-w-7xl flex flex-col items-center p-4 sm:p-6 lg:p-8">
                <Outlet />
            </main>

            <footer className="w-full py-6 text-center text-slate-400 text-xs font-medium border-t border-slate-200 bg-white mt-auto hidden sm:block">
                &copy; {new Date().getFullYear()} Florista ERP &nbsp;·&nbsp; Built for florists
            </footer>

            {/* Mobile Bottom Tab Bar */}
            <div className="sm:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] z-50 flex justify-around items-end pt-2 pb-4 px-1 safe-bottom">
                <NavItem to="/" icon={<FiPieChart size={22} />} label="Home" exact={true} />
                <NavItem to="/orders" icon={<FiShoppingBag size={22} />} label="Orders" />
                <NavItem to="/new-order" icon={<FiPlus size={28} />} label="New" isFloating={true} />
                <NavItem to="/flowers" icon={<FiArchive size={22} />} label="Stock" />
                <NavItem to="/buyers" icon={<FiUsers size={22} />} label="Buyers" />
            </div>
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<ProtectedRoute />}>
                    <Route element={<Layout />}>
                        <Route path="/" element={<Stats />} />
                        <Route path="/new-order" element={<NewOrder />} />
                        <Route
                            path="/confirm-order"
                            element={<OrderConfirmation />}
                        />
                        <Route path="/orders" element={<Orders />} />
                        <Route path="/edit-order/:id" element={<EditOrder />} />
                        <Route path="/settle" element={<SettleOrders />} />
                        <Route path="/flowers" element={<Flowers />} />
                        <Route path="/buyers" element={<Buyers />} />
                        <Route path="/about" element={<About />} />
                    </Route>
                </Route>
            </Routes>
        </AuthProvider>
    );
}

export default App;
