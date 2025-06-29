// TRUCO 2v2 - Rick & Morty Escape Room

const SUITS = ['espada', 'basto', 'oro', 'copa'];
const VALUES = [1,2,3,4,5,6,7,10,11,12];
const SUIT_EMOJI = { espada: '⚔️', basto: '🌿', oro: '🪙', copa: '🍷' };
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
    truco: { level:0, quien:null, pendiente:false },
    envido: { cantos:[], quien:null, pendiente:false, valores:{} },
    mazo: false,
    winner: null,
    iaThinking: false,
    lock: false,
    manosGanadas: null,
    // Nuevas variables para ventaja de mano
    primeraManoGanada: null,
    segundaManoGanada: null,
    terceraManoGanada: null,
    ventajaMano: null,
    // Variables para irse al mazo
    mazoPendiente: { player: false, morty: false, codigo: false, hacker: false },
    mazoEquipo: null
};

let envidoBloqueado = false;

// --- Lógica de chat funcional con IA y narrador ---
const chatMessages = [
  // El chat inicia vacío o solo con el narrador si hay evento real
];

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
  chatMessages.push({ sender: 'Vos', avatar: '/img/mortyHacker.png', text });
  renderChat();
  setTimeout(() => botReply(text), 900);
}

function botReply(playerText) {
  // IA contextual
  let response = '';
  let sender = 'Rick';
  let avatar = '/img/rickHacker.png';
  if (playerText.includes('Truco')) {
    response = '¡Eso, Morty! ¡Mostrales quién manda!';
  } else if (playerText.includes('Envido')) {
    response = '¿Seguro, Morty? No te confíes...';
  } else if (playerText.includes('Mazo')) {
    response = 'A veces hay que saber retirarse, Morty.';
  } else if (playerText.includes('Buen juego')) {
    response = '¡Buena onda, Morty!';
  } else if (playerText.includes('No quiero')) {
    response = '¡Cobarde!'; sender = 'Hacker'; avatar = '/img/hackerRojo.png';
  } else if (playerText.includes('Quiero')) {
    response = '¡Así se juega!'; sender = 'Código'; avatar = '/img/hackerVerde.png';
  } else if (playerText.includes('flor')) {
    response = '¿Flor? ¡Eso no vale acá!'; sender = 'Rick'; avatar = '/img/rickHacker.png';
  } else if (playerText.includes('Te toca')) {
    response = '¡No te hagas el distraído!'; sender = 'Hacker'; avatar = '/img/hackerRojo.png';
  } else if (playerText.includes('Qué mano')) {
    response = '¡Mano difícil, Morty!'; sender = 'Código'; avatar = '/img/hackerVerde.png';
  } else if (playerText.includes('Vamos equipo')) {
    response = '¡Eso, motivación!'; sender = 'Rick'; avatar = '/img/rickHacker.png';
  } else if (playerText.includes('Quién canta')) {
    response = '¡Canto yo!'; sender = 'Hacker'; avatar = '/img/hackerRojo.png';
  } else if (playerText.includes('suerte')) {
    response = 'La suerte es para los débiles.'; sender = 'Código'; avatar = '/img/hackerVerde.png';
  } else if (playerText.includes('no lo puedo creer')) {
    response = '¡Créelo, Morty!'; sender = 'Rick'; avatar = '/img/rickHacker.png';
  } else {
    // Respuesta random de los bots
    const bots = [
      { sender: 'Código', avatar: '/img/hackerVerde.png', frases: ['No te la creas tanto...', '¿Eso es todo?', 'Te va a costar ganar, Morty.'] },
      { sender: 'Hacker', avatar: '/img/hackerRojo.png', frases: ['¿Listo para perder?', 'No vas a poder con nosotros.', '¿Te animás a cantar?'] }
    ];
    const bot = bots[Math.floor(Math.random() * bots.length)];
    sender = bot.sender;
    avatar = bot.avatar;
    response = bot.frases[Math.floor(Math.random() * bot.frases.length)];
  }
  chatMessages.push({ sender, avatar, text: response });
  renderChat();
}

document.addEventListener('DOMContentLoaded', () => {
  renderChat();
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
            if(p==='player') {
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
                           !state.mazo;
    
    // Mostrar botones según el estado del juego
    let hayMazoPendiente = state.mazoEquipo === 'player' && state.mazoPendiente.player && !state.mazoPendiente.morty;
    
    document.getElementById('canto-buttons').style.display = (state.turnPlayer==='player'&&!state.truco.pendiente&&!state.envido.pendiente&&!state.mazo&&!hayMazoPendiente)?'flex':'none';
    document.getElementById('mazo-buttons').style.display = (state.turnPlayer==='player'&&!state.mazo&&!hayMazoPendiente)?'flex':'none';
    
    // Mostrar botones de respuesta SOLO si el jugador debe responder a un canto de la IA rival
    let showResponse = false;
    if (state.truco.pendiente) {
        // Si el canto pendiente NO lo hizo el jugador ni su compañero
        if (TEAM_ENEMY.includes(state.truco.quien)) {
            showResponse = true;
        }
    } else if (state.envido.pendiente) {
        if (TEAM_ENEMY.includes(state.envido.quien)) {
            showResponse = true;
        }
    }
    document.getElementById('response-buttons').style.display = showResponse ? 'flex' : 'none';
    
    document.getElementById('btn-envido').disabled = !puedeCantarEnvido;
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
    if(TEAM_ENEMY.includes(state.turnPlayer)||state.turnPlayer==='morty') setTimeout(()=>iaTurno(),1700);
}

function jugarCarta(idx) {
    if(state.lock) return;
    let p = state.turnPlayer;
    let carta = state.hands[p][idx];
    state.hands[p].splice(idx,1);
    state.played.push({player:p,card:carta});
    if(p==='player') envidoBloqueado = true;
    render();
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
    state.played = [];
    
    // Verificar si se completó una mano
    if(state.bazasGanadas.player===2||state.bazasGanadas.enemy===2) {
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
    let ganadorMano = state.bazasGanadas.player>=2?'player':'enemy';
    
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
    
    // Verificar si hay ganador de la ronda
    let ganadorRonda = determinarGanadorRonda();
    
    if (ganadorRonda) {
        let pts = state.truco.level?TRUCO_POINTS[state.truco.level]:1;
        state.teamScore[ganadorRonda]+=pts;
        log('Ronda para '+(ganadorRonda==='player'?'MORTY+RICK':'CÓDIGO+HACKER')+` (+${pts})`,'system');
        
        if(state.teamScore[ganadorRonda]>=15) return finPartida(ganadorRonda);
        
        // Control de manos: solo sumar una victoria por ronda
        if(!state.manosGanadas) state.manosGanadas = { player:0, enemy:0 };
        state.manosGanadas[ganadorRonda]++;
        if(state.manosGanadas[ganadorRonda]===2) {
            if(ganadorRonda==='player') animacionVictoria();
            else animacionDerrota();
            return;
        }
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
    state.truco = { level:0, quien:null, pendiente:false };
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
    repartir();
    state.turn = (state.mano+1)%4;
    state.mano = state.turn;
    state.pie = (state.mano+3)%4;
    state.turnPlayer = PLAYER_ORDER[state.turn];
    render();
    if(state.turnPlayer!=='player') setTimeout(()=>iaTurno(),1700);
}

function finPartida(win) {
    log(win==='player'?'¡GANASTE!':'Perdiste...','system');
    setTimeout(()=>window.location.reload(),4000);
}

function iaTurno() {
    if(state.lock) return;
    let p = state.turnPlayer;
    
    // Verificar si hay mazo pendiente del equipo player
    if (state.mazoEquipo === 'player' && state.mazoPendiente.player && !state.mazoPendiente.morty) {
        // Rick debe decidir automáticamente basado en su mano
        let rickTieneBuenaMano = tieneManoBuenaParaTruco(state.hands.morty);
        let rickTieneBuenEnvido = calcularEnvido(state.hands.morty) >= 25;
        
        if (!rickTieneBuenaMano && !rickTieneBuenEnvido && Math.random() < 0.8) {
            // Rick está de acuerdo con irse al mazo si tiene mala mano
            state.mazoPendiente.morty = true;
            log('RICK.EXE está de acuerdo. MORTY+RICK se van al mazo.','system');
            let pts = state.truco.level?TRUCO_POINTS[state.truco.level-1]:1;
            state.teamScore['enemy']+=pts;
            log('+'+pts+' para CÓDIGO+HACKER','error');
            setTimeout(()=>nuevaMano(),2000);
            return;
        } else {
            log('RICK.EXE no está de acuerdo. Continúa el juego.','system');
            state.mazoPendiente.player = false;
            state.mazoEquipo = null;
            render();
        }
    }
    
    // Verificar si hay mazo pendiente del equipo enemy
    if (state.mazoEquipo === 'enemy' && state.mazoPendiente.codigo && !state.mazoPendiente.hacker) {
        // Hacker debe decidir automáticamente basado en su mano
        let hackerTieneBuenaMano = tieneManoBuenaParaTruco(state.hands.hacker);
        let hackerTieneBuenEnvido = calcularEnvido(state.hands.hacker) >= 25;
        
        if (!hackerTieneBuenaMano && !hackerTieneBuenEnvido && Math.random() < 0.8) {
            // Hacker está de acuerdo con irse al mazo si tiene mala mano
            state.mazoPendiente.hacker = true;
            log('HACKER.EXE está de acuerdo. CÓDIGO+HACKER se van al mazo.','system');
            let pts = state.truco.level?TRUCO_POINTS[state.truco.level-1]:1;
            state.teamScore['player']+=pts;
            log('+'+pts+' para MORTY+RICK','error');
            setTimeout(()=>nuevaMano(),2000);
            return;
        } else {
            log('HACKER.EXE no está de acuerdo. Continúa el juego.','system');
            state.mazoPendiente.codigo = false;
            state.mazoEquipo = null;
            render();
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
                    render();
                    renderChat();
                    setTimeout(() => iaEnvidoRespuesta(), 1200);
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
                    log(nombre(p)+' canta '+['Truco','Retruco','Vale Cuatro'][state.truco.level-1],'enemy');
                    chatMessages.push({ sender: '*Narrador*', avatar: '', text: `*${nombre(p)} canta ${['Truco','Retruco','Vale Cuatro'][state.truco.level-1]}*`, narrator: true });
                    render();
                    renderChat();
                    setTimeout(() => iaTrucoRespuesta(), 1200);
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
                return;
            } else if (p === 'hacker') {
                state.mazoPendiente.hacker = true;
                state.mazoEquipo = 'enemy';
                log('HACKER.EXE quiere irse al mazo. Esperando acuerdo de CÓDIGO.EXE...','enemy');
                render();
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
    // Si la IA es del mismo equipo que quien cantó, no debe responder
    if ((TEAM_PLAYER.includes(state.turnPlayer) && TEAM_PLAYER.includes(quienCanto)) ||
        (TEAM_ENEMY.includes(state.turnPlayer) && TEAM_ENEMY.includes(quienCanto))) {
        // No responde, espera al rival
        return;
    }
    let r = Math.random();
    // IA más realista: puede rechazar truco
    if(r<0.4) {
        state.truco.pendiente = false;
        log('IA: ¡Quiero!','system');
        render();
    } else if(r<0.7 && state.truco.level<3) {
        state.truco.level++;
        state.truco.pendiente = true;
        state.truco.quien = state.turnPlayer;
        log('IA: ¡'+['Retruco','Vale Cuatro'][state.truco.level-2]+'!','enemy');
        render();
    } else {
        // IA rechaza y se va al mazo
        let pts = state.truco.level?TRUCO_POINTS[state.truco.level-1]:1;
        let equipoGanador = TEAM_PLAYER.includes(state.turnPlayer) ? 'enemy' : 'player';
        state.teamScore[equipoGanador]+=pts;
        log('IA: No quiero. +'+pts+' para '+(equipoGanador==='enemy'?'CÓDIGO+HACKER':'MORTY+RICK'),'error');
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
        }
    });
}


function animacionDerrota() {
    let overlay = document.getElementById('game-over-overlay');
    let defeat = document.getElementById('defeat-message');
    overlay.style.display = 'flex';
    defeat.style.display = 'block';
    setTimeout(()=>window.location.reload(),4000);
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
            if (e.code === 'Space') {
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
        } else if (state.turnPlayer === 'morty') {
            state.mazoPendiente.morty = true;
            state.mazoEquipo = 'player';
            log('RICK.EXE quiere irse al mazo. Esperando acuerdo de MORTY.EXE...','player');
            chatMessages.push({ sender: '*Narrador*', avatar: '', text: '*Rick quiere irse al mazo*', narrator: true });
            render();
            renderChat();
        }
        
        // Verificar si todo el equipo está de acuerdo
        if (state.mazoEquipo === 'player' && state.mazoPendiente.player && state.mazoPendiente.morty) {
            let pts = state.truco.level?TRUCO_POINTS[state.truco.level-1]:1;
            state.teamScore['enemy']+=pts;
            log('MORTY+RICK se van al mazo. +'+pts+' para CÓDIGO+HACKER','error');
            setTimeout(()=>nuevaMano(),2000);
        }
    };
    
    document.getElementById('btn-truco').onclick = ()=>{
        if(state.truco.level<3 && !state.truco.pendiente) {
            state.truco.level++;
            state.truco.pendiente = true;
            state.truco.quien = state.turnPlayer;
            log(nombre(state.turnPlayer)+' canta '+['Truco','Retruco','Vale Cuatro'][state.truco.level-1],'player');
            chatMessages.push({ sender: '*Narrador*', avatar: '', text: `*${nombre(state.turnPlayer)} canta ${['Truco','Retruco','Vale Cuatro'][state.truco.level-1]}*`, narrator: true });
            render();
            renderChat();
            // Si el jugador cantó, la IA rival responde automáticamente
            if(state.turnPlayer==='player') {
                setTimeout(()=>iaTrucoRespuesta(), 1200);
            }
        }
    };
    
    document.getElementById('btn-accept').onclick = ()=>{
        if(state.truco.pendiente && state.truco.quien==='ia') {
            state.truco.pendiente = false;
            log('¡Quiero!','system');
            render();
        }
        if(state.envido.pendiente && state.envido.quien!=='player') {
            state.envido.pendiente = false;
            resolverEnvido();
        }
    };
    
    document.getElementById('btn-reject').onclick = ()=>{
        if(state.truco.pendiente && state.truco.quien==='ia') {
            // El jugador rechaza y se va al mazo
            let pts = state.truco.level?TRUCO_POINTS[state.truco.level-1]:1;
            let ganador = 'enemy';
            state.teamScore[ganador]+=pts;
            log('No quiero. +'+pts+' para CÓDIGO+HACKER','error');
            state.truco.pendiente = false;
            setTimeout(()=>nuevaMano(),2000);
        }
        if(state.envido.pendiente && state.envido.quien!=='player') {
            let quien = TEAM_PLAYER.includes(state.envido.quien)?'player':'enemy';
            state.teamScore[quien] += 1;
            log('No quiero envido. +1 para '+(quien==='player'?'MORTY+RICK':'CÓDIGO+HACKER'),'error');
            state.envido.pendiente = false;
            setTimeout(()=>nuevaMano(),2000);
        }
    };
    
    document.getElementById('btn-envido').onclick = ()=>{
        if(state.envido.pendiente) return;
        envidoSecuencia = ['envido'];
        state.envido.pendiente = true;
        state.envido.quien = state.turnPlayer;
        log(nombre(state.turnPlayer)+' canta Envido','player');
        chatMessages.push({ sender: '*Narrador*', avatar: '', text: `*${nombre(state.turnPlayer)} canta Envido*`, narrator: true });
        render();
        renderChat();
        // Si el jugador cantó, la IA rival responde automáticamente
        if(state.turnPlayer==='player') {
            setTimeout(()=>iaEnvidoRespuesta(),1200);
        }
    };
    
    document.getElementById('btn-raise').onclick = ()=>{
        if(state.truco.pendiente && state.truco.quien==='ia' && state.truco.level<3) {
            state.truco.level++;
            state.truco.pendiente = true;
            state.truco.quien = 'player';
            log('MORTY.EXE canta '+['Retruco','Vale Cuatro'][state.truco.level-2],'player');
            render();
            setTimeout(()=>{
                let r = Math.random();
                if(r<0.4) {
                    state.truco.pendiente = false;
                    log('IA: ¡Quiero!','system');
                    render();
                } else {
                    let pts = state.truco.level?TRUCO_POINTS[state.truco.level-1]:1;
                    state.teamScore['player']+=pts;
                    log('IA: No quiero. +'+pts+' para MORTY+RICK','error');
                    state.truco.pendiente = false;
                    setTimeout(()=>nuevaMano(),2000);
                }
            }, 1200);
        }
    };
    
    // Agregar botones para subir envido
    document.getElementById('btn-real-envido').onclick = ()=>{
        if(state.envido.pendiente && state.envido.quien!=='player') {
            envidoSecuencia.push('real envido');
            log('MORTY.EXE canta Real Envido','player');
            render();
            setTimeout(()=>iaEnvidoRespuesta(),1200);
        }
    };
    
    document.getElementById('btn-falta-envido').onclick = ()=>{
        if(state.envido.pendiente && state.envido.quien!=='player' && envidoSecuencia.length > 0) {
            envidoSecuencia.push('falta envido');
            log('MORTY.EXE canta Falta Envido','player');
            render();
            setTimeout(()=>iaEnvidoRespuesta(),1200);
        }
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
    if(r<0.5) {
        envidoPendiente = false;
        envidoPuntos = calcularEnvidoPuntos();
        resolverEnvido();
    } else if(r<0.7 && !envidoSecuencia.includes('real envido')) {
        envidoSecuencia.push('real envido');
        envidoPendiente = true;
        envidoQuien = 'ia';
        log('IA: Real Envido','enemy');
        render();
    } else if(!envidoSecuencia.includes('falta envido') && envidoSecuencia.length > 0) {
        // Solo puede cantar falta envido si ya hay envido en la secuencia
        envidoSecuencia.push('falta envido');
        envidoPendiente = true;
        envidoQuien = 'ia';
        log('IA: Falta Envido','enemy');
        render();
    } else {
        envidoPendiente = false;
        envidoPuntos = calcularEnvidoPuntos();
        resolverEnvido();
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
    let ganador = equipoPlayer>equipoEnemy?'player':(equipoEnemy>equipoPlayer?'enemy':'player');
    
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
    
    resetEnvido();
    setTimeout(()=>nuevaMano(),2000);
} 