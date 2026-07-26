FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install build dependencies for better-sqlite3
RUN apk add --no-python3 make g++ gcc

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy source files
COPY . .

# Expose HTTP port for health checks
EXPOSE 8080

# Run bot
CMD ["node", "src/index.js"]
