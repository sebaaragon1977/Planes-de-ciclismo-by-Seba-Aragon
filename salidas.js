/* RutaViva — salidas guardadas y estadísticas propias.
   - Guarda cada salida del usuario logueado (al llegar, al tocar "Terminar y guardar", o sola si cambia de ruta o cierra).
   - "Mis salidas": historial con totales, detalle con gráfico, repetir la ruta, borrar y reenviar por mail.
   - Al guardar, le manda el resumen por mail (función "resumen-salida" de Supabase).
   - En la altimetría de abajo se puede tocar o arrastrar para elegir desde dónde largar.
   Se apoya en window.__S (estado), window.__R (escena) y window.__RV (sesión de Supabase). */
(() => {
  "use strict";

  // ───────────────────────── Configuración ─────────────────────────
  const CONTACT_EMAIL = "sebaaragon1977@gmail.com";
  const BUCKET = "rutas-usuarios";
  const MAIL_FN = "resumen-salida";
  const $ = (id) => document.getElementById(id);
  const S = () => window.__S, R = () => window.__R, RV = () => window.__RV || {};
  const lang = () => (["es", "en", "pt"].includes(document.documentElement.lang) ? document.documentElement.lang : "es");

  const TX = {
    es: {
      endBtn: "🏁 Terminar y guardar", myRides: "📋 Mis salidas",
      pickHint: "Tocá o arrastrá la altimetría para elegir dónde largar",
      pickLocked: "Para largar desde otro punto, primero tocá ⟲ Reiniciar.",
      startAt: "Largás en el km {km}. Dale ▶ Iniciar.",
      hover: "km {km} · {alt} m · {g}%",
      finishedTitle: "🏁 ¡Llegaste!", savedTitle: "Tu salida", detailTitle: "Detalle de la salida",
      dist: "Distancia", time: "Tiempo", climb: "Desnivel", avgSpd: "Vel. media", maxSpd: "Vel. máx",
      avgHr: "FC media", maxHr: "FC máx", avgPow: "Potencia media", maxPow: "Potencia máx", np: "Potencia normalizada",
      avgCad: "Cadencia media", energy: "Energía", startKm: "Largada",
      fromKm: "desde el km {km}", incomplete: "sin terminar", complete: "completa",
      saving: "Guardando…", saved: "✅ Guardada en 📋 Mis salidas.", saveErr: "No se pudo guardar: {e}",
      needLogin: "Iniciá sesión para guardar tus salidas.",
      mailing: "Mandándote el resumen por mail…", mailed: "📧 Te mandamos el resumen a {email}.",
      mailErr: "No pude mandarte el mail esta vez. La salida quedó guardada igual.",
      exportTcx: "💾 Exportar TCX", newRide: "⟲ Nueva rodada", close: "Cerrar", back: "← Volver",
      sendMail: "📧 Enviarme por mail", repeat: "🔁 Repetir ruta", del: "🗑 Borrar", delSure: "¿Seguro? Tocá de nuevo",
      deleted: "Salida borrada.", total: "Total", thisMonth: "Este mes", rides: "salidas",
      empty: "Todavía no guardaste salidas. Elegí una ruta, pedaleá y al final tocá 🏁 Terminar y guardar.",
      loading: "Cargando…", contact: "¿Dudas o sugerencias? Escribinos a",
      askSave: "¿Guardás esta salida antes de reiniciar?", saveIt: "Guardar", discard: "Descartar", cancel: "Cancelar",
      autoSaved: "Guardé tu salida anterior en 📋 Mis salidas.", tooShort: "Pedaleá un poco más para poder guardar la salida.",
      noRepeat: "Esta ruta no se puede repetir desde acá.", loadingRoute: "Cargando la ruta…",
      legend: "Altimetría · Pulso · Potencia", error: "Error: ",
    },
    en: {
      endBtn: "🏁 Finish and save", myRides: "📋 My rides",
      pickHint: "Tap or drag the elevation profile to choose where to start",
      pickLocked: "To start from another point, tap ⟲ Restart first.",
      startAt: "You'll start at km {km}. Hit ▶ Start.",
      hover: "km {km} · {alt} m · {g}%",
      finishedTitle: "🏁 You made it!", savedTitle: "Your ride", detailTitle: "Ride details",
      dist: "Distance", time: "Time", climb: "Climb", avgSpd: "Avg speed", maxSpd: "Max speed",
      avgHr: "Avg HR", maxHr: "Max HR", avgPow: "Avg power", maxPow: "Max power", np: "Normalized power",
      avgCad: "Avg cadence", energy: "Energy", startKm: "Start",
      fromKm: "from km {km}", incomplete: "unfinished", complete: "complete",
      saving: "Saving…", saved: "✅ Saved to 📋 My rides.", saveErr: "Couldn't save: {e}",
      needLogin: "Sign in to save your rides.",
      mailing: "Emailing you the summary…", mailed: "📧 We sent the summary to {email}.",
      mailErr: "Couldn't email you this time. The ride is saved anyway.",
      exportTcx: "💾 Export TCX", newRide: "⟲ New ride", close: "Close", back: "← Back",
      sendMail: "📧 Email it to me", repeat: "🔁 Ride it again", del: "🗑 Delete", delSure: "Sure? Tap again",
      deleted: "Ride deleted.", total: "Total", thisMonth: "This month", rides: "rides",
      empty: "No saved rides yet. Pick a route, ride, and at the end tap 🏁 Finish and save.",
      loading: "Loading…", contact: "Questions or ideas? Write to",
      askSave: "Save this ride before restarting?", saveIt: "Save", discard: "Discard", cancel: "Cancel",
      autoSaved: "Your previous ride was saved to 📋 My rides.", tooShort: "Ride a bit more before saving.",
      noRepeat: "This route can't be repeated from here.", loadingRoute: "Loading the route…",
      legend: "Elevation · Heart rate · Power", error: "Error: ",
    },
    pt: {
      endBtn: "🏁 Encerrar e salvar", myRides: "📋 Minhas pedaladas",
      pickHint: "Toque ou arraste a altimetria para escolher onde largar",
      pickLocked: "Para largar de outro ponto, toque antes em ⟲ Reiniciar.",
      startAt: "Você larga no km {km}. Toque em ▶ Iniciar.",
      hover: "km {km} · {alt} m · {g}%",
      finishedTitle: "🏁 Você chegou!", savedTitle: "Sua pedalada", detailTitle: "Detalhe da pedalada",
      dist: "Distância", time: "Tempo", climb: "Ganho", avgSpd: "Vel. média", maxSpd: "Vel. máx",
      avgHr: "FC média", maxHr: "FC máx", avgPow: "Potência média", maxPow: "Potência máx", np: "Potência normalizada",
      avgCad: "Cadência média", energy: "Energia", startKm: "Largada",
      fromKm: "desde o km {km}", incomplete: "não concluída", complete: "concluída",
      saving: "Salvando…", saved: "✅ Salva em 📋 Minhas pedaladas.", saveErr: "Não foi possível salvar: {e}",
      needLogin: "Entre na sua conta para salvar suas pedaladas.",
      mailing: "Enviando o resumo por e-mail…", mailed: "📧 Enviamos o resumo para {email}.",
      mailErr: "Não consegui enviar o e-mail desta vez. A pedalada ficou salva.",
      exportTcx: "💾 Exportar TCX", newRide: "⟲ Nova pedalada", close: "Fechar", back: "← Voltar",
      sendMail: "📧 Enviar por e-mail", repeat: "🔁 Repetir rota", del: "🗑 Apagar", delSure: "Certeza? Toque de novo",
      deleted: "Pedalada apagada.", total: "Total", thisMonth: "Este mês", rides: "pedaladas",
      empty: "Você ainda não salvou pedaladas. Escolha uma rota, pedale e no final toque em 🏁 Encerrar e salvar.",
      loading: "Carregando…", contact: "Dúvidas ou sugestões? Escreva para",
      askSave: "Salvar esta pedalada antes de reiniciar?", saveIt: "Salvar", discard: "Descartar", cancel: "Cancelar",
      autoSaved: "Salvei sua pedalada anterior em 📋 Minhas pedaladas.", tooShort: "Pedale mais um pouco para poder salvar.",
      noRepeat: "Esta rota não pode ser repetida daqui.", loadingRoute: "Carregando a rota…",
      legend: "Altimetria · Frequência · Potência", error: "Erro: ",
    },
  };
  const t = (k, v = {}) => String(TX[lang()][k] ?? TX.es[k] ?? k).replace(/\{(\w+)\}/g, (_, x) => (v[x] ?? ""));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const toast = (m, ms = 3500) => { const r = R(); if (r && r.toast) r.toast(m, ms); else console.log(m); };
  const fmtTime = (sec) => { sec = Math.max(0, Math.round(sec || 0)); const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60; return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(s).padStart(2, "0"); };
  const fmtH = (min) => { const h = Math.floor(min / 60), m = Math.round(min % 60); return h ? `${h} h ${String(m).padStart(2, "0")} min` : `${m} min`; };
  const num = (v, d = 0) => (v === null || v === undefined || !isFinite(v) ? "--" : (+v).toLocaleString(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }));
  const fmtDate = (iso) => { try { return new Date(iso).toLocaleString(lang(), { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch { return iso; } };
  function el(html) { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; }
  function closeModal(id) { const x = $(id); if (x) x.remove(); }

  // ───────────────────────── Estilos ─────────────────────────
  const css = document.createElement("style");
  css.textContent = `
  .sv-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}
  .sv-grid div{background:#141b25;border-radius:10px;padding:8px 10px}
  .sv-grid b{display:block;font-size:19px;font-variant-numeric:tabular-nums;margin-top:2px}
  .sv-grid span{font-size:11px;color:var(--mut);letter-spacing:.02em}
  .sv-grid small{font-size:12px;color:var(--mut);font-weight:400}
  .sv-route{font-size:15px;font-weight:600;margin-top:4px}.sv-meta{font-size:12px;color:var(--mut);margin-top:2px}
  .sv-tag{font-size:10px;border-radius:6px;padding:1px 6px;margin-left:6px;vertical-align:2px}
  .sv-tag.ok{color:var(--ok);border:1px solid rgba(60,207,122,.45)}.sv-tag.no{color:var(--warn);border:1px solid rgba(255,197,61,.45)}
  .sv-chart{width:100%;height:120px;display:block;background:#10161f;border-radius:10px}
  .sv-legend{font-size:11px;color:var(--mut);margin:4px 2px 0}
  .sv-legend i{display:inline-block;width:10px;height:3px;border-radius:2px;margin:0 4px 2px 8px;vertical-align:middle}
  .sv-status{font-size:13px;line-height:1.5;margin-top:10px}.sv-status div{margin:2px 0}
  .sv-status .err{color:var(--bad)}.sv-status .ok{color:var(--ok)}
  .sv-btns{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;margin-top:12px}.sv-btns button{padding:8px 12px;font-size:13px}
  .sv-contact{font-size:12px;color:var(--mut);text-align:center;margin-top:14px;border-top:1px solid rgba(255,255,255,.08);padding-top:10px}
  .sv-contact a{color:var(--acc)}
  .sv-tot{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}
  .sv-tot div{background:#141b25;border-radius:10px;padding:8px 10px;font-size:13px;line-height:1.5}
  .sv-tot b{font-size:12px;color:var(--mut);font-weight:600;letter-spacing:.04em;text-transform:uppercase}
  .sv-list{margin-top:8px}
  .sv-item{display:block;width:100%;text-align:left;padding:9px 11px;margin:5px 0;border-radius:10px}
  .sv-item .l1{display:flex;justify-content:space-between;gap:8px;font-size:14px}.sv-item .l1 span:first-child{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .sv-item .l2{font-size:12px;color:var(--mut);margin-top:3px;font-variant-numeric:tabular-nums}
  #svProfOv{position:absolute;left:10px;top:8px;width:calc(100% - 20px);height:calc(100% - 16px);cursor:crosshair;touch-action:none}
  @media (max-width:520px){.sv-grid{grid-template-columns:1fr 1fr}}
  `;
  document.head.appendChild(css);

  // ───────────────────────── Sesión ─────────────────────────
  let token = null, authHooked = false;
  function hookAuth() {
    const sb = RV().sb; if (!sb || authHooked) return;
    authHooked = true;
    sb.auth.getSession().then(({ data }) => { token = data && data.session ? data.session.access_token : null; }).catch(() => {});
    sb.auth.onAuthStateChange((_e, s) => { token = s ? s.access_token : null; });
  }

  // ───────────────────────── De dónde salió la ruta ─────────────────────────
  // Para poder repetirla: si es de la biblioteca guardamos su id; si es un GPX propio, lo subimos a tu carpeta privada.
  let lastLoad = null, pendingSrc = null, routeSrc = null, pendingStartKm = null;
  function hookLoads() {
    const r = R();
    if (r && !r.__svWrapped) {
      r.__svWrapped = true;
      const orig = r.loadGpxFile;
      r.loadGpxFile = (file) => {
        lastLoad = pendingSrc ? Object.assign({ file }, pendingSrc) : { file, libId: String(file.name || "").replace(/\.gpx$/i, "") || null };
        lastLoad.at = performance.now(); pendingSrc = null;
        return orig(file);
      };
    }
    const fi = $("fileGpx");
    if (fi && !fi.__sv) { fi.__sv = true; fi.addEventListener("change", (e) => { const f = e.target.files && e.target.files[0]; if (f) lastLoad = { file: f, libId: null, at: performance.now() }; }, true); }
    const demo = $("btnDemo");
    if (demo && !demo.__sv) { demo.__sv = true; demo.addEventListener("click", () => { lastLoad = { demo: true, at: performance.now() }; }, true); }
  }
  addEventListener("drop", (e) => {
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f && /\.gpx$/i.test(f.name)) lastLoad = { file: f, libId: null, at: performance.now() };
  }, true);

  async function sha(text) {
    try {
      const b = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(text));
      return [...new Uint8Array(b)].slice(0, 10).map((x) => x.toString(16).padStart(2, "0")).join("");
    } catch { return String(Date.now()); }
  }
  async function ensureGpxUploaded() {
    const sb = RV().sb, user = RV().user, src = routeSrc;
    if (!sb || !user || !src || src.libId || src.demo) return null;
    if (src.gpxPath) return src.gpxPath;
    if (!src.file || src.file.size > 8e6) return null;
    try {
      const txt = await src.file.text();
      const path = `${user.id}/${await sha(txt)}.gpx`;
      const { error } = await sb.storage.from(BUCKET).upload(path, new Blob([txt], { type: "application/gpx+xml" }), { upsert: true, contentType: "application/gpx+xml" });
      if (error) { console.warn("[salidas] gpx", error); return null; }
      src.gpxPath = path; return path;
    } catch (e) { console.warn("[salidas] gpx", e); return null; }
  }

  // ───────────────────────── Seguimiento de la salida en curso ─────────────────────────
  let curRoute = null, d0 = 0, ride = null, dragging = false, allowReset = false;
  function newRide(s) {
    return { key: s.route.name + "|" + s.startTime, d0: s.d0 || 0, rec: s.record, savedId: null, saving: null, finishedHandled: false,
      name: s.route.name, total: s.route.total, src: routeSrc, snap: null, lastSavedElapsed: -1 };
  }
  function meaningful(r, strict) {
    if (!r || !r.snap) return false;
    const dist = r.snap.d - r.d0;
    return strict ? dist >= 1000 || r.snap.elapsed >= 300 : r.snap.elapsed >= 20 || dist >= 100;
  }
  function watch() {
    const s = S(); if (!s) return;
    hookLoads(); hookAuth();
    if (s.route !== curRoute) {
      if (ride && !ride.savedId && meaningful(ride, true)) { const old = ride; saveRide(old, { complete: false }).then((res) => res && res.ok && toast(t("autoSaved"), 4000)); }
      curRoute = s.route; ride = null; d0 = 0; s.d0 = 0;
      routeSrc = lastLoad && performance.now() - lastLoad.at < 180000 ? lastLoad : null; lastLoad = null;
      dispatchEvent(new CustomEvent("rv-largada", { detail: { d: 0 } }));
    }
    if (!s.route || s.loading) return;
    if (pendingStartKm !== null && s.startTime === null) { const km = pendingStartKm; pendingStartKm = null; if (km > 0.05) setStart(km * 1000, true); }
    if (s.startTime === null) {
      if (ride) {
        if (!ride.savedId && meaningful(ride, true)) { const old = ride; saveRide(old, { complete: false }).then((res) => res && res.ok && toast(t("autoSaved"), 4000)); }
        ride = null;
      }
      if (!dragging && d0 !== 0 && Math.abs(s.d - d0) > 1) { d0 = 0; s.d0 = 0; dispatchEvent(new CustomEvent("rv-largada", { detail: { d: 0 } })); }
    } else {
      const key = s.route.name + "|" + s.startTime;
      if (!ride || ride.key !== key) { s.d0 = d0; ride = newRide(s); }
      ride.rec = s.record;
      ride.snap = { d: s.d, elapsed: s.elapsed, gain: s.gain, finished: s.finished };
      if (s.finished && !ride.finishedHandled) {
        ride.finishedHandled = true;
        finishFlow(ride, true);
      }
    }
    updateButtons();
  }

  // ───────────────────────── Cálculo de estadísticas ─────────────────────────
  function stats(r, complete) {
    const sn = r.snap, rec = r.rec || [];
    const dist = Math.max(0, Math.min(sn.d, r.total) - r.d0), secs = sn.elapsed;
    let sp = 0, np = 0, mp = 0, nP = rec.length, hs = 0, nh = 0, mh = 0, cs = 0, nc = 0, mv = 0;
    for (const x of rec) {
      const p = x.power || 0; sp += p; if (p > mp) mp = p;
      if (x.hr) { hs += x.hr; nh++; if (x.hr > mh) mh = x.hr; }
      if (x.cad > 0) { cs += x.cad; nc++; }
      if (x.spd > mv) mv = x.spd;
    }
    if (nP >= 30) {
      let acc = 0, sum4 = 0, n4 = 0; const w = 30;
      for (let i = 0; i < nP; i++) { acc += rec[i].power || 0; if (i >= w) acc -= rec[i - w].power || 0; if (i >= w - 1) { sum4 += Math.pow(acc / w, 4); n4++; } }
      np = n4 ? Math.round(Math.pow(sum4 / n4, 0.25)) : 0;
    }
    return {
      ruta: r.name, ruta_id: r.src && r.src.libId ? r.src.libId : null,
      km: +(dist / 1000).toFixed(2), minutos: +(secs / 60).toFixed(1), desnivel_m: Math.round(sn.gain || 0),
      km_inicio: +(r.d0 / 1000).toFixed(2), completa: !!complete,
      vel_media: secs > 0 ? +((dist / secs) * 3.6).toFixed(1) : null, vel_max: mv ? +(mv * 3.6).toFixed(1) : null,
      fc_media: nh ? Math.round(hs / nh) : null, fc_max: nh ? mh : null,
      pot_media: nP ? Math.round(sp / nP) : null, pot_max: nP ? mp : null, pot_np: np || null,
      cad_media: nc ? Math.round(cs / nc) : null, kj: nP ? Math.round(sp / 1000) : null,
      serie: serie(r),
    };
  }
  function serie(r) {
    const rec = r.rec || []; if (!rec.length) return null;
    const base = r.d0 > 0 && rec[0].dist >= r.d0 - 50 ? r.d0 : 0; // por si el registro trae la distancia absoluta
    const step = Math.max(1, Math.ceil(rec.length / 300)), out = { d: [], e: [], p: [], h: [], v: [] };
    for (let i = 0; i < rec.length; i += step) {
      const seg = rec.slice(i, i + step), n = seg.length, last = seg[n - 1];
      let p = 0, h = 0, nh = 0, v = 0;
      for (const x of seg) { p += x.power || 0; v += x.spd || 0; if (x.hr) { h += x.hr; nh++; } }
      out.d.push(+((last.dist - base) / 1000).toFixed(3)); out.e.push(Math.round(last.ele));
      out.p.push(Math.round(p / n)); out.h.push(nh ? Math.round(h / nh) : null); out.v.push(+((v / n) * 3.6).toFixed(1));
    }
    return out;
  }

  // ───────────────────────── Guardar ─────────────────────────
  async function saveRide(r, { complete }) {
    if (r.saving) await r.saving.catch(() => {});
    const sb = RV().sb, user = RV().user;
    if (!meaningful(r, false)) return { ok: false, short: true };
    const row = stats(r, complete);
    r.lastRow = row;
    if (!sb || !user) return { ok: false, login: true, row };
    if (r.savedId && r.lastSavedElapsed === r.snap.elapsed && r.lastComplete === !!complete) return { ok: true, id: r.savedId, row, same: true };
    const job = (async () => {
      const gp = await ensureGpxUploaded(); if (gp) row.gpx_path = gp;
      const q = r.savedId
        ? sb.from("salidas").update(row).eq("id", r.savedId).select("id").maybeSingle()
        : sb.from("salidas").insert(row).select("id").maybeSingle();
      const { data, error } = await q;
      if (error) throw error;
      if (data && data.id) r.savedId = data.id;
      r.lastSavedElapsed = r.snap.elapsed; r.lastComplete = !!complete;
      return { ok: true, id: r.savedId, row };
    })();
    r.saving = job;
    try { return await job; } catch (e) { console.warn("[salidas] guardar", e); return { ok: false, error: e.message || String(e), row }; } finally { r.saving = null; }
  }
  // Al cerrar la pestaña: guardado rápido que sobrevive al cierre (sin subir el GPX ni mandar mail).
  addEventListener("pagehide", () => {
    try {
      const sb = RV().sb, r = ride;
      if (!sb || !token || !r || !meaningful(r, true) || (r.savedId && r.lastSavedElapsed === r.snap.elapsed)) return;
      const row = stats(r, !!r.snap.finished);
      if (r.src && r.src.gpxPath) row.gpx_path = r.src.gpxPath;
      const url = sb.supabaseUrl + "/rest/v1/salidas" + (r.savedId ? "?id=eq." + r.savedId : "");
      fetch(url, { method: r.savedId ? "PATCH" : "POST", keepalive: true,
        headers: { apikey: sb.supabaseKey, Authorization: "Bearer " + token, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify(row) });
    } catch {}
  });

  async function sendMail(id) {
    const sb = RV().sb; if (!sb || !id) return { ok: false };
    try {
      const { data, error } = await sb.functions.invoke(MAIL_FN, { body: { id } });
      if (error || !data || !data.ok) { console.warn("[salidas] mail", error || data); return { ok: false }; }
      return { ok: true };
    } catch (e) { console.warn("[salidas] mail", e); return { ok: false }; }
  }

  // ───────────────────────── Terminar / llegar ─────────────────────────
  async function finishFlow(r, complete) {
    const s = S();
    if (s && s.riding && $("btnStart")) $("btnStart").click(); // pausa
    if (!meaningful(r, false)) { toast(t("tooShort")); return; }
    const m = showSummary({ row: stats(r, complete), title: complete ? t("finishedTitle") : t("savedTitle"), live: true, date: new Date().toISOString() });
    const st = m.querySelector(".sv-status");
    const line = (cls, txt) => { const d = document.createElement("div"); d.className = cls; d.textContent = txt; st.appendChild(d); return d; };
    if (!RV().user) { line("err", t("needLogin")); return; }
    const l1 = line("", t("saving"));
    const res = await saveRide(r, { complete });
    if (!res.ok) { l1.className = "err"; l1.textContent = res.short ? t("tooShort") : t("saveErr", { e: res.error || "" }); return; }
    l1.className = "ok"; l1.textContent = t("saved");
    if (res.same && r.mailed) return;
    const l2 = line("", t("mailing"));
    const mr = await sendMail(res.id);
    if (mr.ok) { r.mailed = true; l2.className = "ok"; l2.textContent = t("mailed", { email: RV().user.email }); }
    else { l2.className = "err"; l2.textContent = t("mailErr"); }
  }

  // ───────────────────────── Pantallas ─────────────────────────
  function contactHtml() { return `<div class="sv-contact">${esc(t("contact"))} <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></div>`; }
  function grid(row) {
    const c = (k, v, u = "") => `<div><span>${esc(t(k))}</span><b>${v}${u ? ` <small>${u}</small>` : ""}</b></div>`;
    return `<div class="sv-grid">
      ${c("dist", num(row.km, 2), "km")}${c("time", fmtTime((row.minutos || 0) * 60))}${c("climb", "+" + num(row.desnivel_m), "m")}
      ${c("avgSpd", num(row.vel_media, 1), "km/h")}${c("maxSpd", num(row.vel_max, 1), "km/h")}${c("avgCad", num(row.cad_media), "rpm")}
      ${c("avgHr", num(row.fc_media), "ppm")}${c("maxHr", num(row.fc_max), "ppm")}${c("energy", num(row.kj), "kJ")}
      ${c("avgPow", num(row.pot_media), "W")}${c("maxPow", num(row.pot_max), "W")}${c("np", num(row.pot_np), "W")}
    </div>`;
  }
  function headHtml(row, date) {
    const tag = row.completa ? `<span class="sv-tag ok">${esc(t("complete"))}</span>` : `<span class="sv-tag no">${esc(t("incomplete"))}</span>`;
    const from = row.km_inicio > 0.05 ? " · " + esc(t("fromKm", { km: num(row.km_inicio, 1) })) : "";
    return `<div class="sv-route">${esc(row.ruta || "")}${tag}</div><div class="sv-meta">${esc(fmtDate(date))}${from}</div>`;
  }
  function chartHtml() {
    return `<canvas class="sv-chart"></canvas><div class="sv-legend"><i style="background:#7f93ad"></i>${esc(t("legend").split(" · ")[0])}<i style="background:#ff4d5e"></i>${esc(t("legend").split(" · ")[1])}<i style="background:#ffa53d"></i>${esc(t("legend").split(" · ")[2])}</div>`;
  }
  function drawChart(cv, se) {
    if (!cv) return;
    const dpr = devicePixelRatio || 1, W = cv.clientWidth || 400, H = cv.clientHeight || 120;
    cv.width = W * dpr; cv.height = H * dpr;
    const g = cv.getContext("2d"); g.scale(dpr, dpr); g.clearRect(0, 0, W, H);
    if (!se || !se.d || se.d.length < 2) { cv.style.display = "none"; if (cv.nextElementSibling) cv.nextElementSibling.style.display = "none"; return; }
    const n = se.d.length, d0 = se.d[0], d1 = se.d[n - 1] || 1, pad = 6;
    const X = (i) => pad + ((se.d[i] - d0) / (d1 - d0 || 1)) * (W - 2 * pad);
    const rng = (a) => { const v = a.filter((x) => x !== null && isFinite(x)); return v.length ? [Math.min(...v), Math.max(...v)] : null; };
    const re = rng(se.e);
    if (re) {
      const [a, b] = re, span = Math.max(20, b - a), lo = a - span * 0.1, hi = b + span * 0.15;
      const Y = (v) => H - pad - ((v - lo) / (hi - lo)) * (H - 2 * pad);
      g.beginPath(); g.moveTo(X(0), H); for (let i = 0; i < n; i++) g.lineTo(X(i), Y(se.e[i])); g.lineTo(X(n - 1), H); g.closePath();
      const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "rgba(127,147,173,.75)"); gr.addColorStop(1, "rgba(127,147,173,.12)");
      g.fillStyle = gr; g.fill();
    }
    const line = (arr, color) => {
      const r = rng(arr); if (!r) return; const [a, b] = r, lo = a - (b - a) * 0.1 - 1, hi = b + (b - a) * 0.1 + 1;
      const Y = (v) => H - pad - ((v - lo) / (hi - lo)) * (H - 2 * pad);
      g.strokeStyle = color; g.lineWidth = 1.6; g.lineJoin = "round"; g.beginPath(); let on = false;
      for (let i = 0; i < n; i++) { const v = arr[i]; if (v === null || !isFinite(v)) { on = false; continue; } on ? g.lineTo(X(i), Y(v)) : g.moveTo(X(i), Y(v)); on = true; }
      g.stroke();
    };
    line(se.p, "rgba(255,165,61,.9)"); line(se.h, "rgba(255,77,94,.95)");
  }
  function cardModal(id, inner, wide = true) {
    closeModal(id);
    const m = el(`<div class="rv-modal rv-own" id="${id}"><div class="rv-card${wide ? " wide" : ""}">${inner}</div></div>`);
    document.body.appendChild(m);
    m.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(id); e.stopPropagation(); });
    m.addEventListener("keyup", (e) => e.stopPropagation());
    m.onclick = (e) => { if (e.target === m) closeModal(id); };
    return m;
  }
  function showSummary({ row, title, live, date }) {
    const m = cardModal("sv-sum", `
      <button class="rv-close" data-x>✕</button><h2>${esc(title)}</h2>
      ${headHtml(row, date)}${grid(row)}${chartHtml()}
      <div class="sv-status"></div>
      <div class="sv-btns">
        <button data-a="tcx">${esc(t("exportTcx"))}</button>
        <button data-a="list">${esc(t("myRides"))}</button>
        ${live ? `<button data-a="new">${esc(t("newRide"))}</button>` : ""}
        <button class="primary" data-x>${esc(t("close"))}</button>
      </div>${contactHtml()}`);
    m.querySelectorAll("[data-x]").forEach((b) => (b.onclick = () => closeModal("sv-sum")));
    m.querySelector('[data-a="tcx"]').onclick = () => $("btnTcx") && $("btnTcx").click();
    m.querySelector('[data-a="list"]').onclick = () => { closeModal("sv-sum"); openList(); };
    const nb = m.querySelector('[data-a="new"]');
    if (nb) nb.onclick = () => { closeModal("sv-sum"); allowReset = true; $("btnReset") && $("btnReset").click(); allowReset = false; };
    requestAnimationFrame(() => drawChart(m.querySelector(".sv-chart"), row.serie));
    return m;
  }

  const COLS = "id,creado,ruta,ruta_id,km,minutos,desnivel_m,km_inicio,completa,vel_media,vel_max,fc_media,fc_max,pot_media,pot_max,pot_np,cad_media,kj,gpx_path";
  async function openList() {
    const sb = RV().sb, user = RV().user;
    const m = cardModal("sv-list", `<button class="rv-close" data-x>✕</button><h2>${esc(t("myRides"))}</h2><div id="svListBody" class="sub">${esc(t("loading"))}</div>${contactHtml()}`);
    m.querySelector("[data-x]").onclick = () => closeModal("sv-list");
    const body = $("svListBody");
    if (!sb || !user) { body.textContent = t("needLogin"); return; }
    const { data, error } = await sb.from("salidas").select(COLS).eq("user_id", user.id).order("creado", { ascending: false }).limit(300);
    if (error) { body.textContent = t("error") + error.message; return; }
    if (!data.length) { body.textContent = t("empty"); return; }
    const now = new Date(), ym = now.getFullYear() * 12 + now.getMonth();
    const sum = (arr) => arr.reduce((a, x) => ({ n: a.n + 1, km: a.km + (+x.km || 0), min: a.min + (+x.minutos || 0), m: a.m + (+x.desnivel_m || 0) }), { n: 0, km: 0, min: 0, m: 0 });
    const all = sum(data), month = sum(data.filter((x) => { const d = new Date(x.creado); return d.getFullYear() * 12 + d.getMonth() === ym; }));
    const tot = (lbl, a) => `<div><b>${esc(lbl)}</b><br>${a.n} ${esc(t("rides"))} · ${num(a.km, 1)} km<br>${fmtH(a.min)} · +${num(a.m)} m</div>`;
    body.className = "";
    body.innerHTML = `<div class="sv-tot">${tot(t("thisMonth"), month)}${tot(t("total"), all)}</div><div class="sv-list">${data.map((x) => `
      <button class="sv-item" data-id="${x.id}"><div class="l1"><span>${esc(x.ruta || "")}${x.completa ? "" : `<span class="sv-tag no">${esc(t("incomplete"))}</span>`}</span><span>${num(x.km, 1)} km</span></div>
      <div class="l2">${esc(fmtDate(x.creado))} · ${fmtTime((x.minutos || 0) * 60)} · +${num(x.desnivel_m)} m · ${num(x.vel_media, 1)} km/h${x.fc_media ? " · ❤️ " + x.fc_media : ""}${x.pot_media ? " · ⚡ " + x.pot_media + " W" : ""}</div></button>`).join("")}</div>`;
    body.querySelectorAll(".sv-item").forEach((b) => (b.onclick = () => openDetail(data.find((x) => String(x.id) === b.dataset.id))));
  }
  async function openDetail(row) {
    const sb = RV().sb;
    const m = cardModal("sv-sum", `
      <button class="rv-close" data-x>✕</button><h2>${esc(t("detailTitle"))}</h2>
      ${headHtml(row, row.creado)}${grid(row)}${chartHtml()}
      <div class="sv-status"></div>
      <div class="sv-btns">
        <button data-a="back">${esc(t("back"))}</button>
        <button data-a="del">${esc(t("del"))}</button>
        <button data-a="mail">${esc(t("sendMail"))}</button>
        <button class="primary" data-a="rep">${esc(t("repeat"))}</button>
      </div>${contactHtml()}`);
    closeModal("sv-list");
    const st = m.querySelector(".sv-status");
    const say = (cls, txt) => { st.innerHTML = ""; const d = document.createElement("div"); d.className = cls; d.textContent = txt; st.appendChild(d); };
    m.querySelector("[data-x]").onclick = () => closeModal("sv-sum");
    m.querySelector('[data-a="back"]').onclick = () => { closeModal("sv-sum"); openList(); };
    if (!row.ruta_id && !row.gpx_path) m.querySelector('[data-a="rep"]').style.display = "none";
    m.querySelector('[data-a="rep"]').onclick = () => repeatRoute(row);
    m.querySelector('[data-a="mail"]').onclick = async (e) => {
      e.target.disabled = true; say("", t("mailing"));
      const r = await sendMail(row.id);
      r.ok ? say("ok", t("mailed", { email: RV().user ? RV().user.email : "" })) : say("err", t("mailErr"));
      e.target.disabled = false;
    };
    const del = m.querySelector('[data-a="del"]');
    del.onclick = async () => {
      if (!del.dataset.sure) { del.dataset.sure = "1"; del.textContent = t("delSure"); return; }
      const { error } = await sb.from("salidas").delete().eq("id", row.id);
      if (error) return say("err", t("error") + error.message);
      if (ride && ride.savedId === row.id) ride.savedId = null;
      toast(t("deleted")); closeModal("sv-sum"); openList();
    };
    const { data } = await sb.from("salidas").select("serie").eq("id", row.id).maybeSingle();
    drawChart(m.querySelector(".sv-chart"), data && data.serie);
  }
  async function repeatRoute(row) {
    const r = R(), sb = RV().sb; if (!r) return;
    try {
      let txt = null, src = null;
      if (row.ruta_id) {
        const idx = await (await fetch("rutas/index.json", { cache: "no-cache" })).json();
        const lib = (Array.isArray(idx) ? idx : idx.rutas || []).find((x) => x.id === row.ruta_id);
        if (lib) { txt = await (await fetch(lib.archivo)).text(); src = { libId: lib.id }; }
      }
      if (!txt && row.gpx_path && sb) {
        const { data, error } = await sb.storage.from(BUCKET).download(row.gpx_path);
        if (error) throw error;
        txt = await data.text(); src = { libId: null, gpxPath: row.gpx_path };
      }
      if (!txt) return toast(t("noRepeat"));
      closeModal("sv-sum"); toast(t("loadingRoute"), 2500);
      const sNow = S(); if (sNow && sNow.riding && $("btnStart")) $("btnStart").click();
      pendingSrc = src; pendingStartKm = row.km_inicio > 0.05 ? +row.km_inicio : null;
      r.loadGpxFile(new File([txt], (row.ruta_id || "ruta") + ".gpx", { type: "application/gpx+xml" }));
    } catch (e) { toast(t("error") + (e.message || e), 6000); }
  }

  // ¿Guardar antes de reiniciar?
  function hookReset() {
    const b = $("btnReset"); if (!b || b.__sv) return; b.__sv = true;
    b.addEventListener("click", (e) => {
      if (allowReset || !ride || ride.savedId || !meaningful(ride, false)) return;
      e.stopImmediatePropagation(); e.preventDefault();
      const s = S(); if (s && s.riding && $("btnStart")) $("btnStart").click();
      const r = ride;
      const m = cardModal("sv-ask", `<h2>${esc(t("askSave"))}</h2><div class="sv-btns">
        <button data-a="cancel">${esc(t("cancel"))}</button><button data-a="discard">${esc(t("discard"))}</button><button class="primary" data-a="save">${esc(t("saveIt"))}</button></div>`, false);
      const doReset = () => { closeModal("sv-ask"); allowReset = true; b.click(); allowReset = false; };
      m.querySelector('[data-a="cancel"]').onclick = () => closeModal("sv-ask");
      m.querySelector('[data-a="discard"]').onclick = () => { r.savedId = -1; doReset(); };
      m.querySelector('[data-a="save"]').onclick = () => { closeModal("sv-ask"); r.finishedHandled = true; finishFlow(r, !!(r.snap && r.snap.finished)); };
    }, true);
  }

  // ───────────────────────── Botones del panel ─────────────────────────
  function addButtons() {
    const reset = $("btnReset"), tcx = $("btnTcx");
    if (reset && !$("btnEndSave")) {
      const b = el(`<button id="btnEndSave" class="rv-own" disabled></button>`);
      reset.after(b);
      b.onclick = () => { if (ride) { ride.finishedHandled = ride.finishedHandled || !!(ride.snap && ride.snap.finished); finishFlow(ride, !!(ride.snap && ride.snap.finished)); } };
    }
    if (tcx && !$("btnMyRides")) {
      const b = el(`<button id="btnMyRides" class="rv-own"></button>`);
      tcx.after(b); b.onclick = openList;
    }
    labelButtons();
  }
  function labelButtons() {
    if ($("btnEndSave")) $("btnEndSave").textContent = t("endBtn");
    if ($("btnMyRides")) $("btnMyRides").textContent = t("myRides");
    if ($("btnInstall")) $("btnInstall").textContent = INST[lang()];
  }
  function updateButtons() {
    const b = $("btnEndSave"); if (!b) return;
    const on = !!(ride && ride.snap && ride.snap.elapsed >= 20);
    if (b.disabled === on) b.disabled = !on;
  }

  // ───────────────────────── Elegir la largada en la altimetría ─────────────────────────
  let ov = null, hoverX = null;
  function canPick() { const s = S(); return s && s.route && !s.loading && s.startTime === null && !s.riding; }
  function setStart(d, quiet) {
    const s = S(); if (!s || !s.route) return;
    d = Math.max(0, Math.min(s.route.total - 50, Math.round(d / 10) * 10));
    s.d = d; s.v = 0; s.lastY = null; s.gain = 0; s.elapsed = 0; s.finished = false; s.record = []; s.recAcc = 0;
    d0 = d; s.d0 = d;
    const r = R(); if (r && r.snapCam) r.snapCam(); // la cámara salta directo, sin volar por encima del terreno
    const bs = $("btnStart"); if (bs) bs.textContent = "▶ Iniciar";
    dispatchEvent(new CustomEvent("rv-largada", { detail: { d } }));
    if (quiet) toast(t("startAt", { km: num(d / 1000, 1) }), 3500);
  }
  function geom() {
    const s = S(), w = ov.clientWidth, h = ov.clientHeight, r = s.route;
    const left = 44, plotW = Math.max(10, w - 50), top = 6, plotH = Math.max(10, h - 22);
    const span = Math.max(30, r.maxE - r.minE), lo = r.minE - span * 0.08, hi = r.maxE + span * 0.08;
    return { w, h, left, plotW, top, plotH, X: (d) => left + (d / r.total) * plotW, Y: (e) => top + plotH * (1 - (e - lo) / (hi - lo)), D: (x) => Math.max(0, Math.min(r.total, ((x - left) / plotW) * r.total)) };
  }
  function setupProfile() {
    const wrap = $("profileWrap"); if (!wrap || $("svProfOv")) return;
    ov = document.createElement("canvas"); ov.id = "svProfOv"; ov.className = "rv-own";
    wrap.appendChild(ov);
    const xOf = (e) => e.clientX - ov.getBoundingClientRect().left;
    ov.addEventListener("pointerdown", (e) => {
      const s = S(); if (!s || !s.route) return;
      if (!canPick()) { toast(t("pickLocked"), 3500); return; }
      dragging = true; ov.setPointerCapture(e.pointerId); setStart(geom().D(xOf(e))); drawOv();
    });
    ov.addEventListener("pointermove", (e) => { hoverX = xOf(e); if (dragging && canPick()) setStart(geom().D(hoverX)); drawOv(); });
    const end = () => { if (!dragging) return; dragging = false; const s = S(); if (s && s.route) toast(t("startAt", { km: num(s.d / 1000, 1) }), 3500); dispatchEvent(new CustomEvent("rv-largada", { detail: { d: d0, end: true } })); };
    ov.addEventListener("pointerup", end); ov.addEventListener("pointercancel", end);
    ov.addEventListener("pointerleave", () => { hoverX = null; drawOv(); });
  }
  function drawOv() {
    if (!ov) return;
    const s = S(), dpr = devicePixelRatio || 1, w = ov.clientWidth, h = ov.clientHeight;
    if (ov.width !== Math.round(w * dpr) || ov.height !== Math.round(h * dpr)) { ov.width = Math.round(w * dpr); ov.height = Math.round(h * dpr); }
    const g = ov.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    if (!s || !s.route || s.loading || !s.route.ele) return;
    const G = geom(), r = R();
    // bandera de largada
    const ds = s.startTime === null ? s.d : (s.d0 || 0);
    if (ds > 0 || s.startTime === null) {
      const x = G.X(ds), p = r.Me(ds), y = G.Y(p.y);
      g.strokeStyle = "rgba(60,207,122,.9)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 26); g.stroke();
      g.fillStyle = "#3ccf7a"; g.beginPath(); g.moveTo(x, y - 26); g.lineTo(x + 14, y - 21); g.lineTo(x, y - 16); g.closePath(); g.fill();
    }
    // ayuda
    if (canPick()) {
      g.font = "12px -apple-system,Segoe UI,sans-serif"; g.textAlign = "right";
      const txt = "↔ " + t("pickHint"), tw = g.measureText(txt).width;
      g.fillStyle = "rgba(10,14,20,.6)"; g.fillRect(w - tw - 16, 2, tw + 12, 18);
      g.fillStyle = "#cfe0f2"; g.fillText(txt, w - 10, 15);
    }
    // cursor
    if (hoverX !== null && hoverX >= G.left && hoverX <= G.left + G.plotW) {
      const d = G.D(hoverX), p = r.Me(d), y = G.Y(p.y);
      g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(hoverX, G.top); g.lineTo(hoverX, G.top + G.plotH); g.stroke(); g.setLineDash([]);
      g.fillStyle = "#fff"; g.beginPath(); g.arc(hoverX, y, 3.5, 0, 7); g.fill();
      const lbl = t("hover", { km: num(d / 1000, 1), alt: Math.round(p.y), g: num(p.grade * 100, 1) });
      g.font = "bold 12px -apple-system,Segoe UI,sans-serif"; const tw = g.measureText(lbl).width;
      let bx = hoverX + 8; if (bx + tw + 10 > w) bx = hoverX - tw - 18;
      g.fillStyle = "rgba(10,14,20,.8)"; g.fillRect(bx, Math.max(2, y - 30), tw + 10, 19);
      g.fillStyle = "#fff"; g.textAlign = "left"; g.fillText(lbl, bx + 5, Math.max(2, y - 30) + 14);
    }
  }

  // ───────────────────────── Instalar como app ─────────────────────────
  // Chrome/Edge ofrecen instalar RutaViva como una app (ícono en el escritorio, ventana propia).
  let installEvt = null;
  const INST = { es: "📲 Instalar RutaViva como app", en: "📲 Install RutaViva as an app", pt: "📲 Instalar o RutaViva como app" };
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
  addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvt = e; showInstall(); });
  addEventListener("appinstalled", () => { installEvt = null; const b = $("btnInstall"); if (b) b.remove(); });
  function showInstall() {
    if (!installEvt || $("btnInstall")) return;
    const host = $("rvAccount") || $("panel"); if (!host) return;
    const row = el(`<div class="row rv-own"><button id="btnInstall"></button></div>`);
    host.appendChild(row);
    $("btnInstall").textContent = INST[lang()];
    $("btnInstall").onclick = async () => { if (!installEvt) return; installEvt.prompt(); try { await installEvt.userChoice; } catch {} installEvt = null; row.remove(); };
  }

  // ───────────────────────── Arranque ─────────────────────────
  let started = false;
  function start() {
    if (started) return; started = true;
    addButtons(); setupProfile(); hookReset(); hookLoads();
    new MutationObserver(labelButtons).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    setInterval(() => { try { watch(); drawOv(); } catch (e) { console.warn("[salidas]", e); } }, 150);
  }
  window.__SV = { setStart, openList, get ride() { return ride; }, stats: (r) => stats(r || ride, false) };
  if (window.__R) start(); else addEventListener("rodillo-listo", start, { once: true });
})();
