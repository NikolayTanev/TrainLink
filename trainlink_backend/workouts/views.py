from django.shortcuts import render
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Workout, ScheduledWorkout, WorkoutLog
from .serializers import WorkoutSerializer, ScheduledWorkoutSerializer, WorkoutLogSerializer

# Create your views here.

class WorkoutViewSet(viewsets.ModelViewSet):
    """ViewSet for managing workouts"""
    serializer_class = WorkoutSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'difficulty']
    ordering_fields = ['title', 'created_at', 'updated_at', 'difficulty']
    
    def get_queryset(self):
        """Return workouts for the current user only"""
        return Workout.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def toggle_favorite(self, request, pk=None):
        """Toggle the favorite status of a workout"""
        workout = self.get_object()
        workout.is_favorite = not workout.is_favorite
        workout.save()
        return Response({'status': 'success', 'is_favorite': workout.is_favorite})


class ScheduledWorkoutViewSet(viewsets.ModelViewSet):
    """ViewSet for managing scheduled workouts"""
    serializer_class = ScheduledWorkoutSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['scheduled_date']
    
    def get_queryset(self):
        """Return scheduled workouts for the current user only"""
        return ScheduledWorkout.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming scheduled workouts"""
        now = timezone.now()
        upcoming = self.get_queryset().filter(scheduled_date__gte=now)
        serializer = self.get_serializer(upcoming, many=True)
        return Response(serializer.data)


class WorkoutLogViewSet(viewsets.ModelViewSet):
    """ViewSet for managing workout logs"""
    serializer_class = WorkoutLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['completed_at']
    
    def get_queryset(self):
        """Return workout logs for the current user only"""
        return WorkoutLog.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get workout statistics"""
        logs = self.get_queryset()
        
        # Calculate statistics
        total_workouts = logs.count()
        total_duration = sum(log.duration_minutes for log in logs)
        total_calories = sum(log.calories_burned for log in logs)
        
        # Get recent logs
        recent_logs = logs.order_by('-completed_at')[:5]
        recent_serializer = self.get_serializer(recent_logs, many=True)
        
        return Response({
            'total_workouts': total_workouts,
            'total_duration': total_duration,
            'total_calories': total_calories,
            'recent_logs': recent_serializer.data
        })
