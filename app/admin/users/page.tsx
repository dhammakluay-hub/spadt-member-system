"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { AdminAPI, type AdminUser } from "@/lib/api";
import { Loader2, Shield, UserCog, User } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AdminAPI.listUsers();
      setUsers(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const setRole = async (userId: string, role: "admin" | "staff" | "member") => {
    setSavingId(userId);
    try {
      await AdminAPI.updateRole(userId, role);
      await load();
    } catch (e) {
      alert("Error: " + (e instanceof Error ? e.message : e));
    } finally {
      setSavingId(null);
    }
  };

  const filtered = users.filter((u) =>
    !search || u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.display_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: users.length,
    admin: users.filter((u) => u.role === "admin").length,
    staff: users.filter((u) => u.role === "staff").length,
    member: users.filter((u) => !u.role || u.role === "member").length,
  };

  return (
    <AppShell title="จัดการผู้ใช้งาน">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <StatCard label="ผู้ใช้ทั้งหมด" value={stats.total} icon={User} color="bg-blue-500" />
        <StatCard label="Admin" value={stats.admin} icon={Shield} color="bg-purple-500" />
        <StatCard label="Staff" value={stats.staff} icon={UserCog} color="bg-orange-500" />
        <StatCard label="Member" value={stats.member} icon={User} color="bg-gray-500" />
      </div>

      <div className="spadt-card">
        <div className="flex items-center justify-between mb-4">
          <input
            className="px-3 py-2 rounded-lg border border-gray-300 w-72"
            placeholder="ค้นหา email / ชื่อ"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button onClick={load} className="text-sm text-[var(--spadt-navy)] hover:underline">รีเฟรช</button>
        </div>

        {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm mb-4">⚠️ {error}</div>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left bg-[var(--spadt-navy)] text-white">
                <th className="p-3">Email</th>
                <th className="p-3">ชื่อ</th>
                <th className="p-3">Role ปัจจุบัน</th>
                <th className="p-3">เข้าใช้ล่าสุด</th>
                <th className="p-3">เปลี่ยน Role</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-6 text-center text-gray-500">กำลังโหลด...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-gray-500">ไม่พบผู้ใช้</td></tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-mono text-xs">{u.email}</td>
                    <td className="p-3">{u.display_name ?? "—"}</td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.role === "admin" ? "bg-purple-100 text-purple-700" :
                        u.role === "staff" ? "bg-orange-100 text-orange-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>{u.role ?? "member"}</span>
                    </td>
                    <td className="p-3 text-gray-500 text-xs">
                      {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString("th-TH") : "—"}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        {(["admin", "staff", "member"] as const).map((r) => (
                          <button
                            key={r}
                            onClick={() => setRole(u.id, r)}
                            disabled={savingId === u.id || u.role === r}
                            className={`px-2 py-1 text-xs rounded ${
                              u.role === r
                                ? "bg-[var(--spadt-navy)] text-white"
                                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                            } disabled:opacity-50`}
                          >
                            {savingId === u.id && u.role !== r ? (
                              <Loader2 className="w-3 h-3 animate-spin inline" />
                            ) : r}
                          </button>
                        ))}
                      </div>
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

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string;
}) {
  return (
    <div className="spadt-card flex items-center justify-between">
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-2xl font-bold text-[var(--spadt-navy)]">{value}</div>
      </div>
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center text-white`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}
