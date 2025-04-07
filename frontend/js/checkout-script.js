document.addEventListener('DOMContentLoaded', () => {
    const confirmBtn = document.getElementById('confirmOrderBtn');

    if (!confirmBtn) return;

    confirmBtn.addEventListener('click', async () => {
        const userId = localStorage.getItem('userId');
        const cartItems = JSON.parse(localStorage.getItem('cart')) || [];

        if (!userId || cartItems.length === 0) {
            alert('You must be logged in and have items in the cart.');
            return;
        }

        const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        try {
            const response = await fetch('/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ total })

            });

            const result = await response.json();

            if (response.ok) {
                localStorage.removeItem('cart');
                document.getElementById('orderConfirmationMessage').textContent =
                    'Your order has been placed!';
                document.getElementById('orderConfirmationPopup').classList.add('active');
            } else {
                alert('Order failed: ' + result.error);
            }
        } catch (err) {
            console.error('Checkout error:', err);
            alert('There was an error placing your order.');
        }
    });
});

