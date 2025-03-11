from rest_framework import serializers
from .models import Workout, ScheduledWorkout, WorkoutLog

class WorkoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workout
        fields = [
            'id', 'title', 'description', 'icon', 'duration', 'difficulty', 
            'is_favorite', 'created_at', 'updated_at', 'has_video', 
            'video_type', 'video_url', 'video_title', 'video_thumbnail'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Set the user from the request
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ScheduledWorkoutSerializer(serializers.ModelSerializer):
    workout_title = serializers.CharField(source='workout.title', read_only=True)
    workout_icon = serializers.CharField(source='workout.icon', read_only=True)
    workout_duration = serializers.CharField(source='workout.duration', read_only=True)
    workout_difficulty = serializers.CharField(source='workout.difficulty', read_only=True)
    
    class Meta:
        model = ScheduledWorkout
        fields = [
            'id', 'workout', 'workout_title', 'workout_icon', 'workout_duration', 
            'workout_difficulty', 'scheduled_date', 'repeat_option', 
            'custom_repeat_options', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Set the user from the request
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class WorkoutLogSerializer(serializers.ModelSerializer):
    workout_title = serializers.CharField(source='workout.title', read_only=True)
    workout_icon = serializers.CharField(source='workout.icon', read_only=True)
    
    class Meta:
        model = WorkoutLog
        fields = [
            'id', 'workout', 'workout_title', 'workout_icon', 'completed_at', 
            'duration_minutes', 'notes', 'calories_burned', 'rating'
        ]
        read_only_fields = ['id', 'completed_at']
    
    def create(self, validated_data):
        # Set the user from the request
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data) 