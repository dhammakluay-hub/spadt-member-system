"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { MemberAPI, ExportAPI, type Member } from "@/lib/api";
import { getCurrentUser, canEditMembers, canApproveMembers, type AuthUser } from "@/lib/auth";
import { SPORTS, MEMBER_STATUS_LABEL } from "@/lib/constants";
import { Download, Search, Eye, CheckCircle2, XCircle, Trash2 } from "lucide-react";

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sport, setSport] = useState("");
  const [me, setMe] = useState<AuthUser | null>(null);

  useEffect(() => { getCurrentUser().then(setMe).catch(() => setMe(null)); }, []);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await MemberAPI.list({
        search: search || undefined,
        sport: sport || undefined,
        status: (statusFilter || undefined) as Member["status"] | undefined,
      });
      setMembers(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const quickAction = async (id: string, action: "approve" | "reject" | "delete") => {
    try {
      if (action === "approve") {
        await MemberAPI.setStatus(id, "approved");
      } else if (action === "reject") {
        if (!confirm("ปฏิเสธสมาชิกรายนี้?")) return;
        await MemberAPI.setStatus(id, "rejected");
      } else {
        if (!confirm("ลบสมาชิกถาวร? ย้อนกลับไม่ได้")) return;
        await MemberAPI.remove(id);
      }
      await load();
    } catch (e) {
      alert("Error: " + (e instanceof Error ? e.message : e));
    }
  };

  return (
    <AppShell title="สมาชิก">
      <div className="spadt-card">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300"
              placeholder="ค้นหา ชื่อ-นามสกุล / เลขบัตร"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
            />
          </div>
          <select
            className="px-3 py-2 rounded-lg border border-gray-300"
            value={sport}
            onChange={(e) => setSport(e.target.value)}
          >
            <option value="">กีฬาทั้งหมด</option>
            {SPORTS.map((s) => (
              <option key={s.code} value={s.code}>{s.name_th}</option>
            ))}
          </select>
          <select
            className="px-3 py-2 rounded-lg border border-gray-300"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">สถานะทั้งหมด</option>
            <option value="pending">รออนุมัติ</option>
            <option value="approved">อนุมัติแล้ว</option>
            <option value="rejected">ปฏิเสธ</option>
            <option value="expired">หมดอายุ</option>
          </select>
          <button onClick={load} className="spadt-btn spadt-btn-primary">ค้นหา</button>
          <button onClick={() => ExportAPI.membersToExcel(members)} className="spadt-btn spadt-btn-gold flex items-center gap-2">
            <Download className="w-4 h-4" /> Export Excel
          </button>
        </div>

        {error && <div className="p-3 rounded-lg bg-yellow-50 text-yellow-800 text-sm mb-4">⚠️ {error}</div>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left bg-[var(--spadt-navy)] text-white">
                <th className="p-3">#</th>
                <th className="p-3">ชื่อ-นามสกุล</th>
                <th className="p-3">เลขบัตร</th>
                <th className="p-3">กีฬา</th>
                <th className="p-3">Class</th>
                <th className="p-3">สถานะ</th>
                <th className="p-3">วันสมัคร</th>
                <th className="p-3 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="p-6 text-center text-gray-500">กำลังโหลด...</td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan={8} className="p-6 text-center text-gray-500">ยังไม่มีสมาชิก</td></tr>
              ) : (
                members.map((m, i) => {
                  const s = SPORTS.find((sp) => sp.code === m.sport_code);
                  return (
                    <tr key={m.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{i + 1}</td>
                      <td className="p-3 font-medium">
                        <Link href={`/members/${m.id}`} className="text-[var(--spadt-navy)] hover:underline">
                          {m.first_name} {m.last_name}
                        </Link>
                      </td>
                      <td className="p-3 font-mono text-xs">{m.national_id ?? "-"}</td>
                      <td className="p-3">{s?.name_th ?? m.sport_code ?? "-"}</td>
                      <td className="p-3 font-semibold text-[var(--spadt-gold-dark)]">{m.classification_code ?? "-"}</td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          m.status === "approved" ? "bg-green-100 text-green-700"
                          : m.status === "pending" ? "bg-yellow-100 text-yellow-700"
                          : m.status === "rejected" ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                        }`}>{MEMBER_STATUS_LABEL[m.status]}</span>
                      </td>
                      <td className="p-3 text-gray-500">{new Date(m.created_at).toLocaleDateString("th-TH")}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/members/${m.id}`} className="p-1.5 rounded hover:bg-gray-200 text-gray-600" title={canEditMembers(me) ? "ดู/แก้ไข" : "ดู (read-only)"}>
                            <Eye className="w-4 h-4" />
                          </Link>
                          {canApproveMembers(me) && m.status !== "approved" && (
                            <button onClick={() => quickAction(m.id, "approve")} className="p-1.5 rounded hover:bg-green-100 text-green-600" title="อนุมัติ">
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          {canApproveMembers(me) && m.status !== "rejected" && (
                            <button onClick={() => quickAction(m.id, "reject")} className="p-1.5 rounded hover:bg-red-100 text-red-600" title="ปฏิเสธ">
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                          {canEditMembers(me) && (
                            <button onClick={() => quickAction(m.id, "delete")} className="p-1.5 rounded hover:bg-red-100 text-red-700" title="ลบ">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
