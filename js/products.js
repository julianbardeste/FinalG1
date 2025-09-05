// Obtengo el ID de la categoría seleccionada desde localStorage
let catID = localStorage.getItem("catID");

// Construyo la URL dinámica con el catID guardado
let url = `https://japceibal.github.io/emercado-api/cats_products/${catID}.json`;

let productos = [];
let productosFiltrados = [];

// Referencias a elementos del DOM
const tabla = document.getElementById("productos");

const sortAsc = document.getElementById("sortAsc");
const sortDesc = document.getElementById("sortDesc");
const sortByCount = document.getElementById("sortByCount");

const minInput = document.getElementById("rangeFilterCountMin");
const maxInput = document.getElementById("rangeFilterCountMax");
const filterBtn = document.getElementById("rangeFilterCount");
const clearBtn = document.getElementById("clearRangeFilter");

// Mostrar productos en tarjetas Bootstrap
function showProducts(list) {
  tabla.innerHTML = "";

  if (list.length === 0) {
    tabla.innerHTML = `
      <tr>
        <td>
          <div class="alert alert-warning text-center" role="alert">
            No hay productos disponibles en esta categoría.
          </div>
        </td>
      </tr>
    `;
    return;
  }

  let fila = document.createElement("tr");

  list.forEach(prod => {
    let celda = document.createElement("td");
    celda.innerHTML = `
      <div class="card">
        <img src="${prod.image}" class="card-img-top" alt="${prod.name}">
        <div class="card-body">
          <h5 class="card-title">${prod.name}</h5>
          <p class="card-text">${prod.description}</p>
          <p class="card-text"><strong>Precio:</strong> ${prod.currency} ${prod.cost}</p>
          <p class="card-text"><strong>Vendidos:</strong> ${prod.soldCount}</p>
          <a href="#" class="btn btn-primary">Ver más</a>
        </div>
      </div>
    `;
    fila.appendChild(celda);
  });

  tabla.appendChild(fila);
}

// Ordenar productos
function sortProducts() {
  if (sortAsc.checked) {
    productosFiltrados.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortDesc.checked) {
    productosFiltrados.sort((a, b) => b.name.localeCompare(a.name));
  } else if (sortByCount.checked) {
    productosFiltrados.sort((a, b) => b.soldCount - a.soldCount);
  }
  showProducts(productosFiltrados);
}

// Filtrar por rango de vendidos
function filterByRange() {
  let min = parseInt(minInput.value) || 0;
  let max = parseInt(maxInput.value) || Infinity;

  productosFiltrados = productos.filter(p =>
    p.soldCount >= min && p.soldCount <= max
  );

  sortProducts();
}

// Limpiar filtro
function clearFilter() {
  minInput.value = "";
  maxInput.value = "";
  productosFiltrados = [...productos];
  sortProducts();
}

// Eventos
sortAsc.addEventListener("change", sortProducts);
sortDesc.addEventListener("change", sortProducts);
sortByCount.addEventListener("change", sortProducts);

filterBtn.addEventListener("click", filterByRange);
clearBtn.addEventListener("click", clearFilter);

// Traer productos desde la API
fetch(url)
  .then(response => response.json())
  .then(data => {
    productos = data.products;
    productosFiltrados = [...productos];
    sortProducts(); // mostrar inicial
  })
  .catch(error => console.error("Error al cargar los productos:", error));

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
