# 部署指南

## 🚀 构建和预览

### 1. 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist` 目录。

### 2. 本地预览

```bash
npm run preview
```

默认在 `http://localhost:3008` 预览。

---

## 🌐 内网穿透部署

### 使用 Cpolar

#### 步骤 1：启动预览服务

```bash
npm run preview
```

#### 步骤 2：配置 cpolar

```bash
cpolar http 3008
```

#### 步骤 3：访问公网 URL

访问 cpolar 提供的 URL，如：
```
https://banana.cpolar.cn
```

### 已配置的允许主机

在 `vite.config.js` 中已配置：

```javascript
preview: {
  allowedHosts: [
    'banana.cpolar.cn',     // 特定域名
    '.cpolar.cn',           // 所有 cpolar.cn 子域名
  ]
}
```

### 添加其他域名

如果需要添加其他内网穿透域名，编辑 `vite.config.js`：

```javascript
preview: {
  allowedHosts: [
    'banana.cpolar.cn',
    '.cpolar.cn',
    'your-domain.ngrok.io',    // ngrok
    '.ngrok.io',               // 所有 ngrok 子域名
    'your-domain.loca.lt',     // localtunnel
    // 添加更多...
  ]
}
```

---

## 📦 生产环境部署

### 静态托管部署

构建后的 `dist` 目录可以部署到任何静态托管服务：

#### Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

#### Netlify

```bash
# 安装 Netlify CLI
npm i -g netlify-cli

# 部署
netlify deploy --prod --dir=dist
```

#### GitHub Pages

1. 构建项目：
   ```bash
   npm run build
   ```

2. 在 `vite.config.js` 中设置 base：
   ```javascript
   export default defineConfig({
     base: '/nanogen_studio/', // 你的仓库名
     // ... 其他配置
   })
   ```

3. 部署到 gh-pages 分支

#### CloudFlare Pages

1. 登录 CloudFlare Dashboard
2. 创建新项目
3. 连接 Git 仓库
4. 设置构建命令：`npm run build`
5. 设置输出目录：`dist`

---

## 🐳 Docker 部署

### Dockerfile

创建 `Dockerfile`：

```dockerfile
# 构建阶段
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 生产阶段
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf

创建 `nginx.conf`：

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 启用 gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

### 构建和运行

```bash
# 构建镜像
docker build -t nanogen-studio .

# 运行容器
docker run -d -p 80:80 nanogen-studio
```

---

## ⚙️ 环境变量配置

### 开发环境

创建 `.env.development`：

```env
VITE_DEFAULT_API_ENDPOINT=https://generativelanguage.googleapis.com
VITE_APP_PORT=3008
```

### 生产环境

创建 `.env.production`：

```env
VITE_DEFAULT_API_ENDPOINT=https://generativelanguage.googleapis.com
```

---

## 🔒 安全考虑

### 1. HTTPS

生产环境务必使用 HTTPS：
- 保护 API Key
- 保护用户数据
- 避免中间人攻击

### 2. API Key 保护

⚠️ **重要提醒**：
- API Key 在客户端是可见的
- 建议在生产环境使用后端代理
- 限制 API Key 的使用权限和配额

### 3. 内容安全策略（CSP）

在 `index.html` 添加 CSP meta 标签：

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:; 
               connect-src 'self' https://generativelanguage.googleapis.com;">
```

---

## 🎯 性能优化

### 1. 构建优化

在 `vite.config.js` 添加：

```javascript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          icons: ['lucide-react'],
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  }
})
```

### 2. 启用压缩

确保服务器启用 Gzip 或 Brotli 压缩。

### 3. CDN 加速

将静态资源部署到 CDN：
- 图片资源
- 字体文件
- JavaScript/CSS 文件

---

## 📊 监控和日志

### 错误监控

集成 Sentry：

```bash
npm install @sentry/react @sentry/vite-plugin
```

在 `src/main.jsx` 中：

```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: import.meta.env.MODE,
});
```

### 分析工具

添加 Google Analytics 或其他分析工具。

---

## 🔧 故障排除

### 问题 1：预览时提示 "Blocked request"

**解决方案**：在 `vite.config.js` 添加域名到 `preview.allowedHosts`

### 问题 2：构建后路由 404

**解决方案**：
- 确保服务器配置了 SPA 回退
- Nginx: `try_files $uri $uri/ /index.html;`
- Apache: 使用 `.htaccess` 重写规则

### 问题 3：API 跨域问题

**解决方案**：
- 使用 Vite 代理（开发环境）
- 使用后端代理（生产环境）

---

## 📝 部署检查清单

部署前检查：

- [ ] 运行 `npm run build` 成功
- [ ] 本地预览功能正常
- [ ] API Key 不要硬编码在代码中
- [ ] 配置了正确的 base URL（如果需要）
- [ ] 启用了 HTTPS
- [ ] 配置了 CSP 头
- [ ] 启用了服务器压缩
- [ ] 配置了错误监控
- [ ] 测试了所有核心功能

---

## 🌟 推荐部署方案

### 个人项目
- **Vercel** 或 **Netlify** - 免费，自动 CI/CD
- **Cpolar** 或 **Ngrok** - 临时分享和演示

### 企业项目
- **CloudFlare Pages** - 全球 CDN，安全性高
- **AWS S3 + CloudFront** - 高可用，可扩展
- **自建服务器 + Nginx** - 完全控制

---

## 📚 相关文档

- [Vite 部署文档](https://vitejs.dev/guide/static-deploy.html)
- [Vite 配置参考](https://vitejs.dev/config/)

---

**最后更新**: 2024-11-25  
**版本**: v1.0.5

