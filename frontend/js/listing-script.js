// Listing Feature
if (window.location.pathname.includes("listing.html")) {
    const postListingBtn = document.querySelector('.post-listing-btn');

    const itemNameInput = document.getElementById('itemName');
    const itemPriceInput = document.getElementById('itemPrice');
    const shippingCostInput = document.getElementById('shippingCost');
    const itemCategoryInput = document.getElementById('itemCategory');
    const shippingOptions = document.querySelectorAll('.shipping-option');
    const listingPopup = document.getElementById('listingPopup');


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
        const shippingCost = parseFloat(shippingCostInput.value.trim());
        const itemCategory = itemCategoryInput.value;

        if (!itemName || isNaN(itemPrice) || isNaN(shippingCost) || !selectedShippingMethod) {
            alert("Please fill in all fields correctly!");
            return;
        }

        const newItem = {
            id: `item${items.length + 1}`,
            name: itemName,
            price: itemPrice,
            shipping: shippingCost,
            image: "/assets/placeholder.jpg", // Image upload functionality later

            category: itemCategory
        };

        items.push(newItem);
        listingPopup.style.display = 'flex';

        itemNameInput.value = '';
        itemPriceInput.value = '';
        shippingCostInput.value = '';
        shippingOptions.forEach(opt => opt.classList.remove('selected'));
        selectedShippingMethod = "";
    });

    closePopupBtn.addEventListener('click', function () {
        listingPopup.style.display = 'none';
    });
}
