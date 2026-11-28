// RutaViva — manda el mail de bienvenida con el instructivo a usuarios ya registrados.
// Solo lo puede usar el administrador (Sebastián). Body opcional: { emails: [...] } para elegir a quién.
// Usa el mismo secreto SMTP_PASS que la función resumen-salida.
import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.16";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const ADMINS = ["sebaaragon1977@gmail.com", "guillermo.aragon@hospitalitaliano.org.ar"];
const APP_URL = "https://sebaaragon1977.github.io/Planes-de-ciclismo-by-Seba-Aragon/";
const CONTACT = "sebaaragon1977@gmail.com";
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const HTML = `<div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#1d2530;line-height:1.5">
  <div style="background:#10161f;color:#fff;border-radius:14px 14px 0 0;padding:20px 22px">
    <div style="font-size:22px;font-weight:800">🚴 Gracias por sumarte a RutaViva</div>
    <div style="color:#ffb27a;margin-top:4px">Tu ruta real, en el rodillo. Gratis. · <i>Your real route, on your smart trainer. Free.</i></div>
  </div>
  <div style="background:#ffffff;border:1px solid #e5e8ec;border-top:0;border-radius:0 0 14px 14px;padding:20px 22px">
    <p style="font-size:13px;color:#5d6875;margin-top:0">🇬🇧 English version below.</p>
    <p>¡Hola! Te escribo porque fuiste de los primeros en registrarte en RutaViva. Desde que entraste sumamos un montón de cosas nuevas, así que te dejo una guía rápida de todo lo que podés hacer.</p>
    <p style="text-align:center;margin:18px 0"><a href="${APP_URL}" style="display:inline-block;background:#ff6a2b;color:#fff;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:10px">Abrir RutaViva · Open RutaViva</a></p>
    <h3 style="margin:22px 0 6px">Cómo empezar</h3>
    <ol style="padding-left:20px;margin:0">
      <li>Abrí RutaViva en <b>Google Chrome</b> (o Edge), en compu o en Android.</li>
      <li>Elegí una ruta: <b>📂 Cargar GPX</b> (de tu Garmin, Strava o Wikiloc) o <b>🌍 Rutas famosas</b> (Alpe d'Huez, Stelvio, Ventoux y más de 30).</li>
      <li>Conectá tu rodillo smart: <b>ANT+</b> (con el pendrive USB) o <b>Bluetooth</b>. Opcional: tu pulsómetro.</li>
      <li>Pedaleá: arranca solo. El rodillo endurece en las subidas y afloja en las bajadas.</li>
    </ol>
    <h3 style="margin:22px 0 6px">Todo lo que podés hacer</h3>
    <ul style="padding-left:20px;margin:0">
      <li><b>Ruta en 3D</b> con relieve e imagen satelital reales, árboles, lagos, arcos de largada y llegada con público.</li>
      <li><b>Elegí dónde largar:</b> tocá o arrastrá la altimetría de abajo antes de iniciar.</li>
      <li><b>Entrenamientos ERG:</b> cargá un entrenamiento estructurado y el rodillo te marca la potencia de cada bloque.</li>
      <li><b>Pruebas y zonas:</b> ⚡ test de FTP de 20 minutos y ❤️ test de frecuencia cardíaca máxima y umbral, en un óvalo plano. Te calcula tus zonas de potencia y de pulso.</li>
      <li><b>🎯 Calibrar a cero:</b> soltá los pedales y el rodillo se calibra solo.</li>
      <li><b>📋 Mis salidas:</b> cada salida queda guardada con distancia, tiempo, desnivel, velocidad, pulso, potencia y cadencia. Si cortás antes, tocá <b>🏁 Terminar y guardar</b>. Al terminar te llega el resumen por mail.</li>
      <li><b>🏆 Ranking por ruta:</b> tu mejor tiempo contra el resto, con tu apodo y la bandera de tu país.</li>
      <li><b>Pedaleá con otros:</b> si otro ciclista está en la misma ruta lo ves en el 3D y en la altimetría, y yendo a rueda tenés rebufo.</li>
      <li><b>💾 Exportar TCX</b> para subir tu salida a Garmin Connect o Strava.</li>
      <li><b>📲 Instalala como app</b> desde Chrome, e idiomas español, inglés y portugués.</li>
    </ul>
    <h3 style="margin:22px 0 6px">🎥 Videollamada en la ruta</h3>
    <p style="margin:0 0 6px">Podés hablar por video con otro ciclista mientras pedalean juntos:</p>
    <ol style="padding-left:20px;margin:0">
      <li>Los dos tienen que estar logueados, con <b>“Mostrarme y ver a otros”</b> prendido y en <b>la misma ruta</b>.</li>
      <li>Cuando el otro está a menos de 150 m, abajo a la derecha aparece <b>“🎥 (nombre) está cerca tuyo en la ruta”</b>.</li>
      <li>Cada uno toca <b>“Activar cámara y micrófono”</b> y le da permiso al navegador. Cuando los dos aceptan, se abre un video chiquito: el otro en grande y vos en la esquina.</li>
      <li>Tenés botones para silenciar el micrófono 🎙️, apagar la cámara 📷 o colgar.</li>
      <li>Si se alejan más de 220 m o uno se va de la ruta, la llamada se corta sola.</li>
    </ol>
    <p style="font-size:13px;color:#5d6875;margin:6px 0 0">Tip: usá auriculares para que no haya eco. En redes muy cerradas (algunos wifi de oficina) el video puede no conectar.</p>
    <div style="background:#fff4ec;border-radius:10px;padding:12px 14px;margin:20px 0">
      🔑 <b>Nuevo:</b> ahora se entra con mail y clave. Si te registraste con el link por mail, tocá <b>“¿Olvidaste tu clave?”</b> en la pantalla de entrada y creá la tuya.
    </div>
    <div style="background:#fff4ec;border-radius:10px;padding:12px 14px;margin:20px 0">
      🔄 <b>RutaViva está en mejora continua.</b> Sumamos funciones y arreglos todo el tiempo, y cada vez que la abrís ya tenés la versión más nueva, sin instalar nada.
    </div>
    <p>¿Tenés dudas, ideas de mejora o encontraste algún error? Escribime a <a href="mailto:${CONTACT}" style="color:#ff6a2b;font-weight:700">${CONTACT}</a> o respondé este mail. Leo todo.</p>
    <p>¡Buenas rutas!<br>Sebastián — RutaViva</p>

    <hr style="border:0;border-top:2px solid #eef1f5;margin:28px 0">
    <h2 style="margin:0 0 8px">🇬🇧 Thanks for joining RutaViva</h2>
    <p>Hi! I'm writing because you were one of the first to sign up for RutaViva. We've added a lot since you joined, so here's a quick guide to everything you can do.</p>
    <h3 style="margin:22px 0 6px">Getting started</h3>
    <ol style="padding-left:20px;margin:0">
      <li>Open RutaViva in <b>Google Chrome</b> (or Edge), on a computer or Android.</li>
      <li>Pick a route: <b>📂 Load GPX</b> (from Garmin, Strava or Wikiloc) or <b>🌍 Famous routes</b> (Alpe d'Huez, Stelvio, Ventoux and 30+ more).</li>
      <li>Connect your smart trainer: <b>ANT+</b> (USB stick) or <b>Bluetooth</b>. Optional: your heart rate monitor.</li>
      <li>Ride: it starts on its own. The trainer gets harder on climbs and easier on descents.</li>
    </ol>
    <h3 style="margin:22px 0 6px">Everything you can do</h3>
    <ul style="padding-left:20px;margin:0">
      <li><b>3D route</b> with real terrain and satellite imagery, trees, lakes, start and finish arches with spectators.</li>
      <li><b>Choose where to start:</b> tap or drag the elevation profile before starting.</li>
      <li><b>ERG workouts:</b> load a structured workout and the trainer sets the power for each block.</li>
      <li><b>Tests &amp; zones:</b> ⚡ 20-minute FTP test and ❤️ max heart rate &amp; threshold test, on a flat oval. It works out your power and heart rate zones.</li>
      <li><b>🎯 Zero calibration:</b> let go of the pedals and the trainer calibrates itself.</li>
      <li><b>📋 My rides:</b> every ride is saved with distance, time, climbing, speed, heart rate, power and cadence. If you stop early, tap <b>🏁 Finish and save</b>. You get a summary by email.</li>
      <li><b>🏆 Route leaderboard:</b> your best time against everyone else, with your nickname and your country's flag.</li>
      <li><b>Ride with others:</b> if another rider is on the same route you see them in 3D and on the elevation profile, and you get a draft bonus when you're on their wheel.</li>
      <li><b>💾 Export TCX</b> to upload your ride to Garmin Connect or Strava.</li>
      <li><b>📲 Install it as an app</b> from Chrome; available in English, Spanish and Portuguese.</li>
    </ul>
    <h3 style="margin:22px 0 6px">🎥 Video call on the road</h3>
    <p style="margin:0 0 6px">You can video chat with another rider while you ride together:</p>
    <ol style="padding-left:20px;margin:0">
      <li>Both riders must be signed in, with <b>“Show me and see others”</b> on and on <b>the same route</b>.</li>
      <li>When the other rider is less than 150 m away, <b>“🎥 (name) is near you on the road”</b> shows up at the bottom right.</li>
      <li>Each of you taps <b>“Turn on camera and mic”</b> and allows the browser. Once both accept, a small video opens: the other rider big and you in the corner.</li>
      <li>There are buttons to mute 🎙️, turn off the camera 📷 or hang up.</li>
      <li>If you get more than 220 m apart or someone leaves the route, the call ends automatically.</li>
    </ol>
    <p style="font-size:13px;color:#5d6875;margin:6px 0 0">Tip: use headphones to avoid echo. On very locked-down networks (some office wifi) the video may not connect.</p>
    <div style="background:#fff4ec;border-radius:10px;padding:12px 14px;margin:20px 0">
      🔑 <b>New:</b> you now sign in with email and password. If you signed up with the email link, tap <b>“Forgot your password?”</b> on the sign-in screen and create yours.
    </div>
    <div style="background:#fff4ec;border-radius:10px;padding:12px 14px;margin:20px 0">
      🔄 <b>RutaViva keeps improving.</b> We add features and fixes all the time, and every time you open it you get the latest version, with nothing to install.
    </div>
    <p>Questions, ideas or found a bug? Write to me at <a href="mailto:${CONTACT}" style="color:#ff6a2b;font-weight:700">${CONTACT}</a> or just reply to this email. I read everything.</p>
    <p style="margin-bottom:0">Happy riding!<br>Sebastián — RutaViva</p>
  </div>
</div>`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    let key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!key) { try { key = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}").default ?? ""; } catch { /* */ } }
    const admin = createClient(url, key, { auth: { persistSession: false } });
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: ud } = await admin.auth.getUser(jwt);
    const me = ud?.user?.email?.toLowerCase();
    if (!me || !ADMINS.includes(me)) return json({ error: "solo el administrador" }, 403);
    const body = await req.json().catch(() => ({}));
    const pick: string[] | null = Array.isArray(body.emails) ? body.emails.map((e: string) => e.toLowerCase()) : null;
    const { data: list, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) return json({ error: error.message }, 500);
    const targets = list.users.filter((u) => u.email && u.email_confirmed_at && !ADMINS.includes(u.email.toLowerCase()) && (!pick || pick.includes(u.email.toLowerCase())));
    const pass = Deno.env.get("SMTP_PASS"); if (!pass) return json({ error: "mail no configurado" }, 503);
    const from = Deno.env.get("SMTP_USER") ?? "aragonapps1@gmail.com";
    const tr = nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user: from, pass } });
    const sent: string[] = [], failed: { email: string; error: string }[] = [];
    for (const u of targets) {
      try {
        await tr.sendMail({ from: `RutaViva <${from}>`, to: u.email!, replyTo: CONTACT, subject: "Bienvenido a RutaViva 🚴 Welcome to RutaViva — guía / guide", html: HTML });
        sent.push(u.email!);
      } catch (e) { failed.push({ email: u.email!, error: String((e as Error)?.message ?? e) }); }
    }
    return json({ ok: true, sent, failed });
  } catch (e) { return json({ error: String((e as Error)?.message ?? e) }, 500); }
});
