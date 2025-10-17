// Configurar los eventos de navegación para las categorías de productos
document.addEventListener("DOMContentLoaded", function(){
    // Evento para la categoría de Autos (ID: 101)
    document.getElementById("autos").addEventListener("click", function() {
        localStorage.setItem("catID", 101);
        window.location = "products.html"
    });

    // Evento para la categoría de Juguetes (ID: 102)
    document.getElementById("juguetes").addEventListener("click", function() {
        localStorage.setItem("catID", 102);
        window.location = "products.html"
    });

    // Evento para la categoría de Muebles (ID: 103)
    document.getElementById("muebles").addEventListener("click", function() {
        localStorage.setItem("catID", 103);
        window.location = "products.html"
    });
});

// Verificación adicional de autenticación para la página principal
if (sessionStorage.getItem("logueado") !== "true") {
  // Si no está logueado, mostrar alerta y redirigir al login
  alert("Debes iniciar sesión para acceder a esta página.");
  window.location.href = "login.html";
}

// Obtener elementos
const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
const currentTheme = localStorage.getItem('theme')
// Función para cambiar el tema
function switchTheme(e) {
    if (e.target.checked) {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
    }
}