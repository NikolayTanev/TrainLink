from django.db import models
from django.contrib.auth.models import User

class Workout(models.Model):
    """Model for workout templates"""
    DIFFICULTY_CHOICES = [
        ('Beginner', 'Beginner'),
        ('Intermediate', 'Intermediate'),
        ('Advanced', 'Advanced'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workouts')
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)
    duration = models.CharField(max_length=20)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES)
    is_favorite = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Video information (optional)
    has_video = models.BooleanField(default=False)
    video_type = models.CharField(max_length=20, blank=True, null=True)
    video_url = models.URLField(blank=True, null=True)
    video_title = models.CharField(max_length=100, blank=True, null=True)
    video_thumbnail = models.URLField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.title} ({self.user.username})"
    
    class Meta:
        ordering = ['-updated_at']


class ScheduledWorkout(models.Model):
    """Model for scheduled workouts"""
    REPEAT_CHOICES = [
        ('never', 'Never'),
        ('daily', 'Every Day'),
        ('weekly', 'Every Week'),
        ('biweekly', 'Every 2 Weeks'),
        ('monthly', 'Every Month'),
        ('yearly', 'Every Year'),
        ('custom', 'Custom'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='scheduled_workouts')
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE, related_name='schedules')
    scheduled_date = models.DateTimeField()
    repeat_option = models.CharField(max_length=20, choices=REPEAT_CHOICES, default='never')
    
    # Custom repeat options (JSON field for flexibility)
    custom_repeat_options = models.JSONField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.workout.title} - {self.scheduled_date.strftime('%Y-%m-%d %H:%M')}"
    
    class Meta:
        ordering = ['scheduled_date']


class WorkoutLog(models.Model):
    """Model for completed workouts"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workout_logs')
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE, related_name='logs')
    completed_at = models.DateTimeField(auto_now_add=True)
    duration_minutes = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True)
    
    # Performance metrics
    calories_burned = models.PositiveIntegerField(default=0)
    rating = models.PositiveSmallIntegerField(default=0, choices=[(i, i) for i in range(1, 6)])
    
    def __str__(self):
        return f"{self.workout.title} - {self.completed_at.strftime('%Y-%m-%d %H:%M')}"
    
    class Meta:
        ordering = ['-completed_at']
