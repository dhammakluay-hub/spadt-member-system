"use client";

import { useState } from "react";
import { Upload, FileText, CheckCircle2, XCircle, AlertCircle, ExternalLink, Trash2 } from "lucide-react";
import type { RegistrationData } from "./index";
import { StorageAPI, type DocumentEntry } from "@/lib/api";
import { DOCUMENT_TYPES, SPORTS, MEMBER_STATUS_LABEL, PERSONNEL_TYPES } from "@/lib/constants";

const SECTION_TITLE =
  "flex items-center gap-2 text-lg font-bold text-[var(--spadt-navy)] border-b border-[var(--spadt-gold)] pb-2 mt-6 mb-4";

export default function Step3({
  data,
  onChange,
  onBack,
  onSubmit,
  submitting,
}: {
  data: RegistrationData;
  onChange: (patch: RegistrationData) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const [uploadingCode, setUploadingCode] = useState<string | null>(null);
  const documents: DocumentEntry[] = data.documents ?? [];

  const findDoc = (code: string) => documents.find((d) => d.type === code);

  const upsertDoc = (entry: DocumentEntry) => {
    const next = documents.filter((d) => d.type !== entry.type);
    next.push(entry);
    onChange({ documents: next });
  };

  const removeDoc = (code: string) => {
    onChange({ documents: documents.filter((d) => d.type !== code) });
  };

  const handleUpload = async (code: string, file: File) => {
    setUploadingCode(code);
    try {
      const path = `documents/${code}/${file.name}`;
      const url = await StorageAPI.uploadPhoto(file, path);
      upsertDoc({
        type: code,
        url,
        filename: file.name,
        uploaded_at: new Date().toISOString(),
      });
    } catch (e) {
      alert(`อัพโหลดไม่สำเร็จ: ${e instanceof Error ? e.message : e}`);
    } finally {
      setUploadingCode(null);
    }
  };

  // Required documents coverage
  const requiredCodes = DOCUMENT_TYPES.filter((t) => t.required).map((t) => t.code);
  const uploadedRequired = requiredCodes.filter((c) => !!findDoc(c));
  const missingRequired = requiredCodes.filter((c) => !findDoc(c));

  // Consent flags
  const allConsentChecked =
    !!data.consent_pdpa && !!data.consent_terms && !!data.consent_images;

  const canSubmit =
    missingRequired.length === 0 && allConsentChecked && !submitting;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit();
      }}
      className="space-y-2"
    >
      {/* ====================== 1. เอกสารแนบ ====================== */}
      <h2 className={SECTION_TITLE}>
        <span>📎</span> เอกสารประกอบการสมัคร
        <span className="ml-auto text-xs font-normal text-gray-500">
          อัพโหลดแล้ว {documents.length}/{DOCUMENT_TYPES.length} · จำเป็น {uploadedRequired.length}/{requiredCodes.length}
        </span>
      </h2>

      <div className="space-y-3">
        {DOCUMENT_TYPES.map((doc) => {
          const entry = findDoc(doc.code);
          const isUploading = uploadingCode === doc.code;
          return (
            <div
              key={doc.code}
              className={`rounded-lg border p-4 transition-all ${
                entry
                  ? "border-green-300 bg-green-50/30"
                  : doc.required
                    ? "border-yellow-300 bg-yellow-50/30"
                    : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl pt-0.5">{doc.icon ?? "📄"}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[var(--spadt-navy)]">
                      {doc.label}
                    </span>
                    {doc.required ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                        จำเป็น *
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        ไม่บังคับ
                      </span>
                    )}
                    {entry && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> อัพโหลดแล้ว
                      </span>
                    )}
                  </div>
                  {doc.description && (
                    <p className="text-xs text-gray-600 mt-1">{doc.description}</p>
                  )}

                  {/* Upload area / preview */}
                  {entry ? (
                    <div className="mt-3 flex items-center gap-3 flex-wrap">
                      <a
                        href={entry.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                      >
                        <FileText className="w-4 h-4" />
                        {entry.filename ?? "ดูไฟล์"}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <label className="text-xs text-gray-600 hover:text-[var(--spadt-navy)] cursor-pointer inline-flex items-center gap-1">
                        <Upload className="w-3 h-3" /> อัพโหลดใหม่
                        <input
                          type="file"
                          accept={doc.accept}
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUpload(doc.code, f);
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => removeDoc(doc.code)}
                        className="text-xs text-red-500 hover:text-red-700 inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> ลบ
                      </button>
                    </div>
                  ) : (
                    <label className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-lg border border-dashed border-gray-400 hover:border-[var(--spadt-navy)] hover:bg-gray-50 cursor-pointer text-sm">
                      <Upload className="w-4 h-4" />
                      {isUploading ? "กำลังอัพโหลด..." : "เลือกไฟล์"}
                      <input
                        type="file"
                        accept={doc.accept}
                        disabled={isUploading}
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUpload(doc.code, f);
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ====================== 2. หมายเหตุเพิ่มเติม ====================== */}
      <h2 className={SECTION_TITLE}>
        <span>📝</span> หมายเหตุเพิ่มเติม
      </h2>
      <textarea
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-[var(--spadt-navy)]"
        placeholder="ข้อมูลอื่นๆ ที่ต้องการแจ้งเจ้าหน้าที่ (ถ้ามี)"
        value={data.additional_notes ?? ""}
        onChange={(e) => onChange({ additional_notes: e.target.value })}
      />

      {/* ====================== 3. ข้อตกลงและความยินยอม ====================== */}
      <h2 className={SECTION_TITLE}>
        <span>✅</span> ข้อตกลงและความยินยอม
      </h2>
      <div className="space-y-3">
        <label className="flex gap-3 items-start p-3 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer">
          <input
            type="checkbox"
            className="mt-1"
            checked={!!data.consent_pdpa}
            onChange={(e) => onChange({ consent_pdpa: e.target.checked })}
          />
          <div className="text-sm">
            <div className="font-semibold text-[var(--spadt-navy)]">
              ยินยอมให้เก็บและใช้ข้อมูลส่วนบุคคล (PDPA) *
            </div>
            <div className="text-xs text-gray-600 mt-0.5">
              ข้าพเจ้ายินยอมให้สมาคมกีฬาคนพิการแห่งประเทศไทยเก็บ ใช้ และเปิดเผยข้อมูลส่วนบุคคล
              ตามวัตถุประสงค์ของสมาคม และตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
            </div>
          </div>
        </label>

        <label className="flex gap-3 items-start p-3 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer">
          <input
            type="checkbox"
            className="mt-1"
            checked={!!data.consent_terms}
            onChange={(e) => onChange({ consent_terms: e.target.checked })}
          />
          <div className="text-sm">
            <div className="font-semibold text-[var(--spadt-navy)]">
              ยืนยันว่าข้อมูลทั้งหมดเป็นความจริง *
            </div>
            <div className="text-xs text-gray-600 mt-0.5">
              ข้าพเจ้ารับรองว่าข้อมูลที่กรอกและเอกสารที่แนบเป็นความจริงทุกประการ
              หากตรวจพบการปลอมแปลงจะถือว่าใบสมัครเป็นโมฆะ
            </div>
          </div>
        </label>

        <label className="flex gap-3 items-start p-3 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer">
          <input
            type="checkbox"
            className="mt-1"
            checked={!!data.consent_images}
            onChange={(e) => onChange({ consent_images: e.target.checked })}
          />
          <div className="text-sm">
            <div className="font-semibold text-[var(--spadt-navy)]">
              ยินยอมให้ใช้ภาพ/วิดีโอในการประชาสัมพันธ์ *
            </div>
            <div className="text-xs text-gray-600 mt-0.5">
              ยินยอมให้สมาคมใช้ภาพถ่าย/วิดีโอที่ถ่ายระหว่างกิจกรรม สำหรับเผยแพร่ประชาสัมพันธ์
              โดยไม่เรียกร้องค่าตอบแทน
            </div>
          </div>
        </label>
      </div>

      {/* ====================== 4. สรุปข้อมูลก่อนส่ง ====================== */}
      <h2 className={SECTION_TITLE}>
        <span>📋</span> สรุปข้อมูลก่อนส่งใบสมัคร
      </h2>
      <div className="rounded-lg bg-[var(--spadt-cream)] border border-[var(--spadt-gold)] p-4 space-y-3 text-sm">
        <div className="flex items-start gap-4">
          {data.photo_url ? (
            <img
              src={data.photo_url}
              alt="photo"
              className="w-20 h-24 rounded object-cover border"
            />
          ) : (
            <div className="w-20 h-24 rounded border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
              ไม่มีรูป
            </div>
          )}
          <div className="flex-1">
            <div className="text-lg font-bold text-[var(--spadt-navy)]">
              {data.title ? `${data.title} ` : ""}
              {data.first_name} {data.last_name}
              {data.nickname ? ` (${data.nickname})` : ""}
            </div>
            {(data.first_name_en || data.last_name_en) && (
              <div className="text-gray-600">
                {data.first_name_en} {data.last_name_en}
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              เลขบัตร {data.national_id ?? "-"} · เกิด {data.birth_date ?? "-"}
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          <dt className="text-gray-600">ประเภทบุคลากร</dt>
          <dd className="font-medium">
            {PERSONNEL_TYPES.find((p) => p.code === data.personnel_type)?.label ?? "-"}
          </dd>
          <dt className="text-gray-600">กีฬา</dt>
          <dd className="font-medium">
            {SPORTS.find((s) => s.code === data.sport_code)?.name_th ?? "-"}
          </dd>
          <dt className="text-gray-600">Classification</dt>
          <dd className="font-medium">{data.classification_code ?? "-"}</dd>
          <dt className="text-gray-600">สังกัด</dt>
          <dd className="font-medium">{data.team_province ?? "-"}</dd>
          <dt className="text-gray-600">ที่อยู่</dt>
          <dd className="font-medium">
            {[data.subdistrict, data.district, data.province].filter(Boolean).join(" · ") || "-"}
          </dd>
          <dt className="text-gray-600">เอกสารแนบ</dt>
          <dd className="font-medium">
            {documents.length} ไฟล์ ({uploadedRequired.length}/{requiredCodes.length} จำเป็น)
          </dd>
          <dt className="text-gray-600">อุปกรณ์ช่วยเหลือ</dt>
          <dd className="font-medium">
            {data.assistive_devices?.length ?? 0} รายการ
          </dd>
          <dt className="text-gray-600">ผลงาน</dt>
          <dd className="font-medium">{data.achievements?.length ?? 0} รายการ</dd>
          <dt className="text-gray-600">สถานะหลังส่ง</dt>
          <dd>
            <span className="inline-block px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">
              {MEMBER_STATUS_LABEL.pending}
            </span>
          </dd>
        </dl>
      </div>

      {/* ====================== Submit status ====================== */}
      {missingRequired.length > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-800 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">เอกสารจำเป็นยังไม่ครบ</div>
            <div className="text-xs mt-1">
              กรุณาอัพโหลด:{" "}
              {missingRequired
                .map((c) => DOCUMENT_TYPES.find((t) => t.code === c)?.label)
                .join(" · ")}
            </div>
          </div>
        </div>
      )}

      {!allConsentChecked && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800 flex items-start gap-2">
          <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>กรุณาติ๊กยืนยันทั้ง 3 ข้อตกลงก่อนส่งใบสมัคร</div>
        </div>
      )}

      {/* ====================== Submit buttons ====================== */}
      <div className="flex justify-between mt-8 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2.5 rounded-lg bg-gray-200 hover:bg-gray-300"
        >
          ← ย้อนกลับ
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="spadt-btn spadt-btn-gold px-6 py-2.5 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "กำลังบันทึก..." : "✓ ส่งใบสมัคร"}
        </button>
      </div>
    </form>
  );
}
