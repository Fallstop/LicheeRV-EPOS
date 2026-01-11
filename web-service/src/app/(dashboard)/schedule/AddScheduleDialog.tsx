"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { addScheduleAction } from "@/lib/actions";
import { format, previousSaturday, isSaturday } from "date-fns";
import { WeekDatePicker } from "@/components/WeekDatePicker";

interface AddScheduleDialogProps {
    flatmates: Array<{ id: string; name: string | null; email: string }>;
    defaultUserId?: string;
    defaultStartDate?: string;
    defaultWeeklyAmount?: number;
    onClose?: () => void;
    isOpen?: boolean;
}

// Get the nearest Saturday for default start date
function getDefaultSaturday(): string {
    const today = new Date();
    const saturday = isSaturday(today) ? today : previousSaturday(today);
    return format(saturday, "yyyy-MM-dd");
}

export function AddScheduleDialog({ 
    flatmates, 
    defaultUserId, 
    defaultStartDate, 
    defaultWeeklyAmount,
    onClose,
    isOpen: controlledOpen 
}: AddScheduleDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isControlled = controlledOpen !== undefined;
    const isOpen = isControlled ? controlledOpen : internalOpen;
    
    const handleClose = () => {
        if (isControlled && onClose) {
            onClose();
        } else {
            setInternalOpen(false);
        }
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const result = await addScheduleAction(formData);

        if (result.error) {
            setError(result.error);
            setIsSubmitting(false);
        } else {
            handleClose();
            setIsSubmitting(false);
        }
    };

    if (!isOpen && !isControlled) {
        return (
            <button
                onClick={() => setInternalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
            >
                <Plus className="w-4 h-4" />
                <span>Add Schedule</span>
            </button>
        );
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />
            <div className="relative w-full max-w-md glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Add Payment Schedule</h2>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            Flatmate *
                        </label>
                        <select
                            name="userId"
                            required
                            defaultValue={defaultUserId || ""}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        >
                            <option value="">Select a flatmate</option>
                            {flatmates.map((f) => (
                                <option key={f.id} value={f.id}>
                                    {f.name ?? f.email}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            Weekly Amount ($) *
                        </label>
                        <input
                            type="number"
                            name="weeklyAmount"
                            required
                            min="0"
                            step="0.01"
                            defaultValue={defaultWeeklyAmount}
                            placeholder="e.g., 250.00"
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <WeekDatePicker
                            name="startDate"
                            label="Start Date"
                            weekAlign="start"
                            required
                            defaultValue={defaultStartDate || getDefaultSaturday()}
                            placeholder="Select Saturday"
                        />
                        <div>
                            <WeekDatePicker
                                name="endDate"
                                label="End Date"
                                weekAlign="end"
                                placeholder="Select Friday"
                            />
                            <p className="text-xs text-slate-500 mt-1">Leave empty for ongoing</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            Notes
                        </label>
                        <input
                            type="text"
                            name="notes"
                            placeholder="e.g., Summer rate, Standard rate"
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-rose-500/20 border border-rose-500/50 rounded-lg">
                            <p className="text-sm text-rose-400">{error}</p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                        >
                            {isSubmitting ? "Adding..." : "Add Schedule"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
