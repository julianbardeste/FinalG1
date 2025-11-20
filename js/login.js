// URL del backend para autenticación
const LOGIN_API_URL = "http://localhost:3000/api/login";

// Controlador del formulario de inicio de sesión
document
  .getElementById("ingresarform")
  .addEventListener("submit", async function (e) {
    // Prevenir el envío normal del formulario
    e.preventDefault();

    // Obtener los valores de los campos de entrada
    const email = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // Validar que ambos campos tengan contenido
    if (email && password) {
      try {
        // Realizar petición al backend
        const response = await fetch(LOGIN_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (data.success) {
          // Login exitoso - guardar token y datos del usuario
          sessionStorage.setItem("logueado", "true");
          sessionStorage.setItem("token", data.token); // Guardar el token JWT
          sessionStorage.setItem("usuario", data.user.email);
          sessionStorage.setItem("userId", data.user.id);
          sessionStorage.setItem("userName", data.user.name);

          // Redirigir a la página principal
          window.location.href = "index.html";
        } else {
          // Mostrar mensaje de error
          alert(data.message || "Error al iniciar sesión");
        }
      } catch (error) {
        console.error("Error al conectar con el servidor:", error);
        alert("Error al conectar con el servidor. Asegúrate de que el backend esté corriendo en http://localhost:3000");
      }
    } else {
      alert("Por favor, completa todos los campos");
    }
  });
