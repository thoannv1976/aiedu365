# syntax=docker/dockerfile:1

# --- Giai đoạn cài đặt phụ thuộc -------------------------------------------
FROM node:22-slim AS deps
WORKDIR /app
COPY web/package.json web/package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts || npm install --omit=dev --ignore-scripts

# --- Giai đoạn build -------------------------------------------------------
FROM node:22-slim AS builder
WORKDIR /app
COPY web/package.json web/package-lock.json* ./
RUN npm ci || npm install
COPY web/ ./
# URL nội bộ được nhúng vào rewrite lúc build, nên phải truyền ở bước này.
ARG API_INTERNAL_URL=http://127.0.0.1:8080
ARG NEXT_PUBLIC_SITE_URL
ENV API_INTERNAL_URL=$API_INTERNAL_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- Giai đoạn chạy --------------------------------------------------------
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8080

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Hai dòng dưới là bắt buộc với output standalone: thiếu chúng thì trang lên
# nhưng không có CSS và JavaScript.
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 8080
CMD ["node", "server.js"]
