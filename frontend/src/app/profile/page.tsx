"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Camera, User, Mail, Loader2, Check } from 'lucide-react';

interface UserInfo {
  id: number;
  username: string;
  email: string;
  avatar?: string;
}

export default function Profile() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
    
    if (!userStr || !token) {
      alert('请先登录');
      router.push('/login');
      return;
    }
    
    try {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      setPreviewUrl(user.avatar || '');
    } catch (e) {
      console.error('解析用户信息失败', e);
      router.push('/login');
    }
  }, [router]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    // 检查文件大小（限制 5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB');
      return;
    }

    // 读取文件并预览
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPreviewUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!previewUrl || previewUrl === currentUser?.avatar) {
      alert('请先选择新头像');
      return;
    }

    setIsUploading(true);
    setUploadSuccess(false);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://127.0.0.1:8000/api/user/avatar/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ avatar: previewUrl })
      });

      const data = await response.json();

      if (response.ok) {
        setUploadSuccess(true);
        
        const updatedUser = { ...currentUser!, avatar: data.avatar };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);

        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        alert(data.error || '上传失败');
      }
    } catch (err) {
      console.error(err);
      alert('网络错误，请稍后重试');
    } finally {
      setIsUploading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans py-8 px-4">
      <div className="max-w-2xl mx-auto">
        
        <Link href="/" className="inline-flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition font-medium mb-8">
          <ArrowLeft size={18} className="mr-2" /> 返回首页
        </Link>

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
          
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">个人资料</h1>

          {/* 头像上传区域 */}
          <div className="flex flex-col items-center mb-8 pb-8 border-b border-slate-200 dark:border-slate-700">
            <div className="relative group mb-4">
              {/* 头像预览 */}
              <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-lg">
                {previewUrl ? (
                  <img src={previewUrl} alt="头像" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <User size={48} />
                  </div>
                )}
              </div>

              {/* 上传按钮遮罩 */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera size={32} className="text-white" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-4">
              点击头像选择图片<br />
              <span className="text-xs">支持 JPG、PNG，最大 5MB</span>
            </p>

            {previewUrl && previewUrl !== currentUser.avatar && (
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> 上传中...
                  </>
                ) : uploadSuccess ? (
                  <>
                    <Check size={18} /> 上传成功
                  </>
                ) : (
                  '保存头像'
                )}
              </button>
            )}
          </div>

          {/* 用户信息 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <User size={16} /> 用户名
              </label>
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200">
                {currentUser.username}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <Mail size={16} /> 邮箱
              </label>
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200">
                {currentUser.email}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
