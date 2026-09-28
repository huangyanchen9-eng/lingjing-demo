// Guide Page JavaScript for 灵境织算

document.addEventListener('DOMContentLoaded', function() {
    // FAQ functionality
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    // Initialize FAQ
    initializeFAQ();
    
    // Initialize step animations
    initializeStepAnimations();
    
    // Initialize document links
    initializeDocumentLinks();

    // FAQ functionality
    function initializeFAQ() {
        faqQuestions.forEach(question => {
            question.addEventListener('click', function() {
                const answer = this.nextElementSibling;
                const icon = this.querySelector('i');
                
                // Toggle active class
                this.classList.toggle('active');
                
                // Toggle answer visibility
                if (answer.classList.contains('active')) {
                    answer.classList.remove('active');
                    icon.style.transform = 'rotate(0deg)';
                } else {
                    // Close other open FAQs
                    faqQuestions.forEach(q => {
                        if (q !== this) {
                            q.classList.remove('active');
                            const otherAnswer = q.nextElementSibling;
                            const otherIcon = q.querySelector('i');
                            otherAnswer.classList.remove('active');
                            otherIcon.style.transform = 'rotate(0deg)';
                        }
                    });
                    
                    // Open current FAQ
                    answer.classList.add('active');
                    icon.style.transform = 'rotate(180deg)';
                }
            });
        });
    }

    // Step animations
    function initializeStepAnimations() {
        const steps = document.querySelectorAll('.step');
        
        const stepObserver = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    
                    // Add staggered animation for step content
                    const stepContent = entry.target.querySelector('.step-content');
                    if (stepContent) {
                        setTimeout(() => {
                            stepContent.classList.add('animate-content');
                        }, 300);
                    }
                }
            });
        }, {
            threshold: 0.3,
            rootMargin: '0px 0px -50px 0px'
        });
        
        steps.forEach(step => {
            stepObserver.observe(step);
        });
    }

    // Document links functionality
    function initializeDocumentLinks() {
        const docLinks = document.querySelectorAll('.doc-card a');
        
        docLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                const card = this.closest('.doc-card');
                const title = card.querySelector('h3').textContent;
                
                // Show loading state
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 加载中...';
                this.style.pointerEvents = 'none';
                
                // Simulate loading
                setTimeout(() => {
                    showNotification(`${title} 文档正在开发中，敬请期待！`, 'info');
                    this.innerHTML = '阅读文档';
                    this.style.pointerEvents = 'auto';
                }, 1500);
            });
        });
    }

    // Add search functionality for FAQ
    function addFAQSearch() {
        const searchContainer = document.createElement('div');
        searchContainer.className = 'faq-search';
        searchContainer.innerHTML = `
            <input type="text" placeholder="搜索常见问题..." class="faq-search-input">
            <i class="fas fa-search"></i>
        `;
        
        const faqSection = document.querySelector('.faq-section');
        if (faqSection) {
            faqSection.insertBefore(searchContainer, faqSection.querySelector('.faq-container'));
        }
        
        const searchInput = searchContainer.querySelector('.faq-search-input');
        searchInput.addEventListener('input', utils.debounce(function() {
            const searchTerm = this.value.toLowerCase();
            const faqItems = document.querySelectorAll('.faq-item');
            
            faqItems.forEach(item => {
                const question = item.querySelector('.faq-question h3').textContent.toLowerCase();
                const answer = item.querySelector('.faq-answer p').textContent.toLowerCase();
                
                if (question.includes(searchTerm) || answer.includes(searchTerm)) {
                    item.style.display = 'block';
                    item.style.opacity = '1';
                } else {
                    item.style.opacity = '0.5';
                    if (searchTerm.length > 0) {
                        item.style.display = 'none';
                    }
                }
            });
        }, 300));
    }

    // Add step navigation
    function addStepNavigation() {
        const stepsContainer = document.querySelector('.steps-container');
        if (!stepsContainer) return;
        
        const navigation = document.createElement('div');
        navigation.className = 'step-navigation';
        navigation.innerHTML = `
            <button class="btn btn-secondary" id="prevStep" disabled>
                <i class="fas fa-chevron-left"></i> 上一步
            </button>
            <span class="step-counter">步骤 <span id="currentStepNum">1</span> / 5</span>
            <button class="btn btn-primary" id="nextStep">
                下一步 <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        stepsContainer.appendChild(navigation);
        
        const steps = document.querySelectorAll('.step');
        let currentStepIndex = 0;
        
        function updateStepVisibility() {
            steps.forEach((step, index) => {
                if (index === currentStepIndex) {
                    step.style.display = 'flex';
                    step.classList.add('active-step');
                } else {
                    step.style.display = 'none';
                    step.classList.remove('active-step');
                }
            });
            
            // Update navigation
            document.getElementById('currentStepNum').textContent = currentStepIndex + 1;
            document.getElementById('prevStep').disabled = currentStepIndex === 0;
            document.getElementById('nextStep').textContent = currentStepIndex === steps.length - 1 ? '完成' : '下一步';
        }
        
        document.getElementById('prevStep').addEventListener('click', function() {
            if (currentStepIndex > 0) {
                currentStepIndex--;
                updateStepVisibility();
            }
        });
        
        document.getElementById('nextStep').addEventListener('click', function() {
            if (currentStepIndex < steps.length - 1) {
                currentStepIndex++;
                updateStepVisibility();
            } else {
                showNotification('您已完成所有步骤！', 'success');
            }
        });
        
        // Initialize step visibility
        updateStepVisibility();
    }

    // Add copy code functionality
    function addCopyCodeFunctionality() {
        const codeBlocks = document.querySelectorAll('pre code');
        
        codeBlocks.forEach(block => {
            const copyButton = document.createElement('button');
            copyButton.className = 'copy-code-btn';
            copyButton.innerHTML = '<i class="fas fa-copy"></i>';
            copyButton.title = '复制代码';
            
            block.parentNode.style.position = 'relative';
            block.parentNode.appendChild(copyButton);
            
            copyButton.addEventListener('click', function() {
                const text = block.textContent;
                navigator.clipboard.writeText(text).then(() => {
                    this.innerHTML = '<i class="fas fa-check"></i>';
                    this.style.backgroundColor = '#10b981';
                    showNotification('代码已复制到剪贴板', 'success');
                    
                    setTimeout(() => {
                        this.innerHTML = '<i class="fas fa-copy"></i>';
                        this.style.backgroundColor = '';
                    }, 2000);
                }).catch(() => {
                    showNotification('复制失败，请手动复制', 'error');
                });
            });
        });
    }

    // Add progress tracking
    function addProgressTracking() {
        const progressBar = document.createElement('div');
        progressBar.className = 'reading-progress';
        progressBar.innerHTML = '<div class="progress-fill"></div>';
        document.body.appendChild(progressBar);
        
        window.addEventListener('scroll', utils.throttle(function() {
            const scrollTop = window.pageYOffset;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = (scrollTop / docHeight) * 100;
            
            const progressFill = progressBar.querySelector('.progress-fill');
            progressFill.style.width = scrollPercent + '%';
        }, 100));
    }

    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Space to toggle FAQ
        if (e.key === ' ' && e.target.closest('.faq-question')) {
            e.preventDefault();
            e.target.closest('.faq-question').click();
        }
        
        // Arrow keys for step navigation
        if (e.key === 'ArrowLeft') {
            const prevBtn = document.getElementById('prevStep');
            if (prevBtn && !prevBtn.disabled) {
                prevBtn.click();
            }
        } else if (e.key === 'ArrowRight') {
            const nextBtn = document.getElementById('nextStep');
            if (nextBtn) {
                nextBtn.click();
            }
        }
        
        // Ctrl/Cmd + F for FAQ search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            const searchInput = document.querySelector('.faq-search-input');
            if (searchInput) {
                searchInput.focus();
            }
        }
    });

    // Add tooltip functionality for technical terms
    function addTechnicalTooltips() {
        const technicalTerms = [
            { term: '自注意力机制', definition: '一种能够关注输入序列中不同位置的机制，用于捕捉长距离依赖关系。' },
            { term: '生成对抗网络', definition: '由生成器和判别器组成的深度学习模型，用于生成高质量的数据。' },
            { term: 'Transformer', definition: '基于自注意力机制的神经网络架构，广泛应用于自然语言处理任务。' },
            { term: 'MAE', definition: '平均绝对误差，衡量预测值与真实值之间差异的指标。' },
            { term: 'RMSE', definition: '均方根误差，衡量预测精度的常用指标。' }
        ];
        
        technicalTerms.forEach(({ term, definition }) => {
            const elements = document.querySelectorAll(`*:not(script):not(style)`);
            elements.forEach(element => {
                if (element.childNodes.length === 1 && element.childNodes[0].nodeType === 3) {
                    const text = element.textContent;
                    if (text.includes(term)) {
                        element.innerHTML = text.replace(
                            new RegExp(term, 'g'),
                            `<span class="technical-term" data-tooltip="${definition}">${term}</span>`
                        );
                    }
                }
            });
        });
    }

    // Add print functionality
    function addPrintFunctionality() {
        const printButton = document.createElement('button');
        printButton.className = 'btn btn-outline print-guide-btn';
        printButton.innerHTML = '<i class="fas fa-print"></i> 打印指南';
        printButton.style.position = 'fixed';
        printButton.style.bottom = '20px';
        printButton.style.right = '20px';
        printButton.style.zIndex = '1000';
        
        document.body.appendChild(printButton);
        
        printButton.addEventListener('click', function() {
            window.print();
        });
    }

    // Add bookmark functionality
    function addBookmarkFunctionality() {
        const sections = document.querySelectorAll('.quick-start-section, .faq-section, .tech-doc-section');
        
        sections.forEach(section => {
            const heading = section.querySelector('h2');
            if (heading) {
                const bookmarkBtn = document.createElement('button');
                bookmarkBtn.className = 'bookmark-btn';
                bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i>';
                bookmarkBtn.title = '添加书签';
                
                heading.appendChild(bookmarkBtn);
                
                bookmarkBtn.addEventListener('click', function() {
                    const sectionTitle = heading.textContent.replace(/[^\w\s]/g, '').trim();
                    const bookmarks = JSON.parse(localStorage.getItem('lingjingzhisuan_bookmarks') || '[]');
                    
                    const existingIndex = bookmarks.findIndex(b => b.title === sectionTitle);
                    if (existingIndex >= 0) {
                        bookmarks.splice(existingIndex, 1);
                        this.innerHTML = '<i class="fas fa-bookmark"></i>';
                        showNotification('书签已移除', 'info');
                    } else {
                        bookmarks.push({
                            title: sectionTitle,
                            url: window.location.href + '#' + section.id,
                            timestamp: new Date().toISOString()
                        });
                        this.innerHTML = '<i class="fas fa-bookmark" style="color: #667eea;"></i>';
                        showNotification('书签已添加', 'success');
                    }
                    
                    localStorage.setItem('lingjingzhisuan_bookmarks', JSON.stringify(bookmarks));
                });
            }
        });
    }

    // Initialize additional features
    setTimeout(() => {
        addFAQSearch();
        addStepNavigation();
        addCopyCodeFunctionality();
        addProgressTracking();
        addTechnicalTooltips();
        addPrintFunctionality();
        addBookmarkFunctionality();
    }, 1000);

    // Add CSS for additional features
    const additionalStyles = `
        <style>
            .faq-search {
                margin-bottom: 1.5rem;
                position: relative;
            }
            
            .faq-search-input {
                width: 100%;
                padding: 0.75rem 2.5rem 0.75rem 1rem;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 1rem;
            }
            
            .faq-search i {
                position: absolute;
                right: 1rem;
                top: 50%;
                transform: translateY(-50%);
                color: #64748b;
            }
            
            .step-navigation {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 2rem;
                padding: 1rem;
                background: #f8fafc;
                border-radius: 8px;
            }
            
            .step-counter {
                font-weight: 500;
                color: #64748b;
            }
            
            .copy-code-btn {
                position: absolute;
                top: 0.5rem;
                right: 0.5rem;
                background: #f1f5f9;
                border: none;
                border-radius: 4px;
                padding: 0.5rem;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .copy-code-btn:hover {
                background: #e2e8f0;
            }
            
            .reading-progress {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 3px;
                background: #e2e8f0;
                z-index: 1001;
            }
            
            .reading-progress .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
                width: 0%;
                transition: width 0.3s ease;
            }
            
            .technical-term {
                color: #667eea;
                cursor: help;
                border-bottom: 1px dotted #667eea;
            }
            
            .bookmark-btn {
                background: none;
                border: none;
                color: #64748b;
                cursor: pointer;
                margin-left: 0.5rem;
                transition: color 0.3s ease;
            }
            
            .bookmark-btn:hover {
                color: #667eea;
            }
            
            .print-guide-btn {
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            }
            
            @media print {
                .header, .footer, .nav, .bookmark-btn, .print-guide-btn, .step-navigation {
                    display: none !important;
                }
                
                .main-content {
                    margin: 0 !important;
                    padding: 0 !important;
                }
            }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', additionalStyles);

    console.log('Guide page JavaScript loaded successfully!');
}); 