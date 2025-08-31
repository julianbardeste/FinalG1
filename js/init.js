const CATEGORIES_URL = "https://japceibal.github.io/emercado-api/cats/cat.json";
const PUBLISH_PRODUCT_URL = "https://japceibal.github.io/emercado-api/sell/publish.json";
const PRODUCTS_URL = "https://japceibal.github.io/emercado-api/cats_products/";
const PRODUCT_INFO_URL = "https://japceibal.github.io/emercado-api/products/";
const PRODUCT_INFO_COMMENTS_URL = "https://japceibal.github.io/emercado-api/products_comments/";
const CART_INFO_URL = "https://japceibal.github.io/emercado-api/user_cart/";
const CART_BUY_URL = "https://japceibal.github.io/emercado-api/cart/buy.json";
const EXT_TYPE = ".json";

let showSpinner = function(){
  document.getElementById("spinner-wrapper").style.display = "block";
}

let hideSpinner = function(){
  document.getElementById("spinner-wrapper").style.display = "none";
}

let getJSONData = function(url){
    let result = {};
    showSpinner();
    return fetch(url)
    .then(response => {
      if (response.ok) {
        return response.json();
      }else{
        throw Error(response.statusText);
      }
    })
    .then(function(response) {
          result.status = 'ok';
          result.data = response;
          hideSpinner();
          return result;
    })
    .catch(function(error) {
        result.status = 'error';
        result.data = error;
        hideSpinner();
        return result;
    });
}
document.addEventListener("DOMContentLoaded", function(){
  if (sessionStorage.getItem("logueado") !== "true") {
    if (!window.location.pathname.includes("login.html")) {
      alert("Debes iniciar sesión para acceder a esta página.");
      window.location.href = "login.html";
      return;
    }
  }
});

     let usuario = sessionStorage.getItem("usuario");
  let userNavbar = document.getElementById("userNavbar");

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

  let logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      sessionStorage.clear();
      window.location.href = "login.html";
    });
  };