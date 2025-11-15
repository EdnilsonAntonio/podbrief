"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    FileAudio,
    Settings,
    CreditCard,
    Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
    {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        name: "Transcriptions",
        href: "/dashboard/transcriptions",
        icon: FileAudio,
    },
    {
        name: "Upload",
        href: "/dashboard/upload",
        icon: Upload,
    },
    {
        name: "Settings",
        href: "/settings",
        icon: Settings,
    },
];

export function DashboardSidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden w-64 border-r bg-card lg:block">
            <div className="flex h-full flex-col gap-4 p-4">
                <nav className="space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
}

