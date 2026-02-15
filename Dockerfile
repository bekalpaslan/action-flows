# Stage: base
# Contains all dependencies and shared setup
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.29.3 --activate
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json packages/shared/
COPY packages/backend/package.json packages/backend/
COPY packages/app/package.json packages/app/
RUN pnpm install --frozen-lockfile

# Stage: backend-dev
# Runs the backend API server with hot-reload
FROM base AS backend-dev
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY packages/backend ./packages/backend
RUN cd packages/shared && pnpm build
EXPOSE 3001
CMD ["pnpm", "-F", "@afw/backend", "dev"]

# Stage: frontend-dev
# Runs the Vite development server with hot-reload
FROM base AS frontend-dev
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY packages/app ./packages/app
RUN cd packages/shared && pnpm build
EXPOSE 5173
CMD ["pnpm", "-F", "@afw/app", "dev", "--", "--host", "0.0.0.0"]
