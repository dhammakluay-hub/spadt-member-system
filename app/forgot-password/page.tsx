"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { SPADT_BRAND } from "@/lib/constants";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState(""); // national_id OR email
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const isNationalId = (s: string) => /^\d{13}$/.test(s);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const sb = getSupabase();
      let email = identifier.trim();

      // Resolve national_id → email
      if (isNationalId(email)) {
        const { data, error: rpcError } = await sb.rpc("get_email_by_national_id", { p_national_id: email });
        if (rpcError) throw rpcError;
        if (!data) {
          setError("ไม่พบเลขบัตรประชาชนนี้ในระบบ");
          setLoading(false);
          return;
        }
        email = data;
      }

      // Send password reset email
      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setDone(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "ส่งอีเมลไม่สำเร็จ";
      if (/rate limit/i.test(msg)) setError("คุณส่งคำขอบ่อยเกินไป — กรุณารอ 60 วินาที");
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6"
        style={{ background: "linear-gradient(135deg, #0a1e3f 0%, #1a3366 100%)" }}>
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-[var(--spadt-navy)]">ส่งอีเมลแล้ว</h2>
          <p className="mt-3 text-sm text-gray-600">
            เราได้ส่งลิงก์ตั้งรหัสผ่านใหม่ไปยังอีเมลของคุณ
          </p>
          <p className="text-xs text-gray-500 mt-3">
            กรุณาเช็คกล่อง <strong>Inbox</strong> หรือ <strong>Spam / Junk</strong>
            <br />ลิงก์มีอายุ 60 นาที
          </p>
          <Link href="/login" className="mt-6 inline-flex items-center gap-1 spadt-btn spadt-btn-primary">
            <ArrowLeft className="w-4 h-4" /> กลับหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg, #0a1e3f 0%, #1a3366 100%)" }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-[var(--spadt-gold)] flex items-center justify-center text-[var(--spadt-navy)] font-bold text-xl">S</div>
          <h1 className="mt-3 text-xl font-bold text-[var(--spadt-navy)]">{SPADT_BRAND.name}</h1>
          <p className="text-xs text-gray-500 mt-1">ลืมรหัสผ่าน</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-gray-600">
            กรอกเลขบัตรประชาชน หรือ อีเมล ที่ใช้สมัครสมาชิก เราจะส่งลิงก์ตั้งรหัสผ่านใหม่ไปให้
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700">เลขบัตรประชาชน หรือ อีเมล</label>
            <input
              type="text"
              required
              autoComplete="username"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--spadt-navy)]"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="1234567890123 หรือ name@example.com"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[var(--spadt-navy)] text-white font-semibold hover:bg-[var(--spadt-navy-light)] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {loading ? "กำลังส่ง..." : "ส่งลิงก์ตั้งรหัสผ่านใหม่"}
          </button>

          <Link
            href="/login"
            className="w-full block text-center text-sm text-[var(--spadt-navy)] hover:underline"
          >
            ← กลับหน้าเข้าสู่ระบบ
          </Link>
        </form>
      </div>
    </div>
  );
}
