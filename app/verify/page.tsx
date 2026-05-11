"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { SPORTS, MEMBER_STATUS_LABEL } from "@/lib/constants";

interface VerifyResult {
  member_code: string | null;
  first_name: string;
  last_name: string;
  sport_code: string | null;
  classification_code: string | null;
  status: string;
  province: string | null;
}

function VerifyInner() {
  const params = useSearchParams();
  const code = params.get("code");
  const idShort = params.get("id");

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setError("ไม่พบข้อมูลในลิงก์ QR");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const sb = getSupabase();
        // Use SECURITY DEFINER RPC so anon users get only the safe public-facing
        // columns (no national_id, phone, email, address). Direct table reads
        // would require opening up RLS too widely.
        const { data, error: e } = await sb.rpc("verify_member", {
          p_member_code: code,
        });
        if (e) throw e;
        const row = Array.isArray(data) ? data[0] : data;
        setResult((row as VerifyResult) ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "ตรวจสอบไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
  }, [code]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg, #0a1e3f 0%, #1a3366 100%)" }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-[var(--spadt-gold)] flex items-center justify-center text-[var(--spadt-navy)] font-bold text-xl">
            S
          </div>
          <h1 className="mt-3 text-lg font-bold text-[var(--spadt-navy)]">
            SPADT Thailand
          </h1>
          <p className="text-xs text-gray-500">ตรวจสอบความเป็นสมาชิก</p>
        </div>

        {loading && (
          <div className="text-center py-8 text-gray-500">
            <Loader2 className="w-6 h-6 mx-auto animate-spin" />
            <p className="mt-2 text-sm">กำลังตรวจสอบ...</p>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-6">
            <XCircle className="w-12 h-12 mx-auto text-red-500" />
            <p className="mt-3 font-semibold text-red-700">{error}</p>
          </div>
        )}

        {!loading && !error && !result && (
          <div className="text-center py-6">
            <XCircle className="w-12 h-12 mx-auto text-red-500" />
            <p className="mt-3 font-semibold text-red-700">ไม่พบสมาชิก</p>
            <p className="mt-1 text-xs text-gray-500">
              รหัส <span className="font-mono">{code}</span> ไม่มีในระบบ หรือยังไม่ได้รับการอนุมัติ
            </p>
          </div>
        )}

        {!loading && result && (
          <div className="text-center py-2">
            <div className="w-14 h-14 mx-auto rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <p className="mt-2 text-sm font-semibold text-green-700">
              ✓ ยืนยันความเป็นสมาชิก
            </p>

            <dl className="mt-5 text-left bg-[var(--spadt-cream)] border border-[var(--spadt-gold)] rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-gray-600">ชื่อ-นามสกุล</dt>
                <dd className="font-semibold text-[var(--spadt-navy)] text-right">
                  {result.first_name} {result.last_name}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-600">รหัสสมาชิก</dt>
                <dd className="font-mono font-semibold">{result.member_code ?? "—"}</dd>
              </div>
              {result.sport_code && (
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-600">กีฬา</dt>
                  <dd className="text-right">
                    {SPORTS.find((s) => s.code === result.sport_code)?.name_th ?? result.sport_code}
                  </dd>
                </div>
              )}
              {result.classification_code && (
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-600">Classification</dt>
                  <dd className="font-semibold text-[var(--spadt-gold-dark)]">
                    {result.classification_code}
                  </dd>
                </div>
              )}
              {result.province && (
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-600">จังหวัด</dt>
                  <dd>{result.province}</dd>
                </div>
              )}
              <div className="flex justify-between gap-3 pt-2 border-t border-[var(--spadt-gold)]">
                <dt className="text-gray-600">สถานะ</dt>
                <dd>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                    {MEMBER_STATUS_LABEL[result.status as keyof typeof MEMBER_STATUS_LABEL] ?? result.status}
                  </span>
                </dd>
              </div>
            </dl>

            <p className="mt-4 text-[10px] text-gray-400">
              ID: {idShort ?? "—"} · ตรวจสอบเมื่อ {new Date().toLocaleString("th-TH")}
            </p>
          </div>
        )}

        <p className="mt-6 text-center text-[10px] text-gray-400">
          สมาคมกีฬาคนพิการแห่งประเทศไทย
        </p>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <VerifyInner />
    </Suspense>
  );
}
