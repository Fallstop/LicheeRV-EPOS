"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { TransactionDetailModal } from "./TransactionDetailModal";
import { TransactionRow, type TransactionRowData } from "./TransactionRow";
import type { Transaction as TransactionType } from "@/lib/db/schema";

interface RecentTransactionsProps {
    transactions: (TransactionType & { matchedUserName?: string | null })[];
    emptyMessage?: string;
    emptySubMessage?: string;
}

export function RecentTransactions({ 
    transactions, 
    emptyMessage = "No transactions yet",
    emptySubMessage = "Sync to fetch transactions"
}: RecentTransactionsProps) {
    const [selectedTransaction, setSelectedTransaction] = useState<(TransactionType & { matchedUserName?: string | null }) | null>(null);

    return (
        <>
            <div className="overflow-x-auto">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th className="pr-0!">Date</th>
                            <th className="px-0!"></th>
                            <th>Description</th>
                            <th className="text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center py-12 text-slate-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <RefreshCw className="w-8 h-8 text-slate-600" />
                                        <p>{emptyMessage}</p>
                                        {emptySubMessage && (
                                            <p className="text-xs">{emptySubMessage}</p>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            transactions.map((tx) => (
                                <TransactionRow
                                    key={tx.id}
                                    transaction={tx as TransactionRowData}
                                    onClick={() => setSelectedTransaction(tx)}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {selectedTransaction && (
                <TransactionDetailModal
                    transaction={selectedTransaction}
                    onClose={() => setSelectedTransaction(null)}
                />
            )}
        </>
    );
}
