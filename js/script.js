document.addEventListener("DOMContentLoaded", () => {
    const signUpBtn = document.getElementById("signUpBtn");
    const signInBtn = document.getElementById("signInBtn");
    const cartBtn = document.getElementById("cartBtn");
    const closeButtons = document.querySelectorAll(".popup-close");
    const signUpPopup = document.getElementById("signUpPopup");
    const signInPopup = document.getElementById("signInPopup");
    const cartPopup = document.getElementById("cartPopup");
    const backToShopping = document.querySelector(".back-to-shopping");

    // Show pop-ups when buttons are clicked
    signUpBtn.addEventListener("click", () => signUpPopup.style.display = "flex");
    signInBtn.addEventListener("click", () => signInPopup.style.display = "flex");
    cartBtn.addEventListener("click", () => cartPopup.style.display = "flex");

    // Close pop-ups when close buttons are clicked
    closeButtons.forEach(button => {
        button.addEventListener("click", () => {
            signUpPopup.style.display = "none";
            signInPopup.style.display = "none";
            cartPopup.style.display = "none";
        });
    });

    // Close the cart popup when "Back to Shopping" button is clicked
    backToShopping.addEventListener("click", () => cartPopup.style.display = "none");

    // Handle "Create Account" button click to close the sign-up pop-up
    const createAccountBtn = document.querySelector('#signUpPopup button[type="submit"]');
    createAccountBtn.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent form submission
        signUpPopup.style.display = "none"; // Close sign-up pop-up
    });

    // Handle "Sign In" button click to close the sign-in pop-up
    const signInSubmitBtn = document.querySelector('#signInPopup button[type="submit"]');
    signInSubmitBtn.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent form submission
        signInPopup.style.display = "none"; // Close sign-in pop-up
    });

    // Handle "Add to Cart" button functionality
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
                    <button class="remove-item">Remove</button>
                </div>
            `;
            document.querySelector(".cart-items").appendChild(cartItem);

            // Add functionality to remove items from cart
            const removeButtons = document.querySelectorAll(".remove-item");
            removeButtons.forEach(btn => {
                btn.addEventListener("click", () => {
                    btn.closest(".cart-item").remove();
                });
            });
        });
    });
});