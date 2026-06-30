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
});
