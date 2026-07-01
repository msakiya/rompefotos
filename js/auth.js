// js/auth.js
document.addEventListener('DOMContentLoaded', async () => {
    // Check if already logged in
    const isLoggedIn = await checkAuth();
    if (isLoggedIn) {
        window.location.href = 'dashboard.html';
        return;
    }

    const tabs = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.auth-form');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active classes
            tabs.forEach(t => t.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active-form'));

            // Add active to clicked
            tab.classList.add('active');
            const target = tab.getAttribute('data-target');
            document.getElementById(`${target}-form`).classList.add('active-form');
        });
    });

    // Password Toggle Logic
    const toggleButtons = document.querySelectorAll('.toggle-password');
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            
            if (input.type === 'password') {
                input.type = 'text';
                // Change to eye-off icon
                this.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
            } else {
                input.type = 'password';
                // Change back to eye icon
                this.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
            }
        });
    });

    // Handle Login
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorDiv = document.getElementById('login-error');
        
        try {
            await fetchAPI('auth.php?action=login', 'POST', { email, password });
            window.location.href = 'dashboard.html';
        } catch (err) {
            errorDiv.textContent = err.message;
        }
    });

    // Handle Registration
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const errorDiv = document.getElementById('register-error');
        
        try {
            await fetchAPI('auth.php?action=register', 'POST', { email, password });
            window.location.href = 'dashboard.html';
        } catch (err) {
            errorDiv.textContent = err.message;
        }
    });

    // Handle Guest Mode
    document.getElementById('guest-btn').addEventListener('click', () => {
        sessionStorage.setItem('guestMode', 'true');
        window.location.href = 'dashboard.html';
    });
});
