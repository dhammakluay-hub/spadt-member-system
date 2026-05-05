"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { AdminAPI, type AuditLog } from "@/lib/api";

const ACTION_COLORS: Record<string, string> = {
  INSERT: "bg-blue-100 text-blue-700",
  UPDATE: "bg-gray-100 text-gray-700",
  DELETE: "bg-red-100 text-red-700",
  APPROVE: "bg-green-100 text-green-700",
  REJECT: "bg-orange-100 text-orange-700",
};

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState("");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AdminAPI.listAuditLogs({
        action: actionFilter || undefined,
        limit: 200,
      });
      setLogs(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [actionFilter]);

  const filtered = logs.filter((l) =>
    !search ||
    (l.actor_email ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (l.record_id ?? "").includes(search)
  );

  return (
    <AppShell title="Audit Log — ประวัติการแก้ไข">
      <div className="spadt-card">
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            className="px-3 py-2 rounded-lg border border-gray-300 flex-1 min-w-[200px]"
            placeholder="ค้นหา email / record id"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="px-3 py-2 rounded-lg border border-gray-300"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="">การกระทำทั้งหมด</option>
            <option value="INSERT">INSERT (สร้างใหม่)</option>
            <option value="UPDATE">UPDATE (แก้ไข)</option>
            <option value="APPROVE">APPROVE (อนุมัติ)</option>
            <option value="REJECT">REJECT (ปฏิเสธ)</option>
            <option value="DELETE">DELETE (ลบ)</option>
          </select>
          <button onClick={load} className="spadt-btn spadt-btn-primary">รีเฟรช</button>
        </div>

        {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm mb-4">⚠️ {error}</div>}

        <div className="text-sm text-gray-500 mb-2">
          พบ {filtered.length} รายการ {logs.length >= 200 ? "(แสดง 200 ล่าสุด)" : ""}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left bg-[var(--spadt-navy)] text-white">
                <th className="p-2">เวลา</th>
                <th className="p-2">การกระทำ</th>
                <th className="p-2">โดย</th>
                <th className="p-2">ตาราง</th>
                <th className="p-2">Record</th>
                <th className="p-2">รายละเอียด</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-6 text-center text-gray-500">กำลังโหลด...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-gray-500">ยังไม่มีบันทึก</td></tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("th-TH")}
                    </td>
                    <td className="p-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ACTION_COLORS[log.action] ?? "bg-gray-100"}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-2 text-xs">{log.actor_email ?? "—"}</td>
                    <td className="p-2 text-xs">{log.table_name}</td>
                    <td className="p-2 text-xs font-mono">
                      {log.record_id && log.table_name === "members" ? (
                        <Link href={`/members/${log.record_id}`} className="text-blue-600 hover:underline">
                          {log.record_id.slice(0, 8)}
                        </Link>
                      ) : log.record_id?.slice(0, 8) ?? "—"}
                    </td>
                    <td className="p-2 text-xs max-w-md">
                      {log.changes && (
                        <details>
                          <summary className="cursor-pointer text-blue-600">ดู</summary>
                          <pre className="text-[10px] mt-1 bg-gray-50 p-2 rounded overflow-x-auto max-h-40">
                            {JSON.stringify(log.changes, null, 2)}
                          </pre>
                        </details>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
