"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { MemberAPI, ExportAPI } from "@/lib/api";
import { SPORTS } from "@/lib/constants";
import { Download } from "lucide-react";

export default function ReportsPage() {
  const [bySport, setBySport] = useState<Record<string, number>>({});
  const [byStatus, setByStatus] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    MemberAPI.list()
      .then((members) => {
        const sp: Record<string, number> = {};
        const st: Record<string, number> = {};
        for (const m of members) {
          if (m.sport_code) sp[m.sport_code] = (sp[m.sport_code] ?? 0) + 1;
          st[m.status] = (st[m.status] ?? 0) + 1;
        }
        setBySport(sp);
        setByStatus(st);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, []);

  const exportAll = async () => {
    const members = await MemberAPI.list();
    ExportAPI.membersToExcel(members);
  };

  return (
    <AppShell title="รายงาน">
      {error && (
        <div className="p-3 rounded-lg bg-yellow-50 text-yellow-800 text-sm mb-4">
          ⚠️ {error}
        </div>
      )}

      <div className="flex justify-end mb-4">
        <button onClick={exportAll} className="spadt-btn spadt-btn-gold flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export สมาชิกทั้งหมด (Excel)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="spadt-card">
          <h3 className="font-bold text-[var(--spadt-navy)] mb-3">จำแนกตามกีฬา</h3>
          {loading ? (
            <p className="text-gray-500">กำลังโหลด...</p>
          ) : (
            <div className="space-y-2">
              {SPORTS.map((s) => (
                <div key={s.code} className="flex justify-between items-center text-sm">
                  <span>{s.name_th}</span>
                  <span className="font-semibold">{bySport[s.code] ?? 0}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="spadt-card">
          <h3 className="font-bold text-[var(--spadt-navy)] mb-3">จำแนกตามสถานะ</h3>
          {loading ? (
            <p className="text-gray-500">กำลังโหลด...</p>
          ) : (
            <div className="space-y-2">
              {["pending", "approved", "rejected", "expired"].map((st) => (
                <div key={st} className="flex justify-between items-center text-sm">
                  <span className="capitalize">{st}</span>
                  <span className="font-semibold">{byStatus[st] ?? 0}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
