document.getElementById("ingresarform").addEventListener("submit", function(e) { // Agregamos un evento al formulario con el id "ingresarform"
  e.preventDefault(); // evita que se envíe el formulario


    const usuario = document.getElementById("username").value; // obtenemos el valor del campo de usuario
    const clave = document.getElementById("password").value; // obtenemos el valor del campo de clave

    //en el almacenamiento del navegador se guardan los valores con el nombre "logueado" y el valor "true"
    sessionStorage.setItem("logueado", "true"); 
    // Si "logueado" = "true", Redirigimos a la portada
    window.location.href = "index.html"; 

});
