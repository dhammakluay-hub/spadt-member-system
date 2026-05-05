"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, Lock } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { SPADT_BRAND } from "@/lib/constants";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [validSession, setValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    // When user clicks email link, Supabase sets a recovery session
    const sb = getSupabase();
    sb.auth.getSession().then(({ data }) => {
      setValidSession(!!data.session);
    });
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

  if (validSession === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6"
        style={{ background: "linear-gradient(135deg, #0a1e3f 0%, #1a3366 100%)" }}>
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="text-red-600 text-5xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold text-[var(--spadt-navy)]">ลิงก์หมดอายุหรือไม่ถูกต้อง</h2>
          <p className="mt-3 text-sm text-gray-600">
            ลิงก์ตั้งรหัสผ่านอาจหมดอายุแล้ว กรุณาขอลิงก์ใหม่
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
            <input
              type="password" required minLength={8}
              autoComplete="new-password"
              placeholder="อย่างน้อย 8 ตัวอักษร"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--spadt-navy)]"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ยืนยันรหัสผ่าน *</label>
            <input
              type="password" required
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--spadt-navy)]"
              value={confirm} onChange={(e) => setConfirm(e.target.value)}
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
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {loading ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
          </button>
        </form>
      </div>
    </div>
  );
}
