/* =======================================
   VARIABLES GLOBALES Y CONFIGURACIÓN
   Configuración inicial para el sistema de venta y publicación
   ======================================= */

// Variables para el cálculo de costos
let productCost = 0; // Precio del producto ingresado por el usuario
let productCount = 0; // Cantidad de productos (no se usa en cálculos actuales)
let comissionPercentage = 0.13; // Porcentaje de comisión inicial (Gold = 13%)

// Constantes para símbolos y monedas
let MONEY_SYMBOL = "$"; // Símbolo monetario actual
let DOLLAR_CURRENCY = "Dólares (USD)"; // Texto para selección de moneda USD
let PESO_CURRENCY = "Pesos Uruguayos (UYU)"; // Texto para selección de moneda UYU
let DOLLAR_SYMBOL = "USD "; // Símbolo para dólares
let PESO_SYMBOL = "UYU "; // Símbolo para pesos uruguayos
let PERCENTAGE_SYMBOL = "%"; // Símbolo de porcentaje

// Mensaje para funcionalidades no implementadas
let MSG = "FUNCIONALIDAD NO IMPLEMENTADA";

/* =======================================
   FUNCIONES DE CÁLCULO Y ACTUALIZACIÓN
   ======================================= */

// Función principal para actualizar los costos de publicación en tiempo real
// Se ejecuta cada vez que cambia el precio, la moneda o el tipo de publicación
function updateTotalCosts() {
  // Obtener referencias a los elementos del DOM donde se muestran los costos
  let unitProductCostHTML = document.getElementById("productCostText"); // Costo unitario
  let comissionCostHTML = document.getElementById("comissionText"); // Porcentaje de comisión
  let totalCostHTML = document.getElementById("totalCostText"); // Costo total

  // Calcular los valores a mostrar
  let unitCostToShow = MONEY_SYMBOL + productCost; // Precio con símbolo de moneda
  let comissionToShow =
    Math.round(comissionPercentage * 100) + PERCENTAGE_SYMBOL; // Comisión en porcentaje

  // Cálculo del costo total: precio + (precio * comisión)
  let totalCostToShow =
    MONEY_SYMBOL +
    (Math.round(productCost * comissionPercentage * 100) / 100 +
      parseInt(productCost));

  // Actualizar el contenido HTML de los elementos
  unitProductCostHTML.innerHTML = unitCostToShow;
  comissionCostHTML.innerHTML = comissionToShow;
  totalCostHTML.innerHTML = totalCostToShow;
}

/* =======================================
   INICIALIZACIÓN Y EVENT LISTENERS
   Configuración que se ejecuta cuando el DOM está completamente cargado
   ======================================= */

// Event listener principal que se ejecuta cuando el documento HTML está completamente cargado
// Configura todos los event listeners para la interactividad de la página
document.addEventListener("DOMContentLoaded", function (e) {
  // Event listener para cambios en la cantidad de productos
  // Actualiza la variable global y recalcula costos
  document
    .getElementById("productCountInput")
    .addEventListener("change", function () {
      productCount = this.value; // Actualizar cantidad global
      updateTotalCosts(); // Recalcular y mostrar nuevos costos
    });

  // Event listener para cambios en el precio del producto
  // Es el campo más importante ya que afecta directamente los cálculos
  document
    .getElementById("productCostInput")
    .addEventListener("change", function () {
      productCost = this.value; // Actualizar precio global
      updateTotalCosts(); // Recalcular y mostrar nuevos costos
    });

  // Event listeners para los diferentes tipos de publicación
  // Cada tipo tiene un porcentaje de comisión diferente

  // Publicación Gold: 13% de comisión (máxima visibilidad)
  document.getElementById("goldradio").addEventListener("change", function () {
    comissionPercentage = 0.13; // 13% de comisión
    updateTotalCosts();
  });

  // Publicación Premium: 7% de comisión (visibilidad media)
  document
    .getElementById("premiumradio")
    .addEventListener("change", function () {
      comissionPercentage = 0.07; // 7% de comisión
      updateTotalCosts();
    });

  // Publicación Standard: 3% de comisión (visibilidad básica)
  document
    .getElementById("standardradio")
    .addEventListener("change", function () {
      comissionPercentage = 0.03; // 3% de comisión
      updateTotalCosts();
    });

  // Event listener para cambios en el tipo de moneda
  // Actualiza el símbolo monetario que se muestra en los precios
  document
    .getElementById("productCurrency")
    .addEventListener("change", function () {
      // Cambiar símbolo según la moneda seleccionada
      if (this.value == DOLLAR_CURRENCY) {
        MONEY_SYMBOL = DOLLAR_SYMBOL; // Cambiar a USD
      } else if (this.value == PESO_CURRENCY) {
        MONEY_SYMBOL = PESO_SYMBOL; // Cambiar a UYU
      }

      // Actualizar visualización con el nuevo símbolo
      updateTotalCosts();
    });

  /* =======================================
       CONFIGURACIÓN DE DROPZONE
       Configuración para la subida de archivos/imágenes
       ======================================= */

  // Opciones de configuración para Dropzone (biblioteca de subida de archivos)
  let dzoptions = {
    url: "/", // URL ficticia (no funcional)
    autoQueue: false, // No subir archivos automáticamente
  };

  // Inicializar Dropzone en el elemento especificado
  let myDropzone = new Dropzone("div#file-upload", dzoptions);

  /* =======================================
       MANEJO DEL FORMULARIO DE VENTA
       Validación y procesamiento del formulario de publicación
       ======================================= */

  // Obtener referencia al formulario principal de venta
  let sellForm = document.getElementById("sell-info");

  // Event listener para el envío del formulario
  // Se ejecuta cuando el usuario hace clic en "Vender"
  sellForm.addEventListener("submit", function (e) {
    // Prevenir el envío estándar del formulario para manejar validación personalizada
    e.preventDefault();

    // Obtener referencias a los campos que necesitan validación
    let productNameInput = document.getElementById("productName"); // Campo nombre del producto
    let productCategory = document.getElementById("productCategory"); // Campo categoría
    let productCost = document.getElementById("productCostInput"); // Campo precio

    // Bandera para rastrear si falta información requerida
    let infoMissing = false;

    // Limpiar clases de validación anteriores (resetear estado visual)
    productNameInput.classList.remove("is-invalid");
    productCategory.classList.remove("is-invalid");
    productCost.classList.remove("is-invalid");

    /* =======================================
           VALIDACIONES DE CAMPOS REQUERIDOS
           ======================================= */

    // Validación del nombre del producto
    if (productNameInput.value === "") {
      productNameInput.classList.add("is-invalid"); // Marcar como inválido visualmente
      infoMissing = true; // Indicar que falta información
    }

    // Validación de la categoría del producto
    if (productCategory.value === "") {
      productCategory.classList.add("is-invalid"); // Marcar como inválido visualmente
      infoMissing = true; // Indicar que falta información
    }

    // Validación del precio del producto
    // Debe ser mayor a 0 para ser válido
    if (productCost.value <= 0) {
      productCost.classList.add("is-invalid"); // Marcar como inválido visualmente
      infoMissing = true; // Indicar que falta información
    }

    /* =======================================
           PROCESAMIENTO DEL FORMULARIO
           ======================================= */

    // Si todas las validaciones pasaron, procesar la publicación
    if (!infoMissing) {
      // Intentar crear la publicación (actualmente simulado)
      // En una implementación real, aquí se enviarían los datos al servidor
      getJSONData(PUBLISH_PRODUCT_URL).then(function (resultObj) {
        // Obtener elementos para mostrar resultados
        let msgToShowHTML = document.getElementById("resultSpan");
        let msgToShow = "";

        // Procesar respuesta del servidor
        // NOTA: Actualmente esta funcionalidad no está implementada
        if (resultObj.status === "ok") {
          msgToShow = MSG; // Mostrar mensaje de funcionalidad no implementada
          document.getElementById("alertResult").classList.add("alert-primary");
        } else if (resultObj.status === "error") {
          msgToShow = MSG; // Mostrar mensaje de funcionalidad no implementada
          document.getElementById("alertResult").classList.add("alert-primary");
        }

        // Mostrar el resultado al usuario
        msgToShowHTML.innerHTML = msgToShow;
        document.getElementById("alertResult").classList.add("show");
      });
    }
  }); // Fin del event listener del formulario
}); // Fin del event listener DOMContentLoaded

// === FIN DEL ARCHIVO ===
// Este archivo maneja la funcionalidad de la página de venta/publicación:
// - Cálculo dinámico de costos y comisiones
// - Validación de formularios
// - Configuración de subida de archivos con Dropzone
// - Manejo de diferentes tipos de publicación y monedas
