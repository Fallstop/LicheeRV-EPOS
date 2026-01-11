"use client";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="en">
            <head>
                <title>Error | FlatOS</title>
            </head>
            <body className="bg-slate-900 text-white min-h-screen flex items-center justify-center">
                <div className="text-center p-8">
                    <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
                    <p className="text-slate-400 mb-6">{error.message}</p>
                    <button
                        onClick={() => reset()}
                        className="px-4 py-2 bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors"
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
