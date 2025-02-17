FROM node:20-alpine AS deps

WORKDIR /app
COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile --prod

FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
RUN pnpm run build

FROM node:20-alpine AS runner

LABEL maintainer="Helmyl <helmyl.work@gmail.com>"
LABEL description="Social Media Post Management API"
LABEL version="1.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

WORKDIR /app
RUN chown nestjs:nodejs /app

COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./

ENV NODE_ENV=production
ENV PORT=3000

USER nestjs

HEALTHCHECK --interval=30s --timeout=3s --start-period=30s \
    CMD curl -f http://localhost:${PORT}/health || exit 1

EXPOSE ${PORT}

ENV NODE_OPTIONS="--max-old-space-size=2048 --max-http-header-size=16384"

CMD ["node", "dist/main"]
