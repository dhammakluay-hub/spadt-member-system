import { getSupabase } from "./supabase";
import type { MemberStatus } from "./constants";

export interface EducationEntry {
  level?: string;
  field?: string;
  institution?: string;
  year?: string;
  gpa?: string;
}

export interface AssistiveDeviceEntry {
  code: string;
  custom?: string; // used when code === "other"
}

export interface AchievementEntry {
  year?: string;
  event?: string; // ชื่อรายการแข่งขัน
  level?: string; // ระดับ
  result?: string; // อันดับ / เหรียญ
  description?: string;
  image_urls?: string[]; // up to 5
}

/** ไฟล์แนบ 1 รายการ */
export interface DocumentEntry {
  type: string; // from DOCUMENT_TYPES.code
  url: string;
  filename?: string;
  uploaded_at?: string;
  note?: string;
}

/** ใบประกาศนียบัตร / License ของผู้ฝึกสอน 1 รายการ */
export interface CoachLicenseEntry {
  level?: string;        // เช่น "Level 1", "C-License", "AFC C", "BWF Coach Level 1"
  sport_code?: string;   // กีฬาที่ใช้ License (จาก SPORTS code) — เว้นว่าง = ใช้ได้หลายกีฬา
  issuer?: string;       // ผู้ออก เช่น "BWF", "AFC", "สมาคมกีฬาคนพิการ", "IPC"
  issued_date?: string;  // วันที่ออก
  expiry_date?: string;  // วันหมดอายุ (เว้นว่าง = ไม่มีวันหมดอายุ)
  certificate_no?: string;
  certificate_url?: string; // PDF/รูปใบประกาศ
  notes?: string;
}

export interface Member {
  id: string;
  member_code?: string | null;
  // Personal
  title?: string | null;
  first_name: string;
  last_name: string;
  first_name_en?: string | null;
  last_name_en?: string | null;
  nickname?: string | null;
  national_id?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
  // Address
  address?: string | null;
  province?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  region?: string | null;
  postal_code?: string | null;
  // Passport
  passport_no?: string | null;
  passport_issue_date?: string | null;
  passport_expiry_date?: string | null;
  passport_country?: string | null;
  passport_file_url?: string | null;
  // Education — kept as JSONB array for multiple entries
  educations?: EducationEntry[] | null;
  // Legacy flat fields (keep for backward compat)
  education_level?: string | null;
  education_field?: string | null;
  education_institution?: string | null;
  education_year?: string | null;
  education_gpa?: string | null;
  // Work
  work_status?: string | null;
  work_position?: string | null;
  work_organization?: string | null;
  work_organization_type?: string | null;
  disability_employment_article?: string | null;
  work_start_year?: string | null;
  // Coach licensing (สำหรับ personnel_type = coach/assistant_coach/manager)
  coach_licenses?: CoachLicenseEntry[] | null;
  nsdf_eligible?: boolean | null;
  monthly_compensation?: number | null;
  compensation_source?: string | null;
  compensation_notes?: string | null;
  compensation_start_date?: string | null;
  // Disability & Sport
  disability_type?: string | null;
  sport_code?: string | null;
  classification_code?: string | null;
  // Step 2 extras
  personnel_type?: string | null;
  competition_level?: string | null;
  classification_status?: string | null;
  classification_date?: string | null;
  classifier_name?: string | null;
  classification_place?: string | null;
  team_province?: string | null;
  assistive_devices?: AssistiveDeviceEntry[] | null;
  achievements?: AchievementEntry[] | null;
  // Files
  photo_url?: string | null;
  documents?: DocumentEntry[] | null;
  // Consent (PDPA & SPADT terms)
  consent_pdpa?: boolean | null;
  consent_terms?: boolean | null;
  consent_images?: boolean | null;
  signed_at?: string | null;
  additional_notes?: string | null;
  status: MemberStatus;
  created_at: string;
  updated_at?: string | null;
}

export const MemberAPI = {
  async list(filters?: {
    status?: MemberStatus;
    sport?: string;
    province?: string;
    search?: string;
  }): Promise<Member[]> {
    const supabase = getSupabase();
    let q = supabase.from("members").select("*").order("created_at", { ascending: false });

    if (filters?.status) q = q.eq("status", filters.status);
    if (filters?.sport) q = q.eq("sport_code", filters.sport);
    if (filters?.province) q = q.eq("province", filters.province);
    if (filters?.search) {
      const s = filters.search;
      q = q.or(`first_name.ilike.%${s}%,last_name.ilike.%${s}%,national_id.ilike.%${s}%`);
    }

    const { data, error } = await q;
    if (error) throw error;
    return data as Member[];
  },

  async get(id: string): Promise<Member | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase.from("members").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data as Member | null;
  },

  async create(payload: Partial<Member>): Promise<Member> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("members")
      .insert({ ...payload, status: payload.status ?? "pending" })
      .select()
      .single();
    if (error) throw error;
    return data as Member;
  },

  async update(id: string, patch: Partial<Member>): Promise<Member> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("members")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Member;
  },

  async setStatus(id: string, status: MemberStatus): Promise<Member> {
    return this.update(id, { status });
  },

  /**
   * Check if a national_id is already registered.
   * Uses an RPC `check_national_id_exists` (security definer) so anonymous
   * users registering for the first time can also detect duplicates without
   * RLS blocking the read of `members`.
   */
  async checkNationalIdExists(nationalId: string): Promise<boolean> {
    if (!nationalId || nationalId.length !== 13) return false;
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc("check_national_id_exists", {
      p_national_id: nationalId,
    });
    if (error) throw error;
    return data === true;
  },

  async remove(id: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) throw error;
  },

  async bulkSetStatus(ids: string[], status: MemberStatus): Promise<void> {
    if (ids.length === 0) return;
    const supabase = getSupabase();
    const { error } = await supabase
      .from("members")
      .update({ status, updated_at: new Date().toISOString() })
      .in("id", ids);
    if (error) throw error;
  },

  async stats(): Promise<Record<MemberStatus | "total", number>> {
    const members = await this.list();
    const stats = {
      total: members.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      expired: 0,
    } as Record<MemberStatus | "total", number>;
    for (const m of members) stats[m.status] = (stats[m.status] ?? 0) + 1;
    return stats;
  },
};

// ============================================================
// Admin / Audit APIs
// ============================================================

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string | null;
  action: "INSERT" | "UPDATE" | "DELETE" | "APPROVE" | "REJECT";
  actor_id: string | null;
  actor_email: string | null;
  changes: Record<string, unknown> | null;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: "admin" | "staff" | "member" | null;
  display_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}

export interface OrgInfo {
  name: string;
  short_name: string;
  tagline: string;
  email: string;
  phone: string;
  website: string;
  address: string;
}

export interface SystemConfig {
  allow_public_register: boolean;
  require_admin_approval: boolean;
  member_code_prefix: string;
  card_validity_years: number;
}

export const SettingsAPI = {
  async get<T = unknown>(key: string): Promise<T | null> {
    const sb = getSupabase();
    const { data, error } = await sb.from("org_settings").select("value").eq("key", key).maybeSingle();
    if (error) throw error;
    return (data?.value as T) ?? null;
  },

  async set(key: string, value: unknown): Promise<void> {
    const sb = getSupabase();
    const { error } = await sb
      .from("org_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) throw error;
  },
};

// ============================================================
// Support tickets + Email notifications
// ============================================================

export interface Ticket {
  id: string;
  ticket_no: number;
  subject: string;
  description: string;
  category: "general" | "bug" | "feature" | "data" | "account" | "other";
  priority: "low" | "normal" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  reporter_id?: string | null;
  reporter_email?: string | null;
  assignee_id?: string | null;
  related_member_id?: string | null;
  attachments?: { name: string; url: string }[];
  created_at: string;
  updated_at?: string;
  resolved_at?: string | null;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  author_id?: string | null;
  author_email?: string | null;
  body: string;
  internal_note?: boolean;
  created_at: string;
}

export interface EmailNotification {
  id: string;
  to_email: string;
  to_name?: string | null;
  subject: string;
  body: string;
  status: "pending" | "sent" | "failed";
  member_id?: string | null;
  trigger?: string | null;
  error?: string | null;
  created_at: string;
  sent_at?: string | null;
}

export const TicketAPI = {
  async list(opts?: { status?: string; mine?: boolean }): Promise<Ticket[]> {
    const sb = getSupabase();
    let q = sb.from("tickets").select("*").order("created_at", { ascending: false });
    if (opts?.status) q = q.eq("status", opts.status);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as Ticket[];
  },

  async get(id: string): Promise<Ticket | null> {
    const sb = getSupabase();
    const { data, error } = await sb.from("tickets").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data as Ticket | null;
  },

  async create(t: Partial<Ticket>): Promise<Ticket> {
    const sb = getSupabase();
    const { data: { user } } = await sb.auth.getUser();
    const { data, error } = await sb.from("tickets").insert({
      ...t,
      reporter_id: user?.id,
      reporter_email: user?.email,
    }).select().single();
    if (error) throw error;
    return data as Ticket;
  },

  async update(id: string, patch: Partial<Ticket>): Promise<Ticket> {
    const sb = getSupabase();
    const { data, error } = await sb.from("tickets").update({
      ...patch,
      updated_at: new Date().toISOString(),
      ...(patch.status === "resolved" || patch.status === "closed" ? { resolved_at: new Date().toISOString() } : {}),
    }).eq("id", id).select().single();
    if (error) throw error;
    return data as Ticket;
  },

  async listComments(ticketId: string): Promise<TicketComment[]> {
    const sb = getSupabase();
    const { data, error } = await sb.from("ticket_comments").select("*").eq("ticket_id", ticketId).order("created_at");
    if (error) throw error;
    return (data ?? []) as TicketComment[];
  },

  async addComment(ticketId: string, body: string, internalNote = false): Promise<TicketComment> {
    const sb = getSupabase();
    const { data: { user } } = await sb.auth.getUser();
    const { data, error } = await sb.from("ticket_comments").insert({
      ticket_id: ticketId,
      author_id: user?.id,
      author_email: user?.email,
      body,
      internal_note: internalNote,
    }).select().single();
    if (error) throw error;
    return data as TicketComment;
  },
};

export const NotificationAPI = {
  async listEmails(opts?: { status?: string; limit?: number }): Promise<EmailNotification[]> {
    const sb = getSupabase();
    let q = sb.from("email_notifications").select("*").order("created_at", { ascending: false }).limit(opts?.limit ?? 100);
    if (opts?.status) q = q.eq("status", opts.status);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as EmailNotification[];
  },

  async markSent(id: string): Promise<void> {
    const sb = getSupabase();
    const { error } = await sb.from("email_notifications").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
  },
};

export const AdminAPI = {
  async listUsers(): Promise<AdminUser[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc("admin_list_users");
    if (error) throw error;
    return (data ?? []) as AdminUser[];
  },

  async updateRole(userId: string, role: "admin" | "staff" | "member"): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase.rpc("admin_update_role", {
      p_user_id: userId,
      p_role: role,
    });
    if (error) throw error;
  },

  async listAuditLogs(opts?: {
    recordId?: string;
    actorId?: string;
    action?: string;
    limit?: number;
  }): Promise<AuditLog[]> {
    const supabase = getSupabase();
    let q = supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(opts?.limit ?? 100);
    if (opts?.recordId) q = q.eq("record_id", opts.recordId);
    if (opts?.actorId) q = q.eq("actor_id", opts.actorId);
    if (opts?.action) q = q.eq("action", opts.action);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as AuditLog[];
  },
};

/**
 * Sanitize filename for Supabase Storage keys.
 * Storage keys must be ASCII-safe (alphanumeric, hyphen, underscore, dot, slash).
 * Thai characters, spaces, and other non-ASCII chars are stripped/replaced.
 */
function sanitizeStorageKey(key: string): string {
  return key
    .normalize("NFKD") // split accented chars
    .replace(/[^\x20-\x7E/]/g, "") // remove non-ASCII (including Thai)
    .replace(/\s+/g, "-") // spaces → hyphen
    .replace(/[^\w./-]/g, "") // keep only word chars, dot, slash, hyphen
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export const StorageAPI = {
  async uploadPhoto(file: File, path: string): Promise<string> {
    const supabase = getSupabase();
    // Split path into dir + filename so we can sanitize the filename part and
    // always append a safe extension.
    const lastSlash = path.lastIndexOf("/");
    const dir = lastSlash >= 0 ? path.slice(0, lastSlash + 1) : "";
    const rawName = lastSlash >= 0 ? path.slice(lastSlash + 1) : path;
    const extMatch = rawName.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : "";
    const baseSanitized = sanitizeStorageKey(rawName.replace(/\.[^.]+$/, "")) || "file";
    // Always prefix with timestamp to guarantee uniqueness even after sanitize.
    const safeName = `${Date.now()}-${baseSanitized}${ext}`;
    const safePath = `${dir}${safeName}`;

    const { error } = await supabase.storage
      .from("member-photos")
      .upload(safePath, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("member-photos").getPublicUrl(safePath);
    return data.publicUrl;
  },
};

export const ExportAPI = {
  async membersToExcel(members: Member[]): Promise<void> {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(members);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Members");
    XLSX.writeFile(wb, `spadt-members-${new Date().toISOString().slice(0, 10)}.xlsx`);
  },
};
