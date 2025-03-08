// Listing Feature
if (window.location.pathname.includes("listing.html")) {
    const postListingBtn = document.querySelector('.post-listing-btn');
    const closePopupBtn = document.querySelector('.close-popup-btn');
    const listingPopupBtn = document.querySelector('.listing-popup');

    const itemNameInput = document.getElementById('itemName');
    const itemPriceInput = document.getElementById('itemPrice');
    const shippingCostInput = document.getElementById('shippingCost');
    const itemCategoryInput = document.getElementById('itemCategory');
    const shippingOptions = document.querySelectorAll('.shipping-option');

    let selectedShippingMethod = "";


    shippingOptions.forEach(option => {
        option.addEventListener('click', function () {
            this.classList.toggle('selected');
            if (this.classList.contains('selected')) {
                selectedShippingMethod = this.innerText;
            } else {
                selectedShippingMethod = "";
            }
            shippingOptions.forEach(opt => {
                if (opt !== this) {
                    opt.classList.remove('selected');
                }
            });
        });
    });

    postListingBtn.addEventListener('click', function () {
        const itemName = itemNameInput.value.trim();
        const itemPrice = parseFloat(itemPriceInput.value.trim());
        const itemCategory = itemCategoryInput.value;
        const shippingCost = parseFloat(shippingCostInput.value.trim());
        const token = localStorage.getItem('authToken'); // Retrieve the JWT token from localStorage

        if (!itemName || isNaN(itemPrice) || isNaN(shippingCost) || !selectedShippingMethod) {
            alert("Please fill in all fields correctly!");
            return;
        }

        fetch('/listing/listings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Include the JWT token in the header
            },
            body: JSON.stringify({ itemName, itemPrice, itemCategory, shippingCost }),
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw err; });
            }
            return response.json();
        })
        .then(data => {
            listingPopup.style.display = 'flex';
            itemNameInput.value = '';
            itemPriceInput.value = '';
            shippingCostInput.value = '';
            shippingOptions.forEach(opt => opt.classList.remove('selected'));
            selectedShippingMethod = "";
        })
        .catch((error) => {
            console.error('Error:', error);
            alert(error.message || 'Failed to submit listing');
        });
    });
    
    closePopupBtn.addEventListener('click', function() {
        listingPopupBtn.style.display = 'none';
    });
}
