"use client";

import { useEffect, useState } from "react";
import Step1 from "./Step1";
import Step2 from "./Step2";
import Step3 from "./Step3";
import { MemberAPI, type Member } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";

export type RegistrationData = Partial<Member>;

const STEPS = [
  { num: 1, label: "ข้อมูลส่วนตัว" },
  { num: 2, label: "ข้อมูลกีฬา" },
  { num: 3, label: "เอกสาร" },
];

type Props = {
  /**
   * "create": new member registration (default). Submitting creates a member
   *           with status=pending.
   * "edit":   member updating their own existing profile. Submitting updates
   *           the existing row; status is NOT changed.
   */
  mode?: "create" | "edit";
  /** Required when mode="edit": the existing member record to update. */
  existingMember?: Member;
  /** Optional callback after successful save (edit mode). */
  onSaved?: () => void;
};

export default function RegistrationForm({
  mode = "create",
  existingMember,
  onSaved,
}: Props) {
  const isEdit = mode === "edit" && !!existingMember;

  const [step, setStep] = useState(1);
  const [data, setData] = useState<RegistrationData>(isEdit ? { ...existingMember } : {});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill national_id + email from logged-in auth user (create mode only)
  useEffect(() => {
    if (isEdit) return; // edit mode already has full data
    (async () => {
      try {
        const sb = getSupabase();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return;
        const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
        const nidFromMeta = typeof meta.national_id === "string" ? meta.national_id : undefined;
        setData((prev) => ({
          ...prev,
          email: prev.email ?? user.email ?? undefined,
          national_id: prev.national_id ?? nidFromMeta,
        }));
      } catch {
        // ignore — public registration without auth still allowed
      }
    })();
  }, [isEdit]);

  const update = (patch: RegistrationData) => setData((prev) => ({ ...prev, ...patch }));

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      if (isEdit && existingMember) {
        // Update existing member — preserve status, don't touch signed_at
        const { id: _id, created_at: _c, ...payload } = data as Member;
        void _id; void _c;
        await MemberAPI.update(existingMember.id, payload);
        setDone(true);
        onSaved?.();
      } else {
        // Create new member with pending status
        await MemberAPI.create({
          ...data,
          status: "pending",
          signed_at: new Date().toISOString(),
        });
        setDone(true);
      }
    } catch (e: unknown) {
      const err = e as { message?: string; code?: string; details?: string; hint?: string };
      setError(
        err.message
          ? `${err.message}${err.code ? ` (${err.code})` : ""}${err.hint ? ` — ${err.hint}` : ""}`
          : "เกิดข้อผิดพลาด"
      );
      console.error("RegistrationForm submit failed:", e);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="spadt-card text-center py-12">
        <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center text-green-600 text-3xl">
          ✓
        </div>
        <h2 className="mt-4 text-2xl font-bold text-[var(--spadt-navy)]">
          {isEdit ? "บันทึกข้อมูลสำเร็จ" : "ลงทะเบียนสำเร็จ"}
        </h2>
        <p className="mt-2 text-gray-600">
          {isEdit
            ? "ข้อมูลของคุณได้รับการอัพเดตเรียบร้อยแล้ว"
            : "ใบสมัครของคุณอยู่ในสถานะ \u201cรออนุมัติ\u201d"}
        </p>
        {isEdit && (
          <button
            onClick={() => { setDone(false); setStep(1); }}
            className="mt-4 spadt-btn spadt-btn-primary"
          >
            แก้ไขต่อ
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="spadt-card">
      {isEdit && (
        <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-900">
          ✏️ <strong>โหมดแก้ไขข้อมูล</strong> — คุณสามารถปรับปรุงข้อมูลของตัวเองได้ตลอดเวลา (เช่น หลังการแข่งขัน อัพเดตผลงาน · เปลี่ยน classification · เพิ่มเอกสาร)
        </div>
      )}

      {/* Stepper */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex-1 flex items-center">
            <button
              type="button"
              onClick={() => setStep(s.num)}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
                step >= s.num
                  ? "bg-[var(--spadt-navy)] text-white"
                  : "bg-gray-200 text-gray-500 hover:bg-gray-300"
              }`}
              title={`ไป ${s.label}`}
            >
              {s.num}
            </button>
            <div className="ml-3 text-sm font-medium hidden md:block">{s.label}</div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-1 mx-4 ${
                  step > s.num ? "bg-[var(--spadt-navy)]" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {step === 1 && <Step1 data={data} onChange={update} onNext={() => setStep(2)} />}
      {step === 2 && (
        <Step2
          data={data}
          onChange={update}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <Step3
          data={data}
          onChange={update}
          onBack={() => setStep(2)}
          onSubmit={submit}
          submitting={submitting}
        />
      )}

      {/* Edit mode: add a Save button on Step 1 and 2 too so users don't have
          to walk to Step 3 just to save. */}
      {isEdit && step < 3 && (
        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={submit}
            disabled={submitting}
            className="spadt-btn spadt-btn-primary disabled:opacity-50"
          >
            💾 {submitting ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
