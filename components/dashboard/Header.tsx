"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { LogOut, Settings, User } from "lucide-react";
import Link from "next/link";
import { MobileMenuButton } from "./Sidebar";
import { useQuery } from "@tanstack/react-query";

interface UserProfile {
    id: string;
    email: string;
    name: string | null;
    imageUrl: string | null;
}

async function fetchUserProfile(): Promise<UserProfile> {
    const response = await fetch("/api/user/profile");
    if (!response.ok) {
        throw new Error("Failed to fetch user profile");
    }
    return response.json();
}

export function DashboardHeader() {
    const { user: kindeUser } = useKindeBrowserClient();
    const { data: userProfile } = useQuery({
        queryKey: ["user-profile"],
        queryFn: fetchUserProfile,
    });

    // Usar dados do nosso banco de dados quando disponível, senão usar do Kinde
    const displayName = userProfile?.name || (kindeUser?.given_name && kindeUser?.family_name
        ? `${kindeUser.given_name} ${kindeUser.family_name}`
        : kindeUser?.email || "");
    const displayEmail = userProfile?.email || kindeUser?.email || "";
    const displayImage = userProfile?.imageUrl || kindeUser?.picture || "";
    const avatarFallback = userProfile?.name?.[0] || kindeUser?.given_name?.[0] || kindeUser?.email?.[0] || "U";

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="container flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <MobileMenuButton />
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <span className="text-lg font-bold">PB</span>
                        </div>
                        <span className="hidden text-xl font-bold sm:inline">PodBrief</span>
                    </Link>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={displayImage} alt={displayName} />
                                    <AvatarFallback>
                                        {avatarFallback}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {displayName}
                                    </p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {displayEmail}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/settings" className="flex items-center">
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/settings" className="flex items-center">
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <LogoutLink className="flex w-full items-center">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </LogoutLink>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}

