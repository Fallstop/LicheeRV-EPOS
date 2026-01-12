import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, paymentSchedules, systemState } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Calendar } from "lucide-react";
import { HorizontalTimeline } from "./HorizontalTimeline";
import { AddScheduleDialog } from "./AddScheduleDialog";
import { ExportImportButtons } from "./ExportImportButtons";

export default async function SchedulePage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/auth/signin");
    }

    const isAdmin = session.user.role === "admin";

    // Get all flatmates (including admin)
    const flatmates = await db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
        })
        .from(users)
        .orderBy(asc(users.name));

    // Get all payment schedules, ordered by start date
    const schedules = await db
        .select()
        .from(paymentSchedules)
        .orderBy(asc(paymentSchedules.startDate));

    // Get analysis start date
    const analysisStartSetting = await db
        .select()
        .from(systemState)
        .where(eq(systemState.key, "analysis_start_date"))
        .limit(1);
    const analysisStartDate = analysisStartSetting[0]?.value 
        ? new Date(analysisStartSetting[0].value) 
        : null;

    // Group schedules by user
    const schedulesByUser = new Map<string, typeof schedules>();
    for (const schedule of schedules) {
        const existing = schedulesByUser.get(schedule.userId) ?? [];
        existing.push(schedule);
        schedulesByUser.set(schedule.userId, existing);
    }

    return (
        <div className="max-w-full mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Payment Schedule</h1>
                    <p className="text-slate-400 mt-1">
                        {isAdmin 
                            ? "Configure how much each flatmate contributes per week"
                            : "View the weekly contribution schedule for all flatmates"
                        }
                    </p>
                </div>
                {isAdmin && (
                    <div className="flex items-center gap-3">
                        <ExportImportButtons schedules={schedules} flatmates={flatmates} />
                        <AddScheduleDialog flatmates={flatmates} />
                    </div>
                )}
            </div>

            {isAdmin && (
                <div className="glass rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-teal-500/20">
                            <Calendar className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                            <h3 className="font-medium">How Payment Schedules Work</h3>
                            <p className="text-sm text-slate-400 mt-1">
                                Payment schedules define how much each flatmate should contribute weekly.
                                Payments are due each <span className="text-emerald-400">Thursday</span> (before Friday rent payout).
                                You can create overlapping schedules to handle rate changes (e.g., summer vs winter rates).
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {flatmates.length === 0 ? (
                <div className="glass rounded-xl p-8 text-center">
                    <Calendar className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Flatmates Yet</h3>
                    <p className="text-slate-400 mb-4">
                        {isAdmin 
                            ? "Add flatmates first before creating payment schedules."
                            : "No flatmates have been added yet."
                        }
                    </p>
                    {isAdmin && (
                        <a
                            href="/users"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
                        >
                            Go to Flatmates
                        </a>
                    )}
                </div>
            ) : (
                <HorizontalTimeline 
                    flatmates={flatmates}
                    schedulesByUser={Object.fromEntries(schedulesByUser)}
                    isAdmin={isAdmin}
                    analysisStartDate={analysisStartDate}
                />
            )}
        </div>
    );
}
