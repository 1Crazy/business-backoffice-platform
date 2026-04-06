FROM node:20-bullseye-slim AS base

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json

# 先只安装 API 及其工作区依赖，避免前端依赖进入后端镜像。
RUN pnpm install --frozen-lockfile --filter platform-api...

COPY apps/api apps/api

RUN pnpm --filter platform-api prisma generate
RUN pnpm --filter platform-api build

COPY apps/api/docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
