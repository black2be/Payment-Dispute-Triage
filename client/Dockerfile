# Client image — build the Vite app, serve it with nginx.
# Build context is the repo ROOT (monorepo workspaces), so paths are client/… server/…

# 1. Build the static assets
FROM node:22-slim AS build
WORKDIR /app
# Install workspace deps from the lockfile (root + both workspace manifests)
COPY package.json package-lock.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
RUN npm ci
# Copy sources and build only the client workspace
COPY . .
RUN npm run build --workspace=client

# 2. Serve with nginx
FROM nginx:alpine
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1
