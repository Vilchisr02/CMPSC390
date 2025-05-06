document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('feedback-form');
    const stars = document.querySelectorAll('.star');
    const ratingInput = document.getElementById('rating-value');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const userEmailDisplay = document.getElementById('user-email');
    const commentInput = document.getElementById('comment');
    const imageInput = document.getElementById('image');
    const feedbackItemsContainer = document.getElementById('feedback-items');
    const token = localStorage.getItem('authToken');
    
    const thankYou = document.createElement('div');
    thankYou.className = 'thank-you';
    thankYou.innerHTML = `
        <h2>Thank you for your feedback!</h2>
        <p>We appreciate your time and input.</p>
    `;
    thankYou.style.display = 'none';
    form.parentNode.insertBefore(thankYou, form.nextSibling);

    if (token) {
        emailInput.style.display = 'none';
        userEmailDisplay.style.display = 'block';
        
        fetch('/auth/user', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.user) {
                usernameInput.value = `${data.user.Fname} ${data.user.Lname}`;
                usernameInput.readOnly = true;
                userEmailDisplay.innerHTML = `
                    <span class="user-email-text">${data.user.Email}</span>
                    <span class="verified-badge">✓ Verified</span>
                `;
                emailInput.value = data.user.Email;
            }
        })
        .catch(error => console.error('Error fetching user info:', error));
    } else {
        emailInput.style.display = 'block';
        userEmailDisplay.style.display = 'none';
        emailInput.required = true;
    }

    stars.forEach(star => {
        star.addEventListener('click', function() {
            const value = parseInt(this.getAttribute('data-value'));
            ratingInput.value = value;
            
            stars.forEach((s, index) => {
                s.classList.toggle('active', index < value);
            });
        });
    });

    function loadFeedbacks() {
        fetch('/feedback')
            .then(response => response.json())
            .then(data => {
                if (data.success && data.feedbacks) {
                    displayFeedbacks(data.feedbacks);
                }
            })
            .catch(error => console.error('Error loading feedbacks:', error));
    }

    function displayFeedbacks(feedbacks) {
        feedbackItemsContainer.innerHTML = '';
        
        feedbacks.forEach(feedback => {
            const feedbackItem = document.createElement('div');
            feedbackItem.className = 'feedback-item';
            
            let starsHtml = '';
            for (let i = 1; i <= 5; i++) {
                starsHtml += i <= feedback.Rating ? '★' : '☆';
            }
            
            let imageHtml = '';
            if (feedback.Image_path) {
                imageHtml = `
                    <div class="feedback-image-container">
                        <img src="${feedback.Image_path}" alt="Feedback image" class="feedback-image">
                    </div>
                `;
            }
            
            const userTypeIndicator = feedback.userType === 'verified' ? 
                '<span class="verified-badge">✓ Verified User</span>' : 
                '<span class="guest-badge">Guest User</span>';
            
            feedbackItem.innerHTML = `
                <div class="feedback-header">
                    <span class="feedback-user">${feedback.Username}</span>
                    ${userTypeIndicator}
                    <span class="feedback-rating">${starsHtml}</span>
                </div>
                <div class="feedback-comment">${feedback.Comment}</div>
                ${imageHtml}
                <div class="feedback-date">
                    ${new Date(feedback.created_at).toLocaleString()}
                </div>
            `;
            
            feedbackItemsContainer.appendChild(feedbackItem);
        });
    }

    function validateForm() {
        if (usernameInput.value.trim() === '') {
            alert('Please enter your name');
            return false;
        }
        
        if (!token && emailInput.value.trim() === '') {
            alert('Please enter your email address');
            return false;
        }
        
        if (ratingInput.value === '0') {
            alert('Please select a rating');
            return false;
        }
        
        if (commentInput.value.trim() === '') {
            alert('Please enter your feedback');
            return false;
        }
        
        return true;
    }

    function showThankYou() {
        form.style.display = 'none';
        thankYou.style.display = 'block';
    }

    function resetForm() {
        setTimeout(() => {
            form.reset();
            stars.forEach(star => star.classList.remove('active'));
            ratingInput.value = '0';
            thankYou.style.display = 'none';
            form.style.display = 'block';
            
            if (token && userEmailDisplay.querySelector('.user-email-text')) {
                emailInput.value = userEmailDisplay.querySelector('.user-email-text').textContent;
            }
        }, 3000);
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        const formData = new FormData(form);

        fetch('/feedback', {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showThankYou();
                resetForm();
                loadFeedbacks();
            } else {
                alert(data.message || 'Submission failed');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error submitting feedback');
        });
    });
    
    loadFeedbacks();
});
