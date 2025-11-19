"use client";
import { useState, FormEvent, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2, PenLine } from 'lucide-react';
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

export default function CreateThread() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'code-block'],
      ['clean']
    ],
  }), []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanContent = content.replace(/<(.|\n)*?>/g, '').trim(); 
    if (!username.trim() || !cleanContent) {
      alert("请填写完整内容");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/create/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, content }),
      });

      if (res.ok) {
        router.push('/'); 
        router.refresh();
      } else {
        alert("发布失败");
      }
    } catch (err) {
      console.error(err);
      alert("网络错误");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans py-10 px-4">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-700 transition shadow-sm">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <PenLine className="text-blue-600 dark:text-blue-400" />
            发布新主题
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              你的昵称
            </label>
            <input
              type="text"
              placeholder="Jincheng"
              className="w-full md:w-1/3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all font-medium text-slate-800 dark:text-slate-200"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
              详细内容
            </label>
            
            <div className="
              [&_.ql-toolbar]:border-slate-200 dark:[&_.ql-toolbar]:border-slate-700 [&_.ql-toolbar]:bg-slate-50 dark:[&_.ql-toolbar]:bg-slate-900 [&_.ql-toolbar]:rounded-t-xl 
              [&_.ql-container]:border-slate-200 dark:[&_.ql-container]:border-slate-700 [&_.ql-container]:rounded-b-xl [&_.ql-container]:text-lg 
              [&_.ql-editor]:min-h-[400px] dark:[&_.ql-editor]:text-slate-200
            ">
              <ReactQuill 
                theme="snow" 
                value={content} 
                onChange={setContent} 
                modules={modules}
                placeholder="尽情书写你的想法..."
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-slate-900 dark:bg-slate-700 text-white px-8 py-4 rounded-xl font-medium hover:bg-blue-600 dark:hover:bg-blue-500 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-200 dark:shadow-slate-950"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> 发布中...
                </>
              ) : (
                <>
                  <Send size={20} /> 确认发布
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}