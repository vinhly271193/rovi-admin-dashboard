// Simple Authentication for Testing
// This bypasses Google Sign-In and uses email/password

class SimpleAuthManager {
    constructor() {
        this.currentUser = null;
        this.isAdmin = false;
        this.initAuth();
    }

    initAuth() {
        // Check if already logged in
        const savedAuth = localStorage.getItem('roviAdminAuth');
        if (savedAuth) {
            try {
                const authData = JSON.parse(savedAuth);
                if (authData.email === 'vinh2711@googlemail.com') {
                    this.handleUserLogin(authData);
                }
            } catch (e) {
                console.error('Error loading saved auth:', e);
            }
        }

        // Update login button
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.textContent = 'Sign in with Email';
            loginBtn.addEventListener('click', () => this.signIn());
        }

        // Bind logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.signOut());
        }
    }

    async signIn() {
        const loginBtn = document.getElementById('loginBtn');
        const loginError = document.getElementById('loginError');
        
        try {
            loginBtn.disabled = true;
            loginBtn.textContent = 'Signing in...';
            loginError.textContent = '';

            // For testing: Use email/password authentication
            const email = prompt('Enter admin email:');
            const password = prompt('Enter password:');
            
            // Check credentials (in production, this would verify with Firebase)
            if (email === 'vinh2711@googlemail.com' && password) {
                // Simulate successful login
                const userData = {
                    uid: ADMIN_UID,
                    email: email,
                    displayName: 'Admin User'
                };
                
                // Save to localStorage
                localStorage.setItem('roviAdminAuth', JSON.stringify(userData));
                
                // Handle login
                this.handleUserLogin(userData);
                
            } else {
                throw new Error('Invalid credentials');
            }
            
        } catch (error) {
            console.error('Sign in error:', error);
            loginError.textContent = error.message || 'Authentication failed';
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign in with Email';
        }
    }

    async signOut() {
        try {
            localStorage.removeItem('roviAdminAuth');
            this.currentUser = null;
            this.isAdmin = false;
            this.showLoginScreen();
            console.log('Signed out successfully');
        } catch (error) {
            console.error('Sign out error:', error);
            alert('Error signing out: ' + error.message);
        }
    }

    handleUserLogin(userData) {
        this.currentUser = userData;
        
        // Check if user is admin
        if (userData.email === 'vinh2711@googlemail.com') {
            this.isAdmin = true;
            this.showDashboard();
            
            // Initialize dashboard
            if (window.dashboardManager) {
                window.dashboardManager.init();
            }
        } else {
            // Not admin
            this.isAdmin = false;
            const loginError = document.getElementById('loginError');
            if (loginError) {
                loginError.textContent = 'Access denied. Admin privileges required.';
            }
            
            // Sign out non-admin users
            setTimeout(() => {
                this.signOut();
            }, 3000);
        }
    }

    handleUserLogout() {
        this.currentUser = null;
        this.isAdmin = false;
        this.showLoginScreen();
    }

    showDashboard() {
        const loginScreen = document.getElementById('loginScreen');
        const dashboard = document.getElementById('dashboard');
        
        if (loginScreen) loginScreen.style.display = 'none';
        if (dashboard) dashboard.style.display = 'flex';
    }

    showLoginScreen() {
        const loginScreen = document.getElementById('loginScreen');
        const dashboard = document.getElementById('dashboard');
        const loginBtn = document.getElementById('loginBtn');
        
        if (loginScreen) loginScreen.style.display = 'flex';
        if (dashboard) dashboard.style.display = 'none';
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign in with Email';
        }
    }

    checkAdminAccess() {
        return this.isAdmin && this.currentUser && this.currentUser.email === 'vinh2711@googlemail.com';
    }
}

// Initialize simple auth manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Comment out the regular auth and use simple auth for testing
    window.authManager = new SimpleAuthManager();
});