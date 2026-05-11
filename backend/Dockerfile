# Stage 1: Builder
FROM node:20-alpine AS builder

# Install dependencies
WORKDIR /app
RUN apk add --no-cache ffmpeg

# Copy package files and install production dependencies
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --only=production

# Copy Prisma schema and generate client
COPY backend/prisma ./prisma/
RUN npx prisma generate

# Stage 2: Runner
FROM node:20-alpine

WORKDIR /app

# Install ffmpeg
RUN apk add --no-cache ffmpeg

# Copy artifacts from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Copy application source code
COPY backend/src ./src

# Expose port and define command
EXPOSE 3000
CMD ["node", "src/index.js"]
