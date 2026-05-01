FROM node:20-alpine AS build

WORKDIR /app

RUN corepack enable

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/oa-web/package.json apps/oa-web/package.json

# OA 子应用镜像只安装自身工作区依赖，主应用通过 qiankun 从独立静态服务加载它。
RUN pnpm install --frozen-lockfile --filter oa-web...

COPY apps/oa-web apps/oa-web

RUN pnpm --filter oa-web build

FROM nginx:1.27-alpine

COPY apps/oa-web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/oa-web/dist /usr/share/nginx/html

EXPOSE 80
