document
  .getElementById("ingresarform")
  .addEventListener("submit", function (e) {
    // Agregamos un evento al formulario con el id "ingresarform"
    e.preventDefault(); // evita que se envíe el formulario

    const usuario = document.getElementById("username").value; // obtenemos el valor del campo de usuario
    const clave = document.getElementById("password").value; // obtenemos el valor del campo de clave

    if (usuario && clave) {
      sessionStorage.setItem("logueado", "true");
      sessionStorage.setItem("usuario", usuario); //se guarda el nombre de usuario
      window.location.href = "index.html";
    }
  });
