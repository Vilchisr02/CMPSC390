const signUpBtn = document.getElementById("signUpBtn");
const signInBtn = document.getElementById("signInBtn");
const cartBtn = document.getElementById("cartBtn");
const closeButtons = document.querySelectorAll(".popup-close");
const signUpPopup = document.getElementById("signUpPopup");
const signInPopup = document.getElementById("signInPopup");
const cartPopup = document.getElementById("cartPopup");
const backToShopping = document.querySelector(".back-to-shopping");

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

const goToSignUp = document.getElementById("goToSignUp");
goToSignUp.addEventListener("click", (event) => {
    event.preventDefault();
    signInPopup.style.display = "none";
    signUpPopup.style.display = "flex";
});


const addToCartBtns = document.querySelectorAll(".add-to-cart");
addToCartBtns.forEach(button => {
    button.addEventListener("click", () => {
        const cartItem = document.createElement("div");
        cartItem.classList.add("cart-item");
        cartItem.innerHTML = `
            <div class="cart-item-image"></div>
            <div class="cart-item-info">
                <p>Item Name:</p>
                <p>Price:</p>
                <p>Shipping:</p>
                <button class="remove-item cart-remove-item">Remove</button>
            </div>
        `;
        document.querySelector(".cart-items").appendChild(cartItem);

        const removeButtons = document.querySelectorAll(".remove-item");
        removeButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                btn.closest(".cart-item").remove();
            });
        });
    });
});