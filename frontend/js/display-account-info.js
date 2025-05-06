
if (window.location.pathname.includes("account.html")) {

    function formatPhoneNumber(phoneNumber) {
        if (!phoneNumber) return 'N/A';
        const cleaned = ('' + phoneNumber).replace(/\D/g, '');
        if (cleaned.length !== 10) return 'N/A';
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }

    function displayUserInfo() {
        const userData = localStorage.getItem('user');
        const userInfoContainer = document.querySelector('.user-info');

        if (userData && userInfoContainer) {
            const user = JSON.parse(userData);
            userInfoContainer.innerHTML = `
                <p><strong>First Name:</strong> ${user.Fname || 'N/A'}</p>
                <p><strong>Last Name:</strong> ${user.Lname || 'N/A'}</p>
                <p><strong>Username:</strong> ${user.Username || 'N/A'}</p>
                <p><strong>Email:</strong> ${user.Email || 'N/A'}</p>
                <p><strong>Address:</strong> ${user.Address || 'N/A'}</p>
                <p><strong>Phone Number:</strong> ${formatPhoneNumber(user.PhoneNumber) || 'N/A'}</p>
            `;
        } else {
            userInfoContainer.innerHTML = "<p>No user information found. Please sign in.</p>";
        }
    }

    function setupOrderPopup() {
        const viewOrdersBtn = document.getElementById('viewOrdersBtn');
        const ordersListContainer = document.querySelector('.orders-list');
        const user = JSON.parse(localStorage.getItem('user'));
        const userId = user?.Userid;


        if (!viewOrdersBtn || !ordersListContainer || !userId) return;

viewOrdersBtn.addEventListener('click', () => {
    fetch('/get-user-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
    })
    .then(res => res.json())
    .then(orders => {
        ordersListContainer.innerHTML = '';

        if (!orders.length) {
            ordersListContainer.innerHTML = '<p>No orders found.</p>';
        } else {
            orders.forEach(order => {
                const div = document.createElement('div');
                div.className = 'order-card';
                div.innerHTML = `
                    <p><strong>Order ID:</strong> ${order.OrderID}</p>
                    <p><strong>Total:</strong> $${order.TotalPrice}</p>
                    <p><strong>Status:</strong> ${order.Status}</p>
                    <p><strong>Date:</strong> ${new Date(order.Orderdate).toLocaleDateString()}</p>
                `;
                ordersListContainer.appendChild(div);
            });
        }


        document.getElementById('viewOrdersPopup').classList.add('active');
    })
    .catch(err => {
        console.error('Error fetching user orders:', err);
        ordersListContainer.innerHTML = '<p>Failed to load orders.</p>';
    });
});



    document.addEventListener('DOMContentLoaded', () => {
        displayUserInfo();
        setupOrderPopup();
    });
}
}
