"use client";

import { useState } from "react";
import { Building2, CreditCard, User, Loader2, Check } from "lucide-react";
import { updateMySettingsAction } from "@/lib/actions";
import { useRouter } from "next/navigation";

interface SettingsFormProps {
    initialValues: {
        bankAccountPattern: string | null;
        cardSuffix: string | null;
        matchingName: string | null;
    };
}

export function SettingsForm({ initialValues }: SettingsFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        const formData = new FormData(e.currentTarget);
        const result = await updateMySettingsAction(formData);

        if (result.error) {
            setError(result.error);
        } else {
            setSuccess(true);
            router.refresh();
            setTimeout(() => setSuccess(false), 3000);
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Bank Account Pattern */}
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                    Bank Account Number
                </label>
                <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        name="bankAccountPattern"
                        defaultValue={initialValues.bankAccountPattern || ""}
                        placeholder="12-3456-7890123-00"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
                    />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                    Used to match your rent payments from this account
                </p>
            </div>

            {/* Card Suffix */}
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                    Card Suffix (last 4 digits)
                </label>
                <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        name="cardSuffix"
                        defaultValue={initialValues.cardSuffix || ""}
                        maxLength={4}
                        placeholder="8423"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
                    />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                    Used to match expense card transactions made with your card
                </p>
            </div>

            {/* Matching Name */}
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                    Matching Name Pattern
                </label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        name="matchingName"
                        defaultValue={initialValues.matchingName || ""}
                        placeholder="READER T A"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
                    />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                    Alternative name pattern to match in transaction descriptions
                </p>
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
                    {error}
                </div>
            )}

            {success && (
                <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-sm flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Settings saved successfully
                </div>
            )}

            <div className="pt-2">
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        "Save Settings"
                    )}
                </button>
            </div>
        </form>
    );
}
