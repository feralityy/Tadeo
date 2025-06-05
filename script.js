// --------- CART LOGIC ---------

function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function addToCart(name, price) {
  const cart = getCart();
  const existing = cart.find(item => item.name === name);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ name, price, quantity: 1 });
  }
  saveCart(cart);
  updateCartUI();
}

function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  updateCartUI();
}

function increaseQuantity(index) {
  const cart = getCart();
  cart[index].quantity += 1;
  saveCart(cart);
  updateCartUI();
}

function decreaseQuantity(index) {
  const cart = getCart();
  if (cart[index].quantity > 1) {
    cart[index].quantity -= 1;
  } else {
    cart.splice(index, 1);
  }
  saveCart(cart);
  updateCartUI();
}

function updateCartUI() {
  const cart = getCart();
  const cartCountEl = document.getElementById("cart-count");
  const cartContainer = document.getElementById("cart");

  if (cartCountEl) {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountEl.textContent = totalItems;
  }

  if (cartContainer) {
    cartContainer.innerHTML = "";
    if (cart.length === 0) {
      cartContainer.innerHTML = "<p>Your cart is empty.</p>";
      return;
    }

    let total = 0;
    cart.forEach((item, index) => {
      const subtotal = item.price * item.quantity;
      total += subtotal;
      cartContainer.innerHTML += `
        <div class="cart-item">
          <span>${item.name} - $${item.price} × ${item.quantity}</span>
          <div class="qty-controls">
            <button onclick="decreaseQuantity(${index})">−</button>
            <button onclick="increaseQuantity(${index})">+</button>
            <button class="remove-btn" onclick="removeFromCart(${index})">×</button>
          </div>
        </div>
      `;
    });

    cartContainer.innerHTML += `<hr><strong>Total: $${total}</strong>`;
  }
}

function toggleCartDropdown() {
  const dropdown = document.getElementById("cart-dropdown");
  if (dropdown) dropdown.classList.toggle("hidden");
}

window.onload = () => {
  updateCartUI();

  // On checkout page, fill hidden cart summary input
  if (window.location.pathname.includes("checkout.html")) {
    const cart = getCart();
    const cartSummary = cart.map(item => `${item.name} x${item.quantity} = $${item.price * item.quantity}`).join('\n');
    const hiddenCartInput = document.getElementById("cart-summary");
    if (hiddenCartInput) hiddenCartInput.value = cartSummary;
  }
};

// --------- CHECKOUT LOGIC ---------

if (window.location.pathname.includes("checkout.html")) {
  document.getElementById("checkout-form").addEventListener("submit", function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const name = formData.get("name");
    const email = formData.get("email");
    const phone = formData.get("phone");
    const address = formData.get("address");

    const cart = getCart();
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const cartSummary = cart.map(item => `${item.name} x${item.quantity} = $${item.price * item.quantity}`).join('\n');

    const dataToSend = { name, email, phone, address, cartSummary, total };

    // Replace with your Google Apps Script Web App URL:
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyouDmOHwOBKWgKjtAxPvCVTDnzhXboW61HMyw2x5AxvvE5RCC0GjMjBoPk9q592PbV/exec";

    fetch(GOOGLE_SCRIPT_URL, {
  method: "POST",
  mode: "no-cors", // 👈 this prevents browser CORS rejection
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(dataToSend)
})
.then(() => {
  // NOTE: no response can be read in no-cors mode
  alert("Order placed! Your receipt will download.");
  downloadReceiptPDF(dataToSend);
  localStorage.removeItem("cart");
  document.getElementById("checkout-form").reset();
})
.catch(err => {
  console.error("Fetch error:", err);
  alert("Network error. Please try again later.");
});

function downloadReceiptPDF(data) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 10;
  doc.setFontSize(14);
  doc.text("Pallet Shop Receipt", 10, y);
  y += 10;

  doc.setFontSize(12);
  doc.text(`Name: ${data.name}`, 10, y); y += 8;
  doc.text(`Email: ${data.email}`, 10, y); y += 8;
  doc.text(`Phone: ${data.phone}`, 10, y); y += 8;
  doc.text(`Address: ${data.address}`, 10, y); y += 12;

  doc.text("Order Details:", 10, y);
  y += 8;
  data.cartSummary.split('\n').forEach(line => {
    doc.text(line, 10, y);
    y += 8;
  });

  y += 4;
  doc.text(`Total: $${data.total}`, 10, y);

  doc.save("pallet-shop-receipt.pdf");
}
