import { auth } from "@/lib/auth";
import { DollarSign, TrendingUp, TrendingDown, Users, RefreshCw } from "lucide-react";

// Stat card component
function StatCard({
    title,
    value,
    subtitle,
    icon,
    trend,
    trendValue,
}: {
    title: string;
    value: string;
    subtitle?: string;
    icon: React.ReactNode;
    trend?: "up" | "down";
    trendValue?: string;
}) {
    return (
        <div className="glass rounded-2xl p-5">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-slate-400 font-medium">{title}</p>
                    <p className="text-2xl font-bold mt-1">{value}</p>
                    {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
                </div>
                <div className="p-3 rounded-xl bg-slate-700/50">{icon}</div>
            </div>
            {trend && trendValue && (
                <div className="mt-3 flex items-center gap-1">
                    {trend === "up" ? (
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                    ) : (
                        <TrendingDown className="w-4 h-4 text-rose-400" />
                    )}
                    <span className={trend === "up" ? "text-emerald-400" : "text-rose-400"}>
                        {trendValue}
                    </span>
                </div>
            )}
        </div>
    );
}

export default async function DashboardPage() {
    const session = await auth();
    const isAdmin = session?.user?.role === "admin";

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Welcome back, {session?.user?.name?.split(" ")[0]}</h1>
                    <p className="text-slate-400 mt-1">Here&apos;s what&apos;s happening with your flat finances</p>
                </div>
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium hover:opacity-90 transition-opacity">
                    <RefreshCw className="w-4 h-4" />
                    Sync Transactions
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    title="Account Balance"
                    value="$2,847.50"
                    subtitle="Updated 2 hours ago"
                    icon={<DollarSign className="w-5 h-5 text-teal-400" />}
                    trend="up"
                    trendValue="+12.5%"
                />
                <StatCard
                    title="Total Due This Week"
                    value="$1,266.00"
                    subtitle="Due Thursday"
                    icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
                />
                <StatCard
                    title="Paid This Week"
                    value="$744.00"
                    subtitle="3 of 4 flatmates"
                    icon={<TrendingDown className="w-5 h-5 text-emerald-400" />}
                />
                <StatCard
                    title="Active Flatmates"
                    value="4"
                    subtitle="All active"
                    icon={<Users className="w-5 h-5 text-amber-400" />}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Transactions */}
                <div className="lg:col-span-2 glass rounded-2xl overflow-hidden">
                    <div className="p-5 border-b border-slate-700/50">
                        <h2 className="font-semibold text-lg">Recent Transactions</h2>
                        <p className="text-sm text-slate-400">Latest activity on the flat account</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th>Person</th>
                                    <th className="text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colSpan={4} className="text-center py-12 text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <RefreshCw className="w-8 h-8 text-slate-600" />
                                            <p>No transactions synced yet</p>
                                            <p className="text-xs">Connect to Akahu to sync transactions</p>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Payment Status */}
                <div className="glass rounded-2xl overflow-hidden">
                    <div className="p-5 border-b border-slate-700/50">
                        <h2 className="font-semibold text-lg">Payment Status</h2>
                        <p className="text-sm text-slate-400">This week&apos;s payments</p>
                    </div>
                    <div className="p-5 space-y-4">
                        {/* Placeholder payment items */}
                        <div className="text-center py-8 text-slate-500">
                            <Users className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                            <p className="text-sm">Add flatmates to track payments</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin Notice */}
            {isAdmin && (
                <div className="mt-6 glass rounded-2xl p-5">
                    <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-amber-500/20">
                            <Users className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <h3 className="font-medium">Admin Setup Required</h3>
                            <p className="text-sm text-slate-400 mt-1">
                                You need to add flatmates and configure the payment schedule to start tracking.
                                Go to <span className="text-emerald-400">Flatmates</span> to add users, then set up the{" "}
                                <span className="text-emerald-400">Payment Schedule</span>.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
