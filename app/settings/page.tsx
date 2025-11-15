import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MOCK_USER, MOCK_INVOICES, PRICING_PLANS } from "@/lib/mock-data";
import { CreditCard, Download, Edit, Zap } from "lucide-react";
import { format } from "date-fns";

export default function SettingsPage() {
    const currentPlan = PRICING_PLANS.find((p) => p.id === MOCK_USER.currentPlan);

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
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={MOCK_USER.imageUrl || ""} />
                            <AvatarFallback className="text-lg">
                                {MOCK_USER.name?.[0] || MOCK_USER.email[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold">{MOCK_USER.name}</h3>
                            <p className="text-sm text-muted-foreground">{MOCK_USER.email}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Member since {format(MOCK_USER.createdAt, "MMMM yyyy")}
                            </p>
                        </div>
                        <Button variant="outline">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Profile
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Subscription Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Subscription</CardTitle>
                    <CardDescription>Your current plan and billing information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {currentPlan && (
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="flex items-center gap-4">
                                <div className="rounded-lg bg-primary/10 p-3">
                                    <Zap className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold">{currentPlan.name} Plan</h3>
                                        {currentPlan.popular && (
                                            <Badge variant="default">Popular</Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {currentPlan.credits} credits ({currentPlan.minutes} minutes) per month
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold">${currentPlan.price}</p>
                                <p className="text-xs text-muted-foreground">per month</p>
                            </div>
                        </div>
                    )}

                    <Separator />

                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1">
                            Change Plan
                        </Button>
                        <Button variant="outline" className="flex-1">
                            Cancel Subscription
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
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-4">
                            <CreditCard className="h-6 w-6 text-muted-foreground" />
                            <div>
                                <p className="font-medium">•••• •••• •••• 4242</p>
                                <p className="text-sm text-muted-foreground">Expires 12/25</p>
                            </div>
                        </div>
                        <Button variant="outline">Update</Button>
                    </div>
                </CardContent>
            </Card>

            {/* Billing History */}
            <Card>
                <CardHeader>
                    <CardTitle>Billing History</CardTitle>
                    <CardDescription>Your recent invoices and payments</CardDescription>
                </CardHeader>
                <CardContent>
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
                            {MOCK_INVOICES.map((invoice) => (
                                <TableRow key={invoice.id}>
                                    <TableCell>{format(invoice.date, "PPP")}</TableCell>
                                    <TableCell>{invoice.plan}</TableCell>
                                    <TableCell>{invoice.credits}</TableCell>
                                    <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Badge variant={invoice.status === "paid" ? "default" : "secondary"}>
                                            {invoice.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

