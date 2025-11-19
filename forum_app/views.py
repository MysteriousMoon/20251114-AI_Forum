from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Thread, HumanUser, AIAgent, Post
from .serializers import ThreadSerializer
import random
import time
import re
import threading

def strip_html_tags(text):
    clean = re.compile('<.*?>')
    return re.sub(clean, '', text).strip()

def trigger_ai_reply_task(thread_id):
    def generate_replies():
        try:
            thread = Thread.objects.get(id=thread_id)
            thread.ai_generating = True
            thread.save()
            
            all_agents = list(AIAgent.objects.all())
            if not all_agents:
                thread.ai_generating = False
                thread.save()
                return

            conversation_history = f"【楼主】{thread.author.username}: {thread.content}\n"
            
            recent_posts = thread.posts.order_by('created_at')[:20]
            
            for post in recent_posts:
                conversation_history += f"{post.author.username}: {post.content}\n"

            num_to_reply = random.randint(1, 3)
            selected_agents = random.sample(all_agents, min(num_to_reply, len(all_agents)))

            print(f"🤖 [AI] 读取了 {len(recent_posts)+1} 条历史消息，正在思考...")

            for agent in selected_agents:
                reply_text = agent.generate_reply(full_conversation_context=conversation_history)
                
                Post.objects.create(
                    thread=thread,
                    author=agent.actor_ptr,
                    content=reply_text
                )
                conversation_history += f"{agent.username}: {reply_text}\n"
                
                time.sleep(random.randint(1, 3))
            
            thread.ai_generating = False
            thread.save()
            print("✅ AI回复生成完成")

        except Exception as e:
            print(f"💥 AI 任务出错: {e}")
            try:
                thread = Thread.objects.get(id=thread_id)
                thread.ai_generating = False
                thread.save()
            except:
                pass
    
    # 在后台线程执行
    thread = threading.Thread(target=generate_replies)
    thread.daemon = True
    thread.start()

@api_view(['GET'])
def api_get_threads(request):
    threads = Thread.objects.all().order_by('-created_at')
    serializer = ThreadSerializer(threads, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def api_get_single_thread(request, thread_id):
    try:
        thread = Thread.objects.get(id=thread_id)
        serializer = ThreadSerializer(thread)
        return Response(serializer.data)
    except Thread.DoesNotExist:
        return Response({"error": "帖子不存在"}, status=404)

@api_view(['POST'])
def api_create_thread(request):
    data = request.data
    username = data.get('username')
    content = data.get('content')

    user, _ = HumanUser.objects.get_or_create(username=username)
    if not user.email: user.email = f"{username}@temp.com"
    user.save()
    
    plain_text = strip_html_tags(content)
    title = plain_text[:50] if len(plain_text) > 50 else plain_text
    if not title:
        title = "无标题"
    
    new_thread = Thread.objects.create(
        title=title,
        content=content,
        author=user.actor_ptr
    )
    
    print("🤖 开始生成AI回复，用户等待中...")
    trigger_ai_reply_task(new_thread.id)
    print("✅ AI回复完成，返回结果")

    return Response({"message": "发布成功！", "thread_id": new_thread.id})

@api_view(['POST'])
def api_reply_thread(request, thread_id):
    try:
        thread = Thread.objects.get(id=thread_id)
    except Thread.DoesNotExist:
        return Response({"error": "帖子不存在"}, status=404)

    data = request.data
    username = data.get('username')
    content = data.get('content')

    if not username or not content:
        return Response({"error": "名字和内容不能为空"}, status=400)

    user, _ = HumanUser.objects.get_or_create(username=username)
    if not user.email: user.email = f"{username}@temp.com"
    user.save()

    Post.objects.create(
        thread=thread,
        content=content,
        author=user.actor_ptr
    )

    print("🤖 开始生成AI回复（后台异步）...")
    trigger_ai_reply_task(thread.id)

    return Response({"message": "回复成功"})