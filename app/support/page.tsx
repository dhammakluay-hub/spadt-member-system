"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { TicketAPI, type Ticket } from "@/lib/api";
import { LifeBuoy, Plus, MessageSquare, Loader2 } from "lucide-react";

const CATEGORIES = [
  { code: "general", label: "📨 ทั่วไป" },
  { code: "bug", label: "🐛 รายงานบัค" },
  { code: "feature", label: "💡 ขอฟีเจอร์ใหม่" },
  { code: "data", label: "📊 ขอแก้ไขข้อมูล" },
  { code: "account", label: "🔑 บัญชี / Login" },
  { code: "other", label: "📝 อื่นๆ" },
];

const PRIORITIES = [
  { code: "low", label: "🟢 ต่ำ" },
  { code: "normal", label: "🟡 ปกติ" },
  { code: "high", label: "🟠 สูง" },
  { code: "urgent", label: "🔴 ด่วนมาก" },
];

const STATUS_LABEL: Record<string, string> = {
  open: "เปิดใหม่",
  in_progress: "กำลังดำเนินการ",
  resolved: "แก้ไขแล้ว",
  closed: "ปิด",
};

const STATUS_COLOR: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-700",
};

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("normal");

  const load = async () => {
    setLoading(true);
    try {
      const data = await TicketAPI.list();
      setTickets(data);
      setError(null);
    } catch (e: unknown) {
      // v3: more aggressive error detection
      const errStr = JSON.stringify(e ?? {});
      console.warn("[support v3] caught:", errStr);
      if (
        errStr.includes("PGRST205") ||
        errStr.includes("tickets") ||
        errStr.includes("schema cache") ||
        errStr.includes("does not exist")
      ) {
        setError("DB_NOT_READY");
      } else {
        const m = (e as { message?: string } | null)?.message ?? "";
        setError(m || errStr.slice(0, 100) || "Error");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!subject.trim() || !description.trim()) return;
    setCreating(true);
    try {
      await TicketAPI.create({ subject, description, category: category as Ticket["category"], priority: priority as Ticket["priority"] });
      setSubject(""); setDescription(""); setCategory("general"); setPriority("normal");
      setShowForm(false);
      await load();
    } catch (e) {
      alert("Error: " + (e instanceof Error ? e.message : e));
    } finally {
      setCreating(false);
    }
  };

  return (
    <AppShell title="ศูนย์ช่วยเหลือ / แจ้งปัญหา">
      <div className="space-y-4">
        {/* Header */}
        <div className="spadt-card flex items-center justify-between bg-[var(--spadt-cream)] border border-[var(--spadt-gold)]">
          <div className="flex items-center gap-3">
            <LifeBuoy className="w-8 h-8 text-[var(--spadt-navy)]" />
            <div>
              <div className="font-bold text-[var(--spadt-navy)]">ติดต่อทีมสนับสนุน</div>
              <div className="text-xs text-gray-600">แจ้งปัญหา ขอความช่วยเหลือ หรือเสนอแนะฟีเจอร์</div>
            </div>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="spadt-btn spadt-btn-primary flex items-center gap-1 text-sm">
            <Plus className="w-4 h-4" /> {showForm ? "ปิดฟอร์ม" : "เปิด Ticket ใหม่"}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="spadt-card">
            <h3 className="font-bold text-[var(--spadt-navy)] mb-3">📝 เปิด Ticket ใหม่</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600">หัวข้อ *</label>
                <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="สรุปปัญหาสั้นๆ"
                  value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600">หมวดหมู่</label>
                  <select className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
                    {CATEGORIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">ระดับความสำคัญ</label>
                  <select className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={priority} onChange={(e) => setPriority(e.target.value)}>
                    {PRIORITIES.map((p) => <option key={p.code} value={p.code}>{p.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">รายละเอียด *</label>
                <textarea rows={5} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="อธิบายปัญหาให้ละเอียด ถ้าเป็นบัค ระบุขั้นตอนทำซ้ำได้"
                  value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm">ยกเลิก</button>
                <button onClick={submit} disabled={creating || !subject.trim() || !description.trim()} className="spadt-btn spadt-btn-primary text-sm disabled:opacity-50 flex items-center gap-1">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  ส่ง Ticket
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ticket list */}
        <div className="spadt-card">
          <h3 className="font-bold text-[var(--spadt-navy)] mb-3">Ticket ของฉัน</h3>
          {error === "DB_NOT_READY" ? (
            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-300 text-yellow-900 text-sm mb-3">
              <div className="font-bold mb-2">⚙️ ระบบ Ticket ยังไม่พร้อมใช้งาน</div>
              <p className="text-xs">
                ตาราง <code>tickets</code> ยังไม่ถูกสร้างใน Supabase กรุณารัน SQL migration-08:
              </p>
              <pre className="mt-2 p-2 bg-white rounded text-xs overflow-x-auto">supabase/migration-08-notifications-tickets.sql</pre>
              <p className="text-xs mt-2">
                เปิด <a href="https://supabase.com/dashboard/project/dtfgbzvhtxidlbcmukcb/sql/new" target="_blank" rel="noreferrer" className="underline">Supabase SQL Editor</a>
                {" "}→ paste SQL จากไฟล์ → Run
              </p>
            </div>
          ) : error ? (
            <div className="p-3 rounded-lg bg-yellow-50 text-yellow-800 text-sm mb-3">⚠️ {error}</div>
          ) : null}
          {loading ? (
            <p className="text-gray-500 text-sm"><Loader2 className="inline w-4 h-4 animate-spin"/> กำลังโหลด...</p>
          ) : tickets.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">ยังไม่มี Ticket — กด &ldquo;เปิด Ticket ใหม่&rdquo;</p>
          ) : (
            <div className="space-y-2">
              {tickets.map((t) => (
                <Link key={t.id} href={`/support/${t.id}`} className="block p-3 rounded-lg border border-gray-200 hover:border-[var(--spadt-gold)] hover:bg-gray-50">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-500">#{t.ticket_no}</span>
                      <span className="font-semibold text-[var(--spadt-navy)]">{t.subject}</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[t.status]}`}>{STATUS_LABEL[t.status]}</span>
                      <span className="text-xs text-gray-500">{new Date(t.created_at).toLocaleDateString("th-TH")}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-1">{t.description}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
