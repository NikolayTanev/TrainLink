from django.contrib import admin
from .models import Workout, ScheduledWorkout, WorkoutLog

@admin.register(Workout)
class WorkoutAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'difficulty', 'duration', 'is_favorite', 'created_at')
    list_filter = ('difficulty', 'is_favorite', 'created_at')
    search_fields = ('title', 'description', 'user__username')
    date_hierarchy = 'created_at'

@admin.register(ScheduledWorkout)
class ScheduledWorkoutAdmin(admin.ModelAdmin):
    list_display = ('workout', 'user', 'scheduled_date', 'repeat_option')
    list_filter = ('repeat_option', 'scheduled_date')
    search_fields = ('workout__title', 'user__username')
    date_hierarchy = 'scheduled_date'

@admin.register(WorkoutLog)
class WorkoutLogAdmin(admin.ModelAdmin):
    list_display = ('workout', 'user', 'completed_at', 'duration_minutes', 'calories_burned', 'rating')
    list_filter = ('completed_at', 'rating')
    search_fields = ('workout__title', 'user__username', 'notes')
    date_hierarchy = 'completed_at'
