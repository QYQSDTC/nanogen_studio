# Endpoint 配置更新说明

## ✨ 更新内容 (v1.0.5)

### 简化配置方式

现在只需输入**基础 URL**，应用会自动补充完整路径！

---

## 📝 使用方法

### 默认模式（推荐）

**输入**：留空

**实际调用**：
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent
```

---

### 自定义模式

**输入**：只需输入基础 URL
```
https://api.drqyq.com
```

**实际调用**：应用自动补充为
```
https://api.drqyq.com/v1beta/models/gemini-3-pro-image-preview:generateContent
```

---

## 🎯 核心优势

### 1. 更简单
- ❌ 之前：需要输入完整 URL
  ```
  https://api.drqyq.com/v1beta/models/gemini-3-pro-image-preview:generateContent
  ```
- ✅ 现在：只需输入基础 URL
  ```
  https://api.drqyq.com
  ```

### 2. 更智能
- 自动根据选择的模型补充路径
- 自动处理末尾斜杠
- 实时显示完整 URL 预览

### 3. 更灵活
- 切换模型时自动更新路径
- 支持带端口号：`https://api.example.com:8080`
- 支持本地开发：`http://localhost:3000`

---

## 💡 使用示例

### 示例 1：使用代理服务

```
输入配置：
━━━━━━━━━━━━━━━━━━━━━━━━
API Key: AIzaSyXXXXXXXXXXXX
Endpoint: https://api.drqyq.com
模型: Gemini 3 Pro Image Preview
━━━━━━━━━━━━━━━━━━━━━━━━

实际调用：
https://api.drqyq.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=AIzaSyXXX...
```

### 示例 2：本地开发

```
输入配置：
━━━━━━━━━━━━━━━━━━━━━━━━
API Key: test-key
Endpoint: http://localhost:8080
模型: Gemini 2.5 Flash Image
━━━━━━━━━━━━━━━━━━━━━━━━

实际调用：
http://localhost:8080/v1beta/models/gemini-2.5-flash-image:generateContent?key=test-key
```

### 示例 3：CloudFlare Workers

```
输入配置：
━━━━━━━━━━━━━━━━━━━━━━━━
API Key: AIzaSyXXXXXXXXXXXX
Endpoint: https://my-worker.workers.dev
模型: Gemini 3 Pro Image Preview
━━━━━━━━━━━━━━━━━━━━━━━━

实际调用：
https://my-worker.workers.dev/v1beta/models/gemini-3-pro-image-preview:generateContent?key=AIzaSyXXX...
```

### 示例 4：末尾斜杠自动处理

```
输入: https://api.example.com/
处理: https://api.example.com (自动去除斜杠)
补充: https://api.example.com/v1beta/models/...
```

---

## 🔧 技术实现

### URL 构建逻辑

```javascript
let apiUrl;
if (!endpoint || endpoint.trim() === '') {
  // 默认：Google 官方 API
  apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
} else {
  // 自定义：基础URL + 自动补充路径
  const baseUrl = endpoint.trim().replace(/\/+$/, '');
  apiUrl = `${baseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`;
}
```

### 关键特性

1. **去除末尾斜杠**
   ```javascript
   const baseUrl = endpoint.trim().replace(/\/+$/, '');
   ```

2. **动态模型路径**
   ```javascript
   `/v1beta/models/${model}:generateContent`
   ```

3. **自动添加 API Key**
   ```javascript
   `?key=${apiKey}`
   ```

---

## 📱 UI 改进

### 输入框

**Placeholder**：
```
例如: https://api.drqyq.com (留空使用 Google 官方 API)
```

### 实时预览

显示完整 API URL：
```
自定义: https://api.drqyq.com/v1beta/models/gemini-3-pro-image-preview:generateContent
```

或

```
默认使用 Google 官方 API
```

---

## 🎓 常见问题

### Q1: 需要输入完整的 URL 吗？
**A:** 不需要！只需输入基础 URL，如 `https://api.drqyq.com`

### Q2: 末尾要不要加斜杠？
**A:** 都可以！应用会自动处理
- `https://api.example.com` ✅
- `https://api.example.com/` ✅

### Q3: 支持端口号吗？
**A:** 支持！如 `https://api.example.com:8080`

### Q4: 可以使用 http 吗？
**A:** 可以，但推荐使用 https 保证安全性
- `https://api.example.com` ✅ 推荐
- `http://localhost:8080` ✅ 本地开发可以

### Q5: 切换模型时会自动更新路径吗？
**A:** 是的！路径会根据选择的模型自动更新
- Pro 模型：`/v1beta/models/gemini-3-pro-image-preview:generateContent`
- Flash 模型：`/v1beta/models/gemini-2.5-flash-image:generateContent`

### Q6: 如果我的服务使用不同的路径怎么办？
**A:** 当前固定使用 `/v1beta/models/{model}:generateContent`。如果你的服务路径不同，需要在服务端配置路径转发或修改应用源码。

---

## 🚀 立即体验

```bash
npm run dev
```

访问 `http://localhost:3008`

1. 在 Endpoint 输入框输入：`https://api.drqyq.com`
2. 查看下方显示的完整 URL
3. 输入 API Key 和提示词
4. 生成图片！

---

## 📚 相关文档

- [ENDPOINT_GUIDE.md](ENDPOINT_GUIDE.md) - 完整的 Endpoint 使用指南
- [README.md](README.md) - 项目说明
- [CHANGELOG.md](CHANGELOG.md) - 更新日志

---

**版本**: v1.0.5  
**更新日期**: 2024-11-25  
**状态**: ✅ 可用

