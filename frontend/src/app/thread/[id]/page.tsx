"use client";
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Bot, User, Loader2, MessageSquarePlus, X } from 'lucide-react';

import dynamic from 'next/dynamic';
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

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

  const modules = useMemo(() => ({
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['link', 'code-block'],
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
  
  // 智能轮询：只在 AI 生成时轮询
  useEffect(() => {
    if (!thread || !thread.ai_generating) return;
    
    console.log('🔄 AI 正在生成，开始轮询...');
    const pollInterval = setInterval(() => {
      fetchDetail();
    }, 2000); // 每2秒检查一次
    
    return () => {
      console.log('⏹️ 停止轮询');
      clearInterval(pollInterval);
    };
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
        body: JSON.stringify({ 
          username: username, 
          content: replyContent 
        }),
      });

      if (res.ok) {
        setReplyContent('');
        setUsername('');
        setShowReplyForm(false);
        
        // 立即刷新一次
        await fetchDetail();
        
        setTimeout(() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
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

  if (!thread) return <div className="p-20 text-center text-slate-400 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans pb-32">
      
      {/* 固定悬浮的返回按钮 */}
      <Link href="/" className="fixed top-6 left-6 z-50 inline-flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition font-medium bg-white dark:bg-slate-800 px-4 py-3 rounded-full border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl">
        <ArrowLeft size={18} className="mr-2" /> 返回首页
      </Link>

      <div className="max-w-4xl mx-auto p-4">
        <div className="py-6"></div>

        <div className="bg-white dark:bg-slate-800 p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 mb-10">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6 leading-tight">
            {thread.title.replace(/<[^>]+>/g, '')}
          </h1>
          <div className="flex items-center gap-3 mb-8 pb-8 border-b border-slate-100 dark:border-slate-700">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
              <User size={24} />
            </div>
            <div>
              <div className="font-bold text-lg text-slate-800 dark:text-slate-200">{thread.author_name}</div>
              <div className="text-sm text-slate-400 dark:text-slate-500">{new Date(thread.created_at).toLocaleString()}</div>
            </div>
          </div>
          
          <div 
            className="prose prose-slate dark:prose-invert prose-lg max-w-none text-slate-800 dark:text-slate-200 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: thread.content }}
          />
        </div>

        <div className="mb-12">
          <h3 className="font-bold text-slate-400 dark:text-slate-500 text-sm uppercase tracking-wider ml-2 mb-6 flex items-center gap-2">
            <MessageSquarePlus size={16} />
            {thread.posts.length} 条讨论
          </h3>
          
          <div className="space-y-6">
            {thread.posts.map((post) => (
              <div key={post.id} className={`p-6 rounded-2xl border shadow-sm transition-all ${
                post.is_ai 
                  ? 'bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 ml-8 md:ml-16' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mr-8 md:mr-16'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm border ${
                    post.is_ai ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-600'
                  }`}>
                    {post.is_ai ? <Bot size={18} /> : <User size={18} />}
                  </div>
                  <span className={`font-bold ${post.is_ai ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                    {post.author_name}
                    {post.is_ai && <span className="ml-2 text-[10px] bg-emerald-200 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">AI</span>}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
                    {new Date(post.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                
                <div 
                    className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 prose-p:leading-relaxed prose-a:text-blue-600 dark:prose-a:text-blue-400"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />
              </div>
            ))}
            
            {/* AI正在生成回复 */}
            {thread.ai_generating && (
              <div className="p-6 rounded-2xl border shadow-sm transition-all bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 ml-8 md:ml-16">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm border bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                    <Bot size={18} />
                  </div>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    AI 助手
                    <span className="ml-2 text-[10px] bg-emerald-200 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">AI</span>
                  </span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 ml-auto flex items-center gap-1">
                    <Loader2 size={14} className="animate-spin" />
                    正在生成回复...
                  </span>
                </div>
                <div className="flex items-center gap-2 text-emerald-600/60 dark:text-emerald-400/60">
                  <div className="flex gap-1">
                    <span className="animate-bounce" style={{animationDelay: '0ms'}}>●</span>
                    <span className="animate-bounce" style={{animationDelay: '150ms'}}>●</span>
                    <span className="animate-bounce" style={{animationDelay: '300ms'}}>●</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {!showReplyForm && (
        <button 
          onClick={() => setShowReplyForm(true)}
          className="fixed bottom-8 right-8 bg-blue-600 dark:bg-blue-500 text-white px-6 py-4 rounded-full font-medium hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-95 transition-all flex items-center gap-2 shadow-2xl z-50"
        >
          <MessageSquarePlus size={20} />
          回复
        </button>
      )}

      {showReplyForm && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 transition-opacity duration-300"
            onClick={() => setShowReplyForm(false)}
          />
          
          <div className="fixed top-0 right-0 h-full w-full md:w-[35%] lg:w-[30%] bg-slate-50 dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
              <div className="flex items-center gap-3">
                <MessageSquarePlus size={22} className="text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">添加回复</h2>
              </div>
              <button 
                onClick={() => setShowReplyForm(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                title="关闭"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
              <form onSubmit={handleReply} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    你的昵称
                  </label>
                  <input 
                    type="text" 
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all text-slate-800 dark:text-slate-200"
                    placeholder="输入你的昵称"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    回复内容
                  </label>
                  <div className="bg-white dark:bg-slate-800 [&_.ql-toolbar]:border-slate-200 dark:[&_.ql-toolbar]:border-slate-700 [&_.ql-toolbar]:bg-slate-50 dark:[&_.ql-toolbar]:bg-slate-900 [&_.ql-toolbar]:rounded-t-lg [&_.ql-container]:border-slate-200 dark:[&_.ql-container]:border-slate-700 [&_.ql-container]:rounded-b-lg [&_.ql-container]:min-h-[300px] [&_.ql-editor]:text-base dark:[&_.ql-editor]:text-slate-200 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
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

            <div className="px-6 py-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 flex-shrink-0">
              <button 
                type="button"
                onClick={() => {
                  setShowReplyForm(false);
                  setReplyContent('');
                  setUsername('');
                }}
                className="px-5 py-2.5 rounded-lg font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                取消
              </button>
              <button 
                onClick={handleReply}
                disabled={isSending}
                className="bg-blue-600 dark:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                发送回复
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}