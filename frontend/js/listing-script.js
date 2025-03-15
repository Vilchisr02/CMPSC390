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
        const itemName = document.getElementById('itemName').value.trim();
        const itemPrice = parseFloat(document.getElementById('itemPrice').value.trim());
        const itemCategory = document.getElementById('itemCategory').value;
        const shippingCost = parseFloat(document.getElementById('shippingCost').value.trim());
        const productImage = document.getElementById('productImage');
        const token = localStorage.getItem('authToken');

        // Check if fields and image are provided
        if (!itemName || isNaN(itemPrice) || !itemCategory || isNaN(shippingCost) || !selectedShippingMethod) {
            alert("Please fill in all fields correctly!");
            return;
        }

        // Specifically check if file selected
        if (!productImage.files || productImage.files.length === 0) {
            alert("Please select an image for your product!");
            return;
        }

        // Create FormData for upload
        const formData = new FormData();
        formData.append('itemName', itemName);
        formData.append('itemPrice', itemPrice);
        formData.append('itemCategory', itemCategory);
        formData.append('shippingCost', shippingCost);
        formData.append('productImage', productImage.files[0]);

        fetch('/listing/listings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            listingPopup.style.display = 'flex';
            itemNameInput.value = '';
            itemPriceInput.value = '';
            shippingCostInput.value = '';
            productImage.value = '';
            shippingOptions.forEach(opt => opt.classList.remove('selected'));
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
