"use client";

import { useEffect, useState, use, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, FileDown, Loader2 } from "lucide-react";
import { MemberAPI, SettingsAPI, type Member, type OrgInfo } from "@/lib/api";
import {
  SPORTS,
  GENDERS,
  PERSONNEL_TYPES,
  COMPETITION_LEVELS,
  CLASSIFICATIONS_BY_SPORT,
  ASSISTIVE_DEVICES,
  DOCUMENT_TYPES,
  WORK_STATUS,
  ORGANIZATION_TYPES,
  DISABILITY_EMPLOYMENT_ARTICLES,
  COMPENSATION_SOURCES,
  COACH_PERSONNEL_TYPES,
} from "@/lib/constants";

type Props = { params: Promise<{ id: string }> };

export default function MemberReportPage({ params }: Props) {
  const { id } = use(params);
  const [member, setMember] = useState<Member | null>(null);
  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([MemberAPI.get(id), SettingsAPI.get<OrgInfo>("org_info")])
      .then(([m, o]) => {
        if (!m) setError("ไม่พบสมาชิก");
        else setMember(m);
        setOrg(o);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, [id]);

  const exportPDF = async () => {
    if (!reportRef.current || !member) return;
    setExporting(true);
    try {
      const [{ toPng }, { default: jsPDF }] = await Promise.all([
        import("html-to-image"),
        import("jspdf"),
      ]);
      const dataUrl = await toPng(reportRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
      });
      const img = new Image();
      await new Promise<void>((resolve) => { img.onload = () => resolve(); img.src = dataUrl; });
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgWidth = pdfWidth - margin * 2;
      const imgHeight = (img.height * imgWidth) / img.width;
      let heightLeft = imgHeight;
      let position = margin;
      pdf.addImage(dataUrl, "PNG", margin, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight - margin * 2;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(dataUrl, "PNG", margin, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight - margin * 2;
      }
      pdf.save(`SPADT-Profile-${member.first_name}-${member.last_name}.pdf`);
    } catch (e) {
      alert("ส่งออก PDF ไม่สำเร็จ: " + (e instanceof Error ? e.message : e));
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-3">{error ?? "ไม่พบสมาชิก"}</p>
          <Link href="/members" className="text-blue-600 hover:underline">← กลับ</Link>
        </div>
      </div>
    );
  }

  const m = member;
  const sport = SPORTS.find((s) => s.code === m.sport_code);
  const cls = m.sport_code
    ? CLASSIFICATIONS_BY_SPORT[m.sport_code]?.find((c) => c.code === m.classification_code)
    : null;
  const personnel = PERSONNEL_TYPES.find((p) => p.code === m.personnel_type);
  const compLevel = COMPETITION_LEVELS.find((c) => c.code === m.competition_level);
  const gender = GENDERS.find((g) => g.code === m.gender);
  const workStatus = WORK_STATUS.find((w) => w.code === m.work_status);
  const orgType = ORGANIZATION_TYPES.find((o) => o.code === m.work_organization_type);
  const article = DISABILITY_EMPLOYMENT_ARTICLES.find((a) => a.code === m.disability_employment_article);
  const compSrc = COMPENSATION_SOURCES.find((c) => c.code === m.compensation_source);
  const isCoach = m.personnel_type && COACH_PERSONNEL_TYPES.includes(m.personnel_type);

  const fmtDate = (d: string | null | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
  };

  const memberCode = m.member_code ?? `SPADT-${m.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-gray-100">
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
        .report-page {
          max-width: 210mm;
          margin: 0 auto;
          background: white;
          padding: 18mm 18mm;
          font-family: var(--font-sarabun), sans-serif;
          color: #1a1a1a;
          line-height: 1.5;
        }
        .report-section {
          margin-top: 20px;
          break-inside: avoid;
        }
        .report-h2 {
          font-size: 14pt;
          font-weight: 700;
          color: #0a1e3f;
          padding-bottom: 6px;
          margin-bottom: 12px;
          border-bottom: 2px solid #d4af37;
        }
        .report-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11pt;
        }
        .report-table td {
          padding: 6px 8px;
          vertical-align: top;
          border-bottom: 1px solid #e5e7eb;
        }
        .report-table td.label {
          color: #6b7280;
          width: 35%;
          font-weight: 500;
        }
        .report-table td.value { font-weight: 500; color: #111; }
      `}</style>

      {/* Toolbar */}
      <div className="no-print sticky top-0 z-10 bg-white border-b shadow-sm px-6 py-3 flex items-center justify-between">
        <Link href={`/members/${m.id}`} className="flex items-center gap-1 text-sm text-gray-600 hover:text-[var(--spadt-navy)]">
          <ArrowLeft className="w-4 h-4" /> กลับสู่หน้าแก้ไข
        </Link>
        <div className="text-sm text-gray-500">รายงานข้อมูลสมาชิกฉบับทางการ</div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm flex items-center gap-1">
            <Printer className="w-4 h-4" /> พิมพ์
          </button>
          <button onClick={exportPDF} disabled={exporting} className="px-3 py-1.5 rounded-lg bg-[var(--spadt-navy)] text-white hover:bg-[var(--spadt-navy-light)] text-sm flex items-center gap-1 disabled:opacity-50">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            {exporting ? "กำลังสร้าง..." : "ดาวน์โหลด PDF"}
          </button>
        </div>
      </div>

      {/* The report */}
      <div ref={reportRef} className="report-page my-6 shadow-lg print:shadow-none print:my-0">
        {/* Header */}
        <div className="flex items-start justify-between border-b-4 border-[var(--spadt-navy)] pb-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--spadt-gold)] flex items-center justify-center font-bold text-[var(--spadt-navy)] text-xl">
                S
              </div>
              <div>
                <div className="text-lg font-bold text-[var(--spadt-navy)]">
                  {org?.name ?? "สมาคมกีฬาคนพิการแห่งประเทศไทย"}
                </div>
                <div className="text-xs text-gray-600">
                  {org?.short_name ?? "SPADT Thailand"} · {org?.tagline ?? "Member Management System"}
                </div>
              </div>
            </div>
          </div>
          <div className="text-right text-xs text-gray-600">
            <div className="font-semibold text-sm text-[var(--spadt-navy)]">รายงานข้อมูลสมาชิก</div>
            <div>Member Profile Report</div>
            <div className="mt-1">รหัสสมาชิก: <span className="font-mono font-bold">{memberCode}</span></div>
            <div>ออกเอกสาร: {fmtDate(new Date().toISOString())}</div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center my-6">
          <div className="text-2xl font-bold text-[var(--spadt-navy)]">
            {m.title ?? ""} {m.first_name} {m.last_name}
          </div>
          {(m.first_name_en || m.last_name_en) && (
            <div className="text-sm text-gray-600 mt-1">
              {m.first_name_en} {m.last_name_en}
            </div>
          )}
          <div className="mt-2 inline-block px-3 py-0.5 rounded-full bg-[var(--spadt-cream)] border border-[var(--spadt-gold)] text-xs font-semibold text-[var(--spadt-navy)]">
            {personnel?.label ?? "—"} · {sport?.name_th ?? "—"}
          </div>
        </div>

        {/* Photo + key info */}
        <div className="flex gap-6 items-start">
          {m.photo_url ? (
            <img src={m.photo_url} alt="member" className="w-32 h-40 object-cover rounded border-2 border-gray-300" />
          ) : (
            <div className="w-32 h-40 rounded border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">ไม่มีรูป</div>
          )}
          <div className="flex-1">
            <table className="report-table">
              <tbody>
                <tr><td className="label">ชนิดกีฬาหลัก</td><td className="value">{sport?.name_th ?? "—"} ({sport?.federation ?? "—"})</td></tr>
                <tr><td className="label">Classification</td><td className="value">{cls ? `${cls.code} — ${cls.description}` : m.classification_code ?? "—"}</td></tr>
                <tr><td className="label">ระดับการแข่งขัน</td><td className="value">{compLevel?.label ?? "—"}</td></tr>
                <tr><td className="label">สังกัด</td><td className="value">{m.team_province ?? "—"}</td></tr>
                <tr><td className="label">สถานะสมาชิก</td><td className="value">{m.status === "approved" ? "✓ อนุมัติแล้ว" : m.status === "pending" ? "รออนุมัติ" : m.status === "rejected" ? "ปฏิเสธ" : "หมดอายุ"}</td></tr>
                <tr><td className="label">วันที่สมัครเป็นสมาชิก</td><td className="value">{fmtDate(m.created_at)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Personal info */}
        <div className="report-section">
          <div className="report-h2">1. ข้อมูลส่วนตัว</div>
          <table className="report-table">
            <tbody>
              <tr><td className="label">เลขประจำตัวประชาชน</td><td className="value font-mono">{m.national_id ?? "—"}</td></tr>
              <tr><td className="label">วันเดือนปีเกิด</td><td className="value">{fmtDate(m.birth_date)}</td></tr>
              <tr><td className="label">เพศ</td><td className="value">{gender?.label ?? "—"}</td></tr>
              <tr><td className="label">โทรศัพท์</td><td className="value">{m.phone ?? "—"}</td></tr>
              <tr><td className="label">อีเมล</td><td className="value">{m.email ?? "—"}</td></tr>
              <tr><td className="label">ที่อยู่</td><td className="value">
                {[m.address, m.subdistrict && `ตำบล${m.subdistrict}`, m.district && `อำเภอ${m.district}`, m.province && `จังหวัด${m.province}`, m.postal_code]
                  .filter(Boolean).join(" ") || "—"}
                {m.region && <span className="text-xs text-gray-500"> ({m.region})</span>}
              </td></tr>
              {m.passport_no && (
                <tr><td className="label">หนังสือเดินทาง</td><td className="value">เลขที่ {m.passport_no} ({m.passport_country ?? "—"}) · ออก {fmtDate(m.passport_issue_date)} · หมดอายุ {fmtDate(m.passport_expiry_date)}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Education */}
        {(m.educations?.length ?? 0) > 0 && (
          <div className="report-section">
            <div className="report-h2">2. ประวัติการศึกษา</div>
            <table className="report-table">
              <thead><tr style={{ backgroundColor: "#f3f4f6" }}>
                <td className="label" style={{ fontWeight: 600 }}>ระดับ</td>
                <td className="label" style={{ fontWeight: 600 }}>สาขา</td>
                <td className="label" style={{ fontWeight: 600 }}>สถาบัน</td>
                <td className="label" style={{ fontWeight: 600 }}>ปีที่จบ</td>
                <td className="label" style={{ fontWeight: 600 }}>GPA</td>
              </tr></thead>
              <tbody>
                {m.educations!.map((e, i) => (
                  <tr key={i}>
                    <td className="value">{e.level ?? "—"}</td>
                    <td className="value">{e.field ?? "—"}</td>
                    <td className="value">{e.institution ?? "—"}</td>
                    <td className="value">{e.year ?? "—"}</td>
                    <td className="value">{e.gpa ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Work */}
        {(m.work_status || m.work_organization) && (
          <div className="report-section">
            <div className="report-h2">3. ข้อมูลการทำงาน</div>
            <table className="report-table">
              <tbody>
                <tr><td className="label">สถานะ</td><td className="value">{workStatus?.label ?? "—"}</td></tr>
                <tr><td className="label">ตำแหน่ง</td><td className="value">{m.work_position ?? "—"}</td></tr>
                <tr><td className="label">หน่วยงาน / องค์กร</td><td className="value">{m.work_organization ?? "—"}</td></tr>
                <tr><td className="label">ประเภทหน่วยงาน</td><td className="value">{orgType?.label ?? "—"}</td></tr>
                {m.work_start_year && <tr><td className="label">เริ่มทำงาน (พ.ศ.)</td><td className="value">{m.work_start_year}</td></tr>}
                {article && <tr><td className="label">การจ้างงานตาม พ.ร.บ.</td><td className="value">{article.label}</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* Coach license */}
        {isCoach && (m.coach_licenses?.length ?? 0) > 0 && (
          <div className="report-section">
            <div className="report-h2">4. ใบประกาศนียบัตรผู้ฝึกสอน / Coach License</div>
            <table className="report-table">
              <thead><tr style={{ backgroundColor: "#f3f4f6" }}>
                <td className="label" style={{ fontWeight: 600 }}>ระดับ</td>
                <td className="label" style={{ fontWeight: 600 }}>กีฬา</td>
                <td className="label" style={{ fontWeight: 600 }}>ผู้ออก</td>
                <td className="label" style={{ fontWeight: 600 }}>เลขที่</td>
                <td className="label" style={{ fontWeight: 600 }}>ออก/หมดอายุ</td>
              </tr></thead>
              <tbody>
                {m.coach_licenses!.map((l, i) => {
                  const sportName = SPORTS.find((s) => s.code === l.sport_code)?.name_th ?? "ทุกกีฬา";
                  return (
                    <tr key={i}>
                      <td className="value">{l.level ?? "—"}</td>
                      <td className="value">{sportName}</td>
                      <td className="value">{l.issuer ?? "—"}</td>
                      <td className="value font-mono text-xs">{l.certificate_no ?? "—"}</td>
                      <td className="value text-xs">{fmtDate(l.issued_date)}<br />→ {fmtDate(l.expiry_date)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Compensation */}
        {isCoach && (m.monthly_compensation || m.compensation_source || m.nsdf_eligible) && (
          <div className="report-section">
            <div className="report-h2">5. ค่าตอบแทน</div>
            <table className="report-table">
              <tbody>
                <tr><td className="label">มีสิทธิ์เบิก NSDF</td><td className="value">{m.nsdf_eligible ? "✓ ใช่ — เบิกได้ตามประกาศ NSDF (≤ 900 บาท/วัน)" : "✗ ไม่"}</td></tr>
                <tr><td className="label">แหล่งที่มา</td><td className="value">{compSrc?.label ?? "—"}</td></tr>
                <tr><td className="label">ค่าตอบแทนรายเดือน</td><td className="value font-bold">{m.monthly_compensation ? `${m.monthly_compensation.toLocaleString()} บาท` : "—"}</td></tr>
                <tr><td className="label">เริ่มได้รับตั้งแต่</td><td className="value">{fmtDate(m.compensation_start_date)}</td></tr>
                {m.compensation_notes && <tr><td className="label">หมายเหตุ</td><td className="value">{m.compensation_notes}</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* Achievements */}
        {(m.achievements?.length ?? 0) > 0 && (
          <div className="report-section">
            <div className="report-h2">6. ผลงาน / ประวัติการแข่งขัน</div>
            <table className="report-table">
              <thead><tr style={{ backgroundColor: "#f3f4f6" }}>
                <td className="label" style={{ fontWeight: 600, width: "10%" }}>ปี</td>
                <td className="label" style={{ fontWeight: 600, width: "35%" }}>รายการแข่งขัน</td>
                <td className="label" style={{ fontWeight: 600, width: "20%" }}>ระดับ</td>
                <td className="label" style={{ fontWeight: 600 }}>ผลงาน / รายละเอียด</td>
              </tr></thead>
              <tbody>
                {m.achievements!.map((a, i) => (
                  <tr key={i}>
                    <td className="value">{a.year ?? "—"}</td>
                    <td className="value">{a.event ?? "—"}</td>
                    <td className="value text-xs">{COMPETITION_LEVELS.find((c) => c.code === a.level)?.label ?? "—"}</td>
                    <td className="value">
                      <strong>{a.result ?? "—"}</strong>
                      {a.description && <div className="text-xs text-gray-600 mt-0.5">{a.description}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Assistive devices */}
        {(m.assistive_devices?.length ?? 0) > 0 && (
          <div className="report-section">
            <div className="report-h2">7. อุปกรณ์ช่วยเหลือที่ใช้ในชีวิตประจำวัน</div>
            <ul className="text-sm list-disc list-inside">
              {m.assistive_devices!.map((d, i) => {
                const meta = ASSISTIVE_DEVICES.find((x) => x.code === d.code);
                return <li key={i}>{meta?.label.replace(/^[^\u0E00-\u0E7F]+\s*/, "") ?? d.code}{d.custom ? ` — ${d.custom}` : ""}</li>;
              })}
            </ul>
          </div>
        )}

        {/* Documents list */}
        {(m.documents?.length ?? 0) > 0 && (
          <div className="report-section">
            <div className="report-h2">8. เอกสารแนบ ({m.documents!.length} ไฟล์)</div>
            <ul className="text-sm list-disc list-inside">
              {m.documents!.map((d, i) => {
                const meta = DOCUMENT_TYPES.find((t) => t.code === d.type);
                return <li key={i}>{meta?.label ?? d.type}{d.filename ? ` — ${d.filename}` : ""}</li>;
              })}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t-2 border-[var(--spadt-navy)]">
          <div className="grid grid-cols-2 gap-12">
            <div className="text-center text-xs">
              <div className="border-b border-gray-400 mb-1 mt-12 mx-6"></div>
              <div>(เจ้าของข้อมูล)</div>
              <div className="mt-1">{m.first_name} {m.last_name}</div>
              <div className="text-gray-500">วันที่ ........../........../..........</div>
            </div>
            <div className="text-center text-xs">
              <div className="border-b border-gray-400 mb-1 mt-12 mx-6"></div>
              <div>(เจ้าหน้าที่ผู้ออกเอกสาร)</div>
              <div className="mt-1">{org?.short_name ?? "SPADT Thailand"}</div>
              <div className="text-gray-500">วันที่ {fmtDate(new Date().toISOString())}</div>
            </div>
          </div>

          <div className="mt-8 text-center text-[10px] text-gray-500">
            เอกสารฉบับนี้ออกโดย <strong>{org?.name ?? "สมาคมกีฬาคนพิการแห่งประเทศไทย"}</strong> · {org?.website ?? "spadt.or.th"} · {org?.email ?? "info@spadt.or.th"} · {org?.phone ?? "—"}
            <br />
            สร้างโดยระบบ Member Management System · รหัสสมาชิก {memberCode} · ID: {m.id}
          </div>
        </div>
      </div>
    </div>
  );
}
