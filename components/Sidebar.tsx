"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Clock,
  CreditCard,
  FileText,
  BookOpen,
  Settings,
  LogOut,
  Shield,
  History,
  Upload,
  PieChart,
  LifeBuoy,
  Mail,
  User,
} from "lucide-react";
import { SPADT_BRAND } from "@/lib/constants";
import {
  signOut,
  getCurrentUser,
  type AuthUser,
  type UserRole,
  ROLE_LABEL,
  ROLE_BADGE_CLASS,
  isAdmin,
  canViewAllMembers,
  canApproveMembers,
} from "@/lib/auth";

type NavItem = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  /** Roles that can SEE this nav item. Empty = everyone */
  roles?: UserRole[];
};

/**
 * Navigation per role v3:
 *   admin  — full menu + admin section (จัดการผู้ใช้ + Audit Log)
 *   staff  — back-office only (members, pending, cards, import, reports, settings)
 *   member — self-service (โปรไฟล์, บัตรของตัวเอง)
 *            — "สมัครสมาชิก" หาย่อย่างเดียวเมื่อ member ยังไม่ได้กรอกฟอร์ม
 *              (member_id == null). ถ้ากรอกแล้ว เมนูนี้ถูกซ่อน — ใช้ /me แก้ไขข้อมูลแทน
 */
const MAIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "แดชบอร์ด", Icon: LayoutDashboard, roles: ["admin", "staff"] },
  { href: "/me", label: "โปรไฟล์ของฉัน", Icon: User, roles: ["member"] },
  // /register: shown to admin/staff always; shown to member ONLY if not yet registered (filtered below)
  { href: "/register", label: "สมัครสมาชิก", Icon: UserPlus, roles: ["member", "staff", "admin"] },
  { href: "/members", label: "สมาชิก", Icon: Users, roles: ["admin", "staff"] },
  { href: "/pending", label: "รออนุมัติ", Icon: Clock, roles: ["admin", "staff"] },
  // /cards: admin/staff get full management, member is redirected to their own card on /me
  { href: "/cards", label: "บัตรสมาชิก", Icon: CreditCard, roles: ["admin", "staff"] },
  { href: "/import", label: "นำเข้า Excel", Icon: Upload, roles: ["admin", "staff"] },
  { href: "/reports", label: "รายงาน", Icon: FileText, roles: ["admin", "staff"] },
  { href: "/reports/advanced", label: "รายงานขั้นสูง", Icon: PieChart, roles: ["admin", "staff"] },
  { href: "/classification", label: "Classification", Icon: BookOpen },
  { href: "/support", label: "ศูนย์ช่วยเหลือ", Icon: LifeBuoy },
  { href: "/settings", label: "ตั้งค่า", Icon: Settings, roles: ["admin", "staff"] },
];

const ADMIN_NAV: NavItem[] = [
  // จัดการผู้ใช้งาน + Audit Log = ADMIN เท่านั้น
  { href: "/admin/users", label: "จัดการผู้ใช้งาน", Icon: Shield, roles: ["admin"] },
  { href: "/admin/audit", label: "Audit Log", Icon: History, roles: ["admin"] },
  // Email Queue = admin + staff
  { href: "/admin/notifications", label: "Email Queue", Icon: Mail, roles: ["admin", "staff"] },
];

function visibleFor(user: AuthUser | null, items: NavItem[]) {
  const role = user?.role;
  if (!role) return [];
  return items.filter((it) => {
    // role gate
    if (it.roles && !it.roles.includes(role)) return false;
    // member-specific: hide /register once they've completed the form (have member_id)
    if (role === "member" && it.href === "/register" && user?.member_id) return false;
    return true;
  });
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => setUser(null));
  }, []);

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  const main = visibleFor(user, MAIN_NAV);
  const admin = visibleFor(user, ADMIN_NAV);
  const showAdminSection = admin.length > 0;

  return (
    <aside className="w-64 bg-[var(--spadt-navy)] text-white flex flex-col min-h-screen">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--spadt-gold)] flex items-center justify-center font-bold text-[var(--spadt-navy)]">
            S
          </div>
          <div>
            <div className="font-bold text-lg">{SPADT_BRAND.name}</div>
            <div className="text-xs text-white/70">{SPADT_BRAND.tagline}</div>
          </div>
        </div>
        {user && (
          <div className="mt-3 text-xs text-white/80 truncate">
            {user.email}
            <span className={`ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${ROLE_BADGE_CLASS[user.role]}`}>
              {ROLE_LABEL[user.role]}
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {main.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                active
                  ? "bg-[var(--spadt-gold)] text-[var(--spadt-navy)] font-semibold"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <item.Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {showAdminSection && (
          <>
            <div className="mt-6 mb-2 px-3 text-[10px] uppercase tracking-widest text-[var(--spadt-gold)] font-semibold">
              {isAdmin(user) ? "Admin" : "Staff"}
            </div>
            {admin.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    active
                      ? "bg-[var(--spadt-gold)] text-[var(--spadt-navy)] font-semibold"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <item.Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <button
        onClick={handleLogout}
        className="m-4 flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/80 hover:bg-red-500/20 hover:text-white transition-all"
      >
        <LogOut className="w-5 h-5" />
        <span>ออกจากระบบ</span>
      </button>
    </aside>
  );
}

// Suppress unused import warnings for dual-role helpers used by other modules
void canViewAllMembers;
void canApproveMembers;
