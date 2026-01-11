import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { transactions, users } from "@/lib/db/schema";
import { desc, eq, ne } from "drizzle-orm";
import { SyncButton } from "@/components/SyncButton";
import { TransactionList } from "@/components/TransactionList";
import { getLastSyncTime, canTriggerManualRefresh } from "@/lib/sync";
import { formatDistanceToNow } from "date-fns";
import { loadMoreTransactionsAction } from "@/lib/actions";

const PAGE_SIZE = 50;

export default async function TransactionsPage() {
    const session = await auth();
    const isAdmin = session?.user?.role === "admin";

    // Get sync status
    const lastSyncTime = await getLastSyncTime();
    const { canRefresh, nextRefreshAt } = await canTriggerManualRefresh();

    // Get all flatmates for filtering
    const flatmates = await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(ne(users.role, "admin"));

    // Fetch initial transactions with matched user names
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
        .limit(PAGE_SIZE);

    const hasMore = txsWithUsers.length === PAGE_SIZE;

    // Bind the action with the server function
    async function loadMore(offset: number) {
        "use server";
        return loadMoreTransactionsAction(offset);
    }

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Transactions</h1>
                    <p className="text-slate-400 mt-1">
                        {lastSyncTime
                            ? `Last synced ${formatDistanceToNow(lastSyncTime, { addSuffix: true })}`
                            : "Not synced yet - click Sync to fetch transactions"}
                    </p>
                </div>
                <SyncButton
                    isAdmin={isAdmin}
                    lastSyncTime={lastSyncTime}
                    canRefresh={canRefresh}
                    nextRefreshAt={nextRefreshAt}
                />
            </div>

            <TransactionList
                initialTransactions={txsWithUsers}
                flatmates={flatmates}
                hasMore={hasMore}
                loadMoreAction={loadMore}
            />
        </div>
    );
}
