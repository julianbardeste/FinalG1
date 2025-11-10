// Constantes para criterios de ordenamiento
const ORDER_ASC_BY_NAME = "AZ";
const ORDER_DESC_BY_NAME = "ZA";
const ORDER_BY_PROD_COUNT = "Cant.";

// Variables globales para manejo de categorías y filtros
let currentCategoriesArray = [];
let currentSortCriteria = undefined;
let minCount = undefined;
let maxCount = undefined;

// Función para ordenar categorías según diferentes criterios
function sortCategories(criteria, array) {
  let result = [];

  if (criteria === ORDER_ASC_BY_NAME) {
    // Ordenar alfabéticamente de A a Z
    result = array.sort(function (a, b) {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });
  } else if (criteria === ORDER_DESC_BY_NAME) {
    // Ordenar alfabéticamente de Z a A
    result = array.sort(function (a, b) {
      if (a.name > b.name) {
        return -1;
      }
      if (a.name < b.name) {
        return 1;
      }
      return 0;
    });
  } else if (criteria === ORDER_BY_PROD_COUNT) {
    // Ordenar por cantidad de productos (mayor a menor)
    result = array.sort(function (a, b) {
      let aCount = parseInt(a.productCount);
      let bCount = parseInt(b.productCount);

      if (aCount > bCount) {
        return -1;
      }
      if (aCount < bCount) {
        return 1;
      }
      return 0;
    });
  }

  return result;
}

// Función para establecer el ID de categoría y navegar a productos
function setCatID(id) {
  localStorage.setItem("catID", id); // Guardar el id en el almacenamiento local
  window.location = "products.html"; // Redirigir a la página de productos
}

// Función para mostrar la lista de categorías con filtros aplicados
function showCategoriesList() {
  let htmlContentToAppend = "";

  // Iterar por todas las categorías
  for (let i = 0; i < currentCategoriesArray.length; i++) {
    let category = currentCategoriesArray[i];

    // Aplicar filtros de cantidad de productos (mínimo y máximo)
    if (
      (minCount == undefined ||
        (minCount != undefined &&
          parseInt(category.productCount) >= minCount)) &&
      (maxCount == undefined ||
        (maxCount != undefined && parseInt(category.productCount) <= maxCount))
    ) {
      // Crear el HTML para cada categoría que pasa los filtros
      htmlContentToAppend += `
            <div onclick="setCatID(${category.id})" class="list-group-item list-group-item-action cursor-active">
                <div class="row">
                    <div class="col-3">
                        <img src="${category.imgSrc}" alt="${category.description}" class="img-thumbnail">
                    </div>
                    <div class="col">
                        <div class="d-flex w-100 justify-content-between">
                            <h4 class="mb-1">${category.name}</h4>
                            <small class="text-muted">${category.productCount} artículos</small>
                        </div>
                        <p class="mb-1">${category.description}</p>
                    </div>
                </div>
            </div>
            `;
    }

    // Insertar el HTML generado en el contenedor
    document.getElementById("cat-list-container").innerHTML =
      htmlContentToAppend;
  }
}

// Función para ordenar y mostrar categorías
function sortAndShowCategories(sortCriteria, categoriesArray) {
  currentSortCriteria = sortCriteria;

  // Si se pasa un nuevo array de categorías, actualizarlo
  if (categoriesArray != undefined) {
    currentCategoriesArray = categoriesArray;
  }

  // Aplicar el ordenamiento al array actual
  currentCategoriesArray = sortCategories(
    currentSortCriteria,
    currentCategoriesArray
  );

  // Mostrar las categorías ordenadas
  showCategoriesList();
}

// Inicialización cuando el DOM está completamente cargado
document.addEventListener("DOMContentLoaded", function (e) {
  // Cargar datos de categorías desde la API
  getJSONData(CATEGORIES_URL).then(function (resultObj) {
    if (resultObj.status === "ok") {
      currentCategoriesArray = resultObj.data;
      showCategoriesList();
      //sortAndShowCategories(ORDER_ASC_BY_NAME, resultObj.data);
    }
  });

  // Event listener para ordenamiento ascendente (A-Z)
  document.getElementById("sortAsc").addEventListener("click", function () {
    sortAndShowCategories(ORDER_ASC_BY_NAME);
  });

  // Event listener para ordenamiento descendente (Z-A)
  document.getElementById("sortDesc").addEventListener("click", function () {
    sortAndShowCategories(ORDER_DESC_BY_NAME);
  });

  // Event listener para ordenamiento por cantidad de productos
  document.getElementById("sortByCount").addEventListener("click", function () {
    sortAndShowCategories(ORDER_BY_PROD_COUNT);
  });

  // Event listener para limpiar filtros de rango
  document
    .getElementById("clearRangeFilter")
    .addEventListener("click", function () {
      // Limpiar los campos de entrada
      document.getElementById("rangeFilterCountMin").value = "";
      document.getElementById("rangeFilterCountMax").value = "";

      // Resetear las variables de filtro
      minCount = undefined;
      maxCount = undefined;

      // Mostrar todas las categorías sin filtro
      showCategoriesList();
    });

  // Event listener para aplicar filtros de rango de cantidad
  document
    .getElementById("rangeFilterCount")
    .addEventListener("click", function () {
      // Obtener valores de los campos de filtro
      minCount = document.getElementById("rangeFilterCountMin").value;
      maxCount = document.getElementById("rangeFilterCountMax").value;

      // Validar y convertir valor mínimo
      if (minCount != undefined && minCount != "" && parseInt(minCount) >= 0) {
        minCount = parseInt(minCount);
      } else {
        minCount = undefined;
      }

      // Validar y convertir valor máximo
      if (maxCount != undefined && maxCount != "" && parseInt(maxCount) >= 0) {
        maxCount = parseInt(maxCount);
      } else {
        maxCount = undefined;
      }

      // Aplicar filtros y mostrar categorías
      showCategoriesList();
    });
});

// === FUNCIONALIDAD DE BÚSQUEDA SIMPLE ===
// Elementos del DOM para la búsqueda
const navInput = document.getElementById("navSearchInput");
const suggestions = document.getElementById("searchSuggestions");
let allProducts = null;

// Función para cargar todos los productos y cachearlos en sessionStorage
async function loadAllProducts() {
  const cached = sessionStorage.getItem("allProductsCache");
  // Si ya está en caché, usar los datos guardados
  if (cached) {
    allProducts = JSON.parse(cached);
    return;
  }

  try {
    // Obtener todas las categorías
    const cats = await fetch(CATEGORIES_URL).then((r) => r.json());
    // Crear promesas para obtener productos de cada categoría
    const proms = cats.map((c) =>
      fetch(PRODUCTS_URL + c.id + EXT_TYPE)
        .then((r) => r.json())
        .catch(() => null)
    );
    // Esperar a que se resuelvan todas las promesas
    const lists = await Promise.all(proms);

    // Fusionar todos los productos en un solo array
    const merged = [];
    lists.forEach((l) => {
      if (l && l.products) merged.push(...l.products);
    });

    // Eliminar productos duplicados usando un mapa por ID
    const map = {};
    merged.forEach((p) => {
      map[p.id] = p;
    });
    allProducts = Object.values(map);

    // Guardar en caché para futuras búsquedas
    sessionStorage.setItem("allProductsCache", JSON.stringify(allProducts));
  } catch (e) {
    console.error("Error cargando productos:", e);
    allProducts = [];
  }
}

// Función para mostrar sugerencias de búsqueda
function showSuggestions(items) {
  suggestions.innerHTML = "";
  // Si no hay resultados, ocultar las sugerencias
  if (!items.length) {
    suggestions.style.display = "none";
    return;
  }

  // Crear elemento HTML para cada producto encontrado
  items.forEach((p) => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex align-items-center";

    // Obtener URL de imagen con fallback
    const imgSrc = p.image || (p.images && p.images[0]) || "img/no-image.png";

    // Crear y configurar imagen del producto
    const img = document.createElement("img");
    img.src = imgSrc;
    img.alt = p.name || "producto";
    img.width = 44;
    img.height = 44;
    img.onerror = () => {
      img.src = "img/no-image.png";
    };

    // Crear contenedor de texto
    const textWrap = document.createElement("div");
    textWrap.className = "suggest-text";

    // Título del producto
    const title = document.createElement("div");
    title.textContent = p.name || "(sin nombre)";
    title.style.fontWeight = "600";

    // Subtítulo con precio o descripción
    const sub = document.createElement("div");
    sub.className = "suggest-sub";
    if (p.cost !== undefined) {
      sub.textContent = `${p.currency || ""} ${p.cost}`;
    } else if (p.description) {
      sub.textContent =
        p.description.slice(0, 60) + (p.description.length > 60 ? "…" : "");
    }

    // Ensamblar elementos
    textWrap.appendChild(title);
    textWrap.appendChild(sub);
    li.appendChild(img);
    li.appendChild(textWrap);

    // Evento click para navegar al producto
    li.addEventListener("click", () => {
      localStorage.setItem("productID", p.id);
      window.location.href = "product-info.html";
    });

    suggestions.appendChild(li);
  });

  suggestions.style.display = "block";
}

// Event listener para búsqueda en tiempo real
navInput &&
  navInput.addEventListener("input", async () => {
    const q = navInput.value.trim().toLowerCase();
    // Si no hay texto, ocultar sugerencias
    if (!q) {
      suggestions.style.display = "none";
      return;
    }

    // Cargar productos si aún no están cargados
    if (!allProducts) await loadAllProducts();

    // Buscar coincidencias en nombre y descripción
    const matches = allProducts.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
    );

    // Mostrar hasta 6 sugerencias
    showSuggestions(matches.slice(0, 6));
  });

// Event listener para ocultar sugerencias al hacer clic fuera
document.addEventListener("click", (e) => {
  if (!navInput.contains(e.target) && !suggestions.contains(e.target)) {
    suggestions.style.display = "none";
  }
});
