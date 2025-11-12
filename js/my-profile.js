/* =======================================
   PERFIL DE USUARIO - my-profile.js

   Este archivo esta destinado a manejar toda la funcionalidad
   de la pagina de perfil de usuario del sitio eMercado.

   ESTADO ACTUAL: En desarrollo

   FUNCIONALIDADES PLANIFICADAS:
   - Mostrar informacion del usuario logueado
   - Editar datos personales (nombre, apellido, email)
   - Cambiar password de la cuenta
   - Subir y cambiar foto de perfil
   - Gestionar preferencias de la cuenta
   - Mostrar historial de compras
   - Gestionar direcciones de envio
   - Configurar metodos de pago

   ELEMENTOS DEL DOM ESPERADOS:
   - Formulario de datos personales
   - Campo de subida de imagen de perfil
   - Seccion de historial de compras
   - Formulario de cambio de password
   - Lista de direcciones guardadas
   - Configuracion de notificaciones

   ======================================= */

// Al cargar el documento, inicializar la funcionalidad del perfil
document.addEventListener("DOMContentLoaded", function () {
  // TODO: Implementar inicializaci�n del perfil de usuario
  console.log("Perfil de usuario cargado - Funcionalidad en desarrollo");

  // TODO: Cargar datos del usuario desde sessionStorage/localStorage
  // TODO: Poblar formularios con informaci�n existente
  // TODO: Configurar validaci�n de formularios
  // TODO: Configurar subida de imagen de perfil
  // TODO: Cargar historial de compras del usuario
});

/* =======================================
   FUNCIONES PLANIFICADAS:

   - loadUserData(): Cargar informaci�n del usuario logueado
   - populateProfileForm(): Llenar formulario con datos existentes
   - validateProfileForm(): Validar datos del formulario
   - updateUserData(): Actualizar informaci�n del usuario
   - uploadProfileImage(): Subir nueva imagen de perfil
   - changePassword(): Cambiar contrase�a del usuario
   - loadPurchaseHistory(): Cargar historial de compras
   - addShippingAddress(): Agregar nueva direcci�n de env�o
   - updateUserPreferences(): Actualizar preferencias del usuario

   VALIDACIONES REQUERIDAS:
   - Email v�lido
   - Contrase�a con requisitos m�nimos de seguridad
   - Campos obligatorios completados
   - Formato de imagen v�lido para foto de perfil

   ======================================= */

// Elementos del DOM
const profileForm = document.getElementById("profileForm"); // Formulario de perfil
const imageUpload = document.getElementById("imageUpload"); // Input de subida de imagen
const profileImage = document.getElementById("profileImage"); // Imagen de perfil
const successMessage = document.getElementById("successMessage"); // Mensaje de exito

// Cargar datos guardados al iniciar
document.addEventListener("DOMContentLoaded", function () {
  loadProfileData();
});

// Cargar datos del localStorage
function loadProfileData() {
  const savedData = {
    nombre: localStorage.getItem("nombre") || "",
    apellido: localStorage.getItem("apellido") || "",
    email: localStorage.getItem("email") || "",
    telefono: localStorage.getItem("telefono") || "",
    profileImage: localStorage.getItem("profileImage") || "",
  };

  document.getElementById("nombre").value = savedData.nombre;
  document.getElementById("apellido").value = savedData.apellido;
  document.getElementById("email").value = savedData.email;
  document.getElementById("telefono").value = savedData.telefono;

  if (savedData.profileImage) {
    profileImage.src = savedData.profileImage;
    profileImage.style.fontSize = "0";
  } else {
    profileImage.src = "";
    profileImage.textContent = "👤";
    profileImage.style.fontSize = "3rem";
  }
}

// Manejar el envío del formulario
profileForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const formData = {
    nombre: document.getElementById("nombre").value.trim(),
    apellido: document.getElementById("apellido").value.trim(),
    email: document.getElementById("email").value.trim(),
    telefono: document.getElementById("telefono").value.trim(),
  };

  // Validación básica
  if (!formData.nombre || !formData.apellido || !formData.email) {
    alert("Por favor completa todos los campos obligatorios");
    return;
  }

  // Guardar en localStorage
  localStorage.setItem("nombre", formData.nombre);
  localStorage.setItem("apellido", formData.apellido);
  localStorage.setItem("email", formData.email);
  localStorage.setItem("telefono", formData.telefono);

  // Mostrar mensaje de éxito
  showSuccessMessage();
});

// Manejar la carga de imagen
imageUpload.addEventListener("change", function (e) {
  const file = e.target.files[0];

  if (file) {
    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona un archivo de imagen válido");
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen es demasiado grande. Máximo 5MB");
      return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
      const imageData = event.target.result;
      profileImage.src = imageData;
      profileImage.style.fontSize = "0";
      profileImage.textContent = "";

      // Guardar en localStorage
      localStorage.setItem("profileImage", imageData);

      showSuccessMessage();
    };

    reader.readAsDataURL(file);
  }
});

// Mostrar mensaje de éxito
function showSuccessMessage() {
  successMessage.classList.add("show");
  setTimeout(() => {
    successMessage.classList.remove("show");
  }, 3000);
}
