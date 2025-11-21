"use client";
import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2, PenLine } from 'lucide-react';
import dynamic from 'next/dynamic';
// MDEditor 需要浏览器环境，禁用 SSR
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

interface UserInfo {
  id: number;
  username: string;
  email: string;
}

export default function CreateThread() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
    
    if (!userStr || !token) {
      alert('请先登录');
      router.push('/login');
      return;
    }
    
    try {
      setCurrentUser(JSON.parse(userStr));
    } catch (e) {
      console.error('解析用户信息失败', e);
      router.push('/login');
    }
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle || !trimmedContent) {
      alert("请填写完整内容");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://127.0.0.1:8000/api/create/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
            title: trimmedTitle, 
            content: trimmedContent
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/thread/${data.thread_id}`);
      } else {
        const errorData = await res.json();
        alert(errorData.error || "发布失败");
      }
    } catch (err) {
      console.error(err);
      alert("网络错误");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        
        {/* 头部导航 (保留样式1) */}
        <div className="flex items-center gap-4 mb-8">
          <a 
            href="/" 
            onClick={(e) => { e.preventDefault(); router.push('/'); }}
            className="group flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-indigo-600 hover:text-indigo-600 dark:hover:border-indigo-500 dark:hover:text-indigo-500 transition-all shadow-sm hover:shadow-md"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          </a>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              发起新主题
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              分享你的观点，开启精彩讨论
            </p>
          </div>
        </div>

        {currentUser && (
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                <PenLine size={20} />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">发帖身份</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{currentUser.username}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 标题输入 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-shadow focus-within:shadow-md focus-within:border-indigo-500/50">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              主题标题
            </label>
            <input
                type="text"
                placeholder="输入主题标题..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all font-medium text-slate-900 dark:text-slate-100"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
            />
          </div>

          {/* Markdown 编辑器 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
              详细内容
            </label>
            <div className="rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="
                [&_.w-md-editor]:border-0 [&_.w-md-editor]:shadow-none
                [&_.w-md-editor-toolbar]:bg-slate-50/50 dark:[&_.w-md-editor-toolbar]:bg-slate-800/30
                [&_.w-md-editor-toolbar]:border-0 [&_.w-md-editor-toolbar]:border-b [&_.w-md-editor-toolbar]:border-slate-200 dark:[&_.w-md-editor-toolbar]:border-slate-700
                [&_.w-md-editor-content]:bg-white dark:[&_.w-md-editor-content]:bg-slate-900
                [&_.w-md-editor-text]:min-h-[300px]
                [&_.w-md-editor-text-pre]:text-slate-700 dark:[&_.w-md-editor-text-pre]:text-slate-300
                [&_.w-md-editor-text-input]:text-slate-700 dark:[&_.w-md-editor-text-input]:text-slate-300
                [&_.wmde-markdown]:text-slate-700 dark:[&_.wmde-markdown]:text-slate-300
                [&_.w-md-editor-toolbar-divider]:bg-slate-200 dark:[&_.w-md-editor-toolbar-divider]:bg-slate-700
                [&_.w-md-editor-toolbar_button]:!w-8 [&_.w-md-editor-toolbar_button]:!h-8
                [&_.w-md-editor-toolbar_svg]:!w-4 [&_.w-md-editor-toolbar_svg]:!h-4
                [&_button]:text-slate-600 dark:[&_button]:text-slate-400
                [&_button:hover]:text-slate-900 dark:[&_button:hover]:text-slate-200
                [&_button:hover]:bg-slate-100 dark:[&_button:hover]:bg-slate-800
              " data-color-mode="light">
                <MDEditor
                  value={content}
                  onChange={(val) => setContent(val || '')}
                  preview="live"
                  height={400}
                  textareaProps={{
                    placeholder: '在这里尽情书写你的想法...'
                  }}
                />
              </div>
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="flex items-center justify-end pt-2 gap-4">
            <a 
                href="/"
                onClick={(e) => { e.preventDefault(); router.push('/'); }}
                className="px-6 py-3 rounded-full text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
                取消
            </a>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-full font-medium transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> 发布中...
                </>
              ) : (
                <>
                  <Send size={18} /> 确认发布
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}