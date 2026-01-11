import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncTransactions, triggerManualRefresh, canTriggerManualRefresh, getLastSyncTime } from "@/lib/sync";

export async function POST(request: Request) {
    const session = await auth();
    
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await request.json();

    if (action === "sync") {
        // Sync transactions from Akahu cache
        const result = await syncTransactions();
        return NextResponse.json(result);
    }

    if (action === "refresh") {
        // Only admin can trigger manual refresh (rate limited)
        if (session.user.role !== "admin") {
            return NextResponse.json({ error: "Only admins can trigger manual refresh" }, { status: 403 });
        }

        const result = await triggerManualRefresh();
        return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function GET() {
    const session = await auth();

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lastSyncTime = await getLastSyncTime();
    const { canRefresh, nextRefreshAt } = await canTriggerManualRefresh();

    return NextResponse.json({
        lastSyncTime,
        canRefresh,
        nextRefreshAt,
    });
}
