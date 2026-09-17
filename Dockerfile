# 1. Build frontend
FROM node:20-alpine AS build-client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# 2. Production server runtime
FROM node:20-bullseye-slim
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=7860

# Install server dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install --omit=dev

# Copy built frontend assets
WORKDIR /app
COPY --from=build-client /app/client/dist ./client/dist

# Copy server code
COPY server ./server

EXPOSE 7860

CMD ["node", "server/src/server.js"]
