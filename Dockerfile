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

# Build the application with environment variables
ARG SUPABASE_URL
ARG SUPABASE_ANON_KEY
ARG EMAIL_PROVIDER
ARG EMAIL_API_KEY
ARG FROM_EMAIL
ARG FROM_NAME
ENV SUPABASE_URL=$SUPABASE_URL
ENV SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
ENV EMAIL_PROVIDER=$EMAIL_PROVIDER
ENV EMAIL_API_KEY=$EMAIL_API_KEY
ENV FROM_EMAIL=$FROM_EMAIL
ENV FROM_NAME=$FROM_NAME
RUN npm run build

# Expose port (Railway uses dynamic PORT)
EXPOSE $PORT

# Set environment variables for production
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=$PORT

# Start the application
CMD ["node", "./dist/server/entry.mjs"] 