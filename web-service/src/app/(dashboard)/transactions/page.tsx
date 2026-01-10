import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { RefreshCw, Search, Filter } from "lucide-react";

export default async function TransactionsPage() {
    const session = await auth();

    // Fetch transactions
    const txs = await db.select().from(transactions).orderBy(desc(transactions.date)).limit(50);

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Transactions</h1>
                    <p className="text-slate-400 mt-1">View and manage all flat account activity</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-400 hover:text-white">
                        <Filter className="w-5 h-5" />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-400 hover:text-white">
                        <RefreshCw className="w-4 h-4" />
                        <span className="hidden sm:inline">Sync</span>
                    </button>
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
        </div>
    );
}
