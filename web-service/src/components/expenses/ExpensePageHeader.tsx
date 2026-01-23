import { Receipt } from "lucide-react";

interface ExpensePageHeaderProps {
    title?: string;
    subtitle?: string;
}

export function ExpensePageHeader({
    title = "Flat Expenses",
    subtitle = "Track shared household expenses",
}: ExpensePageHeaderProps) {
    return (
        <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                <Receipt className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
                <h1 className="text-2xl font-bold">{title}</h1>
                <p className="text-slate-400">{subtitle}</p>
            </div>
        </div>
    );
}
