# syntax=docker/dockerfile:1
# Production image for the React/Vite web app served by nginx. Build context MUST be the
# repository root (npm workspaces share one package-lock.json):
#   docker build -f apps/web/Dockerfile --build-arg VITE_API_URL=http://localhost:3000 -t helpdesk-web .

# ---- build: Vite bundle ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci -w apps/web
COPY apps/web apps/web
# VITE_* values are baked into the bundle at build time.
ARG VITE_API_URL=http://localhost:3000
ARG VITE_ANALYTICS_ENABLED=true
ENV VITE_API_URL=$VITE_API_URL \
    VITE_ANALYTICS_ENABLED=$VITE_ANALYTICS_ENABLED
RUN npm run build -w apps/web

# ---- runtime: unprivileged nginx (uid 101, port 8080) ----
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime
ARG VITE_API_URL=http://localhost:3000
# Default for the CSP connect-src/report-uri; override at run time together with the build arg.
ENV VITE_API_URL=$VITE_API_URL \
    CSP_ENABLED=false \
    CSP_REPORT_ONLY=false
COPY apps/web/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --chmod=755 apps/web/docker/15-csp.sh /docker-entrypoint.d/15-csp.sh
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 8080
