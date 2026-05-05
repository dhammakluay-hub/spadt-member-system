"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { NotificationAPI, type EmailNotification } from "@/lib/api";
import { Mail, Send, Eye, AlertCircle, Loader2 } from "lucide-react";

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  sent: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

export default function AdminNotificationsPage() {
  const [emails, setEmails] = useState<EmailNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<EmailNotification | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await NotificationAPI.listEmails({ status: filter || undefined });
      setEmails(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const markSent = async (id: string) => {
    if (!confirm("ทำเครื่องหมายว่าส่งแล้ว?")) return;
    try {
      await NotificationAPI.markSent(id);
      await load();
    } catch (e) {
      alert("Error: " + (e instanceof Error ? e.message : e));
    }
  };

  const stats = {
    total: emails.length,
    pending: emails.filter((e) => e.status === "pending").length,
    sent: emails.filter((e) => e.status === "sent").length,
    failed: emails.filter((e) => e.status === "failed").length,
  };

  return (
    <AppShell title="Email Notifications Queue">
      <div className="space-y-4">
        {/* Setup info */}
        <div className="spadt-card bg-blue-50 border border-blue-200 text-sm text-blue-900">
          <div className="font-semibold mb-1">📧 ระบบคิวอีเมลแจ้งเตือน</div>
          <div className="text-xs">
            ระบบจะเก็บอีเมลที่ต้องส่งให้สมาชิก (เช่น แจ้งอนุมัติ/ปฏิเสธ) ลงในคิวนี้อัตโนมัติเมื่อเกิดเหตุการณ์
            <br />
            <strong>การส่งจริง:</strong> ต้องเชื่อม email provider (Resend / SendGrid / SMTP) ผ่าน Supabase Edge Function — ดูคู่มือที่
            <a href="https://resend.com/docs" target="_blank" rel="noreferrer" className="underline ml-1">resend.com/docs</a>
            <br />
            <strong>วิธีใช้ตอนนี้:</strong> เปิดอีเมลจากคิว → copy หัวข้อ + เนื้อหา → ส่งจาก Gmail ตัวเอง → กด &ldquo;ทำเครื่องหมายว่าส่งแล้ว&rdquo;
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <StatCard label="ทั้งหมด" value={stats.total} color="bg-blue-500" icon={Mail} />
          <StatCard label="รอส่ง" value={stats.pending} color="bg-yellow-500" icon={AlertCircle} />
          <StatCard label="ส่งแล้ว" value={stats.sent} color="bg-green-500" icon={Send} />
          <StatCard label="ล้มเหลว" value={stats.failed} color="bg-red-500" icon={AlertCircle} />
        </div>

        {/* Filter + table */}
        <div className="spadt-card">
          <div className="flex items-center gap-3 mb-3">
            <select className="px-3 py-2 rounded-lg border border-gray-300 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">สถานะทั้งหมด</option>
              <option value="pending">รอส่ง</option>
              <option value="sent">ส่งแล้ว</option>
              <option value="failed">ล้มเหลว</option>
            </select>
            <button onClick={load} className="text-sm text-[var(--spadt-navy)] hover:underline">รีเฟรช</button>
          </div>

          {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm mb-3">⚠️ {error}</div>}

          {loading ? (
            <p className="text-gray-500 text-sm"><Loader2 className="inline w-4 h-4 animate-spin"/> กำลังโหลด...</p>
          ) : emails.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">ยังไม่มี email ในคิว</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-[var(--spadt-navy)] text-white text-left">
                  <th className="p-2">เวลา</th>
                  <th className="p-2">ผู้รับ</th>
                  <th className="p-2">หัวข้อ</th>
                  <th className="p-2">เหตุการณ์</th>
                  <th className="p-2">สถานะ</th>
                  <th className="p-2 text-right">การจัดการ</th>
                </tr></thead>
                <tbody>
                  {emails.map((e) => (
                    <tr key={e.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 text-xs text-gray-500">{new Date(e.created_at).toLocaleString("th-TH")}</td>
                      <td className="p-2"><div className="font-mono text-xs">{e.to_email}</div><div className="text-xs text-gray-500">{e.to_name}</div></td>
                      <td className="p-2">{e.subject}</td>
                      <td className="p-2 text-xs">{e.trigger}</td>
                      <td className="p-2"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[e.status]}`}>{e.status}</span></td>
                      <td className="p-2 text-right">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => setSelected(e)} className="p-1.5 rounded hover:bg-gray-200" title="ดู"><Eye className="w-4 h-4"/></button>
                          {e.status === "pending" && (
                            <button onClick={() => markSent(e.id)} className="p-1.5 rounded hover:bg-green-100 text-green-600" title="ทำเครื่องหมายว่าส่งแล้ว"><Send className="w-4 h-4"/></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail modal */}
        {selected && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-[var(--spadt-navy)]">📧 อีเมล Preview</h3>
                <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              <dl className="text-sm space-y-1 mb-4">
                <div className="grid grid-cols-3 gap-2"><dt className="text-gray-500">ถึง:</dt><dd className="col-span-2 font-mono">{selected.to_email}</dd></div>
                <div className="grid grid-cols-3 gap-2"><dt className="text-gray-500">หัวข้อ:</dt><dd className="col-span-2 font-semibold">{selected.subject}</dd></div>
                <div className="grid grid-cols-3 gap-2"><dt className="text-gray-500">เหตุการณ์:</dt><dd className="col-span-2">{selected.trigger}</dd></div>
              </dl>
              <div className="bg-gray-50 p-4 rounded text-sm whitespace-pre-wrap font-mono">{selected.body}</div>
              <div className="mt-3 flex gap-2 justify-end">
                <button
                  onClick={() => navigator.clipboard.writeText(`To: ${selected.to_email}\nSubject: ${selected.subject}\n\n${selected.body}`)}
                  className="spadt-btn spadt-btn-gold text-sm"
                >
                  Copy ทั้งอีเมล
                </button>
                <a
                  href={`mailto:${selected.to_email}?subject=${encodeURIComponent(selected.subject)}&body=${encodeURIComponent(selected.body)}`}
                  className="spadt-btn spadt-btn-primary text-sm flex items-center gap-1"
                >
                  <Send className="w-4 h-4"/> เปิดใน Email Client
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="spadt-card flex items-center justify-between">
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-2xl font-bold text-[var(--spadt-navy)]">{value}</div>
      </div>
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center text-white`}><Icon className="w-5 h-5"/></div>
    </div>
  );
}
