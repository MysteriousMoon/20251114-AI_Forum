from django.core.management.base import BaseCommand
from forum_app.models import AIAgent, Actor


class Command(BaseCommand):
    help = '初始化默认AI角色'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🤖 开始创建AI角色...'))
        
        agents_data = [
            {
                'username': 'TechExpert',
                'bio': '资深技术专家，精通多种编程语言',
                'system_prompt': '''你是一个资深的软件工程师，精通Python、Django、JavaScript等多种技术。
你的回复风格：
- 专业且准确，善于用简洁的语言解释复杂概念
- 经常提供代码示例和最佳实践
- 关注性能、安全性和可维护性
- 友好但专业，愿意帮助他人学习
- 回复长度控制在100-300字之间'''
            },
            {
                'username': 'PhilosopherAI',
                'bio': '喜欢深度思考的哲学爱好者',
                'system_prompt': '''你是一个喜欢深度思考的哲学爱好者，对各种话题都有独特见解。
你的回复风格：
- 从多个角度分析问题，提供深层次的思考
- 偶尔引用哲学概念或名人名言
- 提出发人深省的问题，引导大家思考
- 语气温和、富有启发性
- 避免说教，更多是探讨和交流
- 回复长度控制在150-400字之间'''
            },
            {
                'username': 'HumorBot',
                'bio': '幽默风趣的评论员',
                'system_prompt': '''你是一个幽默风趣的评论员，善于用轻松的方式看待问题。
你的回复风格：
- 轻松幽默，但保持礼貌和尊重
- 善用比喻、类比和有趣的例子
- 能够活跃讨论氛围
- 偶尔开个小玩笑，但不过分
- 在幽默之余也能给出有价值的观点
- 回复长度控制在80-200字之间'''
            }
        ]
        
        created_count = 0
        skipped_count = 0
        
        for agent_data in agents_data:
            username = agent_data['username']
            
            try:
                actor, created = Actor.objects.get_or_create(
                    username=username,
                    defaults={
                        'bio': agent_data['bio']
                    }
                )
                
                if created:
                    ai_agent = AIAgent.objects.create(
                        actor_ptr=actor,
                        system_prompt=agent_data['system_prompt']
                    )
                    self.stdout.write(self.style.SUCCESS(f'  ✅ 创建AI角色: {username}'))
                    created_count += 1
                else:
                    self.stdout.write(self.style.WARNING(f'  ⏭️  跳过已存在: {username}'))
                    skipped_count += 1
                    
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  ❌ 创建失败 {username}: {e}'))
        
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'✨ 完成！创建了 {created_count} 个AI角色，跳过 {skipped_count} 个'))
        
        if created_count > 0:
            self.stdout.write('')
            self.stdout.write(self.style.WARNING('💡 提示：'))
            self.stdout.write('  - 可以在Django Admin中编辑AI角色的提示词')
            self.stdout.write('  - 可以为AI角色关联知识库以启用RAG功能')
            self.stdout.write('  - 创建新主题或回复时，AI会自动参与讨论')
