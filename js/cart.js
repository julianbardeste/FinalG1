// Cotización del dólar (puedes ajustar este valor según la cotización actual)
const USD_TO_UYU = 40; // 1 USD = 40 UYU (ejemplo - ajustar según cotización real)

// Función para convertir cualquier precio a USD
function convertToUSD(cost, currency) {
  if (currency === "USD") {
    return cost;
  } else if (currency === "UYU") {
    return cost / USD_TO_UYU;
  }
  // Si es otra moneda, asumir USD por defecto
  return cost;
}

function loadCart() {
  let cart = [];

  try {
    const stored = JSON.parse(localStorage.getItem("cart"));
    if (Array.isArray(stored)) {
      cart = stored;
    } else {
      console.warn("⚠️ 'cart' no es un array, se reinicia.");
      localStorage.setItem("cart", JSON.stringify([]));
    }
  } catch (e) {
    console.error("Error leyendo el carrito:", e);
    localStorage.setItem("cart", JSON.stringify([]));
  }

  const container = document.getElementById("cart-container");
  const emptyCart = document.getElementById("empty-cart");

  if (cart.length === 0) {
    container.innerHTML = "";
    emptyCart.style.display = "block";
    updateCartBadge();
    return;
  }

  emptyCart.style.display = "none";

  // Asegurar subtotales correctos
  cart.forEach((item) => {
    if (item.subtotal === undefined || isNaN(item.subtotal)) {
      item.subtotal = item.cost * (item.quantity || 1);
    }
  });
  localStorage.setItem("cart", JSON.stringify(cart));

  container.innerHTML = cart
    .map((item, index) => {
      // Convertir precio a USD para mostrar consistentemente
      const priceInUSD = convertToUSD(item.cost, item.currency);
      const subtotalInUSD = priceInUSD * item.quantity;

      return `
      <div class="cart-item">
        <div class="row align-items-center">
          <div class="col-md-2">
            <img src="${item.image}" alt="${item.name}" class="img-fluid">
          </div>
          <div class="col-md-4">
            <h5>${item.name}</h5>
            <p class="text-muted mb-0">
              Precio unitario: ${item.currency} ${item.cost}
              ${
                item.currency !== "USD"
                  ? `<br><small class="text-secondary">(≈ USD ${priceInUSD.toFixed(
                      2
                    )})</small>`
                  : ""
              }
            </p>
          </div>
          <div class="col-md-2">
            <label class="form-label">Cantidad:</label>
            <input 
              type="number" 
              class="form-control quantity-input" 
              value="${item.quantity}" 
              min="1"
              onchange="updateQuantity(${index}, this.value)"
            >
          </div>
          <div class="col-md-3 text-end">
            <p class="mb-0"><strong>Subtotal:</strong></p>
            <p class="text-primary fs-5" id="subtotal-${index}">
              USD ${subtotalInUSD.toFixed(2)}
            </p>
            ${
              item.currency !== "USD"
                ? `<small class="text-muted">(${
                    item.currency
                  } ${item.subtotal.toFixed(2)})</small>`
                : ""
            }
          </div>
          <div class="col-md-1 text-end">
            <i class="fas fa-trash remove-btn" onclick="removeItem(${index})" title="Eliminar"></i>
          </div>
        </div>
      </div>
    `;
    })
    .join("");

  updateCartSummary();
  updateCartBadge();
}

// Actualizar cantidad
function updateQuantity(index, newQuantity) {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  if (newQuantity < 1) newQuantity = 1;

  cart[index].quantity = parseInt(newQuantity);
  cart[index].subtotal = cart[index].cost * cart[index].quantity;

  localStorage.setItem("cart", JSON.stringify(cart));

  // Convertir a USD para mostrar
  const priceInUSD = convertToUSD(cart[index].cost, cart[index].currency);
  const subtotalInUSD = priceInUSD * cart[index].quantity;

  // Actualizar subtotal del item
  const subtotalElement = document.getElementById(`subtotal-${index}`);
  if (cart[index].currency !== "USD") {
    subtotalElement.innerHTML = `
      USD ${subtotalInUSD.toFixed(2)}
      <br><small class="text-muted">(${cart[index].currency} ${cart[
      index
    ].subtotal.toFixed(2)})</small>
    `;
  } else {
    subtotalElement.textContent = `USD ${subtotalInUSD.toFixed(2)}`;
  }

  updateCartSummary();
  updateCartBadge();
}

// Eliminar producto
function removeItem(index) {
  if (confirm("¿Estás seguro de eliminar este producto del carrito?")) {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
    updateCartSummary();
    updateCartBadge();
  }
}

// Actualizar totales
function updateCartSummary() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  let totalUSD = 0;

  // Calcular total convirtiendo todo a USD
  cart.forEach((item) => {
    const priceInUSD = convertToUSD(item.cost, item.currency);
    totalUSD += priceInUSD * item.quantity;
  });

  document.getElementById(
    "cart-subtotal"
  ).textContent = `USD ${totalUSD.toFixed(2)}`;
  document.getElementById("cart-shipping").textContent = `USD 0.00`;
  document.getElementById("cart-total").textContent = `USD ${totalUSD.toFixed(
    2
  )}`;
}

// Badge del carrito
function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

  // Actualizar también cartCount para mantener sincronización con product-info.js
  localStorage.setItem("cartCount", totalItems);

  const badge = document.getElementById("cart-count");
  //if (badge) badge.textContent = totalItems;
  if (badge) badge.textContent = totalItems > 0 ? totalItems : "";
}

// Variables globales para el checkout
let checkoutData = {
  shippingType: 0.15, // Premium por defecto
  shippingTypeName: "Premium - 2 a 5 días",
  address: {},
  paymentMethod: "creditCard",
  paymentDetails: {},
};

// Calcular costos de envío
function calculateShipping() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  let subtotal = 0;

  cart.forEach((item) => {
    const priceInUSD = convertToUSD(item.cost, item.currency);
    subtotal += priceInUSD * item.quantity;
  });

  const shippingCost = subtotal * checkoutData.shippingType;
  const total = subtotal + shippingCost;

  return { subtotal, shippingCost, total };
}

// Actualizar resumen del carrito con envío
function updateCartSummaryWithShipping() {
  const costs = calculateShipping();

  document.getElementById(
    "cart-subtotal"
  ).textContent = `USD ${costs.subtotal.toFixed(2)}`;
  document.getElementById(
    "cart-shipping"
  ).textContent = `USD ${costs.shippingCost.toFixed(2)}`;
  document.getElementById(
    "cart-total"
  ).textContent = `USD ${costs.total.toFixed(2)}`;
}

// Abrir modal de checkout
function openCheckoutModal() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  if (cart.length === 0) {
    alert("Tu carrito está vacío");
    return;
  }

  // Reset al primer tab
  const firstTab = new bootstrap.Tab(document.getElementById("shipping-tab"));
  firstTab.show();

  // Abrir modal
  const modal = new bootstrap.Modal(document.getElementById("checkoutModal"));
  modal.show();
}

// Navegación entre tabs
function nextTab(tabId) {
  // Validar la tab actual antes de continuar
  if (!validateCurrentTab()) {
    return;
  }

  const tab = new bootstrap.Tab(document.getElementById(tabId));
  tab.show();

  // Si es el tab de resumen, actualizar la información
  if (tabId === "summary-tab") {
    updateSummary();
  }
}

function prevTab(tabId) {
  const tab = new bootstrap.Tab(document.getElementById(tabId));
  tab.show();
}

// Validar la tab actual
function validateCurrentTab() {
  const activeTab = document.querySelector("#checkoutTabs .nav-link.active");
  const activeTabId = activeTab.getAttribute("data-bs-target");

  if (activeTabId === "#address-section") {
    const form = document.getElementById("addressForm");
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return false;
    }

    // Guardar datos de dirección
    checkoutData.address = {
      departamento: document.getElementById("departamento").value,
      localidad: document.getElementById("localidad").value,
      calle: document.getElementById("calle").value,
      numero: document.getElementById("numero").value,
      esquina: document.getElementById("esquina").value,
    };
  }

  if (activeTabId === "#payment-section") {
    const paymentMethod = document.querySelector(
      'input[name="paymentMethod"]:checked'
    ).value;

    if (paymentMethod === "creditCard") {
      const form = document.getElementById("creditCardForm");
      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return false;
      }

      // Guardar datos de pago
      checkoutData.paymentDetails = {
        cardNumber: document.getElementById("cardNumber").value,
        cardExpiry: document.getElementById("cardExpiry").value,
        cardCVV: document.getElementById("cardCVV").value,
        cardName: document.getElementById("cardName").value,
      };
    }
  }

  return true;
}

// Actualizar resumen final
function updateSummary() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const costs = calculateShipping();

  // Resumen de productos
  const productsHTML = cart
    .map((item) => {
      const priceInUSD = convertToUSD(item.cost, item.currency);
      const subtotalInUSD = priceInUSD * item.quantity;
      return `
      <div class="d-flex justify-content-between align-items-center mb-2">
        <span>${item.name} x ${item.quantity}</span>
        <strong>USD ${subtotalInUSD.toFixed(2)}</strong>
      </div>
    `;
    })
    .join("");
  document.getElementById("summary-products").innerHTML = productsHTML;

  // Resumen de envío
  document.getElementById("summary-shipping-type").textContent =
    checkoutData.shippingTypeName;
  const address = checkoutData.address;
  document.getElementById(
    "summary-address"
  ).textContent = `${address.calle} ${address.numero} esq. ${address.esquina}, ${address.localidad}, ${address.departamento}`;

  // Resumen de pago
  const paymentMethodText =
    checkoutData.paymentMethod === "creditCard"
      ? "Tarjeta de crédito"
      : "Transferencia bancaria";
  document.getElementById("summary-payment-method").textContent =
    paymentMethodText;

  // Costos
  document.getElementById(
    "summary-subtotal"
  ).textContent = `USD ${costs.subtotal.toFixed(2)}`;
  document.getElementById("summary-shipping-percent").textContent = `${(
    checkoutData.shippingType * 100
  ).toFixed(0)}%`;
  document.getElementById(
    "summary-shipping-cost"
  ).textContent = `USD ${costs.shippingCost.toFixed(2)}`;
  document.getElementById(
    "summary-total"
  ).textContent = `USD ${costs.total.toFixed(2)}`;
}

// Finalizar compra
function finalizePurchase() {
  const cart = JSON.parse(localStorage.getItem("cart")) || []; // Carrito actual
  const costs = calculateShipping(); // Costos calculados

  // Crear objeto con todos los datos de la compra
  const purchaseData = {
    products: cart,
    shipping: {
      type: checkoutData.shippingTypeName,
      cost: costs.shippingCost,
      address: checkoutData.address,
    },
    payment: {
      method: checkoutData.paymentMethod,
      details:
        checkoutData.paymentMethod === "creditCard"
          ? {
              cardNumber:
                "****" + checkoutData.paymentDetails.cardNumber.slice(-4),
              cardName: checkoutData.paymentDetails.cardName,
            }
          : null,
    },
    costs: costs,
    date: new Date().toISOString(),
  };

  console.log("Compra finalizada:", purchaseData);

  // Mostrar mensaje de éxito
  alert(
    `¡Compra finalizada con éxito!\n\nTotal: USD ${costs.total.toFixed(
      2
    )}\n\nRecibirás un email de confirmación en breve.`
  );

  // Limpiar carrito
  localStorage.setItem("cart", JSON.stringify([]));

  // Cerrar modal
  const modal = bootstrap.Modal.getInstance(
    document.getElementById("checkoutModal")
  );
  modal.hide();

  // Recargar página
  loadCart();

  // Opcional: redirigir a página de confirmación
  // window.location.href = 'confirmation.html';
}

// Event listeners para el tipo de envío
function setupShippingListeners() {
  const shippingRadios = document.querySelectorAll(
    'input[name="shippingType"]'
  );
  shippingRadios.forEach((radio) => {
    radio.addEventListener("change", function () {
      checkoutData.shippingType = parseFloat(this.value);

      // Obtener el nombre del tipo de envío
      const label =
        this.parentElement.querySelector("label strong").textContent;
      const days = this.parentElement
        .querySelector("label")
        .textContent.match(/\d+ a \d+ días/)[0];
      checkoutData.shippingTypeName = `${label} - ${days}`;

      updateCartSummaryWithShipping();
    });
  });
}

// Event listeners para el método de pago
function setupPaymentListeners() {
  const paymentRadios = document.querySelectorAll(
    'input[name="paymentMethod"]'
  );
  paymentRadios.forEach((radio) => {
    radio.addEventListener("change", function () {
      checkoutData.paymentMethod = this.value;

      // Mostrar/ocultar campos según el método de pago
      const creditCardFields = document.getElementById("creditCardFields");
      const bankTransferInfo = document.getElementById("bankTransferInfo");

      if (this.value === "creditCard") {
        creditCardFields.style.display = "block";
        bankTransferInfo.style.display = "none";
      } else {
        creditCardFields.style.display = "none";
        bankTransferInfo.style.display = "block";
      }
    });
  });
}

// Formatear número de tarjeta (agregar espacios)
function formatCardNumber(input) {
  let value = input.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
  let parts = value.match(/.{1,4}/g);
  input.value = parts ? parts.join(" ") : value;
}

// Formatear fecha de vencimiento
function formatCardExpiry(input) {
  let value = input.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
  if (value.length >= 2) {
    input.value = value.substring(0, 2) + "/" + value.substring(2, 4);
  } else {
    input.value = value;
  }
}

// Configurar formateo de campos de tarjeta
function setupCardFormatting() {
  const cardNumberInput = document.getElementById("cardNumber");
  const cardExpiryInput = document.getElementById("cardExpiry");
  const cardCVVInput = document.getElementById("cardCVV");

  if (cardNumberInput) {
    cardNumberInput.addEventListener("input", function () {
      formatCardNumber(this);
    });
  }

  if (cardExpiryInput) {
    cardExpiryInput.addEventListener("input", function () {
      formatCardExpiry(this);
    });
  }

  if (cardCVVInput) {
    cardCVVInput.addEventListener("input", function () {
      this.value = this.value.replace(/[^0-9]/gi, "");
    });
  }
}

// Inicializar todo
document.addEventListener("DOMContentLoaded", function () {
  loadCart();

  // Event listener para el botón de checkout
  const checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", openCheckoutModal);
  }

  // Configurar listeners cuando el modal se muestra
  const checkoutModal = document.getElementById("checkoutModal");
  if (checkoutModal) {
    checkoutModal.addEventListener("shown.bs.modal", function () {
      setupShippingListeners();
      setupPaymentListeners();
      setupCardFormatting();
      updateCartSummaryWithShipping();
    });
  }
});
