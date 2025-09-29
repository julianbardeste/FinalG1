// Controlador del formulario de inicio de sesión
document
  .getElementById("ingresarform")
  .addEventListener("submit", function (e) {
    // Prevenir el envío normal del formulario
    e.preventDefault();

    // Obtener los valores de los campos de entrada
    const usuario = document.getElementById("username").value;
    const clave = document.getElementById("password").value;

    // Validar que ambos campos tengan contenido
    if (usuario && clave) {
      // Marcar al usuario como logueado en sessionStorage
      sessionStorage.setItem("logueado", "true");
      sessionStorage.setItem("usuario", usuario);
      // Redirigir a la página principal
      window.location.href = "index.html";
    }
  });
