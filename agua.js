/* RutaViva — agua: lagos, embalses y ríos según el mapa de OpenStreetMap (© colaboradores de OpenStreetMap).
   Al cargar una ruta se descargan las superficies de agua de la zona (Overpass API), se dibujan como agua
   que se mueve y refleja el cielo, y se hunde el terreno debajo para que no la tape. */
(() => {
  "use strict";
  const R = window.__R, S = window.__S;
  if (!R || !S) return;
  const T = R.T, D2R = Math.PI / 180, RT = 6371e3;
  const earcut = window.earcut && (window.earcut.default || window.earcut);
  const $ = (id) => document.getElementById(id);
  const ls = { get: (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };
  let enabled = ls.get("rv_agua", "1") !== "0";
  const ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];

  // ───────────── Material del agua: normal map procedural que se desplaza ─────────────
  function waterNormalMap() {
    const N = 256, h = new Float32Array(N * N);
    const waves = []; let seed = 5; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 18; i++) waves.push({ kx: Math.round((rnd() - 0.5) * 16), ky: Math.round((rnd() - 0.5) * 16), a: 0.4 + rnd(), p: rnd() * 6.28 });
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let v = 0; for (const w of waves) v += w.a * Math.sin(((w.kx * x + w.ky * y) / N) * 6.2832 + w.p);
      h[y * N + x] = v;
    }
    const c = document.createElement("canvas"); c.width = c.height = N; const g = c.getContext("2d"), img = g.createImageData(N, N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const dx = h[y * N + ((x + 1) % N)] - h[y * N + ((x - 1 + N) % N)], dy = h[((y + 1) % N) * N + x] - h[((y - 1 + N) % N) * N + x];
      const nx = -dx * 0.12, ny = -dy * 0.12, nz = 1, l = Math.hypot(nx, ny, nz), i = (y * N + x) * 4;
      img.data[i] = (nx / l * 0.5 + 0.5) * 255; img.data[i + 1] = (ny / l * 0.5 + 0.5) * 255; img.data[i + 2] = (nz / l * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = 1000; return t;
  }
  let waterMat = null, normalTex = null;
  function getWaterMat() {
    if (waterMat) return waterMat;
    normalTex = waterNormalMap(); normalTex.repeat.set(1, 1);
    const Std = R.fx && R.fx.MeshStandardMaterial;
    waterMat = Std ? new Std({ color: 0x0b3d55, roughness: 0.13, metalness: 0.0, envMapIntensity: 0.8, normalMap: normalTex, side: 2, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 })
                   : new T.MeshLambertMaterial({ color: 0x2b6178 });
    if (Std) waterMat.normalScale.set(0.45, 0.45);
    return waterMat;
  }
  // olas en movimiento
  let lastT = performance.now();
  (function anim(t) { const dt = (t - lastT) / 1000; lastT = t; if (normalTex) { normalTex.offset.x += dt * 0.012; normalTex.offset.y += dt * 0.007; } requestAnimationFrame(anim); })(lastT);

  // ───────────── Coordenadas ─────────────
  function toXZ(lat, lon) { const o = S.origin; return [(lon - o.lon) * D2R * RT * o.k, -(lat - o.lat) * D2R * RT]; }
  function toLatLon(x, z) { const o = S.origin; return [o.lat - z / (D2R * RT), o.lon + x / (D2R * RT * o.k)]; }

  // ───────────── Descarga (Overpass) ─────────────
  async function fetchWater(s, w, n, e) {
    const bb = `${s.toFixed(5)},${w.toFixed(5)},${n.toFixed(5)},${e.toFixed(5)}`;
    const q = `[out:json][timeout:30];(way["natural"="water"](${bb});relation["natural"="water"](${bb});way["waterway"="riverbank"](${bb});way["landuse"="reservoir"](${bb});relation["landuse"="reservoir"](${bb});way["waterway"~"^(river|canal)$"](${bb}););out geom qt;`;
    const key = "rv_agua_" + bb;
    try { const c = sessionStorage.getItem(key); if (c) return JSON.parse(c); } catch {}
    for (const url of ENDPOINTS) {
      try {
        const r = await fetch(url, { method: "POST", body: "data=" + encodeURIComponent(q), headers: { "Content-Type": "application/x-www-form-urlencoded" } });
        if (!r.ok) continue;
        const j = await r.json();
        try { sessionStorage.setItem(key, JSON.stringify(j)); } catch {}
        return j;
      } catch (err) { console.warn("[agua] overpass", url, err); }
    }
    return null;
  }

  // ───────────── Armado de anillos (polígonos) ─────────────
  function joinWays(ways) {
    // une tramos abiertos de una relación en anillos cerrados
    const rings = [], pool = ways.filter((w) => w.length >= 2).map((w) => w.slice());
    const same = (a, b) => Math.abs(a.lat - b.lat) < 1e-7 && Math.abs(a.lon - b.lon) < 1e-7;
    while (pool.length) {
      let ring = pool.shift(), guard = 0;
      while (!same(ring[0], ring[ring.length - 1]) && guard++ < 5000) {
        const end = ring[ring.length - 1]; let found = false;
        for (let i = 0; i < pool.length; i++) {
          const w = pool[i];
          if (same(w[0], end)) { ring = ring.concat(w.slice(1)); pool.splice(i, 1); found = true; break; }
          if (same(w[w.length - 1], end)) { ring = ring.concat(w.slice(0, -1).reverse()); pool.splice(i, 1); found = true; break; }
        }
        if (!found) break;
      }
      if (ring.length >= 4 && same(ring[0], ring[ring.length - 1])) rings.push(ring);
    }
    return rings;
  }
  function areaXZ(pts) { let a = 0; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]); return Math.abs(a / 2); }
  function inside(x, z, ring) { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const xi = ring[i][0], zi = ring[i][1], xj = ring[j][0], zj = ring[j][1]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c; }
  function percentile(arr, p) { const a = arr.filter(isFinite).sort((x, y) => x - y); return a.length ? a[Math.min(a.length - 1, Math.floor(a.length * p))] : NaN; }

  // ───────────── Construcción ─────────────
  function terrainMesh(world) {
    let best = null;
    world.traverse((o) => { if (o.isMesh && !o.isInstancedMesh && o.geometry.type === "PlaneGeometry") { if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); const r = o.geometry.boundingSphere.radius; if (r > 400 && o.geometry.attributes.position.count > 4 && (!best || r > best.geometry.boundingSphere.radius)) best = o; } });
    return best;
  }
  function polygonsFrom(data) {
    const polys = [], lines = [];
    for (const el of data.elements || []) {
      const tg = el.tags || {};
      if (el.type === "way" && el.geometry) {
        const g = el.geometry;
        if (tg.waterway === "river" || tg.waterway === "canal") lines.push({ pts: g, width: parseFloat(tg.width) || (tg.waterway === "river" ? 14 : 8) });
        else if (g.length >= 4) polys.push({ outer: [g], inner: [] });
      } else if (el.type === "relation" && el.members) {
        const outer = joinWays(el.members.filter((m) => m.type === "way" && m.role !== "inner" && m.geometry).map((m) => m.geometry));
        const inner = joinWays(el.members.filter((m) => m.type === "way" && m.role === "inner" && m.geometry).map((m) => m.geometry));
        for (const o of outer) polys.push({ outer: [o], inner });
      }
    }
    return { polys, lines };
  }
  function buildWater(world, data) {
    const hf = S.heightFn; if (!hf || !earcut) return null;
    const terr = terrainMesh(world);
    const group = new T.Group(); group.name = "rv-agua";
    const mat = getWaterMat();
    const { polys, lines } = polygonsFrom(data);
    const carves = []; // { ring, level } y { seg, level, half }
    // lagos y embalses
    for (const P of polys) {
      const outer = P.outer[0].map((p) => toXZ(p.lat, p.lon)); if (outer.length > 1) outer.pop();
      if (outer.length < 3 || areaXZ(outer) < 600) continue;
      const holes = P.inner.map((r) => { const q = r.map((p) => toXZ(p.lat, p.lon)); q.pop(); return q; })
        .filter((q) => q.length >= 3 && inside(q[0][0], q[0][1], outer));
      const hs = outer.map(([x, z]) => hf(x, z));
      const level = percentile(hs, 0.15); if (!isFinite(level)) continue;
      const flat = [], holeIdx = [];
      for (const [x, z] of outer) flat.push(x, z);
      for (const hq of holes) { holeIdx.push(flat.length / 2); for (const [x, z] of hq) flat.push(x, z); }
      const tri = earcut(flat, holeIdx.length ? holeIdx : undefined, 2); if (!tri.length) continue;
      const n = flat.length / 2, pos = new Float32Array(n * 3), uv = new Float32Array(n * 2), nor = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { pos[i * 3] = flat[i * 2]; pos[i * 3 + 1] = level; pos[i * 3 + 2] = flat[i * 2 + 1]; uv[i * 2] = flat[i * 2] / 25; uv[i * 2 + 1] = flat[i * 2 + 1] / 25; nor[i * 3 + 1] = 1; }
      const geo = new T.BufferGeometry();
      geo.setAttribute("position", new T.BufferAttribute(pos, 3)); geo.setAttribute("normal", new T.BufferAttribute(nor, 3)); geo.setAttribute("uv", new T.BufferAttribute(uv, 2));
      // los índices de earcut apuntan hacia abajo o arriba según el sentido del anillo: los ponemos mirando hacia arriba
      const idx = Uint32Array.from(tri);
      for (let i = 0; i < idx.length; i += 3) { const a = idx[i], b = idx[i + 1], c = idx[i + 2]; const cr = (flat[b * 2] - flat[a * 2]) * (flat[c * 2 + 1] - flat[a * 2 + 1]) - (flat[b * 2 + 1] - flat[a * 2 + 1]) * (flat[c * 2] - flat[a * 2]); if (cr > 0) { idx[i + 1] = c; idx[i + 2] = b; } }
      geo.setIndex(new T.BufferAttribute(idx, 1));
      const m = new T.Mesh(geo, mat); m.receiveShadow = true; group.add(m);
      carves.push({ ring: outer, holes, level, box: bbox(outer) });
    }
    // ríos y canales: cinta que sigue el cauce
    for (const L of lines) {
      const pts = L.pts.map((p) => toXZ(p.lat, p.lon)); if (pts.length < 2) continue;
      const half = Math.max(3, Math.min(60, L.width / 2));
      const hs = pts.map(([x, z]) => hf(x, z));
      // el agua no sube: suavizamos y limitamos para que la cinta no trepe laderas
      const lv = hs.map((h, i) => percentile(hs.slice(Math.max(0, i - 3), i + 4), 0.2) - 0.2);
      const pos = [], uv = [], nor = [], ind = []; let acc = 0;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
        let dx = b[0] - a[0], dz = b[1] - a[1]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
        const sx = -dz * half, sz = dx * half; if (i) acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        pos.push(pts[i][0] + sx, lv[i], pts[i][1] + sz, pts[i][0] - sx, lv[i], pts[i][1] - sz);
        uv.push(0, acc / 25, (2 * half) / 25, acc / 25); nor.push(0, 1, 0, 0, 1, 0);
        if (i) { const k = (i - 1) * 2; ind.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
        if (i) carves.push({ seg: [pts[i - 1], pts[i]], level: Math.min(lv[i - 1], lv[i]), half, box: bbox([pts[i - 1], pts[i]], half + 4) });
      }
      const geo = new T.BufferGeometry();
      geo.setAttribute("position", new T.BufferAttribute(new Float32Array(pos), 3)); geo.setAttribute("normal", new T.BufferAttribute(new Float32Array(nor), 3)); geo.setAttribute("uv", new T.BufferAttribute(new Float32Array(uv), 2)); geo.setIndex(ind);
      const mm = new T.Mesh(geo, mat); mm.material = mat; mm.receiveShadow = true;
      // la cinta se ve de los dos lados (el sentido del río puede invertir los triángulos)
      group.add(mm);
    }
    if (terr && carves.length) carveTerrain(terr, carves);
    if (carves.length) clearVegetation(world, carves);
    return group;
  }
  // saca árboles y arbustos que quedaron adentro del agua (escala cero en esa instancia)
  function inWater(x, z, carves) {
    for (const c of carves) {
      const b = c.box; if (x < b[0] || x > b[1] || z < b[2] || z > b[3]) continue;
      if (c.ring) { if (inside(x, z, c.ring) && !c.holes.some((h) => inside(x, z, h))) return true; }
      else if (segDist(x, z, c.seg[0], c.seg[1]) < c.half + 3) return true;
    }
    return false;
  }
  function clearVegetation(world, carves) {
    const m = new T.Matrix4(), zero = new T.Matrix4().makeScale(0, 0, 0), pos = new T.Vector3(), q = new T.Quaternion(), sc = new T.Vector3();
    world.traverse((o) => {
      if (!o.isInstancedMesh || o.parent && o.parent.name === "rv-agua") return;
      let changed = false;
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, m); m.decompose(pos, q, sc); if (sc.x === 0) continue;
        pos.applyMatrix4(o.matrixWorld);
        if (inWater(pos.x, pos.z, carves)) { o.setMatrixAt(i, zero); changed = true; }
      }
      if (changed) o.instanceMatrix.needsUpdate = true;
    });
  }
  function bbox(pts, pad = 2) { let x0 = 1e18, x1 = -1e18, z0 = 1e18, z1 = -1e18; for (const [x, z] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); } return [x0 - pad, x1 + pad, z0 - pad, z1 + pad]; }
  function segDist(x, z, a, b) { const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1; let t = ((x - a[0]) * dx + (z - a[1]) * dz) / l2; t = Math.max(0, Math.min(1, t)); return Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz); }
  function carveTerrain(o, carves) {
    o.updateMatrixWorld(); const inv = o.matrixWorld.clone().invert(), v = new T.Vector3(), p = o.geometry.attributes.position; let changed = 0;
    // grilla de 150 m: cada celda guarda solo el agua que la toca
    const CELL = 150, grid = new Map(), key = (i, j) => i * 1000003 + j;
    for (const c of carves) {
      const b = c.box, i0 = Math.floor(b[0] / CELL), i1 = Math.floor(b[1] / CELL), j0 = Math.floor(b[2] / CELL), j1 = Math.floor(b[3] / CELL);
      if ((i1 - i0 + 1) * (j1 - j0 + 1) > 40000) continue; // lagos gigantes: los resuelve el nivel del agua
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const k2 = key(i, j); let a = grid.get(k2); if (!a) grid.set(k2, (a = [])); a.push(c); }
    }
    for (let k = 0; k < p.count; k++) {
      v.fromBufferAttribute(p, k).applyMatrix4(o.matrixWorld);
      const list = grid.get(key(Math.floor(v.x / CELL), Math.floor(v.z / CELL))); if (!list) continue;
      let lim = Infinity;
      for (const c of list) {
        const b = c.box; if (v.x < b[0] || v.x > b[1] || v.z < b[2] || v.z > b[3]) continue;
        if (c.ring) { if (inside(v.x, v.z, c.ring) && !c.holes.some((h) => inside(v.x, v.z, h))) lim = Math.min(lim, c.level - 1.2); }
        else if (segDist(v.x, v.z, c.seg[0], c.seg[1]) < c.half + 2) lim = Math.min(lim, c.level - 0.8);
      }
      if (v.y > lim) { v.y = lim; v.applyMatrix4(inv); p.setY(k, v.y); changed++; }
    }
    if (changed) { p.needsUpdate = true; o.geometry.computeVertexNormals(); }
  }

  // ───────────── Ciclo: cuando cambia la ruta ─────────────
  let doneWorld = null, busy = false;
  async function update() {
    const w = R.world && R.world();
    if (!w || w === doneWorld || busy || !S.route || !S.origin) return;
    doneWorld = w;
    if (!enabled) return;
    const terr = terrainMesh(w); if (!terr) { doneWorld = null; return; }
    busy = true;
    try {
      terr.geometry.computeBoundingBox(); terr.updateMatrixWorld();
      const bb = terr.geometry.boundingBox.clone().applyMatrix4(terr.matrixWorld);
      const [n, wl] = toLatLon(bb.min.x, bb.min.z), [s, e] = toLatLon(bb.max.x, bb.max.z);
      const data = await fetchWater(Math.min(n, s), Math.min(wl, e), Math.max(n, s), Math.max(wl, e));
      if (!data || R.world() !== w) return;
      const g = buildWater(w, data);
      if (g && g.children.length) { w.add(g); credit(true); }
    } catch (err) { console.warn("[agua]", err); } finally { busy = false; }
  }
  function credit(on) {
    const a = $("attrib"); if (!a) return;
    const tag = " · Agua: © OpenStreetMap";
    if (on && !a.textContent.includes(tag)) a.textContent += tag;
  }
  setInterval(update, 1500);

  // casilla en el panel
  function addToggle() {
    const anchor = $("chkTrees"); if (!anchor) return setTimeout(addToggle, 500);
    if ($("rvAgua")) return;
    let lang = ls.get("rv_lang", (navigator.language || "es").slice(0, 2)); if (!["es", "en", "pt"].includes(lang)) lang = "es";
    const label = { es: "Lagos, ríos y agua (OpenStreetMap)", en: "Lakes, rivers and water (OpenStreetMap)", pt: "Lagos, rios e água (OpenStreetMap)" }[lang];
    const row = document.createElement("div"); row.className = "row rv-own";
    row.innerHTML = `<label><input type="checkbox" id="rvAgua"> ${label}</label>`;
    anchor.closest(".row").after(row);
    const c = $("rvAgua"); c.checked = enabled;
    c.onchange = () => {
      enabled = c.checked; ls.set("rv_agua", enabled ? "1" : "0");
      const w = R.world && R.world(); if (!w) return;
      const g = w.getObjectByName("rv-agua");
      if (g) g.visible = enabled; else if (enabled) { doneWorld = null; update(); }
    };
  }
  addToggle();
})();
