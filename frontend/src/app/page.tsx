"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';

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

  const fetchThreads = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/threads/');
      const data = await res.json();
      setThreads(data);
    } catch (err) {
      console.error("连接失败", err);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  return (
    <main className="max-w-5xl mx-auto p-4 font-sans text-slate-900 dark:text-slate-100">
      
      <div className="flex items-center justify-between mb-4 px-2 py-4">
        <div className="text-lg font-bold text-slate-700 dark:text-slate-300">全部主题</div>
        <Link href="/create" className="bg-slate-900 dark:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-600 transition flex items-center gap-2 shadow-sm">
          <Plus size={16} /> 新建
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <div className="col-span-8">主题</div>
          <div className="col-span-2 text-center">回复</div>
          <div className="col-span-2 text-right">时间</div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {threads.map((thread) => {
            const replyCount = thread.posts ? thread.posts.length : 0;
            
            const timeString = new Date(thread.created_at).toLocaleTimeString([], {
                hour: '2-digit', 
                minute:'2-digit'
            });

            return (
              <div key={thread.id} className="group hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <Link href={`/thread/${thread.id}`} className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
                  
                  <div className="col-span-8 pr-4">
                    <h3 className="text-[15px]xq font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 mb-1">
                      {thread.title ? thread.title.replace(/<[^>]+>/g, '') : thread.content.replace(/<[^>]+>/g, '').substring(0, 40)}
                    </h3>
                    <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-2">
                      <span className="font-medium text-slate-500 dark:text-slate-400">{thread.author_name}</span>
                    </div>
                  </div>

                  <div className="col-span-2 flex items-center justify-center">
                    <span className={`text-sm font-semibold px-2 py-1 rounded-md ${replyCount > 0 ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
                        {replyCount}
                    </span>
                  </div>

                  <div className="col-span-2 text-right text-xs text-slate-400 dark:text-slate-500">
                    {timeString}
                  </div>

                </Link>
              </div>
            );
          })}
          
          {threads.length === 0 && (
            <div className="p-10 text-center text-slate-400 dark:text-slate-500 text-sm">
              暂时还没有内容
            </div>
          )}
        </div>
      </div>
    </main>
  );
}