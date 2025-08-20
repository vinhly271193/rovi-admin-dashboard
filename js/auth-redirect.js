// Authentication with Redirect Method (Works better with Arc Browser)
class AuthRedirectManager {
    constructor() {
        this.currentUser = null;
        this.isAdmin = false;
        this.initAuth();
    }

    initAuth() {
        // Check for redirect result first
        auth.getRedirectResult()
            .then((result) => {
                if (result.credential) {
                    console.log('Redirect sign-in successful');
                    this.handleUserLogin(result.user);
                }
            })
            .catch((error) => {
                console.error('Redirect error:', error);
                this.showError(error.message);
            });

        // Listen for auth state changes
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.handleUserLogin(user);
            } else {
                this.handleUserLogout();
            }
        });

        // Bind login button
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
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
            loginBtn.textContent = 'Redirecting to Google...';
            loginError.textContent = '';

            // Use redirect instead of popup (better for Arc browser)
            const provider = new firebase.auth.GoogleAuthProvider();
            
            // Force account selection
            provider.setCustomParameters({
                prompt: 'select_account'
            });
            
            // Use signInWithRedirect instead of popup
            await auth.signInWithRedirect(provider);
            
        } catch (error) {
            console.error('Sign in error:', error);
            this.showError(error.message);
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign in with Google';
        }
    }

    async signOut() {
        try {
            await auth.signOut();
            console.log('Signed out successfully');
        } catch (error) {
            console.error('Sign out error:', error);
            alert('Error signing out: ' + error.message);
        }
    }

    handleUserLogin(user) {
        this.currentUser = user;
        
        // Check if user is admin
        if (user.uid === ADMIN_UID) {
            this.isAdmin = true;
            this.showDashboard();
            
            // Initialize dashboard
            if (window.dashboardManager) {
                window.dashboardManager.init();
            }
        } else {
            // Not admin - show error and sign out
            this.isAdmin = false;
            this.showError(`Access denied. This dashboard is restricted to admin only. Your UID: ${user.uid}`);
            
            // Sign out non-admin users
            setTimeout(() => {
                this.signOut();
            }, 5000);
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
            loginBtn.textContent = 'Sign in with Google';
        }
    }

    showError(message) {
        const loginError = document.getElementById('loginError');
        if (loginError) {
            loginError.textContent = message;
        }
    }

    checkAdminAccess() {
        return this.isAdmin && this.currentUser && this.currentUser.uid === ADMIN_UID;
    }
}

// Initialize auth manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthRedirectManager();
});