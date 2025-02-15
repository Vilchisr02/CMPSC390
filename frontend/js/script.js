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
const closePopupBtn = document.querySelector(".close-popup-btn");
const searchBar = document.getElementById("searchBar");
const clearSearchBtn = document.getElementById("clearSearchBtn");

// Function to filter items based on search term
function filterItemsBySearch(searchTerm) {
    const itemContainer = document.getElementById("itemContainer");
    if (!itemContainer) return;

    // Clear the current items
    itemContainer.innerHTML = "";

    // Filter items by name or category
    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Render the filtered items
    filteredItems.forEach(item => {
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

// Add event listener to the search bar
if (searchBar) {
    searchBar.addEventListener("input", function () {
        const searchTerm = this.value.trim();
        filterItemsBySearch(searchTerm);
    });
}

if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", function () {
        searchBar.value = "";
        filterItemsBySearch("");
    });
}

// Burger Menu Toggle
const burgerMenu = document.getElementById('burgerMenu');
const mainNav = document.querySelector('.main-nav');

burgerMenu.addEventListener('click', () => {
    mainNav.classList.toggle('active');
});

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
    { id: "item1", name: "Laptop", price: 999.99, shipping: 15.00, image: "./assets/laptop.jpg", category: "Electronics" },
    { id: "item2", name: "Phone", price: 499.99, shipping: 10.00, image: "./assets/phone.jpg", category: "Electronics" },
    { id: "item3", name: "Headphones", price: 199.99, shipping: 5.00, image: "./assets/headphones.jpg", category: "Accessories" },
    { id: "item4", name: "Camera", price: 599.99, shipping: 12.00, image: "./assets/camera.jpg", category: "Electronics" },
    { id: "item5", name: "PlayStation 5", price: 499.99, shipping: 20.00, image: "./assets/gameconsole.jpg", category: "Gaming" },
    { id: "item6", name: "4K TV", price: 999.99, shipping: 20.00, image: "./assets/4ktv.jpg", category: "Home" },
];

function filterItemsByCategory(category) {
    const itemContainer = document.getElementById("itemContainer");
    if (!itemContainer) return;

    itemContainer.innerHTML = "";

    const filteredItems = category === "all" ? items : items.filter(item => item.category === category);

    filteredItems.forEach(item => {
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

document.querySelectorAll(".category-btn").forEach(button => {
    button.addEventListener("click", function () {
        document.querySelectorAll(".category-btn").forEach(btn => btn.classList.remove("active"));
        this.classList.add("active");
        const category = this.getAttribute("data-category");
        filterItemsByCategory(category);
    });
});

// Initial render of all items
filterItemsByCategory("all");

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
                <p><strong>Category:</strong> ${item.category}</p> <!-- Add category here -->
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

// Render Product Page
if (window.location.pathname.includes("product.html")) {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id");
    const selectedItem = items.find(item => item.id === productId);

    const productPage = document.getElementById("productPage");
    if (selectedItem && productPage) {
        productPage.innerHTML = `
            <div class="product-image">
                <img src="${selectedItem.image}" alt="${selectedItem.name}">
            </div>
            <div class="product-details">
                <h2>${selectedItem.name}</h2>
                <p><strong>Price:</strong> $${selectedItem.price.toFixed(2)}</p>
                <p><strong>Shipping:</strong> $${selectedItem.shipping.toFixed(2)}</p>
                <p><strong>Category:</strong> ${selectedItem.category}</p>
                <p><strong>Seller:</strong> Placeholder Seller</p>
                <button id="buyNowBtn">Buy Now</button>
                <button id="addToCartBtn">Add to Cart</button>
            </div>
        `;

        document.getElementById("addToCartBtn").addEventListener("click", () => {
            addItemToCart(selectedItem);
        });

        document.getElementById("buyNowBtn").addEventListener("click", () => {
            addItemToCart(selectedItem);
            redirectToCheckout([selectedItem]);
        });

        function redirectToCheckout(items) {
            localStorage.setItem("checkoutItems", JSON.stringify(items));
            window.location.href = "checkout.html";
        }

    } else if (productPage) {
        productPage.innerHTML = "<p>Product not found</p>";
    }
}

// Checkout Feature
if (window.location.pathname.includes("checkout.html")) {
    const checkoutCartContainer = document.querySelector(".checkout-cart-items");
    const orderSummaryContainer = document.querySelector(".order-summary");
    const orderConfirmationPopup = document.getElementById("orderConfirmationPopup");
    const orderConfirmationMessage = document.getElementById("orderConfirmationMessage");
    const confirmOrderBtn = document.querySelector(".confirm-order-btn");

    if (checkoutCartContainer && orderSummaryContainer) {
        let totalPrice = 0;
        let totalShipping = 0;
        const taxRate = 0.07;

        cart.forEach(item => {
            const cartItem = document.createElement("div");
            cartItem.classList.add("checkout-cart-item");
            cartItem.innerHTML = `
                <div class="checkout-cart-item-info">
                    <p><strong>Name:</strong> ${item.name}</p>
                    <p><strong>Category:</strong> ${item.category}</p>
                    <p><strong>Price:</strong> $${item.price.toFixed(2)}</p>
                    <p><strong>Shipping:</strong> $${item.shipping.toFixed(2)}</p>
                    <p><strong>Quantity:</strong> ${item.quantity}</p>
                </div>
            `;
            checkoutCartContainer.appendChild(cartItem);

            totalPrice += item.price * item.quantity;
            totalShipping += item.shipping * item.quantity;
        });

        const subtotal = totalPrice + totalShipping;
        const tax = subtotal * taxRate;
        const total = subtotal + tax;

        orderSummaryContainer.innerHTML = `
            <p><strong>Subtotal:</strong> $${subtotal.toFixed(2)}</p>
            <p><strong>Tax (7%):</strong> $${tax.toFixed(2)}</p>
            <p><strong>Total:</strong> $${total.toFixed(2)}</p>
        `;
    }

    function getExpectedArrivalDate() {
        const today = new Date();
        const arrivalDate = new Date(today);
        arrivalDate.setDate(today.getDate() + 7);
        return arrivalDate.toLocaleDateString();
    }

    if (confirmOrderBtn) {
        confirmOrderBtn.addEventListener("click", () => {
            if (cart.length === 0) {
                alert("Your cart is empty. Add items before confirming your order.");
            } else {
                // Create an order object
                const order = {
                    id: generateOrderId(), // Generate a unique order ID
                    date: new Date().toLocaleDateString(), // Current date
                    items: [...cart], // Copy cart items
                    total: calculateOrderTotal(cart), // Calculate total
                    status: "Processing", // Default status
                };

                // Save the order to localStorage
                saveOrder(order);

                cart.length = 0;
                saveCartToLocalStorage();

                // Show confirmation message
                const arrivalDate = getExpectedArrivalDate();
                orderConfirmationMessage.textContent = `Order Confirmed! Order ID: ${order.id}. Expected Arrival: ${arrivalDate}`;
                orderConfirmationPopup.classList.add("show");

                // Redirect to account page after a delay
                setTimeout(() => {
                    orderConfirmationPopup.classList.remove("show");
                    window.location.href = "account.html"; // Redirect to account page
                }, 3000);
            }
        });
    }

    // Function to generate a unique order ID
    function generateOrderId() {
        return `ORD${Math.floor(Math.random() * 1000000)}`;
    }

    // Function to calculate the total order amount
    function calculateOrderTotal(cart) {
        return cart.reduce((total, item) => total + item.price * item.quantity, 0);
    }

    // Function to save the order to localStorage
    function saveOrder(order) {
        const orders = JSON.parse(localStorage.getItem("orders")) || [];
        orders.push(order);
        localStorage.setItem("orders", JSON.stringify(orders));
    }

    const closeOrderPopupBtn = document.querySelector(".close-popup-btn");
    if (closeOrderPopupBtn) {
        closeOrderPopupBtn.addEventListener("click", () => {
            if (orderConfirmationPopup) {
                orderConfirmationPopup.classList.remove("show");
            }

            checkoutCartContainer.innerHTML = '';

            orderSummaryContainer.innerHTML = `
                <p><strong>Subtotal:</strong> $0.00</p>
                <p><strong>Tax (7%):</strong> $0.00</p>
                <p><strong>Total:</strong> $0.00</p>
            `;

            cart.length = 0;
            saveCartToLocalStorage();
        });
    }
}

// Go to SignUp
document.getElementById("goToSignUp").addEventListener("click", function(event) {
    event.preventDefault();
    document.getElementById("signUpPopup").style.display = "flex";
    document.getElementById("signInPopup").style.display = "none";
});

document.querySelector(".sign-up-close").addEventListener("click", function() {
    document.getElementById("signUpPopup").style.display = "none";
});

document.querySelector(".sign-in-close").addEventListener("click", function() {
    document.getElementById("signInPopup").style.display = "none";
});

window.addEventListener("click", function(event) {
    if (event.target === document.getElementById("signInPopup")) {
        document.getElementById("signInPopup").style.display = "none";
    }
});

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

//Show Password
document.getElementById('showPassword').addEventListener('change', function() {
    const passwordInput = document.getElementById('passwordSignUp');
    if (this.checked) {
        passwordInput.type = 'text'; // Show password
    } else {
        passwordInput.type = 'password'; // Hide password
    }
});



