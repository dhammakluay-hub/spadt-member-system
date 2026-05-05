"use client";

import { useState } from "react";
import { Plus, Trash2, Upload, FileText, ExternalLink, Loader2 } from "lucide-react";
import { StorageAPI, type CoachLicenseEntry } from "@/lib/api";
import {
  SPORTS,
  COACH_LICENSE_LEVELS,
  COACH_LICENSE_ISSUERS,
  COMPENSATION_SOURCES,
} from "@/lib/constants";

const FIELD =
  "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--spadt-navy)]";
const LABEL = "block text-xs font-medium text-gray-600";

export interface CoachData {
  coach_licenses?: CoachLicenseEntry[] | null;
  nsdf_eligible?: boolean | null;
  monthly_compensation?: number | null;
  compensation_source?: string | null;
  compensation_notes?: string | null;
  compensation_start_date?: string | null;
}

export default function CoachLicenseSection({
  data,
  onChange,
}: {
  data: CoachData;
  onChange: (patch: CoachData) => void;
}) {
  const licenses = data.coach_licenses ?? [];
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  const addLicense = () =>
    onChange({ coach_licenses: [...licenses, {}] });

  const updateLicense = (idx: number, patch: Partial<CoachLicenseEntry>) => {
    const next = [...licenses];
    next[idx] = { ...next[idx], ...patch };
    onChange({ coach_licenses: next });
  };

  const removeLicense = (idx: number) =>
    onChange({ coach_licenses: licenses.filter((_, i) => i !== idx) });

  const uploadCertificate = async (idx: number, file: File) => {
    setUploadingIdx(idx);
    try {
      const path = `coach-certificates/${file.name}`;
      const url = await StorageAPI.uploadPhoto(file, path);
      updateLicense(idx, { certificate_url: url });
    } catch (e) {
      alert(`อัพโหลดไม่สำเร็จ: ${e instanceof Error ? e.message : e}`);
    } finally {
      setUploadingIdx(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ============ ใบประกาศนียบัตร / License ============ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-[var(--spadt-navy)]">
            🎖 ใบประกาศนียบัตร / Coach License
          </h3>
          <span className="text-xs text-gray-500">
            มี {licenses.length} ใบ
          </span>
        </div>

        {licenses.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center bg-gray-50">
            <div className="text-3xl mb-2">📜</div>
            <p className="text-sm text-gray-600">ยังไม่มีใบประกาศนียบัตร</p>
            <p className="text-xs text-gray-500 mt-1">
              กด &ldquo;+ เพิ่มใบประกาศ&rdquo; เพื่อบันทึก License
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {licenses.map((lic, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-[var(--spadt-navy)]">
                    License #{idx + 1}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLicense(idx)}
                    className="text-red-500 hover:text-red-700 flex items-center gap-1 text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> ลบ
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className={LABEL}>ระดับ License *</label>
                    <select
                      className={FIELD}
                      value={lic.level ?? ""}
                      onChange={(e) => updateLicense(idx, { level: e.target.value })}
                    >
                      <option value="">-- เลือกระดับ --</option>
                      {COACH_LICENSE_LEVELS.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={LABEL}>กีฬา (ถ้าเฉพาะกีฬา)</label>
                    <select
                      className={FIELD}
                      value={lic.sport_code ?? ""}
                      onChange={(e) =>
                        updateLicense(idx, { sport_code: e.target.value })
                      }
                    >
                      <option value="">-- ทุกกีฬา / ไม่ระบุ --</option>
                      {SPORTS.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.name_th}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={LABEL}>ผู้ออกใบประกาศ *</label>
                    <select
                      className={FIELD}
                      value={lic.issuer ?? ""}
                      onChange={(e) =>
                        updateLicense(idx, { issuer: e.target.value })
                      }
                    >
                      <option value="">-- เลือก --</option>
                      {COACH_LICENSE_ISSUERS.map((i) => (
                        <option key={i} value={i}>
                          {i}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={LABEL}>เลขที่ใบประกาศ</label>
                    <input
                      className={FIELD}
                      placeholder="เช่น CERT-2024-001"
                      value={lic.certificate_no ?? ""}
                      onChange={(e) =>
                        updateLicense(idx, { certificate_no: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className={LABEL}>วันที่ออก</label>
                    <input
                      type="date"
                      className={FIELD}
                      value={lic.issued_date ?? ""}
                      onChange={(e) =>
                        updateLicense(idx, { issued_date: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className={LABEL}>วันหมดอายุ</label>
                    <input
                      type="date"
                      className={FIELD}
                      value={lic.expiry_date ?? ""}
                      onChange={(e) =>
                        updateLicense(idx, { expiry_date: e.target.value })
                      }
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className={LABEL}>หมายเหตุ</label>
                    <input
                      className={FIELD}
                      placeholder="เช่น สอนเฉพาะระดับเยาวชน, License เฉพาะกีฬาวีลแชร์เทนนิส"
                      value={lic.notes ?? ""}
                      onChange={(e) =>
                        updateLicense(idx, { notes: e.target.value })
                      }
                    />
                  </div>

                  {/* PDF/Image upload */}
                  <div className="md:col-span-3">
                    <label className={LABEL}>ไฟล์ใบประกาศนียบัตร (PDF / รูปภาพ)</label>
                    <div className="mt-2 border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50/30">
                      {lic.certificate_url ? (
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <a
                            href={lic.certificate_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                          >
                            <FileText className="w-4 h-4" />
                            ดูไฟล์ใบประกาศ
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <label className="text-xs text-gray-600 hover:text-[var(--spadt-navy)] cursor-pointer inline-flex items-center gap-1">
                            <Upload className="w-3 h-3" /> อัพโหลดใหม่
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) uploadCertificate(idx, f);
                              }}
                            />
                          </label>
                        </div>
                      ) : (
                        <label className="cursor-pointer text-center block">
                          {uploadingIdx === idx ? (
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                              <Loader2 className="w-4 h-4 animate-spin" /> กำลังอัพโหลด...
                            </div>
                          ) : (
                            <>
                              <Upload className="w-6 h-6 mx-auto text-blue-400 mb-1" />
                              <p className="text-sm text-gray-600">
                                คลิกเพื่ออัพโหลดไฟล์ PDF หรือรูปภาพ
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                JPG / PNG / PDF ขนาดไม่เกิน 10MB
                              </p>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            disabled={uploadingIdx === idx}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) uploadCertificate(idx, f);
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={addLicense}
          className="mt-3 w-full py-2 rounded-lg border-2 border-dashed border-[var(--spadt-gold)] text-[var(--spadt-navy)] hover:bg-[var(--spadt-cream)] flex items-center justify-center gap-2 text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> เพิ่มใบประกาศนียบัตร
        </button>
      </div>

      {/* ============ ค่าตอบแทน ============ */}
      <div>
        <h3 className="font-bold text-[var(--spadt-navy)] mb-3">
          💰 ค่าตอบแทน (สำหรับผู้ฝึกสอน/ผู้ช่วย)
        </h3>

        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
          {/* NSDF Eligibility */}
          <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1"
              checked={!!data.nsdf_eligible}
              onChange={(e) => onChange({ nsdf_eligible: e.target.checked })}
            />
            <div>
              <div className="font-semibold text-sm text-[var(--spadt-navy)]">
                มีสิทธิ์เบิกค่าตอบแทนจากกองทุนพัฒนาการกีฬาแห่งชาติ (NSDF)
              </div>
              <div className="text-xs text-gray-600 mt-0.5">
                ผู้ฝึกสอน/ผู้ช่วยที่ผ่านเกณฑ์ของ กกท. และอยู่ในรายชื่อทีมชาติ
                สามารถเบิกเบี้ยเลี้ยง/ที่พัก/อาหาร ระหว่างเก็บตัว
                (≤ 900 บาท/วัน ตามประกาศ NSDF)
              </div>
            </div>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className={LABEL}>แหล่งที่มาของค่าตอบแทน</label>
              <select
                className={FIELD}
                value={data.compensation_source ?? ""}
                onChange={(e) =>
                  onChange({ compensation_source: e.target.value })
                }
              >
                <option value="">-- เลือก --</option>
                {COMPENSATION_SOURCES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL}>ค่าตอบแทนรายเดือน (บาท)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={FIELD}
                placeholder="เช่น 15000"
                value={data.monthly_compensation ?? ""}
                onChange={(e) =>
                  onChange({
                    monthly_compensation: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
              />
            </div>

            <div>
              <label className={LABEL}>เริ่มได้รับตั้งแต่</label>
              <input
                type="date"
                className={FIELD}
                value={data.compensation_start_date ?? ""}
                onChange={(e) =>
                  onChange({ compensation_start_date: e.target.value })
                }
              />
            </div>

            <div className="md:col-span-3">
              <label className={LABEL}>หมายเหตุค่าตอบแทน</label>
              <textarea
                className={FIELD}
                rows={2}
                placeholder="เช่น เบิกผ่านสมาคม X เป็นรายเดือน + เบี้ยเลี้ยงเก็บตัว NSDF 900 บ./วัน"
                value={data.compensation_notes ?? ""}
                onChange={(e) =>
                  onChange({ compensation_notes: e.target.value })
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
