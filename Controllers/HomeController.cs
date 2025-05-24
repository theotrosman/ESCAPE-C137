using Microsoft.AspNetCore.Mvc;

namespace PrimerProyecto.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Escape()
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
    var random = new Random();
    var bases = new[] { 'A', 'T', 'G', 'C' };
    var grid = new List<List<char>>();
    for (int i = 0; i < 10; i++)
        grid.Add(new List<char>(new char[10]));

    string valid1 = GenerarSecuenciaValida(random, bases);
    string valid2;
    do {
        valid2 = GenerarSecuenciaValida(random, bases);
    } while (valid2 == valid1);

    int col1 = random.Next(0, 10);
    int col2;
    do {
        col2 = random.Next(0, 10);
    } while (col2 == col1);

    for (int row = 0; row < 10; row++)
    {
        for (int col = 0; col < 10; col++)
        {
            if (col == col1)
                grid[row][col] = valid1[row];
            else if (col == col2)
                grid[row][col] = valid2[row];
            else
                grid[row][col] = bases[random.Next(4)];
        }
    }

    ViewBag.Grid = grid;
    ViewBag.SecuenciaCorrecta = valid1;
    ViewBag.SecuenciaAlternativa = valid2;

    return View();
}

private string GenerarSecuenciaValida(Random rand, char[] bases)
{
    while (true)
    {
        string s = "";
        for (int i = 0; i < 10; i++)
        {
            char next = bases[rand.Next(4)];
            if (i >= 2 && next == s[i - 1] && next == s[i - 2])
            {
                i--; continue;
            }
            s += next;
        }

        if (!EsPalindromo(s)) return s;
    }
}

private bool EsPalindromo(string s)
{
    for (int i = 0; i < s.Length / 2; i++)
        if (s[i] != s[s.Length - 1 - i]) return false;
    return true;
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
        public IActionResult RoomFinal()
        {
            return View();
        }
    }
}
