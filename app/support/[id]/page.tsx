"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { TicketAPI, type Ticket, type TicketComment } from "@/lib/api";
import { ArrowLeft, Send, Loader2 } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  open: "เปิดใหม่", in_progress: "กำลังดำเนินการ", resolved: "แก้ไขแล้ว", closed: "ปิด",
};
const STATUS_COLOR: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-700",
};

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [t, c] = await Promise.all([TicketAPI.get(id), TicketAPI.listComments(id)]);
      setTicket(t);
      setComments(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const submit = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await TicketAPI.addComment(id, reply);
      setReply("");
      await load();
    } catch (e) {
      alert("Error: " + (e instanceof Error ? e.message : e));
    } finally {
      setSending(false);
    }
  };

  const setStatus = async (status: Ticket["status"]) => {
    if (!ticket) return;
    await TicketAPI.update(ticket.id, { status });
    await load();
  };

  if (loading) return <AppShell title="Ticket"><Loader2 className="inline w-5 h-5 animate-spin"/> กำลังโหลด...</AppShell>;
  if (error || !ticket) return <AppShell title="Ticket"><div className="text-red-600">{error ?? "ไม่พบ Ticket"}</div></AppShell>;

  return (
    <AppShell title={`Ticket #${ticket.ticket_no}`}>
      <div className="mb-3"><Link href="/support" className="text-sm text-gray-600 hover:text-[var(--spadt-navy)] flex items-center gap-1"><ArrowLeft className="w-4 h-4"/> กลับ</Link></div>

      <div className="spadt-card mb-3">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm text-gray-500">#{ticket.ticket_no}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[ticket.status]}`}>{STATUS_LABEL[ticket.status]}</span>
              <span className="text-xs text-gray-500">{ticket.priority} priority · {ticket.category}</span>
            </div>
            <h2 className="text-xl font-bold text-[var(--spadt-navy)]">{ticket.subject}</h2>
            <div className="text-xs text-gray-500 mt-1">
              จาก {ticket.reporter_email ?? "—"} · {new Date(ticket.created_at).toLocaleString("th-TH")}
            </div>
          </div>
          <div className="flex gap-1">
            {(["open","in_progress","resolved","closed"] as const).map((s) => (
              <button key={s} onClick={() => setStatus(s)} disabled={ticket.status === s}
                className={`px-2 py-1 text-xs rounded ${ticket.status === s ? "bg-[var(--spadt-navy)] text-white" : "bg-gray-100 hover:bg-gray-200"} disabled:opacity-100`}>
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
        <div className="prose prose-sm max-w-none whitespace-pre-wrap p-3 bg-gray-50 rounded">{ticket.description}</div>
      </div>

      {/* Comments thread */}
      <div className="spadt-card mb-3">
        <h3 className="font-bold text-[var(--spadt-navy)] mb-3">💬 บทสนทนา ({comments.length})</h3>
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500">ยังไม่มีการตอบกลับ</p>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => (
              <div key={c.id} className="border-l-2 border-[var(--spadt-gold)] pl-3 py-1">
                <div className="text-xs text-gray-500">
                  <span className="font-semibold">{c.author_email ?? "—"}</span> · {new Date(c.created_at).toLocaleString("th-TH")}
                  {c.internal_note && <span className="ml-2 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px]">internal</span>}
                </div>
                <div className="text-sm whitespace-pre-wrap mt-1">{c.body}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reply */}
      <div className="spadt-card">
        <h3 className="font-bold text-[var(--spadt-navy)] mb-2">✍️ ตอบกลับ</h3>
        <textarea rows={4} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="พิมพ์ข้อความ..."
          value={reply} onChange={(e) => setReply(e.target.value)} />
        <div className="mt-2 flex justify-end">
          <button onClick={submit} disabled={sending || !reply.trim()} className="spadt-btn spadt-btn-primary text-sm flex items-center gap-1 disabled:opacity-50">
            {sending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>} ส่ง
          </button>
        </div>
      </div>
    </AppShell>
  );
}
