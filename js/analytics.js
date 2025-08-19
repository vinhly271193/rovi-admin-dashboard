// Analytics Data Fetching and Processing
class AnalyticsManager {
    constructor() {
        this.users = [];
        this.foodData = [];
        this.activityData = [];
        this.timeFilter = 'all';
    }

    async init() {
        if (!window.authManager.checkAdminAccess()) {
            console.error('Admin access required');
            return;
        }

        // Load initial data
        await this.loadAllData();
        
        // Set up time filter
        this.setupTimeFilter();
        
        // Update last refresh time
        this.updateLastRefresh();
    }

    setupTimeFilter() {
        const timeFilter = document.getElementById('timeFilter');
        if (timeFilter) {
            timeFilter.addEventListener('change', (e) => {
                this.timeFilter = e.target.value;
                this.refreshDashboard();
            });
        }
    }

    updateLastRefresh() {
        const lastRefreshEl = document.getElementById('lastRefresh');
        if (lastRefreshEl) {
            lastRefreshEl.textContent = new Date().toLocaleTimeString();
        }
    }

    async loadAllData() {
        try {
            // Show loading state
            this.showLoadingState();

            // Batch load all data with caching
            const results = await window.cacheManager.batchCache([
                {
                    key: 'users',
                    fetchFunction: () => this.fetchUsers()
                },
                {
                    key: 'recentActivity',
                    fetchFunction: () => this.fetchRecentActivity()
                },
                {
                    key: 'foodDatabase',
                    fetchFunction: () => this.fetchFoodDatabase()
                }
            ]);

            this.users = results.users || [];
            
            // Update UI with fetched data
            this.updateOverviewStats();
            this.updateUsersList();
            this.updateRecentActivity();
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.showErrorState(error.message);
        }
    }

    async fetchUsers() {
        const usersSnapshot = await db.collection(COLLECTIONS.users).get();
        const users = [];
        
        for (const doc of usersSnapshot.docs) {
            const userData = doc.data();
            const userId = doc.id;
            
            // Get latest activity for each user
            const latestActivity = await this.getLatestUserActivity(userId);
            
            users.push({
                id: userId,
                ...userData,
                latestActivity: latestActivity
            });
        }
        
        return users;
    }

    async getLatestUserActivity(userId) {
        try {
            // Get latest from multiple collections
            const [stepsData, foodLog, activityLog] = await Promise.all([
                this.getLatestFromCollection(userId, SUBCOLLECTIONS.stepsData),
                this.getLatestFromCollection(userId, SUBCOLLECTIONS.foodLog),
                this.getLatestFromCollection(userId, SUBCOLLECTIONS.activityLog)
            ]);

            // Return the most recent activity
            const activities = [stepsData, foodLog, activityLog].filter(a => a);
            if (activities.length === 0) return null;
            
            activities.sort((a, b) => b.date - a.date);
            return activities[0];
        } catch (error) {
            console.error(`Error fetching activity for user ${userId}:`, error);
            return null;
        }
    }

    async getLatestFromCollection(userId, collection) {
        try {
            const snapshot = await db.collection(COLLECTIONS.users)
                .doc(userId)
                .collection(collection)
                .orderBy('date', 'desc')
                .limit(1)
                .get();
            
            if (snapshot.empty) return null;
            
            const data = snapshot.docs[0].data();
            return {
                type: collection,
                date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
                data: data
            };
        } catch (error) {
            // Collection might not exist for this user
            return null;
        }
    }

    async fetchRecentActivity() {
        const activities = [];
        
        // Get recent activities from all users
        for (const user of this.users) {
            try {
                // Get today's date
                const today = new Date().toISOString().split('T')[0].replace(/-/g, '-');
                
                // Check for food entries today
                const foodSnapshot = await db.collection(COLLECTIONS.users)
                    .doc(user.id)
                    .collection(SUBCOLLECTIONS.foodLog)
                    .doc(today)
                    .get();
                
                if (foodSnapshot.exists) {
                    const entries = foodSnapshot.data().entries || [];
                    if (entries.length > 0) {
                        activities.push({
                            userId: user.id,
                            userName: anonymizeUserId(user.id),
                            type: 'food',
                            count: entries.length,
                            timestamp: new Date()
                        });
                    }
                }
                
                // Check for steps data today
                const stepsSnapshot = await db.collection(COLLECTIONS.users)
                    .doc(user.id)
                    .collection(SUBCOLLECTIONS.stepsData)
                    .doc(today)
                    .get();
                
                if (stepsSnapshot.exists) {
                    const stepsData = stepsSnapshot.data();
                    if (stepsData.steps > 0) {
                        activities.push({
                            userId: user.id,
                            userName: anonymizeUserId(user.id),
                            type: 'steps',
                            value: stepsData.steps,
                            timestamp: stepsData.lastUpdated?.toDate ? 
                                      stepsData.lastUpdated.toDate() : new Date()
                        });
                    }
                }
            } catch (error) {
                console.error(`Error fetching activity for user ${user.id}:`, error);
            }
        }
        
        // Sort by timestamp
        activities.sort((a, b) => b.timestamp - a.timestamp);
        
        return activities.slice(0, 20); // Return top 20 recent activities
    }

    async fetchFoodDatabase() {
        const foodSnapshot = await db.collection(COLLECTIONS.foodDatabase).limit(100).get();
        const foods = [];
        
        foodSnapshot.forEach(doc => {
            foods.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return foods;
    }

    async fetchUserStepsData(userId, days = 30) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        const stepsData = [];
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateKey = d.toISOString().split('T')[0];
            
            try {
                const doc = await db.collection(COLLECTIONS.users)
                    .doc(userId)
                    .collection(SUBCOLLECTIONS.stepsData)
                    .doc(dateKey)
                    .get();
                
                if (doc.exists) {
                    stepsData.push({
                        date: dateKey,
                        steps: doc.data().steps || 0
                    });
                } else {
                    stepsData.push({
                        date: dateKey,
                        steps: 0
                    });
                }
            } catch (error) {
                stepsData.push({
                    date: dateKey,
                    steps: 0
                });
            }
        }
        
        return stepsData;
    }

    updateOverviewStats() {
        // Total users
        const totalUsersEl = document.getElementById('totalUsers');
        if (totalUsersEl) {
            totalUsersEl.textContent = this.users.length;
        }
        
        // User growth
        const userGrowthEl = document.getElementById('userGrowth');
        if (userGrowthEl) {
            const newUsersThisMonth = this.users.filter(u => {
                const createdAt = u.createdAt?.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
                const monthAgo = new Date();
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return createdAt > monthAgo;
            }).length;
            
            userGrowthEl.textContent = `+${newUsersThisMonth} this month`;
            userGrowthEl.className = 'stat-change positive';
        }
        
        // Average steps
        const avgStepsEl = document.getElementById('avgSteps');
        if (avgStepsEl) {
            const totalSteps = this.users.reduce((sum, u) => sum + (u.dailySteps || 0), 0);
            const avgSteps = this.users.length > 0 ? Math.round(totalSteps / this.users.length) : 0;
            avgStepsEl.textContent = avgSteps.toLocaleString();
        }
        
        // Average calories burned
        const avgCaloriesEl = document.getElementById('avgCaloriesBurned');
        if (avgCaloriesEl) {
            const totalCalories = this.users.reduce((sum, u) => sum + (u.dailyCaloriesBurned || 0), 0);
            const avgCalories = this.users.length > 0 ? Math.round(totalCalories / this.users.length) : 0;
            avgCaloriesEl.textContent = avgCalories.toLocaleString();
        }
        
        // Foods logged today (would need real-time data)
        const foodsLoggedEl = document.getElementById('foodsLogged');
        if (foodsLoggedEl) {
            foodsLoggedEl.textContent = '0'; // Will be updated with real data
        }
        
        // Update top performers
        this.updateTopPerformers();
    }

    updateTopPerformers() {
        const topPerformersEl = document.getElementById('topPerformers');
        if (!topPerformersEl) return;
        
        // Sort users by daily steps
        const sortedUsers = [...this.users].sort((a, b) => (b.dailySteps || 0) - (a.dailySteps || 0));
        
        let html = '';
        sortedUsers.slice(0, 5).forEach((user, index) => {
            html += `
                <div class="leaderboard-item">
                    <span class="leaderboard-rank">#${index + 1}</span>
                    <span class="leaderboard-user">${anonymizeUserId(user.id)}</span>
                    <span class="leaderboard-value">${(user.dailySteps || 0).toLocaleString()} steps</span>
                </div>
            `;
        });
        
        topPerformersEl.innerHTML = html;
    }

    updateUsersList() {
        const usersTableBody = document.getElementById('usersTableBody');
        if (!usersTableBody) return;
        
        let html = '';
        this.users.forEach(user => {
            const createdAt = user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
            const lastActive = user.latestActivity ? daysAgo(user.latestActivity.date) : 'Never';
            
            html += `
                <tr>
                    <td>${anonymizeUserId(user.id)}</td>
                    <td>${formatDate(createdAt)}</td>
                    <td>${lastActive}</td>
                    <td>${user.goalSteps || 10000}</td>
                    <td>${user.goalCaloriesConsumed || 2000}</td>
                    <td>
                        <button class="btn-view" onclick="window.analyticsManager.viewUserDetails('${user.id}')">
                            View
                        </button>
                    </td>
                </tr>
            `;
        });
        
        usersTableBody.innerHTML = html;
    }

    updateRecentActivity() {
        const recentActivityEl = document.getElementById('recentActivity');
        if (!recentActivityEl) return;
        
        // This would be populated with real activity data
        let html = '';
        
        // Sample activities (would be replaced with real data)
        const activities = [
            { icon: '🏃', title: 'User logged 10,000 steps', time: '2 minutes ago', color: '#48bb78' },
            { icon: '🍎', title: 'User logged breakfast', time: '15 minutes ago', color: '#ed8936' },
            { icon: '💪', title: 'User completed workout', time: '1 hour ago', color: '#667eea' },
            { icon: '⚖️', title: 'User updated weight', time: '3 hours ago', color: '#38b2ac' }
        ];
        
        activities.forEach(activity => {
            html += `
                <div class="activity-item">
                    <div class="activity-icon" style="background: ${activity.color}20; color: ${activity.color}">
                        ${activity.icon}
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">${activity.title}</div>
                        <div class="activity-time">${activity.time}</div>
                    </div>
                </div>
            `;
        });
        
        recentActivityEl.innerHTML = html;
    }

    async viewUserDetails(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;
        
        const modal = document.getElementById('userModal');
        const userDetails = document.getElementById('userDetails');
        
        if (!modal || !userDetails) return;
        
        // Fetch detailed user data
        const stepsData = await this.fetchUserStepsData(userId, 30);
        const avgSteps = stepsData.reduce((sum, d) => sum + d.steps, 0) / stepsData.length;
        
        let html = `
            <div style="display: grid; gap: 1rem;">
                <div><strong>User ID:</strong> ${anonymizeUserId(userId)}</div>
                <div><strong>Email:</strong> ${user.email || 'N/A'}</div>
                <div><strong>Name:</strong> ${user.name || 'N/A'}</div>
                <div><strong>Created:</strong> ${formatDate(user.createdAt)}</div>
                <div><strong>Goals:</strong></div>
                <ul style="margin-left: 1.5rem;">
                    <li>Steps: ${user.goalSteps || 10000}</li>
                    <li>Calories: ${user.goalCaloriesConsumed || 2000}</li>
                    <li>Protein: ${user.goalProtein || 50}g</li>
                    <li>Fat: ${user.goalFat || 50}g</li>
                    <li>Carbs: ${user.goalCarbs || 200}g</li>
                </ul>
                <div><strong>30-Day Avg Steps:</strong> ${Math.round(avgSteps).toLocaleString()}</div>
            </div>
        `;
        
        userDetails.innerHTML = html;
        modal.style.display = 'flex';
        
        // Close modal functionality
        const closeBtn = modal.querySelector('.close');
        closeBtn.onclick = () => modal.style.display = 'none';
        
        modal.onclick = (e) => {
            if (e.target === modal) modal.style.display = 'none';
        };
    }

    refreshDashboard() {
        this.loadAllData();
    }

    showLoadingState() {
        // Add loading indicators to stats
        ['totalUsers', 'avgSteps', 'avgCaloriesBurned', 'foodsLogged'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = 'Loading...';
        });
    }

    showErrorState(message) {
        console.error('Dashboard error:', message);
        // Could show error UI here
    }
}

// Initialize analytics manager
window.analyticsManager = new AnalyticsManager();