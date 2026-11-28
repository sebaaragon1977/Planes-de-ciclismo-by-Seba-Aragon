/* RutaViva — encuentros en la ruta con videollamada.
   Cuando otro ciclista está a la vista (menos de 150 m en la misma ruta) aparece la opción de hablar por video.
   Los dos tienen que tocar "Activar cámara"; la conexión es directa entre los dos navegadores (WebRTC),
   y se usa el canal en vivo de la ruta (multijugador.js) para ponerse de acuerdo.
   Si se alejan más de 220 m, o uno se va, la llamada se corta sola. */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const S = () => window.__S, MJ = () => window.__MJ;
  const NEAR = 150, FAR = 220;
  const ICE = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }];
  const lang = () => (["es", "en", "pt"].includes(document.documentElement.lang) ? document.documentElement.lang : "es");
  const TX = {
    es: { near: "🎥 {n} está cerca tuyo en la ruta", wants: "🎥 {n} quiere hablar por video", go: "Activar cámara y micrófono", wait: "Esperando que {n} active su cámara…", connecting: "Conectando con {n}…", mic: "🎙️", cam: "📷", hang: "Colgar", bye: "Se cortó la videollamada con {n}: ya no están a la vista.", left: "{n} cortó la videollamada.", noCam: "No pude usar la cámara o el micrófono: ", fail: "No se pudo conectar el video con {n}. Puede ser la red (firewall).", login: "" },
    en: { near: "🎥 {n} is near you on the road", wants: "🎥 {n} wants to video chat", go: "Turn on camera and mic", wait: "Waiting for {n} to turn on their camera…", connecting: "Connecting with {n}…", mic: "🎙️", cam: "📷", hang: "Hang up", bye: "Video call with {n} ended: you're no longer in sight.", left: "{n} hung up.", noCam: "Couldn't use the camera or mic: ", fail: "Couldn't connect video with {n}. It may be the network (firewall)." },
    pt: { near: "🎥 {n} está perto de você na rota", wants: "🎥 {n} quer conversar por vídeo", go: "Ativar câmera e microfone", wait: "Esperando {n} ativar a câmera…", connecting: "Conectando com {n}…", mic: "🎙️", cam: "📷", hang: "Desligar", bye: "A videochamada com {n} caiu: vocês não estão mais à vista.", left: "{n} desligou.", noCam: "Não consegui usar a câmera ou o microfone: ", fail: "Não foi possível conectar o vídeo com {n}. Pode ser a rede (firewall)." },
  };
  const t = (k, v = {}) => String(TX[lang()][k] ?? TX.es[k] ?? k).replace(/\{(\w+)\}/g, (_, x) => v[x] ?? "");
  const toast = (m, ms = 5000) => { const r = window.__R; r && r.toast ? r.toast(m, ms) : console.log(m); };

  const css = document.createElement("style");
  css.textContent = `
  #enBox{position:fixed;right:14px;bottom:178px;z-index:20;display:none;width:236px;padding:10px;font-size:13px}
  #enBox .msg{margin-bottom:8px;line-height:1.4}
  #enBox button{width:100%}
  #enVid{position:relative;width:216px;height:162px;border-radius:10px;overflow:hidden;background:#000;display:none;margin-bottom:8px}
  #enVid video{display:block}
  #enRemote{width:100%;height:100%;object-fit:cover}
  #enLocal{position:absolute;right:6px;bottom:6px;width:70px;height:52px;object-fit:cover;border-radius:6px;border:2px solid rgba(255,255,255,.7);transform:scaleX(-1)}
  #enName{position:absolute;left:6px;top:6px;background:rgba(0,0,0,.55);color:#fff;font-size:11px;padding:2px 7px;border-radius:999px}
  #enCtl{display:none;gap:6px}#enCtl button{flex:1;padding:6px}#enCtl .off{opacity:.45}
  `;
  document.head.appendChild(css);

  let peer = null; // { id, n, ready: bool (el otro), acked }
  let call = null; // { id, pc, stream, remote }
  let myReady = false, localStream = null;

  function box() {
    let b = $("enBox");
    if (!b) {
      b = document.createElement("div"); b.id = "enBox"; b.className = "glass rv-own";
      b.innerHTML = `<div id="enVid"><video id="enRemote" autoplay playsinline></video><video id="enLocal" autoplay playsinline muted></video><span id="enName"></span></div>
        <div class="msg" id="enMsg"></div><button class="primary" id="enGo"></button>
        <div id="enCtl"><button id="enMic"></button><button id="enCam"></button><button id="enHang"></button></div>`;
      document.body.appendChild(b);
      b.addEventListener("keydown", (e) => e.stopPropagation());
      $("enGo").onclick = enable;
      $("enHang").onclick = () => hangup(true);
      $("enMic").onclick = () => toggle("audio", $("enMic"));
      $("enCam").onclick = () => toggle("video", $("enCam"));
    }
    return b;
  }
  function render() {
    const b = box();
    if (!peer) { b.style.display = "none"; return; }
    b.style.display = "block";
    const inCall = call && call.connected;
    $("enVid").style.display = inCall || (myReady && localStream) ? "block" : "none";
    $("enCtl").style.display = myReady ? "flex" : "none";
    $("enGo").style.display = myReady ? "none" : "block";
    $("enGo").textContent = t("go");
    $("enMic").textContent = t("mic"); $("enCam").textContent = t("cam"); $("enHang").textContent = t("hang");
    $("enName").textContent = peer.n || "";
    $("enMsg").textContent = inCall ? "" : myReady ? (peer.ready ? t("connecting", { n: peer.n }) : t("wait", { n: peer.n })) : peer.ready ? t("wants", { n: peer.n }) : t("near", { n: peer.n });
    $("enMsg").style.display = $("enMsg").textContent ? "block" : "none";
  }
  function toggle(kind, btn) {
    if (!localStream) return;
    const tr = kind === "audio" ? localStream.getAudioTracks() : localStream.getVideoTracks();
    tr.forEach((x) => (x.enabled = !x.enabled));
    btn.classList.toggle("off", tr.length && !tr[0].enabled);
  }
  async function enable() {
    if (!peer) return;
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, frameRate: 15 }, audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (e) { toast(t("noCam") + (e.message || e)); return; }
    $("enLocal").srcObject = localStream;
    myReady = true;
    MJ().sendRtc({ to: peer.id, t: "ready" });
    if (peer.ready) maybeStart();
    render();
  }
  const initiator = () => String(MJ().myId) < String(peer.id);
  function newPc() {
    const pc = new RTCPeerConnection({ iceServers: ICE });
    call = { id: peer.id, n: peer.n, pc, connected: false };
    localStream.getTracks().forEach((tr) => pc.addTrack(tr, localStream));
    pc.onicecandidate = (e) => { if (e.candidate && peer) MJ().sendRtc({ to: call.id, t: "ice", c: e.candidate.toJSON() }); };
    pc.ontrack = (e) => { $("enRemote").srcObject = e.streams[0]; };
    pc.onconnectionstatechange = () => {
      if (!call || call.pc !== pc) return;
      if (pc.connectionState === "connected") { call.connected = true; render(); }
      if (pc.connectionState === "failed") { toast(t("fail", { n: call.n })); hangup(true); }
    };
    return pc;
  }
  async function maybeStart() {
    if (!peer || !myReady || !peer.ready || call) return;
    if (initiator()) {
      const pc = newPc();
      const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
      MJ().sendRtc({ to: peer.id, t: "offer", sdp: pc.localDescription.toJSON() });
    }
    render();
  }
  // Interruptor: videollamada activada o no (se guarda en el navegador)
  let videoOn = (() => { try { return localStorage.getItem("rv_video") !== "0"; } catch { return true; } })();
  const VLBL = { es: "Videollamada con ciclistas cercanos", en: "Video call with nearby riders", pt: "Videochamada com ciclistas próximos" };
  function addToggle() {
    if (document.getElementById("chkVideo")) return;
    const anchor = document.getElementById("chkArbolesHd") || document.getElementById("chkAds") || document.querySelector("#panel input[type=checkbox]");
    const host = anchor ? anchor.closest("label") || anchor.parentElement : null;
    if (!host) return;
    const lab = document.createElement("label"); lab.className = "rv-own"; lab.style.display = "block";
    lab.innerHTML = `<input type="checkbox" id="chkVideo"${videoOn ? " checked" : ""}> 🎥 <span id="lblVideo"></span>`;
    host.parentElement.insertBefore(lab, host.nextSibling);
    const upd = () => { const l = document.getElementById("lblVideo"); if (l) l.textContent = VLBL[document.documentElement.lang] || VLBL.es; };
    upd(); new MutationObserver(upd).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    document.getElementById("chkVideo").onchange = (e) => {
      videoOn = e.target.checked; try { localStorage.setItem("rv_video", videoOn ? "1" : "0"); } catch {}
      if (!videoOn && peer) { hangup(true); peer = null; render(); }
    };
  }
  async function onRtc(m) {
    if (!m || !m.from || !videoOn) return;
    if (!peer || peer.id !== m.from) {
      // mensaje de alguien que no es el cercano actual: solo aceptamos "ready" si está a la vista
      const o = MJ().others.get(m.from);
      if (!o || Math.abs(o.d - S().d) > FAR) return;
      if (call) return;
      peer = { id: m.from, n: o.n || "?", ready: false, acked: false };
    }
    if (m.t === "ready") {
      peer.ready = true;
      if (myReady && !initiator() && !peer.acked) { peer.acked = true; MJ().sendRtc({ to: peer.id, t: "ready" }); }
      maybeStart();
    } else if (m.t === "offer" && myReady) {
      if (call) { try { call.pc.close(); } catch {} call = null; }
      const pc = newPc();
      await pc.setRemoteDescription(m.sdp);
      const ans = await pc.createAnswer(); await pc.setLocalDescription(ans);
      MJ().sendRtc({ to: peer.id, t: "answer", sdp: pc.localDescription.toJSON() });
    } else if (m.t === "answer" && call) {
      await call.pc.setRemoteDescription(m.sdp);
    } else if (m.t === "ice" && call) {
      try { await call.pc.addIceCandidate(m.c); } catch {}
    } else if (m.t === "bye") {
      const n = peer.n; endCall(); if (peer) peer.ready = false; toast(t("left", { n }));
    }
    render();
  }
  function endCall() {
    if (call) { try { call.pc.close(); } catch {} call = null; }
    if (localStream) { localStream.getTracks().forEach((x) => x.stop()); localStream = null; }
    $("enRemote") && ($("enRemote").srcObject = null); $("enLocal") && ($("enLocal").srcObject = null);
    myReady = false;
  }
  function hangup(notify) {
    if (peer && notify && (myReady || call)) MJ().sendRtc({ to: peer.id, t: "bye" });
    endCall(); render();
  }

  // ¿Quién está a la vista?
  function watch() {
    addToggle();
    const mj = MJ(), s = S();
    if (!videoOn || !mj || !s || !s.route || !mj.online) { if (peer) { hangup(true); peer = null; render(); } return; }
    if (peer) {
      const o = mj.others.get(peer.id);
      if (!o || Math.abs(o.d - s.d) > FAR) {
        const n = peer.n, had = myReady || call; hangup(true); peer = null; render();
        if (had) toast(t("bye", { n }));
        return;
      }
      if (o.n && o.n !== peer.n) { peer.n = o.n; render(); }
      return;
    }
    let best = null, bd = NEAR;
    for (const [id, o] of mj.others) { const g = Math.abs(o.d - s.d); if (g < bd) { best = { id, o }; bd = g; } }
    if (best) { peer = { id: best.id, n: best.o.n || "?", ready: false, acked: false }; render(); }
  }

  window.__EN = { get peer() { return peer; }, get call() { return call; }, get ready() { return myReady; }, get on() { return videoOn; } };
  function start() {
    const mj = MJ();
    if (!mj || !mj.onRtc) { setTimeout(start, 1000); return; }
    mj.onRtc(onRtc);
    setInterval(() => { try { watch(); } catch (e) { console.warn("[encuentros]", e); } }, 500);
    new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    addEventListener("beforeunload", () => hangup(true));
  }
  if (window.__R) start(); else addEventListener("rodillo-listo", start, { once: true });
})();
