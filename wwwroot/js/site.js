// Please see documentation at https://learn.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.

window.obtenerNombreJugador = function(callback) {
    fetch('/Home/GetPlayerName')
        .then(r => r.json())
        .then(data => {
            if (data && data.name) callback(data.name);
            else callback('Morty');
        })
        .catch(() => callback('Morty'));
};
