"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, CheckCircle2, XCircle, Loader2, FileText, ExternalLink, Printer, FileDown, FileBadge } from "lucide-react";
import AppShell from "@/components/AppShell";
import { MemberAPI, AdminAPI, type Member, type AuditLog } from "@/lib/api";
import { getCurrentUser, canEditMembers, canApproveMembers, type AuthUser } from "@/lib/auth";
import { SPORTS, MEMBER_STATUS_LABEL, GENDERS, PERSONNEL_TYPES, COMPETITION_LEVELS, CLASSIFICATIONS_BY_SPORT, ASSISTIVE_DEVICES, DOCUMENT_TYPES, WORK_STATUS, ORGANIZATION_TYPES, COACH_PERSONNEL_TYPES } from "@/lib/constants";
import CoachLicenseSection from "@/components/CoachLicenseSection";

type Props = { params: Promise<{ id: string }> };

export default function MemberDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [draft, setDraft] = useState<Partial<Member>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audit, setAudit] = useState<AuditLog[]>([]);
  const [me, setMe] = useState<AuthUser | null>(null);
  const readOnly = !canEditMembers(me); // member: read-only; admin/staff: edit

  useEffect(() => { getCurrentUser().then(setMe).catch(() => setMe(null)); }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const m = await MemberAPI.get(id);
      if (!m) {
        setError("ไม่พบสมาชิก");
        return;
      }
      setMember(m);
      setDraft({});
      const logs = await AdminAPI.listAuditLogs({ recordId: id, limit: 30 }).catch(() => []);
      setAudit(logs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const update = (patch: Partial<Member>) => setDraft((prev) => ({ ...prev, ...patch }));

  const save = async () => {
    if (!member || Object.keys(draft).length === 0) return;
    setSaving(true);
    try {
      await MemberAPI.update(member.id, draft);
      await load();
    } catch (e) {
      alert("บันทึกไม่สำเร็จ: " + (e instanceof Error ? e.message : e));
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (status: Member["status"]) => {
    if (!member) return;
    if (!confirm(`ยืนยันเปลี่ยนสถานะเป็น "${MEMBER_STATUS_LABEL[status]}"?`)) return;
    setSaving(true);
    try {
      await MemberAPI.setStatus(member.id, status);
      await load();
    } catch (e) {
      alert("Error: " + (e instanceof Error ? e.message : e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!member) return;
    if (!confirm("ลบสมาชิกถาวร? การดำเนินการนี้ย้อนกลับไม่ได้")) return;
    try {
      await MemberAPI.remove(member.id);
      router.push("/members");
    } catch (e) {
      alert("ลบไม่สำเร็จ: " + (e instanceof Error ? e.message : e));
    }
  };

  if (loading) {
    return (
      <AppShell title="สมาชิก">
        <div className="flex items-center gap-2 text-gray-500"><Loader2 className="w-5 h-5 animate-spin" /> กำลังโหลด...</div>
      </AppShell>
    );
  }

  if (error || !member) {
    return (
      <AppShell title="สมาชิก">
        <div className="spadt-card text-center text-red-600">{error ?? "ไม่พบสมาชิก"}</div>
        <Link href="/members" className="text-sm text-blue-600 hover:underline mt-3 inline-block">← กลับ</Link>
      </AppShell>
    );
  }

  const cur = { ...member, ...draft };
  const sport = SPORTS.find((s) => s.code === cur.sport_code);
  const classes = cur.sport_code ? CLASSIFICATIONS_BY_SPORT[cur.sport_code] ?? [] : [];
  const dirty = Object.keys(draft).length > 0;
  const FIELD = `mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--spadt-navy)] ${readOnly ? "bg-gray-50 cursor-not-allowed" : ""}`;
  const LABEL = "block text-xs font-medium text-gray-600";

  return (
    <AppShell title={`สมาชิก: ${cur.first_name} ${cur.last_name}`}>
      <style jsx global>{`
        @media print {
          aside, header, .no-print { display: none !important; }
          main { padding: 0 !important; }
          .spadt-card { break-inside: avoid; box-shadow: none !important; border: 1px solid #ccc !important; }
        }
      `}</style>

      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4 no-print">
        <Link href="/members" className="flex items-center gap-1 text-sm text-gray-600 hover:text-[var(--spadt-navy)]">
          <ArrowLeft className="w-4 h-4" /> กลับ
        </Link>
        <Link href={`/members/${id}/report`} className="px-3 py-1.5 rounded-lg bg-[var(--spadt-gold)] text-[var(--spadt-navy)] hover:bg-[var(--spadt-gold-light)] text-sm flex items-center gap-1 font-semibold">
          <FileBadge className="w-4 h-4" /> รายงานทางการ
        </Link>
        <button onClick={() => window.print()} className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm flex items-center gap-1">
          <Printer className="w-4 h-4" /> พิมพ์
        </button>
        <button
          onClick={async () => {
            try {
              const [{ toPng }, { default: jsPDF }] = await Promise.all([
                import("html-to-image"),
                import("jspdf"),
              ]);
              const main = document.querySelector("main") as HTMLElement | null;
              if (!main) return;
              const dataUrl = await toPng(main, { pixelRatio: 2, cacheBust: true, backgroundColor: "#ffffff" });
              const img = new Image();
              await new Promise<void>((resolve) => { img.onload = () => resolve(); img.src = dataUrl; });
              const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
              const w = pdf.internal.pageSize.getWidth() - 20;
              const h = (img.height * w) / img.width;
              pdf.addImage(dataUrl, "PNG", 10, 10, w, h);
              pdf.save(`member-${cur.first_name}-${cur.last_name}.pdf`);
            } catch (e) {
              alert("ส่งออก PDF ไม่สำเร็จ: " + (e instanceof Error ? e.message : e));
            }
          }}
          className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm flex items-center gap-1"
        >
          <FileDown className="w-4 h-4" /> PDF
        </button>
        <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${
          cur.status === "approved" ? "bg-green-100 text-green-700" :
          cur.status === "pending" ? "bg-yellow-100 text-yellow-700" :
          cur.status === "rejected" ? "bg-red-100 text-red-700" : "bg-gray-100"
        }`}>
          {MEMBER_STATUS_LABEL[cur.status]}
        </span>
        {canApproveMembers(me) && cur.status !== "approved" && (
          <button onClick={() => setStatus("approved")} className="px-3 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 text-sm flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> อนุมัติ
          </button>
        )}
        {canApproveMembers(me) && cur.status !== "rejected" && (
          <button onClick={() => setStatus("rejected")} className="px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 text-sm flex items-center gap-1">
            <XCircle className="w-4 h-4" /> ปฏิเสธ
          </button>
        )}
        {canEditMembers(me) && (
          <button onClick={remove} className="px-3 py-1.5 rounded-lg bg-gray-200 hover:bg-red-100 hover:text-red-700 text-sm flex items-center gap-1">
            <Trash2 className="w-4 h-4" /> ลบ
          </button>
        )}
        {readOnly && (
          <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-700 font-semibold">
            👁 อ่านอย่างเดียว — เฉพาะ admin/staff แก้ไขได้
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main edit panel — wrapped in fieldset to disable all inputs in read-only mode */}
        <fieldset disabled={readOnly} className="lg:col-span-2 space-y-4 disabled:opacity-90">
          {/* Personal */}
          <section className="spadt-card">
            <h3 className="font-bold text-[var(--spadt-navy)] mb-3">👤 ข้อมูลส่วนตัว</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className={LABEL}>คำนำหน้า</label>
                <input className={FIELD} value={cur.title ?? ""} onChange={(e) => update({ title: e.target.value })} />
              </div>
              <div>
                <label className={LABEL}>ชื่อ (ไทย)</label>
                <input className={FIELD} value={cur.first_name ?? ""} onChange={(e) => update({ first_name: e.target.value })} />
              </div>
              <div>
                <label className={LABEL}>นามสกุล (ไทย)</label>
                <input className={FIELD} value={cur.last_name ?? ""} onChange={(e) => update({ last_name: e.target.value })} />
              </div>
              <div>
                <label className={LABEL}>ชื่อ (อังกฤษ)</label>
                <input className={FIELD} value={cur.first_name_en ?? ""} onChange={(e) => update({ first_name_en: e.target.value })} />
              </div>
              <div>
                <label className={LABEL}>นามสกุล (อังกฤษ)</label>
                <input className={FIELD} value={cur.last_name_en ?? ""} onChange={(e) => update({ last_name_en: e.target.value })} />
              </div>
              <div>
                <label className={LABEL}>เลขบัตรประชาชน</label>
                <input className={FIELD} value={cur.national_id ?? ""} onChange={(e) => update({ national_id: e.target.value })} />
              </div>
              <div>
                <label className={LABEL}>วันเกิด</label>
                <input type="date" className={FIELD} value={cur.birth_date ?? ""} onChange={(e) => update({ birth_date: e.target.value })} />
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
                <input className={FIELD} value={cur.phone ?? ""} onChange={(e) => update({ phone: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className={LABEL}>อีเมล</label>
                <input type="email" className={FIELD} value={cur.email ?? ""} onChange={(e) => update({ email: e.target.value })} />
              </div>
              <div>
                <label className={LABEL}>Member Code</label>
                <input className={FIELD} value={cur.member_code ?? ""} onChange={(e) => update({ member_code: e.target.value })} placeholder="(auto)" />
              </div>
            </div>
          </section>

          {/* Address */}
          <section className="spadt-card">
            <h3 className="font-bold text-[var(--spadt-navy)] mb-3">🏠 ที่อยู่</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-3">
                <label className={LABEL}>ที่อยู่</label>
                <input className={FIELD} value={cur.address ?? ""} onChange={(e) => update({ address: e.target.value })} />
              </div>
              <div><label className={LABEL}>จังหวัด</label><input className={FIELD} value={cur.province ?? ""} onChange={(e) => update({ province: e.target.value })} /></div>
              <div><label className={LABEL}>อำเภอ</label><input className={FIELD} value={cur.district ?? ""} onChange={(e) => update({ district: e.target.value })} /></div>
              <div><label className={LABEL}>ตำบล</label><input className={FIELD} value={cur.subdistrict ?? ""} onChange={(e) => update({ subdistrict: e.target.value })} /></div>
              <div><label className={LABEL}>ภูมิภาค</label><input className={FIELD} value={cur.region ?? ""} onChange={(e) => update({ region: e.target.value })} /></div>
              <div><label className={LABEL}>รหัสไปรษณีย์</label><input className={FIELD} value={cur.postal_code ?? ""} onChange={(e) => update({ postal_code: e.target.value })} /></div>
            </div>
          </section>

          {/* Sport & Classification */}
          <section className="spadt-card">
            <h3 className="font-bold text-[var(--spadt-navy)] mb-3">🏅 ข้อมูลกีฬา</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className={LABEL}>ประเภทบุคลากร</label>
                <select className={FIELD} value={cur.personnel_type ?? ""} onChange={(e) => update({ personnel_type: e.target.value })}>
                  <option value="">—</option>
                  {PERSONNEL_TYPES.map((p) => <option key={p.code} value={p.code}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>ชนิดกีฬา</label>
                <select className={FIELD} value={cur.sport_code ?? ""} onChange={(e) => update({ sport_code: e.target.value, classification_code: "" })}>
                  <option value="">—</option>
                  {SPORTS.map((s) => <option key={s.code} value={s.code}>{s.name_th}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>ระดับการแข่งขัน</label>
                <select className={FIELD} value={cur.competition_level ?? ""} onChange={(e) => update({ competition_level: e.target.value })}>
                  <option value="">—</option>
                  {COMPETITION_LEVELS.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={LABEL}>Classification Class</label>
                <select className={FIELD} value={cur.classification_code ?? ""} onChange={(e) => update({ classification_code: e.target.value })}>
                  <option value="">—</option>
                  {classes.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.description.slice(0, 60)}</option>)}
                </select>
              </div>
              <div><label className={LABEL}>สังกัด</label><input className={FIELD} value={cur.team_province ?? ""} onChange={(e) => update({ team_province: e.target.value })} /></div>
            </div>
          </section>

          {/* Work */}
          <section className="spadt-card">
            <h3 className="font-bold text-[var(--spadt-navy)] mb-3">💼 ข้อมูลการทำงาน</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className={LABEL}>สถานะการทำงาน</label>
                <select className={FIELD} value={cur.work_status ?? ""} onChange={(e) => update({ work_status: e.target.value })}>
                  <option value="">—</option>
                  {WORK_STATUS.map((w) => <option key={w.code} value={w.code}>{w.label}</option>)}
                </select>
              </div>
              <div><label className={LABEL}>หน่วยงาน</label><input className={FIELD} value={cur.work_organization ?? ""} onChange={(e) => update({ work_organization: e.target.value })} /></div>
              <div><label className={LABEL}>ตำแหน่ง</label><input className={FIELD} value={cur.work_position ?? ""} onChange={(e) => update({ work_position: e.target.value })} /></div>
              <div>
                <label className={LABEL}>ประเภทหน่วยงาน</label>
                <select className={FIELD} value={cur.work_organization_type ?? ""} onChange={(e) => update({ work_organization_type: e.target.value })}>
                  <option value="">—</option>
                  {ORGANIZATION_TYPES.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
                </select>
              </div>
              <div><label className={LABEL}>เริ่มงาน (พ.ศ.)</label><input className={FIELD} value={cur.work_start_year ?? ""} onChange={(e) => update({ work_start_year: e.target.value })} /></div>
            </div>
          </section>

          {/* Coach License (only for coach/staff/manager/guide) */}
          {cur.personnel_type && COACH_PERSONNEL_TYPES.includes(cur.personnel_type) && (
            <section className="spadt-card border-2 border-[var(--spadt-gold)]">
              <div className="text-xs text-[var(--spadt-gold-dark)] uppercase tracking-widest mb-3 font-semibold">
                หมวดผู้ฝึกสอน / ผู้ช่วย / เจ้าหน้าที่ทีม
              </div>
              <CoachLicenseSection data={cur} onChange={(patch) => update(patch)} />
            </section>
          )}

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
        </fieldset>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Photo */}
          <section className="spadt-card text-center">
            {cur.photo_url ? (
              <img src={cur.photo_url} alt="member" className="w-32 h-40 object-cover rounded mx-auto border" />
            ) : (
              <div className="w-32 h-40 bg-gray-100 rounded mx-auto flex items-center justify-center text-gray-400">ไม่มีรูป</div>
            )}
            <div className="mt-3 text-xs text-gray-500">ID: <span className="font-mono">{cur.id.slice(0, 8)}</span></div>
            <div className="text-xs text-gray-500">สมัคร: {new Date(cur.created_at).toLocaleString("th-TH")}</div>
          </section>

          {/* Devices */}
          <section className="spadt-card">
            <h3 className="font-bold text-sm text-[var(--spadt-navy)] mb-2">♿ อุปกรณ์ช่วยเหลือ</h3>
            {(cur.assistive_devices ?? []).length === 0 ? (
              <p className="text-xs text-gray-500">—</p>
            ) : (
              <ul className="text-sm space-y-1">
                {cur.assistive_devices!.map((d, i) => (
                  <li key={i}>• {ASSISTIVE_DEVICES.find((x) => x.code === d.code)?.label ?? d.code} {d.custom ? `— ${d.custom}` : ""}</li>
                ))}
              </ul>
            )}
          </section>

          {/* Achievements */}
          <section className="spadt-card">
            <h3 className="font-bold text-sm text-[var(--spadt-navy)] mb-2">🏆 ผลงาน ({(cur.achievements ?? []).length})</h3>
            {(cur.achievements ?? []).length === 0 ? (
              <p className="text-xs text-gray-500">—</p>
            ) : (
              <div className="space-y-2 text-sm">
                {cur.achievements!.map((a, i) => (
                  <div key={i} className="border rounded p-2 bg-gray-50">
                    <div className="font-medium">{a.year ?? "?"} · {a.event ?? "-"}</div>
                    <div className="text-xs text-gray-600">{a.result ?? ""} {a.description ? `· ${a.description}` : ""}</div>
                    {(a.image_urls ?? []).length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {a.image_urls!.map((u, j) => (
                          <a key={j} href={u} target="_blank" rel="noreferrer">
                            <img src={u} className="w-10 h-10 object-cover rounded" alt="" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Documents */}
          <section className="spadt-card">
            <h3 className="font-bold text-sm text-[var(--spadt-navy)] mb-2">📎 เอกสารแนบ ({(cur.documents ?? []).length})</h3>
            {(cur.documents ?? []).length === 0 ? (
              <p className="text-xs text-gray-500">—</p>
            ) : (
              <ul className="text-sm space-y-1">
                {cur.documents!.map((d, i) => {
                  const meta = DOCUMENT_TYPES.find((t) => t.code === d.type);
                  return (
                    <li key={i}>
                      <a href={d.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        <FileText className="w-3 h-3" /> {meta?.label ?? d.type} <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Audit log */}
          <section className="spadt-card">
            <h3 className="font-bold text-sm text-[var(--spadt-navy)] mb-2">📋 ประวัติการแก้ไข ({audit.length})</h3>
            {audit.length === 0 ? (
              <p className="text-xs text-gray-500">ยังไม่มีบันทึก</p>
            ) : (
              <div className="space-y-2 text-xs max-h-80 overflow-y-auto">
                {audit.map((log) => (
                  <div key={log.id} className="border-l-2 border-gray-200 pl-2 py-1">
                    <div className="flex justify-between gap-2">
                      <span className={`font-semibold ${
                        log.action === "APPROVE" ? "text-green-600" :
                        log.action === "REJECT" ? "text-red-600" :
                        log.action === "INSERT" ? "text-blue-600" :
                        log.action === "DELETE" ? "text-red-700" : "text-gray-700"
                      }`}>{log.action}</span>
                      <span className="text-gray-400">{new Date(log.created_at).toLocaleString("th-TH")}</span>
                    </div>
                    <div className="text-gray-600">โดย: {log.actor_email ?? "—"}</div>
                    {log.changes && log.action === "UPDATE" && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-blue-600">ดูการเปลี่ยนแปลง</summary>
                        <pre className="text-[10px] mt-1 bg-gray-50 p-1 rounded overflow-x-auto">{JSON.stringify(log.changes, null, 2)}</pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Notes / Consent */}
          <section className="spadt-card text-xs text-gray-600 space-y-1">
            <h3 className="font-bold text-sm text-[var(--spadt-navy)] mb-2">หมายเหตุ & ความยินยอม</h3>
            <div>PDPA: {cur.consent_pdpa ? "✓" : "✗"} · Terms: {cur.consent_terms ? "✓" : "✗"} · Images: {cur.consent_images ? "✓" : "✗"}</div>
            {cur.signed_at && <div>เซ็น: {new Date(cur.signed_at).toLocaleString("th-TH")}</div>}
            {cur.additional_notes && <div className="mt-2 p-2 bg-yellow-50 rounded">{cur.additional_notes}</div>}
            <div className="text-gray-400 text-[10px] mt-2">Sport: {sport?.name_th ?? "—"}</div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
