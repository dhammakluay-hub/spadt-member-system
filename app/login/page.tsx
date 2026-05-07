"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { SPADT_BRAND } from "@/lib/constants";
import { Loader2, CheckCircle2, UserPlus, Eye, EyeOff } from "lucide-react";

function LoginInner() {
  const router = useRouter();
  const search = useSearchParams();
  const justConfirmed = search.get("confirmed") === "1";

  const [identifier, setIdentifier] = useState(""); // national_id OR email
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (justConfirmed) {
      // gentle hint
    }
  }, [justConfirmed]);

  const isNationalId = (s: string) => /^\d{13}$/.test(s);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let emailToUse = identifier.trim();

      // If user entered national_id, look up email via RPC
      if (isNationalId(emailToUse)) {
        const sb = getSupabase();
        const { data, error: rpcError } = await sb.rpc("get_email_by_national_id", { p_national_id: emailToUse });
        if (rpcError) throw rpcError;
        if (!data) {
          setError("ไม่พบเลขบัตรประชาชนนี้ในระบบ — โปรด สมัครสมาชิก ก่อน");
          setLoading(false);
          return;
        }
        emailToUse = data;
      }

      await signIn(emailToUse, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      // Friendly Thai messages
      if (/invalid login/i.test(msg)) setError("อีเมล/เลขบัตร หรือรหัสผ่านไม่ถูกต้อง");
      else if (/email not confirmed/i.test(msg)) setError("กรุณายืนยันอีเมลก่อน — ตรวจสอบกล่องอีเมลของคุณ");
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg, #0a1e3f 0%, #1a3366 100%)" }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-[var(--spadt-gold)] flex items-center justify-center text-[var(--spadt-navy)] font-bold text-2xl">
            S
          </div>
          <h1 className="mt-4 text-2xl font-bold text-[var(--spadt-navy)]">
            {SPADT_BRAND.name}
          </h1>
          <p className="text-sm text-gray-500">{SPADT_BRAND.tagline}</p>
        </div>

        {justConfirmed && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            ยืนยันอีเมลสำเร็จ! เข้าสู่ระบบเพื่อเริ่มลงทะเบียนข้อมูลสมาชิก
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              เลขบัตรประชาชน หรือ อีเมล
            </label>
            <input
              type="text"
              required
              autoComplete="username"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--spadt-navy)]"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="1234567890123 หรือ name@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">รหัสผ่าน</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-11 focus:outline-none focus:ring-2 focus:ring-[var(--spadt-navy)]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                className="absolute inset-y-0 right-2 flex items-center px-2 text-gray-500 hover:text-[var(--spadt-navy)]"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>

          <Link
            href="/signup"
            className="w-full py-2.5 rounded-lg border-2 border-[var(--spadt-gold)] text-[var(--spadt-navy)] font-semibold hover:bg-[var(--spadt-cream)] flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            สมัครสมาชิกใหม่
          </Link>

          <div className="text-center text-xs">
            <Link href="/forgot-password" className="text-gray-500 hover:text-[var(--spadt-navy)] hover:underline">
              ลืมรหัสผ่าน?
            </Link>
          </div>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          {SPADT_BRAND.fullName}
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginInner />
    </Suspense>
  );
}
