"use client";
import { useState, useEffect } from 'react';
import { Plus, MessageSquare, Clock, User, Search } from 'lucide-react';

interface Thread {
  id: number;
  title: string;
  content: string;
  author_name: string;
  created_at: string;
  posts: any[];
}

export default function Home() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true); // 新增加载状态

  const fetchThreads = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/threads/');
      const data = await res.json();
      setThreads(data);
    } catch (err) {
      console.error("连接失败", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  // 格式化时间的辅助函数
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        
        {/* 头部区域 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              社区讨论
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              浏览最新的话题和见解
            </p>
          </div>
          <a 
            href="/create" 
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Plus size={18} /> 
            发起新主题
          </a>
        </div>

        {/* 列表容器 */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          
          {/* 表头 - 仅在桌面端显示 */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <div className="col-span-6">主题</div>
            <div className="col-span-3 text-left">作者</div>
            <div className="col-span-1 text-center">回复</div>
            <div className="col-span-2 text-right">时间</div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            
            {/* 加载状态 (Skeleton) */}
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 animate-pulse">
                <div className="col-span-6 space-y-3">
                  <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2"></div>
                </div>
                <div className="hidden md:block col-span-3">
                   <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                     <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                   </div>
                </div>
              </div>
            ))}

            {/* 数据列表 */}
            {!isLoading && threads.map((thread) => {
              const replyCount = thread.posts ? thread.posts.length : 0;
              
              return (
                <div key={thread.id} className="group block hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200">
                  <a href={`/thread/${thread.id}`} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-5 items-center">
                    
                    {/* 主题内容区 */}
                    <div className="col-span-1 md:col-span-6 pr-4">
                      <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 mb-1.5">
                        {thread.title ? thread.title.replace(/<[^>]+>/g, '') : '无标题'}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 font-normal">
                        {thread.content.replace(/<[^>]+>/g, '').substring(0, 60) || "暂无预览内容..."}
                      </p>
                      
                      {/* 移动端显示的元数据 */}
                      <div className="flex md:hidden items-center gap-3 mt-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                            <User size={12} /> {thread.author_name}
                        </span>
                        <span className="flex items-center gap-1">
                            <MessageSquare size={12} /> {replyCount}
                        </span>
                        <span className="flex items-center gap-1 ml-auto">
                            <Clock size={12} /> {formatTime(thread.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* 作者 (桌面端) */}
                    <div className="hidden md:flex col-span-3 items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-xs font-bold uppercase">
                          {thread.author_name.slice(0, 2)}
                       </div>
                       <div className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                          {thread.author_name}
                       </div>
                    </div>

                    {/* 回复数 (桌面端) */}
                    <div className="hidden md:flex col-span-1 justify-center">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        replyCount > 0 
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500'
                      }`}>
                        <MessageSquare size={14} />
                        <span>{replyCount}</span>
                      </div>
                    </div>

                    {/* 时间 (桌面端) */}
                    <div className="hidden md:flex col-span-2 justify-end text-sm text-slate-400 dark:text-slate-500 font-mono whitespace-nowrap">
                      {formatTime(thread.created_at)}
                    </div>

                  </a>
                </div>
              );
            })}

            {/* 空状态 */}
            {!isLoading && threads.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
                    <Search className="text-slate-400 w-8 h-8" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">暂时还没有内容</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm text-sm">
                  看起来这里还是空的。为什么不成为第一个发起讨论的人呢？
                </p>
                <a href="/create" className="mt-6 text-indigo-600 hover:text-indigo-700 font-medium text-sm hover:underline">
                    立即创建主题 &rarr;
                </a>
              </div>
            )}
          </div>
        </div>
        
        {/* 底部统计或信息 */}
        {!isLoading && threads.length > 0 && (
            <div className="mt-4 text-center text-xs text-slate-400 dark:text-slate-600">
                已加载 {threads.length} 个主题
            </div>
        )}

      </div>
    </main>
  );
}