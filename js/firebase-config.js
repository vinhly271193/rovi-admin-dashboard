// Firebase Configuration for Web App
const firebaseConfig = {
    apiKey: "AIzaSyDrNsSCG2FJ1es4BHe_URbwhuEpkA_5VyU",
    authDomain: "rovi-16b3a.firebaseapp.com",
    projectId: "rovi-16b3a",
    storageBucket: "rovi-16b3a.firebasestorage.app",
    databaseURL: "https://rovi-16b3a-default-rtdb.firebaseio.com",
    messagingSenderId: "677298263090",
    appId: "1:677298263090:web:rovi-admin-dashboard"  // Generic web app ID
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Admin UID - Only this user can access the dashboard
// This is your UID from the screenshots - vinh2711@googlemail.com
const ADMIN_UID = "byothLpU8SdS5SYpx1UFT0pGT0p1";

// Collections
const COLLECTIONS = {
    users: 'users',
    foodDatabase: 'foodDatabase',
    usernames: 'usernames'
};

// Subcollections
const SUBCOLLECTIONS = {
    foodLog: 'foodLog',
    activityLog: 'activityLog',
    stepsData: 'stepsData',
    weightLog: 'weightLog',
    exercises: 'exercises',
    myFoods: 'myFoods',
    customBarcodes: 'customBarcodes',
    workoutRoutes: 'workoutRoutes',
    investments: 'investments',
    recipes: 'recipes',
    preferences: 'preferences',
    achievement_definitions: 'achievement_definitions'
};

// Helper function to anonymize user data
function anonymizeUserId(userId) {
    // Show first 5 and last 3 characters
    if (userId.length > 8) {
        return userId.substring(0, 5) + '...' + userId.substring(userId.length - 3);
    }
    return userId;
}

// Helper function to format dates
function formatDate(date) {
    if (!date) return 'N/A';
    
    if (date.toDate) {
        date = date.toDate();
    } else if (typeof date === 'string') {
        date = new Date(date);
    }
    
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return date.toLocaleDateString('en-US', options);
}

// Helper function to calculate days ago
function daysAgo(date) {
    if (!date) return null;
    
    if (date.toDate) {
        date = date.toDate();
    } else if (typeof date === 'string') {
        date = new Date(date);
    }
    
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
}

// Error handling
function handleFirebaseError(error) {
    console.error('Firebase Error:', error);
    
    let message = 'An error occurred';
    
    switch (error.code) {
        case 'permission-denied':
            message = 'Access denied. Admin privileges required.';
            break;
        case 'unavailable':
            message = 'Service temporarily unavailable. Please try again.';
            break;
        case 'unauthenticated':
            message = 'Please sign in to continue.';
            break;
        default:
            message = error.message || 'An unexpected error occurred';
    }
    
    return message;
}