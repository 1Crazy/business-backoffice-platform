FROM node:24-alpine AS build

WORKDIR /app

RUN corepack enable

ARG VITE_API_BASE_URL=/api
ARG VITE_OA_ENTRY=http://localhost:8081
ARG VITE_SCRM_ENTRY=http://localhost:8082
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_OA_ENTRY=${VITE_OA_ENTRY}
ENV VITE_SCRM_ENTRY=${VITE_SCRM_ENTRY}

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/main-web/package.json apps/main-web/package.json
COPY apps/oa-web/package.json apps/oa-web/package.json
COPY apps/scrm-web/package.json apps/scrm-web/package.json

# main-web 的微前端契约测试会跨工作区读取子应用路由元数据，因此构建上下文保留三端源码。
RUN pnpm install --frozen-lockfile --filter main-web...

COPY apps/main-web apps/main-web
COPY apps/oa-web apps/oa-web
COPY apps/scrm-web apps/scrm-web

RUN pnpm --filter main-web build

FROM nginx:1.27-alpine

COPY apps/main-web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/main-web/dist /usr/share/nginx/html

EXPOSE 80
