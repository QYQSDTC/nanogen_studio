# API 使用指南

> **⚠️ 重要提示**  
> 根据 [Gemini API 官方文档](https://ai.google.dev/gemini-api/docs/image-generation)，图像配置参数必须包装在 `imageConfig` 对象中，并使用驼峰命名法（camelCase）。
> - ✅ 正确：`generationConfig.imageConfig.aspectRatio`  
> - ❌ 错误：`generationConfig.aspect_ratio`

## Gemini 图像生成模型

本应用支持两种 Gemini 图像生成模型：

### 模型对比

| 模型 | 特点 | 分辨率 | 适用场景 |
|------|------|--------|----------|
| `gemini-3-pro-image-preview` | 高质量，支持多分辨率 | 1K/2K/4K 可选 | 专业设计、高质量输出 |
| `gemini-2.5-flash-image` | 快速，低延迟 | 固定 1024px | 快速预览、高并发场景 |

### 共同特性

- 基于文本提示词生成图像
- 支持参考图片输入
- 支持多种纵横比
- 包含 SynthID 水印

---

## API 端点

### 默认端点（推荐）

如果不设置自定义 endpoint（留空），应用将自动使用 Google 官方 API：

```
https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}
```

### 自定义端点

如果需要使用代理或自建服务，只需输入基础 URL：

```
输入: https://api.drqyq.com

自动构建为:
https://api.drqyq.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key={apiKey}
```

**注意**：
- 只需输入基础 URL（域名）
- 应用会自动添加 `/v1beta/models/{model}:generateContent` 路径
- 末尾的斜杠会自动处理

---

## 请求格式

### 基本请求结构

```json
{
  "contents": [{
    "parts": [
      {
        "text": "图片描述提示词"
      }
    ]
  }],
  "generationConfig": {
    "responseModalities": ["image"],
    "imageConfig": {
      "aspectRatio": "1:1",
      "imageSize": "1K"
    }
  }
}
```

**注意**：参数必须包装在 `imageConfig` 对象中，并使用驼峰命名法（`aspectRatio` 而不是 `aspect_ratio`）。

### 带参考图片的请求

```json
{
  "contents": [{
    "parts": [
      {
        "text": "图片描述提示词"
      },
      {
        "inlineData": {
          "mimeType": "image/jpeg",
          "data": "base64编码的图片数据"
        }
      }
    ]
  }],
  "generationConfig": {
    "responseModalities": ["image"],
    "imageConfig": {
      "aspectRatio": "16:9",
      "imageSize": "2K"
    }
  }
}
```

---

## 参数说明

### generationConfig

#### responseModalities (必需)
- **类型**: Array
- **值**: `["image"]`
- **说明**: 指定返回图像数据

#### imageConfig (必需)
- **类型**: Object
- **说明**: 图像生成配置对象，包含以下参数

##### imageConfig.aspectRatio (可选)
- **类型**: String
- **支持的值**:
  - `"1:1"` - 正方形
  - `"16:9"` - 横向宽屏
  - `"9:16"` - 竖向
  - `"4:3"` - 标准横向
  - `"3:4"` - 标准竖向
  - `"2:3"`, `"3:2"`, `"4:5"`, `"5:4"`, `"21:9"` 也支持
- **默认值**: `"1:1"`
- **说明**: 指定生成图片的纵横比

##### imageConfig.imageSize (可选，仅 Pro 模型)
- **类型**: String
- **支持的值**:
  - `"1K"` - 1K 分辨率
  - `"2K"` - 2K 分辨率
  - `"4K"` - 4K 分辨率
- **说明**: 指定生成图片的分辨率（仅 `gemini-3-pro-image-preview` 支持）
- **注意**: `gemini-2.5-flash-image` 固定使用 1024px，不支持此参数

### contents

#### parts.text
- **类型**: String
- **必需**: 是
- **说明**: 描述想要生成的图片内容
- **支持语言**: 中文、英文等多种语言

#### parts.inlineData
- **类型**: Object
- **必需**: 否
- **说明**: 参考图片数据
- **字段**:
  - `mimeType`: 图片 MIME 类型 (如 `"image/jpeg"`, `"image/png"`)
  - `data`: Base64 编码的图片数据（不含 `data:` 前缀）

---

## 响应格式

### 成功响应

```json
{
  "candidates": [{
    "content": {
      "parts": [{
        "inlineData": {
          "mimeType": "image/jpeg",
          "data": "base64编码的生成图片数据"
        }
      }],
      "role": "model"
    },
    "finishReason": "STOP"
  }]
}
```

### 响应数据提取

生成的图片位于：
```
response.candidates[0].content.parts[0].inlineData.data
```

完整图片 URL:
```javascript
const imageUrl = `data:${mimeType};base64,${data}`;
```

---

## 代码示例

### JavaScript/Fetch 示例

```javascript
async function generateImage(apiKey, model, prompt, aspectRatio, imageSize, referenceImage) {
  // Prepare imageConfig
  const imageConfig = {
    aspectRatio: aspectRatio
  };
  
  // Only add imageSize for Pro model
  if (model === 'gemini-3-pro-image-preview' && imageSize) {
    imageConfig.imageSize = imageSize;
  }
  
  const requestBody = {
    contents: [{
      parts: [
        { text: prompt }
      ]
    }],
    generationConfig: {
      responseModalities: ["image"],
      imageConfig: imageConfig
    }
  };

  // 添加参考图片（如果有）
  if (referenceImage) {
    const base64Image = await fileToBase64(referenceImage);
    requestBody.contents[0].parts.push({
      inlineData: {
        mimeType: referenceImage.type,
        data: base64Image
      }
    });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || '生成失败');
  }

  const data = await response.json();
  
  // 提取图片数据
  const imagePart = data.candidates[0].content.parts.find(
    part => part.inlineData && part.inlineData.mimeType.startsWith('image/')
  );
  
  if (imagePart) {
    return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
  }
  
  throw new Error('未找到图片数据');
}

// 辅助函数：文件转 Base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // 移除 "data:image/xxx;base64," 前缀
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}
```

### 使用示例

```javascript
// 使用 Gemini 3 Pro 生成正方形 2K 图片
const imageUrl = await generateImage(
  'YOUR_API_KEY',
  'gemini-3-pro-image-preview',
  '一只可爱的柴犬在公园里玩耍',
  '1:1',
  '2K',
  null
);

// 使用 Gemini 3 Pro 生成横向 4K 图片并使用参考图片
const imageUrl2 = await generateImage(
  'YOUR_API_KEY',
  'gemini-3-pro-image-preview',
  '保持这个风格，但改成夜晚场景',
  '16:9',
  '4K',
  referenceImageFile
);

// 使用 Gemini 2.5 Flash 快速生成图片（固定 1024px）
const imageUrl3 = await generateImage(
  'YOUR_API_KEY',
  'gemini-2.5-flash-image',
  '一朵美丽的玫瑰花',
  '1:1',
  null,  // Flash 不支持 imageSize 参数
  null
);
```

---

## 错误处理

### 常见错误

#### 1. 无效的 API Key
```json
{
  "error": {
    "code": 401,
    "message": "API key not valid"
  }
}
```
**解决方案**: 检查 API Key 是否正确，确认已启用 Gemini API

#### 2. 参数格式错误
```json
{
  "error": {
    "code": 400,
    "message": "Invalid JSON payload"
  }
}
```
**解决方案**: 检查参数名称和格式是否正确

#### 3. 内容政策违规
```json
{
  "error": {
    "code": 400,
    "message": "Content policy violation"
  }
}
```
**解决方案**: 修改提示词，避免违反 Google 的内容政策

#### 4. 配额超限
```json
{
  "error": {
    "code": 429,
    "message": "Rate limit exceeded"
  }
}
```
**解决方案**: 等待一段时间后重试，或升级 API 配额

---

## 最佳实践

### 1. 提示词优化
- 详细描述想要的视觉效果
- 包含风格、颜色、氛围等细节
- 使用清晰、具体的语言

### 2. 参考图片
- 使用高质量的参考图片
- 确保参考图片与提示词相关
- 图片大小建议不超过 4MB

### 3. 参数选择
- **1:1** 适合头像、产品图
- **16:9** 适合横幅、海报
- **9:16** 适合手机壁纸、故事
- **1K** 适合快速预览
- **2K** 适合一般用途
- **4K** 适合高质量输出

### 4. 安全性
- 不要在客户端代码中硬编码 API Key
- 使用环境变量或安全的密钥管理服务
- 在生产环境中考虑使用后端代理

### 5. 性能优化
- 添加加载状态提示
- 实现错误重试机制
- 考虑缓存已生成的图片

---

## 参考链接

- [Google AI Studio](https://makersuite.google.com/)
- [Gemini API 官方文档](https://ai.google.dev/docs)
- [API 参考](https://ai.google.dev/api/rest)

---

最后更新：2024
版本：1.0

