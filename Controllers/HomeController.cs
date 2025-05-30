using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;

namespace PrimerProyecto.Controllers
{
    public class HomeController : Controller
    {
        // Constantes para las keys de sesión
        private const string ROOM_COMPLETED_PREFIX = "Room_";
        private const string GAMESTART_COMPLETED = "GameStart_Completed";
        private const string ROOM7_CODEX_COMPLETED = "Room7Codex_Completed";
        private const string ACHIEVEMENT_PREFIX = "Achievement_";

        private bool IsRoomCompleted(int roomNumber)
        {
            return HttpContext.Session.GetString($"{ROOM_COMPLETED_PREFIX}{roomNumber}") == "true";
        }

        private void MarkRoomAsCompleted(int roomNumber)
        {
            HttpContext.Session.SetString($"{ROOM_COMPLETED_PREFIX}{roomNumber}", "true");
            UnlockAchievement(roomNumber);
        }

        private void UnlockAchievement(int roomNumber)
        {
            HttpContext.Session.SetString($"{ACHIEVEMENT_PREFIX}{roomNumber}", "true");
        }

        private bool IsAchievementUnlocked(int roomNumber)
        {
            return HttpContext.Session.GetString($"{ACHIEVEMENT_PREFIX}{roomNumber}") == "true";
        }

        private bool IsGameStartCompleted()
        {
            return HttpContext.Session.GetString(GAMESTART_COMPLETED) == "true";
        }

        private void MarkGameStartAsCompleted()
        {
            HttpContext.Session.SetString(GAMESTART_COMPLETED, "true");
            UnlockAchievement(2);
        }

        private string GetRoomNameByNumber(int roomNumber)
        {
            if (roomNumber == 7 && IsRoomCompleted(7))
            {
                return "Room7Codex";
            }
            return $"Room{roomNumber}";
        }

        private bool CanAccessRoom(int roomNumber, string roomName = null)
        {
            // Room 1 siempre es accesible y su logro se desbloquea automáticamente
            if (roomNumber == 1)
            {
                UnlockAchievement(1);
                return true;
            }

            // Room 2 requiere completar GameStart
            if (roomNumber == 2)
            {
                return IsGameStartCompleted();
            }

            // Room7Codex requiere completar Room 7
            if (roomName == "Room7Codex")
            {
                return IsRoomCompleted(7);
            }

            // Room 8 requiere completar Room7Codex
            if (roomNumber == 8)
            {
                return HttpContext.Session.GetString(ROOM7_CODEX_COMPLETED) == "true";
            }

            // Room 9 requiere completar Room 8
            if (roomNumber == 9)
            {
                return IsRoomCompleted(8);
            }

            // Las demás rooms requieren completar la anterior
            return IsRoomCompleted(roomNumber - 1);
        }

        private IActionResult CheckRoomAccess(int roomNumber, string roomName = null)
        {
            roomName = roomName ?? GetRoomNameByNumber(roomNumber);

            if (!CanAccessRoom(roomNumber, roomName))
            {
                if (roomNumber == 2)
                {
                    TempData["ErrorMessage"] = "Debes completar el GameStart y ser redirigido correctamente.";
                }
                else if (roomName == "Room7Codex")
                {
                    TempData["ErrorMessage"] = "Debes completar la Room 7 primero.";
                }
                else if (roomNumber == 8)
                {
                    TempData["ErrorMessage"] = "Debes completar el Room7Codex primero.";
                }
                else if (roomNumber == 9)
                {
                    TempData["ErrorMessage"] = "Debes completar la Room 8 primero.";
                }
                else
                {
                    TempData["ErrorMessage"] = $"Debes completar la Room {roomNumber-1} primero.";
                }

                return RedirectToAction("RoomLocked", new { roomNumber, roomName });
            }

            // Configuración específica para cada room
            switch (roomNumber)
            {
                case 3:
                    ViewBag.SecuenciaCorrecta = "ATCG";
                    ViewBag.Grid = new List<List<char>>
                    {
                        "ATCGATCGAT".ToList(),
                        "TCGATCGATC".ToList(),
                        "CGATCGATCG".ToList(),
                        "GATCGATCGA".ToList(),
                        "ATCGATCGAT".ToList(),
                        "TCGATCGATC".ToList(),
                        "CGATCGATCG".ToList(),
                        "GATCGATCGA".ToList(),
                        "ATCGATCGAT".ToList(),
                        "TCGATCGATC".ToList()
                    };
                    break;
                case 5:
                    // Configuración específica para Room5 si es necesaria
                    break;
                case 8:
                    // Configuración específica para Room8 si es necesaria
                    break;
            }
            
            return View(roomName);
        }

        [Route("Home/RoomLocked")]
        public IActionResult RoomLocked([FromQuery] int roomNumber, [FromQuery] string roomName = null)
        {
            ViewBag.RoomNumber = roomNumber;
            ViewBag.RoomName = roomName ?? GetRoomNameByNumber(roomNumber);
            return View();
        }

        public IActionResult Index()
        {
            // Desbloquear automáticamente el logro de Room1
            UnlockAchievement(1);
            return View();
        }

        public IActionResult Room1()
        {
            // Desbloquear automáticamente el logro de Room1
            UnlockAchievement(1);
            return View();
        }

        public IActionResult GameStart()
        {
            return View();
        }

        [HttpPost]
        [Route("Home/AdminUnlock")]
        public IActionResult AdminUnlock([FromQuery] int roomNumber, [FromQuery] string roomName = null)
        {
            roomName = roomName ?? GetRoomNameByNumber(roomNumber);

            // Para mantener la progresión, desbloqueamos la room anterior también
            if (roomNumber > 1)
            {
                MarkRoomAsCompleted(roomNumber - 1);
                UnlockAchievement(roomNumber - 1);
            }

            // Desbloquear la room actual
            MarkRoomAsCompleted(roomNumber);
            UnlockAchievement(roomNumber);
            
            // Casos especiales
            if (roomNumber == 2)
            {
                MarkGameStartAsCompleted();
            }
            else if (roomName == "Room7Codex")
            {
                MarkRoomAsCompleted(7);
                HttpContext.Session.SetString(ROOM7_CODEX_COMPLETED, "true");
                UnlockAchievement(8);
            }
            else if (roomNumber == 8)
            {
                MarkRoomAsCompleted(7);
                HttpContext.Session.SetString(ROOM7_CODEX_COMPLETED, "true");
            }

            // Verificar que realmente podemos acceder a la room después del desbloqueo
            if (!CanAccessRoom(roomNumber, roomName))
            {
                return Json(new { success = false, message = "No se pudo desbloquear la room. Verifica que hayas completado los requisitos previos." });
            }

            return Json(new { success = true, redirectTo = $"/Home/{roomName}" });
        }

        [HttpPost]
        public IActionResult CompleteGameStart()
        {
            MarkGameStartAsCompleted();
            return Json(new { success = true });
        }

        [HttpPost]
        public IActionResult CompleteRoom(int roomNumber)
        {
            if (roomNumber < 1 || roomNumber > 9)
            {
                return Json(new { success = false, message = "Número de room inválido" });
            }

            MarkRoomAsCompleted(roomNumber);

            if (roomNumber == 7 && Request.Query.ContainsKey("codex"))
            {
                HttpContext.Session.SetString(ROOM7_CODEX_COMPLETED, "true");
                UnlockAchievement(8);
            }

            return Json(new { success = true });
        }

        public IActionResult Room2()
        {
            return CheckRoomAccess(2);
        }

        public IActionResult Room3()
        {
            return CheckRoomAccess(3);
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

        [Route("Home/Room7Codex")]
        public IActionResult Room7Codex()
        {
            return CheckRoomAccess(7, "Room7Codex");
        }

        public IActionResult Room8()
        {
            return CheckRoomAccess(8);
        }

        public IActionResult Room9()
        {
            return CheckRoomAccess(9);
        }

        public IActionResult Logros()
        {
            var achievements = new List<bool>();
            for (int i = 1; i <= 8; i++)
            {
                achievements.Add(IsAchievementUnlocked(i));
            }
            ViewBag.Achievements = achievements;
            return View();
        }

        public IActionResult Tutorial()
        {
            return View();
        }
    }
}

