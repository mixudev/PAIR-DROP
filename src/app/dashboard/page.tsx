import type { Metadata } from "next";
import { UserDashboard } from "@/modules/dashboard/components/user-dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your PairDrop rooms and view your account information.",
};

export default function DashboardPage() {
  return <UserDashboard />;
}
