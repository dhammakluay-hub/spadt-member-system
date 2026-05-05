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

export default function RegistrationForm() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<RegistrationData>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill national_id + email from logged-in auth user (locked)
  useEffect(() => {
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
  }, []);

  const update = (patch: RegistrationData) => setData((prev) => ({ ...prev, ...patch }));

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await MemberAPI.create({
        ...data,
        status: "pending",
        signed_at: new Date().toISOString(),
      });
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
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
          ลงทะเบียนสำเร็จ
        </h2>
        <p className="mt-2 text-gray-600">ใบสมัครของคุณอยู่ในสถานะ &ldquo;รออนุมัติ&rdquo;</p>
      </div>
    );
  }

  return (
    <div className="spadt-card">
      {/* Stepper */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex-1 flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= s.num
                  ? "bg-[var(--spadt-navy)] text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {s.num}
            </div>
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

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
