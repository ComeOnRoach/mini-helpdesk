# syntax=docker/dockerfile:1
# Production image for the NestJS API. Build context MUST be the repository root
# (npm workspaces share one package-lock.json):
#   docker build -f apps/api/Dockerfile -t helpdesk-api .

# ---- build: full dependencies, compile TypeScript ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci -w apps/api
COPY apps/api apps/api
RUN npm run build -w apps/api

# ---- deps: production dependencies only ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
# bcrypt ships prebuilt musl binaries, so no compiler is needed on alpine.
RUN npm ci --omit=dev -w apps/api \
    # Trim what is never loaded at run time: the compiler (an optional peer dependency that npm
    # still installs), source maps, type declarations and markdown docs.
    && rm -rf node_modules/typescript apps/api/node_modules/typescript \
    && find node_modules apps/api/node_modules \( -name '*.map' -o -name '*.d.ts' -o -name '*.md' \) -type f -delete

# ---- runtime: bare alpine + the node binary (no npm/yarn/corepack, keeps the image small) ----
FROM alpine:3.23 AS runtime
# Same libc (musl) as node:20-alpine, so the node binary and the bcrypt prebuild work unchanged.
RUN apk add --no-cache libstdc++ \
    && addgroup -g 1000 node && adduser -u 1000 -G node -s /bin/sh -D node
COPY --from=deps /usr/local/bin/node /usr/local/bin/node
ENV NODE_ENV=production \
    PORT=3000 \
    UPLOAD_DIR=/app/uploads
WORKDIR /app
COPY --from=deps /app/node_modules node_modules
# npm may nest workspace-specific versions (e.g. @nestjs/terminus) next to the hoisted ones.
COPY --from=deps /app/apps/api/node_modules apps/api/node_modules
COPY --from=build /app/apps/api/package.json apps/api/package.json
COPY --from=build /app/apps/api/dist apps/api/dist
RUN mkdir -p /app/uploads && chown node:node /app/uploads
USER node
EXPOSE 3000
WORKDIR /app/apps/api
CMD ["node", "dist/main"]
