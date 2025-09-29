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

