# Railway 部署说明

## 已为部署准备的改动

- **根目录 `package.json`**：供 Railway 识别为 Node 项目，并执行：
  - `postinstall`：安装 frontend 与 backend 依赖
  - `build`：构建前端（输出到 `frontend/dist`）
  - `start`：启动后端（托管前端静态文件 + API）
- **`.gitignore`**：忽略 `node_modules/`、`frontend/dist/` 等，避免误提交并减小仓库体积。
- **`.nvmrc`**：指定 Node 18，便于 Nixpacks/Railway 使用一致环境。

## 部署步骤

1. 在 GitHub 上确保仓库 **experiment6-railway** 已包含上述文件并 push 最新代码。
2. 在 Railway 中关联该仓库，**Root Directory** 留空（使用仓库根目录）。
3. 部署时 Railway 会：
   - 在根目录执行 `npm install`（触发 postinstall，安装前后端依赖）
   - 执行 `npm run build`（构建前端）
   - 执行 `npm start`（启动后端）
4. 在 Railway 服务设置里为该服务生成 **Public Domain**，即可用 `https://你的域名` 访问。

## 数据持久化（重要）

当前使用 SQLite，数据文件在 `backend/data/experiment.db`。Railway 默认实例为**无状态**，重启后磁盘会清空，数据会丢失。

若需要保留被试/专家提交的数据，请在 Railway 中：

1. 打开该服务 → **Variables** 或 **Settings**。
2. 添加 **Volume**（卷）：挂载路径填 `backend/data`（或 Railway 要求的等效路径，如 `/data` 并相应改代码中的 `dbPath`，以官方文档为准）。
3. 这样 `experiment.db` 会写入卷中，重启后数据保留。

具体 Volume 的创建与挂载路径以 Railway 当前界面与文档为准。

## 公网链接打不开 / “The train has not arrived at the station”

这个提示表示请求没有到达你的应用，常见原因和做法：

1. **确认公网域名已生成并绑在本服务**
   - 在 Railway 里打开该服务 → **Settings** → **Networking**（或 **Public Networking**）
   - 点击 **Generate Domain**（若还没有），记下形如 `xxx.up.railway.app` 的地址
   - 确认该域名绑定的是**当前服务**，且是**最新一次部署**

2. **确认应用已成功启动并监听端口**
   - 打开 **Deployments** → 选最新部署 → **View Logs**
   - 应能看到类似：`[start] PORT=xxxx`、`Listening on 0.0.0.0:xxxx`
   - 若没有这两行，而是报错或进程退出，说明在 `listen` 之前就崩了（例如数据库初始化失败），请把**完整报错**发给我

3. **端口与监听**
   - 后端已使用 `process.env.PORT` 并监听 `0.0.0.0`，无需在 Railway 里再配端口
   - 若你在 Railway 里手动改过 **PORT** 或 **Public Port**，可先恢复默认（删掉自定义 PORT），让平台自动注入

4. **先用健康检查验证**
   - 浏览器访问：`https://你的域名/api/health`
   - 若返回 `{"ok":true}` 说明应用已起来，再访问 `https://你的域名/` 看首页；若 `/api/health` 也打不开，多半是应用没启动成功，看上面第 2 步的日志

## 若部署仍失败

请把 Railway 构建/运行日志中的**报错片段**（尤其是最后几行）发给我，便于进一步排查。常见情况包括：

- 根目录没有 `package.json`（已通过添加根目录 `package.json` 解决）
- Node 版本过旧（已通过 `engines` 与 `.nvmrc` 指定 18）
- 某一步 `npm install` 或 `npm run build` 失败（需看具体报错）
- 应用启动时崩溃（看运行日志里的 `Start failed:` 或 sql.js / 数据库相关报错）
