"use server";

import { signOut as nextAuthSignOut, auth } from "@/lib/auth";
import { syncTransactions, triggerManualRefresh, canTriggerManualRefresh, getLastSyncTime } from "@/lib/sync";
import { revalidatePath } from "next/cache";

export async function signOutAction() {
    await nextAuthSignOut({ redirectTo: "/auth/signin" });
}

export async function syncTransactionsAction() {
    console.log("[Action] syncTransactionsAction called");
    const session = await auth();
    if (!session?.user) {
        console.log("[Action] Unauthorized - no session");
        return { error: "Unauthorized" };
    }

    console.log("[Action] Calling syncTransactions...");
    const result = await syncTransactions();
    console.log("[Action] syncTransactions result:", result);
    revalidatePath("/transactions");
    revalidatePath("/");
    return result;
}

export async function triggerRefreshAction() {
    const session = await auth();
    if (!session?.user) {
        return { error: "Unauthorized" };
    }

    if (session.user.role !== "admin") {
        return { error: "Only admins can trigger manual refresh" };
    }

    const result = await triggerManualRefresh();
    if (result.success) {
        // Also sync after refresh
        const syncResult = await syncTransactions();
        revalidatePath("/transactions");
        revalidatePath("/");
        return { ...result, sync: syncResult };
    }
    return result;
}

export async function getSyncStatusAction() {
    const session = await auth();
    if (!session?.user) {
        return null;
    }

    const lastSyncTime = await getLastSyncTime();
    const { canRefresh, nextRefreshAt } = await canTriggerManualRefresh();

    return {
        lastSyncTime,
        canRefresh,
        nextRefreshAt,
    };
}
