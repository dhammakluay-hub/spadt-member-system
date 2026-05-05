"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Check, AlertCircle, Mail, ArrowRight } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { MemberAPI } from "@/lib/api";
import { SPADT_BRAND } from "@/lib/constants";

type NidStatus = "idle" | "checking" | "valid" | "duplicate" | "invalid";

export default function SignupPage() {
  const [nid, setNid] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const [nidStatus, setNidStatus] = useState<NidStatus>("idle");
  const nidTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkNid = async (id: string) => {
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

  useEffect(() => {
    if (nidTimer.current) clearTimeout(nidTimer.current);
    if (nid.length === 0) { setNidStatus("idle"); return; }
    nidTimer.current = setTimeout(() => checkNid(nid), 500);
    return () => { if (nidTimer.current) clearTimeout(nidTimer.current); };
  }, [nid]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validations
    if (nidStatus !== "valid") {
      setError(nidStatus === "duplicate" ? "เลขบัตรประชาชนนี้มีในระบบแล้ว" : "กรุณากรอกเลขบัตร 13 หลัก");
      return;
    }
    if (!email.includes("@")) { setError("กรุณากรอกอีเมลให้ถูกต้อง"); return; }
    if (password.length < 8) { setError("รหัสผ่านต้องอย่างน้อย 8 ตัวอักษร"); return; }
    if (password !== confirm) { setError("รหัสผ่านยืนยันไม่ตรงกัน"); return; }
    if (!agree) { setError("กรุณายอมรับข้อตกลงก่อน"); return; }

    setLoading(true);
    try {
      const sb = getSupabase();
      const { error } = await sb.auth.signUp({
        email,
        password,
        options: {
          data: { national_id: nid },
          emailRedirectTo: `${window.location.origin}/login?confirmed=1`,
        },
      });
      if (error) throw error;
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "สมัครไม่สำเร็จ");
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
            <Mail className="w-8 h-8" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-[var(--spadt-navy)]">ตรวจสอบอีเมลของคุณ</h2>
          <p className="mt-3 text-sm text-gray-600">
            เราได้ส่งลิงก์ยืนยันไปยัง<br />
            <span className="font-semibold text-[var(--spadt-navy)]">{email}</span>
          </p>
          <p className="text-xs text-gray-500 mt-3">
            กรุณาเปิดอีเมลและคลิก &ldquo;Confirm your email&rdquo; เพื่อเปิดใช้งานบัญชี<br />
            หากไม่พบในกล่อง Inbox กรุณาตรวจ Spam / Junk
          </p>
          <Link href="/login" className="mt-6 inline-block spadt-btn spadt-btn-primary">
            ไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  const FIELD = "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--spadt-navy)]";
  const LABEL = "block text-sm font-medium text-gray-700";

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg, #0a1e3f 0%, #1a3366 100%)" }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-[var(--spadt-gold)] flex items-center justify-center text-[var(--spadt-navy)] font-bold text-xl">S</div>
          <h1 className="mt-3 text-xl font-bold text-[var(--spadt-navy)]">{SPADT_BRAND.name}</h1>
          <p className="text-xs text-gray-500">สมัครสมาชิกระบบสำหรับนักกีฬาและบุคลากรของสมาคม</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {/* National ID */}
          <div>
            <label className={LABEL}>เลขบัตรประชาชน (Username) *</label>
            <div className="relative">
              <input
                required
                pattern="[0-9]{13}"
                maxLength={13}
                inputMode="numeric"
                placeholder="กรอกเลข 13 หลัก"
                className={`${FIELD} pr-9 font-mono ${
                  nidStatus === "duplicate" || nidStatus === "invalid" ? "border-red-400" :
                  nidStatus === "valid" ? "border-green-400" : ""
                }`}
                value={nid}
                onChange={(e) => setNid(e.target.value.replace(/\D/g, ""))}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {nidStatus === "checking" && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
                {nidStatus === "valid" && <Check className="w-4 h-4 text-green-600" />}
                {(nidStatus === "duplicate" || nidStatus === "invalid") && <AlertCircle className="w-4 h-4 text-red-500" />}
              </div>
            </div>
            {nidStatus === "duplicate" && <p className="text-xs text-red-600 mt-1">⚠️ เลขบัตรนี้สมัครแล้ว — <Link href="/login" className="underline">เข้าสู่ระบบ</Link></p>}
            {nidStatus === "invalid" && <p className="text-xs text-red-600 mt-1">⚠️ ต้องเป็นตัวเลข 13 หลัก</p>}
            {nidStatus === "valid" && <p className="text-xs text-green-600 mt-1">✓ เลขบัตรพร้อมใช้</p>}
          </div>

          {/* Email */}
          <div>
            <label className={LABEL}>อีเมล (สำหรับยืนยันตัวตน) *</label>
            <input type="email" required placeholder="example@email.com" className={FIELD}
              value={email} onChange={(e) => setEmail(e.target.value)} />
            <p className="text-xs text-gray-500 mt-1">ระบบจะส่งลิงก์ยืนยันไปยังอีเมลนี้</p>
          </div>

          {/* Password */}
          <div>
            <label className={LABEL}>รหัสผ่าน *</label>
            <input type="password" required minLength={8} placeholder="อย่างน้อย 8 ตัวอักษร" className={FIELD}
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <div>
            <label className={LABEL}>ยืนยันรหัสผ่าน *</label>
            <input type="password" required className={FIELD}
              value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>

          {/* Agreement */}
          <label className="flex items-start gap-2 p-2 rounded text-xs text-gray-600 cursor-pointer">
            <input type="checkbox" className="mt-0.5" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span>
              ข้าพเจ้ายินยอมให้ SPADT เก็บข้อมูลส่วนบุคคล (เลขบัตร, อีเมล) ตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล
              และยอมรับว่าจะกรอกข้อมูลตามความเป็นจริง
            </span>
          </label>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
          )}

          <button type="submit" disabled={loading || nidStatus !== "valid" || !agree}
            className="w-full py-2.5 rounded-lg bg-[var(--spadt-navy)] text-white font-semibold hover:bg-[var(--spadt-navy-light)] disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            สมัครและส่งอีเมลยืนยัน
          </button>

          <div className="text-center text-xs text-gray-500 pt-2">
            มีบัญชีอยู่แล้ว?{" "}
            <Link href="/login" className="text-[var(--spadt-navy)] font-semibold hover:underline">
              เข้าสู่ระบบ <ArrowRight className="inline w-3 h-3" />
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
