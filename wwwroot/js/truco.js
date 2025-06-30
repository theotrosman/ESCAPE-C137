// TRUCO 2v2 - Rick & Morty Escape Room

const SUITS = ['espada', 'basto', 'oro', 'copa'];
const VALUES = [1,2,3,4,5,6,7,10,11,12];
const SUIT_EMOJI = {
  espada: '⚔️',
  basto: '<img src="/img/bastoPalo.png" style="width:38px;height:38px;">',
  oro: '<img src="/img/paloOro.png" style="width:38px;height:38px;">',
  copa: '<img src="/img/copaPalo.png" style="width:38px;height:38px;">'
};
const PLAYER_ORDER = ['player', 'codigo', 'morty', 'hacker'];
const TEAM_PLAYER = ['player', 'morty'];
const TEAM_ENEMY = ['codigo', 'hacker'];
const TRUCO_POINTS = [1,2,3,4];
const ENVIDO_POINTS = { envido:2, real:3, falta:99 };

let state = {
    deck: [],
    hands: {},
    played: [],
    turn: 0,
    mano: 0,
    pie: 3,
    scores: { player:0, morty:0, codigo:0, hacker:0 },
    teamScore: { player:0, enemy:0 },
    round: 1,
    bazas: [],
    bazasGanadas: { player:0, enemy:0 },
    truco: { level:0, quien:null, pendiente:false, aceptado:false, quienCanto:null },
    envido: { cantos:[], quien:null, pendiente:false, valores:{} },
    mazo: false,
    winner: null,
    iaThinking: false,
    lock: false,
    manosGanadas: { player:0, enemy:0 },
    // Nuevas variables para ventaja de mano
    primeraManoGanada: null,
    segundaManoGanada: null,
    terceraManoGanada: null,
    ventajaMano: null,
    // Variables para irse al mazo
    mazoPendiente: { player: false, morty: false, codigo: false, hacker: false },
    mazoEquipo: null,
    // Variables para revelar carta del compañero
    cartaRevelada: { morty: null, player: null },
    puedeRevelar: true,
    envidoResuelto: false,
};

let envidoBloqueado = false;

// --- SISTEMA DE CHAT VIVO Y ABSURDO ---
const chatMessages = [];

// Frases absurdas para las IAs
const frasesAbsurdas = [
    "me dijo 'me hacés bien' y no me habló por tres días",
    "mi vieja me preguntó si comí y me largué a llorar",
    "soñé que me perdonaban, me desperté y todavía estaba bloqueado",
    "ayer sentí olor a su perfume y me tembló el estómago",
    "me respondió el mensaje dos semanas después como si nada",
    "me dijo que me quería pero que no sabe si como novio o como concepto",
    "me abrazó y pensé que todo estaba bien, después me clavó el visto",
    "subió una historia llorando y puso 'no es para nadie', y yo lloré igual",
    "me dejó de seguir pero mira todas mis historias desde una cuenta de recetas",
    "la vi de lejos y me reí. no sé si de tristeza o de bronca o de las dos",
    "me dijo 'sos mi lugar seguro' y después me dejó afuera",
    "ayer me dijo que me extrañaba y hoy me mandó un meme como si nada",
    "le escribí 'te extraño' y me contestó 'JSDAKJD'",
    "me dijo que no era buen momento para mí... y ahora sube con otro a TikTok",
    "me desbloqueó, me stalkeó y se volvió a ir. ni siquiera me saludó",
    "le conté cómo me sentía y me dejó en visto. eso también fue una respuesta",
    "me dijo que no sabía lo que quería. y mientras lo pensaba, me perdí yo",
    "tengo una playlist con su nombre y ahora no puedo escuchar ni el clima",
    "me dijo 'no sos vos, soy yo', y después fui yo el que se quedó solo",
    "me pidió perdón sin saber qué hizo, y eso me dolió más que lo que hizo"
  ];
  

const respuestasJugador = {
    "ayer me mandó un audio llorando diciéndome que me extrañaba": [
      "¿y después qué hizo? porque a mí me hizo eso y a las dos horas estaba con otro flaco",
      "me pasa lo mismo, te tiran el 'te extraño' para que no cortes todo, pero no cambian nada",
      "el 'me extrañás' sin acción es solo un método de retención emocional"
    ],
    "me clavó el visto en WhatsApp y me contestó por BeReal": [
      "eso es terrorismo emocional con estética casual",
      "te responden en apps random para mantenerte ahí, como que no se note el daño pero está",
      "el BeReal es el nuevo 'sigo acá pero no te quiero tanto'"
    ],
    "ayer me habló porque soñó que me moría. me habló para eso nomás.": [
      "eso no es amor, es culpa con señal 4G",
      "me pasó también. sueñan que te vas y recién ahí se acuerdan que existís",
      "te juro que prefiero que no sueñe nada, no que me use de aparición fantasma"
    ],
    "me desbloqueó para ver si seguía en línea y me volvió a bloquear. lo vi en directo": [
      "bro eso fue más violento que un audio pasivo agresivo",
      "te usan de espejo para ver si todavía valen algo. es literal eso",
      "yo lo llamo 'ping emocional': solo quieren saber si seguís sangrando"
    ],
    "me dejó de hablar pero ve todas mis historias y le pone like a mi perro": [
      "el perro no tiene la culpa de tus vínculos, amigo",
      "eso es manipulación emocional indirecta. saludalo y bloquealo vos",
      "si quiere verte, que te mire a vos. no al caniche"
    ],
    "una vez me dijo 'sos lo más lindo que me pasó' y después me ignoró un mes": [
      "es que sos lo más lindo, pero también lo más fácil de perder",
      "a veces te dicen esas cosas para que no los odies cuando se vayan",
      "esa frase debería venir con fecha de vencimiento y una advertencia"
    ],
    "me respondió a las 3 de la mañana con un 'pensé que te había contestado'": [
      "me lo hicieron, y era mentira. ya había subido dos historias en el medio",
      "es el clásico 'no me olvidé, solo no me importó tanto'",
      "cuando te quieren hablar, lo hacen. lo demás es excusa con horario nocturno"
    ],
    "la vi feliz y no sé si me alegra o me arruina el día": [
      "te entiendo. duele que esté bien sin vos, aunque eso sea lo sano",
      "verla feliz me hace pensar si alguna vez lo estuvo conmigo o fue actuación",
      "igual esa felicidad a veces también está actuada. no te lo creas tanto"
    ],
    "me dijo 'siento cosas por vos pero estoy mal de la panza' y desapareció": [
      "la panza es el nuevo 'no sos vos, soy yo', literal",
      "yo también usé eso y era mentira. era miedo disfrazado de acidez",
      "cuando te quieren de verdad, vomitan pero te contestan"
    ],
    "me dijo que le doy paz y después desapareció por 4 días": [
      "a mí me dijeron eso y después subieron una selfie con uno de perfil turbio",
      "la paz se va cuando aparece el caos de alguien más",
      "te dan paz porque sabés escuchar, pero nadie escucha tu parte"
    ]
  };
  


// Sistema de conversación automática entre IAs
let autoChatInterval;
let lastAutoChatTime = 0;

function iniciarChatAutomatico() {
    autoChatInterval = setInterval(() => {
        const now = Date.now();
        if (now - lastAutoChatTime > 10000) { // Mínimo 20 segundos entre conversaciones
            generarConversacionIA();
            lastAutoChatTime = now;
        }
    }, 5000); // Revisar cada 5 segundos
}

function generarConversacionIA() {
    const bots = [
        { name: 'Código', avatar: '/img/hackerVerde.png' },
        { name: 'Hacker', avatar: '/img/hackerRojo.png' },
        { name: 'Rick', avatar: '/img/rickHacker.png' }
    ];
    
    // Generar 1-3 mensajes en secuencia
    const numMensajes = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numMensajes; i++) {
        setTimeout(() => {
            const bot = bots[Math.floor(Math.random() * bots.length)];
            const frase = frasesAbsurdas[Math.floor(Math.random() * frasesAbsurdas.length)];
            
            chatMessages.push({
                sender: bot.name,
                avatar: bot.avatar,
                text: frase,
                timestamp: Date.now()
            });
            
            renderChat();
        }, i * 2000); // 2 segundos entre mensajes
    }
}

function renderChat() {
    const chatDiv = document.getElementById('chat-messages');
    if (!chatDiv) return;
    
    chatDiv.innerHTML = '';
    chatMessages.forEach(msg => {
        const bubble = document.createElement('div');
        if (msg.narrator) {
            bubble.className = 'chat-bubble narrator';
            bubble.innerHTML = `<div class="chat-content" style="background:#222;color:#aaa;font-style:italic;">${msg.text}</div>`;
        } else {
            bubble.className = 'chat-bubble ' + (msg.sender === 'Vos' ? 'right' : 'left');
            bubble.innerHTML = `
                <img src="${msg.avatar}" class="chat-avatar" alt="${msg.sender}">
                <div class="chat-content">
                    <span class="chat-name">${msg.sender}</span>
                    <span class="chat-text">${msg.text}</span>
                </div>
            `;
        }
        chatDiv.appendChild(bubble);
    });
    chatDiv.scrollTop = chatDiv.scrollHeight;
}

function addPlayerMessage(text) {
    chatMessages.push({ 
        sender: 'Vos', 
        avatar: '/img/mortyHacker.png', 
        text,
        timestamp: Date.now()
    });
    renderChat();
    
    // Responder después de un delay
    setTimeout(() => botReply(text), 1000 + Math.random() * 2000);
}

function botReply(playerText) {
    const bots = [
        { name: 'Código', avatar: '/img/hackerVerde.png' },
        { name: 'Hacker', avatar: '/img/hackerRojo.png' },
        { name: 'Rick', avatar: '/img/rickHacker.png' }
    ];
    
    const bot = bots[Math.floor(Math.random() * bots.length)];
    let response = '';
    
    // Buscar respuesta específica
    if (respuestasJugador[playerText]) {
        response = respuestasJugador[playerText][Math.floor(Math.random() * respuestasJugador[playerText].length)];
    } else {
        // Respuesta genérica si no hay respuesta específica
        const respuestasGenericas = [
            "posta que no lo quería pensar... pero ahora me duele",
            "amigo, eso fue más profundo que mi vínculo con mi viejo",
            "es verdad, me hiciste ruido y me encantó",
            "eso me pegó como una indirecta con nombre y apellido",
            "pará flaco, que estoy tomando mate y me largué a pensar",
            "como diría mi abuela: 'eso es re de vos pero no lo ves'",
            "eso es tan cierto que me dieron ganas de borrar el chat con mi ex",
            "es una frase y una piña al ego al mismo tiempo",
            "eso es de terapia, pero sin pagar la sesión",
            "no sé si fue sabio o triste, pero me llegó como audio a las 2 AM"
          ];
          
        response = respuestasGenericas[Math.floor(Math.random() * respuestasGenericas.length)];
    }
    
    chatMessages.push({ 
        sender: bot.name, 
        avatar: bot.avatar, 
        text: response,
        timestamp: Date.now()
    });
    renderChat();
}

// Inicializar chat automático cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    renderChat();
    
    // Iniciar conversación automática después de 10 segundos
    setTimeout(() => {
        iniciarChatAutomatico();
        // Primera conversación automática
        setTimeout(() => generarConversacionIA(), 5000);
    }, 10000);
    
    const chatSelect = document.getElementById('chat-phrases');
    const chatSend = document.getElementById('chat-send');
    
    if (chatSend && chatSelect) {
        chatSend.onclick = () => {
            if (chatSelect.value && chatSelect.value !== '') {
                addPlayerMessage(chatSelect.value);
                chatSelect.selectedIndex = 0;
            }
        };
        
        chatSelect.addEventListener('keypress', e => {
            if (e.key === 'Enter' && chatSelect.value && chatSelect.value !== '') {
                addPlayerMessage(chatSelect.value);
                chatSelect.selectedIndex = 0;
            }
        });
    }
});

function crearMazo() {
    let mazo = [];
    for(let s of SUITS) for(let v of VALUES) mazo.push({suit:s, value:v});
    return mazo;
}

function mezclar(mazo) {
    for(let i=mazo.length-1;i>0;i--){
        let j=Math.floor(Math.random()*(i+1));
        [mazo[i],mazo[j]]=[mazo[j],mazo[i]];
    }
}

function repartir() {
    state.deck = crearMazo();
    mezclar(state.deck);
    state.hands = { player:[], morty:[], codigo:[], hacker:[] };
    for(let p of PLAYER_ORDER) for(let i=0;i<3;i++) state.hands[p].push(state.deck.pop());
}

// Función para determinar si un jugador es pie (último en jugar de su equipo)
function esPie(jugador) {
    // El pie es el último en el orden de juego (state.pie)
    return jugador === PLAYER_ORDER[state.pie];
}

// Función para calcular el valor del envido de una mano
function calcularEnvido(mano) {
    let palos = {};
    mano.forEach(c => {
        if (!palos[c.suit]) palos[c.suit] = [];
        palos[c.suit].push(c);
    });
    
    let max = 0;
    for (let s in palos) {
        if (palos[s].length >= 2) {
            let vals = palos[s].map(c => c.value >= 10 ? 0 : c.value).sort((a,b) => b-a);
            max = Math.max(max, vals[0] + vals[1] + 20);
        }
    }
    if (max === 0) {
        max = Math.max(...mano.map(c => c.value >= 10 ? 0 : c.value));
    }
    return max;
}

// Función para evaluar si la IA tiene una mano buena para Truco
function tieneManoBuenaParaTruco(mano) {
    let valores = mano.map(c => valorTruco(c)).sort((a,b) => b-a);
    // Considerar buena si tiene al menos una carta brava o dos cartas de valor 10+
    return valores[0] >= 10 || (valores[0] >= 7 && valores[1] >= 7);
}

function render() {
    // HUD
    document.getElementById('player-score').textContent = state.teamScore.player;
    document.getElementById('enemy-score').textContent = state.teamScore.enemy;
    document.getElementById('current-turn').textContent = 'Turno: ' + nombre(state.turnPlayer);
    
    // Mostrar ventaja de mano si existe
    let consoleHighlight = document.getElementById('console-highlight');
    if (state.ventajaMano) {
        consoleHighlight.textContent = 'VENTAJA DE MANO: ' + (state.ventajaMano === 'player' ? 'MORTY+RICK' : 'CÓDIGO+HACKER');
        consoleHighlight.style.color = state.ventajaMano === 'player' ? 'var(--neon-green)' : 'var(--neon-cyan)';
    } else {
        consoleHighlight.textContent = '';
    }
    
    // Manos
    for(let p of PLAYER_ORDER) {
        let handDiv = document.getElementById(p+'-hand');
        handDiv.innerHTML = '';
        state.hands[p].forEach((c,i)=>{
            let d = document.createElement('div');
            d.className = 'card'+((p==='player')?'':' hidden');
            
            // Si es una carta de Rick (morty) y está revelada, mostrarla
            if(p==='morty' && state.cartaRevelada.morty === i) {
                d.className = 'card revealed';
                d.innerHTML = `<div class='card-number'>${c.value}</div><div class='card-suit'>${SUIT_EMOJI[c.suit]}</div>`;
            } else if(p==='player') {
                d.innerHTML = `<div class='card-number'>${c.value}</div><div class='card-suit'>${SUIT_EMOJI[c.suit]}</div>`;
                d.onclick = ()=>{ if(state.turnPlayer==='player'&&!state.lock) jugarCarta(i); };
            }
            handDiv.appendChild(d);
        });
    }
    
    // Cartas jugadas
    for(let i=0;i<4;i++) {
        let slot = document.getElementById('slot-'+i);
        slot.innerHTML = '';
        let jug = state.played[i];
        if(jug) {
            let c = jug.card;
            let d = document.createElement('div');
            d.className = 'card played';
            d.innerHTML = `<div class='card-number'>${c.value}</div><div class='card-suit'>${SUIT_EMOJI[c.suit]}</div>`;
            slot.appendChild(d);
        }
    }
    
    // Botones - Solo habilitar Envido si es pie y no jugó
    let puedeCantarEnvido = state.turnPlayer === 'player' && 
                           esPie('player') && 
                           !state.played.some(p => p.player === 'player') &&
                           !state.truco.pendiente && 
                           !state.envido.pendiente && 
                           !state.mazo &&
                           !state.envidoResuelto;
    
    // --- En render(), asegurar que el botón de truco nunca permita subir más allá de 3 ---
    let puedeCantarTruco = state.turnPlayer === 'player' && 
                          !state.truco.pendiente && 
                          !state.envido.pendiente && 
                          !state.mazo &&
                          state.truco.level === 0; // Solo si no se ha cantado truco en esta mano
    document.getElementById('btn-truco').disabled = !puedeCantarTruco;
    
    // Mostrar botones según el estado del juego
    let hayMazoPendiente = state.mazoEquipo === 'player' && state.mazoPendiente.player && !state.mazoPendiente.morty;
    
    document.getElementById('canto-buttons').style.display = (state.turnPlayer==='player'&&!state.truco.pendiente&&!state.envido.pendiente&&!state.mazo&&!hayMazoPendiente)?'flex':'none';
    document.getElementById('mazo-buttons').style.display = (state.turnPlayer==='player'&&!state.mazo&&!hayMazoPendiente)?'flex':'none';
    
    // Mostrar botón de revelar carta del compañero
    let puedeRevelar = state.turnPlayer === 'player' && 
                      state.puedeRevelar && 
                      state.cartaRevelada.morty === null &&
                      !state.truco.pendiente && 
                      !state.envido.pendiente && 
                      !state.mazo;
    document.getElementById('reveal-buttons').style.display = puedeRevelar ? 'flex' : 'none';
    document.getElementById('btn-reveal-companion').disabled = !puedeRevelar;
    
    // Mostrar botones de respuesta SOLO si el jugador debe responder a un canto de la IA rival
    let showResponse = false;
    if (state.truco.pendiente) {
        if (TEAM_ENEMY.includes(state.truco.quien) && state.turnPlayer === 'player') {
            showResponse = true;
        }
    } else if (state.envido.pendiente) {
        if (TEAM_ENEMY.includes(state.envido.quien) && state.turnPlayer === 'player') {
            showResponse = true;
        } else {
            showResponse = false;
        }
    }
    document.getElementById('response-buttons').style.display = showResponse ? 'flex' : 'none';
    
    // --- FORZAR RESPUESTA DE LA IA AL ENVIDO DEL JUGADOR ---
    // Si hay envido pendiente y el último canto lo hizo el jugador, forzar turno de la IA
    if (state.envido.pendiente && TEAM_PLAYER.includes(state.envido.quien) && TEAM_ENEMY.includes(state.turnPlayer)) {
        setTimeout(()=>iaEnvidoRespuesta(), 700);
    }
    
    // Mostrar botón de continuar si el jugador cantó y la IA ya respondió
    let showContinue = false;
    if (state.truco.pendiente && TEAM_PLAYER.includes(state.truco.quien)) {
        // Si el jugador cantó truco, mostrar botón de continuar después de que la IA responda
        showContinue = false; // Se mostrará cuando la IA responda
    }
    document.getElementById('continue-buttons').style.display = showContinue ? 'flex' : 'none';
    
    document.getElementById('btn-envido').disabled = !puedeCantarEnvido;
    document.getElementById('btn-truco').disabled = !puedeCantarTruco;
    
    // Asegurar que el botón de envido esté deshabilitado si ya se resolvió el envido
    if (state.envidoResuelto) {
        document.getElementById('btn-envido').disabled = true;
    }
}

function nombre(p) {
    return {
        player:'MORTY.EXE', morty:'RICK.EXE', codigo:'CÓDIGO.EXE', hacker:'HACKER.EXE'
    }[p];
}

function log(msg, tipo='system') {
    let c = document.getElementById('console-output');
    let d = document.createElement('div');
    d.className = 'console-message '+tipo;
    d.textContent = '';
    c.appendChild(d);
    
    // Efecto de escritura decrypted
    let i = 0;
    const typeWriter = () => {
        if (i < msg.length) {
            d.textContent += msg[i];
            i++;
            setTimeout(typeWriter, 15);
        }
    };
    typeWriter();
    
    // Borrar mensajes viejos dejando solo los últimos 3
    while (c.children.length > 3) c.removeChild(c.children[0]);
}

function turnoSiguiente() {
    state.turn = (state.turn+1)%4;
    state.turnPlayer = PLAYER_ORDER[state.turn];
    render();
    
    // Log del orden de turnos para claridad
    if (!state.truco.pendiente && !state.envido.pendiente) {
        log('Turno: ' + nombre(state.turnPlayer), 'system');
    }
    
    // Si hay mazo pendiente del equipo enemigo, continuar automáticamente
    if (state.mazoEquipo === 'enemy' && (state.mazoPendiente.codigo || state.mazoPendiente.hacker)) {
        if (TEAM_ENEMY.includes(state.turnPlayer)) {
            setTimeout(()=>iaTurno(),1700);
            return;
        }
    }
    
    // Si hay truco pendiente, no llamar automáticamente a iaTurno
    if(state.truco.pendiente) {
        // Solo llamar iaTurno si es el turno de la IA rival
        if(TEAM_ENEMY.includes(state.turnPlayer)) {
            setTimeout(()=>iaTurno(),1700);
        }
    } else if(state.envido.pendiente) {
        // Si hay envido pendiente, no llamar automáticamente a iaTurno
        // Los envidos se manejan con funciones específicas
    } else if(TEAM_ENEMY.includes(state.turnPlayer)||state.turnPlayer==='morty') {
        // Turno normal de la IA
        setTimeout(()=>iaTurno(),1700);
    }
}

function jugarCarta(idx) {
    if(state.lock) return;
    let p = state.turnPlayer;
    let carta = state.hands[p][idx];
    state.hands[p].splice(idx,1);
    state.played.push({player:p,card:carta});
    if(p==='player') envidoBloqueado = true;
    render();
    // Si algún jugador se queda sin cartas, finalizar la mano automáticamente
    let alguienSinCartas = PLAYER_ORDER.some(j => state.hands[j].length === 0);
    if(alguienSinCartas) {
        log('Al menos un jugador se quedó sin cartas. Mano finalizada automáticamente.','system');
        setTimeout(()=>finMano(), 800);
        return;
    }
    if(state.played.length===4) setTimeout(()=>resolverBaza(),2000);
    else turnoSiguiente();
}

function resolverBaza() {
    let max = -1, win = null;
    for(let jug of state.played) {
        let v = valorTruco(jug.card);
        if(v>max) { max=v; win=jug.player; }
    }
    let team = TEAM_PLAYER.includes(win)?'player':'enemy';
    state.bazasGanadas[team]++;
    log(nombre(win)+' gana la baza','system');
    log('DEBUG: Bazas ganadas - player: ' + state.bazasGanadas.player + ', enemy: ' + state.bazasGanadas.enemy,'system');
    state.played = [];
    
    // Verificar si se completó una mano
    if(state.bazasGanadas.player===2||state.bazasGanadas.enemy===2) {
        log('DEBUG: Mano completada, llamando a finMano','system');
        setTimeout(()=>finMano(),2200);
    } else {
        turnoSiguiente();
    }
}

function valorTruco(card) {
    // 1 espada > 1 basto > 7 espada > 7 oro > 3 > 2 > 1 copa/oro > 12 > 11 > 10 > 7 copa/basto > 6 > 5 > 4
    if(card.suit==='espada'&&card.value===1) return 14;
    if(card.suit==='basto'&&card.value===1) return 13;
    if(card.suit==='espada'&&card.value===7) return 12;
    if(card.suit==='oro'&&card.value===7) return 11;
    if(card.value===3) return 10;
    if(card.value===2) return 9;
    if((card.suit==='copa'||card.suit==='oro')&&card.value===1) return 8;
    if(card.value===12) return 7;
    if(card.value===11) return 6;
    if(card.value===10) return 5;
    if((card.suit==='copa'||card.suit==='basto')&&card.value===7) return 4;
    if(card.value===6) return 3;
    if(card.value===5) return 2;
    if(card.value===4) return 1;
    return 0;
}

function finMano() {
    // Si hay un truco aceptado, el equipo que aceptó automáticamente gana la mano
    if (state.truco.aceptado) {
        // Determinar qué equipo aceptó el truco
        // Si el truco lo cantó el equipo enemigo y el jugador lo aceptó, gana el jugador
        // Si el truco lo cantó el equipo player y la IA lo aceptó, gana la IA
        let equipoQueAcepto = 'player'; // Por defecto
        
        // Usar la información de quién cantó el truco
        if (state.truco.quienCanto) {
            if (TEAM_ENEMY.includes(state.truco.quienCanto)) {
                // El enemigo cantó, el player aceptó
                equipoQueAcepto = 'player';
            } else if (TEAM_PLAYER.includes(state.truco.quienCanto)) {
                // El player cantó, el enemigo aceptó
                equipoQueAcepto = 'enemy';
            }
        }
        
        log('¡Truco aceptado! ' + (equipoQueAcepto === 'player' ? 'MORTY+RICK' : 'CÓDIGO+HACKER') + ' gana automáticamente la mano','system');
        
        // Asignar la mano al equipo que aceptó
        if (!state.primeraManoGanada) {
            state.primeraManoGanada = equipoQueAcepto;
            log('Primera mano para '+(equipoQueAcepto==='player'?'MORTY+RICK':'CÓDIGO+HACKER'),'system');
        } else if (!state.segundaManoGanada) {
            state.segundaManoGanada = equipoQueAcepto;
            log('Segunda mano para '+(equipoQueAcepto==='player'?'MORTY+RICK':'CÓDIGO+HACKER'),'system');
            
            // Verificar si hay ventaja de mano
            if (state.primeraManoGanada !== state.segundaManoGanada) {
                state.ventajaMano = state.primeraManoGanada;
                log('¡VENTAJA DE MANO! '+(state.ventajaMano==='player'?'MORTY+RICK':'CÓDIGO+HACKER')+' puede ganar con la tercera mano','system');
            }
        } else {
            state.terceraManoGanada = equipoQueAcepto;
            log('Tercera mano para '+(equipoQueAcepto==='player'?'MORTY+RICK':'CÓDIGO+HACKER'),'system');
        }
    } else {
        // Lógica normal cuando no hay truco aceptado
    let ganadorMano = state.bazasGanadas.player>=2?'player':'enemy';
        
        log('DEBUG: finMano - ganadorMano: ' + ganadorMano + ', truco.level: ' + state.truco.level + ', truco.pendiente: ' + state.truco.pendiente,'system');
    
    // Registrar qué mano ganó cada equipo
    if (!state.primeraManoGanada) {
        state.primeraManoGanada = ganadorMano;
        log('Primera mano para '+(ganadorMano==='player'?'MORTY+RICK':'CÓDIGO+HACKER'),'system');
    } else if (!state.segundaManoGanada) {
        state.segundaManoGanada = ganadorMano;
        log('Segunda mano para '+(ganadorMano==='player'?'MORTY+RICK':'CÓDIGO+HACKER'),'system');
        
        // Verificar si hay ventaja de mano
        if (state.primeraManoGanada !== state.segundaManoGanada) {
            state.ventajaMano = state.primeraManoGanada;
            log('¡VENTAJA DE MANO! '+(state.ventajaMano==='player'?'MORTY+RICK':'CÓDIGO+HACKER')+' puede ganar con la tercera mano','system');
        }
    } else {
        state.terceraManoGanada = ganadorMano;
        log('Tercera mano para '+(ganadorMano==='player'?'MORTY+RICK':'CÓDIGO+HACKER'),'system');
        }
    }
    
    // Verificar si hay ganador de la ronda
    let ganadorRonda = determinarGanadorRonda();
    
    if (ganadorRonda) {
        // Calcular puntos basados en el nivel actual del truco
        let pts = 1; // Puntos por defecto
        if (state.truco.level > 0) {
            pts = TRUCO_POINTS[state.truco.level - 1];
        }
        
        log('DEBUG: Ganador ronda: ' + ganadorRonda + ', puntos: ' + pts + ' (level: ' + state.truco.level + ')','system');
        state.teamScore[ganadorRonda] = (state.teamScore[ganadorRonda]||0) + (pts||1);
        log('Ronda para '+(ganadorRonda==='player'?'MORTY+RICK':'CÓDIGO+HACKER')+` (+${pts})`,'system');
        
        if(state.teamScore[ganadorRonda]>=15) return finPartida(ganadorRonda);
        
        // Control de manos: sumar una victoria por ronda
        if(!state.manosGanadas) state.manosGanadas = { player:0, enemy:0 };
        state.manosGanadas[ganadorRonda] = (state.manosGanadas[ganadorRonda]||0) + 1;
        log('Manos ganadas - MORTY+RICK: ' + state.manosGanadas.player + ', CÓDIGO+HACKER: ' + state.manosGanadas.enemy,'system');
        
        // --- Transición automática de sala después de 5 manos jugadas ---
        let totalManos = (state.manosGanadas.player||0) + (state.manosGanadas.enemy||0);
        if(totalManos >= 5) {
            log('Se jugaron 5 manos. Pasando automáticamente a la siguiente sala...','system');
            fetch('/Home/CompleteGameStart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }).then(response => response.json())
              .then(data => {
                if (data.success) {
                    setTimeout(() => {
                        window.location.href = "/Home/Room2";
                    }, 2000);
                } else {
                    log('Error en la transición de sala. Redirigiendo de todas formas...','system');
                    setTimeout(() => {
                        window.location.href = "/Home/Room2";
                    }, 2000);
                }
            })
            .catch(error => {
                log('Error de red en la transición. Redirigiendo de todas formas...','system');
                setTimeout(() => {
                    window.location.href = "/Home/Room2";
                }, 2000);
            });
            return;
        }
        
        // Verificar si un equipo gana 3 manos
        if(state.manosGanadas[ganadorRonda]>=3) {
            if(ganadorRonda==='player') {
                log('¡MORTY+RICK ganó 3 manos! ¡VICTORIA!','system');
                animacionVictoria();
            } else {
                log('¡CÓDIGO+HACKER ganó 3 manos! ¡DERROTA!','system');
                animacionDerrota();
            }
            return;
        }
        
        // Limpiar el estado del truco antes de nueva mano
        state.truco = { level:0, quien:null, pendiente:false, aceptado:false, quienCanto:null };
        setTimeout(()=>nuevaMano(),2000);
    } else {
        // Si no hay ganador, continuar con la siguiente mano
        setTimeout(()=>nuevaMano(),2000);
    }
}

function determinarGanadorRonda() {
    // Si un equipo ganó las dos primeras manos, gana la ronda
    if (state.primeraManoGanada && state.segundaManoGanada && state.primeraManoGanada === state.segundaManoGanada) {
        return state.primeraManoGanada;
    }
    
    // Si hay ventaja de mano (ganó primera, perdió segunda)
    if (state.primeraManoGanada && state.segundaManoGanada && state.primeraManoGanada !== state.segundaManoGanada) {
        // El equipo que ganó la primera tiene ventaja de mano
        state.ventajaMano = state.primeraManoGanada;
        return null; // No hay ganador aún, se juega la tercera mano
    }
    
    // Si se jugó la tercera mano y hay ventaja de mano
    if (state.terceraManoGanada && state.ventajaMano) {
        if (state.terceraManoGanada === state.ventajaMano) {
            return state.ventajaMano; // El equipo con ventaja ganó la tercera
        } else {
            return state.terceraManoGanada; // El otro equipo ganó la tercera
        }
    }
    
    return null; // No hay ganador aún
}

function nuevaMano() {
    state.round++;
    state.bazasGanadas = { player:0, enemy:0 };
    state.played = [];
    state.truco = { level:0, quien:null, pendiente:false, aceptado:false, quienCanto:null };
    state.envido = { cantos:[], quien:null, pendiente:false, valores:{} };
    state.mazo = false;
    envidoBloqueado = false;
    // Resetear variables de ventaja de mano
    state.primeraManoGanada = null;
    state.segundaManoGanada = null;
    state.terceraManoGanada = null;
    state.ventajaMano = null;
    // Resetear variables de mazo
    state.mazoPendiente = { player: false, morty: false, codigo: false, hacker: false };
    state.mazoEquipo = null;
    // Resetear revelación de cartas
    resetearRevelacionCarta();
    // Resetear envido resuelto
    state.envidoResuelto = false;
    repartir();
    state.turn = (state.mano+1)%4;
    state.mano = state.turn;
    state.pie = (state.mano+3)%4;
    state.turnPlayer = PLAYER_ORDER[state.turn];
    log('Nuevas cartas repartidas. Turno: ' + nombre(state.turnPlayer), 'system');
    render();
    if(state.turnPlayer!=='player') setTimeout(()=>iaTurno(),1700);
}

function finPartida(win) {
    log(win==='player'?'¡GANASTE!':'Perdiste...','system');
    setTimeout(()=>window.location.reload(),4000);
}

function iaTurno() {
    let p = state.turnPlayer;
    
    log('DEBUG: iaTurno - turnPlayer: ' + p + ', mazoEquipo: ' + state.mazoEquipo + ', mazoPendiente: ' + JSON.stringify(state.mazoPendiente),'system');
    
    // Verificar mazo pendiente del equipo enemigo
    if (state.mazoEquipo === 'enemy') {
        log('DEBUG: Verificando mazo pendiente del equipo enemigo','system');
        if (p === 'codigo' && state.mazoPendiente.hacker) {
            log('DEBUG: CÓDIGO.EXE debe responder al mazo de HACKER.EXE','system');
            // Código debe decidir si está de acuerdo con Hacker
            let codigoTieneBuenaMano = tieneManoBuenaParaTruco(state.hands.codigo);
            let codigoTieneBuenEnvido = calcularEnvido(state.hands.codigo) >= 25;
            
            if (!codigoTieneBuenaMano && !codigoTieneBuenEnvido && Math.random() < 0.8) {
                // Código está de acuerdo con irse al mazo
                state.mazoPendiente.codigo = true;
                log('CÓDIGO.EXE: "Estoy de acuerdo, nos vamos al mazo"','enemy');
                log('¡CÓDIGO.EXE y HACKER.EXE se van al mazo!','system');
                let pts = state.truco.level?TRUCO_POINTS[state.truco.level-1]:1;
                state.teamScore['player']+=pts;
                log('+'+pts+' puntos para MORTY+RICK por mazo del equipo contrario','system');
                log('Repartiendo nuevas cartas...','system');
                setTimeout(()=>nuevaMano(),2000);
                return;
            } else {
                log('CÓDIGO.EXE: "No estoy de acuerdo, continuamos jugando"','enemy');
                log('CÓDIGO.EXE no está de acuerdo. Continúa el juego.','system');
                log('NO SE FUERON AL MAZO PORQUE CÓDIGO.EXE NO ESTUVO DE ACUERDO.','system');
                state.mazoPendiente.hacker = false;
                state.mazoEquipo = null;
                render();
            }
        } else if (p === 'hacker' && state.mazoPendiente.codigo) {
            log('DEBUG: HACKER.EXE debe responder al mazo de CÓDIGO.EXE','system');
            // Hacker debe decidir si está de acuerdo con Código
            let hackerTieneBuenaMano = tieneManoBuenaParaTruco(state.hands.hacker);
            let hackerTieneBuenEnvido = calcularEnvido(state.hands.hacker) >= 25;
            
            if (!hackerTieneBuenaMano && !hackerTieneBuenEnvido && Math.random() < 0.8) {
                // Hacker está de acuerdo con irse al mazo
                state.mazoPendiente.hacker = true;
                log('HACKER.EXE: "Estoy de acuerdo, nos vamos al mazo"','enemy');
                log('¡CÓDIGO.EXE y HACKER.EXE se van al mazo!','system');
                let pts = state.truco.level?TRUCO_POINTS[state.truco.level-1]:1;
                state.teamScore['player']+=pts;
                log('+'+pts+' puntos para MORTY+RICK por mazo del equipo contrario','system');
                log('Repartiendo nuevas cartas...','system');
                setTimeout(()=>nuevaMano(),2000);
                return;
            } else {
                log('HACKER.EXE: "No estoy de acuerdo, continuamos jugando"','enemy');
                log('HACKER.EXE no está de acuerdo. Continúa el juego.','system');
                log('NO SE FUERON AL MAZO PORQUE HACKER.EXE NO ESTUVO DE ACUERDO.','system');
                state.mazoPendiente.codigo = false;
                state.mazoEquipo = null;
                render();
            }
        }
    }
    
    // Verificar mazo pendiente del equipo player
    if (state.mazoEquipo === 'player') {
        if (state.mazoPendiente.player && !state.mazoPendiente.morty && p === 'morty') {
        // Rick debe decidir automáticamente basado en su mano
        let rickTieneBuenaMano = tieneManoBuenaParaTruco(state.hands.morty);
        let rickTieneBuenEnvido = calcularEnvido(state.hands.morty) >= 25;
        
        if (!rickTieneBuenaMano && !rickTieneBuenEnvido && Math.random() < 0.8) {
                // Rick está de acuerdo con irse al mazo
            state.mazoPendiente.morty = true;
                log('RICK.EXE: "Estoy de acuerdo, nos vamos al mazo"','enemy');
                log('¡MORTY.EXE y RICK.EXE se van al mazo!','system');
            let pts = state.truco.level?TRUCO_POINTS[state.truco.level-1]:1;
            state.teamScore['enemy']+=pts;
                log('+'+pts+' puntos para CÓDIGO+HACKER por mazo del equipo contrario','system');
                log('Repartiendo nuevas cartas...','system');
            setTimeout(()=>nuevaMano(),2000);
            return;
        } else {
                log('RICK.EXE: "No estoy de acuerdo, continuamos jugando"','enemy');
            log('RICK.EXE no está de acuerdo. Continúa el juego.','system');
            state.mazoPendiente.player = false;
            state.mazoEquipo = null;
            render();
                // Continuar con el juego normal
                turnoSiguiente();
                return;
            }
        } else if (state.mazoPendiente.morty && !state.mazoPendiente.player && p === 'player') {
            // Morty debe decidir automáticamente basado en su mano
            let mortyTieneBuenaMano = tieneManoBuenaParaTruco(state.hands.player);
            let mortyTieneBuenEnvido = calcularEnvido(state.hands.player) >= 25;
            
            if (!mortyTieneBuenaMano && !mortyTieneBuenEnvido && Math.random() < 0.8) {
                // Morty está de acuerdo con irse al mazo
                state.mazoPendiente.player = true;
                log('MORTY.EXE: "Estoy de acuerdo, nos vamos al mazo"','player');
                log('¡MORTY.EXE y RICK.EXE se van al mazo!','system');
            let pts = state.truco.level?TRUCO_POINTS[state.truco.level-1]:1;
                state.teamScore['enemy']+=pts;
                log('+'+pts+' puntos para CÓDIGO+HACKER por mazo del equipo contrario','system');
                log('Repartiendo nuevas cartas...','system');
            setTimeout(()=>nuevaMano(),2000);
            return;
        } else {
                log('MORTY.EXE: "No estoy de acuerdo, continuamos jugando"','player');
                log('MORTY.EXE no está de acuerdo. Continúa el juego.','system');
                state.mazoPendiente.morty = false;
            state.mazoEquipo = null;
            render();
                // Continuar con el juego normal
                turnoSiguiente();
                return;
            }
        }
    }
    
    // Si hay truco pendiente, responder al truco
    if (state.truco.pendiente) {
        iaTrucoRespuesta();
        return;
    }
    
    // Si hay envido pendiente, responder al envido
    if (state.envido.pendiente) {
        // Solo responder si es el turno de la IA y el envido lo cantó el jugador
        if (TEAM_ENEMY.includes(state.turnPlayer) && TEAM_PLAYER.includes(state.envido.quien)) {
            setTimeout(() => iaEnvidoRespuesta(), 1700);
            return;
        }
    }
    
    // IA más inteligente: evaluar si debe cantar
    if (esPie(p) && !state.played.some(play => play.player === p)) {
        // Evaluar si debe cantar Envido
        let envidoValor = calcularEnvido(state.hands[p]);
        if (envidoValor >= 27 && Math.random() < 0.7) {
            // Cantar Envido solo si tiene buen envido
            setTimeout(() => {
                if (!state.envido.pendiente && !state.truco.pendiente) {
                    envidoSecuencia = ['envido'];
                    state.envido.pendiente = true;
                    state.envido.quien = p;
                    log(nombre(p)+' canta Envido','enemy');
                    chatMessages.push({ sender: '*Narrador*', avatar: '', text: `*${nombre(p)} canta Envido*`, narrator: true });
                    // PASAR TURNO AL PLAYER
                    state.turn = PLAYER_ORDER.indexOf('player');
                    state.turnPlayer = 'player';
                    render();
                    renderChat();
                    return;
                }
            }, 500);
            return;
        }
        
        // Evaluar si debe cantar Truco
        if (tieneManoBuenaParaTruco(state.hands[p]) && Math.random() < 0.6) {
            setTimeout(() => {
                if (!state.truco.pendiente && !state.envido.pendiente) {
                    state.truco.level++;
                    state.truco.pendiente = true;
                    state.truco.quien = p;
                    state.truco.quienCanto = p;
                    log(nombre(p)+' canta '+['Truco','Retruco','Vale Cuatro'][state.truco.level-1],'enemy');
                    chatMessages.push({ sender: '*Narrador*', avatar: '', text: `*${nombre(p)} canta ${['Truco','Retruco','Vale Cuatro'][state.truco.level-1]}*`, narrator: true });
                    render();
                    renderChat();
                    // No llamar automáticamente a iaTrucoRespuesta, esperar respuesta del jugador
                    return;
                }
            }, 500);
            return;
        }
        
        // Evaluar si debe irse al mazo (solo si tiene mala mano)
        if (!tieneManoBuenaParaTruco(state.hands[p]) && Math.random() < 0.3) {
            if (p === 'codigo') {
                state.mazoPendiente.codigo = true;
                state.mazoEquipo = 'enemy';
                log('CÓDIGO.EXE quiere irse al mazo. Esperando acuerdo de HACKER.EXE...','enemy');
                render();
                // Continuar al siguiente turno para que HACKER.EXE pueda responder
                turnoSiguiente();
                return;
            } else if (p === 'hacker') {
                state.mazoPendiente.hacker = true;
                state.mazoEquipo = 'enemy';
                log('HACKER.EXE quiere irse al mazo. Esperando acuerdo de CÓDIGO.EXE...','enemy');
                render();
                // Continuar al siguiente turno para que CÓDIGO.EXE pueda responder
                turnoSiguiente();
                return;
            }
        }
    }
    
    // Jugar carta
    let idx = 0;
    if(state.hands[p].length>1) idx = Math.floor(Math.random()*state.hands[p].length);
    jugarCarta(idx);
}

function iaTrucoRespuesta() {
    // Determinar quién cantó el Truco
    const quienCanto = state.truco.quien;
    
    log('DEBUG: iaTrucoRespuesta - turnPlayer: ' + state.turnPlayer + ', quienCanto: ' + quienCanto + ', level: ' + state.truco.level,'system');
    
    // Solo responder si es el turno de la IA y hay un canto pendiente
    if (!state.truco.pendiente) {
        log('DEBUG: No hay truco pendiente','system');
        return;
    }
    
    // Si la IA es del mismo equipo que quien cantó, no debe responder
    if ((TEAM_PLAYER.includes(state.turnPlayer) && TEAM_PLAYER.includes(quienCanto)) ||
        (TEAM_ENEMY.includes(state.turnPlayer) && TEAM_ENEMY.includes(quienCanto))) {
        log('DEBUG: IA del mismo equipo, no responde','system');
        return;
    }
    
    // Si el nivel es 3 (Vale Cuatro), la IA solo puede aceptar o rechazar
    if (state.truco.level >= 3) {
        let r = Math.random();
        if(r < 0.5) {
            log('DEBUG: IA acepta el Vale Cuatro','system');
            state.truco.pendiente = false;
            state.truco.aceptado = true;
            log('IA: ¡Quiero!','system');
            render();
            let quienCantoIndex = PLAYER_ORDER.indexOf(quienCanto);
            state.turn = quienCantoIndex;
            state.turnPlayer = PLAYER_ORDER[state.turn];
            state.truco.quien = null;
            render();
            log('Turno: ' + nombre(state.turnPlayer), 'system');
            if(TEAM_PLAYER.includes(state.turnPlayer)) setTimeout(()=>iaTurno(),1700);
        } else {
            log('DEBUG: IA rechaza el Vale Cuatro','system');
            let pts = TRUCO_POINTS[state.truco.level-1] || 3;
            let ganador = TEAM_PLAYER.includes(state.turnPlayer) ? 'enemy' : 'player';
            state.teamScore[ganador] += pts;
            log('No quiero. +' + pts + ' para ' + (ganador==='player'?'MORTY+RICK':'CÓDIGO+HACKER'),'error');
            log('Reiniciando mano por rechazo...','system');
            state.truco.pendiente = false;
            setTimeout(()=>nuevaMano(),2000);
        }
        return;
    }
    // Lógica normal para Truco y Retruco
    let r = Math.random();
    if(r<0.4) {
        log('DEBUG: IA acepta el truco','system');
        state.truco.pendiente = false;
        state.truco.aceptado = true;
        log('IA: ¡Quiero!','system');
        render();
        let quienCantoIndex = PLAYER_ORDER.indexOf(quienCanto);
        state.turn = quienCantoIndex;
        state.turnPlayer = PLAYER_ORDER[state.turn];
        state.truco.quien = null;
        render();
        log('Turno: ' + nombre(state.turnPlayer), 'system');
        if(TEAM_PLAYER.includes(state.turnPlayer)) setTimeout(()=>iaTurno(),1700);
    } else if(r<0.7 && state.truco.level<3) {
        log('DEBUG: IA sube el truco a nivel ' + (state.truco.level + 1),'system');
        if(state.truco.level < 2) { // Solo puede subir hasta Retruco
            state.truco.level++;
            state.truco.pendiente = true;
            state.truco.quien = state.turnPlayer;
            state.truco.quienCanto = state.turnPlayer;
            log('IA: ¡'+['Retruco','Vale Cuatro'][state.truco.level-2]+'!','enemy');
            // Paso el turno al jugador para que pueda responder
            state.turn = PLAYER_ORDER.indexOf('player');
            state.turnPlayer = 'player';
            render();
            return;
        } else if(state.truco.level === 2) { // Si sube a Vale Cuatro
            state.truco.level++;
            state.truco.pendiente = true;
            state.truco.quien = state.turnPlayer;
            state.truco.quienCanto = state.turnPlayer;
            log('IA: ¡Vale Cuatro!','enemy');
            // Paso el turno al jugador para que pueda responder
            state.turn = PLAYER_ORDER.indexOf('player');
            state.turnPlayer = 'player';
            render();
            return;
        }
    } else {
        log('DEBUG: IA rechaza el truco','system');
        let pts = TRUCO_POINTS[state.truco.level-1] || 1;
        let ganador = TEAM_PLAYER.includes(state.turnPlayer) ? 'enemy' : 'player';
        state.teamScore[ganador] += pts;
        log('No quiero. +' + pts + ' para ' + (ganador==='player'?'MORTY+RICK':'CÓDIGO+HACKER'),'error');
        log('Reiniciando mano por rechazo...','system');
        state.truco.pendiente = false;
        setTimeout(()=>nuevaMano(),2000);
    }
}

function animacionVictoria() {
    let overlay = document.getElementById('game-over-overlay');
    let victory = document.getElementById('victory-message');
    overlay.style.display = 'flex';
    victory.style.display = 'block';
    // Desbloquear Room2
    fetch('/Home/CompleteGameStart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }).then(response => response.json())
      .then(data => {
        if (data.success) {
            setTimeout(() => {
                window.location.href = "/Home/Room2";
            }, 2000);
        } else {
            log('Error en la transición de sala. Redirigiendo de todas formas...','system');
            setTimeout(() => {
                window.location.href = "/Home/Room2";
            }, 2000);
        }
    })
    .catch(error => {
        log('Error de red en la transición. Redirigiendo de todas formas...','system');
        setTimeout(() => {
            window.location.href = "/Home/Room2";
        }, 2000);
    });
}


function animacionDerrota() {
    let overlay = document.getElementById('game-over-overlay');
    let defeat = document.getElementById('defeat-message');
    overlay.style.display = 'flex';
    defeat.style.display = 'block';
    setTimeout(()=>{
        // Reiniciar la sala actual
        state = {
            deck: [],
            hands: {},
            played: [],
            turn: 0,
            mano: 0,
            pie: 3,
            scores: { player:0, morty:0, codigo:0, hacker:0 },
            teamScore: { player:0, enemy:0 },
            round: 1,
            bazas: [],
            bazasGanadas: { player:0, enemy:0 },
            truco: { level:0, quien:null, pendiente:false, aceptado:false, quienCanto:null },
            envido: { cantos:[], quien:null, pendiente:false, valores:{} },
            mazo: false,
            winner: null,
            iaThinking: false,
            lock: false,
            manosGanadas: { player:0, enemy:0 },
            // Nuevas variables para ventaja de mano
            primeraManoGanada: null,
            segundaManoGanada: null,
            terceraManoGanada: null,
            ventajaMano: null,
            // Variables para irse al mazo
            mazoPendiente: { player: false, morty: false, codigo: false, hacker: false },
            mazoEquipo: null
        };
        envidoBloqueado = false;
        overlay.style.display = 'none';
        defeat.style.display = 'none';
        iniciarTruco();
    },4000);
}

document.addEventListener('DOMContentLoaded',()=>{
    // Intro máquina de escribir
    const loadingOverlay = document.getElementById('loading-overlay');
    const gameContainer = document.getElementById('game-container');
    if(loadingOverlay && gameContainer) {
        const loadingText = loadingOverlay.querySelector('.loading-text');
        const lines = loadingText.innerHTML.split('<br>');
        loadingText.innerHTML = '';
        let lineIndex = 0, charIndex = 0, skipped = false;
        const typeWriter = () => {
            if (skipped) return;
            if (lineIndex < lines.length) {
                if (charIndex < lines[lineIndex].length) {
                    loadingText.innerHTML += lines[lineIndex][charIndex];
                    charIndex++;
                    setTimeout(typeWriter, 18);
                } else {
                    loadingText.innerHTML += '<br>';
                    lineIndex++;
                    charIndex = 0;
                    setTimeout(typeWriter, 180);
                }
            }
        };
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !skipped) {
                skipped = true;
                loadingOverlay.style.display = 'none';
                gameContainer.style.display = 'flex';
                iniciarTruco();
            }
        });
        typeWriter();
    } else {
        iniciarTruco();
    }
});

function iniciarTruco() {
    repartir();
    state.turn = 0;
    state.mano = 0;
    state.pie = 3;
    state.turnPlayer = PLAYER_ORDER[state.turn];
    render();
    log('¡Truco 2v2 listo!','system');
    if(state.turnPlayer!=='player') setTimeout(()=>iaTurno(),1700);
    
    document.getElementById('btn-mazo').onclick = ()=>{
        // Sistema de irse al mazo que requiere acuerdo del equipo
        if (state.turnPlayer === 'player') {
            state.mazoPendiente.player = true;
            state.mazoEquipo = 'player';
            log('MORTY.EXE quiere irse al mazo. Esperando acuerdo de RICK.EXE...','player');
            chatMessages.push({ sender: '*Narrador*', avatar: '', text: '*Morty quiere irse al mazo*', narrator: true });
            render();
            renderChat();
            // Continuar al siguiente turno para que RICK.EXE responda
            turnoSiguiente();
        } else if (state.turnPlayer === 'morty') {
            state.mazoPendiente.morty = true;
            state.mazoEquipo = 'player';
            log('RICK.EXE quiere irse al mazo. Esperando acuerdo de MORTY.EXE...','player');
            chatMessages.push({ sender: '*Narrador*', avatar: '', text: '*Rick quiere irse al mazo*', narrator: true });
            render();
            renderChat();
            // Continuar al siguiente turno para que MORTY.EXE responda
            turnoSiguiente();
        }
    };
    
    document.getElementById('btn-truco').onclick = ()=>{
        if(state.truco.level<3 && !state.truco.pendiente) {
            state.truco.level = Math.min(state.truco.level+1, 3);
            state.truco.pendiente = true;
            state.truco.quien = state.turnPlayer;
            state.truco.quienCanto = state.turnPlayer;
            log(nombre(state.turnPlayer)+' canta '+['Truco','Retruco','Vale Cuatro'][state.truco.level-1],'player');
            chatMessages.push({ sender: '*Narrador*', avatar: '', text: `*${nombre(state.turnPlayer)} canta ${['Truco','Retruco','Vale Cuatro'][state.truco.level-1]}*`, narrator: true });
            render();
            renderChat();
            turnoSiguiente();
        }
    };
    
    document.getElementById('btn-accept').onclick = ()=>{
        if(state.truco.pendiente && (state.truco.quien==='codigo' || state.truco.quien==='hacker')) {
            state.truco.pendiente = false;
            state.truco.aceptado = true; // Marcar que el truco fue aceptado
            log('¡Quiero!','system');
            log('¡MORTY.EXE aceptó el truco! La mano se juega completa.','system');
            render();
            // Continuar desde el turno del jugador que cantó el truco
            let quienCantoIndex = PLAYER_ORDER.indexOf(state.truco.quien);
            state.turn = quienCantoIndex;
            state.turnPlayer = PLAYER_ORDER[state.turn];
            state.truco.quien = null; // Limpiar quien cantó
            render();
            log('Turno: ' + nombre(state.turnPlayer), 'system');
            // Si es turno de la IA, continuar
            if(TEAM_ENEMY.includes(state.turnPlayer) || state.turnPlayer === 'morty') {
                setTimeout(()=>iaTurno(),1700);
            }
        }
        if(state.envido.pendiente && (state.envido.quien==='codigo' || state.envido.quien==='hacker')) {
            state.envido.pendiente = false;
            resolverEnvido();
        }
    };
    
    document.getElementById('btn-reject').onclick = ()=>{
        if(state.truco.pendiente && (state.truco.quien==='codigo' || state.truco.quien==='hacker')) {
            // El jugador rechaza y se va al mazo
            let pts = state.truco.level?TRUCO_POINTS[state.truco.level-1]:1;
            let ganador = 'enemy';
            state.teamScore[ganador]+=pts;
            log('No quiero. +'+pts+' para CÓDIGO+HACKER','error');
            log('Reiniciando mano por rechazo...','system');
            state.truco.pendiente = false;
            setTimeout(()=>nuevaMano(),2000);
        }
        if(state.envido.pendiente && (state.envido.quien==='codigo' || state.envido.quien==='hacker')) {
            let pts = calcularEnvidoPuntos(false);
            // El equipo que cantó el envido gana los puntos cuando se rechaza
            let equipoGanador = TEAM_PLAYER.includes(state.envido.quien) ? 'player' : 'enemy';
            state.teamScore[equipoGanador] += pts;
            log('No quiero envido. +'+pts+' para '+(equipoGanador==='player'?'MORTY+RICK':'CÓDIGO+HACKER'),'error');
            log('Reiniciando mano por rechazo de envido...','system');
            state.envido.pendiente = false;
            state.envido.quien = null;
            envidoSecuencia = [];
            setTimeout(()=>nuevaMano(),2000);
        }
    };
    
    document.getElementById('btn-envido').onclick = ()=>{
        if(state.envido.pendiente || state.envidoResuelto) return;
        envidoSecuencia = ['envido'];
        state.envido.pendiente = true;
        state.envido.quien = state.turnPlayer;
        log(nombre(state.turnPlayer)+' canta Envido','player');
        chatMessages.push({ sender: '*Narrador*', avatar: '', text: `*${nombre(state.turnPlayer)} canta Envido*`, narrator: true });
        render();
        renderChat();
        turnoSiguiente();
    };
    
    document.getElementById('btn-raise').onclick = ()=>{
        if(state.truco.pendiente && (state.truco.quien==='codigo' || state.truco.quien==='hacker') && state.truco.level<3) {
            // Solo permitir subir si el jugador NO cantó el truco actual y NO fue aceptado
            if (state.truco.quien !== 'player' && state.truco.quien !== 'morty' && !state.truco.aceptado) {
            state.truco.level++;
            state.truco.pendiente = true;
            state.truco.quien = 'player';
                state.truco.quienCanto = 'player'; // Guardar quién cantó
            log('MORTY.EXE canta '+['Retruco','Vale Cuatro'][state.truco.level-2],'player');
            render();
                // Llamar a iaTurno para que la IA responda inmediatamente
                setTimeout(()=>iaTurno(), 1200);
                return;
            }
        }
        // No permitir subir envido si ya se cantó falta envido
        if(state.envido.pendiente && (state.envido.quien==='codigo' || state.envido.quien==='hacker') && !envidoSecuencia.includes('falta envido')) {
            if (!envidoSecuencia.includes('real envido')) {
                envidoSecuencia.push('real envido');
                log('MORTY.EXE canta Real Envido','player');
                    render();
                turnoSiguiente();
            } else if (!envidoSecuencia.includes('falta envido')) {
                envidoSecuencia.push('falta envido');
                log('MORTY.EXE canta Falta Envido','player');
                render();
                turnoSiguiente();
            }
        }
    };
    
    // Agregar botones para subir envido
    document.getElementById('btn-real-envido').onclick = ()=>{
        if(state.envido.pendiente && (state.envido.quien==='codigo' || state.envido.quien==='hacker')) {
            envidoSecuencia.push('real envido');
            log('MORTY.EXE canta Real Envido','player');
            render();
            // PASAR TURNO A LA IA Y RESPONDER
            state.turn = PLAYER_ORDER.indexOf('codigo');
            state.turnPlayer = 'codigo';
            setTimeout(()=>iaEnvidoRespuesta(), 700);
        }
    };
    
    document.getElementById('btn-falta-envido').onclick = ()=>{
        if(state.envido.pendiente && (state.envido.quien==='codigo' || state.envido.quien==='hacker') && envidoSecuencia.length > 0) {
            envidoSecuencia.push('falta envido');
            log('MORTY.EXE canta Falta Envido','player');
            render();
            // PASAR TURNO A LA IA Y RESPONDER
            state.turn = PLAYER_ORDER.indexOf('codigo');
            state.turnPlayer = 'codigo';
            setTimeout(()=>iaEnvidoRespuesta(), 700);
        }
    };
    
    // Event listener para el botón de revelar carta del compañero
    document.getElementById('btn-reveal-companion').onclick = ()=>{
        revelarCartaCompanion();
    };
}

// ENVIDO LOGIC - CORREGIDA
const ENVIDO_CANTOS = ['envido','real envido','falta envido'];
const ENVIDO_PTS = { 'envido':2, 'real envido':3, 'falta envido':null };
let envidoSecuencia = [];
let envidoPendiente = false;
let envidoQuien = null;
let envidoPuntos = 0;

function resetEnvido() {
    envidoSecuencia = [];
    envidoPendiente = false;
    envidoQuien = null;
    envidoPuntos = 0;
    envidoBloqueado = false;
}

function iaEnvidoRespuesta() {
    let r = Math.random();
    log('DEBUG: iaEnvidoRespuesta - turnPlayer: ' + state.turnPlayer + ', quien: ' + state.envido.quien,'system');
    // Opción 1: Aceptar el envido (50% probabilidad)
    if(r<0.5) {
        log('IA: ¡Quiero envido!','enemy');
        state.envido.pendiente = false;
        resolverEnvido();
        return;
    } 
    // Opción 2: Subir a Real Envido (20% probabilidad)
    else if(r<0.7 && !envidoSecuencia.includes('real envido')) {
        envidoSecuencia.push('real envido');
        state.envido.pendiente = true;
        state.envido.quien = state.turnPlayer;
        log('IA: ¡Real Envido!','enemy');
        state.turn = PLAYER_ORDER.indexOf('player');
        state.turnPlayer = 'player';
        render();
        return;
    } 
    // Opción 3: Subir a Falta Envido (10% probabilidad)
    else if(r<0.8 && !envidoSecuencia.includes('falta envido') && envidoSecuencia.length > 0) {
        envidoSecuencia.push('falta envido');
        state.envido.pendiente = true;
        state.envido.quien = state.turnPlayer;
        log('IA: ¡Falta Envido!','enemy');
        state.turn = PLAYER_ORDER.indexOf('player');
        state.turnPlayer = 'player';
        render();
        return;
    } 
    // Opción 4: Rechazar el envido (20% probabilidad)
    else {
        log('IA: No quiero envido','enemy');
        let pts = calcularEnvidoPuntos(false);
        // El equipo que cantó el envido gana los puntos cuando se rechaza
        let equipoGanador = TEAM_PLAYER.includes(state.envido.quien) ? 'player' : 'enemy';
        state.teamScore[equipoGanador] += pts;
        log('+'+pts+' para '+(equipoGanador==='player'?'MORTY+RICK':'CÓDIGO+HACKER'),'error');
        log('Reiniciando mano por rechazo de envido...','system');
        state.envido.pendiente = false;
        state.envido.quien = null;
        envidoSecuencia = [];
        setTimeout(()=>nuevaMano(),2000);
    }
}

function calcularEnvidoPuntos(aceptado=true) {
    let total = 0;
    let falta = 15 - Math.max(state.teamScore.player, state.teamScore.enemy);
    
    for(let canto of envidoSecuencia) {
        if(canto==='envido') total+=2;
        if(canto==='real envido') total+=3;
        if(canto==='falta envido') total=falta;
    }
    
    if(!aceptado) {
        if(envidoSecuencia.length===1) return 1;
        if(envidoSecuencia[envidoSecuencia.length-1]==='envido') return total-2;
        if(envidoSecuencia[envidoSecuencia.length-1]==='real envido') return total-3;
        if(envidoSecuencia[envidoSecuencia.length-1]==='falta envido') return falta-1;
    }
    return total;
}

function resolverEnvido() {
    // Cálculo real de envido
    function envidoValor(mano) {
        let palos = {};
        mano.forEach(c=>{ if(!palos[c.suit]) palos[c.suit]=[]; palos[c.suit].push(c); });
        let max = 0;
        for(let s in palos) if(palos[s].length>=2) {
            let vals = palos[s].map(c=>c.value>=10?0:c.value).sort((a,b)=>b-a);
            max = Math.max(max, vals[0]+vals[1]+20);
        }
        if(max===0) max = Math.max(...mano.map(c=>c.value>=10?0:c.value));
        return max;
    }
    
    let valPlayer = envidoValor(state.hands.player);
    let valMorty = envidoValor(state.hands.morty);
    let valCodigo = envidoValor(state.hands.codigo);
    let valHacker = envidoValor(state.hands.hacker);
    let equipoPlayer = Math.max(valPlayer, valMorty);
    let equipoEnemy = Math.max(valCodigo, valHacker);
    
    // Corregir la lógica del ganador
    let ganador;
    if (equipoPlayer > equipoEnemy) {
        ganador = 'player';
    } else if (equipoEnemy > equipoPlayer) {
        ganador = 'enemy';
    } else {
        // En caso de empate, gana el equipo que cantó el envido
        ganador = TEAM_PLAYER.includes(state.envido.quien) ? 'player' : 'enemy';
    }
    
    // Calcular puntos del envido
    let envidoPuntos = calcularEnvidoPuntos();
    
    // Verificar si es falta envido
    let esFaltaEnvido = envidoSecuencia.includes('falta envido');
    
    if (esFaltaEnvido) {
        // Falta envido = victoria automática
        state.teamScore[ganador] = 15;
        log('FALTA ENVIDO GANADO: '+equipoPlayer+' (MORTY+RICK) vs '+equipoEnemy+' (CÓDIGO+HACKER)','system');
        log('¡VICTORIA AUTOMÁTICA! '+(ganador==='player'?'MORTY+RICK':'CÓDIGO+HACKER')+' gana la partida','system');
        
        if (ganador === 'player') {
            setTimeout(() => animacionVictoria(), 2000);
        } else {
            setTimeout(() => animacionDerrota(), 2000);
        }
        return;
    }
    
    // Envido normal
    state.teamScore[ganador] += envidoPuntos;
    log('Envido: '+equipoPlayer+' (MORTY+RICK) vs '+equipoEnemy+' (CÓDIGO+HACKER)','system');
    log('Gana el envido: '+(ganador==='player'?'MORTY+RICK':'CÓDIGO+HACKER')+` (+${envidoPuntos})`,'system');
    
    // Verificar si alguien ganó con el envido
    if (state.teamScore[ganador] >= 15) {
        if (ganador === 'player') {
            setTimeout(() => animacionVictoria(), 2000);
        } else {
            setTimeout(() => animacionDerrota(), 2000);
        }
        return;
    }
    
    // Resetear envido y continuar la baza (NO reiniciar la mano)
    state.envido.pendiente = false;
    state.envido.quien = null;
    envidoSecuencia = [];
    log('Envido resuelto. Continuando la baza...','system');
    
    // Continuar desde el turno del jugador que cantó el envido
    let quienCantoIndex = PLAYER_ORDER.indexOf(state.envido.quien || 'player');
    state.turn = quienCantoIndex;
    state.turnPlayer = PLAYER_ORDER[state.turn];
    render();
    log('Turno: ' + nombre(state.turnPlayer), 'system');
    
    // Si es turno de la IA, continuar automáticamente
    if(TEAM_ENEMY.includes(state.turnPlayer)) {
        setTimeout(()=>iaTurno(),1700);
    }
    state.envidoResuelto = true;
} 

// FUNCIONES PARA REVELAR CARTA DEL COMPAÑERO
function revelarCartaCompanion() {
    if (!state.puedeRevelar || state.cartaRevelada.morty !== null) {
        return;
    }
    
    // Seleccionar una carta aleatoria de Rick (morty)
    let cartasRick = state.hands.morty;
    if (cartasRick.length === 0) {
        log('RICK.EXE no tiene cartas para revelar', 'system');
        return;
    }
    
    let cartaIndex = Math.floor(Math.random() * cartasRick.length);
    let carta = cartasRick[cartaIndex];
    
    // Marcar la carta como revelada
    state.cartaRevelada.morty = cartaIndex;
    state.puedeRevelar = false;
    
    // Mostrar la carta revelada
    log('MORTY.EXE revela una carta de RICK.EXE: ' + carta.value + ' de ' + carta.suit, 'player');
    
    // Agregar mensaje al chat
    chatMessages.push({ 
        sender: 'MORTY.EXE', 
        avatar: '/img/mortyHacker.png', 
        text: '¡Revelé una carta de Rick! Es el ' + carta.value + ' de ' + carta.suit 
    });
    renderChat();
    
    // Deshabilitar el botón
    document.getElementById('btn-reveal-companion').disabled = true;
    document.getElementById('btn-reveal-companion').textContent = 'CARTA YA REVELADA';
    
    render();
}

function resetearRevelacionCarta() {
    state.cartaRevelada = { morty: null, player: null };
    state.puedeRevelar = true;
    document.getElementById('btn-reveal-companion').disabled = false;
    document.getElementById('btn-reveal-companion').textContent = 'REVELAR CARTA DE RICK';
}