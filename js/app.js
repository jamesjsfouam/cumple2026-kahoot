(function(){
"use strict";

var PLAYER_ONLY_MODE = window.__PLAYER_ONLY_MODE__ === true;

var $ = function(s, r){ return (r || document).querySelector(s); };
var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
function esc(s){
  return String(s === undefined || s === null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function uid(){ return Math.random().toString(36).slice(2, 9); }
function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }

var toastTimer = null;
function toast(msg){
  var el = $("#toastBox");
  if(!el) return;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ el.classList.remove("show"); }, 2800);
}

function copyText(txt, okMsg){
  function fallback(){
    try {
      var ta = document.createElement("textarea");
      ta.value = txt;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch(e) { return false; }
  }
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(function(){
      toast(okMsg || "Copiado al portapapeles.");
    }, function(){
      toast(fallback() ? (okMsg || "Copiado al portapapeles.") : "No se pudo copiar.");
    });
  } else {
    toast(fallback() ? (okMsg || "Copiado al portapapeles.") : "No se pudo copiar.");
  }
}

/* =========================================================================
   DATOS BASE DEL CUMPLEAÑOS DE JAMES (DE KIT-FIESTA.HTML)
   ========================================================================= */
var DEFAULT_QUIZ = [
  {q:"¿Cuál es mi juego favorito?", o:["War Thunder","Fortnite","Minecraft","Counter-Strike 2"], a:0, c:"guerra"},
  {q:"¿Cuál es mi plato nicaragüense favorito?", o:["Gallo pinto","Nacatamal","Vigorón","Indio viejo"], a:3, c:"comida"},
  {q:"¿Qué café pido siempre?", o:["Capuchino","Café negro","Mocha","Frappé"], a:2, c:"comida"},
  {q:"¿Qué mazo uso en Yu-Gi-Oh!?", o:["Blue-Eyes (Ojos Azules)","D/D/D","Red-Eyes (Dragón Negro)","Mago Oscuro"], a:1, c:"cartas"},
  {q:"¿Qué apertura uso con blancas y qué defensa con negras?", o:["Ruy López con blancas y Francesa con negras","Gambito de Dama con blancas y Siciliana con negras","Italiana con blancas y Siciliana con negras","Italiana con blancas y Caro-Kann con negras"], a:2, c:"ajedrez"},
  {q:"Me gustan todos estos, pero ¿cuál es mi favorito ahorita?", o:["Soda Stereo","Gustavo Cerati","Andrés Calamaro","Tame Impala"], a:3, c:"musica"},
  {q:"¿Cuál es mi tanque favorito?", o:["Sherman","M1 Abrams","King Tiger","IS-4"], a:1, c:"guerra"},
  {q:"¿Qué sabor de helado pido?", o:["Naranja holandesa","Chocolate","Vainilla","Fresa"], a:0, c:"comida"},
  {q:"¿Cuál es mi serie favorita?", o:["El Mentalista","Young Sheldon","Dr. House","Grey’s Anatomy"], a:2, c:"series"},
  {q:"¿Qué jugador de ajedrez me inspira más?", o:["Magnus Carlsen","Bobby Fischer","Garry Kasparov","Capablanca"], a:1, c:"ajedrez"},
  {q:"¿Qué pizza pido siempre?", o:["Pepperoni","Hawaiana","Cuatro quesos","Jamón y hongos"], a:3, c:"comida"},
  {q:"¿Cuál es mi avión favorito?", o:["F4U-4 Corsair","F6F Hellcat","Mitsubishi A6M Zero","Focke-Wulf Fw 190"], a:0, c:"guerra"},
  {q:"¿Cuál es mi libro favorito?", o:["Rebelión en la granja","1984","La metamorfosis","Noches blancas"], a:1, c:"libros"},
  {q:"¿Cuántos trofeos y medallas llevo este año en ajedrez?", o:["2 trofeos y 1 medalla","3 trofeos y ninguna medalla","1 trofeo y 3 medallas","1 trofeo y 2 medallas"], a:3, c:"ajedrez"},
  {q:"¿Cuál es mi comida favorita?", o:["Pasta","Pollo a la plancha en salsa de hongos","Pizza de jamón y hongos","Tacos"], a:1, c:"comida"}
];

var DEFAULT_VERDADES = [
  {s:["Aprendí a jugar ajedrez de chiquito porque le veía jugar a un tío mío. Mi primer tablero era de cristal y se me perdió.","Mi laptop es una MacBook Air y ahí hago todos mis proyectos.","Nikara fue mi primer hackathon. Antes de eso solo había participado en rallys de innovación."], l:1},
  {s:["Mi celular es un iPhone y lo cambio casi todos los años.","Estudio dos carreras a la vez en la UAM, Economía Empresarial e Ingeniería de Sistemas.","Siempre se me pierde la cartera. Es lo que más pierdo."], l:0},
  {s:["Soy fan de Kirby, pero la verdad nunca he jugado un juego de Kirby.","Entre mis favoritos de Steam están Papers, Please y Cult of the Lamb.","Mi color favorito es el rosa. Por eso me gusta tanto Kirby."], l:2},
  {s:["Otro de mis favoritos de Steam es Victoria 3, el de manejar un país en el siglo XIX.","En Steam tengo Fortnite y es al que más horas le he metido.","De todo Yu-Gi-Oh!, lo que más me gusta es una película: The Dark Side of Dimensions."], l:1},
  {s:["Si no es café, siempre pido refresco.","Sigo la Fórmula 1 y soy del Real Madrid.","Quiero aprender piano y mi primer viaje soñado es a Italia."], l:0},
  {s:["Mi lugar favorito de Nicaragua es Ometepe. Para viajar prefiero la montaña.","Colecciono libros y cocinar es lo que más hago con las manos.","Solo juego ajedrez en tablero, nunca en internet."], l:2}
];

var SEED_GUESTS = [
  ["Melissa","c","i"],["Yo (cumpleañero)","c","i"],["Fidel","c","i"],["Alejandro","c","i"],["Samantha","c","i"],
  ["Justin","c",""],["Ariana","c",""],["Jose","c",""],["Lauren","c",""],["Nidia","c",""],["Peña","c",""],
  ["David","c",""],["Mily","c",""],["Jose Alfredo","c",""],["Hazel","c",""],["Marlon","c",""],["Guido","c",""],["Romano","c",""],
  ["Gabriel","p",""],
  ["Paola","c",""],["Sara","c",""],["Enya","c",""],["América","c",""],["Luis","c",""],["Emmanuel","c",""],["Ian","c",""],["Memo","c",""],
  ["Derek","c",""],["Alexandra","c",""],["Brenda","c",""],["Nohemi","c",""],["Andy","c",""],["Cecilia","c",""]
];

var CAT_META = {
  guerra:  { name: "Guerra / War Thunder", color: "#0E7C6B" },
  comida:  { name: "Comida y Café",        color: "#C2410C" },
  cartas:  { name: "Yu-Gi-Oh! D/D/D",      color: "#6D4AE0" },
  ajedrez: { name: "Ajedrez / Fischer",    color: "#15120F" },
  musica:  { name: "Música / Bruma",       color: "#EC5C9A" },
  series:  { name: "Series / Dr. House",   color: "#B42318" },
  libros:  { name: "Libros / Orwell",      color: "#B8902E" },
  mentira: { name: "Dos Verdades / Mentira", color: "#1E3A8A" }
};

var STORAGE_KEY = "cumple_james_kahoot_admin_v2";
var STATE = {};
try {
  STATE = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {};
} catch(e) { STATE = {}; }

if(!STATE.roomPin) STATE.roomPin = "1926";
if(!STATE.quiz || !STATE.quiz.length) STATE.quiz = JSON.parse(JSON.stringify(DEFAULT_QUIZ));
if(!STATE.verdades || !STATE.verdades.length) STATE.verdades = JSON.parse(JSON.stringify(DEFAULT_VERDADES));
if(!STATE.guests || !STATE.guests.length){
  STATE.guests = SEED_GUESTS.map(function(g){ return {id: uid(), n: g[0], s: g[1], k: g[2], note: ""}; });
}
if(!STATE.order) STATE.order = { size: 14, q: { j: 5, p: 5, e: 2 }, dq: 1, dp: 37.5, sl: 8, gs: 3 };
if(!STATE.budget){
  STATE.budget = {
    total: 5000,
    items: [
      {id:"b1", c:"Comida Rock Munchies (12 pizzas y bebidas)", amt: 4767.5, cat:"Comida", paid:false},
      {id:"b2", c:"Pastel de cumpleaños", amt: 0, cat:"Pastel", paid:false},
      {id:"b3", c:"Premio 1 (ganador del quiz)", amt: 250, cat:"Premios", paid:false},
      {id:"b5", c:"Premio 2 (ganador de dos verdades)", amt: 250, cat:"Premios", paid:false}
    ]
  };
}
if(!STATE.prizes) STATE.prizes = { q: { d: "Premio Duelo Quiz (C$ 250)", w: "" }, v: { d: "Premio Diagnóstico (C$ 250)", w: "" } };
if(!STATE.agenda){
  STATE.agenda = [
    {id:"a1", t:"Llegada y bienvenida en Rock Munchies", min:30},
    {id:"a2", t:"Pedir las pizzas y bebidas", min:15},
    {id:"a3", t:"Reto 1: Quiz Kahoot de eliminación", min:25},
    {id:"a4", t:"A comer pizzas", min:30},
    {id:"a5", t:"Reto 2: Dos verdades y una mentira", min:20},
    {id:"a6", t:"Pastel y cantar cumpleaños", min:15},
    {id:"a7", t:"Premiación, fotos y despedida", min:20}
  ];
}
if(!STATE.tasks){
  STATE.tasks = [
    {id:"t1", t:"Confirmar con Rock Munchies el número final (32 confirmados y 1 pendiente)", d:"2026-11-02", done:true},
    {id:"t2", t:"Confirmar asistencia de Gabriel", d:"2026-11-03", done:false},
    {id:"t3", t:"Comprar los 2 premios (tope C$ 500 entre ambos)", d:"2026-11-02", done:true},
    {id:"t4", t:"Compartir el archivo retos-cumple-amigos.html en el grupo de WhatsApp", d:"2026-11-03", done:false},
    {id:"t5", t:"Cargar el celular al 100% y llevar cargador a Rock Munchies", d:"2026-11-03", done:false}
  ];
}
if(!STATE.liveFeed) STATE.liveFeed = [];

function saveState(){
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE)); } catch(e){}
}

/* Construye la lista unificada de las 21 cartas (15 de quiz + 6 de dos verdades) */
function getCombinedDeck(mode){
  var deck = [];
  if(mode !== "verdades"){
    STATE.quiz.forEach(function(q, idx){
      deck.push({
        uid: "Q" + (idx + 1),
        num: deck.length + 1,
        type: "quiz",
        q: q.q,
        o: q.o.slice(),
        a: q.a,
        c: q.c || "guerra",
        hint: "quiz · elige la respuesta correcta"
      });
    });
  }
  if(mode !== "quiz"){
    STATE.verdades.forEach(function(v, idx){
      deck.push({
        uid: "V" + (idx + 1),
        num: deck.length + 1,
        type: "verdades",
        q: "Ronda " + (idx + 1) + " · ¿Cuál de estas 3 afirmaciones sobre mí es MENTIRA?",
        o: v.s.slice(),
        a: v.l,
        c: "mentira",
        hint: "diagnóstico · detecta cuál de las 3 es la mentira"
      });
    });
  }
  return deck;
}

function getRankTitle(accPct, avgSec){
  if(accPct >= 90 && avgSec <= 4.5) return "Gran Maestro D/D/D ✦";
  if(accPct >= 80) return "Estratega de Fischer";
  if(accPct >= 65) return "Diagnóstico de Dr. House";
  if(accPct >= 50) return "Piloto de F4U-4 Corsair";
  return "Peón en la Bruma";
}

/* =========================================================================
   GENERADOR DE DATOS DE PRUEBA REALISTAS (12 AMIGOS INVITADOS)
   ========================================================================= */
function buildSimulatedSubmission(name, skillBias, speedBias, seedIdx){
  var deck = getCombinedDeck("full");
  var answers = [];
  var score = 0;
  var lp = 8000;
  var streak = 0;
  var maxStreak = 0;
  var correctCount = 0;
  var totalMs = 0;

  /* Preguntas con distinta dificultad realista */
  var hardSet = { "Q5": 0.35, "Q12": 0.28, "Q14": 0.25, "V3": 0.32, "V6": 0.30 };

  deck.forEach(function(item, idx){
    var baseProb = hardSet[item.uid] !== undefined ? hardSet[item.uid] : 0.72;
    /* Pseudo-random determinista pero variado */
    var r = Math.abs(Math.sin((seedIdx + 1) * 97 + (idx + 1) * 31));
    var isCorrect = r < clamp(baseProb + skillBias, 0.15, 0.96);
    var choice = item.a;
    if(!isCorrect){
      var wrongOpts = [];
      for(var k = 0; k < item.o.length; k++){
        if(k !== item.a) wrongOpts.push(k);
      }
      /* Sesgo hacia distractores creíbles */
      choice = wrongOpts[(seedIdx + idx) % wrongOpts.length];
    }

    var rTime = Math.abs(Math.cos((seedIdx + 2) * 53 + idx * 19));
    var ms = Math.round(clamp((speedBias + rTime * 4.8) * 1000, 1200, 13800));
    totalMs += ms;

    var pts = 0;
    if(isCorrect){
      correctCount++;
      streak++;
      if(streak > maxStreak) maxStreak = streak;
      var speedBonus = Math.round(Math.max(0, (1 - ms / 15000)) * 500);
      var streakBonus = Math.min(300, (streak - 1) * 75);
      pts = 500 + speedBonus + streakBonus;
      score += pts;
    } else {
      streak = 0;
      lp = Math.max(0, lp - 1000);
    }

    answers.push({
      uid: item.uid,
      choice: choice,
      correct: isCorrect,
      ms: ms,
      pts: pts
    });
  });

  var avgSec = +(totalMs / deck.length / 1000).toFixed(2);
  var accPct = Math.round((correctCount / deck.length) * 100);

  return {
    id: "sim_" + name.toLowerCase().replace(/[^a-z0-9]/g, "") + "_" + seedIdx,
    name: name,
    mode: "full",
    totalQuestions: deck.length,
    correct: correctCount,
    acc: accPct,
    score: score,
    avgSec: avgSec,
    maxStreak: maxStreak,
    lp: lp,
    rank: getRankTitle(accPct, avgSec),
    isSim: true,
    ts: Date.now() - (12 - seedIdx) * 140000,
    answers: answers
  };
}

function seedInitialDemoSubmissions(){
  var presets = [
    ["Melissa",       0.22, 2.3],
    ["Alejandro",     0.18, 2.7],
    ["Samantha",      0.15, 3.1],
    ["Fidel",         0.12, 2.5],
    ["Jose Alfredo",  0.09, 3.6],
    ["Lauren",        0.05, 4.0],
    ["David",         0.02, 3.3],
    ["Justin",       -0.04, 2.4],
    ["Ariana",       -0.06, 4.8],
    ["Paola",        -0.10, 5.2],
    ["Sara",         -0.14, 4.5],
    ["Memo",         -0.18, 6.1]
  ];
  return presets.map(function(p, i){
    return buildSimulatedSubmission(p[0], p[1], p[2], i + 1);
  });
}

if(!STATE.submissions){
  STATE.submissions = seedInitialDemoSubmissions();
  STATE.liveFeed = [
    { txt: "Melissa completó el Reto Completo con 19/21 aciertos (16,420 pts)", ts: "hace 2 min", ok: true },
    { txt: "Alejandro logró una racha 🔥 x11 en el Quiz", ts: "hace 4 min", ok: true },
    { txt: "Samantha acertó la pregunta del mazo D/D/D en 2.1 s", ts: "hace 5 min", ok: true },
    { txt: "Justin cayó en la trampa del avión Mitsubishi Zero (-1000 LP)", ts: "hace 7 min", ok: false }
  ];
  saveState();
}

/* =========================================================================
   MOTOR DE SINCRONIZACIÓN EN TIEMPO REAL (MQTT WEBSOCKETS + LOCAL CHANNEL)
   ========================================================================= */
var bcChannel = null;
try {
  if(window.BroadcastChannel){
    bcChannel = new BroadcastChannel("duelo_james_cumple_19");
    bcChannel.onmessage = function(ev){
      if(ev && ev.data) handleIncomingNetworkPayload(ev.data, "Local Tab");
    };
  }
} catch(e){}

window.addEventListener("storage", function(ev){
  if(ev.key === "duelo_james_last_packet" && ev.newValue){
    try {
      handleIncomingNetworkPayload(JSON.parse(ev.newValue), "Local Storage");
    } catch(e){}
  }
});

var mqttClient = null;
var mqttConnected = false;

function connectLiveRoom(){
  var pin = (STATE.roomPin || "1926").trim();
  $("#adminRoomBadge").textContent = "sala pin: " + pin;
  if(!window.mqtt){
    $("#netDot").classList.add("offline");
    $("#netStatusTxt").textContent = "sala " + pin + " · modo local";
    return;
  }
  try {
    if(mqttClient){
      try { mqttClient.end(true); } catch(e){}
    }
    var topicBase = "duelo-james-2026-ni/sala-" + pin;
    mqttClient = window.mqtt.connect("wss://broker.emqx.io:8084/mqtt", {
      clientId: "duelista_" + uid(),
      clean: true,
      connectTimeout: 5000,
      reconnectPeriod: 4000
    });
    mqttClient.on("connect", function(){
      mqttConnected = true;
      $("#netDot").classList.remove("offline");
      $("#netStatusTxt").textContent = "sala " + pin + " · en vivo (mqtt)";
      mqttClient.subscribe(topicBase + "/#", { qos: 0 });
    });
    mqttClient.on("message", function(topic, payload){
      try {
        var data = JSON.parse(payload.toString());
        handleIncomingNetworkPayload(data, "En Vivo");
      } catch(e){}
    });
    mqttClient.on("error", function(){
      $("#netDot").classList.add("offline");
      $("#netStatusTxt").textContent = "sala " + pin + " · local / código";
    });
  } catch(e){
    $("#netDot").classList.add("offline");
    $("#netStatusTxt").textContent = "sala " + pin + " · local / código";
  }
}

function broadcastPacket(packet){
  var pin = (STATE.roomPin || "1926").trim();
  packet.pin = pin;
  try {
    if(bcChannel) bcChannel.postMessage(packet);
  } catch(e){}
  try {
    localStorage.setItem("duelo_james_last_packet", JSON.stringify(packet));
  } catch(e){}
  try {
    if(mqttClient && mqttConnected){
      var topicBase = "duelo-james-2026-ni/sala-" + pin;
      if(packet.kind === "submission"){
        mqttClient.publish(topicBase + "/player/" + packet.submission.id, JSON.stringify(packet), { qos: 0, retain: true });
      } else {
        mqttClient.publish(topicBase + "/live", JSON.stringify(packet), { qos: 0 });
      }
    }
  } catch(e){}
}

function handleIncomingNetworkPayload(data, sourceLabel){
  if(!data || !data.kind) return;
  if(data.kind === "answer_step"){
    var msg = data.player + (data.correct ? " acertó " : " falló ") + data.uid +
      " · " + (data.choiceText || "sin respuesta") + " en " + (data.ms / 1000).toFixed(1) +
      " s (" + (data.correct ? "+" + data.pts + " pts" : "-1000 LP") + ")";
    STATE.liveFeed.unshift({ txt: msg, ts: "ahora · " + sourceLabel, ok: data.correct });
    if(STATE.liveFeed.length > 35) STATE.liveFeed.length = 35;
    saveState();
    renderLiveFeed();
  } else if(data.kind === "player_join"){
    if(!PLAYER_ONLY_MODE){
      STATE.liveFeed.unshift({ txt: data.player + " entró a la sala.", ts: "ahora · " + sourceLabel, ok: true });
      if(STATE.liveFeed.length > 35) STATE.liveFeed.length = 35;
      saveState();
      renderLiveFeed();
    }
  } else if(data.kind === "host_question"){
    if(PLAYER_ONLY_MODE && PL_GAME.active){
      startPlayerRound(data);
    }
  } else if(data.kind === "host_session_start"){
    if(PLAYER_ONLY_MODE && PL_GAME.active){
      PL_GAME.mode = data.mode || PL_GAME.mode;
      PL_GAME.secLimit = +data.limitSec || PL_GAME.secLimit;
      PL_GAME.waitingForHost = true;
      showPlayerWaiting("James preparó la sala. Espera a que inicie el reloj.");
    }
  } else if(data.kind === "host_reveal"){
    if(PLAYER_ONLY_MODE && PL_GAME.active && !PL_GAME.answeredCurrent){
      submitPlayerChoice(-1);
    }
  } else if(data.kind === "host_end"){
    if(PLAYER_ONLY_MODE && PL_GAME.active){
      finishPlayerGame();
    }
  } else if(data.kind === "submission" && data.submission){
    upsertSubmission(data.submission, true);
  }
}

function upsertSubmission(sub, notify){
  if(!sub || !sub.name) return;
  var existingIdx = -1;
  for(var i = 0; i < STATE.submissions.length; i++){
    if(STATE.submissions[i].id === sub.id || (STATE.submissions[i].name.toLowerCase() === sub.name.toLowerCase() && !sub.keepSeparate)){
      existingIdx = i;
      break;
    }
  }
  if(existingIdx >= 0){
    STATE.submissions[existingIdx] = sub;
  } else {
    STATE.submissions.push(sub);
  }
  STATE.liveFeed.unshift({
    txt: "★ " + sub.name + " finalizó con " + sub.score.toLocaleString("es-NI") + " pts (" + sub.correct + "/" + sub.totalQuestions + " · " + sub.acc + "%)",
    ts: "recién recibido",
    ok: true
  });
  saveState();
  renderAllAdminViews();
  if(notify){
    toast("Nuevo resultado recibido: " + sub.name + " (" + sub.score.toLocaleString("es-NI") + " pts)");
  }
}

/* =========================================================================
   CODIFICACIÓN COMPACTA DE RESULTADOS (DUELO19:...) PARA WHATSAPP / OFFLINE
   ========================================================================= */
function encodeSubmissionToken(sub){
  var compact = {
    n: sub.name,
    m: sub.mode,
    s: sub.score,
    c: sub.correct,
    t: sub.totalQuestions,
    v: sub.avgSec,
    k: sub.maxStreak,
    l: sub.lp,
    a: (sub.answers || []).map(function(x){
      return [x.uid, x.choice, x.correct ? 1 : 0, x.ms, x.pts];
    })
  };
  var jsonStr = JSON.stringify(compact);
  var b64 = btoa(unescape(encodeURIComponent(jsonStr)));
  return "DUELO19:" + b64;
}

function decodeSubmissionToken(tokenStr){
  var clean = tokenStr.trim().replace(/^DUELO19:/i, "");
  var jsonStr = decodeURIComponent(escape(atob(clean)));
  var c = JSON.parse(jsonStr);
  var acc = c.t ? Math.round((c.c / c.t) * 100) : 0;
  return {
    id: "imp_" + c.n.toLowerCase().replace(/[^a-z0-9]/g, "") + "_" + Date.now().toString(36),
    name: c.n || "Amigo",
    mode: c.m || "full",
    totalQuestions: c.t || 21,
    correct: c.c || 0,
    acc: acc,
    score: c.s || 0,
    avgSec: c.v || 4.0,
    maxStreak: c.k || 0,
    lp: c.l !== undefined ? c.l : 4000,
    rank: getRankTitle(acc, c.v || 4.0),
    isSim: false,
    ts: Date.now(),
    answers: (c.a || []).map(function(arr){
      return { uid: arr[0], choice: arr[1], correct: !!arr[2], ms: arr[3], pts: arr[4] };
    })
  };
}

/* =========================================================================
   SONIDOS SINTETIZADOS (WEB AUDIO API)
   ========================================================================= */
var audioCtx = null;
function playTone(freq, dur, type, vol){
  var chk = $("#plSoundChk");
  if(chk && !chk.checked) return;
  try {
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol || 0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  } catch(e){}
}
function sfxHit(){
  [523.25, 659.25, 783.99, 1046.5].forEach(function(f, idx){
    setTimeout(function(){ playTone(f, 0.22, "triangle", 0.1); }, idx * 75);
  });
}
function sfxMiss(){
  playTone(220, 0.25, "sawtooth", 0.08);
  setTimeout(function(){ playTone(165, 0.35, "sawtooth", 0.08); }, 140);
}
function sfxTick(){ playTone(740, 0.07, "sine", 0.05); }

/* =========================================================================
   RENDERIZADO DE ANALÍTICA Y ESTADÍSTICAS DEL PANEL DE ADMINISTRADOR
   ========================================================================= */
function computeQuestionStats(){
  var deck = getCombinedDeck("full");
  var statsMap = {};
  deck.forEach(function(item){
    statsMap[item.uid] = {
      item: item,
      attempts: 0,
      hits: 0,
      totalMs: 0,
      optCounts: item.o.map(function(){ return 0; }),
      optVoters: item.o.map(function(){ return []; })
    };
  });

  STATE.submissions.forEach(function(sub){
    (sub.answers || []).forEach(function(ans){
      var st = statsMap[ans.uid];
      if(!st) return;
      st.attempts++;
      if(ans.correct) st.hits++;
      st.totalMs += (ans.ms || 4000);
      if(ans.choice >= 0 && ans.choice < st.optCounts.length){
        st.optCounts[ans.choice]++;
        st.optVoters[ans.choice].push(sub.name);
      }
    });
  });

  return deck.map(function(item){
    var st = statsMap[item.uid];
    var acc = st.attempts ? Math.round((st.hits / st.attempts) * 100) : 0;
    var avgSec = st.attempts ? +(st.totalMs / st.attempts / 1000).toFixed(2) : 0;
    return {
      item: item,
      attempts: st.attempts,
      hits: st.hits,
      acc: acc,
      avgSec: avgSec,
      optCounts: st.optCounts,
      optVoters: st.optVoters
    };
  });
}

function makeMiniHist(pct){
  var bars = Math.round(clamp(pct, 0, 100) / 10);
  var h = '<div class="mini-hist" aria-hidden="true">';
  for(var i = 0; i < 10; i++){
    var height = 28 + i * 7.2;
    h += '<i class="' + (i < bars ? "on" : "") + '" style="--h:' + height + '%"></i>';
  }
  return h + '</div>';
}

function renderAdminKpis(){
  var subs = STATE.submissions;
  var hasSim = subs.some(function(s){ return s.isSim; });
  var badge = $("#demoStateBadge");
  if(badge){
    badge.textContent = hasSim
      ? "✦ datos demo activos (" + subs.length + " jugadores)"
      : "✦ sala en vivo (" + subs.length + " jugadores reales)";
    badge.className = "badge " + (hasSim ? "badge-gold" : "badge-ok");
  }

  var n = subs.length;
  var avgScore = 0, stdScore = 0, avgAcc = 0, avgTime = 0, topName = "Sin datos", topScore = 0;
  if(n > 0){
    var sorted = subs.slice().sort(function(a,b){ return b.score - a.score; });
    topName = sorted[0].name;
    topScore = sorted[0].score;
    avgScore = Math.round(subs.reduce(function(a, s){ return a + s.score; }, 0) / n);
    var variance = subs.reduce(function(a, s){ return a + Math.pow(s.score - avgScore, 2); }, 0) / n;
    stdScore = Math.round(Math.sqrt(variance));
    avgAcc = Math.round(subs.reduce(function(a, s){ return a + s.acc; }, 0) / n);
    avgTime = +(subs.reduce(function(a, s){ return a + s.avgSec; }, 0) / n).toFixed(2);
  }

  var qStats = computeQuestionStats().filter(function(q){ return q.attempts > 0; });
  var hardest = qStats.length ? qStats.slice().sort(function(a,b){ return a.acc - b.acc; })[0] : null;
  var easiest = qStats.length ? qStats.slice().sort(function(a,b){ return b.acc - a.acc; })[0] : null;

  var cells = [
    {
      tag: "participantes",
      num: n + " / 32",
      sub: n ? ("Líder: " + topName + " (" + topScore.toLocaleString("es-NI") + ")") : "Esperando jugadores",
      pct: (n / 32) * 100
    },
    {
      tag: "puntaje medio (μ ± σ)",
      num: avgScore.toLocaleString("es-NI"),
      sub: "Desv. estándar σ = " + stdScore.toLocaleString("es-NI") + " pts",
      pct: (avgScore / 18000) * 100
    },
    {
      tag: "precisión global",
      num: avgAcc + "%",
      sub: "Media de aciertos en 21 cartas",
      pct: avgAcc
    },
    {
      tag: "velocidad media",
      num: avgTime + " s",
      sub: "Tiempo medio de reacción",
      pct: Math.max(10, 100 - (avgTime / 15) * 100)
    },
    {
      tag: "carta más difícil",
      num: hardest ? (hardest.acc + "%") : "—",
      sub: hardest ? (hardest.item.uid + ": " + hardest.item.q) : "Sin datos aún",
      pct: hardest ? hardest.acc : 0
    },
    {
      tag: "carta más dominada",
      num: easiest ? (easiest.acc + "%") : "—",
      sub: easiest ? (easiest.item.uid + ": " + easiest.item.q) : "Sin datos aún",
      pct: easiest ? easiest.acc : 0
    }
  ];

  $("#adminKpisGrid").innerHTML = cells.map(function(c){
    return '<div class="cifra-cell">' +
      '<span class="cifra-tag">' + esc(c.tag) + '</span>' +
      '<b class="cifra-num">' + esc(c.num) + '</b>' +
      '<span class="cifra-sub" title="' + esc(c.sub) + '">' + esc(c.sub) + '</span>' +
      makeMiniHist(c.pct) +
    '</div>';
  }).join("");
}

function renderPodium(){
  var sorted = STATE.submissions.slice().sort(function(a,b){
    if(b.score !== a.score) return b.score - a.score;
    return a.avgSec - b.avgSec;
  });
  var top3 = sorted.slice(0, 3);
  if(!top3.length){
    $("#podiumContainer").innerHTML = '<p style="color:var(--graphite); padding:16px 0;">Aún no hay jugadores registrados. Comparte el archivo HTML o pulsa «Simular +5 jugadores».</p>';
    return;
  }
  var medals = ["🥇 1.er Lugar · Campeón del Duelo", "🥈 2.do Lugar · Finalista", "🥉 3.er Lugar · Podio"];
  $("#podiumContainer").innerHTML = '<div style="display:grid; gap:10px;">' + top3.map(function(s, idx){
    return '<div style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 14px; border-radius:12px; background:' + (idx === 0 ? "var(--sand)" : "var(--paper)") + '; border:1px solid ' + (idx === 0 ? "var(--gold)" : "var(--rule)") + ';">' +
      '<div>' +
        '<div class="mono" style="color:' + (idx === 0 ? "var(--gold)" : "var(--graphite)") + ';">' + medals[idx] + '</div>' +
        '<div style="font-weight:700; font-size:1.05rem; margin-top:2px;">' + esc(s.name) + ' <span class="badge badge-ok">' + s.acc + '% (' + s.correct + '/' + s.totalQuestions + ')</span></div>' +
      '</div>' +
      '<div style="text-align:right;">' +
        '<div class="serif" style="font-size:1.65rem; line-height:1;">' + s.score.toLocaleString("es-NI") + ' <small class="mono">pts</small></div>' +
        '<div class="mono" style="color:var(--graphite);">⚡ ' + s.avgSec + ' s · 🔥 x' + s.maxStreak + ' · ' + s.lp + ' LP</div>' +
      '</div>' +
    '</div>';
  }).join("") + '</div>';
}

function renderLiveFeed(){
  $("#liveCountBadge").textContent = STATE.liveFeed.length + " eventos";
  if(!STATE.liveFeed.length){
    $("#liveFeedContainer").innerHTML = '<div style="color:var(--graphite); padding:14px 0;">Esperando eventos en vivo desde la sala...</div>';
    return;
  }
  $("#liveFeedContainer").innerHTML = STATE.liveFeed.map(function(item){
    return '<div class="feed-item">' +
      '<span><strong style="color:' + (item.ok ? "var(--teal)" : "var(--red)") + ';">' + (item.ok ? "✦" : "✕") + '</strong> ' + esc(item.txt) + '</span>' +
      '<span class="mono" style="color:var(--graphite); white-space:nowrap;">' + esc(item.ts) + '</span>' +
    '</div>';
  }).join("");
}

function renderCategoryAnalytics(){
  var qStats = computeQuestionStats();
  var catBuckets = {};
  qStats.forEach(function(qs){
    var catKey = qs.item.c || "guerra";
    if(!catBuckets[catKey]) catBuckets[catKey] = { hits: 0, attempts: 0, ms: 0, count: 0 };
    catBuckets[catKey].hits += qs.hits;
    catBuckets[catKey].attempts += qs.attempts;
    catBuckets[catKey].ms += qs.avgSec * qs.attempts;
    catBuckets[catKey].count++;
  });

  var rows = Object.keys(catBuckets).map(function(k){
    var b = catBuckets[k];
    var pct = b.attempts ? Math.round((b.hits / b.attempts) * 100) : 0;
    var sec = b.attempts ? +(b.ms / b.attempts).toFixed(1) : 0;
    var meta = CAT_META[k] || { name: k, color: "#B8902E" };
    return { key: k, name: meta.name, color: meta.color, pct: pct, sec: sec, count: b.count };
  }).sort(function(a,b){ return b.pct - a.pct; });

  $("#categoryChartBox").innerHTML = rows.map(function(r){
    return '<div class="bar-row">' +
      '<span style="font-weight:600; font-size:0.84rem;">' + esc(r.name) + ' <small class="mono" style="color:var(--graphite)">(' + r.count + ')</small></span>' +
      '<div class="bar-track"><div class="bar-fill" style="width:' + r.pct + '%; background:' + r.color + ';"></div></div>' +
      '<span class="mono" style="min-width:88px; text-align:right;"><strong>' + r.pct + '%</strong> · ' + r.sec + 's</span>' +
    '</div>';
  }).join("");
}

function renderScatterPlot(){
  var subs = STATE.submissions;
  if(!subs.length){
    $("#scatterChartBox").innerHTML = '<p style="color:var(--graphite);">Sin datos para graficar dispersión.</p>';
    return;
  }
  /* SVG Scatter Plot: X = avgSec (1s a 12s), Y = acc (0% a 100%) */
  var W = 500, H = 220, padL = 40, padR = 20, padT = 18, padB = 30;
  var plotW = W - padL - padR, plotH = H - padT - padB;

  var dots = subs.map(function(s){
    var xVal = clamp(s.avgSec, 1, 12);
    var yVal = clamp(s.acc, 0, 100);
    var cx = padL + ((xVal - 1) / 11) * plotW;
    var cy = padT + (1 - yVal / 100) * plotH;
    var col = (yVal >= 70 && xVal <= 5.5) ? "#0E7C6B" : (yVal >= 70 ? "#1E3A8A" : (xVal <= 5.5 ? "#C2410C" : "#B42318"));
    return '<g>' +
      '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="6" fill="' + col + '" opacity="0.88"><title>' + esc(s.name) + ': ' + s.acc + '% en ' + s.avgSec + 's</title></circle>' +
      '<text x="' + (cx + 8).toFixed(1) + '" y="' + (cy + 3).toFixed(1) + '" font-family="JetBrains Mono, monospace" font-size="9.5" fill="currentColor">' + esc(s.name.split(" ")[0]) + '</text>' +
    '</g>';
  }).join("");

  var midX = padL + ((5.5 - 1) / 11) * plotW;
  var midY = padT + (1 - 0.70) * plotH;

  $("#scatterChartBox").innerHTML =
    '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%; height:auto; display:block; overflow:visible;">' +
      '<rect x="' + padL + '" y="' + padT + '" width="' + plotW + '" height="' + plotH + '" fill="var(--paper)" stroke="var(--rule)" rx="6"/>' +
      '<line x1="' + midX.toFixed(1) + '" y1="' + padT + '" x2="' + midX.toFixed(1) + '" y2="' + (padT + plotH) + '" stroke="var(--rule)" stroke-dasharray="4 4"/>' +
      '<line x1="' + padL + '" y1="' + midY.toFixed(1) + '" x2="' + (padL + plotW) + '" y2="' + midY.toFixed(1) + '" stroke="var(--rule)" stroke-dasharray="4 4"/>' +
      '<text x="' + (padL + 6) + '" y="' + (padT + 14) + '" font-family="JetBrains Mono" font-size="8.5" fill="#0E7C6B">✦ Francotiradores (rápidos y precisos)</text>' +
      '<text x="' + (midX + 6).toFixed(1) + '" y="' + (padT + 14) + '" font-family="JetBrains Mono" font-size="8.5" fill="#1E3A8A">Estrategas (seguros)</text>' +
      '<text x="' + (padL + 6) + '" y="' + (padT + plotH - 6) + '" font-family="JetBrains Mono" font-size="8.5" fill="#C2410C">Kamikazes (impulsivos)</text>' +
      '<text x="' + (midX + 6).toFixed(1) + '" y="' + (padT + plotH - 6) + '" font-family="JetBrains Mono" font-size="8.5" fill="#B42318">En la Bruma</text>' +
      '<text x="' + (padL - 6) + '" y="' + (padT + 8) + '" text-anchor="end" font-family="JetBrains Mono" font-size="9" fill="var(--graphite)">100%</text>' +
      '<text x="' + (padL - 6) + '" y="' + midY.toFixed(1) + '" text-anchor="end" font-family="JetBrains Mono" font-size="9" fill="var(--graphite)">70%</text>' +
      '<text x="' + (padL - 6) + '" y="' + (padT + plotH) + '" text-anchor="end" font-family="JetBrains Mono" font-size="9" fill="var(--graphite)">0%</text>' +
      '<text x="' + padL + '" y="' + (H - 6) + '" font-family="JetBrains Mono" font-size="9" fill="var(--graphite)">1.0s (Rápido)</text>' +
      '<text x="' + (padL + plotW) + '" y="' + (H - 6) + '" text-anchor="end" font-family="JetBrains Mono" font-size="9" fill="var(--graphite)">12.0s (Lento)</text>' +
      dots +
    '</svg>';
}

function renderScoreHistogram(){
  var subs = STATE.submissions;
  var bins = [
    { label: "0 – 6k", min: 0, max: 6000, count: 0 },
    { label: "6k – 9k", min: 6000, max: 9000, count: 0 },
    { label: "9k – 12k", min: 9000, max: 12000, count: 0 },
    { label: "12k – 15k", min: 12000, max: 15000, count: 0 },
    { label: "15k+", min: 15000, max: 999999, count: 0 }
  ];
  subs.forEach(function(s){
    for(var i = 0; i < bins.length; i++){
      if(s.score >= bins[i].min && s.score < bins[i].max){
        bins[i].count++;
        break;
      }
    }
  });
  var maxC = Math.max(1, Math.max.apply(null, bins.map(function(b){ return b.count; })));

  var scores = subs.map(function(s){ return s.score; }).sort(function(a,b){ return a - b; });
  var median = scores.length ? scores[Math.floor(scores.length / 2)] : 0;
  $("#statsDispersionTxt").textContent = "mediana: " + median.toLocaleString("es-NI") + " pts · n = " + subs.length;

  $("#scoreDistChartBox").innerHTML =
    '<div style="display:flex; align-items:flex-end; gap:12px; height:165px; padding-top:16px; border-bottom:2px solid var(--ink);">' +
    bins.map(function(b){
      var hPct = b.count ? Math.max(10, Math.round((b.count / maxC) * 100)) : 0;
      return '<div style="flex:1; display:flex; flex-direction:column; align-items:center; height:100%; justify-content:flex-end; gap:6px;">' +
        '<span class="mono" style="font-weight:700;">' + b.count + '</span>' +
        '<div style="width:72%; max-width:52px; height:' + hPct + '%; background:var(--ability); border-radius:8px 8px 0 0; transition:height 350ms;"></div>' +
      '</div>';
    }).join("") +
    '</div>' +
    '<div style="display:flex; gap:12px; margin-top:8px;">' +
    bins.map(function(b){
      return '<div class="mono" style="flex:1; text-align:center; color:var(--graphite); font-size:0.68rem;">' + b.label + '</div>';
    }).join("") +
    '</div>';
}

function renderExtremeQuestions(){
  var qStats = computeQuestionStats().filter(function(q){ return q.attempts > 0; });
  if(!qStats.length){
    $("#extremeQuestionsBox").innerHTML = '<p style="color:var(--graphite);">Juega o simula partidas para ver el diagnóstico de preguntas.</p>';
    return;
  }
  var hardest3 = qStats.slice().sort(function(a,b){ return a.acc - b.acc; }).slice(0, 3);
  var easiest3 = qStats.slice().sort(function(a,b){ return b.acc - a.acc; }).slice(0, 3);

  function rowHtml(qs, isHard){
    return '<div style="display:flex; justify-content:space-between; align-items:center; gap:10px; padding:7px 10px; border-radius:8px; background:var(--paper); border:1px solid var(--rule); font-size:0.83rem;">' +
      '<span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;"><strong>' + qs.item.uid + '.</strong> ' + esc(qs.item.q) + '</span>' +
      '<span class="badge ' + (isHard ? "badge-bad" : "badge-ok") + '">' + qs.acc + '% · ' + qs.avgSec + 's</span>' +
    '</div>';
  }

  $("#extremeQuestionsBox").innerHTML =
    '<div class="mono" style="color:var(--red); margin-bottom:6px;">▼ las 3 con más fallos (trampas mortales)</div>' +
    '<div style="display:grid; gap:6px; margin-bottom:12px;">' + hardest3.map(function(q){ return rowHtml(q, true); }).join("") + '</div>' +
    '<div class="mono" style="color:var(--teal); margin-bottom:6px;">▲ las 3 más acertadas por tus amigos</div>' +
    '<div style="display:grid; gap:6px;">' + easiest3.map(function(q){ return rowHtml(q, false); }).join("") + '</div>';
}

function renderLeaderboardTable(){
  var query = ($("#leaderSearchInput").value || "").trim().toLowerCase();
  var modeFilter = $("#leaderFilterMode").value;
  var sortBy = $("#leaderSortBy").value;

  var list = STATE.submissions.filter(function(s){
    if(modeFilter !== "all" && s.mode !== modeFilter) return false;
    if(query && s.name.toLowerCase().indexOf(query) < 0) return false;
    return true;
  });

  list.sort(function(a, b){
    if(sortBy === "acc") return b.acc - a.acc || b.score - a.score;
    if(sortBy === "time") return a.avgSec - b.avgSec;
    if(sortBy === "streak") return b.maxStreak - a.maxStreak;
    if(sortBy === "lp") return b.lp - a.lp;
    if(sortBy === "recent") return (b.ts || 0) - (a.ts || 0);
    return b.score - a.score;
  });

  if(!list.length){
    $("#leaderboardTbody").innerHTML = '<tr><td colspan="11" style="text-align:center; padding:24px; color:var(--graphite);">No hay jugadores que coincidan con el filtro.</td></tr>';
    return;
  }

  $("#leaderboardTbody").innerHTML = list.map(function(s, idx){
    var modeLabel = s.mode === "quiz" ? "Quiz (15)" : (s.mode === "verdades" ? "2 Verdades (6)" : "Completo (21)");
    var accBadge = s.acc >= 75 ? "badge-ok" : (s.acc >= 50 ? "badge-warn" : "badge-bad");
    return '<tr>' +
      '<td class="mono"><strong>' + (idx + 1) + '</strong></td>' +
      '<td><strong>' + esc(s.name) + '</strong> ' + (s.isSim ? '<span class="badge" style="font-size:0.62rem;">demo</span>' : '<span class="badge badge-pink" style="font-size:0.62rem;">real</span>') + '</td>' +
      '<td class="mono">' + modeLabel + '</td>' +
      '<td><strong class="serif" style="font-size:1.35rem;">' + s.score.toLocaleString("es-NI") + '</strong></td>' +
      '<td class="mono">' + s.correct + ' / ' + s.totalQuestions + '</td>' +
      '<td><span class="badge ' + accBadge + '">' + s.acc + '%</span></td>' +
      '<td class="mono">' + s.avgSec + ' s</td>' +
      '<td class="mono">🔥 x' + s.maxStreak + '</td>' +
      '<td class="mono">' + s.lp + ' LP</td>' +
      '<td><span class="badge">' + esc(s.rank) + '</span></td>' +
      '<td>' +
        '<div class="toolbar" style="gap:6px;">' +
          '<button class="btn btn-sm btn-quiet" type="button" data-inspect="' + esc(s.id) + '">Ver 21 respuestas</button>' +
          '<button class="btn btn-sm btn-quiet" type="button" data-delsub="' + esc(s.id) + '" aria-label="Eliminar">✕</button>' +
        '</div>' +
      '</td>' +
    '</tr>';
  }).join("");
}

function renderQuestionBreakdownView(){
  var catFilter = $("#qAnalysisFilterCat").value;
  var sortMode = $("#qAnalysisSort").value;
  var list = computeQuestionStats().filter(function(qs){
    if(catFilter === "all") return true;
    if(catFilter === "quiz") return qs.item.type === "quiz";
    if(catFilter === "mentira") return qs.item.type === "verdades";
    return qs.item.c === catFilter;
  });

  if(sortMode === "hard") list.sort(function(a,b){ return a.acc - b.acc; });
  else if(sortMode === "easy") list.sort(function(a,b){ return b.acc - a.acc; });
  else if(sortMode === "slow") list.sort(function(a,b){ return b.avgSec - a.avgSec; });

  var shapes = ["▲ A", "◆ B", "● C", "■ D"];

  $("#questionBreakdownList").innerHTML = list.map(function(qs){
    var it = qs.item;
    var meta = CAT_META[it.c] || { name: it.c, color: "#B8902E" };
    var accBadge = qs.acc >= 75 ? "badge-ok" : (qs.acc >= 50 ? "badge-warn" : "badge-bad");

    /* Encontrar cuál opción incorrecta tuvo más votos (la trampa principal) */
    var maxWrongCount = 0;
    qs.optCounts.forEach(function(cnt, oi){
      if(oi !== it.a && cnt > maxWrongCount) maxWrongCount = cnt;
    });

    var optsHtml = it.o.map(function(optText, oi){
      var cnt = qs.optCounts[oi] || 0;
      var pct = qs.attempts ? Math.round((cnt / qs.attempts) * 100) : 0;
      var isCorr = oi === it.a;
      var isTrap = !isCorr && cnt > 0 && cnt === maxWrongCount;
      var voters = qs.optVoters[oi] || [];
      return '<div class="opt-stat-box ' + (isCorr ? "correct" : (isTrap ? "trap" : "")) + '">' +
        '<div style="display:flex; justify-content:space-between; align-items:center; gap:6px; margin-bottom:6px;">' +
          '<span class="mono" style="font-weight:700;">' + shapes[oi] + ' ' + (isCorr ? '<span class="badge badge-ok">✦ correcta</span>' : (isTrap ? '<span class="badge badge-bad">trampa común</span>' : '')) + '</span>' +
          '<span class="mono"><strong>' + pct + '%</strong> (' + cnt + ')</span>' +
        '</div>' +
        '<div style="font-weight:600; font-size:0.88rem; margin-bottom:8px;">' + esc(optText) + '</div>' +
        '<div class="bar-track" style="height:7px;"><div class="bar-fill" style="width:' + pct + '%; background:' + (isCorr ? "var(--teal)" : (isTrap ? "var(--red)" : "var(--graphite)")) + ';"></div></div>' +
        (voters.length ? '<div class="mono" style="font-size:0.68rem; color:var(--graphite); margin-top:6px;">Votaron: ' + esc(voters.join(", ")) + '</div>' : '') +
      '</div>';
    }).join("");

    return '<div class="panel">' +
      '<div class="panel-head" style="margin-bottom:10px;">' +
        '<div>' +
          '<span class="badge" style="border-color:' + meta.color + ';">' + esc(it.uid) + ' · ' + esc(meta.name) + '</span> ' +
          '<strong style="font-size:1.05rem; margin-left:6px;">' + esc(it.q) + '</strong>' +
        '</div>' +
        '<div class="toolbar">' +
          '<span class="badge ' + accBadge + '">Acierto: ' + qs.acc + '% (' + qs.hits + '/' + qs.attempts + ')</span>' +
          '<span class="badge">⏱ Promedio: ' + qs.avgSec + ' s</span>' +
        '</div>' +
      '</div>' +
      '<div class="dist-grid">' + optsHtml + '</div>' +
    '</div>';
  }).join("");
}

function renderAllAdminViews(){
  renderAdminKpis();
  renderPodium();
  renderLiveFeed();
  renderCategoryAnalytics();
  renderScatterPlot();
  renderScoreHistogram();
  renderExtremeQuestions();
  renderLeaderboardTable();
  renderQuestionBreakdownView();
}

/* =========================================================================
   MODO JUGADOR KAHOOT (INTERACTIVO PARA AMIGOS)
   ========================================================================= */
var PL_GAME = {
  active: false,
  waitingForHost: false,
  name: "",
  mode: "full",
  secLimit: 15,
  deck: [],
  idx: 0,
  score: 0,
  lp: 8000,
  streak: 0,
  maxStreak: 0,
  correct: 0,
  answers: [],
  qStartMs: 0,
  timerIv: null,
  answeredCurrent: false
};

function showPlayerWaiting(message){
  $("#playerLobbyCard").hidden = true;
  $("#playerResultCard").hidden = true;
  $("#playerActiveStage").hidden = false;
  $("#plFeedbackBox").hidden = false;
  $("#plFeedbackTitle").textContent = "⌛ Esperando a James";
  $("#plFeedbackSub").textContent = message || "James iniciará la siguiente carta desde su panel.";
  $("#btnNextPlayerQuestion").hidden = true;
  $("#plQuestionText").textContent = "La partida comenzará en breve";
  $("#plCatBadge").textContent = "sala " + STATE.roomPin;
  $("#plOptionsGrid").innerHTML = "";
  $("#plTimeBarFill").style.width = "100%";
  $("#plTimeLeftTxt").textContent = "en espera";
}

function startPlayerRound(round){
  if(!PL_GAME.active || !round) return;
  PL_GAME.mode = round.mode || PL_GAME.mode;
  PL_GAME.secLimit = +round.limitSec || PL_GAME.secLimit;
  PL_GAME.deck = getCombinedDeck(PL_GAME.mode);
  PL_GAME.idx = Math.max(0, Math.min(+round.idx || 0, PL_GAME.deck.length - 1));
  PL_GAME.waitingForHost = false;
  $("#btnNextPlayerQuestion").hidden = false;
  renderPlayerCurrentCard(+round.startedAt || Date.now());
}

function renderQuickFriendChips(){
  var confirmedNames = STATE.guests.filter(function(g){
    return g.n.indexOf("Yo ") !== 0;
  }).map(function(g){ return g.n; });

  $("#plQuickFriendsChips").innerHTML = confirmedNames.map(function(name){
    return '<button type="button" class="friend-chip" data-pickfriend="' + esc(name) + '">' + esc(name) + '</button>';
  }).join("");
}

function startPlayerKahoot(){
  var name = ($("#plNameInput").value || "").trim();
  if(!name){
    toast("Escribe tu nombre o toca tu chip de invitado para empezar.");
    $("#plNameInput").focus();
    return;
  }
  var pin = ($("#plPinInput").value || "1926").trim();
  if(pin !== STATE.roomPin){
    STATE.roomPin = pin;
    saveState();
    connectLiveRoom();
  }

  PL_GAME.name = name;
  PL_GAME.mode = $("#plModeSelect").value || "full";
  PL_GAME.secLimit = +($("#plTimerSelect").value || 15);
  PL_GAME.deck = getCombinedDeck(PL_GAME.mode);
  PL_GAME.idx = 0;
  PL_GAME.score = 0;
  PL_GAME.lp = 8000;
  PL_GAME.streak = 0;
  PL_GAME.maxStreak = 0;
  PL_GAME.correct = 0;
  PL_GAME.answers = [];
  PL_GAME.active = true;
  PL_GAME.waitingForHost = true;
  broadcastPacket({
    kind: "player_join",
    player: PL_GAME.name,
    mode: PL_GAME.mode
  });
  showPlayerWaiting("Ya estás dentro de la sala. James controlará el inicio y cada pregunta.");
}

function renderPlayerCurrentCard(startedAt){
  clearInterval(PL_GAME.timerIv);
  PL_GAME.answeredCurrent = false;
  $("#plFeedbackBox").hidden = true;

  var item = PL_GAME.deck[PL_GAME.idx];
  var meta = CAT_META[item.c] || { name: item.c };

  $("#plHudRound").textContent = (PL_GAME.idx + 1) + " / " + PL_GAME.deck.length;
  $("#plHudPlayerName").textContent = PL_GAME.name;
  $("#plHudStreak").textContent = "🔥 racha x" + PL_GAME.streak;
  $("#plHudLp").textContent = PL_GAME.lp;
  $("#plHudScore").textContent = PL_GAME.score.toLocaleString("es-NI");
  $("#plTypeHint").textContent = item.hint;
  $("#plCatBadge").textContent = item.uid + " · " + meta.name;
  $("#plQuestionText").textContent = item.q;

  var grid = $("#plOptionsGrid");
  grid.className = "duel-cards-grid" + (item.o.length === 3 ? " three-cols" : "");
  var symbols = ["▲", "◆", "●", "■"];

  grid.innerHTML = item.o.map(function(optText, oi){
    return '<button type="button" class="duel-card" data-plopt="' + oi + '">' +
      '<span class="duel-shape shape-' + oi + '">' + symbols[oi] + '</span>' +
      '<span class="duel-card-text">' + esc(optText) + '</span>' +
    '</button>';
  }).join("");

  PL_GAME.qStartMs = startedAt || Date.now();
  var limitMs = PL_GAME.secLimit * 1000;
  $("#plTimeBarFill").style.width = "100%";
  $("#plTimeLeftTxt").textContent = PL_GAME.secLimit.toFixed(1) + " s";

  var lastTickSec = PL_GAME.secLimit;
  PL_GAME.timerIv = setInterval(function(){
    var elapsed = Date.now() - PL_GAME.qStartMs;
    var remain = Math.max(0, limitMs - elapsed);
    var pct = (remain / limitMs) * 100;
    $("#plTimeBarFill").style.width = pct.toFixed(1) + "%";
    var secFloat = (remain / 1000).toFixed(1);
    $("#plTimeLeftTxt").textContent = secFloat + " s";

    var ceilSec = Math.ceil(remain / 1000);
    if(ceilSec !== lastTickSec && ceilSec <= 3 && ceilSec > 0){
      lastTickSec = ceilSec;
      sfxTick();
    }
    if(remain <= 0){
      clearInterval(PL_GAME.timerIv);
      submitPlayerChoice(-1);
    }
  }, 80);
}

function submitPlayerChoice(choiceIdx){
  if(PL_GAME.answeredCurrent) return;
  PL_GAME.answeredCurrent = true;
  clearInterval(PL_GAME.timerIv);

  var item = PL_GAME.deck[PL_GAME.idx];
  var elapsedMs = clamp(Date.now() - PL_GAME.qStartMs, 250, PL_GAME.secLimit * 1000);
  var isCorrect = choiceIdx === item.a;
  var pts = 0;

  if(isCorrect){
    PL_GAME.correct++;
    PL_GAME.streak++;
    if(PL_GAME.streak > PL_GAME.maxStreak) PL_GAME.maxStreak = PL_GAME.streak;
    var speedBonus = Math.round(Math.max(0, 1 - (elapsedMs / (PL_GAME.secLimit * 1000))) * 500);
    var streakBonus = Math.min(300, (PL_GAME.streak - 1) * 75);
    pts = 500 + speedBonus + streakBonus;
    PL_GAME.score += pts;
    sfxHit();
  } else {
    PL_GAME.streak = 0;
    PL_GAME.lp = Math.max(0, PL_GAME.lp - 1000);
    sfxMiss();
  }

  PL_GAME.answers.push({
    uid: item.uid,
    choice: choiceIdx,
    correct: isCorrect,
    ms: elapsedMs,
    pts: pts
  });

  /* Iluminar cartas */
  $$("#plOptionsGrid .duel-card").forEach(function(btn, oi){
    btn.disabled = true;
    if(oi === choiceIdx) btn.classList.add("picked");
    if(oi === item.a){
      btn.classList.add("correct-reveal");
    } else if(oi === choiceIdx){
      btn.classList.add("wrong-picked");
    } else {
      btn.classList.add("wrong-reveal");
    }
  });

  $("#plHudStreak").textContent = "🔥 racha x" + PL_GAME.streak;
  $("#plHudLp").textContent = PL_GAME.lp;
  $("#plHudScore").textContent = PL_GAME.score.toLocaleString("es-NI");

  var fbBox = $("#plFeedbackBox");
  fbBox.hidden = false;
  if(isCorrect){
    $("#plFeedbackTitle").textContent = "✦ ¡Impacto directo! +" + pts + " pts";
    $("#plFeedbackSub").textContent = "Respondiste en " + (elapsedMs / 1000).toFixed(2) + " s · Racha activa x" + PL_GAME.streak;
  } else if(choiceIdx === -1){
    $("#plFeedbackTitle").textContent = "⏱ Tiempo agotado · -1000 LP";
    $("#plFeedbackSub").textContent = "La respuesta correcta era: " + item.o[item.a];
  } else {
    $("#plFeedbackTitle").textContent = "✕ Diagnóstico erróneo · -1000 LP";
    $("#plFeedbackSub").textContent = "La correcta era: " + item.o[item.a];
  }

  $("#btnNextPlayerQuestion").textContent = (PL_GAME.idx + 1 < PL_GAME.deck.length)
    ? "Siguiente Carta (" + (PL_GAME.idx + 2) + "/" + PL_GAME.deck.length + ") →"
    : "✦ Ver Podio y Enviar Resultados";
  $("#btnNextPlayerQuestion").hidden = true;

  /* Emitir telemetría en vivo paso a paso */
  broadcastPacket({
    kind: "answer_step",
    player: PL_GAME.name,
    roundIdx: PL_GAME.idx,
    uid: item.uid,
    choice: choiceIdx,
    choiceText: choiceIdx >= 0 ? item.o[choiceIdx] : "sin respuesta",
    correct: isCorrect,
    ms: elapsedMs,
    pts: pts
  });
}

function finishPlayerGame(){
  PL_GAME.active = false;
  $("#playerActiveStage").hidden = true;
  $("#playerResultCard").hidden = false;

  var totalQ = PL_GAME.deck.length;
  var totalMs = PL_GAME.answers.reduce(function(a, x){ return a + x.ms; }, 0);
  var avgSec = totalQ ? +(totalMs / totalQ / 1000).toFixed(2) : 0;
  var accPct = totalQ ? Math.round((PL_GAME.correct / totalQ) * 100) : 0;
  var rank = getRankTitle(accPct, avgSec);

  var sub = {
    id: "pl_" + PL_GAME.name.toLowerCase().replace(/[^a-z0-9]/g, "") + "_" + Date.now().toString(36),
    name: PL_GAME.name,
    mode: PL_GAME.mode,
    totalQuestions: totalQ,
    correct: PL_GAME.correct,
    acc: accPct,
    score: PL_GAME.score,
    avgSec: avgSec,
    maxStreak: PL_GAME.maxStreak,
    lp: PL_GAME.lp,
    rank: rank,
    isSim: false,
    ts: Date.now(),
    answers: PL_GAME.answers
  };

  /* Guardar localmente y transmitir en vivo al Admin */
  upsertSubmission(sub, false);
  broadcastPacket({ kind: "submission", submission: sub });

  var codeToken = encodeSubmissionToken(sub);
  $("#plResultCodeOutput").value = codeToken;
  $("#plResHeadline").textContent = sub.name + ": " + sub.score.toLocaleString("es-NI") + " puntos";
  $("#plResRankBadge").textContent = rank;

  $("#plResKpis").innerHTML = [
    { t: "puntaje total", v: sub.score.toLocaleString("es-NI") + " pts" },
    { t: "precisión", v: sub.acc + "% (" + sub.correct + "/" + sub.totalQuestions + ")" },
    { t: "velocidad media", v: sub.avgSec + " s" },
    { t: "racha máx. / lp", v: "🔥 x" + sub.maxStreak + " · " + sub.lp + " LP" }
  ].map(function(k){
    return '<div class="cifra-cell"><span class="cifra-tag">' + k.t + '</span><b class="cifra-num" style="font-size:1.75rem;">' + k.v + '</b></div>';
  }).join("");

  $("#plPersonalBreakdownList").innerHTML = '<div style="display:grid; gap:8px;">' + PL_GAME.deck.map(function(item, i){
    var ans = PL_GAME.answers[i] || { choice: -1, correct: false, ms: 0, pts: 0 };
    var pickedTxt = ans.choice >= 0 ? item.o[ans.choice] : "Sin responder";
    return '<div style="display:flex; justify-content:space-between; align-items:center; gap:10px; padding:10px 12px; border-radius:10px; background:var(--paper); border:1px solid var(--rule); font-size:0.86rem;">' +
      '<div>' +
        '<div><strong>' + item.uid + '. ' + esc(item.q) + '</strong></div>' +
        '<div style="color:var(--graphite); margin-top:2px;">Tu elección: <strong>' + esc(pickedTxt) + '</strong> ' + (!ans.correct ? '· Correcta: <em>' + esc(item.o[item.a]) + '</em>' : '') + '</div>' +
      '</div>' +
      '<span class="badge ' + (ans.correct ? "badge-ok" : "badge-bad") + '">' + (ans.correct ? ("+" + ans.pts + " pts") : "0 pts") + ' · ' + (ans.ms / 1000).toFixed(1) + 's</span>' +
    '</div>';
  }).join("") + '</div>';
}

/* =========================================================================
   MODO SHOW EN VIVO (PANTALLA DEL ANFITRIÓN)
   ========================================================================= */
var HOST_SHOW = {
  deckMode: "all",
  idx: 0,
  revealed: false,
  standing: 32,
  timerIv: null
};

function renderHostStage(){
  clearInterval(HOST_SHOW.timerIv);
  var deck = getCombinedDeck(HOST_SHOW.deckMode);
  if(!deck.length) return;
  if(HOST_SHOW.idx >= deck.length) HOST_SHOW.idx = 0;
  if(HOST_SHOW.idx < 0) HOST_SHOW.idx = deck.length - 1;

  var item = deck[HOST_SHOW.idx];
  var meta = CAT_META[item.c] || { name: item.c };
  var qStats = computeQuestionStats().filter(function(x){ return x.item.uid === item.uid; })[0];

  $("#hostRoundBadge").textContent = "Carta " + (HOST_SHOW.idx + 1) + " / " + deck.length;
  $("#hostCatBadge").textContent = item.uid + " · " + meta.name;
  $("#hostStandingCount").textContent = HOST_SHOW.standing;
  $("#hostQuestionText").textContent = item.q;
  $("#hostTimerDisplay").textContent = HOST_SHOW.revealed ? "✦ Carta revelada" : "Todos de pie · Muestra 1, 2, 3 o 4 dedos";
  $("#hostAnswerBanner").hidden = !HOST_SHOW.revealed;

  var symbols = ["▲ 1", "◆ 2", "● 3", "■ 4"];
  var grid = $("#hostCardsGrid");
  grid.className = "duel-cards-grid" + (item.o.length === 3 ? " three-cols" : "");

  grid.innerHTML = item.o.map(function(optText, oi){
    var cls = "duel-card";
    if(HOST_SHOW.revealed){
      cls += (oi === item.a) ? " correct-reveal" : " wrong-reveal";
    }
    var voteInfo = "";
    if(HOST_SHOW.revealed && qStats && qStats.attempts > 0){
      var cnt = qStats.optCounts[oi] || 0;
      var pct = Math.round((cnt / qStats.attempts) * 100);
      voteInfo = '<span class="badge ' + (oi === item.a ? "badge-ok" : "") + '">' + pct + '% (' + cnt + ')</span>';
    }
    return '<div class="' + cls + '">' +
      '<span class="duel-shape shape-' + oi + '">' + symbols[oi] + '</span>' +
      '<span class="duel-card-text">' + esc(optText) + '</span>' +
      voteInfo +
    '</div>';
  }).join("");

  if(HOST_SHOW.revealed){
    var numFinger = item.a + 1;
    $("#hostAnswerBanner").textContent = "✦ Respuesta correcta: Opción " + numFinger + " («" + item.o[item.a] + "»). Quien no mostró " + numFinger + (numFinger === 1 ? " dedo" : " dedos") + " pierde 1000 LP y se sienta.";
  }
  $("#hostVotesCounterTxt").textContent = (qStats ? qStats.attempts : 0) + " respuestas registradas en esta carta";
}

function broadcastHostQuestion(){
  broadcastPacket({
    kind: "host_question",
    mode: HOST_SHOW.deckMode,
    idx: HOST_SHOW.idx,
    limitSec: 10,
    startedAt: Date.now()
  });
}

function broadcastHostReveal(){
  broadcastPacket({
    kind: "host_reveal",
    mode: HOST_SHOW.deckMode,
    idx: HOST_SHOW.idx
  });
}

/* =========================================================================
   ORGANIZACIÓN DEL CUMPLEAÑOS (ROCK MUNCHIES, PRESUPUESTO, INVITADOS)
   ========================================================================= */
var RM_MENU = {
  j: { n: "Pizza de jamón", p: { 12: 210, 14: 260, 18: 360 } },
  p: { n: "Pizza de pepperoni", p: { 12: 220, 14: 270, 18: 380 } },
  e: { n: "Pizzas especiales", p: { 12: 320, 14: 440, 18: 560 } }
};

function renderOrgHub(){
  var conf = STATE.guests.filter(function(g){ return g.s === "c"; }).length;
  var pend = STATE.guests.filter(function(g){ return g.s === "p"; }).length;
  var ord = STATE.order;
  var s = ord.size || 14;
  var pzTotal = (ord.q.j * RM_MENU.j.p[s]) + (ord.q.p * RM_MENU.p.p[s]) + (ord.q.e * RM_MENU.e.p[s]);
  var people = conf || 33;
  var drinksQty = Math.round(people * (ord.dq || 1));
  var drinksTotal = drinksQty * (ord.dp || 37.5);
  var rmTotal = pzTotal + drinksTotal;

  /* Sincronizar renglón b1 del presupuesto */
  var totalPizzas = (ord.q.j || 0) + (ord.q.p || 0) + (ord.q.e || 0);
  var b1 = STATE.budget.items.filter(function(i){ return i.id === "b1"; })[0];
  if(b1){
    b1.c = "Comida Rock Munchies (" + totalPizzas + " pizzas " + s + "″ y " + drinksQty + " bebidas)";
    b1.amt = rmTotal;
  }

  var totalSpent = STATE.budget.items.reduce(function(a, i){ return a + (+i.amt || 0); }, 0);
  var leftBud = (STATE.budget.total || 5000) - totalSpent;
  var tasksDone = STATE.tasks.filter(function(t){ return t.done; }).length;

  $("#orgKpisGrid").innerHTML = [
    { tag: "invitados confirmados", num: conf + " / 33", sub: pend + " por confirmar (Gabriel)", pct: (conf / 33) * 100 },
    { tag: "pizzas rock munchies", num: totalPizzas + " (" + s + "″)", sub: (totalPizzas * ord.sl) + " porciones (" + ((totalPizzas * ord.sl) / people).toFixed(1) + "/pers)", pct: 90 },
    { tag: "gasto total estimado", num: "C$ " + totalSpent.toLocaleString("es-NI"), sub: "Meta: C$ " + (STATE.budget.total || 5000).toLocaleString("es-NI"), pct: (totalSpent / 5000) * 100 },
    { tag: leftBud >= 0 ? "saldo disponible" : "exceso sobre meta", num: "C$ " + Math.abs(leftBud).toLocaleString("es-NI"), sub: leftBud >= 0 ? "Dentro del presupuesto" : "Por encima de C$ 5,000", pct: leftBud >= 0 ? 80 : 20 },
    { tag: "costo por invitado", num: "C$ " + Math.round(totalSpent / people), sub: "Entre " + people + " asistentes", pct: 75 },
    { tag: "pendientes listos", num: tasksDone + " / " + STATE.tasks.length, sub: "Hoy 5:00 p. m.", pct: (tasksDone / STATE.tasks.length) * 100 }
  ].map(function(c){
    return '<div class="cifra-cell"><span class="cifra-tag">' + c.tag + '</span><b class="cifra-num">' + c.num + '</b><span class="cifra-sub">' + c.sub + '</span>' + makeMiniHist(c.pct) + '</div>';
  }).join("");

  /* Tabla Rock Munchies */
  $("#rmPizzaSize").value = String(s);
  $("#rmOrderTableBox").innerHTML =
    '<div class="ledger-wrap"><table class="ledger-table">' +
      '<thead><tr><th>concepto</th><th>cantidad</th><th>precio unit.</th><th>subtotal</th></tr></thead>' +
      '<tbody>' +
        ["j", "p", "e"].map(function(k){
          var u = RM_MENU[k].p[s];
          var q = ord.q[k] || 0;
          return '<tr>' +
            '<td><strong>' + RM_MENU[k].n + '</strong></td>' +
            '<td><input class="input" type="number" min="0" max="40" data-rmq="' + k + '" value="' + q + '" style="width:76px; height:32px;"></td>' +
            '<td class="mono">C$ ' + u + '</td>' +
            '<td class="mono"><strong>C$ ' + (q * u).toLocaleString("es-NI") + '</strong></td>' +
          '</tr>';
        }).join("") +
        '<tr>' +
          '<td><strong>Bebidas (' + drinksQty + ' uds)</strong> <small class="mono" style="color:var(--graphite)">(C$35–40)</small></td>' +
          '<td><input class="input" type="number" min="0" step="0.5" data-rmdrink="dq" value="' + ord.dq + '" style="width:76px; height:32px;" title="Bebidas por persona"></td>' +
          '<td class="mono">C$ ' + ord.dp + '</td>' +
          '<td class="mono"><strong>C$ ' + drinksTotal.toLocaleString("es-NI") + '</strong></td>' +
        '</tr>' +
        '<tr class="total-row">' +
          '<td colspan="3">Total Pedido Rock Munchies</td>' +
          '<td><span class="double-underline">C$ ' + rmTotal.toLocaleString("es-NI") + '</span></td>' +
        '</tr>' +
      '</tbody>' +
    '</table></div>';

  var slices = totalPizzas * (ord.sl || 8);
  $("#rmOrderSummaryBadges").innerHTML =
    '<span class="badge badge-ok">' + totalPizzas + ' pizzas (' + slices + ' porciones)</span>' +
    '<span class="badge">' + (slices / people).toFixed(1) + ' porciones por persona</span>' +
    '<span class="badge">C$ ' + Math.round(rmTotal / people) + ' por persona en comida</span>';

  /* Tabla Presupuesto */
  $("#budBalanceBadge").textContent = leftBud >= 0 ? ("Disponible: C$ " + leftBud.toLocaleString("es-NI")) : ("Te pasas por C$ " + Math.abs(leftBud).toLocaleString("es-NI"));
  $("#budBalanceBadge").className = "badge " + (leftBud >= 0 ? "badge-ok" : "badge-bad");

  $("#budgetTbody").innerHTML = STATE.budget.items.map(function(it){
    return '<tr>' +
      '<td>' + esc(it.c) + '</td>' +
      '<td class="mono">' + esc(it.cat) + '</td>' +
      '<td class="mono"><input class="input" type="number" min="0" step="any" data-budamt="' + it.id + '" value="' + it.amt + '" style="width:105px; height:30px;"></td>' +
      '<td><input type="checkbox" data-budpaid="' + it.id + '"' + (it.paid ? " checked" : "") + '></td>' +
      '<td>' + (it.id !== "b1" ? '<button class="btn btn-sm btn-quiet" type="button" data-delbud="' + it.id + '">✕</button>' : '') + '</td>' +
    '</tr>';
  }).join("") +
  '<tr class="total-row"><td colspan="2">Total Presupuesto</td><td colspan="3"><span class="double-underline">C$ ' + totalSpent.toLocaleString("es-NI") + '</span></td></tr>';

  /* Tabla Invitados */
  var gf = $("#guestFilterSelect").value;
  var filteredGuests = STATE.guests.filter(function(g){
    if(gf === "i") return g.k === "i";
    if(gf !== "all") return g.s === gf;
    return true;
  });
  $("#guestsTbody").innerHTML = filteredGuests.map(function(g){
    return '<tr>' +
      '<td><strong>' + esc(g.n) + '</strong> ' + (g.k === "i" ? '<span class="badge badge-gold">infaltable</span>' : '') + '</td>' +
      '<td>' +
        '<select class="select" data-guestst="' + g.id + '" style="height:30px; width:125px;">' +
          '<option value="c"' + (g.s === "c" ? " selected" : "") + '>Confirmado</option>' +
          '<option value="p"' + (g.s === "p" ? " selected" : "") + '>Pendiente</option>' +
          '<option value="x"' + (g.s === "x" ? " selected" : "") + '>No va</option>' +
        '</select>' +
      '</td>' +
      '<td><input class="input" type="text" data-guestnote="' + g.id + '" value="' + esc(g.note || "") + '" placeholder="Nota..." style="height:30px;"></td>' +
      '<td><button class="btn btn-sm btn-quiet" type="button" data-delguest="' + g.id + '">✕</button></td>' +
    '</tr>';
  }).join("");

  /* Agenda / Programa */
  var curMin = 17 * 60;
  $("#agendaTbody").innerHTML = STATE.agenda.map(function(ag, idx){
    var h = Math.floor(curMin / 60), m = curMin % 60;
    var timeStr = ((h % 12) || 12) + ":" + (m < 10 ? "0" + m : m) + " p. m.";
    curMin += (+ag.min || 15);
    return '<tr>' +
      '<td class="mono">' + (idx + 1) + '.</td>' +
      '<td class="mono"><strong>' + timeStr + '</strong></td>' +
      '<td>' + esc(ag.t) + '</td>' +
      '<td class="mono">' + ag.min + ' min</td>' +
    '</tr>';
  }).join("");

  /* Checklist Tareas */
  $("#tasksChecklistBox").innerHTML = '<div style="display:grid; gap:8px;">' + STATE.tasks.map(function(t){
    return '<label style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:8px 12px; border-radius:10px; background:var(--paper); border:1px solid var(--rule); cursor:pointer;">' +
      '<span style="display:flex; align-items:center; gap:8px; ' + (t.done ? "text-decoration:line-through; opacity:0.6;" : "") + '">' +
        '<input type="checkbox" data-taskchk="' + t.id + '"' + (t.done ? " checked" : "") + '> ' + esc(t.t) +
      '</span>' +
      '<span class="badge ' + (t.done ? "badge-ok" : "badge-warn") + '">' + (t.done ? "hecha" : t.d) + '</span>' +
    '</label>';
  }).join("") + '</div>';
}

/* =========================================================================
   EDITOR DE RETOS (QUIZ + DOS VERDADES)
   ========================================================================= */
function renderChallengesEditor(){
  $("#cfgRoomPin").value = STATE.roomPin || "1926";
  $("#cfgPrize1Desc").value = STATE.prizes.q.d || "";
  $("#cfgPrize2Desc").value = STATE.prizes.v.d || "";

  $("#editorQuizList").innerHTML = STATE.quiz.map(function(q, qi){
    return '<div style="padding:12px; border-radius:12px; background:var(--paper); border:1px solid var(--rule); margin-bottom:10px;">' +
      '<div style="display:flex; justify-content:space-between; gap:8px; margin-bottom:8px;">' +
        '<span class="mono"><strong>Q' + (qi + 1) + '</strong></span>' +
        '<button class="btn btn-sm btn-quiet" type="button" data-delquiz="' + qi + '">Borrar</button>' +
      '</div>' +
      '<input class="input" type="text" data-editq="' + qi + '" value="' + esc(q.q) + '" style="margin-bottom:8px; height:34px;">' +
      '<div class="grid-2" style="gap:6px; margin-bottom:8px;">' +
        q.o.map(function(opt, oi){
          return '<input class="input" type="text" data-edito="' + qi + '-' + oi + '" value="' + esc(opt) + '" style="height:32px; font-size:0.82rem;">';
        }).join("") +
      '</div>' +
      '<div class="toolbar">' +
        '<span class="mono">Correcta:</span>' +
        '<select class="select" data-edita="' + qi + '" style="width:130px; height:30px;">' +
          [0,1,2,3].map(function(oi){ return '<option value="' + oi + '"' + (q.a === oi ? " selected" : "") + '>Opción ' + (oi + 1) + '</option>'; }).join("") +
        '</select>' +
      '</div>' +
    '</div>';
  }).join("");

  $("#editorVerdadesList").innerHTML = STATE.verdades.map(function(v, vi){
    return '<div style="padding:12px; border-radius:12px; background:var(--paper); border:1px solid var(--rule); margin-bottom:10px;">' +
      '<div style="display:flex; justify-content:space-between; gap:8px; margin-bottom:8px;">' +
        '<span class="mono"><strong>Ronda V' + (vi + 1) + '</strong></span>' +
        '<button class="btn btn-sm btn-quiet" type="button" data-delverd="' + vi + '">Borrar</button>' +
      '</div>' +
      '<div style="display:grid; gap:6px; margin-bottom:8px;">' +
        v.s.map(function(st, si){
          return '<input class="input" type="text" data-editvs="' + vi + '-' + si + '" value="' + esc(st) + '" style="height:32px; font-size:0.82rem;">';
        }).join("") +
      '</div>' +
      '<div class="toolbar">' +
        '<span class="mono">La mentira es:</span>' +
        '<select class="select" data-editvl="' + vi + '" style="width:140px; height:30px;">' +
          [0,1,2].map(function(si){ return '<option value="' + si + '"' + (v.l === si ? " selected" : "") + '>Afirmación ' + (si + 1) + '</option>'; }).join("") +
        '</select>' +
      '</div>' +
    '</div>';
  }).join("");
}

/* =========================================================================
   EXPORTADOR DE ARCHIVO HTML EXCLUSIVO PARA AMIGOS (SOLO JUGADOR)
   ========================================================================= */
function downloadFriendsPlayerHtml(){
  var docClone = document.documentElement.cloneNode(true);
  var configScript =
    "window.__PLAYER_ONLY_MODE__ = true;\n" +
    "window.__PRELOADED_CONFIG__ = " + JSON.stringify({
      roomPin: STATE.roomPin || "1926",
      quiz: STATE.quiz,
      verdades: STATE.verdades,
      guests: STATE.guests
    }) + ";";
  var head = docClone.querySelector("head");
  var cssLink = docClone.querySelector('link[href="css/styles.css"]');
  var appScript = docClone.querySelector('script[src="js/app.js"]');
  if(!cssLink || !appScript){
    toast("No se encontraron los archivos necesarios para crear el HTML de amigos.");
    return;
  }
  toast("Preparando HTML de amigos...");
  Promise.all([
    fetch("css/styles.css").then(function(response){
      if(!response.ok) throw new Error("No se pudo cargar styles.css");
      return response.text();
    }),
    fetch("js/app.js").then(function(response){
      if(!response.ok) throw new Error("No se pudo cargar app.js");
      return response.text();
    })
  ]).then(function(assets){
    var inlineCss = document.createElement("style");
    inlineCss.textContent = assets[0];
    cssLink.parentNode.replaceChild(inlineCss, cssLink);

    var injectScript = document.createElement("script");
    injectScript.textContent = configScript;
    head.insertBefore(injectScript, head.firstChild);

    var inlineApp = document.createElement("script");
    inlineApp.textContent = assets[1];
    appScript.parentNode.replaceChild(inlineApp, appScript);

    var fullHtml = "<!doctype html>\n" + docClone.outerHTML;
    var blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "retos-cumple-amigos.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 2000);
    toast("Descargado: retos-cumple-amigos.html listo para enviar por WhatsApp.");
  }).catch(function(){
    toast("No se pudieron incrustar los estilos y la lógica. Abre el panel desde un servidor web.");
  });
}

/* =========================================================================
   NAVEGACIÓN Y HABILIDADES ESTILO KIRBY (DESIGN.MD)
   ========================================================================= */
var VIEW_ABILITIES = {
  "admin-stats":     { name: "estadística · economía", color: "#1E3A8A", path: "~/cumple/admin-estadisticas" },
  "admin-questions": { name: "diagnóstico · dr. house", color: "#C2410C", path: "~/cumple/analisis-21-cartas" },
  "player-kahoot":   { name: "duelo · yu-gi-oh! d/d/d", color: "#B8902E", path: "~/cumple/jugar-kahoot" },
  "host-stage":      { name: "ajedrez · bobby fischer", color: "#0E7C6B", path: "~/cumple/escenario-en-vivo" },
  "org-hub":         { name: "sistemas · rock munchies", color: "#6D4AE0", path: "~/cumple/organizacion-pizzas" },
  "editor-retos":    { name: "kirby · personalizar",    color: "#EC5C9A", path: "~/cumple/editor-mazo" }
};

function switchView(viewId){
  $$(".view-sec").forEach(function(sec){
    sec.classList.toggle("active", sec.id === "view-" + viewId);
  });
  $$("#mainNavStrip .nav-btn").forEach(function(btn){
    btn.classList.toggle("active", btn.getAttribute("data-view") === viewId);
  });
  var ab = VIEW_ABILITIES[viewId] || VIEW_ABILITIES["admin-stats"];
  document.documentElement.style.setProperty("--ability", ab.color);
  $("#abilityText").textContent = "habilidad: " + ab.name;
  $("#headerSubPath").textContent = ab.path + " · rock munchies · 3 nov 5:00 p. m.";

  if(viewId === "admin-stats" || viewId === "admin-questions") renderAllAdminViews();
  if(viewId === "host-stage") renderHostStage();
  if(viewId === "org-hub") renderOrgHub();
  if(viewId === "editor-retos") renderChallengesEditor();
}

/* =========================================================================
   EVENT LISTENERS Y CONTROLES INTERACTIVOS
   ========================================================================= */
$("#mainNavStrip").addEventListener("click", function(e){
  var btn = e.target.closest(".nav-btn");
  if(btn) switchView(btn.getAttribute("data-view"));
});

$("#btnToggleTheme").addEventListener("click", function(){
  var root = document.documentElement;
  var dark = root.getAttribute("data-theme") === "dark";
  if(dark){
    root.removeAttribute("data-theme");
    this.textContent = "☾ Noche";
  } else {
    root.setAttribute("data-theme", "dark");
    this.textContent = "☀ Papel";
  }
});

$("#btnDownloadFriendsHtml").addEventListener("click", downloadFriendsPlayerHtml);
$("#btnDownloadFriendsHtml2").addEventListener("click", downloadFriendsPlayerHtml);
$("#btnModalDownloadFriends").addEventListener("click", downloadFriendsPlayerHtml);

/* Acciones del Admin */
$("#btnSimMore").addEventListener("click", function(){
  var pool = ["Nidia", "Peña", "Mily", "Hazel", "Marlon", "Guido", "Romano", "Enya", "América", "Luis", "Emmanuel", "Ian", "Derek", "Alexandra", "Brenda", "Nohemi", "Andy", "Cecilia"];
  var existing = STATE.submissions.map(function(s){ return s.name; });
  var available = pool.filter(function(n){ return existing.indexOf(n) < 0; });
  if(!available.length) available = pool;
  var pick = available.slice(0, 5);
  pick.forEach(function(name, i){
    var bias = (Math.random() * 0.36) - 0.14;
    var speed = 2.2 + Math.random() * 3.5;
    var sub = buildSimulatedSubmission(name, bias, speed, STATE.submissions.length + i + 1);
    STATE.submissions.push(sub);
  });
  saveState();
  renderAllAdminViews();
  toast("Se simularon " + pick.length + " amigos adicionales en las estadísticas.");
});

var clearConfirmStep = false;
var clearConfirmTimer = null;
$("#btnClearResults").addEventListener("click", function(){
  var btn = this;
  if(!clearConfirmStep){
    clearConfirmStep = true;
    btn.textContent = "¿Seguro? Toca otra vez para vaciar la sala";
    clearTimeout(clearConfirmTimer);
    clearConfirmTimer = setTimeout(function(){
      clearConfirmStep = false;
      btn.textContent = "🗑️ Limpiar sala para iniciar de cero";
    }, 3500);
    return;
  }
  clearConfirmStep = false;
  btn.textContent = "🗑️ Limpiar sala para iniciar de cero";
  STATE.submissions = [];
  STATE.liveFeed = [{ txt: "Sala reiniciada por el administrador. Lista para recibir jugadores reales.", ts: "ahora", ok: true }];
  saveState();
  renderAllAdminViews();
  toast("Sala limpia. Lista para recibir los resultados reales de tus amigos.");
});

$("#btnExportCsv").addEventListener("click", function(){
  if(!STATE.submissions.length){ toast("No hay resultados para exportar."); return; }
  var headers = ["Posicion","Nombre","Modo","Puntaje_Kahoot","Aciertos","Total_Preguntas","Precision_Pct","Tiempo_Promedio_Seg","Racha_Max","LP_Final","Rango"];
  var sorted = STATE.submissions.slice().sort(function(a,b){ return b.score - a.score; });
  var rows = [headers.join(",")];
  sorted.forEach(function(s, i){
    rows.push([
      i + 1,
      '"' + s.name.replace(/"/g, '""') + '"',
      s.mode,
      s.score,
      s.correct,
      s.totalQuestions,
      s.acc,
      s.avgSec,
      s.maxStreak,
      s.lp,
      '"' + s.rank.replace(/"/g, '""') + '"'
    ].join(","));
  });
  var blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "estadisticas-cumple-james.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  toast("Exportado: estadisticas-cumple-james.csv");
});

$("#btnExportJson").addEventListener("click", function(){
  copyText(JSON.stringify(STATE.submissions, null, 2), "JSON de resultados copiado al portapapeles.");
});

$("#btnCopyWhatsappSummary").addEventListener("click", function(){
  var sorted = STATE.submissions.slice().sort(function(a,b){ return b.score - a.score; });
  if(!sorted.length){ toast("Aún no hay jugadores en el ranking."); return; }
  var lines = ["🏆 *RANKING OFICIAL · CUMPLE #19 DE JAMES* 🏆", ""];
  sorted.slice(0, 10).forEach(function(s, idx){
    var m = idx === 0 ? "🥇" : (idx === 1 ? "🥈" : (idx === 2 ? "🥉" : (idx + 1) + "."));
    lines.push(m + " *" + s.name + "* — " + s.score.toLocaleString("es-NI") + " pts (" + s.acc + "% · ⚡" + s.avgSec + "s · " + s.lp + " LP)");
  });
  copyText(lines.join("\n"), "Resumen del Podio copiado para WhatsApp.");
});

$("#btnAssignTopWinners").addEventListener("click", function(){
  var sorted = STATE.submissions.slice().sort(function(a,b){ return b.score - a.score; });
  if(!sorted.length){ toast("No hay jugadores para asignar."); return; }
  STATE.prizes.q.w = sorted[0].name;
  if(sorted[1]) STATE.prizes.v.w = sorted[1].name;
  saveState();
  $("#prizeBudgetHint").textContent = "Ganadores asignados: 1) " + STATE.prizes.q.w + (STATE.prizes.v.w ? " · 2) " + STATE.prizes.v.w : "");
  toast("Ganadores asignados: " + STATE.prizes.q.w + (STATE.prizes.v.w ? " y " + STATE.prizes.v.w : ""));
});

/* Filtros de Leaderboard y Preguntas */
$("#leaderSearchInput").addEventListener("input", renderLeaderboardTable);
$("#leaderFilterMode").addEventListener("change", renderLeaderboardTable);
$("#leaderSortBy").addEventListener("change", renderLeaderboardTable);
$("#qAnalysisFilterCat").addEventListener("change", renderQuestionBreakdownView);
$("#qAnalysisSort").addEventListener("change", renderQuestionBreakdownView);

/* Inspector Individual de Jugador */
$("#leaderboardTbody").addEventListener("click", function(e){
  var inspBtn = e.target.closest("[data-inspect]");
  if(inspBtn){
    var id = inspBtn.getAttribute("data-inspect");
    var sub = STATE.submissions.filter(function(s){ return s.id === id; })[0];
    if(!sub) return;
    openInspectModal(sub);
    return;
  }
  var delBtn = e.target.closest("[data-delsub]");
  if(delBtn){
    var delId = delBtn.getAttribute("data-delsub");
    STATE.submissions = STATE.submissions.filter(function(s){ return s.id !== delId; });
    saveState();
    renderAllAdminViews();
    toast("Registro eliminado.");
  }
});

function openInspectModal(sub){
  var deck = getCombinedDeck("full");
  var deckMap = {};
  deck.forEach(function(d){ deckMap[d.uid] = d; });

  $("#inspectPlayerName").textContent = sub.name + " · " + sub.score.toLocaleString("es-NI") + " pts";
  $("#inspectPlayerSummary").innerHTML =
    '<div class="toolbar">' +
      '<span class="badge badge-ok">Aciertos: ' + sub.correct + '/' + sub.totalQuestions + ' (' + sub.acc + '%)</span>' +
      '<span class="badge">Velocidad media: ' + sub.avgSec + ' s</span>' +
      '<span class="badge">Racha máx: 🔥 x' + sub.maxStreak + '</span>' +
      '<span class="badge badge-gold">' + sub.lp + ' LP · ' + esc(sub.rank) + '</span>' +
    '</div>';

  $("#inspectPlayerTbody").innerHTML = (sub.answers || []).map(function(ans, idx){
    var d = deckMap[ans.uid] || { q: ans.uid, o: [], a: 0 };
    var chosenTxt = (ans.choice >= 0 && d.o[ans.choice]) ? d.o[ans.choice] : "Tiempo agotado";
    var corrTxt = d.o[d.a] || "";
    return '<tr>' +
      '<td class="mono">' + ans.uid + '</td>' +
      '<td>' + esc(d.q) + '</td>' +
      '<td><span class="badge ' + (ans.correct ? "badge-ok" : "badge-bad") + '">' + esc(chosenTxt) + '</span></td>' +
      '<td class="mono">' + esc(corrTxt) + '</td>' +
      '<td class="mono">' + (ans.ms / 1000).toFixed(2) + ' s</td>' +
      '<td class="mono"><strong>' + (ans.pts ? "+" + ans.pts : "0") + '</strong></td>' +
    '</tr>';
  }).join("");

  $("#playerInspectModal").hidden = false;
}
$("#btnCloseInspectModal").addEventListener("click", function(){ $("#playerInspectModal").hidden = true; });

/* Modales de Importación, Guía y Registro Manual */
$("#btnOpenImportModal").addEventListener("click", function(){ $("#importWhatsappModal").hidden = false; });
$("#btnCloseImportModal").addEventListener("click", function(){ $("#importWhatsappModal").hidden = true; });
$("#btnProcessImportCodes").addEventListener("click", function(){
  var raw = ($("#importCodesTextarea").value || "").trim();
  if(!raw){ toast("Pega al menos un código DUELO19:..."); return; }
  var matches = raw.match(/DUELO19:[A-Za-z0-9+/=]+/g) || [];
  if(!matches.length){
    try {
      var single = decodeSubmissionToken(raw);
      upsertSubmission(single, true);
      $("#importCodesTextarea").value = "";
      $("#importWhatsappModal").hidden = true;
      return;
    } catch(e){
      toast("No se encontró ningún código DUELO19 válido en el texto.");
      return;
    }
  }
  var count = 0;
  matches.forEach(function(token){
    try {
      var sub = decodeSubmissionToken(token);
      upsertSubmission(sub, false);
      count++;
    } catch(e){}
  });
  $("#importCodesTextarea").value = "";
  $("#importWhatsappModal").hidden = true;
  toast("¡" + count + (count === 1 ? " resultado importado" : " resultados importados") + " exitosamente!");
});

$("#btnOpenShareModal").addEventListener("click", function(){ $("#shareGuideModal").hidden = false; });
$("#btnCloseShareModal").addEventListener("click", function(){ $("#shareGuideModal").hidden = true; });
$("#btnCloseShareModal2").addEventListener("click", function(){ $("#shareGuideModal").hidden = true; });

$("#btnOpenManualEntry").addEventListener("click", function(){ $("#manualEntryModal").hidden = false; });
$("#btnCloseManualModal").addEventListener("click", function(){ $("#manualEntryModal").hidden = true; });
$("#btnSaveManualEntry").addEventListener("click", function(){
  var name = ($("#manPlayerName").value || "").trim();
  if(!name){ toast("Escribe el nombre del jugador."); return; }
  var corr = clamp(+($("#manCorrectCount").value || 15), 0, 21);
  var avgSec = clamp(+($("#manAvgTime").value || 4.0), 1, 20);
  var ratio = (corr / 21) - 0.65;
  var sub = buildSimulatedSubmission(name, ratio, avgSec, Date.now() % 100);
  sub.isSim = false;
  sub.correct = corr;
  sub.acc = Math.round((corr / 21) * 100);
  sub.avgSec = avgSec;
  sub.score = Math.round(corr * (500 + Math.max(0, (1 - avgSec / 15) * 450)));
  upsertSubmission(sub, true);
  $("#manPlayerName").value = "";
  $("#manualEntryModal").hidden = true;
});

/* Eventos Modo Jugador Kahoot */
$("#plQuickFriendsChips").addEventListener("click", function(e){
  var b = e.target.closest("[data-pickfriend]");
  if(b){
    $("#plNameInput").value = b.getAttribute("data-pickfriend");
  }
});
$("#btnStartPlayerGame").addEventListener("click", startPlayerKahoot);
$("#plOptionsGrid").addEventListener("click", function(e){
  var card = e.target.closest("[data-plopt]");
  if(card && !PL_GAME.answeredCurrent){
    submitPlayerChoice(+card.getAttribute("data-plopt"));
  }
});
$("#btnNextPlayerQuestion").addEventListener("click", function(){
  toast("James controla el avance de la partida.");
});
$("#btnPlayAgain").addEventListener("click", function(){
  $("#playerResultCard").hidden = true;
  $("#playerLobbyCard").hidden = false;
});
$("#btnPlayerCopyCode").addEventListener("click", function(){
  copyText($("#plResultCodeOutput").value, "Código DUELO19 copiado. Envíalo a James por WhatsApp.");
});
$("#btnPlayerSendWhatsapp").addEventListener("click", function(){
  var code = $("#plResultCodeOutput").value;
  var msg = "⚔️ ¡Terminé el Reto de Cumpleaños #19 de James!\n" +
    "👤 Jugador: " + PL_GAME.name + "\n" +
    "🏆 Puntaje: " + PL_GAME.score.toLocaleString("es-NI") + " pts (" + PL_GAME.correct + "/" + PL_GAME.deck.length + ")\n" +
    "❤️ LP finales: " + PL_GAME.lp + "\n\n" +
    "Código para tu Panel de Admin:\n" + code;
  window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank", "noopener");
});

/* Eventos Pantalla Show en Vivo (Anfitrión) */
$("#hostDeckSelect").addEventListener("change", function(e){
  HOST_SHOW.deckMode = e.target.value;
  HOST_SHOW.idx = 0;
  HOST_SHOW.revealed = false;
  broadcastPacket({ kind: "host_session_start", mode: HOST_SHOW.deckMode, limitSec: 10 });
  renderHostStage();
});
$("#btnHostPrev").addEventListener("click", function(){
  HOST_SHOW.idx--;
  HOST_SHOW.revealed = false;
  broadcastHostQuestion();
  renderHostStage();
});
$("#btnHostNext").addEventListener("click", function(){
  var deckLength = getCombinedDeck(HOST_SHOW.deckMode).length;
  if(HOST_SHOW.idx >= deckLength - 1){
    broadcastPacket({ kind: "host_end" });
    HOST_SHOW.revealed = true;
    clearInterval(HOST_SHOW.timerIv);
    renderHostStage();
    return;
  }
  HOST_SHOW.idx++;
  HOST_SHOW.revealed = false;
  broadcastHostQuestion();
  renderHostStage();
});
$("#btnHostRevealNow").addEventListener("click", function(){
  clearInterval(HOST_SHOW.timerIv);
  HOST_SHOW.revealed = true;
  broadcastHostReveal();
  sfxHit();
  renderHostStage();
});
$("#btnHostAction").addEventListener("click", function(){
  clearInterval(HOST_SHOW.timerIv);
  HOST_SHOW.revealed = false;
  broadcastHostQuestion();
  renderHostStage();
  var left = 10;
  $("#hostTimerDisplay").textContent = "⏱ Votando: " + left + " s";
  HOST_SHOW.timerIv = setInterval(function(){
    left--;
    if(left > 0){
      sfxTick();
      $("#hostTimerDisplay").textContent = "⏱ Votando: " + left + " s";
    } else {
      clearInterval(HOST_SHOW.timerIv);
      HOST_SHOW.revealed = true;
      broadcastHostReveal();
      sfxHit();
      renderHostStage();
    }
  }, 1000);
});
$("#btnHostMinus1").addEventListener("click", function(){
  HOST_SHOW.standing = Math.max(0, HOST_SHOW.standing - 1);
  $("#hostStandingCount").textContent = HOST_SHOW.standing;
});
$("#btnHostMinus5").addEventListener("click", function(){
  HOST_SHOW.standing = Math.max(0, HOST_SHOW.standing - 5);
  $("#hostStandingCount").textContent = HOST_SHOW.standing;
});
$("#btnHostResetStanding").addEventListener("click", function(){
  HOST_SHOW.standing = 32;
  $("#hostStandingCount").textContent = 32;
});
$("#btnHostFullscreen").addEventListener("click", function(){
  var st = $("#hostStageContainer");
  try {
    if(document.fullscreenElement) document.exitFullscreen();
    else if(st.requestFullscreen) st.requestFullscreen();
  } catch(e){}
});

/* Eventos Organización del Cumpleaños (Rock Munchies) */
$("#rmPizzaSize").addEventListener("change", function(e){
  STATE.order.size = +e.target.value || 14;
  STATE.order.sl = { 12: 6, 14: 8, 18: 12 }[STATE.order.size] || 8;
  saveState();
  renderOrgHub();
});
$("#rmOrderTableBox").addEventListener("input", function(e){
  var k = e.target.getAttribute("data-rmq");
  if(k){
    STATE.order.q[k] = Math.max(0, +e.target.value || 0);
    saveState();
    renderOrgHub();
    return;
  }
  if(e.target.getAttribute("data-rmdrink") === "dq"){
    STATE.order.dq = Math.max(0, +e.target.value || 0);
    saveState();
    renderOrgHub();
  }
});
$("#btnFitPizzas").addEventListener("click", function(){
  var conf = STATE.guests.filter(function(g){ return g.s === "c"; }).length || 33;
  var sl = STATE.order.sl || 8;
  var needed = Math.ceil((3 * conf) / sl);
  var cur = (STATE.order.q.j || 0) + (STATE.order.q.p || 0) + (STATE.order.q.e || 0);
  while(cur < needed){
    if(STATE.order.q.j <= STATE.order.q.p) STATE.order.q.j++;
    else STATE.order.q.p++;
    cur++;
  }
  saveState();
  renderOrgHub();
  toast("Pedido ajustado a " + cur + " pizzas para cubrir 3 porciones por persona.");
});

$("#btnAddBudgetRow").addEventListener("click", function(){
  var c = ($("#budNewConcept").value || "").trim();
  if(!c) return;
  var amt = +($("#budNewAmount").value || 0);
  var cat = $("#budNewCat").value;
  STATE.budget.items.push({ id: uid(), c: c, amt: amt, cat: cat, paid: false });
  $("#budNewConcept").value = "";
  $("#budNewAmount").value = "";
  saveState();
  renderOrgHub();
});
$("#budgetTbody").addEventListener("input", function(e){
  var id = e.target.getAttribute("data-budamt");
  if(id){
    var it = STATE.budget.items.filter(function(x){ return x.id === id; })[0];
    if(it){ it.amt = +e.target.value || 0; saveState(); renderOrgHub(); }
  }
});
$("#budgetTbody").addEventListener("change", function(e){
  var id = e.target.getAttribute("data-budpaid");
  if(id){
    var it = STATE.budget.items.filter(function(x){ return x.id === id; })[0];
    if(it){ it.paid = e.target.checked; saveState(); renderOrgHub(); }
  }
});
$("#budgetTbody").addEventListener("click", function(e){
  var b = e.target.closest("[data-delbud]");
  if(b){
    var id = b.getAttribute("data-delbud");
    STATE.budget.items = STATE.budget.items.filter(function(x){ return x.id !== id; });
    saveState();
    renderOrgHub();
  }
});

$("#guestFilterSelect").addEventListener("change", renderOrgHub);
$("#btnAddGuest").addEventListener("click", function(){
  var n = ($("#newGuestNameInput").value || "").trim();
  if(!n) return;
  STATE.guests.push({ id: uid(), n: n, s: $("#newGuestStateSelect").value, k: "", note: "" });
  $("#newGuestNameInput").value = "";
  saveState();
  renderOrgHub();
  renderQuickFriendChips();
});
$("#guestsTbody").addEventListener("change", function(e){
  var id = e.target.getAttribute("data-guestst");
  if(id){
    var g = STATE.guests.filter(function(x){ return x.id === id; })[0];
    if(g){ g.s = e.target.value; saveState(); renderOrgHub(); }
  }
});
$("#guestsTbody").addEventListener("input", function(e){
  var id = e.target.getAttribute("data-guestnote");
  if(id){
    var g = STATE.guests.filter(function(x){ return x.id === id; })[0];
    if(g){ g.note = e.target.value; saveState(); }
  }
});
$("#guestsTbody").addEventListener("click", function(e){
  var b = e.target.closest("[data-delguest]");
  if(b){
    var id = b.getAttribute("data-delguest");
    STATE.guests = STATE.guests.filter(function(x){ return x.id !== id; });
    saveState();
    renderOrgHub();
  }
});
$("#btnCopyGuestsList").addEventListener("click", function(){
  var c = STATE.guests.filter(function(g){ return g.s === "c"; });
  var p = STATE.guests.filter(function(g){ return g.s === "p"; });
  var txt = "INVITADOS CUMPLE JAMES (" + STATE.guests.length + ")\n\nConfirmados (" + c.length + "):\n" +
    c.map(function(g){ return "- " + g.n; }).join("\n") +
    (p.length ? "\n\nPendientes (" + p.length + "):\n" + p.map(function(g){ return "- " + g.n; }).join("\n") : "");
  copyText(txt, "Lista de invitados copiada.");
});

$("#tasksChecklistBox").addEventListener("change", function(e){
  var id = e.target.getAttribute("data-taskchk");
  if(id){
    var t = STATE.tasks.filter(function(x){ return x.id === id; })[0];
    if(t){ t.done = e.target.checked; saveState(); renderOrgHub(); }
  }
});

$("#btnCopyHostSheet").addEventListener("click", function(){
  var deck = getCombinedDeck("full");
  var lines = [
    "HOJA DEL ANFITRIÓN · CUMPLE #19 DE JAMES",
    "Martes 3 de noviembre de 2026, 5:00 p. m. · Rock Munchies",
    "PIN de Sala Kahoot: " + STATE.roomPin,
    "",
    "SOLUCIONARIO DE LAS 21 CARTAS:"
  ];
  deck.forEach(function(d){
    lines.push(d.uid + ". " + d.q + " -> RESPUESTA: Opción " + (d.a + 1) + " (" + d.o[d.a] + ")");
  });
  copyText(lines.join("\n"), "Hoja del anfitrión con solucionario copiada.");
});

/* Eventos Editor de Retos */
$("#cfgRoomPin").addEventListener("input", function(e){
  STATE.roomPin = (e.target.value || "1926").trim();
  saveState();
  connectLiveRoom();
});
$("#cfgPrize1Desc").addEventListener("input", function(e){ STATE.prizes.q.d = e.target.value; saveState(); });
$("#cfgPrize2Desc").addEventListener("input", function(e){ STATE.prizes.v.d = e.target.value; saveState(); });

$("#editorQuizList").addEventListener("input", function(e){
  var qi = e.target.getAttribute("data-editq");
  if(qi !== null){ STATE.quiz[+qi].q = e.target.value; saveState(); return; }
  var qo = e.target.getAttribute("data-edito");
  if(qo){
    var p = qo.split("-");
    STATE.quiz[+p[0]].o[+p[1]] = e.target.value;
    saveState();
  }
});
$("#editorQuizList").addEventListener("change", function(e){
  var qa = e.target.getAttribute("data-edita");
  if(qa !== null){ STATE.quiz[+qa].a = +e.target.value; saveState(); }
});
$("#editorQuizList").addEventListener("click", function(e){
  var b = e.target.closest("[data-delquiz]");
  if(b){
    STATE.quiz.splice(+b.getAttribute("data-delquiz"), 1);
    saveState();
    renderChallengesEditor();
  }
});
$("#btnAddQuizQuestion").addEventListener("click", function(){
  STATE.quiz.push({ q: "Nueva pregunta sobre mí", o: ["Opción 1", "Opción 2", "Opción 3", "Opción 4"], a: 0, c: "guerra" });
  saveState();
  renderChallengesEditor();
  toast("Pregunta agregada al final del Quiz.");
});

$("#editorVerdadesList").addEventListener("input", function(e){
  var vs = e.target.getAttribute("data-editvs");
  if(vs){
    var p = vs.split("-");
    STATE.verdades[+p[0]].s[+p[1]] = e.target.value;
    saveState();
  }
});
$("#editorVerdadesList").addEventListener("change", function(e){
  var vl = e.target.getAttribute("data-editvl");
  if(vl !== null){ STATE.verdades[+vl].l = +e.target.value; saveState(); }
});
$("#editorVerdadesList").addEventListener("click", function(e){
  var b = e.target.closest("[data-delverd]");
  if(b){
    STATE.verdades.splice(+b.getAttribute("data-delverd"), 1);
    saveState();
    renderChallengesEditor();
  }
});
$("#btnAddVerdadesRound").addEventListener("click", function(){
  STATE.verdades.push({ s: ["Verdad 1", "Verdad 2", "Mentira 3"], l: 2 });
  saveState();
  renderChallengesEditor();
  toast("Ronda agregada a Dos Verdades.");
});
$("#btnResetDefaultQuestions").addEventListener("click", function(){
  STATE.quiz = JSON.parse(JSON.stringify(DEFAULT_QUIZ));
  STATE.verdades = JSON.parse(JSON.stringify(DEFAULT_VERDADES));
  saveState();
  renderChallengesEditor();
  renderAllAdminViews();
  toast("Se restauraron las 21 cartas originales.");
});

/* =========================================================================
   INICIALIZACIÓN (SOPORTA MODO ADMIN O MODO SOLO-JUGADOR PARA AMIGOS)
   ========================================================================= */
if(window.__PRELOADED_CONFIG__){
  var cfg = window.__PRELOADED_CONFIG__;
  if(cfg.roomPin) STATE.roomPin = cfg.roomPin;
  if(cfg.quiz) STATE.quiz = cfg.quiz;
  if(cfg.verdades) STATE.verdades = cfg.verdades;
  if(cfg.guests) STATE.guests = cfg.guests;
}

renderQuickFriendChips();
connectLiveRoom();

if(PLAYER_ONLY_MODE){
  /* Si es el archivo descargado para amigos, oculta navegación de Admin y abre directo en Kahoot */
  $("#mainNavStrip").style.display = "none";
  $("#btnDownloadFriendsHtml").style.display = "none";
  switchView("player-kahoot");
} else {
  renderAllAdminViews();
  renderOrgHub();
}

})();
