// unlock-dash.js
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('seller-dashboard.html')) {
        checkAuthAndRedirect();
    }
    setupSellerDashboardButton();
});

async function checkAuthAndRedirect() {
    const authToken = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!authToken || !user) {
        alert('You must be logged in to access the seller dashboard.');
        window.location.href = '/index.html';
        return;
    }

    try {
        const response = await fetch('/auth/signin', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Invalid token');
        }
    } catch (error) {
        console.error('Auth verification failed:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        alert('Your session has expired. Please log in again.');
        window.location.href = '/index.html';
    }
}

function setupSellerDashboardButton() {
    const user = JSON.parse(localStorage.getItem('user'));
    const dashboardBtn = document.getElementById('sellerDashboardBtn');

    if (!user || !dashboardBtn) return;

    checkSellerStatus()
        .then(hasPostedProduct => {
            dashboardBtn.style.display = hasPostedProduct ? 'inline-block' : 'none';
            
            if (hasPostedProduct) {
                dashboardBtn.addEventListener('click', handleDashboardNavigation);
            }
        })
        .catch(error => {
            console.error('Error checking seller status:', error);
            dashboardBtn.style.display = 'none';
        });
}

async function checkSellerStatus() {
    try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) return false;

        const response = await fetch('/unlock/check-seller-status', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) throw new Error('Failed to check seller status');

        const data = await response.json();
        return data.success && data.hasPostedProduct;
    } catch (error) {
        console.error('Error checking seller status:', error);
        return false;
    }
}

function handleDashboardNavigation(event) {
    event.preventDefault();
    window.location.href = '/seller-dashboard.html';
}
