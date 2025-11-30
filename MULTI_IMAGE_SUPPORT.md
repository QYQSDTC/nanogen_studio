# 多图片上传支持功能

## 更新日期

2025-11-30

## 功能概述

应用现在支持根据选择的模型上传不同数量的参考图片：

### 模型支持

- **Gemini 3 Pro Image Preview**: 支持最多 **14 张**参考图片
- **Gemini 2.5 Flash Image**: 支持最多 **1 张**参考图片

## 主要改动

### 1. 状态管理改变

- 从单张图片 (`referenceImage`, `referenceImagePreview`) 改为数组 (`referenceImages`, `referenceImagePreviews`)
- 支持多张图片的存储和预览

### 2. 动态限制功能

- 添加了 `getMaxImages()` 函数，根据当前选择的模型返回最大允许的图片数量
- 当用户切换模型时，如果当前上传的图片超过新模型的限制，会自动删除多余的图片并显示提示

### 3. UI 改进

- 图片预览区域现在以网格形式显示多张图片
- 每张图片都有独立的删除按钮
- 当未达到最大数量时，显示"+"按钮继续上传
- 上传按钮显示当前模型支持的最大图片数量
- 模型选择下拉框中显示每个模型支持的参考图片数量

### 4. 上传逻辑

- 对于 Gemini 3 Pro Image Preview，file input 支持 `multiple` 属性，可以一次选择多张图片
- 对于 Gemini 2.5 Flash Image，只支持单张图片上传
- 自动限制上传数量，防止超过模型支持的最大值
- 如果尝试上传超过限制的图片，会显示错误提示

### 5. API 请求改进

- 将所有上传的参考图片都添加到 API 请求的 `parts` 数组中
- 使用 `for...of` 循环处理多张图片的 base64 转换和添加

## 使用方法

### 使用 Gemini 3 Pro Image Preview

1. 在侧边栏选择 "Gemini 3 Pro Image Preview" 模型
2. 点击"上传参考图片"按钮，可以一次选择多张图片（最多 14 张）
3. 已上传的图片会显示在预览区域
4. 点击图片右上角的 X 按钮可以删除单张图片
5. 可以继续点击"+"按钮添加更多图片，直到达到 14 张上限

### 使用 Gemini 2.5 Flash Image

1. 在侧边栏选择 "Gemini 2.5 Flash Image" 模型
2. 点击"上传参考图片"按钮，只能选择一张图片
3. 上传后可以删除并重新上传另一张图片

### 模型切换

- 如果从 Pro 模型切换到 Flash 模型，且已上传多张图片，系统会自动保留第一张图片并删除其他图片
- 如果从 Flash 模型切换到 Pro 模型，可以继续添加更多参考图片

## 技术细节

### 核心函数

#### getMaxImages()

```javascript
const getMaxImages = () => {
  return model === "gemini-3-pro-image-preview" ? 14 : 1;
};
```

#### handleImageUpload()

- 处理多文件上传
- 检查剩余可用空位
- 自动限制上传数量
- 支持文件读取和预览生成

#### removeReferenceImage(index)

- 根据索引删除指定的参考图片
- 同时更新图片文件数组和预览数组

### useEffect Hook

监听模型变化，自动调整参考图片数量：

```javascript
useEffect(() => {
  const maxImages = getMaxImages();
  if (referenceImages.length > maxImages) {
    setReferenceImages((prev) => prev.slice(0, maxImages));
    setReferenceImagePreviews((prev) => prev.slice(0, maxImages));
    setError(
      `切换到 ${
        model === "gemini-2.5-flash-image" ? "Flash" : "Pro"
      } 模型，参考图片已限制为 ${maxImages} 张`
    );
    setTimeout(() => setError(null), 3000);
  }
}, [model]);
```

## 用户体验优化

1. **清晰的视觉反馈**: 显示当前已上传图片数量和最大允许数量
2. **智能限制**: 根据模型自动调整上传限制
3. **平滑过渡**: 切换模型时自动处理图片数量，避免用户困惑
4. **错误提示**: 当达到上限或切换模型时，显示友好的提示信息
5. **响应式布局**: 图片预览区域自适应不同屏幕尺寸

## 测试建议

1. 测试上传单张图片到两个模型
2. 测试上传多张图片到 Pro 模型（尝试上传超过 14 张）
3. 测试在已上传多张图片时切换到 Flash 模型
4. 测试在已上传一张图片时切换到 Pro 模型并继续添加
5. 测试删除单张图片和重新上传
6. 测试在移动设备上的显示效果
