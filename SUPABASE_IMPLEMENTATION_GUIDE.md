# Supabase 用户系统实施指南

完整的 NanoGen Studio 用户系统实施步骤，包括社交登录和对话历史保存功能。

---

## 📋 目录

1. [准备工作：Supabase 项目设置](#第一步准备工作supabase-项目设置)
2. [配置 Google OAuth](#第二步配置-google-oauth)
3. [配置 GitHub OAuth](#第三步配置-github-oauth)
4. [数据库设计](#第四步数据库设计)
5. [前端集成](#第五步前端集成)
6. [实现功能](#第六步实现功能)

---

## 第一步：准备工作：Supabase 项目设置

### 1.1 注册 Supabase 账号

1. 访问 [https://supabase.com](https://supabase.com)
2. 点击 "Start your project"
3. 使用 GitHub 账号登录（推荐）

### 1.2 创建新项目

1. 点击 "New Project"
2. 填写项目信息：
   - **Name**: `nanogen-studio`
   - **Database Password**: 设置一个强密码（保存好！）
   - **Region**: 选择 `Northeast Asia (Tokyo)` 或最近的区域
   - **Pricing Plan**: 选择 Free（免费方案足够起步）
3. 点击 "Create new project"
4. 等待 2-3 分钟，项目初始化完成

### 1.3 获取 API 密钥

项目创建完成后：

1. 进入项目仪表板
2. 点击左侧 "Settings" (设置图标)
3. 点击 "API"
4. 复制以下信息（**非常重要**）：
   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   anon public key: eyJhbGc...（很长的字符串）
   service_role key: eyJhbGc...（保密，不要暴露）
   ```

### 1.4 配置认证提供商

1. 点击左侧 "Authentication" → "Providers"
2. 找到 "Email" provider，确保已启用
3. 稍后我们会配置 Google 和 GitHub

---

## 第二步：配置 Google OAuth

### 2.1 创建 Google Cloud 项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 项目名称：`NanoGen Studio`

### 2.2 配置 OAuth 同意屏幕

1. 左侧菜单：**APIs & Services** → **OAuth consent screen**
2. 选择 "External"（外部）
3. 填写应用信息：
   - **App name**: NanoGen Studio
   - **User support email**: 你的邮箱
   - **Developer contact**: 你的邮箱
4. 点击 "Save and Continue"
5. Scopes 页面：点击 "Add or Remove Scopes"
   - 勾选：`userinfo.email`
   - 勾选：`userinfo.profile`
6. 点击 "Save and Continue"
7. Test users（可选）：添加测试用户邮箱
8. 完成配置

### 2.3 创建 OAuth 客户端 ID

1. 左侧菜单：**APIs & Services** → **Credentials**
2. 点击 "+ CREATE CREDENTIALS" → "OAuth client ID"
3. 应用类型：选择 "Web application"
4. 名称：`NanoGen Studio Web Client`
5. **Authorized redirect URIs**（重要！）：
   ```
   https://你的supabase项目URL/auth/v1/callback
   ```
   示例：`https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback`
6. 点击 "CREATE"
7. **复制保存**：
   - Client ID: `xxxxx.apps.googleusercontent.com`
   - Client Secret: `GOCSPX-xxxxx`

### 2.4 在 Supabase 中配置 Google Provider

1. 回到 Supabase 项目
2. **Authentication** → **Providers**
3. 找到 "Google"，点击展开
4. 启用 "Google enabled"
5. 填入：
   - **Client ID**: 粘贴上一步的 Client ID
   - **Client Secret**: 粘贴上一步的 Client Secret
6. 点击 "Save"

---

## 第三步：配置 GitHub OAuth

### 3.1 创建 GitHub OAuth App

1. 访问 [GitHub Settings](https://github.com/settings/developers)
2. 点击左侧 "OAuth Apps"
3. 点击 "New OAuth App"
4. 填写信息：
   - **Application name**: NanoGen Studio
   - **Homepage URL**: `http://localhost:3008`（开发环境）或你的生产域名
   - **Authorization callback URL**（重要！）：
     ```
     https://你的supabase项目URL/auth/v1/callback
     ```
5. 点击 "Register application"
6. **复制保存**：
   - Client ID: `Iv1.xxxxxxxxxxxxx`
7. 点击 "Generate a new client secret"
8. **复制保存 Client Secret**（只显示一次！）

### 3.2 在 Supabase 中配置 GitHub Provider

1. 回到 Supabase 项目
2. **Authentication** → **Providers**
3. 找到 "GitHub"，点击展开
4. 启用 "GitHub enabled"
5. 填入：
   - **Client ID**: 粘贴 GitHub Client ID
   - **Client Secret**: 粘贴 GitHub Client Secret
6. 点击 "Save"

---

## 第四步：数据库设计

### 4.1 创建图片生成历史表

1. Supabase 左侧菜单：**SQL Editor**
2. 点击 "New query"
3. 复制粘贴以下 SQL：

```sql
-- 创建图片生成历史表
CREATE TABLE public.generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prompt TEXT NOT NULL,
  model VARCHAR(100) NOT NULL,
  aspect_ratio VARCHAR(20),
  resolution VARCHAR(10),
  image_url TEXT NOT NULL,
  reference_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 创建索引以提高查询性能
CREATE INDEX idx_generations_user_id ON public.generations(user_id);
CREATE INDEX idx_generations_created_at ON public.generations(created_at DESC);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_generations_updated_at
BEFORE UPDATE ON public.generations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全 (RLS)
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的记录
CREATE POLICY "Users can view own generations"
  ON public.generations
  FOR SELECT
  USING (auth.uid() = user_id);

-- 用户只能插入自己的记录
CREATE POLICY "Users can insert own generations"
  ON public.generations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户只能删除自己的记录
CREATE POLICY "Users can delete own generations"
  ON public.generations
  FOR DELETE
  USING (auth.uid() = user_id);
```

4. 点击 "Run" 执行 SQL
5. 确认看到 "Success. No rows returned"

### 4.2 创建用户配置表（可选）

```sql
-- 用户配置表（存储 API Key 等敏感信息）
CREATE TABLE public.user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  api_key_encrypted TEXT,
  endpoint TEXT,
  preferred_model VARCHAR(100) DEFAULT 'gemini-3-pro-image-preview',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 创建索引
CREATE INDEX idx_user_settings_user_id ON public.user_settings(user_id);

-- 启用 RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- 安全策略
CREATE POLICY "Users can view own settings"
  ON public.user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON public.user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON public.user_settings
  FOR UPDATE
  USING (auth.uid() = user_id);
```

### 4.3 配置 Storage 桶（存储图片）

1. 左侧菜单：**Storage**
2. 点击 "Create a new bucket"
3. 填写：
   - **Name**: `generated-images`
   - **Public bucket**: 勾选（图片需要公开访问）
4. 点击 "Create bucket"

5. 配置 Storage 策略：
   - 点击刚创建的 `generated-images` 桶
   - 点击 "Policies" 标签
   - 点击 "New Policy"

**上传策略**（用户可以上传）：

```sql
-- 允许认证用户上传文件
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'generated-images');
```

**读取策略**（所有人可读）：

```sql
-- 允许所有人读取图片（因为是公开桶）
CREATE POLICY "Anyone can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'generated-images');
```

**删除策略**（用户只能删除自己的文件）：

```sql
-- 用户只能删除自己的文件
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 第五步：前端集成

### 5.1 安装依赖

```bash
npm install @supabase/supabase-js zustand
```

- `@supabase/supabase-js`: Supabase 客户端 SDK
- `zustand`: 轻量级状态管理（推荐，也可以用 Context API）

### 5.2 创建 Supabase 客户端

创建文件 `src/lib/supabase.js`：

```javascript
import { createClient } from "@supabase/supabase-js";

// 从环境变量读取（开发时）
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 5.3 创建环境变量文件

在项目根目录创建 `.env.local`：

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...你的anon key
```

**重要**：将 `.env.local` 添加到 `.gitignore`

### 5.4 创建用户状态管理 Store

创建文件 `src/store/authStore.js`：

```javascript
import { create } from "zustand";
import { supabase } from "../lib/supabase";

export const useAuthStore = create((set) => ({
  user: null,
  session: null,
  loading: true,

  // 初始化认证状态
  initialize: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      set({
        session,
        user: session?.user ?? null,
        loading: false,
      });

      // 监听认证状态变化
      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null,
        });
      });
    } catch (error) {
      console.error("Auth initialization error:", error);
      set({ loading: false });
    }
  },

  // Google 登录
  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  },

  // GitHub 登录
  signInWithGithub: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  },

  // 登出
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ user: null, session: null });
  },
}));
```

### 5.5 在 App 启动时初始化认证

修改 `src/main.jsx`：

```javascript
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { useAuthStore } from "./store/authStore";

// 初始化认证
useAuthStore.getState().initialize();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## 第六步：实现功能

### 6.1 创建登录组件

创建文件 `src/components/AuthModal.jsx`：

```javascript
import React, { useState } from "react";
import { X, Github } from "lucide-react";
import { useAuthStore } from "../store/authStore";

export default function AuthModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { signInWithGoogle, signInWithGithub } = useAuthStore();

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGithub();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">登录 / 注册</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 描述 */}
        <p className="text-slate-600 mb-6">
          登录后可以保存您的生成历史，随时查看和下载
        </p>

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* 登录按钮 */}
        <div className="space-y-3">
          {/* Google 登录 */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="font-medium text-slate-700">使用 Google 登录</span>
          </button>

          {/* GitHub 登录 */}
          <button
            onClick={handleGithubSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Github className="w-5 h-5" />
            <span className="font-medium">使用 GitHub 登录</span>
          </button>
        </div>

        {/* 条款 */}
        <p className="text-xs text-slate-500 text-center mt-6">
          登录即表示您同意我们的服务条款和隐私政策
        </p>
      </div>
    </div>
  );
}
```

### 6.2 创建用户菜单组件

创建文件 `src/components/UserMenu.jsx`：

```javascript
import React, { useState } from "react";
import { User, LogOut, History } from "lucide-react";
import { useAuthStore } from "../store/authStore";

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuthStore();

  if (!user) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <div className="relative">
      {/* 用户头像按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
      >
        {user.user_metadata?.avatar_url ? (
          <img
            src={user.user_metadata.avatar_url}
            alt={user.user_metadata?.full_name || "User"}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
            {(user.email?.[0] || "U").toUpperCase()}
          </div>
        )}
        <span className="text-sm font-medium text-slate-700 hidden sm:block">
          {user.user_metadata?.full_name || user.email?.split("@")[0]}
        </span>
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 z-20">
            <div className="p-3 border-b border-slate-200">
              <p className="text-sm font-medium text-slate-800">
                {user.user_metadata?.full_name || "用户"}
              </p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
            <div className="py-1">
              <button
                onClick={() => {
                  /* TODO: 显示历史记录 */
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <History className="w-4 h-4" />
                生成历史
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

### 6.3 创建图片保存服务

创建文件 `src/services/storageService.js`：

```javascript
import { supabase } from "../lib/supabase";

/**
 * 将 base64 图片上传到 Supabase Storage
 */
export async function uploadImage(base64Data, userId) {
  try {
    // 从 base64 提取数据
    const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
    if (!matches) throw new Error("Invalid base64 data");

    const mimeType = matches[1];
    const base64String = matches[2];

    // 转换为 Blob
    const byteCharacters = atob(base64String);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    // 生成唯一文件名
    const fileExt = mimeType.split("/")[1];
    const fileName = `${userId}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.${fileExt}`;

    // 上传到 Supabase Storage
    const { data, error } = await supabase.storage
      .from("generated-images")
      .upload(fileName, blob, {
        contentType: mimeType,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    // 获取公共 URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("generated-images").getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

/**
 * 保存生成记录到数据库
 */
export async function saveGeneration({
  userId,
  prompt,
  model,
  aspectRatio,
  resolution,
  imageUrl,
  referenceImageUrl = null,
}) {
  try {
    const { data, error } = await supabase
      .from("generations")
      .insert({
        user_id: userId,
        prompt,
        model,
        aspect_ratio: aspectRatio,
        resolution,
        image_url: imageUrl,
        reference_image_url: referenceImageUrl,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Save generation error:", error);
    throw error;
  }
}

/**
 * 获取用户的生成历史
 */
export async function getUserGenerations(
  userId,
  { limit = 20, offset = 0 } = {}
) {
  try {
    const { data, error } = await supabase
      .from("generations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Fetch generations error:", error);
    throw error;
  }
}

/**
 * 删除生成记录
 */
export async function deleteGeneration(generationId) {
  try {
    const { error } = await supabase
      .from("generations")
      .delete()
      .eq("id", generationId);

    if (error) throw error;
  } catch (error) {
    console.error("Delete generation error:", error);
    throw error;
  }
}
```

### 6.4 修改 App.jsx 集成认证功能

在 `src/App.jsx` 中添加认证功能：

```javascript
// 在文件顶部导入
import { useAuthStore } from "./store/authStore";
import { uploadImage, saveGeneration } from "./services/storageService";
import AuthModal from "./components/AuthModal";
import UserMenu from "./components/UserMenu";
import { LogIn } from "lucide-react";

// 在 App 组件内添加状态
const [showAuthModal, setShowAuthModal] = useState(false);
const { user, loading: authLoading } = useAuthStore();

// 修改 handleGenerate 函数，在生成成功后保存到数据库
// 在 setGeneratedImages 之后添加：

if (user) {
  try {
    // 上传图片到 Storage
    const imageUrl = await uploadImage(
      `data:${imageParts[0].inlineData.mimeType};base64,${imageParts[0].inlineData.data}`,
      user.id
    );

    // 保存记录到数据库
    await saveGeneration({
      userId: user.id,
      prompt: prompt,
      model: model,
      aspectRatio: aspectRatio,
      resolution: resolution,
      imageUrl: imageUrl,
      referenceImageUrl: referenceImagePreview,
    });

    console.log("Generation saved successfully");
  } catch (saveError) {
    console.error("Failed to save generation:", saveError);
    // 不阻断用户体验，只记录错误
  }
}

// 在 Sidebar 的标题部分后面添加用户菜单或登录按钮
{
  user ? (
    <UserMenu />
  ) : (
    <button
      onClick={() => setShowAuthModal(true)}
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
    >
      <LogIn className="w-4 h-4" />
      登录
    </button>
  );
}

// 在 return 的最外层添加 AuthModal
<AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />;
```

### 6.5 创建历史记录页面（可选）

创建文件 `src/components/HistoryPanel.jsx`：

```javascript
import React, { useEffect, useState } from "react";
import { X, Loader2, Trash2 } from "lucide-react";
import {
  getUserGenerations,
  deleteGeneration,
} from "../services/storageService";
import { useAuthStore } from "../store/authStore";

export default function HistoryPanel({ isOpen, onClose }) {
  const { user } = useAuthStore();
  const [generations, setGenerations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && user) {
      loadGenerations();
    }
  }, [isOpen, user]);

  const loadGenerations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserGenerations(user.id);
      setGenerations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("确定要删除这条记录吗？")) return;

    try {
      await deleteGeneration(id);
      setGenerations((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      alert("删除失败: " + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] m-4 flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800">生成历史</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
            </div>
          ) : generations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">还没有生成记录</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generations.map((gen) => (
                <div
                  key={gen.id}
                  className="bg-slate-50 rounded-lg overflow-hidden group"
                >
                  <div className="aspect-square relative">
                    <img
                      src={gen.image_url}
                      alt={gen.prompt}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleDelete(gen.id)}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-3">
                    <p className="text-sm text-slate-600 line-clamp-2 mb-1">
                      {gen.prompt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{gen.model}</span>
                      <span>
                        {new Date(gen.created_at).toLocaleDateString("zh-CN")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 🎯 完成清单

- [ ] Supabase 项目创建完成
- [ ] Google OAuth 配置完成
- [ ] GitHub OAuth 配置完成
- [ ] 数据库表创建完成
- [ ] Storage 桶配置完成
- [ ] 前端依赖安装完成
- [ ] 环境变量配置完成
- [ ] 认证功能集成完成
- [ ] 图片保存功能实现
- [ ] 历史记录功能实现

---

## 🚀 测试流程

1. 启动开发服务器：`npm run dev`
2. 点击"登录"按钮
3. 使用 Google 或 GitHub 登录
4. 登录成功后，生成一张图片
5. 检查图片是否保存到 Supabase（打开 Supabase 仪表板查看）
6. 点击"生成历史"查看保存的记录

---

## 📚 相关资源

- [Supabase 官方文档](https://supabase.com/docs)
- [Supabase Auth 文档](https://supabase.com/docs/guides/auth)
- [Supabase Storage 文档](https://supabase.com/docs/guides/storage)
- [React + Supabase 教程](https://supabase.com/docs/guides/getting-started/tutorials/with-react)

---

## ⚠️ 安全注意事项

1. **永远不要提交 `.env.local` 到 Git**
2. **使用 `anon key` 而不是 `service_role key`**（service_role 有完全权限）
3. **确保 RLS (Row Level Security) 已启用**
4. **定期更新依赖包**
5. **生产环境使用 HTTPS**

---

## 🐛 常见问题

### Q1: OAuth 重定向失败

- 检查 Supabase 和 OAuth 提供商的回调 URL 是否一致
- 确保 URL 完全匹配（包括 https://）

### Q2: 图片上传失败

- 检查 Storage 桶是否为 Public
- 检查 Storage 策略是否正确配置
- 确认用户已登录

### Q3: 无法查询数据库

- 检查 RLS 策略是否正确
- 确认用户已认证
- 查看浏览器控制台的错误信息

---

**祝你实施顺利！有任何问题随时问我。** 🎉
