# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json nx.json tsconfig.base.json ./
COPY libs/ ./libs/
COPY apps/web-portal/ ./apps/web-portal/
RUN corepack enable && pnpm install --frozen-lockfile --ignore-scripts
RUN npx nx build web-portal --configuration=production

# Stage 2: Production
FROM gcr.io/distroless/nodejs22-debian12
WORKDIR /app
COPY --from=builder /app/apps/web-portal/.next/standalone ./
COPY --from=builder /app/apps/web-portal/.next/static ./.next/static
COPY --from=builder /app/apps/web-portal/public ./public
ENV NODE_ENV=production
EXPOSE 3000
CMD ["server.js"]
