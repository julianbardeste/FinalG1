// js/search-simple.js
const navInput = document.getElementById("navSearchInput");
const suggestions = document.getElementById("searchSuggestions");
let allProducts = null;

// Carga simple y cache en sessionStorage (se hace solo una vez)
async function loadAllProducts() {
  const CATEGORIES_URL = "https://japceibal.github.io/emercado-api/cats/cat.json";
  const PRODUCTS_URL = "https://japceibal.github.io/emercado-api/cats_products/";
  const EXT_TYPE = ".json";
  
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
console.log("Elemento productContainer encontrado:", productContainer);

// Obtener el ID guardado en localStorage
let productID = localStorage.getItem("productID");
console.log("ProductID obtenido:", productID);

// Si no hay ID, usar uno por defecto para testing
if (!productID) {
  productID = "50921";
  console.log("No se encontró productID, usando 50921 por defecto");
}

// Si aún no hay ID válido, mostrar error
if (!productID || productID === "null") {
  productContainer.innerHTML = `
    <div class="error-state">
      <i class="fas fa-exclamation-triangle"></i>
      <h3>Producto no encontrado</h3>
      <p>No se encontró el producto seleccionado. Por favor, regresa a la página de productos.</p>
      <a href="products.html" class="product-btn product-btn-primary">
        <i class="fas fa-arrow-left me-2"></i>Volver a productos
      </a>
    </div>
  `;
} else {
  // Construir la URL de la API
  const url = `https://japceibal.github.io/emercado-api/products/${productID}.json`;
  console.log("URL a cargar:", url);

  fetch(url)
    .then(res => {
      console.log("Respuesta del fetch:", res);
      return res.json();
    })
    .then(data => {
      console.log("Datos del producto:", data);
      renderProduct(data);
    })
    .catch(err => {
      console.error("Error cargando producto:", err);
      productContainer.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-circle"></i>
          <h3>Error al cargar el producto</h3>
          <p>Ocurrió un error al cargar la información del producto. Por favor, intenta nuevamente.</p>
          <button onclick="location.reload()" class="product-btn product-btn-outline">
            <i class="fas fa-redo me-2"></i>Reintentar
          </button>
        </div>
      `;
    });
}

// Renderizar la información con el estilo moderno
function renderProduct(prod) {
  console.log("Renderizando producto:", prod);
  productContainer.innerHTML = `
    <div class="product-detail-card">
      <div class="product-image-container">
        <!-- Carrusel de imágenes principal -->
        <div id="carouselImages" class="carousel slide" data-bs-ride="carousel">
          <div class="carousel-inner">
            ${prod.images.map((img, i) => `
              <div class="carousel-item ${i === 0 ? "active" : ""}">
                <img src="${img}" class="d-block w-100" alt="${prod.name}">
              </div>
            `).join("")}
          </div>
          ${prod.images.length > 1 ? `
            <button class="carousel-control-prev" type="button" data-bs-target="#carouselImages" data-bs-slide="prev">
              <span class="carousel-control-prev-icon"></span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#carouselImages" data-bs-slide="next">
              <span class="carousel-control-next-icon"></span>
            </button>
          ` : ''}
        </div>
        
        <!-- Miniaturas de imágenes -->
        ${prod.images.length > 1 ? `
          <div class="image-thumbnails">
            ${prod.images.map((img, i) => `
              <div class="thumbnail-item ${i === 0 ? "active" : ""}" data-slide-to="${i}">
                <img src="${img}" alt="${prod.name} - imagen ${i + 1}">
              </div>
            `).join("")}
          </div>
        ` : ''}
      </div>

      <div class="product-info">
        <h1 class="product-title">${prod.name}</h1>
        <p class="product-category">
          <i class="fas fa-tag me-2"></i>Categoría: ${prod.category}
        </p>
        <p class="product-description">${prod.description}</p>
        
        <div class="product-meta">
          <div class="product-price">
            <i class="fas fa-dollar-sign"></i>
            ${prod.currency} ${prod.cost.toLocaleString()}
          </div>
          <div class="product-sold">
            <i class="fas fa-chart-line"></i>
            ${prod.soldCount.toLocaleString()} vendidos
          </div>
        </div>

        <div class="buttons-container">
          <button id="agregarCarrito" class="product-btn product-btn-primary">
            <i class="fas fa-shopping-cart"></i>
            Agregar al carrito
          </button>
          <button id="comprar" class="product-btn product-btn-success">
            <i class="fas fa-credit-card"></i>
            Comprar ahora
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Configurar funcionalidad de las miniaturas después de renderizar
  setupThumbnailsCarousel();
}

// Función para configurar la sincronización entre miniaturas y carrusel
function setupThumbnailsCarousel() {
  const carousel = document.getElementById('carouselImages');
  const thumbnails = document.querySelectorAll('.thumbnail-item');
  
  if (!carousel || thumbnails.length === 0) return;
  
  // Crear instancia del carrusel de Bootstrap
  const bootstrapCarousel = new bootstrap.Carousel(carousel, {
    interval: 5000, // Auto slide cada 5 segundos
    wrap: true
  });
  
  // Agregar event listeners a las miniaturas
  thumbnails.forEach((thumbnail, index) => {
    thumbnail.addEventListener('click', () => {
      // Cambiar al slide correspondiente
      bootstrapCarousel.to(index);
      
      // Actualizar clase active en miniaturas
      updateActiveThumbnail(index);
    });
  });
  
  // Escuchar eventos del carrusel para sincronizar miniaturas
  carousel.addEventListener('slide.bs.carousel', (event) => {
    updateActiveThumbnail(event.to);
  });
}

// Función para actualizar la miniatura activa
function updateActiveThumbnail(activeIndex) {
  const thumbnails = document.querySelectorAll('.thumbnail-item');
  
  thumbnails.forEach((thumbnail, index) => {
    if (index === activeIndex) {
      thumbnail.classList.add('active');
    } else {
      thumbnail.classList.remove('active');
    }
  });
}
