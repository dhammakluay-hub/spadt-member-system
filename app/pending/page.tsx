"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { MemberAPI, type Member } from "@/lib/api";
import { SPORTS } from "@/lib/constants";
import { Check, X, Eye, CheckSquare, Square } from "lucide-react";

export default function PendingPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    setSelected(new Set());
    try {
      const data = await MemberAPI.list({ status: "pending" });
      setMembers(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) =>
      prev.size === members.length ? new Set() : new Set(members.map((m) => m.id))
    );
  };

  const approve = async (id: string) => {
    await MemberAPI.setStatus(id, "approved");
    load();
  };
  const reject = async (id: string) => {
    if (!confirm("ยืนยันปฏิเสธใบสมัครนี้?")) return;
    await MemberAPI.setStatus(id, "rejected");
    load();
  };

  const bulkAction = async (action: "approve" | "reject") => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const verb = action === "approve" ? "อนุมัติ" : "ปฏิเสธ";
    if (!confirm(`${verb} ${ids.length} รายการที่เลือก?`)) return;
    setBulkBusy(true);
    try {
      await MemberAPI.bulkSetStatus(ids, action === "approve" ? "approved" : "rejected");
      await load();
    } catch (e) {
      alert("Error: " + (e instanceof Error ? e.message : e));
    } finally {
      setBulkBusy(false);
    }
  };

  const allSelected = members.length > 0 && selected.size === members.length;

  return (
    <AppShell title="รออนุมัติ">
      <div className="spadt-card">
        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-[var(--spadt-cream)] border-2 border-[var(--spadt-gold)] flex items-center justify-between">
            <span className="text-sm font-medium">
              เลือก {selected.size} จาก {members.length} รายการ
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => bulkAction("approve")}
                disabled={bulkBusy}
                className="px-3 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 text-sm flex items-center gap-1 disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> อนุมัติทั้งหมด ({selected.size})
              </button>
              <button
                onClick={() => bulkAction("reject")}
                disabled={bulkBusy}
                className="px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 text-sm flex items-center gap-1 disabled:opacity-50"
              >
                <X className="w-4 h-4" /> ปฏิเสธทั้งหมด
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="px-3 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        )}

        {error && <div className="p-3 rounded-lg bg-yellow-50 text-yellow-800 text-sm mb-4">⚠️ {error}</div>}

        {loading ? (
          <p className="text-gray-500">กำลังโหลด...</p>
        ) : members.length === 0 ? (
          <p className="text-gray-500 text-center py-8">ไม่มีใบสมัครรออนุมัติ</p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center px-2 py-1 text-xs text-gray-500">
              <button onClick={toggleAll} className="flex items-center gap-2 hover:text-[var(--spadt-navy)]">
                {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                <span>เลือกทั้งหมด</span>
              </button>
            </div>
            {members.map((m) => {
              const s = SPORTS.find((sp) => sp.code === m.sport_code);
              const checked = selected.has(m.id);
              return (
                <div
                  key={m.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    checked
                      ? "border-[var(--spadt-gold)] bg-[var(--spadt-cream)]"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <button onClick={() => toggle(m.id)} className="text-[var(--spadt-navy)]">
                    {checked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-gray-400" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <Link href={`/members/${m.id}`} className="font-semibold text-[var(--spadt-navy)] hover:underline">
                      {m.first_name} {m.last_name}
                    </Link>
                    <div className="text-sm text-gray-500">
                      {m.national_id} · {s?.name_th ?? m.sport_code ?? "-"}
                      {m.classification_code && ` · Class ${m.classification_code}`}
                      {m.team_province && ` · ${m.team_province}`}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Link href={`/members/${m.id}`} className="p-2 rounded hover:bg-gray-200 text-gray-600" title="ดู">
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button onClick={() => approve(m.id)} className="px-3 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 flex items-center gap-1 text-sm">
                      <Check className="w-4 h-4" /> อนุมัติ
                    </button>
                    <button onClick={() => reject(m.id)} className="px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center gap-1 text-sm">
                      <X className="w-4 h-4" /> ปฏิเสธ
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
