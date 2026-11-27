/* RutaViva — arcos inflables de largada y llegada, con vallas, banderas y público que alienta.
   Todo lo que se ve escrito (arco, cartel colgante, vallas y banderas) se configura en arcos.json,
   así se puede vender ese espacio a marcas. La largada se mueve si elegís otro punto en la altimetría. */
(() => {
  "use strict";
  const S = () => window.__S, R = () => window.__R;
  const lang = () => (["es", "en", "pt"].includes(document.documentElement.lang) ? document.documentElement.lang : "es");
  const AUTO = {
    es: { largada: "LARGADA", llegada: "LLEGADA", dorso_largada: "¡BUENA RUTA!", dorso_llegada: "LLEGADA" },
    en: { largada: "START", llegada: "FINISH", dorso_largada: "HAVE A GREAT RIDE!", dorso_llegada: "FINISH" },
    pt: { largada: "LARGADA", llegada: "CHEGADA", dorso_largada: "BOA PEDALADA!", dorso_llegada: "CHEGADA" },
  };
  const DEF = {
    largada: { color_arco: "#ff5a1f", color_texto: "#ffffff", texto_arco: "RUTAVIVA  •  TU MARCA ACÁ", cartel: null, sponsor: "Tu marca acá", imagen: null },
    llegada: { color_arco: "#1d63ff", color_texto: "#ffffff", texto_arco: "RUTAVIVA  •  TU MARCA ACÁ", cartel: null, sponsor: "Tu marca acá", imagen: null },
    vallas: { texto: "RUTAVIVA", fondo: "#0f2a44", color_texto: "#ffffff", acento: "#ff6a2b" },
    banderas: [{ texto: "RUTAVIVA", fondo: "#ff6a2b", color_texto: "#ffffff" }, { texto: "TU MARCA", fondo: "#ffd23d", color_texto: "#14181f" }],
    publico: true, personas_por_arco: 70,
  };
  let cfg = null;
  const cfgReady = fetch("arcos.json", { cache: "no-cache" }).then((r) => (r.ok ? r.json() : {})).catch(() => ({})).then((j) => {
    cfg = Object.assign({}, DEF, j || {});
    cfg.largada = Object.assign({}, DEF.largada, (j || {}).largada);
    cfg.llegada = Object.assign({}, DEF.llegada, (j || {}).llegada);
    cfg.vallas = Object.assign({}, DEF.vallas, (j || {}).vallas);
    if (!Array.isArray(cfg.banderas) || !cfg.banderas.length) cfg.banderas = DEF.banderas;
  });

  function seeded(s) { return () => ((s = (s * 16807) % 2147483647) / 2147483647); }
  function mat(opts, std) {
    const r = R(), fx = r.fx;
    return fx ? fx.std(Object.assign({}, opts, std)) : new r.T.MeshLambertMaterial(opts);
  }
  function canvasTex(c) { const T = R().T, tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGB; tx.anisotropy = 8; return tx; }
  const images = new Map();
  function loadImg(src) {
    if (!src) return Promise.resolve(null);
    if (!images.has(src)) images.set(src, new Promise((ok) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; }));
    return images.get(src);
  }
  function fitText(g, txt, maxW, size, weight = "900") {
    let s = size; do { g.font = `${weight} ${s}px Arial Black, Arial, sans-serif`; s -= 4; } while (g.measureText(txt).width > maxW && s > 12);
  }

  // ───────────────────────── Geometrías ─────────────────────────
  // Arco: media elipse con tubo grueso (como los inflables). UV: u a lo largo del arco, v alrededor del tubo.
  function archGeo(A, B, rt) {
    const T = R().T, NU = 64, NV = 24, a0 = -0.14, a1 = Math.PI + 0.14;
    const pos = [], nor = [], uv = [], idx = [];
    for (let i = 0; i <= NU; i++) {
      const th = a0 + ((a1 - a0) * i) / NU, c = Math.cos(th), s = Math.sin(th);
      const cx = A * c, cy = B * s - 0.25;
      let nx = B * c, ny = A * s; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
      const bulge = 1 + 0.04 * Math.sin(i * 1.9); // costuras del inflable
      for (let j = 0; j <= NV; j++) {
        const ph = (2 * Math.PI * j) / NV, cp = Math.cos(ph), sp = Math.sin(ph), r = rt * bulge;
        pos.push(cx + r * cp * nx, cy + r * cp * ny, r * sp);
        nor.push(cp * nx, cp * ny, sp);
        uv.push(i / NU, j / NV);
      }
    }
    for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) {
      const a = i * (NV + 1) + j, b = a + NV + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.BufferAttribute(new Float32Array(pos), 3));
    g.setAttribute("normal", new T.BufferAttribute(new Float32Array(nor), 3));
    g.setAttribute("uv", new T.BufferAttribute(new Float32Array(uv), 2));
    g.setIndex(idx);
    return g;
  }
  // Textura del tubo: franja de texto adelante (v≈0.75, se lee al acercarse) y atrás (v≈0.25, rotada).
  function tubeTex(c) {
    const cv = document.createElement("canvas"); cv.width = 2048; cv.height = 512;
    const g = cv.getContext("2d");
    g.fillStyle = c.color_arco; g.fillRect(0, 0, 2048, 512);
    const sh = g.createLinearGradient(0, 0, 0, 512);
    sh.addColorStop(0, "rgba(0,0,0,.18)"); sh.addColorStop(0.5, "rgba(255,255,255,.06)"); sh.addColorStop(1, "rgba(0,0,0,.18)");
    g.fillStyle = sh; g.fillRect(0, 0, 2048, 512);
    const txt = (c.texto_arco || "").trim();
    const band = (cy, flip) => {
      g.save(); g.translate(1024, cy); if (flip) g.rotate(Math.PI);
      g.fillStyle = "rgba(255,255,255,.14)"; g.fillRect(-1024, -62, 2048, 124);
      if (txt) {
        g.font = "900 92px Arial Black, Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
        const w = g.measureText(txt + "     ").width; const n = Math.max(1, Math.floor(2048 / w)); const step = 2048 / n;
        g.fillStyle = c.color_texto;
        for (let k = 0; k < n; k++) g.fillText(txt, -1024 + step * (k + 0.5), 4);
      }
      g.restore();
    };
    band(128, false); band(384, true);
    const tx = canvasTex(cv); return tx;
  }
  async function bannerTex(c, title, back) {
    const cv = document.createElement("canvas"); cv.width = 1024; cv.height = 256;
    const g = cv.getContext("2d");
    g.fillStyle = "#ffffff"; g.fillRect(0, 0, 1024, 256);
    g.fillStyle = c.color_arco; g.fillRect(0, 0, 1024, 18); g.fillRect(0, 238, 1024, 18);
    const img = !back ? await loadImg(c.imagen) : null;
    g.textAlign = "center"; g.textBaseline = "middle";
    if (img) {
      const sc = Math.min(1000 / img.width, 210 / img.height), w = img.width * sc, h = img.height * sc;
      g.drawImage(img, 512 - w / 2, 128 - h / 2, w, h);
    } else {
      g.fillStyle = "#11161e"; fitText(g, title, 960, back ? 120 : 150); g.fillText(title, 512, back || !c.sponsor ? 132 : 110);
      if (!back && c.sponsor) { g.fillStyle = c.color_arco; fitText(g, c.sponsor, 900, 44, "700"); g.fillText(c.sponsor, 512, 205); }
    }
    return canvasTex(cv);
  }
  function fenceTex(v) {
    const cv = document.createElement("canvas"); cv.width = 512; cv.height = 128;
    const g = cv.getContext("2d");
    g.fillStyle = v.fondo; g.fillRect(0, 0, 512, 128);
    g.fillStyle = v.acento; g.fillRect(0, 0, 512, 10); g.fillRect(0, 118, 512, 10);
    g.fillStyle = v.color_texto; g.textAlign = "center"; g.textBaseline = "middle"; fitText(g, v.texto, 470, 72); g.fillText(v.texto, 256, 68);
    return canvasTex(cv);
  }
  function flagTex(f) {
    const cv = document.createElement("canvas"); cv.width = 128; cv.height = 512;
    const g = cv.getContext("2d");
    g.fillStyle = f.fondo; g.beginPath(); g.moveTo(0, 512); g.lineTo(0, 40); g.quadraticCurveTo(10, 0, 128, 10); g.lineTo(100, 512); g.closePath(); g.fill();
    g.save(); g.translate(60, 290); g.rotate(-Math.PI / 2); g.fillStyle = f.color_texto || "#fff"; g.textAlign = "center"; g.textBaseline = "middle";
    fitText(g, f.texto, 400, 64); g.fillText(f.texto, 0, 0); g.restore();
    const tx = canvasTex(cv); return tx;
  }

  // ───────────────────────── Armado ─────────────────────────
  let world = null, startG = null, finishG = null, crowds = [], buildId = 0, lastStartD = null;
  function dirAt(d) {
    const r = R(), s = S();
    const a = r.Me(Math.max(0, d - 6)), b = r.Me(Math.min(s.route.total, d + 6));
    let u = b.x - a.x, w = b.z - a.z; const L = Math.hypot(u, w) || 1; u /= L; w /= L;
    return { p: r.Me(d), u, w };
  }
  const groundAt = (x, z, fallback) => { const s = S(); try { const h = s.heightFn ? s.heightFn(x, z) : NaN; return isFinite(h) ? h : fallback; } catch { return fallback; } };

  async function buildArch(kind, d, combined) {
    await cfgReady;
    const r = R(), T = r.T, s = S(), c = cfg[kind], L = AUTO[lang()];
    const half = (r.roadWidth || 6) / 2, A = half + 1.35, B = 5.3, rt = 0.72;
    const { p, u, w } = dirAt(d);
    const grp = new T.Group(); grp.name = "rv-arco-" + kind;
    grp.position.set(p.x, p.y, p.z); grp.rotation.y = Math.atan2(u, w);
    // tubo inflable
    const tube = new T.Mesh(archGeo(A, B, rt), mat({ map: tubeTex(c) }, { roughness: 0.42, metalness: 0, envMapIntensity: 0.9 }));
    tube.castShadow = true; grp.add(tube);
    // bases (bolsas de lastre) y sogas
    const baseMat = mat({ color: 0x2b2f36 }, { roughness: 0.9 });
    for (const sx of [-1, 1]) {
      const b = new T.Mesh(new T.BoxGeometry(1.5, 0.35, 1.5), baseMat); b.position.set(sx * A, 0.1, 0); b.castShadow = true; grp.add(b);
      const st = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 4.6, 4), mat({ color: 0xdddddd }, { roughness: 0.6 }));
      st.position.set(sx * (A + 1.1), 1.9, 0); st.rotation.z = sx * 0.55; grp.add(st);
    }
    // cartel colgante (adelante y atrás)
    const front = await bannerTex(c, c.cartel || (combined ? L.largada + " · " + L.llegada : L[kind]), false), back = await bannerTex(c, kind === "largada" ? L.dorso_largada : L.dorso_llegada, true);
    // el cartel tiene que entrar dentro del arco: se ubica a la altura donde el hueco es lo bastante ancho
    let bh = 1.1, bw = 4 * bh;
    if (bw / 2 + rt + 0.15 >= A) { bw = 2 * (A - rt - 0.45); bh = bw / 4; }
    const yT = B * Math.sqrt(Math.max(0, 1 - Math.pow((bw / 2 + rt + 0.15) / A, 2))) - 0.25, by = yT - bh / 2;
    const pg = new T.PlaneGeometry(bw, bh);
    const pf = new T.Mesh(pg, mat({ map: front }, { roughness: 0.6, emissive: 0xffffff, emissiveMap: front, emissiveIntensity: 0.18 }));
    const pb = new T.Mesh(pg, mat({ map: back }, { roughness: 0.6, emissive: 0xffffff, emissiveMap: back, emissiveIntensity: 0.18 }));
    pf.position.set(0, by, -0.03); pf.rotation.y = Math.PI; pb.position.set(0, by, 0.03);
    grp.add(pf, pb);
    const cm = mat({ color: 0x222222 }, { roughness: 0.8 });
    for (const sx of [-1, 1]) {
      const x = sx * (bw / 2 - 0.3), yIn = B * Math.sqrt(Math.max(0, 1 - Math.pow(x / A, 2))) - 0.25 - rt * 0.9, len = Math.max(0.1, yIn - yT);
      const k = new T.Mesh(new T.CylinderGeometry(0.015, 0.015, len, 4), cm); k.position.set(x, yT + len / 2, 0); grp.add(k);
    }
    // línea pintada en el piso
    const line = new T.Mesh(new T.PlaneGeometry(2 * half, 0.5), mat({ color: kind === "llegada" ? 0xffffff : 0xf3f3f3 }, { roughness: 0.7 }));
    line.rotation.x = -Math.PI / 2; line.position.set(0, 0.06, 0); grp.add(line);
    if (kind === "llegada") {
      const cv = document.createElement("canvas"); cv.width = 256; cv.height = 32; const g = cv.getContext("2d");
      for (let i = 0; i < 16; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? "#111" : "#fff"; g.fillRect(i * 16, j * 16, 16, 16); }
      line.material = mat({ map: canvasTex(cv) }, { roughness: 0.7 });
    }
    // banderas tipo pluma
    const flagGeo = new T.PlaneGeometry(0.75, 3.0); flagGeo.translate(0.375, 1.5, 0);
    const pole = new T.CylinderGeometry(0.025, 0.03, 3.3, 6); pole.translate(0, 1.65, 0);
    const poleMat = mat({ color: 0xcfd4da }, { roughness: 0.35, metalness: 0.6 });
    const flags = [];
    [[-1, -7], [1, -7], [-1, 7], [1, 7]].forEach(([sx, dz], k) => {
      const f = cfg.banderas[k % cfg.banderas.length], tex = flagTex(f);
      const fg = new T.Group(); fg.position.set(sx * (A + 1.8), 0, dz);
      fg.add(new T.Mesh(pole, poleMat));
      const fm = new T.Mesh(flagGeo, mat({ map: tex, transparent: true, alphaTest: 0.5, side: 2 }, { roughness: 0.6 }));
      fm.position.y = 0.25; fg.add(fm); fg.rotation.y = Math.PI + sx * 0.5; flags.push(fm);
      grp.add(fg);
    });
    // apoyar todo sobre el terreno
    grp.updateMatrixWorld(true);
    grp.userData = { d, flags, kind };
    return grp;
  }

  // Vallas con publicidad y público alrededor del arco
  async function buildCrowd(kind, d) {
    await cfgReady;
    const r = R(), T = r.T, s = S();
    const half = (r.roadWidth || 6) / 2, rnd = seeded(kind === "largada" ? 1234 : 5678);
    const grp = new T.Group(); grp.name = "rv-publico-" + kind;
    const span = kind === "largada" ? [-28, 22] : [-45, 12];
    const dA = Math.max(0, d + span[0]), dB = Math.min(s.route.total, d + span[1]);
    // vallas
    const panel = 2.4, nPan = Math.max(0, Math.floor((dB - dA) / panel)) * 2;
    if (nPan) {
      const fGeo = new T.BoxGeometry(2.3, 1.0, 0.05); fGeo.translate(0, 0.55, 0);
      const fences = new T.InstancedMesh(fGeo, mat({ map: fenceTex(cfg.vallas) }, { roughness: 0.55 }), nPan);
      const m4 = new T.Matrix4(), q = new T.Quaternion(), up = new T.Vector3(0, 1, 0), v = new T.Vector3(), one = new T.Vector3(1, 1, 1);
      let k = 0;
      for (let dd = dA + panel / 2; dd < dB && k < nPan; dd += panel) {
        const { p, u, w } = dirAt(dd);
        for (const side of [-1, 1]) {
          if (Math.abs(dd - d) < 2.2) continue; // hueco bajo el arco
          const off = (half + 0.9) * side, x = p.x - w * off, z = p.z + u * off;
          v.set(x, groundAt(x, z, p.y) - 0.02, z); q.setFromAxisAngle(up, Math.atan2(u, w) + Math.PI / 2 * (side > 0 ? 1 : -1));
          m4.compose(v, q, one); fences.setMatrixAt(k++, m4);
        }
      }
      fences.count = k; fences.castShadow = true; grp.add(fences);
    }
    // público
    const people = [];
    if (cfg.publico !== false) {
      const N = Math.max(0, Math.min(160, cfg.personas_por_arco | 0));
      const shirts = [0xff3b30, 0xff9500, 0xffcc00, 0x34c759, 0x00a2ff, 0x5856d6, 0xaf52de, 0xff2d55, 0xffffff, 0x1c1c1e, 0x0a84ff, 0x30d158];
      const pants = [0x1f2a44, 0x222222, 0x3b3b3b, 0x6b5b3e, 0x2e4a7d, 0x4a4a4a];
      const skins = [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac, 0xd2a07a];
      for (let tries = 0; people.length < N && tries < N * 4; tries++) {
        const dd = dA + rnd() * (dB - dA);
        if (Math.abs(dd - d) < 3.5) continue; // nadie parado debajo del arco
        const side = rnd() < 0.5 ? -1 : 1, row = Math.floor(rnd() * 3);
        const { p, u, w } = dirAt(dd), off = (half + 1.5 + row * 0.75 + rnd() * 0.35) * side;
        const x = p.x - w * off, z = p.z + u * off;
        people.push({ x, z, y: groundAt(x, z, p.y), yaw: Math.atan2(p.x - x, p.z - z), d: dd, s: 0.92 + rnd() * 0.16,
          shirt: shirts[(rnd() * shirts.length) | 0], pant: pants[(rnd() * pants.length) | 0], skin: skins[(rnd() * skins.length) | 0],
          ph: rnd() * 6.28, f: 5 + rnd() * 4, cheer: rnd() < 0.8 });
      }
      if (people.length) {
        const n = people.length, M = (c) => mat({ color: 0xffffff }, { roughness: c });
        const legs = new T.InstancedMesh((() => { const g = new T.BoxGeometry(0.34, 0.82, 0.22); g.translate(0, 0.41, 0); return g; })(), M(0.85), n);
        const body = new T.InstancedMesh((() => { const g = new T.BoxGeometry(0.46, 0.62, 0.27); g.translate(0, 1.13, 0); return g; })(), M(0.75), n);
        const head = new T.InstancedMesh((() => { const g = new T.SphereGeometry(0.13, 10, 8); g.translate(0, 1.6, 0); return g; })(), M(0.7), n);
        const arms = new T.InstancedMesh((() => { const g = new T.BoxGeometry(0.11, 0.6, 0.11); g.translate(0, -0.28, 0); return g; })(), M(0.75), n * 2);
        const col = new T.Color();
        people.forEach((P, i) => {
          legs.setColorAt(i, col.setHex(P.pant)); body.setColorAt(i, col.setHex(P.shirt)); head.setColorAt(i, col.setHex(P.skin));
          arms.setColorAt(2 * i, col.setHex(P.shirt)); arms.setColorAt(2 * i + 1, col.setHex(P.shirt));
        });
        [legs, body, head, arms].forEach((m) => { m.castShadow = true; m.frustumCulled = false; grp.add(m); });
        grp.userData.crowd = { people, legs, body, head, arms };
        poseCrowd(grp.userData.crowd, 0, 1e9);
      }
    }
    grp.userData.d = d;
    return grp;
  }

  // Animación: con el ciclista cerca, levantan los brazos y saltan.
  const tmp = {};
  function poseCrowd(c, time, riderDist) {
    const T = R().T;
    if (!tmp.m4) { tmp.m4 = new T.Matrix4(); tmp.q = new T.Quaternion(); tmp.q2 = new T.Quaternion(); tmp.v = new T.Vector3(); tmp.sc = new T.Vector3(); tmp.up = new T.Vector3(0, 1, 0); tmp.fw = new T.Vector3(0, 0, 1); tmp.sh = new T.Vector3(); }
    const { m4, q, q2, v, sc, up, fw, sh } = tmp;
    c.people.forEach((P, i) => {
      const near = Math.abs(P.d - riderDist) < 70, k = near ? 1 : 0;
      const wave = Math.sin(time * P.f + P.ph);
      const jump = near && P.cheer ? Math.max(0, Math.sin(time * P.f * 0.55 + P.ph)) * 0.16 : 0;
      q.setFromAxisAngle(up, P.yaw + (near ? 0 : 0.15 * Math.sin(time * 0.6 + P.ph)));
      sc.set(P.s, P.s, P.s); v.set(P.x, P.y + jump, P.z);
      m4.compose(v, q, sc); c.legs.setMatrixAt(i, m4); c.body.setMatrixAt(i, m4); c.head.setMatrixAt(i, m4);
      for (const side of [-1, 1]) {
        const base = near && P.cheer ? 2.5 + 0.35 * wave * side : 0.12 + (near ? 0.6 + 0.5 * Math.abs(wave) : 0.05 * wave);
        q2.setFromAxisAngle(fw, side * base);
        sh.set(side * 0.29 * P.s, 1.4 * P.s, 0).applyQuaternion(q); v.set(P.x + sh.x, P.y + jump + sh.y, P.z + sh.z);
        m4.compose(v, q.clone().multiply(q2), sc); c.arms.setMatrixAt(2 * i + (side > 0 ? 1 : 0), m4);
      }
    });
    c.legs.instanceMatrix.needsUpdate = c.body.instanceMatrix.needsUpdate = c.head.instanceMatrix.needsUpdate = c.arms.instanceMatrix.needsUpdate = true;
  }

  function remove(g) { if (g && g.parent) g.parent.remove(g); }
  // Ruta circular: largada y llegada en el mismo lugar → un solo arco "LARGADA · LLEGADA" adelante del ciclista.
  function isLoop() { const r = R(), s = S(), a = r.Me(0), b = r.Me(s.route.total); return Math.hypot(a.x - b.x, a.z - b.z) < 40; }
  async function rebuildAll() {
    const r = R(), s = S(), id = ++buildId;
    [startG, finishG, ...crowds].forEach(remove); startG = finishG = null; crowds = [];
    world = r && r.world(); if (!world || !s.route || s.route.total < 200) return;
    try {
      const fc = await buildCrowd("llegada", s.route.total - 2);
      if (id !== buildId || r.world() !== world) return;
      crowds.push(fc); world.add(fc);
      await placeStart(s.startTime === null ? s.d || 0 : s.d0 || 0, id);
    } catch (e) { console.warn("[arcos]", e); }
  }
  async function placeStart(d, id = buildId) {
    const r = R(), s = S();
    if (!world || !s.route) return;
    lastStartD = d;
    const total = s.route.total, combined = isLoop() && d < 40;
    if (combined && finishG) { remove(finishG); finishG = null; }
    if (!combined && !finishG) {
      const fa = await buildArch("llegada", total - 2, false);
      if (id !== buildId || r.world() !== world) return;
      if (!finishG) { finishG = fa; world.add(fa); }
    }
    const sd = Math.min(d + 6, total - 60); // el arco queda unos metros adelante del ciclista
    const dropStart = () => { remove(startG); startG = null; crowds = crowds.filter((c) => { if (c.name === "rv-publico-largada") { remove(c); return false; } return true; }); };
    if (sd < 0 || (!combined && total - 2 - sd < 60)) { dropStart(); return; }
    const [sa, sc] = await Promise.all([buildArch("largada", sd, combined), buildCrowd("largada", sd)]);
    if (id !== buildId || r.world() !== world || lastStartD !== d) return;
    dropStart();
    startG = sa; crowds.push(sc); world.add(sa, sc);
  }
  let startTimer = null;
  addEventListener("rv-largada", (e) => {
    const d = (e.detail && e.detail.d) || 0;
    clearTimeout(startTimer);
    startTimer = setTimeout(() => placeStart(d), e.detail && e.detail.end ? 0 : 250);
  });
  new MutationObserver(() => { if (world) rebuildAll(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

  // ───────────────────────── Bucle ─────────────────────────
  let lastWorld = null, lastRoute = null, last = performance.now();
  function tick(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    try {
      const r = R(), s = S();
      if (r && s) {
        const w = r.world();
        if ((w !== lastWorld || s.route !== lastRoute) && !s.loading) { lastWorld = w; lastRoute = s.route; if (w && s.route) rebuildAll(); else world = null; }
        if (world && s.route) {
          for (const c of crowds) if (c.userData.crowd && Math.abs(c.userData.d - s.d) < 250) poseCrowd(c.userData.crowd, now / 1000, s.d);
          for (const g of [startG, finishG]) if (g && g.userData.flags) g.userData.flags.forEach((f, i) => (f.rotation.y = 0.18 * Math.sin(now / 420 + i * 1.7)));
        }
      }
    } catch (e) { console.warn("[arcos]", e); }
    requestAnimationFrame(tick);
  }
  function start() { requestAnimationFrame(tick); }
  if (window.__R) start(); else addEventListener("rodillo-listo", start, { once: true });
})();
