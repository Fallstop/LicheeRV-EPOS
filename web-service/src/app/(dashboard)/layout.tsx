import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user) {
        redirect("/auth/signin");
    }

    return (
        <div className="flex h-screen bg-slate-900 overflow-hidden">
            <Sidebar user={session.user} />
            <main className="flex-1 lg:pl-0 flex flex-col min-h-0 overflow-hidden">
                <div className="p-4 lg:p-8 flex-1 flex flex-col min-h-0 overflow-hidden">
                    {children}
                </div>
            </main>
        </div>
    );
}
