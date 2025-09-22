"use strict";

/* -------------------------
   BÚSQUEDA SIMPLE Y SUGERENCIAS
   Este bloque proviene de tu implementación original:
   - carga y cache de todos los productos (sessionStorage)
   - filtra y muestra sugerencias en el navbar
   ------------------------- */
const navInput = document.getElementById("navSearchInput");
const suggestions = document.getElementById("searchSuggestions");
let allProducts = null;

// Carga simple y caché en sessionStorage (se hace una vez por sesión)
async function loadAllProducts() {
  const CATEGORIES_URL =
    "https://japceibal.github.io/emercado-api/cats/cat.json";
  const PRODUCTS_URL =
    "https://japceibal.github.io/emercado-api/cats_products/";
  const EXT_TYPE = ".json";

  const cached = sessionStorage.getItem("allProductsCache");
  if (cached) {
    allProducts = JSON.parse(cached);
    return;
  }

  try {
    // 1) obtener listado de categorías
    const cats = await fetch(CATEGORIES_URL).then((r) => r.json());
    // 2) por cada categoría pedir su JSON de productos
    const proms = cats.map((c) =>
      fetch(PRODUCTS_URL + c.id + EXT_TYPE)
        .then((r) => r.json())
        .catch(() => null)
    );
    const lists = await Promise.all(proms);
    // 3) consolidar todos los arrays en uno
    const merged = [];
    lists.forEach((l) => {
      if (l && l.products) merged.push(...l.products);
    });
    // 4) eliminar duplicados por id (map simple)
    const map = {};
    merged.forEach((p) => {
      map[p.id] = p;
    });
    allProducts = Object.values(map);
    // 5) guardar en sessionStorage para no volver a pedir todo
    sessionStorage.setItem("allProductsCache", JSON.stringify(allProducts));
  } catch (e) {
    console.error("Error cargando productos (loadAllProducts):", e);
    allProducts = [];
  }
}

// Muestra la lista de sugerencias debajo del input de búsqueda
function showSuggestions(items) {
  if (!suggestions) return;
  suggestions.innerHTML = "";
  if (!items || items.length === 0) {
    suggestions.style.display = "none";
    return;
  }

  items.forEach((p) => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex align-items-center";

    // Elegir url de imagen (p.image o p.images[0]) y fallback a una imagen local
    const imgSrc = p.image || (p.images && p.images[0]) || "img/no-image.png";

    const img = document.createElement("img");
    img.src = imgSrc;
    img.alt = p.name || "producto";
    img.width = 44;
    img.height = 44;
    // fallback si la imagen no carga
    img.onerror = () => {
      img.src = "img/no-image.png";
    };

    const textWrap = document.createElement("div");
    textWrap.className = "suggest-text ms-3";

    const title = document.createElement("div");
    title.textContent = p.name || "(sin nombre)";
    title.style.fontWeight = "600";

    const sub = document.createElement("div");
    sub.className = "suggest-sub text-muted small";
    if (p.cost !== undefined) {
      sub.textContent = `${p.currency || ""} ${p.cost}`;
    } else if (p.description) {
      sub.textContent =
        p.description.slice(0, 60) + (p.description.length > 60 ? "…" : "");
    }

    textWrap.appendChild(title);
    textWrap.appendChild(sub);

    li.appendChild(img);
    li.appendChild(textWrap);

    // Al clickear una sugerencia -> guardar productID y llevar a product-info
    li.addEventListener("click", () => {
      localStorage.setItem("productID", p.id);
      window.location.href = "product-info.html";
    });

    suggestions.appendChild(li);
  });

  suggestions.style.display = "block";
}

// Evento de input en la barra de búsqueda (filtrado)
if (navInput) {
  navInput.addEventListener("input", async () => {
    const q = navInput.value.trim().toLowerCase();
    if (!q) {
      if (suggestions) suggestions.style.display = "none";
      return;
    }
    if (!allProducts) await loadAllProducts();
    const matches = allProducts.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
    showSuggestions(matches.slice(0, 6)); // mostrar hasta 6 sugerencias
  });
}

// clic fuera para ocultar las sugerencias
document.addEventListener("click", (e) => {
  if (
    navInput &&
    suggestions &&
    !navInput.contains(e.target) &&
    !suggestions.contains(e.target)
  ) {
    suggestions.style.display = "none";
  }
});

/* ================================
   DETALLE DEL PRODUCTO
   - Obtener productID desde localStorage
   - Hacer fetch al recurso products/{id}.json
   - Renderizar toda la pantalla de detalle
   ================================ */

// Contenedor donde inyectamos todo el detalle
const productContainer = document.getElementById("product-container");
console.log("Elemento productContainer encontrado:", productContainer);

// Spinner DOM (para mostrar/ocultar carga)
const spinnerWrapper = document.getElementById("spinner-wrapper");
function mostrarSpinner() {
  if (spinnerWrapper) spinnerWrapper.style.display = "block";
}
function ocultarSpinner() {
  if (spinnerWrapper) spinnerWrapper.style.display = "none";
}

// Recuperamos el ID guardado en localStorage (lo que se setea desde products.html o sugerencias)
let productID = localStorage.getItem("productID");
console.log("ProductID obtenido:", productID);

// Si no hay ID guardado, usar uno por defecto para testing (como ya tenías)
if (!productID) {
  productID = "50921";
  console.log("No se encontró productID, usando 50921 por defecto");
}

// Si aún no hay ID válido (null o "null"), mostrar un estado de error
if (!productID || productID === "null") {
  if (productContainer) {
    productContainer.innerHTML = `
      <div class="error-state p-4 text-center">
        <i class="fas fa-exclamation-triangle fa-2x text-warning"></i>
        <h3 class="mt-3">Producto no encontrado</h3>
        <p>No se encontró el producto seleccionado. Por favor, regresa a la página de productos.</p>
        <a href="products.html" class="product-btn product-btn-primary mt-2">
          <i class="fas fa-arrow-left me-2"></i>Volver a productos
        </a>
      </div>
    `;
  }
} else {
  // Construir la URL de la API (formato del repo de emercado)
  const url = `https://japceibal.github.io/emercado-api/products/${productID}.json`;
  console.log("URL a cargar:", url);

  // Cargar el producto (async/await para claridad)
  (async function loadProduct() {
    try {
      mostrarSpinner();
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.log("Datos del producto:", data);
      renderProduct(data);
      // Cargar comentarios del producto
      loadComments(productID);
    } catch (err) {
      console.error("Error cargando producto:", err);
      if (productContainer) {
        productContainer.innerHTML = `
          <div class="error-state p-4 text-center">
            <i class="fas fa-exclamation-circle fa-2x text-danger"></i>
            <h3 class="mt-3">Error al cargar el producto</h3>
            <p>Ocurrió un error al cargar la información del producto. Por favor, intenta nuevamente.</p>
            <button onclick="location.reload()" class="product-btn product-btn-outline mt-2">
              <i class="fas fa-redo me-2"></i>Reintentar
            </button>
          </div>
        `;
      }
    } finally {
      ocultarSpinner();
    }
  })();
}

/* =========================
   RENDER DEL PRODUCTO
   Función principal que dibuja la UI del producto
   - recibe el objeto 'prod' tal como viene del JSON
   ========================= */
function renderProduct(prod) {
  console.log("Renderizando producto:", prod);

  if (!productContainer) return;

  // Seguridad: asegurarnos que prod.images es un array (si no, usamos imagen fallback)
  const images =
    Array.isArray(prod.images) && prod.images.length
      ? prod.images
      : ["img/no-image.png"];

  // 1) HTML principal del detalle (carrusel + info)
  productContainer.innerHTML = `
    <div class="product-detail-card mb-5">
      <div class="row g-4">
        <!-- Columna de imágenes -->
        <div class="col-md-6">
          <div class="product-image-container">
            <div id="carouselImages" class="carousel slide" data-bs-ride="carousel">
              <div class="carousel-inner">
                ${images
                  .map(
                    (img, i) => `
                  <div class="carousel-item ${i === 0 ? "active" : ""}">
                    <img src="${img}" class="d-block w-100" alt="${escapeHtml(
                      prod.name || ""
                    )}">
                  </div>
                `
                  )
                  .join("")}
              </div>

              ${
                images.length > 1
                  ? `
                <button class="carousel-control-prev" type="button" data-bs-target="#carouselImages" data-bs-slide="prev">
                  <span class="carousel-control-prev-icon"></span>
                </button>
                <button class="carousel-control-next" type="button" data-bs-target="#carouselImages" data-bs-slide="next">
                  <span class="carousel-control-next-icon"></span>
                </button>
              `
                  : ""
              }
            </div>

            <!-- Miniaturas -->
            ${
              images.length > 1
                ? `
              <div class="image-thumbnails d-flex gap-2 mt-3">
                ${images
                  .map(
                    (img, i) => `
                  <div class="thumbnail-item ${
                    i === 0 ? "active" : ""
                  }" data-slide-to="${i}" style="cursor:pointer; width:72px; height:72px; overflow:hidden; border-radius:6px;">
                    <img src="${img}" alt="${escapeHtml(
                      prod.name || ""
                    )} - imagen ${
                      i + 1
                    }" style="width:100%; height:100%; object-fit:cover;">
                  </div>
                `
                  )
                  .join("")}
              </div>
            `
                : ""
            }
          </div>
        </div>

        <!-- Columna de info -->
        <div class="col-md-6">
          <div class="product-info">
            <h1 class="product-title">${escapeHtml(
              prod.name || "(sin nombre)"
            )}</h1>

            <p class="product-category text-muted mb-1">
              <i class="fas fa-tag me-2"></i>Categoría: ${escapeHtml(
                prod.category || "(sin categoría)"
              )}
            </p>
            <p class="product-description">${escapeHtml(
              prod.description || ""
            )}</p>

            <div class="product-meta d-flex gap-3 align-items-center mt-3 mb-4">
              <div class="product-price fs-5 fw-bold">
                <i class="fas fa-dollar-sign me-1"></i>
                ${prod.currency ? escapeHtml(prod.currency) + " " : ""}${
    prod.cost !== undefined ? numberWithThousands(prod.cost) : "—"
  }
              </div>
              <div class="product-sold text-muted">
                <i class="fas fa-chart-line me-1"></i>
                ${
                  prod.soldCount !== undefined
                    ? numberWithThousands(prod.soldCount) + " vendidos"
                    : "—"
                }
              </div>
            </div>

            <div class="buttons-container d-flex gap-2">
              <button id="agregarCarrito" class="product-btn product-btn-primary btn btn-primary">
                <i class="fas fa-shopping-cart me-2"></i>Agregar al carrito
              </button>
              <button id="comprar" class="product-btn product-btn-success btn btn-success">
                <i class="fas fa-credit-card me-2"></i>Comprar ahora
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // 2) configurar miniaturas <-> carrusel (solo si hay miniaturas)
  setupThumbnailsCarousel();

  // 3) RENDER de productos relacionados (separado para claridad)
  renderRelatedProducts(prod.relatedProducts);

  // 4) (Opcional) Asociar acciones a botones (ejemplo simple)
  const btnAgregar = document.getElementById("agregarCarrito");
  if (btnAgregar) {
    btnAgregar.addEventListener("click", () => {
      // Ejemplo: guardar en localStorage o notificar al usuario (no solicitado en la pauta)
      alert("Producto agregado al carrito (simulado).");
    });
  }
}

/* =========================
   RENDER DE PRODUCTOS RELACIONADOS
   - recibe un array de objetos relacionados (cada uno con id, name, image)
   - genera tarjetas responsivas y las inserta en #related-products
   - al clickear una tarjeta, guarda el id en localStorage y navega/reload
   ========================= */
function renderRelatedProducts(relatedArray) {
  // Tomamos el contenedor del HTML donde colocaremos las tarjetas
  const relatedContainer = document.getElementById("related-products");
  if (!relatedContainer) return;

  // Limpiar antes de pintar (evita duplicados si se re-renderiza)
  relatedContainer.innerHTML = "";

  // Si no hay productos relacionados, mostramos un mensaje
  if (
    !relatedArray ||
    !Array.isArray(relatedArray) ||
    relatedArray.length === 0
  ) {
    relatedContainer.innerHTML = `
      <div class="col-12">
        <p class="text-muted">No hay productos relacionados disponibles.</p>
      </div>
    `;
    return;
  }

  // Recorrer cada relacionado y crear la tarjeta
  relatedArray.forEach((rel) => {
    // Aseguramos datos por si faltan propiedades
    const relId = rel.id !== undefined ? rel.id : null;
    const relName = rel.name || "(sin nombre)";
    const relImage = rel.image || "img/no-image.png";

    // Columna responsiva (Bootstrap)
    const col = document.createElement("div");
    col.className = "col-sm-6 col-md-4 col-lg-3";

    // Card interna (h-100 para que todas las tarjetas tengan igual altura)
    col.innerHTML = `
      <div class="card h-100 related-card shadow-sm" style="cursor:pointer;">
        <div style="height:180px; overflow:hidden; border-top-left-radius:4px; border-top-right-radius:4px;">
          <img src="${escapeHtml(
            relImage
          )}" class="card-img-top" alt="${escapeHtml(
      relName
    )}" style="width:100%; height:100%; object-fit:cover;">
        </div>
        <div class="card-body d-flex align-items-center justify-content-center">
          <h5 class="card-title text-center mb-0" style="font-size:0.95rem;">${escapeHtml(
            relName
          )}</h5>
        </div>
      </div>
    `;

    // Manejo del error de carga de imagen (fallback)
    const imgTag = col.querySelector("img");
    if (imgTag) {
      imgTag.onerror = () => {
        imgTag.src = "img/no-image.png";
      };
    }

    // Al hacer click en la tarjeta:
    // guardamos el ID en localStorage y navegamos a product-info (recarga)
    col.addEventListener("click", () => {
      if (relId === null) {
        console.warn("Producto relacionado sin id, no se puede navegar.");
        return;
      }
      setProductID(relId);
    });

    relatedContainer.appendChild(col);
  });
}

/* =========================
   FUNCIONES UTILES Y HELPERS
   ========================= */

// Guardar el productID y recargar la página para que el flujo de carga traiga el nuevo producto
function setProductID(id) {
  // localStorage guarda strings
  localStorage.setItem("productID", String(id));
  // Ir a la misma página (asegura que se ejecute el flujo de carga con el nuevo id)
  // usamos location.href para forzar un nuevo ciclo de navegación
  location.href = "product-info.html";
}

// Configuración de miniaturas y sincronización con el carrusel de Bootstrap
function setupThumbnailsCarousel() {
  const carousel = document.getElementById("carouselImages");
  const thumbnails = document.querySelectorAll(".thumbnail-item");

  if (!carousel || !thumbnails || thumbnails.length === 0) return;

  // Crear instancia de Bootstrap Carousel (necesita que bootstrap.js esté cargado)
  const bootstrapCarousel = new bootstrap.Carousel(carousel, {
    interval: 5000,
    wrap: true,
  });

  // Click en miniatura => ir al slide correspondiente
  thumbnails.forEach((thumbnail, index) => {
    thumbnail.addEventListener("click", () => {
      bootstrapCarousel.to(index);
      updateActiveThumbnail(index);
    });
  });

  // Sincronizar miniaturas cuando el carrusel cambia (evento de Bootstrap)
  carousel.addEventListener("slide.bs.carousel", (event) => {
    updateActiveThumbnail(event.to);
  });
}

function updateActiveThumbnail(activeIndex) {
  const thumbnails = document.querySelectorAll(".thumbnail-item");

  thumbnails.forEach((thumbnail, index) => {
    if (index === activeIndex) thumbnail.classList.add("active");
    else thumbnail.classList.remove("active");
  });
}

// Escape simple para evitar inyección de HTML en strings (muy básico)
function escapeHtml(str) {
  if (!str && str !== 0) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Formatear número con separador de miles (usa toLocaleString para soporte internacional)
function numberWithThousands(n) {
  if (n === undefined || n === null) return "";
  if (typeof n === "number") return n.toLocaleString();
  // si viene como string convertible
  const num = Number(n);
  return isNaN(num) ? String(n) : num.toLocaleString();
}

// =====================
// COMENTARIOS Y CALIFICACIONES
// =====================

// Función para cargar y mostrar comentarios
function loadComments(productId) {
  const commentsUrl = `https://japceibal.github.io/emercado-api/products_comments/${productId}.json`;

  fetch(commentsUrl)
    .then((res) => res.json())
    .then((comments) => {
      displayComments(comments);
    })
    .catch((err) => {
      console.error("Error cargando comentarios:", err);
      // En caso de error, mostrar el formulario sin comentarios existentes
      displayComments([]);
    });
}

// Función para mostrar comentarios
function displayComments(comments) {
  const commentsContainer = document.getElementById("comments-container");

  if (!comments || comments.length === 0) {
    commentsContainer.innerHTML = `
      <div class="no-comments">
        <i class="far fa-comment"></i>
        <p>Aún no hay comentarios para este producto. ¡Sé el primero en comentar!</p>
      </div>
    `;
    return;
  }

  const commentsHTML = comments
    .map((comment) => {
      const stars = generateStars(comment.score);
      // Handle both date formats from API (YYYY-MM-DD HH:MM:SS and ISO)
      let commentDate;
      if (comment.dateTime.includes(" ")) {
        // Format: "YYYY-MM-DD HH:MM:SS"
        commentDate = new Date(comment.dateTime.replace(" ", "T"));
      } else {
        commentDate = new Date(comment.dateTime);
      }

      const date = commentDate.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      return `
      <div class="comment-card">
        <div class="comment-header">
          <div class="comment-user">
            <i class="fas fa-user-circle"></i>
            <span class="username">${comment.user}</span>
          </div>
          <div class="comment-date">${date}</div>
        </div>
        <div class="comment-rating">
          ${stars}
          <span class="rating-text">(${comment.score}/5)</span>
        </div>
        <div class="comment-text">
          <p>${comment.description}</p>
        </div>
      </div>
    `;
    })
    .join("");

  commentsContainer.innerHTML = `
    <div class="comments-list">
      ${commentsHTML}
    </div>
    <div class="rating-form-container">
      <h3>Agregar tu calificación</h3>
      <form id="rating-form" class="rating-form">
        <div class="form-group">
          <label for="user-comment">Tu comentario:</label>
          <textarea id="user-comment" class="form-control" rows="4" placeholder="Escribe tu opinión sobre este producto..." required></textarea>
        </div>
        <div class="form-group">
          <label>Tu calificación:</label>
          <div class="star-rating" id="star-rating">
            ${[1, 2, 3, 4, 5]
              .map(
                (i) => `
              <i class="far fa-star" data-rating="${i}"></i>
            `
              )
              .join("")}
          </div>
          <span id="rating-text" class="rating-display">Selecciona una calificación</span>
        </div>
        <button type="submit" class="btn btn-primary">
          <i class="fas fa-paper-plane"></i>
          Enviar calificación
        </button>
      </form>
    </div>
  `;

  // Configurar interactividad del formulario de calificación
  setupRatingForm();
}

// Función para generar estrellas HTML
function generateStars(rating) {
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      stars += '<i class="fas fa-star text-warning"></i>';
    } else {
      stars += '<i class="far fa-star text-muted"></i>';
    }
  }
  return stars;
}

// Función para configurar el formulario de calificación
function setupRatingForm() {
  const stars = document.querySelectorAll("#star-rating i");
  const ratingText = document.getElementById("rating-text");
  const ratingForm = document.getElementById("rating-form");
  let selectedRating = 0;

  // Configurar interacción con estrellas
  stars.forEach((star, index) => {
    const rating = index + 1;

    star.addEventListener("mouseenter", () => {
      highlightStars(rating);
    });

    star.addEventListener("mouseleave", () => {
      highlightStars(selectedRating);
    });

    star.addEventListener("click", () => {
      selectedRating = rating;
      highlightStars(selectedRating);
      ratingText.textContent = `${selectedRating}/5 estrellas`;
      ratingText.classList.add("selected");
    });
  });

  // Función para resaltar estrellas
  function highlightStars(rating) {
    stars.forEach((star, index) => {
      if (index < rating) {
        star.classList.remove("far");
        star.classList.add("fas", "text-warning");
      } else {
        star.classList.remove("fas", "text-warning");
        star.classList.add("far");
      }
    });
  }

  // Manejar envío del formulario (simulación)
  ratingForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const comment = document.getElementById("user-comment").value.trim();

    if (!comment) {
      alert("Por favor, escribe un comentario.");
      return;
    }

    if (selectedRating === 0) {
      alert("Por favor, selecciona una calificación.");
      return;
    }

    addNewComment(comment, selectedRating);
  });
}

// Función para agregar nuevo comentario (simulación visual)
function addNewComment(comment, rating) {
  const usuario = sessionStorage.getItem("usuario") || "Usuario Anónimo";
  const now = new Date();

  // Crear elemento HTML para el nuevo comentario
  const stars = generateStars(rating);
  const date = now.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const newCommentHTML = `
    <div class="comment-card new-comment">
      <div class="comment-header">
        <div class="comment-user">
          <i class="fas fa-user-circle"></i>
          <span class="username">${usuario}</span>
        </div>
        <div class="comment-date">${date}</div>
      </div>
      <div class="comment-rating">
        ${stars}
        <span class="rating-text">(${rating}/5)</span>
      </div>
      <div class="comment-text">
        <p>${comment}</p>
      </div>
    </div>
  `;

  // Agregar al principio de la lista de comentarios
  const commentsList = document.querySelector(".comments-list");
  commentsList.insertAdjacentHTML("afterbegin", newCommentHTML);

  // Resetear formulario
  document.getElementById("rating-form").reset();
  document.getElementById("rating-text").textContent =
    "Selecciona una calificación";
  document.getElementById("rating-text").classList.remove("selected");

  // Resetear estrellas
  const stars_elements = document.querySelectorAll("#star-rating i");
  stars_elements.forEach((star) => {
    star.classList.remove("fas", "text-warning");
    star.classList.add("far");
  });

  // Mostrar mensaje de éxito
  alert("¡Tu calificación ha sido agregada exitosamente!");
}
