# 配置完成后，运行以下命令进行构建镜像：

# 打包客户端（client）：
# pnpm build
# docker build -t skydtrtzmr/my-directus-client ./

# 指定最新版本：
# docker tag skydtrtzmr/my-directus-client:1.1.0 skydtrtzmr/my-directus-client:latest
# （注意替换为自己的镜像版本）


# 其实有两种方式构建镜像：
# 1. 直接在Dockerfile中指定依赖，然后使用RUN命令安装依赖，最后使用COPY命令复制代码，最后使用CMD命令启动服务。
# 2. 先使用RUN命令安装依赖，然后使用COPY命令复制代码，最后使用CMD命令启动服务。

# 在这里，我们只把output文件夹复制到镜像中，然后使用CMD命令启动服务。

FROM node:18-alpine AS builder

ENV HOST 0.0.0.0

# 指定App根目录（作为之后的变量使用）
ENV APP_ROOT=./nuxt-app

RUN mkdir -p ${APP_ROOT}
# COPY . ${APP_ROOT}
WORKDIR ${APP_ROOT}
# EXPOSE 3000
# 在这里暴露端口是没有意义的，因为我们使用pm2来启动服务。

COPY .output .output
COPY package.json  package.json
COPY ecosystem.config.cjs  ecosystem.config.cjs
# 注意此时docker中的路径已经在Workdir中，所以不要指定路径

#如果在中国环境下构建请把下面注释打开
RUN npm config set registry https://registry.npmmirror.com

RUN npm install pm2 -g

# CMD ["node", ".\.output\server\index.mjs"]
# 注意！上面这样写是不对的。
# Docker 容器基于 Linux 或 Alpine Linux 等操作系统，在这些系统中路径分隔符应该使用 正斜杠（/）。

# CMD ["node", ".output/server/index.mjs"]

# 改成pm2启动服务
# 注意：在使用pm2启动服务时，需要在Dockerfile中指定环境变量 HOST，否则会报错。

CMD ["pm2-runtime", "start", "ecosystem.config.cjs"]

# 本次打包完client和client-test两个镜像后，就不再需要Dockerfile了，直接使用docker-compose来修改配置即可。
# TODO 后续改为一个镜像，通过环境变量来区分运行模式。