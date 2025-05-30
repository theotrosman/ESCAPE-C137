// Configuración del canvas y contexto
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const statusDiv = document.getElementById('status');
const scoreSpan = document.getElementById('score');
const gameTitle = document.getElementById('gameTitle');
const startMessage = document.getElementById('startMessage');

// Variables para la detección de manos
let handpose;
let video;
let handCanvas;
let handCtx;
let lastHandOpen = false;
let isHandposeLoaded = false;

// Estado del juego
let isGameRunning = false;
let score = 0;
let lastPipeSpawn = 0;
let particles = [];

// Ajustar tamaño del canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Configuración del juego
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const PIPE_SPEED = 7;
const PIPE_SPAWN_INTERVAL = 1500;
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
const GLITCH_INTERVAL = 5000;
let glitchActive = false;
let glitchTimeout;

function createGlitchEffect() {
    if (Math.random() > 0.7) {
        glitchActive = true;
        console.warn('%c⚠️ REALITY MALFUNCTION DETECTED', 'color: #ff0000; font-size: 20px; font-weight: bold;');
        console.log('%c🌀 Dimensional coordinates scrambled...', 'color: #00ff00');
        
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.drawImage(canvas, 
            Math.random() * 10 - 5, 
            Math.random() * 10 - 5
        );
        ctx.restore();

        for (let i = 0; i < 5; i++) {
            const y = Math.random() * canvas.height;
            const height = Math.random() * 10;
            ctx.fillStyle = glitchColors[Math.floor(Math.random() * glitchColors.length)];
            ctx.fillRect(0, y, canvas.width, height);
        }

        clearTimeout(glitchTimeout);
        glitchTimeout = setTimeout(() => {
            glitchActive = false;
            console.log('%c✨ Reality stabilized', 'color: #00ff00');
        }, Math.random() * 1000 + 500);
    }
}

// Clase para efectos de texto flotante
class FloatingText {
    constructor(x, y, text, color = '#00ff00') {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.alpha = 1;
        this.scale = 1;
        this.velocity = -3;
    }

    update() {
        this.y += this.velocity;
        this.velocity *= 0.95;
        this.alpha -= 0.02;
        this.scale += 0.03;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.font = `bold ${20 * this.scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

// Array para almacenar efectos de texto
let floatingTexts = [];

// Clase Bird
class Bird {
    constructor() {
        this.x = canvas.width / 3;
        this.y = canvas.height / 2;
        this.velocity = 0;
        this.rotation = 0;
        this.scale = 1;
        this.trailPoints = [];
        this.dimensionalEnergy = 100;
        this.glowIntensity = 0;
        this.rainbowEffect = 0;
        console.log('%c🐦 Bird entity initialized', 'color: #00ff00; font-weight: bold;');
    }

    jump() {
        this.velocity = JUMP_FORCE;
        this.rotation = -45;
        this.scale = 1.3;
        this.glowIntensity = 1;
        this.createParticles();
        this.dimensionalEnergy = Math.min(100, this.dimensionalEnergy + 20);
        
        // Efecto de ondas al saltar
        for (let i = 0; i < 2 * Math.PI; i += Math.PI / 8) {
            particles.push(new Particle(
                this.x + Math.cos(i) * 30,
                this.y + Math.sin(i) * 30,
                '#00ff00'
            ));
        }
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
        this.rotation = Math.min(90, this.rotation + 3);
        this.scale = Math.max(1, this.scale - 0.1);
        this.glowIntensity = Math.max(0, this.glowIntensity - 0.05);
        this.rainbowEffect += 0.1;

        // Actualizar trail con efecto arcoiris
        this.trailPoints.unshift({ 
            x: this.x, 
            y: this.y,
            hue: (this.rainbowEffect * 10) % 360 
        });
        if (this.trailPoints.length > 15) this.trailPoints.pop();
        
        this.dimensionalEnergy = Math.max(0, this.dimensionalEnergy - 0.1);
        if (this.dimensionalEnergy < 20) {
            console.warn('%c⚠️ Low dimensional energy!', 'color: #ff0000');
        }
    }

    draw() {
        // Dibujar trail con efecto arcoiris
        ctx.save();
        this.trailPoints.forEach((point, index) => {
            const alpha = (1 - index / this.trailPoints.length) * 0.3;
            ctx.fillStyle = `hsla(${point.hue}, 100%, 50%, ${alpha})`;
            ctx.beginPath();
            ctx.arc(point.x, point.y, BIRD_SIZE * 0.6, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();

        // Efecto de brillo
        if (this.glowIntensity > 0) {
            ctx.save();
            ctx.globalAlpha = this.glowIntensity * 0.5;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#00ff00';
            ctx.beginPath();
            ctx.arc(this.x, this.y, BIRD_SIZE * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = '#00ff00';
            ctx.fill();
            ctx.restore();
        }

        // Dibujar el pájaro
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

// Clase Partícula
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

// Clase Tubo
class Pipe {
    constructor() {
        this.x = canvas.width;
        this.height = Math.random() * (canvas.height - PIPE_GAP - 100) + 50;
        this.passed = false;
        this.scored = false;
        this.width = PIPE_WIDTH;
        this.tempCanvas = document.createElement('canvas');
        this.tempCtx = this.tempCanvas.getContext('2d');
        this.tempCanvas.width = PIPE_WIDTH;
        this.tempCanvas.height = canvas.height;
        this.animationScale = 1;
        this.animationRotation = 0;
    }

    update() {
        this.x -= PIPE_SPEED;
        if (this.scored) {
            this.animationScale = Math.min(1.2, this.animationScale + 0.1);
            this.animationRotation = Math.sin(Date.now() / 100) * 0.1;
        } else {
            this.animationScale = Math.max(1, this.animationScale - 0.05);
            this.animationRotation = 0;
        }
    }

    draw() {
        // Draw top pipe
        ctx.save();
        ctx.translate(this.x + PIPE_WIDTH / 2, this.height - canvas.height);
        ctx.rotate(Math.PI / 2); // Rotate 90 degrees
        ctx.scale(this.animationScale, this.animationScale);
        ctx.rotate(this.animationRotation);
        ctx.drawImage(pipeImg, -PIPE_WIDTH / 2, -PIPE_WIDTH / 2, PIPE_WIDTH, PIPE_WIDTH);
        ctx.restore();

        // Draw bottom pipe
        ctx.save();
        ctx.translate(this.x + PIPE_WIDTH / 2, this.height + PIPE_GAP);
        ctx.rotate(Math.PI / 2); // Rotate 90 degrees
        ctx.scale(this.animationScale, this.animationScale);
        ctx.rotate(this.animationRotation);
        ctx.drawImage(pipeImg, -PIPE_WIDTH / 2, -PIPE_WIDTH / 2, PIPE_WIDTH, PIPE_WIDTH);
        ctx.restore();

        // Update temp canvas for collision detection
        this.tempCtx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
        this.tempCtx.save();
        this.tempCtx.translate(PIPE_WIDTH / 2, this.height - canvas.height);
        this.tempCtx.rotate(Math.PI / 2);
        this.tempCtx.drawImage(pipeImg, -PIPE_WIDTH / 2, -PIPE_WIDTH / 2, PIPE_WIDTH, PIPE_WIDTH);
        this.tempCtx.restore();
        
        this.tempCtx.save();
        this.tempCtx.translate(PIPE_WIDTH / 2, this.height + PIPE_GAP);
        this.tempCtx.rotate(Math.PI / 2);
        this.tempCtx.drawImage(pipeImg, -PIPE_WIDTH / 2, -PIPE_WIDTH / 2, PIPE_WIDTH, PIPE_WIDTH);
        this.tempCtx.restore();
    }

    checkPixelCollision(bird) {
        const bounds = bird.getBounds();
        const birdX = Math.floor(bounds.x - this.x);
        const birdY = Math.floor(bounds.y);
        
        if (birdX < 0 || birdX >= this.width || birdY < 0 || birdY >= canvas.height) {
            return false;
        }

        const imageData = this.tempCtx.getImageData(birdX, birdY, bounds.width, bounds.height);
        const pixels = imageData.data;

        for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] > 0) { // Check alpha channel
                return true;
            }
        }
        return false;
    }

    getBounds() {
        return [
            {
                x: this.x,
                y: 0,
                width: PIPE_WIDTH,
                height: this.height
            },
            {
                x: this.x,
                y: this.height + PIPE_GAP,
                width: PIPE_WIDTH,
                height: canvas.height - (this.height + PIPE_GAP)
            }
        ];
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

// Funciones de actualización del juego
function updatePipes(timestamp) {
    if (timestamp - lastPipeSpawn > PIPE_SPAWN_INTERVAL) {
        pipes.push(new Pipe());
        lastPipeSpawn = timestamp;
    }

    pipes.forEach(pipe => pipe.update());

    // Actualizar puntuación y efectos
    pipes = pipes.filter(pipe => {
        if (pipe.x + PIPE_WIDTH < 0) {
            return false;
        }
        
        // Verificar si el pájaro ha pasado el tubo
        if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
            pipe.passed = true;
            score++;
            scoreSpan.textContent = score;
            
            // Efectos visuales al puntuar
            createScoreEffects();
        }
        return true;
    });
}

function checkCollisions() {
    const bird = window.bird;
    const birdBounds = bird.getBounds();

    // Check floor and ceiling
    if (bird.y - BIRD_SIZE < 0 || bird.y + BIRD_SIZE > canvas.height) {
        gameOver();
        return;
    }

    // Check pipe collisions
    for (const pipe of pipes) {
        if (pipe.checkPixelCollision(bird)) {
            gameOver();
            return;
        }
    }
}

function drawBackground() {
    // Fondo negro sólido
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Efecto de matriz suave
    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = '#00ff00';
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.fillText(Math.random() > 0.5 ? '1' : '0', x, y);
    }
    ctx.restore();
}

// Función para crear efectos al puntuar
function createScoreEffects() {
    // Texto flotante "+1"
    floatingTexts.push(new FloatingText(
        canvas.width / 2,
        canvas.height / 2,
        '+1',
        '#00ff00'
    ));

    // Partículas de celebración
    for (let i = 0; i < 20; i++) {
        particles.push(new Particle(
            bird.x + Math.random() * 50,
            bird.y + Math.random() * 50,
            `hsl(${Math.random() * 360}, 100%, 50%)`
        ));
    }

    // Efecto de flash
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
}

// Bucle principal del juego
function gameLoop(timestamp) {
    if (!isGameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();

    // Actualizar y dibujar elementos del juego
    bird.update();
    updatePipes(timestamp);
    checkCollisions();

    // Dibujar elementos
    pipes.forEach(pipe => pipe.draw());
    bird.draw();

    // Actualizar y dibujar partículas
    particles.forEach((particle, index) => {
        particle.update();
        if (particle.alpha <= 0) {
            particles.splice(index, 1);
        } else {
            particle.draw();
        }
    });

    // Actualizar y dibujar textos flotantes
    floatingTexts = floatingTexts.filter(text => {
        text.update();
        if (text.alpha > 0) {
            text.draw(ctx);
            return true;
        }
        return false;
    });

    // Dibujar score grande en el centro
    ctx.save();
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.2;
    ctx.fillText(score.toString(), canvas.width / 2, canvas.height / 2);
    ctx.restore();

    requestAnimationFrame(gameLoop);
}

// Función de fin de juego
function gameOver() {
    isGameRunning = false;
    console.error('%c💀 DIMENSIONAL COLLAPSE', 'color: #ff0000; font-size: 30px; font-weight: bold');
    console.log('%c🌌 Reality breach detected - Initiating emergency protocol...', 'color: #ff0000');
    
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

// Add gameWon function
function gameWon() {
    isGameRunning = false;
    gameTitle.textContent = "¡NIVEL COMPLETADO!";
    gameTitle.classList.add('visible');
    startMessage.textContent = "¡Has escapado de la simulación!";
    startMessage.classList.add('visible');
    
    // Create celebration particles
    for (let i = 0; i < 50; i++) {
        particles.push(new Particle(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            glitchColors[Math.floor(Math.random() * glitchColors.length)]
        ));
    }

    // Redirect to next level after a delay
    setTimeout(() => {
        window.location.href = '/Home/Room9';
    }, 3000);
}

// Iniciar juego
async function initializeHandDetection() {
    try {
        // Agregar UI de cámara
        document.body.insertAdjacentHTML('beforeend', cameraUI);
        
        // Obtener elementos
        video = document.getElementById('gameVideo');
        handCanvas = document.getElementById('handCanvas');
        handCtx = handCanvas.getContext('2d');
        const cameraStatus = document.getElementById('cameraStatus');
        const retryButton = document.getElementById('retryCamera');

        // Iniciar la cámara
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "user",
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        });

        video.srcObject = stream;
        await video.play();

        // Configurar canvas para dibujar la mano
        handCanvas.width = video.videoWidth;
        handCanvas.height = video.videoHeight;

        // Inicializar modelo de detección de manos
        handpose = await ml5.handpose(video, {
            flipHorizontal: true
        }, modelReady);

        let handOpenStartTime = 0;
        const HAND_OPEN_THRESHOLD = 500; // Medio segundo

        // Configurar detección continua
        handpose.on('predict', results => {
            const isOpen = isOpenHand(results);
            
            if (isOpen) {
                if (!handOpenStartTime) {
                    handOpenStartTime = Date.now();
                } else if (Date.now() - handOpenStartTime > HAND_OPEN_THRESHOLD) {
                    if (!isGameRunning) {
                        console.log("Iniciando juego - Mano detectada por suficiente tiempo");
                        startGame();
                        handOpenStartTime = 0;
                    } else {
                        bird.jump();
                    }
                }
            } else {
                handOpenStartTime = 0;
            }
            
            lastHandOpen = isOpen;
            drawHand(results);
        });

        cameraStatus.textContent = "Esperando detección de mano...";
        retryButton.onclick = initializeHandDetection;

    } catch (error) {
        console.error("Error al iniciar la cámara:", error);
        const cameraStatus = document.getElementById('cameraStatus');
        cameraStatus.textContent = "Error al iniciar la cámara";
        cameraStatus.style.color = "#ff0000";
        document.getElementById('retryCamera').style.display = "block";
    }
}

function modelReady() {
    console.log("Modelo de detección de manos cargado");
    isHandposeLoaded = true;
    const cameraStatus = document.getElementById('cameraStatus');
    cameraStatus.textContent = "Abre tu mano para comenzar";
    cameraStatus.style.color = "#00ff00";
}

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
        <canvas id="handCanvas" style="
            position: absolute;
            top: 0;
            left: 0;
            width: 160px;
            height: 120px;
            pointer-events: none;
        "></canvas>
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

// Deshabilitar completamente la barra espaciadora y otras teclas
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.key === ' ' || e.keyCode === 32) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
}, true);

window.addEventListener('keyup', (e) => {
    if (e.code === 'Space' || e.key === ' ' || e.keyCode === 32) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
}, true);

// Limpiar recursos al cerrar
window.addEventListener('beforeunload', () => {
    if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }
});

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initializeGrid();
    initializeHandDetection();
});

function startGame() {
    if (isGameRunning) {
        console.log("El juego ya está en ejecución");
        return;
    }

    console.clear();
    console.log('%c🎮 ESCAPE C-137 INITIALIZED', 'color: #00ff00; font-size: 24px; font-weight: bold');
    
    // Reiniciar variables del juego
    isGameRunning = true;
    score = 0;
    scoreSpan.textContent = '0';
    bird = new Bird();
    pipes = [];
    particles = [];
    lastPipeSpawn = 0;
    lastGlitch = 0;
    
    // Ocultar título y mensaje al iniciar
    if (gameTitle) gameTitle.classList.remove('visible');
    if (startMessage) startMessage.classList.remove('visible');

    // Iniciar el bucle del juego
    window.bird = bird; // Asegurar que bird es accesible globalmente
    requestAnimationFrame(gameLoop);
}

// Función para determinar si la mano está abierta
function isOpenHand(predictions) {
    if (!predictions || predictions.length === 0) {
        statusDiv.textContent = "Estado: No se detecta la mano";
        return false;
    }
    
    const hand = predictions[0];
    if (!hand.annotations) {
        statusDiv.textContent = "Estado: Error en anotaciones";
        return false;
    }

    // Obtener las posiciones de los dedos
    const indexFinger = hand.annotations.indexFinger;
    const middleFinger = hand.annotations.middleFinger;
    const ringFinger = hand.annotations.ringFinger;
    const pinky = hand.annotations.pinky;

    // Verificar si los dedos están extendidos
    const fingerTips = [
        indexFinger[3][1],
        middleFinger[3][1],
        ringFinger[3][1],
        pinky[3][1]
    ];

    const fingerBases = [
        indexFinger[0][1],
        middleFinger[0][1],
        ringFinger[0][1],
        pinky[0][1]
    ];

    let extendedFingers = 0;
    for (let i = 0; i < fingerTips.length; i++) {
        if (fingerTips[i] < fingerBases[i] - 30) { // Aumentar el umbral para mayor precisión
            extendedFingers++;
        }
    }

    // Calcular la confianza (0-100%)
    const confidence = (extendedFingers / 4) * 100;
    
    // La mano está abierta solo si la confianza es mayor al 95%
    const isOpen = confidence > 95;
    
    // Mostrar solo el estado sin la confianza
    statusDiv.textContent = `Estado: ${isOpen ? "Mano Abierta" : "Mano Cerrada"}`;
    statusDiv.style.color = isOpen ? "#00ff00" : "#ff0000";

    return isOpen;
}

function drawDebugInfo(landmarks, debug) {
    handCtx.clearRect(0, 0, handCanvas.width, handCanvas.height);
    
    // Dibujar conexiones entre puntos
    handCtx.strokeStyle = '#00ff00';
    handCtx.lineWidth = 2;

    // Dibujar líneas entre articulaciones de los dedos
    const fingerIndices = [
        [0,1,2,3,4],          // Pulgar
        [0,5,6,7,8],          // Índice
        [0,9,10,11,12],       // Medio
        [0,13,14,15,16],      // Anular
        [0,17,18,19,20]       // Meñique
    ];

    fingerIndices.forEach(finger => {
        for (let i = 0; i < finger.length - 1; i++) {
            const start = landmarks[finger[i]];
            const end = landmarks[finger[i + 1]];
            
            handCtx.beginPath();
            handCtx.moveTo(start[0], start[1]);
            handCtx.lineTo(end[0], end[1]);
            handCtx.stroke();
        }
    });

    // Dibujar puntos de las articulaciones
    landmarks.forEach((point, index) => {
        handCtx.fillStyle = index === 0 ? '#ff0000' : '#00ff00';
        handCtx.beginPath();
        handCtx.arc(point[0], point[1], 4, 0, 2 * Math.PI);
        handCtx.fill();
    });

    // Mostrar información de debug
    handCtx.fillStyle = '#00ff00';
    handCtx.font = '12px Arial';
    handCtx.fillText(`Dist: ${Math.round(debug.avgDistance)}`, 10, 20);
    handCtx.fillText(`Ext: ${debug.extendedFingers}`, 10, 40);
    handCtx.fillText(`Ang: ${debug.extendedByAngle}`, 10, 60);
    handCtx.fillText(`Pos: ${debug.extendedByPosition}`, 10, 80);
}

// Mejorar la función drawHand para más feedback visual
function drawHand(predictions) {
    if (!predictions || predictions.length === 0) return;
    
    const hand = predictions[0];
    handCtx.clearRect(0, 0, handCanvas.width, handCanvas.height);
    
    if (hand.landmarks) {
        // Dibujar líneas entre los puntos
        handCtx.strokeStyle = '#00ff00';
        handCtx.lineWidth = 2;
        
        // Conectar dedos
        for (let i = 0; i < hand.landmarks.length - 1; i++) {
            const point1 = hand.landmarks[i];
            const point2 = hand.landmarks[i + 1];
            
            handCtx.beginPath();
            handCtx.moveTo(point1[0], point1[1]);
            handCtx.lineTo(point2[0], point2[1]);
            handCtx.stroke();
        }

        // Dibujar puntos
        handCtx.fillStyle = '#00ff00';
        hand.landmarks.forEach(point => {
            handCtx.beginPath();
            handCtx.arc(point[0], point[1], 4, 0, 2 * Math.PI);
            handCtx.fill();
        });
    }
} 