"use client";
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Bot, User, Loader2, MessageSquarePlus, X, Sparkles, Clock, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import dynamic from 'next/dynamic';
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

// --- 类型定义 ---
interface Post {
  id: number;
  content: string;
  created_at: string;
  author_name: string;
  is_ai: boolean;
}

interface Thread {
  id: number;
  title: string;
  content: string;
  created_at: string;
  author_name: string;
  posts: Post[];
  ai_generating: boolean;
}

export default function ThreadDetail({ params }: { params: Promise<{ id: string }> }) {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [username, setUsername] = useState(''); 
  const [replyContent, setReplyContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);

  // 工具栏配置
  const modules = useMemo(() => ({
    toolbar: [
      ['bold', 'italic', 'code-block', 'link'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ],
  }), []);

  useEffect(() => {
    params.then(p => setThreadId(p.id));
  }, [params]);

  const fetchDetail = async () => {
    if (!threadId) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/threads/${threadId}/`);
      if (res.ok) {
        const data = await res.json();
        setThread(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!threadId) return;
    fetchDetail();
  }, [threadId]);
  
  // 智能轮询
  useEffect(() => {
    if (!thread || !thread.ai_generating) return;
    const pollInterval = setInterval(() => { fetchDetail(); }, 2000);
    return () => clearInterval(pollInterval);
  }, [thread?.ai_generating, threadId]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanContent = replyContent.replace(/<(.|\n)*?>/g, '').trim(); 
    
    if (!username.trim() || !cleanContent || !threadId) {
      alert("请输入名字和内容");
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/threads/${threadId}/reply/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, content: replyContent }),
      });

      if (res.ok) {
        setReplyContent('');
        setUsername('');
        setShowReplyForm(false);
        await fetchDetail();
        setTimeout(() => {
            const element = document.getElementById('posts-end');
            element?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
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

  if (!thread) return <div className="min-h-screen flex items-center justify-center text-slate-400"><Loader2 className="animate-spin" /></div>;

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
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50">
                    <User size={24} />
                </div>
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
          
          <div 
            className="prose prose-slate dark:prose-invert prose-lg max-w-none text-slate-700 dark:text-slate-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: thread.content }}
          />
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
                  <div className={`
                    shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm border
                    ${post.is_ai 
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50 ring-2 ring-emerald-50 dark:ring-emerald-900/20' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }
                  `}>
                    {post.is_ai ? <Bot size={20} strokeWidth={2.5} /> : <User size={20} />}
                  </div>
                  
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
                        prose prose-slate dark:prose-invert max-w-none 
                        prose-p:leading-relaxed prose-p:text-slate-700 dark:prose-p:text-slate-300
                        prose-headings:text-emerald-950 dark:prose-headings:text-emerald-200 prose-headings:font-bold
                        prose-a:text-emerald-600 dark:prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline
                        prose-strong:text-emerald-900 dark:prose-strong:text-emerald-300
                        prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:text-emerald-700 dark:prose-code:text-emerald-300 prose-code:font-medium prose-code:before:content-[''] prose-code:after:content-['']
                        prose-pre:bg-slate-900 dark:prose-pre:bg-black/40 prose-pre:border prose-pre:border-slate-800 dark:prose-pre:border-emerald-900/30 prose-pre:shadow-lg prose-pre:rounded-xl
                        prose-ul:marker:text-emerald-400
                    ">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {post.content.replace(/<[^>]+>/g, '')}
                        </ReactMarkdown>
                    </div>
                    ) : (
                    <div 
                        className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />
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
          <form className="space-y-6">
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <User size={14} /> 昵称
                </label>
                <input 
                    type="text" 
                    className="block w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition-all text-slate-800 dark:text-slate-200 placeholder:text-slate-400 shadow-sm"
                    placeholder="如何称呼你？"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                />
            </div>

            <div className="space-y-2 flex-1 flex flex-col">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Bot size={14} /> 内容
                </label>
                <div className="
                    bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all shadow-sm
                    [&_.ql-toolbar]:bg-slate-50 dark:[&_.ql-toolbar]:bg-slate-900/50 [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-slate-200 dark:[&_.ql-toolbar]:border-slate-800 
                    [&_.ql-container]:border-none [&_.ql-container]:font-sans
                    [&_.ql-editor]:min-h-[250px] [&_.ql-editor]:text-base [&_.ql-editor]:text-slate-700 dark:[&_.ql-editor]:text-slate-300 [&_.ql-editor]:leading-relaxed
                    dark:[&_.ql-stroke]:stroke-slate-400 dark:[&_.ql-fill]:fill-slate-400 dark:[&_.ql-picker]:text-slate-400
                ">
                    <ReactQuill 
                      theme="snow" 
                      value={replyContent} 
                      onChange={setReplyContent} 
                      modules={modules}
                      placeholder="写下你的看法..."
                    />
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