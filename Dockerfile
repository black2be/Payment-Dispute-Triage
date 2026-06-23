# --- Build client ---
FROM node:20-alpine AS client-build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Build server ---
FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ .
RUN npx prisma generate
RUN npx tsc

# --- Production ---
FROM node:20-alpine
WORKDIR /app

# Copy server
COPY --from=server-build /app/server/dist ./dist
COPY --from=server-build /app/server/node_modules ./node_modules
COPY --from=server-build /app/server/prisma ./prisma
COPY --from=server-build /app/server/package.json ./package.json

# Copy client build into public/
COPY --from=client-build /app/dist ./public

# Generate Prisma client in production image
RUN npx prisma generate

ENV DATABASE_URL="file:./prisma/dev.db"
ENV PORT=3001
ENV NODE_ENV=production

EXPOSE 3001

# Seed DB and start server
CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]
