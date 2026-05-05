"use client";

import { useEffect, useRef, useState } from "react";
import type { RegistrationData } from "./index";
import type { EducationEntry } from "@/lib/api";
import {
  GENDERS,
  TITLES,
  EDUCATION_LEVELS,
  WORK_STATUS,
  ORGANIZATION_TYPES,
  DISABILITY_EMPLOYMENT_ARTICLES,
} from "@/lib/constants";
import { StorageAPI, MemberAPI } from "@/lib/api";
import AddressPicker from "@/components/AddressPicker";
import { Plus, Trash2, Check, AlertCircle, Loader2 } from "lucide-react";

const FIELD =
  "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--spadt-navy)]";
const LABEL = "block text-sm font-medium text-gray-700";
const SECTION_TITLE =
  "flex items-center gap-2 text-lg font-bold text-[var(--spadt-navy)] border-b border-[var(--spadt-gold)] pb-2 mt-6 mb-4";

export default function Step1({
  data,
  onChange,
  onNext,
}: {
  data: RegistrationData;
  onChange: (patch: RegistrationData) => void;
  onNext: () => void;
}) {
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingPassport, setUploadingPassport] = useState(false);

  // National ID duplicate check state
  const [nidStatus, setNidStatus] = useState<"idle" | "checking" | "valid" | "duplicate" | "invalid">("idle");
  const nidCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkNationalId = async (id: string) => {
    if (id.length !== 13 || !/^[0-9]{13}$/.test(id)) {
      setNidStatus(id.length === 0 ? "idle" : "invalid");
      return;
    }
    setNidStatus("checking");
    try {
      const exists = await MemberAPI.checkNationalIdExists(id);
      setNidStatus(exists ? "duplicate" : "valid");
    } catch {
      setNidStatus("idle");
    }
  };

  // Debounce check on every change
  useEffect(() => {
    if (nidCheckTimer.current) clearTimeout(nidCheckTimer.current);
    const id = data.national_id ?? "";
    if (id.length === 0) {
      setNidStatus("idle");
      return;
    }
    nidCheckTimer.current = setTimeout(() => checkNationalId(id), 500);
    return () => {
      if (nidCheckTimer.current) clearTimeout(nidCheckTimer.current);
    };
  }, [data.national_id]);

  const educations: EducationEntry[] = data.educations ?? [{}];

  const updateEducation = (idx: number, patch: Partial<EducationEntry>) => {
    const next = [...educations];
    next[idx] = { ...next[idx], ...patch };
    onChange({ educations: next });
  };

  const addEducation = () =>
    onChange({ educations: [...educations, {}] });

  const removeEducation = (idx: number) => {
    const next = educations.filter((_, i) => i !== idx);
    onChange({ educations: next.length ? next : [{}] });
  };

  const handlePhoto = async (file: File) => {
    setUploadingPhoto(true);
    try {
      const path = `photos/${Date.now()}-${file.name}`;
      const url = await StorageAPI.uploadPhoto(file, path);
      onChange({ photo_url: url });
    } catch (e) {
      alert(`อัพโหลดไม่สำเร็จ: ${e instanceof Error ? e.message : e}`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePassport = async (file: File) => {
    setUploadingPassport(true);
    try {
      const path = `passports/${Date.now()}-${file.name}`;
      const url = await StorageAPI.uploadPhoto(file, path);
      onChange({ passport_file_url: url });
    } catch (e) {
      alert(`อัพโหลดไม่สำเร็จ: ${e instanceof Error ? e.message : e}`);
    } finally {
      setUploadingPassport(false);
    }
  };

  const canProceed = nidStatus === "valid";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (nidStatus === "duplicate") {
          alert("เลขบัตรประชาชนนี้มีในระบบแล้ว ไม่สามารถลงทะเบียนซ้ำได้");
          return;
        }
        if (nidStatus !== "valid") {
          alert("กรุณากรอกเลขบัตรประชาชนให้ครบ 13 หลัก");
          return;
        }
        onNext();
      }}
      className="space-y-2"
    >
      {/* ====================== 1. ข้อมูลส่วนตัว ====================== */}
      <h2 className={SECTION_TITLE}>
        <span>👤</span> ข้อมูลส่วนตัว
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Photo upload */}
        <div className="md:row-span-3">
          <label className={LABEL}>📷 รูปภาพติดใบสมัคร</label>
          <div className="mt-2 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 h-48 bg-gray-50">
            {data.photo_url ? (
              <img
                src={data.photo_url}
                alt="preview"
                className="w-32 h-40 object-cover rounded"
              />
            ) : (
              <div className="text-center text-gray-400 text-sm">
                <div className="text-4xl mb-2">👤</div>
                คลิกเพื่อ
                <br />
                อัพโหลดรูป
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handlePhoto(f);
              }}
              className="mt-2 text-xs w-full"
            />
            {uploadingPhoto && (
              <p className="text-xs text-gray-500 mt-1">กำลังอัพโหลด...</p>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-500 text-center">
            ขนาด 1 นิ้ว หรือ 2 นิ้ว · พื้นหลังขาว/ฟ้า
            <br />
            JPG / PNG ไม่เกิน 5MB
          </p>
        </div>

        <div>
          <label className={LABEL}>คำนำหน้า *</label>
          <select
            required
            className={FIELD}
            value={data.title ?? ""}
            onChange={(e) => onChange({ title: e.target.value })}
          >
            <option value="">— เลือก —</option>
            {TITLES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL}>ชื่อ (ภาษาไทย) *</label>
          <input required className={FIELD} placeholder="ชื่อจริง"
            value={data.first_name ?? ""}
            onChange={(e) => onChange({ first_name: e.target.value })} />
        </div>

        <div>
          <label className={LABEL}>นามสกุล (ภาษาไทย) *</label>
          <input required className={FIELD} placeholder="นามสกุล"
            value={data.last_name ?? ""}
            onChange={(e) => onChange({ last_name: e.target.value })} />
        </div>

        <div>
          <label className={LABEL}>ชื่อ (ภาษาอังกฤษ)</label>
          <input className={FIELD} placeholder="First Name"
            value={data.first_name_en ?? ""}
            onChange={(e) => onChange({ first_name_en: e.target.value })} />
        </div>

        <div>
          <label className={LABEL}>นามสกุล (ภาษาอังกฤษ)</label>
          <input className={FIELD} placeholder="Last Name"
            value={data.last_name_en ?? ""}
            onChange={(e) => onChange({ last_name_en: e.target.value })} />
        </div>

        <div>
          <label className={LABEL}>เลขบัตรประชาชน *</label>
          <div className="relative">
            <input
              required
              pattern="[0-9]{13}"
              maxLength={13}
              className={`${FIELD} pr-9 ${
                nidStatus === "duplicate" || nidStatus === "invalid"
                  ? "border-red-400 focus:ring-red-500"
                  : nidStatus === "valid"
                    ? "border-green-400 focus:ring-green-500"
                    : ""
              }`}
              placeholder="กรอกเลข 13 หลัก"
              value={data.national_id ?? ""}
              onChange={(e) => onChange({ national_id: e.target.value.replace(/\D/g, "") })}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {nidStatus === "checking" && (
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              )}
              {nidStatus === "valid" && (
                <Check className="w-4 h-4 text-green-600" />
              )}
              {(nidStatus === "duplicate" || nidStatus === "invalid") && (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
          </div>
          {nidStatus === "duplicate" && (
            <p className="text-xs text-red-600 mt-1">
              ⚠️ เลขบัตรประชาชนนี้มีในระบบแล้ว ไม่สามารถลงทะเบียนซ้ำได้
            </p>
          )}
          {nidStatus === "invalid" && (
            <p className="text-xs text-red-600 mt-1">
              ⚠️ ต้องเป็นตัวเลข 13 หลัก
            </p>
          )}
          {nidStatus === "valid" && (
            <p className="text-xs text-green-600 mt-1">✓ เลขบัตรพร้อมใช้</p>
          )}
        </div>

        <div>
          <label className={LABEL}>วันเดือนปีเกิด *</label>
          <input required type="date" className={FIELD}
            value={data.birth_date ?? ""}
            onChange={(e) => onChange({ birth_date: e.target.value })} />
        </div>

        <div>
          <label className={LABEL}>เพศ *</label>
          <select required className={FIELD}
            value={data.gender ?? ""}
            onChange={(e) => onChange({ gender: e.target.value })}>
            <option value="">— เลือก —</option>
            {GENDERS.map((g) => <option key={g.code} value={g.code}>{g.label}</option>)}
          </select>
        </div>

        <div>
          <label className={LABEL}>เบอร์โทรศัพท์</label>
          <input type="tel" className={FIELD} placeholder="08x-xxx-xxxx"
            value={data.phone ?? ""}
            onChange={(e) => onChange({ phone: e.target.value })} />
        </div>

        <div className="md:col-span-2">
          <label className={LABEL}>อีเมล *</label>
          <input type="email" required className={FIELD} placeholder="email@example.com"
            value={data.email ?? ""}
            onChange={(e) => onChange({ email: e.target.value })} />
        </div>
      </div>

      {/* ====================== 2. ที่อยู่ (cascading) ====================== */}
      <h2 className={SECTION_TITLE}>
        <span>🏠</span> ที่อยู่
      </h2>

      <div className="space-y-4">
        <div>
          <label className={LABEL}>บ้านเลขที่ / ถนน / ซอย</label>
          <input className={FIELD} placeholder="บ้านเลขที่ ถนน ซอย หมู่บ้าน"
            value={data.address ?? ""}
            onChange={(e) => onChange({ address: e.target.value })} />
        </div>

        <AddressPicker
          value={{
            province: data.province,
            district: data.district,
            subdistrict: data.subdistrict,
            region: data.region,
            postal_code: data.postal_code,
          }}
          onChange={(patch) => onChange(patch)}
        />
      </div>

      {/* ====================== 3. Passport ====================== */}
      <h2 className={SECTION_TITLE}>
        <span>🛂</span> ข้อมูลหนังสือเดินทาง (Passport)
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={LABEL}>เลขที่ Passport</label>
          <input className={FIELD} placeholder="เช่น AA1234567"
            value={data.passport_no ?? ""}
            onChange={(e) => onChange({ passport_no: e.target.value })} />
        </div>

        <div>
          <label className={LABEL}>วันออก Passport</label>
          <input type="date" className={FIELD}
            value={data.passport_issue_date ?? ""}
            onChange={(e) => onChange({ passport_issue_date: e.target.value })} />
        </div>

        <div>
          <label className={LABEL}>วันหมดอายุ Passport</label>
          <input type="date" className={FIELD}
            value={data.passport_expiry_date ?? ""}
            onChange={(e) => onChange({ passport_expiry_date: e.target.value })} />
        </div>

        <div className="md:col-span-3">
          <label className={LABEL}>ประเทศที่ออก Passport</label>
          <input className={FIELD}
            value={data.passport_country ?? "ราชอาณาจักรไทย"}
            onChange={(e) => onChange({ passport_country: e.target.value })} />
        </div>

        <div className="md:col-span-3">
          <label className={LABEL}>อัปโหลดไฟล์ Passport</label>
          <div className="mt-2 border-2 border-dashed border-blue-300 rounded-lg p-6 text-center bg-blue-50/50">
            <div className="text-3xl mb-2">📄</div>
            {data.passport_file_url ? (
              <a href={data.passport_file_url} target="_blank" rel="noreferrer"
                className="text-blue-600 hover:underline text-sm">
                ✓ อัพโหลดแล้ว — คลิกเพื่อดู
              </a>
            ) : (
              <p className="text-sm text-gray-600">คลิกหรือลากไฟล์มาวาง</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              รองรับ <strong className="text-blue-600">JPG, PNG, PDF</strong> ขนาดไม่เกิน 10MB
              <br />หน้าข้อมูล + หน้าที่มีตราประทับ
            </p>
            <input type="file" accept="image/*,.pdf"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handlePassport(f);
              }}
              className="mt-3 text-xs" />
            {uploadingPassport && <p className="text-xs text-gray-500 mt-1">กำลังอัพโหลด...</p>}
          </div>
        </div>
      </div>

      {/* ====================== 4. Education (multi-entry) ====================== */}
      <h2 className={SECTION_TITLE}>
        <span>🎓</span> ข้อมูลการศึกษา
      </h2>

      <div className="space-y-4">
        {educations.map((edu, idx) => (
          <div key={idx} className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-[var(--spadt-navy)]">
                การศึกษา #{idx + 1}
              </div>
              {educations.length > 1 && (
                <button type="button"
                  onClick={() => removeEducation(idx)}
                  className="text-red-500 hover:text-red-700 flex items-center gap-1 text-xs">
                  <Trash2 className="w-3.5 h-3.5" /> ลบ
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className={LABEL}>ระดับการศึกษา</label>
                <select className={FIELD}
                  value={edu.level ?? ""}
                  onChange={(e) => updateEducation(idx, { level: e.target.value })}>
                  <option value="">-- เลือกระดับ --</option>
                  {EDUCATION_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>สาขาวิชา / คณะ</label>
                <input className={FIELD} placeholder="เช่น วิทยาศาสตร์การกีฬา"
                  value={edu.field ?? ""}
                  onChange={(e) => updateEducation(idx, { field: e.target.value })} />
              </div>
              <div>
                <label className={LABEL}>สถาบันการศึกษา</label>
                <input className={FIELD} placeholder="ชื่อโรงเรียน / มหาวิทยาลัย"
                  value={edu.institution ?? ""}
                  onChange={(e) => updateEducation(idx, { institution: e.target.value })} />
              </div>
              <div>
                <label className={LABEL}>ปีที่จบ (พ.ศ.)</label>
                <input className={FIELD} placeholder="เช่น 2560"
                  value={edu.year ?? ""}
                  onChange={(e) => updateEducation(idx, { year: e.target.value })} />
              </div>
              <div>
                <label className={LABEL}>เกรดเฉลี่ย (ถ้ามี)</label>
                <input className={FIELD} placeholder="เช่น 3.25"
                  value={edu.gpa ?? ""}
                  onChange={(e) => updateEducation(idx, { gpa: e.target.value })} />
              </div>
            </div>
          </div>
        ))}
        <button type="button"
          onClick={addEducation}
          className="w-full py-2 rounded-lg border-2 border-dashed border-[var(--spadt-gold)] text-[var(--spadt-navy)] hover:bg-[var(--spadt-cream)] flex items-center justify-center gap-2 text-sm font-semibold">
          <Plus className="w-4 h-4" /> เพิ่มการศึกษา
        </button>
      </div>

      {/* ====================== 5. Work (expanded) ====================== */}
      <h2 className={SECTION_TITLE}>
        <span>💼</span> ข้อมูลการทำงาน
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={LABEL}>สถานะการทำงาน *</label>
          <select required className={FIELD}
            value={data.work_status ?? ""}
            onChange={(e) => onChange({ work_status: e.target.value })}>
            <option value="">-- เลือกสถานะ --</option>
            {WORK_STATUS.map((w) => <option key={w.code} value={w.code}>{w.label}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL}>ชื่อหน่วยงาน / บริษัท / องค์กร</label>
          <input className={FIELD} placeholder="ชื่อหน่วยงานหรือบริษัทที่ทำงาน"
            value={data.work_organization ?? ""}
            onChange={(e) => onChange({ work_organization: e.target.value })} />
        </div>
        <div>
          <label className={LABEL}>ตำแหน่งงาน</label>
          <input className={FIELD} placeholder="เช่น นักวิเคราะห์, พนักงานขาย"
            value={data.work_position ?? ""}
            onChange={(e) => onChange({ work_position: e.target.value })} />
        </div>
        <div>
          <label className={LABEL}>ประเภทหน่วยงาน</label>
          <select className={FIELD}
            value={data.work_organization_type ?? ""}
            onChange={(e) => onChange({ work_organization_type: e.target.value })}>
            <option value="">-- เลือกประเภท --</option>
            {ORGANIZATION_TYPES.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL}>เริ่มทำงานตั้งแต่ปี (พ.ศ.)</label>
          <input className={FIELD} placeholder="เช่น 2560"
            value={data.work_start_year ?? ""}
            onChange={(e) => onChange({ work_start_year: e.target.value })} />
        </div>
      </div>

      {/* Article 33/34/35 */}
      <div className="mt-4">
        <label className={`${LABEL} mb-2`}>
          การจ้างงานตาม พ.ร.บ. ส่งเสริมและพัฒนาคุณภาพชีวิตคนพิการ
        </label>
        <div className="space-y-2 mt-2">
          {DISABILITY_EMPLOYMENT_ARTICLES.map((a) => (
            <label key={a.code}
              className={`flex gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                data.disability_employment_article === a.code
                  ? "border-[var(--spadt-navy)] bg-[var(--spadt-cream)]"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}>
              <input type="radio" name="disability_article" value={a.code}
                checked={data.disability_employment_article === a.code}
                onChange={(e) => onChange({ disability_employment_article: e.target.value })}
                className="mt-1" />
              <div className="flex-1">
                <div className="font-semibold text-sm text-[var(--spadt-navy)]">{a.label}</div>
                <div className="text-xs text-gray-600 mt-0.5">{a.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-gray-200">
        {!canProceed && (data.national_id?.length ?? 0) > 0 && (
          <span className="text-xs text-gray-500">
            {nidStatus === "checking"
              ? "กำลังตรวจสอบเลขบัตร..."
              : nidStatus === "duplicate"
                ? "เลขบัตรซ้ำในระบบ"
                : nidStatus === "invalid"
                  ? "เลขบัตรไม่ครบ 13 หลัก"
                  : ""}
          </span>
        )}
        <button
          type="submit"
          disabled={!canProceed}
          className="spadt-btn spadt-btn-primary px-6 py-2.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ถัดไป →
        </button>
      </div>
    </form>
  );
}
