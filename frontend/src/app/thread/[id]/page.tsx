"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Bot, User, Loader2, MessageSquarePlus, X, Sparkles, Clock, Hash, ChevronRight, MoreHorizontal } from 'lucide-react';
import useSWR from 'swr';

import dynamic from 'next/dynamic';
// MDEditor 仍需禁用 SSR
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });
// MarkdownPreview 启用 SSR
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

// --- 样式常量 ---
// 优化的 Markdown 内容样式类
const MARKDOWN_CLASS = `
  wmde-markdown-var 
  prose prose-slate dark:prose-invert 
  max-w-none 
  
  // 基础排版
  prose-p:leading-7 prose-p:text-slate-700 dark:prose-p:text-slate-300
  prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-900 dark:prose-headings:text-slate-100
  
  // 链接
  prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
  
  // 代码块 - 类似 IDE 风格
  prose-pre:bg-[#1e293b] prose-pre:dark:bg-[#0f172a] 
  prose-pre:shadow-lg prose-pre:rounded-xl prose-pre:border prose-pre:border-slate-700/50
  prose-code:text-pink-500 dark:prose-code:text-pink-400 prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-medium prose-code:before:content-none prose-code:after:content-none
  
  // 引用块
  prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-50/50 dark:prose-blockquote:bg-indigo-900/10 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
  
  // 列表
  prose-li:marker:text-slate-400
  
  // 图片
  prose-img:rounded-2xl prose-img:shadow-md hover:prose-img:shadow-xl prose-img:transition-shadow
  
  // 移除默认背景使其透明，适配父容器
  [&_.wmde-markdown]:!bg-transparent
`;

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

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => setColorMode(mediaQuery.matches ? 'dark' : 'light');
    handleChange();
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [params]);

  const { data: thread, error, mutate } = useSWR<Thread>(
    threadId ? `http://127.0.0.1:8000/api/threads/${threadId}/` : null,
    fetcher,
    {
      refreshInterval: (data) => (data?.ai_generating ? 2000 : 0),
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      keepPreviousData: true,
    }
  );

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return alert("请先登录");
    
    const trimmedContent = replyContent.trim();
    if (!trimmedContent || !threadId) return alert("请输入内容");

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

  if (!thread && !error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p className="text-sm font-medium animate-pulse">正在加载讨论内容...</p>
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <X size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">无法加载内容</h3>
          <p className="text-slate-500 mb-6">可能是网络问题或内容已被删除</p>
          <button 
            onClick={() => mutate()} 
            className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] font-sans relative selection:bg-indigo-500/30">
      
      {/* 背景装饰 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      {/* 顶部导航 - 玻璃拟态 */}
      <header className="sticky top-0 z-30 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 transition-all duration-300">
         <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link href="/" className="group flex items-center gap-3 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors">
                <div className="p-2 rounded-full bg-transparent group-hover:bg-slate-100 dark:group-hover:bg-slate-800 transition-all">
                    <ArrowLeft size={20} />
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Back</span>
                    <span className="text-sm font-bold leading-none">Discussion Board</span>
                </div>
            </Link>
            
            <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <Hash size={14} />
                    <span>ID: {thread.id}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-100 dark:border-indigo-500/20">
                    <MessageSquarePlus size={14} />
                    <span>{thread.posts.length}</span>
                </div>
            </div>
         </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 relative z-10">
        
        {/* --- 主题帖 (楼主) --- */}
        <article className="mb-12">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-white dark:border-slate-800 ring-1 ring-slate-900/5 overflow-hidden">
                {/* 装饰头图区域 */}
                <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                
                <div className="p-8 md:p-10">
                    {/* 标题 */}
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-50 mb-8 leading-tight">
                        {thread.title}
                    </h1>

                    {/* 作者信息栏 */}
                    <div className="flex items-center justify-between pb-8 mb-8 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full opacity-75 group-hover:opacity-100 transition blur-[2px]"></div>
                                {thread.author_avatar ? (
                                    <img src={thread.author_avatar} alt={thread.author_name} className="relative w-14 h-14 rounded-full object-cover border-2 border-white dark:border-slate-900" />
                                ) : (
                                    <div className="relative w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 border-2 border-white dark:border-slate-900">
                                        <User size={28} />
                                    </div>
                                )}
                                <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white dark:border-slate-900 shadow-sm">
                                    楼主
                                </span>
                            </div>
                            <div>
                                <div className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                    {thread.author_name}
                                    <span className="text-slate-400 dark:text-slate-600 font-normal text-sm">发布于</span>
                                </div>
                                <div className="text-sm text-slate-500 flex items-center gap-2 mt-0.5">
                                    <Clock size={14} className="text-indigo-500" />
                                    {new Date(thread.created_at).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}
                                </div>
                            </div>
                        </div>
                        <button className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors">
                            <MoreHorizontal size={20} />
                        </button>
                    </div>

                    {/* 内容正文 */}
                    <div className={MARKDOWN_CLASS}>
                        <MarkdownPreview source={thread.content} />
                    </div>
                </div>
            </div>
        </article>


        {/* --- 讨论分割线 --- */}
        <div className="flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent"></div>
            <div className="px-4 py-1 bg-slate-100 dark:bg-slate-900 rounded-full text-xs font-bold text-slate-500 uppercase tracking-widest border border-slate-200 dark:border-slate-800">
                Discussion Timeline
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent"></div>
        </div>


        {/* --- 回复列表 --- */}
        <div className="space-y-0 relative">
            {/* 垂直连接线 (Timeline line) */}
            <div className="absolute left-6 top-4 bottom-12 w-0.5 bg-slate-200 dark:bg-slate-800 hidden md:block -z-10"></div>

            {thread.posts.map((post, index) => (
              <div key={post.id} className={`
                relative group
                ${index !== 0 ? 'mt-8' : ''}
                md:pl-20 transition-all duration-500 ease-in-out
              `}>
                
                {/* 头像 (位于 Timeline 线条上) */}
                <div className="absolute left-0 top-0 hidden md:flex w-12 h-12 items-center justify-center z-10">
                    <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center shadow-md border-[3px] transition-transform group-hover:scale-110
                        ${post.is_ai 
                            ? 'bg-emerald-100 dark:bg-emerald-900 border-white dark:border-slate-950 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20' 
                            : 'bg-white dark:bg-slate-800 border-white dark:border-slate-950 text-slate-500 ring-2 ring-slate-200 dark:ring-slate-700'
                        }
                    `}>
                         {post.is_ai ? <Bot size={20} /> : (post.author_avatar ? <img src={post.author_avatar} className="w-full h-full rounded-full object-cover" /> : <User size={20} />)}
                    </div>
                </div>

                {/* 气泡主体 */}
                <div className={`
                    relative rounded-2xl md:rounded-3xl p-6 md:p-8 border overflow-hidden
                    ${post.is_ai 
                        ? 'bg-gradient-to-b from-white to-emerald-50/50 dark:from-slate-900 dark:to-emerald-900/10 border-emerald-100/60 dark:border-emerald-500/20 shadow-sm' 
                        : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800 shadow-sm'
                    }
                `}>
                    {/* AI 专属光效 */}
                    {post.is_ai && (
                        <>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 blur-[80px] rounded-full pointer-events-none" />
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-40" />
                        </>
                    )}

                    {/* 移动端头像 (内联显示) */}
                    <div className="flex md:hidden items-center gap-3 mb-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${post.is_ai ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                             {post.is_ai ? <Bot size={16} /> : <User size={16} />}
                        </div>
                        <span className="font-bold text-sm">{post.author_name}</span>
                        {post.is_ai && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded">AI</span>}
                    </div>

                    {/* 头部信息 (Desktop) */}
                    <div className="hidden md:flex items-center justify-between mb-6 border-b border-slate-100/50 dark:border-slate-800/50 pb-4">
                        <div className="flex items-center gap-3">
                             <span className={`font-bold text-lg ${post.is_ai ? 'text-emerald-950 dark:text-emerald-100' : 'text-slate-900 dark:text-slate-100'}`}>
                                {post.author_name}
                             </span>
                             {post.is_ai && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                                    <Sparkles size={12} /> AI Agent
                                </span>
                             )}
                        </div>
                        <span className="text-xs font-medium text-slate-400">
                            {new Date(post.created_at).toLocaleString()}
                        </span>
                    </div>

                    {/* 内容区 - 复用优化后的 Markdown Class */}
                    <div className={MARKDOWN_CLASS}>
                        <MarkdownPreview source={post.content} />
                    </div>
                </div>

                {/* 楼层连接小尾巴 (视觉引导) */}
                {index !== thread.posts.length - 1 && (
                   <div className="block md:hidden absolute left-1/2 -bottom-4 w-px h-8 bg-slate-200 dark:bg-slate-800 -z-10"></div>
                )}
              </div>
            ))}
            
            {/* AI Generating Skeleton */}
            {thread.ai_generating && (
               <div className="relative mt-8 md:pl-20 animate-pulse">
                    <div className="absolute left-0 top-0 hidden md:flex w-12 h-12 items-center justify-center z-10">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center border-2 border-white dark:border-slate-950 shadow-sm">
                             <Loader2 size={20} className="text-emerald-500 animate-spin" />
                        </div>
                    </div>
                    <div className="rounded-2xl md:rounded-3xl p-8 border border-emerald-100 dark:border-emerald-900/30 bg-gradient-to-b from-emerald-50/30 to-transparent dark:from-emerald-900/10">
                        <div className="flex gap-3 mb-6">
                            <div className="h-5 bg-emerald-100 dark:bg-emerald-900/30 rounded w-32" />
                            <div className="h-5 bg-emerald-50 dark:bg-emerald-900/20 rounded w-16" />
                        </div>
                        <div className="space-y-3">
                            <div className="h-4 bg-slate-200/50 dark:bg-slate-800 rounded w-full" />
                            <div className="h-4 bg-slate-200/50 dark:bg-slate-800 rounded w-5/6" />
                            <div className="h-4 bg-slate-200/50 dark:bg-slate-800 rounded w-4/6" />
                        </div>
                    </div>
               </div>
            )}
            
            <div id="posts-end" className="h-8"></div>
        </div>
      </main>

      {/* --- 悬浮操作按钮 (FAB) --- */}
      {!showReplyForm && (
        <div className="fixed bottom-8 right-8 z-40">
            <button 
            onClick={() => setShowReplyForm(true)}
            className="group relative flex items-center justify-center w-14 h-14 md:w-auto md:h-auto md:px-6 md:py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg shadow-indigo-500/40 hover:shadow-indigo-500/60 hover:-translate-y-1 transition-all duration-300"
            >
                <MessageSquarePlus size={24} className="md:mr-2" />
                <span className="hidden md:inline font-bold tracking-wide">参与讨论</span>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping md:hidden"></span>
            </button>
        </div>
      )}

      {/* --- 侧边抽屉 (回复表单) --- */}
      <div 
        className={`fixed inset-0 bg-slate-900/20 dark:bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${showReplyForm ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setShowReplyForm(false)}
      />
      
      <div className={`fixed top-0 right-0 h-full w-full md:w-[600px] bg-white dark:bg-slate-950 shadow-2xl z-50 transform transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1) flex flex-col ${showReplyForm ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-800">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">发表回复</h2>
                <p className="text-sm text-slate-500 mt-1">您正在回复 <span className="font-medium text-indigo-600">#{thread.id}</span></p>
            </div>
            <button 
                onClick={() => setShowReplyForm(false)}
                className="p-2 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
            >
                <X size={24} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 dark:bg-slate-950/50">
          {currentUser ? (
            <div className="flex items-center gap-4 mb-6 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5">
                    <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center">
                        <User size={20} className="text-indigo-600" />
                    </div>
                </div>
                <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current User</div>
                    <div className="font-bold text-slate-900 dark:text-white">{currentUser.username}</div>
                </div>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex items-center gap-2">
                 ⚠️ 您尚未登录，无法发送回复
            </div>
          )}
          
          <div className="space-y-2 flex-1 flex flex-col h-[500px]">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-2">
                    撰写内容
                </label>
                <div className="flex-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-indigo-300 transition-colors">
                  <div className="h-full" data-color-mode={colorMode}>
                    <MDEditor
                      value={replyContent}
                      onChange={(val) => setReplyContent(val || '')}
                      preview="edit"
                      height="100%"
                      visibleDragbar={false}
                      style={{ borderRadius: 0 }}
                    />
                  </div>
                </div>
            </div>
        </div>

        <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between">
            <span className="text-xs text-slate-400 hidden sm:inline">支持 Markdown 格式</span>
            <div className="flex items-center gap-3 ml-auto">
                <button 
                    onClick={() => setShowReplyForm(false)}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                >
                    取消
                </button>
                <button 
                    onClick={handleReply}
                    disabled={isSending || !currentUser}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-500/30 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    发送
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}