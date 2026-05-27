import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = [
  "/login", "/signup", "/forgot-password", "/reset-password",
  "/verify", // public QR-scan verification — anyone can verify a member card
  "/_next", "/favicon.ico",
  "/manifest.json", "/sw.js", "/icon-192.svg", "/icon-512.svg",
];

/**
 * Role v3:
 *   admin  — จัดการทุกอย่าง · จัดการผู้ใช้ · ดู Audit Log
 *   staff  — ลงทะเบียน · แก้ไข · อนุมัติสมาชิก · ดูรายงาน
 *   member — ดูข้อมูลตนเอง · บัตรสมาชิก · สมัคร/ส่งใบสมัครเอง
 */

/** Pages only ADMIN can access */
const ADMIN_ONLY = [
  "/admin/users",   // จัดการผู้ใช้
  "/admin/audit",   // Audit Log
];

/** Pages STAFF + ADMIN can access (back-office, hidden from member) */
const STAFF_AND_ABOVE = [
  "/members",
  "/pending",
  "/cards",
  "/import",
  "/reports",
  "/settings",
  "/admin/notifications",
];

/** Pages members are sent to when they try back-office pages */
const MEMBER_HOME = "/me";

function normalizeRole(raw: string | null | undefined): "admin" | "staff" | "member" {
  if (raw === "super_admin") return "admin";
  if (raw === "admin") return "admin";
  if (raw === "staff") return "staff";
  return "member";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Look up role from profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = normalizeRole((profile as { role?: string } | null)?.role);

  // EXCEPTION: members can view their OWN report PDF
  // — let this through before any other role-gate fires.
  // RLS on `members` already restricts them to their own row, so even if a
  // member tampers with the id in the URL they cannot read someone else's data.
  const isMemberOwnReport =
    role === "member" && /^\/members\/[^/]+\/report\/?$/.test(pathname);
  if (isMemberOwnReport) {
    return response;
  }

  const needsAdmin = ADMIN_ONLY.some((p) => pathname.startsWith(p));
  const needsStaffOrAbove = STAFF_AND_ABOVE.some((p) => pathname.startsWith(p));

  // Admin-only page — staff goes to /dashboard, member to /me
  if (needsAdmin && role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = role === "staff" ? "/dashboard" : MEMBER_HOME;
    return NextResponse.redirect(url);
  }

  // Staff+ page — member is bounced to /me (admin and staff both pass)
  if (needsStaffOrAbove && role === "member") {
    const url = request.nextUrl.clone();
    url.pathname = MEMBER_HOME;
    return NextResponse.redirect(url);
  }

  // Member trying to view ANY /members/* page that isn't their own report
  // → bounce back to /me. (The /report exception is already handled above.)
  if (role === "member" && /^\/members\/[^/]+/.test(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = MEMBER_HOME;
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
