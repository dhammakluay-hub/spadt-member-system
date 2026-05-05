"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, X, Upload } from "lucide-react";
import type { RegistrationData } from "./index";
import type { AssistiveDeviceEntry, AchievementEntry } from "@/lib/api";
import { StorageAPI } from "@/lib/api";
import {
  SPORTS,
  CLASSIFICATIONS_BY_SPORT,
  PERSONNEL_TYPES,
  COMPETITION_LEVELS,
  CLASSIFICATION_STATUS,
  ASSISTIVE_DEVICES,
  COACH_PERSONNEL_TYPES,
} from "@/lib/constants";
import CoachLicenseSection from "@/components/CoachLicenseSection";

const FIELD =
  "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--spadt-navy)]";
const LABEL = "block text-sm font-medium text-gray-700";
const SECTION_TITLE =
  "flex items-center gap-2 text-lg font-bold text-[var(--spadt-navy)] border-b border-[var(--spadt-gold)] pb-2 mt-6 mb-4";

export default function Step2({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: RegistrationData;
  onChange: (patch: RegistrationData) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const devices: AssistiveDeviceEntry[] = data.assistive_devices ?? [];
  const achievements: AchievementEntry[] = data.achievements ?? [];

  const [deviceDraft, setDeviceDraft] = useState<string>("");
  const [deviceDraftCustom, setDeviceDraftCustom] = useState<string>("");
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  const availableClasses = useMemo(
    () => (data.sport_code ? CLASSIFICATIONS_BY_SPORT[data.sport_code] ?? [] : []),
    [data.sport_code]
  );

  const addDevice = () => {
    if (!deviceDraft) return;
    const entry: AssistiveDeviceEntry = {
      code: deviceDraft,
      custom: deviceDraft === "other" ? deviceDraftCustom : undefined,
    };
    onChange({ assistive_devices: [...devices, entry] });
    setDeviceDraft("");
    setDeviceDraftCustom("");
  };

  const removeDevice = (idx: number) => {
    onChange({ assistive_devices: devices.filter((_, i) => i !== idx) });
  };

  const addAchievement = () => {
    onChange({ achievements: [...achievements, { image_urls: [] }] });
  };

  const updateAchievement = (idx: number, patch: Partial<AchievementEntry>) => {
    const next = [...achievements];
    next[idx] = { ...next[idx], ...patch };
    onChange({ achievements: next });
  };

  const removeAchievement = (idx: number) => {
    onChange({ achievements: achievements.filter((_, i) => i !== idx) });
  };

  const uploadAchievementImage = async (idx: number, file: File) => {
    setUploadingIdx(idx);
    try {
      const path = `achievements/${Date.now()}-${file.name}`;
      const url = await StorageAPI.uploadPhoto(file, path);
      const current = achievements[idx]?.image_urls ?? [];
      if (current.length >= 5) {
        alert("อัพโหลดได้สูงสุด 5 รูปต่อ 1 รายการ");
        return;
      }
      updateAchievement(idx, { image_urls: [...current, url] });
    } catch (e) {
      alert(`อัพโหลดไม่สำเร็จ: ${e instanceof Error ? e.message : e}`);
    } finally {
      setUploadingIdx(null);
    }
  };

  const removeAchievementImage = (idx: number, imgIdx: number) => {
    const current = achievements[idx]?.image_urls ?? [];
    updateAchievement(idx, { image_urls: current.filter((_, i) => i !== imgIdx) });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onNext();
      }}
      className="space-y-2"
    >
      {/* ====================== 1. ข้อมูลด้านกีฬา ====================== */}
      <h2 className={SECTION_TITLE}>
        <span>🏅</span> ข้อมูลด้านกีฬา
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={LABEL}>ประเภทบุคลากร *</label>
          <select
            required
            className={FIELD}
            value={data.personnel_type ?? ""}
            onChange={(e) => onChange({ personnel_type: e.target.value })}
          >
            <option value="">-- เลือก --</option>
            {PERSONNEL_TYPES.map((p) => (
              <option key={p.code} value={p.code}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL}>ชนิดกีฬาหลัก *</label>
          <select
            required
            className={FIELD}
            value={data.sport_code ?? ""}
            onChange={(e) =>
              onChange({ sport_code: e.target.value, classification_code: "" })
            }
          >
            <option value="">-- เลือกชนิดกีฬา --</option>
            {SPORTS.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name_th}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL}>ระดับการแข่งขัน</label>
          <select
            className={FIELD}
            value={data.competition_level ?? ""}
            onChange={(e) => onChange({ competition_level: e.target.value })}
          >
            <option value="">-- เลือก --</option>
            {COMPETITION_LEVELS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ============ Coach License + Compensation (เฉพาะ coach/staff/manager/guide) ============ */}
      {data.personnel_type && COACH_PERSONNEL_TYPES.includes(data.personnel_type) && (
        <div className="mt-6 p-4 rounded-lg border-2 border-[var(--spadt-gold)] bg-[var(--spadt-cream)]/30">
          <div className="text-xs text-[var(--spadt-gold-dark)] uppercase tracking-widest mb-3 font-semibold">
            หมวดเสริมสำหรับผู้ฝึกสอน / ผู้ช่วย / เจ้าหน้าที่ทีม / ผู้นำทาง
          </div>
          <CoachLicenseSection data={data} onChange={onChange} />
        </div>
      )}

      {/* ====================== 2. Classification Class ====================== */}
      <h2 className={SECTION_TITLE}>
        <span>📋</span> ระดับความพิการ / Classification Class
        <span className="ml-2 text-xs font-normal text-gray-500">
          (ตามมาตรฐาน IPC / สหพันธ์กีฬาแต่ละชนิด)
        </span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={LABEL}>Class / ระดับความพิการ</label>
          <select
            className={FIELD}
            disabled={!data.sport_code}
            value={data.classification_code ?? ""}
            onChange={(e) => onChange({ classification_code: e.target.value })}
          >
            <option value="">
              {data.sport_code ? "-- เลือก Class --" : "-- เลือกชนิดกีฬาก่อน --"}
            </option>
            {availableClasses.map((c) => (
              <option key={c.code} value={c.code} title={c.description}>
                {c.code} — {c.description.slice(0, 50)}
                {c.description.length > 50 ? "..." : ""}
              </option>
            ))}
          </select>
          {data.sport_code && availableClasses.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              💡 พบ {availableClasses.length} Class สำหรับ
              {SPORTS.find((s) => s.code === data.sport_code)?.name_th}
            </p>
          )}
        </div>

        <div>
          <label className={LABEL}>สถานะ Classification</label>
          <select
            className={FIELD}
            value={data.classification_status ?? ""}
            onChange={(e) => onChange({ classification_status: e.target.value })}
          >
            <option value="">-- เลือก --</option>
            {CLASSIFICATION_STATUS.map((s) => (
              <option key={s.code} value={s.code}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL}>วันที่ได้รับ Classification</label>
          <input
            type="date"
            className={FIELD}
            value={data.classification_date ?? ""}
            onChange={(e) => onChange({ classification_date: e.target.value })}
          />
        </div>

        <div>
          <label className={LABEL}>Classifier / ผู้ตรวจ</label>
          <input
            className={FIELD}
            placeholder="ชื่อผู้ตรวจ Classification"
            value={data.classifier_name ?? ""}
            onChange={(e) => onChange({ classifier_name: e.target.value })}
          />
        </div>

        <div>
          <label className={LABEL}>สถานที่ Classification</label>
          <input
            className={FIELD}
            placeholder="เช่น กรุงเทพฯ, ปารีส"
            value={data.classification_place ?? ""}
            onChange={(e) => onChange({ classification_place: e.target.value })}
          />
        </div>

        <div>
          <label className={LABEL}>สังกัดจังหวัด / ทีม</label>
          <input
            className={FIELD}
            placeholder="ชื่อสังกัด"
            value={data.team_province ?? ""}
            onChange={(e) => onChange({ team_province: e.target.value })}
          />
        </div>
      </div>

      {/* ====================== 3. Assistive Devices (multi) ====================== */}
      <h2 className={SECTION_TITLE}>
        <span>♿</span> อุปกรณ์ช่วยเหลือที่ใช้ในชีวิตประจำวัน
      </h2>

      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-end">
          <div>
            <label className={LABEL}>เลือกอุปกรณ์</label>
            <select
              className={FIELD}
              value={deviceDraft}
              onChange={(e) => setDeviceDraft(e.target.value)}
            >
              <option value="">-- เลือกอุปกรณ์ช่วยเหลือ --</option>
              {ASSISTIVE_DEVICES.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          {deviceDraft === "other" && (
            <div>
              <label className={LABEL}>ระบุอุปกรณ์อื่นๆ</label>
              <input
                className={FIELD}
                placeholder="ชื่ออุปกรณ์..."
                value={deviceDraftCustom}
                onChange={(e) => setDeviceDraftCustom(e.target.value)}
              />
            </div>
          )}
          <button
            type="button"
            onClick={addDevice}
            disabled={!deviceDraft}
            className="spadt-btn spadt-btn-primary flex items-center gap-1 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> เพิ่ม
          </button>
        </div>

        {devices.length === 0 ? (
          <p className="text-sm text-gray-500 italic">ยังไม่ได้เลือกอุปกรณ์</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {devices.map((d, i) => {
              const meta = ASSISTIVE_DEVICES.find((x) => x.code === d.code);
              return (
                <div
                  key={i}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--spadt-cream)] border border-[var(--spadt-gold)] text-sm"
                >
                  <span>{meta?.label ?? d.code}</span>
                  {d.custom && <span className="text-gray-600">— {d.custom}</span>}
                  <button
                    type="button"
                    onClick={() => removeDevice(i)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ====================== 4. Achievements ====================== */}
      <h2 className={SECTION_TITLE}>
        <span>🏆</span> ผลงาน / ประวัติการแข่งขัน
      </h2>

      <div className="space-y-4">
        {achievements.length === 0 && (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center bg-gray-50">
            <div className="text-4xl mb-2">🏆</div>
            <p className="text-gray-600 text-sm">ยังไม่มีรายการผลงาน</p>
            <p className="text-gray-500 text-xs mt-1">
              กด &ldquo;+ เพิ่มรายการ&rdquo; เพื่อบันทึกประวัติการแข่งขัน
            </p>
          </div>
        )}

        {achievements.map((a, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-[var(--spadt-navy)]">
                ผลงาน #{idx + 1}
              </div>
              <button
                type="button"
                onClick={() => removeAchievement(idx)}
                className="text-red-500 hover:text-red-700 flex items-center gap-1 text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" /> ลบ
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className={LABEL}>ปี (พ.ศ.)</label>
                <input
                  className={FIELD}
                  placeholder="2567"
                  value={a.year ?? ""}
                  onChange={(e) => updateAchievement(idx, { year: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className={LABEL}>ชื่อรายการแข่งขัน</label>
                <input
                  className={FIELD}
                  placeholder="เช่น Paris 2024 Paralympic Games"
                  value={a.event ?? ""}
                  onChange={(e) => updateAchievement(idx, { event: e.target.value })}
                />
              </div>
              <div>
                <label className={LABEL}>ระดับ</label>
                <select
                  className={FIELD}
                  value={a.level ?? ""}
                  onChange={(e) => updateAchievement(idx, { level: e.target.value })}
                >
                  <option value="">-- เลือก --</option>
                  {COMPETITION_LEVELS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>ผลงาน / รางวัล</label>
                <input
                  className={FIELD}
                  placeholder="เช่น เหรียญทอง, อันดับ 4"
                  value={a.result ?? ""}
                  onChange={(e) => updateAchievement(idx, { result: e.target.value })}
                />
              </div>
              <div className="md:col-span-3">
                <label className={LABEL}>รายละเอียดเพิ่มเติม</label>
                <input
                  className={FIELD}
                  placeholder="เช่น 100m freestyle S10, Women's singles"
                  value={a.description ?? ""}
                  onChange={(e) =>
                    updateAchievement(idx, { description: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Images */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <label className={LABEL}>
                  รูปภาพประกอบ (สูงสุด 5 รูป) —{" "}
                  <span className="text-gray-500">
                    {a.image_urls?.length ?? 0}/5
                  </span>
                </label>
                <label className="cursor-pointer text-xs text-[var(--spadt-navy)] hover:underline flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  เพิ่มรูป
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={
                      (a.image_urls?.length ?? 0) >= 5 || uploadingIdx === idx
                    }
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadAchievementImage(idx, f);
                    }}
                  />
                </label>
              </div>
              {uploadingIdx === idx && (
                <p className="text-xs text-gray-500">กำลังอัพโหลด...</p>
              )}
              {(a.image_urls?.length ?? 0) > 0 && (
                <div className="grid grid-cols-5 gap-2">
                  {a.image_urls!.map((url, imgIdx) => (
                    <div
                      key={imgIdx}
                      className="relative group aspect-square rounded border overflow-hidden"
                    >
                      <img
                        src={url}
                        alt={`achievement-${idx}-${imgIdx}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeAchievementImage(idx, imgIdx)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addAchievement}
          className="w-full py-2 rounded-lg border-2 border-dashed border-[var(--spadt-gold)] text-[var(--spadt-navy)] hover:bg-[var(--spadt-cream)] flex items-center justify-center gap-2 text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> เพิ่มรายการผลงาน
        </button>
      </div>

      {/* Submit row */}
      <div className="flex justify-between mt-8 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2.5 rounded-lg bg-gray-200 hover:bg-gray-300"
        >
          ← ย้อนกลับ
        </button>
        <button type="submit" className="spadt-btn spadt-btn-primary px-6 py-2.5">
          ถัดไป →
        </button>
      </div>
    </form>
  );
}
