"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Search, Filter, Download, ChevronDown, ChevronUp, X, RefreshCw, ArrowDownRight, ArrowUpRight, CreditCard } from "lucide-react";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { startOfDay, isSaturday, previousSaturday } from "date-fns";
import { TransactionDetailModal } from "./TransactionDetailModal";
import { isRentPayment } from "@/lib/utils";
import type { Transaction as TransactionType, User } from "@/lib/db/schema";
import Image from "next/image";

interface TransactionListProps {
    transactions: (TransactionType & { matchedUserName?: string | null })[];
    flatmates: Pick<User, "id" | "name" | "email">[];
    analysisStartDate?: Date | null;
}

const TIMEZONE = "Pacific/Auckland";
const ROW_HEIGHT = 72;

type ListItem = 
    | { type: "transaction"; tx: TransactionType & { matchedUserName?: string | null }; index: number }
    | { type: "week-header"; weekStart: Date }
    | { type: "analysis-boundary"; date: Date };

function getWeekStartSaturday(date: Date): Date {
    const zonedDate = toZonedTime(date, TIMEZONE);
    const startOfDayZoned = startOfDay(zonedDate);
    
    if (isSaturday(zonedDate)) {
        return startOfDayZoned;
    }
    return previousSaturday(startOfDayZoned);
}

function crossesWeekBoundary(date1: Date, date2: Date): Date | null {
    const weekStart1 = getWeekStartSaturday(date1);
    const weekStart2 = getWeekStartSaturday(date2);
    
    if (weekStart1.getTime() !== weekStart2.getTime()) {
        return weekStart1.getTime() > weekStart2.getTime() ? weekStart1 : weekStart2;
    }
    return null;
}

function useIsDesktop() {
    const [isDesktop, setIsDesktop] = useState(false);
    
    useEffect(() => {
        const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
        checkDesktop();
        window.addEventListener("resize", checkDesktop);
        return () => window.removeEventListener("resize", checkDesktop);
    }, []);
    
    return isDesktop;
}

export function TransactionList({ transactions, flatmates, analysisStartDate }: TransactionListProps) {
    const router = useRouter();
    const parentRef = useRef<HTMLDivElement>(null);
    const isDesktop = useIsDesktop();
    const [selectedTransaction, setSelectedTransaction] = useState<(TransactionType & { matchedUserName?: string | null }) | null>(null);
    
    // Filters
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [selectedFlatmate, setSelectedFlatmate] = useState<string>("all");
    const [amountMin, setAmountMin] = useState("");
    const [amountMax, setAmountMax] = useState("");
    const [amountType, setAmountType] = useState<"all" | "in" | "out">("all");

    // Filter transactions
    const filteredTransactions = useMemo(() => {
        return transactions.filter((tx) => {
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesSearch = 
                    tx.description.toLowerCase().includes(query) ||
                    tx.merchant?.toLowerCase().includes(query) ||
                    tx.category?.toLowerCase().includes(query);
                if (!matchesSearch) return false;
            }

            if (dateFrom) {
                const fromDate = new Date(dateFrom);
                if (tx.date < fromDate) return false;
            }
            if (dateTo) {
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                if (tx.date > toDate) return false;
            }

            if (selectedFlatmate !== "all") {
                if (selectedFlatmate === "unmatched") {
                    if (tx.matchedUserId) return false;
                } else {
                    if (tx.matchedUserId !== selectedFlatmate) return false;
                }
            }

            if (amountType === "in" && tx.amount <= 0) return false;
            if (amountType === "out" && tx.amount >= 0) return false;

            const absAmount = Math.abs(tx.amount);
            if (amountMin && absAmount < parseFloat(amountMin)) return false;
            if (amountMax && absAmount > parseFloat(amountMax)) return false;

            return true;
        });
    }, [transactions, searchQuery, dateFrom, dateTo, selectedFlatmate, amountMin, amountMax, amountType]);

    // Build list items with week headers and analysis boundary inserted
    const listItems = useMemo((): ListItem[] => {
        const items: ListItem[] = [];
        let analysisLineInserted = false;
        
        for (let i = 0; i < filteredTransactions.length; i++) {
            const tx = filteredTransactions[i];
            const prevTx = i > 0 ? filteredTransactions[i - 1] : null;
            
            // Check for analysis start date boundary (transactions are sorted desc)
            if (analysisStartDate && !analysisLineInserted) {
                if (prevTx && prevTx.date >= analysisStartDate && tx.date < analysisStartDate) {
                    items.push({ type: "analysis-boundary", date: analysisStartDate });
                    analysisLineInserted = true;
                }
            }
            
            const weekBoundary = prevTx ? crossesWeekBoundary(prevTx.date, tx.date) : null;
            
            if (weekBoundary) {
                items.push({ type: "week-header", weekStart: weekBoundary });
            }
            items.push({ type: "transaction", tx, index: i });
        }
        
        return items;
    }, [filteredTransactions, analysisStartDate]);

    // Virtual list (only used on desktop)
    const virtualizer = useVirtualizer({
        count: isDesktop ? listItems.length : 0,
        getScrollElement: () => parentRef.current,
        estimateSize: (index) => {
            const item = listItems[index];
            return item.type === "week-header" || item.type === "analysis-boundary" ? 40 : ROW_HEIGHT;
        },
        overscan: 10,
        enabled: isDesktop,
    });

    // Export to CSV
    const exportCSV = useCallback(() => {
        const headers = ["Date", "Time", "Description", "Merchant", "Category", "Amount", "Type", "Matched To", "Match Type"];
        const rows = filteredTransactions.map(tx => [
            formatInTimeZone(tx.date, TIMEZONE, "yyyy-MM-dd"),
            formatInTimeZone(tx.date, TIMEZONE, "HH:mm:ss"),
            `"${tx.description.replace(/"/g, '""')}"`,
            `"${(tx.merchant || "").replace(/"/g, '""')}"`,
            `"${(tx.category || "").replace(/"/g, '""')}"`,
            tx.amount.toFixed(2),
            tx.amount > 0 ? "Credit" : "Debit",
            `"${(tx.matchedUserName || "").replace(/"/g, '""')}"`,
            `"${(tx.matchType || "").replace(/"/g, '""')}"`,
        ]);

        const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `transactions-${formatInTimeZone(new Date(), TIMEZONE, "yyyy-MM-dd")}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }, [filteredTransactions]);

    // Clear filters
    const clearFilters = useCallback(() => {
        setSearchQuery("");
        setDateFrom("");
        setDateTo("");
        setSelectedFlatmate("all");
        setAmountMin("");
        setAmountMax("");
        setAmountType("all");
    }, []);

    const hasActiveFilters = searchQuery || dateFrom || dateTo || selectedFlatmate !== "all" || amountMin || amountMax || amountType !== "all";

    // Calculate stats for filtered transactions
    const stats = useMemo(() => {
        const totalIn = filteredTransactions.filter(tx => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0);
        const totalOut = filteredTransactions.filter(tx => tx.amount < 0).reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        return { totalIn, totalOut, count: filteredTransactions.length, totalCount: transactions.length };
    }, [filteredTransactions, transactions.length]);

    return (
        <div className="w-full lg:flex lg:flex-col lg:flex-1 lg:min-h-0">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 lg:shrink-0">
                <div className="glass rounded-xl p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                        <ArrowDownRight className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">Money In</p>
                        <p className="text-xl font-bold text-emerald-400">${stats.totalIn.toFixed(2)}</p>
                    </div>
                </div>
                <div className="glass rounded-xl p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-rose-500/20">
                        <ArrowUpRight className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">Money Out</p>
                        <p className="text-xl font-bold text-rose-400">${stats.totalOut.toFixed(2)}</p>
                    </div>
                </div>
                <div className="glass rounded-xl p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-500/20">
                        <Filter className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">Showing</p>
                        <p className="text-xl font-bold">{stats.count.toLocaleString()} of {stats.totalCount.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="mb-6 space-y-4 lg:shrink-0">
                <div className="flex gap-3">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                        />
                    </div>

                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                            showFilters || hasActiveFilters
                                ? "bg-emerald-600/20 border-emerald-500/50 text-emerald-400"
                                : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                        }`}
                    >
                        <Filter className="w-5 h-5" />
                        <span className="hidden sm:inline">Filters</span>
                        {hasActiveFilters && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        )}
                        {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {/* Export */}
                    <button
                        onClick={exportCSV}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-colors"
                    >
                        <Download className="w-5 h-5" />
                        <span className="hidden sm:inline">Export CSV</span>
                    </button>
                </div>

                {/* Expanded Filters */}
                {showFilters && (
                    <div className="glass rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Date Range */}
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">From Date</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm focus:border-emerald-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">To Date</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm focus:border-emerald-500 outline-none"
                                />
                            </div>

                            {/* Flatmate Filter */}
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Flatmate</label>
                                <select
                                    value={selectedFlatmate}
                                    onChange={(e) => setSelectedFlatmate(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm focus:border-emerald-500 outline-none"
                                >
                                    <option value="all">All</option>
                                    <option value="unmatched">Unmatched</option>
                                    {flatmates.map(f => (
                                        <option key={f.id} value={f.id}>
                                            {f.name || f.email}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Amount Type */}
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Type</label>
                                <select
                                    value={amountType}
                                    onChange={(e) => setAmountType(e.target.value as "all" | "in" | "out")}
                                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm focus:border-emerald-500 outline-none"
                                >
                                    <option value="all">All</option>
                                    <option value="in">Money In</option>
                                    <option value="out">Money Out</option>
                                </select>
                            </div>

                            {/* Amount Range */}
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Min Amount</label>
                                <input
                                    type="number"
                                    placeholder="$0"
                                    value={amountMin}
                                    onChange={(e) => setAmountMin(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm focus:border-emerald-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Max Amount</label>
                                <input
                                    type="number"
                                    placeholder="$∞"
                                    value={amountMax}
                                    onChange={(e) => setAmountMax(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm focus:border-emerald-500 outline-none"
                                />
                            </div>

                            {/* Clear Filters */}
                            <div className="flex items-end">
                                <button
                                    onClick={clearFilters}
                                    disabled={!hasActiveFilters}
                                    className="w-full px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Transaction List - Virtual on desktop, full render on mobile */}
            <div className="glass rounded-2xl overflow-hidden lg:flex lg:flex-col lg:flex-1 lg:min-h-0">
                {/* Header - Desktop only */}
                <div className="hidden lg:grid grid-cols-[120px_32px_1fr_240px_150px_100px] gap-2 px-4 py-3 border-b border-slate-700/50 text-xs font-medium text-slate-400 uppercase tracking-wider lg:shrink-0">
                    <div>Date & Time</div>
                    <div></div>
                    <div>Description</div>
                    <div>Category</div>
                    <div>Match</div>
                    <div className="text-right">Amount</div>
                </div>
                {/* Mobile header - no header needed for card-style layout */}
                
                {/* List Container */}
                <div
                    ref={parentRef}
                    className={isDesktop ? "flex-1 overflow-auto min-h-0" : ""}
                >
                    {filteredTransactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                            <RefreshCw className="w-8 h-8 text-slate-600 mb-2" />
                            <p>No transactions found</p>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="text-emerald-400 hover:text-emerald-300 text-sm mt-2"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    ) : isDesktop ? (
                        /* Desktop: Virtual scrolling */
                        <div
                            style={{
                                height: `${virtualizer.getTotalSize()}px`,
                                width: "100%",
                                position: "relative",
                            }}
                        >
                            {virtualizer.getVirtualItems().map((virtualRow) => {
                                const item = listItems[virtualRow.index];
                                
                                if (item.type === "analysis-boundary") {
                                    return (
                                        <div
                                            key="analysis-boundary"
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                width: "100%",
                                                height: `${virtualRow.size}px`,
                                                transform: `translateY(${virtualRow.start}px)`,
                                            }}
                                            className="flex items-center gap-3 px-4"
                                        >
                                            <div className="flex-1 h-0.5 bg-emerald-500" />
                                            <span className="text-xs font-semibold text-emerald-400 whitespace-nowrap bg-emerald-500/20 px-2 py-0.5 rounded">
                                                Analysis Start — {formatInTimeZone(item.date, TIMEZONE, "d MMM yyyy")}
                                            </span>
                                            <div className="flex-1 h-0.5 bg-emerald-500" />
                                        </div>
                                    );
                                }
                                
                                if (item.type === "week-header") {
                                    return (
                                        <div
                                            key={`week-${item.weekStart.getTime()}`}
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                width: "100%",
                                                height: `${virtualRow.size}px`,
                                                transform: `translateY(${virtualRow.start}px)`,
                                            }}
                                            className="flex items-center gap-3 px-4"
                                        >
                                            <div className="flex-1 h-px bg-linear-to-r from-transparent via-amber-500/50 to-transparent" />
                                            <span className="text-xs font-medium text-amber-400/80 whitespace-nowrap">
                                                Week of {formatInTimeZone(item.weekStart, TIMEZONE, "d MMM")}
                                            </span>
                                            <div className="flex-1 h-px bg-linear-to-r from-transparent via-amber-500/50 to-transparent" />
                                        </div>
                                    );
                                }
                                
                                const tx = item.tx;
                                return (
                                    <div
                                        key={tx.id}
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            width: "100%",
                                            height: `${virtualRow.size}px`,
                                            transform: `translateY(${virtualRow.start}px)`,
                                        }}
                                        className="grid grid-cols-[120px_32px_1fr_240px_150px_100px] gap-2 px-4 items-center hover:bg-slate-800/30 cursor-pointer border-b border-slate-700/30"
                                        onClick={() => setSelectedTransaction(tx)}
                                    >
                                        <div className="text-slate-400">
                                            <div className="text-slate-200 text-sm">
                                                {formatInTimeZone(tx.date, TIMEZONE, "d MMM yyyy")}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {formatInTimeZone(tx.date, TIMEZONE, "h:mm a")}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-center">
                                            {tx.merchantLogo && (
                                                <Image
                                                    src={tx.merchantLogo}
                                                    alt=""
                                                    width={24}
                                                    height={24}
                                                    className="rounded shrink-0 grayscale-100 brightness-75 contrast-200 invert mix-blend-color-dodge"
                                                    unoptimized
                                                    referrerPolicy="no-referrer"
                                                />
                                            )}
                                        </div>
                                        
                                        <div className="min-w-0">
                                            <div className="font-medium text-slate-200 line-clamp-1 text-sm">{tx.description}</div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {tx.merchant && (
                                                    <span className="text-xs text-slate-500 line-clamp-1">{tx.merchant}</span>
                                                )}
                                                {tx.cardSuffix && (
                                                    <span className="inline-flex items-center gap-1 text-xs text-purple-400">
                                                        <CreditCard className="w-3 h-3" />
                                                        {tx.cardSuffix}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div>
                                            {tx.category && (
                                                <span className="badge badge-neutral text-xs">{tx.category}</span>
                                            )}
                                        </div>
                                        
                                        <div>
                                            {tx.matchedUserId ? (
                                                <span className={`badge text-xs ${isRentPayment(tx.matchType) ? "badge-success" : "badge-neutral"}`}>
                                                    {tx.matchedUserName || "Matched"}
                                                </span>
                                            ) : (
                                                <span className="text-slate-600 text-xs">-</span>
                                            )}
                                        </div>
                                        
                                        <div className={`text-right font-mono font-medium text-sm ${tx.amount > 0 ? "amount-positive" : "amount-negative"}`}>
                                            {tx.amount > 0 ? "+" : ""}
                                            ${Math.abs(tx.amount).toFixed(2)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* Mobile: Full render with page scrolling - card style layout */
                        <div className="divide-y divide-slate-700/30 ">
                            {listItems.map((item) => {
                                if (item.type === "analysis-boundary") {
                                    return (
                                        <div
                                            key="analysis-boundary"
                                            className="flex items-center gap-3 px-4 py-2"
                                        >
                                            <div className="flex-1 h-0.5 bg-emerald-500" />
                                            <span className="text-xs font-semibold text-emerald-400 whitespace-nowrap bg-emerald-500/20 px-2 py-0.5 rounded">
                                                Analysis Start — {formatInTimeZone(item.date, TIMEZONE, "d MMM yyyy")}
                                            </span>
                                            <div className="flex-1 h-0.5 bg-emerald-500" />
                                        </div>
                                    );
                                }
                                
                                if (item.type === "week-header") {
                                    return (
                                        <div
                                            key={`week-${item.weekStart.getTime()}`}
                                            className="flex items-center gap-3 px-4 py-2"
                                        >
                                            <div className="flex-1 h-px bg-linear-to-r from-transparent via-amber-500/50 to-transparent" />
                                            <span className="text-xs font-medium text-amber-400/80 whitespace-nowrap">
                                                Week of {formatInTimeZone(item.weekStart, TIMEZONE, "d MMM")}
                                            </span>
                                            <div className="flex-1 h-px bg-linear-to-r from-transparent via-amber-500/50 to-transparent" />
                                        </div>
                                    );
                                }
                                
                                const tx = item.tx;
                                return (
                                    <div
                                        key={tx.id}
                                        className="px-4 py-3 hover:bg-slate-800/30 cursor-pointer active:bg-slate-800/50"
                                        onClick={() => setSelectedTransaction(tx)}
                                    >
                                        {/* Top row: Date/Time and Amount */}
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs text-slate-500">
                                                {formatInTimeZone(tx.date, TIMEZONE, "d MMM · h:mm a")}
                                            </span>
                                            <span className={`font-mono font-semibold ${tx.amount > 0 ? "amount-positive" : "amount-negative"}`}>
                                                {tx.amount > 0 ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                                            </span>
                                        </div>
                                        
                                        {/* Description */}
                                        <div className="font-medium text-slate-200 truncate">
                                            {tx.description}
                                        </div>
                                        
                                        {/* Bottom row: Merchant and Match badge */}
                                        <div className="flex items-center gap-2 mt-1">
                                            {tx.merchant && (
                                                <span className="text-xs text-slate-500 truncate">{tx.merchant}</span>
                                            )}
                                            {tx.matchedUserId && (
                                                <span className={`badge text-xs shrink-0 ${isRentPayment(tx.matchType) ? "badge-success" : "badge-neutral"}`}>
                                                    {tx.matchedUserName || "Matched"}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {filteredTransactions.length > 0 && (
                <p className="text-center text-slate-500 text-sm mt-6">
                    {stats.count.toLocaleString()} transactions
                </p>
            )}

            {/* Transaction Detail Modal */}
            {selectedTransaction && (
                <TransactionDetailModal
                    transaction={selectedTransaction}
                    onClose={() => setSelectedTransaction(null)}
                    flatmates={flatmates}
                    onUpdate={() => {
                        setSelectedTransaction(null);
                        router.refresh();
                    }}
                />
            )}
        </div>
    );
}
