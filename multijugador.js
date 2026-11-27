/* RutaViva — rodar con otros en la misma ruta, en vivo, y rebufo.
   Usa un canal en tiempo real de Supabase por ruta: cada ciclista manda su posición 3 veces por segundo
   y ve a los demás en la ruta. Si vas a menos de ~4 m detrás de otro, el esfuerzo baja un porcentaje
   (rebufo), tanto en la velocidad que calcula la app como en la pendiente que se manda al rodillo. */
(() => {
  "use strict";
  const R = window.__R, S = window.__S;
  if (!R || !R.makeRider || !S) { console.warn("[multijugador] falta la escena"); return; }
  const T = R.T;
  const $ = (id) => document.getElementById(id);
  const ls = { get: (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };

  // ───────────── Textos ─────────────
  let lang = ls.get("rv_lang", (navigator.language || "es").slice(0, 2)); if (!["es", "en", "pt"].includes(lang)) lang = "es";
  const TX = {
    es: { title: "RODAR CON OTROS", on: "Mostrarme y ver a otros en esta ruta", nick: "Tu nombre en la ruta", draft: "Rebufo", login: "Iniciá sesión para rodar con otros.", alone: "Nadie más en esta ruta ahora.", here: (n) => `En esta ruta ahora: ${n}`, noroute: "Cargá una ruta para ver quién está rodando.", wheel: (n, p) => `🌀 A rueda de ${n} · rebufo: −${p}% de esfuerzo`, ahead: "adelante", behind: "atrás" },
    en: { title: "RIDE WITH OTHERS", on: "Show me and see others on this route", nick: "Your name on the road", draft: "Drafting", login: "Sign in to ride with others.", alone: "Nobody else on this route right now.", here: (n) => `On this route now: ${n}`, noroute: "Load a route to see who is riding.", wheel: (n, p) => `🌀 On ${n}'s wheel · drafting: −${p}% effort`, ahead: "ahead", behind: "behind" },
    pt: { title: "PEDALAR COM OUTROS", on: "Mostrar-me e ver outros nesta rota", nick: "Seu nome na estrada", draft: "Vácuo", login: "Entre para pedalar com outros.", alone: "Ninguém mais nesta rota agora.", here: (n) => `Nesta rota agora: ${n}`, noroute: "Carregue uma rota para ver quem está pedalando.", wheel: (n, p) => `🌀 No vácuo de ${n} · −${p}% de esforço`, ahead: "à frente", behind: "atrás" },
  }[lang];

  // ───────────── Estado ─────────────
  const TAB = Math.random().toString(36).slice(2, 8);
  let enabled = ls.get("rv_multi", "1") !== "0";
  let draftPct = Math.max(0, Math.min(5, +ls.get("rv_rebufo", "2") || 0));
  let channel = null, chanKey = null, myId = null;
  const others = new Map(); // id → { root, label, q, d, dRep, v, p, cad, kit, n, last, lane }
  let drafting = null;

  function nick() {
    const rv = window.__RV, saved = ls.get("rv_nick", "");
    if (saved) return saved.slice(0, 18);
    const em = rv && rv.user && rv.user.email; return em ? em.split("@")[0].slice(0, 18) : "Ciclista";
  }
  function routeKey() {
    const r = S.route; if (!r || !r.n) return null;
    const f = (v) => Math.round(v * 1e4);
    return ["r", r.n, Math.round(r.total), f(r.lat[0]), f(r.lon[0]), f(r.lat[r.n - 1]), f(r.lon[r.n - 1])].join("_").replace(/-/g, "m");
  }
  function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); }

  // ───────────── Ciclistas de los demás ─────────────
  function nameLabel(text) {
    const c = document.createElement("canvas"); c.width = 512; c.height = 128; const g = c.getContext("2d");
    g.font = "bold 54px Inter, Arial, sans-serif"; const w = Math.min(500, g.measureText(text).width + 56);
    g.fillStyle = "rgba(16,22,30,.82)"; const x = (512 - w) / 2; g.beginPath(); g.roundRect(x, 18, w, 84, 42); g.fill();
    g.fillStyle = "#ffffff"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, 256, 62);
    const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGB;
    const m = new T.Mesh(new T.PlaneGeometry(1.6, 0.4), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    m.renderOrder = 10; return m;
  }
  function addOther(id, msg) {
    const root = R.makeRider(); R.scene.add(root);
    try { R.fx && R.fx.dressRider(root, msg.k || "rutaviva"); } catch (e) { console.warn(e); }
    const label = nameLabel(msg.n || "Ciclista"); R.scene.add(label);
    const o = { root, label, q: { wheel: 0, crank: 0, v: 0, ftp: 225, cad: 0, p: 0, grade: 0 }, d: msg.d, dRep: msg.d, v: msg.v || 0, kit: msg.k, n: msg.n, last: performance.now(), lane: (hash(id) % 3 - 1) * 0.85 };
    others.set(id, o); return o;
  }
  function removeOther(id) {
    const o = others.get(id); if (!o) return;
    R.scene.remove(o.root); R.scene.remove(o.label);
    o.root.traverse((x) => { if (x.geometry) x.geometry.dispose(); });
    o.label.material.map.dispose(); o.label.geometry.dispose();
    others.delete(id);
  }
  function clearOthers() { for (const id of [...others.keys()]) removeOther(id); }

  function onPos(msg) {
    if (!msg || !msg.id || msg.id === myId || msg.key !== chanKey) return;
    let o = others.get(msg.id);
    if (o && (o.kit !== msg.k || o.n !== msg.n)) { removeOther(msg.id); o = null; }
    if (!o) o = addOther(msg.id, msg);
    o.dRep = msg.d; o.v = msg.v || 0; o.q.p = msg.p || 0; o.q.cad = msg.c || 0; o.last = performance.now();
    if (Math.abs(o.d - o.dRep) > 60) o.d = o.dRep; // salto grande (reinicio): ir directo
  }

  // ───────────── Canal en tiempo real ─────────────
  function sbClient() { const rv = window.__RV; return rv && rv.sb && rv.user ? rv.sb : null; }
  function leave() {
    if (channel) { try { channel.untrack(); } catch {} try { sbClient() && sbClient().removeChannel(channel); } catch {} }
    channel = null; chanKey = null; clearOthers(); refreshList();
  }
  function join(key) {
    const sb = sbClient(); if (!sb) return;
    leave(); chanKey = key; myId = window.__RV.user.id + ":" + TAB;
    channel = sb.channel("ruta:" + key, { config: { broadcast: { self: false }, presence: { key: myId } } });
    channel.on("broadcast", { event: "pos" }, ({ payload }) => onPos(payload));
    channel.on("broadcast", { event: "bye" }, ({ payload }) => payload && removeOther(payload.id));
    channel.on("broadcast", { event: "rtc" }, ({ payload }) => { if (payload && payload.to === myId) rtcHandlers.forEach((h) => { try { h(payload); } catch (e) { console.warn(e); } }); });
    channel.on("presence", { event: "sync" }, refreshList);
    channel.on("presence", { event: "leave" }, ({ key: k }) => { removeOther(k); refreshList(); });
    channel.subscribe((st) => { if (st === "SUBSCRIBED") { channel.track({ n: nick(), k: kitId() }); sendPos(true); } });
  }
  function kitId() { try { return R.fx.currentKit(); } catch { return "rutaviva"; } }
  let lastSend = 0;
  function sendPos(force) {
    if (!channel || !chanKey) return;
    const now = performance.now(), period = S.riding ? 333 : 2000;
    if (!force && now - lastSend < period) return;
    lastSend = now;
    channel.send({ type: "broadcast", event: "pos", payload: { id: myId, key: chanKey, n: nick(), k: kitId(), d: +S.d.toFixed(1), v: +(S.v || 0).toFixed(2), p: Math.round(S.pow3 || S.tPower || (S.riding ? S.simPower : 0) || 0), c: Math.round(S.tCad || (S.riding && S.simPower > 0 ? 88 : 0)) } });
  }
  let testMode = false;
  function syncChannel() {
    if (testMode) return;
    const want = enabled && sbClient() ? routeKey() : null;
    if (want !== chanKey) { if (want) join(want); else leave(); }
    refreshList();
  }
  addEventListener("beforeunload", () => { try { channel && channel.send({ type: "broadcast", event: "bye", payload: { id: myId } }); } catch {} });

  // ───────────── Cada cuadro: mover a los demás y calcular el rebufo ─────────────
  const pA = new T.Vector3(), up = new T.Vector3(0, 1, 0);
  let lastT = performance.now();
  function frame(t) {
    const dt = Math.min(0.1, Math.max(0, (t - lastT) / 1000)); lastT = t;
    try {
      const now = performance.now();
      for (const [id, o] of others) {
        if (now - o.last > 12000) { removeOther(id); continue; }
        if (!S.route) continue;
        // avanzar con su velocidad y corregir suave hacia lo último que mandó
        o.dRep += o.v * dt; o.d += o.v * dt + (o.dRep - o.d) * Math.min(1, dt * 2);
        o.d = Math.max(0, Math.min(S.route.total, o.d));
        const e = R.Me(o.d), f = R.Me(Math.min(S.route.total, o.d + 12)), b = R.Me(Math.max(0, o.d - 12));
        const dir = new T.Vector3(f.x - b.x, 0, f.z - b.z).normalize(), side = new T.Vector3(-dir.z, 0, dir.x);
        // si va a rueda de alguien (o yo de él), se alinea en el mismo carril
        const gapMe = S.d - o.d, lane = Math.abs(gapMe) < 6 ? 0 : o.lane;
        pA.set(e.x, e.y + 0.25, e.z).addScaledVector(side, lane);
        o.root.position.copy(pA); o.root.lookAt(pA.x + dir.x, pA.y + (f.y - b.y) / 24, pA.z + dir.z);
        o.q.v = o.v; o.q.grade = e.grade; R.animRider(dt, o.root, o.q);
        o.label.position.set(pA.x, pA.y + 2.15, pA.z); o.label.quaternion.copy(R.camera.quaternion);
        { const dc = R.camera.position.distanceTo(o.label.position), k = Math.max(1, dc / 20); o.label.scale.setScalar(k); o.label.position.y += (k - 1) * 0.25; }
        o.root.visible = o.label.visible = true;
      }
      // rebufo: el más cercano adelante a menos de 4 m (y más de 0,3 m)
      let best = null, bestGap = 1e9;
      if (S.riding && draftPct > 0) for (const o of others.values()) { const g = o.d - S.d; if (g > 0.3 && g < 4 && g < bestGap) { best = o; bestGap = g; } }
      const dk = best ? draftPct / 100 : 0;
      S.draft = dk;
      if (dk) {
        const m = (S.riderMass || 75) + (S.bikeMass || 8), aero = 0.5 * 1.2 * (S.cda || 0.32) * (S.v || 0) ** 2, gr = R.Me(S.d).grade;
        S.draftGrade = dk * Math.max(0, gr * (S.difficulty ?? 0.5) + (S.crr || 0.004) + aero / (m * 9.81));
      } else S.draftGrade = 0;
      if ((best && best.n) !== (drafting && drafting.n)) { drafting = best; showDraft(); }
      sendPos(false);
    } catch (e) { console.warn("[multijugador]", e); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  // para pruebas locales: simular el mensaje de otro ciclista
  const rtcHandlers = [];
  window.__MJ = { inject: (msg) => { testMode = true; if (!chanKey) chanKey = msg.key = routeKey(); else msg.key = chanKey; onPos(msg); }, others,
    get myId() { return myId || window.__MJ_TESTID || null; }, get online() { return !!(channel && chanKey) || testMode; },
    onRtc: (fn) => rtcHandlers.push(fn), deliverRtc: (p) => rtcHandlers.forEach((h) => h(p)),
    sendRtc: (payload) => { if (testMode && window.__MJ_RELAY) return window.__MJ_RELAY(Object.assign({ from: window.__MJ_TESTID }, payload)); if (channel) channel.send({ type: "broadcast", event: "rtc", payload: Object.assign({ from: myId }, payload) }); } };

  // ───────────── Interfaz ─────────────
  let badge = null;
  function showDraft() {
    if (!badge) {
      badge = document.createElement("div"); badge.className = "rv-own"; badge.id = "rvDraft";
      badge.style.cssText = "position:fixed;left:50%;top:150px;transform:translateX(-50%);z-index:30;padding:8px 16px;border-radius:999px;background:rgba(255,106,43,.92);color:#fff;font-weight:700;font-size:15px;box-shadow:0 6px 20px rgba(0,0,0,.35);display:none;pointer-events:none";
      document.body.appendChild(badge);
    }
    if (drafting) { badge.textContent = TX.wheel(drafting.n || "?", draftPct); badge.style.display = "block"; } else badge.style.display = "none";
  }
  function refreshList() {
    const el = $("rvMultiList"); if (!el) return;
    if (!sbClient()) { el.textContent = TX.login; return; }
    if (!S.route) { el.textContent = TX.noroute; return; }
    if (!enabled) { el.textContent = ""; return; }
    let names = [];
    try { const st = channel ? channel.presenceState() : {}; names = Object.entries(st).filter(([k]) => k !== myId).map(([, v]) => (v[0] && v[0].n) || "?"); } catch {}
    if (!names.length) { el.textContent = TX.alone; return; }
    el.innerHTML = "";
    const h = document.createElement("div"); h.textContent = TX.here(names.length); el.appendChild(h);
    for (const [, o] of others) {
      const g = o.d - S.d, row = document.createElement("div");
      row.textContent = `• ${o.n} — ${Math.abs(g) < 1000 ? Math.round(Math.abs(g)) + " m" : (Math.abs(g) / 1000).toFixed(1) + " km"} ${g >= 0 ? TX.ahead : TX.behind} · ${Math.round(o.q.p)} W`;
      el.appendChild(row);
    }
  }
  setInterval(refreshList, 1000);
  function addPanel() {
    if ($("rvMulti")) return;
    const anchor = $("rvKit"); if (!anchor) return setTimeout(addPanel, 500);
    const wrap = document.createElement("div"); wrap.id = "rvMulti"; wrap.className = "rv-own";
    wrap.innerHTML = `<h3 style="margin:14px 0 6px;font-size:12px;letter-spacing:.08em;color:var(--mut,#9aa4b2)">${TX.title}</h3>
      <div class="row"><label><input type="checkbox" id="rvMultiOn"> ${TX.on}</label></div>
      <div class="row"><label>${TX.nick} <input id="rvNick" maxlength="18" style="width:130px"></label></div>
      <div class="row"><label>${TX.draft} <input type="range" id="rvDraftPct" min="0" max="5" step="0.5" style="width:110px"> <b id="rvDraftLbl"></b></label></div>
      <div class="st" id="rvMultiList"></div>`;
    (anchor.closest(".row").parentElement).appendChild(wrap);
    const on = $("rvMultiOn"), nk = $("rvNick"), rg = $("rvDraftPct"), lb = $("rvDraftLbl");
    on.checked = enabled; nk.value = ls.get("rv_nick", ""); nk.placeholder = nick(); rg.value = draftPct; lb.textContent = draftPct + "%";
    on.onchange = () => { enabled = on.checked; ls.set("rv_multi", enabled ? "1" : "0"); syncChannel(); };
    nk.onchange = () => { ls.set("rv_nick", nk.value.trim()); if (channel) { channel.track({ n: nick(), k: kitId() }); sendPos(true); } };
    rg.oninput = () => { draftPct = +rg.value; lb.textContent = draftPct + "%"; ls.set("rv_rebufo", String(draftPct)); showDraft(); };
    const kit = $("rvKit"); if (kit) kit.addEventListener("change", () => setTimeout(() => { if (channel) { channel.track({ n: nick(), k: kitId() }); sendPos(true); } }, 50));
    refreshList();
  }
  addPanel();
  // revisa ruta y sesión: cambiar de ruta cambia de canal
  setInterval(syncChannel, 1500);
})();
