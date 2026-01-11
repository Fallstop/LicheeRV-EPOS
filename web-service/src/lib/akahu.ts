import { AkahuClient } from "akahu";

if (!process.env.AKAHU_APP_TOKEN) {
    throw new Error("AKAHU_APP_TOKEN is not set");
}

export const akahu = new AkahuClient({
    appToken: process.env.AKAHU_APP_TOKEN,
});

export function getUserToken(): string {
    const token = process.env.AKAHU_API_KEY;
    if (!token) {
        throw new Error("AKAHU_API_KEY (user token) is not set");
    }
    return token;
}

export function getAccountId(): string {
    const accountId = process.env.AKAHU_ACCOUNT_ID;
    if (!accountId) {
        throw new Error("AKAHU_ACCOUNT_ID is not set");
    }
    return accountId;
}
