// ============================================================================
// Digital IO — Edge Function: dio-notify   (v1)
// ----------------------------------------------------------------------------
// Afsar ko teen mauqon par khud-ba-khud email:
//   1) registered    — رجسٹریشن موصول، ایڈمن کی منظوری کا انتظار
//   2) approved      — اکاؤنٹ منظور؛ آزمائشی/سبسکرپشن مدت: از … تا …
//   3) subscription  — سبسکرپشن فعال (ایڈمن نے ادائیگی کی تصدیق کی)؛ از … تا …
//
// Kaun bulata hai: DATABASE TRIGGER (sql/100c + 100d) — pg_net ke zariye,
// transaction COMMIT hone ke baad. Is liye "approved" par trial ka record
// (dio_trial_on_approval) pehle hi ban chuka hota hai aur tareekhen sahi aati hain.
//
// HIFAZAT — body par bharosa NAHI:
//   • Body se sirf {kind, officer_id, ref} liye jaate hain. Har baat DB se
//     dobara parkhi jati hai (afsar mojood? manzoor? subscription usi ka aur
//     fa'al?). Koi bahar se bulaye bhi to sirf wahi email ja sakti hai jo
//     waise bhi jani thi — aur sirf USI afsar ke apne pate par.
//   • Aik waqia = aik email: `dio_email_log` me (kind, ref) UNIQUE hai.
//     Nakaam email ('failed') dobara bhejne ki koshish ho sakti hai.
//
// Email: Gmail SMTP, port 465 (Supabase Edge me 25 aur 587 band hain).
// Secrets (Dashboard → Edge Functions → Secrets):
//     DIO_SMTP_USER   = Gmail pata (wahi jo Auth SMTP me hai)
//     DIO_SMTP_PASS   = Gmail App Password (16 huroof, bina khali jagah)
//   ikhtiyari:
//     DIO_APP_URL     = https://digital-io-portal.vercel.app   (default yahi)
//     DIO_SMTP_HOST   = smtp.gmail.com   (default)
//     DIO_SMTP_PORT   = 465              (default)
// SUPABASE_URL aur SUPABASE_SERVICE_ROLE_KEY Supabase khud deta hai.
// ============================================================================
import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.16";

export type Kind = "registered" | "approved" | "subscription";
const KINDS: Kind[] = ["registered", "approved", "subscription"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REG_WINDOW_MS = 24 * 60 * 60 * 1000; // purane afsaran ko "registered" email nahi

// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;

export interface Deps {
  getOfficer(id: string): Promise<Row | null>;
  getUserEmail(userId: string): Promise<string | null>;
  getSubscription(id: string): Promise<Row | null>;
  getLatestSubscription(officerId: string): Promise<Row | null>;
  /** true = is waqiye ki email ab hum bhejenge; false = pehle ja chuki / ja rahi hai */
  claim(kind: Kind, ref: string, officerId: string, to: string): Promise<boolean>;
  finish(kind: Kind, ref: string, ok: boolean, error?: string): Promise<void>;
  sendMail(msg: { to: string; subject: string; html: string; text: string }): Promise<void>;
  now(): Date;
  appUrl: string;
}

// ── tareekh: DD/MM/YYYY, Pakistan ke waqt ke mutabiq (system ka qaida) ──
export function fmtDate(v: unknown): string {
  if (!v) return "—";
  const d = new Date(String(v));
  if (isNaN(d.getTime())) return "—";
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Karachi", day: "2-digit", month: "2-digit", year: "numeric",
  }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${g("day")}/${g("month")}/${g("year")}`;
}

function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function daysLeft(exp: unknown, now: Date): number | null {
  if (!exp) return null;
  const t = new Date(String(exp)).getTime();
  if (isNaN(t)) return null;
  return Math.max(0, Math.ceil((t - now.getTime()) / 86400000));
}

function planLabel(sub: Row | null): string {
  if (!sub) return "—";
  if (sub.status === "trial") return "آزمائشی مدت (Trial)";
  const name = sub.subscription_plans && sub.subscription_plans.name;
  return name ? `سبسکرپشن — ${name}` : "سبسکرپشن";
}

// ── email ka dhancha: Urdu RTL, angrezi alfaz LTR ──
function layout(title: string, bodyHtml: string, appUrl: string): string {
  return `<!doctype html>
<html lang="ur" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#f4f6f9;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',Tahoma,Arial,sans-serif;">
<tr><td style="background:#13294b;border-bottom:4px solid #c9a227;padding:22px 24px;text-align:center;">
  <div dir="ltr" style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;color:#ffffff;">Digital IO</div>
  <div style="font-size:16px;color:#c9a227;margin-top:6px;">تفتیشی افسر کا چھوٹو</div>
</td></tr>
<tr><td dir="rtl" style="padding:26px 24px;text-align:right;color:#0f1b2a;font-size:16px;line-height:2;">
  <div style="font-size:20px;font-weight:700;margin-bottom:12px;">${esc(title)}</div>
  ${bodyHtml}
  <div style="text-align:center;margin:26px 0 6px;">
    <a href="${esc(appUrl)}" style="display:inline-block;background:#13294b;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:16px;">ایپ کھولیں</a>
  </div>
  <div dir="ltr" style="text-align:center;font-size:13px;color:#64748b;">${esc(appUrl)}</div>
</td></tr>
<tr><td dir="rtl" style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:14px 24px;text-align:right;font-size:13px;color:#64748b;line-height:1.9;">
  یہ خودکار ای میل ہے، اس کا جواب نہ دیں۔ <span dir="ltr">"Digital IO"</span> ایک نجی اور غیر سرکاری مددگار سافٹ ویئر ہے۔
</td></tr>
</table></td></tr></table></body></html>`;
}

function detailsTable(rows: [string, string, boolean?][]): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" dir="rtl" style="width:100%;border:1px solid #e2e8f0;border-radius:8px;margin:14px 0;border-collapse:separate;">
${rows.map(([k, v, ltr]) => `<tr>
  <td style="padding:8px 12px;background:#f8fafc;color:#475569;width:38%;border-bottom:1px solid #e2e8f0;">${esc(k)}</td>
  <td style="padding:8px 12px;font-weight:700;border-bottom:1px solid #e2e8f0;"${ltr ? ' dir="ltr" align="right"' : ""}>${esc(v)}</td>
</tr>`).join("")}
</table>`;
}

export function compose(kind: Kind, o: Row, to: string, sub: Row | null, now: Date, appUrl: string) {
  const name = o.full_name || "افسر";
  const greet = `<p style="margin:0 0 10px;">محترم <b>${esc(name)}</b>،</p>`;
  if (kind === "registered") {
    const subject = "Digital IO — رجسٹریشن موصول ہو گئی";
    const body = `${greet}
<p style="margin:0 0 10px;"><span dir="ltr">Digital IO</span> میں آپ کی رجسٹریشن کامیابی سے موصول ہو گئی ہے۔</p>
<p style="margin:0 0 10px;">آپ کا اکاؤنٹ اس وقت <b>ایڈمن کی منظوری کے انتظار</b> میں ہے۔ منظوری ملتے ہی آپ کو الگ ای میل کے ذریعے اطلاع دی جائے گی، جس کے بعد آپ لاگ اِن کر کے کام شروع کر سکیں گے۔</p>
${detailsTable([
      ["نام", name],
      ["ای میل", to, true],
      ...(o.station ? [["تھانہ", String(o.station)] as [string, string]] : []),
      ["تاریخِ رجسٹریشن", fmtDate(o.created_at || now)],
    ])}`;
    const text = `محترم ${name}،\nDigital IO میں آپ کی رجسٹریشن کامیابی سے موصول ہو گئی ہے۔ آپ کا اکاؤنٹ ایڈمن کی منظوری کے انتظار میں ہے۔ منظوری پر آپ کو الگ ای میل ملے گی۔\nای میل: ${to}\nتاریخِ رجسٹریشن: ${fmtDate(o.created_at || now)}\n${appUrl}`;
    return { subject, html: layout("رجسٹریشن موصول ہو گئی", body, appUrl), text };
  }

  const from = fmtDate(sub && sub.started_at);
  const till = fmtDate(sub && sub.expires_at);
  const left = daysLeft(sub && sub.expires_at, now);
  const period: [string, string, boolean?][] = sub
    ? [["پیکج", planLabel(sub)], ["مدت کا آغاز", from, true], ["مدت کا اختتام", till, true],
       ...(left !== null ? [["باقی دن", String(left), true] as [string, string, boolean]] : [])]
    : [["پیکج", "تفصیل ایپ میں «سبسکرپشن» صفحے پر دیکھیں"]];

  if (kind === "approved") {
    const subject = "Digital IO — آپ کا اکاؤنٹ منظور ہو گیا";
    const line = sub
      ? `آپ <b>${from}</b> سے <b>${till}</b> تک سسٹم میں کام کر سکتے ہیں۔`
      : "آپ اب لاگ اِن کر کے کام شروع کر سکتے ہیں۔";
    const body = `${greet}
<p style="margin:0 0 10px;">ایڈمن نے آپ کا <span dir="ltr">Digital IO</span> اکاؤنٹ <b>منظور</b> کر دیا ہے۔ ${line}</p>
${detailsTable([["ای میل (لاگ اِن)", to, true], ...period])}
<p style="margin:0;">مدت ختم ہونے کے بعد بھی آپ اپنا محفوظ ریکارڈ دیکھ اور پرنٹ کر سکیں گے؛ نیا اندراج اور ترمیم کے لیے سبسکرپشن کی تجدید درکار ہوگی۔</p>`;
    const text = `محترم ${name}،\nایڈمن نے آپ کا Digital IO اکاؤنٹ منظور کر دیا ہے۔\n${sub ? `پیکج: ${planLabel(sub)}\nمدت: ${from} تا ${till}` : ""}\nلاگ اِن: ${to}\n${appUrl}`;
    return { subject, html: layout("اکاؤنٹ منظور ہو گیا", body, appUrl), text };
  }

  // subscription
  const subject = "Digital IO — سبسکرپشن فعال ہو گئی";
  const body = `${greet}
<p style="margin:0 0 10px;">آپ کی ادائیگی کی تصدیق ہو گئی ہے اور آپ کی <span dir="ltr">Digital IO</span> سبسکرپشن <b>فعال</b> کر دی گئی ہے۔ آپ <b>${from}</b> سے <b>${till}</b> تک سسٹم میں کام کر سکتے ہیں۔</p>
${detailsTable(period)}`;
  const text = `محترم ${name}،\nآپ کی Digital IO سبسکرپشن فعال ہو گئی ہے۔\nپیکج: ${planLabel(sub)}\nمدت: ${from} تا ${till}\n${appUrl}`;
  return { subject, html: layout("سبسکرپشن فعال ہو گئی", body, appUrl), text };
}

export type Result = { status: number; body: Row };

export async function handleNotify(input: Row, d: Deps): Promise<Result> {
  const kind = input && input.kind;
  const oid = input && input.officer_id;
  const ref = (input && input.ref) || oid;
  if (!KINDS.includes(kind)) return { status: 400, body: { ok: false, reason: "bad_kind" } };
  if (!UUID.test(String(oid)) || !UUID.test(String(ref))) {
    return { status: 400, body: { ok: false, reason: "bad_id" } };
  }

  const o = await d.getOfficer(oid);
  if (!o) return { status: 200, body: { ok: false, skipped: "no_officer" } };
  if (o.suspended === true || o.is_suspended === true) {
    return { status: 200, body: { ok: false, skipped: "suspended" } };
  }

  let sub: Row | null = null;
  if (kind === "registered") {
    if (o.is_approved === true) return { status: 200, body: { ok: false, skipped: "already_approved" } };
    if (o.created_at && d.now().getTime() - new Date(o.created_at).getTime() > REG_WINDOW_MS) {
      return { status: 200, body: { ok: false, skipped: "registration_too_old" } };
    }
    if (ref !== oid) return { status: 400, body: { ok: false, reason: "bad_ref" } };
  } else if (kind === "approved") {
    if (o.is_approved !== true) return { status: 200, body: { ok: false, skipped: "not_approved" } };
    if (ref !== oid) return { status: 400, body: { ok: false, reason: "bad_ref" } };
    sub = await d.getLatestSubscription(oid);
  } else {
    sub = await d.getSubscription(ref);
    if (!sub || sub.officer_id !== oid) return { status: 200, body: { ok: false, skipped: "no_subscription" } };
    if (sub.status !== "active") return { status: 200, body: { ok: false, skipped: "not_active" } };
  }

  const to = String(o.email || (o.user_id ? await d.getUserEmail(o.user_id) : "") || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return { status: 200, body: { ok: false, skipped: "no_email" } };

  if (!(await d.claim(kind, ref, oid, to))) {
    return { status: 200, body: { ok: true, skipped: "already_sent" } };
  }
  const msg = compose(kind, o, to, sub, d.now(), d.appUrl);
  try {
    await d.sendMail({ to, ...msg });
    await d.finish(kind, ref, true);
    return { status: 200, body: { ok: true, sent: kind } };
  } catch (e) {
    const err = String((e && (e as Error).message) || e).slice(0, 500);
    await d.finish(kind, ref, false, err);
    return { status: 502, body: { ok: false, reason: "send_failed", error: err } };
  }
}

// ── asal (Supabase) dependencies ──
function realDeps(): Deps {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const user = Deno.env.get("DIO_SMTP_USER");
  const pass = (Deno.env.get("DIO_SMTP_PASS") || "").replace(/\s+/g, "");
  if (!url || !key) throw new Error("server_misconfigured: SUPABASE_URL / SERVICE_ROLE_KEY");
  if (!user || !pass) throw new Error("server_misconfigured: DIO_SMTP_USER / DIO_SMTP_PASS");
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const port = Number(Deno.env.get("DIO_SMTP_PORT") || 465);
  const tx = nodemailer.createTransport({
    host: Deno.env.get("DIO_SMTP_HOST") || "smtp.gmail.com",
    port, secure: port === 465, auth: { user, pass },
  });
  return {
    appUrl: Deno.env.get("DIO_APP_URL") || "https://digital-io-portal.vercel.app",
    now: () => new Date(),
    async getOfficer(id) {
      const { data, error } = await sb.from("officers").select("*").eq("id", id).limit(1);
      if (error) throw new Error("officer_lookup_failed: " + error.message);
      return (data && data[0]) || null;
    },
    async getUserEmail(uid) {
      const { data, error } = await sb.auth.admin.getUserById(uid);
      if (error) return null;
      return (data && data.user && data.user.email) || null;
    },
    async getSubscription(id) {
      const { data, error } = await sb.from("subscriptions").select("*, subscription_plans(*)").eq("id", id).limit(1);
      if (error) throw new Error("sub_lookup_failed: " + error.message);
      return (data && data[0]) || null;
    },
    async getLatestSubscription(oid) {
      const { data, error } = await sb.from("subscriptions").select("*, subscription_plans(*)")
        .eq("officer_id", oid).order("created_at", { ascending: false }).limit(1);
      if (error) throw new Error("sub_lookup_failed: " + error.message);
      return (data && data[0]) || null;
    },
    async claim(kind, ref, oid, to) {
      const ins = await sb.from("dio_email_log")
        .insert({ kind, ref, officer_id: oid, to_email: to, status: "sending" });
      if (!ins.error) return true;
      if (ins.error.code !== "23505") throw new Error("log_failed: " + ins.error.message);
      // pehle se mojood: sirf 'failed' ko dobara uthao (aik hi bar — status shart ke sath)
      const upd = await sb.from("dio_email_log")
        .update({ status: "sending", error: null, to_email: to, updated_at: new Date().toISOString() })
        .eq("kind", kind).eq("ref", ref).eq("status", "failed").select("id");
      return !upd.error && !!(upd.data && upd.data.length);
    },
    async finish(kind, ref, ok, error) {
      await sb.from("dio_email_log")
        .update({ status: ok ? "sent" : "failed", error: ok ? null : (error || "unknown"), updated_at: new Date().toISOString() })
        .eq("kind", kind).eq("ref", ref);
    },
    async sendMail(m) {
      await tx.sendMail({ from: { name: "Digital IO", address: user }, to: m.to, subject: m.subject, html: m.html, text: m.text });
    },
  };
}

const JSONH = { "Content-Type": "application/json" };

if (!Deno.env.get("DIO_NOTIFY_TEST")) {
  Deno.serve(async (req) => {
    if (req.method !== "POST") return new Response(JSON.stringify({ ok: false, reason: "post_only" }), { status: 405, headers: JSONH });
    let input: Row = {};
    try { input = await req.json(); } catch (_) {
      return new Response(JSON.stringify({ ok: false, reason: "bad_json" }), { status: 400, headers: JSONH });
    }
    try {
      const r = await handleNotify(input, realDeps());
      console.log("[dio-notify]", input.kind, input.officer_id, JSON.stringify(r.body));
      return new Response(JSON.stringify(r.body), { status: r.status, headers: JSONH });
    } catch (e) {
      const msg = String((e && (e as Error).message) || e);
      console.error("[dio-notify] error", msg);
      return new Response(JSON.stringify({ ok: false, reason: msg }), { status: 500, headers: JSONH });
    }
  });
}
