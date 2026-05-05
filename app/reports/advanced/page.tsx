"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { MemberAPI, ExportAPI, type Member } from "@/lib/api";
import { SPORTS, REGIONS, DISABILITY_TYPES, COMPETITION_LEVELS, MEMBER_STATUS_LABEL } from "@/lib/constants";
import { Download, Filter, Loader2 } from "lucide-react";

type Dimension = "sport" | "disability" | "region" | "status" | "competition_level";

const DIMENSIONS: { value: Dimension; label: string }[] = [
  { value: "sport", label: "ชนิดกีฬา" },
  { value: "disability", label: "ประเภทความพิการ" },
  { value: "region", label: "ภูมิภาค" },
  { value: "status", label: "สถานะสมาชิก" },
  { value: "competition_level", label: "ระดับการแข่งขัน" },
];

function getDimValues(dim: Dimension): { code: string; label: string }[] {
  switch (dim) {
    case "sport": return SPORTS.map((s) => ({ code: s.code, label: s.name_th }));
    case "disability": return DISABILITY_TYPES.map((d) => ({ code: d.code, label: d.label }));
    case "region": return REGIONS.map((r) => ({ code: r, label: r }));
    case "status": return Object.entries(MEMBER_STATUS_LABEL).map(([k, v]) => ({ code: k, label: v }));
    case "competition_level": return COMPETITION_LEVELS.map((c) => ({ code: c.code, label: c.label }));
  }
}

function getMemberDim(m: Member, dim: Dimension): string | null {
  switch (dim) {
    case "sport": return m.sport_code ?? null;
    case "disability": return m.disability_type ?? null;
    case "region": return m.region ?? null;
    case "status": return m.status;
    case "competition_level": return m.competition_level ?? null;
  }
}

export default function AdvancedReportsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rowDim, setRowDim] = useState<Dimension>("sport");
  const [colDim, setColDim] = useState<Dimension>("region");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterSport, setFilterSport] = useState<string>("");

  useEffect(() => {
    MemberAPI.list()
      .then(setMembers)
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, []);

  // Apply filters
  const filtered = useMemo(() => members.filter((m) => {
    if (filterStatus && m.status !== filterStatus) return false;
    if (filterSport && m.sport_code !== filterSport) return false;
    return true;
  }), [members, filterStatus, filterSport]);

  // Build pivot
  const pivot = useMemo(() => {
    const rowVals = getDimValues(rowDim);
    const colVals = getDimValues(colDim);
    const matrix: Record<string, Record<string, number>> = {};
    const rowTotals: Record<string, number> = {};
    const colTotals: Record<string, number> = {};
    let grandTotal = 0;
    for (const m of filtered) {
      const r = getMemberDim(m, rowDim) ?? "(ไม่ระบุ)";
      const c = getMemberDim(m, colDim) ?? "(ไม่ระบุ)";
      if (!matrix[r]) matrix[r] = {};
      matrix[r][c] = (matrix[r][c] ?? 0) + 1;
      rowTotals[r] = (rowTotals[r] ?? 0) + 1;
      colTotals[c] = (colTotals[c] ?? 0) + 1;
      grandTotal++;
    }
    return { matrix, rowTotals, colTotals, grandTotal, rowVals, colVals };
  }, [filtered, rowDim, colDim]);

  const exportCSV = async () => {
    const XLSX = await import("xlsx");
    const headers = [DIMENSIONS.find((d) => d.value === rowDim)?.label ?? "Row", ...pivot.colVals.map((c) => c.label), "รวม"];
    const rows = pivot.rowVals.map((rv) => {
      const row: (string | number)[] = [rv.label];
      for (const cv of pivot.colVals) row.push(pivot.matrix[rv.code]?.[cv.code] ?? 0);
      row.push(pivot.rowTotals[rv.code] ?? 0);
      return row;
    });
    rows.push(["รวม", ...pivot.colVals.map((c) => pivot.colTotals[c.code] ?? 0), pivot.grandTotal]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pivot");
    XLSX.writeFile(wb, `spadt-pivot-${rowDim}-x-${colDim}.xlsx`);
  };

  return (
    <AppShell title="รายงานขั้นสูง — Cross-tab">
      <div className="space-y-4">
        {/* Filters */}
        <div className="spadt-card">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-[var(--spadt-navy)]" />
            <span className="font-semibold text-[var(--spadt-navy)]">ตัวกรอง + แกนวิเคราะห์</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600">แกน Row (แถว)</label>
              <select className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={rowDim} onChange={(e) => setRowDim(e.target.value as Dimension)}>
                {DIMENSIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">แกน Column (คอลัมน์)</label>
              <select className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={colDim} onChange={(e) => setColDim(e.target.value as Dimension)}>
                {DIMENSIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">กรองสถานะ</label>
              <select className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">ทั้งหมด</option>
                {Object.entries(MEMBER_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">กรองกีฬา</label>
              <select className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={filterSport} onChange={(e) => setFilterSport(e.target.value)}>
                <option value="">ทั้งหมด</option>
                {SPORTS.map((s) => <option key={s.code} value={s.code}>{s.name_th}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="spadt-card text-center">
            <div className="text-xs text-gray-500">จำนวนสมาชิกในรายงาน</div>
            <div className="text-3xl font-bold text-[var(--spadt-navy)]">{filtered.length}</div>
            <div className="text-xs text-gray-400">จาก {members.length} ทั้งหมด</div>
          </div>
          <div className="spadt-card text-center">
            <div className="text-xs text-gray-500">{DIMENSIONS.find((d) => d.value === rowDim)?.label} ที่พบ</div>
            <div className="text-3xl font-bold text-[var(--spadt-navy)]">{Object.keys(pivot.rowTotals).length}</div>
          </div>
          <div className="spadt-card text-center">
            <div className="text-xs text-gray-500">{DIMENSIONS.find((d) => d.value === colDim)?.label} ที่พบ</div>
            <div className="text-3xl font-bold text-[var(--spadt-navy)]">{Object.keys(pivot.colTotals).length}</div>
          </div>
        </div>

        {/* Pivot table */}
        <div className="spadt-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-[var(--spadt-navy)]">
              ตารางไขว้: {DIMENSIONS.find((d) => d.value === rowDim)?.label} × {DIMENSIONS.find((d) => d.value === colDim)?.label}
            </h3>
            <div className="flex gap-2">
              <button onClick={exportCSV} className="spadt-btn spadt-btn-gold flex items-center gap-1 text-sm">
                <Download className="w-4 h-4" /> Excel
              </button>
              <button onClick={() => ExportAPI.membersToExcel(filtered)} className="spadt-btn spadt-btn-primary flex items-center gap-1 text-sm">
                <Download className="w-4 h-4" /> Raw Data
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500"><Loader2 className="inline w-5 h-5 animate-spin"/> กำลังโหลด...</div>
          ) : error ? (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--spadt-navy)] text-white">
                    <th className="p-2 text-left sticky left-0 bg-[var(--spadt-navy)]">
                      {DIMENSIONS.find((d) => d.value === rowDim)?.label} \ {DIMENSIONS.find((d) => d.value === colDim)?.label}
                    </th>
                    {pivot.colVals.map((c) => (
                      <th key={c.code} className="p-2 text-right whitespace-nowrap">{c.label}</th>
                    ))}
                    <th className="p-2 text-right bg-[var(--spadt-gold)] text-[var(--spadt-navy)]">รวม</th>
                  </tr>
                </thead>
                <tbody>
                  {pivot.rowVals.map((rv) => {
                    const rowTotal = pivot.rowTotals[rv.code] ?? 0;
                    if (rowTotal === 0) return null; // Hide empty rows
                    return (
                      <tr key={rv.code} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium sticky left-0 bg-white">{rv.label}</td>
                        {pivot.colVals.map((cv) => {
                          const v = pivot.matrix[rv.code]?.[cv.code] ?? 0;
                          const intensity = pivot.grandTotal > 0 ? v / pivot.grandTotal : 0;
                          return (
                            <td
                              key={cv.code}
                              className="p-2 text-right tabular-nums"
                              style={{
                                backgroundColor: v > 0 ? `rgba(212,175,55,${0.15 + intensity * 4})` : undefined,
                              }}
                            >
                              {v > 0 ? v : "·"}
                            </td>
                          );
                        })}
                        <td className="p-2 text-right font-bold bg-[var(--spadt-cream)]">{rowTotal}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-[var(--spadt-gold)] text-[var(--spadt-navy)] font-bold">
                    <td className="p-2 sticky left-0 bg-[var(--spadt-gold)]">รวม</td>
                    {pivot.colVals.map((cv) => (
                      <td key={cv.code} className="p-2 text-right">{pivot.colTotals[cv.code] ?? 0}</td>
                    ))}
                    <td className="p-2 text-right">{pivot.grandTotal}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
