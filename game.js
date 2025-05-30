// Configuración del canvas y contexto
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const video = document.getElementById('video');
const statusDiv = document.getElementById('status');
const scoreSpan = document.getElementById('score');
const gameTitle = document.getElementById('gameTitle');
const startMessage = document.getElementById('startMessage');

// Ajustar tamaño del canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Configuración del juego
const GRAVITY = 0.5;
const JUMP_FORCE = -10;
const PIPE_SPEED = 5;
const PIPE_SPAWN_INTERVAL = 1800;
const BIRD_SIZE = Math.min(canvas.width, canvas.height) * 0.04;
const PIPE_WIDTH = Math.min(canvas.width, canvas.height) * 0.08;
const PIPE_GAP = Math.min(canvas.width, canvas.height) * 0.25;

// Cargar imágenes
const birdImg = new Image();
birdImg.src = 'data:image/svg+xml,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="#e74c3c"/>
        <circle cx="65" cy="35" r="8" fill="white"/>
        <circle cx="67" cy="33" r="4" fill="black"/>
        <path d="M 75,50 Q 85,45 90,55" stroke="orange" stroke-width="5" fill="none"/>
    </svg>
`);

const pipeImg = new Image();
pipeImg.src = '/img/ramfoto.png';

// Estado del juego
let isGameRunning = false;
let score = 0;
let lastPipeSpawn = 0;
let particles = [];

// Game of Life configuration
const CELL_SIZE = 10;
const COLS = Math.ceil(canvas.width / CELL_SIZE);
const ROWS = Math.ceil(canvas.height / CELL_SIZE);
let grid = [];
let nextGrid = [];

// Initialize Game of Life grid
function initializeGrid() {
    for (let i = 0; i < ROWS; i++) {
        grid[i] = [];
        nextGrid[i] = [];
        for (let j = 0; j < COLS; j++) {
            grid[i][j] = Math.random() > 0.85;
            nextGrid[i][j] = false;
        }
    }
}

// Update Game of Life
function updateGameOfLife() {
    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            let neighbors = countNeighbors(i, j);
            if (grid[i][j]) {
                nextGrid[i][j] = neighbors === 2 || neighbors === 3;
            } else {
                nextGrid[i][j] = neighbors === 3;
            }
        }
    }
    // Swap grids
    [grid, nextGrid] = [nextGrid, grid];
}

function countNeighbors(x, y) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;
            let row = (x + i + ROWS) % ROWS;
            let col = (y + j + COLS) % COLS;
            if (grid[row][col]) count++;
        }
    }
    return count;
}

// Efectos visuales y glitch
const glitchColors = ['#00ff00', '#ff0000', '#0000ff', '#ffff00'];
let lastGlitch = 0;
const GLITCH_INTERVAL = 5000; // 5 segundos entre glitches
let glitchActive = false;
let glitchTimeout;

// Función para crear efecto de glitch
function createGlitchEffect() {
    if (Math.random() > 0.7) { // 30% de probabilidad de glitch
        glitchActive = true;
        console.warn('%c⚠️ REALITY MALFUNCTION DETECTED', 'color: #ff0000; font-size: 20px; font-weight: bold;');
        console.log('%c🌀 Dimensional coordinates scrambled...', 'color: #00ff00');
        
        // Efecto de desplazamiento de canales
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.drawImage(canvas, 
            Math.random() * 10 - 5, 
            Math.random() * 10 - 5
        );
        ctx.restore();

        // Líneas de glitch aleatorias
        for (let i = 0; i < 5; i++) {
            const y = Math.random() * canvas.height;
            const height = Math.random() * 10;
            ctx.fillStyle = glitchColors[Math.floor(Math.random() * glitchColors.length)];
            ctx.fillRect(0, y, canvas.width, height);
        }

        // Desactivar el glitch después de un tiempo aleatorio
        clearTimeout(glitchTimeout);
        glitchTimeout = setTimeout(() => {
            glitchActive = false;
            console.log('%c✨ Reality stabilized', 'color: #00ff00');
        }, Math.random() * 1000 + 500);
    }
}

// Clase Pájaro con animación
class Bird {
    constructor() {
        this.x = canvas.width / 3;
        this.y = canvas.height / 2;
        this.velocity = 0;
        this.rotation = 0;
        this.scale = 1;
        this.trailPoints = [];
        this.dimensionalEnergy = 100;
        console.log('%c🐦 Bird entity initialized', 'color: #00ff00; font-weight: bold;');
    }

    jump() {
        this.velocity = JUMP_FORCE;
        this.rotation = -30;
        this.scale = 1.2;
        this.createParticles();
        this.dimensionalEnergy = Math.min(100, this.dimensionalEnergy + 20);
        console.log(`%c↑ Dimensional jump - Energy: ${this.dimensionalEnergy}%`, 'color: #00ff00');
        this.createDimensionalRift();
    }

    createParticles() {
        for (let i = 0; i < 5; i++) {
            particles.push(new Particle(this.x, this.y));
        }
    }

    createDimensionalRift() {
        const colors = ['#ff0000', '#00ff00', '#0000ff'];
        for (let i = 0; i < 10; i++) {
            const angle = (Math.PI * 2 * i) / 10;
            const distance = 30;
            particles.push(new Particle(
                this.x + Math.cos(angle) * distance,
                this.y + Math.sin(angle) * distance,
                colors[i % colors.length]
            ));
        }
    }

    update() {
        this.velocity += GRAVITY;
        this.y += this.velocity;
        this.rotation += 2;
        this.rotation = Math.min(this.rotation, 30);
        this.scale = Math.max(1, this.scale - 0.05);
        this.trailPoints.unshift({ x: this.x, y: this.y });
        if (this.trailPoints.length > 10) this.trailPoints.pop();
        
        this.dimensionalEnergy = Math.max(0, this.dimensionalEnergy - 0.1);
        if (this.dimensionalEnergy < 20) {
            console.warn('%c⚠️ Low dimensional energy!', 'color: #ff0000');
        }
    }

    draw() {
        // Dibujar trail dimensional
        ctx.save();
        this.trailPoints.forEach((point, index) => {
            const alpha = (1 - index / this.trailPoints.length) * 0.3;
            ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
            ctx.beginPath();
            ctx.arc(point.x, point.y, BIRD_SIZE * 0.8, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.scale(this.scale, this.scale);
        ctx.drawImage(birdImg, -BIRD_SIZE, -BIRD_SIZE, BIRD_SIZE * 2, BIRD_SIZE * 2);
        ctx.restore();

        // Dibujar aura dimensional
        const auraSize = BIRD_SIZE * (1 + Math.sin(Date.now() / 200) * 0.2);
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.beginPath();
        ctx.arc(0, 0, auraSize, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, auraSize);
        gradient.addColorStop(0, 'rgba(0, 255, 0, 0)');
        gradient.addColorStop(0.5, `rgba(0, 255, 0, ${this.dimensionalEnergy / 500})`);
        gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();
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

// Clase Partícula para efectos visuales
class Particle {
    constructor(x, y, color = '#ffffff') {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.alpha = 1;
        this.size = Math.random() * 5 + 2;
        this.color = color;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.05;
        this.rotation += this.rotationSpeed;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color.replace('1)', `${this.alpha})`);
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        ctx.restore();
    }
}

// Clase Tubo mejorada
class Pipe {
    constructor() {
        this.x = canvas.width;
        this.height = Math.random() * (canvas.height * 0.6) + canvas.height * 0.1;
        this.passed = false;
    }

    update() {
        this.x -= PIPE_SPEED;
    }

    draw() {
        const pipeHeight = canvas.height * 0.3; // Altura fija para los tubos

        // Dibujar tubo superior (rotado 180 grados)
        ctx.save();
        ctx.translate(this.x + PIPE_WIDTH / 2, this.height);
        ctx.rotate(Math.PI);
        ctx.drawImage(pipeImg, -PIPE_WIDTH / 2, 0, PIPE_WIDTH, pipeHeight);
        ctx.restore();

        // Dibujar tubo inferior
        ctx.save();
        ctx.translate(this.x, this.height + PIPE_GAP);
        ctx.drawImage(pipeImg, 0, 0, PIPE_WIDTH, pipeHeight);
        ctx.restore();
    }

    getBounds() {
        return {
            top: {
                x: this.x,
                y: 0,
                width: PIPE_WIDTH,
                height: this.height
            },
            bottom: {
                x: this.x,
                y: this.height + PIPE_GAP,
                width: PIPE_WIDTH,
                height: canvas.height - (this.height + PIPE_GAP)
            }
        };
    }
}

// Inicialización del juego
let bird = new Bird();
let pipes = [];

// Detección de colisiones
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Función mejorada para escanear todas las cámaras disponibles
async function scanAllCameras() {
    console.log('%c🔍 Escaneando dispositivos de video...', 'color: #00ff00; font-size: 14px;');
    
    try {
        // Enumerar todos los dispositivos
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        console.log(`%c📷 Cámaras encontradas: ${videoDevices.length}`, 'color: #00ff00');
        
        // Mostrar información detallada de cada cámara
        videoDevices.forEach((device, index) => {
            console.log(`%cCámara ${index + 1}:`, 'color: #00ff00');
            console.log(`ID: ${device.deviceId}`);
            console.log(`Nombre: ${device.label || 'Sin acceso al nombre (requiere permisos)'}`);
        });

        return videoDevices;
    } catch (err) {
        console.error('Error al escanear cámaras:', err);
        return [];
    }
}

// Configuraciones extendidas de cámara
const CAMERA_CONFIGS = [
    // Configuración que funcionó anteriormente
    {
        video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 },
            facingMode: 'user'
        }
    },
    // Probar con diferentes dispositivos específicos
    async () => {
        const cameras = await scanAllCameras();
        return cameras.map(camera => ({
            video: {
                deviceId: { exact: camera.deviceId },
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        }));
    },
    // Configuraciones de respaldo
    {
        video: {
            width: { ideal: 320 },
            height: { ideal: 240 }
        }
    },
    { video: true }
];

let isCameraReady = false;
let isModelLoaded = false;
let retryCount = 0;
const MAX_RETRIES = 3;

// Elementos de UI para la cámara
const cameraUI = `
    <div id="cameraContainer" style="
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 1000;
        background: rgba(0, 0, 0, 0.8);
        border-radius: 8px;
        padding: 5px;
    ">
        <video id="gameVideo" autoplay playsinline muted
            style="
                width: 160px;
                height: 120px;
                border: 2px solid #00ff00;
                border-radius: 8px;
                transform: scaleX(-1);
                background: #000;
            "
        ></video>
        <div id="cameraStatus" style="
            color: #00ff00;
            font-size: 12px;
            text-align: center;
            padding: 5px;
            font-family: Arial, sans-serif;
        ">Iniciando cámara...</div>
        <button id="retryCamera" style="
            display: none;
            width: 100%;
            background: #00ff00;
            color: black;
            border: none;
            padding: 5px;
            margin-top: 5px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
        ">Reintentar Cámara</button>
    </div>
`;

// Agregar UI de cámara al body
document.body.insertAdjacentHTML('beforeend', cameraUI);

const videoElement = document.getElementById('gameVideo');
const cameraStatus = document.getElementById('cameraStatus');
const retryButton = document.getElementById('retryCamera');

// Función mejorada para iniciar la cámara
async function startCamera() {
    try {
        cameraStatus.textContent = "Solicitando permisos...";
        cameraStatus.style.color = "#ffff00";
        
        // Verificar soporte
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("Tu navegador no soporta acceso a la cámara");
        }

        // Intentar diferentes configuraciones
        const configs = [
            { video: { facingMode: "user", width: 640, height: 480 } },
            { video: { facingMode: "user" } },
            { video: true }
        ];

        let stream = null;
        let error = null;

        for (const config of configs) {
            try {
                stream = await navigator.mediaDevices.getUserMedia(config);
                if (stream) break;
            } catch (e) {
                error = e;
                console.warn("Falló configuración:", config, e);
            }
        }

        if (!stream) {
            throw error || new Error("No se pudo iniciar la cámara");
        }

        // Configurar video
        videoElement.srcObject = stream;
        
        // Esperar a que el video esté listo
        await new Promise((resolve, reject) => {
            videoElement.onloadedmetadata = () => {
                videoElement.play()
                    .then(resolve)
                    .catch(reject);
            };
            videoElement.onerror = reject;
        });

        // Verificar que el video esté realmente reproduciendo
        if (videoElement.readyState < 2) {
            throw new Error("El video no está listo");
        }

        cameraStatus.textContent = "Cámara activa";
        cameraStatus.style.color = "#00ff00";
        retryButton.style.display = "none";
        
        // Guardar stream para face-api
        video = videoElement;
        isCameraReady = true;
        
        // Iniciar detección facial
        setupFaceDetection();

    } catch (error) {
        console.error("Error al iniciar la cámara:", error);
        cameraStatus.textContent = `Error: ${error.message}`;
        cameraStatus.style.color = "#ff0000";
        retryButton.style.display = "block";
        
        // Mostrar instrucciones específicas según el error
        if (error.name === "NotAllowedError") {
            cameraStatus.innerHTML = "Permiso denegado.<br>Habilita la cámara en tu navegador.";
        } else if (error.name === "NotFoundError") {
            cameraStatus.innerHTML = "No se encontró ninguna cámara.<br>Conecta una webcam.";
        } else if (error.name === "NotReadableError") {
            cameraStatus.innerHTML = "Cámara en uso por otra aplicación.<br>Cierra otras apps.";
        }
    }
}

// Event listener para reintentar
retryButton.addEventListener('click', startCamera);

// Modificar setupFaceDetection para usar el nuevo sistema
async function setupFaceDetection() {
    if (!isCameraReady) {
        console.warn("La cámara no está lista para la detección facial");
        return;
    }

    try {
        // Cargar modelos
        await Promise.all([
            faceapi.nets.tinyFaceDetector.load('/models'),
            faceapi.nets.faceLandmark68Net.load('/models')
        ]);

        // Iniciar detección continua
        startContinuousDetection();
        
    } catch (error) {
        console.error("Error al configurar detección facial:", error);
        cameraStatus.textContent = "Error en detección facial";
        cameraStatus.style.color = "#ff0000";
    }
}

// Iniciar cuando el documento esté listo
document.addEventListener('DOMContentLoaded', () => {
    startCamera();
});

// Limpiar al cerrar
window.addEventListener('beforeunload', () => {
    if (videoElement.srcObject) {
        videoElement.srcObject.getTracks().forEach(track => track.stop());
    }
});

// Funciones de actualización del juego
function updatePipes(timestamp) {
    // Generar nuevos tubos
    if (timestamp - lastPipeSpawn > PIPE_SPAWN_INTERVAL) {
        pipes.push(new Pipe());
        lastPipeSpawn = timestamp;
    }

    // Actualizar tubos existentes
    pipes.forEach(pipe => pipe.update());

    // Eliminar tubos fuera de pantalla y actualizar puntuación
    pipes = pipes.filter(pipe => {
        if (pipe.x + PIPE_WIDTH < 0) {
            if (!pipe.passed) {
                score++;
            }
            return false;
        }
        return true;
    });
}

function checkCollisions() {
    // Verificar colisiones con tubos
    const birdBounds = bird.getBounds();
    for (const pipe of pipes) {
        const pipeBounds = pipe.getBounds();
        if (checkCollision(birdBounds, pipeBounds.top) ||
            checkCollision(birdBounds, pipeBounds.bottom)) {
            gameOver();
            return;
        }

        // Actualizar puntuación al pasar tubos
        if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
            pipe.passed = true;
        }
    }

    // Verificar si el pájaro se sale de la pantalla
    if (bird.y < 0 || bird.y > canvas.height) {
        gameOver();
        return;
    }
}

// Bucle principal del juego
function gameLoop(timestamp) {
    if (!isGameRunning) return;

    // Efecto de glitch aleatorio
    if (timestamp - lastGlitch > GLITCH_INTERVAL) {
        createGlitchEffect();
        lastGlitch = timestamp;
    }

    // Actualizar el juego
    bird.update();
    updatePipes(timestamp);
    checkCollisions();

    // Dibujar
    drawBackground();
    pipes.forEach(pipe => pipe.draw());
    bird.draw();
    particles.forEach((particle, index) => {
        particle.update();
        if (particle.alpha <= 0) {
            particles.splice(index, 1);
        } else {
            particle.draw();
        }
    });

    // Actualizar puntuación
    scoreSpan.textContent = score.toString();

    // Verificar transición de room
    if (score >= 25) {
        window.location.href = '/home/room9';
        return;
    }

    // Añadir efecto de distorsión cuando el score es alto
    if (score > 15) {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        const intensity = Math.sin(timestamp / 1000) * 0.1;
        ctx.scale(1 + intensity, 1 - intensity);
        ctx.restore();
    }

    requestAnimationFrame(gameLoop);
}

// Función de fin de juego
function gameOver() {
    isGameRunning = false;
    console.error('%c💀 DIMENSIONAL COLLAPSE', 'color: #ff0000; font-size: 30px; font-weight: bold');
    console.log('%c🌌 Reality breach detected - Initiating emergency protocol...', 'color: #ff0000');
    
    // Efecto de glitch intenso antes de reiniciar
    let glitchCount = 0;
    const finalGlitch = setInterval(() => {
        createGlitchEffect();
        glitchCount++;
        if (glitchCount > 5) {
            clearInterval(finalGlitch);
            window.location.reload();
        }
    }, 200);

    gameTitle.classList.add('visible');
    startMessage.classList.add('visible');
}

// Iniciar juego
function startGame() {
    console.clear();
    console.log('%c🎮 ESCAPE C-137 INITIALIZED', 'color: #00ff00; font-size: 24px; font-weight: bold');
    console.log('%c📡 Dimensional coordinates locked...', 'color: #00ff00');
    console.log('%c🔓 Reality barriers disabled...', 'color: #00ff00');
    console.log('%c⚡ Quantum tunneling activated...', 'color: #00ff00');
    
    isGameRunning = true;
    score = 0;
    bird = new Bird();
    pipes = [];
    particles = [];
    lastPipeSpawn = 0;
    lastGlitch = 0;
    initializeGrid();
    gameLoop();
}

// Control de teclado
document.addEventListener('keydown', (e) => {
    // Disable spacebar jump
    if (e.code === 'Space') {
        e.preventDefault();
    }
});

// Mostrar título al inicio
gameTitle.classList.add('visible');
startMessage.classList.add('visible');

// Inicialización
setupFaceDetection().then(() => {
    statusDiv.textContent = "Cámara lista - Presiona ESPACIO para comenzar";
    // Iniciar detección continua de movimiento de cabeza
    setInterval(detectHeadMovement, 100);
});

// Iniciar solicitando permisos en lugar de setupFaceDetection directamente
window.addEventListener('load', () => {
    // Mostrar UI de permisos al inicio
    cameraPermissionDiv.style.display = 'block';
}); 