document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const form = document.getElementById('feedback-form');
    const stars = document.querySelectorAll('.star');
    const ratingInput = document.getElementById('rating-value');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const commentInput = document.getElementById('comment');
    const feedbackBox = document.querySelector('.feedback-box');

    // 动态创建感谢信息元素
    const thankYou = document.createElement('div');
    thankYou.className = 'thank-you';
    thankYou.innerHTML = `
        <h2>Thank you for your feedback!</h2>
        <p>We appreciate your time and input.</p>
    `;
    thankYou.style.display = 'none';
    feedbackBox.appendChild(thankYou);

    // 修复星星点击功能
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const value = parseInt(this.getAttribute('data-value'));
            ratingInput.value = value;
            
            // 更新星星显示
            stars.forEach((s, index) => {
                if (index < value) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });
    });

    // 表单提交处理
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 验证表单
        if (!validateForm()) {
            return;
        }
        
        // 收集表单数据
        const formData = {
            username: usernameInput.value.trim(),
            email: emailInput.value.trim(),
            rating: ratingInput.value,
            comment: commentInput.value.trim()
        };
        
        console.log('Form data:', formData);
        showThankYou();
        resetForm();
    });

    // 表单验证函数
    function validateForm() {
        let isValid = true;
        
        // 验证用户名
        if (usernameInput.value.trim() === '') {
            alert('Please enter your name');
            isValid = false;
        }
        
        // 验证邮箱
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value.trim())) {
            alert('Please enter a valid email address');
            isValid = false;
        }
        
        // 验证评分
        if (ratingInput.value === '0') {
            alert('Please select a rating');
            isValid = false;
        }
        
        // 验证评论
        if (commentInput.value.trim() === '') {
            alert('Please enter your feedback');
            isValid = false;
        }
        
        return isValid;
    }

    // 显示感谢信息
    function showThankYou() {
        form.style.display = 'none';
        thankYou.style.display = 'block';
    }

    // 重置表单
    function resetForm() {
        setTimeout(() => {
            form.reset();
            stars.forEach(star => star.classList.remove('active'));
            ratingInput.value = '0';
            thankYou.style.display = 'none';
            form.style.display = 'block';
        }, 3000);
    }
});