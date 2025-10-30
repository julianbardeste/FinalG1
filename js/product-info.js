"use strict";

/* ===========================
   BÚSQUEDA SIMPLE Y SUGERENCIAS
   Este bloque maneja la funcionalidad de búsqueda en tiempo real:
   - Carga y cache de todos los productos en sessionStorage
   - Filtra y muestra sugerencias en el navbar
   - Navegación a productos desde las sugerencias
   =========================== */

// Referencias a elementos del DOM para la búsqueda
const navInput = document.getElementById("navSearchInput"); // Input de búsqueda en el navbar
const suggestions = document.getElementById("searchSuggestions"); // Contenedor de sugerencias

// Variable global para almacenar todos los productos cargados
let allProducts = null;

// Función para cargar todos los productos de todas las categorías y guardarlos en caché
// Esta función optimiza las búsquedas al cargar una sola vez todos los productos
async function loadAllProducts() {
  // URLs de la API para categorías y productos
  const CATEGORIES_URL =
    "https://japceibal.github.io/emercado-api/cats/cat.json";
  const PRODUCTS_URL =
    "https://japceibal.github.io/emercado-api/cats_products/";
  const EXT_TYPE = ".json";

  // Verificar si ya tenemos los productos en caché para evitar llamadas innecesarias
  const cached = sessionStorage.getItem("allProductsCache");
  if (cached) {
    allProducts = JSON.parse(cached);
    return;
  }

  try {
    // 1) Obtener listado de categorías desde la API
    const cats = await fetch(CATEGORIES_URL).then((r) => r.json());

    // 2) Por cada categoría, solicitar su JSON de productos de forma asíncrona
    const proms = cats.map(
      (c) =>
        fetch(PRODUCTS_URL + c.id + EXT_TYPE)
          .then((r) => r.json())
          .catch(() => null) // Ignorar errores de categorías individuales
    );

    // 3) Esperar a que se resuelvan todas las promesas
    const lists = await Promise.all(proms);

    // 4) Consolidar todos los arrays de productos en uno solo
    const merged = [];
    lists.forEach((l) => {
      if (l && l.products) merged.push(...l.products);
    });

    // 5) Eliminar productos duplicados usando un map por ID
    const map = {};
    merged.forEach((p) => {
      map[p.id] = p;
    });
    allProducts = Object.values(map);

    // 6) Guardar en sessionStorage para optimizar futuras búsquedas
    sessionStorage.setItem("allProductsCache", JSON.stringify(allProducts));
  } catch (e) {
    console.error("Error cargando productos (loadAllProducts):", e);
    allProducts = []; // Array vacío en caso de error
  }
}

// Función para mostrar la lista de sugerencias debajo del input de búsqueda
// Recibe un array de productos que coinciden con la búsqueda
function showSuggestions(items) {
  // Verificar que el contenedor de sugerencias existe
  if (!suggestions) return;

  // Limpiar contenido anterior
  suggestions.innerHTML = "";

  // Si no hay elementos, ocultar las sugerencias
  if (!items || items.length === 0) {
    suggestions.style.display = "none";
    return;
  }

  // Crear un elemento de lista para cada producto sugerido
  items.forEach((p) => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex align-items-center";

    // Determinar la URL de la imagen con fallbacks apropiados
    const imgSrc = p.image || (p.images && p.images[0]) || "img/no-image.png";

    // Crear elemento imagen con configuración apropiada
    const img = document.createElement("img");
    img.src = imgSrc;
    img.alt = p.name || "producto";
    img.width = 44;
    img.height = 44;

    // Manejar error de carga de imagen con fallback
    img.onerror = () => {
      img.src = "img/no-image.png";
    };

    // Crear contenedor para el texto de la sugerencia
    const textWrap = document.createElement("div");
    textWrap.className = "suggest-text ms-3";

    // Crear título del producto
    const title = document.createElement("div");
    title.textContent = p.name || "(sin nombre)";
    title.style.fontWeight = "600";

    // Crear subtítulo con precio o descripción
    const sub = document.createElement("div");
    sub.className = "suggest-sub text-muted small";
    if (p.cost !== undefined) {
      // Mostrar precio si está disponible
      sub.textContent = `${p.currency || ""} ${p.cost}`;
    } else if (p.description) {
      // Mostrar descripción truncada si no hay precio
      sub.textContent =
        p.description.slice(0, 60) + (p.description.length > 60 ? "…" : "");
    }

    // Ensamblar la estructura del elemento de sugerencia
    textWrap.appendChild(title);
    textWrap.appendChild(sub);

    li.appendChild(img);
    li.appendChild(textWrap);

    // Configurar evento de click para navegar al producto
    li.addEventListener("click", () => {
      localStorage.setItem("productID", p.id); // Guardar ID del producto
      window.location.href = "product-info.html"; // Navegar a la página de detalle
    });

    // Agregar el elemento de sugerencia al contenedor
    suggestions.appendChild(li);
  });

  // Mostrar el contenedor de sugerencias
  suggestions.style.display = "block";
}

// Configurar evento de búsqueda en tiempo real
if (navInput) {
  navInput.addEventListener("input", async () => {
    // Obtener y limpiar el texto de búsqueda
    const q = navInput.value.trim().toLowerCase();

    // Si no hay texto, ocultar sugerencias
    if (!q) {
      if (suggestions) suggestions.style.display = "none";
      return;
    }

    // Cargar productos si no están en caché
    if (!allProducts) await loadAllProducts();

    // Filtrar productos que coincidan con la búsqueda (nombre o descripción)
    const matches = allProducts.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
    );

    // Mostrar hasta 6 sugerencias para mantener la interfaz limpia
    showSuggestions(matches.slice(0, 6));
  });
}

// Ocultar sugerencias al hacer clic fuera del área de búsqueda
document.addEventListener("click", (e) => {
  if (
    navInput &&
    suggestions &&
    !navInput.contains(e.target) && // Click no está en el input
    !suggestions.contains(e.target) // Click no está en las sugerencias
  ) {
    suggestions.style.display = "none"; // Ocultar las sugerencias
  }
});

/* ====================================
   DETALLE DEL PRODUCTO
   Esta sección maneja la carga y visualización del producto específico:
   - Obtiene productID desde localStorage
   - Realiza fetch al recurso products/{id}.json de la API
   - Renderiza toda la pantalla de detalle del producto
   - Maneja errores y estados de carga
   ==================================== */

// Referencia al contenedor principal donde se renderiza el detalle del producto
const productContainer = document.getElementById("product-container");
console.log("Elemento productContainer encontrado:", productContainer);

// Funciones para manejar el indicador de carga (spinner)
const spinnerWrapper = document.getElementById("spinner-wrapper");

// Mostrar el spinner mientras se cargan los datos
function mostrarSpinner() {
  if (spinnerWrapper) spinnerWrapper.style.display = "block";
}

// Ocultar el spinner cuando la carga termine
function ocultarSpinner() {
  if (spinnerWrapper) spinnerWrapper.style.display = "none";
}

// Recuperar el ID del producto desde localStorage
// Este ID es establecido desde products.html, sugerencias de búsqueda, o productos relacionados
let productID = localStorage.getItem("productID");
console.log("ProductID obtenido:", productID);

// Fallback: usar un ID por defecto si no hay uno almacenado (útil para testing)
if (!productID) {
  productID = "50921";
  console.log("No se encontró productID, usando 50921 por defecto");
}

// Validar que tenemos un ID de producto válido
if (!productID || productID === "null") {
  // Mostrar estado de error si no hay ID válido
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
  // Construir la URL de la API para obtener los detalles del producto específico
  const url = `https://japceibal.github.io/emercado-api/products/${productID}.json`;
  console.log("URL a cargar:", url);

  // Función asíncrona autoejecutable para cargar el producto
  (async function loadProduct() {
    try {
      // Mostrar indicador de carga
      mostrarSpinner();

      // Realizar petición HTTP a la API
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Parsear respuesta JSON
      const data = await res.json();
      console.log("Datos del producto:", data);

      // Renderizar el producto en la interfaz
      renderProduct(data);

      // Cargar y mostrar comentarios del producto
      loadComments(productID);
    } catch (err) {
      // Manejar errores de carga
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
      // Siempre ocultar el spinner al finalizar
      ocultarSpinner();
    }
  })();
}

/* =======================================
   RENDERIZADO DEL PRODUCTO
   Función principal que construye la interfaz visual del producto:
   - Recibe el objeto 'prod' con los datos del producto desde la API
   - Genera el HTML para mostrar imágenes, información y botones
   - Configura carrusel de imágenes y productos relacionados
   ======================================= */
function renderProduct(prod) {
  console.log("Renderizando producto:", prod);

  // Verificar que el contenedor principal existe
  if (!productContainer) return;

  // Validar y preparar las imágenes del producto
  // Si no hay imágenes válidas, usar imagen por defecto
  const images =
    Array.isArray(prod.images) && prod.images.length
      ? prod.images
      : ["img/no-image.png"];

  // Generar el HTML principal del producto (estructura completa)
  productContainer.innerHTML = `
    <div class="product-detail-card mb-5">
      <div class="row g-4">
        <!-- Columna de imágenes -->
        <div class="col-md-6">
          <div class="product-image-container">
            <div id="carouselImages" class="carousel slide" data-bs-ride="carousel">
              <!-- Carrusel de imágenes del producto -->
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

              <!-- Controles del carrusel (solo si hay múltiples imágenes) -->
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

            <!-- Miniaturas para navegación rápida entre imágenes -->
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

        <!-- Columna de información del producto -->
        <div class="col-md-6">
          <div class="product-info">
            <!-- Título principal del producto -->
            <h1 class="product-title">${escapeHtml(
              prod.name || "(sin nombre)"
            )}</h1>

            <!-- Categoría del producto -->
            <p class="product-category text-muted mb-1">
              <i class="fas fa-tag me-2"></i>Categoría: ${escapeHtml(
                prod.category || "(sin categoría)"
              )}
            </p>

            <!-- Descripción del producto -->
            <p class="product-description">${escapeHtml(
              prod.description || ""
            )}</p>

            <!-- Información de precio y ventas -->
            <div class="product-meta d-flex gap-3 align-items-center mt-3 mb-4">
              <!-- Precio del producto -->
              <div class="product-price fs-5 fw-bold">
                <i class="fas fa-dollar-sign me-1"></i>
                ${prod.currency ? escapeHtml(prod.currency) + " " : ""}${
    prod.cost !== undefined ? numberWithThousands(prod.cost) : "—"
  }
              </div>
              <!-- Cantidad vendida -->
              <div class="product-sold text-muted">
                <i class="fas fa-chart-line me-1"></i>
                ${
                  prod.soldCount !== undefined
                    ? numberWithThousands(prod.soldCount) + " vendidos"
                    : "—"
                }
              </div>
            </div>

             <!-- Botones de acción -->
            <div class="buttons-container d-flex gap-2">
              <button id="agregarCarrito" class="product-btn product-btn-primary btn btn-primary" onclick="addToCart()">
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

  // Configurar funcionalidad del carrusel de imágenes y miniaturas
  setupThumbnailsCarousel();

  // Renderizar sección de productos relacionados
  renderRelatedProducts(prod.relatedProducts);

  // Configurar eventos de los botones de acción
  const btnAgregar = document.getElementById("agregarCarrito");
  if (btnAgregar) {
    btnAgregar.addEventListener("click", () => {
      // Obtener el carrito actual o crear uno nuevo
      let cart = JSON.parse(localStorage.getItem("cart")) || [];

      // Buscar si el producto ya está en el carrito
      const existing = cart.find((item) => item.id === prod.id);

      if (existing) {
        // Si ya existe, aumentar la cantidad y recalcular subtotal
        existing.quantity += 1;
        existing.subtotal = existing.cost * existing.quantity;
      } else {
        // Si es nuevo, agregarlo con subtotal incluido
        const newItem = {
          id: prod.id,
          name: prod.name,
          cost: prod.cost,
          currency: prod.currency,
          image:
            Array.isArray(prod.images) && prod.images.length > 0
              ? prod.images[0]
              : "img/no-image.png",
          quantity: 1,
          subtotal: prod.cost, // 👈 ESTO es lo importante
        };
        cart.push(newItem);
      }

      // Guardar carrito actualizado
      localStorage.setItem("cart", JSON.stringify(cart));

      // Actualizar el badge inmediatamente
      updateCartBadge();

      alert("✅ Producto agregado al carrito");
    });
  }

  // Configurar botón "Comprar ahora"
  const btnComprar = document.getElementById("comprar");
  if (btnComprar) {
    btnComprar.addEventListener("click", () => {
      // Obtener el carrito actual o crear uno nuevo
      let cart = JSON.parse(localStorage.getItem("cart")) || [];

      // Buscar si el producto ya está en el carrito
      const existing = cart.find((item) => item.id === prod.id);

      if (existing) {
        // Si ya existe, aumentar la cantidad y recalcular subtotal
        existing.quantity += 1;
        existing.subtotal = existing.cost * existing.quantity;
      } else {
        // Si es nuevo, agregarlo con subtotal incluido
        const newItem = {
          id: prod.id,
          name: prod.name,
          cost: prod.cost,
          currency: prod.currency,
          image:
            Array.isArray(prod.images) && prod.images.length > 0
              ? prod.images[0]
              : "img/no-image.png",
          quantity: 1,
          subtotal: prod.cost,
        };
        cart.push(newItem);
      }

      // Guardar carrito actualizado
      localStorage.setItem("cart", JSON.stringify(cart));

      // Actualizar el badge inmediatamente
      updateCartBadge();

      // Redirigir al carrito
      window.location.href = "cart.html";
    });
  }
}

/* ==========================================
   RENDERIZADO DE PRODUCTOS RELACIONADOS
   Función que genera la sección de productos relacionados:
   - Recibe un array de objetos relacionados (cada uno con id, name, image)
   - Genera tarjetas responsivas y las inserta en #related-products
   - Al clickear una tarjeta, guarda el id en localStorage y navega
   ========================================== */
function renderRelatedProducts(relatedArray) {
  // Obtener referencia al contenedor de productos relacionados
  const relatedContainer = document.getElementById("related-products");
  if (!relatedContainer) return;

  // Limpiar contenido anterior para evitar duplicados
  relatedContainer.innerHTML = "";

  // Manejar caso donde no hay productos relacionados
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

  // Generar una tarjeta para cada producto relacionado
  relatedArray.forEach((rel) => {
    // Validar y asignar valores por defecto para propiedades faltantes
    const relId = rel.id !== undefined ? rel.id : null;
    const relName = rel.name || "(sin nombre)";
    const relImage = rel.image || "img/no-image.png";

    // Crear columna responsiva usando clases de Bootstrap
    const col = document.createElement("div");
    col.className = "col-sm-6 col-md-4 col-lg-3";

    // Generar el HTML de la tarjeta del producto relacionado
    // h-100 asegura que todas las tarjetas tengan la misma altura
    col.innerHTML = `
      <div class="card h-100 related-card shadow-sm" style="cursor:pointer;">
        <!-- Contenedor de imagen con dimensiones fijas -->
        <div style="height:180px; overflow:hidden; border-top-left-radius:4px; border-top-right-radius:4px;">
          <img src="${escapeHtml(
            relImage
          )}" class="card-img-top" alt="${escapeHtml(
      relName
    )}" style="width:100%; height:100%; object-fit:cover;">
        </div>
        <!-- Cuerpo de la tarjeta con el nombre del producto -->
        <div class="card-body d-flex align-items-center justify-content-center">
          <h5 class="card-title text-center mb-0" style="font-size:0.95rem;">${escapeHtml(
            relName
          )}</h5>
        </div>
      </div>
    `;

    // Configurar fallback para imágenes que no cargan correctamente
    const imgTag = col.querySelector("img");
    if (imgTag) {
      imgTag.onerror = () => {
        imgTag.src = "img/no-image.png";
      };
    }

    // Configurar evento de click para navegar al producto relacionado
    col.addEventListener("click", () => {
      if (relId === null) {
        console.warn("Producto relacionado sin id, no se puede navegar.");
        return;
      }
      // Guardar el nuevo ID y navegar
      setProductID(relId);
    });

    // Agregar la tarjeta al contenedor de productos relacionados
    relatedContainer.appendChild(col);
  });
}

/* =======================================
   FUNCIONES UTILITARIAS Y HELPERS
   Funciones auxiliares que apoyan la funcionalidad principal:
   - Navegación entre productos
   - Configuración del carrusel
   - Escape de HTML para seguridad
   - Formateo de números
   ======================================= */

// Función para cambiar a un nuevo producto y recargar la página
// Se utiliza cuando el usuario selecciona un producto relacionado
function setProductID(id) {
  // Guardar el nuevo ID en localStorage (convertido a string)
  localStorage.setItem("productID", String(id));

  // Navegar a la misma página para recargar con el nuevo producto
  // location.href fuerza un nuevo ciclo de navegación completo
  location.href = "product-info.html";
}

// Función para configurar la interacción entre miniaturas y carrusel principal
// Permite navegación mediante clicks en las miniaturas
function setupThumbnailsCarousel() {
  const carousel = document.getElementById("carouselImages");
  const thumbnails = document.querySelectorAll(".thumbnail-item");

  // Verificar que los elementos necesarios existen
  if (!carousel || !thumbnails || thumbnails.length === 0) return;

  // Crear instancia de Bootstrap Carousel con configuración personalizada
  const bootstrapCarousel = new bootstrap.Carousel(carousel, {
    interval: 5000, // Cambio automático cada 5 segundos
    wrap: true, // Permitir navegación cíclica
  });

  // Configurar eventos de click en las miniaturas
  thumbnails.forEach((thumbnail, index) => {
    thumbnail.addEventListener("click", () => {
      bootstrapCarousel.to(index); // Navegar al slide correspondiente
      updateActiveThumbnail(index); // Actualizar estado visual de miniaturas
    });
  });

  // Sincronizar miniaturas cuando el carrusel cambia por otros medios
  // (botones de navegación, gestos táctiles, cambio automático)
  carousel.addEventListener("slide.bs.carousel", (event) => {
    updateActiveThumbnail(event.to); // Actualizar miniatura activa
  });
}

// Función para actualizar qué miniatura está marcada como activa
// Sincroniza la visualización de miniaturas con el slide actual del carrusel
function updateActiveThumbnail(activeIndex) {
  const thumbnails = document.querySelectorAll(".thumbnail-item");

  // Actualizar clases CSS para resaltar la miniatura activa
  thumbnails.forEach((thumbnail, index) => {
    if (index === activeIndex) {
      thumbnail.classList.add("active"); // Marcar como activa
    } else {
      thumbnail.classList.remove("active"); // Remover marca de las demás
    }
  });
}

// Función de seguridad para escapar caracteres HTML peligrosos
// Previene ataques XSS al mostrar contenido dinámico
function escapeHtml(str) {
  // Manejar valores nulos, undefined o vacíos
  if (!str && str !== 0) return "";

  // Escapar caracteres especiales de HTML
  return String(str)
    .replace(/&/g, "&amp;") // Ampersand (debe ser primero)
    .replace(/</g, "&lt;") // Menor que
    .replace(/>/g, "&gt;") // Mayor que
    .replace(/"/g, "&quot;") // Comillas dobles
    .replace(/'/g, "&#039;"); // Comillas simples
}

// Función para formatear números con separadores de miles
// Mejora la legibilidad de precios y cantidades grandes
function numberWithThousands(n) {
  // Manejar valores inválidos
  if (n === undefined || n === null) return "";

  // Si ya es un número, formatear directamente
  if (typeof n === "number") return n.toLocaleString();

  // Si es string, intentar convertir a número primero
  const num = Number(n);
  return isNaN(num) ? String(n) : num.toLocaleString();
}

/* ==========================================
   SISTEMA DE COMENTARIOS Y CALIFICACIONES
   Funcionalidad completa para mostrar y agregar comentarios:
   - Carga de comentarios desde la API
   - Renderizado de comentarios existentes
   - Formulario interactivo para nuevas calificaciones
   - Sistema de estrellas para puntuación
   ========================================== */

// Función para cargar comentarios del producto desde la API
// Obtiene los comentarios y calificaciones de otros usuarios
function loadComments(productId) {
  // Construir URL para los comentarios del producto específico
  const commentsUrl = `https://japceibal.github.io/emercado-api/products_comments/${productId}.json`;

  // Realizar petición HTTP para obtener comentarios
  fetch(commentsUrl)
    .then((res) => res.json())
    .then((comments) => {
      // Mostrar comentarios cargados
      displayComments(comments);
    })
    .catch((err) => {
      console.error("Error cargando comentarios:", err);
      // En caso de error, mostrar interfaz sin comentarios existentes
      displayComments([]);
    });
}

// Función para renderizar la sección completa de comentarios
// Incluye comentarios existentes y formulario para nuevos comentarios
function displayComments(comments) {
  const commentsContainer = document.getElementById("comments-container");

  // Manejar caso donde no hay comentarios disponibles
  if (!comments || comments.length === 0) {
    commentsContainer.innerHTML = `
      <div class="no-comments">
        <i class="far fa-comment"></i>
        <p>Aún no hay comentarios para este producto. ¡Sé el primero en comentar!</p>
      </div>
    `;
    return;
  }

  // Generar HTML para cada comentario existente
  const commentsHTML = comments
    .map((comment) => {
      // Generar representación visual de la calificación con estrellas
      const stars = generateStars(comment.score);

      // Manejar diferentes formatos de fecha que puede enviar la API
      let commentDate;
      if (comment.dateTime.includes(" ")) {
        // Formato: "YYYY-MM-DD HH:MM:SS"
        commentDate = new Date(comment.dateTime.replace(" ", "T"));
      } else {
        // Formato ISO estándar
        commentDate = new Date(comment.dateTime);
      }

      // Formatear fecha en español para mostrar al usuario
      const date = commentDate.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      // Retornar HTML estructurado para el comentario
      return `
      <div class="comment-card">
        <!-- Encabezado con usuario y fecha -->
        <div class="comment-header">
          <div class="comment-user">
            <i class="fas fa-user-circle"></i>
            <span class="username">${comment.user}</span>
          </div>
          <div class="comment-date">${date}</div>
        </div>
        <!-- Calificación con estrellas -->
        <div class="comment-rating">
          ${stars}
          <span class="rating-text">(${comment.score}/5)</span>
        </div>
        <!-- Texto del comentario -->
        <div class="comment-text">
          <p>${comment.description}</p>
        </div>
      </div>
    `;
    })
    .join("");

  // Renderizar la estructura completa: comentarios existentes + formulario
  commentsContainer.innerHTML = `
    <!-- Lista de comentarios existentes -->
    <div class="comments-list">
      ${commentsHTML}
    </div>
    <!-- Formulario para nueva calificación -->
    <div class="rating-form-container">
      <h3>Agregar tu calificación</h3>
      <form id="rating-form" class="rating-form">
        <!-- Campo de texto para el comentario -->
        <div class="form-group">
          <label for="user-comment">Tu comentario:</label>
          <textarea id="user-comment" class="form-control" rows="4" placeholder="Escribe tu opinión sobre este producto..." required></textarea>
        </div>
        <!-- Sistema de calificación con estrellas -->
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
        <!-- Botón de envío -->
        <button type="submit" class="btn btn-primary">
          <i class="fas fa-paper-plane"></i>
          Enviar calificación
        </button>
      </form>
    </div>
  `;

  // Activar la funcionalidad interactiva del formulario
  setupRatingForm();
}

// Función para generar la representación visual de una calificación
// Convierte un número (1-5) en estrellas HTML (llenas o vacías)
function generateStars(rating) {
  let stars = "";

  // Generar 5 estrellas, llenando según la calificación
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      // Estrella llena (amarilla) para calificaciones incluidas
      stars += '<i class="fas fa-star text-warning"></i>';
    } else {
      // Estrella vacía (gris) para calificaciones no alcanzadas
      stars += '<i class="far fa-star text-muted"></i>';
    }
  }

  return stars;
}

// Función para configurar la interactividad del formulario de calificación
// Maneja la selección de estrellas, efectos visuales y envío
function setupRatingForm() {
  // Obtener referencias a elementos del formulario
  const stars = document.querySelectorAll("#star-rating i");
  const ratingText = document.getElementById("rating-text");
  const ratingForm = document.getElementById("rating-form");

  // Variable para almacenar la calificación seleccionada
  let selectedRating = 0;

  // Configurar eventos interactivos para cada estrella
  stars.forEach((star, index) => {
    const rating = index + 1; // Convertir índice a calificación (1-5)

    // Efecto hover: resaltar estrellas al pasar el mouse
    star.addEventListener("mouseenter", () => {
      highlightStars(rating);
    });

    // Salir del hover: volver al estado seleccionado
    star.addEventListener("mouseleave", () => {
      highlightStars(selectedRating);
    });

    // Click: seleccionar calificación definitiva
    star.addEventListener("click", () => {
      selectedRating = rating;
      highlightStars(selectedRating);
      ratingText.textContent = `${selectedRating}/5 estrellas`;
      ratingText.classList.add("selected");
    });
  });

  // Función interna para actualizar el estado visual de las estrellas
  // Resalta las estrellas hasta la calificación especificada
  function highlightStars(rating) {
    stars.forEach((star, index) => {
      if (index < rating) {
        // Estrella dentro de la calificación: llenar y colorear
        star.classList.remove("far");
        star.classList.add("fas", "text-warning");
      } else {
        // Estrella fuera de la calificación: vacía y sin color
        star.classList.remove("fas", "text-warning");
        star.classList.add("far");
      }
    });
  }

  // Configurar manejo del envío del formulario
  ratingForm.addEventListener("submit", (e) => {
    e.preventDefault(); // Prevenir envío estándar del formulario

    // Obtener y validar el texto del comentario
    const comment = document.getElementById("user-comment").value.trim();

    if (!comment) {
      alert("Por favor, escribe un comentario.");
      return;
    }

    // Validar que se haya seleccionado una calificación
    if (selectedRating === 0) {
      alert("Por favor, selecciona una calificación.");
      return;
    }

    // Procesar el nuevo comentario
    addNewComment(comment, selectedRating);
  });
}

// Función para agregar visualmente un nuevo comentario a la lista
// Simula la adición inmediata sin llamada al servidor
function addNewComment(comment, rating) {
  // Obtener nombre de usuario desde sesión o usar valor por defecto
  const usuario = sessionStorage.getItem("usuario") || "Usuario Anónimo";
  const now = new Date();

  // Generar elementos visuales para el nuevo comentario
  const stars = generateStars(rating); // Estrellas según calificación
  const date = now.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Construir HTML para el nuevo comentario con clase especial
  const newCommentHTML = `
    <div class="comment-card new-comment">
      <!-- Encabezado del nuevo comentario -->
      <div class="comment-header">
        <div class="comment-user">
          <i class="fas fa-user-circle"></i>
          <span class="username">${usuario}</span>
        </div>
        <div class="comment-date">${date}</div>
      </div>
      <!-- Calificación con estrellas -->
      <div class="comment-rating">
        ${stars}
        <span class="rating-text">(${rating}/5)</span>
      </div>
      <!-- Texto del comentario -->
      <div class="comment-text">
        <p>${comment}</p>
      </div>
    </div>
  `;

  // Insertar el nuevo comentario al principio de la lista
  const commentsList = document.querySelector(".comments-list");
  commentsList.insertAdjacentHTML("afterbegin", newCommentHTML);

  // Limpiar y resetear el formulario para una nueva calificación
  document.getElementById("rating-form").reset();
  document.getElementById("rating-text").textContent =
    "Selecciona una calificación";
  document.getElementById("rating-text").classList.remove("selected");

  // Resetear estrellas a estado inicial (vacías)
  const stars_elements = document.querySelectorAll("#star-rating i");
  stars_elements.forEach((star) => {
    star.classList.remove("fas", "text-warning");
    star.classList.add("far");
  });

  // Mostrar confirmación al usuario
  alert("¡Tu calificación ha sido agregada exitosamente!");
}

let count = 0;

// Función para actualizar el badge del carrito
function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

  localStorage.setItem("cartCount", totalItems);

  const badge = document.getElementById("cart-count");
  if (badge) badge.textContent = totalItems;
}

document.addEventListener("DOMContentLoaded", () => {
  // Actualizar el badge al cargar la página
  updateCartBadge();
});

// --- ELIMINAR DEL CARRITO ---
function removeFromCart() {
  // Actualizar el badge
  updateCartBadge();
}

// === FIN DEL ARCHIVO ===
// Este archivo maneja toda la funcionalidad de la página de detalle de producto:
// - Búsqueda y sugerencias en tiempo real
// - Carga y renderizado de información del producto
// - Carrusel de imágenes interactivo
// - Productos relacionados
// - Sistema completo de comentarios y calificaciones
