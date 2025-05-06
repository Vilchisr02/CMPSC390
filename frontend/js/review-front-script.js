const reviewPopup = document.getElementById("reviewPopup");
const openReviewBtn = document.getElementById("openReviewBtn");
const closeReviewBtn = document.getElementById("closeReviewBtn");
const reviewUserIdInput = document.getElementById("reviewUserId");
const reviewForm = document.getElementById("reviewForm");
const productDropdown = document.getElementById("productDropdown");

openReviewBtn.addEventListener("click", async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.Userid) {
        alert("You must be signed in to leave a review.");
        return;
    }

    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (!token) {
        alert("Please sign in again to continue.");
        return;
    }

    reviewUserIdInput.value = user.Userid;
    reviewPopup.style.display = "flex";

    try {
        const res = await fetch(`/reviews/products`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || `HTTP error! status: ${res.status}`);
        }

        const data = await res.json();

        if (data.success && Array.isArray(data.products)) {
            productDropdown.innerHTML = `<option value="">-- Choose a product --</option>`;
            data.products.forEach(product => {
                productDropdown.innerHTML += `
                    <option 
                        value="${product.Productid}" 
                        data-sellerid="${product.SellerID}"
                    >
                        ${product.Name}
                    </option>`;
            });
        } else {
            productDropdown.innerHTML = `<option value="">No products available</option>`;
        }
    } catch (err) {
        console.error("Failed to load product options:", err);
        productDropdown.innerHTML = `<option value="">Error loading products</option>`;
        alert("Failed to load your products. Please try again.");
    }
});

if (closeReviewBtn) {
    closeReviewBtn.addEventListener("click", () => {
        reviewPopup.style.display = "none";
    });
}

reviewForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('authToken');
    if (!token) {
        alert("Please sign in again.");
        return;
    }

    const productId = productDropdown.value;
    const rating = document.getElementById("reviewRating").value;
    const comment = document.getElementById("reviewComment").value;
    const userId = JSON.parse(localStorage.getItem("user")).Userid;

    if (!productId || !rating || !comment) {
        alert("Please fill all fields");
        return;
    }

    try {
        const formData = new URLSearchParams();
        formData.append('productId', productId);
        formData.append('rating', rating);
        formData.append('comment', comment);
        formData.append('userId', userId);

        const response = await fetch("/reviews/reviews", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: formData
        });

        const textResponse = await response.text();
        let result;
        
        try {
            result = JSON.parse(textResponse);
        } catch (e) {
            throw new Error(`Invalid server response: ${textResponse}`);
        }

        if (!response.ok) {
            throw new Error(result.error || "Submission failed");
        }

        alert(result.message || "Review submitted successfully!");
        reviewPopup.style.display = "none";
        reviewForm.reset();
        
    } catch (err) {
        console.error("Submission error:", err);
        alert("Error: " + err.message);
    }
});
