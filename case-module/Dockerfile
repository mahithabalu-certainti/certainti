# Stage 1: Install dependencies
FROM node:20-slim AS deps
 
WORKDIR /app
 
COPY package*.json ./
 
RUN npm ci
 
# Install Chrome for Puppeteer
RUN npx puppeteer browsers install chrome
 
 
# Stage 2: Runtime
FROM node:20-slim
 
WORKDIR /app
 
# Install system dependencies required by Chrome
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
 
# Copy node modules and code
COPY --from=deps /app /app
 
EXPOSE 5010
 
CMD ["npx", "ts-node", "src/index.ts"]