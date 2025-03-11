from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'workouts', views.WorkoutViewSet, basename='workout')
router.register(r'scheduled', views.ScheduledWorkoutViewSet, basename='scheduled-workout')
router.register(r'logs', views.WorkoutLogViewSet, basename='workout-log')

urlpatterns = [
    path('', include(router.urls)),
] 