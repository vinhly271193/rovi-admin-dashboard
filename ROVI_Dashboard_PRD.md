# Product Requirements Document (PRD)
# ROVI Admin Dashboard

## 1. Executive Summary

### Product Overview
The ROVI Admin Dashboard is a comprehensive web-based analytics and administration platform for the ROVI fitness tracking mobile application. It provides real-time insights into user engagement, health metrics tracking, and gamification system management through an XP (experience points) rewards program.

### Vision Statement
To empower ROVI administrators with actionable insights and tools to monitor, analyze, and optimize user engagement while maintaining the integrity of the gamification system that drives user motivation and retention.

### Key Objectives
- Provide real-time visibility into user activity and engagement metrics
- Enable efficient administration of the XP rewards system
- Identify and investigate anomalous user behavior
- Track platform health and growth metrics
- Support data-driven decision making for product improvements

## 2. Product Context

### Background
ROVI is a health and fitness tracking mobile application that gamifies wellness through:
- **Step Tracking**: Daily step counting with goals and achievements
- **Food Logging**: Nutritional tracking and calorie monitoring
- **Activity Tracking**: Workout and exercise session logging
- **XP System**: Gamification layer rewarding users for healthy behaviors
- **Social Features**: Leaderboards and community engagement

### Problem Statement
As ROVI scales, administrators need:
1. Centralized visibility into user behavior and platform metrics
2. Tools to manage and investigate the XP system for fairness
3. Real-time monitoring of user engagement and retention
4. Data insights to drive product decisions

### Target Users
- **Primary**: ROVI platform administrators and operations team
- **Secondary**: Product managers and data analysts
- **Tertiary**: Customer support representatives

## 3. Core Features & Requirements

### 3.1 Overview Dashboard

#### Purpose
Provide a high-level snapshot of platform health and daily metrics

#### Key Metrics
- **Total Users**: Active user count with growth indicators
- **Daily Activity**:
  - Total steps across all users
  - Average steps per user
  - Calories burned (calculated from steps + activities)
  - Calories consumed (from food logs)
- **Engagement Metrics**:
  - Active users today
  - Food entries logged
  - Workout sessions completed
- **Champion Recognition**: Daily top performer highlight

#### Visual Components
- Real-time activity feed showing recent user actions
- Quick leaderboard (top 5 performers)
- Sparkline charts for steps and calories trends
- Progress indicators for daily goals

### 3.2 Comprehensive Leaderboards

#### Categories
1. **Steps Leaderboard**
   - Daily, weekly, monthly views
   - Total steps and average per day
   - Trend indicators
   
2. **Calories Burned Leaderboard**
   - From steps and activities combined
   - Efficiency metrics (calories per activity)
   
3. **Activities Leaderboard**
   - Workout frequency
   - Total duration
   - Variety of activities
   
4. **Consistency Leaderboard**
   - Streak tracking
   - Daily active use
   - Goal completion rate

#### Features
- Sortable columns
- Time range filters
- User search capability
- Export functionality

### 3.3 Food Database Management

#### Capabilities
- **Food Item Tracking**:
  - Most popular foods (by log frequency)
  - Recently added items
  - Complete food database browsing
  - Search functionality
  
- **Nutritional Insights**:
  - Calorie distribution
  - Macro/micronutrient tracking
  - Food category analysis
  
- **User Behavior**:
  - Meal timing patterns
  - Portion size trends
  - Dietary preference identification

### 3.4 Activity Analytics

#### Metrics Tracked
- **Activity Types**: Distribution of workout types
- **Duration Analysis**: Average session length by activity
- **Calorie Burn**: Efficiency metrics by activity type
- **Time Patterns**: Peak activity hours/days
- **User Participation**: Active vs. inactive users

#### Visualizations
- Activity heatmaps
- Trend charts
- Category breakdowns
- User journey mapping

### 3.5 User Management

#### User Directory
- Complete user listing with search
- Profile information display
- Activity summary per user
- Account status management

#### User Details
- Registration date
- Last active timestamp
- Total XP and level
- Activity history
- Device information

### 3.6 XP Administration System

#### XP Leaderboard
- **User Rankings**: Sorted by total XP
- **Level Progression**: Visual progress bars showing advancement
- **XP Breakdown**: Sources of XP (steps, activities, food logging)
- **Statistics**: Average XP, highest level, distribution curves

#### XP Transactions Monitor
- **Real-time Feed**: Live XP earning activities
- **Transaction Details**:
  - User identification
  - Activity type (steps, workout, food log)
  - XP amount earned
  - Timestamp
- **Calculation Logic**:
  - 1 XP per 100 steps
  - 1 XP per 5 minutes of activity
  - 10 XP per meal logged

#### User Investigation Tools
- **Search by User ID**: Deep dive into specific user
- **Activity Analysis**: 
  - XP earning patterns
  - Transaction history
  - Suspicious activity detection
- **Profile Overview**:
  - Total XP and level
  - Account creation date
  - Recent activity summary

#### Flagged Users Management
- **Flag System**:
  - Manual flagging with reason
  - Automatic anomaly detection
  - Severity levels (Low/Medium/High)
- **Review Queue**: Prioritized list of users requiring review
- **Action Tools**: XP adjustment, account suspension

#### Anomaly Detection
- **Automated Detection**:
  - Rapid-fire XP earning
  - Impossible step counts
  - Unusual activity patterns
- **Alert System**: Real-time notifications
- **Resolution Tracking**: Mark as resolved/investigated

#### XP Reports & Analytics
- **Distribution Charts**: XP spread across user base
- **Earning Patterns**: Daily/weekly XP distribution trends
- **Activity Correlation**: XP vs. actual activity analysis
- **Bulk Operations**: System-wide XP recalculation tools

## 4. Technical Requirements

### 4.1 Performance Requirements
- **Load Time**: Dashboard initial load < 3 seconds
- **Data Refresh**: Real-time updates every 30 seconds
- **Concurrent Users**: Support 50+ simultaneous admin users
- **Data Processing**: Handle 10,000+ user records efficiently

### 4.2 Security & Access Control
- **Authentication**: Google OAuth integration
- **Authorization**: Admin-only access with role-based permissions
- **Data Protection**: Encrypted data transmission
- **Audit Logging**: Track all admin actions

### 4.3 Data Management
- **Firebase Integration**: 
  - Firestore for user data
  - Real-time listeners for live updates
  - Batch operations for efficiency
- **Caching Strategy**: Local caching to reduce API calls
- **Data Retention**: Historical data for trend analysis

### 4.4 User Interface Requirements
- **Responsive Design**: Desktop-optimized with tablet support
- **Dark Theme**: Reduce eye strain for extended use
- **Data Visualization**: Chart.js for interactive graphs
- **Navigation**: Tab-based interface with quick switching
- **Export Options**: CSV/JSON data export capabilities

## 5. User Experience Design

### 5.1 Design Principles
- **Clarity**: Clear data presentation with meaningful labels
- **Efficiency**: Quick access to frequently used features
- **Consistency**: Uniform design patterns throughout
- **Feedback**: Real-time updates and loading states

### 5.2 Information Architecture
```
Dashboard
├── Overview (Default View)
│   ├── Key Metrics Cards
│   ├── Activity Feed
│   └── Quick Leaderboard
├── Leaderboards
│   ├── Steps
│   ├── Calories
│   ├── Activities
│   └── Consistency
├── Food Data
│   ├── Popular Foods
│   ├── Recent Additions
│   ├── All Foods
│   └── Search
├── Activities
│   └── Activity Analytics
├── Users
│   └── User Directory
└── XP Admin
    ├── XP Leaderboard
    ├── XP Transactions
    ├── Investigate User
    ├── Flagged Users
    ├── Anomalies
    └── Reports
```

### 5.3 Interaction Patterns
- **Progressive Disclosure**: Drill-down from summary to details
- **Contextual Actions**: Inline editing and actions
- **Smart Defaults**: Pre-selected date ranges and filters
- **Keyboard Shortcuts**: Power user efficiency

## 6. Analytics & Metrics

### 6.1 Key Performance Indicators (KPIs)
- **User Engagement**:
  - Daily Active Users (DAU)
  - Weekly Active Users (WAU)
  - Monthly Active Users (MAU)
  - Retention rates
  
- **Activity Metrics**:
  - Average steps per user per day
  - Workout completion rate
  - Food logging consistency
  
- **XP System Health**:
  - XP distribution fairness
  - Anomaly detection rate
  - False positive rate

### 6.2 Success Metrics
- Admin efficiency improvement (time to investigate issues)
- Anomaly detection accuracy
- User engagement trend visibility
- Data-driven decision implementation rate

## 7. Implementation Roadmap

### Phase 1: Core Dashboard (Completed)
✅ Overview dashboard with key metrics
✅ Basic leaderboards (steps, calories, activities)
✅ User directory
✅ Real-time data updates

### Phase 2: XP Administration (Completed)
✅ XP leaderboard with progress visualization
✅ XP transaction monitoring
✅ User investigation tools
✅ Basic anomaly detection

### Phase 3: Optimization (In Progress)
⏳ Performance optimization (caching, batch operations)
⏳ Advanced anomaly detection algorithms
⏳ Automated flagging system
⏳ Historical data analysis

### Phase 4: Advanced Analytics (Planned)
- Predictive analytics for user churn
- Cohort analysis tools
- A/B testing integration
- Custom report builder

### Phase 5: Automation (Future)
- Automated XP adjustments
- Smart notifications for admins
- Scheduled reports
- API for external integrations

## 8. Constraints & Limitations

### Technical Constraints
- Firebase free tier limitations (50k reads/day)
- Browser performance with large datasets
- Real-time sync complexity

### Business Constraints
- Admin-only access (no user-facing features)
- Data privacy compliance requirements
- Manual intervention for XP adjustments

## 9. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Firebase quota exceeded | High | Medium | Implement aggressive caching, batch operations |
| False positive anomaly detection | Medium | High | Manual review process, adjustable thresholds |
| Performance degradation at scale | High | Medium | Pagination, lazy loading, data aggregation |
| Security breach | High | Low | OAuth, role-based access, audit logging |

## 10. Future Enhancements

### Short-term (3-6 months)
- Mobile-responsive design
- Advanced search and filtering
- Custom date range selection
- Bulk user operations

### Medium-term (6-12 months)
- Machine learning for anomaly detection
- Automated reporting system
- Integration with customer support tools
- Performance benchmarking

### Long-term (12+ months)
- Predictive analytics dashboard
- User segmentation tools
- Gamification system designer
- White-label capabilities

## 11. Success Criteria

The ROVI Admin Dashboard will be considered successful when:
1. Admin team can identify and resolve XP anomalies within 5 minutes
2. Daily platform metrics are available within 1 minute of login
3. User engagement trends are clearly visible and actionable
4. False positive rate for anomaly detection is below 10%
5. Platform can scale to 100,000+ users without performance degradation

## 12. Appendices

### A. Glossary
- **XP**: Experience Points - gamification currency
- **DAU/WAU/MAU**: Daily/Weekly/Monthly Active Users
- **Anomaly**: Unusual pattern in user behavior
- **Leaderboard**: Ranked list of users by metric

### B. Technical Stack
- Frontend: HTML5, CSS3, JavaScript (Vanilla)
- Charts: Chart.js
- Backend: Firebase (Firestore, Auth)
- Hosting: Local web server (Python HTTP server)
- Version Control: Git

### C. Related Documents
- ROVI Mobile App PRD
- XP System Design Document
- Firebase Database Schema
- Security & Compliance Guidelines

---

*Document Version: 1.0*  
*Last Updated: August 2025*  
*Author: ROVI Product Team*  
*Status: Active Development*