# 클리어철거 홈페이지 — Node.js 서버 배포용 이미지 (선택)
#
# 접수 데이터는 컨테이너가 아닌 외부 PostgreSQL 에 저장되므로
# 이 컨테이너에는 영구 볼륨이 필요하지 않다.
# 실행 시 DATABASE_URL 등 환경변수를 반드시 주입해야 한다.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

USER nextjs
EXPOSE 3000
CMD ["npm", "run", "start"]
