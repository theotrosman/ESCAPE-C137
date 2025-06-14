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

// Configuración del juego
const GRAVITY = 9.8;
const LIFT_FORCE = -0.1;
const FALL_FORCE = 4;
const PIPE_SPEED = 30;
const PIPE_SPAWN_INTERVAL = 3000;
const MAX_VELOCITY = 40;

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
birdImg.src = '/img/naveparachocar.png';

const pipeImg = new Image();
pipeImg.src = '/img/ramfoto.png';

// Clase Bird
class Bird {
    constructor() {
        this.x = canvas.width / 3;
        this.y = canvas.height / 2;
        this.velocity = 0;
        this.rotation = 0;
        this.scale = 1;
    }

    move(isHandOpen) {
        // Control continuo basado en el estado de la mano
        if (isHandOpen) {
            this.velocity += LIFT_FORCE;
        } else {
            this.velocity += FALL_FORCE;
        }

        // Limitar la velocidad máxima
        this.velocity = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, this.velocity));
        
        // Actualizar posición
        this.y += this.velocity;
        
        // Actualizar rotación basada en la velocidad
        this.rotation = this.velocity * 5;  // Rotación suave basada en la velocidad
        
        // Mantener el pájaro dentro de los límites de la pantalla
        this.y = Math.max(BIRD_SIZE, Math.min(canvas.height - BIRD_SIZE, this.y));
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.drawImage(birdImg, -BIRD_SIZE, -BIRD_SIZE, BIRD_SIZE * 2, BIRD_SIZE * 2);
        ctx.restore();
    }

    getBounds() {
        return {
            x: this.x - BIRD_SIZE * 0.7,
            y: this.y - BIRD_SIZE * 0.7,
            width: BIRD_SIZE * 1.4,
            height: BIRD_SIZE * 1.4
        };
    }
}

// Clase Pipe
class Pipe {
    constructor() {
        this.x = canvas.width;
        const minHeight = canvas.height * 0.2;
        const maxHeight = canvas.height * 0.6;
        this.height = Math.random() * (maxHeight - minHeight) + minHeight;
        this.passed = false;
        this.scored = false;
        this.width = PIPE_WIDTH;
    }

    update() {
        this.x -= PIPE_SPEED;
    }

    draw() {
        // Tubo superior
        ctx.save();
        ctx.translate(this.x + PIPE_WIDTH / 2, this.height - canvas.height);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(pipeImg, -PIPE_WIDTH / 2, -PIPE_WIDTH / 2, PIPE_WIDTH, PIPE_WIDTH);
        ctx.restore();

        // Tubo inferior
        ctx.save();
        ctx.translate(this.x + PIPE_WIDTH / 2, this.height + PIPE_GAP);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(pipeImg, -PIPE_WIDTH / 2, -PIPE_WIDTH / 2, PIPE_WIDTH, PIPE_WIDTH);
        ctx.restore();
    }

    checkCollision(bird) {
        const birdBounds = bird.getBounds();
        const topPipe = {
            x: this.x,
            y: 0,
            width: PIPE_WIDTH,
            height: this.height
        };
        const bottomPipe = {
            x: this.x,
            y: this.height + PIPE_GAP,
            width: PIPE_WIDTH,
            height: canvas.height - (this.height + PIPE_GAP)
        };

        return this.checkBounds(birdBounds, topPipe) || this.checkBounds(birdBounds, bottomPipe);
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
    if (isGameRunning) return;
    
    console.log('Iniciando juego...');
    isGameRunning = true;
    score = 0;
    scoreSpan.textContent = '0';
    lastPipeSpawn = 0;
    
    bird = new Bird();
    pipes = [];
    
    gameTitle.classList.remove('visible');
    startMessage.classList.remove('visible');
    
    requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
    if (!isGameRunning) return;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fondo negro
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Actualizar y dibujar pájaro
    if (bird) {
        bird.move(lastHandOpen);  // Usar move en lugar de update
        bird.draw();
    }
    
    // Actualizar y dibujar tubos
    updatePipes(timestamp);
    pipes.forEach(pipe => {
        pipe.update();
        pipe.draw();
    });
    
    // Comprobar colisiones
    if (checkCollisions()) {
        gameOver();
        return;
    }
    
    requestAnimationFrame(gameLoop);
}

function updatePipes(timestamp) {
    // Eliminar tubos fuera de pantalla
    pipes = pipes.filter(pipe => pipe.x + PIPE_WIDTH > 0);
    
    // Generar nuevos tubos
    if (timestamp - lastPipeSpawn > PIPE_SPAWN_INTERVAL) {
        pipes.push(new Pipe());
        lastPipeSpawn = timestamp;
    }
    
    // Actualizar puntuación
    pipes.forEach(pipe => {
        if (!pipe.scored && pipe.x + PIPE_WIDTH < bird.x) {
            pipe.scored = true;
            score++;
            scoreSpan.textContent = score;
            
            if (score >= 15) {
                gameWon();
            }
        }
    });
}

function checkCollisions() {
    // Colisión con el techo o suelo
    if (bird.y - BIRD_SIZE < 0 || bird.y + BIRD_SIZE > canvas.height) {
        return true;
    }
    
    // Colisión con tubos
    return pipes.some(pipe => pipe.checkCollision(bird));
}

function gameOver() {
    isGameRunning = false;
    gameTitle.classList.add('visible');
    startMessage.classList.add('visible');
    setTimeout(() => {
        window.location.reload();
    }, 1500);
}

function gameWon() {
    isGameRunning = false;
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
        }
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
                facingMode: 'user',
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
                if (predictions && predictions.length > 0) {
                    const isOpen = checkHandOpen(predictions[0]);
                    updateGameState(isOpen);
                    drawHand(predictions[0]);
                    lastPredictionTime = now;
                } else {
                    statusDiv.textContent = "Estado: Muestra tu mano";
                }
            }
        });

    } catch (error) {
        console.error("Error:", error);
        statusDiv.textContent = "Estado: Error al iniciar la cámara";
        statusDiv.style.color = "#ff0000";
    }
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

function updateGameState(isHandOpen) {
    const prevHandOpen = lastHandOpen;
    lastHandOpen = isHandOpen;

    statusDiv.textContent = `Estado: Mano ${isHandOpen ? 'Abierta' : 'Cerrada'}`;
    statusDiv.style.color = isHandOpen ? "#00ff00" : "#ff0000";

    // Iniciar juego solo cuando se abre la mano por primera vez
    if (!isGameRunning && isHandOpen && !prevHandOpen) {
        startGame();
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

// Inicializar cuando el documento esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log("Iniciando aplicación...");
    initializeHandDetection();
});

// Add endings integration
function triggerEnding(type) {
    switch(type) {
        case 'eliminate':
            window.endings.eliminarFinal();
            break;
        case 'joinMorty':
            window.endings.unirseAMorty();
            break;
        case 'restart':
            window.endings.reiniciarTodo();
            break;
    }
}

// Add easter egg detection
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.altKey && e.key === 'r') {
        const input = prompt('Enter secret code:');
        if (input === 'rickandmorty') {
            // Trigger secret ending
            window.endings.reiniciarTodo();
        }
    }
});
