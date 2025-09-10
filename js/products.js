// Obtengo el ID de la categoría seleccionada desde localStorage
let catID = localStorage.getItem("catID");

// Si no hay catID, usar uno por defecto para testing
if (!catID) {
    catID = "101";
    console.log("No se encontró catID, usando 101 por defecto");
}

// Construyo la URL dinámica con el catID guardado
let url = `https://japceibal.github.io/emercado-api/cats_products/${catID}.json`;

let productos = [];
let productosFiltrados = [];

// Referencias a elementos del DOM
const tabla = document.getElementById("productos");

const sortAsc = document.getElementById("sortAsc");
const sortDesc = document.getElementById("sortDesc");
const sortPriceAsc = document.getElementById("sortPriceAsc");
const sortPriceDesc = document.getElementById("sortPriceDesc");
const sortByCount = document.getElementById("sortByCount");

const minInput = document.getElementById("rangeFilterPriceMin");
const maxInput = document.getElementById("rangeFilterPriceMax");
const filterBtn = document.getElementById("rangeFilterPrice");
const clearBtn = document.getElementById("clearRangeFilter");

// Función mejorada para mostrar productos
        function showProducts(list) {
            if (!tabla) {
                console.error("Elemento tabla no encontrado!");
                return;
            }
            tabla.innerHTML = "";

            if (list.length === 0) {
                tabla.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-box-open"></i>
                        <h3>No hay productos disponibles</h3>
                        <p>No se encontraron productos que coincidan con tus criterios de búsqueda.</p>
                    </div>
                `;
                return;
            }

            list.forEach((prod, index) => {
                const productCard = document.createElement("div");
                productCard.className = "product-card";
                productCard.style.animationDelay = `${index * 0.1}s`;

                productCard.innerHTML = `
                    <img src="${prod.image}" class="product-image" alt="${prod.name}" 
                         onerror="this.src='https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400'">
                    <div class="product-content">
                        <h5 class="product-title">${prod.name}</h5>
                        <p class="product-description">${prod.description}</p>
                        <div class="product-meta">
                            <span class="product-price">${prod.currency} ${prod.cost.toLocaleString()}</span>
                            <span class="product-sold">
                                <i class="fas fa-chart-line me-1"></i>
                                ${prod.soldCount.toLocaleString()} vendidos
                            </span>
                        </div>
                        <button class="product-btn ver-mas" data-id="${prod.id}">
                            <i class="fas fa-eye me-2"></i>Ver Detalles
                        </button>
                    </div>
                `;

                tabla.appendChild(productCard);
            });
        }

        // Función de ordenamiento (mantiene tu lógica original)
        function sortProducts() {
            if (sortAsc.checked) {
                productosFiltrados.sort((a, b) => a.name.localeCompare(b.name));
            } else if (sortDesc.checked) {
                productosFiltrados.sort((a, b) => b.name.localeCompare(a.name));
            } else if (sortPriceAsc.checked) {
                productosFiltrados.sort((a, b) => a.cost - b.cost);
            } else if (sortPriceDesc.checked) {
                productosFiltrados.sort((a, b) => b.cost - a.cost);
            } else if (sortByCount.checked) {
                productosFiltrados.sort((a, b) => b.soldCount - a.soldCount);
            }
            showProducts(productosFiltrados);
        }

        // Función de filtrado por precio (mantiene tu lógica original)
        function filterByRange() {
            let min = parseFloat(minInput.value) || 0;
            let max = parseFloat(maxInput.value) || Infinity;

            productosFiltrados = productos.filter(p =>
                p.cost >= min && p.cost <= max
            );

            sortProducts();
        }

        // Función para limpiar filtros (mantiene tu lógica original)
        function clearFilter() {
            minInput.value = "";
            maxInput.value = "";
            productosFiltrados = [...productos];
            sortProducts();
        }

        // Event listeners (mantiene tu lógica original)
        sortAsc.addEventListener("change", sortProducts);
        sortDesc.addEventListener("change", sortProducts);
        sortPriceAsc.addEventListener("change", sortProducts);
        sortPriceDesc.addEventListener("change", sortProducts);
        sortByCount.addEventListener("change", sortProducts);

        filterBtn.addEventListener("click", filterByRange);
        clearBtn.addEventListener("click", clearFilter);

        // Delegación de eventos para los botones "Ver más" (mantiene tu lógica original)
        tabla.addEventListener("click", (e) => {
            if (e.target.classList.contains("ver-mas") || e.target.closest(".ver-mas")) {
                e.preventDefault();
                const button = e.target.classList.contains("ver-mas") ? e.target : e.target.closest(".ver-mas");
                const id = button.getAttribute("data-id");
                
                // Animación de clic
                button.style.transform = "scale(0.95)";
                setTimeout(() => {
                    button.style.transform = "scale(1)";
                }, 150);
                
                localStorage.setItem("productID", id);
                window.location.href = "product-info.html";
            }
        });

        // Búsqueda simple (demo)
        const navInput = document.getElementById("navSearchInput");
        const suggestions = document.getElementById("searchSuggestions");

        navInput.addEventListener("input", () => {
            const query = navInput.value.trim().toLowerCase();
            if (!query) {
                suggestions.style.display = "none";
                return;
            }

            const matches = productos.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.description.toLowerCase().includes(query)
            ).slice(0, 5);

            if (matches.length > 0) {
                suggestions.innerHTML = matches.map(p => `
                    <div class="suggestion-item" onclick="selectProduct(${p.id})">
                        <img src="${p.image}" alt="${p.name}" onerror="this.src='https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400'">
                        <div class="suggest-text">
                            <div>${p.name}</div>
                            <div class="suggest-sub">${p.currency} ${p.cost}</div>
                        </div>
                    </div>
                `).join('');
                suggestions.style.display = "block";
            } else {
                suggestions.style.display = "none";
            }
        });

        function selectProduct(id) {
            localStorage.setItem("productID", id);
            if (suggestions) suggestions.style.display = "none";
            if (navInput) navInput.value = "";
            window.location.href = "product-info.html";
        }

        // Ocultar sugerencias al hacer clic fuera
        document.addEventListener("click", (e) => {
            if (navInput && suggestions && 
                !navInput.contains(e.target) && !suggestions.contains(e.target)) {
                suggestions.style.display = "none";
            }
        });

        // Traer productos desde la API
        fetch(url)
            .then(response => response.json())
            .then(data => {
                productos = data.products;
                productosFiltrados = [...productos];
                showProducts(productosFiltrados); // mostrar inicial
            })
            .catch(error => console.error("Error al cargar los productos:", error));

        // Efectos adicionales de interacción
        document.addEventListener("DOMContentLoaded", () => {
            // Animación de entrada para los filtros
            const filterGroups = document.querySelectorAll(".filter-group");
            filterGroups.forEach((group, index) => {
                group.style.opacity = "0";
                group.style.transform = "translateY(20px)";
                setTimeout(() => {
                    group.style.transition = "all 0.6s ease";
                    group.style.opacity = "1";
                    group.style.transform = "translateY(0)";
                }, index * 100);
            });
        });