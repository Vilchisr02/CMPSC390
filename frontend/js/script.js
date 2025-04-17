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

// API Endpoints
const cartSaveEndpoint = '/cart/save';
const cartGetEndpoint = '/cart';

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

// Cart Storage Functions
async function saveCartToStorage() {
    const authToken = localStorage.getItem('authToken');
    // Ensure we're extracting just the numeric ID part
    const cartItems = cart.map(item => ({
        id: item.id.replace('item', ''),
        quantity: item.quantity
    }));
    
    if (authToken) {
        try {
            await fetch(cartSaveEndpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ items: cartItems })
            });
        } catch (error) {
            console.error('Error saving cart to server:', error);
        }
    } else {
        localStorage.setItem("cart", JSON.stringify(cart));
    }
}

async function loadCartFromStorage() {
    const authToken = localStorage.getItem('authToken');
    
    if (authToken) {
        try {
            const response = await fetch(cartGetEndpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.items || [];
            }
            return [];
        } catch (error) {
            console.error('Error loading cart from server:', error);
            return [];
        }
    } else {
        // Guest - load from localStorage
        try {
            const savedCart = localStorage.getItem("cart");
            return savedCart ? JSON.parse(savedCart) : [];
        } catch {
            return [];
        }
    }
}

// Cart Logic
let cart = [];
async function initializeCart() {
    cart = await loadCartFromStorage();
    updateCartDisplay();
}
initializeCart();

// Product Items
let items = [];

function fetchItems() {
    return fetch('/listing/listings', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.products) {
            items = data.products.map(item => ({
                id: `item${item.Productid}`,
                name: item.Name,
                price: item.Price,
                shipping: item.Shipping,                
                image: `/uploads/${item.image}`, 
                category: item.Category,
                seller: item.sellerName,
                description: item.description || "No description available"
            }));
            return items;
        } else {
            console.error('No products found in the response');
            return [];
        }
    })
    .catch(error => {
        console.error('Error fetching items:', error);
        return [];
    });
}

fetchItems().then(fetchedItems => {
    items = fetchedItems;
    initializeApp();
});

async function initializeApp() {
    await fetchItems();
    filterItemsByCategory("all");
    updateCartDisplay();

    if (window.location.pathname.includes("product.html")) {
        renderProductPage();
    }

    if (window.location.pathname.includes("checkout.html")) {
        // Load payment methods for checkout page
        const paymentMethods = await fetchPaymentMethods();
        renderPaymentMethods(paymentMethods);
        
        // Add new payment method button
        document.getElementById('addNewPaymentBtn')?.addEventListener('click', () => {
            window.location.href = 'account.html#setupPaymentPopup';
        });
        
        renderCheckoutPage();
    }
}

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

// Add to Cart
async function addItemToCart(item) {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...item, quantity: 1 });
    }
    await saveCartToStorage();
    updateCartDisplay();
}

// Remove from Cart
async function removeItemFromCart(itemIndex) {
    const item = cart[itemIndex];
    if (item.quantity > 1) {
        item.quantity -= 1;
    } else {
        cart.splice(itemIndex, 1);
    }
    await saveCartToStorage();
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
                <p><strong>Category:</strong> ${item.category}</p>
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
function renderProductPage() {
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
                <p><strong>Seller:</strong> ${selectedItem.seller}</p>
                <div class="product-description">
                    <h3>Description</h3>
                    <p>${selectedItem.description}</p>
                </div>
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
            window.location.href = `checkout.html?buyNow=${encodeURIComponent(productId)}`;
        }

    } else if (productPage) {
        productPage.innerHTML = "<p>Product not found</p>";
    }
}

async function fetchPaymentMethods() {
    const token = localStorage.getItem('authToken');
    if (!token) return [];

    try {
        const response = await fetch('/payment/view-payments', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        return response.ok ? data.paymentMethods : [];
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        return [];
    }
}

function renderPaymentMethods(paymentMethods) {
    const container = document.querySelector('.payment-methods-container');
    if (!container) return;

    if (paymentMethods.length === 0) {
        container.innerHTML = '<p class="no-payment-methods">No payment methods saved. Please add one.</p>';
        return;
    }

    container.innerHTML = paymentMethods.map(method => `
        <label class="payment-method-option">
            <input type="radio" name="paymentMethod" value="${method.PaymentID}" required>
            <div class="payment-method-details">
                <p><strong>${method.CardholderName}</strong></p>
                <p>**** **** **** ${method.CardNumber.slice(-4)}</p>
                <p>Expires: ${method.ExpirationDate}</p>
            </div>
        </label>
    `).join('');

    // Add event listeners to style selected payment method
    document.querySelectorAll('.payment-method-option input').forEach(radio => {
        radio.addEventListener('change', function() {
            document.querySelectorAll('.payment-method-option').forEach(option => {
                option.classList.toggle('selected', option.contains(this));
            });
        });
    });
}


// Checkout Feature
function renderCheckoutPage() {
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
        confirmOrderBtn.addEventListener("click", async () => {
            if (cart.length === 0) {
                alert("Your cart is empty. Add items before confirming your order.");
                return;
            }

            const selectedPaymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
            if (!selectedPaymentMethod) {
                alert("Please select a payment method before confirming your order.");
                return;
            }

            const paymentId = selectedPaymentMethod.value;

            try {
                const authToken = localStorage.getItem('authToken');
                if (!authToken) {
                    alert("Please sign in to complete your order");
                    return;
                }

                // Calculate all amounts
                const subtotal = calculateSubtotal(cart);
                const taxRate = 0.07;
                const tax = subtotal * taxRate;
                const total = subtotal + tax;

                const response = await fetch('/orders/create', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        items: cart, 
                        subtotal,
                        tax,
                        total,
                        paymentId 
                    })
                });
                const data = await response.json();
                if (response.ok) {
                    // Show confirmation message
                    const arrivalDate = getExpectedArrivalDate();
                    orderConfirmationMessage.textContent = `Order Confirmed! Order ID: ${data.orderId}. Expected Arrival: ${arrivalDate}`;
                    orderConfirmationPopup.classList.add("show");

                    // Clear cart
                    cart.length = 0;
                    await saveCartToStorage();

                    // Redirect to account page after a delay
                    setTimeout(() => {
                        orderConfirmationPopup.classList.remove("show");
                        window.location.href = "account.html";
                    }, 3000);
                } else {
                    alert(data.message || "Failed to create order");
                }
            } catch (error) {
                console.error('Error creating order:', error);
                alert("Failed to create order");
            }
        });
    }
    
    // Function to generate a unique order ID
    function generateOrderId() {
        return `ORD${Math.floor(Math.random() * 1000000)}`;
    }

    // Functions to calculate the total order amount
    function calculateOrderTotal(cart) {
        return cart.reduce((total, item) => total + item.price * item.quantity, 0);
    }
    
    function calculateSubtotal(cartItems) {
        return cartItems.reduce((sum, item) => {
            return sum + (item.price * item.quantity) + (item.shipping * item.quantity);
        }, 0);
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
            saveCartToStorage();
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

// Show Password for Sign-Up
document.getElementById('showPassword').addEventListener('change', function() {
    const passwordInput = document.getElementById('passwordSignUp');
    if (this.checked) {
        passwordInput.type = 'text'; // Show password
    } else {
        passwordInput.type = 'password'; // Hide password
    }
});

// Show Password for Sign-In
document.getElementById('showPasswordSignIn').addEventListener('change', function() {
    const passwordInput = document.getElementById('password');
    if (this.checked) {
        passwordInput.type = 'text'; // Show password
    } else {
        passwordInput.type = 'password'; // Hide password
    }
});
