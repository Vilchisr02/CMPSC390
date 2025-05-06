if (window.location.pathname.includes("account.html")) {
    function formatPhoneNumber(phoneNumber) {
        if (!phoneNumber) return 'N/A';
        const cleaned = ('' + phoneNumber).replace(/\D/g, '');
        if (cleaned.length !== 10) return phoneNumber;
        const part1 = cleaned.slice(0, 3);
        const part2 = cleaned.slice(3, 6);
        const part3 = cleaned.slice(6, 10);
        return `(${part1}) ${part2}-${part3}`;
    }

    function displayUserInfo() {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            const userInfoContainer = document.querySelector('.user-info');
            userInfoContainer.innerHTML = "<p>Please sign in to view your account information.</p>";
            return;
        }

        fetch('/auth/user', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.user) {
                const user = data.user;
                const userInfoContainer = document.querySelector('.user-info');

         
                userInfoContainer.innerHTML = `
                    <p><strong>First Name:</strong> ${user.Fname || 'N/A'}</p>
                    <p><strong>Last Name:</strong> ${user.Lname || 'N/A'}</p>
                    <p><strong>Username:</strong> ${user.Username || 'N/A'}</p>
                    <p><strong>Email:</strong> ${user.Email || 'N/A'}</p>
                    <p><strong>Address:</strong> ${user.Address || 'N/A'}</p>
                    <p><strong>Phone Number:</strong> ${formatPhoneNumber(user.PhoneNumber) || 'N/A'}</p>
                `;
            } else {
                const userInfoContainer = document.querySelector('.user-info');
                userInfoContainer.innerHTML = "<p>No user information found. Please sign in.</p>";
            }
        })
        .catch(error => {
            console.error('Error fetching user data:', error);
            const userInfoContainer = document.querySelector('.user-info');
            userInfoContainer.innerHTML = "<p>Error loading user information. Please try again.</p>";
        });
    }

    function refreshUserInfo() {
        displayUserInfo();
    }

    document.addEventListener('DOMContentLoaded', displayUserInfo);

    document.addEventListener('profileUpdated', refreshUserInfo);
}
