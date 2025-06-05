// Simple 3D endless runner for Room9
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

let scene, camera, renderer;
let player;
const lanePositions = [-2, 0, 2];
let currentLane = 1;
let velocityY = 0;
let obstacles = [];
let coins = [];
let grounds = [];
let stars;
let lastSpawn = 0;
let lastCoin = 0;
let score = 0;
let speedMult = 1;
let running = false;

const GRAVITY = -0.012;
const JUMP_VELOCITY = 0.25;
const SPEED = 0.15;
const SPAWN_INTERVAL = 1500;
const COIN_INTERVAL = 1000;

function createStars() {
    const starGeo = new THREE.BufferGeometry();
    const vertices = [];
    for (let i = 0; i < 500; i++) {
        vertices.push((Math.random() - 0.5) * 50);
        vertices.push((Math.random() - 0.5) * 50);
        vertices.push(-Math.random() * 200);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.3 });
    stars = new THREE.Points(starGeo, mat);
    scene.add(stars);
}

function updateScore() {
    document.getElementById('score').textContent = score;
}

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3, 5);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const light = new THREE.HemisphereLight(0xffffff, 0x444444);
    light.position.set(0, 20, 0);
    scene.add(light);

    createStars();

    const floorGeo = new THREE.BoxGeometry(6, 0.1, 20);
    const floorMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
    for (let i = 0; i < 10; i++) {
        const g = new THREE.Mesh(floorGeo, floorMat);
        g.position.z = -i * 20;
        scene.add(g);
        grounds.push(g);
    }

    const playerGeo = new THREE.BoxGeometry(1, 1, 1);
    const playerMat = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    player = new THREE.Mesh(playerGeo, playerMat);
    player.position.set(lanePositions[currentLane], 0.5, 0);
    scene.add(player);

    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onWindowResize);

    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(event) {
    if (!running && event.code === 'Space') {
        running = true;
    }
    if (!running) return;
    if (event.code === 'ArrowLeft') {
        currentLane = Math.max(0, currentLane - 1);
    } else if (event.code === 'ArrowRight') {
        currentLane = Math.min(lanePositions.length - 1, currentLane + 1);
    } else if (event.code === 'Space') {
        if (player.position.y <= 0.51) {
            velocityY = JUMP_VELOCITY;
        }
    }
}

function spawnObstacle() {
    const size = 0.8 + Math.random() * 0.7;
    const geo = new THREE.BoxGeometry(size, size, size);
    const mat = new THREE.MeshPhongMaterial({ color: 0xff5555 });
    const ob = new THREE.Mesh(geo, mat);
    const lane = Math.floor(Math.random() * lanePositions.length);
    ob.position.set(lanePositions[lane], size / 2, camera.position.z - 40);
    scene.add(ob);
    obstacles.push(ob);
}

function spawnCoin() {
    const geo = new THREE.TorusGeometry(0.3, 0.1, 8, 16);
    const mat = new THREE.MeshPhongMaterial({ color: 0xffff00 });
    const coin = new THREE.Mesh(geo, mat);
    const lane = Math.floor(Math.random() * lanePositions.length);
    const height = Math.random() > 0.5 ? 1 : 2;
    coin.position.set(lanePositions[lane], height, camera.position.z - 40);
    coin.rotation.x = Math.PI / 2;
    scene.add(coin);
    coins.push(coin);
}

function animate(time) {
    requestAnimationFrame(animate);
    if (!running) {
        renderer.render(scene, camera);
        return;
    }

    if (time - lastSpawn > SPAWN_INTERVAL) {
        spawnObstacle();
        lastSpawn = time;
    }

    if (time - lastCoin > COIN_INTERVAL) {
        spawnCoin();
        lastCoin = time;
    }

    velocityY += GRAVITY;
    player.position.y += velocityY;
    if (player.position.y < 0.5) {
        player.position.y = 0.5;
        velocityY = 0;
    }

    player.position.x = lanePositions[currentLane];

    speedMult += 0.00002; // gradually increase speed

    obstacles.forEach(ob => {
        ob.position.z += SPEED * speedMult;
    });
    coins.forEach(c => {
        c.rotation.y += 0.1;
        c.position.z += SPEED * speedMult;
    });
    grounds.forEach(g => {
        g.position.z += SPEED * speedMult;
        if (g.position.z > camera.position.z + 10) {
            g.position.z -= 200;
        }
    });

    obstacles = obstacles.filter(ob => {
        if (ob.position.z > camera.position.z + 5) {
            scene.remove(ob);
            score++;
            updateScore();
            if (score % 20 === 0) {
                jumpDimension();
            }
            if (score >= 60) {
                completeRoom();
            }
            return false;
        }
        if (Math.abs(ob.position.z - player.position.z) < 1 && Math.abs(ob.position.x - player.position.x) < 0.8 && player.position.y < 1) {
            endGame();
            return false;
        }
        return true;
    });

    coins = coins.filter(c => {
        if (c.position.z > camera.position.z + 5) {
            scene.remove(c);
            return false;
        }
        if (Math.abs(c.position.z - player.position.z) < 0.8 && Math.abs(c.position.x - player.position.x) < 0.8 && Math.abs(c.position.y - player.position.y) < 1) {
            scene.remove(c);
            score += 5;
            updateScore();
            return false;
        }
        return true;
    });

    stars.position.z += 0.05 * speedMult;
    if (stars.position.z > 0) stars.position.z = -200;

    renderer.render(scene, camera);
}

function jumpDimension() {
    const hue = (Math.random() * 360) | 0;
    scene.background = new THREE.Color(`hsl(${hue},50%,15%)`);
    grounds.forEach(g => g.material.color.set(`hsl(${hue},50%,30%)`));
    stars.material.color.set(`hsl(${hue},50%,80%)`);
}

function endGame() {
    running = false;
    alert('¡Chocaste! Inténtalo de nuevo');
    window.location.reload();
}

function completeRoom() {
    running = false;
    fetch('/Home/CompleteRoom/9', { method: 'POST', headers: {'Content-Type':'application/json'} })
      .then(r => r.json())
      .then(d => {
          if (d.success) {
              alert('¡Escapaste a la siguiente dimensión!');
              window.location.href = '/Home/Logros';
          }
      });
}

export { init };
