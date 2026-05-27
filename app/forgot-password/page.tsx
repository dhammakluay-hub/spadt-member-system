"use client";

/**
 * Forgot Password (OTP flow — no email link required)
 *
 * Why OTP instead of magic link?
 * Magic links suffer from many cross-device / cross-browser failure modes:
 *  - PKCE flow needs the code_verifier cookie in the SAME browser
 *  - Gmail "scan link safety" prefetches the link and consumes the
 *    one-time token before the user clicks
 *  - In-app browsers (Gmail app, LINE, FB) open a different storage
 *    context than the user's main browser
 *
 * 6-digit OTP sidesteps all of this: user just reads the code from email
 * and types it back into the page they're already on. Works everywhere.
 *
 * IMPORTANT — Supabase email template must include `{{ .Token }}` for the
 * user to see the 6-digit code. See README notes or use this template:
 *
 *   <h2>SPADT Thailand — รหัสตั้งรหัสผ่านใหม่</h2>
 *   <p>รหัส 6 หลักของคุณคือ:</p>
 *   <h1 style="font-size:32px;letter-spacing:6px">{{ .Token }}</h1>
 *   <p>รหัสนี้มีอายุ 1 ชั่วโมง — นำไปกรอกในหน้าลืมรหัสผ่านของ SPADT</p>
 */

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail, ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { SPADT_BRAND } from "@/lib/constants";

type Step = "enter_email" | "enter_code" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("enter_email");

  const [identifier, setIdentifier] = useState(""); // national_id OR email
  const [resolvedEmail, setResolvedEmail] = useState(""); // actual email used
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const isNationalId = (s: string) => /^\d{13}$/.test(s);

  // ============================================================
  // Step 1: request OTP — resolve national_id → email, send email
  // ============================================================
  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const sb = getSupabase();
      let email = identifier.trim();

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

      const { error: e1 } = await sb.auth.resetPasswordForEmail(email);
      if (e1) throw e1;

      setResolvedEmail(email);
      setStep("enter_code");
      setInfo(`ส่งรหัส 6 หลักไปยัง ${email} แล้ว — กรุณาเช็คอีเมล (รวม Spam folder)`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "ส่งอีเมลไม่สำเร็จ";
      if (/rate limit/i.test(msg)) setError("คุณส่งคำขอบ่อยเกินไป — กรุณารอ 60 วินาที");
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // Step 2: verify OTP + set new password
  // ============================================================
  const verifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!/^\d{6}$/.test(code)) { setError("รหัสต้องเป็นตัวเลข 6 หลัก"); return; }
    if (password.length < 8) { setError("รหัสผ่านต้องอย่างน้อย 8 ตัวอักษร"); return; }
    if (password !== confirm) { setError("รหัสผ่านยืนยันไม่ตรงกัน"); return; }

    setLoading(true);
    try {
      const sb = getSupabase();

      // Verify OTP — this signs the user in with a recovery session
      const { error: vErr } = await sb.auth.verifyOtp({
        email: resolvedEmail,
        token: code,
        type: "recovery",
      });
      if (vErr) throw vErr;

      // Now set the new password
      const { error: uErr } = await sb.auth.updateUser({ password });
      if (uErr) throw uErr;

      // Sign out and redirect to login — user logs in fresh with new password
      await sb.auth.signOut();
      setStep("done");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "รีเซตรหัสผ่านไม่สำเร็จ";
      if (/invalid|expired|otp/i.test(msg)) {
        setError("รหัสไม่ถูกต้องหรือหมดอายุ — กรุณาตรวจสอบรหัสในอีเมล หรือขอรหัสใหม่");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // Render — three states: enter_email | enter_code | done
  // ============================================================
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg, #0a1e3f 0%, #1a3366 100%)" }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-[var(--spadt-gold)] flex items-center justify-center text-[var(--spadt-navy)] font-bold text-xl">S</div>
          <h1 className="mt-3 text-xl font-bold text-[var(--spadt-navy)]">{SPADT_BRAND.name}</h1>
          <p className="text-xs text-gray-500 mt-1">
            {step === "enter_email" && "ลืมรหัสผ่าน — ขั้น 1/2"}
            {step === "enter_code" && "ลืมรหัสผ่าน — ขั้น 2/2"}
            {step === "done" && "เสร็จสิ้น"}
          </p>
        </div>
        {children}
      </div>
    </div>
  );

  if (step === "done") {
    return (
      <Wrapper>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-[var(--spadt-navy)]">ตั้งรหัสผ่านใหม่สำเร็จ</h2>
          <p className="mt-3 text-sm text-gray-600">
            ตอนนี้คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้แล้ว
          </p>
          <Link href="/login" className="mt-6 inline-flex items-center gap-1 spadt-btn spadt-btn-primary">
            <ArrowLeft className="w-4 h-4" /> ไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </Wrapper>
    );
  }

  if (step === "enter_code") {
    return (
      <Wrapper>
        <form onSubmit={verifyAndReset} className="space-y-4">
          {info && (
            <div className="p-3 rounded-lg bg-blue-50 text-blue-800 text-xs border border-blue-200">
              📧 {info}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">รหัส 6 หลักจากอีเมล *</label>
            <input
              type="text"
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              autoComplete="one-time-code"
              placeholder="123456"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-3 text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[var(--spadt-navy)]"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            <p className="text-xs text-gray-500 mt-1">รหัสมีอายุ 1 ชั่วโมง</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">รหัสผ่านใหม่ *</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                required minLength={8}
                placeholder="อย่างน้อย 8 ตัวอักษร"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--spadt-navy)]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                className="absolute inset-y-0 right-2 flex items-center px-2 text-gray-500 hover:text-[var(--spadt-navy)]">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">ยืนยันรหัสผ่าน *</label>
            <div className="relative mt-1">
              <input
                type={showConfirm ? "text" : "password"}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--spadt-navy)]"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                aria-label={showConfirm ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                className="absolute inset-y-0 right-2 flex items-center px-2 text-gray-500 hover:text-[var(--spadt-navy)]">
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[var(--spadt-navy)] text-white font-semibold hover:bg-[var(--spadt-navy-light)] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            {loading ? "กำลังตั้งรหัสผ่าน..." : "ตั้งรหัสผ่านใหม่"}
          </button>

          <button
            type="button"
            onClick={() => { setStep("enter_email"); setCode(""); setError(null); setInfo(null); }}
            className="w-full text-center text-sm text-[var(--spadt-navy)] hover:underline"
          >
            ← ใช้อีเมลอื่น / ขอรหัสใหม่
          </button>
        </form>
      </Wrapper>
    );
  }

  // step === "enter_email"
  return (
    <Wrapper>
      <form onSubmit={requestOtp} className="space-y-4">
        <p className="text-sm text-gray-600">
          กรอกเลขบัตรประชาชน หรือ อีเมล ที่ใช้สมัครสมาชิก เราจะส่ง <strong>รหัส 6 หลัก</strong> ไปยังอีเมลของคุณ
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
          {loading ? "กำลังส่ง..." : "ส่งรหัส 6 หลัก"}
        </button>

        <Link
          href="/login"
          className="w-full block text-center text-sm text-[var(--spadt-navy)] hover:underline"
        >
          ← กลับหน้าเข้าสู่ระบบ
        </Link>
      </form>
    </Wrapper>
  );
}
