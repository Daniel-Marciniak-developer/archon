# Frontend Dockerfile for Archon
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies for node-gyp and native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    linux-headers \
    eudev-dev

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5173 || exit 1

# Default command
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
