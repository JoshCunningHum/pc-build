# syntax=docker/dockerfile:1

FROM oven/bun:1-alpine AS base
WORKDIR /app

# --- Dependencies (cached separately from source so code edits don't bust it) ---
FROM base AS deps
# python3/make/g++/node-gyp are needed to build native deps (e.g. better-sqlite3) on alpine
RUN apk add --no-cache python3 make g++ && bun add -g node-gyp
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# --- Build static site (ssr: false -> fully static output, no server needed) ---
FROM base AS build
ARG VITE_APP_NAME
ENV VITE_APP_NAME=${VITE_APP_NAME}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run generate

# --- Runtime: static files served by nginx, no JS runtime in the final image ---
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/.output/public /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
