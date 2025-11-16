"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Download, Edit, Zap, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";

interface UserProfile {
    id: string;
    email: string;
    name: string | null;
    imageUrl: string | null;
    credits: number;
    createdAt: Date;
}

interface Invoice {
    id: string;
    date: Date;
    plan: string;
    amount: number;
    status: string;
    credits: number;
    stripePaymentId: string | null;
}

async function fetchUserProfile(): Promise<UserProfile> {
    const response = await fetch("/api/user/profile");
    if (!response.ok) {
        throw new Error("Failed to fetch user profile");
    }
    return response.json();
}

async function fetchInvoices(): Promise<Invoice[]> {
    const response = await fetch("/api/user/invoices");
    if (!response.ok) {
        throw new Error("Failed to fetch invoices");
    }
    return response.json();
}

export default function SettingsPage() {
    const queryClient = useQueryClient();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editedName, setEditedName] = useState("");
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoadingPaymentPortal, setIsLoadingPaymentPortal] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");

    const { data: user, isLoading: isLoadingUser } = useQuery({
        queryKey: ["user-profile"],
        queryFn: fetchUserProfile,
    });

    const { data: invoices, isLoading: isLoadingInvoices } = useQuery({
        queryKey: ["user-invoices"],
        queryFn: fetchInvoices,
    });

    // Mutation para atualizar perfil
    const updateProfileMutation = useMutation({
        mutationFn: async (name: string) => {
            const response = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to update profile");
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user-profile"] });
            toast.success("Profile updated successfully");
            setIsEditDialogOpen(false);
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to update profile");
        },
    });

    const handleEditClick = () => {
        if (user) {
            setEditedName(user.name || "");
            setSelectedImage(null);
            setImagePreview(null);
            setIsEditDialogOpen(true);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validar tipo
            if (!file.type.startsWith("image/")) {
                toast.error("Please select an image file");
                return;
            }

            // Validar tamanho (5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image size must be less than 5MB");
                return;
            }

            setSelectedImage(file);
            
            // Criar preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        try {
            // Se houver imagem selecionada, fazer upload primeiro
            if (selectedImage) {
                const imageFormData = new FormData();
                imageFormData.append("file", selectedImage);

                const uploadResponse = await fetch("/api/user/profile/upload", {
                    method: "POST",
                    body: imageFormData,
                });

                if (!uploadResponse.ok) {
                    const error = await uploadResponse.json();
                    throw new Error(error.error || "Failed to upload image");
                }

                // Invalidar query para atualizar a imagem no Header
                queryClient.invalidateQueries({ queryKey: ["user-profile"] });
            }

            // Atualizar nome (isso também invalida a query)
            updateProfileMutation.mutate(editedName);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update profile");
        }
    };

    const handleUpdatePaymentMethod = async () => {
        setIsLoadingPaymentPortal(true);
        try {
            const response = await fetch("/api/user/payment-method");
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to open payment method portal");
            }

            const data = await response.json();
            
            // Redirecionar para o Stripe Customer Portal
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error("No portal URL received");
            }
        } catch (error) {
            console.error("Payment method update error:", error);
            toast.error(
                error instanceof Error ? error.message : "Failed to open payment method portal"
            );
            setIsLoadingPaymentPortal(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== "DELETE") {
            toast.error("Please type 'DELETE' to confirm");
            return;
        }

        setIsDeletingAccount(true);
        try {
            const response = await fetch("/api/user/delete", {
                method: "DELETE",
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to delete account");
            }

            toast.success("Account deleted successfully. Redirecting...");
            
            // Redirecionar para logout e depois para home
            setTimeout(() => {
                window.location.href = "/api/auth/logout";
            }, 1500);
        } catch (error) {
            console.error("Delete account error:", error);
            toast.error(
                error instanceof Error ? error.message : "Failed to delete account"
            );
            setIsDeletingAccount(false);
        }
    };

    if (isLoadingUser) {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-9 w-64 mb-2" />
                    <Skeleton className="h-5 w-96" />
                </div>
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">
                    Manage your account settings and subscription
                </p>
            </div>

            {/* Profile Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>Your account information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {user && (
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={user.imageUrl || ""} />
                                <AvatarFallback className="text-lg">
                                    {user.name?.[0] || user.email[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold">{user.name || "User"}</h3>
                                <p className="text-sm text-muted-foreground break-all">{user.email}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Member since {format(new Date(user.createdAt), "MMMM yyyy")}
                                </p>
                            </div>
                                   <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                                       <DialogTrigger asChild>
                                           <Button variant="outline" className="w-full sm:w-auto" onClick={handleEditClick}>
                                               <Edit className="mr-2 h-4 w-4" />
                                               Edit Profile
                                           </Button>
                                       </DialogTrigger>
                                       <DialogContent>
                                           <DialogHeader>
                                               <DialogTitle>Edit Profile</DialogTitle>
                                               <DialogDescription>
                                                   Update your profile information. Your email cannot be changed.
                                               </DialogDescription>
                                           </DialogHeader>
                                           <div className="space-y-4 py-4">
                                               <div className="space-y-2">
                                                   <Label htmlFor="email">Email</Label>
                                                   <Input
                                                       id="email"
                                                       type="email"
                                                       value={user?.email || ""}
                                                       disabled
                                                       className="bg-muted"
                                                   />
                                                   <p className="text-xs text-muted-foreground">
                                                       Your email is managed by your authentication provider and cannot be changed here.
                                                   </p>
                                               </div>
                                               <div className="space-y-2">
                                                   <Label htmlFor="avatar">Profile Picture</Label>
                                                   <div className="flex items-center gap-4">
                                                       <Avatar className="h-20 w-20">
                                                           <AvatarImage 
                                                               src={imagePreview || user?.imageUrl || ""} 
                                                           />
                                                           <AvatarFallback className="text-lg">
                                                               {user?.name?.[0] || user?.email[0]}
                                                           </AvatarFallback>
                                                       </Avatar>
                                                       <div className="flex-1">
                                                           <Input
                                                               id="avatar"
                                                               type="file"
                                                               accept="image/*"
                                                               onChange={handleImageSelect}
                                                               className="cursor-pointer"
                                                           />
                                                           <p className="text-xs text-muted-foreground mt-1">
                                                               JPG, PNG or GIF. Max size 5MB.
                                                           </p>
                                                       </div>
                                                   </div>
                                               </div>
                                               <div className="space-y-2">
                                                   <Label htmlFor="name">Name</Label>
                                                   <Input
                                                       id="name"
                                                       type="text"
                                                       value={editedName}
                                                       onChange={(e) => setEditedName(e.target.value)}
                                                       placeholder="Enter your name"
                                                       maxLength={100}
                                                   />
                                               </div>
                                               <div className="flex justify-end gap-2 pt-4">
                                                   <Button
                                                       variant="outline"
                                                       onClick={() => setIsEditDialogOpen(false)}
                                                       disabled={updateProfileMutation.isPending}
                                                   >
                                                       Cancel
                                                   </Button>
                                                   <Button
                                                       onClick={handleSave}
                                                       disabled={updateProfileMutation.isPending || (editedName === (user?.name || "") && !selectedImage)}
                                                   >
                                                       {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                                                   </Button>
                                               </div>
                                           </div>
                                       </DialogContent>
                                   </Dialog>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Credits Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Credits</CardTitle>
                    <CardDescription>Your available credits and purchase options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {user && (
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="flex items-center gap-4">
                                <div className="rounded-lg bg-primary/10 p-3">
                                    <Zap className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold">Available Credits</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {user.credits % 1 === 0
                                            ? user.credits.toFixed(0)
                                            : user.credits.toFixed(2)}{" "}
                                        {user.credits === 1 ? "credit" : "credits"} available
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        1 credit = 1 minute of transcription
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold">
                                    {user.credits % 1 === 0
                                        ? user.credits.toFixed(0)
                                        : user.credits.toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground">credits</p>
                            </div>
                        </div>
                    )}

                    <Separator />

                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            Purchase credits to transcribe your audio files. Credits never expire and can be used anytime.
                        </p>
                        <Button className="w-full" asChild>
                            <a href="/pricing">Purchase Credits</a>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
                <CardHeader>
                    <CardTitle>Payment Method</CardTitle>
                    <CardDescription>Manage your payment information</CardDescription>
                </CardHeader>
                <CardContent>
                    {invoices && invoices.length > 0 ? (
                        <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <CreditCard className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                                <div>
                                    <p className="font-medium">Payment method on file</p>
                                    <p className="text-sm text-muted-foreground">
                                        {invoices[0].stripePaymentId ? "Stripe payment method" : "No payment method"}
                                    </p>
                                </div>
                            </div>
                                   <Button 
                                       variant="outline" 
                                       className="w-full sm:w-auto"
                                       onClick={handleUpdatePaymentMethod}
                                       disabled={isLoadingPaymentPortal}
                                   >
                                       {isLoadingPaymentPortal ? "Loading..." : "Update"}
                                   </Button>
                        </div>
                    ) : (
                        <div className="rounded-lg border p-4 text-center">
                            <p className="text-sm text-muted-foreground">
                                No payment method on file. Add one when you upgrade your plan.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Billing History */}
            <Card>
                <CardHeader>
                    <CardTitle>Billing History</CardTitle>
                    <CardDescription>Your recent invoices and payments</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingInvoices ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : invoices && invoices.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Plan</TableHead>
                                        <TableHead>Credits</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoices.map((invoice) => (
                                        <TableRow key={invoice.id}>
                                            <TableCell className="whitespace-nowrap">{format(new Date(invoice.date), "PPP")}</TableCell>
                                            <TableCell>{invoice.plan}</TableCell>
                                            <TableCell>{invoice.credits}</TableCell>
                                            <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        invoice.status === "succeeded"
                                                            ? "default"
                                                            : invoice.status === "pending"
                                                                ? "secondary"
                                                                : "destructive"
                                                    }
                                                >
                                                    {invoice.status}
                                                </Badge>
                                            </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={async () => {
                                                    try {
                                                        const response = await fetch(`/api/invoices/${invoice.id}/download`);
                                                        if (!response.ok) {
                                                            throw new Error("Failed to download invoice");
                                                        }
                                                        const blob = await response.blob();
                                                        const url = window.URL.createObjectURL(blob);
                                                        const a = document.createElement("a");
                                                        a.href = url;
                                                        a.download = `invoice-${invoice.id}.pdf`;
                                                        document.body.appendChild(a);
                                                        a.click();
                                                        window.URL.revokeObjectURL(url);
                                                        document.body.removeChild(a);
                                                        toast.success("Invoice downloaded");
                                                    } catch (error) {
                                                        console.error("Download error:", error);
                                                        toast.error("Failed to download invoice");
                                                    }
                                                }}
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-sm text-muted-foreground">
                                No billing history yet. Purchase credits to see invoices here.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>
                        Irreversible and destructive actions
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                        <div className="flex-1">
                            <h3 className="font-semibold text-destructive mb-1">Delete Account</h3>
                            <p className="text-sm text-muted-foreground">
                                Once you delete your account, there is no going back. This will permanently 
                                delete your account, all transcriptions, audio files, and associated data.
                            </p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full sm:w-auto">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Account
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-destructive" />
                                        Are you absolutely sure?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="space-y-2">
                                        <p>
                                            This action cannot be undone. This will permanently delete your account 
                                            and remove all of your data from our servers.
                                        </p>
                                        <p className="font-semibold">
                                            This includes:
                                        </p>
                                        <ul className="list-disc pl-6 space-y-1 text-sm">
                                            <li>All your transcriptions and summaries</li>
                                            <li>All uploaded audio files</li>
                                            <li>Your profile information</li>
                                            <li>Your credit purchase history</li>
                                            <li>All other account data</li>
                                        </ul>
                                        <p className="pt-2">
                                            Type <strong className="text-foreground">DELETE</strong> to confirm:
                                        </p>
                                        <Input
                                            type="text"
                                            placeholder="Type DELETE to confirm"
                                            value={deleteConfirmText}
                                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                                            className="mt-2"
                                        />
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel 
                                        onClick={() => setDeleteConfirmText("")}
                                        disabled={isDeletingAccount}
                                    >
                                        Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDeleteAccount}
                                        disabled={isDeletingAccount || deleteConfirmText !== "DELETE"}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        {isDeletingAccount ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Deleting...
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete Account
                                            </>
                                        )}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

