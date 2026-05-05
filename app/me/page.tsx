"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import MemberCard from "@/components/MemberCard";
import { MemberAPI, type Member } from "@/lib/api";
import { getCurrentUser, type AuthUser } from "@/lib/auth";
import { GENDERS, SPORTS, MEMBER_STATUS_LABEL } from "@/lib/constants";
import { Save, Loader2, AlertCircle, FileBadge, UserPlus, CheckCircle2 } from "lucide-react";

const FIELD = "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--spadt-navy)]";
const LABEL = "block text-xs font-medium text-gray-600";

export default function MePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [draft, setDraft] = useState<Partial<Member>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const u = await getCurrentUser();
      setUser(u);
      if (u?.member_id) {
        const m = await MemberAPI.get(u.member_id);
        setMember(m);
        setDraft({});
      }
    } catch (e) {
      setMsg("Error: " + (e instanceof Error ? e.message : e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const update = (patch: Partial<Member>) => setDraft((p) => ({ ...p, ...patch }));

  const save = async () => {
    if (!member || Object.keys(draft).length === 0) return;
    setSaving(true);
    setMsg(null);
    try {
      await MemberAPI.update(member.id, draft);
      setMsg("✓ บันทึกสำเร็จ");
      await load();
    } catch (e) {
      setMsg("Error: " + (e instanceof Error ? e.message : e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <AppShell title="โปรไฟล์ของฉัน"><div className="text-gray-500"><Loader2 className="inline w-4 h-4 animate-spin"/> กำลังโหลด...</div></AppShell>;
  }

  // Not yet registered as member → prompt
  if (!member) {
    return (
      <AppShell title="โปรไฟล์ของฉัน">
        <div className="spadt-card text-center py-12">
          <UserPlus className="w-16 h-16 mx-auto text-gray-400 mb-3" />
          <h3 className="text-xl font-bold text-[var(--spadt-navy)]">ยังไม่ได้ลงทะเบียนข้อมูลสมาชิก</h3>
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

  const cur = { ...member, ...draft };
  const dirty = Object.keys(draft).length > 0;
  const sport = SPORTS.find((s) => s.code === cur.sport_code);

  return (
    <AppShell title="โปรไฟล์ของฉัน">
      {msg && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${msg.startsWith("✓") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Side info — read only */}
        <div className="space-y-4">
          {/* Status banner */}
          <div className="spadt-card">
            <div className="text-xs text-gray-500">สถานะสมาชิก</div>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                cur.status === "approved" ? "bg-green-100 text-green-700" :
                cur.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                cur.status === "rejected" ? "bg-red-100 text-red-700" : "bg-gray-100"
              }`}>
                {cur.status === "approved" && <CheckCircle2 className="w-4 h-4" />}
                {MEMBER_STATUS_LABEL[cur.status]}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-3">
              รหัสสมาชิก: <span className="font-mono font-semibold">{cur.member_code ?? cur.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="text-xs text-gray-500">
              สมัครเมื่อ: {new Date(cur.created_at).toLocaleDateString("th-TH")}
            </div>
          </div>

          {/* Card preview */}
          {cur.status === "approved" && (
            <div className="spadt-card">
              <div className="text-xs text-gray-500 mb-2">บัตรสมาชิก</div>
              <div className="flex justify-center">
                <div className="scale-90 origin-top">
                  <MemberCard member={cur as Member} />
                </div>
              </div>
            </div>
          )}

          {/* Official report */}
          <div className="spadt-card">
            <Link
              href={`/members/${cur.id}/report`}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--spadt-gold)] text-[var(--spadt-navy)] hover:bg-[var(--spadt-gold-light)] font-semibold text-sm"
            >
              <FileBadge className="w-4 h-4" /> ดูรายงานทางการ (PDF)
            </Link>
            <p className="text-xs text-gray-500 mt-2 text-center">
              ใช้ประกอบการยื่นเอกสารกับหน่วยงานราชการ/เอกชน
            </p>
          </div>

          {/* Read-only key info */}
          <div className="spadt-card">
            <h3 className="font-bold text-sm text-[var(--spadt-navy)] mb-2">ข้อมูลที่แก้ไม่ได้</h3>
            <dl className="text-xs space-y-1.5">
              <div>
                <dt className="text-gray-500">เลขประจำตัวประชาชน</dt>
                <dd className="font-mono font-semibold">{cur.national_id ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">ชื่อ-นามสกุล</dt>
                <dd className="font-semibold">{cur.first_name} {cur.last_name}</dd>
              </div>
              <div>
                <dt className="text-gray-500">วันเกิด</dt>
                <dd>{cur.birth_date ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">กีฬา / Class</dt>
                <dd>{sport?.name_th ?? "—"} {cur.classification_code && `· ${cur.classification_code}`}</dd>
              </div>
            </dl>
            <p className="text-[10px] text-gray-400 mt-2 italic">
              ต้องการแก้ไขข้อมูลข้างต้น? กรุณาติดต่อเจ้าหน้าที่ผ่านศูนย์ช่วยเหลือ
            </p>
          </div>
        </div>

        {/* Editable fields */}
        <div className="lg:col-span-2 space-y-4">
          {/* Contact */}
          <section className="spadt-card">
            <h3 className="font-bold text-[var(--spadt-navy)] mb-3">📞 ข้อมูลติดต่อ (แก้ไขได้)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>ชื่อเล่น</label>
                <input className={FIELD} value={cur.nickname ?? ""} onChange={(e) => update({ nickname: e.target.value })} />
              </div>
              <div>
                <label className={LABEL}>เพศ</label>
                <select className={FIELD} value={cur.gender ?? ""} onChange={(e) => update({ gender: e.target.value })}>
                  <option value="">—</option>
                  {GENDERS.map((g) => <option key={g.code} value={g.code}>{g.label}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>โทรศัพท์</label>
                <input type="tel" className={FIELD} value={cur.phone ?? ""} onChange={(e) => update({ phone: e.target.value })} />
              </div>
              <div>
                <label className={LABEL}>อีเมล</label>
                <input type="email" className={FIELD} value={cur.email ?? ""} onChange={(e) => update({ email: e.target.value })} />
              </div>
            </div>
          </section>

          {/* Address */}
          <section className="spadt-card">
            <h3 className="font-bold text-[var(--spadt-navy)] mb-3">🏠 ที่อยู่ (แก้ไขได้)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-3">
                <label className={LABEL}>ที่อยู่</label>
                <input className={FIELD} value={cur.address ?? ""} onChange={(e) => update({ address: e.target.value })} />
              </div>
              <div><label className={LABEL}>จังหวัด</label><input className={FIELD} value={cur.province ?? ""} onChange={(e) => update({ province: e.target.value })} /></div>
              <div><label className={LABEL}>อำเภอ</label><input className={FIELD} value={cur.district ?? ""} onChange={(e) => update({ district: e.target.value })} /></div>
              <div><label className={LABEL}>ตำบล</label><input className={FIELD} value={cur.subdistrict ?? ""} onChange={(e) => update({ subdistrict: e.target.value })} /></div>
              <div><label className={LABEL}>รหัสไปรษณีย์</label><input className={FIELD} value={cur.postal_code ?? ""} onChange={(e) => update({ postal_code: e.target.value })} /></div>
            </div>
          </section>

          {/* Save bar */}
          {dirty && (
            <div className="sticky bottom-4 z-10 spadt-card flex items-center justify-between bg-[var(--spadt-cream)] border-2 border-[var(--spadt-gold)]">
              <span className="text-sm">มีการเปลี่ยนแปลง {Object.keys(draft).length} ฟิลด์</span>
              <div className="flex gap-2">
                <button onClick={() => setDraft({})} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm">ยกเลิก</button>
                <button onClick={save} disabled={saving} className="spadt-btn spadt-btn-primary px-4 py-2 flex items-center gap-1 text-sm disabled:opacity-50">
                  <Save className="w-4 h-4" /> {saving ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </div>
          )}

          {/* Notice */}
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-900 flex gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">หมายเหตุ</div>
              <p className="text-xs mt-1">
                คุณสามารถแก้ไขเฉพาะข้อมูลติดต่อและที่อยู่เท่านั้น ข้อมูลอื่นๆ (ชื่อ-นามสกุล, เลขบัตร, กีฬา, classification, ผลงาน, เอกสาร)
                ต้องติดต่อเจ้าหน้าที่ผ่านศูนย์ช่วยเหลือ ({" "}
                <Link href="/support" className="underline">/support</Link>{" "})
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
