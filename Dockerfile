# 墨星 Web 生产镜像：多阶段构建，输出 Next.js standalone
FROM node:22-alpine AS base
RUN corepack enable && apk add --no-cache openssl
WORKDIR /app

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @moxing/web build

FROM base AS run
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/prisma ./apps/web/prisma
COPY --from=build /app/node_modules/.pnpm/node_modules/prisma /app/prisma-cli/node_modules/prisma
COPY --from=build /app/node_modules/.pnpm/node_modules/@prisma/engines /app/prisma-cli/node_modules/@prisma/engines
EXPOSE 3000
# 启动前自动执行数据库迁移
CMD ["sh", "-c", "node /app/prisma-cli/node_modules/prisma/build/index.js migrate deploy --schema apps/web/prisma/schema.prisma && node apps/web/server.js"]
