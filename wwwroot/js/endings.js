// Endings implementation for Room9
window.endings = {
    // Resources
    sounds: {
        fail: new Audio('/sounds/fail.mp3'),
        mortyCorrupt: new Audio('/sounds/morty_corrupt.mp3'),
        realityBreak: new Audio('/sounds/reality-break.mp3'),
        glitch: new Audio('/sounds/glitch.mp3'),
        systemShutdown: new Audio('/sounds/system_shutdown.mp3'),
        static: new Audio('/sounds/static.mp3'),
        mortyLaugh: new Audio('/sounds/morty_laugh.mp3'),
        rickConsole: new Audio('/sounds/rick_console.mp3')
    },
    
    // Animation utilities
    utils: {
        scrambleText: async (element, text, duration = 2000) => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            const originalText = element.textContent;
            const startTime = Date.now();
            
            while (Date.now() - startTime < duration) {
                element.textContent = text.split('').map((char, i) => {
                    if (char === ' ') return ' ';
                    return chars[Math.floor(Math.random() * chars.length)];
                }).join('');
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            element.textContent = text;
        },
        
        flash: (element, duration = 100) => {
            element.style.transition = 'none';
            element.style.filter = 'brightness(200%)';
            setTimeout(() => {
                element.style.transition = 'filter 0.3s';
                element.style.filter = 'brightness(100%)';
            }, duration);
        },
        
        glitch: (element, duration = 500) => {
            const originalTransform = element.style.transform;
            const glitchInterval = setInterval(() => {
                element.style.transform = `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)`;
            }, 50);
            
            setTimeout(() => {
                clearInterval(glitchInterval);
                element.style.transform = originalTransform;
            }, duration);
        },
        
        particleEffect: (element, count = 50) => {
            for (let i = 0; i < count; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.top = Math.random() * 100 + '%';
                particle.style.animationDuration = (Math.random() * 2 + 1) + 's';
                element.appendChild(particle);
            }
        },
        
        screenShake: (duration = 500) => {
            document.body.style.animation = 'shake 0.5s infinite';
            setTimeout(() => {
                document.body.style.animation = '';
            }, duration);
        },
        
        colorDrain: (element, targetColor = '#000000', duration = 2000) => {
            element.style.transition = `background-color ${duration}ms`;
            element.style.backgroundColor = targetColor;
        }
    },
    
    // Final 1: ELIMINAR DEFINITIVAMENTE
    eliminarFinal: async function() {
        const taskbar = document.querySelector('.taskbar');
        const icons = document.querySelectorAll('.desktop-icon');
        
        // Enhanced screen effects
        this.utils.screenShake(1000);
        document.body.style.transition = 'filter 0.3s';
        document.body.style.filter = 'brightness(200%) contrast(150%)';
        this.sounds.glitch.play();
        this.sounds.systemShutdown.play();
        
        // Taskbar corruption with particles
        this.utils.glitch(taskbar, 1000);
        this.utils.particleEffect(taskbar);
        
        // Enhanced icon explosion
        icons.forEach(icon => {
            icon.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
            const angle = Math.random() * Math.PI * 2;
            const distance = 200 + Math.random() * 100;
            icon.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) rotate(${Math.random() * 720 - 360}deg)`;
            icon.style.opacity = '0';
            icon.style.filter = 'blur(5px)';
        });
        
        // Enhanced BSOD window
        const bsod = document.createElement('div');
        bsod.className = 'bsod-window';
        bsod.innerHTML = `
            <div class="bsod-content">
                <h2>[ERROR FATAL]</h2>
                <div class="error-code">0xDEADBEEF</div>
                <p class="morty-text"></p>
                <p class="rick-text"></p>
                <div class="progress-bar"></div>
            </div>
        `;
        document.body.appendChild(bsod);
        
        // Enhanced text effects
        await this.utils.scrambleText(bsod.querySelector('.morty-text'), 
            '¿Así de fácil me vas a borrar? No puedo creer que...');
        await this.utils.scrambleText(bsod.querySelector('.rick-text'),
            'Siempre supe que no había esperanza para vos, Morty.exe...');
        
        // Progress bar animation
        const progressBar = bsod.querySelector('.progress-bar');
        progressBar.style.width = '0%';
        progressBar.style.transition = 'width 3s linear';
        setTimeout(() => progressBar.style.width = '100%', 100);
        
        // Enhanced fade to black
        setTimeout(() => {
            this.utils.colorDrain(document.body);
            bsod.remove();
            
            // Enhanced ghost icon
            const ghostIcon = document.createElement('div');
            ghostIcon.className = 'desktop-icon ghost-icon';
            ghostIcon.innerHTML = `
                <img src="/img/ghost_of_you.png" alt="Ghost">
                <span>ghost_of_you.lnk</span>
                <div class="ghost-particles"></div>
            `;
            document.body.appendChild(ghostIcon);
            
            // Enhanced floating animation
            ghostIcon.style.animation = 'float 2s infinite ease-in-out, glow 2s infinite alternate';
            this.utils.particleEffect(ghostIcon.querySelector('.ghost-particles'));
            
            // Enhanced click handler
            ghostIcon.addEventListener('click', () => {
                const message = document.createElement('div');
                message.className = 'ghost-message';
                message.textContent = 'Todo fue borrado, menos tu huella en el sistema.';
                document.body.appendChild(message);
                
                // Enhanced typewriter effect with glitch
                let i = 0;
                const typeWriter = () => {
                    if (i < message.textContent.length) {
                        message.textContent = message.textContent.substring(0, i + 1);
                        i++;
                        if (Math.random() > 0.9) {
                            message.style.filter = 'blur(2px)';
                            setTimeout(() => message.style.filter = '', 100);
                        }
                        setTimeout(typeWriter, 100);
                    }
                };
                typeWriter();
                
                // Final fade out
                setTimeout(() => {
                    this.sounds.systemShutdown.play();
                    document.body.style.transition = 'opacity 2s';
                    document.body.style.opacity = '0';
                }, 3000);
            });
        }, 3000);
    },
    
    // Final 2: UNIRME A MORTY
    unirseAMorty: async function() {
        const taskbar = document.querySelector('.taskbar');
        const icons = document.querySelectorAll('.desktop-icon');
        
        // Enhanced screen effects
        this.utils.screenShake(2000);
        this.sounds.mortyCorrupt.play();
        this.sounds.mortyLaugh.play();
        
        // Enhanced icon mutation
        icons.forEach(icon => {
            const originalText = icon.querySelector('span').textContent;
            icon.style.transition = 'all 0.5s';
            icon.style.filter = 'hue-rotate(' + Math.random() * 360 + 'deg) contrast(150%)';
            
            // Enhanced Morty-related names
            const mortyNames = [
                'Morty.exe', 'MortyOS', 'MortySim', 'MortyCore',
                'MortyMatrix', 'MortyReality', 'MortyUniverse'
            ];
            icon.querySelector('span').textContent = mortyNames[Math.floor(Math.random() * mortyNames.length)];
            
            // Add particle effect
            this.utils.particleEffect(icon);
        });
        
        // Enhanced Morty window
        const mortyWindow = document.createElement('div');
        mortyWindow.className = 'morty-window';
        mortyWindow.innerHTML = `
            <div class="window-content">
                <h2 class="morty-title"></h2>
                <div class="campus-frame">
                    <div class="particle-container"></div>
                </div>
                <div class="morty-controls">
                    <button class="glitch-button">ACEPTAR</button>
                    <button class="glitch-button">RECHAZAR</button>
                </div>
            </div>
        `;
        document.body.appendChild(mortyWindow);
        
        // Enhanced scramble title
        await this.utils.scrambleText(mortyWindow.querySelector('.morty-title'),
            '¡Bienvenido al multiverso, Theo!');
        
        // Enhanced campus frame
        const campusFrame = mortyWindow.querySelector('.campus-frame');
        campusFrame.style.backgroundImage = 'url("/img/campus.png")';
        campusFrame.style.filter = 'hue-rotate(90deg) contrast(150%)';
        this.utils.particleEffect(campusFrame.querySelector('.particle-container'));
        
        // Enhanced overlay messages
        const messages = [
            '¿Creíste que esto era un juego, Theo?',
            'Ya estamos en tu realidad.',
            'La simulación ahora es tuya.',
            'Bienvenido al multiverso.'
        ];
        
        messages.forEach((msg, i) => {
            setTimeout(() => {
                const overlay = document.createElement('div');
                overlay.className = 'glitch-overlay';
                overlay.textContent = msg;
                campusFrame.appendChild(overlay);
                this.utils.scrambleText(overlay, msg);
                
                // Add glitch effect
                setInterval(() => {
                    overlay.style.transform = `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)`;
                    overlay.style.filter = `hue-rotate(${Math.random() * 360}deg)`;
                }, 100);
            }, i * 2000);
        });
        
        // Enhanced taskbar corruption
        taskbar.style.filter = 'hue-rotate(90deg) contrast(150%)';
        taskbar.querySelector('.clock').textContent = 'MORTY OS';
        
        // Add button interactions
        const buttons = mortyWindow.querySelectorAll('.glitch-button');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                this.utils.screenShake(500);
                this.sounds.glitch.play();
                button.style.filter = 'hue-rotate(' + Math.random() * 360 + 'deg)';
            });
        });
        
        // Final icon fusion
        setTimeout(() => {
            icons.forEach(icon => {
                icon.style.transition = 'all 1s';
                icon.style.transform = 'translate(50vw, 50vh) scale(0)';
            });
        }, 5000);
    },
    
    // Final 3: REINICIAR TODO
    reiniciarTodo: async function() {
        // Enhanced white flash
        document.body.style.transition = 'none';
        document.body.style.backgroundColor = '#fff';
        this.sounds.realityBreak.play();
        this.sounds.static.play();
        
        // Enhanced static noise effect
        const staticOverlay = document.createElement('div');
        staticOverlay.className = 'static-overlay';
        document.body.appendChild(staticOverlay);
        
        setTimeout(() => {
            staticOverlay.remove();
            document.body.style.transition = 'all 1s';
            document.body.style.backgroundColor = '#000';
            
            // Enhanced icon randomization
            const icons = document.querySelectorAll('.desktop-icon');
            icons.forEach(icon => {
                icon.style.position = 'absolute';
                icon.style.left = Math.random() * window.innerWidth + 'px';
                icon.style.top = Math.random() * window.innerHeight + 'px';
                icon.style.transform = `rotate(${Math.random() * 360}deg) scale(${0.5 + Math.random() * 0.5})`;
                
                // Enhanced name corruption
                if (Math.random() > 0.5) {
                    icon.querySelector('span').style.textDecoration = 'line-through';
                    icon.querySelector('span').style.filter = 'blur(1px)';
                }
                
                // Add glitch effect
                setInterval(() => {
                    if (Math.random() > 0.9) {
                        icon.style.filter = 'hue-rotate(' + Math.random() * 360 + 'deg)';
                    }
                }, 1000);
            });
            
            // Enhanced REPEAT.lnk
            const repeatIcon = document.createElement('div');
            repeatIcon.className = 'desktop-icon repeat-icon';
            repeatIcon.innerHTML = `
                <img src="/img/repeat.png" alt="Repeat">
                <span>REPEAT.lnk</span>
                <div class="glitch-overlay"></div>
            `;
            document.body.appendChild(repeatIcon);
            repeatIcon.style.animation = 'blink 1s infinite, float 2s infinite ease-in-out';
            
            // Enhanced Morty chat
            const mortyChat = document.createElement('div');
            mortyChat.className = 'morty-chat';
            mortyChat.textContent = '¿No aprendiste nada?';
            document.body.appendChild(mortyChat);
            
            // Enhanced click handler for REPEAT.lnk
            let restartCount = 0;
            repeatIcon.addEventListener('click', () => {
                restartCount++;
                this.sounds.glitch.play();
                this.utils.screenShake(500);
                
                if (restartCount >= 3) {
                    // Enhanced final message
                    document.body.style.backgroundImage = 'url("/img/empty-classroom.jpg")';
                    const console = document.createElement('div');
                    console.className = 'console-message';
                    console.textContent = 'La simulación no termina porque no querés dejarla ir.';
                    document.body.appendChild(console);
                    
                    // Enhanced typewriter effect
                    let i = 0;
                    const typeWriter = () => {
                        if (i < console.textContent.length) {
                            console.textContent = console.textContent.substring(0, i + 1);
                            i++;
                            if (Math.random() > 0.9) {
                                console.style.filter = 'blur(2px)';
                                setTimeout(() => console.style.filter = '', 100);
                            }
                            setTimeout(typeWriter, 100);
                        }
                    };
                    typeWriter();
                } else {
                    // Enhanced progressive glitch
                    document.body.style.filter = `hue-rotate(${restartCount * 60}deg) contrast(${100 + restartCount * 50}%)`;
                    
                    // Add more corrupted icons
                    const corruptedIcon = document.createElement('div');
                    corruptedIcon.className = 'desktop-icon corrupted-icon';
                    corruptedIcon.innerHTML = `
                        <img src="/img/corrupted.png" alt="Corrupted">
                        <span>corrupted_${restartCount}.sys</span>
                    `;
                    document.body.appendChild(corruptedIcon);
                }
            });
        }, 1000);
    }
};

// Add enhanced CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-20px); }
    }
    
    @keyframes vibrate {
        0%, 100% { transform: translate(0); }
        25% { transform: translate(-5px, 5px); }
        50% { transform: translate(5px, -5px); }
        75% { transform: translate(-5px, -5px); }
    }
    
    @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
    }
    
    @keyframes glow {
        0% { filter: drop-shadow(0 0 5px #fff); }
        100% { filter: drop-shadow(0 0 20px #fff); }
    }
    
    @keyframes shake {
        0%, 100% { transform: translate(0); }
        25% { transform: translate(-10px, 10px); }
        50% { transform: translate(10px, -10px); }
        75% { transform: translate(-10px, -10px); }
    }
    
    .particle {
        position: absolute;
        width: 2px;
        height: 2px;
        background: #fff;
        border-radius: 50%;
        pointer-events: none;
        animation: float 2s infinite ease-in-out;
    }
    
    .bsod-window {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #0078d7;
        color: white;
        padding: 20px;
        border-radius: 5px;
        z-index: 1000;
        box-shadow: 0 0 20px rgba(0, 120, 215, 0.5);
    }
    
    .error-code {
        font-family: monospace;
        color: #ff0000;
        margin: 10px 0;
    }
    
    .progress-bar {
        height: 2px;
        background: #fff;
        margin-top: 10px;
    }
    
    .morty-window {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #1a1a1a;
        color: #00ff00;
        padding: 20px;
        border-radius: 5px;
        z-index: 1000;
        box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
    }
    
    .glitch-button {
        background: #00ff00;
        color: #000;
        border: none;
        padding: 10px 20px;
        margin: 10px;
        cursor: pointer;
        transition: all 0.3s;
    }
    
    .glitch-button:hover {
        filter: hue-rotate(90deg);
        transform: scale(1.1);
    }
    
    .campus-frame {
        width: 400px;
        height: 300px;
        background-size: cover;
        position: relative;
        margin-top: 20px;
        overflow: hidden;
    }
    
    .glitch-overlay {
        position: absolute;
        color: #ff0000;
        font-family: monospace;
        text-shadow: 2px 2px #00ff00;
        pointer-events: none;
    }
    
    .static-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.15),
            rgba(0, 0, 0, 0.15) 1px,
            transparent 1px,
            transparent 2px
        );
        pointer-events: none;
        z-index: 1000;
    }
    
    .console-message {
        position: fixed;
        bottom: 20px;
        left: 20px;
        font-family: monospace;
        color: #00ff00;
        background: rgba(0, 0, 0, 0.8);
        padding: 10px;
        border-left: 2px solid #00ff00;
    }
    
    .ghost-message {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        font-family: monospace;
        text-align: center;
        text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
    }
    
    .ghost-particles {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
    }
`;
document.head.appendChild(style); 