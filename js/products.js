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