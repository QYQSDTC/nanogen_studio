import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3008,
    host: "localhost", // 使用 localhost 避免网络接口检测问题
    strictPort: false,
  },
  preview: {
    port: 3008,
    host: "0.0.0.0", // 允许外部访问
    allowedHosts: [
      "banana.cpolar.cn",
      ".cpolar.cn", // 允许所有 cpolar.cn 子域名
    ],
  },
});
