import {
    Zap,
    ShoppingCart,
    Fuel,
    Wifi,
    Car,
    Home,
    UtensilsCrossed,
    Tag,
    LucideIcon,
} from "lucide-react";

// Map icon names to Lucide components
export const expenseIconMap: Record<string, LucideIcon> = {
    Zap,
    ShoppingCart,
    Fuel,
    Wifi,
    Car,
    Home,
    UtensilsCrossed,
    Tag,
};

// Available icon options for forms
export const availableIcons = Object.keys(expenseIconMap);

// Available color options for forms
export const availableColors = [
    "amber",
    "emerald",
    "blue",
    "purple",
    "rose",
    "cyan",
    "slate",
    "orange",
    "teal",
    "indigo",
    "pink",
] as const;

export type ExpenseColor = (typeof availableColors)[number];

// Map color names to Tailwind classes
export const colorClassMap: Record<
    string,
    { bg: string; text: string; border: string; ring: string }
> = {
    amber: {
        bg: "bg-amber-500/20",
        text: "text-amber-400",
        border: "border-amber-500/30",
        ring: "ring-amber-500/50",
    },
    emerald: {
        bg: "bg-emerald-500/20",
        text: "text-emerald-400",
        border: "border-emerald-500/30",
        ring: "ring-emerald-500/50",
    },
    blue: {
        bg: "bg-blue-500/20",
        text: "text-blue-400",
        border: "border-blue-500/30",
        ring: "ring-blue-500/50",
    },
    purple: {
        bg: "bg-purple-500/20",
        text: "text-purple-400",
        border: "border-purple-500/30",
        ring: "ring-purple-500/50",
    },
    rose: {
        bg: "bg-rose-500/20",
        text: "text-rose-400",
        border: "border-rose-500/30",
        ring: "ring-rose-500/50",
    },
    cyan: {
        bg: "bg-cyan-500/20",
        text: "text-cyan-400",
        border: "border-cyan-500/30",
        ring: "ring-cyan-500/50",
    },
    slate: {
        bg: "bg-slate-500/20",
        text: "text-slate-400",
        border: "border-slate-500/30",
        ring: "ring-slate-500/50",
    },
    orange: {
        bg: "bg-orange-500/20",
        text: "text-orange-400",
        border: "border-orange-500/30",
        ring: "ring-orange-500/50",
    },
    teal: {
        bg: "bg-teal-500/20",
        text: "text-teal-400",
        border: "border-teal-500/30",
        ring: "ring-teal-500/50",
    },
    indigo: {
        bg: "bg-indigo-500/20",
        text: "text-indigo-400",
        border: "border-indigo-500/30",
        ring: "ring-indigo-500/50",
    },
    pink: {
        bg: "bg-pink-500/20",
        text: "text-pink-400",
        border: "border-pink-500/30",
        ring: "ring-pink-500/50",
    },
};

// Map color names to hex values (for charts)
export const colorHexMap: Record<string, string> = {
    amber: "#f59e0b",
    emerald: "#10b981",
    blue: "#3b82f6",
    purple: "#8b5cf6",
    rose: "#f43f5e",
    cyan: "#06b6d4",
    slate: "#64748b",
    orange: "#f97316",
    teal: "#14b8a6",
    indigo: "#6366f1",
    pink: "#ec4899",
};

// Helper to get icon component with fallback
export function getExpenseIcon(iconName: string): LucideIcon {
    return expenseIconMap[iconName] || Tag;
}

// Helper to get color classes with fallback
export function getColorClasses(colorName: string) {
    return colorClassMap[colorName] || colorClassMap.slate;
}

// Helper to get hex color with fallback
export function getColorHex(colorName: string): string {
    return colorHexMap[colorName] || colorHexMap.slate;
}
