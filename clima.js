/* RutaViva — clima y hora en vivo del lugar de la ruta (Open-Meteo, gratis y sin clave).
   · Viento real: según hacia dónde vas, en contra frena (y el rodillo endurece) y a favor empuja.
   · Lluvia y nieve: se ven caer, el cielo y la niebla cambian, y el piso mojado agrega un poco de resistencia.
   · Hora local real del track (huso exacto) para el sol, el día y la noche.
   · Interruptor "Condiciones climáticas y hora en vivo" on/off en el panel. */
(() => {
  "use strict";
  const S = () => window.__S, R = () => window.__R;
  const LS = "rv_clima";
  let on = (() => { try { return localStorage.getItem(LS) !== "0"; } catch { return true; } })();
  const lang = () => (["es", "en", "pt"].includes(document.documentElement.lang) ? document.documentElement.lang : "es");
  const TX = {
    es: { lbl: "Condiciones climáticas y hora en vivo", wind: "viento", head: "en contra", tail: "a favor", cross: "cruzado", local: "hora local", load: "Buscando el clima del lugar…", err: "No se pudo leer el clima (sigo sin viento)." },
    en: { lbl: "Live weather and local time", wind: "wind", head: "headwind", tail: "tailwind", cross: "crosswind", local: "local time", load: "Fetching local weather…", err: "Couldn't read the weather (riding without wind)." },
    pt: { lbl: "Clima e hora ao vivo", wind: "vento", head: "contra", tail: "a favor", cross: "lateral", local: "hora local", load: "Buscando o clima do lugar…", err: "Não foi possível ler o clima (sigo sem vento)." },
  };
  const t = (k) => TX[lang()][k] || TX.es[k];
  const CODES = [ // código WMO → ícono y descripción
    [[0], "☀️", { es: "Despejado", en: "Clear", pt: "Céu limpo" }], [[1, 2], "🌤️", { es: "Algo nublado", en: "Partly cloudy", pt: "Parcialmente nublado" }],
    [[3], "☁️", { es: "Nublado", en: "Overcast", pt: "Nublado" }], [[45, 48], "🌫️", { es: "Niebla", en: "Fog", pt: "Neblina" }],
    [[51, 53, 55, 56, 57], "🌦️", { es: "Llovizna", en: "Drizzle", pt: "Garoa" }], [[61, 63, 65, 66, 67, 80, 81, 82], "🌧️", { es: "Lluvia", en: "Rain", pt: "Chuva" }],
    [[71, 73, 75, 77, 85, 86], "🌨️", { es: "Nieve", en: "Snow", pt: "Neve" }], [[95, 96, 99], "⛈️", { es: "Tormenta", en: "Thunderstorm", pt: "Tempestade" }],
  ];
  const codeInfo = (c) => { for (const [cs, ic, d] of CODES) if (cs.includes(c)) return { ic, d: d[lang()] }; return { ic: "🌡️", d: "" }; };
  const CARD = { es: ["N", "NE", "E", "SE", "S", "SO", "O", "NO"], en: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"], pt: ["N", "NE", "L", "SE", "S", "SO", "O", "NO"] };

  // Estado expuesto (mejoras3d lo usa para el huso horario y el brillo del sol)
  const W = { on, wx: null, tzOffset: null, sunK: 1, hemiK: 1, rain: 0, snow: 0, windE: 0, windN: 0, head: 0 };
  window.__CLIMA = W;

  // ───────── Lectura del clima ─────────
  let lastPos = null, lastFetch = 0, busy = false;
  async function fetchWx(force) {
    const s = S(); if (!on || !s || !s.route || !s.origin || busy) return;
    const p = { lat: s.origin.lat, lon: s.origin.lon };
    const moved = !lastPos || Math.hypot(p.lat - lastPos.lat, p.lon - lastPos.lon) > 0.15;
    if (!force && !moved && Date.now() - lastFetch < 10 * 60e3) return;
    busy = true;
    try {
      if (moved) R().toast && R().toast(t("load"), 1800);
      const u = `https://api.open-meteo.com/v1/forecast?latitude=${p.lat.toFixed(3)}&longitude=${p.lon.toFixed(3)}` +
        "&current=temperature_2m,apparent_temperature,precipitation,rain,showers,snowfall,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m,is_day" +
        "&wind_speed_unit=ms&timezone=auto";
      const j = await (await fetch(u)).json();
      if (!j || !j.current) throw new Error("sin datos");
      W.wx = j.current; W.tzOffset = (j.utc_offset_seconds || 0) / 3600; lastPos = p; lastFetch = Date.now();
      const c = j.current, code = c.weather_code;
      const rainMm = (c.rain || 0) + (c.showers || 0);
      W.rain = [61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99, 51, 53, 55, 56, 57].includes(code) ? Math.min(1, 0.25 + rainMm / 4) : rainMm > 0.1 ? 0.25 : 0;
      W.snow = [71, 73, 75, 77, 85, 86].includes(code) ? Math.min(1, 0.3 + (c.snowfall || 0) / 1.5) : 0;
      W.fog = [45, 48].includes(code) ? 1 : 0;
      const cloud = (c.cloud_cover || 0) / 100;
      W.sunK = 1 - 0.55 * cloud - 0.2 * Math.max(W.rain, W.snow); W.hemiK = 1 - 0.15 * cloud;
      // viento "hacia dónde va" (el meteorológico indica de dónde viene); a la altura del ciclista ≈ 70 %
      const ws = (c.wind_speed_10m || 0) * 0.7, dir = (c.wind_direction_10m || 0) * Math.PI / 180;
      W.windE = -Math.sin(dir) * ws; W.windN = -Math.cos(dir) * ws; W.gust = Math.max(0, (c.wind_gusts_10m || 0) * 0.7 - ws);
      if (window.__M3D && window.__M3D.updateSun) window.__M3D.updateSun();
    } catch (e) { console.warn("[clima]", e); if (!W.wx) R().toast && R().toast(t("err"), 4000); }
    busy = false;
  }

  // ───────── Viento y piso mojado → física y rodillo ─────────
  function physics() {
    const s = S(), r = R(); if (!s) return;
    if (!on || !W.wx || !s.route) { s.windHead = 0; s.windGrade = 0; W.head = 0; return; }
    const a = r.Me(s.d), b = r.Me(Math.min(s.route.total, s.d + 10));
    let he = b.x - a.x, hn = -(b.z - a.z); const L = Math.hypot(he, hn) || 1; he /= L; hn /= L;
    const gust = W.gust ? W.gust * 0.5 * (Math.sin(performance.now() / 2300) * 0.5 + 0.5) : 0;
    const k = 1 + (W.gust ? gust / Math.max(1, Math.hypot(W.windE, W.windN)) : 0);
    const head = -(W.windE * he + W.windN * hn) * k; // + = en contra
    W.head = head; s.windHead = head;
    const v = Math.max(s.v || 0, 0), m = (s.riderMass || 75) + (s.bikeMass || 9), cda = s.cda || 0.32;
    const extra = 0.5 * 1.2 * cda * ((v + head) * Math.abs(v + head) - v * v) * (1 - (s.draft || 0));
    const wet = W.rain * 0.3 + W.snow * 0.8; // más rodadura con piso mojado o nevado
    s.windGrade = Math.max(-0.04, Math.min(0.06, extra / (m * 9.81) + (s.crr || 0.004) * wet));
  }

  // ───────── Cielo, niebla y luz ─────────
  const base = { bg: null, fogC: null, far: null, myFar: null };
  function sky() {
    const r = R(), sc = r && r.scene; if (!sc || !sc.background || !sc.fog) return;
    if (!base.bg) { base.bg = sc.background.clone(); base.fogC = sc.fog.color.clone(); }
    if (base.myFar === null || Math.abs(sc.fog.far - base.myFar) > 1) { base.far = sc.fog.far; base.near = sc.fog.near; }
    const C = r.T.Color;
    if (!on || !W.wx) { sc.background.copy(base.bg); sc.fog.color.copy(base.fogC); sc.fog.far = base.far; sc.fog.near = base.near; base.myFar = base.far; return; }
    const cloud = (W.wx.cloud_cover || 0) / 100, wet = Math.max(W.rain, W.snow), night = W.wx.is_day === 0;
    const col = base.bg.clone().lerp(new C(0x8c939b), Math.min(1, 0.45 * cloud + 0.5 * wet));
    if (W.snow) col.lerp(new C(0xd6dde4), 0.35 * W.snow);
    if (night) col.lerp(new C(0x0b1424), 0.82);
    sc.background.copy(col); sc.fog.color.copy(col);
    const vis = W.fog ? 0.12 : 1 - 0.55 * W.rain - 0.7 * W.snow;
    sc.fog.far = Math.max(450, base.far * vis); sc.fog.near = Math.min(base.near, sc.fog.far * 0.3); base.myFar = sc.fog.far;
  }

  // ───────── Lluvia y nieve (partículas alrededor de la cámara) ─────────
  let rainM = null, snowM = null; const N_RAIN = 1400, N_SNOW = 1000, BOX = 34;
  let pr = null, ps = null;
  function makeFx() {
    const r = R(), T = r.T;
    const rg = new T.BoxGeometry(0.015, 0.7, 0.015), rm = new T.MeshBasicMaterial({ color: 0xb8cde0, transparent: true, opacity: 0.45, depthWrite: false });
    rainM = new T.InstancedMesh(rg, rm, N_RAIN); rainM.frustumCulled = false; rainM.count = 0; rainM.renderOrder = 5;
    const sg = new T.SphereGeometry(0.045, 5, 4), sm = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false });
    snowM = new T.InstancedMesh(sg, sm, N_SNOW); snowM.frustumCulled = false; snowM.count = 0;
    r.scene.add(rainM); r.scene.add(snowM);
    const rnd = () => (Math.random() - 0.5) * 2 * BOX;
    pr = Array.from({ length: N_RAIN }, () => [rnd(), Math.random() * BOX, rnd()]);
    ps = Array.from({ length: N_SNOW }, () => [rnd(), Math.random() * BOX, rnd(), Math.random() * 6.28]);
  }
  const M = { m: null, o: null, q: null };
  let lastT = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
    const r = R(); if (!r || !r.camera) return;
    if (!rainM) { try { makeFx(); M.o = new r.T.Object3D(); } catch (e) { console.warn("[clima] fx", e); return; } }
    const cam = r.camera.position, we = on ? W.windE : 0, wn = on ? W.windN : 0;
    const nr = on ? Math.round(N_RAIN * W.rain) : 0, ns = on ? Math.round(N_SNOW * W.snow) : 0;
    rainM.count = nr; snowM.count = ns;
    const wrap = (p, c) => { if (p[0] - c.x > BOX) p[0] -= 2 * BOX; if (p[0] - c.x < -BOX) p[0] += 2 * BOX; if (p[2] - c.z > BOX) p[2] -= 2 * BOX; if (p[2] - c.z < -BOX) p[2] += 2 * BOX; };
    const o = M.o;
    if (nr) {
      const tilt = Math.min(0.5, Math.hypot(we, wn) / 18);
      for (let i = 0; i < nr; i++) {
        const p = pr[i]; p[1] -= 11 * dt; p[0] += we * dt; p[2] -= wn * dt;
        if (p[1] < cam.y - 8) { p[1] = cam.y + BOX * 0.6 + Math.random() * 6; p[0] = cam.x + (Math.random() - 0.5) * 2 * BOX; p[2] = cam.z + (Math.random() - 0.5) * 2 * BOX; }
        if (p[1] > cam.y + BOX) p[1] = cam.y + Math.random() * BOX * 0.6;
        wrap(p, cam);
        o.position.set(p[0], p[1], p[2]); o.rotation.set(-wn / 18 * 0.5, 0, -we / 18 * 0.5 * (tilt > 0 ? 1 : 0)); o.updateMatrix(); rainM.setMatrixAt(i, o.matrix);
      }
      rainM.instanceMatrix.needsUpdate = true;
    }
    if (ns) {
      o.rotation.set(0, 0, 0);
      for (let i = 0; i < ns; i++) {
        const p = ps[i]; p[3] += dt; p[1] -= 1.1 * dt; p[0] += (we * 0.8 + Math.sin(p[3]) * 0.4) * dt; p[2] -= (wn * 0.8 + Math.cos(p[3] * 0.7) * 0.4) * dt;
        if (p[1] < cam.y - 8) { p[1] = cam.y + BOX * 0.6 + Math.random() * 6; p[0] = cam.x + (Math.random() - 0.5) * 2 * BOX; p[2] = cam.z + (Math.random() - 0.5) * 2 * BOX; }
        if (p[1] > cam.y + BOX) p[1] = cam.y + Math.random() * BOX * 0.6;
        wrap(p, cam);
        o.position.set(p[0], p[1], p[2]); o.updateMatrix(); snowM.setMatrixAt(i, o.matrix);
      }
      snowM.instanceMatrix.needsUpdate = true;
    }
  }

  // ───────── Cartel con el clima y la hora del lugar ─────────
  function hud() {
    let b = document.getElementById("clBox");
    if (!b) {
      b = document.createElement("div"); b.id = "clBox"; b.className = "glass rv-own";
      b.style.cssText = "position:fixed;top:150px;left:50%;transform:translateX(-50%);z-index:15;padding:6px 12px;font-size:13px;white-space:nowrap;pointer-events:none;display:none";
      document.body.appendChild(b);
    }
    const s = S();
    if (!on || !W.wx || !s || !s.route) { b.style.display = "none"; return; }
    const c = W.wx, ci = codeInfo(c.weather_code);
    const local = new Date(Date.now() + (W.tzOffset || 0) * 3600e3);
    const hh = String(local.getUTCHours()).padStart(2, "0"), mm = String(local.getUTCMinutes()).padStart(2, "0");
    const kmh = Math.round(Math.hypot(W.windE, W.windN) / 0.7 * 3.6);
    const from = ((c.wind_direction_10m || 0) + 360) % 360, card = CARD[lang()][Math.round(from / 45) % 8];
    const speed = Math.hypot(W.windE, W.windN) || 1, rel = W.head / speed;
    const relTxt = kmh < 3 ? "" : rel > 0.4 ? ` ⬇️ ${t("head")}` : rel < -0.4 ? ` ⬆️ ${t("tail")}` : ` ↔️ ${t("cross")}`;
    b.style.display = "block";
    b.textContent = `${ci.ic} ${ci.d} · ${Math.round(c.temperature_2m)}°C · 💨 ${t("wind")} ${kmh} km/h ${card}${relTxt} · 🕒 ${hh}:${mm} ${t("local")}`;
  }

  // ───────── Interruptor en el panel ─────────
  function addToggle() {
    if (document.getElementById("chkClima")) return;
    const anchor = document.getElementById("chkVideo") || document.getElementById("chkArbolesHd") || document.getElementById("chkAds") || document.querySelector("#panel input[type=checkbox]");
    const host = anchor ? anchor.closest("label") || anchor.parentElement : null;
    if (!host) return;
    const lab = document.createElement("label"); lab.className = "rv-own"; lab.style.display = "block";
    lab.innerHTML = `<input type="checkbox" id="chkClima"${on ? " checked" : ""}> 🌦️ <span id="lblClima"></span>`;
    host.parentElement.insertBefore(lab, host.nextSibling);
    const upd = () => { const l = document.getElementById("lblClima"); if (l) l.textContent = t("lbl"); };
    upd(); new MutationObserver(upd).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    document.getElementById("chkClima").onchange = (e) => {
      on = W.on = e.target.checked; try { localStorage.setItem(LS, on ? "1" : "0"); } catch {}
      if (on) fetchWx(true);
      physics(); sky(); hud();
      if (window.__M3D && window.__M3D.updateSun) window.__M3D.updateSun();
    };
  }

  function start() {
    requestAnimationFrame(frame);
    setInterval(() => { try { addToggle(); physics(); } catch (e) { console.warn("[clima]", e); } }, 250);
    setInterval(() => { try { fetchWx(false); sky(); hud(); } catch (e) { console.warn("[clima]", e); } }, 2000);
    setInterval(() => fetchWx(true), 10 * 60e3);
  }
  if (window.__R) start(); else addEventListener("rodillo-listo", start, { once: true });
})();
