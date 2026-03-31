# Stage 1: Build Stage
FROM node:20-alpine AS build
# Create a directory for the application
WORKDIR /app
# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci
COPY . .


# Stage 2: Runtime Stage
FROM node:20-alpine
WORKDIR /app
# Install curl for health checks
RUN apk add --no-cache curl
# Copy built application from build stage
COPY --from=build /app /app

EXPOSE 5007
RUN npm install ts-node
CMD ["npx", "ts-node", "src/index.ts"]
