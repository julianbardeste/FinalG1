fetch('https://japceibal.github.io/emercado-api/cats_products/101.json') // Llama al contenido de la URL
        .then(response => response.json()) // Convierte la respuesta a JSON
        .catch(error => console.error('Error al cargar los productos:', error)) 
        .then(data => { // Procesa los datos obtenidos
          let productos = data.products; // Asigna los productos a una variable
          let tabla = document.getElementById('productos'); // Obtiene la tabla por su ID
          let fila = document.createElement("tr"); // Crea una nueva fila para la tabla
          productos.forEach(prod => {
            let celda = document.createElement("td"); // Crea una nueva celda para cada producto
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
        })
.catch(error => console.error('Error al cargar los productos:', error));