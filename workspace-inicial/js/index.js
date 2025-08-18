document.addEventListener("DOMContentLoaded", function(){
    document.getElementById("autos").addEventListener("click", function() {
        localStorage.setItem("catID", 101);
        window.location = "products.html"
    });
    document.getElementById("juguetes").addEventListener("click", function() {
        localStorage.setItem("catID", 102);
        window.location = "products.html"
    });
    document.getElementById("muebles").addEventListener("click", function() {
        localStorage.setItem("catID", 103);
        window.location = "products.html"
    });
});

if (sessionStorage.getItem("logueado") !== "true") {
  // Si no está logueado, redirige al login y no al index
  alert("Debes iniciar sesión para acceder a esta página."); // Muestra un mensaje de alerta
  window.location.href = "login.html";
}