// Obtengo el ID de la categoría seleccionada desde localStorage
let catID = localStorage.getItem("catID");

// Construyo la URL dinámica con el catID guardado
let url = `https://japceibal.github.io/emercado-api/cats_products/${catID}.json`;

// Hago la solicitud a la API
fetch(url)
  .then((response) => response.json()) // Convierto la respuesta a JSON
  .then((data) => {
    // Obtengo el array de productos desde la respuesta
    let productos = data.products;

    // Selecciono el elemento de la tabla en el HTML
    let tabla = document.getElementById("productos");

    // Limpio cualquier contenido previo en la tabla
    tabla.innerHTML = "";

    // Verifico si la categoría está vacía (sin productos)
    if (productos.length === 0) {
      // Muestro un mensaje amigable al usuario
      tabla.innerHTML = `
        <tr>
          <td>
            <div class="alert alert-warning text-center" role="alert">
              No hay productos disponibles en esta categoría.
            </div>
          </td>
        </tr>
      `;
      return; // Salgo de la función para no intentar recorrer un array vacío
    }

    // Creo una fila para insertar los productos
    let fila = document.createElement("tr");

    // Recorro cada producto dentro del array
    productos.forEach((prod) => {
      // Creo una celda (columna) para cada producto
      let celda = document.createElement("td");

      // Defino el contenido de la celda con una tarjeta Bootstrap
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

      // Agrego la celda (con su producto) a la fila
      fila.appendChild(celda);
    });

    // Finalmente, agrego la fila completa a la tabla
    tabla.appendChild(fila);
  })
  .catch((error) => console.error("Error al cargar los productos:", error)); // Manejo de errores
