export function MetricSkeleton() {
    return (
        <div className="w-full bg-white rounded-3xl border border-slate-100 p-6 sm:p-7 shadow-sm animate-pulse flex flex-col gap-5">
            <div className="w-14 h-14 rounded-2xl bg-slate-200 shrink-0"></div>
            <div className="flex flex-col gap-2">
                <div className="h-4 w-24 bg-slate-200 rounded"></div>
                <div className="h-8 w-32 bg-slate-300 rounded"></div>
            </div>
            <div className="h-3 w-40 bg-slate-100 rounded mt-2"></div>
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

export function ListSkeleton() {
    return (
        <div className="w-full flex flex-col gap-3 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-full bg-white rounded-2xl border border-slate-100 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse shadow-sm">
                    <div className="flex gap-4 items-center w-full sm:w-1/2">
                        <div className="w-12 h-12 bg-slate-200 rounded-xl shrink-0"></div>
                        <div className="space-y-2 flex-1">
                            <div className="h-5 w-3/4 bg-slate-300 rounded"></div>
                            <div className="h-4 w-1/2 bg-slate-200 rounded"></div>
                        </div>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto items-center sm:justify-end">
                        <div className="h-8 w-24 bg-slate-200 rounded-lg hidden sm:block"></div>
                        <div className="h-8 w-20 bg-slate-200 rounded-lg"></div>
                        <div className="h-8 w-8 bg-slate-200 rounded-lg"></div>
                    </div>
                </div>
            ))}
        </div>
    );
}
