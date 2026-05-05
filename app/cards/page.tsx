"use client";

import { useEffect, useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import MemberCard from "@/components/MemberCard";
import { MemberAPI, type Member } from "@/lib/api";
import { Printer, FileDown, Download, Loader2 } from "lucide-react";

export default function CardsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    MemberAPI.list({ status: "approved" })
      .then(setMembers)
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, []);

  // Export single card as PNG using html-to-image (supports modern CSS oklab/oklch)
  const downloadCard = async (m: Member) => {
    const el = cardRefs.current.get(m.id);
    if (!el) return;
    setDownloadingId(m.id);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(el, { pixelRatio: 3, cacheBust: true });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `SPADT-Card-${m.first_name}-${m.last_name}.png`;
      a.click();
    } catch (e) {
      alert("ดาวน์โหลดไม่สำเร็จ: " + (e instanceof Error ? e.message : e));
    } finally {
      setDownloadingId(null);
    }
  };

  // Export all cards to PDF (8 cards per A4 page, CR80 size)
  const exportPDF = async () => {
    if (members.length === 0) return;
    setExporting(true);
    try {
      const [{ toPng }, { default: jsPDF }] = await Promise.all([
        import("html-to-image"),
        import("jspdf"),
      ]);
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const cardW = 85.6;
      const cardH = 54;
      const marginX = (210 - cardW * 2 - 5) / 2;
      const marginTop = 15;
      const gapY = 5;
      const cardsPerPage = 8;

      for (let i = 0; i < members.length; i++) {
        const m = members[i];
        const el = cardRefs.current.get(m.id);
        if (!el) continue;
        const dataUrl = await toPng(el, { pixelRatio: 3, cacheBust: true, backgroundColor: "#ffffff" });

        const localIdx = i % cardsPerPage;
        if (i > 0 && localIdx === 0) pdf.addPage();
        const col = localIdx % 2;
        const row = Math.floor(localIdx / 2);
        const x = marginX + col * (cardW + 5);
        const y = marginTop + row * (cardH + gapY);
        pdf.addImage(dataUrl, "PNG", x, y, cardW, cardH);
      }
      pdf.save(`SPADT-Cards-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      alert("ส่งออก PDF ไม่สำเร็จ: " + (e instanceof Error ? e.message : e));
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppShell title="บัตรสมาชิก">
      <style jsx global>{`
        @media print {
          aside, header, .no-print { display: none !important; }
          main { padding: 0 !important; }
        }
      `}</style>

      <div className="flex justify-between items-center mb-4 no-print">
        <span className="text-sm text-gray-500">
          {loading ? "กำลังโหลด..." : `${members.length} บัตรสมาชิก (เฉพาะที่อนุมัติแล้ว)`}
        </span>
        <div className="flex gap-2">
          <button
            onClick={exportPDF}
            disabled={exporting || members.length === 0}
            className="spadt-btn spadt-btn-gold flex items-center gap-2 disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            {exporting ? "กำลังสร้าง PDF..." : "Export PDF (8 ใบ/หน้า)"}
          </button>
          <button
            onClick={() => window.print()}
            disabled={members.length === 0}
            className="spadt-btn spadt-btn-primary flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> พิมพ์
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-yellow-50 text-yellow-800 text-sm mb-4 no-print">⚠️ {error}</div>
      )}

      {members.length === 0 && !loading ? (
        <div className="text-center py-12 text-gray-500">
          ยังไม่มีสมาชิกอนุมัติ — กลับไปอนุมัติที่หน้า &ldquo;รออนุมัติ&rdquo;
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 print:grid-cols-2 print:gap-3">
          {members.map((m) => (
            <div key={m.id} className="flex flex-col items-center">
              <div ref={(el) => { if (el) cardRefs.current.set(m.id, el); }}>
                <MemberCard member={m} />
              </div>
              <button
                onClick={() => downloadCard(m)}
                disabled={downloadingId === m.id}
                className="no-print mt-2 px-3 py-1 text-xs rounded bg-gray-100 hover:bg-[var(--spadt-gold)] hover:text-[var(--spadt-navy)] flex items-center gap-1 disabled:opacity-50"
              >
                {downloadingId === m.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                ดาวน์โหลดบัตรนี้ (PNG)
              </button>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
