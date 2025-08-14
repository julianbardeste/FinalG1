document.getElementById("ingresarform").addEventListener("submit", function(e) {
  e.preventDefault(); // evita que se envíe el formulario
  window.location.href = "pagina_destino.html"; // redirecciona


    const usuario = document.getElementById("username").value;
    const clave = document.getElementById("password").value;

    sessionStorage.setItem("logueado", "true");
    // Redirigimos a la portada
    window.location.href = "index.html";

});
