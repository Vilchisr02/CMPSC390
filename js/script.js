// DOM Elements
const signUpBtn = document.getElementById("signUpBtn");
const signInBtn = document.getElementById("signInBtn");
const cartBtn = document.getElementById("cartBtn");
const closeButtons = document.querySelectorAll(".popup-close");
const signUpPopup = document.getElementById("signUpPopup");
const signInPopup = document.getElementById("signInPopup");
const cartPopup = document.getElementById("cartPopup");
const backToShopping = document.querySelector(".back-to-shopping");
const cartItemsContainer = document.querySelector(".cart-items");
const checkoutBtn = document.querySelector(".checkout-btn");

// Load/Save Cart Functions
function saveCartToLocalStorage() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

function loadCartFromLocalStorage() {
    try {
        const savedCart = localStorage.getItem("cart");
        return savedCart ? JSON.parse(savedCart) : [];
    } catch {
        return [];
    }
}

// Cart Logic
const cart = loadCartFromLocalStorage();
updateCartDisplay();

// Product Items
const items = [
    { id: "item1", name: "Laptop", price: 999.99, shipping: 15.00, image: "laptop.jpg" },
    { id: "item2", name: "Phone", price: 499.99, shipping: 10.00, image: "phone.jpg" },
    { id: "item3", name: "Headphones", price: 199.99, shipping: 5.00, image: "headphones.jpg" },
    { id: "item4", name: "Camera", price: 599.99, shipping: 12.00, image: "camera.jpg" },
];

// Render Product Page
if (window.location.pathname.includes("product.html")) {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id");
    const selectedItem = items.find(item => item.id === productId);

    const productPage = document.getElementById("productPage");
    if (selectedItem && productPage) {
        productPage.innerHTML = `
            <div class="product-images">
                <img src="${selectedItem.image}" alt="${selectedItem.name}" class="main-image">
                <div class="thumbnail-images">
                    <!-- Optional Thumbnails -->
                </div>
            </div>
            <div class="product-details">
                <h2>${selectedItem.name}</h2>
                <p><strong>Price:</strong> $${selectedItem.price.toFixed(2)}</p>
                <p><strong>Shipping:</strong> $${selectedItem.shipping.toFixed(2)}</p>
                <p><strong>Seller:</strong> Placeholder Seller</p>
                <button id="buyNowBtn">Buy Now</button>
                <button id="addToCartBtn">Add to Cart</button>
            </div>
        `;

        document.getElementById("addToCartBtn").addEventListener("click", () => {
            addItemToCart(selectedItem);
        });

        document.getElementById("buyNowBtn").addEventListener("click", () => {
            redirectToCheckout([selectedItem]);
        });
    } else if (productPage) {
        productPage.innerHTML = "<p>Product not found</p>";
    }
} else {
    renderItems();
}

// Render All Items
function renderItems() {
    const itemContainer = document.getElementById("itemContainer");
    if (!itemContainer) return;

    items.forEach(item => {
        const itemCard = document.createElement("div");
        itemCard.classList.add("item-card");

        itemCard.innerHTML = `
            <a href="product.html?id=${item.id}" class="item-link">
                <img src="${item.image}" alt="${item.name}">
                <h3>${item.name}</h3>
                <p>Price: $${item.price.toFixed(2)}</p>
                <p>Shipping: $${item.shipping.toFixed(2)}</p>
            </a>
            <button class="add-to-cart" data-id="${item.id}">Add to Cart</button>
        `;
        itemContainer.appendChild(itemCard);
    });

    itemContainer.addEventListener("click", (e) => {
        if (e.target.classList.contains("add-to-cart")) {
            const itemId = e.target.getAttribute("data-id");
            const selectedItem = items.find(item => item.id === itemId);
            if (selectedItem) addItemToCart(selectedItem);
        }
    });
}

// Add to Cart
function addItemToCart(item) {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...item, quantity: 1 });
    }
    saveCartToLocalStorage();
    updateCartDisplay();
}

// Remove from Cart
function removeItemFromCart(itemIndex) {
    const item = cart[itemIndex];
    if (item.quantity > 1) {
        item.quantity -= 1;
    } else {
        cart.splice(itemIndex, 1);
    }
    saveCartToLocalStorage();
    updateCartDisplay();
}

// Update Cart Display
function updateCartDisplay() {
    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = "";
    let totalPrice = 0;
    let totalShipping = 0;

    cart.forEach((item, index) => {
        const cartItem = document.createElement("div");
        cartItem.classList.add("cart-item");
        cartItem.innerHTML = `
            <div class="cart-item-image" style="background-image: url(${item.image});"></div>
            <div class="cart-item-info">
                <p><strong>Item Name:</strong> ${item.name}</p>
                <p><strong>Price:</strong> $${item.price.toFixed(2)}</p>
                <p><strong>Shipping:</strong> $${item.shipping.toFixed(2)}</p>
                <p><strong>Quantity:</strong> ${item.quantity}</p>
                <button class="remove-item" data-index="${index}">Remove</button>
            </div>
        `;
        cartItemsContainer.appendChild(cartItem);

        totalPrice += item.price * item.quantity;
        totalShipping += item.shipping * item.quantity;
    });

    const subtotalElement = document.querySelector("#cartPopup .cart-content .subtotal");
    if (subtotalElement) {
        subtotalElement.textContent = `Subtotal: $${(totalPrice + totalShipping).toFixed(2)}`;
    }

    const removeButtons = cartItemsContainer.querySelectorAll(".remove-item");
    removeButtons.forEach(button => {
        button.addEventListener("click", () => {
            const itemIndex = parseInt(button.getAttribute("data-index"), 10);
            removeItemFromCart(itemIndex);
        });
    });
}

// Popup Controls
[signUpBtn, signInBtn, cartBtn].forEach((btn, idx) => {
    if (btn) {
        const popups = [signUpPopup, signInPopup, cartPopup];
        btn.addEventListener("click", () => {
            popups[idx].style.display = "flex";
        });
    }
});

closeButtons.forEach(button => {
    button.addEventListener("click", () => {
        [signUpPopup, signInPopup, cartPopup].forEach(popup => popup.style.display = "none");
    });
});

[signUpPopup, signInPopup, cartPopup].forEach(popup => {
    popup.addEventListener("click", (e) => {
        if (e.target === popup) popup.style.display = "none";
    });
});

if (backToShopping) {
    backToShopping.addEventListener("click", () => cartPopup.style.display = "none");
}

if(checkoutBtn){
    checkoutBtn.addEventListener("click", () => {
        if (cart.length === 0) {
            alert("You cannot checkout with an empty cart!");
        } else {
            alert("Proceeding to payment...");
            window.location.href = "checkout.html";
        }
    });
}