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

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "./dist/server/entry.mjs"] 