import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * POST /api/send-email
 * Body: { id: string }   send one queued notification
 * Body: { sendAll: true } send every pending notification in the queue
 *
 * Auth: caller must be admin or staff (verified via Supabase session cookie).
 * Sender:  uses Brevo HTTP API (api.brevo.com/v3/smtp/email) with the
 *          server-side BREVO_API_KEY env var.
 *
 * Required env vars (Vercel → Project → Settings → Environment Variables):
 *   BREVO_API_KEY        e.g. xkeysib-aaaa...
 *   BREVO_SENDER_EMAIL   e.g. mkongruang@gmail.com
 *   BREVO_SENDER_NAME    e.g. SPADT Thailand
 */

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

type EmailRow = {
  id: string;
  to_email: string;
  to_name: string | null;
  subject: string;
  body: string;
  status: string;
};

function plainTextToHtml(text: string): string {
  // Brevo accepts both textContent and htmlContent. Keep the original plain
  // text as textContent for clients that prefer that, AND build a basic HTML
  // version so the email looks nicer in Gmail/Outlook.
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<div style="font-family: 'Sarabun', 'Helvetica', Arial, sans-serif; font-size: 15px; line-height: 1.7; color: #1a1a1a; max-width: 600px;">
    <div style="border-top: 4px solid #d4af37; padding-top: 20px;">
      ${escaped.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}
    </div>
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    <p style="font-size: 12px; color: #888;">
      สมาคมกีฬาคนพิการแห่งประเทศไทย (SPADT)<br>
      Sports Association for People with Disabilities of Thailand
    </p>
  </div>`;
}

async function sendOne(row: EmailRow): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL ?? "noreply@spadt.or.th";
  const senderName = process.env.BREVO_SENDER_NAME ?? "SPADT Thailand";

  if (!apiKey) {
    return { ok: false, error: "BREVO_API_KEY env var is not set on Vercel" };
  }

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: row.to_email, name: row.to_name ?? row.to_email }],
    subject: row.subject,
    textContent: row.body,
    htmlContent: plainTextToHtml(row.body),
  };

  try {
    const res = await fetch(BREVO_ENDPOINT, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Brevo ${res.status}: ${text}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function POST(request: NextRequest) {
  // ===== auth =====
  const response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = (profile as { role?: string } | null)?.role;
  if (role !== "admin" && role !== "staff") {
    return NextResponse.json({ error: "forbidden — admin or staff only" }, { status: 403 });
  }

  // ===== body =====
  const body = await request.json().catch(() => ({} as { id?: string; sendAll?: boolean }));
  const ids: string[] = [];

  if (body.sendAll) {
    const { data, error } = await supabase
      .from("email_notifications")
      .select("id")
      .eq("status", "pending");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    ids.push(...(data ?? []).map((r) => (r as { id: string }).id));
  } else if (typeof body.id === "string") {
    ids.push(body.id);
  } else {
    return NextResponse.json({ error: "missing `id` or `sendAll`" }, { status: 400 });
  }

  if (ids.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0, results: [] });
  }

  // ===== fetch + send =====
  const { data: rows, error: readErr } = await supabase
    .from("email_notifications")
    .select("id, to_email, to_name, subject, body, status")
    .in("id", ids);
  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });

  let sent = 0;
  let failed = 0;
  const results: Array<{ id: string; ok: boolean; error?: string }> = [];

  for (const row of (rows ?? []) as EmailRow[]) {
    const result = await sendOne(row);
    if (result.ok) {
      sent++;
      await supabase
        .from("email_notifications")
        .update({ status: "sent", sent_at: new Date().toISOString(), error: null })
        .eq("id", row.id);
    } else {
      failed++;
      await supabase
        .from("email_notifications")
        .update({ status: "failed", error: result.error })
        .eq("id", row.id);
    }
    results.push({ id: row.id, ok: result.ok, error: result.error });
  }

  return NextResponse.json({ sent, failed, results });
}
