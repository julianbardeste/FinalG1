// URLs de la API del e-mercado para obtener datos de diferentes secciones
const CATEGORIES_URL = "http://localhost:3000/json/cats/cat.json";
const PUBLISH_PRODUCT_URL =
"http://localhost:3000/json/sell/publish.json";
const PRODUCTS_URL = id => `http://localhost:3000/json/cats_products/${id}.json`;
const PRODUCT_INFO_URL = "http://localhost:3000/json/products/";
const PRODUCT_INFO_COMMENTS_URL =
"http://localhost:3000/json/products_comments/";
const CART_INFO_URL = "http://localhost:3000/json/cart/buy.json";
const CART_BUY_URL = "http://localhost:3000/json/cart/buy.json";
// Extensión de archivo para las APIs
const EXT_TYPE = ".json";

// Función para mostrar el spinner de carga
let showSpinner = function () {
  document.getElementById("spinner-wrapper").style.display = "block";
};

// Función para ocultar el spinner de carga
let hideSpinner = function () {
  document.getElementById("spinner-wrapper").style.display = "none";
};

// Función para obtener datos JSON desde una URL con manejo de errores
let getJSONData = function (url) {
  let result = {};
  showSpinner(); // Mostrar spinner mientras carga
  return fetch(url)
    .then((response) => {
      // Verificar si la respuesta es exitosa
      if (response.ok) {
        return response.json();
      } else {
        throw Error(response.statusText);
      }
    })
    .then(function (response) {
      // Si todo salió bien, guardar los datos
      result.status = "ok";
      result.data = response;
      hideSpinner();
      return result;
    })
    .catch(function (error) {
      // Si hubo error, guardarlo y ocultar spinner
      result.status = "error";
      result.data = error;
      hideSpinner();
      return result;
    });
};
// Control de autenticación: redirigir a login si no está logueado
document.addEventListener("DOMContentLoaded", function () {
  // Verificar si el usuario está logueado
  if (sessionStorage.getItem("logueado") !== "true") {
    // Si no está en la página de login, redirigir
    if (!window.location.pathname.includes("login.html")) {
      alert("Debes iniciar sesión para acceder a esta página.");
      window.location.href = "login.html";
      return;
    }
  }
});

// Obtener datos del usuario logueado y configurar la barra de navegación
let usuario = sessionStorage.getItem("usuario");
let userNavbar = document.getElementById("userNavbar");

// Si hay usuario logueado y existe el elemento navbar, crear el dropdown del usuario
if (usuario && userNavbar) {
  userNavbar.innerHTML = `
      <div class="dropdown">
        <a class="nav-link dropdown-toggle text-white" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
          👤 ${usuario}
        </a>
        <ul class="dropdown-menu dropdown-menu-end">
          <li><a class="dropdown-item" href="cart.html">🛒 Mi carrito</a></li>
          <li><a class="dropdown-item" href="my-profile.html">👤 Mi perfil</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item text-danger" id="logoutBtn" href="#">🚪 Cerrar sesión</a></li>
        </ul>
      </div>
    `;
}

// Configurar el botón de cerrar sesión
let logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", function () {
    // Limpiar todos los datos de sesión y redirigir al login
    sessionStorage.clear();
    window.location.href = "login.html";
  });
}
