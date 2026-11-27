// RutaViva — manda al ciclista el resumen de su salida por mail.
// Se llama desde la app (salidas.js) con { id } y la sesión del usuario.
// Secretos de la función: SMTP_PASS (contraseña de aplicación de Gmail de aragonapps1@gmail.com).
// Opcionales: SMTP_USER (por defecto aragonapps1@gmail.com) y CONTACT_EMAIL.
import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.16";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const APP_URL = "https://sebaaragon1977.github.io/Planes-de-ciclismo-by-Seba-Aragon/";
const CONTACT = Deno.env.get("CONTACT_EMAIL") ?? "aragonapps1@gmail.com";
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const TX: Record<string, Record<string, string>> = {
  es: { subject: "Tu salida en RutaViva: {ruta}", hi: "¡Buena salida!", intro: "Este es el resumen de tu salida en RutaViva.", done: "completa", undone: "sin terminar", from: "desde el km {km}",
    dist: "Distancia", time: "Tiempo", climb: "Desnivel", avgSpd: "Velocidad media", maxSpd: "Velocidad máxima", avgHr: "FC media", maxHr: "FC máxima",
    avgPow: "Potencia media", maxPow: "Potencia máxima", np: "Potencia normalizada", cad: "Cadencia media", kj: "Energía",
    cta: "Abrir RutaViva", history: "Todas tus salidas quedan guardadas en 📋 Mis salidas.", contact: "¿Dudas o sugerencias? Escribinos a" },
  en: { subject: "Your RutaViva ride: {ruta}", hi: "Great ride!", intro: "Here's the summary of your RutaViva ride.", done: "complete", undone: "unfinished", from: "from km {km}",
    dist: "Distance", time: "Time", climb: "Climb", avgSpd: "Average speed", maxSpd: "Max speed", avgHr: "Average HR", maxHr: "Max HR",
    avgPow: "Average power", maxPow: "Max power", np: "Normalized power", cad: "Average cadence", kj: "Energy",
    cta: "Open RutaViva", history: "All your rides are saved in 📋 My rides.", contact: "Questions or ideas? Write to" },
  pt: { subject: "Sua pedalada no RutaViva: {ruta}", hi: "Boa pedalada!", intro: "Este é o resumo da sua pedalada no RutaViva.", done: "concluída", undone: "não concluída", from: "desde o km {km}",
    dist: "Distância", time: "Tempo", climb: "Ganho", avgSpd: "Velocidade média", maxSpd: "Velocidade máxima", avgHr: "FC média", maxHr: "FC máxima",
    avgPow: "Potência média", maxPow: "Potência máxima", np: "Potência normalizada", cad: "Cadência média", kj: "Energia",
    cta: "Abrir o RutaViva", history: "Todas as suas pedaladas ficam salvas em 📋 Minhas pedaladas.", contact: "Dúvidas ou sugestões? Escreva para" },
};
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const fmtTime = (min: number) => { const s = Math.round((min || 0) * 60), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60; return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(r).padStart(2, "0"); };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    let key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!key) { try { key = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}").default ?? ""; } catch { /* sin clave */ } }
    const admin = createClient(url, key, { auth: { persistSession: false } });
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: ud, error: ue } = await admin.auth.getUser(jwt);
    const user = ud?.user;
    if (ue || !user || !user.email) return json({ error: "no autorizado" }, 401);

    const { id } = await req.json().catch(() => ({ id: null }));
    if (!id) return json({ error: "falta el id" }, 400);
    const { data: s, error } = await admin.from("salidas").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
    if (error || !s) return json({ error: "salida no encontrada" }, 404);
    if (s.mail_enviado && Date.now() - new Date(s.mail_enviado).getTime() < 60_000) return json({ ok: true, repetido: true });

    const pass = Deno.env.get("SMTP_PASS");
    if (!pass) return json({ error: "mail no configurado" }, 503);
    const from = Deno.env.get("SMTP_USER") ?? "aragonapps1@gmail.com";

    const { data: p } = await admin.from("perfiles").select("idioma").eq("id", user.id).maybeSingle();
    const lang = ["es", "en", "pt"].includes(p?.idioma) ? p!.idioma : "es";
    const t = TX[lang];
    const n = (v: unknown, d = 0) => (v === null || v === undefined || !isFinite(Number(v)) ? "--" : Number(v).toLocaleString(lang, { minimumFractionDigits: d, maximumFractionDigits: d }));
    const rows: [string, string][] = [
      [t.dist, `${n(s.km, 2)} km`], [t.time, fmtTime(s.minutos)], [t.climb, `+${n(s.desnivel_m)} m`],
      [t.avgSpd, `${n(s.vel_media, 1)} km/h`], [t.maxSpd, `${n(s.vel_max, 1)} km/h`],
      [t.avgHr, s.fc_media ? `${s.fc_media} ppm` : "--"], [t.maxHr, s.fc_max ? `${s.fc_max} ppm` : "--"],
      [t.avgPow, s.pot_media != null ? `${s.pot_media} W` : "--"], [t.maxPow, s.pot_max != null ? `${s.pot_max} W` : "--"],
      [t.np, s.pot_np ? `${s.pot_np} W` : "--"], [t.cad, s.cad_media ? `${s.cad_media} rpm` : "--"], [t.kj, s.kj != null ? `${s.kj} kJ` : "--"],
    ];
    const fecha = new Date(s.creado).toLocaleString(lang, { dateStyle: "medium", timeStyle: "short", timeZone: "America/Argentina/Buenos_Aires" });
    const sub = `${esc(fecha)} · ${s.completa ? t.done : t.undone}${Number(s.km_inicio) > 0.05 ? " · " + t.from.replace("{km}", n(s.km_inicio, 1)) : ""}`;
    const cells = rows.map(([k, v]) => `<td style="padding:10px 12px;background:#f3f5f8;border-radius:10px;width:33%"><div style="font-size:12px;color:#66707d">${esc(k)}</div><div style="font-size:20px;font-weight:700;color:#11161e">${esc(v)}</div></td>`);
    let table = "";
    for (let i = 0; i < cells.length; i += 3) table += `<tr>${cells.slice(i, i + 3).join("")}</tr>`;
    const html = `<!doctype html><html><body style="margin:0;background:#eef1f5;font-family:Arial,Helvetica,sans-serif">
      <div style="max-width:600px;margin:0 auto;padding:24px 16px">
        <div style="background:#10161f;color:#fff;border-radius:16px 16px 0 0;padding:20px 22px">
          <div style="font-size:22px;font-weight:800">🚴 RutaViva</div>
          <div style="font-size:15px;color:#ffb27a;margin-top:6px">${esc(t.hi)}</div>
        </div>
        <div style="background:#fff;border-radius:0 0 16px 16px;padding:20px 22px">
          <div style="font-size:14px;color:#33404f">${esc(t.intro)}</div>
          <div style="font-size:18px;font-weight:700;color:#11161e;margin-top:12px">${esc(s.ruta)}</div>
          <div style="font-size:13px;color:#66707d;margin:2px 0 14px">${sub}</div>
          <table role="presentation" style="width:100%;border-collapse:separate;border-spacing:6px">${table}</table>
          <div style="text-align:center;margin:20px 0 6px"><a href="${APP_URL}" style="display:inline-block;background:#ff6a2b;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:10px">${esc(t.cta)}</a></div>
          <div style="font-size:13px;color:#66707d;text-align:center">${esc(t.history)}</div>
          <div style="font-size:12px;color:#66707d;text-align:center;border-top:1px solid #e5e8ec;margin-top:16px;padding-top:12px">${esc(t.contact)} <a href="mailto:${CONTACT}" style="color:#ff6a2b">${CONTACT}</a></div>
        </div>
      </div></body></html>`;
    const text = `${t.intro}\n\n${s.ruta}\n${sub.replace(/&[^;]+;/g, "")}\n\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${t.cta}: ${APP_URL}\n${t.contact} ${CONTACT}`;

    const tr = nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user: from, pass } });
    await tr.sendMail({ from: `RutaViva <${from}>`, to: user.email, replyTo: CONTACT, subject: t.subject.replace("{ruta}", s.ruta || "RutaViva"), html, text });
    await admin.from("salidas").update({ mail_enviado: new Date().toISOString() }).eq("id", id);
    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
