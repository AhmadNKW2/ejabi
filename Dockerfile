FROM node:20-bookworm-slim AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.14.0 --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

RUN pnpm install --frozen-lockfile --filter @ejabi/api...
RUN pnpm --filter @ejabi/api build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@11.14.0 --activate

COPY --from=build /app /app

EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]
