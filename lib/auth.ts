import { getSupabase } from "./supabase";

/**
 * 3-tier role system v3
 * - admin  = จัดการทุกอย่าง · จัดการผู้ใช้ · ดู Audit Log
 * - staff  = ลงทะเบียน · แก้ไข · อนุมัติสมาชิก · ดูรายงาน
 * - member = ดูข้อมูลตนเอง · บัตรสมาชิก · สมัคร/กรอกข้อมูล/ส่งใบสมัครเอง
 */
export type UserRole = "admin" | "staff" | "member";

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Admin",
  staff: "Staff",
  member: "สมาชิก",
};

export const ROLE_BADGE_CLASS: Record<UserRole, string> = {
  admin: "bg-purple-100 text-purple-700",
  staff: "bg-orange-100 text-orange-700",
  member: "bg-gray-100 text-gray-700",
};

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  national_id?: string | null;
  member_id?: string | null;
}

export async function signIn(email: string, password: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Map any legacy/unknown role string into the v3 set. */
function normalizeRole(raw: string | null | undefined): UserRole {
  if (raw === "super_admin") return "admin";        // legacy v2 → admin
  if (raw === "admin") return "admin";
  if (raw === "staff") return "staff";
  if (raw === "member") return "member";
  return "member";
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Try the new RPC first (returns role + national_id + member_id)
  let role: UserRole = "member";
  let national_id: string | null = null;
  let member_id: string | null = null;
  let rpcOk = false;

  try {
    const { data, error } = await supabase.rpc("my_role_info");
    if (!error && Array.isArray(data) && data.length > 0) {
      const row = data[0] as { role?: string; national_id?: string; member_id?: string };
      role = normalizeRole(row.role);
      national_id = row.national_id ?? null;
      member_id = row.member_id ?? null;
      rpcOk = true;
    }
  } catch {
    // ignore — fallback below
  }

  if (!rpcOk) {
    // Fallback: direct profile read.
    let profileRole: string | null = null;
    let profileNid: string | null = null;

    const r1 = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (!r1.error && r1.data) profileRole = (r1.data as { role?: string }).role ?? null;

    const r2 = await supabase.from("profiles").select("national_id").eq("id", user.id).maybeSingle();
    if (!r2.error && r2.data) profileNid = (r2.data as { national_id?: string }).national_id ?? null;

    role = normalizeRole(profileRole);
    national_id = profileNid;

    if (national_id) {
      const r3 = await supabase.from("members").select("id").eq("national_id", national_id).maybeSingle();
      if (!r3.error) member_id = (r3.data as { id?: string } | null)?.id ?? null;
    }
  }

  return {
    id: user.id,
    email: user.email ?? "",
    role,
    national_id,
    member_id,
  };
}

export async function getSession() {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// =====================================================================
// Permission helpers (role v3)
//   admin  — จัดการทุกอย่าง + จัดการผู้ใช้ + Audit Log
//   staff  — ลงทะเบียน/แก้ไข/อนุมัติสมาชิก + ดูรายงาน
//   member — ดูข้อมูลตนเอง + บัตรสมาชิก + สมัคร/ส่งใบสมัครเอง
// =====================================================================

export const isAdmin = (u: AuthUser | null) => u?.role === "admin";
export const isStaff = (u: AuthUser | null) => u?.role === "staff";
export const isMember = (u: AuthUser | null) => u?.role === "member";

/** Staff or admin (anyone with back-office access) */
export const isStaffOrAbove = (u: AuthUser | null) =>
  u?.role === "admin" || u?.role === "staff";

/** Can register / edit / approve members (admin + staff) */
export const canEditMembers = (u: AuthUser | null) =>
  u?.role === "admin" || u?.role === "staff";

export const canApproveMembers = (u: AuthUser | null) =>
  u?.role === "admin" || u?.role === "staff";

/** Can view all members (admin + staff) */
export const canViewAllMembers = (u: AuthUser | null) =>
  u?.role === "admin" || u?.role === "staff";

/** Can view reports (admin + staff) */
export const canViewReports = (u: AuthUser | null) =>
  u?.role === "admin" || u?.role === "staff";

/** Can manage system settings (admin + staff) */
export const canEditSettings = (u: AuthUser | null) =>
  u?.role === "admin" || u?.role === "staff";

/** Manage user roles — ADMIN ONLY */
export const canManageUsers = (u: AuthUser | null) => u?.role === "admin";

/** View audit log — ADMIN ONLY */
export const canViewAuditLog = (u: AuthUser | null) => u?.role === "admin";

// ---------------------------------------------------------------------
// Backwards-compat aliases for older imports across the codebase.
// All map onto the new v3 helpers so nothing breaks during the transition.
// ---------------------------------------------------------------------
export const isSuperAdmin = isAdmin;          // v2 super_admin === v3 admin
export const isAdminOnly = isStaff;           // v2 admin (back-office) ≈ v3 staff
