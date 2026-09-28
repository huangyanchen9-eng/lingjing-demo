// Login Page JavaScript for 灵境织算

document.addEventListener('DOMContentLoaded', function() {
    // 初始化登录页面
    initLoginPage();

    // 初始化 Firebase（若配置为空将忽略，走演示模式）
    if (window.SFLX_AUTH && typeof window.SFLX_AUTH.initFirebase === 'function') {
        try { window.SFLX_AUTH.initFirebase(); } catch (e) { console.warn(e); }
    }
});

function initLoginPage() {
    // 获取表单元素
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const rememberMeCheckbox = document.getElementById('rememberMe');

    // 添加表单提交事件监听器
    loginForm.addEventListener('submit', handleLogin);

    // 添加输入框焦点事件
    usernameInput.addEventListener('focus', handleInputFocus);
    usernameInput.addEventListener('blur', handleInputBlur);
    passwordInput.addEventListener('focus', handleInputFocus);
    passwordInput.addEventListener('blur', handleInputBlur);

    // 检查是否有保存的用户名
    checkSavedCredentials();

    // 添加输入验证
    usernameInput.addEventListener('input', validateUsername);
    passwordInput.addEventListener('input', validatePassword);
}

// 处理登录表单提交
function handleLogin(event) {
    event.preventDefault();

    // 放开限制：随便输入即可登录（空也允许，默认 guest）
    const username = (document.getElementById('username').value || '').trim() || 'guest';
    const rememberMe = document.getElementById('rememberMe').checked;

    // 显示加载状态
    showLoadingState();

    // 直接走成功分支（轻微延迟以展示动画）
    setTimeout(() => {
        handleLoginSuccess(username, rememberMe);
    }, 600);
}

// 验证表单（已放开，始终返回true）
function validateForm() { return true; }

// 验证用户名
function validateUsername() {
    const username = this.value.trim();
    const usernameField = this;
    
    if (username && !isValidEmail(username) && username.length < 3) {
        showFieldError(usernameField, '用户名至少需要3个字符');
    } else {
        clearFieldError(usernameField);
    }
}

// 验证密码
function validatePassword() {
    const password = this.value;
    const passwordField = this;
    
    if (password && password.length < 6) {
        showFieldError(passwordField, '密码至少需要6个字符');
    } else {
        clearFieldError(passwordField);
    }
}

// 验证邮箱格式
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// 显示字段错误
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

// 清除字段错误
function clearFieldError(field) {
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    field.style.borderColor = '#e5e7eb';
}

// 显示错误信息
function showErrorMessages(messages) {
    // 移除现有的错误信息
    const existingErrors = document.querySelectorAll('.error-message');
    existingErrors.forEach(error => error.remove());

    // 创建错误信息容器
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

    // 插入到表单前面
    const loginForm = document.getElementById('loginForm');
    loginForm.insertBefore(errorContainer, loginForm.firstChild);
}

// 显示加载状态
function showLoadingState() {
    const loginButton = document.querySelector('.btn-login');
    const originalText = loginButton.innerHTML;
    
    loginButton.innerHTML = `
        <i class="fas fa-spinner fa-spin"></i>
        登录中...
    `;
    loginButton.disabled = true;
    
    // 保存原始文本以便恢复
    loginButton.dataset.originalText = originalText;
}

// 隐藏加载状态
function hideLoadingState() {
    const loginButton = document.querySelector('.btn-login');
    const originalText = loginButton.dataset.originalText;
    
    loginButton.innerHTML = originalText;
    loginButton.disabled = false;
}

// 模拟登录请求
function simulateLogin(username, password, rememberMe) {
    setTimeout(() => handleLoginSuccess(username || 'guest', rememberMe), 600);
}

// 处理登录成功
function handleLoginSuccess(username, rememberMe) {
    hideLoadingState();
    
    // 保存用户信息
    if (rememberMe) {
        localStorage.setItem('rememberedUsername', username);
    } else {
        localStorage.removeItem('rememberedUsername');
    }
    
    // 保存登录状态
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('currentUser', username);
    
    // 显示成功消息
    showSuccessMessage('演示登录成功！正在跳转...');
    
    // 跳转到目标页（支持 ?redirect=...，默认为 index.html）
    setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect');
        const defaultTarget = 'index.html';
        // 防止开放重定向：只允许站内相对路径
        let target = defaultTarget;
        try { const url = new URL(redirect || defaultTarget, location.href); if (url.origin === location.origin && /\.html$/.test(url.pathname)) target = url.href; } catch {}
        window.location.href = target;
    }, 1500);
}

// 处理登录失败
function handleLoginError(message) {
    hideLoadingState();
    showErrorMessages([message]);
}

// 显示成功消息
function showSuccessMessage(message) {
    // 移除现有的消息
    const existingMessages = document.querySelectorAll('.error-message, .success-message');
    existingMessages.forEach(msg => msg.remove());

    // 创建成功消息容器
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

    // 插入到表单前面
    const loginForm = document.getElementById('loginForm');
    loginForm.insertBefore(successContainer, loginForm.firstChild);
}

// 切换密码显示/隐藏
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const passwordIcon = document.getElementById('passwordIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        passwordIcon.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        passwordIcon.className = 'fas fa-eye';
    }
}

// 处理输入框焦点
function handleInputFocus(event) {
    const field = event.target;
    field.style.borderColor = '#667eea';
    field.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
}

// 处理输入框失焦
function handleInputBlur(event) {
    const field = event.target;
    field.style.borderColor = '#e5e7eb';
    field.style.boxShadow = 'none';
}

// 检查保存的凭据
function checkSavedCredentials() {
    const rememberedUsername = localStorage.getItem('rememberedUsername');
    const usernameInput = document.getElementById('username');
    if (rememberedUsername) {
        usernameInput.value = rememberedUsername;
        document.getElementById('rememberMe').checked = true;
    }
    // URL 参数优先预填用户名，例如 register.html 跳转过来
    const params = new URLSearchParams(window.location.search);
    const paramUsername = params.get('username');
    if (paramUsername) {
        usernameInput.value = paramUsername;
    }
}

// 社交登录处理
document.addEventListener('DOMContentLoaded', function() {
    // Google登录
    const googleBtn = document.querySelector('.btn-google');
    if (googleBtn) {
        googleBtn.addEventListener('click', async function() {
            try {
                showLoadingState();
                const user = await window.SFLX_AUTH.loginWithGoogle();
                handleLoginSuccess(user.displayName || user.email || 'google_user', document.getElementById('rememberMe').checked);
            } catch (err) {
                handleLoginError('Google 登录失败，请稍后重试');
            }
        });
    }

    // GitHub登录
    const githubBtn = document.querySelector('.btn-github');
    if (githubBtn) {
        githubBtn.addEventListener('click', async function() {
            try {
                showLoadingState();
                const user = await window.SFLX_AUTH.loginWithGithub();
                handleLoginSuccess(user.displayName || user.email || 'github_user', document.getElementById('rememberMe').checked);
            } catch (err) {
                handleLoginError('GitHub 登录失败，请稍后重试');
            }
        });
    }

    // 忘记密码链接
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(event) {
            event.preventDefault();
            showErrorMessages(['密码重置功能正在开发中...']);
        });
    }

    // 注册链接：确保跳转到注册页
    const registerLink = document.querySelector('.register-link');
    if (registerLink) {
        registerLink.addEventListener('click', function(event) {
            const href = registerLink.getAttribute('href');
            if (!href || href === '#') {
                event.preventDefault();
                window.location.href = 'register.html';
            }
        });
    }
});

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .field-error {
        color: #ef4444;
        font-size: 0.8rem;
        margin-top: 0.3rem;
        animation: fadeIn 0.3s ease;
    }
`;
document.head.appendChild(style);
