// Account Feature
if (window.location.pathname.includes("account.html")) {
    const setupPaymentBtn = document.getElementById("setupPaymentBtn");
    const viewPaymentBtn = document.getElementById("viewPaymentBtn");
    const listItemBtn = document.querySelector(".list-item-btn"); 
    const setupPaymentPopup = document.getElementById("setupPaymentPopup");
    const viewPaymentPopup = document.getElementById("viewPaymentPopup");
    const paymentDetailsPopup = document.getElementById("paymentDetailsPopup");

    const popupCloseButtons = document.querySelectorAll(".popup-close");

    const showPopup = (popup) => {
        popup.style.display = "flex";
    };

    const hidePopup = (popup) => {

        popup.style.display = "none";
    };

    setupPaymentBtn.addEventListener("click", () => {
        showPopup(setupPaymentPopup);

    });

    viewPaymentBtn.addEventListener("click", () => {

        showPopup(viewPaymentPopup);
    });


    popupCloseButtons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const popup = e.target.closest(".popup");

            hidePopup(popup);
        });
    });


    listItemBtn.addEventListener("click", () => {
        window.location.href = "listing.html";
    });


    const paymentMethodButtons = viewPaymentPopup.querySelectorAll(".popup-btn:not(.popup-close)");


    paymentMethodButtons.forEach((button, index) => {
        button.addEventListener("click", () => {
            document.getElementById("detailsCardName").textContent = `Card Name ${index + 1}`;

            document.getElementById("detailsCardType").textContent = `Card Type ${index + 1}`;
            document.getElementById("detailsCardNumber").textContent = `XXXX-XXXX-XXXX-${index + 1}111`;
            document.getElementById("detailsCardExpiry").textContent = "12/25";
            document.getElementById("detailsCardCVV").textContent = "123";


            showPopup(paymentDetailsPopup);
        });
    });

    [setupPaymentPopup, viewPaymentPopup, paymentDetailsPopup].forEach(popup => {
        popup.addEventListener("click", (e) => {
            if (e.target === popup) hidePopup(popup);
        });
    });

    // View Orders Feature
    const viewOrdersBtn = document.createElement("button");
    viewOrdersBtn.textContent = "View Orders";
    viewOrdersBtn.classList.add("account-btn");
    viewOrdersBtn.style.marginTop = "1rem";
    document.querySelector(".account-details").appendChild(viewOrdersBtn);

    const viewOrdersPopup = document.getElementById("viewOrdersPopup");
    const ordersListContainer = document.querySelector("#viewOrdersPopup .orders-list");

    viewOrdersBtn.addEventListener("click", () => {
        showPopup(viewOrdersPopup);
        displayOrders();
    });

    function displayOrders() {
        // Fetch orders from localStorage or an API
        const orders = JSON.parse(localStorage.getItem("orders")) || [];

        ordersListContainer.innerHTML = "";


        if (orders.length === 0) {
            ordersListContainer.innerHTML = "<p>No orders found.</p>";
            return;
        }

        orders.forEach((order, index) => {
            const orderItem = document.createElement("div");

            orderItem.classList.add("order-item");

            orderItem.innerHTML = `
                <div class="order-details">
                    <p><strong>Order ID:</strong> ${order.id}</p>
                    <p><strong>Date:</strong> ${order.date}</p>

                    <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
                </div>
                <div class="order-status">${order.status}</div>
            `;

            ordersListContainer.appendChild(orderItem);
        });
    }

    viewOrdersPopup.addEventListener("click", (e) => {
        if (e.target === viewOrdersPopup) hidePopup(viewOrdersPopup);
    });

    document.querySelector("#viewOrdersPopup .popup-close").addEventListener("click", () => {
        hidePopup(viewOrdersPopup);
    });
};
