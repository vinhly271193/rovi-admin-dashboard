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
        const dateStrs = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = getLocalDateString(date);
            labels.push(dateStr);
            dateStrs.push(dateStr);
        }

        // Determine which collection to query based on metric
        const needsSteps = ['steps', 'calories', 'activeUsers'].includes(metric);
        const needsFood = ['foods', 'caloriesConsumed'].includes(metric);
        const needsActivity = ['workoutMinutes', 'caloriesBurned'].includes(metric);

        // Fire ALL reads in parallel
        const allPromises = [];
        for (const dateStr of dateStrs) {
            for (const user of users) {
                if (needsSteps) {
                    allPromises.push(
                        db.collection('users').doc(user.id).collection('stepsData').doc(dateStr).get()
                            .then(doc => ({ dateStr, doc, type: 'steps' }))
                            .catch(() => null)
                    );
                } else if (needsFood) {
                    allPromises.push(
                        db.collection('users').doc(user.id).collection('foodLog').doc(dateStr).get()
                            .then(doc => ({ dateStr, doc, type: 'food' }))
                            .catch(() => null)
                    );
                } else if (needsActivity) {
                    allPromises.push(
                        db.collection('users').doc(user.id).collection('activityLog')
                            .where('date', '==', dateStr).get()
                            .then(snap => ({ dateStr, snap, type: 'activity' }))
                            .catch(() => null)
                    );
                }
            }
        }

        const results = await Promise.all(allPromises);

        // Aggregate by date
        const dayTotals = {};
        dateStrs.forEach(d => { dayTotals[d] = 0; });

        for (const r of results) {
            if (!r) continue;
            if (r.type === 'steps' && r.doc && r.doc.exists) {
                const data = r.doc.data();
                if (metric === 'steps') dayTotals[r.dateStr] += data.count || 0;
                else if (metric === 'calories') dayTotals[r.dateStr] += data.caloriesBurned || 0;
                else if (metric === 'activeUsers' && (data.count || 0) > 0) dayTotals[r.dateStr]++;
            } else if (r.type === 'food' && r.doc && r.doc.exists) {
                const data = r.doc.data();
                if (metric === 'foods') {
                    const meals = data.meals || data.entries || [];
                    dayTotals[r.dateStr] += Array.isArray(meals) ? meals.length : 0;
                } else if (metric === 'caloriesConsumed') {
                    const meals = data.meals || data.entries || [];
                    if (Array.isArray(meals)) meals.forEach(m => { dayTotals[r.dateStr] += m.calories || 0; });
                }
            } else if (r.type === 'activity' && r.snap) {
                r.snap.forEach(doc => {
                    if (metric === 'workoutMinutes') dayTotals[r.dateStr] += doc.data().duration || 0;
                    else if (metric === 'caloriesBurned') dayTotals[r.dateStr] += doc.data().caloriesBurned || 0;
                });
            }
        }

        const values = dateStrs.map(d => dayTotals[d]);
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

        // Build all dates
        const dates = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            dates.push({ i, dateStr: getLocalDateString(date) });
        }

        // Fire ALL reads in parallel (steps + food for each user x day)
        const allPromises = [];
        for (const { i, dateStr } of dates) {
            for (const user of users) {
                allPromises.push(
                    db.collection('users').doc(user.id)
                        .collection('stepsData').doc(dateStr).get()
                        .then(doc => ({ type: 'steps', dayIdx: i, dateStr, doc }))
                        .catch(() => ({ type: 'steps', dayIdx: i, dateStr, doc: null }))
                );
                allPromises.push(
                    db.collection('users').doc(user.id)
                        .collection('foodLog').doc(dateStr).get()
                        .then(doc => ({ type: 'food', dayIdx: i, dateStr, doc }))
                        .catch(() => ({ type: 'food', dayIdx: i, dateStr, doc: null }))
                );
            }
        }

        const results = await Promise.all(allPromises);

        // Aggregate by day
        const dayData = {};
        for (const { i, dateStr } of dates) {
            dayData[dateStr] = { steps: 0, calories: 0, foods: 0, activeUsers: 0, activeSet: new Set() };
        }

        for (const r of results) {
            const d = dayData[r.dateStr];
            if (!d || !r.doc || !r.doc.exists) continue;
            if (r.type === 'steps') {
                const data = r.doc.data();
                const count = data.count || 0;
                d.steps += count;
                d.calories += data.caloriesBurned || 0;
                if (count > 0) d.activeUsers++;
            } else {
                const data = r.doc.data();
                const meals = data.meals || data.entries || [];
                d.foods += Array.isArray(meals) ? meals.length : 0;
            }
        }

        const historicalData = {
            steps: { days7: [], days30: [], avg7: 0, avg30: 0 },
            calories: { days7: [], days30: [], avg7: 0, avg30: 0 },
            foods: { days7: [], days30: [], avg7: 0, avg30: 0 },
            activeUsers: { days7: [], days30: [], avg7: 0, avg30: 0 }
        };

        for (const { i, dateStr } of dates) {
            const d = dayData[dateStr];
            historicalData.steps.days30.push(d.steps);
            historicalData.calories.days30.push(d.calories);
            historicalData.foods.days30.push(d.foods);
            historicalData.activeUsers.days30.push(d.activeUsers);
            if (i < 7) {
                historicalData.steps.days7.push(d.steps);
                historicalData.calories.days7.push(d.calories);
                historicalData.foods.days7.push(d.foods);
                historicalData.activeUsers.days7.push(d.activeUsers);
            }
        }

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

        // Fire ALL user x collection reads in parallel
        const allPromises = [];
        for (const user of users) {
            for (const [collName, featureName] of collections) {
                allPromises.push(
                    db.collection('users').doc(user.id)
                        .collection(collName).limit(1).get()
                        .then(snap => ({ featureName, hasData: !snap.empty }))
                        .catch(() => ({ featureName, hasData: false }))
                );
            }
        }

        const results = await Promise.all(allPromises);

        for (const r of results) {
            if (r.hasData) {
                features[r.featureName]++;
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

        // Fire ALL user x date reads in parallel
        const allPromises = [];
        const dateKeys = Object.keys(activityByDate);
        for (const user of users) {
            for (const dateStr of dateKeys) {
                allPromises.push(
                    db.collection('users').doc(user.id)
                        .collection('stepsData').doc(dateStr).get()
                        .then(doc => ({ dateStr, doc }))
                        .catch(() => ({ dateStr, doc: null }))
                );
            }
        }

        const results = await Promise.all(allPromises);

        for (const r of results) {
            if (r.doc && r.doc.exists && (r.doc.data().count || 0) > 0) {
                activityByDate[r.dateStr]++;
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

        // Build date list and fire ALL day x user reads in parallel
        const dateStrs = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = getLocalDateString(date);
            dailyLabels.push(dateStr);
            dateStrs.push(dateStr);
        }

        const allPromises = [];
        for (const dateStr of dateStrs) {
            for (const user of users) {
                allPromises.push(
                    db.collection('users').doc(user.id)
                        .collection('activityLog')
                        .where('date', '==', dateStr)
                        .get()
                        .then(snap => ({ dateStr, snap }))
                        .catch(() => ({ dateStr, snap: null }))
                );
            }
        }

        const results = await Promise.all(allPromises);

        // Aggregate results by date
        const dayMinMap = {};
        const dayCalMap = {};
        dateStrs.forEach(d => { dayMinMap[d] = 0; dayCalMap[d] = 0; });

        for (const r of results) {
            if (r.snap) {
                r.snap.forEach(doc => {
                    const d = doc.data();
                    const name = d.name || d.type || 'Other';
                    activityTypes[name] = (activityTypes[name] || 0) + 1;
                    totalSessions++;
                    totalDuration += d.duration || 0;
                    totalCalBurned += d.caloriesBurned || 0;
                    dayMinMap[r.dateStr] += d.duration || 0;
                    dayCalMap[r.dateStr] += d.caloriesBurned || 0;
                });
            }
        }

        for (const dateStr of dateStrs) {
            dailyMinutes.push(dayMinMap[dateStr]);
            dailyCalories.push(dayCalMap[dateStr]);
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

        // Build date list and fire ALL day x user reads in parallel
        const dateStrs = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = getLocalDateString(date);
            dailyLabels.push(dateStr);
            dateStrs.push(dateStr);
        }

        const allPromises = [];
        for (const dateStr of dateStrs) {
            for (const user of users) {
                allPromises.push(
                    db.collection('users').doc(user.id)
                        .collection('foodLog').doc(dateStr).get()
                        .then(doc => ({ dateStr, doc }))
                        .catch(() => ({ dateStr, doc: null }))
                );
            }
        }

        const results = await Promise.all(allPromises);

        // Aggregate results by date
        const dayCalMap = {};
        dateStrs.forEach(d => { dayCalMap[d] = 0; });

        for (const r of results) {
            if (r.doc && r.doc.exists) {
                const meals = r.doc.data().meals || r.doc.data().entries || [];
                if (Array.isArray(meals) && meals.length > 0) {
                    totalLogDays++;
                    daysWithLogs++;
                    meals.forEach(meal => {
                        totalMeals++;
                        const cal = meal.calories || 0;
                        dayCalMap[r.dateStr] += cal;
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
        }

        for (const dateStr of dateStrs) {
            dailyCalories.push(dayCalMap[dateStr]);
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

        // Fire ALL first/last weight reads in parallel (2 queries per user)
        const allPromises = [];
        for (const user of users) {
            allPromises.push(
                Promise.all([
                    db.collection('users').doc(user.id)
                        .collection('weightLog')
                        .orderBy('date', 'asc')
                        .limit(1)
                        .get(),
                    db.collection('users').doc(user.id)
                        .collection('weightLog')
                        .orderBy('date', 'desc')
                        .limit(1)
                        .get()
                ]).then(([firstSnap, lastSnap]) => ({ user, firstSnap, lastSnap }))
                  .catch(() => ({ user, firstSnap: null, lastSnap: null }))
            );
        }

        const results = await Promise.all(allPromises);

        for (const r of results) {
            if (!r.firstSnap || !r.lastSnap) continue;
            if (!r.firstSnap.empty && !r.lastSnap.empty) {
                usersTracking++;
                const firstWeight = r.firstSnap.docs[0].data().weight || r.firstSnap.docs[0].data().value || 0;
                const lastWeight = r.lastSnap.docs[0].data().weight || r.lastSnap.docs[0].data().value || 0;
                const delta = lastWeight - firstWeight;
                totalChange += delta;

                if (delta < biggestLoss) biggestLoss = delta;
                if (delta > biggestGain) biggestGain = delta;

                userWeights.push({
                    name: r.user.name || r.user.email || 'Unknown',
                    startWeight: firstWeight,
                    currentWeight: lastWeight,
                    delta: Math.round(delta * 10) / 10,
                    startDate: r.firstSnap.docs[0].data().date || ''
                });

                // Categorize
                if (delta <= -5) distribution['Lost 5kg+']++;
                else if (delta <= -2) distribution['Lost 2-5kg']++;
                else if (delta < 2) distribution['Maintained']++;
                else if (delta < 5) distribution['Gained 2-5kg']++;
                else distribution['Gained 5kg+']++;

                // Weekly averages from last entry's date
                const lastDate = r.lastSnap.docs[0].data().date || '';
                if (lastDate) {
                    const weekKey = lastDate.substring(0, 7); // YYYY-MM
                    if (!weeklyAvgs[weekKey]) weeklyAvgs[weekKey] = { total: 0, count: 0 };
                    weeklyAvgs[weekKey].total += lastWeight;
                    weeklyAvgs[weekKey].count++;
                }
            }
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
