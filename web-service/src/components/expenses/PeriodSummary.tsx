import type { ExpenseCategorySummary } from "@/lib/expense-calculations";

interface PeriodSummaryProps {
    summaries: ExpenseCategorySummary[];
}

export function PeriodSummary({ summaries }: PeriodSummaryProps) {
    const total = summaries.reduce((sum, s) => sum + s.totalAmount, 0);

    return (
        <div className="glass rounded-2xl p-5">
            <h3 className="font-semibold mb-4">Period Summary</h3>
            <div className="space-y-3">
                {summaries.map((summary) => (
                    <div
                        key={summary.category.id}
                        className="flex items-center justify-between"
                    >
                        <span className="text-slate-400">{summary.category.name}</span>
                        <span className="font-medium">
                            ${summary.totalAmount.toFixed(2)}
                        </span>
                    </div>
                ))}
                <div className="pt-3 mt-3 border-t border-slate-700/50 flex items-center justify-between">
                    <span className="font-medium">Total</span>
                    <span className="text-lg font-bold text-emerald-400">
                        ${total.toFixed(2)}
                    </span>
                </div>
            </div>
        </div>
    );
}
