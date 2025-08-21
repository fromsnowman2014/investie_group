# Multi-stage build for backend in monorepo
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files from root (for workspaces)
COPY package.json package-lock.json ./
COPY turbo.json ./

# Copy backend package files
COPY apps/backend/package.json ./apps/backend/

# Install dependencies for the entire monorepo
RUN npm ci && npm cache clean --force

# Copy backend source code only
COPY apps/backend ./apps/backend

# Build only the backend
WORKDIR /app/apps/backend
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S investie -u 1001

# Copy backend package files
COPY apps/backend/package.json ./

# Install only production dependencies for backend
RUN npm install --only=production --ignore-scripts && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/apps/backend/dist ./dist

# Create data directory for news cache (will be populated at runtime)
RUN mkdir -p ./data/news

# Change ownership to non-root user
RUN chown -R investie:nodejs /app

# Switch to non-root user
USER investie

# Expose port
EXPOSE 3001

# Health check (using wget as curl may not be available)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start the application
CMD ["node", "dist/main"]