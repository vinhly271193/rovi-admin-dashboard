// Main Dashboard Controller
class DashboardManager {
    constructor() {
        this.currentPage = 'overview';
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        console.log('Initializing dashboard...');
        
        // Set up navigation
        this.setupNavigation();
        
        // Set up export functionality
        this.setupExport();
        
        // Initialize analytics
        await window.analyticsManager.init();
        
        // Initialize charts
        window.chartManager.initCharts();
        
        // Load nutrition insights
        this.loadNutritionInsights();
        
        // Load user insights
        this.loadInsights();
        
        this.initialized = true;
        console.log('Dashboard initialized successfully');
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.navigateToPage(page);
                
                // Update active state
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }

    navigateToPage(page) {
        this.currentPage = page;
        
        // Hide all pages
        const pages = document.querySelectorAll('.page-content');
        pages.forEach(p => p.style.display = 'none');
        
        // Show selected page
        const selectedPage = document.getElementById(`${page}Page`);
        if (selectedPage) {
            selectedPage.style.display = 'block';
        }
        
        // Update page title
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            const titles = {
                overview: 'Dashboard Overview',
                users: 'User Management',
                activity: 'Activity Analytics',
                nutrition: 'Nutrition Insights',
                insights: 'Advanced Insights'
            };
            pageTitle.textContent = titles[page] || 'Dashboard';
        }
        
        // Load page-specific data if needed
        this.loadPageData(page);
    }

    async loadPageData(page) {
        switch (page) {
            case 'activity':
                await this.loadActivityData();
                break;
            case 'nutrition':
                await this.loadNutritionData();
                break;
            case 'insights':
                await this.loadInsightsData();
                break;
        }
    }

    async loadActivityData() {
        // Create activity heatmap
        const heatmapEl = document.getElementById('activityHeatmap');
        if (heatmapEl && !heatmapEl.innerHTML) {
            this.createActivityHeatmap();
        }
    }

    createActivityHeatmap() {
        const heatmapEl = document.getElementById('activityHeatmap');
        if (!heatmapEl) return;
        
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const hours = Array.from({length: 24}, (_, i) => i);
        
        let html = '<div style="display: grid; grid-template-columns: 40px repeat(24, 1fr); gap: 2px;">';
        
        // Header row with hours
        html += '<div></div>';
        hours.forEach(h => {
            html += `<div style="font-size: 10px; text-align: center;">${h}</div>`;
        });
        
        // Create heatmap grid
        days.forEach(day => {
            html += `<div style="font-size: 12px; display: flex; align-items: center;">${day}</div>`;
            hours.forEach(hour => {
                // Generate random intensity for demo
                const intensity = Math.random();
                const color = `rgba(102, 126, 234, ${intensity})`;
                html += `
                    <div class="heatmap-cell" 
                         style="background: ${color}; cursor: pointer;"
                         title="${day} ${hour}:00 - Activity: ${Math.round(intensity * 100)}%">
                    </div>
                `;
            });
        });
        
        html += '</div>';
        heatmapEl.innerHTML = html;
    }

    async loadNutritionData() {
        await this.loadTopFoods();
    }

    async loadTopFoods() {
        const topFoodsEl = document.getElementById('topFoods');
        if (!topFoodsEl) return;
        
        try {
            // Fetch food database
            const foodData = await window.cacheManager.getCachedData(
                'topFoods',
                async () => {
                    const snapshot = await db.collection(COLLECTIONS.foodDatabase)
                        .orderBy('usageCount', 'desc')
                        .limit(20)
                        .get();
                    
                    const foods = [];
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        foods.push({
                            name: data.name || doc.id,
                            count: data.usageCount || 0
                        });
                    });
                    
                    // If no usage data, use popularity field
                    if (foods.every(f => f.count === 0)) {
                        const popularSnapshot = await db.collection(COLLECTIONS.foodDatabase)
                            .orderBy('popularity', 'desc')
                            .limit(20)
                            .get();
                        
                        foods.length = 0;
                        popularSnapshot.forEach(doc => {
                            const data = doc.data();
                            foods.push({
                                name: data.name || doc.id,
                                count: data.popularity || Math.floor(Math.random() * 100)
                            });
                        });
                    }
                    
                    return foods;
                }
            );
            
            let html = '';
            foodData.forEach((food, index) => {
                html += `
                    <div class="food-item">
                        <span class="food-name">${index + 1}. ${food.name}</span>
                        <span class="food-count">${food.count}</span>
                    </div>
                `;
            });
            
            topFoodsEl.innerHTML = html || '<p>No food data available</p>';
            
        } catch (error) {
            console.error('Error loading top foods:', error);
            topFoodsEl.innerHTML = '<p>Error loading food data</p>';
        }
    }

    loadNutritionInsights() {
        // This would load real nutrition data
        console.log('Loading nutrition insights...');
    }

    async loadInsights() {
        await this.loadRetentionMetrics();
        await this.loadFeatureAdoption();
        await this.loadGoalAchievement();
    }

    async loadInsightsData() {
        // Refresh insights when navigating to insights page
        await this.loadInsights();
    }

    async loadRetentionMetrics() {
        const retentionEl = document.getElementById('retentionMetrics');
        if (!retentionEl) return;
        
        // Calculate retention based on last activity
        const users = window.analyticsManager.users || [];
        const now = new Date();
        
        const activeToday = users.filter(u => {
            if (!u.latestActivity) return false;
            const activityDate = u.latestActivity.date;
            return daysAgo(activityDate) === 'Today';
        }).length;
        
        const activeThisWeek = users.filter(u => {
            if (!u.latestActivity) return false;
            const activityDate = u.latestActivity.date;
            const daysDiff = Math.floor((now - activityDate) / (1000 * 60 * 60 * 24));
            return daysDiff <= 7;
        }).length;
        
        const activeThisMonth = users.filter(u => {
            if (!u.latestActivity) return false;
            const activityDate = u.latestActivity.date;
            const daysDiff = Math.floor((now - activityDate) / (1000 * 60 * 60 * 24));
            return daysDiff <= 30;
        }).length;
        
        const totalUsers = users.length || 1;
        
        retentionEl.innerHTML = `
            <div style="display: grid; gap: 1rem;">
                <div>
                    <strong>Daily Active Users (DAU):</strong> ${activeToday} 
                    <span style="color: #718096;">(${Math.round(activeToday / totalUsers * 100)}%)</span>
                </div>
                <div>
                    <strong>Weekly Active Users (WAU):</strong> ${activeThisWeek}
                    <span style="color: #718096;">(${Math.round(activeThisWeek / totalUsers * 100)}%)</span>
                </div>
                <div>
                    <strong>Monthly Active Users (MAU):</strong> ${activeThisMonth}
                    <span style="color: #718096;">(${Math.round(activeThisMonth / totalUsers * 100)}%)</span>
                </div>
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
                    <strong>Retention Rate:</strong> ${Math.round(activeThisWeek / totalUsers * 100)}%
                </div>
            </div>
        `;
    }

    async loadFeatureAdoption() {
        const adoptionEl = document.getElementById('featureAdoption');
        if (!adoptionEl) return;
        
        // Calculate feature adoption (would use real data)
        const features = [
            { name: 'Step Tracking', adoption: 100, icon: '🏃' },
            { name: 'Food Logging', adoption: 85, icon: '🍎' },
            { name: 'Weight Tracking', adoption: 60, icon: '⚖️' },
            { name: 'Exercise Logging', adoption: 45, icon: '💪' },
            { name: 'Recipe Creation', adoption: 30, icon: '👨‍🍳' }
        ];
        
        let html = '<div style="display: grid; gap: 0.75rem;">';
        features.forEach(feature => {
            html += `
                <div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                        <span>${feature.icon} ${feature.name}</span>
                        <span style="font-weight: 600;">${feature.adoption}%</span>
                    </div>
                    <div style="background: #e2e8f0; border-radius: 4px; height: 8px; overflow: hidden;">
                        <div style="background: #667eea; width: ${feature.adoption}%; height: 100%;"></div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        adoptionEl.innerHTML = html;
    }

    async loadGoalAchievement() {
        const achievementEl = document.getElementById('goalAchievement');
        if (!achievementEl) return;
        
        const users = window.analyticsManager.users || [];
        
        // Calculate goal achievements (simplified)
        const stepsGoalAchieved = users.filter(u => 
            (u.dailySteps || 0) >= (u.goalSteps || 10000)
        ).length;
        
        const calorieGoalAchieved = users.filter(u => 
            (u.dailyCaloriesConsumed || 0) <= (u.goalCaloriesConsumed || 2000)
        ).length;
        
        const totalUsers = users.length || 1;
        
        achievementEl.innerHTML = `
            <div style="display: grid; gap: 1rem;">
                <div class="stat-card" style="padding: 1rem;">
                    <div>🏃 Steps Goal</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: #667eea;">
                        ${Math.round(stepsGoalAchieved / totalUsers * 100)}%
                    </div>
                    <div style="font-size: 0.875rem; color: #718096;">
                        ${stepsGoalAchieved} of ${totalUsers} users
                    </div>
                </div>
                <div class="stat-card" style="padding: 1rem;">
                    <div>🍎 Calorie Goal</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: #48bb78;">
                        ${Math.round(calorieGoalAchieved / totalUsers * 100)}%
                    </div>
                    <div style="font-size: 0.875rem; color: #718096;">
                        ${calorieGoalAchieved} of ${totalUsers} users
                    </div>
                </div>
            </div>
        `;
    }

    setupExport() {
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }
    }

    async exportData() {
        const timeFilter = document.getElementById('timeFilter').value;
        const data = {
            exportDate: new Date().toISOString(),
            timeRange: timeFilter,
            users: window.analyticsManager.users,
            cacheStats: window.cacheManager.getCacheStats()
        };
        
        // Convert to CSV
        const csv = this.convertToCSV(data.users);
        
        // Download file
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rovi-dashboard-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    convertToCSV(users) {
        if (!users || users.length === 0) return 'No data available';
        
        // Define CSV headers
        const headers = [
            'User ID',
            'Email',
            'Name',
            'Created At',
            'Daily Steps',
            'Goal Steps',
            'Goal Calories',
            'Goal Protein',
            'Goal Fat',
            'Goal Carbs'
        ];
        
        // Create CSV rows
        const rows = users.map(user => [
            anonymizeUserId(user.id),
            user.email || '',
            user.name || '',
            formatDate(user.createdAt),
            user.dailySteps || 0,
            user.goalSteps || 10000,
            user.goalCaloriesConsumed || 2000,
            user.goalProtein || 50,
            user.goalFat || 50,
            user.goalCarbs || 200
        ]);
        
        // Combine headers and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        
        return csvContent;
    }
}

// Initialize dashboard manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
});