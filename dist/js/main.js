// IntegralELearning.com - Main JavaScript
import { config } from './config.js';

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initPortfolioForm();
    initScrollAnimations();
    initChatbotWidget();
});

// ... (existing code) ...

// ========== CHATBOT WIDGET ==========
function initChatbotWidget() {
    setTimeout(() => {
        (function () {
            if (!window.chatbase || window.chatbase("getState") !== "initialized") {
                window.chatbase = (...args) => {
                    if (!window.chatbase.q) {
                        window.chatbase.q = []
                    }
                    window.chatbase.q.push(args)
                };
                window.chatbase = new Proxy(window.chatbase, {
                    get(target, prop) {
                        if (prop === "q") {
                            return target.q
                        }
                        return (...args) => target(prop, ...args)
                    }
                })
            }
            const onLoad = function () {
                const script = document.createElement("script");
                script.src = "https://www.chatbase.co/embed.min.js";
                script.id = "Yb5-ZOPsnSt9Ju6r3P7C7";
                script.domain = "www.chatbase.co";
                document.body.appendChild(script)
            };
            if (document.readyState === "complete") {
                onLoad()
            } else {
                window.addEventListener("load", onLoad)
            }
        })();
    }, 10000); // 10 second delay
}

// ========== UTILITY FUNCTIONS ==========

// Log configuration status (for debugging)
console.log('IntegralELearning.com initialized');
console.log('Webhook configured:', !!config.portfolioWebhookUrl);
function initNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    const navLinkItems = document.querySelectorAll('.nav-link');
    const navbar = document.getElementById('navbar');

    // Mobile menu toggle
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking a link
    navLinkItems.forEach(link => {
        link.addEventListener('click', (e) => {
            // Only handle internal anchor links
            if (link.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetSection = document.querySelector(targetId);

                if (targetSection) {
                    // Close mobile menu
                    navLinks.classList.remove('active');
                    navToggle.classList.remove('active');

                    // Smooth scroll to section
                    const navHeight = navbar.offsetHeight;
                    const targetPosition = targetSection.offsetTop - navHeight;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Add shadow to navbar on scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Update active nav link
        updateActiveNavLink();
    });
}

// Update active navigation link based on scroll position
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    let current = '';
    const scrollPosition = window.scrollY + 100;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href && href === `#${current}`) {
            link.classList.add('active');
        }
    });
}

// ========== PORTFOLIO FORM ==========
function initPortfolioForm() {
    const form = document.getElementById('portfolioForm');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const errorMessageText = document.getElementById('errorMessageText');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Hide previous messages
        successMessage.style.display = 'none';
        errorMessage.style.display = 'none';

        // Get form data
        const formData = {
            email: document.getElementById('email').value,
            projectDescription: document.getElementById('projectDescription').value,
            timestamp: new Date().toISOString()
        };

        // Validate email
        if (!isValidEmail(formData.email)) {
            showError('Please enter a valid email address.');
            return;
        }

        // Check if webhook URL is configured
        if (!config.portfolioWebhookUrl || config.portfolioWebhookUrl === '') {
            console.warn('Portfolio webhook URL not configured');
            // For demo purposes, show success anyway
            showSuccess();
            form.reset();
            return;
        }

        // Submit to webhook
        try {
            const response = await fetch(config.portfolioWebhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                showSuccess();
                form.reset();
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Form submission error:', error);
            showError('Unable to submit request. Please try again or contact us directly.');
        }
    });

    function showSuccess() {
        successMessage.style.display = 'block';
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 8000);
    }

    function showError(message) {
        errorMessageText.textContent = message;
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 8000);
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

// ========== SCROLL ANIMATIONS ==========
function initScrollAnimations() {
    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all cards
    const cards = document.querySelectorAll('.process-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });
}

// ========== UTILITY FUNCTIONS ==========

// Log configuration status (for debugging)
console.log('IntegralELearning.com initialized');
console.log('Webhook configured:', !!config.portfolioWebhookUrl);
