const signUpBtn = document.getElementById("signUpBtn");
const signInBtn = document.getElementById("signInBtn");
const cartBtn = document.getElementById("cartBtn");
const closeButtons = document.querySelectorAll(".popup-close");
const signUpPopup = document.getElementById("signUpPopup");
const signInPopup = document.getElementById("signInPopup");
const cartPopup = document.getElementById("cartPopup");
const backToShopping = document.querySelector(".back-to-shopping");
const cartItemsContainer = document.querySelector(".cart-items");

const cart = [];

const items = [
    { id: "item1", name: "Laptop", price: 999.99, shipping: 15.00, image: "laptop.jpg" },
    { id: "item2", name: "Phone", price: 499.99, shipping: 10.00, image: "phone.jpg" },
    { id: "item3", name: "Headphones", price: 199.99, shipping: 5.00, image: "headphones.jpg" },
    { id: "item4", name: "Camera", price: 599.99, shipping: 12.00, image: "camera.jpg" },
];

const itemContainer = document.getElementById("itemContainer");

function renderItems() {
    items.forEach(item => {
        const itemCard = document.createElement("div");
        itemCard.classList.add("item-card");

        itemCard.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <h3>${item.name}</h3>
            <p>Price: $${item.price.toFixed(2)}</p>
            <p>Shipping: $${item.shipping.toFixed(2)}</p>
            <button class="add-to-cart" data-id="${item.id}">Add to Cart</button>
        `;

        itemContainer.appendChild(itemCard);
    });

    document.querySelectorAll(".add-to-cart").forEach(button => {
        button.addEventListener("click", () => {
            const itemId = button.getAttribute("data-id");
            const selectedItem = items.find(item => item.id === itemId);
            addItemToCart(selectedItem);
        });
    });
}

renderItems();

signUpBtn.addEventListener("click", () => signUpPopup.style.display = "flex");
signInBtn.addEventListener("click", () => signInPopup.style.display = "flex");
cartBtn.addEventListener("click", () => cartPopup.style.display = "flex");

closeButtons.forEach(button => {
    button.addEventListener("click", () => {
        signUpPopup.style.display = "none";
        signInPopup.style.display = "none";
        cartPopup.style.display = "none";
    });
});

backToShopping.addEventListener("click", () => cartPopup.style.display = "none");

const goToSignUp = document.getElementById("goToSignUp");
goToSignUp.addEventListener("click", (event) => {
    event.preventDefault();
    signInPopup.style.display = "none";
    signUpPopup.style.display = "flex";
});

const createAccountBtn = document.querySelector('#signUpPopup button[type="submit"]');
createAccountBtn.addEventListener('click', (event) => {
    event.preventDefault();
    signUpPopup.style.display = "none";
});

const signInSubmitBtn = document.querySelector('#signInPopup button[type="submit"]');
signInSubmitBtn.addEventListener('click', (event) => {
    event.preventDefault();
    signInPopup.style.display = "none";
});

function addItemToCart(item) {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...item, quantity: 1 });
    }
    updateCartDisplay();
}

function removeItemFromCart(itemIndex) {
    const item = cart[itemIndex];
    if (item.quantity > 1) {
        item.quantity -= 1;
    } else {
        cart.splice(itemIndex, 1);
    }
    updateCartDisplay();
}

function updateCartDisplay() {
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

    const removeButtons = document.querySelectorAll(".remove-item");
    removeButtons.forEach(button => {
        button.addEventListener("click", () => {
            const itemIndex = parseInt(button.getAttribute("data-index"), 10);
            removeItemFromCart(itemIndex);
        });
    });

    const subtotal = totalPrice + totalShipping;
    const subtotalElement = document.querySelector("#cartPopup .cart-content .subtotal");
    subtotalElement.innerHTML = `Subtotal: $${subtotal.toFixed(2)}`;
}