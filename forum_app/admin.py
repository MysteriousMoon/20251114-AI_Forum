# forum_app/admin.py

from django.contrib import admin
# 从你的 models 包里导入所有模型
from .models import (
    Actor, HumanUser, AIAgent, 
    KnowledgeBase, Document, 
    Thread, Post, Vote
)

# ----------------- 身份管理 -----------------

@admin.register(HumanUser)
class HumanUserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email')

@admin.register(AIAgent)
class AIAgentAdmin(admin.ModelAdmin):
    # 这里让你能在列表里看到 AI 的名字和模型
    list_display = ('username', 'model_name', 'system_prompt')
    # 方便在后台直接给 AI 选知识库
    filter_horizontal = ('knowledge_bases',)

# ----------------- 内容管理 -----------------

@admin.register(Thread)
class ThreadAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'created_at')

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('id', 'author', 'thread', 'created_at')

# ----------------- RAG 知识库管理 -----------------

@admin.register(KnowledgeBase)
class KnowledgeBaseAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('id', 'kb', 'short_content')
    
    def short_content(self, obj):
        return obj.text_content[:50] + '...'

# ----------------- 其他 -----------------
# 对于简单的模型，可以直接这样注册
admin.site.register(Actor)
admin.site.register(Vote)