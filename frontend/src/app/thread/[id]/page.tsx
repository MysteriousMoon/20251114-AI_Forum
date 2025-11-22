"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Bot, User, Loader2, MessageSquarePlus, X, Sparkles, Clock } from 'lucide-react';
import useSWR from 'swr';

import dynamic from 'next/dynamic';
// MDEditor 仍需禁用 SSR（因为需要浏览器环境）
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });
// MarkdownPreview 启用 SSR，提升首屏加载速度
import MarkdownPreview from '@uiw/react-markdown-preview';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

// --- 类型定义 ---
interface Post {
  id: number;
  content: string;
  created_at: string;
  author_name: string;
  author_avatar?: string;
  is_ai: boolean;
}

interface Thread {
  id: number;
  title: string;
  content: string;
  created_at: string;
  author_name: string;
  author_avatar?: string;
  posts: Post[];
  ai_generating: boolean;
}

interface UserInfo {
  id: number;
  username: string;
  email: string;
  avatar?: string;
}

// SWR fetcher
const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
});

export default function ThreadDetail({ params }: { params: Promise<{ id: string }> }) {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    params.then(p => setThreadId(p.id));
    
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error('解析用户信息失败', e);
      }
    }

    // 监听系统颜色模式
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => setColorMode(mediaQuery.matches ? 'dark' : 'light');
    handleChange(); // 初始设置
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [params]);

  // 使用 SWR 进行数据获取和智能轮询
  const { data: thread, error, mutate } = useSWR<Thread>(
    threadId ? `http://127.0.0.1:8000/api/threads/${threadId}/` : null,
    fetcher,
    {
      // 核心优化：只有当 ai_generating 为 true 时才开启轮询
      refreshInterval: (data) => (data?.ai_generating ? 2000 : 0),
      // 页面获得焦点时不自动重新验证（避免不必要的请求）
      revalidateOnFocus: false,
      // 重连时自动重新验证
      revalidateOnReconnect: true,
      // 保持之前的数据，避免闪烁
      keepPreviousData: true,
    }
  );

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      alert("请先登录");
      return;
    }
    
    const trimmedContent = replyContent.trim();
    if (!trimmedContent || !threadId) {
      alert("请输入内容");
      return;
    }

    setIsSending(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://127.0.0.1:8000/api/threads/${threadId}/reply/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: trimmedContent }),
      });

      if (res.ok) {
        setReplyContent('');
        setShowReplyForm(false);
        
        // 使用 SWR 的 mutate 立即刷新数据，无需手动 fetch
        await mutate();
        
        setTimeout(() => document.getElementById('posts-end')?.scrollIntoView({ behavior: 'smooth' }), 100);
      } else {
        alert("回复失败");
      }
    } catch (err) {
      console.error(err);
      alert("回复失败");
    } finally {
      setIsSending(false);
    }
  };

  // 加载状态
  if (!thread && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  // 错误状态
  if (error || !thread) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">加载失败</p>
          <button 
            onClick={() => mutate()} 
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans relative selection:bg-indigo-100 dark:selection:bg-indigo-900/50">
      
      {/* 顶部导航 */}
      <div className="sticky top-0 z-30 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 px-4 py-4">
         <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link href="/" className="group flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
                <div className="p-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 group-hover:border-indigo-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all shadow-sm">
                    <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                </div>
                <span className="font-medium hidden sm:inline">返回列表</span>
            </Link>
            <div className="text-xs font-medium px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 flex items-center gap-1.5">
                <MessageSquarePlus size={14} />
                {thread.posts.length} 条回复
            </div>
         </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 pb-32">
        
        {/* 主题帖 (楼主) */}
        <div className="mt-6 bg-white dark:bg-slate-900 p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden group">
          {/* 顶部装饰线 */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80"></div>
          
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mb-6 leading-tight tracking-tight">
            {thread.title.replace(/<[^>]+>/g, '')}
          </h1>
          
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
                {thread.author_avatar ? (
                  <img src={thread.author_avatar} alt={thread.author_name} className="w-12 h-12 rounded-full object-cover border border-indigo-100 dark:border-indigo-800/50" />
                ) : (
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50">
                      <User size={24} />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full border-2 border-white dark:border-slate-900 font-bold">
                    楼主
                </div>
            </div>
            <div>
              <div className="font-bold text-lg text-slate-800 dark:text-slate-200">{thread.author_name}</div>
              <div className="text-sm text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                 <Clock size={13} />
                 {new Date(thread.created_at).toLocaleString()}
              </div>
            </div>
          </div>
          
          <div className="wmde-markdown-var prose prose-slate dark:prose-invert prose-lg max-w-none [&_.wmde-markdown]:!bg-transparent">
            <MarkdownPreview source={thread.content} />
          </div>
        </div>

        {/* 回复列表 */}
        <div className="mt-10 space-y-6">
            <div className="flex items-center gap-4 px-2">
                <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    讨论区
                </h3>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
            </div>

            {thread.posts.map((post) => (
              <div key={post.id} className={`
                relative rounded-2xl transition-all duration-300
                ${post.is_ai 
                  ? 'ml-2 md:ml-12 border border-emerald-100 dark:border-emerald-500/20 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-900/10 shadow-sm hover:shadow-md' 
                  : 'mr-2 md:mr-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm'
                }
                p-6 md:p-8
              `}>
                
                {/* AI 专属：背景光效 */}
                {post.is_ai && (
                    <>
                        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-emerald-400/10 dark:bg-emerald-500/10 blur-3xl rounded-full pointer-events-none opacity-70"></div>
                        <div className="absolute left-0 top-6 bottom-6 w-1 bg-emerald-400/30 rounded-r-full"></div>
                    </>
                )}

                {/* 头部信息 */}
                <div className="flex items-start gap-4 mb-5 relative z-10">
                  {post.author_avatar ? (
                    <img 
                      src={post.author_avatar} 
                      alt={post.author_name} 
                      className={`shrink-0 w-10 h-10 rounded-full object-cover shadow-sm border ${
                        post.is_ai 
                          ? 'border-emerald-200 dark:border-emerald-800/50 ring-2 ring-emerald-50 dark:ring-emerald-900/20'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                  ) : (
                    <div className={`
                      shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm border
                      ${post.is_ai 
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50 ring-2 ring-emerald-50 dark:ring-emerald-900/20' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }
                    `}>
                      {post.is_ai ? <Bot size={20} strokeWidth={2.5} /> : <User size={20} />}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-bold text-base truncate ${post.is_ai ? 'text-emerald-900 dark:text-emerald-200' : 'text-slate-900 dark:text-slate-200'}`}>
                            {post.author_name}
                        </span>
                        
                        {post.is_ai && (
                            <span className="flex items-center gap-1 text-[10px] font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-2 py-0.5 rounded-full shadow-sm shadow-emerald-500/20">
                                <Sparkles size={10} fill="currentColor" /> AI Assistant
                            </span>
                        )}
                        
                        <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto font-medium tabular-nums">
                            {new Date(post.created_at).toLocaleString()}
                        </span>
                    </div>
                  </div>
                </div>
                
                {/* 内容区 */}
                <div className="relative z-10 pl-0 md:pl-14">
                    {post.is_ai ? (
                    <div className="
                        wmde-markdown-var prose prose-slate dark:prose-invert max-w-none 
                        [&_.wmde-markdown]:!bg-transparent
                        [&_*]:text-emerald-950 dark:[&_*]:text-emerald-200
                        [&_h1]:text-emerald-950 dark:[&_h1]:text-emerald-200 [&_h1]:font-bold
                        [&_h2]:text-emerald-950 dark:[&_h2]:text-emerald-200 [&_h2]:font-bold
                        [&_h3]:text-emerald-950 dark:[&_h3]:text-emerald-200 [&_h3]:font-bold
                        [&_a]:text-emerald-600 dark:[&_a]:text-emerald-400 [&_a]:no-underline hover:[&_a]:underline
                        [&_strong]:text-emerald-900 dark:[&_strong]:text-emerald-300
                        [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:bg-slate-100 dark:[&_code]:bg-slate-800 [&_code]:text-emerald-700 dark:[&_code]:text-emerald-300
                        [&_pre]:bg-slate-900 dark:[&_pre]:bg-black/40 [&_pre]:border [&_pre]:border-slate-800 dark:[&_pre]:border-emerald-900/30 [&_pre]:shadow-lg [&_pre]:rounded-xl
                        [&_ul]:marker:text-emerald-400
                    ">
                        <MarkdownPreview source={post.content} />
                    </div>
                    ) : (
                    <div className="wmde-markdown-var prose prose-slate dark:prose-invert max-w-none [&_.wmde-markdown]:!bg-transparent">
                        <MarkdownPreview source={post.content} />
                    </div>
                    )}
                </div>
              </div>
            ))}
            
            {/* AI 生成中状态卡片 (Skeleton) */}
            {thread.ai_generating && (
              <div className="ml-2 md:ml-12 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50/40 via-white/50 to-transparent dark:bg-slate-900/50 p-6 md:p-8 animate-pulse">
                 <div className="flex items-center gap-4 mb-5">
                    <div className="w-10 h-10 rounded-full bg-emerald-100/50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500">
                        <Loader2 size={20} className="animate-spin" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="h-4 bg-emerald-100 dark:bg-emerald-900/30 rounded w-24"></div>
                        <div className="h-3 bg-emerald-50 dark:bg-emerald-900/20 rounded w-16"></div>
                    </div>
                 </div>
                 <div className="space-y-3 pl-14">
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-5/6"></div>
                 </div>
              </div>
            )}
            
            <div id="posts-end" className="h-4"></div>
        </div>
      </div>

      {/* 悬浮回复按钮 (FAB) */}
      {!showReplyForm && (
        <button 
          onClick={() => setShowReplyForm(true)}
          className="fixed bottom-8 right-8 z-40 group flex items-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white pl-5 pr-6 py-4 rounded-full shadow-xl hover:shadow-2xl hover:bg-indigo-700 dark:hover:bg-indigo-600 hover:-translate-y-1 transition-all active:scale-95"
        >
          <MessageSquarePlus size={20} />
          <span className="font-bold tracking-wide">参与讨论</span>
        </button>
      )}

      {/* 侧边抽屉：回复表单 */}
      {/* 遮罩层 */}
      <div 
        className={`fixed inset-0 bg-slate-900/20 dark:bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${showReplyForm ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setShowReplyForm(false)}
      />
      
      {/* 抽屉内容 */}
      <div className={`fixed top-0 right-0 h-full w-full md:w-[500px] bg-white dark:bg-slate-950 shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col ${showReplyForm ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md">
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">添加回复</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">分享你的见解，保持友善交流</p>
            </div>
            <button 
                onClick={() => setShowReplyForm(false)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
                <X size={24} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950">
          {currentUser && (
            <div className="mb-6 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">回复身份</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{currentUser.username}</p>
                </div>
              </div>
            </div>
          )}
          
          <form className="space-y-6">
            <div className="space-y-2 flex-1 flex flex-col">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Bot size={14} /> 内容
                </label>
                <div className="rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="
                    [&_.w-md-editor]:border-0 [&_.w-md-editor]:shadow-none
                    [&_.w-md-editor-toolbar]:bg-slate-50/50 dark:[&_.w-md-editor-toolbar]:bg-slate-800/30
                    [&_.w-md-editor-toolbar]:border-0 [&_.w-md-editor-toolbar]:border-b [&_.w-md-editor-toolbar]:border-slate-200 dark:[&_.w-md-editor-toolbar]:border-slate-700
                    [&_.w-md-editor-content]:bg-white dark:[&_.w-md-editor-content]:bg-slate-900
                    [&_.w-md-editor-text]:min-h-[250px]
                    [&_.w-md-editor-text-pre]:text-slate-700 dark:[&_.w-md-editor-text-pre]:text-slate-300
                    [&_.w-md-editor-text-input]:text-slate-700 dark:[&_.w-md-editor-text-input]:text-slate-300
                    [&_.wmde-markdown]:text-slate-700 dark:[&_.wmde-markdown]:text-slate-300
                    [&_.w-md-editor-toolbar-divider]:bg-slate-200 dark:[&_.w-md-editor-toolbar-divider]:bg-slate-700
                    [&_.w-md-editor-toolbar_button]:!w-8 [&_.w-md-editor-toolbar_button]:!h-8
                    [&_.w-md-editor-toolbar_svg]:!w-4 [&_.w-md-editor-toolbar_svg]:!h-4
                    [&_button]:text-slate-600 dark:[&_button]:text-slate-400
                    [&_button:hover]:text-slate-900 dark:[&_button:hover]:text-slate-200
                    [&_button:hover]:bg-slate-100 dark:[&_button:hover]:bg-slate-800
                  " data-color-mode={colorMode}>
                    <MDEditor
                      value={replyContent}
                      onChange={(val) => setReplyContent(val || '')}
                      preview="live"
                      height={350}
                      textareaProps={{
                        placeholder: '写下你的看法...'
                      }}
                    />
                  </div>
                </div>
            </div>
          </form>
        </div>

        <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-end gap-3">
            <button 
                onClick={() => setShowReplyForm(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
                取消
            </button>
            <button 
                onClick={handleReply}
                disabled={isSending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                发送回复
            </button>
        </div>
      </div>
    </div>
  );
}