from rest_framework import serializers
from .models import Thread, Post, HumanUser
import re

def strip_html_tags(text):
    clean = re.compile('<.*?>')
    return re.sub(clean, '', text).strip()

class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    author_avatar = serializers.CharField(source='author.avatar', read_only=True)
    is_ai = serializers.BooleanField(source='author.is_ai', read_only=True)

    class Meta:
        model = Post
        fields = ['id', 'content', 'created_at', 'author_name', 'author_avatar', 'is_ai']

class ThreadListSerializer(serializers.ModelSerializer):
    """
    用于帖子列表页的轻量级序列化器
    """
    author_name = serializers.CharField(source='author.username', read_only=True)
    author_avatar = serializers.CharField(source='author.avatar', read_only=True)
    post_count = serializers.IntegerField(read_only=True) # 由 annotate 提供
    reply_count = serializers.SerializerMethodField()
    content_preview = serializers.SerializerMethodField()

    class Meta:
        model = Thread
        fields = ['id', 'title', 'created_at', 'author_name', 'author_avatar', 'ai_generating', 'post_count', 'reply_count', 'content_preview']

    def get_reply_count(self, obj):
        # post_count 包含了楼主的帖子，回复数要-1
        return obj.post_count - 1 if hasattr(obj, 'post_count') and obj.post_count > 0 else 0

    def get_content_preview(self, obj):
        # 创建一个纯文本预览
        plain_text = strip_html_tags(obj.content)
        return plain_text[:100] if len(plain_text) > 100 else plain_text

class ThreadSerializer(serializers.ModelSerializer):
    """
    用于帖子详情页的完整序列化器
    """
    author_name = serializers.CharField(source='author.username', read_only=True)
    author_avatar = serializers.CharField(source='author.avatar', read_only=True)
    posts = PostSerializer(many=True, read_only=True)

    class Meta:
        model = Thread
        fields = ['id', 'title', 'content', 'created_at', 'author_name', 'author_avatar', 'posts', 'ai_generating']