# Endpoint 使用指南

## 概述

应用支持两种 Endpoint 配置方式：
1. **默认模式**（推荐）：留空自动使用 Google 官方 API
2. **自定义模式**：只需输入基础 URL，应用自动补充完整路径

---

## 默认模式（推荐）

### 使用方法
在 Endpoint 输入框中**留空**或**不填写任何内容**。

### 实际调用
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key={your_api_key}
```

### 适用场景
- 直接使用 Google Gemini API
- 大多数用户的默认选择
- 最简单、最可靠的配置

### 配置示例
```
API Key: your_google_api_key_here
Endpoint: [留空]
模型: Gemini 3 Pro Image Preview
```

---

## 自定义模式

### 使用方法
只需输入**基础 URL**（域名或域名+端口）。

### URL 格式
```
输入: https://api.drqyq.com
应用自动补充为: https://api.drqyq.com/v1beta/models/gemini-3-pro-image-preview:generateContent
```

**重要**：
- ✅ 只需输入基础 URL（如 `https://api.drqyq.com`）
- ✅ 应用会自动添加 `/v1beta/models/{model}:generateContent` 路径
- ✅ 应用会根据选择的模型动态补充路径
- ✅ 末尾的斜杠会自动处理（有无皆可）
- ✅ API Key 会自动添加到 URL 参数中

### 适用场景
- 使用代理服务器
- 使用自建 API 网关
- 使用第三方 API 转发服务
- 使用企业内部 API 端点

### 配置示例 1：使用代理
```
输入：
API Key: your_api_key
Endpoint: https://api.drqyq.com
模型: Gemini 3 Pro Image Preview

实际调用：
https://api.drqyq.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=your_api_key
```

### 配置示例 2：使用 CloudFlare Workers
```
输入：
API Key: your_api_key
Endpoint: https://your-worker.workers.dev
模型: Gemini 3 Pro Image Preview

实际调用：
https://your-worker.workers.dev/v1beta/models/gemini-3-pro-image-preview:generateContent?key=your_api_key
```

### 配置示例 3：带端口号
```
输入：
API Key: your_api_key
Endpoint: https://localhost:8080
模型: Gemini 2.5 Flash Image

实际调用：
https://localhost:8080/v1beta/models/gemini-2.5-flash-image:generateContent?key=your_api_key
```

### 配置示例 4：末尾带斜杠也可以
```
输入：
API Key: your_api_key
Endpoint: https://api.example.com/
模型: Gemini 3 Pro Image Preview

实际调用（自动去除多余斜杠）：
https://api.example.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=your_api_key
```

---

## 工作原理

### 代码逻辑
```javascript
let apiUrl;
if (!endpoint || endpoint.trim() === '') {
  // 默认模式：使用 Google 官方 API
  apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
} else {
  // 自定义模式：基础URL + 自动补充路径
  const baseUrl = endpoint.trim().replace(/\/+$/, '');  // 去除末尾斜杠
  apiUrl = `${baseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`;
}
```

### URL 构建

#### 默认模式
```
输入：
  endpoint = ""
  model = "gemini-3-pro-image-preview"
  apiKey = "AIza..."

输出：
  https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=AIza...
```

#### 自定义模式
```
输入：
  endpoint = "https://api.drqyq.com"
  model = "gemini-3-pro-image-preview"
  apiKey = "AIza..."

输出：
  https://api.drqyq.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=AIza...
```

---

## 常见问题

### Q1: 我应该使用哪种模式？
**A:** 如果你有 Google Gemini API Key，直接留空 Endpoint（默认模式）即可。只有在需要代理或自建服务时才使用自定义模式。

### Q2: 自定义 Endpoint 需要包含什么？
**A:** 只需要基础 URL，包括：
- 协议（https:// 或 http://）
- 域名（如 api.drqyq.com）
- 端口号（可选，如 :8080）

**不需要**包含：
- 路径（应用会自动添加 /v1beta/models/{model}:generateContent）
- API Key 参数（应用会自动添加）

**示例**：
- ✅ `https://api.drqyq.com`
- ✅ `https://api.example.com:8080`
- ✅ `https://api.example.com/` （末尾斜杠会自动去除）
- ❌ `https://api.example.com/v1beta/models/...` （不需要完整路径）

### Q3: 如何验证 Endpoint 是否正确？
**A:** 
1. 打开浏览器开发者工具 (F12)
2. 切换到 Network 标签
3. 生成一张图片
4. 查看请求的 URL
5. 确认格式正确

### Q4: 可以切换模型吗？
**A:** 
- **默认模式**：可以在 UI 中选择不同的模型（Pro 或 Flash）
- **自定义模式**：URL 中的模型名必须与你的服务支持的模型匹配

### Q5: Endpoint 留空和填写 Google 官方地址有区别吗？
**A:** 没有区别，留空更简单方便。应用会自动使用正确的 Google 官方地址。

### Q6: 为什么我的自定义 Endpoint 不工作？
**A:** 检查以下几点：
- ✅ URL 格式是否正确（包含协议）
- ✅ 自定义服务是否支持 `/v1beta/models/{model}:generateContent` 路径
- ✅ 自定义服务是否正确实现了 Gemini API 接口
- ✅ 网络是否可以访问该地址
- ✅ API Key 是否对该服务有效

### Q7: 如果我的自定义服务使用不同的路径怎么办？
**A:** 当前应用固定使用 `/v1beta/models/{model}:generateContent` 路径。如果你的服务使用不同的路径（如 `/api/generate`），你需要：
1. 在服务端配置路径重写/转发
2. 或者修改应用源码中的路径构建逻辑

---

## 最佳实践

### 1. 默认用户
```
保持 Endpoint 留空，简单可靠
```

### 2. 企业用户
```
输入内部代理基础 URL：https://internal-proxy.company.com
应用自动补充完整路径
```

### 3. 开发测试
```
输入本地测试基础 URL：http://localhost:8080
应用自动补充：http://localhost:8080/v1beta/models/gemini-3-pro-image-preview:generateContent
```

### 4. 使用代理优化访问
```
如果直连 Google API 较慢，可以使用 CloudFlare Workers 等服务作为代理
```

---

## 安全建议

1. **不要在 URL 中包含 API Key**
   - ❌ `https://api.com/generate?key=xxx`
   - ✅ `https://api.com/generate`（应用会自动添加）

2. **使用 HTTPS**
   - ✅ `https://your-endpoint.com/...`
   - ❌ `http://your-endpoint.com/...`

3. **保护自定义 Endpoint**
   - 如果使用自建服务，确保有适当的认证和授权
   - 考虑使用 API 网关进行流量控制

4. **不要公开分享包含 Endpoint 的配置**
   - 特别是企业内部 Endpoint

---

## 示例：搭建简单的代理

如果你需要搭建代理，这里是一个简单的 CloudFlare Worker 示例：

```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // 转发到 Google API
  const googleUrl = `https://generativelanguage.googleapis.com${url.pathname}${url.search}`
  
  const response = await fetch(googleUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body
  })
  
  return response
}
```

部署后，在应用中输入：
```
https://your-worker.workers.dev
```

应用会自动补充为：
```
https://your-worker.workers.dev/v1beta/models/gemini-3-pro-image-preview:generateContent
```

---

**最后更新**: 2024-11-25  
**版本**: v1.0.4

