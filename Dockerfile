# Use Node.js 20.16.0 for PDF.js compatibility
FROM node:20.16.0-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port (Railway uses dynamic PORT)
EXPOSE $PORT

# Set environment variables for production
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=$PORT

# Start the application
CMD ["node", "./dist/server/entry.mjs"] 