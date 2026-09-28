// Register Page JavaScript for 灵境织算

document.addEventListener('DOMContentLoaded', function() {
    initRegisterPage();
});

function initRegisterPage() {
    const form = document.getElementById('registerForm');
    const username = document.getElementById('regUsername');
    const email = document.getElementById('regEmail');
    const password = document.getElementById('regPassword');
    const confirmPassword = document.getElementById('regConfirmPassword');
    const agree = document.getElementById('agree');
    const toLoginLink = document.getElementById('toLoginLink');

    if (!form) return;

    // Prefill from query params (e.g., ?username=xxx)
    const params = new URLSearchParams(window.location.search);
    const presetUsername = params.get('username');
    if (presetUsername) {
        username.value = presetUsername;
    }

    // 前往登录链接：携带当前用户名用于预填
    if (toLoginLink) {
        toLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            const u = username.value.trim();
            const target = 'login.html' + (u ? ('?username=' + encodeURIComponent(u)) : '');
            window.location.href = target;
        });
    }

    // Field validations
    username.addEventListener('input', function() {
        if (this.value.trim().length < 3) {
            showFieldError(this, '用户名至少需要3个字符');
        } else {
            clearFieldError(this);
        }
    });

    email.addEventListener('input', function() {
        if (!isValidEmail(this.value.trim())) {
            showFieldError(this, '请输入有效的邮箱地址');
        } else {
            clearFieldError(this);
        }
    });

    password.addEventListener('input', function() {
        if (!isStrongPassword(this.value)) {
            showFieldError(this, '密码至少6位，且包含字母和数字');
        } else {
            clearFieldError(this);
        }
    });

    confirmPassword.addEventListener('input', function() {
        if (this.value !== password.value) {
            showFieldError(this, '两次输入的密码不一致');
        } else {
            clearFieldError(this);
        }
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const errors = [];
        const u = username.value.trim();
        const em = email.value.trim();
        const pw = password.value;
        const cpw = confirmPassword.value;

        if (u.length < 3) errors.push('用户名至少需要3个字符');
        if (!isValidEmail(em)) errors.push('请输入有效的邮箱地址');
        if (!isStrongPassword(pw)) errors.push('密码至少6位，且包含字母和数字');
        if (pw !== cpw) errors.push('两次输入的密码不一致');
        if (!agree.checked) errors.push('请阅读并同意服务条款与隐私政策');

        if (errors.length) {
            showErrorMessages(errors);
            return;
        }

        showLoadingState('.btn-login', '注册中...');

        setTimeout(() => {
            // Save to localStorage: simple demo store
            const users = loadUsers();
            if (users.find(user => user.username === u || user.email === em)) {
                hideLoadingState('.btn-login');
                showErrorMessages(['该用户名或邮箱已被注册']);
                return;
            }

            users.push({ username: u, email: em, createdAt: Date.now() });
            saveUsers(users);

            // Success: go to login and prefill username
            showSuccessMessage('演示资料已保存（不保存密码），正在进入演示登录...');
            setTimeout(() => {
                window.location.href = 'login.html?username=' + encodeURIComponent(u);
            }, 1200);
        }, 600);
    });
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isStrongPassword(pw) {
    if (pw.length < 6) return false;
    const hasLetter = /[A-Za-z]/.test(pw);
    const hasDigit = /\d/.test(pw);
    return hasLetter && hasDigit;
}

function loadUsers() {
    try {
        const raw = localStorage.getItem('registeredUsers');
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem('registeredUsers', JSON.stringify(users));
}

function showFieldError(field, message) {
    clearFieldError(field);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        color: #ef4444;
        font-size: 0.8rem;
        margin-top: 0.3rem;
        animation: fadeIn 0.3s ease;
    `;
    field.parentNode.appendChild(errorDiv);
    field.style.borderColor = '#ef4444';
}

function clearFieldError(field) {
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) existingError.remove();
    field.style.borderColor = '#e5e7eb';
}

function showErrorMessages(messages) {
    const existingErrors = document.querySelectorAll('.error-message');
    existingErrors.forEach(error => error.remove());

    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';
    errorContainer.style.cssText = `
        background: #fef2f2;
        border: 1px solid #fecaca;
        color: #dc2626;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1rem;
        animation: fadeIn 0.3s ease;
    `;

    const errorList = document.createElement('ul');
    errorList.style.cssText = `
        margin: 0;
        padding-left: 1.5rem;
    `;

    messages.forEach(message => {
        const errorItem = document.createElement('li');
        errorItem.textContent = message;
        errorList.appendChild(errorItem);
    });

    errorContainer.appendChild(errorList);
    const form = document.getElementById('registerForm');
    form.insertBefore(errorContainer, form.firstChild);
}

function showSuccessMessage(message) {
    const existingMessages = document.querySelectorAll('.error-message, .success-message');
    existingMessages.forEach(msg => msg.remove());

    const successContainer = document.createElement('div');
    successContainer.className = 'success-message';
    successContainer.style.cssText = `
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        color: #16a34a;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1rem;
        animation: fadeIn 0.3s ease;
    `;
    successContainer.textContent = message;

    const form = document.getElementById('registerForm');
    form.insertBefore(successContainer, form.firstChild);
}

function showLoadingState(selector, text) {
    const btn = document.querySelector(selector);
    if (!btn) return;
    const originalText = btn.innerHTML;
    btn.innerHTML = `
        <i class="fas fa-spinner fa-spin"></i>
        ${text}
    `;
    btn.disabled = true;
    btn.dataset.originalText = originalText;
}

function hideLoadingState(selector) {
    const btn = document.querySelector(selector);
    if (!btn) return;
    const originalText = btn.dataset.originalText;
    btn.innerHTML = originalText;
    btn.disabled = false;
}

function toggleRegisterPassword() {
    const input = document.getElementById('regPassword');
    const icon = document.getElementById('regPasswordIcon');
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

function toggleRegisterConfirmPassword() {
    const input = document.getElementById('regConfirmPassword');
    const icon = document.getElementById('regConfirmPasswordIcon');
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// CSS Animations for errors
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);


