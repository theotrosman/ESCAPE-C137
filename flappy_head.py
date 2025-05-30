import pygame
import sys
import random
import cv2
import mediapipe as mp
import numpy as np
import threading
from queue import Queue

# Inicialización de Pygame
pygame.init()

# Configuración de la pantalla
SCREEN_WIDTH = 400
SCREEN_HEIGHT = 600
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption('Flappy Head')

# Colores
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
GREEN = (0, 255, 0)
RED = (255, 0, 0)
SKY_BLUE = (135, 206, 235)

# Configuración del pájaro
class Bird:
    def __init__(self):
        self.x = SCREEN_WIDTH // 3
        self.y = SCREEN_HEIGHT // 2
        self.velocity = 0
        self.gravity = 0.8
        self.jump_strength = -10
        self.size = 30
        
    def jump(self):
        self.velocity = self.jump_strength
        
    def move(self):
        self.velocity += self.gravity
        self.y += self.velocity
        
    def draw(self):
        pygame.draw.circle(screen, RED, (self.x, int(self.y)), self.size)
        
    def get_rect(self):
        return pygame.Rect(self.x - self.size, self.y - self.size, 
                         self.size * 2, self.size * 2)

# Configuración de los tubos
class Pipe:
    def __init__(self):
        self.gap = 200
        self.width = 70
        self.x = SCREEN_WIDTH
        self.height = random.randint(100, SCREEN_HEIGHT - 100 - self.gap)
        self.color = GREEN
        self.speed = 3
        
    def move(self):
        self.x -= self.speed
        
    def draw(self):
        # Tubo inferior
        pygame.draw.rect(screen, self.color, 
                        (self.x, self.height + self.gap, 
                         self.width, SCREEN_HEIGHT - (self.height + self.gap)))
        # Tubo superior
        pygame.draw.rect(screen, self.color, 
                        (self.x, 0, self.width, self.height))
        
    def get_rects(self):
        top_pipe = pygame.Rect(self.x, 0, self.width, self.height)
        bottom_pipe = pygame.Rect(self.x, self.height + self.gap, 
                                self.width, SCREEN_HEIGHT - (self.height + self.gap))
        return top_pipe, bottom_pipe

# Cola para comunicación entre hilos
head_up_queue = Queue()

# Función para la detección facial en un hilo separado
def face_detection():
    mp_face_mesh = mp.solutions.face_mesh
    face_mesh = mp_face_mesh.FaceMesh(
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
    
    cap = cv2.VideoCapture(0)
    
    while True:
        success, image = cap.read()
        if not success:
            continue
            
        # Convertir la imagen a RGB
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(image)
        
        # Convertir de nuevo a BGR para mostrar
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
        
        if results.multi_face_landmarks:
            face_landmarks = results.multi_face_landmarks[0]
            
            # Obtener puntos clave para detectar inclinación de la cabeza
            nose_tip = face_landmarks.landmark[1]
            left_eye = face_landmarks.landmark[33]
            right_eye = face_landmarks.landmark[263]
            
            # Calcular la inclinación vertical
            eye_y = (left_eye.y + right_eye.y) / 2
            head_tilt = nose_tip.y - eye_y
            
            # Detectar si la cabeza está inclinada hacia arriba
            head_up = head_tilt < -0.05
            head_up_queue.put(head_up)
            
            # Dibujar indicador visual
            status_text = "Cabeza arriba!" if head_up else "Cabeza normal"
            cv2.putText(image, status_text, (10, 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0) if head_up else (0, 0, 255), 2)
            
        # Mostrar la imagen de la cámara
        cv2.imshow('Face Detection', image)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
            
    cap.release()
    cv2.destroyAllWindows()

# Iniciar el hilo de detección facial
detection_thread = threading.Thread(target=face_detection)
detection_thread.daemon = True
detection_thread.start()

# Configuración del juego
clock = pygame.time.Clock()
bird = Bird()
pipes = []
pipe_spawn_timer = 0
PIPE_SPAWN_INTERVAL = 1500  # milisegundos
score = 0
font = pygame.font.Font(None, 36)

# Bucle principal del juego
running = True
while running:
    current_time = pygame.time.get_ticks()
    
    # Manejo de eventos
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_SPACE:
                bird.jump()
    
    # Verificar el gesto de la cabeza
    try:
        while not head_up_queue.empty():
            head_up = head_up_queue.get_nowait()
            if head_up:
                bird.jump()
    except:
        pass
    
    # Actualizar posición del pájaro
    bird.move()
    
    # Generar nuevos tubos
    if current_time - pipe_spawn_timer > PIPE_SPAWN_INTERVAL:
        pipes.append(Pipe())
        pipe_spawn_timer = current_time
    
    # Actualizar tubos
    for pipe in pipes[:]:
        pipe.move()
        if pipe.x + pipe.width < 0:
            pipes.remove(pipe)
            score += 1
    
    # Verificar colisiones
    bird_rect = bird.get_rect()
    for pipe in pipes:
        top_rect, bottom_rect = pipe.get_rects()
        if bird_rect.colliderect(top_rect) or bird_rect.colliderect(bottom_rect):
            running = False
    
    # Verificar si el pájaro se sale de la pantalla
    if bird.y < 0 or bird.y > SCREEN_HEIGHT:
        running = False
    
    # Dibujar
    screen.fill(SKY_BLUE)
    for pipe in pipes:
        pipe.draw()
    bird.draw()
    
    # Mostrar puntuación
    score_text = font.render(f'Score: {score}', True, BLACK)
    screen.blit(score_text, (10, 10))
    
    pygame.display.flip()
    clock.tick(60)

# Limpiar
pygame.quit()
cv2.destroyAllWindows()
sys.exit() 