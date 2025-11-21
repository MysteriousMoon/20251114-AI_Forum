from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.hashers import check_password
from django.db.models import Count
from .models import Thread, HumanUser, AIAgent, Post
from .serializers import ThreadSerializer, ThreadListSerializer
import random
import time
import re
import threading
import base64
import io
from PIL import Image

def strip_html_tags(text):
    clean = re.compile('<.*?>')
    return re.sub(clean, '', text).strip()

def trigger_ai_reply_task(thread_id):
    def generate_replies():
        try:
            thread = Thread.objects.select_related('author').get(id=thread_id)
            
            all_agents = list(AIAgent.objects.all())
            if not all_agents:
                thread.ai_generating = False
                thread.save(update_fields=['ai_generating'])
                return

            conversation_history = f"【楼主】{thread.author.username}: {thread.content}\n"
            
            recent_posts = thread.posts.select_related('author').order_by('created_at')[:20]
            
            for post in recent_posts:
                conversation_history += f"{post.author.username}: {post.content}\n"

            num_to_reply = random.randint(3, 5)
            selected_agents = random.sample(all_agents, min(num_to_reply, len(all_agents)))

            print(f"🤖 [AI] 读取了 {len(recent_posts)+1} 条历史消息，正在思考...")

            posts_to_create = []
            for agent in selected_agents:
                reply_text = agent.generate_reply(full_conversation_context=conversation_history)
                
                posts_to_create.append(Post(
                    thread=thread,
                    author=agent.actor_ptr,
                    content=reply_text
                ))
                conversation_history += f"{agent.username}: {reply_text}\n"
                
                time.sleep(random.randint(1, 3))
            
            Post.objects.bulk_create(posts_to_create)
            
            thread.ai_generating = False
            thread.save(update_fields=['ai_generating'])
            print("✅ AI回复生成完成")

        except Thread.DoesNotExist:
            print(f"💥 Thread {thread_id} 不存在")
        except Exception as e:
            print(f"💥 AI 任务出错: {e}")
            try:
                Thread.objects.filter(id=thread_id).update(ai_generating=False)
            except:
                pass
    
    thread = threading.Thread(target=generate_replies, daemon=True)
    thread.start()

@api_view(['GET'])
def api_get_threads(request):
    threads = Thread.objects.select_related('author').annotate(post_count=Count('posts')).order_by('-created_at')
    serializer = ThreadListSerializer(threads, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def api_get_single_thread(request, thread_id):
    try:
        thread = Thread.objects.select_related('author').prefetch_related(
            'posts__author'
        ).get(id=thread_id)
        serializer = ThreadSerializer(thread)
        return Response(serializer.data)
    except Thread.DoesNotExist:
        return Response({"error": "帖子不存在"}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_create_thread(request):
    data = request.data
    title = data.get('title')
    content = data.get('content')
    user = request.user
    
    if not title or not title.strip():
        plain_text = strip_html_tags(content)
        title = plain_text[:50] if len(plain_text) > 50 else plain_text
        if not title:
            title = "无标题"
    
    new_thread = Thread.objects.create(
        title=title,
        content=content,
        author=user.actor_ptr,
        ai_generating=True
    )
    
    print("🤖 开始生成AI回复，用户等待中...")
    trigger_ai_reply_task(new_thread.id)

    return Response({"message": "发布成功！", "thread_id": new_thread.id})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_reply_thread(request, thread_id):
    try:
        thread = Thread.objects.only('id', 'ai_generating').get(id=thread_id)
    except Thread.DoesNotExist:
        return Response({"error": "帖子不存在"}, status=404)

    content = request.data.get('content')
    
    if not content or not content.strip():
        return Response({"error": "内容不能为空"}, status=400)
    
    Post.objects.create(
        thread=thread,
        content=content,
        author=request.user.actor_ptr
    )

    thread.ai_generating = True
    thread.save(update_fields=['ai_generating'])

    print("🤖 开始生成AI回复（后台异步）...")
    trigger_ai_reply_task(thread.id)

    return Response({"message": "回复成功"})

# ==================== 认证相关 API ====================

@api_view(['POST'])
@permission_classes([AllowAny])
def api_register(request):
    """用户注册"""
    data = request.data
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    if not username or not email or not password:
        return Response({"error": "用户名、邮箱和密码不能为空"}, status=status.HTTP_400_BAD_REQUEST)
    
    # 检查用户名是否已存在
    if HumanUser.objects.filter(username=username).exists():
        return Response({"error": "用户名已存在"}, status=status.HTTP_400_BAD_REQUEST)
    
    # 检查邮箱是否已存在
    if HumanUser.objects.filter(email=email).exists():
        return Response({"error": "邮箱已被注册"}, status=status.HTTP_400_BAD_REQUEST)
    
    # 创建用户（使用 Manager 的 create_user 方法）
    user = HumanUser.objects.create_user(
        username=username,
        email=email,
        password=password
    )
    
    return Response({
        "message": "注册成功",
        "user": {
            "username": user.username,
            "email": user.email,
            "avatar": user.avatar
        }
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([AllowAny])
def api_login(request):
    """用户登录"""
    data = request.data
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return Response({"error": "用户名和密码不能为空"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = HumanUser.objects.get(username=username)
    except HumanUser.DoesNotExist:
        return Response({"error": "用户名或密码错误"}, status=status.HTTP_401_UNAUTHORIZED)
    
    # 验证密码
    if not check_password(password, user.password):
        return Response({"error": "用户名或密码错误"}, status=status.HTTP_401_UNAUTHORIZED)
    
    # 生成 JWT token
    refresh = RefreshToken.for_user(user)
    
    return Response({
        "message": "登录成功",
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "avatar": user.avatar
        }
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_current_user(request):
    """获取当前登录用户信息（通过token）"""
    user = request.user
    try:
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "avatar": user.avatar
        })
    except Exception as e:
        return Response({"error": "Token无效或已过期"}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_upload_avatar(request):
    """上传头像（压缩并存储为 Base64）"""
    user = request.user
    print(f"✅ 用户认证成功: {user.username}")
    
    # 获取上传的 base64 图片数据
    avatar_base64 = request.data.get('avatar')
    
    if not avatar_base64:
        return Response({"error": "请提供头像数据"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # 移除 data:image/xxx;base64, 前缀（如果有）
        if ',' in avatar_base64:
            avatar_base64 = avatar_base64.split(',', 1)[1]
        
        # 解码 base64
        image_data = base64.b64decode(avatar_base64)
        image = Image.open(io.BytesIO(image_data))
        
        # 转换为 RGB（处理 PNG 透明度）
        if image.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
            image = background
        elif image.mode != 'RGB':
            image = image.convert('RGB')
        
        # 压缩：限制最大尺寸为 200x200
        image.thumbnail((200, 200), Image.Resampling.LANCZOS)
        
        # 转换为 JPEG 并压缩
        buffer = io.BytesIO()
        image.save(buffer, format='JPEG', quality=85, optimize=True)
        compressed_data = buffer.getvalue()
        
        # 转换为 base64
        compressed_base64 = base64.b64encode(compressed_data).decode('utf-8')
        avatar_data_url = f"data:image/jpeg;base64,{compressed_base64}"
        
        # 保存到数据库
        user.avatar_data = avatar_data_url
        user.save()
        
        # 计算压缩后的大小
        size_kb = len(compressed_data) / 1024
        
        return Response({
            "message": "头像上传成功",
            "avatar": avatar_data_url,
            "size_kb": round(size_kb, 2)
        })
        
    except Exception as e:
        return Response({"error": f"图片处理失败: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)