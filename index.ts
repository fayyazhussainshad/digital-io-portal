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
    const { data: officer } = await admin.from("officers").select("id, role").eq("user_id", uid).maybeSingle();
    if (!officer) return new Response(JSON.stringify({ error: "no_officer" }), { status: 403, headers: cors });

    const now = Date.now();
    let entitledUntil = 0;
    let plan = "none";

    if (officer.role === "superadmin" || officer.role === "admin") {
      entitledUntil = now + 72 * 3600 * 1000; // owner/admin: 72h grace har baar
      plan = "owner";
    } else {
      const { data: sub } = await admin.from("subscriptions")
        .select("status, expires_at")
        .eq("officer_id", officer.id)
        .order("created_at", { ascending: false })
        .limit(1).maybeSingle();
      if (sub && (sub.status === "active" || sub.status === "trial")) {
        const exp = new Date(sub.expires_at).getTime();
        if (exp > now) {
          // Token miyaad = min(subscription expiry, ab + 48h) — offline window mehdood
          entitledUntil = Math.min(exp, now + 48 * 3600 * 1000);
          plan = sub.status;
        }
      }
    }

    // 3) Payload + ECDSA dastkhat
    const payload = { v: 1, officer_id: officer.id, plan, entitled_until: entitledUntil, issued_at: now };
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
    return new Response(JSON.stringify({ error: String(e && (e as Error).message || e) }), { status: 500, headers: cors });
  }
});
