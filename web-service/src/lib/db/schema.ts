import { sqliteTable, text, integer, real, primaryKey } from "drizzle-orm/sqlite-core";
import type { AdapterAccountType } from "next-auth/adapters";

// User table - holds all flatmates and their info
// User table - holds all flatmates and their info
export const users = sqliteTable("user", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name"),
    email: text("email").notNull().unique(),
    emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
    image: text("image"),
    role: text("role", { enum: ["admin", "user"] }).notNull().default("user"),
    bankAccountPattern: text("bank_account_pattern"), // Substring or regex to match transactions
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const accounts = sqliteTable(
    "account",
    {
        userId: text("userId")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: text("type").$type<AdapterAccountType>().notNull(),
        provider: text("provider").notNull(),
        providerAccountId: text("providerAccountId").notNull(),
        refresh_token: text("refresh_token"),
        access_token: text("access_token"),
        expires_at: integer("expires_at"),
        token_type: text("token_type"),
        scope: text("scope"),
        id_token: text("id_token"),
        session_state: text("session_state"),
    },
    (account) => ({
        compoundKey: primaryKey({
            columns: [account.provider, account.providerAccountId],
        }),
    })
);

export const sessions = sqliteTable("session", {
    sessionToken: text("sessionToken").primaryKey(),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable(
    "verificationToken",
    {
        identifier: text("identifier").notNull(),
        token: text("token").notNull(),
        expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
    },
    (vt) => ({
        compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
    })
);

// Transactions fetched from Akahu
export const transactions = sqliteTable("transactions", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    akahuId: text("akahu_id").notNull().unique(), // Akahu's unique ID for deduplication
    date: integer("date", { mode: "timestamp" }).notNull(),
    amount: real("amount").notNull(), // Positive = money in, Negative = money out
    description: text("description").notNull(),
    merchant: text("merchant"), // If available
    category: text("category"), // Akahu category
    rawData: text("raw_data").notNull(), // Full JSON from Akahu
    // Matching fields
    matchedUserId: text("matched_user_id").references(() => users.id),
    matchType: text("match_type", { enum: ["rent_payment", "grocery_reimbursement", "other", "expense"] }),
    matchConfidence: real("match_confidence"), // 0-1 confidence score
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Payment schedule - defines how much each user owes per week for a time period
export const paymentSchedules = sqliteTable("payment_schedules", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    weeklyAmount: real("weekly_amount").notNull(), // Amount due each week
    startDate: integer("start_date", { mode: "timestamp" }).notNull(),
    endDate: integer("end_date", { mode: "timestamp" }), // Null = ongoing
    notes: text("notes"), // e.g., "Summer rate", "Standard rate"
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// System state for tracking sync status
export const systemState = sqliteTable("system_state", {
    key: text("key").primaryKey(),
    value: text("value").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type PaymentSchedule = typeof paymentSchedules.$inferSelect;
export type NewPaymentSchedule = typeof paymentSchedules.$inferInsert;
