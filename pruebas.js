/* RutaViva — pruebas y zonas de entrenamiento.
   - Test de FTP de 20 minutos (FTP = 95% de la potencia media de los 20').
   - Test de FC máxima y umbral (Friel: umbral = FC media de los últimos 20' de un esfuerzo de 30'; FC máx en el sprint final).
   - Calibración simple a cero: soltás los pedales, cuenta 3 segundos quieto y calibra.
   Las pruebas corren en un óvalo plano, sin pendiente, que da vueltas hasta que termina la prueba.
   Usa window.__S (estado) y window.__R (loadPoints, loadWorkout, zeroCal, toast). */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const S = () => window.__S, R = () => window.__R;
  const lang = () => (["es", "en", "pt"].includes(document.documentElement.lang) ? document.documentElement.lang : "es");
  const TX = {
    es: {
      section: "Pruebas y zonas", ftpBtn: "⚡ Test de FTP (20 min)", hrBtn: "❤️ Test de FC máx y umbral", zonesBtn: "📊 Mis zonas", zeroBtn: "🎯 Calibrar a cero",
      info: "FTP {ftp} W · Umbral {lthr} ppm · FC máx {max}",
      needTrainer: "Conectá el rodillo primero.", needHr: "Conectá el pulsómetro primero: esta prueba mide tu frecuencia cardíaca.",
      ftpTitle: "⚡ Test de FTP de 20 minutos", hrTitle: "❤️ Test de FC máxima y umbral",
      ftpDesc: "Se corre en un óvalo plano. Son unos 50 minutos: entrada en calor guiada, 3 activaciones cortas, y después <b>20 minutos a fondo y parejo</b> (el rodillo queda libre: vos manejás el esfuerzo con los cambios). Al final calculamos tu FTP (95% de la potencia media de esos 20') y tus zonas de potencia.",
      hrDesc: "Se corre en un óvalo plano. Son unos 55 minutos: entrada en calor, <b>30 minutos al máximo esfuerzo que puedas sostener</b> y un <b>sprint final de 1 minuto</b> con todo. Tu umbral es la FC media de los últimos 20' del bloque de 30', y tu FC máxima es la más alta que registremos. Necesitás el pulsómetro conectado.",
      tips: "Arrancá descansado, con agua a mano y ventilador. No salgas demasiado fuerte: es mejor ir parejo y apretar al final.",
      safety: "⚠️ Es una prueba máxima: hacela solo si estás sano y entrenado. Cortá enseguida si sentís dolor de pecho, falta de aire fuera de lo normal o mareos.",
      start: "▶ Empezar", cancel: "Cancelar", close: "Cerrar", loading: "Preparando el óvalo plano…",
      ready: "Listo: dale ▶ Iniciar (o empezá a pedalear) para arrancar la prueba.",
      ovalFtp: "Óvalo plano — Test de FTP", ovalHr: "Óvalo plano — Test de FC",
      wu: "Entrada en calor", act: "Activación", easy: "Suave", prog: "Progresivo",
      ftpBlock: "TEST 20' — a fondo y parejo (libre)", hrBlock: "30' sostenido a fondo (libre)", sprint: "Sprint final 1' — todo lo que tengas (libre)", cd: "Vuelta a la calma",
      live: "Prueba en curso", avg: "Potencia media", est: "FTP estimado", hrNow: "Pulso", hrAvg: "FC media (umbral)", hrMax: "FC máx",
      left: "quedan", block: "Bloque",
      ftpRes: "⚡ Tu FTP", hrRes: "❤️ Tu umbral y FC máxima",
      ftpLine: "Potencia media en los 20': <b>{p} W</b> → FTP <b>{ftp} W</b> ({wkg} W/kg)", hrLine: "Umbral (FC media de los últimos 20'): <b>{lthr} ppm</b> · FC máxima: <b>{max} ppm</b>",
      short: "⚠️ La prueba se cortó antes de tiempo ({min} min de {req}). El resultado es solo orientativo.",
      saveFtp: "💾 Guardar como mi FTP", saveHr: "💾 Guardar umbral y FC máx", saved: "Guardado. Los entrenamientos y zonas ya usan estos valores.",
      zonesTitle: "📊 Mis zonas de entrenamiento", pZones: "Zonas de potencia (FTP {ftp} W)", hZones: "Zonas de frecuencia cardíaca (umbral {lthr} ppm)", noMax: "Hacé el test de FC para conocer tu FC máxima.",
      history: "Últimas pruebas", none: "Todavía no hiciste pruebas.",
      pz: ["Recuperación", "Resistencia", "Tempo", "Umbral", "VO2máx", "Anaeróbico", "Neuromuscular"],
      hz: ["Recuperación", "Aeróbico", "Tempo", "Subumbral", "Supraumbral", "Capacidad aeróbica", "Potencia anaeróbica"],
      zeroTitle: "🎯 Calibrar a cero", zeroDo: "Soltá los pedales, no pedalees y no toques el rodillo.", zeroMoving: "⚠️ El rodillo se está moviendo: soltá los pedales y esperá.",
      zeroWait: "Quieto… calibrando en {n}", zeroSending: "Calibrando… el rodillo contesta en unos segundos.", zeroOk: "✅ Listo, rodillo calibrado a cero.",
      zeroBt: "Por esta conexión (Bluetooth) el rodillo no deja calibrar a cero. Conectalo por ANT+ o usá la calibración avanzada.",
      zeroNoData: "El rodillo todavía no responde. Dale unas pedaleadas, soltá y probá de nuevo.", zeroErr: "No se pudo calibrar: ",
      cancelled: "Prueba cancelada.",
    },
    en: {
      section: "Tests & zones", ftpBtn: "⚡ FTP test (20 min)", hrBtn: "❤️ Max HR & threshold test", zonesBtn: "📊 My zones", zeroBtn: "🎯 Zero calibration",
      info: "FTP {ftp} W · Threshold {lthr} bpm · Max HR {max}",
      needTrainer: "Connect the trainer first.", needHr: "Connect your heart rate monitor first: this test measures your heart rate.",
      ftpTitle: "⚡ 20-minute FTP test", hrTitle: "❤️ Max HR & threshold test",
      ftpDesc: "It runs on a flat oval. About 50 minutes: guided warm-up, 3 short openers, then <b>20 minutes hard and steady</b> (the trainer is free: you control the effort with your gears). At the end we compute your FTP (95% of the average power of those 20') and your power zones.",
      hrDesc: "It runs on a flat oval. About 55 minutes: warm-up, <b>30 minutes at the hardest effort you can hold</b> and a <b>1-minute all-out final sprint</b>. Your threshold is the average HR of the last 20' of the 30' block, and your max HR is the highest we record. You need a heart rate monitor.",
      tips: "Start rested, with water and a fan. Don't go out too hard: better steady and push at the end.",
      safety: "⚠️ This is a maximal test: only do it if you're healthy and trained. Stop immediately if you feel chest pain, unusual shortness of breath or dizziness.",
      start: "▶ Start", cancel: "Cancel", close: "Close", loading: "Setting up the flat oval…",
      ready: "Ready: hit ▶ Start (or start pedalling) to begin the test.",
      ovalFtp: "Flat oval — FTP test", ovalHr: "Flat oval — HR test",
      wu: "Warm-up", act: "Opener", easy: "Easy", prog: "Progressive",
      ftpBlock: "20' TEST — hard and steady (free)", hrBlock: "30' sustained hard (free)", sprint: "1' final sprint — everything you have (free)", cd: "Cool-down",
      live: "Test in progress", avg: "Avg power", est: "Estimated FTP", hrNow: "Heart rate", hrAvg: "Avg HR (threshold)", hrMax: "Max HR",
      left: "left", block: "Block",
      ftpRes: "⚡ Your FTP", hrRes: "❤️ Your threshold and max HR",
      ftpLine: "Average power over 20': <b>{p} W</b> → FTP <b>{ftp} W</b> ({wkg} W/kg)", hrLine: "Threshold (avg HR of the last 20'): <b>{lthr} bpm</b> · Max HR: <b>{max} bpm</b>",
      short: "⚠️ The test ended early ({min} of {req} min). The result is only a guide.",
      saveFtp: "💾 Save as my FTP", saveHr: "💾 Save threshold and max HR", saved: "Saved. Workouts and zones now use these values.",
      zonesTitle: "📊 My training zones", pZones: "Power zones (FTP {ftp} W)", hZones: "Heart rate zones (threshold {lthr} bpm)", noMax: "Do the HR test to know your max HR.",
      history: "Recent tests", none: "No tests yet.",
      pz: ["Recovery", "Endurance", "Tempo", "Threshold", "VO2max", "Anaerobic", "Neuromuscular"],
      hz: ["Recovery", "Aerobic", "Tempo", "Sub-threshold", "Super-threshold", "Aerobic capacity", "Anaerobic power"],
      zeroTitle: "🎯 Zero calibration", zeroDo: "Let go of the pedals, don't pedal and don't touch the trainer.", zeroMoving: "⚠️ The trainer is moving: let go of the pedals and wait.",
      zeroWait: "Still… calibrating in {n}", zeroSending: "Calibrating… the trainer answers in a few seconds.", zeroOk: "✅ Done, trainer zeroed.",
      zeroBt: "Over this connection (Bluetooth) the trainer can't be zeroed. Connect it via ANT+ or use advanced calibration.",
      zeroNoData: "The trainer isn't responding yet. Pedal a bit, stop and try again.", zeroErr: "Couldn't calibrate: ",
      cancelled: "Test cancelled.",
    },
    pt: {
      section: "Testes e zonas", ftpBtn: "⚡ Teste de FTP (20 min)", hrBtn: "❤️ Teste de FC máx e limiar", zonesBtn: "📊 Minhas zonas", zeroBtn: "🎯 Calibrar a zero",
      info: "FTP {ftp} W · Limiar {lthr} bpm · FC máx {max}",
      needTrainer: "Conecte o rolo primeiro.", needHr: "Conecte o monitor cardíaco primeiro: este teste mede sua frequência cardíaca.",
      ftpTitle: "⚡ Teste de FTP de 20 minutos", hrTitle: "❤️ Teste de FC máxima e limiar",
      ftpDesc: "Roda num oval plano. Uns 50 minutos: aquecimento guiado, 3 ativações curtas e depois <b>20 minutos forte e constante</b> (o rolo fica livre: você controla o esforço com as marchas). No final calculamos seu FTP (95% da potência média desses 20') e suas zonas de potência.",
      hrDesc: "Roda num oval plano. Uns 55 minutos: aquecimento, <b>30 minutos no maior esforço que conseguir sustentar</b> e um <b>sprint final de 1 minuto</b>. Seu limiar é a FC média dos últimos 20' do bloco de 30', e sua FC máxima é a mais alta registrada. Precisa do monitor cardíaco.",
      tips: "Comece descansado, com água e ventilador. Não saia forte demais: melhor constante e apertar no final.",
      safety: "⚠️ É um teste máximo: faça só se estiver saudável e treinado. Pare na hora se sentir dor no peito, falta de ar fora do normal ou tontura.",
      start: "▶ Começar", cancel: "Cancelar", close: "Fechar", loading: "Preparando o oval plano…",
      ready: "Pronto: toque em ▶ Iniciar (ou comece a pedalar) para começar o teste.",
      ovalFtp: "Oval plano — Teste de FTP", ovalHr: "Oval plano — Teste de FC",
      wu: "Aquecimento", act: "Ativação", easy: "Leve", prog: "Progressivo",
      ftpBlock: "TESTE 20' — forte e constante (livre)", hrBlock: "30' sustentado forte (livre)", sprint: "Sprint final 1' — tudo o que tiver (livre)", cd: "Volta à calma",
      live: "Teste em andamento", avg: "Potência média", est: "FTP estimado", hrNow: "Pulso", hrAvg: "FC média (limiar)", hrMax: "FC máx",
      left: "faltam", block: "Bloco",
      ftpRes: "⚡ Seu FTP", hrRes: "❤️ Seu limiar e FC máxima",
      ftpLine: "Potência média nos 20': <b>{p} W</b> → FTP <b>{ftp} W</b> ({wkg} W/kg)", hrLine: "Limiar (FC média dos últimos 20'): <b>{lthr} bpm</b> · FC máxima: <b>{max} bpm</b>",
      short: "⚠️ O teste terminou antes ({min} de {req} min). O resultado é só orientativo.",
      saveFtp: "💾 Salvar como meu FTP", saveHr: "💾 Salvar limiar e FC máx", saved: "Salvo. Os treinos e zonas já usam esses valores.",
      zonesTitle: "📊 Minhas zonas de treino", pZones: "Zonas de potência (FTP {ftp} W)", hZones: "Zonas de frequência cardíaca (limiar {lthr} bpm)", noMax: "Faça o teste de FC para saber sua FC máxima.",
      history: "Últimos testes", none: "Você ainda não fez testes.",
      pz: ["Recuperação", "Resistência", "Tempo", "Limiar", "VO2máx", "Anaeróbico", "Neuromuscular"],
      hz: ["Recuperação", "Aeróbico", "Tempo", "Sublimiar", "Supralimiar", "Capacidade aeróbica", "Potência anaeróbica"],
      zeroTitle: "🎯 Calibrar a zero", zeroDo: "Solte os pedais, não pedale e não toque no rolo.", zeroMoving: "⚠️ O rolo está se movendo: solte os pedais e espere.",
      zeroWait: "Parado… calibrando em {n}", zeroSending: "Calibrando… o rolo responde em alguns segundos.", zeroOk: "✅ Pronto, rolo calibrado a zero.",
      zeroBt: "Por esta conexão (Bluetooth) o rolo não deixa calibrar a zero. Conecte por ANT+ ou use a calibração avançada.",
      zeroNoData: "O rolo ainda não responde. Pedale um pouco, pare e tente de novo.", zeroErr: "Não foi possível calibrar: ",
      cancelled: "Teste cancelado.",
    },
  };
  const t = (k, v = {}) => { const x = TX[lang()][k] ?? TX.es[k] ?? k; return typeof x === "string" ? x.replace(/\{(\w+)\}/g, (_, y) => v[y] ?? "") : x; };
  const toast = (m, ms = 4000) => { const r = R(); r && r.toast ? r.toast(m, ms) : console.log(m); };
  const fmt = (s) => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
  const el = (h) => { const d = document.createElement("div"); d.innerHTML = h.trim(); return d.firstElementChild; };
  const hrFresh = () => { const s = S(); return s && s.hr && performance.now() - (s.lastHr || 0) < 5000 ? s.hr : null; };
  const store = { get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };

  const css = document.createElement("style");
  css.textContent = `
  .pz-tab{width:100%;border-collapse:collapse;font-size:13px;margin:6px 0 12px}
  .pz-tab td{padding:5px 8px;border-bottom:1px solid rgba(255,255,255,.07)}
  .pz-tab td:first-child{width:8px;padding:0}.pz-tab td:last-child{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
  .pz-res{font-size:15px;line-height:1.6;margin:8px 0}
  .pz-note{font-size:12px;color:var(--mut);line-height:1.5;margin:8px 0}
  .pz-warn{font-size:12px;color:var(--warn);line-height:1.5;margin:8px 0}
  #pzLive{position:fixed;left:50%;top:196px;transform:translateX(-50%);padding:8px 14px;font-size:13px;display:none;z-index:5;text-align:center;min-width:300px}
  #pzLive b{font-size:18px;font-variant-numeric:tabular-nums}
  #pzLive .r{display:flex;gap:16px;justify-content:center;margin-top:3px}
  .pz-zero{font-size:56px;font-weight:800;text-align:center;margin:8px 0;font-variant-numeric:tabular-nums}
  `;
  document.head.appendChild(css);

  function modal(id, html) {
    const old = $(id); if (old) old.remove();
    const m = el(`<div class="rv-modal rv-own" id="${id}"><div class="rv-card wide">${html}</div></div>`);
    document.body.appendChild(m);
    m.addEventListener("keydown", (e) => e.stopPropagation()); m.addEventListener("keyup", (e) => e.stopPropagation());
    m.querySelectorAll("[data-x]").forEach((b) => (b.onclick = () => m.remove()));
    return m;
  }

  // ───────────────────────── Zonas ─────────────────────────
  const PZ = [[0, 0.55, "#7f8ea3"], [0.56, 0.75, "#3d8bfd"], [0.76, 0.9, "#3ccf7a"], [0.91, 1.05, "#ffd23d"], [1.06, 1.2, "#ff8a2b"], [1.21, 1.5, "#ff3b3b"], [1.51, null, "#b44dff"]];
  const HZ = [[0, 0.8, "#7f8ea3"], [0.81, 0.89, "#3d8bfd"], [0.9, 0.93, "#3ccf7a"], [0.94, 0.99, "#ffd23d"], [1.0, 1.02, "#ff8a2b"], [1.03, 1.06, "#ff3b3b"], [1.07, null, "#b44dff"]];
  const HZN = ["Z1", "Z2", "Z3", "Z4", "Z5a", "Z5b", "Z5c"];
  function zoneTable(defs, names, base, unit, labels, max) {
    return `<table class="pz-tab">${defs.map(([a, b, c], i) => {
      const lo = Math.round(a * base), hi = b ? Math.round(b * base) : null;
      const rng = i === 0 ? `< ${hi + 1} ${unit}` : hi ? `${lo}–${hi} ${unit}` : `> ${lo - 1} ${unit}${max ? ` (máx ${max})` : ""}`;
      return `<tr><td style="background:${c}"></td><td><b>${names[i]}</b> ${labels[i]}</td><td>${rng}</td></tr>`;
    }).join("")}</table>`;
  }
  function openZones() {
    const s = S(), ftp = s.ftp, lthr = s.lthr, max = store.get("rv_fcmax", null), hist = store.get("rv_pruebas", []);
    const m = modal("pz-zones", `<button class="rv-close" data-x>✕</button><h2>${t("zonesTitle")}</h2>
      <div class="pz-note"><b>${t("pZones", { ftp })}</b></div>${zoneTable(PZ, PZ.map((_, i) => "Z" + (i + 1)), ftp, "W", t("pz"))}
      <div class="pz-note"><b>${t("hZones", { lthr })}</b>${max ? ` · ${t("hrMax")} ${max} ppm` : ""}</div>${zoneTable(HZ, HZN, lthr, "ppm", t("hz"), max)}
      ${max ? "" : `<div class="pz-note">${t("noMax")}</div>`}
      <div class="pz-note"><b>${t("history")}</b><br>${hist.length ? hist.slice(-6).reverse().map((h) => `${new Date(h.fecha).toLocaleDateString(lang())} · ${h.tipo === "ftp" ? `FTP ${h.ftp} W` : `${t("hrAvg")} ${h.lthr} · ${t("hrMax")} ${h.max}`}`).join("<br>") : t("none")}</div>
      <div class="sv-btns"><button class="primary" data-x>${t("close")}</button></div>`);
    return m;
  }

  // ───────────────────────── Óvalo plano ─────────────────────────
  function ovalPoints() {
    const lat0 = -34.55, lon0 = -58.45, k = Math.cos((lat0 * Math.PI) / 180), M = 111320;
    const L = 400, Rr = 90, pts = [], per = 2 * L + 2 * Math.PI * Rr, n = 260;
    for (let i = 0; i <= n; i++) {
      let s = (i / n) * per, x, z;
      if (s < L) { x = -L / 2 + s; z = -Rr; }
      else if ((s -= L) < Math.PI * Rr) { const a = -Math.PI / 2 + s / Rr; x = L / 2 + Rr * Math.cos(a); z = Rr * Math.sin(a); }
      else if ((s -= Math.PI * Rr) < L) { x = L / 2 - s; z = Rr; }
      else { s -= L; const a = Math.PI / 2 + s / Rr; x = -L / 2 + Rr * Math.cos(a); z = Rr * Math.sin(a); }
      pts.push({ lat: lat0 + z / M, lon: lon0 + x / (M * k), ele: 25 });
    }
    return pts;
  }

  // ───────────────────────── Pruebas ─────────────────────────
  let test = null;
  function steps(kind, F) {
    const w = (f) => Math.round(f * F);
    if (kind === "ftp") return [
      { label: t("wu"), kind: "warmup", dur: 600, watts: w(0.55) },
      ...[1, 2, 3].flatMap(() => [{ label: t("act"), kind: "interval", dur: 60, watts: w(1.0) }, { label: t("easy"), kind: "recovery", dur: 60, watts: w(0.5) }]),
      { label: t("easy"), kind: "recovery", dur: 300, watts: w(0.5) },
      { label: t("ftpBlock"), kind: "interval", dur: 1200, watts: 0, src: "test" },
      { label: t("cd"), kind: "cooldown", dur: 600, watts: w(0.45) },
    ];
    return [
      { label: t("wu"), kind: "warmup", dur: 600, watts: w(0.55) },
      { label: t("prog"), kind: "warmup", dur: 300, watts: w(0.7) },
      { label: t("hrBlock"), kind: "interval", dur: 1800, watts: 0, src: "test" },
      { label: t("sprint"), kind: "interval", dur: 60, watts: 0, src: "sprint" },
      { label: t("cd"), kind: "cooldown", dur: 600, watts: w(0.45) },
    ];
  }
  function askTest(kind) {
    const s = S(); if (!s || !R()) return;
    if (!s.trainer) return toast(t("needTrainer"));
    if (kind === "hr" && !hrFresh()) return toast(t("needHr"), 5000);
    const m = modal("pz-ask", `<button class="rv-close" data-x>✕</button><h2>${t(kind === "ftp" ? "ftpTitle" : "hrTitle")}</h2>
      <div class="pz-res" style="font-size:14px">${t(kind === "ftp" ? "ftpDesc" : "hrDesc")}</div>
      <div class="pz-note">${t("tips")}</div><div class="pz-warn">${t("safety")}</div>
      <div class="sv-btns"><button data-x>${t("cancel")}</button><button class="primary" id="pzGo">${t("start")}</button></div>`);
    $("pzGo").onclick = () => { m.remove(); startTest(kind); };
  }
  async function startTest(kind) {
    const s = S(), r = R();
    if (s.riding && $("btnStart")) $("btnStart").click();
    toast(t("loading"), 2500);
    const name = t(kind === "ftp" ? "ovalFtp" : "ovalHr");
    r.loadPoints(ovalPoints(), name, { tiles: false, demo: true });
    for (let i = 0; i < 80 && !(s.route && s.route.name === name && !s.loading); i++) await new Promise((ok) => setTimeout(ok, 250));
    const st = steps(kind, s.ftp);
    r.loadWorkout(JSON.stringify({ format: "rodillo3d-workout", name, steps: st.map(({ src, ...x }) => x) }), name);
    test = { kind, w: s.workout, testIdx: st.findIndex((x) => x.src === "test"), sprintIdx: st.findIndex((x) => x.src === "sprint"),
      pSum: 0, pT: 0, hSum: 0, hT: 0, hrMax: 0, done: false, req: st.find((x) => x.src === "test").dur };
    toast(t("ready"), 6000);
  }
  function stepStart(w, idx) { let a = 0; for (let i = 0; i < idx; i++) a += w.steps[i].dur; return a; }
  let lastTick = performance.now();
  function tick() {
    const now = performance.now(), dt = Math.min(1, (now - lastTick) / 1000); lastTick = now;
    const s = S(), live = $("pzLive");
    if (!test || !s) { if (live) live.style.display = "none"; return; }
    const w = s.workout;
    if (w !== test.w) { test = null; if (live) live.style.display = "none"; return; } // cambió o se borró el entrenamiento
    const idx = w.idx, inStep = w.t - stepStart(w, idx), hr = hrFresh();
    if (s.riding && !w.done) {
      if (hr && hr > test.hrMax) test.hrMax = hr;
      if (idx === test.testIdx) {
        test.pSum += (s.pow3 || 0) * dt; test.pT += dt;
        if (hr && (test.kind === "ftp" || inStep >= 600)) { test.hSum += hr * dt; test.hT += dt; }
      }
    }
    const finishedAt = test.kind === "ftp" ? test.testIdx : test.sprintIdx;
    if (!test.done && (idx > finishedAt || w.done) && test.pT + test.hT > 0) { test.done = true; showResult(); }
    // cartel en vivo
    if (live) {
      const showLive = !test.done && idx >= test.testIdx && idx <= finishedAt;
      live.style.display = showLive ? "block" : "none";
      if (showLive) {
        const left = w.steps[idx].dur - inStep, avg = test.pT ? test.pSum / test.pT : 0;
        live.innerHTML = test.kind === "ftp"
          ? `<div>${t("live")} · ${t("block")} ${fmt(inStep)} · ${t("left")} ${fmt(left)}</div><div class="r"><span>${t("avg")} <b>${Math.round(avg)} W</b></span><span>${t("est")} <b>${Math.round(avg * 0.95)} W</b></span>${hr ? `<span>${t("hrNow")} <b>${hr}</b></span>` : ""}</div>`
          : `<div>${t("live")} · ${w.steps[idx].label} · ${t("left")} ${fmt(left)}</div><div class="r"><span>${t("hrNow")} <b>${hr || "--"}</b></span><span>${t("hrAvg")} <b>${test.hT ? Math.round(test.hSum / test.hT) : "--"}</b></span><span>${t("hrMax")} <b>${test.hrMax || "--"}</b></span></div>`;
      }
    }
  }
  function showResult() {
    const s = S(), x = test, hist = store.get("rv_pruebas", []);
    const shortMin = Math.round(x.pT / 60), short = x.pT < x.req * 0.9 ? `<div class="pz-warn">${t("short", { min: shortMin, req: Math.round(x.req / 60) })}</div>` : "";
    if (x.kind === "ftp") {
      const avg = Math.round(x.pSum / Math.max(1, x.pT)), ftp = Math.round(avg * 0.95), wkg = (ftp / (s.riderMass || 75)).toFixed(2);
      const m = modal("pz-res", `<button class="rv-close" data-x>✕</button><h2>${t("ftpRes")}</h2>
        <div class="pz-res">${t("ftpLine", { p: avg, ftp, wkg })}</div>${short}
        <div class="pz-note"><b>${t("pZones", { ftp })}</b></div>${zoneTable(PZ, PZ.map((_, i) => "Z" + (i + 1)), ftp, "W", t("pz"))}
        <div class="sv-status"></div><div class="sv-btns"><button data-x>${t("close")}</button><button class="primary" id="pzSave">${t("saveFtp")}</button></div>`);
      $("pzSave").onclick = () => { setInput("numFtp", ftp); hist.push({ tipo: "ftp", fecha: Date.now(), ftp, p20: avg }); store.set("rv_pruebas", hist.slice(-30)); m.querySelector(".sv-status").textContent = t("saved"); $("pzSave").disabled = true; info(); };
    } else {
      const lthr = x.hT ? Math.round(x.hSum / x.hT) : null, max = x.hrMax || null;
      const m = modal("pz-res", `<button class="rv-close" data-x>✕</button><h2>${t("hrRes")}</h2>
        <div class="pz-res">${t("hrLine", { lthr: lthr || "--", max: max || "--" })}</div>${short}
        ${lthr ? `<div class="pz-note"><b>${t("hZones", { lthr })}</b></div>${zoneTable(HZ, HZN, lthr, "ppm", t("hz"), max)}` : ""}
        <div class="sv-status"></div><div class="sv-btns"><button data-x>${t("close")}</button>${lthr ? `<button class="primary" id="pzSave">${t("saveHr")}</button>` : ""}</div>`);
      if (lthr) $("pzSave").onclick = () => { setInput("numLthr", lthr); if (max) store.set("rv_fcmax", max); hist.push({ tipo: "fc", fecha: Date.now(), lthr, max }); store.set("rv_pruebas", hist.slice(-30)); m.querySelector(".sv-status").textContent = t("saved"); $("pzSave").disabled = true; info(); };
    }
  }
  function setInput(id, v) { const i = $(id); if (!i) return; i.value = v; i.dispatchEvent(new Event("change", { bubbles: true })); }

  // ───────────────────────── Calibración a cero ─────────────────────────
  async function zeroCal() {
    const s = S(), r = R();
    if (!s.trainer) return toast(t("needTrainer"));
    if (s.riding && $("btnStart")) $("btnStart").click();
    const m = modal("pz-zero", `<button class="rv-close" data-x>✕</button><h2>${t("zeroTitle")}</h2>
      <div class="pz-res" id="pzZeroMsg">${t("zeroDo")}</div><div class="pz-zero" id="pzZeroN">3</div>
      <div class="sv-btns"><button data-x>${t("close")}</button></div>`);
    const msg = $("pzZeroMsg"), big = $("pzZeroN");
    let still = 0;
    const moving = () => (s.tCad || 0) >= 1 || (s.tPower || 0) >= 3 || (s.trainerSpeed || 0) >= 0.5;
    while (document.body.contains(m) && still < 3000) {
      await new Promise((ok) => setTimeout(ok, 100));
      if (moving()) { still = 0; msg.textContent = t("zeroMoving"); big.textContent = "✋"; }
      else { still += 100; msg.textContent = t("zeroWait", { n: Math.ceil((3000 - still) / 1000) }); big.textContent = String(Math.max(1, Math.ceil((3000 - still) / 1000))); }
    }
    if (!document.body.contains(m)) return;
    big.textContent = "⏳"; msg.textContent = t("zeroSending");
    try {
      const prev = ($("calSt") && $("calSt").textContent) || "";
      const res = await r.zeroCal();
      if (res === "unsupported") { big.textContent = "⚠️"; msg.textContent = t("zeroBt"); return; }
      if (res === "nodata") { big.textContent = "⚠️"; msg.textContent = t("zeroNoData"); return; }
      if (res === "notrainer") { big.textContent = "⚠️"; msg.textContent = t("needTrainer"); return; }
      if (res === "cps") { big.textContent = "✅"; msg.textContent = t("zeroOk"); return; }
      // ANT+: la respuesta del rodillo aparece en el estado de calibración del panel
      for (let i = 0; i < 160 && document.body.contains(m); i++) {
        await new Promise((ok) => setTimeout(ok, 100));
        const now = ($("calSt") && $("calSt").textContent) || "";
        if (now && now !== prev && !/Calibrando/.test(now)) { big.textContent = /✅/.test(now) ? "✅" : "⚠️"; msg.textContent = /✅/.test(now) ? t("zeroOk") + " " + now.replace("✅", "").trim() : now; return; }
      }
    } catch (e) { big.textContent = "⚠️"; msg.textContent = t("zeroErr") + (e.message || e); }
  }

  // ───────────────────────── Panel ─────────────────────────
  function info() {
    const s = S(), i = $("pzInfo"); if (!s || !i) return;
    const max = store.get("rv_fcmax", null);
    i.textContent = t("info", { ftp: s.ftp, lthr: s.lthr, max: max ? max + " ppm" : "--" });
  }
  function labels() {
    const set = (id, k) => { const e = $(id); if (e) e.textContent = t(k); };
    set("pzH2", "section"); set("btnTestFtp", "ftpBtn"); set("btnTestHr", "hrBtn"); set("btnZonas", "zonesBtn"); set("btnZero", "zeroBtn"); info();
  }
  function addPanel() {
    const cal = $("btnCal");
    if (cal && !$("btnZero")) {
      const b = el(`<button id="btnZero" class="primary rv-own"></button>`);
      cal.parentElement.insertBefore(b, cal); b.onclick = zeroCal;
    }
    const ergH2 = [...document.querySelectorAll("#panel h2")].find((h) => /ERG/.test(h.textContent));
    if (ergH2 && !$("pzH2")) {
      const frag = document.createDocumentFragment();
      frag.appendChild(el(`<h2 id="pzH2" class="rv-own"></h2>`));
      frag.appendChild(el(`<div class="row rv-own"><button id="btnTestFtp"></button><button id="btnTestHr"></button><button id="btnZonas"></button></div>`));
      frag.appendChild(el(`<div class="st rv-own" id="pzInfo"></div>`));
      ergH2.parentElement.insertBefore(frag, ergH2);
      $("btnTestFtp").onclick = () => askTest("ftp"); $("btnTestHr").onclick = () => askTest("hr"); $("btnZonas").onclick = openZones;
    }
    if (!$("pzLive")) document.body.appendChild(el(`<div id="pzLive" class="glass rv-own"></div>`));
    labels();
    ["numFtp", "numLthr"].forEach((id) => { const i = $(id); if (i) i.addEventListener("change", () => setTimeout(info, 50)); });
  }
  function start() {
    addPanel();
    new MutationObserver(labels).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    setInterval(() => { try { tick(); } catch (e) { console.warn("[pruebas]", e); } }, 250);
  }
  window.__PZ = { askTest, startTest, openZones, zeroCal, get test() { return test; } };
  if (window.__R) start(); else addEventListener("rodillo-listo", start, { once: true });
})();
