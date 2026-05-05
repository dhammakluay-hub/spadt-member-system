"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import { MemberAPI, type Member } from "@/lib/api";
import { Upload, Download, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";

/** Columns supported in import */
const TEMPLATE_COLUMNS = [
  "title", "first_name", "last_name", "first_name_en", "last_name_en",
  "nickname", "national_id", "birth_date", "gender", "phone", "email",
  "address", "province", "district", "subdistrict", "postal_code",
  "sport_code", "classification_code", "personnel_type", "competition_level",
  "team_province", "work_status", "work_organization", "work_position",
];

type ParsedRow = Record<string, string | number | null>;
type ImportResult = { row: number; ok: boolean; error?: string; member?: string };

export default function ImportPage() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [filename, setFilename] = useState("");
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [dupCheck, setDupCheck] = useState<{ nid: string; exists: boolean }[]>([]);

  const parseFile = async (file: File) => {
    const XLSX = await import("xlsx");
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<ParsedRow>(sheet, { defval: "", raw: false });
    setRows(data);
    setHeaders(Object.keys(data[0] ?? {}));
    setFilename(file.name);
    setResults([]);
    // Duplicate precheck
    const nids = data.map((r) => String(r.national_id ?? "")).filter((n) => n.length === 13);
    const checks = await Promise.all(
      nids.map(async (nid) => ({
        nid,
        exists: await MemberAPI.checkNationalIdExists(nid).catch(() => false),
      }))
    );
    setDupCheck(checks);
  };

  const downloadTemplate = async () => {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.aoa_to_sheet([
      TEMPLATE_COLUMNS,
      ["นาย", "สมชาย", "ใจดี", "Somchai", "Jaidee", "", "1234567890123",
       "2000-01-15", "M", "0812345678", "somchai@example.com",
       "99/1 ถ.พหลโยธิน", "กรุงเทพมหานคร", "บางเขน", "อนุสาวรีย์", "10220",
       "SWI", "S10", "athlete", "national", "กรุงเทพฯ", "employed", "สำนักงาน", "โค้ช"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Members");
    XLSX.writeFile(wb, "spadt-import-template.xlsx");
  };

  const doImport = async () => {
    setImporting(true);
    const res: ImportResult[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const payload: Partial<Member> = {};
      for (const col of TEMPLATE_COLUMNS) {
        const v = row[col];
        if (v !== undefined && v !== null && v !== "") {
          (payload as Record<string, unknown>)[col] = v;
        }
      }
      if (!payload.first_name || !payload.last_name) {
        res.push({ row: i + 2, ok: false, error: "ขาด first_name/last_name" });
        continue;
      }
      try {
        const nid = String(row.national_id ?? "");
        if (nid && (await MemberAPI.checkNationalIdExists(nid))) {
          res.push({ row: i + 2, ok: false, error: `ซ้ำ: ${nid}` });
          continue;
        }
        const created = await MemberAPI.create({ ...payload, status: "pending" });
        res.push({ row: i + 2, ok: true, member: `${created.first_name} ${created.last_name}` });
      } catch (e) {
        res.push({ row: i + 2, ok: false, error: e instanceof Error ? e.message : "error" });
      }
      setResults([...res]); // live update
    }
    setImporting(false);
  };

  const dupCount = dupCheck.filter((d) => d.exists).length;
  const okCount = results.filter((r) => r.ok).length;
  const failCount = results.filter((r) => !r.ok).length;

  return (
    <AppShell title="นำเข้าสมาชิกจาก Excel/CSV">
      <div className="space-y-4">
        {/* Instructions */}
        <div className="spadt-card bg-[var(--spadt-cream)] border border-[var(--spadt-gold)]">
          <h3 className="font-bold text-[var(--spadt-navy)] mb-2">📋 วิธีใช้งาน</h3>
          <ol className="list-decimal list-inside text-sm space-y-1 text-gray-700">
            <li>ดาวน์โหลด template <strong>spadt-import-template.xlsx</strong> แล้วกรอกข้อมูล</li>
            <li>Upload ไฟล์ที่กรอกเสร็จแล้ว ระบบจะตรวจสอบและแสดง preview</li>
            <li>กด &ldquo;เริ่มนำเข้า&rdquo; — ระบบจะตรวจสอบเลขบัตรซ้ำและ import ทีละแถว</li>
          </ol>
          <button onClick={downloadTemplate} className="mt-3 spadt-btn spadt-btn-primary flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" /> ดาวน์โหลด Template
          </button>
        </div>

        {/* Upload */}
        <div className="spadt-card">
          <label className="block border-2 border-dashed border-gray-300 hover:border-[var(--spadt-navy)] rounded-lg p-8 text-center cursor-pointer transition-colors">
            <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
            <div className="text-sm text-gray-600">
              คลิกเลือกไฟล์ Excel (.xlsx) หรือ CSV (.csv)
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {filename ? `ไฟล์: ${filename} — ${rows.length} แถว` : "ยังไม่ได้เลือกไฟล์"}
            </div>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) parseFile(f);
              }}
            />
          </label>
        </div>

        {/* Preview */}
        {rows.length > 0 && (
          <div className="spadt-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-[var(--spadt-navy)]">Preview ({rows.length} แถว)</h3>
              <div className="flex items-center gap-3 text-xs">
                {dupCount > 0 && (
                  <span className="text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> พบซ้ำ {dupCount} เลข
                  </span>
                )}
                <button
                  onClick={doImport}
                  disabled={importing}
                  className="spadt-btn spadt-btn-gold flex items-center gap-1 text-sm disabled:opacity-50"
                >
                  {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {importing ? "กำลังนำเข้า..." : `เริ่มนำเข้า ${rows.length} รายการ`}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto max-h-80 border rounded">
              <table className="w-full text-xs">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="p-2 text-left">#</th>
                    {headers.slice(0, 7).map((h) => (
                      <th key={h} className="p-2 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 50).map((row, i) => {
                    const nid = String(row.national_id ?? "");
                    const dup = dupCheck.find((d) => d.nid === nid)?.exists;
                    return (
                      <tr key={i} className={`border-b ${dup ? "bg-red-50" : ""}`}>
                        <td className="p-2 text-gray-500">{i + 1}</td>
                        {headers.slice(0, 7).map((h) => (
                          <td key={h} className="p-2 font-mono">
                            {h === "national_id" && dup && <AlertCircle className="inline w-3 h-3 text-red-500 mr-1" />}
                            {String(row[h] ?? "")}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {rows.length > 50 && (
                <div className="p-2 text-center text-xs text-gray-500">
                  ...และอีก {rows.length - 50} แถว
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="spadt-card">
            <div className="flex items-center gap-4 mb-3">
              <h3 className="font-bold text-[var(--spadt-navy)]">ผลลัพธ์</h3>
              <span className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> สำเร็จ {okCount}
              </span>
              <span className="text-sm text-red-600 flex items-center gap-1">
                <XCircle className="w-4 h-4" /> ล้มเหลว {failCount}
              </span>
            </div>
            <div className="max-h-60 overflow-y-auto text-sm">
              {results.map((r, i) => (
                <div
                  key={i}
                  className={`p-2 border-b flex gap-2 items-center ${
                    r.ok ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {r.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  <span className="text-xs">แถว {r.row}</span>
                  <span>{r.ok ? `✓ ${r.member}` : r.error}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
