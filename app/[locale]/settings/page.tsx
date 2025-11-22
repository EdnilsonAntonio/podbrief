"use client";

import { useLocale, useTranslations } from "next-intl";

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
    const locale = useLocale();
    const t = useTranslations();
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
            toast.success(t("settings.profileUpdated"));
            setIsEditDialogOpen(false);
        },
        onError: (error: Error) => {
            toast.error(error.message || t("settings.profileUpdateError"));
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
                toast.error(t("settings.selectImage"));
                return;
            }

            // Validar tamanho (5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error(t("settings.imageSizeError"));
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
                    throw new Error(error.error || t("settings.uploadImageError"));
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
            toast.error(t("settings.confirmDelete"));
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

            toast.success(t("settings.accountDeleted"));
            
            // Redirecionar para logout e depois para home
            setTimeout(() => {
                window.location.href = "/api/auth/logout";
            }, 1500);
        } catch (error) {
            console.error("Delete account error:", error);
            toast.error(
                error instanceof Error ? error.message : t("settings.deleteError")
            );
            setIsDeletingAccount(false);
        }
    };

    if (isLoadingUser) {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-64" />
                    <Skeleton className="h-5 w-96 max-w-full" />
                </div>
                <div className="rounded-lg border p-6 space-y-6">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-20 w-20 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-64" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-10 w-32" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t("settings.title")}</h1>
                <p className="text-muted-foreground">
                    {t("settings.description")}
                </p>
            </div>

            {/* Profile Section */}
            <Card>
                <CardHeader>
                    <CardTitle>{t("settings.profile")}</CardTitle>
                    <CardDescription>{t("settings.profileDescription")}</CardDescription>
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
                                <h3 className="text-lg font-semibold">{user.name || t("settings.user")}</h3>
                                <p className="text-sm text-muted-foreground break-all">{user.email}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {t("settings.memberSince", { date: format(new Date(user.createdAt), "MMMM yyyy") })}
                                </p>
                            </div>
                                   <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                                       <DialogTrigger asChild>
                                           <Button variant="outline" className="w-full sm:w-auto" onClick={handleEditClick}>
                                               <Edit className="mr-2 h-4 w-4" />
                                               {t("settings.editProfile")}
                                           </Button>
                                       </DialogTrigger>
                                       <DialogContent>
                                           <DialogHeader>
                                               <DialogTitle>{t("settings.editProfile")}</DialogTitle>
                                               <DialogDescription>
                                                   {t("settings.editDescription")}
                                               </DialogDescription>
                                           </DialogHeader>
                                           <div className="space-y-4 py-4">
                                               <div className="space-y-2">
                                                   <Label htmlFor="email">{t("settings.email")}</Label>
                                                   <Input
                                                       id="email"
                                                       type="email"
                                                       value={user?.email || ""}
                                                       disabled
                                                       className="bg-muted"
                                                   />
                                                   <p className="text-xs text-muted-foreground">
                                                       {t("settings.emailDescription")}
                                                   </p>
                                               </div>
                                               <div className="space-y-2">
                                                   <Label htmlFor="avatar">{t("settings.profilePicture")}</Label>
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
                                                               {t("settings.imageFormat")}
                                                           </p>
                                                       </div>
                                                   </div>
                                               </div>
                                               <div className="space-y-2">
                                                   <Label htmlFor="name">{t("settings.name")}</Label>
                                                   <Input
                                                       id="name"
                                                       type="text"
                                                       value={editedName}
                                                       onChange={(e) => setEditedName(e.target.value)}
                                                       placeholder={t("settings.enterName")}
                                                       maxLength={100}
                                                   />
                                               </div>
                                               <div className="flex justify-end gap-2 pt-4">
                                                   <Button
                                                       variant="outline"
                                                       onClick={() => setIsEditDialogOpen(false)}
                                                       disabled={updateProfileMutation.isPending}
                                                   >
                                                       {t("settings.cancel")}
                                                   </Button>
                                                   <Button
                                                       onClick={handleSave}
                                                       disabled={updateProfileMutation.isPending || (editedName === (user?.name || "") && !selectedImage)}
                                                   >
                                                       {updateProfileMutation.isPending ? t("settings.saving") : t("settings.saveChanges")}
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
                    <CardTitle>{t("settings.credits")}</CardTitle>
                    <CardDescription>{t("settings.creditsDescription")}</CardDescription>
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
                                        <h3 className="font-semibold">{t("settings.availableCredits")}</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {(user.credits % 1 === 0
                                            ? user.credits.toFixed(0)
                                            : user.credits.toFixed(2))}{" "}
                                        {t("common.credits")} {t("settings.creditsAvailable")}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {t("settings.creditEquals")}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold">
                                    {user.credits % 1 === 0
                                        ? user.credits.toFixed(0)
                                        : user.credits.toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground">{t("settings.credits")}</p>
                            </div>
                        </div>
                    )}

                    <Separator />

                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            {t("settings.purchaseDescription")}
                        </p>
                        <Button className="w-full" asChild>
                            <a href={`/${locale}/pricing`}>{t("settings.purchaseCredits")}</a>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
                <CardHeader>
                    <CardTitle>{t("settings.paymentMethod")}</CardTitle>
                    <CardDescription>{t("settings.paymentDescription")}</CardDescription>
                </CardHeader>
                <CardContent>
                    {invoices && invoices.length > 0 ? (
                        <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <CreditCard className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                                <div>
                                    <p className="font-medium">{t("settings.paymentOnFile")}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {invoices[0].stripePaymentId ? t("settings.stripePayment") : t("settings.noPaymentMethod")}
                                    </p>
                                </div>
                            </div>
                                   <Button 
                                       variant="outline" 
                                       className="w-full sm:w-auto"
                                       onClick={handleUpdatePaymentMethod}
                                       disabled={isLoadingPaymentPortal}
                                   >
                                       {isLoadingPaymentPortal ? t("settings.loading") : t("settings.update")}
                                   </Button>
                        </div>
                    ) : (
                        <div className="rounded-lg border p-4 text-center">
                            <p className="text-sm text-muted-foreground">
                                {t("settings.noPaymentOnFile")}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Billing History */}
            <Card>
                <CardHeader>
                    <CardTitle>{t("settings.billingHistory")}</CardTitle>
                    <CardDescription>{t("settings.billingDescription")}</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingInvoices ? (
                        <div className="space-y-2 animate-in fade-in duration-300">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="rounded-lg border p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Skeleton className="h-5 w-32" />
                                        <Skeleton className="h-6 w-20 rounded-full" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-16" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : invoices && invoices.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t("settings.date")}</TableHead>
                                        <TableHead>{t("settings.plan")}</TableHead>
                                        <TableHead>{t("settings.credits")}</TableHead>
                                        <TableHead>{t("settings.amount")}</TableHead>
                                        <TableHead>{t("settings.status")}</TableHead>
                                        <TableHead className="text-right">{t("settings.actions")}</TableHead>
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
                                                        toast.success(t("settings.invoiceDownloaded"));
                                                    } catch (error) {
                                                        console.error("Download error:", error);
                                                        toast.error(t("settings.downloadInvoiceError"));
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
                                {t("settings.noBillingHistory")}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">{t("settings.dangerZone")}</CardTitle>
                    <CardDescription>
                        {t("settings.dangerDescription")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                        <div className="flex-1">
                            <h3 className="font-semibold text-destructive mb-1">{t("settings.deleteAccount")}</h3>
                            <p className="text-sm text-muted-foreground">
                                {t("settings.deleteDescription")}
                            </p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full sm:w-auto">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {t("settings.deleteAccount")}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-destructive" />
                                        {t("settings.areYouSure")}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="space-y-2">
                                        <p>
                                            {t("settings.cannotUndo")}
                                        </p>
                                        <p className="font-semibold">
                                            {t("settings.includes")}
                                        </p>
                                        <ul className="list-disc pl-6 space-y-1 text-sm">
                                            <li>{t("settings.includesTranscriptions")}</li>
                                            <li>{t("settings.includesAudio")}</li>
                                            <li>{t("settings.includesProfile")}</li>
                                            <li>{t("settings.includesHistory")}</li>
                                            <li>{t("settings.includesData")}</li>
                                        </ul>
                                        <p className="pt-2">
                                            {t("settings.typeDelete")}
                                        </p>
                                        <Input
                                            type="text"
                                            placeholder={t("settings.typeDeletePlaceholder")}
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
                                        {t("settings.cancel")}
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDeleteAccount}
                                        disabled={isDeletingAccount || deleteConfirmText !== "DELETE"}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        {isDeletingAccount ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                {t("settings.deleting")}
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                {t("settings.deleteAccount")}
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

