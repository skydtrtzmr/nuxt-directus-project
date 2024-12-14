# 配置完成后，运行以下命令进行构建镜像：
# docker build -t my-directus-client ./

# 其实有两种方式构建镜像：
# 1. 直接在Dockerfile中指定依赖，然后使用RUN命令安装依赖，最后使用COPY命令复制代码，最后使用CMD命令启动服务。
# 2. 先使用RUN命令安装依赖，然后使用COPY命令复制代码，最后使用CMD命令启动服务。

FROM node:18-alpine AS builder
ENV NODE_ENV=production
ENV HOST 0.0.0.0

# 指定App根目录（作为之后的变量使用）
ENV APP_ROOT ./nuxt-app

RUN mkdir -p ${APP_ROOT}
# COPY . ${APP_ROOT}
WORKDIR ${APP_ROOT}
EXPOSE 3000
#If the environment in China build please open the following comments
#如果在中国环境下构建请把下面注释打开
# RUN npm config set registry https://registry.npmmirror.com

# 安装 pnpm
RUN npm install -g pnpm
RUN pnpm config set registry https://registry.npmmirror.com

# 先把package.json和pnpm-lock.yaml复制到镜像中，用来安装依赖
COPY package.json pnpm-lock.yaml ./

RUN pnpm install

# 安装完之后再把其他文件复制过去，可以加快构建速度
COPY . ./
# 注意此时docker中的路径已经在Workdir中，所以不需要指定路径
RUN pnpm run build

# 执行测试脚本：
# RUN pnpm run build:test

CMD ["pnpm", "preview"]
