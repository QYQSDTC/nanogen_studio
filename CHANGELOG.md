# 更新日志

## v1.0.5 - 2024-11-25

### ✨ 新功能
- **简化 Endpoint 配置**
  - 只需输入基础 URL（如 `https://api.drqyq.com`）
  - 应用自动补充完整路径 `/v1beta/models/{model}:generateContent`
  - 自动处理末尾斜杠
  - 根据选择的模型动态构建路径

### 🔧 改进
- 优化 Endpoint 输入体验
- 实时显示完整 API URL
- 更友好的 placeholder 提示

---

## v1.0.4 - 2024-11-25

### ✨ 新功能
- **智能 Endpoint 处理**
  - 留空自动使用 Google 官方 API
  - 支持自定义基础 URL
  - 添加 Endpoint 状态提示

### 🔧 改进
- 优化 API URL 构建逻辑
- 更新端口为 3008
- 改进 UI 提示信息

---

## v1.0.3 - 2024-11-25

### 🔧 重要修复
- **修正参数名称**：使用 `imageSize` 而不是 `resolution`
  - ✅ 使用 `generationConfig.imageConfig.imageSize`
  - ✅ 值格式：`"1K"`, `"2K"`, `"4K"`（大写）

---

## v1.0.2 - 2024-11-25

### 🔧 重要修复
- **修正 API 参数格式**：根据[官方文档](https://ai.google.dev/gemini-api/docs/image-generation)使用正确的参数结构
  - ✅ 使用 `generationConfig.imageConfig.aspectRatio`（驼峰命名）
  - ✅ 使用 `generationConfig.imageConfig.imageSize`（值为 `"1K"`, `"2K"`, `"4K"`）
  - ❌ 移除错误的 `aspect_ratio` 和 `image_size` 参数

### ✨ 新功能
- 添加双模型支持：
  - `gemini-3-pro-image-preview` - 高质量，支持 1K/2K/4K
  - `gemini-2.5-flash-image` - 快速生成，固定 1024px
- 添加模型选择器 UI
- Flash 模型下自动禁用分辨率选择

### 📝 文档
- 完整重写 `API_GUIDE.md` - 符合官方 API 规范
- 更新 `README.md` - 添加模型对比和正确的参数格式
- 添加官方文档引用链接

---

## v1.0.1 - 2024-11-25 (已废弃)

此版本使用了错误的参数格式，已在 v1.0.2 中修复。

---

## v1.0.0 - 2024-11-25

### 🎉 首次发布
- 基础 UI 界面
- API Key 和 Endpoint 配置
- 纵横比选择 (1:1, 16:9, 9:16, 4:3, 3:4)
- 分辨率选择 (1K, 2K, 4K)
- 参考图片上传
- 图片生成和下载
- 响应式设计

