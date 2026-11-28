/* RutaViva — agenda de encuentros para pedalear juntos.
   Próximas 2 semanas día por día, con la hora en tu zona y en UTC. Cualquiera propone ruta, día y hora;
   los demás se suman y al crearlo sale un mail a todos los suscriptores (función aviso-encuentro). */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const S = () => window.__S, R = () => window.__R, RV = () => window.__RV || {};
  const lang = () => (["es", "en", "pt"].includes(document.documentElement.lang) ? document.documentElement.lang : "es");
  const TZ = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch { return "UTC"; } })();
  const TX = {
    es: { btn: "📅 Agenda de encuentros", title: "📅 Agenda de encuentros", sub: "Próximas 2 semanas · tu zona: {tz}", now: "Ahora: {loc} (tu hora) · {utc} UTC",
      propose: "＋ Proponer encuentro", none: "Sin encuentros", join: "Me sumo", leave: "Ya no voy", load: "Cargar ruta", del: "Borrar", going: "{n} van", by: "propone",
      route: "Ruta", day: "Día", hour: "Hora (tu hora)", note: "Nota (opcional)", notePh: "Ej.: ritmo tranquilo, 2 vueltas", create: "Crear y avisar a todos", cancel: "Cancelar",
      preview: "Tu hora: {loc} · UTC: {utc}", curRoute: "Ruta cargada ahora", needLogin: "Iniciá sesión para usar la agenda.", loading: "Cargando…",
      created: "✅ Encuentro creado.", mailed: "📧 Avisamos por mail a {n} ciclistas.", mailErr: "El encuentro quedó creado, pero no se pudo mandar el aviso por mail.",
      past: "Elegí una hora que todavía no haya pasado.", own: "Esta ruta es un GPX propio: pedile el archivo a quien propuso el encuentro.", loadingRoute: "Cargando la ruta…",
      today: "Hoy", tomorrow: "Mañana", deleted: "Encuentro borrado.", tip: "A la hora del encuentro, cargá la ruta: vas a ver a los demás en el 3D y, cerca, pueden hablar por videollamada." },
    en: { btn: "📅 Group ride calendar", title: "📅 Group ride calendar", sub: "Next 2 weeks · your time zone: {tz}", now: "Now: {loc} (your time) · {utc} UTC",
      propose: "＋ Propose a ride", none: "No rides", join: "I'm in", leave: "Not going", load: "Load route", del: "Delete", going: "{n} going", by: "by",
      route: "Route", day: "Day", hour: "Time (your time)", note: "Note (optional)", notePh: "E.g. easy pace, 2 laps", create: "Create and notify everyone", cancel: "Cancel",
      preview: "Your time: {loc} · UTC: {utc}", curRoute: "Currently loaded route", needLogin: "Sign in to use the calendar.", loading: "Loading…",
      created: "✅ Ride created.", mailed: "📧 We emailed {n} riders.", mailErr: "The ride was created, but the email notice couldn't be sent.",
      past: "Pick a time that hasn't passed yet.", own: "This route is a custom GPX: ask the organizer for the file.", loadingRoute: "Loading the route…",
      today: "Today", tomorrow: "Tomorrow", deleted: "Ride deleted.", tip: "At ride time, load the route: you'll see the others in 3D and, when close, you can video chat." },
    pt: { btn: "📅 Agenda de encontros", title: "📅 Agenda de encontros", sub: "Próximas 2 semanas · seu fuso: {tz}", now: "Agora: {loc} (seu horário) · {utc} UTC",
      propose: "＋ Propor encontro", none: "Sem encontros", join: "Vou", leave: "Não vou mais", load: "Carregar rota", del: "Apagar", going: "{n} vão", by: "propõe",
      route: "Rota", day: "Dia", hour: "Hora (seu horário)", note: "Nota (opcional)", notePh: "Ex.: ritmo tranquilo, 2 voltas", create: "Criar e avisar todos", cancel: "Cancelar",
      preview: "Seu horário: {loc} · UTC: {utc}", curRoute: "Rota carregada agora", needLogin: "Entre na sua conta para usar a agenda.", loading: "Carregando…",
      created: "✅ Encontro criado.", mailed: "📧 Avisamos por e-mail {n} ciclistas.", mailErr: "O encontro foi criado, mas o aviso por e-mail não foi enviado.",
      past: "Escolha um horário que ainda não passou.", own: "Esta rota é um GPX próprio: peça o arquivo a quem propôs o encontro.", loadingRoute: "Carregando a rota…",
      today: "Hoje", tomorrow: "Amanhã", deleted: "Encontro apagado.", tip: "Na hora do encontro, carregue a rota: você verá os outros em 3D e, perto, podem conversar por vídeo." },
  };
  const t = (k, v = {}) => String(TX[lang()][k] ?? TX.es[k] ?? k).replace(/\{(\w+)\}/g, (_, x) => v[x] ?? "");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const toast = (m, ms = 4000) => { const r = R(); r && r.toast ? r.toast(m, ms) : console.log(m); };
  const hm = (d, tz) => new Intl.DateTimeFormat(lang(), { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
  const dayKey = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const dayLabel = (d, i) => (i === 0 ? t("today") + " · " : i === 1 ? t("tomorrow") + " · " : "") + new Intl.DateTimeFormat(lang(), { timeZone: TZ, weekday: "long", day: "numeric", month: "short" }).format(d);
  const ISO = { argentina: "AR", uruguay: "UY", chile: "CL", brasil: "BR", brazil: "BR", paraguay: "PY", bolivia: "BO", peru: "PE", colombia: "CO", ecuador: "EC", venezuela: "VE", mexico: "MX",
    espana: "ES", spain: "ES", italia: "IT", italy: "IT", francia: "FR", france: "FR", portugal: "PT", alemania: "DE", germany: "DE", "reino unido": "GB", "united kingdom": "GB",
    "estados unidos": "US", "united states": "US", usa: "US", canada: "CA" };
  const flag = (p) => { const k = String(p || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(), c = ISO[k]; return c ? String.fromCodePoint(...[...c].map((x) => 0x1f1e6 + x.charCodeAt(0) - 65)) : "🏳️"; };

  const css = document.createElement("style");
  css.textContent = `
  .ag-day{margin:10px 0 4px;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--mut)}
  .ag-none{font-size:12px;color:var(--mut);opacity:.7;margin:0 0 4px 2px}
  .ag-ev{background:#141b25;border-radius:10px;padding:9px 11px;margin:5px 0}
  .ag-ev .l1{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}.ag-ev .h{font-size:18px;font-weight:800;font-variant-numeric:tabular-nums}
  .ag-ev .u{font-size:12px;color:var(--mut)}.ag-ev .r{font-weight:600}.ag-ev .n{font-size:12px;color:var(--mut);margin-top:3px}
  .ag-ev .b{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}.ag-ev .b button{padding:5px 10px;font-size:12px}
  .ag-ev.me{outline:1px solid rgba(255,106,43,.5)}
  .ag-form label{display:block;font-size:12px;color:var(--mut);margin:8px 0 3px}
  .ag-form select,.ag-form input{width:100%;background:#1a2230;color:var(--fg);border:1px solid #33415a;border-radius:8px;padding:7px;font:inherit}
  `;
  document.head.appendChild(css);

  function modal(html) {
    const old = $("ag-modal"); if (old) old.remove();
    const m = document.createElement("div"); m.className = "rv-modal rv-own"; m.id = "ag-modal";
    m.innerHTML = `<div class="rv-card wide">${html}</div>`; document.body.appendChild(m);
    m.addEventListener("keydown", (e) => e.stopPropagation()); m.addEventListener("keyup", (e) => e.stopPropagation());
    m.onclick = (e) => { if (e.target === m) m.remove(); };
    m.querySelectorAll("[data-x]").forEach((b) => (b.onclick = () => m.remove()));
    return m;
  }
  let library = null;
  async function lib() { if (library) return library; try { const j = await (await fetch("rutas/index.json", { cache: "no-cache" })).json(); library = Array.isArray(j) ? j : j.rutas || []; } catch { library = []; } return library; }

  async function open() {
    const sb = RV().sb, user = RV().user;
    const now = new Date();
    const m = modal(`<button class="rv-close" data-x>✕</button><h2>${esc(t("title"))}</h2>
      <div class="sv-meta">${esc(t("sub", { tz: TZ }))} · ${esc(t("now", { loc: hm(now, TZ), utc: hm(now, "UTC") }))}</div>
      <div class="sv-btns" style="justify-content:flex-start"><button class="primary" id="agNew">${esc(t("propose"))}</button></div>
      <div id="agBody" class="sub">${esc(user ? t("loading") : t("needLogin"))}</div>
      <div class="pz-note" style="font-size:12px;color:var(--mut);margin-top:10px">${esc(t("tip"))}</div>`);
    $("agNew").onclick = () => (user ? form() : toast(t("needLogin")));
    if (!sb || !user) return;
    const { data, error } = await sb.rpc("agenda_encuentros");
    const body = $("agBody"); if (!body) return;
    if (error) { body.textContent = "Error: " + error.message; return; }
    const byDay = new Map(); for (const e of data || []) { const k = dayKey(new Date(e.fecha)); if (!byDay.has(k)) byDay.set(k, []); byDay.get(k).push(e); }
    let html = "";
    for (let i = 0; i < 14; i++) {
      const d = new Date(now.getTime() + i * 864e5), k = dayKey(d), evs = byDay.get(k) || [];
      html += `<div class="ag-day">${esc(dayLabel(d, i))}</div>`;
      if (!evs.length) { html += `<div class="ag-none">${esc(t("none"))}</div>`; continue; }
      for (const e of evs) {
        const f = new Date(e.fecha);
        html += `<div class="ag-ev${e.es_mio ? " me" : ""}" data-id="${e.id}"><div class="l1"><span class="h">${hm(f, TZ)}</span><span class="u">${hm(f, "UTC")} UTC</span><span class="r">${esc(e.ruta)}</span></div>
          <div class="n">${flag(e.pais)} ${esc(e.apodo)} ${esc(t("by"))} · ${esc(t("going", { n: e.asistentes }))}${e.nota ? " · " + esc(e.nota) : ""}</div>
          <div class="b"><button data-a="${e.me_sumo ? "leave" : "join"}">${esc(e.me_sumo ? t("leave") : t("join"))}</button><button data-a="load">${esc(t("load"))}</button>${e.es_mio ? `<button data-a="del">${esc(t("del"))}</button>` : ""}</div></div>`;
      }
    }
    body.className = ""; body.innerHTML = html;
    body.querySelectorAll(".ag-ev").forEach((el) => {
      const e = data.find((x) => String(x.id) === el.dataset.id);
      el.querySelectorAll("button").forEach((b) => (b.onclick = async () => {
        const a = b.dataset.a;
        if (a === "join") await sb.from("encuentros_asistentes").insert({ encuentro_id: e.id });
        if (a === "leave") await sb.from("encuentros_asistentes").delete().eq("encuentro_id", e.id).eq("user_id", user.id);
        if (a === "del") { await sb.from("encuentros").delete().eq("id", e.id); toast(t("deleted")); }
        if (a === "load") return loadRoute(e);
        open();
      }));
    });
  }
  async function loadRoute(e) {
    const r = R(); if (!r) return;
    const l = (await lib()).find((x) => x.id === e.ruta_id);
    if (!l) {
      if (S().route && S().route.name === e.ruta) { const m = $("ag-modal"); if (m) m.remove(); return; }
      return toast(t("own"), 6000);
    }
    const m = $("ag-modal"); if (m) m.remove();
    toast(t("loadingRoute"), 2500);
    const txt = await (await fetch(l.archivo)).text();
    r.loadGpxFile(new File([txt], l.id + ".gpx", { type: "application/gpx+xml" }));
  }
  async function form() {
    const routes = await lib(), s = S(), cur = s && s.route ? s.route.name : null;
    const curLib = cur ? routes.find((x) => x.nombre === cur || cur.includes(x.nombre)) : null;
    const opts = [];
    if (cur && !curLib) opts.push(`<option value="cur">${esc(t("curRoute"))}: ${esc(cur)}</option>`);
    for (const x of routes) opts.push(`<option value="${esc(x.id)}"${curLib && curLib.id === x.id ? " selected" : ""}>${esc(x.nombre)}${x.pais ? " · " + esc(x.pais) : ""}</option>`);
    const days = [...Array(14).keys()].map((i) => { const d = new Date(Date.now() + i * 864e5); return `<option value="${dayKey(d)}">${esc(dayLabel(d, i))}</option>`; });
    const m = modal(`<button class="rv-close" data-x>✕</button><h2>${esc(t("propose"))}</h2><div class="ag-form">
      <label>${esc(t("route"))}</label><select id="agRoute">${opts.join("")}</select>
      <label>${esc(t("day"))}</label><select id="agDay">${days.join("")}</select>
      <label>${esc(t("hour"))} — ${esc(TZ)}</label><input type="time" id="agTime" value="19:00">
      <label>${esc(t("note"))}</label><input id="agNote" maxlength="300" placeholder="${esc(t("notePh"))}">
      <div class="sv-meta" id="agPrev" style="margin-top:8px"></div><div class="sv-status" id="agMsg"></div>
      <div class="sv-btns"><button id="agBack">${esc(t("cancel"))}</button><button class="primary" id="agGo">${esc(t("create"))}</button></div></div>`);
    $("agBack").onclick = open;
    // fecha elegida en la zona del usuario → instante UTC
    const when = () => {
      const [y, mo, d] = $("agDay").value.split("-").map(Number), [h, mi] = ($("agTime").value || "19:00").split(":").map(Number);
      let guess = Date.UTC(y, mo - 1, d, h, mi);
      for (let k = 0; k < 2; k++) {
        const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(guess)).map((x) => [x.type, x.value]));
        const asLocal = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
        guess += Date.UTC(y, mo - 1, d, h, mi) - asLocal;
      }
      return new Date(guess);
    };
    const prev = () => { const w = when(); $("agPrev").textContent = t("preview", { loc: new Intl.DateTimeFormat(lang(), { timeZone: TZ, weekday: "long", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(w), utc: new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(w) }); };
    ["agDay", "agTime"].forEach((id) => $(id).addEventListener("input", prev)); prev();
    $("agGo").onclick = async () => {
      const sb = RV().sb, w = when(), msg = $("agMsg");
      if (w.getTime() < Date.now() + 60e3) { msg.innerHTML = `<div class="err">${esc(t("past"))}</div>`; return; }
      const v = $("agRoute").value, l = routes.find((x) => x.id === v);
      const row = { ruta: l ? l.nombre : cur, ruta_id: l ? l.id : null, fecha: w.toISOString(), nota: $("agNote").value.trim() || null };
      $("agGo").disabled = true;
      const { data, error } = await sb.from("encuentros").insert(row).select("id").maybeSingle();
      if (error) { $("agGo").disabled = false; msg.innerHTML = `<div class="err">Error: ${esc(error.message)}</div>`; return; }
      await sb.from("encuentros_asistentes").insert({ encuentro_id: data.id });
      msg.innerHTML = `<div class="ok">${esc(t("created"))}</div>`;
      const r = await sb.functions.invoke("aviso-encuentro", { body: { id: data.id } });
      const ok = !r.error && r.data && r.data.ok;
      msg.innerHTML += `<div class="${ok ? "ok" : "err"}">${esc(ok ? t("mailed", { n: r.data.enviados }) : t("mailErr"))}</div>`;
      setTimeout(open, 2200);
    };
  }

  // Guardar la zona horaria del usuario para que los avisos le lleguen en su hora
  let zoneSaved = false;
  async function saveZone() {
    const sb = RV().sb, u = RV().user; if (!sb || !u || zoneSaved) return;
    zoneSaved = true;
    const p = RV().profile; if (p && p.zona === TZ) return;
    await sb.from("perfiles").update({ zona: TZ }).eq("id", u.id).then(() => { if (p) p.zona = TZ; }, () => {});
  }
  function addButton() {
    const after = $("btnRanking") || $("btnMyRides");
    if (after && !$("btnAgenda")) { const b = document.createElement("button"); b.id = "btnAgenda"; b.className = "rv-own"; after.after(b); b.onclick = open; }
    if ($("btnAgenda")) $("btnAgenda").textContent = t("btn");
  }
  let opened = false;
  function tick() {
    addButton();
    if (RV().user) saveZone();
    if (!opened && RV().user && /[?&]encuentro=\d+/.test(location.search)) { opened = true; open(); }
  }
  function start() { setInterval(tick, 1000); new MutationObserver(addButton).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] }); }
  window.__AG = { open };
  if (window.__R) start(); else addEventListener("rodillo-listo", start, { once: true });
})();
