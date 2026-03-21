# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json nx.json tsconfig.base.json ./
COPY libs/ ./libs/
COPY apps/cultivation-service/ ./apps/cultivation-service/
RUN corepack enable && pnpm install --frozen-lockfile --ignore-scripts
RUN npx nx build cultivation-service --configuration=production

# Stage 2: Production
FROM gcr.io/distroless/nodejs22-debian12
WORKDIR /app
COPY --from=builder /app/dist/apps/cultivation-service .
COPY --from=builder /app/node_modules ./node_modules
ENV NODE_ENV=production
EXPOSE 3000
CMD ["main.js"]
