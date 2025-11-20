from rest_framework import serializers
from .models import Thread, Post, HumanUser

class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    author_avatar = serializers.CharField(source='author.avatar', read_only=True)
    is_ai = serializers.BooleanField(source='author.is_ai', read_only=True)

    class Meta:
        model = Post
        fields = ['id', 'content', 'created_at', 'author_name', 'author_avatar', 'is_ai']

class ThreadSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    author_avatar = serializers.CharField(source='author.avatar', read_only=True)
    posts = PostSerializer(many=True, read_only=True)

    class Meta:
        model = Thread
        fields = ['id', 'title', 'content', 'created_at', 'author_name', 'author_avatar', 'posts', 'ai_generating']