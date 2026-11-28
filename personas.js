/* RutaViva — público 3D realista en largada y llegada.
   Cerca del ciclista, las figuras simples del público se reemplazan por personas 3D con esqueleto y animación:
   Michelle (baila samba) y un maniquí (asiente, mueve la cabeza, espera) con la remera de cada uno.
   Modelos: ejemplos de three.js (personajes de Mixamo). Se cargan solo si la opción está activa. */
import * as THREE from "three";
import { GLTFLoader } from "./lib/loaders/GLTFLoader.js";
import * as SkeletonUtils from "./lib/utils/SkeletonUtils.js";

const LS = "rv_personas_hd";
const POOL = 28, RANGE = 110;
let enabled = (() => { try { const v = localStorage.getItem(LS); if (v !== null) return v === "1"; } catch {} return !/Mobi|Android/i.test(navigator.userAgent); })();
const LBL = { es: "Público 3D realista (más pesado)", en: "Realistic 3D crowd (heavier)", pt: "Público 3D realista (mais pesado)" };
const lang = () => (["es", "en", "pt"].includes(document.documentElement.lang) ? document.documentElement.lang : "es");
const R = () => window.__R, S = () => window.__S;

let models = null, loading = false;
async function load() {
  if (models || loading) return; loading = true;
  const L = new GLTFLoader();
  const [mi, xb] = await Promise.all([L.loadAsync("personas/Michelle.glb"), L.loadAsync("personas/Xbot.glb")]);
  const prep = (g) => { g.scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } }); return g; };
  models = { mi: prep(mi), xb: prep(xb) };
  loading = false;
}
const clip = (g, n) => g.animations.find((a) => a.name === n);

// Cada persona del grupo: un clon con su propio mezclador de animación
const pool = []; // { obj, mixer, kind, actions, P }
function makeOne(i) {
  const kind = i % 5 < 3 ? "mi" : "xb", g = models[kind];
  const obj = SkeletonUtils.clone(g.scene); obj.visible = false;
  const mixer = new THREE.AnimationMixer(obj), actions = {};
  if (kind === "mi") {
    actions.idle = mixer.clipAction(clip(g, "SambaDance")); actions.cheer = actions.idle;
  } else {
    actions.idle = mixer.clipAction(clip(g, "idle")); actions.cheer = mixer.clipAction(clip(g, i % 2 ? "agree" : "headShake"));
    // remera de color: clonar el material del cuerpo
    obj.traverse((o) => { if (o.isMesh && o.material && /Surface/i.test(o.name)) { o.material = o.material.clone(); o.userData.shirt = true; } });
  }
  actions.idle.play();
  const e = { obj, mixer, kind, actions, P: null, mode: "idle" };
  (R().world() || R().scene).add(obj); // mismo sistema de coordenadas que el público
  return e;
}
function release(e) { if (e.P) e.P.real = false; e.P = null; e.obj.visible = false; }
function reset() { for (const e of pool) release(e); }

let lastAssign = 0, last = performance.now(), worldRef = null;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  try {
    const r = R(), s = S(), A = window.__ARCOS;
    if (!r || !s) return;
    const w = r.world && r.world();
    if (w !== worldRef) { reset(); worldRef = w; if (w) for (const e of pool) w.add(e.obj); }
    if (!enabled || !A || !s.route || !w) { reset(); return; }
    if (!models) { load().catch((e) => { console.warn("[personas]", e); enabled = false; }); return; }
    if (!pool.length) for (let i = 0; i < POOL; i++) pool.push(makeOne(i));
    if (now - lastAssign > 600) { lastAssign = now; assign(A.crowds, s.d); }
    // las coordenadas del público son locales al mundo de la ruta
    for (const e of pool) {
      if (!e.P) continue;
      const P = e.P, near = Math.abs(P.d - s.d) < 70, want = near && P.cheer ? "cheer" : "idle";
      if (want !== e.mode) { const a = e.actions[want], b = e.actions[e.mode]; if (a !== b) { a.reset().play(); b.crossFadeTo(a, 0.4, false); } e.mode = want; }
      e.actions.idle.timeScale = e.kind === "mi" ? (near ? 1 : 0.35) : 1;
      e.obj.position.set(P.x, P.y, P.z); e.obj.rotation.y = P.yaw; e.obj.scale.setScalar(P.s);
      e.mixer.update(dt);
    }
  } catch (err) { console.warn("[personas]", err); }
}
function assign(crowds, d) {
  const cand = [];
  for (const c of crowds) { const cr = c.userData.crowd; if (!cr) continue; for (const P of cr.people) { const g = Math.abs(P.d - d); if (g < RANGE) cand.push([g, P]); } }
  cand.sort((a, b) => a[0] - b[0]);
  const keep = new Set(cand.slice(0, POOL).map((x) => x[1]));
  for (const e of pool) if (e.P && !keep.has(e.P)) release(e);
  const used = new Set(pool.filter((e) => e.P).map((e) => e.P));
  for (const P of keep) {
    if (used.has(P)) continue;
    const e = pool.find((x) => !x.P); if (!e) break;
    e.P = P; P.real = true; e.obj.visible = true;
    if (e.kind === "xb") e.obj.traverse((o) => { if (o.userData.shirt) o.material.color.setHex(P.shirt).lerp(new THREE.Color(0xd8d8d8), 0.6); });
    e.actions.idle.time = Math.random() * e.actions.idle.getClip().duration;
  }
}

function addToggle() {
  if (document.getElementById("chkPersonasHd")) return;
  const anchor = document.getElementById("chkArbolesHd") || document.getElementById("chkAds") || document.querySelector("#panel input[type=checkbox]");
  const host = anchor ? anchor.closest("label") || anchor.parentElement : null;
  if (!host) return;
  const lab = document.createElement("label"); lab.className = "rv-own"; lab.style.display = "block";
  lab.innerHTML = `<input type="checkbox" id="chkPersonasHd"${enabled ? " checked" : ""}> <span id="lblPersonasHd"></span>`;
  host.parentElement.insertBefore(lab, host.nextSibling);
  const upd = () => { const l = document.getElementById("lblPersonasHd"); if (l) l.textContent = LBL[lang()]; };
  upd(); new MutationObserver(upd).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  document.getElementById("chkPersonasHd").onchange = (e) => { enabled = e.target.checked; try { localStorage.setItem(LS, enabled ? "1" : "0"); } catch {} if (!enabled) reset(); };
}
function start() { requestAnimationFrame(frame); setInterval(addToggle, 1000); }
if (window.__R) start(); else addEventListener("rodillo-listo", start, { once: true });
