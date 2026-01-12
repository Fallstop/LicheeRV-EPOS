"use client";

import { X, Calendar, DollarSign, User, FileText } from "lucide-react";
import { PaymentSchedule } from "@/lib/db/schema";
import { format } from "date-fns";

interface ViewScheduleDialogProps {
    schedule: PaymentSchedule;
    flatmates: Array<{ id: string; name: string | null; email: string }>;
    onClose: () => void;
}

export function ViewScheduleDialog({ schedule, flatmates, onClose }: ViewScheduleDialogProps) {
    const flatmate = flatmates.find((f) => f.id === schedule.userId);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative w-full max-w-md glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Schedule Details</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                        <div className="p-2 rounded-lg bg-slate-600">
                            <User className="w-5 h-5 text-slate-300" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">Flatmate</p>
                            <p className="font-medium">{flatmate?.name ?? flatmate?.email ?? "Unknown"}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                        <div className="p-2 rounded-lg bg-emerald-600/30">
                            <DollarSign className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">Weekly Amount</p>
                            <p className="font-medium text-emerald-400">${schedule.weeklyAmount.toFixed(2)}/week</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                            <div className="p-2 rounded-lg bg-blue-600/30">
                                <Calendar className="w-4 h-4 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Start Date</p>
                                <p className="font-medium text-sm">{format(schedule.startDate, "d MMM yyyy")}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                            <div className="p-2 rounded-lg bg-purple-600/30">
                                <Calendar className="w-4 h-4 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">End Date</p>
                                <p className="font-medium text-sm">
                                    {schedule.endDate ? format(schedule.endDate, "d MMM yyyy") : "Ongoing"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {schedule.notes && (
                        <div className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-lg">
                            <div className="p-2 rounded-lg bg-slate-600">
                                <FileText className="w-5 h-5 text-slate-300" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Notes</p>
                                <p className="font-medium">{schedule.notes}</p>
                            </div>
                        </div>
                    )}
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-6 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    );
}
