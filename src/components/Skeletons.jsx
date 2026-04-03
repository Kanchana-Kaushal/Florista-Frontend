export function MetricSkeleton() {
    return (
        <div className="w-full bg-slate-200/50 animate-pulse p-6 sm:p-7 rounded-4xl border border-slate-100 h-40">
            <div className="w-14 h-14 rounded-2xl bg-slate-300 mb-6"></div>
            <div className="h-4 w-24 bg-slate-300 rounded mb-2"></div>
            <div className="h-8 w-32 bg-slate-300 rounded mb-2"></div>
            <div className="h-3 w-40 bg-slate-200 rounded"></div>
        </div>
    );
}

export function ChartSkeleton() {
    return (
        <div className="w-full h-80 bg-slate-200/50 animate-pulse rounded-4xl border border-slate-100 p-6 flex flex-col justify-between">
            <div className="h-6 w-48 bg-slate-300 rounded"></div>
            <div className="w-full h-48 bg-slate-300 rounded-2xl mt-4"></div>
        </div>
    );
}

export function TableRowSkeleton() {
    return (
        <tr className="animate-pulse bg-slate-50 border-b border-white">
            <td className="p-5 pl-6"><div className="w-5 h-5 bg-slate-200 rounded"></div></td>
            <td className="p-5">
                <div className="h-4 w-20 bg-slate-300 rounded mb-2"></div>
                <div className="h-3 w-16 bg-slate-200 rounded"></div>
            </td>
            <td className="p-5">
                <div className="h-4 w-32 bg-slate-300 rounded mb-2"></div>
                <div className="h-3 w-20 bg-slate-200 rounded"></div>
            </td>
            <td className="p-5"><div className="h-4 w-24 bg-slate-300 rounded"></div></td>
            <td className="p-5"><div className="h-6 w-16 bg-slate-200 rounded-full"></div></td>
            <td className="p-5"><div className="h-6 w-16 bg-slate-200 rounded-full"></div></td>
            <td className="p-5 pr-6"><div className="h-8 w-24 bg-slate-200 rounded-lg ml-auto"></div></td>
        </tr>
    );
}
