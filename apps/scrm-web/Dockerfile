FROM node:24-alpine AS build

WORKDIR /app

RUN corepack enable

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/scrm-web/package.json apps/scrm-web/package.json

# SCRM Web 镜像只安装自身工作区需要的依赖，减少构建体积和缓存抖动。
RUN pnpm install --frozen-lockfile --filter scrm-web...

COPY apps/scrm-web apps/scrm-web

RUN pnpm --filter scrm-web build

FROM nginx:1.27-alpine

COPY apps/scrm-web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/scrm-web/dist /usr/share/nginx/html

EXPOSE 80
