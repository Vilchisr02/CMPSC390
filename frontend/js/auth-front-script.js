const signOutPopup = document.getElementById("signOutPopup");
const confirmSignOutBtn = document.querySelector(".confirm-sign-out-btn");
const signOutCloseBtn = document.querySelector(".sign-out-close");

// Function to show the sign-out popup
function showSignOutPopup() {
    signOutPopup.style.display = "flex";
}

// Function to hide the sign-out popup

function hideSignOutPopup() {
    signOutPopup.style.display = "none";
}

// Function to sign out the user
function signOutUser() {
    // Clear user session data
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    alert("You have been signed out.");
    hideSignOutPopup();
    // Show the sign-up and sign-in buttons
    document.getElementById("signUpBtn").style.display = "inline";
    document.getElementById("signInBtn").style.display = "inline";
    // Hide the sign-out button
    document.getElementById("signOutBtn").style.display = "none";
}

// Event listener for the sign-out confirmation button
if (confirmSignOutBtn) {
    confirmSignOutBtn.addEventListener("click", signOutUser);
}

// Event listener for the sign-out close button
if (signOutCloseBtn) {
    signOutCloseBtn.addEventListener("click", hideSignOutPopup);
}

// Event listener to hide the sign-out popup when clicking outside of it
signOutPopup.addEventListener("click", (e) => {
    if (e.target === signOutPopup) {
        hideSignOutPopup();
    }
});

// Update the sign-in and sign-up success handlers to hide the popups and show the sign-out button
document.querySelector('.sign-up-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get the password and confirm password values
    const password = document.getElementById('passwordSignUp').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Check if passwords match
    if (password !== confirmPassword) {
        alert('Passwords do not match. Please try again.');
        return;
    }

    const userData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        phoneNumber: document.getElementById('phoneNumber').value,
        address: document.getElementById('address').value,
        username: document.getElementById('usernameSignUp').value,
        email: document.getElementById('email').value,
        password: password,
    };

    try {
        const response = await fetch('/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        const data = await response.json();
        if (response.ok) {
            alert('Sign-up successful!');
            document.getElementById("signUpPopup").style.display = "none";

            // Store the token and user data in localStorage
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Hide the sign-up and sign-in buttons
            document.getElementById("signUpBtn").style.display = "none";
            document.getElementById("signInBtn").style.display = "none";
            // Show the sign-out button
            document.getElementById("signOutBtn").style.display = "inline";
        } else {
            alert(data.message || 'Sign-up failed');
        }
    } catch (error) {
        console.error('Error during signup:', error);
        alert('An error occurred during signup');
    }
});

document.querySelector('.sign-in-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const userData = {
        username: document.getElementById('username').value,
        password: document.getElementById('password').value,
    };

    try {
        const response = await fetch('/auth/signin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        const data = await response.json();
        if (response.ok) {
            alert('Sign-in successful!');
            document.getElementById("signInPopup").style.display = "none";

            // Store the token in localStorage
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Hide the sign-up and sign-in buttons
            document.getElementById("signUpBtn").style.display = "none";
            document.getElementById("signInBtn").style.display = "none";
            // Show the sign-out button
            document.getElementById("signOutBtn").style.display = "inline";
        } else {
            alert(data.message || 'Sign-in failed');
        }
    } catch (error) {
        console.error('Error during signin:', error);
        alert('An error occurred during signin');
    }
});

// Add a sign-out button to the navigation (if not already present)
const signOutBtn = document.createElement("a");
signOutBtn.id = "signOutBtn";
signOutBtn.classList.add("main-nav-link");
signOutBtn.textContent = "SIGN OUT";
signOutBtn.style.display = "none"; // Initially hidden
signOutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    showSignOutPopup();
});

const mainNavList = document.querySelector(".main-nav-list");
mainNavList.appendChild(signOutBtn);

// Check if the user is already logged in
const authToken = localStorage.getItem('authToken');
const user = JSON.parse(localStorage.getItem('user'));

if (authToken && user) {
    // User is logged in, update the UI
    document.getElementById("signUpBtn").style.display = "none";
    document.getElementById("signInBtn").style.display = "none";
    document.getElementById("signOutBtn").style.display = "inline";
} else {
    // User is not logged in, show sign-in and sign-up buttons
    document.getElementById("signUpBtn").style.display = "inline";
    document.getElementById("signInBtn").style.display = "inline";
    document.getElementById("signOutBtn").style.display = "none";
}

if (window.location.pathname.includes("account.html")) {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        alert("You must be logged in to access this page.");
        window.location.href = "/"; // Redirect to home or login page
    }
}

if (window.location.pathname.includes("checkout.html")) {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        alert("You must be logged in to access this page.");
        window.location.href = "/"; // Redirect to home or login page
    }
}

if (window.location.pathname.includes("listing.html")) {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        alert("You must be logged in to access this page.");
        window.location.href = "/"; // Redirect to home or login page
    }
}
