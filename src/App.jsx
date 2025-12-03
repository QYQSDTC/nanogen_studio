import React, { useState, useEffect } from "react";
import {
  Settings,
  Image,
  Loader2,
  Upload,
  X,
  Sparkles,
  Menu,
} from "lucide-react";

function App() {
  // State for mobile sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // State for API settings
  const [apiKey, setApiKey] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [model, setModel] = useState("gemini-3-pro-image-preview");

  // State for generation parameters
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [resolution, setResolution] = useState("1K");
  const [prompt, setPrompt] = useState("");
  const [referenceImages, setReferenceImages] = useState([]);
  const [referenceImagePreviews, setReferenceImagePreviews] = useState([]);
  const [enableSearch, setEnableSearch] = useState(false);

  // State for generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [error, setError] = useState(null);

  // Effect to handle model change and limit reference images
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

  // Get max images allowed based on model
  const getMaxImages = () => {
    return model === "gemini-3-pro-image-preview" ? 14 : 1;
  };

  // Handle reference image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxImages = getMaxImages();
    const availableSlots = maxImages - referenceImages.length;

    if (availableSlots <= 0) {
      setError(`最多只能上传 ${maxImages} 张参考图片`);
      return;
    }

    const filesToAdd = files.slice(0, availableSlots);

    filesToAdd.forEach((file) => {
      if (file) {
        setReferenceImages((prev) => [...prev, file]);
        const reader = new FileReader();
        reader.onloadend = () => {
          setReferenceImagePreviews((prev) => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      }
    });

    // Clear the file input
    e.target.value = null;
  };

  // Remove reference image
  const removeReferenceImage = (index) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
    setReferenceImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove the data:image/xxx;base64, prefix
        const base64 = reader.result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Generate image
  const handleGenerate = async () => {
    if (!apiKey) {
      setError("请输入 API Key");
      return;
    }
    if (!prompt) {
      setError("请输入提示词");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Map resolution to imageSize parameter (1K, 2K, 4K)
      const resolutionMap = {
        "1K": "1K",
        "2K": "2K",
        "4K": "4K",
      };

      // Prepare imageConfig based on official API docs
      const imageConfig = {
        aspectRatio: aspectRatio, // Use camelCase as per official docs
      };

      // Only add imageSize for Pro model (Flash uses fixed 1024px)
      if (model === "gemini-3-pro-image-preview") {
        imageConfig.imageSize = resolutionMap[resolution];
      }

      // Prepare the request body according to official API docs
      const requestBody = {
        contents: [
          {
            parts: [],
          },
        ],
        generationConfig: {
          responseModalities: ["image"],
          imageConfig: imageConfig,
        },
      };

      // Add Google Search grounding if enabled (only for Pro model)
      if (enableSearch && model === "gemini-3-pro-image-preview") {
        requestBody.tools = [
          {
            googleSearch: {},
          },
        ];
      }

      // Add text prompt
      requestBody.contents[0].parts.push({
        text: prompt,
      });

      // Add reference image if available
      if (referenceImages.length > 0) {
        for (const image of referenceImages) {
          const base64Image = await fileToBase64(image);
          requestBody.contents[0].parts.push({
            inlineData: {
              mimeType: image.type,
              data: base64Image,
            },
          });
        }
      }

      // Build API URL
      let apiUrl;
      if (!endpoint || endpoint.trim() === "") {
        // Use default Google API endpoint
        apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      } else {
        // Use custom endpoint base URL and append model path
        // Remove trailing slash if present
        const baseUrl = endpoint.trim().replace(/\/+$/, "");
        apiUrl = `${baseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`;
      }

      // Make API call
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "生成失败");
      }

      const data = await response.json();

      // Extract image from response
      if (data.candidates && data.candidates[0]?.content?.parts) {
        const imageParts = data.candidates[0].content.parts.filter(
          (part) =>
            part.inlineData && part.inlineData.mimeType.startsWith("image/")
        );

        if (imageParts.length > 0) {
          const newImages = imageParts.map((part) => ({
            id: Date.now() + Math.random(),
            data: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
            prompt: prompt,
            timestamp: new Date().toLocaleString("zh-CN"),
          }));
          setGeneratedImages([...newImages, ...generatedImages]);
        } else {
          throw new Error("响应中没有找到图片数据");
        }
      } else {
        throw new Error("API 响应格式不正确");
      }
    } catch (err) {
      console.error("Generation error:", err);
      setError(err.message || "生成图片时出错");
    } finally {
      setIsGenerating(false);
    }
  };

  // Download image
  const downloadImage = (imageData, index) => {
    const link = document.createElement("a");
    link.href = imageData;
    link.download = `nanogen-${Date.now()}-${index}.jpg`;
    link.click();
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 relative">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-lg shadow-lg hover:bg-slate-50 transition-colors"
        aria-label="打开菜单"
      >
        <Menu className="w-6 h-6 text-slate-700" />
      </button>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        w-80 bg-white shadow-xl border-r border-slate-200 flex flex-col
        fixed lg:relative inset-y-0 left-0 z-50
        transform transition-transform duration-300 ease-in-out
        ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }
      `}
      >
        <div className="p-4 sm:p-6 border-b border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                  NanoGen
                </h1>
                <p className="text-xs text-slate-500">AI Image Studio</p>
              </div>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="关闭菜单"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* API Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <Settings className="w-4 h-4" />
              <h2 className="text-sm uppercase tracking-wide">API 设置</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                API Key *
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="输入你的 Gemini API Key"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Endpoint (可选)
              </label>
              <input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="例如: https://api.drqyq.com (留空使用 Google 官方 API)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">
                {endpoint
                  ? `自定义: ${endpoint
                      .trim()
                      .replace(
                        /\/+$/,
                        ""
                      )}/v1beta/models/${model}:generateContent`
                  : "默认使用 Google 官方 API"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                模型
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white"
              >
                <option value="gemini-3-pro-image-preview">
                  Gemini 3 Pro Image Preview (高质量，最多14张参考图)
                </option>
                <option value="gemini-2.5-flash-image">
                  Gemini 2.5 Flash Image (快速，最多1张参考图)
                </option>
              </select>
              <p className="text-xs text-slate-500 mt-1">
                {model === "gemini-2.5-flash-image"
                  ? "快速生成，固定 1024px 分辨率，支持 1 张参考图"
                  : "高质量生成，支持 1K/2K/4K 分辨率，支持最多 14 张参考图"}
              </p>
            </div>

            {/* Google Search Toggle - Only for Pro model */}
            {model === "gemini-3-pro-image-preview" && (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700">
                    启用 Google 搜索
                  </label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    实时检索最新信息辅助生成
                  </p>
                </div>
                <button
                  onClick={() => setEnableSearch(!enableSearch)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    enableSearch ? "bg-primary-500" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                      enableSearch ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            )}
          </div>

          {/* Generation Parameters */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <Image className="w-4 h-4" />
              <h2 className="text-sm uppercase tracking-wide">生成参数</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                纵横比
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white"
              >
                <option value="1:1">1:1 (正方形)</option>
                <option value="16:9">16:9 (横向)</option>
                <option value="9:16">9:16 (竖向)</option>
                <option value="4:3">4:3 (标准)</option>
                <option value="3:4">3:4 (竖版标准)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                分辨率
                {model === "gemini-2.5-flash-image" && (
                  <span className="ml-2 text-xs text-slate-500">
                    (Flash 模型固定 1024px)
                  </span>
                )}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["1K", "2K", "4K"].map((res) => (
                  <button
                    key={res}
                    onClick={() => setResolution(res)}
                    disabled={model === "gemini-2.5-flash-image"}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      resolution === res
                        ? "bg-primary-500 text-white shadow-md"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    } ${
                      model === "gemini-2.5-flash-image"
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full lg:w-auto">
        {/* Input Area */}
        <div className="bg-white border-b border-slate-200 p-4 sm:p-6 shadow-sm pt-16 lg:pt-6">
          <div className="max-w-4xl mx-auto space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                提示词
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="描述你想要生成的图片..."
                rows={4}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-sm"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              {/* Reference Image Upload */}
              <div className="flex-1 w-full">
                {referenceImagePreviews.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {referenceImagePreviews.map((preview, index) => (
                      <div key={index} className="relative inline-block">
                        <img
                          src={preview}
                          alt={`Reference ${index + 1}`}
                          className="h-20 w-20 object-cover rounded-lg border-2 border-slate-300"
                        />
                        <button
                          onClick={() => removeReferenceImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {referenceImages.length < getMaxImages() && (
                      <label className="h-20 w-20 flex items-center justify-center border-2 border-dashed border-slate-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors cursor-pointer">
                        <Upload className="w-5 h-5 text-slate-600" />
                        <input
                          type="file"
                          accept="image/*"
                          multiple={model === "gemini-3-pro-image-preview"}
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                ) : (
                  <label className="inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors cursor-pointer">
                    <Upload className="w-4 h-4 text-slate-600" />
                    <span className="text-sm text-slate-600">
                      上传参考图片 (最多 {getMaxImages()} 张)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple={model === "gemini-3-pro-image-preview"}
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Generate Button */}
              <button
                onClick={() => {
                  handleGenerate();
                  setIsSidebarOpen(false); // Close sidebar on mobile after generating
                }}
                disabled={isGenerating || !apiKey || !prompt}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-medium hover:from-primary-600 hover:to-primary-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    生成图片
                  </>
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Generated Images Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="max-w-6xl mx-auto">
            {generatedImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12 sm:py-20 px-4">
                <div className="p-4 sm:p-6 bg-white rounded-full shadow-lg mb-4 sm:mb-6">
                  <Image className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-700 mb-2">
                  还没有生成的图片
                </h3>
                <p className="text-sm sm:text-base text-slate-500 max-w-md">
                  输入提示词并点击"生成图片"按钮开始创作你的第一张 AI 图片
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {generatedImages.map((image, index) => (
                  <div
                    key={image.id}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow fade-in group"
                  >
                    <div className="relative aspect-square">
                      <img
                        src={image.data}
                        alt={image.prompt}
                        className="w-full h-full object-cover"
                      />
                      {/* Desktop hover overlay */}
                      <div className="hidden sm:flex absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all items-center justify-center">
                        <button
                          onClick={() => downloadImage(image.data, index)}
                          className="opacity-0 group-hover:opacity-100 px-4 py-2 bg-white text-slate-700 rounded-lg font-medium hover:bg-slate-100 transition-all transform scale-90 group-hover:scale-100"
                        >
                          下载图片
                        </button>
                      </div>
                    </div>
                    <div className="p-3 sm:p-4">
                      <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                        {image.prompt}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-slate-400">
                          {image.timestamp}
                        </p>
                        {/* Mobile download button */}
                        <button
                          onClick={() => downloadImage(image.data, index)}
                          className="sm:hidden text-xs px-3 py-1.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
                        >
                          下载
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
