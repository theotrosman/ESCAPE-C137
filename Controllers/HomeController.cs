using Microsoft.AspNetCore.Mvc;

namespace PrimerProyecto.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
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
        public IActionResult GameStart()
        {
            return View();
        }
        public IActionResult Room2()
        {
            return View();
        }
        public IActionResult Room3()
{
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
            return View();
        }
        public IActionResult Room5()
        {
            return View();
        }
        public IActionResult Room6()
        {
            return View();
        }
        public IActionResult Room7()
        {
            return View();
        }
        public IActionResult Room7Codex()
        {
            return View();
        }
        public IActionResult Room8()
        {
            return View();
        }
    }
}
