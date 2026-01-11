"use server";

import { signOut as nextAuthSignOut, auth } from "@/lib/auth";
import { syncTransactions, triggerManualRefresh, canTriggerManualRefresh, getLastSyncTime } from "@/lib/sync";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { users, transactions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

const PAGE_SIZE = 50;

export async function signOutAction() {
    await nextAuthSignOut({ redirectTo: "/auth/signin" });
}

export async function loadMoreTransactionsAction(offset: number) {
    const session = await auth();
    if (!session?.user) {
        return [];
    }

    const txsWithUsers = await db
        .select({
            id: transactions.id,
            akahuId: transactions.akahuId,
            date: transactions.date,
            amount: transactions.amount,
            description: transactions.description,
            merchant: transactions.merchant,
            merchantLogo: transactions.merchantLogo,
            category: transactions.category,
            rawData: transactions.rawData,
            cardSuffix: transactions.cardSuffix,
            otherAccount: transactions.otherAccount,
            matchedUserId: transactions.matchedUserId,
            matchType: transactions.matchType,
            matchConfidence: transactions.matchConfidence,
            createdAt: transactions.createdAt,
            matchedUserName: users.name,
        })
        .from(transactions)
        .leftJoin(users, eq(transactions.matchedUserId, users.id))
        .orderBy(desc(transactions.date))
        .limit(PAGE_SIZE)
        .offset(offset);

    return txsWithUsers;
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

// ============================================
// Flatmate Management Actions
// ============================================

export async function addFlatmateAction(formData: FormData) {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
        return { error: "Unauthorized - admin access required" };
    }

    const email = formData.get("email")?.toString().trim().toLowerCase();
    const name = formData.get("name")?.toString().trim() || null;
    const bankAccountPattern = formData.get("bankAccountPattern")?.toString().trim() || null;
    const cardSuffix = formData.get("cardSuffix")?.toString().trim() || null;
    const matchingName = formData.get("matchingName")?.toString().trim() || null;

    if (!email) {
        return { error: "Email is required" };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { error: "Invalid email address" };
    }

    // Check if user already exists
    const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

    if (existingUser.length > 0) {
        return { error: "A user with this email already exists" };
    }

    try {
        await db.insert(users).values({
            email,
            name,
            bankAccountPattern,
            cardSuffix,
            matchingName,
            role: "user",
        });

        revalidatePath("/users");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Error adding flatmate:", error);
        return { error: "Failed to add flatmate" };
    }
}

export async function updateFlatmateAction(formData: FormData) {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
        return { error: "Unauthorized - admin access required" };
    }

    const id = formData.get("id")?.toString();
    const name = formData.get("name")?.toString().trim() || null;
    const bankAccountPattern = formData.get("bankAccountPattern")?.toString().trim() || null;
    const cardSuffix = formData.get("cardSuffix")?.toString().trim() || null;
    const matchingName = formData.get("matchingName")?.toString().trim() || null;

    if (!id) {
        return { error: "User ID is required" };
    }

    // Check if user exists
    const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

    if (existingUser.length === 0) {
        return { error: "User not found" };
    }

    // Prevent modifying admin users
    if (existingUser[0].role === "admin") {
        return { error: "Cannot modify admin users" };
    }

    try {
        await db
            .update(users)
            .set({
                name,
                bankAccountPattern,
                cardSuffix,
                matchingName,
                updatedAt: new Date(),
            })
            .where(eq(users.id, id));

        revalidatePath("/users");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Error updating flatmate:", error);
        return { error: "Failed to update flatmate" };
    }
}

export async function deleteFlatmateAction(id: string) {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
        return { error: "Unauthorized - admin access required" };
    }

    if (!id) {
        return { error: "User ID is required" };
    }

    // Check if user exists
    const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

    if (existingUser.length === 0) {
        return { error: "User not found" };
    }

    // Prevent deleting admin users
    if (existingUser[0].role === "admin") {
        return { error: "Cannot delete admin users" };
    }

    // Prevent deleting yourself
    if (existingUser[0].email === session.user.email) {
        return { error: "Cannot delete yourself" };
    }

    try {
        await db.delete(users).where(eq(users.id, id));

        revalidatePath("/users");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Error deleting flatmate:", error);
        return { error: "Failed to delete flatmate" };
    }
}

// ============================================
// User Self-Update Actions
// ============================================

export async function updateMySettingsAction(formData: FormData) {
    const session = await auth();
    if (!session?.user?.email) {
        return { error: "Unauthorized" };
    }

    const bankAccountPattern = formData.get("bankAccountPattern")?.toString().trim() || null;
    const cardSuffix = formData.get("cardSuffix")?.toString().trim() || null;
    const matchingName = formData.get("matchingName")?.toString().trim() || null;

    // Validate card suffix format (should be 4 digits)
    if (cardSuffix && !/^\d{4}$/.test(cardSuffix)) {
        return { error: "Card suffix must be exactly 4 digits" };
    }

    try {
        await db
            .update(users)
            .set({
                bankAccountPattern,
                cardSuffix,
                matchingName,
                updatedAt: new Date(),
            })
            .where(eq(users.email, session.user.email));

        revalidatePath("/settings");
        revalidatePath("/users");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Error updating settings:", error);
        return { error: "Failed to update settings" };
    }
}

// ============================================
// Transaction Matching Actions
// ============================================

export async function rematchTransactionsAction() {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
        return { error: "Unauthorized - admin access required" };
    }

    try {
        const { rematchAllTransactions } = await import("@/lib/matching");
        const result = await rematchAllTransactions();
        
        revalidatePath("/transactions");
        revalidatePath("/");
        return { success: true, matched: result.matched, total: result.total };
    } catch (error) {
        console.error("Error rematching transactions:", error);
        return { error: "Failed to rematch transactions" };
    }
}
