from django.urls import path
from . import views

urlpatterns = [
    path('threads/', views.api_get_threads),
    path('threads/<int:thread_id>/', views.api_get_single_thread),
    path('threads/<int:thread_id>/reply/', views.api_reply_thread),
    path('create/', views.api_create_thread),
]