// ============================================================================
// Digital IO — Edge Function: dio-license   (v2 — TASHKHEESI / diagnosable)
// ----------------------------------------------------------------------------
// Maqsad: login par server subscription check kar ke ek MUKHTASIR-MUDDAT, DASTKHAT-
// SHUDA license token deta hai. Client ye token mehfooz rakhta hai aur OFFLINE
// sirf isi ki miyaad tak likhne ki ijazat deta hai — koi khud-ba-khud 30-din
// trial nahi. Token ECDSA (P-256) se sign hota hai: server ke paas PRIVATE key,
// client ke paas sirf PUBLIC key (jaali nahi bana sakta).
//
// v2 me kya badla (maidan se mili khrabi):
//   • PEHLE: officers ki query ka `error` POORI TARAH NAZARANDAZ hota tha. Agar
//     column na milta, duplicate row hoti, ya key ghalat hoti — har soorat me
//     `data` null aata aur jawab wahi "no_officer" (403) hota. Yaani 4 alag
//     khrabiyan aik hi paighaam ke peechay chhup jati thin. Ab har wajah ka
//     apna code hai: officer_lookup_failed / no_officer / sub_lookup_failed.
//   • Duplicate officers rows (aik hi user_id par do record) pehle `maybeSingle()`
//     ko error deti thin → "no_officer". Ab saaf-suthri (ghair-mo'attal,
//     manzoor-shuda) row chuni jati hai aur log me tanbeeh likhi jati hai.
//   • Secrets ghaib hon to "internal" (500) ki jagah saaf naam ke sath
//     server_misconfigured aata hai — deploy ki ghalti foran pakdi jaye.
//   • subscriptions ki query ka error bhi khamoshi se "not_entitled" ban jata
//     tha; ab alag se report hota hai.
// Tafseel (stack trace waghera) sirf server log me jati hai — bahar nahi.
//
// Deploy:  supabase functions deploy dio-license --no-verify-jwt
//   (JWT hum khud check karte hain neeche.)
// Secrets: supabase secrets set DIO_LICENSE_PRIV_JWK='<private key JWK json>'
// ============================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const b64url = (buf: ArrayBuffer | Uint8Array): string => {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

type OfficerRow = {
  id: string;
  role: string | null;
  is_suspended: boolean | null;
  is_approved: boolean | null;
};

async function importPrivKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"],
  );
}

Deno.serve(async (req: Request) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    // ── 0) Secrets — ghaib hon to saaf batao, "internal" me mat chhupao ──────
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const PRIV_RAW = Deno.env.get("DIO_LICENSE_PRIV_JWK") || "";

    const missing: string[] = [];
    if (!SUPABASE_URL) missing.push("SUPABASE_URL");
    if (!SERVICE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
    if (!ANON_KEY) missing.push("SUPABASE_ANON_KEY");
    if (!PRIV_RAW) missing.push("DIO_LICENSE_PRIV_JWK");
    if (missing.length) {
      console.error("dio-license: missing secrets →", missing.join(", "));
      return json({ error: "server_misconfigured", missing }, 500);
    }

    let PRIV_JWK: JsonWebKey;
    try {
      PRIV_JWK = JSON.parse(PRIV_RAW);
    } catch (_) {
      console.error("dio-license: DIO_LICENSE_PRIV_JWK is not valid JSON");
      return json({ error: "server_misconfigured", missing: ["DIO_LICENSE_PRIV_JWK_JSON"] }, 500);
    }
    if (!PRIV_JWK || (PRIV_JWK as Record<string, unknown>).d === undefined) {
      // 'd' na ho to ye PUBLIC key hai — isse dastkhat mumkin nahi.
      console.error("dio-license: DIO_LICENSE_PRIV_JWK has no 'd' (public key set by mistake)");
      return json({ error: "server_misconfigured", missing: ["PRIVATE_KEY_NOT_PUBLIC"] }, 500);
    }

    // ── 1) Caller ka JWT verify karo → user id ──────────────────────────────
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) return json({ error: "no_token" }, 401);

    const asUser = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await asUser.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "bad_token" }, 401);
    const uid = userData.user.id;

    // ── 2) Service role se officer parho (RLS bypass — server par bharosa) ──
    //  maybeSingle() JAAN-BOOJH KAR hata diya: wo duplicate rows par error deta
    //  hai aur us error ko purana code nigal jata tha.
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: offRows, error: offErr } = await admin.from("officers")
      .select("id, role, is_suspended, is_approved")
      .eq("user_id", uid)
      .limit(5);

    if (offErr) {
      console.error("dio-license: officers lookup failed →", offErr);
      return json({
        error: "officer_lookup_failed",
        code: (offErr as { code?: string }).code || null,
      }, 500);
    }
    if (!offRows || offRows.length === 0) {
      // Ye ab waqai "is user_id ka koi afsar record nahi" ka matlab rakhta hai.
      // uid caller ka apna hai — wapas bhejna mehfooz hai aur tashkhees asaan.
      console.error("dio-license: no officers row for user_id", uid);
      return json({ error: "no_officer", user_id: uid }, 403);
    }

    let officer = offRows[0];
    if (offRows.length > 1) {
      // Duplicate record — saaf-suthri (manzoor-shuda, ghair-mo'attal) ko tarjeeh.
      const clean = offRows.filter((r: OfficerRow) => r.is_suspended !== true && r.is_approved !== false);
      officer = clean[0] || offRows[0];
      console.warn("dio-license: duplicate officers rows for user_id", uid, "count", offRows.length);
    }

    const now = Date.now();
    let entitledUntil = 0;
    let plan = "none";

    // ── MO'ATTALI/MANZOORI KA GATE — dastkhat se PEHLE ──────────────
    //  Tarteeb SQL (50_suspend_hard_gate) jaisi hi: superadmin →
    //  mo'attal/ghair-manzoor → admin → subscription.
    const isOwner = officer.role === "superadmin";
    const suspended = officer.is_suspended === true;
    const notApproved = officer.is_approved === false;

    if (!isOwner && (suspended || notApproved)) {
      return json({ error: suspended ? "suspended" : "not_approved" }, 403);
    }

    if (isOwner || officer.role === "admin") {
      entitledUntil = now + 72 * 3600 * 1000;
      plan = "owner";
    } else {
      const { data: sub, error: subErr } = await admin.from("subscriptions")
        .select("status, expires_at")
        .eq("officer_id", officer.id)
        .order("created_at", { ascending: false })
        .limit(1).maybeSingle();
      if (subErr) {
        // Pehle ye khamoshi se "not_entitled" ban jata tha — yaani DB ki
        // kharabi afsar ki miyaad khatam hone jaisi dikhti thi.
        console.error("dio-license: subscriptions lookup failed →", subErr);
        return json({
          error: "sub_lookup_failed",
          code: (subErr as { code?: string }).code || null,
        }, 500);
      }
      if (sub && (sub.status === "active" || sub.status === "trial")) {
        // expires_at NULL: sirf 'active' ke liye mustaqil maana jata hai
        // (SQL ke dio_has_active_sub() jaisa hi).
        const raw = sub.expires_at ? new Date(sub.expires_at).getTime() : NaN;
        const perpetual = (sub.status === "active" && !sub.expires_at);
        if (perpetual) {
          entitledUntil = now + 48 * 3600 * 1000;
          plan = sub.status;
        } else if (!Number.isNaN(raw) && raw > now) {
          entitledUntil = Math.min(raw, now + 48 * 3600 * 1000);
          plan = sub.status;
        }
      }
    }

    // Koi haq nahi → 403, aur kuch bhi dastkhat NA karein.
    if (entitledUntil <= 0) return json({ error: "not_entitled" }, 403);

    // ── 3) Payload + ECDSA dastkhat ─────────────────────────────────────────
    const payload = {
      v: 1, kid: "dio-1", sub: uid, officer_id: officer.id, plan,
      entitled_until: entitledUntil, issued_at: now,
    };
    const payloadStr = JSON.stringify(payload);
    const key = await importPrivKey(PRIV_JWK);
    const sig = await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(payloadStr),
    );
    const token = b64url(new TextEncoder().encode(payloadStr)) + "." + b64url(sig);

    return json({ token, entitled_until: entitledUntil, plan }, 200);
  } catch (e) {
    // Andarooni tafseel bahar na jaye (env naam, Postgres paighamat waghera)
    try { console.error("dio-license:", e); } catch (_) { /* noop */ }
    return json({ error: "internal" }, 500);
  }
});
