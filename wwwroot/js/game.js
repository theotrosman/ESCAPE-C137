// Configuración del canvas y contexto
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const statusDiv = document.getElementById('status');
const scoreSpan = document.getElementById('score');
const gameTitle = document.getElementById('gameTitle');
const startMessage = document.getElementById('startMessage');

// Variables globales
let handpose;
let video;
let handCanvas;
let handCtx;
let lastHandOpen = false;
let isHandposeLoaded = false;
let isGameRunning = false;
let score = 0;
let lastPipeSpawn = 0;
let particles = [];
let bird = null;
let pipes = [];
let PIPE_SPEED = 4;
let speedInterval = null;
let isVictoryAnimation = false;
let gameStarted = false;
let waitingForHandOpen = true;
let handWasOpen = false;
let introSetupDone = false;

// Configuración del juego
const GRAVITY = 0.5;
const LIFT_FORCE = -20;
const PIPE_SPAWN_INTERVAL = 1700;
const MAX_VELOCITY = 6;

// Ajustar tamaño del canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Hacer la nave más grande (30% más grande que antes)
const BIRD_SIZE = Math.min(canvas.width, canvas.height) * 0.06;
const PIPE_WIDTH = Math.min(canvas.width, canvas.height) * 0.08;
const PIPE_GAP = Math.min(canvas.width, canvas.height) * 0.3;

// Cargar imágenes
const birdImg = new Image();
birdImg.src = '/img/rickNave.png';

const PIPE_IMG = new Image();
PIPE_IMG.src = '/img/PortalRojo.png';

// Cambiar fondo del juego a fondofloppybird.png
const gameBgImg = new Image();
gameBgImg.src = '/img/fondofloppybird.png';
let alwaysShowGameBg = true;

// Clase Bird
class Bird {
    constructor() {
        this.x = 220;
        this.y = canvas.height / 2;
        this.velocity = 0;
        this.rotation = 0;
        this.scale = 1;
        this.speedX = 0;
        this.jumpQueued = false;
        this.wantJump = false;
    }

    move() {
        this.x += this.speedX;
        if (this.x > canvas.width * 0.7) this.x = canvas.width * 0.7;

        // Si se quiere saltar (mano abierta), salta cada frame mientras esté abierta
        if (this.wantJump) {
            this.velocity = LIFT_FORCE;
        } else {
            this.velocity += GRAVITY;
        }
        this.wantJump = false; // Se setea en updateGameState según la mano

        // Limitar la velocidad máxima
        this.velocity = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, this.velocity));
        this.y += this.velocity;
        this.rotation = this.velocity * 5;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.drawImage(birdImg, -BIRD_SIZE, -BIRD_SIZE, BIRD_SIZE * 2, BIRD_SIZE * 2);
        ctx.restore();
    }

    getBounds() {
        // Hitbox aún más pequeña y centrada
        return {
            x: this.x - BIRD_SIZE * 0.28,
            y: this.y - BIRD_SIZE * 0.28,
            width: BIRD_SIZE * 0.56,
            height: BIRD_SIZE * 0.56
        };
    }
}

// Clase Pipe
class Pipe {
    constructor() {
        this.x = canvas.width;
        this.rams = [];
        // Definir un hueco vertical pasable
        const minGap = PIPE_GAP * 0.7;
        const gapY = Math.random() * (canvas.height - minGap * 1.5) + minGap * 0.75;
        const gapHeight = minGap + Math.random() * (PIPE_GAP * 0.5);
        // Generar RAMs arriba del hueco (la mitad de densidad y más separados)
        let y = 0;
        while (y < gapY - 10) {
            if (Math.random() < 0.25) { // Antes 0.5, ahora 0.25 para la mitad de rams
                const ramHeight = Math.max(PIPE_WIDTH * 0.7, Math.random() * PIPE_WIDTH * 1.2);
                this.rams.push({
                    x: this.x,
                    y: y,
                    width: PIPE_WIDTH * (0.7 + Math.random() * 0.6),
                    height: ramHeight
                });
            }
            y += (PIPE_WIDTH * 1.2 + Math.random() * PIPE_WIDTH * 1.2) + 20; // Más separación vertical
        }
        // Generar RAMs debajo del hueco (la mitad de densidad y más separados)
        y = gapY + gapHeight;
        while (y < canvas.height - 10) {
            if (Math.random() < 0.25) {
                const ramHeight = Math.max(PIPE_WIDTH * 0.7, Math.random() * PIPE_WIDTH * 1.2);
                this.rams.push({
                    x: this.x,
                    y: y,
                    width: PIPE_WIDTH * (0.7 + Math.random() * 0.6),
                    height: ramHeight
                });
            }
            y += (PIPE_WIDTH * 1.2 + Math.random() * PIPE_WIDTH * 1.2) + 20;
        }
        this.passed = false;
        this.scored = false;
    }

    update() {
        this.x -= PIPE_SPEED;
        this.rams.forEach(ram => { ram.x = this.x; });
    }

    draw() {
        const scale = 1.15;
        const drawWidth = PIPE_WIDTH * scale;
        const drawHeightTop = this.rams[0].height * scale;
        const drawHeightBottom = this.rams[this.rams.length - 1].height * scale;
        const offsetX = (drawWidth - PIPE_WIDTH) / 2;
        // Dibuja el obstáculo usando la nueva imagen, centrado
        ctx.drawImage(PIPE_IMG, this.x - offsetX, this.rams[0].y - (drawHeightTop - this.rams[0].height), drawWidth, drawHeightTop);
        ctx.drawImage(PIPE_IMG, this.x - offsetX, this.rams[this.rams.length - 1].y, drawWidth, drawHeightBottom);
    }

    checkCollision(bird) {
        const birdBounds = bird.getBounds();
        return this.rams.some(ram => this.checkBounds(birdBounds, ram));
    }

    checkBounds(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
}

// Funciones del juego
function startGame() {
    if (isGameRunning) {
        return;
    }
    if (gameStarted) {
        setupGameVisuals(); // Solo en reinicio, no en el primer inicio
    }
    isGameRunning = true;
    score = 0;
    scoreSpan.textContent = '0';
    lastPipeSpawn = 0;
    bird = new Bird();
    pipes = [];
    gameTitle.classList.remove('visible');
    startMessage.classList.remove('visible');
    PIPE_SPEED = 4;
    startSpeedIncreaseTimer();
    gameStarted = true;
    waitingForHandOpen = false;
    requestAnimationFrame(gameLoop);
}

// --- UI RELOCATION ---
// Move score to top center and make it larger
const scoreContainer = document.querySelector('.score-container');
scoreContainer.style.left = '50%';
scoreContainer.style.right = '';
scoreContainer.style.top = '24px';
scoreContainer.style.transform = 'translateX(-50%)';
scoreContainer.style.fontSize = '1.7vw';
scoreContainer.style.textAlign = 'center';
scoreContainer.style.zIndex = '2000';
scoreContainer.style.padding = '8px 32px';
scoreContainer.style.background = 'rgba(0,32,0,0.85)';
scoreContainer.style.border = '2px solid #00ff00';
scoreContainer.style.borderRadius = '12px';
scoreContainer.style.boxShadow = '0 0 12px #00ff00, 0 0 2px #000';
scoreContainer.style.color = '#39ff14';
scoreContainer.style.fontWeight = 'bold';
scoreContainer.style.minWidth = '120px';

// Move status further below camera
const moveStatusBelowCamera = () => {
    const camera = document.getElementById('cameraContainer');
    if (camera) {
        statusDiv.style.position = 'fixed';
        statusDiv.style.left = camera.offsetLeft + 'px';
        statusDiv.style.top = (camera.offsetTop + camera.offsetHeight + 40) + 'px';
        statusDiv.style.zIndex = '1001';
        statusDiv.style.width = camera.offsetWidth + 'px';
        statusDiv.style.textAlign = 'center';
    }
};
window.addEventListener('resize', moveStatusBelowCamera);

// --- +1 ANIMATION ---
// Create the +1 animation element
let plusOneDiv = document.createElement('div');
plusOneDiv.id = 'plusOneAnim';
plusOneDiv.style.position = 'fixed';
plusOneDiv.style.top = '70px';
plusOneDiv.style.left = '50%';
plusOneDiv.style.transform = 'translateX(-50%)';
plusOneDiv.style.fontSize = '3vw';
plusOneDiv.style.fontFamily = 'monospace';
plusOneDiv.style.color = '#00ff00';
plusOneDiv.style.textShadow = '0 0 10px #00ff00, 0 0 20px #000';
plusOneDiv.style.opacity = '0';
plusOneDiv.style.pointerEvents = 'none';
plusOneDiv.style.transition = 'opacity 0.7s, top 0.7s';
document.body.appendChild(plusOneDiv);
function showPlusOne() {
    plusOneDiv.textContent = '+1';
    plusOneDiv.style.opacity = '1';
    plusOneDiv.style.top = '70px';
    setTimeout(() => {
        plusOneDiv.style.opacity = '0';
        plusOneDiv.style.top = '30px';
    }, 50);
}

function drawGameBg() {
    if (gameBgImg.complete) {
        ctx.drawImage(gameBgImg, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function setupGameVisuals() {
    // Inicializa bird y pipes para que siempre estén en pantalla
    bird = new Bird();
    pipes = [];
    score = 0;
    scoreSpan.textContent = '0';
    lastPipeSpawn = 0;
    drawGameBg();
    if (bird) bird.draw();
    pipes.forEach(pipe => pipe.draw());
}

function gameLoop(timestamp) {
    if (!isGameRunning || isVictoryAnimation) {
        return;
    }
    drawGameBg();
    if (bird) bird.draw();
    pipes.forEach(pipe => pipe.draw());
    if (!lastHandOpen) {
        if (typeof showHandStartOverlay === 'function') showHandStartOverlay(true);
        requestAnimationFrame(gameLoop); // Sigue dibujando la nave
        return;
    } else {
        if (typeof showHandStartOverlay === 'function') showHandStartOverlay(false);
    }
    // Avanza el juego normalmente solo si la mano está abierta
    try {
        if (bird) bird.move();
        if (timestamp - lastPipeSpawn > PIPE_SPAWN_INTERVAL) {
            pipes.push(new Pipe());
            lastPipeSpawn = timestamp;
        }
        pipes = pipes.filter(pipe => pipe.x + PIPE_WIDTH > 0);
        pipes.forEach(pipe => {
            pipe.update();
            if (!pipe.scored && pipe.x + PIPE_WIDTH < bird.x) {
                pipe.scored = true;
                score++;
                scoreSpan.textContent = score;
                scoreContainer.classList.add('score-flash');
                setTimeout(()=>scoreContainer.classList.remove('score-flash'), 200);
                showPlusOne();
                if (score >= 15 && !isVictoryAnimation) {
                    epicVictoryAnimation();
                    return;
                }
            }
        });
        if (checkCollisions()) {
            gameOver();
            return;
        }
        requestAnimationFrame(gameLoop);
    } catch (error) {
        console.error('Error en gameLoop:', error);
        gameOver();
    }
}

function checkCollisions() {
    // Colisión con el techo o suelo
    if (bird.y - BIRD_SIZE < 0 || bird.y + BIRD_SIZE > canvas.height) {
        gameOver();
        return true;
    }
    // Colisión con tubos
    return pipes.some(pipe => pipe.checkCollision(bird));
}

function gameOver() {
    if (isVictoryAnimation || waitingForHandOpen || !gameStarted) return;
    console.log('Juego terminado');
    isGameRunning = false;
    // --- DERROTA ANIMATION ---
    let defeatOverlay = document.createElement('div');
    defeatOverlay.id = 'defeatOverlay';
    defeatOverlay.style.position = 'fixed';
    defeatOverlay.style.inset = '0';
    defeatOverlay.style.background = 'rgba(0,0,0,0.85)';
    defeatOverlay.style.zIndex = '9999';
    defeatOverlay.style.display = 'flex';
    defeatOverlay.style.flexDirection = 'column';
    defeatOverlay.style.alignItems = 'center';
    defeatOverlay.style.justifyContent = 'center';
    defeatOverlay.style.fontSize = '3vw';
    defeatOverlay.style.fontFamily = 'monospace';
    defeatOverlay.style.color = '#fff';
    defeatOverlay.style.textShadow = '0 0 30px #000, 0 0 10px #fff';
    defeatOverlay.innerHTML = '<div id="defeatMsg" style="padding:1vw 2vw; border-radius:18px; font-size:2.5vw; font-weight:bold;">¡El multiverso se fragmentó!</div>' +
        '<div id="restartMsg" style="margin-top:2vw; font-size:1.2vw; opacity:0.8;">Reiniciando viaje por el código...</div>';
    document.body.appendChild(defeatOverlay);
    // Color cycle + pulse animation
    const style = document.createElement('style');
    style.innerHTML = `@keyframes defeatPulse {0%{color:#ff0055; background: rgba(0,0,0,0.85); transform: scale(1);}20%{color:#fffb00; background: rgba(0,32,0,0.92); transform: scale(1.08);}40%{color:#00fff7; background: rgba(0,0,32,0.92); transform: scale(1.12);}60%{color:#39ff14; background: rgba(32,0,0,0.92); transform: scale(1.08);}80%{color:#ff00ff; background: rgba(0,0,0,0.85); transform: scale(1.04);}100%{color:#ff0055; background: rgba(0,0,0,0.85); transform: scale(1);}}`;
    document.head.appendChild(style);
    const defeatMsg = defeatOverlay.querySelector('#defeatMsg');
    defeatMsg.style.animation = 'defeatPulse 1.2s infinite cubic-bezier(.4,2,.6,.8)';
    setTimeout(()=>{
        defeatOverlay.querySelector('#restartMsg').style.opacity = '1';
    }, 1200);
    if (speedInterval) clearInterval(speedInterval);
    setTimeout(() => {
        // Eliminar overlay de derrota
        if (defeatOverlay && defeatOverlay.parentNode) defeatOverlay.parentNode.removeChild(defeatOverlay);
        // Reiniciar solo el juego, no la sala
        startGame();
    }, 2000);
}

function gameWon() {
    isGameRunning = false;
    if (speedInterval) clearInterval(speedInterval);
    fetch('/Home/CompleteRoom/8', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => response.json())
      .then(data => {
        if (data.success) {
            setTimeout(() => {
                window.location.href = "/Home/Room9";
            }, 1500);
        } else {
            setTimeout(() => {
                window.location.href = "/Home/Room9";
            }, 1500);
        }
    })
    .catch(() => {
        setTimeout(() => {
            window.location.href = "/Home/Room9";
        }, 1500);
    });
}

// Detección de manos
async function initializeHandDetection() {
    try {
        console.log("Iniciando detección de manos...");
        
        // Crear elementos de video y canvas con tamaño mayor
        if (!document.getElementById('gameVideo')) {
            document.body.insertAdjacentHTML('beforeend', `
                <div id="cameraContainer" style="position: fixed; top: 10px; left: 10px; z-index: 1000;">
                    <video id="gameVideo" autoplay playsinline style="width: 320px; height: 240px; transform: scaleX(-1);"></video>
                    <canvas id="handCanvas" style="position: absolute; top: 0; left: 0; width: 320px; height: 240px;"></canvas>
                </div>
            `);
        }

        video = document.getElementById('gameVideo');
        handCanvas = document.getElementById('handCanvas');
        handCtx = handCanvas.getContext('2d');
        
        statusDiv.textContent = "Estado: Iniciando cámara...";

        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });

        video.srcObject = stream;
        await video.play();

        handCanvas.width = video.videoWidth;
        handCanvas.height = video.videoHeight;

        statusDiv.textContent = "Estado: Cargando modelo...";

        // Configurar el modelo con mayor confianza
        const options = {
            flipHorizontal: true,
            maxContinuousChecks: 5,
            detectionConfidence: 0.7,
            scoreThreshold: 0.5,
            iouThreshold: 0.3
        };

        handpose = await ml5.handpose(video, options, modelReady);

        // Configurar detección con debounce para estabilidad
        let lastPredictionTime = 0;
        handpose.on('predict', predictions => {
            const now = Date.now();
            if (now - lastPredictionTime > 50) { // 50ms debounce
                let isOpen = false;
                if (predictions && predictions.length > 0) {
                    isOpen = checkHandOpen(predictions[0]);
                    updateGameState(isOpen);
                    drawHand(predictions[0]);
                } else {
                    statusDiv.textContent = "Estado: Muestra tu mano";
                    // Si no se detecta mano, se considera cerrada
                    updateGameState(false);
                }
                lastPredictionTime = now;
            }
        });

    } catch (error) {
        console.error("Error:", error);
        statusDiv.textContent = "Estado: Error al iniciar la cámara";
        statusDiv.style.color = "#ff0000";
    }
    setTimeout(moveStatusBelowCamera, 300);
}

function modelReady() {
    console.log("Modelo cargado");
    isHandposeLoaded = true;
    statusDiv.textContent = "Estado: Modelo listo - Muestra tu mano";
    statusDiv.style.color = "#00ff00";
}

function checkHandOpen(hand) {
    if (!hand.landmarks) return false;

    const landmarks = hand.landmarks;
    const palmBase = landmarks[0];
    const fingerTips = [8, 12, 16, 20].map(i => landmarks[i]); // Ignorar el pulgar (índice 4)
    const fingerBases = [5, 9, 13, 17].map(i => landmarks[i]); // Bases de los dedos

    // Calcular distancias de las puntas de los dedos al centro de la palma
    const tipDistances = fingerTips.map(tip => {
        const dx = tip[0] - palmBase[0];
        const dy = tip[1] - palmBase[1];
        return Math.sqrt(dx * dx + dy * dy);
    });

    // Calcular distancias de las bases de los dedos al centro de la palma
    const baseDistances = fingerBases.map(base => {
        const dx = base[0] - palmBase[0];
        const dy = base[1] - palmBase[1];
        return Math.sqrt(dx * dx + dy * dy);
    });

    // Comparar cada dedo con su base
    let openFingers = 0;
    for (let i = 0; i < 4; i++) {
        if (tipDistances[i] > baseDistances[i] * 1.5) {
            openFingers++;
        }
    }

    return openFingers >= 2; // Considerar mano abierta si al menos 2 dedos están extendidos
}

let lastHandOpenForJump = false;
function updateGameState(isHandOpen) {
    const prevHandOpen = lastHandOpen;
    lastHandOpen = isHandOpen;
    statusDiv.textContent = `Estado: Mano ${isHandOpen ? 'Abierta' : 'Cerrada'}`;
    statusDiv.style.color = isHandOpen ? "#00ff00" : "#ff0000";
    if (!gameStarted && introFinished) {
        startGame();
    }
    // Si la mano está abierta, salta cada frame
    if (isGameRunning && bird) {
        if (isHandOpen) {
            bird.wantJump = true;
        }
    }
    lastHandOpenForJump = isHandOpen;
    if (typeof window.tryStartGameOnHandOpen === 'function') {
        window.tryStartGameOnHandOpen(isHandOpen);
    }
}

function drawHand(hand) {
    handCtx.clearRect(0, 0, handCanvas.width, handCanvas.height);
    
    // Dibujar conexiones entre puntos
    handCtx.strokeStyle = '#00ff00';
    handCtx.lineWidth = 2;
    
    // Dibujar líneas entre los puntos de los dedos
    const fingers = [[0,1,2,3,4], [0,5,6,7,8], [0,9,10,11,12], [0,13,14,15,16], [0,17,18,19,20]];
    fingers.forEach(finger => {
        handCtx.beginPath();
        finger.forEach((point, index) => {
            const landmark = hand.landmarks[point];
            if (index === 0) {
                handCtx.moveTo(landmark[0], landmark[1]);
            } else {
                handCtx.lineTo(landmark[0], landmark[1]);
            }
        });
        handCtx.stroke();
    });

    // Dibujar puntos
    handCtx.fillStyle = '#00ff00';
    hand.landmarks.forEach(point => {
        handCtx.beginPath();
        handCtx.arc(point[0], point[1], 4, 0, 2 * Math.PI);
        handCtx.fill();
    });
}

// Aumentar la velocidad cada 15 segundos
function startSpeedIncreaseTimer() {
    if (speedInterval) clearInterval(speedInterval);
    speedInterval = setInterval(() => {
        PIPE_SPEED += 3;
    }, 15000);
}

// Inicializar cuando el documento esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log("Iniciando aplicación...");
    initializeHandDetection();
    function drawBgLoop() {
        if (alwaysShowGameBg && canvas && ctx) {
            drawGameBg();
        }
        requestAnimationFrame(drawBgLoop);
    }
    drawBgLoop();
    let gameStarted = false;
    function tryStartGameOnHandOpen(isHandOpen) {
        if (!introSetupDone && introFinished) {
            setupGameVisuals();
            introSetupDone = true;
        }
        if (!gameStarted && introFinished) {
            showHandStartOverlay(!isHandOpen);
            if (isHandOpen) {
                gameStarted = true;
                showHandStartOverlay(false);
                setTimeout(()=>startGame(), 50);
            }
        }
    }
    window.tryStartGameOnHandOpen = tryStartGameOnHandOpen;
});

function epicVictoryAnimation() {
    isVictoryAnimation = true;
    isGameRunning = false;
    // Overlay negro (fade in 5s)
    let victoryOverlay = document.createElement('div');
    victoryOverlay.id = 'victoryOverlay';
    victoryOverlay.style.position = 'fixed';
    victoryOverlay.style.inset = '0';
    victoryOverlay.style.background = 'black';
    victoryOverlay.style.zIndex = '99999';
    victoryOverlay.style.opacity = '0';
    victoryOverlay.style.transition = 'opacity 5s';
    document.body.appendChild(victoryOverlay);
    setTimeout(()=>{ victoryOverlay.style.opacity = '1'; }, 10);
    // Después de 5s, mostrar video
    setTimeout(()=>{
        // Video a pantalla completa
        let vid = document.createElement('video');
        vid.src = '/img/videoricknave2.mp4';
        vid.style.position = 'fixed';
        vid.style.inset = '0';
        vid.style.width = '100vw';
        vid.style.height = '100vh';
        vid.style.objectFit = 'cover';
        vid.style.zIndex = '100000';
        vid.autoplay = true;
        vid.controls = false;
        vid.onended = showFinalFade;
        document.body.appendChild(vid);
        vid.play().catch(()=>{});
        // Si el video dura más de 15s, forzar fade
        setTimeout(showFinalFade, 15000);
        function showFinalFade() {
            vid.onended = null;
            vid.pause();
            if (vid.parentNode) vid.parentNode.removeChild(vid);
            // Fade out negro 5s
            victoryOverlay.style.transition = 'opacity 5s';
            victoryOverlay.style.opacity = '1';
            setTimeout(()=>{
                victoryOverlay.style.opacity = '0';
                setTimeout(()=>{
                    // Limpiar overlays/canvas residuales
                    if (victoryOverlay.parentNode) victoryOverlay.parentNode.removeChild(victoryOverlay);
                    let matrixRain = document.getElementById('matrixRain');
                    if (matrixRain && matrixRain.parentNode) matrixRain.parentNode.removeChild(matrixRain);
                    let overlays = document.querySelectorAll('#epicIntroOverlay, #epicIntroVideo, #epicIntroFx');
                    overlays.forEach(o=>{if(o && o.parentNode) o.parentNode.removeChild(o);});
                    window.location.href = '/Home/Room9';
                }, 5000);
            }, 100);
        }
    }, 5000);
} 
