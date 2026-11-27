/* RutaViva — árboles realistas cerca del ciclista.
   Los árboles de la ruta (conos y copas redondas de mejoras3d.js) se reemplazan, solo en un radio alrededor
   del ciclista, por árboles con tronco, ramas, hojas y corteza reales (generados con ez-tree, MIT;
   texturas de Poly Haven y TextureCan, CC0). Los de lejos quedan livianos, así la compu no sufre.
   Se activa o desactiva con "Árboles realistas" en el panel (se recuerda en el navegador). */
(() => {
  "use strict";
  const S = () => window.__S, R = () => window.__R;
  const RADIUS = 230, MAX_NEAR = 360, BASE = "arboles/";
  const LS = "rv_arboles_hd";
  const lang = () => (["es", "en", "pt"].includes(document.documentElement.lang) ? document.documentElement.lang : "es");
  const LBL = { es: "Árboles realistas (más pesado)", en: "Realistic trees (heavier)", pt: "Árvores realistas (mais pesado)" };
  let enabled = (() => { try { const v = localStorage.getItem(LS); if (v !== null) return v === "1"; } catch {} return !/Mobi|Android/i.test(navigator.userAgent); })();

  // ───────────────────────── Carga de modelos y texturas ─────────────────────────
  let lib = null, loading = null;
  function img(src) { return new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = BASE + src; }); }
  function tex(image, repeat, srgb) {
    const T = R().T, t = new T.CanvasTexture(image);
    if (srgb) t.colorSpace = T.SRGB;
    t.wrapS = t.wrapT = 1000; // RepeatWrapping
    if (repeat) t.repeat.set(repeat.x, repeat.y);
    t.anisotropy = 4; t.needsUpdate = true; return t;
  }
  async function load() {
    if (lib) return lib; if (loading) return loading;
    loading = (async () => {
      const [meta, bin] = await Promise.all([fetch(BASE + "arboles.json").then((r) => r.json()), fetch(BASE + "arboles.bin").then((r) => r.arrayBuffer())]);
      const T = R().T;
      const imgs = {};
      const need = new Set();
      for (const v of Object.values(meta)) { need.add(v.bark + "_color_1k.jpg"); if (v.bark !== "birch") need.add(v.bark + "_normal_1k.jpg"); need.add(v.leaf + "_color.png"); }
      await Promise.all([...need].map(async (n) => { imgs[n] = await img(n); }));
      const arr = (ref, Ctor) => new Ctor(bin, ref[0], ref[1]);
      const mk = (g) => {
        const geo = new T.BufferGeometry();
        geo.setAttribute("position", new T.BufferAttribute(arr(g.p, Float32Array), 3));
        geo.setAttribute("normal", new T.BufferAttribute(arr(g.n, Float32Array), 3));
        geo.setAttribute("uv", new T.BufferAttribute(arr(g.uv, Float32Array), 2));
        if (g.i) geo.setIndex(new T.BufferAttribute(g.i[2] === 16 ? arr(g.i, Uint16Array) : arr(g.i, Uint32Array), 1));
        geo.computeBoundingSphere();
        return geo;
      };
      const out = {};
      for (const [id, v] of Object.entries(meta)) {
        const barkMat = new T.MeshStandardMaterial({ color: v.barkTint, map: tex(imgs[v.bark + "_color_1k.jpg"], v.texScale, true), roughness: 0.95,
          normalMap: v.bark !== "birch" ? tex(imgs[v.bark + "_normal_1k.jpg"], v.texScale, false) : null });
        const leafMat = new T.MeshStandardMaterial({ color: v.leafTint, map: tex(imgs[v.leaf + "_color.png"], null, true), alphaTest: v.alphaTest || 0.5,
          side: 2, roughness: 0.8, envMapIntensity: 0.5 });
        out[id] = { h: v.h, bark: mk(v.b), leaves: mk(v.l), barkMat, leafMat };
      }
      lib = out; return lib;
    })();
    return loading;
  }

  // ───────────────────────── Árboles de la ruta ─────────────────────────
  // Cada árbol: dónde está su base, su altura, qué tipo es y cómo esconder/mostrar su versión liviana.
  let world = null, trees = [], groups = [], scanned = new Set(), near = new Set(), lastUpdate = 0;
  const PINES = ["pino", "pino_chico"], LEAFY = ["roble", "fresno", "alamo", "arbusto"];
  function scan() {
    const T = R().T, w = R().world(); if (!w) return;
    const meshes = [];
    w.traverse((o) => { if (o.isInstancedMesh && o.userData.rvTree && !scanned.has(o)) meshes.push(o); });
    if (!meshes.length) return;
    const m = new T.Matrix4(), pos = new T.Vector3(), q = new T.Quaternion(), sc = new T.Vector3(), v = new T.Vector3();
    for (const f of meshes) {
      scanned.add(f);
      const pine = f.userData.rvTree === "pine";
      const src = pine ? f : f.userData.src;
      const parent = src.parent || w;
      const trunk = parent.children.find((c) => c.isInstancedMesh && c.userData.rvTrunk && c.count === src.count);
      f.geometry.computeBoundingBox(); // siempre de nuevo: el clon puede traer la caja vieja
      const top = f.geometry.boundingBox.max.y;
      let base = 0;
      if (trunk) { trunk.geometry.computeBoundingBox(); base = trunk.geometry.boundingBox.min.y; }
      src.updateMatrixWorld(true); const ws = new T.Vector3().setFromMatrixScale(src.matrixWorld).y || 1;
      const list = pine ? [...Array(f.count).keys()] : f.userData.ids.map((id, j) => j);
      for (const j of list) {
        f.getMatrixAt(j, m); m.decompose(pos, q, sc);
        if (sc.y < 1e-4) continue; // esta instancia está escondida (pasó a copa redonda)
        const ti = pine ? j : f.userData.ids[j];
        const orig = m.clone(), torig = trunk ? (trunk.getMatrixAt(ti, m), m.clone()) : null;
        v.set(0, base, 0).applyMatrix4(orig);
        const h = (top - base) * sc.y;
        const seed = Math.abs(Math.sin(v.x * 12.9898 + v.z * 78.233) * 43758.5453) % 1;
        const hw = h * ws, kind = pine ? PINES[hw < 6 || seed > 0.65 ? 1 : 0] : (hw < 3 ? "arbusto" : LEAFY[Math.floor(seed * 3)]);
        trees.push({ f, j, trunk, ti, orig, torig, x: v.x, y: v.y, z: v.z, h, hw, kind, yaw: seed * Math.PI * 2, src });
      }
    }
  }
  function ensureGroups(src) {
    let g = groups.find((x) => x.src === src);
    if (g) return g;
    const T = R().T, parent = src.parent || R().world(); g = { src, meshes: {} };
    for (const [id, v] of Object.entries(lib)) {
      const b = new T.InstancedMesh(v.bark, v.barkMat, MAX_NEAR), l = new T.InstancedMesh(v.leaves, v.leafMat, MAX_NEAR);
      b.count = l.count = 0; b.castShadow = true; b.receiveShadow = false; l.castShadow = false; l.receiveShadow = true;
      b.frustumCulled = l.frustumCulled = false; b.name = "rv-arbol-" + id; l.name = "rv-hojas-" + id;
      for (const x of [b, l]) { x.position.copy(src.position); x.quaternion.copy(src.quaternion); x.scale.copy(src.scale); }
      parent.add(b, l); g.meshes[id] = { b, l };
    }
    groups.push(g); return g;
  }
  const ZERO = (() => { let z = null; return () => z || (z = new (R().T.Matrix4)().makeScale(0, 0, 0)); })();
  function hide(t) { t.f.setMatrixAt(t.j, ZERO()); t.f.instanceMatrix.needsUpdate = true; if (t.trunk) { t.trunk.setMatrixAt(t.ti, ZERO()); t.trunk.instanceMatrix.needsUpdate = true; } }
  function show(t) { t.f.setMatrixAt(t.j, t.orig); t.f.instanceMatrix.needsUpdate = true; if (t.trunk) { t.trunk.setMatrixAt(t.ti, t.torig); t.trunk.instanceMatrix.needsUpdate = true; } }
  function update() {
    const s = S(), r = R(); if (!s || !s.route || !lib) return;
    const T = r.T, pw = r.Me(s.d), p = { x: pw.x, z: pw.z };
    if (trees.length && trees[0].src) { const inv = new T.Matrix4().copy(trees[0].src.matrixWorld).invert(), lp = new T.Vector3(pw.x, pw.y, pw.z).applyMatrix4(inv); p.x = lp.x; p.z = lp.z; }
    const want = new Set();
    const cand = [];
    for (const t of trees) { const dx = t.x - p.x, dz = t.z - p.z, d2 = dx * dx + dz * dz; if (d2 < RADIUS * RADIUS) cand.push([d2, t]); }
    cand.sort((a, b) => a[0] - b[0]);
    for (let i = 0; i < cand.length && i < MAX_NEAR; i++) want.add(cand[i][1]);
    for (const t of near) if (!want.has(t)) show(t);
    for (const t of want) if (!near.has(t)) hide(t);
    near = want;
    // volcar los cercanos en los árboles detallados
    const m = new T.Matrix4(), q = new T.Quaternion(), up = new T.Vector3(0, 1, 0), pos = new T.Vector3(), sc = new T.Vector3();
    const counts = new Map();
    for (const g of groups) for (const id in g.meshes) { g.meshes[id].b.count = 0; g.meshes[id].l.count = 0; }
    for (const t of near) {
      const g = ensureGroups(t.src), mm = g.meshes[t.kind], v = lib[t.kind];
      const k = mm.b.count; if (k >= MAX_NEAR) continue;
      const s2 = (t.h * 1.12) / v.h;
      q.setFromAxisAngle(up, t.yaw); pos.set(t.x, t.y - 0.05, t.z); sc.set(s2, s2, s2);
      m.compose(pos, q, sc); mm.b.setMatrixAt(k, m); mm.l.setMatrixAt(k, m);
      mm.b.count = mm.l.count = k + 1;
    }
    for (const g of groups) for (const id in g.meshes) { g.meshes[id].b.instanceMatrix.needsUpdate = true; g.meshes[id].l.instanceMatrix.needsUpdate = true; }
  }
  function reset() {
    for (const t of near) { try { show(t); } catch {} }
    near = new Set();
    for (const g of groups) for (const id in g.meshes) { g.meshes[id].b.removeFromParent(); g.meshes[id].l.removeFromParent(); }
    groups = []; trees = []; scanned = new Set();
  }

  // ───────────────────────── Panel ─────────────────────────
  function addToggle() {
    if (document.getElementById("chkArbolesHd")) return;
    const anchor = document.getElementById("chkAds") || document.querySelector("#panel input[type=checkbox]");
    const host = anchor ? anchor.closest("label") || anchor.parentElement : null;
    if (!host) return;
    const lab = document.createElement("label"); lab.className = "rv-own"; lab.style.display = "block";
    lab.innerHTML = `<input type="checkbox" id="chkArbolesHd"${enabled ? " checked" : ""}> <span id="lblArbolesHd"></span>`;
    host.parentElement.insertBefore(lab, host.nextSibling);
    document.getElementById("lblArbolesHd").textContent = LBL[lang()];
    document.getElementById("chkArbolesHd").onchange = (e) => {
      enabled = e.target.checked; try { localStorage.setItem(LS, enabled ? "1" : "0"); } catch {}
      if (!enabled) reset();
    };
    new MutationObserver(() => { const l = document.getElementById("lblArbolesHd"); if (l) l.textContent = LBL[lang()]; }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  }
  function tick() {
    try {
      addToggle();
      const r = R(), s = S(); if (!r || !s) return;
      const w = r.world();
      if (w !== world) { reset(); world = w; }
      if (!enabled || !w || !s.route || s.loading) return;
      if (!lib) { load().catch((e) => console.warn("[arboles]", e)); return; }
      scan();
      const now = performance.now();
      if (now - lastUpdate > 400) { lastUpdate = now; update(); }
    } catch (e) { console.warn("[arboles]", e); }
  }
  function start() { setInterval(tick, 200); }
  window.__AR = { get trees() { return trees; }, get near() { return near; }, load };
  if (window.__R) start(); else addEventListener("rodillo-listo", start, { once: true });
})();
