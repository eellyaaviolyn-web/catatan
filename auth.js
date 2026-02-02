// Authentication JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Wait for database to be ready
    if (typeof db === 'undefined') {
        setTimeout(() => {
            initAuth();
        }, 100);
    } else {
        initAuth();
    }
});

function initAuth() {
    // Check if user is already logged in
    const currentUser = db.getCurrentUser();
    if (currentUser && (window.location.pathname.includes('index.html') || window.location.pathname === '/')) {
        window.location.href = 'dashboard.html';
    }
    
    // Add event listeners to buttons
    const registerBtn = document.querySelector('#registerForm button[type="submit"]');
    if (registerBtn) {
        registerBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const form = document.getElementById('registerForm').querySelector('form');
            handleRegister({ target: form, preventDefault: () => {} });
        });
    }
}

// Show different forms
function showLogin() {
    hideAllForms();
    document.getElementById('loginForm').classList.add('active');
}

function showRegister() {
    hideAllForms();
    document.getElementById('registerForm').classList.add('active');
}

function showForgotPassword() {
    hideAllForms();
    document.getElementById('forgotForm').classList.add('active');
}

function hideAllForms() {
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
}

// Handle Login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<div class="loading"></div> Masuk...';
    submitBtn.disabled = true;
    
    try {
        const response = await db.loginUser({ email, password });
        
        if (response.user) {
            // Login successful
            db.setCurrentUser(response.user);
            showMessage('Login berhasil! Mengalihkan...', 'success');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        }
    } catch (error) {
        // Login failed
        showMessage('Email atau password salah!', 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Handle Register
async function handleRegister(event) {
    event.preventDefault();
    console.log('Register button clicked'); // Debug log
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    console.log('Form data:', { name, email, password, confirmPassword }); // Debug log
    
    // Validation
    if (!name || !email || !password || !confirmPassword) {
        showMessage('Semua field harus diisi!', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('Password tidak cocok!', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('Password minimal 6 karakter!', 'error');
        return;
    }
    
    // Check if database is available
    if (typeof db === 'undefined') {
        showMessage('Database tidak tersedia!', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<div class="loading"></div> Mendaftar...';
    submitBtn.disabled = true;
    
    try {
        const response = await db.registerUser({
            name: name,
            email: email,
            password: password
        });
        
        console.log('User created:', response); // Debug log
        showMessage('Pendaftaran berhasil! Silakan login.', 'success');
        
        // Clear form
        event.target.reset();
        
        // Switch to login form
        setTimeout(() => {
            showLogin();
        }, 1500);
        
    } catch (error) {
        console.error('Registration error:', error); // Debug log
        showMessage(error.message || 'Terjadi kesalahan saat mendaftar!', 'error');
    }
    
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
}

// Handle Forgot Password
function handleForgotPassword(event) {
    event.preventDefault();
    
    const email = document.getElementById('forgotEmail').value;
    const user = db.getUserByEmail(email);
    
    if (!user) {
        showMessage('Email tidak ditemukan!', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<div class="loading"></div> Mengirim...';
    submitBtn.disabled = true;
    
    // Generate OTP and tokens
    const otpCode = generateOTP();
    const otpToken = generateOTPToken();
    const resetToken = generateResetToken();
    
    // Update user with OTP data
    db.updateUser(user.id, { 
        otpCode: otpCode,
        otpToken: otpToken,
        otpExpiry: new Date(Date.now() + 300000).toISOString(), // 5 minutes
        resetToken: resetToken,
        resetTokenExpiry: new Date(Date.now() + 3600000).toISOString() // 1 hour
    });
    
    // Send OTP email via Formspree
    sendOTPEmail(email, user.name, otpCode)
        .then(() => {
            showMessage('Kode OTP telah dikirim ke email Anda!', 'success');
            
            // Clear form
            event.target.reset();
            
            // Redirect to OTP verification
            setTimeout(() => {
                window.location.href = `otp-verification.html?email=${encodeURIComponent(email)}&token=${otpToken}`;
            }, 1500);
        })
        .catch(() => {
            showMessage('Gagal mengirim email. Silakan coba lagi.', 'error');
        })
        .finally(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
}

// Send OTP email via Formspree
async function sendOTPEmail(email, name, otpCode) {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('name', name);
    formData.append('subject', 'Kode OTP Reset Password - Web Catatan');
    formData.append('message', `
Halo ${name},

Kode OTP untuk reset password Anda adalah:

${otpCode}

Kode ini akan kedaluwarsa dalam 5 menit.

Jika Anda tidak meminta reset password, abaikan email ini.

Terima kasih,
Tim Web Catatan
    `);
    
    const response = await fetch('https://formspree.io/f/mpqdjgqa', {
        method: 'POST',
        body: formData,
        headers: {
            'Accept': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error('Failed to send email');
    }
    
    return response.json();
}

// Generate OTP (6 digits)
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate OTP token
function generateOTPToken() {
    return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

// Generate reset token
function generateResetToken() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) +
           Date.now().toString(36);
}

// Show message
function showMessage(message, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Insert message
    const activeForm = document.querySelector('.auth-form.active');
    if (activeForm) {
        activeForm.insertBefore(messageDiv, activeForm.firstChild);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Real-time validation
document.addEventListener('input', function(event) {
    const input = event.target;
    
    // Email validation
    if (input.type === 'email') {
        if (input.value && !isValidEmail(input.value)) {
            input.style.borderColor = 'var(--danger-color)';
        } else {
            input.style.borderColor = 'var(--border-color)';
        }
    }
    
    // Password confirmation validation
    if (input.id === 'confirmPassword') {
        const password = document.getElementById('registerPassword').value;
        if (input.value && input.value !== password) {
            input.style.borderColor = 'var(--danger-color)';
        } else {
            input.style.borderColor = 'var(--border-color)';
        }
    }
});

// Handle Enter key
document.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        const activeForm = document.querySelector('.auth-form.active form');
        if (activeForm) {
            const submitBtn = activeForm.querySelector('button[type="submit"]');
            if (submitBtn && !submitBtn.disabled) {
                submitBtn.click();
            }
        }
    }
});

// Auto-focus first input
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const firstInput = document.querySelector('.auth-form.active input');
        if (firstInput) {
            firstInput.focus();
        }
    }, 100);
});

// Form switching animations
function switchForm(targetFormId) {
    const currentForm = document.querySelector('.auth-form.active');
    const targetForm = document.getElementById(targetFormId);
    
    if (currentForm) {
        currentForm.style.opacity = '0';
        currentForm.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            currentForm.classList.remove('active');
            targetForm.classList.add('active');
            targetForm.style.opacity = '0';
            targetForm.style.transform = 'translateX(20px)';
            
            setTimeout(() => {
                targetForm.style.opacity = '1';
                targetForm.style.transform = 'translateX(0)';
                
                // Focus first input
                const firstInput = targetForm.querySelector('input');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 50);
        }, 200);
    }
}