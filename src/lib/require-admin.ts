import { getAdminUser } from "@/lib/supabase/admin-session";
import { jsonError } from "@/lib/http";

/** Every /api/admin/* route starts with `const admin = await requireAdmin(); if (admin instanceof Response) return admin;` */
export async function requireAdmin() {
  const admin = await getAdminUser();
  if (!admin) return jsonError("Not authenticated", 401);
  return admin;
}
