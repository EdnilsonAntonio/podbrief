import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col">
            <DashboardHeader />
            <div className="flex flex-1">
                <DashboardSidebar />
                <main className="flex-1 overflow-y-auto">
                    <div className="container p-4 sm:p-6">{children}</div>
                </main>
            </div>
        </div>
    );
}

