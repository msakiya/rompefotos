// js/api.js
const API_BASE = 'api/';

// Helper for generic API calls (JSON)
async function fetchAPI(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        credentials: 'include', // CRITICAL: This sends the PHPSESSID cookie even with redirects
        headers: {
            'Content-Type': 'application/json'
        }
    };
    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Error de servidor');
        }
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Check if user is logged in
async function checkAuth() {
    try {
        const data = await fetchAPI('auth.php?action=check', 'POST');
        return data.logged_in;
    } catch (e) {
        return false;
    }
}

// Logout and redirect
async function logout() {
    try {
        await fetchAPI('auth.php?action=logout', 'POST');
        window.location.href = 'index.html';
    } catch (e) {
        console.error(e);
    }
}
