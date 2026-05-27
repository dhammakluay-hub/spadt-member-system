"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import MemberCard from "@/components/MemberCard";
import RegistrationForm from "@/components/RegistrationForm";
import { MemberAPI, type Member } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { MEMBER_STATUS_LABEL } from "@/lib/constants";
import { Loader2, FileBadge, UserPlus, CheckCircle2, RefreshCw } from "lucide-react";

/**
 * Member self-service profile page.
 *
 * Members can edit ALL their own data (including name, national_id, sport,
 * classification, achievements, documents) so they can keep their profile
 * up to date after competitions without waiting for staff.
 *
 * The actual edit UI is provided by the RegistrationForm component in
 * `mode="edit"` — same fields, same validation, same upload widgets.
 */
export default function MePage() {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const u = await getCurrentUser();
      if (u?.member_id) {
        const m = await MemberAPI.get(u.member_id);
        setMember(m);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <AppShell title="โปรไฟล์ของฉัน">
        <div className="text-gray-500">
          <Loader2 className="inline w-4 h-4 animate-spin" /> กำลังโหลด...
        </div>
      </AppShell>
    );
  }

  // Not yet registered as member — prompt to fill registration form
  if (!member) {
    return (
      <AppShell title="โปรไฟล์ของฉัน">
        <div className="spadt-card text-center py-12">
          <UserPlus className="w-16 h-16 mx-auto text-gray-400 mb-3" />
          <h3 className="text-xl font-bold text-[var(--spadt-navy)]">
            ยังไม่ได้ลงทะเบียนข้อมูลสมาชิก
          </h3>
          <p className="text-sm text-gray-600 mt-2">
            คุณ login แล้ว แต่ยังไม่ได้กรอกข้อมูลสมาชิก กรุณากรอกฟอร์มลงทะเบียน
          </p>
          <Link href="/register" className="mt-4 inline-block spadt-btn spadt-btn-primary">
            กรอกข้อมูลสมาชิก →
          </Link>
        </div>
      </AppShell>
    );
  }

  const memberCode = member.member_code ?? member.id.slice(0, 8).toUpperCase();

  return (
    <AppShell title="โปรไฟล์ของฉัน">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Side info — read only summary */}
        <div className="space-y-4">
          {/* Status banner */}
          <div className="spadt-card">
            <div className="text-xs text-gray-500">สถานะสมาชิก</div>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                member.status === "approved" ? "bg-green-100 text-green-700" :
                member.status === "pending"  ? "bg-yellow-100 text-yellow-700" :
                member.status === "rejected" ? "bg-red-100 text-red-700" :
                "bg-gray-100"
              }`}>
                {member.status === "approved" && <CheckCircle2 className="w-4 h-4" />}
                {MEMBER_STATUS_LABEL[member.status]}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-3">
              รหัสสมาชิก: <span className="font-mono font-semibold">{memberCode}</span>
            </div>
            <div className="text-xs text-gray-500">
              สมัครเมื่อ: {new Date(member.created_at).toLocaleDateString("th-TH")}
            </div>
            {member.updated_at && (
              <div className="text-xs text-gray-500">
                อัพเดตล่าสุด: {new Date(member.updated_at).toLocaleDateString("th-TH")}
              </div>
            )}
          </div>

          {/* Card preview */}
          {member.status === "approved" && (
            <div className="spadt-card">
              <div className="text-xs text-gray-500 mb-2">บัตรสมาชิก</div>
              <div className="flex justify-center">
                <div className="scale-90 origin-top">
                  <MemberCard member={member} />
                </div>
              </div>
            </div>
          )}

          {/* Official report */}
          <div className="spadt-card">
            <Link
              href={`/members/${member.id}/report`}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--spadt-gold)] text-[var(--spadt-navy)] hover:bg-[var(--spadt-gold-light)] font-semibold text-sm"
            >
              <FileBadge className="w-4 h-4" /> ดูรายงานทางการ (PDF)
            </Link>
            <p className="text-xs text-gray-500 mt-2 text-center">
              ใช้ประกอบการยื่นเอกสารกับหน่วยงานราชการ/เอกชน
            </p>
          </div>

          {/* Reload button */}
          <button
            onClick={load}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-sm text-gray-700"
          >
            <RefreshCw className="w-4 h-4" /> รีเฟรชข้อมูล
          </button>
        </div>

        {/* Full edit form — same as registration but with existing data + edit mode */}
        <div className="lg:col-span-2">
          <RegistrationForm
            mode="edit"
            existingMember={member}
            onSaved={load}
          />
        </div>
      </div>
    </AppShell>
  );
}

