# Stage 1: Build Stage
FROM node:20-slim AS build
 
WORKDIR /app
 
# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci
 
# Install Puppeteer Chrome browser
RUN npx puppeteer browsers install chrome
 
# Copy application code
COPY . .
 
# Stage 2: Runtime Stage
FROM node:20-slim
 
WORKDIR /app
 
# Install curl + Chrome runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    fonts-liberation \
    libnss3 \
    libatk-bridge2.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libgtk-3-0 \
    libasound2 \
&& rm -rf /var/lib/apt/lists/*
 
# Copy built application from build stage
COPY --from=build /app /app
 
EXPOSE 5010
 
RUN npm install ts-node
 
CMD ["npx", "ts-node", "src/index.ts"]
