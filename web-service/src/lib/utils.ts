/**
 * Shared utility functions that can be used on both client and server.
 * This file should NOT import any server-only dependencies (db, better-sqlite3, etc.)
 */

/**
 * Format a number as currency with commas and 2 decimal places.
 * Example: 35845 -> "35,845.00"
 */
export function formatMoney(amount: number): string {
    return Math.abs(amount).toLocaleString("en-NZ", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

/**
 * Check if a transaction counts as a rent payment based on the stored match type.
 * A transaction is considered a rent payment if matchType is explicitly "rent_payment".
 *
 * This is the canonical check used throughout the app.
 */
export function isRentPayment(matchType: string | null | undefined): boolean {
    return matchType === "rent_payment";
}

/**
 * Check if an amount is within a tolerance of an expected value.
 * Used for payment matching logic.
 */
export function isWithinTolerance(actual: number, expected: number, tolerance: number): boolean {
    const lower = expected * (1 - tolerance);
    const upper = expected * (1 + tolerance);
    return actual >= lower && actual <= upper;
}
