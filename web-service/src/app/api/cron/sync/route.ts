import { NextResponse } from "next/server";
import { syncTransactions, triggerManualRefresh } from "@/lib/sync";

// This endpoint should be called by a cron job every ~1.5 hours
// Example: Use a cron service or a Docker-based scheduler
// The endpoint is protected by a secret token

export async function GET(request: Request) {
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET;

    if (!expectedToken) {
        console.error("CRON_SECRET not configured");
        return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    if (authHeader !== `Bearer ${expectedToken}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Trigger a manual refresh of Akahu data
        const refreshResult = await triggerManualRefresh();

        // If refresh was successful (or rate limited but we still want to sync cached data)
        // Sync the transactions from Akahu's cache to our database
        const syncResult = await syncTransactions();

        return NextResponse.json({
            refresh: refreshResult,
            sync: syncResult,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Cron sync failed:", error);
        return NextResponse.json({ error: "Sync failed" }, { status: 500 });
    }
}
