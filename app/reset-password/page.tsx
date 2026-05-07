"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, Lock, Eye, EyeOff } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { SPADT_BRAND } from "@/lib/constants";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  // null = still detecting, true = ready to set password, false = link expired/invalid
  const [validSession, setValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Supabase recovery links arrive as either:
    //   1. URL hash: #access_token=...&type=recovery   (older flow)
    //   2. URL search: ?code=...                         (newer PKCE flow)
    // The browser client (@supabase/ssr) auto-detects on load and emits
    // PASSWORD_RECOVERY via onAuthStateChange. We listen for that event so we
    // don't race the auto-detect (which would make getSession() return null).
    const sb = getSupabase();

    let cancelled = false;
    let resolved = false;
    const resolve = (ok: boolean) => {
      if (cancelled || resolved) return;
      resolved = true;
      setValidSession(ok);
    };

    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        resolve(true);
      }
    });

    // Also try once immediately in case the event already fired before listener
    sb.auth.getSession().then(({ data }) => {
      if (data.session) resolve(true);
    });

    // Give the auto-detect ~3s. After that, if no session, treat as expired.
    const timer = setTimeout(() => resolve(false), 3000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      sub.subscription.unsubscribe();
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError("รหัสผ่านต้องอย่างน้อย 8 ตัวอักษร"); return; }
    if (password !== confirm) { setError("รหัสผ่านยืนยันไม่ตรงกัน"); return; }

    setLoading(true);
    try {
      const sb = getSupabase();
      const { error } = await sb.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ตั้งรหัสผ่านไม่สำเร็จ");
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
          <h2 className="mt-4 text-xl font-bold text-[var(--spadt-navy)]">ตั้งรหัสผ่านใหม่สำเร็จ</h2>
          <p className="mt-3 text-sm text-gray-600">กำลังพาคุณไปหน้าเข้าสู่ระบบ...</p>
        </div>
      </div>
    );
  }

  if (validSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6"
        style={{ background: "linear-gradient(135deg, #0a1e3f 0%, #1a3366 100%)" }}>
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-[var(--spadt-navy)]" />
          <p className="mt-3 text-sm text-gray-600">กำลังตรวจสอบลิงก์...</p>
        </div>
      </div>
    );
  }

  if (validSession === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6"
        style={{ background: "linear-gradient(135deg, #0a1e3f 0%, #1a3366 100%)" }}>
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="text-red-600 text-5xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold text-[var(--spadt-navy)]">ลิงก์หมดอายุหรือไม่ถูกต้อง</h2>
          <p className="mt-3 text-sm text-gray-600">
            ลิงก์ตั้งรหัสผ่านอาจหมดอายุแล้ว หรือถูกใช้ไปแล้ว — กรุณาขอลิงก์ใหม่
          </p>
          <Link href="/forgot-password" className="mt-6 inline-block spadt-btn spadt-btn-primary">
            ขอลิงก์ใหม่
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
          <p className="text-xs text-gray-500 mt-1">ตั้งรหัสผ่านใหม่</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">รหัสผ่านใหม่ *</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                required minLength={8}
                autoComplete="new-password"
                placeholder="อย่างน้อย 8 ตัวอักษร"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--spadt-navy)]"
                value={password} onChange={(e) => setPassword(e.target.value)}
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
                autoComplete="new-password"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--spadt-navy)]"
                value={confirm} onChange={(e) => setConfirm(e.target.value)}
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
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {loading ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
          </button>
        </form>
      </div>
    </div>
  );
}
