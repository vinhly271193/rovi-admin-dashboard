/* ============================================
   ROVI Insights Module
   Cross-cutting data computation functions
   Depends on dataCache being populated first
   ============================================ */

const ROVIInsights = (function() {
    'use strict';

    // Cache for computed insights (in-memory)
    const insightsCache = {};
    const CACHE_TTLS = {
        today: 10 * 60 * 1000,       // 10 minutes
        trend7: 60 * 60 * 1000,      // 1 hour
        trend30: 2 * 60 * 60 * 1000, // 2 hours
        adoption: 2 * 60 * 60 * 1000,// 2 hours
        weight: 2 * 60 * 60 * 1000,  // 2 hours
        growth: 24 * 60 * 60 * 1000  // 24 hours
    };

    function getCached(key) {
        const entry = insightsCache[key];
        if (entry && (Date.now() - entry.timestamp < entry.ttl)) {
            return entry.data;
        }
        return null;
    }

    function setCache(key, data, ttl) {
        insightsCache[key] = { data, timestamp: Date.now(), ttl };
    }

    function getLocalDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // ==========================================
    // Platform Historical Trends (Real Data)
    // ==========================================
    async function fetchPlatformHistoricalTrend(metric, days) {
        const cacheKey = `trend_${metric}_${days}`;
        const cached = getCached(cacheKey);
        if (cached) return cached;

        const db = firebase.firestore();
        const users = (typeof dataCache !== 'undefined' && dataCache.users) || [];
        const today = new Date();
        const labels = [];
        const values = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = getLocalDateString(date);
            labels.push(dateStr);
            let dayTotal = 0;

            if (metric === 'steps') {
                for (const user of users) {
                    try {
                        const doc = await db.collection('users').doc(user.id)
                            .collection('stepsData').doc(dateStr).get();
                        if (doc.exists) {
                            dayTotal += doc.data().count || 0;
                        }
                    } catch (e) { /* skip */ }
                }
            } else if (metric === 'calories') {
                for (const user of users) {
                    try {
                        const doc = await db.collection('users').doc(user.id)
                            .collection('stepsData').doc(dateStr).get();
                        if (doc.exists) {
                            dayTotal += doc.data().caloriesBurned || 0;
                        }
                    } catch (e) { /* skip */ }
                }
            } else if (metric === 'foods') {
                for (const user of users) {
                    try {
                        const doc = await db.collection('users').doc(user.id)
                            .collection('foodLog').doc(dateStr).get();
                        if (doc.exists) {
                            const meals = doc.data().meals || doc.data().entries || [];
                            dayTotal += Array.isArray(meals) ? meals.length : 0;
                        }
                    } catch (e) { /* skip */ }
                }
            } else if (metric === 'activeUsers') {
                for (const user of users) {
                    try {
                        const doc = await db.collection('users').doc(user.id)
                            .collection('stepsData').doc(dateStr).get();
                        if (doc.exists && (doc.data().count || 0) > 0) {
                            dayTotal++;
                        }
                    } catch (e) { /* skip */ }
                }
            } else if (metric === 'workoutMinutes') {
                for (const user of users) {
                    try {
                        const snap = await db.collection('users').doc(user.id)
                            .collection('activityLog')
                            .where('date', '==', dateStr)
                            .get();
                        snap.forEach(doc => {
                            dayTotal += doc.data().duration || 0;
                        });
                    } catch (e) { /* skip */ }
                }
            } else if (metric === 'caloriesBurned') {
                for (const user of users) {
                    try {
                        const snap = await db.collection('users').doc(user.id)
                            .collection('activityLog')
                            .where('date', '==', dateStr)
                            .get();
                        snap.forEach(doc => {
                            dayTotal += doc.data().caloriesBurned || 0;
                        });
                    } catch (e) { /* skip */ }
                }
            } else if (metric === 'caloriesConsumed') {
                for (const user of users) {
                    try {
                        const doc = await db.collection('users').doc(user.id)
                            .collection('foodLog').doc(dateStr).get();
                        if (doc.exists) {
                            const meals = doc.data().meals || doc.data().entries || [];
                            if (Array.isArray(meals)) {
                                meals.forEach(m => { dayTotal += m.calories || 0; });
                            }
                        }
                    } catch (e) { /* skip */ }
                }
            }

            values.push(dayTotal);
        }

        const result = { labels, values };
        const ttl = days <= 1 ? CACHE_TTLS.today : days <= 7 ? CACHE_TTLS.trend7 : CACHE_TTLS.trend30;
        setCache(cacheKey, result, ttl);
        return result;
    }

    // ==========================================
    // Compute Real Historical Data (replaces Math.random)
    // ==========================================
    async function computeRealHistoricalData() {
        const cacheKey = 'realHistorical30';
        const cached = getCached(cacheKey);
        if (cached) return cached;

        const db = firebase.firestore();
        const users = (typeof dataCache !== 'undefined' && dataCache.users) || [];
        const today = new Date();

        const historicalData = {
            steps: { days7: [], days30: [], avg7: 0, avg30: 0 },
            calories: { days7: [], days30: [], avg7: 0, avg30: 0 },
            foods: { days7: [], days30: [], avg7: 0, avg30: 0 },
            activeUsers: { days7: [], days30: [], avg7: 0, avg30: 0 }
        };

        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = getLocalDateString(date);

            let daySteps = 0, dayCalories = 0, dayFoods = 0, dayActiveUsers = 0;

            for (const user of users) {
                try {
                    const stepsDoc = await db.collection('users').doc(user.id)
                        .collection('stepsData').doc(dateStr).get();
                    if (stepsDoc.exists) {
                        const count = stepsDoc.data().count || 0;
                        daySteps += count;
                        dayCalories += stepsDoc.data().caloriesBurned || 0;
                        if (count > 0) dayActiveUsers++;
                    }
                } catch (e) { /* skip */ }

                try {
                    const foodDoc = await db.collection('users').doc(user.id)
                        .collection('foodLog').doc(dateStr).get();
                    if (foodDoc.exists) {
                        const meals = foodDoc.data().meals || foodDoc.data().entries || [];
                        dayFoods += Array.isArray(meals) ? meals.length : 0;
                    }
                } catch (e) { /* skip */ }
            }

            historicalData.steps.days30.push(daySteps);
            historicalData.calories.days30.push(dayCalories);
            historicalData.foods.days30.push(dayFoods);
            historicalData.activeUsers.days30.push(dayActiveUsers);

            if (i < 7) {
                historicalData.steps.days7.push(daySteps);
                historicalData.calories.days7.push(dayCalories);
                historicalData.foods.days7.push(dayFoods);
                historicalData.activeUsers.days7.push(dayActiveUsers);
            }
        }

        // Calculate averages
        const avg = (arr) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
        historicalData.steps.avg7 = avg(historicalData.steps.days7);
        historicalData.steps.avg30 = avg(historicalData.steps.days30);
        historicalData.calories.avg7 = avg(historicalData.calories.days7);
        historicalData.calories.avg30 = avg(historicalData.calories.days30);
        historicalData.foods.avg7 = avg(historicalData.foods.days7);
        historicalData.foods.avg30 = avg(historicalData.foods.days30);
        historicalData.activeUsers.avg7 = avg(historicalData.activeUsers.days7);
        historicalData.activeUsers.avg30 = avg(historicalData.activeUsers.days30);

        setCache(cacheKey, historicalData, CACHE_TTLS.trend30);
        return historicalData;
    }

    // ==========================================
    // Compute Week-over-Week Trend Percentages
    // ==========================================
    function computeTrendPercentage(days7) {
        if (!days7 || days7.length < 7) return 0;
        const thisWeek = days7.slice(Math.floor(days7.length / 2));
        const lastWeek = days7.slice(0, Math.floor(days7.length / 2));
        const thisAvg = thisWeek.reduce((a, b) => a + b, 0) / thisWeek.length;
        const lastAvg = lastWeek.reduce((a, b) => a + b, 0) / lastWeek.length;
        if (lastAvg === 0) return thisAvg > 0 ? 100 : 0;
        return Math.round(((thisAvg - lastAvg) / lastAvg) * 100);
    }

    // ==========================================
    // Real Feature Adoption
    // ==========================================
    async function computeFeatureAdoption() {
        const cacheKey = 'featureAdoption';
        const cached = getCached(cacheKey);
        if (cached) return cached;

        const db = firebase.firestore();
        const users = (typeof dataCache !== 'undefined' && dataCache.users) || [];
        const totalUsers = users.length || 1;

        const features = {
            'Steps Tracking': 0,
            'Food Logging': 0,
            'Activity Log': 0,
            'Weight Tracking': 0,
            'Recipes': 0,
            'Custom Barcodes': 0
        };

        const collections = [
            ['stepsData', 'Steps Tracking'],
            ['foodLog', 'Food Logging'],
            ['activityLog', 'Activity Log'],
            ['weightLog', 'Weight Tracking'],
            ['recipes', 'Recipes'],
            ['customBarcodes', 'Custom Barcodes']
        ];

        for (const user of users) {
            for (const [collName, featureName] of collections) {
                try {
                    const snap = await db.collection('users').doc(user.id)
                        .collection(collName).limit(1).get();
                    if (!snap.empty) {
                        features[featureName]++;
                    }
                } catch (e) { /* skip */ }
            }
        }

        const result = {
            labels: Object.keys(features),
            counts: Object.values(features),
            percentages: Object.values(features).map(c => Math.round(c / totalUsers * 100))
        };

        setCache(cacheKey, result, CACHE_TTLS.adoption);
        return result;
    }

    // ==========================================
    // Real Streak Heatmap Data
    // ==========================================
    async function computeStreakHeatmapData() {
        const cacheKey = 'streakHeatmap';
        const cached = getCached(cacheKey);
        if (cached) return cached;

        const db = firebase.firestore();
        const users = (typeof dataCache !== 'undefined' && dataCache.users) || [];
        const today = new Date();
        const activityByDate = {};

        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = getLocalDateString(date);
            activityByDate[dateStr] = 0;
        }

        for (const user of users) {
            for (const dateStr of Object.keys(activityByDate)) {
                try {
                    const doc = await db.collection('users').doc(user.id)
                        .collection('stepsData').doc(dateStr).get();
                    if (doc.exists && (doc.data().count || 0) > 0) {
                        activityByDate[dateStr]++;
                    }
                } catch (e) { /* skip */ }
            }
        }

        // Normalize to 0-1 intensity
        const maxActive = Math.max(...Object.values(activityByDate), 1);
        const result = Object.entries(activityByDate).map(([date, count]) => ({
            date,
            count,
            intensity: count / maxActive
        }));

        setCache(cacheKey, result, CACHE_TTLS.trend30);
        return result;
    }

    // ==========================================
    // Real Churn Risk
    // ==========================================
    function computeChurnRisk() {
        const users = (typeof dataCache !== 'undefined' && dataCache.users) || [];
        const now = Date.now();
        const riskUsers = [];

        users.forEach(user => {
            let lastActiveTs = null;

            // Check lastActive, lastLogin, or updatedAt fields
            if (user.lastActive) {
                lastActiveTs = user.lastActive.toDate ? user.lastActive.toDate().getTime() : new Date(user.lastActive).getTime();
            } else if (user.lastLogin) {
                lastActiveTs = user.lastLogin.toDate ? user.lastLogin.toDate().getTime() : new Date(user.lastLogin).getTime();
            } else if (user.updatedAt) {
                lastActiveTs = user.updatedAt.toDate ? user.updatedAt.toDate().getTime() : new Date(user.updatedAt).getTime();
            }

            if (lastActiveTs) {
                const daysSinceActive = (now - lastActiveTs) / (1000 * 60 * 60 * 24);
                const riskScore = Math.min(95, Math.round(daysSinceActive * 4.5));

                if (riskScore > 20) {
                    riskUsers.push({
                        name: user.name || user.email || 'Unknown',
                        risk: riskScore,
                        lastActive: Math.round(daysSinceActive)
                    });
                }
            }
        });

        riskUsers.sort((a, b) => b.risk - a.risk);
        return riskUsers;
    }

    // ==========================================
    // Growth Analytics (uses already-loaded user data)
    // ==========================================
    function computeGrowthData() {
        const cacheKey = 'growthData';
        const cached = getCached(cacheKey);
        if (cached) return cached;

        const users = (typeof dataCache !== 'undefined' && dataCache.users) || [];
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        const thisWeekStart = new Date(now);
        thisWeekStart.setDate(now.getDate() - now.getDay());
        thisWeekStart.setHours(0, 0, 0, 0);

        // Monthly signup data
        const monthlySignups = {};
        const dayOfWeekSignups = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
        let newThisMonth = 0;
        let newThisWeek = 0;

        users.forEach(user => {
            let createdAt = null;
            if (user.createdAt) {
                createdAt = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
            } else if (user.created) {
                createdAt = user.created.toDate ? user.created.toDate() : new Date(user.created);
            }

            if (createdAt && !isNaN(createdAt.getTime())) {
                const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
                monthlySignups[key] = (monthlySignups[key] || 0) + 1;
                dayOfWeekSignups[createdAt.getDay()]++;

                if (createdAt.getMonth() === thisMonth && createdAt.getFullYear() === thisYear) {
                    newThisMonth++;
                }
                if (createdAt >= thisWeekStart) {
                    newThisWeek++;
                }
            }
        });

        // Sort months and compute cumulative
        const sortedMonths = Object.keys(monthlySignups).sort();
        const monthLabels = sortedMonths;
        const monthValues = sortedMonths.map(k => monthlySignups[k]);
        const cumulativeValues = [];
        let cumTotal = 0;
        monthValues.forEach(v => {
            cumTotal += v;
            cumulativeValues.push(cumTotal);
        });

        // Growth rate
        const prevMonth = monthValues.length >= 2 ? monthValues[monthValues.length - 2] : 0;
        const currentMonth = monthValues.length >= 1 ? monthValues[monthValues.length - 1] : 0;
        const growthRate = prevMonth > 0 ? Math.round(((currentMonth - prevMonth) / prevMonth) * 100) : 0;

        const result = {
            totalUsers: users.length,
            newThisMonth,
            newThisWeek,
            growthRate,
            monthLabels,
            monthValues,
            cumulativeValues,
            dayOfWeekSignups,
            dayLabels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        };

        setCache(cacheKey, result, CACHE_TTLS.growth);
        return result;
    }

    // ==========================================
    // Cohort Retention
    // ==========================================
    function computeCohortRetention() {
        const cacheKey = 'cohortRetention';
        const cached = getCached(cacheKey);
        if (cached) return cached;

        const users = (typeof dataCache !== 'undefined' && dataCache.users) || [];
        const now = new Date();
        const cohorts = {};

        users.forEach(user => {
            let createdAt = null;
            if (user.createdAt) {
                createdAt = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
            } else if (user.created) {
                createdAt = user.created.toDate ? user.created.toDate() : new Date(user.created);
            }

            if (!createdAt || isNaN(createdAt.getTime())) return;

            const cohortKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
            if (!cohorts[cohortKey]) cohorts[cohortKey] = { total: 0, active: {} };
            cohorts[cohortKey].total++;

            // Check if still active based on lastActive/lastLogin
            let lastActiveDate = null;
            if (user.lastActive) {
                lastActiveDate = user.lastActive.toDate ? user.lastActive.toDate() : new Date(user.lastActive);
            } else if (user.lastLogin) {
                lastActiveDate = user.lastLogin.toDate ? user.lastLogin.toDate() : new Date(user.lastLogin);
            }

            if (lastActiveDate && !isNaN(lastActiveDate.getTime())) {
                const monthsActive = Math.floor((lastActiveDate - createdAt) / (30 * 24 * 60 * 60 * 1000));
                for (let m = 0; m <= Math.min(monthsActive, 5); m++) {
                    cohorts[cohortKey].active[m] = (cohorts[cohortKey].active[m] || 0) + 1;
                }
            }
        });

        const sortedCohorts = Object.keys(cohorts).sort().slice(-6);
        const result = sortedCohorts.map(key => ({
            month: key,
            total: cohorts[key].total,
            retention: [0, 1, 2, 3].map(m => {
                const active = cohorts[key].active[m] || 0;
                return cohorts[key].total > 0 ? Math.round(active / cohorts[key].total * 100) : 0;
            })
        }));

        setCache(cacheKey, result, CACHE_TTLS.growth);
        return result;
    }

    // ==========================================
    // Workout Analytics
    // ==========================================
    async function computeWorkoutAnalytics() {
        const cacheKey = 'workoutAnalytics';
        const cached = getCached(cacheKey);
        if (cached) return cached;

        const db = firebase.firestore();
        const users = (typeof dataCache !== 'undefined' && dataCache.users) || [];
        const today = new Date();

        const activityTypes = {};
        let totalSessions = 0;
        let totalDuration = 0;
        let totalCalBurned = 0;
        const dailyMinutes = [];
        const dailyCalories = [];
        const dailyLabels = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = getLocalDateString(date);
            dailyLabels.push(dateStr);
            let dayMin = 0, dayCal = 0;

            for (const user of users) {
                try {
                    const snap = await db.collection('users').doc(user.id)
                        .collection('activityLog')
                        .where('date', '==', dateStr)
                        .get();
                    snap.forEach(doc => {
                        const d = doc.data();
                        const name = d.name || d.type || 'Other';
                        activityTypes[name] = (activityTypes[name] || 0) + 1;
                        totalSessions++;
                        totalDuration += d.duration || 0;
                        totalCalBurned += d.caloriesBurned || 0;
                        dayMin += d.duration || 0;
                        dayCal += d.caloriesBurned || 0;
                    });
                } catch (e) { /* skip */ }
            }

            dailyMinutes.push(dayMin);
            dailyCalories.push(dayCal);
        }

        // Sort activity types by count
        const sortedTypes = Object.entries(activityTypes).sort((a, b) => b[1] - a[1]);
        const topActivities = sortedTypes.slice(0, 10);
        const mostPopular = sortedTypes.length > 0 ? sortedTypes[0][0] : 'N/A';

        const result = {
            activityTypes: { labels: sortedTypes.map(t => t[0]), values: sortedTypes.map(t => t[1]) },
            topActivities: { labels: topActivities.map(t => t[0]), values: topActivities.map(t => t[1]) },
            dailyMinutes: { labels: dailyLabels, values: dailyMinutes },
            dailyCalories: { labels: dailyLabels, values: dailyCalories },
            kpis: {
                totalSessions,
                avgDuration: totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0,
                totalCalBurned,
                mostPopular
            }
        };

        setCache(cacheKey, result, CACHE_TTLS.trend7);
        return result;
    }

    // ==========================================
    // Nutrition Intelligence
    // ==========================================
    async function computeNutritionData() {
        const cacheKey = 'nutritionData';
        const cached = getCached(cacheKey);
        if (cached) return cached;

        const db = firebase.firestore();
        const users = (typeof dataCache !== 'undefined' && dataCache.users) || [];
        const today = new Date();

        const foodCounts = {};
        const mealTypes = { breakfast: 0, lunch: 0, dinner: 0, snacks: 0 };
        let totalMeals = 0;
        let totalCalories = 0;
        let totalProtein = 0, totalCarbs = 0, totalFat = 0;
        let daysWithLogs = 0, totalLogDays = 0;
        const dailyCalories = [];
        const dailyLabels = [];

        // Collect platform avg goals
        let goalProtein = 0, goalCarbs = 0, goalFat = 0, goalCount = 0;
        users.forEach(u => {
            if (u.goalProtein || u.goalCarbs || u.goalFat) {
                goalProtein += u.goalProtein || 0;
                goalCarbs += u.goalCarbs || 0;
                goalFat += u.goalFat || 0;
                goalCount++;
            }
        });

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = getLocalDateString(date);
            dailyLabels.push(dateStr);
            let dayCal = 0;

            for (const user of users) {
                try {
                    const doc = await db.collection('users').doc(user.id)
                        .collection('foodLog').doc(dateStr).get();
                    if (doc.exists) {
                        const meals = doc.data().meals || doc.data().entries || [];
                        if (Array.isArray(meals) && meals.length > 0) {
                            totalLogDays++;
                            daysWithLogs++;
                            meals.forEach(meal => {
                                totalMeals++;
                                const cal = meal.calories || 0;
                                dayCal += cal;
                                totalCalories += cal;
                                totalProtein += meal.protein || 0;
                                totalCarbs += meal.carbs || 0;
                                totalFat += meal.fat || 0;

                                // Count food names
                                const fname = meal.name || meal.foodName || 'Unknown';
                                foodCounts[fname] = (foodCounts[fname] || 0) + 1;

                                // Classify meal type
                                const mealType = (meal.mealType || meal.type || '').toLowerCase();
                                if (mealType.includes('breakfast')) mealTypes.breakfast++;
                                else if (mealType.includes('lunch')) mealTypes.lunch++;
                                else if (mealType.includes('dinner')) mealTypes.dinner++;
                                else mealTypes.snacks++;
                            });
                        }
                    }
                } catch (e) { /* skip */ }
            }

            dailyCalories.push(dayCal);
        }

        // Top 15 foods
        const sortedFoods = Object.entries(foodCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);

        const result = {
            topFoods: { labels: sortedFoods.map(f => f[0]), values: sortedFoods.map(f => f[1]) },
            mealTypes,
            macros: {
                actual: {
                    protein: totalMeals > 0 ? Math.round(totalProtein / totalMeals) : 0,
                    carbs: totalMeals > 0 ? Math.round(totalCarbs / totalMeals) : 0,
                    fat: totalMeals > 0 ? Math.round(totalFat / totalMeals) : 0
                },
                goals: {
                    protein: goalCount > 0 ? Math.round(goalProtein / goalCount) : 0,
                    carbs: goalCount > 0 ? Math.round(goalCarbs / goalCount) : 0,
                    fat: goalCount > 0 ? Math.round(goalFat / goalCount) : 0
                }
            },
            dailyCalories: { labels: dailyLabels, values: dailyCalories },
            kpis: {
                totalMeals,
                avgCaloriesPerDay: dailyCalories.length > 0 ? Math.round(dailyCalories.reduce((a, b) => a + b, 0) / dailyCalories.length) : 0,
                mostLoggedFood: sortedFoods.length > 0 ? sortedFoods[0][0] : 'N/A',
                loggingConsistency: users.length > 0 && totalLogDays > 0 ? Math.round(daysWithLogs / (users.length * 7) * 100) : 0
            }
        };

        setCache(cacheKey, result, CACHE_TTLS.trend7);
        return result;
    }

    // ==========================================
    // Weight Tracking
    // ==========================================
    async function computeWeightData() {
        const cacheKey = 'weightData';
        const cached = getCached(cacheKey);
        if (cached) return cached;

        const db = firebase.firestore();
        const users = (typeof dataCache !== 'undefined' && dataCache.users) || [];

        const userWeights = [];
        const weeklyAvgs = {};
        let totalChange = 0;
        let usersTracking = 0;
        let biggestLoss = 0, biggestGain = 0;
        const distribution = {
            'Lost 5kg+': 0,
            'Lost 2-5kg': 0,
            'Maintained': 0,
            'Gained 2-5kg': 0,
            'Gained 5kg+': 0
        };

        for (const user of users) {
            try {
                // Get first and last weight entry
                const firstSnap = await db.collection('users').doc(user.id)
                    .collection('weightLog')
                    .orderBy('date', 'asc')
                    .limit(1)
                    .get();

                const lastSnap = await db.collection('users').doc(user.id)
                    .collection('weightLog')
                    .orderBy('date', 'desc')
                    .limit(1)
                    .get();

                if (!firstSnap.empty && !lastSnap.empty) {
                    usersTracking++;
                    const firstWeight = firstSnap.docs[0].data().weight || firstSnap.docs[0].data().value || 0;
                    const lastWeight = lastSnap.docs[0].data().weight || lastSnap.docs[0].data().value || 0;
                    const delta = lastWeight - firstWeight;
                    totalChange += delta;

                    if (delta < biggestLoss) biggestLoss = delta;
                    if (delta > biggestGain) biggestGain = delta;

                    userWeights.push({
                        name: user.name || user.email || 'Unknown',
                        startWeight: firstWeight,
                        currentWeight: lastWeight,
                        delta: Math.round(delta * 10) / 10,
                        startDate: firstSnap.docs[0].data().date || ''
                    });

                    // Categorize
                    if (delta <= -5) distribution['Lost 5kg+']++;
                    else if (delta <= -2) distribution['Lost 2-5kg']++;
                    else if (delta < 2) distribution['Maintained']++;
                    else if (delta < 5) distribution['Gained 2-5kg']++;
                    else distribution['Gained 5kg+']++;

                    // Weekly averages from last entry's date
                    const lastDate = lastSnap.docs[0].data().date || '';
                    if (lastDate) {
                        const weekKey = lastDate.substring(0, 7); // YYYY-MM
                        if (!weeklyAvgs[weekKey]) weeklyAvgs[weekKey] = { total: 0, count: 0 };
                        weeklyAvgs[weekKey].total += lastWeight;
                        weeklyAvgs[weekKey].count++;
                    }
                }
            } catch (e) { /* skip */ }
        }

        // Build weekly trend
        const sortedWeeks = Object.keys(weeklyAvgs).sort();
        const weekLabels = sortedWeeks;
        const weekValues = sortedWeeks.map(k => Math.round(weeklyAvgs[k].total / weeklyAvgs[k].count * 10) / 10);

        const result = {
            distribution,
            userWeights: userWeights.sort((a, b) => a.delta - b.delta),
            weeklyTrend: { labels: weekLabels, values: weekValues },
            kpis: {
                usersTracking,
                avgChange: usersTracking > 0 ? Math.round(totalChange / usersTracking * 10) / 10 : 0,
                biggestLoss: Math.round(biggestLoss * 10) / 10,
                biggestGain: Math.round(biggestGain * 10) / 10
            }
        };

        setCache(cacheKey, result, CACHE_TTLS.weight);
        return result;
    }

    // ==========================================
    // Public API
    // ==========================================
    return {
        fetchPlatformHistoricalTrend,
        computeRealHistoricalData,
        computeTrendPercentage,
        computeFeatureAdoption,
        computeStreakHeatmapData,
        computeChurnRisk,
        computeGrowthData,
        computeCohortRetention,
        computeWorkoutAnalytics,
        computeNutritionData,
        computeWeightData,
        clearCache: function() {
            Object.keys(insightsCache).forEach(k => delete insightsCache[k]);
        }
    };
})();
