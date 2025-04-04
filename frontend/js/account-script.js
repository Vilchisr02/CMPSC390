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

    [setupPaymentPopup, viewPaymentPopup, paymentDetailsPopup].forEach(popup => {
        popup.addEventListener("click", (e) => {
            if (e.target === popup) hidePopup(popup);
        });
    });
    
    document.querySelector('#setupPaymentPopup form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const cardNumber = document.getElementById('cardNumber').value;
        const expirationDate = document.getElementById('cardExpiry').value;
        const cvv = document.getElementById('cardCVV').value;
        const cardholderName = document.getElementById('cardName').value;

        const token = localStorage.getItem('authToken');

        try {
            // Fetch existing payment methods for the user
            const response = await fetch('/payment/view-payments', {
                method: 'GET',
                headers: {
                    'Authorization': token // Send the JWT token in the Authorization header
                }
            });

            const data = await response.json();
            if (response.ok) {
                // Check if the payment method already exists
                const paymentMethods = data.paymentMethods;
                const isDuplicate = paymentMethods.some(method => method.CardNumber === cardNumber);

                if (isDuplicate) {
                    alert('This payment method already exists.');
                    return; // Stop further execution
                }

                // If not a duplicate, proceed to save the payment method
                const saveResponse = await fetch('/payment/save-payment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token // Send the JWT token in the Authorization header
                    },
                    body: JSON.stringify({ cardNumber, expirationDate, cvv, cardholderName })
                });

                const saveData = await saveResponse.json();
                if (saveResponse.ok) {
                    alert('Payment method saved successfully');
                    hidePopup(setupPaymentPopup); // Close the pop-up after successful save
                } else {
                    alert(saveData.message);
                }
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Error saving payment method:', error);
        }
    });

    document.getElementById('viewPaymentBtn').addEventListener('click', async () => {
        const token = localStorage.getItem('authToken');

        try {
            const response = await fetch('/payment/view-payments', {
                method: 'GET',
                headers: {
                    'Authorization': token
                }
            });

            const data = await response.json();
            if (response.ok) {
                // Display payment methods in the popup
                const paymentMethods = data.paymentMethods;
                const paymentMethodsContainer = document.getElementById('paymentMethodsContainer');
                paymentMethodsContainer.innerHTML = paymentMethods.map(method => `
                    <div class="payment-method">
                        <h2>Payment Method</h2>
                        <p><strong>Card Name:</strong> ${method.CardholderName}</p>
                        <p><strong>Card Number:</strong> **** **** **** ${method.CardNumber.slice(-4)}</p>
                        <p><strong>Expiration Date:</strong> ${method.ExpirationDate}</p>
                        <p><strong>Card CVV:</strong> ${method.CVV}</p>
                    </div>
                `).join('');
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Error fetching payment methods:', error);
        }
    });
    
    // View Listings Feature
    const viewListingsBtn = document.getElementById('viewListingsBtn');
    const viewListingsPopup = document.getElementById('viewListingsPopup');
    const listingsContainer = document.getElementById('listingsContainer');
    const closeListingsPopup = viewListingsPopup.querySelector('.popup-close');

    viewListingsBtn.addEventListener('click', function() {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            alert('Please sign in to view your listings');
            return;
        }
        
        fetch('/listing/listings/user', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            listingsContainer.innerHTML = '';
            
            if (data.listings && data.listings.length > 0) {
                data.listings.forEach(listing => {
                    const listingElement = document.createElement('div');
                    listingElement.className = 'listing-item';
                    listingElement.innerHTML = `
                        <div class="listing-image">
                            <img src="/uploads/${listing.image}" alt="${listing.Name}">
                        </div>
                        <div class="listing-details">
                            <h3>${listing.Name}</h3>
                            <p>Price: $${listing.Price}</p>
                            <p>Category: ${listing.Category}</p>
                            <p>Shipping: $${listing.Shipping}</p>
                            <p>Status: ${'Active'}</p>     
                            <p>Date Listed: ${new Date(listing.created_at).toLocaleString()}</p>
                        </div>
                    `;
                    listingsContainer.appendChild(listingElement);
                });
            } else {
                listingsContainer.innerHTML = '<p>You have no listings yet.</p>';
            }
            
            viewListingsPopup.style.display = 'flex';
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to fetch listings');
        });
    });

    closeListingsPopup.addEventListener('click', function() {
        viewListingsPopup.style.display = 'none';
    });
    
    viewListingsPopup.addEventListener("click", (e) => {
        if (e.target === viewListingsPopup) hidePopup(viewListingsPopup);
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
}
