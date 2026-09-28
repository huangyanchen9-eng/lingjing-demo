// Contact Page JavaScript for 灵境织算

document.addEventListener('DOMContentLoaded', function() {
    // Form elements
    const contactForm = document.getElementById('contactForm');
    const formFields = {
        name: document.getElementById('name'),
        email: document.getElementById('email'),
        subject: document.getElementById('subject'),
        message: document.getElementById('message'),
        privacy: document.getElementById('privacy')
    };

    // Initialize contact page
    initializeContactPage();

    function initializeContactPage() {
        // Initialize form validation
        initializeFormValidation();
        
        // Initialize form submission
        initializeFormSubmission();
        
        // Initialize social media links
        initializeSocialLinks();
        
        // Initialize contact info interactions
        initializeContactInfo();
        
        // Initialize map functionality
        initializeMap();
    }

    // Form validation
    function initializeFormValidation() {
        // Real-time validation
        Object.keys(formFields).forEach(fieldName => {
            const field = formFields[fieldName];
            if (field) {
                field.addEventListener('blur', () => validateField(fieldName));
                field.addEventListener('input', () => clearFieldError(fieldName));
            }
        });

        // Email validation
        if (formFields.email) {
            formFields.email.addEventListener('input', function() {
                const email = this.value;
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                
                if (email && !emailRegex.test(email)) {
                    showFieldError('email', '请输入有效的邮箱地址');
                } else {
                    clearFieldError('email');
                }
            });
        }

        // Message length validation
        if (formFields.message) {
            formFields.message.addEventListener('input', function() {
                const length = this.value.length;
                const minLength = 10;
                const maxLength = 1000;
                
                if (length < minLength && length > 0) {
                    showFieldError('message', `消息内容至少需要 ${minLength} 个字符`);
                } else if (length > maxLength) {
                    showFieldError('message', `消息内容不能超过 ${maxLength} 个字符`);
                } else {
                    clearFieldError('message');
                }
                
                // Update character count
                updateCharacterCount(length, maxLength);
            });
        }
    }

    // Validate individual field
    function validateField(fieldName) {
        const field = formFields[fieldName];
        if (!field) return true;

        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        switch (fieldName) {
            case 'name':
                if (!value) {
                    errorMessage = '请输入您的姓名';
                    isValid = false;
                } else if (value.length < 2) {
                    errorMessage = '姓名至少需要 2 个字符';
                    isValid = false;
                }
                break;
                
            case 'email':
                if (!value) {
                    errorMessage = '请输入邮箱地址';
                    isValid = false;
                } else {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) {
                        errorMessage = '请输入有效的邮箱地址';
                        isValid = false;
                    }
                }
                break;
                
            case 'message':
                if (!value) {
                    errorMessage = '请输入消息内容';
                    isValid = false;
                } else if (value.length < 10) {
                    errorMessage = '消息内容至少需要 10 个字符';
                    isValid = false;
                } else if (value.length > 1000) {
                    errorMessage = '消息内容不能超过 1000 个字符';
                    isValid = false;
                }
                break;
                
            case 'privacy':
                if (!field.checked) {
                    errorMessage = '请同意隐私政策和服务条款';
                    isValid = false;
                }
                break;
        }

        if (!isValid) {
            showFieldError(fieldName, errorMessage);
        } else {
            clearFieldError(fieldName);
        }

        return isValid;
    }

    // Show field error
    function showFieldError(fieldName, message) {
        const field = formFields[fieldName];
        if (!field) return;

        const formGroup = field.closest('.form-group');
        if (!formGroup) return;

        // Remove existing error
        clearFieldError(fieldName);

        // Add error class
        formGroup.classList.add('error');
        field.classList.add('error');

        // Create error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        formGroup.appendChild(errorDiv);
    }

    // Clear field error
    function clearFieldError(fieldName) {
        const field = formFields[fieldName];
        if (!field) return;

        const formGroup = field.closest('.form-group');
        if (!formGroup) return;

        formGroup.classList.remove('error');
        field.classList.remove('error');

        const errorMessage = formGroup.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    // Update character count
    function updateCharacterCount(current, max) {
        let counter = document.getElementById('char-counter');
        if (!counter) {
            counter = document.createElement('div');
            counter.id = 'char-counter';
            counter.className = 'char-counter';
            formFields.message.parentNode.appendChild(counter);
        }
        
        counter.textContent = `${current}/${max}`;
        counter.style.color = current > max ? '#ef4444' : '#64748b';
    }

    // Form submission
    function initializeFormSubmission() {
        if (contactForm) {
            contactForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Validate all fields
                const isValid = Object.keys(formFields).every(fieldName => validateField(fieldName));
                
                if (!isValid) {
                    showNotification('请检查并填写所有必填字段', 'error');
                    return;
                }

                // Show loading state
                const submitButton = contactForm.querySelector('button[type="submit"]');
                const originalText = submitButton.innerHTML;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 发送中...';
                submitButton.disabled = true;

                // Simulate form submission
                setTimeout(() => {
                    // Reset form
                    contactForm.reset();
                    
                    // Reset button
                    submitButton.innerHTML = originalText;
                    submitButton.disabled = false;
                    
                    // Show success message
                    showNotification('演示提交完成，消息未实际发送。', 'success');
                    
                    // Clear all field errors
                    Object.keys(formFields).forEach(fieldName => clearFieldError(fieldName));
                    
                    // Track form submission
                    trackFormSubmission();
                }, 2000);
            });
        }
    }

    // Social media links
    function initializeSocialLinks() {
        const socialLinks = document.querySelectorAll('.social-link');
        
        socialLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                const platform = this.classList[1]; // github, linkedin, etc.
                const platformName = this.querySelector('span').textContent;
                
                // Show platform-specific message
                const messages = {
                    github: '正在跳转到 GitHub 仓库...',
                    linkedin: '正在跳转到 LinkedIn 页面...',
                    twitter: '正在跳转到 Twitter 页面...',
                    wechat: '请扫描二维码关注我们的微信公众号',
                    weibo: '正在跳转到微博页面...',
                    youtube: '正在跳转到 YouTube 频道...'
                };
                
                showNotification(messages[platform] || `正在跳转到 ${platformName}...`, 'info');
                
                // Simulate external link
                setTimeout(() => {
                    showNotification('此链接为演示占位，未连接外部服务', 'info');
                }, 1000);
            });
        });
    }

    // Contact info interactions
    function initializeContactInfo() {
        const contactItems = document.querySelectorAll('.contact-info-item');
        
        contactItems.forEach(item => {
            item.addEventListener('click', function() {
                const type = this.querySelector('.contact-icon i').className;
                let action = '';
                let value = '';
                
                if (type.includes('envelope')) {
                    action = '复制邮箱地址';
                    value = 'support@lingjingzhisuan.com';
                } else if (type.includes('phone')) {
                    action = '复制电话号码';
                    value = '+86 13846030558';
                }
                
                if (action && value) {
                    navigator.clipboard.writeText(value).then(() => {
                        showNotification(`${action}已复制到剪贴板`, 'success');
                    }).catch(() => {
                        showNotification(`无法复制${action}`, 'error');
                    });
                }
            });
        });
    }

    // Map functionality (removed for privacy)
    function initializeMap() {
        // Map functionality removed to protect address privacy
    }

    // Track form submission
    function trackFormSubmission() {
        // Analytics tracking (if available)
        if (typeof gtag !== 'undefined') {
            gtag('event', 'form_submit', {
                'event_category': 'contact',
                'event_label': 'contact_form'
            });
        }
        
        // Store in localStorage for demo purposes
        const submissions = JSON.parse(localStorage.getItem('contact_submissions') || '[]');
        submissions.push({
            timestamp: new Date().toISOString(),
            name: formFields.name.value,
            email: formFields.email.value,
            subject: formFields.subject.value
        });
        localStorage.setItem('contact_submissions', JSON.stringify(submissions));
    }

    // Add auto-save functionality
    function addAutoSave() {
        const autoSaveKey = 'contact_form_draft';
        
        // Load saved draft
        const savedDraft = localStorage.getItem(autoSaveKey);
        if (savedDraft) {
            const draft = JSON.parse(savedDraft);
            Object.keys(draft).forEach(fieldName => {
                if (formFields[fieldName]) {
                    formFields[fieldName].value = draft[fieldName];
                }
            });
        }
        
        // Auto-save on input
        Object.keys(formFields).forEach(fieldName => {
            const field = formFields[fieldName];
            if (field && fieldName !== 'privacy') {
                field.addEventListener('input', utils.debounce(() => {
                    const draft = {};
                    Object.keys(formFields).forEach(key => {
                        if (formFields[key] && key !== 'privacy') {
                            draft[key] = formFields[key].value;
                        }
                    });
                    localStorage.setItem(autoSaveKey, JSON.stringify(draft));
                }, 1000));
            }
        });
        
        // Clear draft on successful submission
        contactForm.addEventListener('submit', () => {
            localStorage.removeItem(autoSaveKey);
        });
    }

    // Add contact form analytics
    function addFormAnalytics() {
        let startTime = Date.now();
        let fieldInteractions = {};
        
        Object.keys(formFields).forEach(fieldName => {
            const field = formFields[fieldName];
            if (field) {
                field.addEventListener('focus', () => {
                    fieldInteractions[fieldName] = {
                        focusTime: Date.now(),
                        interactions: 0
                    };
                });
                
                field.addEventListener('input', () => {
                    if (fieldInteractions[fieldName]) {
                        fieldInteractions[fieldName].interactions++;
                    }
                });
                
                field.addEventListener('blur', () => {
                    if (fieldInteractions[fieldName]) {
                        fieldInteractions[fieldName].blurTime = Date.now();
                    }
                });
            }
        });
        
        // Track form completion time
        contactForm.addEventListener('submit', () => {
            const completionTime = Date.now() - startTime;
            console.log('Form completion time:', completionTime, 'ms');
            console.log('Field interactions:', fieldInteractions);
        });
    }

    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Enter to submit form
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            if (contactForm) {
                contactForm.dispatchEvent(new Event('submit'));
            }
        }
        
        // Tab navigation enhancement
        if (e.key === 'Tab') {
            const focusedElement = document.activeElement;
            if (focusedElement && focusedElement.classList.contains('form-group')) {
                // Add visual feedback for tab navigation
                focusedElement.classList.add('tab-focus');
                setTimeout(() => {
                    focusedElement.classList.remove('tab-focus');
                }, 200);
            }
        }
    });

    // Add accessibility features
    function addAccessibilityFeatures() {
        // Add ARIA labels
        Object.keys(formFields).forEach(fieldName => {
            const field = formFields[fieldName];
            if (field) {
                field.setAttribute('aria-describedby', `${fieldName}-description`);
                
                const description = document.createElement('div');
                description.id = `${fieldName}-description`;
                description.className = 'sr-only';
                
                const descriptions = {
                    name: '请输入您的姓名',
                    email: '请输入有效的邮箱地址',
                    subject: '请选择消息主题',
                    message: '请详细描述您的问题或建议（最少10个字符）',
                    privacy: '请同意隐私政策和服务条款'
                };
                
                description.textContent = descriptions[fieldName] || '';
                field.parentNode.appendChild(description);
            }
        });
        
        // Add skip link
        const skipLink = document.createElement('a');
        skipLink.href = '#contactForm';
        skipLink.className = 'skip-link';
        skipLink.textContent = '跳转到联系表单';
        document.body.insertBefore(skipLink, document.body.firstChild);
    }

    // Initialize additional features
    setTimeout(() => {
        addAutoSave();
        addFormAnalytics();
        addAccessibilityFeatures();
    }, 1000);

    // Add CSS for additional features
    const additionalStyles = `
        <style>
            .char-counter {
                font-size: 0.875rem;
                color: #64748b;
                text-align: right;
                margin-top: 0.25rem;
            }
            
            .skip-link {
                position: absolute;
                top: -40px;
                left: 6px;
                background: #667eea;
                color: white;
                padding: 8px;
                text-decoration: none;
                border-radius: 4px;
                z-index: 1001;
                transition: top 0.3s ease;
            }
            
            .skip-link:focus {
                top: 6px;
            }
            
            .sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
            }
            
            .tab-focus {
                outline: 2px solid #667eea;
                outline-offset: 2px;
            }
            
            .contact-info-item {
                cursor: pointer;
            }
            
            .map-container {
                cursor: pointer;
            }
            
            .map-container:hover {
                background: #eff6ff;
            }
            
            @media (prefers-reduced-motion: reduce) {
                * {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', additionalStyles);

    console.log('Contact page JavaScript loaded successfully!');
}); 