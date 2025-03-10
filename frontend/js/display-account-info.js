// Check if the current page is account.html
if (window.location.pathname.includes("account.html")) {
    // Function to format phone number as (###) ###-####
    function formatPhoneNumber(phoneNumber) {
        if (!phoneNumber) return 'N/A';
        // Remove any non-numeric characters
        const cleaned = ('' + phoneNumber).replace(/\D/g, '');
        // Check if the input is of correct length
        if (cleaned.length !== 10) return 'N/A';
        // Format the phone number
        const part1 = cleaned.slice(0, 3);
        const part2 = cleaned.slice(3, 6);
        const part3 = cleaned.slice(6, 10);
        return `(${part1}) ${part2}-${part3}`;
    }

    // Function to display user account information
    function displayUserInfo() {
        // Get the user data from localStorage
        const userData = localStorage.getItem('user');

        // Check if user data exists
        if (userData) {
            const user = JSON.parse(userData);

            // Select the user info container
            const userInfoContainer = document.querySelector('.user-info');

            // Populate the user info container with user data
            userInfoContainer.innerHTML = `
                <p><strong>First Name:</strong> ${user.Fname || 'N/A'}</p>
                <p><strong>Last Name:</strong> ${user.Lname || 'N/A'}</p>
                <p><strong>Username:</strong> ${user.Username || 'N/A'}</p>
                <p><strong>Email:</strong> ${user.Email || 'N/A'}</p>
                <p><strong>Address:</strong> ${user.Address || 'N/A'}</p>
                <p><strong>Phone Number:</strong> ${formatPhoneNumber(user.PhoneNumber) || 'N/A'}</p>
            `;
        } else {
            // If no user data is found, display a message
            const userInfoContainer = document.querySelector('.user-info');
            userInfoContainer.innerHTML = "<p>No user information found. Please sign in.</p>";
        }
    }

    // Call the function to display user info when the page loads
    document.addEventListener('DOMContentLoaded', displayUserInfo);
}
