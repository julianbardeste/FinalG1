// js/search-simple.js
const navInput = document.getElementById("navSearchInput");
const suggestions = document.getElementById("searchSuggestions");
let allProducts = null;

// Carga simple y cache en sessionStorage (se hace solo una vez)
async function loadAllProducts() {
  const cached = sessionStorage.getItem("allProductsCache");
  if (cached) { allProducts = JSON.parse(cached); return; }
  try {
    const cats = await fetch(CATEGORIES_URL).then(r => r.json());
    const proms = cats.map(c => fetch(PRODUCTS_URL + c.id + EXT_TYPE).then(r => r.json()).catch(()=>null));
    const lists = await Promise.all(proms);
    const merged = [];
    lists.forEach(l => { if (l && l.products) merged.push(...l.products); });
    // quitar duplicados por id
    const map = {};
    merged.forEach(p => { map[p.id] = p; });
    allProducts = Object.values(map);
    sessionStorage.setItem("allProductsCache", JSON.stringify(allProducts));
  } catch (e) {
    console.error("Error cargando productos:", e);
    allProducts = [];
  }
}

function showSuggestions(items) {
  suggestions.innerHTML = "";
  if (!items.length) { suggestions.style.display = "none"; return; }

  items.forEach(p => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex align-items-center";

    // elegir url de imagen (p.image o p.images[0]) y fallback
    const imgSrc = p.image || (p.images && p.images[0]) || "img/no-image.png";

    const img = document.createElement("img");
    img.src = imgSrc;
    img.alt = p.name || "producto";
    img.width = 44;
    img.height = 44;
    img.onerror = () => { img.src = "img/no-image.png"; };

    const textWrap = document.createElement("div");
    textWrap.className = "suggest-text";

    const title = document.createElement("div");
    title.textContent = p.name || "(sin nombre)";
    title.style.fontWeight = "600";

    const sub = document.createElement("div");
    sub.className = "suggest-sub";
    if (p.cost !== undefined) {
        sub.textContent = `${p.currency || ''} ${p.cost}`;
    } else if (p.description) {
        sub.textContent = p.description.slice(0, 60) + (p.description.length > 60 ? "…" : "");
    }

    textWrap.appendChild(title);
    textWrap.appendChild(sub);

    li.appendChild(img);
    li.appendChild(textWrap);

    li.addEventListener("click", () => {
        localStorage.setItem("productID", p.id);
        window.location.href = "product-info.html";
    });

    suggestions.appendChild(li);
    });

    suggestions.style.display = "block";
}


navInput && navInput.addEventListener("input", async () => {
    const q = navInput.value.trim().toLowerCase();
    if (!q) { suggestions.style.display = "none"; return; }
    if (!allProducts) await loadAllProducts();
    const matches = allProducts.filter(p =>
    (p.name && p.name.toLowerCase().includes(q)) ||
    (p.description && p.description.toLowerCase().includes(q))
    );
  showSuggestions(matches.slice(0, 6)); // mostrar hasta 6 sugerencias
});

// clic fuera para ocultar
document.addEventListener("click", (e) => {
    if (!navInput.contains(e.target) && !suggestions.contains(e.target)) {
    suggestions.style.display = "none";
    }
});

// =====================
// DETALLE DEL PRODUCTO
// =====================

const productContainer = document.getElementById("product-container");

// Obtener el ID guardado en localStorage
const productID = localStorage.getItem("productID");

// Si no hay ID, mostrar error
if (!productID) {
  productContainer.innerHTML = `
    <div class="alert alert-danger text-center">
      No se encontró el producto seleccionado.
    </div>
  `;
} else {
  // Construir la URL de la API
  const url = `https://japceibal.github.io/emercado-api/products/${productID}.json`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      renderProduct(data);
    })
    .catch(err => {
      console.error("Error cargando producto:", err);
      productContainer.innerHTML = `
        <div class="alert alert-danger text-center">
          Ocurrió un error al cargar el producto.
        </div>
      `;
    });
}

// Renderizar la información
function renderProduct(prod) {
  productContainer.innerHTML = `
    <div class="col-md-6 product-data contenedor-imagen">
      <!-- Carrusel de imágenes -->
      <div id="carouselImages" class="carousel slide" data-bs-ride="carousel">
        <div class="carousel-inner">
          ${prod.images.map((img, i) => `
            <div class="carousel-item ${i === 0 ? "active" : ""}">
              <img src="${img}" class="d-block w-100 rounded" alt="${prod.name}">
            </div>
          `).join("")}
        </div>
        <button class="carousel-control-prev" type="button" data-bs-target="#carouselImages" data-bs-slide="prev">
          <span class="carousel-control-prev-icon"></span>
        </button>
        <button class="carousel-control-next" type="button" data-bs-target="#carouselImages" data-bs-slide="next">
          <span class="carousel-control-next-icon"></span>
        </button>
      </div>
    </div>

    <div class="col-md-6 product-data">
      <h2>${prod.name}</h2>
      <p class="text-muted">Categoría: <strong>${prod.category}</strong></p>
      <p>${prod.description}</p>
      <p><strong>Precio:</strong> ${prod.currency} ${prod.cost}</p>
      <p><strong>Vendidos:</strong> ${prod.soldCount}</p>
      <div id ="buttons-container" class="row my-4">
        <button id="agregarCarrito" class="btn btn-primary col mx-2">Agregar al carrito</button>
        <button id="comprar" class="btn btn-success col mx-2">Comprar</button>
      </div>
    </div>
    
  `;
}
