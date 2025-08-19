# 🚀 ROVI Super Admin Dashboard

A zero-cost, real-time analytics dashboard for monitoring ROVI app usage, built with Firebase and hosted on GitHub Pages.

## 📊 Features

### Core Analytics
- **User Overview**: Total users, growth trends, active/inactive status
- **Activity Tracking**: Steps leaderboard, exercise patterns, most active days
- **Nutrition Insights**: Most logged foods, meal distribution, macro tracking
- **Advanced Insights**: Retention rates, feature adoption, goal achievement

### Cost Optimization
- **Smart Caching**: 1-hour cache to minimize Firebase reads
- **Manual Refresh**: Control when data is fetched
- **Local Storage**: Persistent cache across sessions
- **Batch Queries**: Optimize multiple data fetches

## 🛠️ Setup Instructions

### 1. Prerequisites
- GitHub account
- Access to ROVI Firebase project
- Your admin email: vinh2711@googlemail.com

### 2. Initial Setup

1. **Fork/Clone this repository**
```bash
git clone https://github.com/YOUR_USERNAME/rovi-dashboard.git
cd rovi-dashboard
```

2. **Enable GitHub Pages**
- Go to Settings → Pages
- Source: Deploy from a branch
- Branch: main / root
- Save

3. **Access Dashboard**
- Visit: `https://YOUR_USERNAME.github.io/rovi-dashboard`
- Sign in with your Google account (vinh2711@googlemail.com)

## 🔒 Security

- **Admin Only**: Only your UID can access (byothLpU8SdS5SYpx1UFT0pGT0p1)
- **Anonymized Data**: User IDs are partially hidden
- **Read-Only Access**: Dashboard cannot modify data
- **Secure Authentication**: Firebase Auth with Google Sign-In

## 📈 Dashboard Pages

### Overview
- User statistics
- Activity trends
- Top performers
- Recent activity feed

### Users
- Complete user list
- Account creation dates
- Last active times
- Individual user details

### Activity
- Steps distribution
- Exercise minutes
- Active days analysis
- Activity heatmap

### Nutrition
- Most logged foods
- Meal type distribution
- Macro breakdown
- Calorie trends

### Insights
- User retention (DAU/WAU/MAU)
- Feature adoption rates
- Peak usage times
- Goal achievement rates

## 💰 Cost Analysis

### Firebase Free Tier Limits
- **Firestore Reads**: 50,000/day
- **Firestore Writes**: 20,000/day
- **Storage**: 1 GB
- **Bandwidth**: 10 GB/month

### Dashboard Usage (Per Session)
- **Initial Load**: ~100 reads (cached for 1 hour)
- **User Details**: ~20 reads per user view
- **Refresh**: ~100 reads

### Estimated Daily Usage
- **10 sessions/day**: ~1,000 reads
- **Well within free tier**: Only 2% of daily limit

## 🚀 Development

### Local Development
```bash
# Install a simple HTTP server
npm install -g http-server

# Run locally
http-server

# Visit http://localhost:8080
```

### Project Structure
```
rovi-dashboard/
├── index.html           # Main dashboard
├── css/
│   └── dashboard.css    # Styles
├── js/
│   ├── firebase-config.js  # Firebase setup
│   ├── auth.js            # Authentication
│   ├── cache-manager.js   # Caching system
│   ├── analytics.js       # Data fetching
│   ├── charts.js          # Visualizations
│   └── dashboard.js       # Main controller
└── README.md
```

## 📊 Data Sources

### Firebase Collections
- **users**: User profiles and goals
- **foodDatabase**: Food items database
- **usernames**: Username mappings

### User Subcollections
- **foodLog**: Daily food entries
- **activityLog**: Exercise activities
- **stepsData**: Daily step counts
- **weightLog**: Weight tracking

## 🔄 Cache Management

### Automatic Caching
- Data cached for 1 hour
- Stored in localStorage
- Survives page refreshes

### Manual Controls
- **Refresh Button**: Clear cache and reload
- **Time Filters**: All time, 30 days, 7 days, Today

## 📥 Export Features

### CSV Export
- Export user data
- Customizable time ranges
- Anonymized user IDs

## 🐛 Troubleshooting

### Access Denied
- Ensure you're signing in with vinh2711@googlemail.com
- Check Firebase authentication settings

### No Data Showing
- Click "Refresh Data" button
- Check browser console for errors
- Verify Firebase permissions

### Charts Not Loading
- Clear browser cache
- Check Chart.js CDN availability
- Verify data is being fetched

## 📈 Future Enhancements

### Planned Features
- Email reports
- Custom alerts
- A/B testing framework
- Revenue analytics (when monetized)
- Performance monitoring

### Optimization Ideas
- Server-side aggregation
- Progressive Web App
- Offline support
- Real-time updates (WebSockets)

## 🤝 Support

For issues or questions:
- Check browser console for errors
- Verify Firebase configuration
- Ensure GitHub Pages is enabled

## 📄 License

Private dashboard for ROVI app administration.

---

**Dashboard URL**: https://YOUR_USERNAME.github.io/rovi-dashboard
**Admin Email**: vinh2711@googlemail.com
**Last Updated**: August 2025