# ============================================
# Stage 1: Build Stage
# ============================================
FROM node:20-alpine AS build
 
WORKDIR /app
 
# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci
 
# Copy source code
COPY . .
 
# Compile TypeScript
RUN npm run build

 

# ============================================
# Stage 2: Runtime Stage
# ============================================
FROM node:20-alpine
 
WORKDIR /app
 
# Install curl for health checks
RUN apk add --no-cache curl
 
# Copy package files
COPY package*.json ./
 
# Install only production dependencies
RUN npm ci --omit=dev
 
# Copy compiled application from build stage
COPY --from=build /app/dist ./dist
 
# Expose the chat-assistance-module port
EXPOSE 5014
 
# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:5014/health || exit 1
 
# Start the application
CMD ["node", "dist/index.js"]