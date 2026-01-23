import Link from "next/link";
import { Tag, TrendingUp, TrendingDown } from "lucide-react";
import type { ExpenseCategory } from "@/lib/db/schema";
import { getExpenseIcon, getColorClasses } from "@/lib/expense-ui";

interface ExpenseCategoryCardProps {
    category: ExpenseCategory;
    totalAmount: number;
    transactionCount: number;
    trend?: number;
    isSelected?: boolean;
    href?: string;
    subtitle?: string;
}

export function ExpenseCategoryCard({
    category,
    totalAmount,
    transactionCount,
    trend,
    isSelected,
    href,
    subtitle,
}: ExpenseCategoryCardProps) {
    const IconComponent = getExpenseIcon(category.icon);
    const colors = getColorClasses(category.color);

    const content = (
        <>
            <div className="flex items-start justify-between mb-3">
                <div className={`p-3 rounded-xl ${colors.bg}`}>
                    <IconComponent className={`w-5 h-5 ${colors.text}`} />
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-sm ${trend >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                        {trend >= 0 ? (
                            <TrendingUp className="w-4 h-4" />
                        ) : (
                            <TrendingDown className="w-4 h-4" />
                        )}
                        <span>{Math.abs(trend).toFixed(0)}%</span>
                    </div>
                )}
            </div>

            <h3 className="font-semibold text-lg">{category.name}</h3>
            <p className="text-2xl font-bold mt-1">${totalAmount.toFixed(2)}</p>
            <p className="text-sm text-slate-400 mt-1">
                {subtitle || `${transactionCount} transaction${transactionCount !== 1 ? "s" : ""}`}
            </p>
        </>
    );

    const className = `
        block w-full text-left glass rounded-2xl p-5 card-hover transition-all duration-200
        ${isSelected ? `ring-2 ring-offset-2 ring-offset-slate-900 ${colors.border.replace("border-", "ring-")}` : ""}
    `;

    if (href) {
        return (
            <Link href={href} className={className}>
                {content}
            </Link>
        );
    }

    return <div className={className}>{content}</div>;
}

export function AddCategoryCard() {
    return (
        <div className="w-full h-full min-h-[140px] glass rounded-2xl p-5 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center gap-2 text-slate-400">
            <div className="p-3 rounded-xl bg-slate-700/50">
                <Tag className="w-5 h-5" />
            </div>
            <span className="font-medium text-sm text-center">Use "Add Category" button in Rules Manager below</span>
        </div>
    );
}
