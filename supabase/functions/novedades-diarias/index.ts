// RutaViva — una vez por día (pg_cron) manda a todos los suscriptores las novedades publicadas desde el último envío.
// Las novedades salen de novedades.json en la app publicada (se actualiza con cada mejora). Si no hay nada nuevo, no manda nada.
// Solo responde a la llamada programada: exige la clave x-cron-key guardada en privado.config.
import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.16";

const APP_URL = "https://sebaaragon1977.github.io/Planes-de-ciclismo-by-Seba-Aragon/";
const CONTACT = "sebaaragon1977@gmail.com";
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
type Nov = { fecha: string; es: string[]; en: string[] };

Deno.serve(async (req) => {
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    let key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!key) { try { key = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}").default ?? ""; } catch { /* */ } }
    const admin = createClient(url, key, { auth: { persistSession: false } });
    const { data: cronKey } = await admin.rpc("rv_config_get", { p_k: "cron_key" });
    if (!cronKey || req.headers.get("x-cron-key") !== cronKey) return json({ error: "no autorizado" }, 401);
    const prueba = new URL(req.url).searchParams.get("prueba"); // ?prueba=mail → solo a ese mail, sin marcar como enviado

    const { data: hasta } = await admin.rpc("rv_config_get", { p_k: "novedades_hasta" });
    const lista: Nov[] = await (await fetch(APP_URL + "novedades.json?t=" + Date.now(), { cache: "no-store" })).json();
    const nuevas = lista.filter((n) => n.fecha > String(hasta || "")).sort((a, b) => a.fecha.localeCompare(b.fecha));
    if (!nuevas.length) return json({ ok: true, enviados: 0, motivo: "sin novedades" });

    const pass = Deno.env.get("SMTP_PASS"); if (!pass) return json({ error: "mail no configurado" }, 503);
    const from = Deno.env.get("SMTP_USER") ?? "aragonapps1@gmail.com";
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    let dest = (list?.users || []).filter((u) => u.email && u.email_confirmed_at).map((u) => u.email!);
    if (prueba) dest = dest.filter((e) => e === prueba);

    const li = (xs: string[]) => xs.map((x) => `<li style="margin:6px 0">${esc(x)}</li>`).join("");
    const es = nuevas.flatMap((n) => n.es), en = nuevas.flatMap((n) => n.en);
    const html = `<div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#1d2530;line-height:1.5">
      <div style="background:#10161f;color:#fff;border-radius:14px 14px 0 0;padding:18px 22px"><div style="font-size:20px;font-weight:800">🚴 Novedades en RutaViva</div><div style="color:#ffb27a">What's new in RutaViva</div></div>
      <div style="background:#fff;border:1px solid #e5e8ec;border-top:0;border-radius:0 0 14px 14px;padding:18px 22px">
        <p style="margin-top:0"><b>🇪🇸 Español</b> — Mejoramos la app. Esto es lo nuevo:</p><ul style="padding-left:20px">${li(es)}</ul>
        <p style="font-size:13px;color:#5d6875">No tenés que instalar nada: la próxima vez que abras RutaViva ya vas a tener la versión nueva.</p>
        <hr style="border:0;border-top:1px solid #eef1f5;margin:16px 0">
        <p><b>🇬🇧 English</b> — We improved the app. Here's what's new:</p><ul style="padding-left:20px">${li(en)}</ul>
        <p style="font-size:13px;color:#5d6875">Nothing to install: next time you open RutaViva you'll have the new version.</p>
        <p style="text-align:center;margin:18px 0"><a href="${APP_URL}" style="display:inline-block;background:#ff6a2b;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:10px">Abrir RutaViva · Open RutaViva</a></p>
        <p style="font-size:12px;color:#7a8592;border-top:1px solid #eef1f5;padding-top:10px;margin-bottom:0">¿Dudas, ideas o errores? · Questions, ideas or bugs? <a href="mailto:${CONTACT}" style="color:#ff6a2b">${CONTACT}</a><br>
        Si no querés recibir estas novedades, respondé este mail con "baja". · To stop these updates, reply "unsubscribe".</p>
      </div></div>`;
    const tr = nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user: from, pass } });
    let ok = 0, fail = 0;
    for (const to of dest) {
      try { await tr.sendMail({ from: `RutaViva <${from}>`, to, replyTo: CONTACT, subject: "🚴 Novedades en RutaViva · What's new in RutaViva", html }); ok++; } catch { fail++; }
    }
    if (!prueba) await admin.rpc("rv_config_set", { p_k: "novedades_hasta", p_v: nuevas[nuevas.length - 1].fecha });
    return json({ ok: true, enviados: ok, fallidos: fail, novedades: es.length, prueba: !!prueba });
  } catch (err) { return json({ error: String((err as Error)?.message ?? err) }, 500); }
});
