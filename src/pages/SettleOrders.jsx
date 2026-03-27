import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
    FiArrowLeft,
    FiCheck,
    FiDownload,
    FiPrinter,
    FiEdit3,
} from "react-icons/fi";
import { toPng } from "html-to-image";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function SettleOrders() {
    const location = useLocation();
    const navigate = useNavigate();
    const billRef = useRef(null);

    const [orders, setOrders] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSettled, setIsSettled] = useState(false);

    useEffect(() => {
        if (
            !location.state?.selectedOrders ||
            location.state.selectedOrders.length === 0
        ) {
            navigate("/orders");
        } else {
            setOrders(
                JSON.parse(JSON.stringify(location.state.selectedOrders)),
            );
        }
    }, [location.state, navigate]);

    useEffect(() => {
        if (isSettled) {
            const timer = setTimeout(() => {
                handleDownloadBill();
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [isSettled]);

    const handleCostChange = (orderIndex, itemIndex, newCost) => {
        const updatedOrders = [...orders];
        updatedOrders[orderIndex].items[itemIndex].cost = Number(newCost);
        setOrders(updatedOrders);
    };

    const totalCost = orders.reduce((sum, order) => {
        return (
            sum +
            order.items.reduce(
                (itemSum, item) => itemSum + item.cost * item.qty,
                0,
            )
        );
    }, 0);

    const handleFinalizeSettlement = async () => {
        setIsSubmitting(true);
        try {
            const promises = orders.map((order) => {
                const itemsPayload = order.items.map((item) => ({
                    ...item,
                    flower: item.flower?._id || item.flower,
                }));

                return axios.put(`${API_URL}/orders/${order._id}`, {
                    items: itemsPayload,
                    settled: true,
                    settledDate: new Date(),
                });
            });

            await Promise.all(promises);
            setIsSettled(true);
            toast.success("Orders settled successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to settle orders. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDownloadBill = async () => {
        if (billRef.current === null) return;
        try {
            const dataUrl = await toPng(billRef.current, {
                cacheBust: true,
                backgroundColor: "#ffffff",
            });
            const link = document.createElement("a");
            link.download = `Supplier_Settlement_${new Date().getTime()}.png`;
            link.href = dataUrl;
            link.click();
            toast.success("Supplier Bill downloaded");
        } catch (err) {
            console.error(err);
            toast.error("Failed to generate image");
        }
    };

    const formatCurrency = (amount) =>
        `Rs. ${Number(amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (orders.length === 0) return null;

    if (isSettled) {
        return (
            <div className="w-full max-w-2xl mx-auto space-y-6 flex flex-col items-center">
                <div className="w-full bg-emerald-50 text-emerald-700 p-6 rounded-2xl flex flex-col items-center justify-center border border-emerald-100 shadow-sm text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600 shadow-sm">
                        <FiCheck size={32} />
                    </div>
                    <h2 className="text-2xl font-bold">Settlement Complete!</h2>
                    <p className="mt-2 opacity-90 font-medium">
                        {orders.length} orders updated.
                    </p>
                </div>

                <div className="w-full flex gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-200 justify-center">
                    <button
                        onClick={handleDownloadBill}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl border border-indigo-700 shadow-sm hover:bg-indigo-700 font-medium transition-all hover:-translate-y-0.5"
                    >
                        <FiDownload /> Download Supplier Bill
                    </button>
                    <button
                        onClick={() => navigate("/orders")}
                        className="flex items-center gap-2 bg-slate-100 text-slate-600 px-6 py-2.5 rounded-xl border border-slate-200 shadow-sm hover:bg-slate-200 font-medium transition-all hover:-translate-y-0.5"
                    >
                        Back to Orders
                    </button>
                </div>

                <div className="w-full bg-slate-50 flex flex-col items-center p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm overflow-auto max-h-[80vh]">
                    <p className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-2 shrink-0">
                        <FiPrinter /> Supplier Bill Preview
                    </p>
                    <div
                        ref={billRef}
                        className="bg-white p-6 sm:p-8 border border-slate-200 shadow-md print-friendly relative shrink-0 h-max"
                        style={{ width: "450px" }}
                    >
                        <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>

                        <div className="text-center mb-6 pt-2">
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                                Supplier Settlement
                            </h1>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">
                                Cost Bill
                            </p>
                        </div>

                        <div className="border-t border-b border-dashed border-slate-300 py-4 mb-5 text-sm text-slate-600 grid grid-cols-2 gap-y-2">
                            <div>
                                <span className="font-semibold block text-xs uppercase text-slate-400">
                                    Date
                                </span>{" "}
                                <span className="font-medium">
                                    {new Date().toLocaleDateString()}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="font-semibold block text-xs uppercase text-slate-400">
                                    Orders Settled
                                </span>{" "}
                                <span className="font-medium">
                                    {orders.length}
                                </span>
                            </div>
                            <div className="col-span-2 mt-2">
                                <span className="font-semibold block text-xs uppercase text-slate-400">
                                    Bill Ref
                                </span>{" "}
                                <span className="font-medium text-xs font-mono break-all">
                                    SET-
                                    {orders
                                        .map((o) => o.orderId)
                                        .join(", ")
                                        .substring(0, 30)}
                                    {orders.length > 2 ? "..." : ""}
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
                                            Cost
                                        </th>
                                        <th className="py-2 px-2 font-semibold text-right rounded-r-md">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-slate-700 font-medium">
                                    {orders.map((order) =>
                                        order.items.map((item, idx) => (
                                            <tr
                                                key={`${order._id}-${idx}`}
                                                className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                                            >
                                                <td className="py-2 px-2">
                                                    {item.customProduct ||
                                                        item.flower?.name ||
                                                        "Item"}
                                                    <div className="text-[10px] text-slate-400 font-normal">
                                                        Ord: {order.orderId} •
                                                        Loc:{" "}
                                                        {order.buyer
                                                            ?.location ||
                                                            "Unknown"}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-2 text-right">
                                                    {item.qty}
                                                </td>
                                                <td className="py-3 px-2 text-right">
                                                    {formatCurrency(item.cost)}
                                                </td>
                                                <td className="py-3 px-2 text-right font-bold text-slate-800">
                                                    {formatCurrency(
                                                        item.cost * item.qty,
                                                    )}
                                                </td>
                                            </tr>
                                        )),
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="border-t border-slate-200 pt-4 space-y-2 text-sm ml-auto w-2/3">
                            <div className="flex justify-between text-xl font-black text-slate-800 pt-3 border-t-2 border-slate-800 mt-2 px-2 pb-1 bg-slate-50 rounded-b-lg">
                                <span>Total</span>
                                <span>{formatCurrency(totalCost)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2.5 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 text-slate-600 transition-all hover:scale-105"
                >
                    <FiArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
                        Settle Orders
                    </h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">
                        Verify and edit cost prices before generating supplier
                        bill.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {orders.map((order, orderIndex) => (
                        <div
                            key={order._id}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
                        >
                            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-black">
                                        #{orderIndex + 1}
                                    </span>
                                    Order: {order.orderId}
                                </span>
                                <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                    {order.buyer?.name}
                                </span>
                            </h2>

                            <div className="space-y-3 mt-4">
                                {order.items.map((item, itemIndex) => (
                                    <div
                                        key={itemIndex}
                                        className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-sm"
                                    >
                                        <div className="flex-1">
                                            <p className="font-bold text-slate-800 mb-1">
                                                {item.customProduct ||
                                                    item.flower?.name}
                                            </p>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest bg-white inline-block px-2 py-0.5 rounded border border-slate-100">
                                                Sale Price:{" "}
                                                {formatCurrency(item.price)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4 bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm w-full sm:w-auto">
                                            <div>
                                                <label className="text-xs font-bold text-indigo-600 uppercase tracking-wide flex items-center gap-1 mb-1">
                                                    <FiEdit3 /> Edit Cost (Rs.)
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="w-24 p-2 sm:p-3 text-base bg-indigo-50 border border-indigo-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-900"
                                                    value={item.cost}
                                                    onChange={(e) =>
                                                        handleCostChange(
                                                            orderIndex,
                                                            itemIndex,
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="text-slate-400 font-bold mx-1">
                                                x
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1 text-center">
                                                    Qty
                                                </label>
                                                <div className="w-12 py-2 font-bold text-slate-800 text-center bg-slate-100 rounded-md border border-slate-200">
                                                    {item.qty}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 self-start sticky top-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
                        Settlement Summary
                    </h2>
                    <div className="space-y-4 text-slate-600 mb-6 font-medium">
                        <div className="flex justify-between items-center p-2 rounded hover:bg-slate-50">
                            <span>Total Orders</span>
                            <span className="font-bold text-slate-800">
                                {orders.length}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded hover:bg-slate-50">
                            <span>Total Items</span>
                            <span className="font-bold text-slate-800">
                                {orders.reduce(
                                    (sum, o) =>
                                        sum +
                                        o.items.reduce((s, i) => s + i.qty, 0),
                                    0,
                                )}
                            </span>
                        </div>
                        <div className="pt-4 flex justify-between items-center text-xl font-black text-slate-800 border-t-2 border-slate-800 mt-2 px-2 pb-1">
                            <span>Total Cost</span>
                            <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-lg">
                                {formatCurrency(totalCost)}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleFinalizeSettlement}
                        disabled={isSubmitting}
                        className={`w-full py-4 flex items-center justify-center gap-2 rounded-xl font-bold text-lg transition-all shadow-md ${isSubmitting ? "bg-indigo-400 cursor-wait" : "bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-1 hover:shadow-lg"} text-white uppercase tracking-wide`}
                    >
                        {isSubmitting ? (
                            "Processing..."
                        ) : (
                            <>
                                <FiCheck size={24} /> Finalize Settlement
                            </>
                        )}
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-4 font-medium">
                        This will permanently update cost prices and mark orders
                        as settled.
                    </p>
                </div>
            </div>
        </div>
    );
}
