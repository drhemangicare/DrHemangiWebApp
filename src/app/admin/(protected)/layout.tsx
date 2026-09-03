import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/supabase/admin-session";
import { AdminSidebar } from "@/components/admin/sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminUser();
  if (!admin) redirect("/admin/login");

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-cream">
      <AdminSidebar adminName={admin.fullName || admin.email || "Admin"} />
      <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8">{children}</main>
    </div>
  );
}
