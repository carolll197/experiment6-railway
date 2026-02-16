# 广告创意生成心理学研究实验平台

预实验 + 研究一 在线实验平台，含被试版、专家版（仅预实验）、主试版，前后端分离，统一数据存储。

## 入口链接

### 开发环境（localhost:5173）

| 版本       | 链接 |
|------------|------|
| 首页导航   | http://localhost:5173/ |
| 预实验-被试版 | http://localhost:5173/pre-subject |
| 预实验-专家版 | http://localhost:5173/pre-expert |
| 预实验-主试版 | http://localhost:5173/pre-admin |
| 研究一-被试版 | http://localhost:5173/study1-subject |
| 研究一-主试版 | http://localhost:5173/study1-admin |

### 生产环境

前端 `npm run build` 后，后端自动托管 `frontend/dist`，所有链接路径不变（端口改为3000或自定义 PORT）。

## 本地运行

### 1. 后端

```bash
cd backend
npm install
npm run dev
```
（首次运行会自动创建 `data/experiment.db` 并建表）

API 默认运行在 http://localhost:3000 ，前端已配置代理 `/api` → 该地址。

### 2. 前端

```bash
cd frontend
npm install
npm run dev
```

前端默认 http://localhost:5173 ，访问上表链接即可。

### 生产部署

```bash
cd frontend && npm run build
cd ../backend && npm start
```

后端监听 `0.0.0.0:3000`，自动托管 `frontend/dist`，支持 SPA history 模式。

## 技术栈

- **前端**：Vue 3、Vue Router、Vite、TailwindCSS；全局样式遵循 `materials/总要求.txt` 色彩与排版规范。
- **后端**：Node.js、Express、sql.js（纯JS SQLite）、xlsx；SQLite 存于 `backend/data/experiment.db`。

## 开发文档

- `materials/预实验.txt`：预实验被试/专家/主试页面与逻辑
- `materials/总要求.txt`：全局色彩、排版、组件、布局、逻辑规范
- `materials/研究一.txt`：研究一被试/主试页面与逻辑
- `WORK_PLAN.md`：需求摘要、任务拆分、数据表概要

## 当前进度

- [x] 任务 1：工作计划
- [x] 任务 2：项目初始化（前后端骨架、数据库、全局样式、基础组件、5 个入口）
- [x] 任务 3：预实验-被试版 5 页
- [x] 任务 4：预实验-专家版 4 页
- [x] 任务 5：预实验-主试版
- [x] 任务 6：研究一-被试版 9 页
- [x] 任务 7：研究一-主试版
- [x] 任务 8：路由与入口链接、多端适配
- [x] 全面审查与修复
