"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { SettingsAPI, type OrgInfo, type SystemConfig } from "@/lib/api";
import { Save, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [sys, setSys] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingOrg, setSavingOrg] = useState(false);
  const [savingSys, setSavingSys] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      SettingsAPI.get<OrgInfo>("org_info"),
      SettingsAPI.get<SystemConfig>("system"),
    ])
      .then(([o, s]) => {
        setOrg(o ?? { name: "", short_name: "", tagline: "", email: "", phone: "", website: "", address: "" });
        setSys(s ?? { allow_public_register: true, require_admin_approval: true, member_code_prefix: "SPADT", card_validity_years: 2 });
      })
      .catch((e) => setMsg("โหลดไม่สำเร็จ: " + (e instanceof Error ? e.message : e)))
      .finally(() => setLoading(false));
  }, []);

  const saveOrg = async () => {
    if (!org) return;
    setSavingOrg(true);
    setMsg(null);
    try {
      await SettingsAPI.set("org_info", org);
      setMsg("✓ บันทึกข้อมูลองค์กรสำเร็จ");
    } catch (e) {
      setMsg("Error: " + (e instanceof Error ? e.message : e));
    } finally {
      setSavingOrg(false);
    }
  };

  const saveSys = async () => {
    if (!sys) return;
    setSavingSys(true);
    setMsg(null);
    try {
      await SettingsAPI.set("system", sys);
      setMsg("✓ บันทึกค่าระบบสำเร็จ");
    } catch (e) {
      setMsg("Error: " + (e instanceof Error ? e.message : e));
    } finally {
      setSavingSys(false);
    }
  };

  const FIELD = "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--spadt-navy)]";
  const LABEL = "block text-xs font-medium text-gray-600";

  if (loading) {
    return (
      <AppShell title="ตั้งค่าระบบ">
        <div className="text-gray-500"><Loader2 className="inline w-4 h-4 animate-spin"/> กำลังโหลด...</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="ตั้งค่าระบบ">
      {msg && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${msg.startsWith("✓") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
          {msg}
        </div>
      )}

      <div className="space-y-4">
        {/* Org info */}
        {org && (
          <div className="spadt-card">
            <h3 className="font-bold text-[var(--spadt-navy)] mb-4">🏢 ข้อมูลองค์กร</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className={LABEL}>ชื่อเต็ม</label>
                <input className={FIELD} value={org.name} onChange={(e) => setOrg({ ...org, name: e.target.value })} />
              </div>
              <div>
                <label className={LABEL}>ชื่อย่อ</label>
                <input className={FIELD} value={org.short_name} onChange={(e) => setOrg({ ...org, short_name: e.target.value })} />
              </div>
              <div>
                <label className={LABEL}>คำโปรย / Tagline</label>
                <input className={FIELD} value={org.tagline} onChange={(e) => setOrg({ ...org, tagline: e.target.value })} />
              </div>
              <div>
                <label className={LABEL}>อีเมลติดต่อ</label>
                <input type="email" className={FIELD} value={org.email} onChange={(e) => setOrg({ ...org, email: e.target.value })} />
              </div>
              <div>
                <label className={LABEL}>โทรศัพท์</label>
                <input className={FIELD} value={org.phone} onChange={(e) => setOrg({ ...org, phone: e.target.value })} />
              </div>
              <div>
                <label className={LABEL}>เว็บไซต์</label>
                <input className={FIELD} value={org.website} onChange={(e) => setOrg({ ...org, website: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className={LABEL}>ที่อยู่</label>
                <textarea className={FIELD} rows={2} value={org.address} onChange={(e) => setOrg({ ...org, address: e.target.value })} />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={saveOrg} disabled={savingOrg} className="spadt-btn spadt-btn-primary flex items-center gap-2 text-sm disabled:opacity-50">
                {savingOrg ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                บันทึก
              </button>
            </div>
          </div>
        )}

        {/* System config */}
        {sys && (
          <div className="spadt-card">
            <h3 className="font-bold text-[var(--spadt-navy)] mb-4">⚙️ ค่าระบบ</h3>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" className="mt-1" checked={sys.allow_public_register} onChange={(e) => setSys({ ...sys, allow_public_register: e.target.checked })} />
                <div>
                  <div className="font-semibold text-sm">เปิดให้ลงทะเบียนสาธารณะ</div>
                  <div className="text-xs text-gray-600">ใครก็ตามที่เข้าหน้า /register สามารถสมัครได้ (ไม่ต้อง login)</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" className="mt-1" checked={sys.require_admin_approval} onChange={(e) => setSys({ ...sys, require_admin_approval: e.target.checked })} />
                <div>
                  <div className="font-semibold text-sm">ต้องอนุมัติโดย admin/staff ก่อนใช้งาน</div>
                  <div className="text-xs text-gray-600">สมาชิกใหม่จะอยู่ในสถานะ &ldquo;รออนุมัติ&rdquo; จนกว่าจะมีคนอนุมัติ</div>
                </div>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className={LABEL}>Prefix รหัสสมาชิก (Member Code)</label>
                  <input className={FIELD} value={sys.member_code_prefix} onChange={(e) => setSys({ ...sys, member_code_prefix: e.target.value })} />
                </div>
                <div>
                  <label className={LABEL}>อายุบัตรสมาชิก (ปี)</label>
                  <input type="number" min={1} max={10} className={FIELD} value={sys.card_validity_years} onChange={(e) => setSys({ ...sys, card_validity_years: Number(e.target.value) || 1 })} />
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={saveSys} disabled={savingSys} className="spadt-btn spadt-btn-primary flex items-center gap-2 text-sm disabled:opacity-50">
                {savingSys ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                บันทึก
              </button>
            </div>
          </div>
        )}

        {/* Connection info (read-only) */}
        <div className="spadt-card">
          <h3 className="font-bold text-[var(--spadt-navy)] mb-3">🔗 Supabase Connection (read-only)</h3>
          <dl className="grid grid-cols-3 gap-y-2 text-sm">
            <dt className="text-gray-500">URL</dt>
            <dd className="col-span-2 font-mono text-xs break-all">{process.env.NEXT_PUBLIC_SUPABASE_URL ?? "(unset)"}</dd>
            <dt className="text-gray-500">Anon Key</dt>
            <dd className="col-span-2 font-mono text-xs break-all">
              {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 30)}...
            </dd>
          </dl>
          <p className="text-xs text-gray-500 mt-3">แก้ที่ <code>.env.local</code> แล้ว restart dev server</p>
        </div>

        {/* Roles & Permissions reference */}
        <div className="spadt-card">
          <h3 className="font-bold text-[var(--spadt-navy)] mb-3">🛡️ Roles & Permissions</h3>
          <ul className="space-y-2 text-sm">
            <li><span className="font-semibold text-purple-700">Admin</span> — จัดการทุกอย่าง · จัดการผู้ใช้ · ดู Audit Log</li>
            <li><span className="font-semibold text-orange-700">Staff</span> — ลงทะเบียน · แก้ไข · อนุมัติสมาชิก · ดูรายงาน</li>
            <li><span className="font-semibold text-gray-700">Member</span> — ดูข้อมูลตนเอง · บัตรสมาชิก</li>
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
