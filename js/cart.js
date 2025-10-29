function loadCart() {
  let cart = [];

  try {
    const stored = JSON.parse(localStorage.getItem('cart'));
    if (Array.isArray(stored)) {
      cart = stored;
    } else {
      console.warn("⚠️ 'cart' no es un array, se reinicia.");
      localStorage.setItem('cart', JSON.stringify([]));
    }
  } catch (e) {
    console.error("Error leyendo el carrito:", e);
    localStorage.setItem('cart', JSON.stringify([]));
  }

  const container = document.getElementById('cart-container');
  const emptyCart = document.getElementById('empty-cart');

  if (cart.length === 0) {
    container.innerHTML = '';
    emptyCart.style.display = 'block';
    updateCartBadge();
    return;
  }

  emptyCart.style.display = 'none';

  // Asegurar subtotales correctos
  cart.forEach(item => {
    if (item.subtotal === undefined || isNaN(item.subtotal)) {
      item.subtotal = item.cost * (item.quantity || 1);
    }
  });
  localStorage.setItem('cart', JSON.stringify(cart));

  container.innerHTML = cart.map((item, index) => `
    <div class="cart-item">
      <div class="row align-items-center">
        <div class="col-md-2">
          <img src="${item.image}" alt="${item.name}" class="img-fluid">
        </div>
        <div class="col-md-4">
          <h5>${item.name}</h5>
          <p class="text-muted mb-0">Precio unitario: ${item.currency} ${item.cost}</p>
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
            ${item.currency} ${item.subtotal.toFixed(2)}
          </p>
        </div>
        <div class="col-md-1 text-end">
          <i class="fas fa-trash remove-btn" onclick="removeItem(${index})" title="Eliminar"></i>
        </div>
      </div>
    </div>
  `).join('');

  updateCartSummary();
  updateCartBadge();
}

// Actualizar cantidad
function updateQuantity(index, newQuantity) {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];

  if (newQuantity < 1) newQuantity = 1;

  cart[index].quantity = parseInt(newQuantity);
  cart[index].subtotal = cart[index].cost * cart[index].quantity;

  localStorage.setItem('cart', JSON.stringify(cart));

  document.getElementById(`subtotal-${index}`).textContent = 
    `${cart[index].currency} ${cart[index].subtotal.toFixed(2)}`;

  updateCartSummary();
  updateCartBadge();
}

// Eliminar producto
function removeItem(index) {
  if (confirm('¿Estás seguro de eliminar este producto del carrito?')) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCart();
    updateCartSummary();
    updateCartBadge();
  }
}

// Actualizar totales
function updateCartSummary() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  let total = 0;

  cart.forEach(item => {
    total += item.subtotal;
  });

  document.getElementById('cart-subtotal').textContent = `USD ${total.toFixed(2)}`;
  document.getElementById('cart-shipping').textContent = `USD 0.00`;
  document.getElementById('cart-total').textContent = `USD ${total.toFixed(2)}`;
}

// Badge del carrito
function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

  // Actualizar también cartCount para mantener sincronización con product-info.js
  localStorage.setItem('cartCount', totalItems);

  const badge = document.getElementById('cart-count');
  //if (badge) badge.textContent = totalItems;
  if (badge) badge.textContent = totalItems > 0 ? totalItems : '';
}

// Pagar (solo demostración)
function checkout() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  if (cart.length === 0) {
    alert('Tu carrito está vacío');
    return;
  }
  alert('Funcionalidad de pago en desarrollo. Total a pagar: ' + 
        document.getElementById('cart-total').textContent);
}

// Iniciar
document.addEventListener('DOMContentLoaded', loadCart);

