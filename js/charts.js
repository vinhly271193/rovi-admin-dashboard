// Chart Management and Visualizations
class ChartManager {
    constructor() {
        this.charts = {};
        this.colors = {
            primary: '#667eea',
            success: '#48bb78',
            warning: '#ed8936',
            danger: '#e53e3e',
            info: '#4299e1',
            gray: '#a0aec0'
        };
    }

    initCharts() {
        // Initialize all charts
        this.initActivityChart();
        this.initStepsChart();
        this.initExerciseChart();
        this.initMealChart();
        this.initMacroChart();
        this.initCalorieChart();
        this.initActiveDaysChart();
        this.initUsageHeatmap();
    }

    initActivityChart() {
        const ctx = document.getElementById('activityChart');
        if (!ctx) return;

        this.charts.activity = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.getLast7Days(),
                datasets: [{
                    label: 'Active Users',
                    data: [5, 6, 7, 5, 6, 7, 7], // Sample data
                    borderColor: this.colors.primary,
                    backgroundColor: this.colors.primary + '20',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    initStepsChart() {
        const ctx = document.getElementById('stepsChart');
        if (!ctx) return;

        this.charts.steps = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['0-5k', '5k-10k', '10k-15k', '15k-20k', '20k+'],
                datasets: [{
                    label: 'Users',
                    data: [1, 2, 3, 1, 0], // Sample distribution
                    backgroundColor: this.colors.success
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    initExerciseChart() {
        const ctx = document.getElementById('exerciseChart');
        if (!ctx) return;

        this.charts.exercise = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['0-30', '30-60', '60-90', '90-120', '120+'],
                datasets: [{
                    label: 'Users',
                    data: [2, 3, 1, 1, 0], // Sample data
                    backgroundColor: this.colors.warning
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Minutes per Day'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    initMealChart() {
        const ctx = document.getElementById('mealChart');
        if (!ctx) return;

        this.charts.meal = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Breakfast', 'Lunch', 'Dinner', 'Snacks'],
                datasets: [{
                    data: [25, 35, 30, 10], // Sample percentages
                    backgroundColor: [
                        this.colors.primary,
                        this.colors.success,
                        this.colors.warning,
                        this.colors.info
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    initMacroChart() {
        const ctx = document.getElementById('macroChart');
        if (!ctx) return;

        this.charts.macro = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Protein', 'Carbs', 'Fat'],
                datasets: [{
                    label: 'Average',
                    data: [80, 120, 60], // Sample macro data
                    borderColor: this.colors.primary,
                    backgroundColor: this.colors.primary + '20',
                    pointBackgroundColor: this.colors.primary
                }, {
                    label: 'Goal',
                    data: [75, 200, 50], // Sample goal data
                    borderColor: this.colors.gray,
                    backgroundColor: this.colors.gray + '20',
                    pointBackgroundColor: this.colors.gray,
                    borderDash: [5, 5]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    initCalorieChart() {
        const ctx = document.getElementById('calorieChart');
        if (!ctx) return;

        this.charts.calorie = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.getLast7Days(),
                datasets: [{
                    label: 'Consumed',
                    data: [1800, 2100, 1900, 2200, 2000, 1950, 2100], // Sample data
                    borderColor: this.colors.success,
                    backgroundColor: this.colors.success + '20',
                    tension: 0.4
                }, {
                    label: 'Burned',
                    data: [500, 600, 450, 700, 550, 600, 650], // Sample data
                    borderColor: this.colors.danger,
                    backgroundColor: this.colors.danger + '20',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    }

    initActiveDaysChart() {
        const ctx = document.getElementById('activeDaysChart');
        if (!ctx) return;

        this.charts.activeDays = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Active Users',
                    data: [5, 6, 7, 6, 7, 4, 3], // Sample data
                    backgroundColor: [
                        this.colors.primary,
                        this.colors.primary,
                        this.colors.success,
                        this.colors.primary,
                        this.colors.success,
                        this.colors.warning,
                        this.colors.warning
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    initUsageHeatmap() {
        const ctx = document.getElementById('usageHeatmap');
        if (!ctx) return;

        // Create a simple heatmap using Chart.js matrix
        const hours = Array.from({length: 24}, (_, i) => `${i}:00`);
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        // Generate sample heatmap data
        const data = [];
        for (let d = 0; d < 7; d++) {
            for (let h = 0; h < 24; h++) {
                // Simulate higher activity during typical waking hours
                const intensity = (h >= 6 && h <= 22) ? 
                    Math.random() * 100 : 
                    Math.random() * 20;
                data.push({
                    x: h,
                    y: d,
                    v: Math.round(intensity)
                });
            }
        }

        this.charts.usage = new Chart(ctx, {
            type: 'bubble',
            data: {
                datasets: [{
                    label: 'Activity',
                    data: data.map(d => ({
                        x: d.x,
                        y: d.y,
                        r: d.v / 10 // Scale bubble size
                    })),
                    backgroundColor: context => {
                        const value = context.raw.r * 10;
                        const alpha = value / 100;
                        return `rgba(102, 126, 234, ${alpha})`;
                    }
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const hour = hours[context.raw.x];
                                const day = days[context.raw.y];
                                const value = Math.round(context.raw.r * 10);
                                return `${day} ${hour}: ${value} activities`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        min: 0,
                        max: 23,
                        ticks: {
                            stepSize: 1,
                            callback: (value) => hours[value]
                        },
                        title: {
                            display: true,
                            text: 'Hour of Day'
                        }
                    },
                    y: {
                        type: 'linear',
                        min: 0,
                        max: 6,
                        ticks: {
                            stepSize: 1,
                            callback: (value) => days[value]
                        },
                        title: {
                            display: true,
                            text: 'Day of Week'
                        }
                    }
                }
            }
        });
    }

    updateChartsWithData(data) {
        // Update charts with real data
        // This method would be called when real Firebase data is loaded
        
        if (this.charts.activity && data.activityTrend) {
            this.charts.activity.data.datasets[0].data = data.activityTrend;
            this.charts.activity.update();
        }
        
        if (this.charts.steps && data.stepsDistribution) {
            this.charts.steps.data.datasets[0].data = data.stepsDistribution;
            this.charts.steps.update();
        }
        
        // Update other charts similarly...
    }

    getLast7Days() {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toLocaleDateString('en', { weekday: 'short' }));
        }
        return days;
    }

    destroyCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    }
}

// Initialize chart manager
window.chartManager = new ChartManager();