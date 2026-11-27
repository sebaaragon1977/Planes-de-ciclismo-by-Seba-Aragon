/* RutaViva — login, idiomas, opinión, biblioteca de rutas, paisaje y carteles.
   Se apoya en la app del rodillo 3D (window.__S = estado, window.__R = escena). */
(() => {
  "use strict";

  // ───────────────────────── Configuración ─────────────────────────
  const SUPA_URL = "https://aaabcjynoimkhrisyyhd.supabase.co";
  const SUPA_KEY = "sb_publishable_mDbzIy0nQiAptrw2qBaV5g_8mwpMv6q"; // clave pública: segura con RLS
  const APP = "rutaviva";
  const CONTACT = "@dr._sebastian_aragon";
  const $ = (id) => document.getElementById(id);
  const ls = {
    get(k, d = null) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
    del(k) { try { localStorage.removeItem(k); } catch {} },
  };

  // ───────────────────────── Idiomas ─────────────────────────
  const LANGS = { es: "Español", en: "English", pt: "Português" };
  let lang = ls.get("rv_lang") || ((navigator.language || "es").slice(0, 2));
  if (!LANGS[lang]) lang = "es";

  const TX = {
    es: {
      tabLogin: "Entrar", tabSignup: "Registrarme", password: "Clave", password2: "Repetir clave", province: "Provincia o estado",
      loginSub2: "Entrá con tu mail y tu clave.", signupSub: "Registrate una sola vez, gratis. Te mandamos un mail para verificar tu cuenta y después entrás siempre con tu mail y tu clave.",
      doLogin: "Entrar", doSignup: "Crear mi cuenta", forgot: "¿Olvidaste tu clave? (o te registraste antes con link)", resend: "Reenviar mail de verificación",
      badPass: "La clave tiene que tener al menos 6 caracteres.", passMismatch: "Las claves no coinciden.", fillLogin: "Completá tu mail y tu clave.",
      fillSignup: "Completá mail, país, provincia o estado y la clave, y aceptá el aviso de privacidad.",
      verifySent: "¡Listo! Te mandamos un mail a {email}. Abrilo y tocá el link para verificar tu cuenta; después entrás con tu mail y tu clave. Si no aparece, mirá en spam.",
      already: "Ese mail ya está registrado. Entrá con tu clave, o tocá “¿Olvidaste tu clave?” para crear una nueva.",
      badLogin: "Mail o clave incorrectos. Si te registraste antes con el link por mail, tocá “¿Olvidaste tu clave?” para crear una.",
      notConfirmed: "Todavía no verificaste tu mail. Buscá el mail de RutaViva y tocá el link (mirá en spam).",
      resetSent: "Te mandamos un mail a {email} para crear una clave nueva.", needEmail: "Escribí tu mail arriba.",
      newPassTitle: "Creá tu clave nueva", newPassSub: "Elegí la clave con la que vas a entrar de ahora en más.", savePass: "Guardar clave y entrar", passSaved: "Clave guardada.",
      loginTitle: "Bienvenido a RutaViva",
      loginSub: "Registrate gratis para usar el simulador. Te mandamos un link de acceso a tu mail y quedás conectado en este navegador.",
      email: "Email", country: "País", city: "Ciudad",
      privacy: "Acepto el aviso de privacidad", privacyLink: "Ver aviso",
      privacyText: "RutaViva guarda tu email, país, ciudad, idioma y los datos de uso de la app (fecha de ingreso, rutas pedaleadas y los datos de cada salida —distancia, tiempo, desnivel, velocidad, pulso, potencia y cadencia—, carteles vistos y tu opinión, si la dejás). Se usan solo para estadísticas de uso de esta app gratuita: no se venden ni se comparten con terceros. Podés pedir que se borren por mensaje a {contact} en Instagram.",
      sendLink: "Enviarme el link de acceso", sending: "Enviando…",
      sent: "¡Listo! Revisá tu mail ({email}) y tocá el link para entrar. Si no aparece, mirá en spam.",
      fillAll: "Completá email, país y ciudad, y aceptá el aviso de privacidad.",
      badEmail: "Ese email no parece válido.",
      profileTitle: "Completá tu perfil", profileSub: "Un último paso: contanos desde dónde pedaleás.", save: "Guardar y entrar",
      account: "Cuenta", logout: "Cerrar sesión", setPass: "🔑 Crear o cambiar mi clave", stats: "📊 Estadísticas",
      feedbackBtn: "⭐ Dejá tu opinión", fbTitle: "¿Qué te parece RutaViva?", fbSub: "Puntuala y contanos qué le mejorarías.",
      fbPlaceholder: "¿Qué mejorarías? ¿Qué te gustaría que tenga?",
      send: "Enviar", cancel: "Cancelar", later: "Ahora no",
      fbThanks: "¡Gracias por tu opinión!", fbAsk: "¿Nos dejás tu opinión sobre RutaViva? Son 20 segundos.", fbNeedStars: "Elegí de 1 a 5 estrellas.",
      library: "🌍 Rutas famosas", libTitle: "Rutas famosas", libSub: "Puertos míticos y gran fondos. Tocá una para cargarla.",
      search: "Buscar ruta o país…", approx: "aprox.", loadingRoute: "Cargando {name}…",
      scenery: "Paisaje mejorado (balizas, arbustos, mojones)", ads: "Carteles al costado de la ruta",
      km: "km", offline: "No pude conectar con el servidor de cuentas. Podés usar la app igual.", error: "Error: ",
      types: { "Puerto": "Puertos", "Muro": "Muros", "Gran Fondo": "Gran Fondos", "Recorrido": "Recorridos" },
    },
    en: {
      tabLogin: "Sign in", tabSignup: "Sign up", password: "Password", password2: "Repeat password", province: "State or province",
      loginSub2: "Sign in with your email and password.", signupSub: "Sign up once, for free. We'll email you to verify your account and then you always sign in with your email and password.",
      doLogin: "Sign in", doSignup: "Create my account", forgot: "Forgot your password? (or signed up before with a link)", resend: "Resend verification email",
      badPass: "The password must have at least 6 characters.", passMismatch: "Passwords don't match.", fillLogin: "Enter your email and password.",
      fillSignup: "Fill in email, country, state or province and password, and accept the privacy notice.",
      verifySent: "Done! We emailed {email}. Open it and tap the link to verify your account; then sign in with your email and password. If it's not there, check spam.",
      already: "That email is already registered. Sign in with your password, or tap “Forgot your password?” to create a new one.",
      badLogin: "Wrong email or password. If you signed up before with the email link, tap “Forgot your password?” to create one.",
      notConfirmed: "You haven't verified your email yet. Look for the RutaViva email and tap the link (check spam).",
      resetSent: "We emailed {email} so you can create a new password.", needEmail: "Type your email above.",
      newPassTitle: "Create your new password", newPassSub: "Choose the password you'll use from now on.", savePass: "Save password and continue", passSaved: "Password saved.",
      loginTitle: "Welcome to RutaViva",
      loginSub: "Sign up for free to use the simulator. We'll email you an access link and you'll stay signed in on this browser.",
      email: "Email", country: "Country", city: "City",
      privacy: "I accept the privacy notice", privacyLink: "Read notice",
      privacyText: "RutaViva stores your email, country, city, language and app usage data (sign-in dates, routes ridden and the data of each ride —distance, time, climb, speed, heart rate, power and cadence—, billboards seen and your feedback, if you leave it). It is used only for usage statistics of this free app: it is not sold or shared with third parties. You can ask for it to be deleted by messaging {contact} on Instagram.",
      sendLink: "Email me the access link", sending: "Sending…",
      sent: "Done! Check your inbox ({email}) and tap the link to get in. If it's not there, check spam.",
      fillAll: "Fill in email, country and city, and accept the privacy notice.",
      badEmail: "That email doesn't look valid.",
      profileTitle: "Complete your profile", profileSub: "One last step: tell us where you ride from.", save: "Save and continue",
      account: "Account", logout: "Sign out", setPass: "🔑 Create or change my password", stats: "📊 Statistics",
      feedbackBtn: "⭐ Give feedback", fbTitle: "What do you think of RutaViva?", fbSub: "Rate it and tell us what you'd improve.",
      fbPlaceholder: "What would you improve? What would you like it to have?",
      send: "Send", cancel: "Cancel", later: "Not now",
      fbThanks: "Thanks for your feedback!", fbAsk: "Would you leave us your feedback on RutaViva? It takes 20 seconds.", fbNeedStars: "Pick 1 to 5 stars.",
      library: "🌍 Famous routes", libTitle: "Famous routes", libSub: "Legendary climbs and gran fondos. Tap one to load it.",
      search: "Search route or country…", approx: "approx.", loadingRoute: "Loading {name}…",
      scenery: "Enhanced scenery (posts, bushes, km markers)", ads: "Roadside billboards",
      km: "km", offline: "Couldn't reach the account server. You can still use the app.", error: "Error: ",
      types: { "Puerto": "Climbs", "Muro": "Walls", "Gran Fondo": "Gran Fondos", "Recorrido": "Rides" },
    },
    pt: {
      tabLogin: "Entrar", tabSignup: "Cadastrar", password: "Senha", password2: "Repetir senha", province: "Estado ou província",
      loginSub2: "Entre com seu e-mail e sua senha.", signupSub: "Cadastre-se uma vez, grátis. Enviamos um e-mail para verificar sua conta e depois você sempre entra com e-mail e senha.",
      doLogin: "Entrar", doSignup: "Criar minha conta", forgot: "Esqueceu a senha? (ou se cadastrou antes com link)", resend: "Reenviar e-mail de verificação",
      badPass: "A senha precisa ter pelo menos 6 caracteres.", passMismatch: "As senhas não coincidem.", fillLogin: "Preencha seu e-mail e sua senha.",
      fillSignup: "Preencha e-mail, país, estado ou província e senha, e aceite o aviso de privacidade.",
      verifySent: "Pronto! Enviamos um e-mail para {email}. Abra e toque no link para verificar sua conta; depois entre com e-mail e senha. Se não chegar, veja o spam.",
      already: "Esse e-mail já está cadastrado. Entre com sua senha ou toque em “Esqueceu a senha?” para criar uma nova.",
      badLogin: "E-mail ou senha incorretos. Se você se cadastrou antes com o link por e-mail, toque em “Esqueceu a senha?” para criar uma.",
      notConfirmed: "Você ainda não verificou seu e-mail. Procure o e-mail do RutaViva e toque no link (veja o spam).",
      resetSent: "Enviamos um e-mail para {email} para criar uma senha nova.", needEmail: "Digite seu e-mail acima.",
      newPassTitle: "Crie sua nova senha", newPassSub: "Escolha a senha que vai usar daqui em diante.", savePass: "Salvar senha e entrar", passSaved: "Senha salva.",
      loginTitle: "Bem-vindo ao RutaViva",
      loginSub: "Cadastre-se grátis para usar o simulador. Enviamos um link de acesso para o seu e-mail e você fica conectado neste navegador.",
      email: "E-mail", country: "País", city: "Cidade",
      privacy: "Aceito o aviso de privacidade", privacyLink: "Ver aviso",
      privacyText: "O RutaViva guarda seu e-mail, país, cidade, idioma e os dados de uso do app (datas de acesso, rotas pedaladas e os dados de cada pedalada —distância, tempo, ganho, velocidade, frequência cardíaca, potência e cadência—, placas vistas e sua opinião, se deixar). Eles são usados só para estatísticas de uso deste app gratuito: não são vendidos nem compartilhados com terceiros. Você pode pedir a exclusão por mensagem para {contact} no Instagram.",
      sendLink: "Enviar o link de acesso", sending: "Enviando…",
      sent: "Pronto! Confira seu e-mail ({email}) e toque no link para entrar. Se não chegar, veja o spam.",
      fillAll: "Preencha e-mail, país e cidade, e aceite o aviso de privacidade.",
      badEmail: "Esse e-mail não parece válido.",
      profileTitle: "Complete seu perfil", profileSub: "Último passo: conte de onde você pedala.", save: "Salvar e entrar",
      account: "Conta", logout: "Sair", setPass: "🔑 Criar ou mudar minha senha", stats: "📊 Estatísticas",
      feedbackBtn: "⭐ Deixe sua opinião", fbTitle: "O que você acha do RutaViva?", fbSub: "Dê uma nota e conte o que você melhoraria.",
      fbPlaceholder: "O que você melhoraria? O que gostaria que tivesse?",
      send: "Enviar", cancel: "Cancelar", later: "Agora não",
      fbThanks: "Obrigado pela sua opinião!", fbAsk: "Deixa sua opinião sobre o RutaViva? Leva 20 segundos.", fbNeedStars: "Escolha de 1 a 5 estrelas.",
      library: "🌍 Rotas famosas", libTitle: "Rotas famosas", libSub: "Subidas lendárias e gran fondos. Toque em uma para carregar.",
      search: "Buscar rota ou país…", approx: "aprox.", loadingRoute: "Carregando {name}…",
      scenery: "Paisagem melhorada (balizas, arbustos, marcos de km)", ads: "Placas na beira da estrada",
      km: "km", offline: "Não consegui conectar ao servidor de contas. Você pode usar o app mesmo assim.", error: "Erro: ",
      types: { "Puerto": "Subidas", "Muro": "Muros", "Gran Fondo": "Gran Fondos", "Recorrido": "Percursos" },
    },
  };
  const t = (k, vars) => {
    let s = (TX[lang] && TX[lang][k]) ?? TX.es[k] ?? k;
    if (typeof s === "string") {
      s = s.replace("{contact}", CONTACT);
      if (vars) for (const [a, b] of Object.entries(vars)) s = s.replace("{" + a + "}", b);
    }
    return s;
  };

  const UI = {
    en: {
      "Potencia 3s": "Power 3s", "Cadencia": "Cadence", "Velocidad": "Speed", "Pendiente": "Grade", "Pulso": "Heart rate",
      "Tiempo": "Time", "Desnivel": "Climb", "Altitud": "Altitude", "Próx. 500 m": "Next 500 m", "Rodillo": "Trainer",
      "Simulador de recorridos GPX con rodillo smart": "Your real route, on your trainer",
      "Este navegador no tiene Bluetooth web. Abrí el archivo en": "This browser has no Web Bluetooth. Open it in",
      "(o Edge) en la Mac.": "(or Edge).",
      "Recorrido": "Route", "📂 Cargar GPX": "📂 Load GPX", "Relieve e imagen satelital reales": "Real terrain and satellite imagery",
      "Árboles al costado": "Roadside trees", "Arrastrá un .gpx a la ventana o usá el botón.": "Drop a .gpx onto the window or use the button.",
      "Sensores": "Sensors", "🔗 Conectar rodillo": "🔗 Connect trainer", "ANT+ serie": "ANT+ serial",
      "si “ANT+” no encuentra el pendrive": "if “ANT+” can't find the USB stick", "⚙️ Calibración avanzada (spin-down)": "⚙️ Advanced calibration (spin-down)",
      "Desconectado": "Disconnected", "❤️ Conectar pulsómetro": "❤️ Connect HR monitor",
      "Entrenamiento (ERG)": "Workout (ERG)", "🏋️ Cargar entrenamiento": "🏋️ Load workout",
      "Sin entrenamiento: modo recorrido libre (pendiente). Cargá el .json de Documentos/Rodillo3D/entrenamientos.": "No workout: free ride mode (grade). Load a .json or .zwo workout.",
      "Sin entrenamiento: modo recorrido libre (pendiente).": "No workout: free ride mode (grade).",
      "⏭ Saltar bloque": "⏭ Skip block", "Umbral": "Threshold", "Simulación": "Simulation", "Dificultad de pendiente:": "Grade difficulty:",
      "100% = la pendiente real del GPX en el rodillo. 50% es lo que usa Zwift por defecto.": "100% = the real GPX grade on the trainer. 50% is Zwift's default.",
      "Ciclista": "Rider", "Bici": "Bike", "Potencia simulada (sin rodillo):": "Simulated power (no trainer):",
      "Rodada": "Ride", "▶ Iniciar": "▶ Start", "⏸ Pausa": "⏸ Pause", "▶ Seguir": "▶ Resume", "⟲ Reiniciar": "⟲ Restart", "🎥 Cámara": "🎥 Camera",
      "Street View aquí": "Street View here", "💾 Exportar TCX": "💾 Export TCX", "Atajos:": "Shortcuts:", "Espacio": "Space",
      "iniciar/pausar ·": "start/pause ·", "cámara ·": "camera ·", "potencia simulada ·": "simulated power ·", "ocultar panel": "hide panel",
      "W objetivo": "W target", "Bloque": "Block", "Resta": "Left", "Soltá el GPX acá": "Drop the GPX here",
      "Forzar ANT+ (pendrive USB)": "Force ANT+ (USB stick)", "Forzar Bluetooth": "Force Bluetooth",
      "Pendrives ANT+ viejos que funcionan como puerto serie": "Older ANT+ sticks that work as a serial port",
    },
    pt: {
      "Potencia 3s": "Potência 3s", "Cadencia": "Cadência", "Velocidad": "Velocidade", "Pendiente": "Inclinação", "Pulso": "Frequência",
      "Tiempo": "Tempo", "Desnivel": "Ganho", "Altitud": "Altitude", "Próx. 500 m": "Próx. 500 m", "Rodillo": "Rolo",
      "Simulador de recorridos GPX con rodillo smart": "Sua rota real, no rolo",
      "Este navegador no tiene Bluetooth web. Abrí el archivo en": "Este navegador não tem Bluetooth web. Abra no",
      "(o Edge) en la Mac.": "(ou Edge).",
      "Recorrido": "Percurso", "📂 Cargar GPX": "📂 Carregar GPX", "Relieve e imagen satelital reales": "Relevo e imagem de satélite reais",
      "Árboles al costado": "Árvores na beira", "Arrastrá un .gpx a la ventana o usá el botón.": "Arraste um .gpx para a janela ou use o botão.",
      "Sensores": "Sensores", "🔗 Conectar rodillo": "🔗 Conectar rolo", "ANT+ serie": "ANT+ serial",
      "si “ANT+” no encuentra el pendrive": "se o “ANT+” não achar o pendrive", "⚙️ Calibración avanzada (spin-down)": "⚙️ Calibração avançada (spin-down)",
      "Desconectado": "Desconectado", "❤️ Conectar pulsómetro": "❤️ Conectar cinta cardíaca",
      "Entrenamiento (ERG)": "Treino (ERG)", "🏋️ Cargar entrenamiento": "🏋️ Carregar treino",
      "Sin entrenamiento: modo recorrido libre (pendiente). Cargá el .json de Documentos/Rodillo3D/entrenamientos.": "Sem treino: modo percurso livre (inclinação). Carregue um treino .json ou .zwo.",
      "Sin entrenamiento: modo recorrido libre (pendiente).": "Sem treino: modo percurso livre (inclinação).",
      "⏭ Saltar bloque": "⏭ Pular bloco", "Umbral": "Limiar", "Simulación": "Simulação", "Dificultad de pendiente:": "Dificuldade da inclinação:",
      "100% = la pendiente real del GPX en el rodillo. 50% es lo que usa Zwift por defecto.": "100% = a inclinação real do GPX no rolo. 50% é o padrão do Zwift.",
      "Ciclista": "Ciclista", "Bici": "Bike", "Potencia simulada (sin rodillo):": "Potência simulada (sem rolo):",
      "Rodada": "Pedalada", "▶ Iniciar": "▶ Iniciar", "⏸ Pausa": "⏸ Pausar", "▶ Seguir": "▶ Continuar", "⟲ Reiniciar": "⟲ Reiniciar", "🎥 Cámara": "🎥 Câmera",
      "Street View aquí": "Street View aqui", "💾 Exportar TCX": "💾 Exportar TCX", "Atajos:": "Atalhos:", "Espacio": "Espaço",
      "iniciar/pausar ·": "iniciar/pausar ·", "cámara ·": "câmera ·", "potencia simulada ·": "potência simulada ·", "ocultar panel": "ocultar painel",
      "W objetivo": "W alvo", "Bloque": "Bloco", "Resta": "Falta", "Soltá el GPX acá": "Solte o GPX aqui",
      "Forzar ANT+ (pendrive USB)": "Forçar ANT+ (pendrive USB)", "Forzar Bluetooth": "Forçar Bluetooth",
      "Pendrives ANT+ viejos que funcionan como puerto serie": "Pendrives ANT+ antigos que funcionam como porta serial",
    },
  };
  const OVERLAY = {
    es: `<h2 style="margin:0 0 6px">Elegí una ruta o cargá tu GPX</h2><p>Tocá <b>🌍 Rutas famosas</b> para pedalear puertos míticos y gran fondos, o cargá tu propio track con <b>📂 Cargar GPX</b> (desde Garmin Connect: Recorridos → ⋯ → Exportar GPX).<br>Después conectá el rodillo y dale <b>▶ Iniciar</b>.<br>Para un entrenamiento por potencia tocá <b>🏋️ Cargar entrenamiento</b>: no hace falta GPX.</p>`,
    en: `<h2 style="margin:0 0 6px">Pick a route or load your GPX</h2><p>Tap <b>🌍 Famous routes</b> to ride legendary climbs and gran fondos, or load your own track with <b>📂 Load GPX</b> (from Garmin Connect: Courses → ⋯ → Export GPX).<br>Then connect your trainer and hit <b>▶ Start</b>.<br>For a power-based workout tap <b>🏋️ Load workout</b>: no GPX needed.</p>`,
    pt: `<h2 style="margin:0 0 6px">Escolha uma rota ou carregue seu GPX</h2><p>Toque em <b>🌍 Rotas famosas</b> para pedalar subidas lendárias e gran fondos, ou carregue seu próprio percurso com <b>📂 Carregar GPX</b> (no Garmin Connect: Percursos → ⋯ → Exportar GPX).<br>Depois conecte o rolo e toque em <b>▶ Iniciar</b>.<br>Para um treino por potência toque em <b>🏋️ Carregar treino</b>: não precisa de GPX.</p>`,
  };

  const original = new WeakMap();
  let observing = null;
  function trText(node) {
    if (!original.has(node)) original.set(node, node.nodeValue);
    const orig = original.get(node), key = orig.trim();
    if (!key) return;
    const tr = lang === "es" ? key : (UI[lang] && UI[lang][key]);
    if (!tr) return;
    const out = orig.replace(key, tr);
    if (node.nodeValue !== out) node.nodeValue = out;
  }
  function walk(root) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement && n.parentElement.closest("#view,script,style,.rv-own,#overlayBox") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    let n; while ((n = w.nextNode())) trText(n);
    if (root.querySelectorAll) root.querySelectorAll("[title]").forEach((e) => {
      if (!e.dataset.rvTitle) e.dataset.rvTitle = e.title;
      const k = e.dataset.rvTitle;
      e.title = lang === "es" ? k : (UI[lang] && UI[lang][k]) || k;
    });
  }
  function applyLang() {
    document.documentElement.lang = lang;
    if (observing) observing.disconnect();
    walk(document.body);
    const box = $("overlayBox");
    if (box && !box.dataset.prev) box.innerHTML = OVERLAY[lang];
    document.querySelectorAll("[data-t]").forEach((e) => (e.textContent = t(e.dataset.t)));
    document.querySelectorAll("[data-tp]").forEach((e) => (e.placeholder = t(e.dataset.tp)));
    document.querySelectorAll("select.rv-lang").forEach((s) => (s.value = lang));
    startObserver();
  }
  function startObserver() {
    observing = new MutationObserver((muts) => {
      observing.disconnect();
      for (const m of muts) {
        if (m.type === "characterData") { original.delete(m.target); if (lang !== "es") trText(m.target); }
        for (const n of m.addedNodes) {
          if (n.nodeType === 3) { original.delete(n); if (lang !== "es") trText(n); }
          else if (n.nodeType === 1 && lang !== "es" && !n.closest(".rv-own,#overlayBox")) walk(n);
        }
      }
      startObserver();
    });
    observing.observe(document.body, { subtree: true, childList: true, characterData: true });
  }
  function setLang(l) { if (!LANGS[l]) return; lang = l; ls.set("rv_lang", l); applyLang(); saveLangToProfile(); }

  // ───────────────────────── Estilos ─────────────────────────
  const css = document.createElement("style");
  css.textContent = `
  .rv-modal{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;background:rgba(5,8,12,.82);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);padding:16px}
  .rv-card{width:min(440px,100%);max-height:calc(100% - 32px);overflow:auto;padding:22px 22px 18px;background:rgba(16,22,30,.96);border:1px solid rgba(255,255,255,.1);border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.5);color:var(--fg)}
  .rv-card.wide{width:min(640px,100%)}
  .rv-brand{display:flex;align-items:center;gap:10px;margin-bottom:6px}
  .rv-logo{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,var(--acc),#ffb02b);display:grid;place-items:center;font-size:22px}
  .rv-card h2{margin:0;font-size:20px}.rv-card .sub{color:var(--mut);font-size:14px;line-height:1.45;margin:6px 0 14px}
  .rv-f{display:block;margin:10px 0}.rv-f span{display:block;font-size:12px;color:var(--mut);margin-bottom:4px;letter-spacing:.02em}
  .rv-f input,.rv-card textarea,.rv-search{width:100%;background:#1a2230;color:var(--fg);border:1px solid #33415a;border-radius:9px;padding:10px 11px;font-size:15px;font-family:inherit}
  .rv-row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .rv-chk{display:flex;gap:8px;align-items:flex-start;font-size:13px;margin:12px 0 6px;line-height:1.4}
  .rv-chk input{margin-top:2px;accent-color:var(--acc)}
  .rv-link{color:var(--acc);cursor:pointer;text-decoration:underline;background:none;border:0;padding:0;font-size:13px}
  .rv-priv{font-size:12px;color:var(--mut);line-height:1.5;background:#141b25;border-radius:9px;padding:10px;margin:6px 0;display:none}
  .rv-btn{width:100%;margin-top:12px;padding:11px;font-size:15px}
  .rv-msg{font-size:13px;line-height:1.45;margin-top:10px;min-height:1em}.rv-msg.err{color:var(--bad)}.rv-msg.ok{color:var(--ok)}
  .rv-langbar{display:flex;justify-content:flex-end}
  select.rv-lang{background:#1a2230;color:var(--fg);border:1px solid #33415a;border-radius:7px;padding:5px 6px;font-size:12px}
  .rv-stars{display:flex;gap:6px;font-size:34px;margin:6px 0 8px;cursor:pointer;user-select:none}.rv-stars span{filter:grayscale(1) opacity(.35);transition:filter .1s}.rv-stars span.on{filter:none}
  .rv-card textarea{min-height:90px;resize:vertical}
  .rv-btns{display:flex;gap:8px;justify-content:flex-end;margin-top:10px}.rv-btns button{padding:9px 14px;font-size:14px}
  .rv-lib-list{margin-top:10px}.rv-lib-group{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--mut);margin:14px 0 6px}
  .rv-lib-item{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:9px 10px;margin:4px 0;border-radius:10px}
  .rv-lib-item .n{flex:1;font-size:14px}.rv-lib-item .c{font-size:12px;color:var(--mut)}.rv-lib-item .k{font-variant-numeric:tabular-nums;font-size:13px;font-weight:600}
  .rv-badge{font-size:10px;color:var(--warn);border:1px solid rgba(255,197,61,.4);border-radius:6px;padding:1px 5px;margin-left:6px}
  .rv-close{float:right;background:none;border:0;color:var(--mut);font-size:20px;padding:0 4px}
  .rv-nudge{position:fixed;right:14px;bottom:180px;z-index:900;width:290px;padding:12px 14px;font-size:14px;line-height:1.4}
  .rv-acc{font-size:12px;color:var(--mut);word-break:break-all}
  .rv-tabs{display:flex;gap:6px;margin:10px 0 4px}.rv-tabs button{flex:1;padding:8px;font-size:14px;opacity:.6}.rv-tabs button.on{opacity:1;background:var(--acc);border-color:var(--acc);color:#fff;font-weight:600}
  `;
  document.head.appendChild(css);

  // ───────────────────────── Supabase ─────────────────────────
  let sb = null, user = null, profile = null;
  window.__RV = { get sb() { return sb; }, get user() { return user; }, get profile() { return profile; } };
  try {
    if (window.supabase && window.supabase.createClient) {
      sb = window.supabase.createClient(SUPA_URL, SUPA_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "implicit", storageKey: "rutaviva-auth" },
      });
    }
  } catch (e) { console.warn("[RutaViva] supabase", e); }

  const COUNTRIES = ["Argentina","Uruguay","Chile","Brasil","Paraguay","Bolivia","Perú","Colombia","Ecuador","Venezuela","México","España","Italia","Francia","Estados Unidos","Canadá","Reino Unido","Alemania","Portugal","Bélgica","Países Bajos","Suiza","Australia"];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function el(html) { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; }
  function langSelect() {
    return `<select class="rv-lang">${Object.entries(LANGS).map(([k, v]) => `<option value="${k}"${k === lang ? " selected" : ""}>${v}</option>`).join("")}</select>`;
  }

  let loginMode = "login";
  function showLogin(onlyProfile = false, mode) {
    closeModal("rv-login");
    if (mode) loginMode = mode;
    let pend = {}; try { pend = JSON.parse(ls.get("rv_pending") || "{}"); } catch {}
    const reg = loginMode === "signup", np = loginMode === "newpass";
    const title = onlyProfile ? "profileTitle" : np ? "newPassTitle" : "loginTitle";
    const sub = onlyProfile ? "profileSub" : np ? "newPassSub" : reg ? "signupSub" : "loginSub2";
    const tabs = onlyProfile || np ? "" : `<div class="rv-tabs"><button type="button" class="${reg ? "" : "on"}" id="rvTabL" data-t="tabLogin"></button><button type="button" class="${reg ? "on" : ""}" id="rvTabS" data-t="tabSignup"></button></div>`;
    const emailF = onlyProfile || np ? "" : `<label class="rv-f"><span data-t="email"></span><input type="email" id="rvEmail" autocomplete="email" inputmode="email" value="${esc(pend.email)}"></label>`;
    const placeF = onlyProfile || reg ? `<div class="rv-row2">
        <label class="rv-f"><span data-t="country"></span><input id="rvCountry" list="rvCountries" autocomplete="country-name" value="${esc(pend.pais)}"></label>
        <label class="rv-f"><span data-t="province"></span><input id="rvCity" autocomplete="address-level1" value="${esc(pend.ciudad)}"></label>
      </div><datalist id="rvCountries">${COUNTRIES.map((c) => `<option value="${c}">`).join("")}</datalist>` : "";
    const passF = onlyProfile ? "" : `<label class="rv-f"><span data-t="password"></span><input type="password" id="rvPass" autocomplete="${reg || np ? "new-password" : "current-password"}"></label>`
      + (reg || np ? `<label class="rv-f"><span data-t="password2"></span><input type="password" id="rvPass2" autocomplete="new-password"></label>` : "");
    const privF = onlyProfile || reg ? `<label class="rv-chk"><input type="checkbox" id="rvPriv"${pend.priv ? " checked" : ""}><span><span data-t="privacy"></span> · <button type="button" class="rv-link" id="rvPrivLink" data-t="privacyLink"></button></span></label>
      <div class="rv-priv" id="rvPrivText" data-t="privacyText"></div>` : "";
    const go = onlyProfile ? "save" : np ? "savePass" : reg ? "doSignup" : "doLogin";
    const extra = onlyProfile || np ? "" : reg ? "" : `<button type="button" class="rv-link" id="rvForgot" data-t="forgot" style="margin-top:10px"></button>`;
    const m = el(`
    <div class="rv-modal rv-own" id="rv-login"><div class="rv-card">
      ${np && !recovering ? `<button class="rv-close" id="rvX">✕</button>` : ""}<div class="rv-langbar">${langSelect()}</div>
      <div class="rv-brand"><div class="rv-logo">🚴</div><h2 data-t="${title}"></h2></div>
      ${tabs}<div class="sub" data-t="${sub}"></div>
      ${emailF}${placeF}${passF}${privF}
      <button class="primary rv-btn" id="rvGo" data-t="${go}"></button>${extra}
      <div class="rv-msg" id="rvMsg"></div>
      <button type="button" class="rv-link" id="rvResend" data-t="resend" style="display:none;margin-top:6px"></button>
    </div></div>`);
    document.body.appendChild(m);
    m.querySelector("select.rv-lang").onchange = (e) => setLang(e.target.value);
    if ($("rvPrivLink")) $("rvPrivLink").onclick = () => { const p = $("rvPrivText"); p.style.display = p.style.display === "block" ? "none" : "block"; };
    if ($("rvTabL")) { $("rvTabL").onclick = () => { keepEmail(); showLogin(false, "login"); }; $("rvTabS").onclick = () => { keepEmail(); showLogin(false, "signup"); }; }
    if ($("rvForgot")) $("rvForgot").onclick = forgot;
    $("rvResend").onclick = resend;
    if ($("rvX")) $("rvX").onclick = () => { loginMode = "login"; closeModal("rv-login"); };
    $("rvGo").onclick = () => (onlyProfile ? saveProfileFromForm() : np ? saveNewPass() : reg ? signUp() : signIn());
    m.addEventListener("keydown", (e) => { if (e.key === "Enter") $("rvGo").click(); e.stopPropagation(); });
    applyLang();
  }
  function closeModal(id) { const x = $(id); if (x) x.remove(); }
  function msg(text, kind = "") { const m = $("rvMsg"); if (m) { m.textContent = text; m.className = "rv-msg " + kind; } }
  const val = (id) => ($(id) ? $(id).value : "");
  function keepEmail() { const e = val("rvEmail").trim().toLowerCase(); if (e) { let p = {}; try { p = JSON.parse(ls.get("rv_pending") || "{}"); } catch {} p.email = e; ls.set("rv_pending", JSON.stringify(p)); } }
  function readForm() {
    return {
      email: val("rvEmail").trim().toLowerCase(),
      pais: val("rvCountry").trim(), ciudad: val("rvCity").trim(), priv: $("rvPriv") ? $("rvPriv").checked : false,
    };
  }
  const okEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const redirect = () => location.origin + location.pathname;
  async function signIn() {
    const email = val("rvEmail").trim().toLowerCase(), password = val("rvPass");
    if (!email || !password) return msg(t("fillLogin"), "err");
    if (!okEmail(email)) return msg(t("badEmail"), "err");
    keepEmail(); $("rvGo").disabled = true; msg(t("sending"));
    const { error } = await sb.auth.signInWithPassword({ email, password });
    $("rvGo").disabled = false;
    if (!error) { msg(""); return; } // onAuthStateChange sigue con el perfil
    if (/confirm/i.test(error.message)) { msg(t("notConfirmed"), "err"); $("rvResend").style.display = "inline"; return; }
    if (/invalid/i.test(error.message)) return msg(t("badLogin"), "err");
    msg(t("error") + error.message, "err");
  }
  async function signUp() {
    const f = readForm(), password = val("rvPass"), password2 = val("rvPass2");
    if (!f.email || !f.pais || !f.ciudad || !password || !f.priv) return msg(t("fillSignup"), "err");
    if (!okEmail(f.email)) return msg(t("badEmail"), "err");
    if (password.length < 6) return msg(t("badPass"), "err");
    if (password !== password2) return msg(t("passMismatch"), "err");
    ls.set("rv_pending", JSON.stringify(f));
    $("rvGo").disabled = true; msg(t("sending"));
    const { data, error } = await sb.auth.signUp({ email: f.email, password, options: { emailRedirectTo: redirect(), data: { pais: f.pais, ciudad: f.ciudad, idioma: lang } } });
    $("rvGo").disabled = false;
    if (error) return msg(/registered|exists/i.test(error.message) ? t("already") : t("error") + error.message, "err");
    if (data && data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) return msg(t("already"), "err");
    if (data && data.session) return; // sin verificación de mail: ya entra
    msg(t("verifySent", { email: f.email }), "ok"); $("rvResend").style.display = "inline";
  }
  async function resend() {
    const email = val("rvEmail").trim().toLowerCase(); if (!okEmail(email)) return msg(t("needEmail"), "err");
    const { error } = await sb.auth.resend({ type: "signup", email, options: { emailRedirectTo: redirect() } });
    error ? msg(t("error") + error.message, "err") : msg(t("verifySent", { email }), "ok");
  }
  async function forgot() {
    const email = val("rvEmail").trim().toLowerCase(); if (!okEmail(email)) return msg(t("needEmail"), "err");
    keepEmail();
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: redirect() });
    error ? msg(t("error") + error.message, "err") : msg(t("resetSent", { email }), "ok");
  }
  async function saveNewPass() {
    const password = val("rvPass"), password2 = val("rvPass2");
    if (password.length < 6) return msg(t("badPass"), "err");
    if (password !== password2) return msg(t("passMismatch"), "err");
    $("rvGo").disabled = true;
    const { error } = await sb.auth.updateUser({ password });
    $("rvGo").disabled = false;
    if (error) return msg(t("error") + error.message, "err");
    const wasRecovery = recovering; toast(t("passSaved")); recovering = false; loginMode = "login"; closeModal("rv-login");
    if (user && wasRecovery) resolveProfile();
  }
  let recovering = /type=recovery/.test(location.hash);
  async function saveProfileFromForm() {
    const f = readForm();
    if (!f.pais || !f.ciudad || !f.priv) return msg(t("fillAll"), "err");
    $("rvGo").disabled = true;
    const ok = await upsertProfile(f.pais, f.ciudad);
    $("rvGo").disabled = false;
    if (ok) { closeModal("rv-login"); afterLogin(); }
  }
  async function upsertProfile(pais, ciudad) {
    const row = { id: user.id, email: user.email, pais, ciudad, idioma: lang, acepto_privacidad: true };
    const { data, error } = await sb.from("perfiles").upsert(row).select().maybeSingle();
    if (error) { msg(t("error") + error.message, "err"); return false; }
    profile = data || row; ls.del("rv_pending"); return true;
  }
  function saveLangToProfile() {
    if (sb && user && profile && profile.idioma !== lang) {
      profile.idioma = lang;
      sb.from("perfiles").update({ idioma: lang }).eq("id", user.id).then(() => {});
    }
  }

  async function initAuth() {
    if (!sb) { toast(t("offline"), 6000); return afterLogin(true); }
    let session = null;
    try { ({ data: { session } } = await sb.auth.getSession()); } catch (e) { console.warn(e); }
    sb.auth.onAuthStateChange((ev, s) => {
      if (ev === "PASSWORD_RECOVERY" && s) { recovering = true; user = s.user; if (location.hash.includes("access_token")) history.replaceState(null, "", location.pathname + location.search); showLogin(false, "newpass"); return; }
      if (ev === "SIGNED_IN" && s && (!user || user.id !== s.user.id)) { user = s.user; if (!recovering) resolveProfile(); }
      if (ev === "SIGNED_OUT") { user = null; profile = null; showLogin(); }
    });
    if (!session) return showLogin();
    user = session.user;
    if (recovering) { if (location.hash.includes("access_token")) history.replaceState(null, "", location.pathname + location.search); return showLogin(false, "newpass"); }
    resolveProfile();
  }
  let resolving = false;
  async function resolveProfile() {
    if (resolving) return; resolving = true;
    try {
      if (location.hash.includes("access_token")) history.replaceState(null, "", location.pathname + location.search);
      const { data, error } = await sb.from("perfiles").select("*").eq("id", user.id).maybeSingle();
      if (error) throw error;
      if (data) { profile = data; closeModal("rv-login"); return afterLogin(); }
      let pend = {}; try { pend = JSON.parse(ls.get("rv_pending") || "{}"); } catch {}
      const meta = user.user_metadata || {};
      const pais = pend.pais || meta.pais, ciudad = pend.ciudad || meta.ciudad;
      if (pais && ciudad && (await upsertProfile(pais, ciudad))) { closeModal("rv-login"); return afterLogin(); }
      showLogin(true);
    } catch (e) {
      console.warn("[RutaViva] perfil", e); closeModal("rv-login"); afterLogin(true);
    } finally { resolving = false; }
  }

  let loggedIn = false;
  async function afterLogin(offline = false) {
    if (loggedIn) return; loggedIn = true;
    renderAccount();
    if (offline || !user) return;
    const n = (+ls.get("rv_sessions", "0") || 0) + 1; ls.set("rv_sessions", String(n));
    let geo = {};
    try {
      const r = await fetch("https://get.geojs.io/v1/ip/geo.json", { cache: "no-store" });
      if (r.ok) { const j = await r.json(); geo = { pais_ip: j.country || null, ciudad_ip: j.city || null }; }
    } catch {}
    const ua = navigator.userAgent;
    const dispositivo = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "Otro";
    sb.from("ingresos").insert({ app: APP, idioma: lang, dispositivo, ...geo }).then(({ error }) => error && console.warn("[RutaViva] ingreso", error));
    maybeAskFeedback(n);
  }

  // ───────────────────────── Panel ─────────────────────────
  function addPanelBits() {
    const gpxRow = $("btnGpx") && $("btnGpx").parentElement;
    if (gpxRow && !$("btnLib")) {
      const b = el(`<button id="btnLib" class="rv-own" data-t="library"></button>`);
      gpxRow.insertBefore(b, $("btnDemo"));
      b.onclick = openLibrary;
    }
    const trees = $("chkTrees") && $("chkTrees").closest(".row");
    if (trees && !$("chkScenery")) {
      const r1 = el(`<div class="row rv-own"><label><input type="checkbox" id="chkScenery"> <span data-t="scenery"></span></label></div>`);
      const r2 = el(`<div class="row rv-own"><label><input type="checkbox" id="chkAds"> <span data-t="ads"></span></label></div>`);
      trees.after(r1); r1.after(r2);
      $("chkScenery").checked = ls.get("rv_scenery", "1") === "1";
      $("chkAds").checked = ls.get("rv_ads", "1") === "1";
      $("chkScenery").onchange = (e) => { ls.set("rv_scenery", e.target.checked ? "1" : "0"); rebuildScenery(); };
      $("chkAds").onchange = (e) => { ls.set("rv_ads", e.target.checked ? "1" : "0"); if (!e.target.checked) clearBillboards(); };
    }
    if (!$("rvAccount")) {
      const sec = el(`<div id="rvAccount" class="rv-own">
        <h2 data-t="account"></h2>
        <div class="row">${langSelect()}<button id="rvFbBtn" data-t="feedbackBtn"></button></div>
        <div class="row"><span class="rv-acc" id="rvWho"></span></div>
        <div class="row"><button id="rvStats" data-t="stats" style="display:none"></button><button id="rvOut" data-t="logout" style="display:none"></button></div>
        <div class="row"><button id="rvPassBtn" data-t="setPass" style="display:none"></button></div>
      </div>`);
      $("panel").appendChild(sec);
      sec.querySelector("select.rv-lang").onchange = (e) => setLang(e.target.value);
      $("rvFbBtn").onclick = openFeedback;
      $("rvPassBtn").onclick = () => showLogin(false, "newpass");
      $("rvOut").onclick = async () => { if (sb) await sb.auth.signOut(); location.reload(); };
      $("rvStats").onclick = () => window.open("estadisticas.html", "_blank");
    }
    const h1 = document.querySelector("#panel h1"); if (h1) h1.textContent = "🚴 RutaViva";
  }
  async function renderAccount() {
    if ($("rvWho")) $("rvWho").textContent = user ? `${user.email}${profile ? " · " + profile.ciudad + ", " + profile.pais : ""}` : "";
    if ($("rvOut")) $("rvOut").style.display = user ? "" : "none";
    if ($("rvPassBtn")) $("rvPassBtn").style.display = user ? "" : "none";
    if (sb && user && $("rvStats")) {
      const { data } = await sb.rpc("es_admin");
      $("rvStats").style.display = data === true ? "" : "none";
    }
  }

  // ───────────────────────── Opinión ─────────────────────────
  function openFeedback() {
    closeModal("rv-fb"); closeModal("rv-nudge");
    let stars = 0;
    const m = el(`<div class="rv-modal rv-own" id="rv-fb"><div class="rv-card">
      <h2 data-t="fbTitle"></h2><div class="sub" data-t="fbSub"></div>
      <div class="rv-stars" id="rvStars">${[1, 2, 3, 4, 5].map((i) => `<span data-v="${i}">⭐</span>`).join("")}</div>
      <textarea id="rvFbText" maxlength="2000" data-tp="fbPlaceholder"></textarea>
      <div class="rv-msg" id="rvMsg"></div>
      <div class="rv-btns"><button id="rvFbCancel" data-t="cancel"></button><button class="primary" id="rvFbSend" data-t="send"></button></div>
    </div></div>`);
    document.body.appendChild(m);
    m.addEventListener("keydown", (e) => e.stopPropagation());
    const paint = () => m.querySelectorAll("#rvStars span").forEach((s) => s.classList.toggle("on", +s.dataset.v <= stars));
    m.querySelectorAll("#rvStars span").forEach((s) => (s.onclick = () => { stars = +s.dataset.v; paint(); }));
    $("rvFbCancel").onclick = () => closeModal("rv-fb");
    $("rvFbSend").onclick = async () => {
      if (!stars) return msg(t("fbNeedStars"), "err");
      if (!sb || !user) { closeModal("rv-fb"); return; }
      $("rvFbSend").disabled = true;
      const { error } = await sb.from("feedback").insert({ app: APP, puntuacion: stars, comentario: $("rvFbText").value.trim() || null });
      $("rvFbSend").disabled = false;
      if (error) return msg(t("error") + error.message, "err");
      ls.set("rv_fb_done", "1"); closeModal("rv-fb"); toast(t("fbThanks"), 3000);
    };
    applyLang();
  }
  function maybeAskFeedback(n) {
    if (ls.get("rv_fb_done") || n < 3 || n < +ls.get("rv_fb_snooze", "0")) return;
    setTimeout(() => {
      if (S() && S().riding) return;
      const nd = el(`<div class="rv-nudge glass rv-own" id="rv-nudge"><div data-t="fbAsk"></div>
        <div class="rv-btns"><button id="rvNLater" data-t="later"></button><button class="primary" id="rvNGo" data-t="feedbackBtn"></button></div></div>`);
      document.body.appendChild(nd);
      $("rvNLater").onclick = () => { ls.set("rv_fb_snooze", String(n + 3)); closeModal("rv-nudge"); };
      $("rvNGo").onclick = openFeedback;
      applyLang();
    }, 25000);
  }

  // ───────────────────────── Biblioteca de rutas ─────────────────────────
  let routes = null;
  async function openLibrary() {
    closeModal("rv-lib");
    const m = el(`<div class="rv-modal rv-own" id="rv-lib"><div class="rv-card wide">
      <button class="rv-close" id="rvLibX">✕</button>
      <h2 data-t="libTitle"></h2><div class="sub" data-t="libSub"></div>
      <input class="rv-search" id="rvLibQ" data-tp="search">
      <div class="rv-lib-list" id="rvLibList">…</div>
    </div></div>`);
    document.body.appendChild(m);
    m.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal("rv-lib"); e.stopPropagation(); });
    m.onclick = (e) => { if (e.target === m) closeModal("rv-lib"); };
    $("rvLibX").onclick = () => closeModal("rv-lib");
    applyLang();
    try {
      if (!routes) routes = await (await fetch("rutas/index.json", { cache: "no-cache" })).json();
    } catch (e) { $("rvLibList").textContent = t("error") + e.message; return; }
    const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    const draw = () => {
      const q = norm($("rvLibQ").value.trim());
      const list = routes.filter((r) => !q || norm(r.nombre + " " + r.pais).includes(q));
      const types = t("types");
      $("rvLibList").innerHTML = ["Gran Fondo", "Puerto", "Muro", "Recorrido"].map((ty) => {
        const items = list.filter((r) => r.tipo === ty);
        if (!items.length) return "";
        return `<div class="rv-lib-group">${types[ty] || ty}</div>` + items.map((r) =>
          `<button class="rv-lib-item" data-id="${r.id}"><span class="n">${esc(r.nombre.replace(" (aprox.)", ""))}${r.aprox ? `<span class="rv-badge">${t("approx")}</span>` : ""}<br><span class="c">${esc(r.pais)}</span></span><span class="k">${r.km.toFixed(1)} ${t("km")}</span></button>`).join("");
      }).join("");
      $("rvLibList").querySelectorAll(".rv-lib-item").forEach((b) => (b.onclick = () => loadRoute(routes.find((r) => r.id === b.dataset.id))));
    };
    $("rvLibQ").oninput = draw; draw();
  }
  async function loadRoute(r) {
    closeModal("rv-lib");
    const R = window.__R; if (!R) return;
    try {
      R.toast(t("loadingRoute", { name: r.nombre }), 2500);
      const txt = await (await fetch(r.archivo)).text();
      R.loadGpxFile(new File([txt], r.id + ".gpx", { type: "application/gpx+xml" }));
    } catch (e) { R.toast(t("error") + e.message, 6000); }
  }

  // ───────────────────────── Paisaje 3D ─────────────────────────
  const S = () => window.__S;
  let sky = null, sceneryGroup = null, lastWorld = null;
  function makeSky() {
    const T = window.__R.T;
    const c = document.createElement("canvas"); c.width = 16; c.height = 512;
    const g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 512);
    gr.addColorStop(0, "#2a63b8"); gr.addColorStop(0.32, "#5f97d8"); gr.addColorStop(0.47, "#9cc4ea"); gr.addColorStop(0.5, "#a9cdea"); gr.addColorStop(1, "#a9cdea");
    g.fillStyle = gr; g.fillRect(0, 0, 16, 512);
    const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGB;
    const dome = new T.Mesh(new T.SphereGeometry(15000, 32, 16), new T.MeshBasicMaterial({ map: tex, side: 1, fog: false, depthWrite: false, depthTest: false }));
    dome.renderOrder = -10; dome.frustumCulled = false;
    const cc = document.createElement("canvas"); cc.width = 2048; cc.height = 256;
    const cg = cc.getContext("2d"), rnd = seededRand(7);
    for (let i = 0; i < 70; i++) {
      const x = rnd() * 2048, y = 60 + rnd() * 140, rx = 40 + rnd() * 140, ry = 10 + rnd() * 26;
      cg.save(); cg.translate(x, y); cg.scale(1, ry / rx);
      const rg = cg.createRadialGradient(0, 0, 0, 0, 0, rx);
      rg.addColorStop(0, "rgba(255,255,255,.55)"); rg.addColorStop(1, "rgba(255,255,255,0)");
      cg.fillStyle = rg; cg.beginPath(); cg.arc(0, 0, rx, 0, 6.283); cg.fill(); cg.restore();
    }
    const ctex = new T.CanvasTexture(cc); ctex.colorSpace = T.SRGB;
    const clouds = new T.Mesh(new T.SphereGeometry(14000, 48, 8, 0, Math.PI * 2, Math.PI * 0.18, Math.PI * 0.3),
      new T.MeshBasicMaterial({ map: ctex, side: 1, fog: false, depthWrite: false, depthTest: false, transparent: true }));
    clouds.renderOrder = -9; clouds.frustumCulled = false;
    const grp = new T.Group(); grp.add(dome, clouds);
    return grp;
  }
  function seededRand(s) { return () => ((s = (s * 16807) % 2147483647) / 2147483647); }
  function dirAt(d) {
    const R = window.__R, s = S();
    const a = R.Me(Math.max(0, d - 4)), b = R.Me(Math.min(s.route.total, d + 4));
    let u = b.x - a.x, w = b.z - a.z; const L = Math.hypot(u, w) || 1; u /= L; w /= L;
    return { p: R.Me(d), u, w };
  }
  // Materiales con brillo y textura (mejoras3d.js); si no está, cae al material de siempre.
  function fxMat(lambertOpts, stdOpts) {
    const R = window.__R, fx = R && R.fx;
    return fx ? fx.std(Object.assign({}, lambertOpts, stdOpts)) : new R.T.MeshLambertMaterial(lambertOpts);
  }
  function fxTex(name, rx, ry) { const fx = window.__R.fx; return fx ? fx.tex[name](rx, ry) : null; }
  function buildScenery() {
    const R = window.__R, T = R.T, s = S();
    if (!s.route || !s.heightFn) return null;
    const grp = new T.Group(); grp.name = "rv-scenery";
    const half = R.roadWidth / 2, total = s.route.total, h = s.heightFn, rnd = seededRand(4242);
    const m4 = new T.Matrix4(), q = new T.Quaternion(), sc = new T.Vector3(1, 1, 1), pos = new T.Vector3(), up = new T.Vector3(0, 1, 0), col = new T.Color();

    // Balizas blancas con reflectivo cada 50 m a ambos lados
    const nPost = Math.min(8000, Math.floor(total / 50) * 2);
    const postGeo = new T.BoxGeometry(0.14, 1.0, 0.14); postGeo.translate(0, 0.5, 0);
    const reflGeo = new T.BoxGeometry(0.16, 0.16, 0.16); reflGeo.translate(0, 0.82, 0);
    const posts = new T.InstancedMesh(postGeo, fxMat({ color: 0xf2f2f2 }, { roughness: 0.3, map: fxTex("grain", 1, 2), envMapIntensity: 1.1 }), nPost);
    const refl = new T.InstancedMesh(reflGeo, fxMat({ color: 0xff7a1a }, { emissive: 0xff5a00, emissiveIntensity: 0.8, roughness: 0.15, envMapIntensity: 1.4 }), nPost);
    for (let i = 0; i < nPost; i++) {
      const d = Math.floor(i / 2) * 50 + 25, side = i % 2 ? 1 : -1;
      const { p, u, w } = dirAt(d), off = (half + 0.9) * side, x = p.x - w * off, z = p.z + u * off;
      pos.set(x, h(x, z) - 0.05, z); q.setFromAxisAngle(up, Math.atan2(u, w)); sc.set(1, 1, 1);
      m4.compose(pos, q, sc); posts.setMatrixAt(i, m4); refl.setMatrixAt(i, m4);
    }
    grp.add(posts, refl);

    // Arbustos y matas cerca de la banquina
    const nB = Math.min(5000, Math.floor(total / 6));
    const bushes = new T.InstancedMesh(new T.SphereGeometry(1, 9, 7), fxMat({ color: 0xffffff }, { roughness: 0.85, map: fxTex("leaves", 1, 1), bumpMap: fxTex("leaves", 1, 1), bumpScale: 1.5, envMapIntensity: 0.5 }), nB);
    for (let i = 0; i < nB; i++) {
      const d = rnd() * total, { p, u, w } = dirAt(d), side = rnd() < 0.5 ? -1 : 1;
      const off = (half + 2.2 + rnd() * 9) * side, x = p.x - w * off, z = p.z + u * off, r = 0.35 + rnd() * 0.9;
      pos.set(x, h(x, z) + r * 0.25, z); q.setFromAxisAngle(up, rnd() * 6.28); sc.set(r * (1 + rnd() * 0.6), r * (0.55 + rnd() * 0.35), r);
      m4.compose(pos, q, sc); bushes.setMatrixAt(i, m4);
      col.setHSL(0.22 + rnd() * 0.1, 0.35 + rnd() * 0.2, 0.18 + rnd() * 0.12); bushes.setColorAt(i, col);
    }
    grp.add(bushes);

    // Mojones de kilómetro
    const kmGeo = new T.BoxGeometry(0.5, 0.9, 0.18); kmGeo.translate(0, 0.45, 0);
    const capGeo = new T.BoxGeometry(0.52, 0.22, 0.2); capGeo.translate(0, 0.98, 0);
    const kmMat = fxMat({ color: 0xf4f2ec }, { roughness: 0.85, map: fxTex("concrete", 1, 1), bumpMap: fxTex("concrete", 1, 1), bumpScale: 1.2 }),
      capMat = fxMat({ color: 0xd8281e }, { roughness: 0.25, metalness: 0.05, envMapIntensity: 1.2 });
    const faceGeo = new T.PlaneGeometry(0.46, 0.5);
    for (let k = 1; k * 1000 < total; k++) {
      const { p, u, w } = dirAt(k * 1000), off = half + 1.6, x = p.x - w * off, z = p.z + u * off;
      const g = new T.Group(); g.position.set(x, h(x, z) - 0.05, z);
      g.add(new T.Mesh(kmGeo, kmMat), new T.Mesh(capGeo, capMat));
      const cv = document.createElement("canvas"); cv.width = 128; cv.height = 140;
      const cx = cv.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, 128, 140); cx.fillStyle = "#111";
      cx.textAlign = "center"; cx.font = "bold 64px Arial"; cx.fillText(String(k), 64, 70); cx.font = "bold 34px Arial"; cx.fillText("km", 64, 118);
      const tx = new T.CanvasTexture(cv); tx.colorSpace = T.SRGB;
      const face = new T.Mesh(faceGeo, window.__R.fx ? fxMat({ map: tx }, { roughness: 0.4, emissive: 0xffffff, emissiveMap: tx, emissiveIntensity: 0.35 }) : new T.MeshBasicMaterial({ map: tx })); face.position.set(0, 0.45, 0.1);
      g.add(face);
      const back = R.Me(Math.max(0, k * 1000 - 30)); g.lookAt(back.x, g.position.y, back.z);
      grp.add(g);
    }
    return grp;
  }
  function rebuildScenery() {
    const R = window.__R; if (!R) return;
    const world = R.world();
    if (sceneryGroup && sceneryGroup.parent) sceneryGroup.parent.remove(sceneryGroup);
    sceneryGroup = null;
    if (world && $("chkScenery") && $("chkScenery").checked) {
      try { sceneryGroup = buildScenery(); if (sceneryGroup) world.add(sceneryGroup); } catch (e) { console.warn("[RutaViva] paisaje", e); }
    }
  }

  // ───────────────────────── Carteles de publicidad ─────────────────────────
  let adCfg = null, ads = [], rideSecs = 0, nextAdAt = 60, adIdx = 0, adGeo = null;
  const adTextures = new Map();
  async function loadAdCfg() {
    try { adCfg = await (await fetch("carteles.json", { cache: "no-cache" })).json(); } catch { adCfg = { carteles: [] }; }
    nextAdAt = adCfg.primer_cartel_segundos ?? 60;
  }
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function adTexture(ad) {
    if (adTextures.has(ad.id)) return adTextures.get(ad.id);
    const T = window.__R.T, c = document.createElement("canvas"); c.width = 1024; c.height = 512;
    const g = c.getContext("2d"), tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGB;
    if (ad.tipo === "imagen" && ad.imagen) {
      g.fillStyle = "#fff"; g.fillRect(0, 0, 1024, 512);
      const img = new Image(); img.crossOrigin = "anonymous";
      img.onload = () => { const k = Math.min(1024 / img.width, 512 / img.height), w = img.width * k, hh = img.height * k; g.drawImage(img, (1024 - w) / 2, (512 - hh) / 2, w, hh); tex.needsUpdate = true; };
      img.src = ad.imagen;
    } else {
      const bg = ad.fondo || "#0f2a44", ac = ad.acento || "#ff6a2b", fg = ad.texto_color || "#fff";
      const gr = g.createLinearGradient(0, 0, 1024, 512); gr.addColorStop(0, bg); gr.addColorStop(1, "#071523");
      g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
      g.fillStyle = ac; g.fillRect(0, 0, 22, 512);
      g.globalAlpha = 0.14; g.beginPath(); g.arc(900, 90, 230, 0, 6.283); g.fill(); g.globalAlpha = 1;
      g.fillStyle = fg; g.font = "800 82px -apple-system,Segoe UI,Arial"; g.fillText(ad.titulo || "", 70, 170);
      g.fillStyle = ac; g.font = "700 54px -apple-system,Segoe UI,Arial"; g.fillText(ad.subtitulo || "", 72, 250);
      g.fillStyle = fg; g.font = "500 46px -apple-system,Segoe UI,Arial"; g.fillText(ad.linea3 || "", 72, 320);
      if (ad.pie) {
        g.font = "600 38px -apple-system,Segoe UI,Arial"; const w = g.measureText(ad.pie).width + 60;
        g.fillStyle = "rgba(255,255,255,.12)"; roundRect(g, 66, 380, w, 70, 35); g.fill();
        g.fillStyle = fg; g.fillText(ad.pie, 96, 428);
      }
    }
    adTextures.set(ad.id, tex);
    return tex;
  }
  function spawnBillboard() {
    const R = window.__R, T = R.T, s = S(), world = R.world();
    if (!adCfg || !adCfg.carteles || !adCfg.carteles.length || !world || !s.route) return;
    const d0 = s.d + Math.max(160, s.v * 25);
    if (d0 > s.route.total - 30) return;
    const ad = adCfg.carteles[adIdx++ % adCfg.carteles.length];
    if (!adGeo) {
      const post = new T.CylinderGeometry(0.14, 0.18, 5.2, 8); post.translate(0, 2.6, 0);
      adGeo = { post, frame: new T.BoxGeometry(8.4, 4.4, 0.3), face: new T.PlaneGeometry(8, 4),
        postMat: fxMat({ color: 0x8a9098 }, { metalness: 0.9, roughness: 0.32, map: fxTex("brushed", 1, 4), envMapIntensity: 1.3 }),
        frameMat: fxMat({ color: 0x2a2f37 }, { metalness: 0.75, roughness: 0.3, map: fxTex("brushed", 3, 1), envMapIntensity: 1.2 }) };
    }
    const { p, u, w } = dirAt(d0), off = R.roadWidth / 2 + 5.5, x = p.x - w * off, z = p.z + u * off;
    const gy = s.heightFn ? s.heightFn(x, z) : p.y;
    const g = new T.Group(); g.position.set(x, gy - 0.1, z); g.name = "rv-billboard";
    const p1 = new T.Mesh(adGeo.post, adGeo.postMat); p1.position.x = -3.2;
    const p2 = new T.Mesh(adGeo.post, adGeo.postMat); p2.position.x = 3.2;
    const fr = new T.Mesh(adGeo.frame, adGeo.frameMat); fr.position.y = 6.6;
    const tex = adTexture(ad);
    const faceMat = window.__R.fx ? fxMat({ map: tex }, { roughness: 0.35, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.45, envMapIntensity: 0.8 }) : new T.MeshBasicMaterial({ map: tex });
    const fc = new T.Mesh(adGeo.face, faceMat); fc.position.set(0, 6.6, 0.16);
    const fb = new T.Mesh(adGeo.face, faceMat); fb.position.set(0, 6.6, -0.16); fb.rotation.y = Math.PI;
    g.add(p1, p2, fr, fc, fb);
    const tg = R.Me(Math.max(0, d0 - 45)); g.lookAt(tg.x, g.position.y, tg.z);
    world.add(g);
    ads.push({ g, d0, id: ad.id, logged: false, world });
  }
  function clearBillboards() { for (const a of ads) if (a.g.parent) a.g.parent.remove(a.g); ads = []; }
  function updateBillboards(dt) {
    const s = S(); if (!s || !s.route) return;
    if (s.riding && !s.loading && $("chkAds") && $("chkAds").checked) {
      rideSecs += dt;
      if (rideSecs >= nextAdAt) {
        spawnBillboard();
        const mn = (adCfg && adCfg.minutos_min) || 3, mx = (adCfg && adCfg.minutos_max) || 5;
        nextAdAt = rideSecs + (mn + Math.random() * (mx - mn)) * 60;
      }
    }
    for (const a of ads) {
      if (!a.logged && s.d >= a.d0 - 8) {
        a.logged = true;
        if (sb && user) sb.from("vistas_carteles").insert({ cartel: a.id, ruta: s.route.name }).then(({ error }) => error && console.warn("[RutaViva] cartel", error));
      }
    }
    ads = ads.filter((a) => {
      if (s.d > a.d0 + 120 || a.world !== window.__R.world()) { if (a.g.parent) a.g.parent.remove(a.g); return false; }
      return true;
    });
  }

  // (El registro de salidas ahora está en salidas.js.)

  // ───────────────────────── Bucle propio ─────────────────────────
  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.25, (now - last) / 1000); last = now;
    const R = window.__R;
    try {
      if (R) {
        if (!sky) { sky = makeSky(); R.scene.add(sky); }
        sky.position.copy(R.camera.position);
        const w = R.world();
        if (w !== lastWorld) {
          lastWorld = w; clearBillboards(); rideSecs = 0; nextAdAt = (adCfg && adCfg.primer_cartel_segundos) ?? 60;
          if (w) rebuildScenery();
        }
        if (w) updateBillboards(dt);
      }
    } catch (e) { console.warn("[RutaViva]", e); }
    requestAnimationFrame(tick);
  }

  function toast(text, ms) { if (window.__R) window.__R.toast(text, ms); else console.log(text); }

  // ───────────────────────── Arranque ─────────────────────────
  let started = false;
  function start() {
    if (started) return; started = true;
    document.title = "RutaViva — tu ruta real, en el rodillo";
    addPanelBits();
    applyLang();
    loadAdCfg();
    requestAnimationFrame(tick);
    initAuth();
  }
  if (window.__R) start(); else addEventListener("rodillo-listo", start, { once: true });
})();
