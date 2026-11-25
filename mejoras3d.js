/* RutaViva — mejoras 3D: material con brillo (PBR), reflejos del cielo y texturas
   generadas para el ciclista, la bici, los árboles y las estructuras de la ruta.
   Se carga después de la app del rodillo (window.__R) y antes de rutaviva.js. */
(() => {
  "use strict";
  const R = window.__R;
  if (!R || !R.T) { console.warn("[mejoras3d] no encontré la escena"); return; }
  const T = R.T;

  // ───────────── Material estándar (PBR) sobre las clases de la app ─────────────
  // La app viene compilada sin MeshStandardMaterial; el renderer sí sabe dibujarlo,
  // así que lo armamos con la misma clase base, Color, Vector2 y Euler de la app.
  const probe = new T.MeshLambertMaterial();
  const Base = Object.getPrototypeOf(T.MeshLambertMaterial);
  const Color = probe.color.constructor;
  const Vector2 = probe.normalScale.constructor;
  const Euler = (probe.envMapRotation || new T.Object3D().rotation).constructor;
  probe.dispose();

  class MeshStandardMaterial extends Base {
    constructor(p) {
      super();
      this.isMeshStandardMaterial = true;
      this.defines = { STANDARD: "" };
      this.type = "MeshStandardMaterial";
      this.color = new Color(0xffffff); this.roughness = 1; this.metalness = 0;
      this.map = null; this.lightMap = null; this.lightMapIntensity = 1;
      this.aoMap = null; this.aoMapIntensity = 1;
      this.emissive = new Color(0x000000); this.emissiveIntensity = 1; this.emissiveMap = null;
      this.bumpMap = null; this.bumpScale = 1;
      this.normalMap = null; this.normalMapType = 0; this.normalScale = new Vector2(1, 1);
      this.displacementMap = null; this.displacementScale = 1; this.displacementBias = 0;
      this.roughnessMap = null; this.metalnessMap = null; this.alphaMap = null;
      this.envMap = null; this.envMapRotation = new Euler(); this.envMapIntensity = 1;
      this.wireframe = false; this.wireframeLinewidth = 1; this.wireframeLinecap = "round"; this.wireframeLinejoin = "round";
      this.flatShading = false; this.fog = true;
      this.setValues(p);
    }
    copy(s) {
      super.copy(s);
      this.defines = { STANDARD: "" };
      for (const k of ["roughness", "metalness", "map", "lightMap", "lightMapIntensity", "aoMap", "aoMapIntensity", "emissiveMap", "emissiveIntensity",
        "bumpMap", "bumpScale", "normalMap", "normalMapType", "displacementMap", "displacementScale", "displacementBias", "roughnessMap",
        "metalnessMap", "alphaMap", "envMap", "envMapIntensity", "wireframe", "wireframeLinewidth", "wireframeLinecap", "wireframeLinejoin", "flatShading", "fog"]) this[k] = s[k];
      this.color.copy(s.color); this.emissive.copy(s.emissive); this.normalScale.copy(s.normalScale); this.envMapRotation.copy(s.envMapRotation);
      return this;
    }
  }
  T.MeshStandardMaterial = MeshStandardMaterial;

  // ───────────── Reflejos: cielo equirectangular para el entorno ─────────────
  function envTexture() {
    const c = document.createElement("canvas"); c.width = 1024; c.height = 512;
    const g = c.getContext("2d");
    const sky = g.createLinearGradient(0, 0, 0, 256);
    sky.addColorStop(0, "#3a72c4"); sky.addColorStop(0.6, "#8fbbe8"); sky.addColorStop(1, "#dfeaf3");
    g.fillStyle = sky; g.fillRect(0, 0, 1024, 256);
    const gr = g.createLinearGradient(0, 256, 0, 512);
    gr.addColorStop(0, "#9aa58c"); gr.addColorStop(0.15, "#5d6b4c"); gr.addColorStop(1, "#2c3326");
    g.fillStyle = gr; g.fillRect(0, 256, 1024, 256);
    // nubes suaves
    let s = 99; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 40; i++) {
      const x = rnd() * 1024, y = 90 + rnd() * 130, r = 30 + rnd() * 70;
      const rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, "rgba(255,255,255,.45)"); rg.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = rg; g.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    // sol (misma dirección aproximada que la luz de la escena)
    const sx = 350, sy = 85, sun = g.createRadialGradient(sx, sy, 0, sx, sy, 90);
    sun.addColorStop(0, "rgba(255,255,245,1)"); sun.addColorStop(0.12, "rgba(255,250,225,.95)"); sun.addColorStop(1, "rgba(255,240,200,0)");
    g.fillStyle = sun; g.fillRect(sx - 90, sy - 90, 180, 180);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGB; t.mapping = 303; // EquirectangularReflectionMapping
    return t;
  }
  R.scene.environment = envTexture();

  // ───────────── Texturas procedurales ─────────────
  const cache = new Map();
  function canvasTex(key, w, h, draw, rx = 1, ry = 1, srgb = true) {
    const k = key + rx + "x" + ry;
    if (cache.has(k)) return cache.get(k);
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = 1000; t.repeat.set(rx, ry); if (srgb) t.colorSpace = T.SRGB;
    try { t.anisotropy = R.renderer.capabilities.getMaxAnisotropy(); } catch {}
    cache.set(k, t); return t;
  }
  const rand = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const grey = (v) => `rgb(${v | 0},${v | 0},${v | 0})`;
  function grain(g, w, h, n, lo, hi, r, sz = 1) { for (let i = 0; i < n; i++) { g.fillStyle = grey(lo + r() * (hi - lo)); g.fillRect(r() * w, r() * h, sz, sz); } }

  const tex = {
    // gris claro granulado: para multiplicar el color del material sin cambiarlo mucho
    grain: (rx = 1, ry = 1) => canvasTex("grain", 256, 256, (g, w, h) => { g.fillStyle = grey(235); g.fillRect(0, 0, w, h); grain(g, w, h, 9000, 205, 255, rand(3), 2); }, rx, ry),
    concrete: (rx = 1, ry = 1) => canvasTex("concrete", 256, 256, (g, w, h) => {
      const r = rand(11); g.fillStyle = grey(225); g.fillRect(0, 0, w, h);
      for (let i = 0; i < 60; i++) { const x = r() * w, y = r() * h, rr = 10 + r() * 40, rg = g.createRadialGradient(x, y, 0, x, y, rr); const v = 200 + r() * 40; rg.addColorStop(0, `rgba(${v},${v},${v},.5)`); rg.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = rg; g.fillRect(x - rr, y - rr, 2 * rr, 2 * rr); }
      grain(g, w, h, 14000, 170, 250, r, 1); for (let i = 0; i < 260; i++) { g.fillStyle = grey(120 + r() * 50); const s = 1 + r() * 2.5; g.fillRect(r() * w, r() * h, s, s); }
    }, rx, ry),
    brushed: (rx = 1, ry = 1) => canvasTex("brushed", 256, 256, (g, w, h) => {
      const r = rand(5); g.fillStyle = grey(200); g.fillRect(0, 0, w, h);
      for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(${r() < .5 ? "255,255,255" : "40,40,40"},${0.05 + r() * 0.12})`; g.fillRect(0, r() * h, w, 0.6 + r()); }
    }, rx, ry),
    carbon: (rx = 1, ry = 1) => canvasTex("carbon", 128, 128, (g, w, h) => {
      const s = 16; for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) {
        const odd = ((x + y) / s) % 2 === 0, lg = odd ? g.createLinearGradient(x, y, x + s, y) : g.createLinearGradient(x, y, x, y + s);
        lg.addColorStop(0, grey(70)); lg.addColorStop(0.5, grey(150)); lg.addColorStop(1, grey(70)); g.fillStyle = lg; g.fillRect(x, y, s, s);
      }
    }, rx, ry),
    fabric: (rx = 1, ry = 1) => canvasTex("fabric", 128, 128, (g, w, h) => {
      g.fillStyle = grey(232); g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 2) { g.fillStyle = `rgba(0,0,0,${y % 4 ? 0.07 : 0.03})`; g.fillRect(0, y, w, 1); }
      for (let x = 0; x < w; x += 2) { g.fillStyle = `rgba(255,255,255,${x % 4 ? 0.08 : 0.03})`; g.fillRect(x, 0, 1, h); }
      grain(g, w, h, 1500, 200, 255, rand(8), 1);
    }, rx, ry),
    bark: (rx = 1, ry = 1) => canvasTex("bark", 128, 256, (g, w, h) => {
      const r = rand(21); g.fillStyle = grey(200); g.fillRect(0, 0, w, h);
      for (let i = 0; i < 90; i++) { const x = r() * w, ww = 1 + r() * 4; g.fillStyle = grey(90 + r() * 90); g.fillRect(x, 0, ww, h); }
      for (let i = 0; i < 200; i++) { g.fillStyle = grey(60 + r() * 60); g.fillRect(r() * w, r() * h, 2 + r() * 6, 1 + r() * 2); }
    }, rx, ry),
    leaves: (rx = 1, ry = 1) => canvasTex("leaves", 256, 256, (g, w, h) => {
      const r = rand(31); g.fillStyle = grey(190); g.fillRect(0, 0, w, h);
      for (let i = 0; i < 2600; i++) { const x = r() * w, y = r() * h, s = 2 + r() * 7; g.fillStyle = grey(140 + r() * 115); g.beginPath(); g.ellipse(x, y, s, s * 0.55, r() * 3.14, 0, 6.283); g.fill(); }
    }, rx, ry),
    rubber: (rx = 1, ry = 1) => canvasTex("rubber", 64, 64, (g, w, h) => { g.fillStyle = grey(225); g.fillRect(0, 0, w, h); grain(g, w, h, 1200, 150, 255, rand(41), 1); }, rx, ry),
  };

  function std(o) { return new MeshStandardMaterial(o); }
  R.fx = { std, tex, MeshStandardMaterial };

  // ───────────── Ciclista y bici ─────────────
  const RIDER = {
    Frame:   { metalness: 0.55, roughness: 0.22, envMapIntensity: 1.2 },
    Acc:     { metalness: 0.15, roughness: 0.28, envMapIntensity: 1.0 },
    Black:   { roughness: 0.5 },
    Carbon:  { metalness: 0.2, roughness: 0.3, map: () => tex.carbon(6, 6), envMapIntensity: 1.1 },
    Alu:     { metalness: 1.0, roughness: 0.28, map: () => tex.brushed(1, 1), envMapIntensity: 1.2 },
    Tire:    { roughness: 0.9, bumpMap: () => tex.rubber(8, 1), bumpScale: 0.6 },
    White:   { roughness: 0.32 },
    Skin:    { roughness: 0.55, color: 0xd59a74, bumpMap: () => tex.grain(4, 4), bumpScale: 0.2 },
    Jersey:  { roughness: 0.62, map: () => tex.fabric(6, 6), bumpMap: () => tex.fabric(6, 6), bumpScale: 0.35 },
    Jersey2: { roughness: 0.6, map: () => tex.fabric(6, 6) },
    Shorts:  { roughness: 0.42, metalness: 0.05, envMapIntensity: 0.8 },
    Glove:   { roughness: 0.7, bumpMap: () => tex.fabric(3, 3), bumpScale: 0.4 },
    Helmet:  { roughness: 0.18, metalness: 0.05, envMapIntensity: 1.3 },
    Lens:    { color: 0x23476e, metalness: 0.95, roughness: 0.05, envMapIntensity: 1.6 },
    Sock:    { roughness: 0.85, map: () => tex.fabric(4, 4) },
    Shoe:    { roughness: 0.28, envMapIntensity: 1.1 },
    Sole:    { roughness: 0.7 },
    Bottle:  { roughness: 0.12, envMapIntensity: 1.3 },
    Tape:    { roughness: 0.75, bumpMap: () => tex.fabric(8, 2), bumpScale: 0.5 },
  };
  // ───────────── Equipos (diseños propios, sin marcas) ─────────────
  const KITS = [
    { id: "rutaviva", es: "Naranja RutaViva", en: "RutaViva orange", pt: "Laranja RutaViva", base: "#ff6a2b", panel: "#1d2733", line: "#ffffff", text: "#ffffff", shorts: 0x131313 },
    { id: "rojo",     es: "Rojo y negro",     en: "Red and black",   pt: "Vermelho e preto", base: "#c8102e", panel: "#111111", line: "#ffffff", text: "#ffffff", shorts: 0x111111 },
    { id: "azul",     es: "Azul y celeste",   en: "Blue and sky blue", pt: "Azul e celeste", base: "#0a3d91", panel: "#7fc4ff", line: "#ffffff", text: "#ffffff", shorts: 0x0b1a33 },
    { id: "amarillo", es: "Negro y amarillo", en: "Black and yellow", pt: "Preto e amarelo", base: "#151515", panel: "#ffd400", line: "#ffd400", text: "#ffd400", shorts: 0x111111 },
    { id: "celeste",  es: "Blanco y celeste", en: "White and sky blue", pt: "Branco e celeste", base: "#f2f4f7", panel: "#5fb4e8", line: "#1d2733", text: "#1d2733", shorts: 0x1d2733 },
    { id: "verde",    es: "Verde y blanco",   en: "Green and white", pt: "Verde e branco",   base: "#0f7a3d", panel: "#ffffff", line: "#ffffff", text: "#ffffff", shorts: 0x0d2a18 },
  ];
  const kitById = (id) => KITS.find((k) => k.id === id) || KITS[0];
  let kit = kitById((() => { try { return localStorage.getItem("rv_kit"); } catch { return null; } })());
  function jerseyBack(k) {
    // Torso: color base con paneles y "RutaViva" en la espalda (u≈0.75 mira hacia atrás).
    return canvasTex("jerseyback-" + k.id, 512, 256, (g, w, h) => {
      g.fillStyle = k.base; g.fillRect(0, 0, w, h);
      g.fillStyle = k.panel; g.fillRect(w * 0.12, 0, w * 0.22, h); g.fillRect(w * 0.0, 0, w * 0.05, h); g.fillRect(w * 0.95, 0, w * 0.05, h);
      g.fillStyle = k.line; g.fillRect(0, h * 0.62, w, 6);
      g.save(); g.translate(w * 0.75, h * 0.45); g.scale(1, 1.6); g.textAlign = "center"; g.textBaseline = "middle";
      g.fillStyle = k.text; g.font = "bold 30px Arial"; g.fillText("RutaViva", 0, 0); g.restore();
      for (let y = 0; y < h; y += 2) { g.fillStyle = "rgba(0,0,0,.05)"; g.fillRect(0, y, w, 1); }
    });
  }
  const upgraded = new Map();
  function upgradeMat(m) {
    if (!m || m.isMeshStandardMaterial) return m;
    const spec = RIDER[m.name]; if (!spec) return m;
    if (upgraded.has(m)) return upgraded.get(m);
    const o = { name: m.name, color: m.color.clone(), side: m.side, transparent: m.transparent, opacity: m.opacity, depthWrite: m.depthWrite };
    for (const [k, v] of Object.entries(spec)) o[k] = typeof v === "function" ? v() : v;
    if (typeof o.color === "number") o.color = new Color(o.color);
    if (o.map && (m.name === "Jersey" || m.name === "Sock")) o.color = m.color.clone();
    const n = std(o); upgraded.set(m, n); return n;
  }
  function upgradeRider() {
    const rider = R.rider; if (!rider) return;
    rider.traverse((o) => { if (o.isMesh && o.material && !Array.isArray(o.material)) o.material = upgradeMat(o.material); });
    applyKit(kit);
  }
  function riderMats() {
    const out = {}; R.rider.traverse((o) => { if (o.isMesh && o.material && o.material.name) out[o.material.name] = o.material; }); return out;
  }
  function applyKit(k) {
    kit = k; try { localStorage.setItem("rv_kit", k.id); } catch {}
    const m = riderMats();
    if (m.Jersey) m.Jersey.color.set(k.base);
    if (m.Jersey2) m.Jersey2.color.set(k.panel);
    if (m.Shorts) m.Shorts.color.setHex(k.shorts);
    const chest = R.rider.userData && R.rider.userData.chest;
    if (chest) {
      if (!chest.material || chest.material.name !== "JerseyBack") chest.material = std({ name: "JerseyBack", roughness: 0.6, bumpMap: tex.fabric(6, 6), bumpScale: 0.3 });
      chest.material.map = jerseyBack(k); chest.material.needsUpdate = true;
    }
  }
  R.fx.kits = KITS; R.fx.applyKit = (id) => applyKit(kitById(id));
  try { upgradeRider(); } catch (e) { console.warn("[mejoras3d] ciclista", e); }

  // Selector de equipo en el panel (sección Simulación)
  function addKitPicker() {
    if (document.getElementById("rvKit")) return;
    const anchor = document.getElementById("numRider"); if (!anchor) return;
    const row = anchor.closest(".row"); if (!row) return;
    let lang = "es"; try { lang = localStorage.getItem("rv_lang") || (navigator.language || "es").slice(0, 2); } catch {}
    if (!["es", "en", "pt"].includes(lang)) lang = "es";
    const label = { es: "Ropa", en: "Kit", pt: "Roupa" }[lang];
    const wrap = document.createElement("div"); wrap.className = "row rv-own";
    wrap.innerHTML = `<label>${label} <select id="rvKit">${KITS.map((k) => `<option value="${k.id}">${k[lang]}</option>`).join("")}</select></label>`;
    row.after(wrap);
    const sel = wrap.querySelector("select"); sel.value = kit.id;
    sel.onchange = () => applyKit(kitById(sel.value));
  }
  addKitPicker();

  // ───────────── Árboles de la app (troncos y copas instanciados) ─────────────
  let lastWorld = null;
  function upgradeTrees(world) {
    world.traverse((o) => {
      if (!o.isInstancedMesh || !o.material || o.material.isMeshStandardMaterial || !o.material.color) return;
      const hex = o.material.color.getHex();
      if (hex === 0x5a3d25) o.material = std({ color: 0x6b4a2f, map: tex.bark(1, 1), bumpMap: tex.bark(1, 1), bumpScale: 1.2, roughness: 0.95 });
      else if (hex === 0x2f5e2a) o.material = std({ color: 0xb4d0a8, map: tex.leaves(2, 2), bumpMap: tex.leaves(2, 2), bumpScale: 1.5, roughness: 0.8, envMapIntensity: 0.6 });
    });
  }
  setInterval(() => {
    try {
      const w = R.world && R.world();
      if (w && w !== lastWorld) { lastWorld = w; setTimeout(() => upgradeTrees(w), 300); }
    } catch (e) { console.warn("[mejoras3d] árboles", e); }
  }, 1000);

  // ───────────── Sol según la ubicación de la ruta y la hora, y sombras ─────────────
  const sun = R.sun, hemi = R.hemi, S = window.__S;
  const D2R = Math.PI / 180;
  // Posición solar (algoritmo NOAA simplificado). Devuelve azimut (desde el norte, horario) y elevación, en radianes.
  function solarPosition(date, lat, lon) {
    const jd = date.getTime() / 86400000 + 2440587.5, n = jd - 2451545.0;
    const L = (280.46 + 0.9856474 * n) % 360, g = ((357.528 + 0.9856003 * n) % 360) * D2R;
    const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * D2R, eps = (23.439 - 0.0000004 * n) * D2R;
    const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda)), dec = Math.asin(Math.sin(eps) * Math.sin(lambda));
    const gmst = (18.697374558 + 24.06570982441908 * n) % 24, lst = (gmst * 15 + lon) * D2R, ha = lst - ra, phi = lat * D2R;
    const el = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(ha));
    const az = Math.atan2(-Math.sin(ha), Math.tan(dec) * Math.cos(phi) - Math.sin(phi) * Math.cos(ha));
    return { az: (az + 2 * Math.PI) % (2 * Math.PI), el };
  }
  // Hora del GPX (si el archivo trae <time>): inicio y fin de la actividad
  let gpxTime = null;
  function readGpxTime(file) {
    if (!file || !file.text) return;
    file.text().then((t) => {
      const ts = t.match(/<time>([^<]+)<\/time>/g) || [];
      const times = ts.map((x) => Date.parse(x.slice(6, -7))).filter(isFinite);
      // el primer <time> suele ser el de metadata: tomamos los de los puntos si hay más de uno
      gpxTime = times.length >= 2 ? { start: times[1] || times[0], end: times[times.length - 1] } : times.length ? { start: times[0], end: times[0] } : null;
      updateSun(true);
    }).catch(() => { gpxTime = null; });
  }
  const origLoad = R.loadGpxFile;
  if (origLoad) R.loadGpxFile = function (f, ...rest) { gpxTime = null; readGpxTime(f); return origLoad.call(this, f, ...rest); };
  const fileIn = document.getElementById("fileGpx");
  if (fileIn) fileIn.addEventListener("change", () => { gpxTime = null; readGpxTime(fileIn.files && fileIn.files[0]); });
  addEventListener("drop", (e) => { const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f && /\.gpx$/i.test(f.name)) { gpxTime = null; readGpxTime(f); } }, true);

  const SUN_MODES = ["auto", "07:30", "10:00", "13:00", "17:00", "19:30"];
  let sunMode = (() => { try { return localStorage.getItem("rv_sol") || "auto"; } catch { return "auto"; } })();
  if (!SUN_MODES.includes(sunMode)) sunMode = "auto";
  let shadowsOn = (() => { try { return localStorage.getItem("rv_sombras") !== "0"; } catch { return true; } })();

  // Hora local "de la ruta": la hora del reloj (o la elegida) interpretada en el huso de la ruta (≈ longitud/15).
  function sunDate(lat, lon) {
    if (sunMode === "auto" && gpxTime) {
      const f = S.route && S.route.total ? Math.min(1, Math.max(0, S.d / S.route.total)) : 0;
      return new Date(gpxTime.start + (gpxTime.end - gpxTime.start) * f);
    }
    const now = new Date();
    let hh = now.getHours(), mm = now.getMinutes();
    if (sunMode !== "auto") { [hh, mm] = sunMode.split(":").map(Number); }
    const tz = routeTz(lat, lon, now);
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), hh - tz, mm));
  }
  // Huso horario aproximado de la ruta: si queda cerca del usuario usa el de su reloj (Argentina es UTC−3 aunque
  // por longitud sería −4); Europa usa hora central (+1, +2 en verano); si no, longitud/15.
  function routeTz(lat, lon, now) {
    const mine = -now.getTimezoneOffset() / 60, geo = Math.round(lon / 15);
    if (Math.abs(geo - mine) <= 1) return mine;
    if (lat > 35 && lat < 72 && lon > -10 && lon < 30) { const m = now.getUTCMonth(); return lon < -3 ? (m >= 3 && m <= 9 ? 1 : 0) : (m >= 3 && m <= 9 ? 2 : 1); }
    return geo;
  }
  const sunDir = new T.Vector3(0.45, 0.75, 0.3).normalize();
  const cWhite = new Color(0xffffff), cWarm = new Color(0xffb46b), cNight = new Color(0x9fb4ff);
  let sunInfo = "";
  function updateSun() {
    const o = S && S.origin; if (!o || !sun) return;
    const p = solarPosition(sunDate(o.lat, o.lon), o.lat, o.lon);
    const night = p.el < 0.035, el = Math.max(p.el, 0.035);
    // escena: x = este, -z = norte, y = arriba
    sunDir.set(Math.sin(p.az) * Math.cos(el), Math.sin(el), -Math.cos(p.az) * Math.cos(el)).normalize();
    const k = Math.min(1, el / (25 * D2R)); // 0 al amanecer, 1 con el sol alto
    sun.color.copy(night ? cNight : cWarm).lerp(cWhite, night ? 0 : k);
    sun.intensity = night ? 0.4 : 0.95 + 0.85 * k;
    if (hemi) hemi.intensity = night ? 0.8 : 0.7 + 0.25 * k;
    const deg = Math.round(p.el / D2R), az = Math.round(p.az / D2R);
    const card = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"][Math.round(az / 45) % 8];
    sunInfo = night ? "de noche (sol bajo el horizonte)" : `sol a ${deg}° de altura, hacia el ${card}`;
    const info = document.getElementById("rvSunInfo"); if (info) info.textContent = sunInfo + (sunMode === "auto" && gpxTime ? " · hora del GPX" : "");
  }

  // Sombras: un mapa de sombras que sigue al ciclista
  const SH = 50, MAP = 2048;
  R.renderer.shadowMap.enabled = true;
  R.renderer.shadowMap.type = 2; // PCFSoftShadowMap
  if (sun) {
    sun.castShadow = shadowsOn;
    sun.shadow.mapSize.set(MAP, MAP);
    const c = sun.shadow.camera; c.left = -SH; c.right = SH; c.top = SH; c.bottom = -SH; c.near = 1; c.far = 900; c.updateProjectionMatrix();
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
    R.scene.add(sun.target);
  }
  R.rider.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; } });
  const center = new T.Vector3(), tmp = new T.Vector3(), right = new T.Vector3(), up = new T.Vector3(), Y = new T.Vector3(0, 1, 0);
  function followSun() {
    if (!sun) return;
    R.rider.getWorldPosition(center);
    // fijar el centro a la grilla de texeles de la sombra para que no "tiemble" al avanzar
    right.crossVectors(Y, sunDir).normalize(); up.crossVectors(sunDir, right).normalize();
    const texel = (2 * SH) / MAP, a = Math.round(center.dot(right) / texel) * texel, b = Math.round(center.dot(up) / texel) * texel, cz = center.dot(sunDir);
    center.copy(right).multiplyScalar(a).addScaledVector(up, b).addScaledVector(sunDir, cz);
    sun.target.position.copy(center); sun.position.copy(center).addScaledVector(sunDir, 400);
    sun.target.updateMatrixWorld();
  }
  let shadowWorld = null, lastCount = -1;
  function markShadows(w) {
    let count = 0;
    w.traverse((o) => {
      if (!o.isMesh) return; count++;
      if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
      const big = !o.isInstancedMesh && o.geometry.boundingSphere && o.geometry.boundingSphere.radius > 60;
      if (big) { o.receiveShadow = true; o.castShadow = false; }   // terreno y ruta: reciben sombra
      else { o.castShadow = true; o.receiveShadow = false; }       // árboles, balizas, mojones, carteles: proyectan
    });
    return count;
  }
  setInterval(() => {
    try {
      const w = R.world && R.world(); if (!w) return;
      let n = 0; w.traverse(() => n++);
      if (w !== shadowWorld || n !== lastCount) { shadowWorld = w; lastCount = n; markShadows(w); }
    } catch (e) { console.warn("[mejoras3d] sombras", e); }
  }, 1500);
  let lastSunUpdate = 0, lastOrigin = null;
  function sunLoop(t) {
    try {
      if (S && S.origin !== lastOrigin) { lastOrigin = S.origin; updateSun(); lastSunUpdate = t; }
      if (t - lastSunUpdate > 5000) { updateSun(); lastSunUpdate = t; }
      followSun();
    } catch (e) { console.warn("[mejoras3d] sol", e); }
    requestAnimationFrame(sunLoop);
  }
  requestAnimationFrame(sunLoop);

  // Controles en el panel: hora del sol y sombras
  function addSunControls() {
    if (document.getElementById("rvSol")) return;
    const kitRow = document.getElementById("rvKit"); if (!kitRow) return;
    let lang = "es"; try { lang = localStorage.getItem("rv_lang") || (navigator.language || "es").slice(0, 2); } catch {}
    if (!["es", "en", "pt"].includes(lang)) lang = "es";
    const L = { es: ["Sol", "Hora actual / del GPX", "Sombras"], en: ["Sun", "Current time / GPX time", "Shadows"], pt: ["Sol", "Hora atual / do GPX", "Sombras"] }[lang];
    const wrap = document.createElement("div"); wrap.className = "rv-own";
    wrap.innerHTML = `<div class="row"><label>${L[0]} <select id="rvSol">${SUN_MODES.map((m) => `<option value="${m}">${m === "auto" ? L[1] : m}</option>`).join("")}</select></label>
      <label><input type="checkbox" id="rvSombras"> ${L[2]}</label></div><div class="st" id="rvSunInfo"></div>`;
    kitRow.closest(".row").after(wrap);
    const sel = wrap.querySelector("#rvSol"), chk = wrap.querySelector("#rvSombras");
    sel.value = sunMode; chk.checked = shadowsOn;
    sel.onchange = () => { sunMode = sel.value; try { localStorage.setItem("rv_sol", sunMode); } catch {} updateSun(); };
    chk.onchange = () => { shadowsOn = chk.checked; try { localStorage.setItem("rv_sombras", shadowsOn ? "1" : "0"); } catch {} if (sun) sun.castShadow = shadowsOn; };
    updateSun();
  }
  addSunControls();
})();
