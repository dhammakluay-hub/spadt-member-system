"use client";

import { QRCodeCanvas } from "qrcode.react";
import type { Member } from "@/lib/api";
import { SPORTS } from "@/lib/constants";

export default function MemberCard({ member }: { member: Member }) {
  const sport = SPORTS.find((s) => s.code === member.sport_code);
  const memberCode = member.member_code ?? member.id.slice(0, 8).toUpperCase();
  // Encode richer data in QR for verification (URL format)
  const qrPayload = `https://spadt.or.th/verify?code=${encodeURIComponent(memberCode)}&id=${member.id.slice(0, 8)}`;

  return (
    <div
      className="relative w-[340px] h-[215px] rounded-xl overflow-hidden shadow-xl text-white"
      style={{
        background: "linear-gradient(135deg, #0a1e3f 0%, #1a3366 100%)",
      }}
    >
      {/* Gold accent bar */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-[var(--spadt-gold)]" />

      <div className="p-4 h-full flex gap-3">
        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-widest text-[var(--spadt-gold)] font-semibold">
            SPADT Thailand — Member Card
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold leading-tight">
              {member.first_name} {member.last_name}
            </div>
            {member.nickname && (
              <div className="text-xs text-white/70">({member.nickname})</div>
            )}
          </div>

          <div className="mt-3 space-y-1 text-xs">
            <div className="flex gap-2">
              <span className="text-white/60">Code:</span>
              <span className="font-mono">{memberCode}</span>
            </div>
            {sport && (
              <div className="flex gap-2">
                <span className="text-white/60">Sport:</span>
                <span>{sport.name_th}</span>
              </div>
            )}
            {member.classification_code && (
              <div className="flex gap-2">
                <span className="text-white/60">Class:</span>
                <span className="font-semibold text-[var(--spadt-gold)]">
                  {member.classification_code}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center justify-between">
          <div className="bg-white p-1.5 rounded">
            <QRCodeCanvas value={qrPayload} size={72} level="M" />
          </div>
          <div className="text-[9px] text-white/50 mt-2">spadt.or.th</div>
        </div>
      </div>
    </div>
  );
}
