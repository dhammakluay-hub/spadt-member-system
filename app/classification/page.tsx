"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import { CLASSIFICATION_SAMPLE } from "@/lib/constants";
import { Search } from "lucide-react";

export default function ClassificationPage() {
  const [q, setQ] = useState("");
  const filtered = CLASSIFICATION_SAMPLE.filter(
    (c) =>
      !q ||
      c.code.toLowerCase().includes(q.toLowerCase()) ||
      c.description.toLowerCase().includes(q.toLowerCase()) ||
      c.sport.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <AppShell title="Classification Reference">
      <div className="spadt-card">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="font-bold text-[var(--spadt-navy)]">IPC / IF Classification Codes</h2>
            <p className="text-sm text-gray-500">
              แสดง {filtered.length} จาก {CLASSIFICATION_SAMPLE.length} codes (ตัวอย่าง — 167 codes เต็มใน Supabase)
            </p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="pl-9 pr-3 py-2 rounded-lg border border-gray-300 w-64"
              placeholder="ค้นหา code / sport"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left bg-[var(--spadt-navy)] text-white">
                <th className="p-3 w-24">Code</th>
                <th className="p-3 w-40">Sport</th>
                <th className="p-3">Description</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.code} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono font-bold text-[var(--spadt-gold-dark)]">
                    {c.code}
                  </td>
                  <td className="p-3">{c.sport}</td>
                  <td className="p-3 text-gray-700">{c.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
