"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    FileAudio,
    Settings,
    CreditCard,
    Upload,
    Menu,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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

// Componente para o conteúdo de navegação (reutilizável)
function NavContent({ onLinkClick }: { onLinkClick?: () => void }) {
    const pathname = usePathname();

    return (
        <nav className="space-y-1">
            {navigation.map((item) => {
                // For dashboard, only match exact path
                // For other routes, match exact path or sub-routes
                const isActive = item.href === "/dashboard"
                    ? pathname === item.href
                    : pathname === item.href || pathname?.startsWith(item.href + "/");
                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        onClick={onLinkClick}
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
    );
}

// Botão do menu mobile (usado no header)
export function MobileMenuButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
                <div className="flex h-full flex-col gap-4 p-4">
                    <NavContent onLinkClick={() => setIsOpen(false)} />
                </div>
            </SheetContent>
        </Sheet>
    );
}

// Sidebar desktop (usado no layout)
export function DashboardSidebar() {
    return (
        <aside className="hidden w-64 border-r bg-card lg:block">
            <div className="flex h-full flex-col gap-4 p-4">
                <NavContent />
            </div>
        </aside>
    );
}

