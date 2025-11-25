# API 参数修复总结

## 🎯 问题描述

之前的实现使用了错误的 API 参数格式，导致错误：
```
Invalid JSON payload received. Unknown name "aspect_ratio" at 'generation_config': Cannot find field.
Invalid JSON payload received. Unknown name "image_size" at 'generation_config': Cannot find field.
```

## ✅ 解决方案

根据 [Gemini 官方文档](https://ai.google.dev/gemini-api/docs/image-generation)，修正了 API 参数格式。

### 错误的格式 ❌

```javascript
{
  generationConfig: {
    responseModalities: ["image"],
    aspect_ratio: "1:1",        // ❌ 错误：应使用 imageConfig 包装
    image_size: "1024"          // ❌ 错误：参数名和位置都不对
  }
}
```

### 正确的格式 ✅

```javascript
{
  generationConfig: {
    responseModalities: ["image"],
    imageConfig: {               // ✅ 必须包装在 imageConfig 中
      aspectRatio: "1:1",        // ✅ 驼峰命名法
      resolution: "1k"           // ✅ 正确的参数名和值格式
    }
  }
}
```

## 🔑 关键要点

### 1. 参数必须包装在 `imageConfig` 中
所有图像配置参数都必须放在 `imageConfig` 对象内。

### 2. 使用驼峰命名法（camelCase）
- ✅ `aspectRatio`
- ❌ `aspect_ratio`

### 3. 参数名称和值格式
- ✅ 参数名：`imageSize`（不是 `resolution`）
- ✅ 值格式：`"1K"`, `"2K"`, `"4K"` (大写字符串)
- ❌ `"1k"`, `"2k"`, `"4k"` (小写)
- ❌ `"1024"`, `"2048"`, `"4096"` (数字字符串)

### 4. 支持的纵横比

官方支持的 aspectRatio 值：
- `"1:1"` - 正方形
- `"2:3"`, `"3:2"` - 标准照片比例
- `"3:4"`, `"4:3"` - 传统照片
- `"4:5"`, `"5:4"` - 社交媒体
- `"9:16"`, `"16:9"` - 视频比例
- `"21:9"` - 超宽屏

### 5. 模型差异

#### Gemini 3 Pro Image Preview
```javascript
{
  imageConfig: {
    aspectRatio: "16:9",
    imageSize: "2K"  // 支持 1K, 2K, 4K
  }
}
```

#### Gemini 2.5 Flash Image
```javascript
{
  imageConfig: {
    aspectRatio: "16:9"
    // 不支持 imageSize 参数，固定 1024px
  }
}
```

## 📊 分辨率对照表

### Gemini 3 Pro Image Preview

| aspectRatio | 1K 分辨率 | 2K 分辨率 | 4K 分辨率 |
|-------------|----------|----------|----------|
| 1:1         | 1024×1024 | 2048×2048 | 4096×4096 |
| 16:9        | 1376×768  | 2752×1536 | 5504×3072 |
| 9:16        | 768×1376  | 1536×2752 | 3072×5504 |
| 4:3         | 1200×896  | 2400×1792 | 4800×3584 |
| 3:4         | 896×1200  | 1792×2400 | 3584×4800 |

### Gemini 2.5 Flash Image

| aspectRatio | 固定分辨率 |
|-------------|-----------|
| 1:1         | 1024×1024 |
| 16:9        | 1344×768  |
| 9:16        | 768×1344  |
| 4:3         | 1184×864  |
| 3:4         | 864×1184  |

## 🔗 参考资源

- [Gemini Image Generation 官方文档](https://ai.google.dev/gemini-api/docs/image-generation)
- [Google AI Studio](https://makersuite.google.com/)
- [API 参考文档](https://ai.google.dev/api/rest)

## 📝 更新的文件

1. **src/App.jsx** - 修正 API 调用参数格式
2. **README.md** - 更新参数说明和示例
3. **API_GUIDE.md** - 完整重写，符合官方规范
4. **CHANGELOG.md** - 记录修复内容

---

**最后更新**: 2024-11-25  
**版本**: v1.0.2

