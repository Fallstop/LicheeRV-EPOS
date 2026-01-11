import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { transactions, users } from "@/lib/db/schema";
import { desc, sql, ne } from "drizzle-orm";
import { DollarSign, TrendingUp, TrendingDown, Users, RefreshCw, ArrowRight } from "lucide-react";
import { SyncButton } from "@/components/SyncButton";
import { getLastSyncTime, canTriggerManualRefresh } from "@/lib/sync";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

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

    // Get sync status
    const lastSyncTime = await getLastSyncTime();
    const { canRefresh, nextRefreshAt } = await canTriggerManualRefresh();

    // Fetch recent transactions
    const recentTxs = await db.select().from(transactions).orderBy(desc(transactions.date)).limit(5);

    // Get stats
    const stats = await db
        .select({
            totalIn: sql<number>`sum(case when amount > 0 then amount else 0 end)`,
            totalOut: sql<number>`sum(case when amount < 0 then amount else 0 end)`,
            count: sql<number>`count(*)`,
        })
        .from(transactions);

    const totalIn = stats[0]?.totalIn ?? 0;
    const totalOut = Math.abs(stats[0]?.totalOut ?? 0);
    const transactionCount = stats[0]?.count ?? 0;

    // Get flatmate count
    const flatmateCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(ne(users.role, "admin"));

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Welcome back, {session?.user?.name?.split(" ")[0]}</h1>
                    <p className="text-slate-400 mt-1">
                        {lastSyncTime
                            ? `Last synced ${formatDistanceToNow(lastSyncTime, { addSuffix: true })}`
                            : "Not synced yet - sync transactions to get started"}
                    </p>
                </div>
                <SyncButton
                    isAdmin={isAdmin}
                    lastSyncTime={lastSyncTime}
                    canRefresh={canRefresh}
                    nextRefreshAt={nextRefreshAt}
                />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    title="Total Money In"
                    value={`$${totalIn.toFixed(2)}`}
                    subtitle={`${transactionCount} transactions`}
                    icon={<DollarSign className="w-5 h-5 text-teal-400" />}
                />
                <StatCard
                    title="Total Money Out"
                    value={`$${totalOut.toFixed(2)}`}
                    subtitle="All time"
                    icon={<TrendingDown className="w-5 h-5 text-rose-400" />}
                />
                <StatCard
                    title="Net Balance"
                    value={`$${(totalIn - totalOut).toFixed(2)}`}
                    subtitle="In - Out"
                    icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
                />
                <StatCard
                    title="Active Flatmates"
                    value={String(flatmateCount[0]?.count ?? 0)}
                    subtitle="Configured"
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
                                    <th className="text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTxs.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="text-center py-12 text-slate-500">
                                            <div className="flex flex-col items-center gap-2">
                                                <RefreshCw className="w-8 h-8 text-slate-600" />
                                                <p>No transactions synced yet</p>
                                                <p className="text-xs">Click Sync to fetch transactions from Akahu</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    recentTxs.map((tx) => (
                                        <tr key={tx.id}>
                                            <td className="text-slate-400">
                                                {new Date(tx.date).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <div className="font-medium text-slate-200 truncate max-w-[200px]">
                                                    {tx.description}
                                                </div>
                                                {tx.merchant && (
                                                    <div className="text-xs text-slate-500">{tx.merchant}</div>
                                                )}
                                            </td>
                                            <td className={`text-right font-mono font-medium ${tx.amount > 0 ? "amount-positive" : "amount-negative"}`}>
                                                {tx.amount > 0 ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {recentTxs.length > 0 && (
                        <div className="p-4 border-t border-slate-700/50">
                            <Link
                                href="/transactions"
                                className="flex items-center justify-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                            >
                                View all transactions
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    )}
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
