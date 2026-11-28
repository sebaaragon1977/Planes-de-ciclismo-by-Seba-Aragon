// RutaViva — cuando alguien propone un encuentro en la agenda, avisa por mail a todos los suscriptores
// con la hora en su zona horaria y en UTC. Lo llama la app con { id } justo después de crear el encuentro.
import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.16";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const APP_URL = "https://sebaaragon1977.github.io/Planes-de-ciclismo-by-Seba-Aragon/";
const CONTACT = "sebaaragon1977@gmail.com";
const MAX_POR_DIA = 3;
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const ZONAS: Record<string, string> = { argentina: "America/Argentina/Buenos_Aires", uruguay: "America/Montevideo", chile: "America/Santiago", brasil: "America/Sao_Paulo", brazil: "America/Sao_Paulo",
  paraguay: "America/Asuncion", bolivia: "America/La_Paz", peru: "America/Lima", colombia: "America/Bogota", ecuador: "America/Guayaquil", venezuela: "America/Caracas", mexico: "America/Mexico_City",
  espana: "Europe/Madrid", spain: "Europe/Madrid", italia: "Europe/Rome", italy: "Europe/Rome", francia: "Europe/Paris", france: "Europe/Paris", portugal: "Europe/Lisbon", alemania: "Europe/Berlin",
  germany: "Europe/Berlin", "reino unido": "Europe/London", "united kingdom": "Europe/London", "estados unidos": "America/New_York", "united states": "America/New_York", usa: "America/New_York", canada: "America/Toronto" };
const norm = (s: string) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
function zonaDe(p: { zona?: string; pais?: string } | undefined) {
  const z = p?.zona; if (z) { try { new Intl.DateTimeFormat("es", { timeZone: z }); return z; } catch { /* zona inválida */ } }
  return ZONAS[norm(p?.pais || "")] || "UTC";
}
const fmt = (d: Date, tz: string, lang: string) => new Intl.DateTimeFormat(lang, { timeZone: tz, weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", hour12: false }).format(d);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    let key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!key) { try { key = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}").default ?? ""; } catch { /* */ } }
    const admin = createClient(url, key, { auth: { persistSession: false } });
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: ud } = await admin.auth.getUser(jwt);
    const me = ud?.user; if (!me) return json({ error: "no autorizado" }, 401);
    const { id } = await req.json().catch(() => ({ id: null }));
    const { data: e } = await admin.from("encuentros").select("*").eq("id", id).eq("creador", me.id).maybeSingle();
    if (!e) return json({ error: "encuentro no encontrado" }, 404);
    if (e.notificado) return json({ ok: true, repetido: true });
    const desde = new Date(Date.now() - 864e5).toISOString();
    const { count } = await admin.from("encuentros").select("id", { count: "exact", head: true }).eq("creador", me.id).not("notificado", "is", null).gte("notificado", desde);
    if ((count ?? 0) >= MAX_POR_DIA) return json({ ok: false, error: "límite diario de avisos" }, 429);

    const pass = Deno.env.get("SMTP_PASS"); if (!pass) return json({ error: "mail no configurado" }, 503);
    const from = Deno.env.get("SMTP_USER") ?? "aragonapps1@gmail.com";
    const { data: perfiles } = await admin.from("perfiles").select("id, pais, zona, apodo, idioma");
    const P = new Map((perfiles || []).map((p) => [p.id, p]));
    const yo = P.get(me.id) as { apodo?: string; pais?: string } | undefined;
    const quien = (yo?.apodo && yo.apodo.trim()) || "Ciclista " + me.id.replace(/-/g, "").slice(0, 4).toUpperCase();
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const dest = (list?.users || []).filter((u) => u.email && u.email_confirmed_at && u.id !== me.id);
    const fecha = new Date(e.fecha);
    const utc = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(fecha) + " UTC";
    const link = `${APP_URL}?encuentro=${e.id}`;
    const tr = nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user: from, pass } });
    const sent: string[] = [], failed: string[] = [];
    for (const u of dest) {
      const tz = zonaDe(P.get(u.id) as { zona?: string; pais?: string } | undefined);
      const es = fmt(fecha, tz, "es"), en = fmt(fecha, tz, "en");
      const html = `<div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#1d2530;line-height:1.5">
        <div style="background:#10161f;color:#fff;border-radius:14px 14px 0 0;padding:18px 22px"><div style="font-size:20px;font-weight:800">📅 Nuevo encuentro en RutaViva</div><div style="color:#ffb27a">New group ride on RutaViva</div></div>
        <div style="background:#fff;border:1px solid #e5e8ec;border-top:0;border-radius:0 0 14px 14px;padding:18px 22px">
          <p style="margin-top:0"><b>${esc(quien)}</b> propone pedalear juntos · <i>invites you to ride together</i>:</p>
          <table role="presentation" style="width:100%;border-collapse:separate;border-spacing:0 6px">
            <tr><td style="color:#66707d;width:38%">Ruta · Route</td><td><b>${esc(e.ruta)}</b></td></tr>
            <tr><td style="color:#66707d">Tu hora · Your time</td><td><b>${esc(es)}</b><br><span style="color:#66707d">${esc(en)} (${esc(tz)})</span></td></tr>
            <tr><td style="color:#66707d">Hora UTC · UTC time</td><td><b>${esc(utc)}</b></td></tr>
            ${e.nota ? `<tr><td style="color:#66707d">Nota · Note</td><td>${esc(e.nota)}</td></tr>` : ""}
          </table>
          <p style="text-align:center;margin:18px 0"><a href="${link}" style="display:inline-block;background:#ff6a2b;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:10px">Ver la agenda y sumarme · See it and join</a></p>
          <p style="font-size:13px;color:#5d6875">A esa hora abrí RutaViva, cargá la misma ruta y vas a ver a los demás en el 3D; cuando estén cerca pueden hablar por videollamada.<br><i>At that time open RutaViva and load the same route: you'll see the others in 3D, and when you're close you can video chat.</i></p>
          <p style="font-size:12px;color:#7a8592;border-top:1px solid #eef1f5;padding-top:10px;margin-bottom:0">¿Dudas o mejoras? · Questions or ideas? <a href="mailto:${CONTACT}" style="color:#ff6a2b">${CONTACT}</a></p>
        </div></div>`;
      try {
        await tr.sendMail({ from: `RutaViva <${from}>`, to: u.email!, replyTo: CONTACT, subject: `📅 ${quien}: ${e.ruta} — ${es} (${utc})`, html });
        sent.push(u.email!);
      } catch { failed.push(u.email!); }
    }
    await admin.from("encuentros").update({ notificado: new Date().toISOString() }).eq("id", e.id);
    return json({ ok: true, enviados: sent.length, fallidos: failed.length });
  } catch (err) { return json({ error: String((err as Error)?.message ?? err) }, 500); }
});
