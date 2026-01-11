import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { desc, sql } from "drizzle-orm";
import { Search, Filter, RefreshCw, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { SyncButton } from "@/components/SyncButton";
import { getLastSyncTime, canTriggerManualRefresh } from "@/lib/sync";
import { formatDistanceToNow } from "date-fns";

export default async function TransactionsPage() {
    const session = await auth();
    const isAdmin = session?.user?.role === "admin";

    // Fetch transactions
    const txs = await db.select().from(transactions).orderBy(desc(transactions.date)).limit(100);

    // Get sync status
    const lastSyncTime = await getLastSyncTime();
    const { canRefresh, nextRefreshAt } = await canTriggerManualRefresh();

    // Calculate stats
    const stats = await db
        .select({
            totalIn: sql<number>`sum(case when amount > 0 then amount else 0 end)`,
            totalOut: sql<number>`sum(case when amount < 0 then amount else 0 end)`,
        })
        .from(transactions);

    const totalIn = stats[0]?.totalIn ?? 0;
    const totalOut = Math.abs(stats[0]?.totalOut ?? 0);

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Transactions</h1>
                    <p className="text-slate-400 mt-1">
                        {lastSyncTime
                            ? `Last synced ${formatDistanceToNow(lastSyncTime, { addSuffix: true })}`
                            : "Not synced yet - click Sync to fetch transactions"}
                    </p>
                </div>
                <SyncButton
                    isAdmin={isAdmin}
                    lastSyncTime={lastSyncTime}
                    canRefresh={canRefresh}
                    nextRefreshAt={nextRefreshAt}
                />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="glass rounded-xl p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                        <ArrowDownRight className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">Total Money In</p>
                        <p className="text-xl font-bold text-emerald-400">${totalIn.toFixed(2)}</p>
                    </div>
                </div>
                <div className="glass rounded-xl p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-rose-500/20">
                        <ArrowUpRight className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">Total Money Out</p>
                        <p className="text-xl font-bold text-rose-400">${totalOut.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search transactions..."
                        className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                    />
                </div>
            </div>

            {/* Transactions Table */}
            <div className="glass rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th className="w-[120px]">Date</th>
                                <th>Description</th>
                                <th>Category</th>
                                <th>Match</th>
                                <th className="text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {txs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <RefreshCw className="w-8 h-8 text-slate-600" />
                                            <p>No transactions found</p>
                                            <p className="text-xs">Click the Sync button to fetch transactions from Akahu</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                txs.map((tx) => (
                                    <tr key={tx.id}>
                                        <td className="text-slate-400">
                                            {new Date(tx.date).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <div className="font-medium text-slate-200">{tx.description}</div>
                                            {tx.merchant && (
                                                <div className="text-xs text-slate-500">{tx.merchant}</div>
                                            )}
                                        </td>
                                        <td>
                                            {tx.category && (
                                                <span className="badge badge-neutral">{tx.category}</span>
                                            )}
                                        </td>
                                        <td>
                                            {tx.matchedUserId ? (
                                                <span className="badge badge-success">Matched</span>
                                            ) : (
                                                <span className="text-slate-600 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className={`text-right font-mono font-medium ${tx.amount > 0 ? "amount-positive" : "amount-negative"}`}>
                                            {tx.amount > 0 ? "+" : ""}
                                            ${Math.abs(tx.amount).toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {txs.length > 0 && (
                <p className="text-center text-slate-500 text-sm mt-4">
                    Showing {txs.length} most recent transactions
                </p>
            )}
        </div>
    );
}
