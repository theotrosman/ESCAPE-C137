using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;

namespace PrimerProyecto.Controllers
{
    public class HomeController : Controller
    {
        private bool CanAccessRoom(int roomNumber)
        {
            // Room1 siempre es accesible
            if (roomNumber == 1) return true;
            
            // Para Room2, verificar si fue desbloqueada específicamente
            if (roomNumber == 2)
            {
                return HttpContext.Session.GetString("Room2Unlocked") == "true";
            }
            
            // Para las demás rooms, verificar si la anterior está completada
            var previousCompleted = HttpContext.Session.GetString($"Room{roomNumber-1}Completed") == "true";
            return previousCompleted;
        }

        private IActionResult CheckRoomAccess(int roomNumber, string viewName = null)
        {
            if (!CanAccessRoom(roomNumber))
            {
                if (roomNumber == 2)
                {
                    TempData["ErrorMessage"] = "Debes completar el GameStart y ser redirigido correctamente.";
                }
                else
                {
                    TempData["ErrorMessage"] = $"Debes completar la Room {roomNumber-1} primero.";
                }
                return RedirectToAction("RoomLocked", new { roomNumber = roomNumber });
            }
            
            return View(viewName ?? $"Room{roomNumber}");
        }

        public IActionResult RoomLocked(int roomNumber)
        {
            ViewBag.RoomNumber = roomNumber;
            return View();
        }

        public IActionResult Index()
        {
            // Verificar si ya se vio la animación
            bool animationSeen = HttpContext.Session.GetString("AnimationSeen") == "true";
            ViewBag.SkipAnimation = animationSeen;
            
            // Marcar la animación como vista
            HttpContext.Session.SetString("AnimationSeen", "true");
            
            return View();
        }

        public IActionResult Logros()
        {
            return View();
        }

        public IActionResult Tutorial()
        {
            return View();
        }

        public IActionResult Room1()
        {
            return View();
        }

        [HttpPost]
        public IActionResult CompleteRoom(int roomNumber)
        {
            if (roomNumber == 2)
            {
                // Si es Room2, marcar GameStart como completado y desbloquear Room2
                HttpContext.Session.SetString("GameStartCompleted", "true");
                HttpContext.Session.SetString("Room2Unlocked", "true");
            }
            
            HttpContext.Session.SetString($"Room{roomNumber}Completed", "true");
            return Json(new { success = true });
        }

        public IActionResult GameStart()
        {
            return View();
        }

        public IActionResult Room2()
        {
            return CheckRoomAccess(2);
        }

        public IActionResult Room3()
        {
            if (!CanAccessRoom(3))
            {
                return CheckRoomAccess(3);
            }

            var bases = new[] { 'A', 'T', 'G', 'C' };
            string secuenciaCorrecta;
            List<List<char>> grid = new();
            Random rnd = new Random();

            secuenciaCorrecta = "AACGTACTGT";

            int columnaCorrecta = rnd.Next(0, 10); 

            for (int row = 0; row < 10; row++)
            {
                grid.Add(new List<char>());
                for (int col = 0; col < 10; col++)
                {
                    char letra;
                    if (col == columnaCorrecta)
                        letra = secuenciaCorrecta[row];
                    else
                        letra = bases[rnd.Next(bases.Length)];
                    grid[row].Add(letra);
                }
            }

            ViewBag.Grid = grid;
            ViewBag.SecuenciaCorrecta = secuenciaCorrecta;
            return View();
        }

        public IActionResult Room4()
        {
            return CheckRoomAccess(4);
        }

        public IActionResult Room5()
        {
            return CheckRoomAccess(5);
        }

        public IActionResult Room6()
        {
            return CheckRoomAccess(6);
        }

        public IActionResult Room7()
        {
            return CheckRoomAccess(7);
        }

        public IActionResult Room7Codex()
        {
            return CheckRoomAccess(7, "Room7Codex");
        }

        public IActionResult Room8()
        {
            return CheckRoomAccess(8);
        }
    }
}
