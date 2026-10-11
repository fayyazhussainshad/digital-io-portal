// ============================================================================
// Digital IO — Edge Function: dio-license   (Finding 9 ka OFFLINE hissa)
// ----------------------------------------------------------------------------
// Maqsad: login par server subscription check kar ke ek MUKHTASIR-MUDDAT, DASTKHAT-
// SHUDA license token deta hai. Client ye token mehfooz rakhta hai aur OFFLINE
// sirf isi ki miyaad tak likhne ki ijazat deta hai — koi khud-ba-khud 30-din
// trial nahi. Token ECDSA (P-256) se sign hota hai: server ke paas PRIVATE key,
// client ke paas sirf PUBLIC key (jaali nahi bana sakta).
//
// Deploy:  supabase functions deploy dio-license --no-verify-jwt
//   (JWT hum khud check karte hain neeche.)
// Secrets: supabase secrets set DIO_LICENSE_PRIV_JWK='<private key JWK json>'
//          (keypair banane ke liye dekho README.md)
// ============================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const b64url = (buf: ArrayBuffer | Uint8Array): string => {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const PRIV_JWK = JSON.parse(Deno.env.get("DIO_LICENSE_PRIV_JWK")!);

    // 1) Caller ka JWT verify karo → user id
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) return new Response(JSON.stringify({ error: "no_token" }), { status: 401, headers: cors });

    const asUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await asUser.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "bad_token" }), { status: 401, headers: cors });
    }
    const uid = userData.user.id;

    // 2) Service role se officer + subscription parho (RLS bypass — server par bharosa)
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: officer } = await admin.from("officers")
      .select("id, role, is_suspended, is_approved").eq("user_id", uid).maybeSingle();
    if (!officer) return new Response(JSON.stringify({ error: "no_officer" }), { status: 403, headers: cors });

    const now = Date.now();
    let entitledUntil = 0;
    let plan = "none";

    // ── MO'ATTALI/MANZOORI KA GATE — dastkhat se PEHLE ──────────────
    //  KHAMI THI: ye function sirf `id, role` parhta tha aur admin ko
    //  bila-shart 72 ghante deta tha. Yaani 50_suspend_hard_gate.sql me
    //  band kiya gaya sooraakh yahin se dobara khul jata: mo'attal afsar
    //  ka refresh token abhi zinda hota hai, wo curl se naya token le kar
    //  48-72 ghante offline poora kaam kar leta. Ab SQL wali tarteeb hi
    //  yahan bhi: superadmin → mo'attal/ghair-manzoor → admin → subscription.
    const isOwner     = officer.role === "superadmin";
    const suspended   = officer.is_suspended === true;
    const notApproved = officer.is_approved === false;

    if (!isOwner && (suspended || notApproved)) {
      return new Response(
        JSON.stringify({ error: suspended ? "suspended" : "not_approved" }),
        { status: 403, headers: cors },
      );
    }

    if (isOwner || officer.role === "admin") {
      entitledUntil = now + 72 * 3600 * 1000;
      plan = "owner";
    } else {
      const { data: sub } = await admin.from("subscriptions")
        .select("status, expires_at")
        .eq("officer_id", officer.id)
        .order("created_at", { ascending: false })
        .limit(1).maybeSingle();
      if (sub && (sub.status === "active" || sub.status === "trial")) {
        // expires_at NULL: sirf 'active' ke liye mustaqil maana jata hai
        // (SQL ke dio_has_active_sub() jaisa hi). NaN > now hamesha false
        // tha, is liye pehle aisa afsar khamoshi se 0 le kar jata tha.
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

    // Koi haq nahi → 403, aur kuch bhi dastkhat NA karein. Pehle 200 ke
    // sath `entitled_until: 0` wala dastkhat-shuda token wapas jata tha.
    if (entitledUntil <= 0) {
      return new Response(JSON.stringify({ error: "not_entitled" }), { status: 403, headers: cors });
    }

    // 3) Payload + ECDSA dastkhat
    const payload = { v: 1, kid: "dio-1", sub: uid, officer_id: officer.id, plan,
                      entitled_until: entitledUntil, issued_at: now };
    const payloadStr = JSON.stringify(payload);
    const key = await importPrivKey(PRIV_JWK);
    const sig = await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(payloadStr),
    );
    const token = b64url(new TextEncoder().encode(payloadStr)) + "." + b64url(sig);

    return new Response(JSON.stringify({ token, entitled_until: entitledUntil, plan }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    // Andarooni tafseel bahar na jaye (env naam, Postgres paighamat waghera)
    try { console.error("dio-license:", e); } catch (_) { /* noop */ }
    return new Response(JSON.stringify({ error: "internal" }), { status: 500, headers: cors });
  }
});
