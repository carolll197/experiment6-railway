# 使用 Dockerfile 可让 Railway 利用层级缓存：仅当 package.json 变化时才重新安装依赖
FROM node:20-alpine

WORKDIR /app

# 先只复制依赖声明，便于缓存 node_modules 层（仅这些文件变化时才重新 npm install）
COPY package.json package-lock.json ./
COPY backend/package.json backend/package-lock.json backend/
COPY frontend/package.json frontend/
# 若存在 frontend/package.json 可在此增加一行以更好利用缓存：
# COPY frontend/package.json frontend/


# 安装依赖（root postinstall 会执行 frontend + backend 的 npm install）
RUN npm install

# 再复制全部源码
COPY . .

# 构建前端
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
