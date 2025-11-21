import { redirect } from "next/navigation";
import { defaultLocale } from "@/i18n";

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  redirect(`/${defaultLocale}/dashboard`);
}
