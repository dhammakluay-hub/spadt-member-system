"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid,
} from "recharts";
import AppShell from "@/components/AppShell";
import { MemberAPI, type Member } from "@/lib/api";
import { SPORTS, MEMBER_STATUS_LABEL, REGIONS } from "@/lib/constants";
import { Users, Clock, CheckCircle2, XCircle, TrendingUp, Trophy, MapPin, FileWarning } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  approved: "#10b981",
  pending: "#f59e0b",
  rejected: "#ef4444",
  expired: "#6b7280",
};

export default function DashboardPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    MemberAPI.list()
      .then(setMembers)
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, []);

  // Compute aggregates
  const stats = useMemo(() => {
    const total = members.length;
    const byStatus = { pending: 0, approved: 0, rejected: 0, expired: 0 };
    for (const m of members) byStatus[m.status] = (byStatus[m.status] ?? 0) + 1;
    const incompleteDocs = members.filter((m) => (m.documents?.length ?? 0) === 0).length;
    return { total, ...byStatus, incompleteDocs };
  }, [members]);

  // Top sports
  const sportData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of members) {
      if (!m.sport_code) continue;
      counts.set(m.sport_code, (counts.get(m.sport_code) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([code, count]) => ({
        name: SPORTS.find((s) => s.code === code)?.name_th.replace("กีฬา", "") ?? code,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [members]);

  // Status distribution
  const statusData = useMemo(() => {
    return (["approved", "pending", "rejected", "expired"] as const).map((s) => ({
      name: MEMBER_STATUS_LABEL[s],
      value: stats[s],
      color: STATUS_COLORS[s],
    })).filter((d) => d.value > 0);
  }, [stats]);

  // Region distribution
  const regionData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of REGIONS) counts.set(r, 0);
    for (const m of members) {
      if (!m.region) continue;
      counts.set(m.region, (counts.get(m.region) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
  }, [members]);

  // Registrations over time (by month)
  const trendData = useMemo(() => {
    const buckets = new Map<string, number>();
    for (const m of members) {
      const d = new Date(m.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, count]) => ({ month, count }));
  }, [members]);

  const cards = [
    { label: "สมาชิกทั้งหมด", value: stats.total, icon: Users, color: "bg-blue-500", trend: null },
    { label: "อนุมัติแล้ว", value: stats.approved, icon: CheckCircle2, color: "bg-green-500" },
    { label: "รออนุมัติ", value: stats.pending, icon: Clock, color: "bg-yellow-500" },
    { label: "ปฏิเสธ", value: stats.rejected, icon: XCircle, color: "bg-red-500" },
  ];

  return (
    <AppShell title="แดชบอร์ด">
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-yellow-50 text-yellow-800 text-sm">⚠️ {error}</div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="spadt-card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">{c.label}</div>
                  <div className="text-3xl font-bold text-[var(--spadt-navy)] mt-2">
                    {loading ? "..." : c.value.toLocaleString()}
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-lg ${c.color} flex items-center justify-center text-white`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="spadt-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center"><Trophy className="w-5 h-5"/></div>
          <div>
            <div className="text-xs text-gray-500">ชนิดกีฬาที่มีนักกีฬา</div>
            <div className="text-xl font-bold">{sportData.length} / {SPORTS.length}</div>
          </div>
        </div>
        <div className="spadt-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center"><MapPin className="w-5 h-5"/></div>
          <div>
            <div className="text-xs text-gray-500">ครอบคลุมภูมิภาค</div>
            <div className="text-xl font-bold">{regionData.filter(r => r.count > 0).length} / {REGIONS.length}</div>
          </div>
        </div>
        <div className="spadt-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center"><FileWarning className="w-5 h-5"/></div>
          <div>
            <div className="text-xs text-gray-500">ขาดเอกสารแนบ</div>
            <div className="text-xl font-bold">{stats.incompleteDocs}</div>
          </div>
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Sport bar chart */}
        <div className="spadt-card">
          <h3 className="font-bold text-[var(--spadt-navy)] mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4" /> Top 8 ชนิดกีฬา
          </h3>
          {sportData.length === 0 ? (
            <div className="text-sm text-gray-500 py-8 text-center">ยังไม่มีข้อมูล</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={sportData} layout="vertical" margin={{ left: 60 }}>
                <XAxis type="number" allowDecimals={false} fontSize={11} />
                <YAxis dataKey="name" type="category" fontSize={11} width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#0a1e3f" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status pie */}
        <div className="spadt-card">
          <h3 className="font-bold text-[var(--spadt-navy)] mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> สัดส่วนสถานะสมาชิก
          </h3>
          {statusData.length === 0 ? (
            <div className="text-sm text-gray-500 py-8 text-center">ยังไม่มีข้อมูล</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%" cy="50%"
                  outerRadius={90}
                  label={(entry) => `${entry.name} (${entry.value})`}
                  fontSize={11}
                >
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Region distribution */}
        <div className="spadt-card">
          <h3 className="font-bold text-[var(--spadt-navy)] mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> สมาชิกตามภูมิภาค
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={regionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={10} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} fontSize={11} />
              <Tooltip />
              <Bar dataKey="count" fill="#d4af37" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Trend line */}
        <div className="spadt-card">
          <h3 className="font-bold text-[var(--spadt-navy)] mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> ลงทะเบียนรายเดือน (12 เดือนล่าสุด)
          </h3>
          {trendData.length === 0 ? (
            <div className="text-sm text-gray-500 py-8 text-center">ยังไม่มีข้อมูล</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#0a1e3f" strokeWidth={2} dot={{ fill: "#d4af37", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </AppShell>
  );
}
