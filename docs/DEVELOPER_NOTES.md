# TrainLink Developer Notes

## localStorage Data Management

TrainLink stores user data (workouts, schedules, logs) in the browser's localStorage. This document outlines important considerations to maintain data integrity when updating the site.

### Current Data Structure

```javascript
// Main data stores in localStorage
localStorage.getItem('workouts')         // Array of workout objects
localStorage.getItem('scheduledWorkouts') // Array of scheduled workout objects
localStorage.getItem('workoutLogs')      // Array of completed workout logs
```

### Data Integrity Guidelines

1. **Preserve Data Structure**: When modifying JavaScript files that interact with localStorage:
   - Maintain the same object structure for existing properties
   - Add new properties rather than renaming existing ones
   - If renaming is necessary, include migration code (see below)

2. **Backward Compatibility**: Ensure new code can read old data formats:
   ```javascript
   // Example of handling missing properties
   const workout = workouts[i];
   const difficulty = workout.difficulty || 'Intermediate'; // Default if missing
   ```

3. **Version Management**: For significant data structure changes:
   ```javascript
   const dataVersion = localStorage.getItem('dataVersion') || '1.0';
   if (dataVersion !== '2.0') {
     // Migrate data to new format
     migrateDataToNewFormat();
     localStorage.setItem('dataVersion', '2.0');
   }
   ```

4. **Cache Busting**: To ensure users get the latest JavaScript without affecting localStorage:
   ```html
   <!-- Update version parameter when pushing significant JS changes -->
   <script src="main.js?v=1.0.0"></script>
   ```

### Testing Before Deployment

1. **Test with Existing Data**: Before pushing updates:
   - Test with localStorage populated with workout data
   - Verify all features work with existing data structures
   - Check that no data is lost during normal operations

2. **Cross-Browser Testing**: Test in multiple browsers to ensure localStorage behavior is consistent.

### Emergency Recovery

If a deployment causes data loss:

1. **Revert Code**: Immediately revert to the previous working version
2. **Add Data Export**: Consider adding a data export feature to allow users to backup their data

### AdSense Implementation

1. **Ad Container Structure**: The site uses two ad containers:
   - One between workout sections
   - One in the footer

2. **Ad Container Styling**: 
   - Containers are designed to collapse when ads aren't loaded
   - No visible placeholders are shown when ad blockers are active

3. **AdSense Account**: 
   - Publisher ID: ca-pub-7058331956950995
   - Requires ads.txt file in the root directory

### Analytics Implementation

1. **Google Analytics**:
   - Measurement ID: G-5BCPY2QYD5
   - Implementation: Global site tag (gtag.js) in the head section of index.html
   - Dashboard: Access via [Google Analytics](https://analytics.google.com/)

2. **Event Tracking Opportunities**:
   - Track workout creation: `gtag('event', 'create_workout', { 'workout_type': workoutType });`
   - Track workout completion: `gtag('event', 'complete_workout', { 'workout_id': workoutId });`
   - Track video views: `gtag('event', 'view_video', { 'video_id': videoId });`

3. **Privacy Considerations**:
   - Consider adding a privacy policy page
   - Add a cookie consent banner if targeting EU users (GDPR compliance)

### Legal Requirements

1. **Cookie Consent**:
   - The site implements a cookie consent banner and settings dialog
   - User preferences are stored in localStorage under 'cookieConsent'
   - The cookie-consent.js file handles all cookie consent functionality
   - Ensure this remains functional when making site updates

2. **Privacy Policy**:
   - Located at privacy-policy.html
   - Must be updated if data collection practices change
   - Contains information about:
     - Data collection and usage
     - Cookie usage
     - Third-party services (Google Analytics, AdSense)
     - User rights

3. **Terms of Service**:
   - Located at terms-of-service.html
   - Contains legal disclaimers and limitations of liability
   - Outlines acceptable use of the service
   - Should be reviewed by a legal professional for major updates

4. **Contact Information**:
   - Both policy pages contain placeholder contact information
   - Update [Your Contact Email] with a real contact email before public launch

5. **Copyright Notice**:
   - Footer includes copyright notice: "© 2024 TrainLink. All rights reserved."
   - Update the year annually

## Deployment Checklist

Before pushing updates:

- [ ] Test with existing localStorage data
- [ ] Verify all features work with populated data
- [ ] Check for any changes to data structure
- [ ] Include migration code if needed
- [ ] Update cache busting version if necessary
- [ ] Test with and without ad blockers
- [ ] Verify HTTPS is working correctly

## Current Version

- **Data Structure Version**: 1.0
- **UI Version**: 1.0
- **Last Updated**: March 2024 